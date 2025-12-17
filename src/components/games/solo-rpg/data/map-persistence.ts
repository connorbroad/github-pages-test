import {
    loadMaps,
    saveMaps,
    type MapEntity,
    type MapObject,
    type CombatState,
} from "./storage-utils";

/**
 * map-persistence.ts
 *
 * Provides atomic-like update operations for MapEntity to prevent race conditions
 * where concurrent saves (e.g. auto-save debounce vs manual interaction) could
 * overwrite data.
 *
 * All modifiers strictly follow the read-modify-write pattern synchronously.
 */

/**
 * Updates a specific map by ID using a mutator function.
 * This ensures we are always modifying the latest version of the map from storage.
 *
 * @param mapId - The ID of the map to update
 * @param mutator - A function that modifies the map in-place
 * @returns The updated map entity, or null if not found
 */
export function updateMap(mapId: string, mutator: (map: MapEntity) => void): MapEntity | null {
    const allMaps = loadMaps();
    const mapIndex = allMaps.findIndex((m) => m.id === mapId);

    if (mapIndex < 0) {
        console.error(`MapPersistence: Map not found with ID ${mapId}`);
        return null;
    }

    const map = allMaps[mapIndex];
    mutator(map);
    map.updatedAt = Date.now();

    allMaps[mapIndex] = map;
    saveMaps(allMaps);

    return map;
}

/**
 * Updates a specific object within a map.
 *
 * @param mapId - The ID of the map
 * @param objectId - The ID of the object to update
 * @param mutator - A function that modifies the object in-place
 * @returns The updated map entity, or null if map/object not found
 */
export function updateMapObject(
    mapId: string,
    objectId: string,
    mutator: (obj: MapObject) => void
): MapEntity | null {
    return updateMap(mapId, (map) => {
        const obj = map.objects.find((o) => o.id === objectId);
        if (obj) {
            mutator(obj);
        } else {
            console.warn(`MapPersistence: Object ${objectId} not found in map ${mapId}`);
        }
    });
}

/**
 * Saves the combat state for a map.
 * This explicitly preserves all other map data and only updates the combat state.
 *
 * @param mapId - The ID of the map
 * @param combatState - The new combat state to save
 */
export function saveCombatState(mapId: string, combatState: CombatState): MapEntity | null {
    return updateMap(mapId, (map) => {
        map.combatState = combatState;
    });
}

/**
 * Adds a new map to storage.
 *
 * @param newMap - The new map entity to add
 */
export function addMap(newMap: MapEntity): void {
    const allMaps = loadMaps();
    allMaps.push(newMap);
    saveMaps(allMaps);
}

/**
 * Deletes a map by ID.
 *
 * @param mapId - The ID of the map to delete
 */
export function deleteMap(mapId: string): void {
    const allMaps = loadMaps().filter((m) => m.id !== mapId);
    saveMaps(allMaps);
}
