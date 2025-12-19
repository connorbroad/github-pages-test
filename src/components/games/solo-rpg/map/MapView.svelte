<script lang="ts">
    import { untrack } from "svelte";
    import { activeCampaign } from "../game-management/campaign-store";
    import NoCampaignOverlay from "../NoCampaignOverlay.svelte";
    import { generateId } from "../oracle/scripts/oracleTypes";
    import {
        loadMapsByCampaign,
        loadMaps,
        saveActiveMapId,
        loadActiveMapId,
        loadCharacters,
        loadMapMode,
        saveMapMode,
        type MapEntity,
        type CreatureRef,
        type InitiativeEntry,
        type QuickStats,
        type Character,
    } from "../data/storage-utils";
    import MapLanding from "./MapLanding.svelte";
    import MapEditor from "./MapEditor.svelte";
    import CombatPanel from "./CombatPanel.svelte";
    import InitiativeBar from "./InitiativeBar.svelte";
    import EncounterSetupModal from "./EncounterSetupModal.svelte";
    import SecondarySidebar from "../SecondarySidebar.svelte";
    import TertiarySidebar from "../TertiarySidebar.svelte";
    import FloatingOracleButton from "../shared/FloatingOracleButton.svelte";
    // Floating panels
    import FloatingEditPlayToggle from "./FloatingEditPlayToggle.svelte";
    import FloatingPaintOptions from "./FloatingPaintOptions.svelte";
    import ShapeModal from "./ShapeModal.svelte";
    import TokenSelectorModal from "./TokenSelectorModal.svelte";
    import CreatureAssignmentModal from "./CreatureAssignmentModal.svelte";
    import QuickStatsModal from "./QuickStatsModal.svelte";
    import {
        rollInitiativeForCreatures,
        getNextTurnIndex,
        getPrevTurnIndex,
        insertCreatureAtIndex,
        type CreatureInitiativeInput,
    } from "./combat-utils";
    import {
        updateMap,
        updateMapObject,
        saveCombatState as persistCombatState,
        addMap,
        deleteMap as removeMap,
    } from "../data/map-persistence";
    import { characterStore } from "../data/character-store";
    import "../solo-rpg-styles.css";
    import { mapState } from "./map-state.svelte";

    // Event callback props
    interface Props {
        onNavigateHome?: () => void;
        onNavigateToStory?: () => void;
        onMapOpened?: () => void;
        onMapClosed?: () => void;
    }

    let {
        onNavigateHome = () => {},
        onNavigateToStory = () => {},
        onMapOpened = () => {},
        onMapClosed = () => {},
    }: Props = $props();

    // Derived state from mapState
    let maps = $derived(mapState.maps);
    let currentMapId = $derived(mapState.map?.id ?? null);
    let mapMode = $derived(mapState.mapMode);
    let initiativeOrder = $derived(mapState.initiativeOrder);
    let currentTurnIndex = $derived(mapState.currentTurnIndex);
    let hasActiveEncounter = $derived(mapState.hasActiveEncounter);
    let currentTurnObjectId = $derived(mapState.currentTurnObjectId);
    let encounterSelectedCreature = $derived(mapState.encounterSelectedCreature);
    let pendingNextObjectId = $derived(mapState.pendingNextObjectId);

    // Encounter setup modal state
    let showEncounterSetup = $state(false);

    // Dice roll preset for ability/skill checks
    let mapDiceRollPreset = $state<{
        characterId: string;
        characterName: string;
        checkName: string;
        numDice: number;
        numSides: number;
        modifier: number;
        rollType: "normal" | "advantage" | "disadvantage";
    } | null>(null);

    // Quick stats modal state
    let showQuickStatsModal = $state(false);
    let quickStatsModalObjectId = $state<string | null>(null);
    let quickStatsModalExistingStats = $state<QuickStats | null>(null);

    function handleNavigateHome() {
        onNavigateHome();
    }

    let campaignId = $derived($activeCampaign?.id);

    // Track whether initial load has been done to prevent repeated loading
    let hasInitialized = $state(false);

    // Initialize map view when campaign is available
    $effect(() => {
        if (campaignId && !hasInitialized) {
            hasInitialized = true;
            mapState.init(campaignId);
            const activeMapId = loadActiveMapId();
            if (activeMapId) {
                mapState.loadMap(activeMapId);
                onMapOpened();
            }
        }
    });

    // Refresh maps when campaign changes
    $effect(() => {
        if (campaignId) {
            mapState.init(campaignId);
        }
    });

    // Character sync is now handled by mapState
    $effect(() => {
        if (currentMapId && $characterStore.length > 0) {
            untrack(() => mapState.syncMapWithCharacters($characterStore));
        }
    });

    function createMap(e: CustomEvent<{ name: string }>) {
        if (!campaignId) return;
        const now = Date.now();
        const newMap: MapEntity = {
            id: generateId(),
            campaignId,
            name: e.detail.name,
            createdAt: now,
            updatedAt: now,
            width: 100,
            height: 100,
            tileSize: 32,
            background: {},
            objects: [],
            view: { x: 0, y: 0, zoom: 1 },
        };
        addMap(newMap);
        mapState.init(campaignId);
    }

    function openMap(e: CustomEvent<{ id: string }>) {
        mapState.loadMap(e.detail.id);
        onMapOpened();
    }

    function closeMap() {
        mapState.closeMap();
        onMapClosed();
    }

    function renameMap(e: CustomEvent<{ id: string; name: string }>) {
        const { id, name } = e.detail;
        updateMap(id, (m) => {
            m.name = name;
        });
        if (campaignId) maps = loadMapsByCampaign(campaignId);
    }

    function deleteMap(e: CustomEvent<{ id: string }>) {
        const { id } = e.detail;
        removeMap(id);
        if (currentMapId === id) {
            currentMapId = null;
            saveActiveMapId(null);
        }
        if (campaignId) maps = loadMapsByCampaign(campaignId);
    }

    function doUpdateMap(e: CustomEvent<{ id: string; changes: Partial<MapEntity> }>) {
        const { id, changes } = e.detail;
        updateMap(id, (m) => {
            Object.assign(m, changes);
        });
        if (campaignId) maps = loadMapsByCampaign(campaignId);
    }

    // Editor UI state routed to floating panels
    let editMode = $derived(mapState.editMode);
    let objectMode = $derived(mapState.objectMode);
    let currentShape = $derived(mapState.currentShape);
    let color = $derived(mapState.color);
    let selectedTileRef = $derived(mapState.selectedTileRef);
    let isErasing = $derived(mapState.isErasing);

    // Track sidebar visibility for smooth animations
    let showSecondarySidebar = $state(false);

    // Detect if we're on mobile
    import { isMobile } from "../ui-utils";

    // Reactive statement to show sidebars when a map is opened
    // SecondarySidebar is always visible when map is open (per redesign)
    $effect(() => {
        if (currentMapId) {
            // Small delay to ensure DOM is ready and transition can play
            const timeoutId = setTimeout(() => {
                untrack(() => {
                    showSecondarySidebar = true;
                });
            }, 10);
            return () => clearTimeout(timeoutId);
        } else {
            showSecondarySidebar = false;
        }
    });

    // Selected properties
    let selectedObjectId = $derived(mapState.selectedObjectId);
    let hasSelection = $derived(!!mapState.selectedObjectId);
    let selectedColor = $derived(mapState.selectedObject?.color ?? null);
    let selectedShape = $derived(mapState.selectedObject?.type ?? null);
    let selectedTile = $derived(mapState.selectedObject?.tile ?? null);
    let selectedCanFlip = $derived(
        mapState.selectedObject ? mapState.selectedObject.type !== "circle" : false
    );
    let selectedCreatureRef = $derived(mapState.selectedObject?.creatureRef ?? null);

    // Reference to MapEditor to call exported methods
    let editorRef = $state<any>();

    function handleEditorSelectionChange(e: CustomEvent<any>) {
        mapState.selectObject(e.detail?.selected ? e.detail.object.id : null);
    }

    function handleTokenTapInMoveMode(e: CustomEvent<{ objectId: string }>) {
        mapState.setEditMode("object");
        mapState.objectMode = "select";
        mapState.selectObject(e.detail.objectId);
    }

    function handleColorChange(e: CustomEvent<string>) {
        if (editMode === "object" && hasSelection && selectedObjectId) {
            mapState.updateObject(selectedObjectId, { color: e.detail });
        }
        mapState.color = e.detail;
    }

    function handleShapeChange(e: CustomEvent<"square" | "circle" | "triangle" | "star">) {
        if (editMode === "object" && hasSelection && selectedObjectId) {
            mapState.updateObject(selectedObjectId, { type: e.detail });
        }
        mapState.currentShape = e.detail;
    }

    function handleTileSelect(e: CustomEvent<{ tileMapId: string; tileId: string }>) {
        if (editMode === "object" && hasSelection && selectedObjectId) {
            mapState.updateObject(selectedObjectId, {
                tile: e.detail,
                kind: "tile",
            });
        }
        mapState.selectedTileRef = e.detail;
    }

    function handleFlip() {
        if (selectedObjectId && selectedCanFlip) {
            const obj = mapState.selectedObject;
            if (obj) {
                mapState.updateObject(selectedObjectId, { flipX: !obj.flipX });
            }
        }
    }
    function handleDelete() {
        if (selectedObjectId) {
            mapState.deleteObject(selectedObjectId);
        }
    }
    function handleCreatureAssign(e: CustomEvent<CreatureRef | null>) {
        if (selectedObjectId) {
            mapState.updateObject(selectedObjectId, { creatureRef: e.detail });
        }
    }

    function handleEditModeChange(newMode: "move" | "background" | "object") {
        mapState.setEditMode(newMode);
        if (newMode === "object") {
            mapState.objectMode = (mapState.map?.objects.length ?? 0) > 0 ? "select" : "add";
        }
    }

    function handleObjectModeChange(newMode: "select" | "add") {
        if (newMode === "add") mapState.selectObject(null);
        mapState.objectMode = newMode;
    }

    function handleBrushModeChange(erasing: boolean) {
        mapState.isErasing = erasing;
    }

    // Modal state for paint options (tile, color, shape)
    let showTileModal = $state(false);
    let showColorModal = $state(false);
    let showShapeModal = $state(false);
    let showTokenModal = $state(false);
    let showAssignModal = $state(false);

    function openTileModal() {
        showTileModal = true;
        showColorModal = false;
        showShapeModal = false;
        showTokenModal = false;
    }

    function openColorModal() {
        showColorModal = true;
        showTileModal = false;
        showShapeModal = false;
        showTokenModal = false;
    }

    function openShapeModal() {
        showShapeModal = true;
        showTileModal = false;
        showColorModal = false;
        showTokenModal = false;
    }

    function openTokenModal() {
        showTokenModal = true;
        showTileModal = false;
        showColorModal = false;
        showShapeModal = false;
    }

    function openAssignModal() {
        showAssignModal = true;
    }

    function closeAllModals() {
        showTileModal = false;
        showColorModal = false;
        showShapeModal = false;
        showTokenModal = false;
        showAssignModal = false;
    }

    // Handle token selector modal confirm
    function handleTokenUpdate(
        e: CustomEvent<{
            shape: "square" | "circle" | "triangle" | "star";
            color: string;
            tile: { tileMapId: string; tileId: string } | null;
        }>
    ) {
        const { shape, color: newColor, tile } = e.detail;

        if (editMode === "object" && hasSelection && mapState.selectedObjectId) {
            // Update selected object
            mapState.updateObject(mapState.selectedObjectId, {
                type: shape,
                color: newColor,
                tile: tile || undefined,
                kind: tile ? "tile" : "shape",
            });
        }

        // Update current paint options for new tokens
        mapState.currentShape = shape;
        mapState.color = newColor;
        mapState.selectedTileRef = tile;

        showTokenModal = false;
    }

    // ====== Camera & Layout Helpers ======

    // Constants for combat panel dimensions (must match CombatPanel.svelte CSS)
    const DESKTOP_PANEL_WIDTH = 320;
    const DESKTOP_COLLAPSED_WIDTH = 80;
    const MOBILE_COLLAPSED_HEIGHT_PERCENT = 15;

    // Encounter panel height for mobile layout
    let encounterPanelHeight = $state(50);
    let encounterPanelDragging = $state(false);

    function handlePanelHeightChanged(e: CustomEvent<{ heightPercent: number }>) {
        encounterPanelHeight = e.detail.heightPercent;
    }

    function handlePanelDragStateChanged(e: CustomEvent<{ isDragging: boolean }>) {
        encounterPanelDragging = e.detail.isDragging;
    }

    /**
     * Calculate focus offset to account for overlaying combat panel.
     */
    function getFocusOffset(forceExpanded: boolean = false): { x: number; y: number } {
        if (mapMode !== "play") return { x: 0, y: 0 };

        const isCollapsed = forceExpanded
            ? false
            : !encounterSelectedCreature && !encounterPanelDragging;

        if (isMobile) {
            const panelPercent = isCollapsed
                ? MOBILE_COLLAPSED_HEIGHT_PERCENT
                : encounterPanelHeight;
            const panelHeightPx = (window.innerHeight * panelPercent) / 100;
            return { x: 0, y: panelHeightPx / 2.4 };
        } else {
            const panelWidth = isCollapsed ? DESKTOP_COLLAPSED_WIDTH : DESKTOP_PANEL_WIDTH;
            return { x: panelWidth / 2, y: 0 };
        }
    }

    function centerOnPortalCreature(
        objectId: string,
        animate: boolean = false,
        forceExpanded: boolean = false
    ) {
        const offset = getFocusOffset(forceExpanded);
        mapState.centerOnObject(objectId, offset.x, offset.y, animate);
    }

    // Exported methods
    export function returnToLanding() {
        if (currentMapId) {
            closeMap();
        }
    }

    function handleMapModeChange(mode: "edit" | "play") {
        mapState.setMapMode(mode);
    }

    function handleTurnChanged(e: CustomEvent<{ turnIndex: number; order: InitiativeEntry[] }>) {
        const turnActuallyChanged = mapState.currentTurnIndex !== e.detail.turnIndex;
        if (turnActuallyChanged) {
            mapState.currentTurnIndex = e.detail.turnIndex;
            mapState.initiativeOrder = e.detail.order;
            mapState.saveCombatState();
            const currentEntry = mapState.initiativeOrder[mapState.currentTurnIndex];
            if (currentEntry) {
                mapState.selectEncounterCreature(currentEntry.objectId);
                centerOnPortalCreature(currentEntry.objectId);
            }
        }
    }

    function handleQuickStatsUpdate(e: CustomEvent<{ objectId: string; quickStats: QuickStats }>) {
        mapState.updateObject(e.detail.objectId, { quickStats: e.detail.quickStats });
        // Update initiative if present
        const initIndex = mapState.initiativeOrder.findIndex(
            (en) => en.objectId === e.detail.objectId
        );
        if (initIndex >= 0) {
            const entry = mapState.initiativeOrder[initIndex];
            mapState.initiativeOrder[initIndex] = {
                ...entry,
                name: e.detail.quickStats.name || entry.name,
                currentHP: e.detail.quickStats.currentHitPoints ?? entry.currentHP,
                maxHP: e.detail.quickStats.maxHitPoints ?? entry.maxHP,
            };
            mapState.saveCombatState();
        }
    }

    function handleConvertToCharacter(
        e: CustomEvent<{ objectId: string; quickStats: QuickStats }>
    ) {
        if (!campaignId) return;
        const characterId = generateId();
        const character: Character = {
            id: characterId,
            campaignId,
            name: e.detail.quickStats.name,
            currentHitPoints: e.detail.quickStats.currentHitPoints,
            hitPointMaximum: e.detail.quickStats.maxHitPoints,
            abilities: [],
            skills: [],
            visibleSections: ["information", "health", "abilities", "skills", "items", "combat"],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        characterStore.add(character);

        mapState.updateObject(e.detail.objectId, {
            creatureRef: {
                type: "character",
                id: characterId,
                instanceId: generateId(),
                currentHitPoints: character.currentHitPoints,
            },
            quickStats: undefined,
        });

        mapState.selectEncounterCreature(e.detail.objectId);
    }

    function handleOpenQuickStatsModal(
        e: CustomEvent<{ objectId: string; existingStats: QuickStats | null }>
    ) {
        quickStatsModalObjectId = e.detail.objectId;
        quickStatsModalExistingStats = e.detail.existingStats;
        showQuickStatsModal = true;
    }

    function handleQuickStatsSave(e: CustomEvent<{ quickStats: QuickStats }>) {
        if (!quickStatsModalObjectId) return;
        handleQuickStatsUpdate(
            new CustomEvent("update", {
                detail: { objectId: quickStatsModalObjectId, quickStats: e.detail.quickStats },
            })
        );
        showQuickStatsModal = false;
    }

    function handleCombatPanelRollCheck(detail: {
        checkName: string;
        diceFormula: string;
        modifier: number;
        resultOption: string;
    }) {
        if (!encounterSelectedCreature?.creatureRef) return;
        const ref = encounterSelectedCreature.creatureRef;
        if (ref.type !== "character") return;
        const char = $characterStore.find((c) => c.id === ref.id);
        if (!char) return;

        const match = detail.diceFormula.match(/^(\d+)d(\d+)$/i);
        if (!match) return;

        mapDiceRollPreset = {
            characterId: char.id,
            characterName: char.name,
            checkName: detail.checkName,
            numDice: parseInt(match[1]),
            numSides: parseInt(match[2]),
            modifier: detail.modifier,
            rollType:
                detail.resultOption === "Maximum"
                    ? "advantage"
                    : detail.resultOption === "Minimum"
                      ? "disadvantage"
                      : "normal",
        };
    }

    function handleRerollInitiative() {
        if (!currentMapId || !campaignId) return;
        // Simplified: just call begin encounter again with existing IDs
        const ids = initiativeOrder.map((e) => e.objectId);
        handleBeginEncounter(new CustomEvent("begin", { detail: { selectedObjectIds: ids } }));
    }

    function handleNextTurn() {
        if (initiativeOrder.length === 0) return;
        let newIndex = getNextTurnIndex(currentTurnIndex, initiativeOrder.length);
        if (mapState.pendingNextObjectId) {
            const pIdx = initiativeOrder.findIndex(
                (e) => e.objectId === mapState.pendingNextObjectId
            );
            if (pIdx >= 0) newIndex = pIdx;
            mapState.pendingNextObjectId = undefined;
        }
        mapState.setInitiative(
            initiativeOrder.map((e, i) => ({ ...e, isActive: i === newIndex })),
            newIndex
        );
        const entry = mapState.initiativeOrder[newIndex];
        if (entry) {
            mapState.selectEncounterCreature(entry.objectId);
            centerOnPortalCreature(entry.objectId, true);
        }
    }

    function handlePrevTurn() {
        if (initiativeOrder.length === 0) return;
        mapState.pendingNextObjectId = undefined;
        const newIndex = getPrevTurnIndex(currentTurnIndex, initiativeOrder.length);
        mapState.setInitiative(
            initiativeOrder.map((e, i) => ({ ...e, isActive: i === newIndex })),
            newIndex
        );
        const entry = mapState.initiativeOrder[newIndex];
        if (entry) {
            mapState.selectEncounterCreature(entry.objectId);
            centerOnPortalCreature(entry.objectId, true);
        }
    }

    function handleInitiativeBarSelectCreature(
        e: CustomEvent<{ objectId: string; index: number }>
    ) {
        mapState.pendingNextObjectId = undefined;
        mapState.setInitiative(
            initiativeOrder.map((entry, i) => ({ ...entry, isActive: i === e.detail.index })),
            e.detail.index
        );
        mapState.selectEncounterCreature(e.detail.objectId);
        centerOnPortalCreature(e.detail.objectId, true);
    }

    function handleEncounterSelectCreature(
        e: CustomEvent<{ objectId: string; creatureRef: CreatureRef }>
    ) {
        mapState.selectEncounterCreature(e.detail.objectId);
        centerOnPortalCreature(e.detail.objectId, true, true);
    }

    function handleEncounterFocusCreature(e: CustomEvent<{ objectId: string }>) {
        centerOnPortalCreature(e.detail.objectId);
    }

    function handleOpenEncounterSetup() {
        showEncounterSetup = true;
    }

    function handleEndEncounter() {
        mapState.endEncounter();
    }

    function handleBeginEncounter(e: CustomEvent<{ selectedObjectIds: string[] }>) {
        showEncounterSetup = false;
        if (!currentMapId || !campaignId) return;

        const allMaps = loadMaps();
        const map = allMaps.find((m) => m.id === currentMapId);
        if (!map) return;

        const chars = loadCharacters().filter((c) => c.campaignId === campaignId);

        const creatureInputs: CreatureInitiativeInput[] = [];
        for (const objectId of e.detail.selectedObjectIds) {
            const obj = map.objects.find((o) => o.id === objectId);
            if (!obj) continue;

            if (obj.creatureRef) {
                const ref = obj.creatureRef;
                if (ref.type === "character") {
                    const char = chars.find((c) => c.id === ref.id);
                    if (char) {
                        const maxHp = char.hitPointMaximum ?? 10;
                        creatureInputs.push({
                            objectId: obj.id,
                            name: char.name,
                            initMod: char.initiative ?? 0,
                            hp: ref.currentHitPoints ?? char.currentHitPoints ?? maxHp,
                            maxHp,
                        });
                    }
                }
            } else if (obj.quickStats) {
                const qs = obj.quickStats;
                creatureInputs.push({
                    objectId: obj.id,
                    name: qs.name || "Unknown",
                    initMod: 0,
                    hp: qs.currentHitPoints ?? 10,
                    maxHp: qs.maxHitPoints ?? 10,
                });
            }
        }

        if (creatureInputs.length === 0) return;

        const entries = rollInitiativeForCreatures(creatureInputs);
        if (entries.length > 0) {
            entries[0].isActive = true;
        }

        mapState.setInitiative(entries, 0);

        if (entries.length > 0) {
            mapState.selectEncounterCreature(entries[0].objectId);
            centerOnPortalCreature(entries[0].objectId);
        }
    }

    function handleAddToEncounter(e: CustomEvent<{ entry: InitiativeEntry }>) {
        if (!hasActiveEncounter) return;

        const { entry: newEntry } = e.detail;

        if (initiativeOrder.length > 0 && currentTurnIndex < initiativeOrder.length) {
            mapState.pendingNextObjectId = initiativeOrder[currentTurnIndex].objectId;
        }

        const newOrder = insertCreatureAtIndex(initiativeOrder, newEntry, currentTurnIndex);

        mapState.setInitiative(
            newOrder.map((entry, i) => ({
                ...entry,
                isActive: i === currentTurnIndex,
            })),
            currentTurnIndex
        );

        mapState.selectEncounterCreature(newEntry.objectId);
        centerOnPortalCreature(newEntry.objectId);
    }

    function handleEncounterCreatureSelect(
        e: CustomEvent<{ objectId: string; creatureRef?: CreatureRef; quickStats?: QuickStats }>
    ) {
        mapState.selectEncounterCreature(e.detail.objectId);
        if ($isMobile) {
            centerOnPortalCreature(e.detail.objectId, true, true);
        }
    }

    function handleEncounterCreatureDeselect() {
        mapState.encounterSelectedCreature = null;
    }

    function handleQuickStatsClose() {
        showQuickStatsModal = false;
        quickStatsModalObjectId = null;
        quickStatsModalExistingStats = null;
    }

    function handleInitiativeRolled(
        e: CustomEvent<{ order: InitiativeEntry[]; turnIndex: number }>
    ) {
        mapState.setInitiative(e.detail.order, e.detail.turnIndex);
        if (e.detail.order.length > 0) {
            const firstEntry = e.detail.order[e.detail.turnIndex];
            mapState.selectEncounterCreature(firstEntry.objectId);
            centerOnPortalCreature(firstEntry.objectId);
        }
    }

    function getVisibleCreatureIds(): string[] {
        return editorRef?.getVisibleCreatureIds?.() ?? [];
    }

    function handleNavigateToChronicle() {
        onNavigateToStory();
    }

    // Derived state
    let showEncounterPanel = $derived(mapMode === "play");
    let showEditPlayToggle = $derived(!!currentMapId);
    let showTertiarySidebar = $derived(currentMapId && mapMode === "edit" && editMode !== "move");
    let paintOptionsContext = $derived<"background" | "object">(
        editMode === "background" ? "background" : "object"
    );
    let paintOptionsDisabled = $derived(
        (editMode === "background" && isErasing) ||
            (editMode === "object" && objectMode === "select" && !hasSelection)
    );
</script>

<NoCampaignOverlay show={!$activeCampaign} on:navigateHome={handleNavigateHome} />

{#if $activeCampaign}
    {#if !currentMapId}
        <div class="mx-auto max-w-[1200px]">
            <MapLanding
                {maps}
                on:createMap={createMap}
                on:openMap={openMap}
                on:renameMap={renameMap}
                on:deleteMap={deleteMap}
                on:updateMap={doUpdateMap} />
        </div>
    {:else}
        <!-- Map View Container: uses flexbox to accommodate encounter panel -->
        <div
            class="map-view-container"
            class:play-mode={showEncounterPanel}
            class:encounter-panel-collapsed={showEncounterPanel &&
                !encounterSelectedCreature &&
                !encounterPanelDragging}
            class:panel-dragging={encounterPanelDragging}
            style="--encounter-panel-height: {encounterPanelHeight}%;">
            <!-- Secondary Sidebar (Move/Background/Token tool toggle) - hidden in play mode -->
            <SecondarySidebar
                show={showSecondarySidebar && mapMode === "edit"}
                mode="map"
                activeTab="characters"
                {editMode}
                onTabChange={() => {}}
                onEditModeChange={handleEditModeChange} />

            <!-- Tertiary Sidebar (tool-specific options) -->
            <TertiarySidebar
                show={showTertiarySidebar}
                mode="map"
                hasSecondarySidebar={true}
                {editMode}
                {objectMode}
                {isErasing}
                {hasSelection}
                {selectedCanFlip}
                currentColor={editMode === "object" && hasSelection
                    ? (selectedColor ?? color)
                    : color}
                currentTile={editMode === "object" && hasSelection ? selectedTile : selectedTileRef}
                currentShape={editMode === "object" && hasSelection
                    ? (selectedShape ?? currentShape)
                    : currentShape}
                onObjectModeChange={handleObjectModeChange}
                onBrushModeChange={handleBrushModeChange}
                onOpenTileModal={openTileModal}
                onOpenColorModal={openColorModal}
                onOpenTokenModal={openTokenModal}
                onFlip={handleFlip}
                onDelete={handleDelete}
                onOpenAssignModal={openAssignModal} />

            <!-- Floating Edit/Play Toggle (top center, only in edit mode) -->
            {#if showEditPlayToggle}
                <FloatingEditPlayToggle {mapMode} onModeChange={handleMapModeChange} />
            {/if}

            <!-- Paint Options Modal (Tile/Color selection) -->
            {#if showTileModal || showColorModal}
                <FloatingPaintOptions
                    context={paintOptionsContext}
                    disabled={paintOptionsDisabled}
                    color={editMode === "object" && hasSelection ? (selectedColor ?? color) : color}
                    selectedTile={editMode === "object" && hasSelection
                        ? selectedTile
                        : selectedTileRef}
                    currentShape={editMode === "object" && hasSelection
                        ? (selectedShape ?? currentShape)
                        : currentShape}
                    showShape={false}
                    initialTab={showTileModal ? "tile" : "color"}
                    on:colorChange={handleColorChange}
                    on:tileSelect={handleTileSelect}
                    on:shapeChange={handleShapeChange}
                    on:close={closeAllModals} />
            {/if}

            <!-- Shape Selection Modal -->
            <ShapeModal
                show={showShapeModal}
                currentShape={editMode === "object" && hasSelection
                    ? (selectedShape ?? currentShape)
                    : currentShape}
                on:select={(e) => {
                    handleShapeChange(e);
                    showShapeModal = false;
                }}
                on:close={() => (showShapeModal = false)} />

            <!-- Token Selector Modal (combined Shape/Tile/Color) -->
            <TokenSelectorModal
                show={showTokenModal}
                currentShape={editMode === "object" && hasSelection
                    ? (selectedShape ?? currentShape)
                    : currentShape}
                currentColor={editMode === "object" && hasSelection
                    ? (selectedColor ?? color)
                    : color}
                currentTile={editMode === "object" && hasSelection ? selectedTile : selectedTileRef}
                on:confirm={handleTokenUpdate}
                on:close={() => (showTokenModal = false)} />

            <!-- Creature Assignment Modal -->
            {#if showAssignModal && campaignId && currentMapId}
                <CreatureAssignmentModal
                    show={showAssignModal}
                    {campaignId}
                    mapId={currentMapId}
                    currentCreatureRef={selectedCreatureRef}
                    onAssign={(detail) => {
                        import("./uuid").then(({ generateUUID }) => {
                            const ref: CreatureRef = {
                                type: detail.type,
                                id: detail.id,
                                instanceId: generateUUID(),
                            };
                            mapState.updateObject(selectedObjectId!, { creatureRef: ref });
                            showAssignModal = false;
                        });
                    }}
                    onClear={() => {
                        mapState.updateObject(selectedObjectId!, { creatureRef: null });
                        showAssignModal = false;
                    }}
                    onClose={() => (showAssignModal = false)} />
            {/if}

            <!-- Encounter Panel (left side on desktop, bottom on mobile) -->
            {#if showEncounterPanel}
                <CombatPanel
                    {campaignId}
                    mapId={currentMapId}
                    selectedCreature={encounterSelectedCreature}
                    {initiativeOrder}
                    {currentTurnIndex}
                    {hasActiveEncounter}
                    on:selectCreature={handleEncounterSelectCreature}
                    on:focusCreature={handleEncounterFocusCreature}
                    on:initiativeRolled={handleInitiativeRolled}
                    on:turnChanged={handleTurnChanged}
                    on:panelHeightChanged={handlePanelHeightChanged}
                    on:panelDragStateChanged={handlePanelDragStateChanged}
                    on:addToEncounter={handleAddToEncounter}
                    on:quickStatsUpdate={handleQuickStatsUpdate}
                    on:convertToCharacter={handleConvertToCharacter}
                    on:openQuickStatsModal={handleOpenQuickStatsModal}
                    onRollCheck={handleCombatPanelRollCheck} />

                <!-- Initiative Bar (bottom of screen in combat mode) -->
                <InitiativeBar
                    {hasActiveEncounter}
                    {initiativeOrder}
                    {currentTurnIndex}
                    {pendingNextObjectId}
                    on:openEncounterSetup={handleOpenEncounterSetup}
                    on:endEncounter={handleEndEncounter}
                    on:rerollInitiative={handleRerollInitiative}
                    on:nextTurn={handleNextTurn}
                    on:prevTurn={handlePrevTurn}
                    on:selectCreature={handleInitiativeBarSelectCreature} />

                <!-- Encounter Setup Modal -->
                <EncounterSetupModal
                    bind:show={showEncounterSetup}
                    mapId={currentMapId}
                    {campaignId}
                    {getVisibleCreatureIds}
                    on:beginEncounter={handleBeginEncounter}
                    on:cancel={() => (showEncounterSetup = false)} />

                <!-- Quick Stats Modal -->
                <QuickStatsModal
                    show={showQuickStatsModal}
                    existingStats={quickStatsModalExistingStats}
                    on:save={handleQuickStatsSave}
                    on:close={handleQuickStatsClose} />
            {/if}<!-- End showEncounterPanel -->

            <!-- Floating Oracle Button - always visible in edit and play mode -->
            <FloatingOracleButton
                hasSecondarySidebar={mapMode === "edit" ? showSecondarySidebar : hasActiveEncounter}
                hasTertiarySidebar={showTertiarySidebar}
                diceRollPreset={mapDiceRollPreset}
                currentCharacterId={encounterSelectedCreature?.creatureRef?.type === "character"
                    ? encounterSelectedCreature.creatureRef.id
                    : null}
                onClearPreset={() => (mapDiceRollPreset = null)}
                onNavigateToStory={handleNavigateToChronicle} />

            <!-- Main Map Area -->
            <div class="map-main-area">
                <!-- Map Editor Canvas -->
                <div class="map-editor-wrapper">
                    <MapEditor bind:this={editorRef} mapId={currentMapId} />
                </div>
            </div>
        </div>
    {/if}
{/if}

<style>
    /* Map View Container - fills available viewport space accounting for sidebars */
    .map-view-container {
        position: fixed;
        top: 0;
        right: 0;
        /* Mobile: above primary (70px) + secondary (60px) sidebars */
        bottom: calc(130px + env(safe-area-inset-bottom));
        left: 0;
        display: flex;
        flex-direction: column;
    }

    /* Mobile play mode: hide secondary sidebar (only primary 70px), add space for initiative bar (48px) */
    @media (max-width: 767px) {
        .map-view-container.play-mode {
            bottom: calc(70px + 48px + env(safe-area-inset-bottom));
        }
    }

    /* Desktop: adjust for left sidebars */
    @media (min-width: 768px) {
        .map-view-container {
            bottom: 0;
            /* After primary (80px) + secondary (90px) sidebars */
            left: 170px;
        }

        /* In play mode, hide secondary sidebar, only show primary (80px) */
        /* Initiative bar now floats, so no bottom reservation needed */
        .map-view-container.play-mode {
            left: 80px; /* Only primary sidebar */
            bottom: 0; /* Initiative bar floats - no reserved space */
        }
    }

    /* Main map area fills remaining space */
    .map-main-area {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        overflow: hidden;
    }

    /* Map editor wrapper fills the entire map-main-area */
    .map-editor-wrapper {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
    }
</style>
