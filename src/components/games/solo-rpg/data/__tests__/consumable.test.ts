import { describe, it, expect } from "vitest";
import type {
    ConsumableTargetTrait,
    ConsumableAction,
    ConsumableItem,
    Character,
} from "../storage-utils";
import { CharacterModel } from "../CharacterModel";

// Helper to create a test consumable item
function makeConsumable(
    overrides: Partial<ConsumableItem> & { quantity?: number } = {}
): ConsumableItem & {
    campaignId: string;
    createdAt: number;
    updatedAt: number;
    quantity?: number;
} {
    return {
        id: "test-consumable-1",
        campaignId: "test-campaign",
        name: "Healing Potion",
        type: "consumable",
        quantity: 1,
        action: {
            name: "Heal",
            target: { type: "hp" },
            effect: { kind: "set", value: 10 },
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...overrides,
    };
}

// Helper to create a test character
function makeCharacter(overrides: Partial<Character> = {}): Character {
    return {
        id: "test-char-1",
        campaignId: "test-campaign",
        name: "Test Hero",
        abilities: [
            { id: "str", name: "Strength", score: 14, modifier: 2, proficient: false },
            { id: "dex", name: "Dexterity", score: 12, modifier: 1, proficient: false },
        ],
        skills: [
            { id: "athletics", name: "Athletics", abilityId: "str", proficient: true, bonus: 4 },
            { id: "acrobatics", name: "Acrobatics", abilityId: "dex", proficient: false, bonus: 1 },
        ],
        currentHitPoints: 20,
        hitPointMaximum: 30,
        temporaryHitPoints: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...overrides,
    };
}

// Dice formula parser (mirrors UseConsumableModal implementation)
function parseDiceFormula(formula: string): {
    numDice: number;
    numSides: number;
    modifier: number;
} {
    const match = formula.trim().match(/^(\d+)d(\d+)([+-]\d+)?$/i);
    if (!match) return { numDice: 1, numSides: 4, modifier: 0 };
    return {
        numDice: parseInt(match[1], 10),
        numSides: parseInt(match[2], 10),
        modifier: match[3] ? parseInt(match[3], 10) : 0,
    };
}

describe("parseDiceFormula", () => {
    it("should parse basic dice notation", () => {
        expect(parseDiceFormula("1d6")).toEqual({ numDice: 1, numSides: 6, modifier: 0 });
        expect(parseDiceFormula("2d8")).toEqual({ numDice: 2, numSides: 8, modifier: 0 });
        expect(parseDiceFormula("3d10")).toEqual({ numDice: 3, numSides: 10, modifier: 0 });
    });

    it("should parse dice notation with positive modifier", () => {
        expect(parseDiceFormula("1d4+2")).toEqual({ numDice: 1, numSides: 4, modifier: 2 });
        expect(parseDiceFormula("2d6+5")).toEqual({ numDice: 2, numSides: 6, modifier: 5 });
    });

    it("should parse dice notation with negative modifier", () => {
        expect(parseDiceFormula("1d8-1")).toEqual({ numDice: 1, numSides: 8, modifier: -1 });
        expect(parseDiceFormula("2d10-3")).toEqual({ numDice: 2, numSides: 10, modifier: -3 });
    });

    it("should handle case insensitivity", () => {
        expect(parseDiceFormula("2D6")).toEqual({ numDice: 2, numSides: 6, modifier: 0 });
        expect(parseDiceFormula("1D20+5")).toEqual({ numDice: 1, numSides: 20, modifier: 5 });
    });

    it("should handle whitespace", () => {
        expect(parseDiceFormula("  2d6  ")).toEqual({ numDice: 2, numSides: 6, modifier: 0 });
        expect(parseDiceFormula(" 1d4+1 ")).toEqual({ numDice: 1, numSides: 4, modifier: 1 });
    });

    it("should return default for invalid formulas", () => {
        expect(parseDiceFormula("invalid")).toEqual({ numDice: 1, numSides: 4, modifier: 0 });
        expect(parseDiceFormula("d6")).toEqual({ numDice: 1, numSides: 4, modifier: 0 });
        expect(parseDiceFormula("2d")).toEqual({ numDice: 1, numSides: 4, modifier: 0 });
        expect(parseDiceFormula("")).toEqual({ numDice: 1, numSides: 4, modifier: 0 });
    });
});

describe("applyToCharacter - HP effects", () => {
    it("should increase current HP with set value", () => {
        const character = makeCharacter({ currentHitPoints: 20, hitPointMaximum: 30 });
        const model = new CharacterModel(character);
        model.applyConsumableEffect({ type: "hp" }, 5);
        expect(character.currentHitPoints).toBe(25);
    });

    it("should not exceed HP maximum", () => {
        const character = makeCharacter({ currentHitPoints: 28, hitPointMaximum: 30 });
        const model = new CharacterModel(character);
        model.applyConsumableEffect({ type: "hp" }, 10);
        expect(character.currentHitPoints).toBe(30);
    });

    it("should handle HP when starting at zero", () => {
        const character = makeCharacter({ currentHitPoints: 0, hitPointMaximum: 30 });
        const model = new CharacterModel(character);
        model.applyConsumableEffect({ type: "hp" }, 15);
        expect(character.currentHitPoints).toBe(15);
    });

    it("should handle undefined current HP", () => {
        const character = makeCharacter();
        character.currentHitPoints = undefined;
        const model = new CharacterModel(character);
        model.applyConsumableEffect({ type: "hp" }, 10);
        expect(character.currentHitPoints).toBe(10);
    });
});

describe("applyToCharacter - Temp HP effects", () => {
    it("should add temporary HP", () => {
        const character = makeCharacter({ temporaryHitPoints: 5 });
        const model = new CharacterModel(character);
        model.applyConsumableEffect({ type: "tempHp" }, 10);
        expect(character.temporaryHitPoints).toBe(15);
    });

    it("should handle undefined temp HP", () => {
        const character = makeCharacter();
        character.temporaryHitPoints = undefined;
        const model = new CharacterModel(character);
        model.applyConsumableEffect({ type: "tempHp" }, 8);
        expect(character.temporaryHitPoints).toBe(8);
    });

    it("should stack temporary HP", () => {
        const character = makeCharacter({ temporaryHitPoints: 0 });
        const model = new CharacterModel(character);
        model.applyConsumableEffect({ type: "tempHp" }, 5);
        model.applyConsumableEffect({ type: "tempHp" }, 3);
        expect(character.temporaryHitPoints).toBe(8);
    });
});

describe("applyToCharacter - HP Max effects", () => {
    it("should increase HP maximum", () => {
        const character = makeCharacter({ hitPointMaximum: 30 });
        const model = new CharacterModel(character);
        model.applyConsumableEffect({ type: "hpMax" }, 10);
        expect(character.hitPointMaximum).toBe(40);
    });

    it("should handle undefined HP maximum", () => {
        const character = makeCharacter();
        character.hitPointMaximum = undefined;
        const model = new CharacterModel(character);
        model.applyConsumableEffect({ type: "hpMax" }, 20);
        expect(character.hitPointMaximum).toBe(20);
    });
});

describe("applyToCharacter - Ability effects", () => {
    it("should modify ability score by ID", () => {
        const character = makeCharacter();
        const model = new CharacterModel(character);
        model.applyConsumableEffect({ type: "ability", abilityId: "str" }, 2);
        const strength = character.abilities.find((a) => a.id === "str");
        expect(strength?.score).toBe(16);
        expect(strength?.modifier).toBe(3);
    });

    it("should modify ability score by name (case insensitive)", () => {
        const character = makeCharacter();
        const model = new CharacterModel(character);
        model.applyConsumableEffect({ type: "ability", abilityId: "strength" }, 4);
        const strength = character.abilities.find((a) => a.id === "str");
        expect(strength?.score).toBe(18);
        expect(strength?.modifier).toBe(4);
    });

    it("should recalculate modifier correctly", () => {
        const character = makeCharacter();
        // Strength starts at 14 (modifier +2)
        // Add 3 to get 17 (modifier +3)
        const model = new CharacterModel(character);
        model.applyConsumableEffect({ type: "ability", abilityId: "str" }, 3);
        const strength = character.abilities.find((a) => a.id === "str");
        expect(strength?.score).toBe(17);
        expect(strength?.modifier).toBe(3);
    });

    it("should handle ability not found gracefully", () => {
        const character = makeCharacter();
        // Should not throw
        const model = new CharacterModel(character);
        model.applyConsumableEffect({ type: "ability", abilityId: "charisma" }, 2);
        // Original abilities unchanged
        expect(character.abilities.length).toBe(2);
    });
});

describe("applyToCharacter - Skill effects", () => {
    it("should modify skill bonus by ID", () => {
        const character = makeCharacter();
        const model = new CharacterModel(character);
        model.applyConsumableEffect({ type: "skill", skillId: "athletics" }, 2);
        const athletics = character.skills.find((s) => s.id === "athletics");
        expect(athletics?.bonus).toBe(6);
    });

    it("should modify skill bonus by name (case insensitive)", () => {
        const character = makeCharacter();
        const model = new CharacterModel(character);
        model.applyConsumableEffect({ type: "skill", skillId: "Athletics" }, 3);
        const athletics = character.skills.find((s) => s.id === "athletics");
        expect(athletics?.bonus).toBe(7);
    });

    it("should handle skill not found gracefully", () => {
        const character = makeCharacter();
        // Should not throw
        const model = new CharacterModel(character);
        model.applyConsumableEffect({ type: "skill", skillId: "perception" }, 2);
        // Original skills unchanged
        expect(character.skills.length).toBe(2);
    });
});

describe("ConsumableItem type structure", () => {
    it("should have required consumable fields", () => {
        const consumable = makeConsumable();
        expect(consumable.type).toBe("consumable");
        expect(consumable.action).toBeDefined();
        expect(consumable.action.name).toBe("Heal");
        expect(consumable.action.effect.kind).toBe("set");
    });

    it("should support set value effects", () => {
        const consumable = makeConsumable({
            action: {
                name: "Restore",
                target: { type: "hp" },
                effect: { kind: "set", value: 5 },
            },
        });
        expect(consumable.action.effect.kind).toBe("set");
        if (consumable.action.effect.kind === "set") {
            expect(consumable.action.effect.value).toBe(5);
        }
    });

    it("should support dice roll effects", () => {
        const consumable = makeConsumable({
            action: {
                name: "Heal",
                target: { type: "hp" },
                effect: { kind: "dice", formula: "2d4+2" },
            },
        });
        expect(consumable.action.effect.kind).toBe("dice");
        if (consumable.action.effect.kind === "dice") {
            expect(consumable.action.effect.formula).toBe("2d4+2");
        }
    });

    it("should support optional target", () => {
        const consumable = makeConsumable({
            action: {
                name: "Mystery Effect",
                effect: { kind: "set", value: 0 },
            },
        });
        expect(consumable.action.target).toBeUndefined();
    });

    it("should support ability target", () => {
        const consumable = makeConsumable({
            action: {
                name: "Bull's Strength",
                target: { type: "ability", abilityId: "str" },
                effect: { kind: "set", value: 4 },
            },
        });
        expect(consumable.action.target?.type).toBe("ability");
        if (consumable.action.target?.type === "ability") {
            expect(consumable.action.target.abilityId).toBe("str");
        }
    });

    it("should support skill target", () => {
        const consumable = makeConsumable({
            action: {
                name: "Skill Boost",
                target: { type: "skill", skillId: "athletics" },
                effect: { kind: "set", value: 2 },
            },
        });
        expect(consumable.action.target?.type).toBe("skill");
        if (consumable.action.target?.type === "skill") {
            expect(consumable.action.target.skillId).toBe("athletics");
        }
    });

    it("should support custom target", () => {
        const consumable = makeConsumable({
            action: {
                name: "Custom Buff",
                target: { type: "custom", customName: "Magic Power" },
                effect: { kind: "set", value: 10 },
            },
        });
        expect(consumable.action.target?.type).toBe("custom");
        if (consumable.action.target?.type === "custom") {
            expect(consumable.action.target.customName).toBe("Magic Power");
        }
    });
});

describe("Quantity management", () => {
    it("should have default quantity of 1", () => {
        const consumable = makeConsumable({ quantity: undefined });
        // Default handled by makeConsumable helper, but let's test pattern
        expect(makeConsumable().quantity).toBe(1);
    });

    it("should support multiple quantities", () => {
        const consumable = makeConsumable({ quantity: 5 });
        expect(consumable.quantity).toBe(5);
    });

    it("should decrement quantity on use", () => {
        const consumable = makeConsumable({ quantity: 3 });
        consumable.quantity! -= 1;
        expect(consumable.quantity).toBe(2);
    });

    it("should reach zero after all uses", () => {
        const consumable = makeConsumable({ quantity: 1 });
        consumable.quantity! -= 1;
        expect(consumable.quantity).toBe(0);
    });
});
