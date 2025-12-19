import { untrack } from "svelte";
import {
    type MapEntity,
    type MapObject,
    type CreatureRef,
    type InitiativeEntry,
    type QuickStats,
    type Character,
    saveActiveMapId,
    loadMaps,
    loadMapMode,
    saveMapMode as persistMapMode,
    getTileMapById,
} from "../data/storage-utils";
import {
    updateMap,
    updateMapObject,
    saveCombatState as persistCombatState,
    addMap as storageAddMap,
    deleteMap as storageDeleteMap,
} from "../data/map-persistence";
import { generateId } from "../oracle/scripts/oracleTypes";
import { characterStore } from "../data/character-store";
import { get } from "svelte/store";

export class MapState {
    // Current Map Data
    map = $state<MapEntity | null>(null);
    maps = $state<MapEntity[]>([]);

    // UI Mode State
    mapMode = $state<"edit" | "play">("edit");
    editMode = $state<"move" | "background" | "object">("move");
    objectMode = $state<"select" | "add">("select");

    // Paint/Add Props
    color = $state("#2980b9");
    currentShape = $state<"square" | "circle" | "triangle" | "star">("square");
    selectedTileRef = $state<{ tileMapId: string; tileId: string } | null>(null);
    isErasing = $state(false);

    // Selection State
    selectedObjectId = $state<string | null>(null);

    // Camera State
    camera = $state({ x: 0, y: 0, zoom: 1 });

    // Combat state (mirrors what's in map.combatState but reactive)
    initiativeOrder = $state<InitiativeEntry[]>([]);
    currentTurnIndex = $state(0);
    hasActiveEncounter = $state(false);
    pendingNextObjectId = $state<string | undefined>(undefined);

    // Dice roll preset for ability/skill checks
    mapDiceRollPreset = $state<{
        characterId: string;
        characterName: string;
        checkName: string;
        numDice: number;
        numSides: number;
        modifier: number;
        rollType: "normal" | "advantage" | "disadvantage";
    } | null>(null);

    // Combat Panel State (Play Mode)
    encounterSelectedCreature = $state<{
        objectId: string;
        creatureRef?: CreatureRef;
        quickStats?: QuickStats;
    } | null>(null);

    // Trigger for manual re-renders (used by canvas listeners)
    renderTrigger = $state(0);

    // Track whether initial load has been done
    private hasInitialized = false;

    // Derived Selection Object
    get selectedObject() {
        if (!this.map || !this.selectedObjectId) return null;
        return this.map.objects.find((o) => o.id === this.selectedObjectId) ?? null;
    }

    // Derived combat turn object ID
    get currentTurnObjectId() {
        if (
            this.mapMode === "play" &&
            this.map?.combatState?.hasActiveEncounter &&
            this.map.combatState.initiativeOrder.length > 0
        ) {
            return (
                this.map.combatState.initiativeOrder[this.map.combatState.currentTurnIndex]
                    ?.objectId ?? null
            );
        }
        return null;
    }

    // Actions

    init(campaignId: string) {
        this.maps = loadMaps().filter((m) => m.campaignId === campaignId);
    }

    loadMap(mapId: string) {
        const allMaps = loadMaps();
        const map = allMaps.find((m) => m.id === mapId);
        if (map) {
            this.map = map;
            this.mapMode = loadMapMode();
            if (map.view) {
                this.camera = { ...map.view, zoom: map.view.zoom || 1 };
            }
            saveActiveMapId(mapId);

            // missing tilemap cleanup (moved from MapEditor)
            const refByMapId = new Map<string, boolean>();
            if (map.backgroundTiles) {
                for (const key in map.backgroundTiles) {
                    const ref = map.backgroundTiles[key];
                    if (ref) refByMapId.set(ref.tileMapId, true);
                }
            }
            for (const o of map.objects) {
                if (o.kind === "tile" && o.tile) refByMapId.set(o.tile.tileMapId, true);
            }

            const missingTileMaps: string[] = [];
            for (const id of refByMapId.keys()) {
                if (!getTileMapById(id)) missingTileMaps.push(id);
            }

            if (missingTileMaps.length) {
                console.warn(
                    "MapState: A tilemap used by this map is missing. Removing stale refs."
                );
                if (map.backgroundTiles) {
                    for (const key in map.backgroundTiles) {
                        const ref = map.backgroundTiles[key];
                        if (ref && missingTileMaps.includes(ref.tileMapId))
                            delete map.backgroundTiles[key];
                    }
                }
                map.objects = map.objects.filter(
                    (o) =>
                        !(o.kind === "tile" && o.tile && missingTileMaps.includes(o.tile.tileMapId))
                );
            }

            // Sync combat state from map entity
            if (map.combatState) {
                this.initiativeOrder = [...map.combatState.initiativeOrder];
                this.currentTurnIndex = map.combatState.currentTurnIndex;
                this.hasActiveEncounter = map.combatState.hasActiveEncounter ?? false;
                this.pendingNextObjectId = map.combatState.pendingNextObjectId;
            } else {
                this.initiativeOrder = [];
                this.currentTurnIndex = 0;
                this.hasActiveEncounter = false;
                this.pendingNextObjectId = undefined;
            }

            // If in play mode with active encounter, focus the current turn creature if it exists
            if (
                this.mapMode === "play" &&
                this.hasActiveEncounter &&
                this.initiativeOrder.length > 0
            ) {
                const currentEntry = this.initiativeOrder[this.currentTurnIndex];
                if (currentEntry) {
                    this.selectEncounterCreature(currentEntry.objectId);
                }
            }
        }
    }

