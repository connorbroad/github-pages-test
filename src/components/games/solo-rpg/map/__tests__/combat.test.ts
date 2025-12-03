import { describe, it, expect, vi } from "vitest";
import {
    rollD20,
    rollInitiativeForCreature,
    rollInitiativeForCreatures,
    sortInitiativeOrder,
    insertCreatureAtIndex,
    getNextTurnIndex,
    getPrevTurnIndex,
    findCreatureIndex,
    isCreatureInEncounter,
    createEmptyCombatState,
    type CreatureInitiativeInput,
} from "../combat-utils";
import type { InitiativeEntry } from "../../data/storage-utils";

// Helper to create a mock initiative entry
function makeEntry(objectId: string, name: string, initiative: number): InitiativeEntry {
    return {
        objectId,
        name,
        initiative,
        currentHP: 10,
        maxHP: 10,
        isActive: false,
    };
}

// Helper to create creature input
function makeCreature(objectId: string, name: string, initMod = 0): CreatureInitiativeInput {
    return {
        objectId,
        name,
        initMod,
        hp: 10,
        maxHp: 10,
    };
}

describe("rollD20", () => {
    it("should return a value between 1 and 20", () => {
        // Run multiple times to increase confidence
        for (let i = 0; i < 100; i++) {
            const roll = rollD20();
            expect(roll).toBeGreaterThanOrEqual(1);
            expect(roll).toBeLessThanOrEqual(20);
            expect(Number.isInteger(roll)).toBe(true);
        }
    });
});

describe("rollInitiativeForCreature", () => {
    it("should return a valid initiative entry", () => {
        const entry = rollInitiativeForCreature("obj-1", "Goblin", 2, 8, 10);

        expect(entry.objectId).toBe("obj-1");
        expect(entry.name).toBe("Goblin");
        expect(entry.currentHP).toBe(8);
        expect(entry.maxHP).toBe(10);
        expect(entry.isActive).toBe(false);
    });

    it("should apply initiative modifier to roll", () => {
        // We can't test the exact value due to randomness,
        // but we can verify the range with a modifier
        const modifier = 5;
        // With d20 (1-20) + modifier (5), result should be 6-25
        for (let i = 0; i < 50; i++) {
            const entry = rollInitiativeForCreature("obj-1", "Goblin", modifier, 10, 10);
            expect(entry.initiative).toBeGreaterThanOrEqual(1 + modifier);
            expect(entry.initiative).toBeLessThanOrEqual(20 + modifier);
        }
    });

    it("should handle negative initiative modifier", () => {
        const modifier = -3;
        // With d20 (1-20) + modifier (-3), result should be -2 to 17
        for (let i = 0; i < 50; i++) {
            const entry = rollInitiativeForCreature("obj-1", "Orc", modifier, 15, 15);
            expect(entry.initiative).toBeGreaterThanOrEqual(1 + modifier);
            expect(entry.initiative).toBeLessThanOrEqual(20 + modifier);
        }
    });
});

describe("sortInitiativeOrder", () => {
    it("should sort entries by initiative descending", () => {
        const entries = [
            makeEntry("a", "Low", 5),
            makeEntry("b", "High", 20),
            makeEntry("c", "Mid", 12),
        ];

        const sorted = sortInitiativeOrder(entries);

        expect(sorted[0].objectId).toBe("b"); // 20
        expect(sorted[1].objectId).toBe("c"); // 12
        expect(sorted[2].objectId).toBe("a"); // 5
    });

    it("should not mutate the original array", () => {
        const entries = [makeEntry("a", "Low", 5), makeEntry("b", "High", 20)];
        const originalFirst = entries[0].objectId;

        sortInitiativeOrder(entries);

        expect(entries[0].objectId).toBe(originalFirst);
    });

    it("should handle empty array", () => {
        const sorted = sortInitiativeOrder([]);
        expect(sorted).toEqual([]);
    });

    it("should handle single entry", () => {
        const entries = [makeEntry("a", "Solo", 10)];
        const sorted = sortInitiativeOrder(entries);
        expect(sorted).toHaveLength(1);
        expect(sorted[0].objectId).toBe("a");
    });

    it("should handle ties by maintaining relative order (stable sort)", () => {
        const entries = [
            makeEntry("a", "First", 15),
            makeEntry("b", "Second", 15),
            makeEntry("c", "Third", 15),
        ];

        const sorted = sortInitiativeOrder(entries);

        // With equal initiative, order should be preserved
        expect(sorted[0].objectId).toBe("a");
        expect(sorted[1].objectId).toBe("b");
        expect(sorted[2].objectId).toBe("c");
    });
});

