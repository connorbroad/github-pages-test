/**
 * Combat utility functions for Solo RPG
 * Pure functions for initiative logic and combat state management
 */

import type { InitiativeEntry } from "../data/storage-utils";

/**
 * Creature data input for rolling initiative
 */
export type CreatureInitiativeInput = {
    objectId: string;
    name: string;
    initMod: number;
    hp: number;
    maxHp: number;
};

/**
 * Rolls a d20 (1-20)
 */
export function rollD20(): number {
    return Math.floor(Math.random() * 20) + 1;
}

/**
 * Rolls initiative for a single creature
 * @param objectId - The map object ID for the creature
 * @param name - The creature's display name
 * @param initMod - Initiative modifier (added to roll)
 * @param hp - Current hit points
 * @param maxHp - Maximum hit points
 * @returns Initiative entry with calculated initiative value
 */
export function rollInitiativeForCreature(
    objectId: string,
    name: string,
    initMod: number,
    hp: number,
    maxHp: number
): InitiativeEntry {
    const roll = rollD20();
    return {
        objectId,
        name,
        initiative: roll + initMod,
        currentHP: hp,
        maxHP: maxHp,
        isActive: false,
    };
}

/**
 * Rolls initiative for multiple creatures and returns them sorted by initiative (descending)
 * @param creatures - Array of creatures to roll initiative for
 * @returns Sorted array of initiative entries (highest first)
 */
export function rollInitiativeForCreatures(
    creatures: CreatureInitiativeInput[]
): InitiativeEntry[] {
    const entries = creatures.map((c) =>
        rollInitiativeForCreature(c.objectId, c.name, c.initMod, c.hp, c.maxHp)
    );
    return sortInitiativeOrder(entries);
}

/**
 * Sorts initiative entries by initiative value (descending)
 * Ties are broken by keeping original order (stable sort)
 * @param entries - Array of initiative entries to sort
 * @returns New sorted array (does not mutate input)
 */
export function sortInitiativeOrder(entries: InitiativeEntry[]): InitiativeEntry[] {
    return [...entries].sort((a, b) => b.initiative - a.initiative);
}

/**
 * Inserts a creature at a specific index in the initiative order
 * @param order - Current initiative order
 * @param entry - New initiative entry to insert
 * @param index - Index to insert at (0 = beginning)
 * @returns New array with the entry inserted (does not mutate input)
 */
export function insertCreatureAtIndex(
    order: InitiativeEntry[],
    entry: InitiativeEntry,
    index: number
): InitiativeEntry[] {
    const clampedIndex = Math.max(0, Math.min(index, order.length));
    const newOrder = [...order];
    newOrder.splice(clampedIndex, 0, entry);
    return newOrder;
}

/**
 * Gets the next turn index, wrapping around if at end
 * @param currentIndex - Current turn index
 * @param orderLength - Length of initiative order
 * @returns Next index (wraps to 0 if at end)
 */
export function getNextTurnIndex(currentIndex: number, orderLength: number): number {
    if (orderLength === 0) return 0;
    return (currentIndex + 1) % orderLength;
}

/**
 * Gets the previous turn index, wrapping around if at beginning
 * @param currentIndex - Current turn index
 * @param orderLength - Length of initiative order
 * @returns Previous index (wraps to end if at beginning)
 */
export function getPrevTurnIndex(currentIndex: number, orderLength: number): number {
    if (orderLength === 0) return 0;
    return (currentIndex - 1 + orderLength) % orderLength;
}

/**
 * Finds the index of a creature by objectId
 * @param order - Initiative order array
 * @param objectId - Object ID to find
 * @returns Index of the creature, or -1 if not found
 */
export function findCreatureIndex(order: InitiativeEntry[], objectId: string): number {
    return order.findIndex((e) => e.objectId === objectId);
}

/**
 * Checks if a creature is in the encounter
 * @param order - Initiative order array
 * @param objectId - Object ID to check
 * @returns True if creature is in the encounter
 */
export function isCreatureInEncounter(order: InitiativeEntry[], objectId: string): boolean {
    return findCreatureIndex(order, objectId) !== -1;
}

/**
 * Creates an empty combat state
 */
export function createEmptyCombatState(): {
    initiativeOrder: InitiativeEntry[];
    currentTurnIndex: number;
    hasActiveEncounter: boolean;
    pendingNextObjectId: undefined;
} {
    return {
        initiativeOrder: [],
        currentTurnIndex: 0,
        hasActiveEncounter: false,
        pendingNextObjectId: undefined,
    };
}