    /**
     * Persists the current reactive map state to storage.
     * This ensures all objects and view state are serialized.
     */
    saveActiveMap() {
        if (!this.map) return;

        // Use a mutator that copies everything from our reactive proxy to the storage object.
        // updateMap will load the latest from disk and we'll overwrite its core properties.
        updateMap(this.map.id, (m) => {
            m.view = { ...this.camera };
            m.objects = this.map!.objects.map((o) => ({ ...o })); // Clone to strip proxy if needed
            m.background = { ...this.map!.background };
            if (this.map!.backgroundTiles) {
                m.backgroundTiles = { ...this.map!.backgroundTiles };
            }
            if (this.map!.backgroundTileTints) {
                m.backgroundTileTints = { ...this.map!.backgroundTileTints };
            }
            m.updatedAt = Date.now();
        });
    }

    selectEncounterCreature(objectId: string) {
        if (!this.map) return;
        const obj = this.map.objects.find((o) => o.id === objectId);
        if (obj) {
            this.encounterSelectedCreature = {
                objectId,
                creatureRef: obj.creatureRef,
                quickStats: obj.quickStats,
            };
        }
    }

    closeMap() {
        this.map = null;
        this.selectedObjectId = null;
        this.encounterSelectedCreature = null;
        this.initiativeOrder = [];
        this.currentTurnIndex = 0;
        this.hasActiveEncounter = false;
        saveActiveMapId(null);
    }

    setMapMode(mode: "edit" | "play") {
        this.mapMode = mode;
        persistMapMode(mode);

        // Clear selection when switching modes to avoid UI ghosting
        this.selectedObjectId = null;
        if (mode === "edit") {
            this.encounterSelectedCreature = null;
        }
    }

    setEditMode(mode: "move" | "background" | "object") {
        if (this.editMode === "object" && mode !== "object") {
            this.selectedObjectId = null;
        }
        this.editMode = mode;
        if (mode === "background") this.isErasing = false;
    }

    // Object Management

    selectObject(id: string | null) {
        this.selectedObjectId = id;
        const obj = this.selectedObject;
        if (obj) {
            // Sync paint props so the next added object matches the selection
            this.color = obj.color;
            this.currentShape = obj.type;
            this.selectedTileRef = obj.tile ? { ...obj.tile } : null;
        }
    }

    updateObject(objectId: string, updates: Partial<MapObject>) {
        if (!this.map) return;

        // Update local state reactively
        const obj = this.map.objects.find((o) => o.id === objectId);
        if (obj) {
            Object.assign(obj, updates);

            // Clean up deleted keys (e.g. if quickStats replaced by creatureRef)
            for (const key in updates) {
                if (updates[key as keyof MapObject] === undefined) {
                    delete obj[key as keyof MapObject];
                }
            }

            // Persist
            updateMapObject(this.map.id, objectId, (o) => {
                Object.assign(o, updates);
                for (const key in updates) {
                    if (updates[key as keyof MapObject] === undefined) {
                        delete o[key as keyof MapObject];
                    }
                }
            });

            // Update encounter selection if this object is the selected one
            const esc = this.encounterSelectedCreature;
            if (esc?.objectId === objectId) {
                if (updates.creatureRef !== undefined) esc.creatureRef = updates.creatureRef;
                if (updates.quickStats !== undefined) esc.quickStats = updates.quickStats;
            }

            this.renderTrigger++;
        }
    }