describe("rollInitiativeForCreatures", () => {
    it("should return sorted entries for multiple creatures", () => {
        const creatures = [
            makeCreature("a", "Goblin A"),
            makeCreature("b", "Goblin B"),
            makeCreature("c", "Goblin C"),
        ];

        const result = rollInitiativeForCreatures(creatures);

        expect(result).toHaveLength(3);
        // Verify sorted descending
        for (let i = 0; i < result.length - 1; i++) {
            expect(result[i].initiative).toBeGreaterThanOrEqual(result[i + 1].initiative);
        }
    });

    it("should apply modifiers correctly", () => {
        const creatures = [makeCreature("a", "Slow", -5), makeCreature("b", "Fast", 10)];

        // Run multiple times - fast creature should usually be first
        let fastFirstCount = 0;
        for (let i = 0; i < 50; i++) {
            const result = rollInitiativeForCreatures(creatures);
            if (result[0].objectId === "b") {
                fastFirstCount++;
            }
        }

        // With +10 vs -5 modifier, fast should be first most of the time
        expect(fastFirstCount).toBeGreaterThan(30);
    });

    it("should handle empty array", () => {
        const result = rollInitiativeForCreatures([]);
        expect(result).toEqual([]);
    });
});

describe("insertCreatureAtIndex", () => {
    it("should insert at beginning when index is 0", () => {
        const order = [makeEntry("a", "A", 20), makeEntry("b", "B", 15)];
        const newEntry = makeEntry("c", "C", 10);

        const result = insertCreatureAtIndex(order, newEntry, 0);

        expect(result).toHaveLength(3);
        expect(result[0].objectId).toBe("c");
        expect(result[1].objectId).toBe("a");
        expect(result[2].objectId).toBe("b");
    });

    it("should insert at end when index equals length", () => {
        const order = [makeEntry("a", "A", 20), makeEntry("b", "B", 15)];
        const newEntry = makeEntry("c", "C", 10);

        const result = insertCreatureAtIndex(order, newEntry, 2);

        expect(result).toHaveLength(3);
        expect(result[0].objectId).toBe("a");
        expect(result[1].objectId).toBe("b");
        expect(result[2].objectId).toBe("c");
    });

    it("should insert at middle", () => {
        const order = [makeEntry("a", "A", 20), makeEntry("b", "B", 15)];
        const newEntry = makeEntry("c", "C", 17);

        const result = insertCreatureAtIndex(order, newEntry, 1);

        expect(result).toHaveLength(3);
        expect(result[0].objectId).toBe("a");
        expect(result[1].objectId).toBe("c");
        expect(result[2].objectId).toBe("b");
    });

    it("should not mutate original array", () => {
        const order = [makeEntry("a", "A", 20)];
        const newEntry = makeEntry("b", "B", 10);

        insertCreatureAtIndex(order, newEntry, 0);

        expect(order).toHaveLength(1);
        expect(order[0].objectId).toBe("a");
    });

    it("should clamp negative index to 0", () => {
        const order = [makeEntry("a", "A", 20)];
        const newEntry = makeEntry("b", "B", 10);

        const result = insertCreatureAtIndex(order, newEntry, -5);

        expect(result[0].objectId).toBe("b");
    });

    it("should clamp index beyond length to end", () => {
        const order = [makeEntry("a", "A", 20)];
        const newEntry = makeEntry("b", "B", 10);

        const result = insertCreatureAtIndex(order, newEntry, 100);

        expect(result[result.length - 1].objectId).toBe("b");
    });

    it("should insert into empty array", () => {
        const newEntry = makeEntry("a", "A", 10);
        const result = insertCreatureAtIndex([], newEntry, 0);

        expect(result).toHaveLength(1);
        expect(result[0].objectId).toBe("a");
    });
});

describe("getNextTurnIndex", () => {
    it("should return next index", () => {
        expect(getNextTurnIndex(0, 5)).toBe(1);
        expect(getNextTurnIndex(2, 5)).toBe(3);
    });

    it("should wrap from last to first", () => {
        expect(getNextTurnIndex(4, 5)).toBe(0);
    });

    it("should handle single creature", () => {
        expect(getNextTurnIndex(0, 1)).toBe(0);
    });

    it("should handle empty order", () => {
        expect(getNextTurnIndex(0, 0)).toBe(0);
    });
});

describe("getPrevTurnIndex", () => {
    it("should return previous index", () => {
        expect(getPrevTurnIndex(2, 5)).toBe(1);
        expect(getPrevTurnIndex(4, 5)).toBe(3);
    });

    it("should wrap from first to last", () => {
        expect(getPrevTurnIndex(0, 5)).toBe(4);
    });

    it("should handle single creature", () => {
        expect(getPrevTurnIndex(0, 1)).toBe(0);
    });

    it("should handle empty order", () => {
        expect(getPrevTurnIndex(0, 0)).toBe(0);
    });
});

