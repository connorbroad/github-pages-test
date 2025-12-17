/**
 * Shared utility functions for dice roll adjustments
 */

/**
 * Adjust dice formula for advantage/disadvantage
 * If formula is simple (1dX) and resultOption is Maximum/Minimum, double dice count
 * @param diceFormula - Original dice formula (e.g., "1d20")
 * @param resultOption - How to calculate result
 * @returns Adjusted formula (e.g., "2d20" for advantage)
 */
export function adjustDiceRollForAdvantageOrDisadvantage(
    diceFormula: string,
    resultOption: "Sum" | "Maximum" | "Minimum"
): string {
    // If formula has modifiers, don't adjust
    if (diceFormula.includes("+") || diceFormula.includes("-")) {
        return diceFormula;
    }

    const match = diceFormula.match(/^(\d*)d(\d+)$/);
    if (match) {
        const numDice = parseInt(match[1] || "1", 10);
        const sides = parseInt(match[2], 10);
        // For single die with advantage/disadvantage, roll 2 dice
        if (numDice === 1 && (resultOption === "Maximum" || resultOption === "Minimum")) {
            return `2d${sides}`;
        }
    }
    return diceFormula;
}