    deleteObject(objectId: string) {
        if (!this.map) return;
        this.map.objects = this.map.objects.filter((o) => o.id !== objectId);
        if (this.selectedObjectId === objectId) this.selectedObjectId = null;
        if (this.encounterSelectedCreature?.objectId === objectId)
            this.encounterSelectedCreature = null;

        updateMap(this.map.id, (m) => {
            m.objects = m.objects.filter((o) => o.id !== objectId);
        });

        this.renderTrigger++;
    }

    /**
     * Common helper to update map data both locally (reactively) and in storage.
     */
    updateMapData(updater: (m: MapEntity) => void) {
        if (!this.map) return;

        // Apply to local proxy for immediate UI reactivity
        updater(this.map);

        // Persist to storage
        updateMap(this.map.id, updater);

        this.renderTrigger++;
    }

    // Combat State Management

    saveCombatState() {
        if (!this.map) return;

        const combatStateToSave = {
            initiativeOrder: this.initiativeOrder.map((e) => ({ ...e })),
            currentTurnIndex: this.currentTurnIndex,
            hasActiveEncounter: this.hasActiveEncounter,
            pendingNextObjectId: this.pendingNextObjectId,
        };

        this.map.combatState = combatStateToSave;
        persistCombatState(this.map.id, combatStateToSave);
    }

    syncMapWithCharacters(characters: Character[]) {
        if (!this.map) return;
        const currentMapId = this.map.id;

        updateMap(currentMapId, (map) => {
            let mapChanged = false;
            map.objects.forEach((obj) => {
                if (obj.creatureRef && obj.creatureRef.type === "character") {
                    const character = characters.find((c) => c.id === obj.creatureRef!.id);
                    if (character) {
                        const charHp =
                            character.currentHitPoints ?? character.hitPointMaximum ?? 10;
                        if (obj.creatureRef.currentHitPoints !== charHp) {
                            obj.creatureRef.currentHitPoints = charHp;
                            mapChanged = true;

                            // Update initiative order if present
                            const initIndex = this.initiativeOrder.findIndex(
                                (e) => e.objectId === obj.id
                            );
                            if (initIndex >= 0) {
                                this.initiativeOrder[initIndex] = {
                                    ...this.initiativeOrder[initIndex],
                                    currentHP: charHp,
                                    maxHP: character.hitPointMaximum ?? 10,
                                };
                            }
                        }
                    }
                }
            });

            if (mapChanged) {
                if (map.combatState) {
                    map.combatState.initiativeOrder = this.initiativeOrder.map((e) => ({ ...e }));
                }
                // The local 'this.map' will be updated by the mutator if it's the same object,
                // but store's 'map' might need to be reassigned to trigger reactivity if needed.
                // In Svelte 5, mutating the object in place is fine if it's a proxy.
            }
        });
    }

    setInitiative(order: InitiativeEntry[], turnIndex: number = 0) {
        this.initiativeOrder = order;
        this.currentTurnIndex = turnIndex;
        this.hasActiveEncounter = true;
        this.saveCombatState();
    }

    endEncounter() {
        this.initiativeOrder = [];
        this.currentTurnIndex = 0;
        this.hasActiveEncounter = false;
        this.pendingNextObjectId = undefined;
        this.encounterSelectedCreature = null;
        this.saveCombatState();
    }

    // Camera Management

    setCamera(x: number, y: number, zoom?: number) {
        this.camera.x = x;
        this.camera.y = y;
        if (zoom !== undefined) this.camera.zoom = zoom;

        if (this.map) {
            this.map.view = { x: this.camera.x, y: this.camera.y, zoom: this.camera.zoom };
        }

        this.renderTrigger++;
    }

    pendingCameraFocus = $state<{
        objectId: string;
        offsetX: number;
        offsetY: number;
        animate: boolean;
    } | null>(null);

    centerOnObject(
        objectId: string,
        offsetX: number = 0,
        offsetY: number = 0,
        animate: boolean = false
    ) {
        if (!this.map) return;
        const obj = this.map.objects.find((o) => o.id === objectId);
        if (obj) {
            this.pendingCameraFocus = { objectId, offsetX, offsetY, animate };
        }
    }
}

export const mapState = new MapState();