describe("findCreatureIndex", () => {
    it("should find creature by objectId", () => {
        const order = [makeEntry("a", "A", 20), makeEntry("b", "B", 15), makeEntry("c", "C", 10)];

        expect(findCreatureIndex(order, "a")).toBe(0);
        expect(findCreatureIndex(order, "b")).toBe(1);
        expect(findCreatureIndex(order, "c")).toBe(2);
    });

    it("should return -1 for not found", () => {
        const order = [makeEntry("a", "A", 20)];
        expect(findCreatureIndex(order, "not-found")).toBe(-1);
    });

    it("should return -1 for empty order", () => {
        expect(findCreatureIndex([], "any")).toBe(-1);
    });
});

describe("isCreatureInEncounter", () => {
    it("should return true for creature in encounter", () => {
        const order = [makeEntry("a", "A", 20), makeEntry("b", "B", 15)];

        expect(isCreatureInEncounter(order, "a")).toBe(true);
        expect(isCreatureInEncounter(order, "b")).toBe(true);
    });

    it("should return false for creature not in encounter", () => {
        const order = [makeEntry("a", "A", 20)];
        expect(isCreatureInEncounter(order, "not-in")).toBe(false);
    });

    it("should return false for empty order", () => {
        expect(isCreatureInEncounter([], "any")).toBe(false);
    });
});

describe("createEmptyCombatState", () => {
    it("should return empty combat state", () => {
        const state = createEmptyCombatState();

        expect(state.initiativeOrder).toEqual([]);
        expect(state.currentTurnIndex).toBe(0);
        expect(state.hasActiveEncounter).toBe(false);
        expect(state.pendingNextObjectId).toBeUndefined();
    });

    it("should return a new object each time", () => {
        const state1 = createEmptyCombatState();
        const state2 = createEmptyCombatState();

        expect(state1).not.toBe(state2);
        expect(state1.initiativeOrder).not.toBe(state2.initiativeOrder);
    });
});

// ============================================================================
// Integration-style Scenario Tests
// These tests simulate the state transitions that happen in MapView.svelte
// ============================================================================

