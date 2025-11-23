/**
 * Shared dice rolling logic and utilities
 */

export type ResultOption = "Sum" | "Maximum" | "Minimum" | "Subtract";

export interface DiceRollState {
    results: number[];
    finalResult: number | null;
    rolledNumSides: number;
    rolling: boolean;
    offsets: { x: number; y: number; r: number }[];
    endTimes: number[];
}

export interface AnimationConfig {
    ROLL_DURATION: number;
    INTERVAL_MIN: number;
    INTERVAL_MAX: number;
    DICE_MOVE_RANGE: number;
    DICE_ROTATE_RANGE: number;
    DICE_END_MIN: number;
    DICE_END_MAX: number;
}

export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
    ROLL_DURATION: 1000,
    INTERVAL_MIN: 20,
    INTERVAL_MAX: 150,
    DICE_MOVE_RANGE: 6,
    DICE_ROTATE_RANGE: 40,
    DICE_END_MIN: 0.5,
    DICE_END_MAX: 1.5,
};

/**
 * Calculate the final result based on the result option and modifier
 */
export function calculateResult(
    diceResults: number[],
    resultOption: ResultOption,
    modifier: number
): number | null {
    if (diceResults.length === 0) {
        return null;
    }

    switch (resultOption) {
        case "Sum":
            return diceResults.reduce((a, b) => a + b, 0) + modifier;
        case "Maximum":
            return Math.max(...diceResults) + modifier;
        case "Minimum":
            return Math.min(...diceResults) + modifier;
        case "Subtract":
            return diceResults.reduce((a, b) => a - b) + modifier;
    }
}

/**
 * Create a dice rolling animation manager
 */
export function createDiceRollerAnimation(
    numDice: number,
    numSides: number,
    config: AnimationConfig,
    onUpdate: (state: Partial<DiceRollState>) => void,
    onComplete: () => void
) {
    const endTimes = Array.from(
        { length: numDice },
        () =>
            config.ROLL_DURATION *
            (config.DICE_END_MIN + Math.random() * (config.DICE_END_MAX - config.DICE_END_MIN))
    );

    let elapsed = 0;
    let lastOffsets = Array(numDice)
        .fill(null)
        .map(() => ({ x: 0, y: 0, r: 0 }));

    function rollNewDice(
        currentElapsed: number,
        diceResults: number[]
    ): {
        results: number[];
        offsets: { x: number; y: number; r: number }[];
    } {
        const results = diceResults.length === numDice ? [...diceResults] : Array(numDice).fill(0);
        const offsets = [...lastOffsets];

        for (let i = 0; i < numDice; i++) {
            if (currentElapsed < endTimes[i]) {
                let newValue: number;
                do {
                    newValue = Math.floor(Math.random() * numSides) + 1;
                } while (newValue === results[i] && numSides > 1);
                results[i] = newValue;

                offsets[i] = {
                    x: Math.random() * config.DICE_MOVE_RANGE - config.DICE_MOVE_RANGE / 2,
                    y: Math.random() * config.DICE_MOVE_RANGE - config.DICE_MOVE_RANGE / 2,
                    r: Math.random() * config.DICE_ROTATE_RANGE - config.DICE_ROTATE_RANGE / 2,
                };
                lastOffsets[i] = offsets[i];
            }
        }

        return { results, offsets };
    }

    function animateRoll(currentResults: number[]) {
        const progress = Math.min(elapsed / config.ROLL_DURATION, 1);
        const interval =
            config.INTERVAL_MIN + (config.INTERVAL_MAX - config.INTERVAL_MIN) * progress;

        const { results, offsets } = rollNewDice(elapsed, currentResults);
        onUpdate({ results, offsets });

        elapsed += interval;

        if (elapsed < config.ROLL_DURATION * config.DICE_END_MAX) {
            setTimeout(() => animateRoll(results), interval);
        } else {
            const finalRoll = rollNewDice(config.ROLL_DURATION * config.DICE_END_MAX, results);
            onUpdate({
                results: finalRoll.results,
                offsets: finalRoll.offsets,
                rolling: false,
            });
            onComplete();
        }
    }

    return {
        start: (initialResults: number[]) => {
            onUpdate({ rolling: true, endTimes, rolledNumSides: numSides });
            animateRoll(initialResults);
        },
    };
}
