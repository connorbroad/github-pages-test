/**
 * Shared types and utilities for the Oracle system
 */

export type DiceRoll = {
    numDice: number;
    numSides: number;
    modifier: number;
    resultOption: "Sum" | "Maximum" | "Minimum" | "Subtract";
    showModifier?: boolean;
    diceSignificance?: { [key: number]: string };
};

export type CardDraw = {
    enabled: boolean;
};

export type Outcome = {
    diceRoll?: DiceRoll;
    cardDraw?: CardDraw;
    diceMapping?: { [key: number]: string };
    suitMapping?: { [key: string]: string };
    rankMapping?: { [key: string]: string };
};

export type Fortune = {
    id: string;
    campaign?: string;
    title: string;
    outcome: Outcome;
};

export type GameBlueprint = {
    id: string;
    title: string;
    defaultFortunes: Fortune[];
};

export const CARD_SUITS = ["♠", "♥", "♦", "♣"] as const;
export const CARD_RANKS = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
] as const;

/**
 * Generate a unique ID for a fortune
 */
export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Calculate all possible dice results based on dice configuration
 */
export function calculatePossibleDiceResults(diceRoll: DiceRoll): number[] {
    const { numDice, numSides, modifier, resultOption } = diceRoll;
    const minRoll = numDice * 1;
    const maxRoll = numDice * numSides;
    const results: number[] = [];

    for (let i = minRoll; i <= maxRoll; i++) {
        let finalValue = i;
        switch (resultOption) {
            case "Sum":
                finalValue = i + modifier;
                break;
            case "Maximum":
            case "Minimum":
                // For max/min, possible results are 1 to numSides + modifier
                if (i === minRoll) {
                    for (let j = 1; j <= numSides; j++) {
                        results.push(j + modifier);
                    }
                    return results;
                }
                break;
            case "Subtract":
                finalValue = i + modifier;
                break;
        }
        results.push(finalValue);
    }
    return [...new Set(results)].sort((a, b) => a - b);
}

/**
 * Draw a random card
 */
export function drawRandomCard(): { suit: string; rank: string } {
    const suit = CARD_SUITS[Math.floor(Math.random() * CARD_SUITS.length)];
    const rank = CARD_RANKS[Math.floor(Math.random() * CARD_RANKS.length)];
    return { suit, rank };
}

/**
 * Check if a suit is red (hearts or diamonds)
 */
export function isRedSuit(suit: string): boolean {
    return suit === "♥" || suit === "♦";
}