describe("Encounter Flow Scenarios", () => {
    describe("Add creature to active encounter", () => {
        it("should insert at current turn index", () => {
            // Setup: Active encounter with 3 creatures, currently on creature B (index 1)
            const order = [
                makeEntry("a", "Creature A", 20),
                makeEntry("b", "Creature B", 15),
                makeEntry("c", "Creature C", 10),
            ];
            const currentTurnIndex = 1; // Creature B's turn

            // Action: Add new creature D
            const newEntry = makeEntry("d", "Creature D", 12);
            const newOrder = insertCreatureAtIndex(order, newEntry, currentTurnIndex);

            // Verify: D is inserted at index 1, B shifts to index 2
            expect(newOrder).toHaveLength(4);
            expect(newOrder[0].objectId).toBe("a");
            expect(newOrder[1].objectId).toBe("d"); // New creature at current turn
            expect(newOrder[2].objectId).toBe("b"); // Previous active shifted
            expect(newOrder[3].objectId).toBe("c");
        });

        it("should track pending next as previous active creature", () => {
            // Setup: Active encounter, currently on creature B (index 1)
            const order = [
                makeEntry("a", "Creature A", 20),
                makeEntry("b", "Creature B", 15),
                makeEntry("c", "Creature C", 10),
            ];
            const currentTurnIndex = 1;

            // Simulate the pendingNextObjectId logic from MapView
            const pendingNextObjectId = order[currentTurnIndex].objectId;

            expect(pendingNextObjectId).toBe("b");
        });
    });

    describe("Next turn with pendingNextObjectId", () => {
        it("should jump to pending creature instead of normal next", () => {
            // Setup: After adding a creature, we have pending next
            const order = [
                makeEntry("a", "Creature A", 20),
                makeEntry("d", "Creature D", 12), // Newly added, currently active
                makeEntry("b", "Creature B", 15),
                makeEntry("c", "Creature C", 10),
            ];
            const currentTurnIndex = 1; // D is active
            const pendingNextObjectId = "b"; // B was interrupted

            // Action: Find where to jump when "Next" is pressed
            const pendingIndex = findCreatureIndex(order, pendingNextObjectId);

            // Verify: Should jump to B at index 2, not normal next (C at index 3)
            expect(pendingIndex).toBe(2);
            expect(order[pendingIndex].name).toBe("Creature B");

            // Normal next would be index 2, but that's coincidental here
            // Let's verify with a different scenario where it matters
        });

        it("should differ from normal cycling when pending is set", () => {
            // Setup: Pending creature is NOT the normal next
            const order = [
                makeEntry("a", "Creature A", 20),
                makeEntry("d", "Creature D", 12), // Currently active (index 1)
                makeEntry("b", "Creature B", 15),
                makeEntry("e", "Creature E", 8), // This would be the creature we want to return to
                makeEntry("c", "Creature C", 10),
            ];
            const currentTurnIndex = 1; // D is active
            const pendingNextObjectId = "e"; // E was the one interrupted (maybe multiple adds happened)

            // Normal next would be:
            const normalNext = getNextTurnIndex(currentTurnIndex, order.length);
            expect(normalNext).toBe(2); // Would go to B

            // But with pending, we jump to E:
            const pendingIndex = findCreatureIndex(order, pendingNextObjectId);
            expect(pendingIndex).toBe(3); // Jump to E instead

            expect(normalNext).not.toBe(pendingIndex);
        });
    });

    describe("Multiple adds before Next", () => {
        it("should update pendingNextObjectId to most recent interrupted creature", () => {
            // Simulate multiple adds as they would happen in MapView

            // Initial state: A is active
            let order = [makeEntry("a", "Creature A", 20), makeEntry("b", "Creature B", 15)];
            let currentTurnIndex = 0;
            let pendingNextObjectId: string | undefined = undefined;

            // First add: Add C, A becomes pending
            pendingNextObjectId = order[currentTurnIndex].objectId; // "a"
            const newC = makeEntry("c", "Creature C", 18);
            order = insertCreatureAtIndex(order, newC, currentTurnIndex);
            // Now: [C, A, B], currentTurnIndex still 0, C is active

            expect(pendingNextObjectId).toBe("a");
            expect(order[0].objectId).toBe("c");

            // Second add: Add D, C becomes pending (overwrites A)
            pendingNextObjectId = order[currentTurnIndex].objectId; // Now "c"
            const newD = makeEntry("d", "Creature D", 17);
            order = insertCreatureAtIndex(order, newD, currentTurnIndex);
            // Now: [D, C, A, B], currentTurnIndex still 0, D is active

            expect(pendingNextObjectId).toBe("c");
            expect(order[0].objectId).toBe("d");

            // When Next is pressed, should go to C (index 1), not A
            const jumpToIndex = findCreatureIndex(order, pendingNextObjectId);
            expect(jumpToIndex).toBe(1);
            expect(order[jumpToIndex].objectId).toBe("c");
        });
    });

    describe("Clicking in-encounter creature", () => {
        it("should allow finding any creature by objectId to switch to", () => {
            const order = [
                makeEntry("a", "Creature A", 20),
                makeEntry("b", "Creature B", 15),
                makeEntry("c", "Creature C", 10),
            ];

            // Clicking on creature C should find it
            const clickedIndex = findCreatureIndex(order, "c");
            expect(clickedIndex).toBe(2);

            // This would be the new currentTurnIndex
            // And pendingNextObjectId would be cleared (set to undefined)
        });
    });

    describe("End encounter", () => {
        it("should reset to empty state", () => {
            const emptyState = createEmptyCombatState();

            expect(emptyState.initiativeOrder).toHaveLength(0);
            expect(emptyState.currentTurnIndex).toBe(0);
            expect(emptyState.hasActiveEncounter).toBe(false);
            expect(emptyState.pendingNextObjectId).toBeUndefined();
        });
    });
});

describe("Turn Cycling Edge Cases", () => {
    it("should handle cycling through entire order", () => {
        const orderLength = 5;
        let currentIndex = 0;

        // Cycle through entire order and back to start
        for (let i = 0; i < orderLength; i++) {
            expect(currentIndex).toBe(i);
            currentIndex = getNextTurnIndex(currentIndex, orderLength);
        }

        // Should be back at start
        expect(currentIndex).toBe(0);
    });

    it("should handle reverse cycling through entire order", () => {
        const orderLength = 5;
        let currentIndex = 0;

        // Go backwards through entire order
        for (let i = 0; i < orderLength; i++) {
            currentIndex = getPrevTurnIndex(currentIndex, orderLength);
        }

        // Should be back at start
        expect(currentIndex).toBe(0);
    });

    it("should handle rapid forward/backward cycling", () => {
        const orderLength = 4;
        let currentIndex = 1;

        // Go forward 2, back 1, forward 3, back 2
        currentIndex = getNextTurnIndex(currentIndex, orderLength); // 2
        currentIndex = getNextTurnIndex(currentIndex, orderLength); // 3
        currentIndex = getPrevTurnIndex(currentIndex, orderLength); // 2
        currentIndex = getNextTurnIndex(currentIndex, orderLength); // 3
        currentIndex = getNextTurnIndex(currentIndex, orderLength); // 0 (wrap)
        currentIndex = getNextTurnIndex(currentIndex, orderLength); // 1
        currentIndex = getPrevTurnIndex(currentIndex, orderLength); // 0
        currentIndex = getPrevTurnIndex(currentIndex, orderLength); // 3 (wrap back)

        expect(currentIndex).toBe(3);
    });
});
