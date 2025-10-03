<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    // Props for embedded mode
    export let numDice = 1;
    export let numSides = 20;
    export let modifier = 0;
    export let resultOption: "Sum" | "Maximum" | "Minimum" | "Subtract" = "Sum";
    export let onResult: ((result: number) => void) | null = null;

    const dispatch = createEventDispatcher();

    let diceResults: number[] = [];
    let finalResult: number | null = null;
    let rolledNumSides = numSides;
    let rolling = false;
    let hasRolled = false;
    let diceOffsets: { x: number; y: number; r: number }[] = [];
    let diceEndTimes: number[] = [];

    // Animation config
    const ROLL_DURATION = 1000; // ms
    const INTERVAL_MIN = 20; // ms
    const INTERVAL_MAX = 150; // ms
    const DICE_MOVE_RANGE = 6; // px
    const DICE_ROTATE_RANGE = 40; // deg, total range (-range/2 to +range/2)
    const DICE_END_MIN = 0.5; // fraction of duration
    const DICE_END_MAX = 1.5; // fraction of duration

    function onRollButtonClick() {
        rolledNumSides = numSides;
        rolling = true;
        hasRolled = true;
        let elapsed = 0;
        diceEndTimes = Array.from(
            { length: numDice },
            () =>
                ROLL_DURATION *
                (DICE_END_MIN + Math.random() * (DICE_END_MAX - DICE_END_MIN)),
        );

        function animateRoll() {
            const progress = Math.min(elapsed / ROLL_DURATION, 1);
            const interval =
                INTERVAL_MIN + (INTERVAL_MAX - INTERVAL_MIN) * progress;
            rollNewDice(elapsed);
            elapsed += interval;
            if (elapsed < ROLL_DURATION * DICE_END_MAX) {
                // allow for longest dice
                setTimeout(animateRoll, interval);
            } else {
                rolling = false;
                rollNewDice(ROLL_DURATION * DICE_END_MAX); // final roll
                recalculateResult();
                if (finalResult !== null) {
                    dispatch('result', finalResult);
                    if (onResult) {
                        onResult(finalResult);
                    }
                }
            }
        }
        animateRoll();
    }

    function rollNewDice(currentElapsed?: number) {
        diceResults =
            diceResults.length === numDice
                ? [...diceResults]
                : Array(numDice).fill(0);
        if (rolling) {
            diceOffsets =
                diceOffsets.length === numDice
                    ? [...diceOffsets]
                    : Array(numDice).fill({ x: 0, y: 0, r: 0 });
            for (let i = 0; i < numDice; i++) {
                if (!currentElapsed || currentElapsed < diceEndTimes[i]) {
                    let newValue: number;
                    do {
                        newValue = Math.floor(Math.random() * numSides) + 1;
                    } while (newValue === diceResults[i] && numSides > 1); // ensure value always changes during animation
                    diceResults[i] = newValue;

                    diceOffsets[i] = {
                        x:
                            Math.random() * DICE_MOVE_RANGE -
                            DICE_MOVE_RANGE / 2,
                        y:
                            Math.random() * DICE_MOVE_RANGE -
                            DICE_MOVE_RANGE / 2,
                        r:
                            Math.random() * DICE_ROTATE_RANGE -
                            DICE_ROTATE_RANGE / 2,
                    };
                }
            }
        }
    }

    function recalculateResult() {
        if (diceResults.length === 0) {
            finalResult = null;
            return;
        }
        switch (resultOption) {
            case "Sum":
                finalResult = diceResults.reduce((a, b) => a + b, 0) + modifier;
                break;
            case "Maximum":
                finalResult = Math.max(...diceResults) + modifier;
                break;
            case "Minimum":
                finalResult = Math.min(...diceResults) + modifier;
                break;
            case "Subtract":
                finalResult = diceResults.reduce((a, b) => a - b) + modifier;
                break;
        }
    }

    $: recalculateResult(); // reactive statement to update result when dependencies change
</script>

<div class="dice-roller-embed">
    <div class="dice-results">
        <div class="dice-result-list">
            {#if diceResults.length > 0}
                {#each diceResults as result, i}
                    <span class="dice-result-item">
                        <span class="dice-icon-wrap">
                            <span
                                style="display: inline-block; width: 64px; height: 64px; position: relative; transform: translate({diceOffsets[
                                    i
                                ]?.x || 0}px, {diceOffsets[i]?.y ||
                                    0}px) rotate({diceOffsets[i]?.r ||
                                    0}deg); transition: transform 0.1s;"
                            >
                                {#if rolledNumSides === 4}
                                    <!-- D4: triangle -->
                                    <svg
                                        class="dice-icon"
                                        viewBox="0 0 32 32"
                                        width="32"
                                        height="32"
                                        aria-hidden="true"
                                    >
                                        <polygon
                                            points="16,4 28,24 4,24"
                                            fill="#f8f8f8"
                                            stroke="#ccc"
                                            stroke-width="2"
                                        />
                                    </svg>
                                {:else if rolledNumSides === 6}
                                    <!-- D6: square -->
                                    <svg
                                        class="dice-icon"
                                        viewBox="0 0 32 32"
                                        width="32"
                                        height="32"
                                        aria-hidden="true"
                                    >
                                        <polygon
                                            points="16,4 28,16 16,28 4,16"
                                            fill="#f8f8f8"
                                            stroke="#ccc"
                                            stroke-width="2"
                                        />
                                    </svg>
                                {:else if rolledNumSides === 8}
                                    <!-- D8: diamond -->
                                    <svg
                                        class="dice-icon"
                                        viewBox="0 0 32 32"
                                        width="32"
                                        height="32"
                                        aria-hidden="true"
                                    >
                                        <polygon
                                            points="16,2 24,16 16,30 8,16"
                                            fill="#f8f8f8"
                                            stroke="#ccc"
                                            stroke-width="2"
                                        />
                                    </svg>
                                {:else if rolledNumSides === 10}
                                    <!-- D10: pentagon -->
                                    <svg
                                        class="dice-icon"
                                        viewBox="0 0 32 32"
                                        width="32"
                                        height="32"
                                        aria-hidden="true"
                                    >
                                        <polygon
                                            points="16,4 28,14 28,18 16,28 4,18 4,14"
                                            fill="#f8f8f8"
                                            stroke="#ccc"
                                            stroke-width="2"
                                        />
                                    </svg>
                                {:else if rolledNumSides === 12}
                                    <!-- D12: hexagon -->
                                    <svg
                                        class="dice-icon"
                                        viewBox="0 0 32 32"
                                        width="32"
                                        height="32"
                                        aria-hidden="true"
                                    >
                                        <polygon
                                            points="16,4 27.4,12.3 23.6,26.7 8.4,26.7 4.6,12.3"
                                            fill="#f8f8f8"
                                            stroke="#ccc"
                                            stroke-width="2"
                                        />
                                    </svg>
                                {:else if rolledNumSides === 20}
                                    <!-- D20: icosahedron (simplified as circle) -->
                                    <svg
                                        class="dice-icon"
                                        viewBox="0 0 32 32"
                                        width="32"
                                        height="32"
                                        aria-hidden="true"
                                    >
                                        <polygon
                                            points="16,2 28,9 28,23 16,30 4,23 4,9"
                                            fill="#f8f8f8"
                                            stroke="#ccc"
                                            stroke-width="2"
                                        />
                                    </svg>
                                {:else if rolledNumSides === 100}
                                    <!-- D100: double circle -->
                                    <svg
                                        class="dice-icon"
                                        viewBox="0 0 32 32"
                                        width="32"
                                        height="32"
                                        aria-hidden="true"
                                    >
                                        <polygon
                                            points="16,2.5 21.0,3.8 25.1,6.8 28.1,10.9 29.5,16 28.1,21.1 25.1,25.2 21.0,28.2 16,29.5 11.0,28.2 6.9,25.2 3.9,21.1 2.5,16 3.9,10.9 6.9,6.8 11.0,3.8"
                                            fill="#f8f8f8"
                                            stroke="#ccc"
                                            stroke-width="2"
                                        />
                                    </svg>
                                {:else}
                                    <!-- Default: square -->
                                    <svg
                                        class="dice-icon"
                                        viewBox="0 0 32 32"
                                        width="32"
                                        height="32"
                                        aria-hidden="true"
                                    >
                                        <rect
                                            x="4"
                                            y="4"
                                            width="24"
                                            height="24"
                                            rx="6"
                                            fill="#f8f8f8"
                                            stroke="#ccc"
                                            stroke-width="2"
                                        />
                                    </svg>
                                {/if}
                                <span class="dice-number">{result}</span>
                            </span>
                        </span>
                    </span>
                {/each}
            {:else}
                {#each Array(numDice) as _, i}
                    <span class="dice-result-item">
                        <span class="dice-icon-wrap">
                            <span
                                style="display: inline-block; width: 64px; height: 64px; position: relative;"
                            >
                                {#if numSides === 4}
                                    <!-- D4: triangle -->
                                    <svg
                                        class="dice-icon"
                                        viewBox="0 0 32 32"
                                        width="32"
                                        height="32"
                                        aria-hidden="true"
                                    >
                                        <polygon
                                            points="16,4 28,24 4,24"
                                            fill="#f8f8f8"
                                            stroke="#ccc"
                                            stroke-width="2"
                                        />
                                    </svg>
                                {:else if numSides === 6}
                                    <!-- D6: square -->
                                    <svg
                                        class="dice-icon"
                                        viewBox="0 0 32 32"
                                        width="32"
                                        height="32"
                                        aria-hidden="true"
                                    >
                                        <polygon
                                            points="16,4 28,16 16,28 4,16"
                                            fill="#f8f8f8"
                                            stroke="#ccc"
                                            stroke-width="2"
                                        />
                                    </svg>
                                {:else if numSides === 8}
                                    <!-- D8: diamond -->
                                    <svg
                                        class="dice-icon"
                                        viewBox="0 0 32 32"
                                        width="32"
                                        height="32"
                                        aria-hidden="true"
                                    >
                                        <polygon
                                            points="16,2 24,16 16,30 8,16"
                                            fill="#f8f8f8"
                                            stroke="#ccc"
                                            stroke-width="2"
                                        />
                                    </svg>
                                {:else if numSides === 10}
                                    <!-- D10: pentagon -->
                                    <svg
                                        class="dice-icon"
                                        viewBox="0 0 32 32"
                                        width="32"
                                        height="32"
                                        aria-hidden="true"
                                    >
                                        <polygon
                                            points="16,4 28,14 28,18 16,28 4,18 4,14"
                                            fill="#f8f8f8"
                                            stroke="#ccc"
                                            stroke-width="2"
                                        />
                                    </svg>
                                {:else if numSides === 12}
                                    <!-- D12: hexagon -->
                                    <svg
                                        class="dice-icon"
                                        viewBox="0 0 32 32"
                                        width="32"
                                        height="32"
                                        aria-hidden="true"
                                    >
                                        <polygon
                                            points="16,4 27.4,12.3 23.6,26.7 8.4,26.7 4.6,12.3"
                                            fill="#f8f8f8"
                                            stroke="#ccc"
                                            stroke-width="2"
                                        />
                                    </svg>
                                {:else if numSides === 20}
                                    <!-- D20: icosahedron (simplified as circle) -->
                                    <svg
                                        class="dice-icon"
                                        viewBox="0 0 32 32"
                                        width="32"
                                        height="32"
                                        aria-hidden="true"
                                    >
                                        <polygon
                                            points="16,2 28,9 28,23 16,30 4,23 4,9"
                                            fill="#f8f8f8"
                                            stroke="#ccc"
                                            stroke-width="2"
                                        />
                                    </svg>
                                {:else if numSides === 100}
                                    <!-- D100: double circle -->
                                    <svg
                                        class="dice-icon"
                                        viewBox="0 0 32 32"
                                        width="32"
                                        height="32"
                                        aria-hidden="true"
                                    >
                                        <polygon
                                            points="16,2.5 21.0,3.8 25.1,6.8 28.1,10.9 29.5,16 28.1,21.1 25.1,25.2 21.0,28.2 16,29.5 11.0,28.2 6.9,25.2 3.9,21.1 2.5,16 3.9,10.9 6.9,6.8 11.0,3.8"
                                            fill="#f8f8f8"
                                            stroke="#ccc"
                                            stroke-width="2"
                                        />
                                    </svg>
                                {:else}
                                    <!-- Default: square -->
                                    <svg
                                        class="dice-icon"
                                        viewBox="0 0 32 32"
                                        width="32"
                                        height="32"
                                        aria-hidden="true"
                                    >
                                        <rect
                                            x="4"
                                            y="4"
                                            width="24"
                                            height="24"
                                            rx="6"
                                            fill="#f8f8f8"
                                            stroke="#ccc"
                                            stroke-width="2"
                                        />
                                    </svg>
                                {/if}
                                <span class="dice-number">{numSides}</span>
                            </span>
                        </span>
                    </span>
                {/each}
            {/if}
        </div>
    </div>

    <div class="modifier-input-group" style="margin-bottom: 0.5rem;">
        <label for="dice-modifier">Modifier:</label>
        <select id="dice-modifier" class="modifier-select" bind:value={modifier} on:change={(e) => dispatch('modifierChange', +(e.target as HTMLSelectElement).value)}>
            {#each Array(16) as _, i}
                {#if i - 5 > 0}
                    <option value={i - 5}>+{i - 5}</option>
                {:else if i - 5 === 0}
                    <option value={i - 5}>0</option>
                {:else}
                    <option value={i - 5}>{i - 5}</option>
                {/if}
            {/each}
        </select>
    </div>

    {#if hasRolled}
        <div class="embed-result-row">
            <div class="embed-result">
                {#if finalResult !== null && !rolling}
                    <strong>Result: {finalResult}</strong>
                {:else if rolling}
                    Result: ...
                {:else}
                    <em>Result: ...</em>
                {/if}
            </div>
            <button
                class="dice-roller-reroll"
                on:click={onRollButtonClick}
                disabled={rolling}
                aria-label="Reroll dice"
            >Re-roll</button>
        </div>
    {:else}
        <button
            class="dice-roller-button"
            on:click={onRollButtonClick}
            disabled={rolling}>Roll</button>
    {/if}
</div>

<style>
    .dice-roller-embed {
        width: 100%;
    }

    .dice-results {
        margin-top: 1rem;
    }

    .dice-result-list {
        display: flex;
        gap: 0rem;
        justify-content: center;
        flex-wrap: wrap;
        margin-bottom: 1rem;
    }

    .dice-result-item {
        display: flex;
        align-items: center;
        position: relative;
        font-size: 1.3rem;
    }

    .dice-icon-wrap {
        position: relative;
        width: 64px;
        height: 64px;
        display: inline-block;
    }

    .dice-icon {
        position: absolute;
        left: 0;
        top: 0;
        width: 64px;
        height: 64px;
        z-index: 0;
        opacity: 0.3;
    }

    .dice-number {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: 1;
        font-weight: bold;
        color: #1976d2;
        font-size: 1.2rem;
        pointer-events: none;
    }

    .dice-roller-button {
        width: 100%;
        padding: 0.75rem 0;
        font-size: 1.1rem;
        border-radius: 6px;
        border: none;
        margin: 0.5rem 0;
        margin-bottom: 0;
        background: #ff9800;
        color: #fff;
        cursor: pointer;
        transition: background 0.2s;
    }

    .dice-roller-button:active {
        background: #f57c00;
    }

    .dice-roller-button:disabled {
        background: #ccc;
        color: #666;
        cursor: not-allowed;
    }

    .embed-result {
        text-align: center; 
        padding: 0.75rem;
        border-radius: 4px;
        font-size: 1.1rem;
    }

    .embed-result strong {
        color: #1976d2;
    }

    .embed-result-row {
        display: flex;
        align-items: center;
        justify-content: center; 
    }

    .dice-roller-reroll {
        padding: 0.5rem 0.8rem;
        font-size: 1rem;
        border-radius: 6px;
        border: none;
        background: #1976d2;
        color: #fff;
        cursor: pointer;
        transition: background 0.2s;
    }

    .dice-roller-reroll:active {
        background: #115293;
    }

    .dice-roller-reroll:disabled {
        background: #ccc;
        color: #666;
        cursor: not-allowed;
    }

    .modifier-input-group {
        margin-bottom: 0.5rem;
    }

    .modifier-select { 
        padding: 0.5rem;
        font-size: 1rem;
        border-radius: 4px;
        border: 1px solid #ccc;
        background: #fff;
        color: #333;
        cursor: pointer;
        transition: border-color 0.2s;
    }

    .modifier-select:focus {
        outline: none;
        border-color: #1976d2;
    }
</style>
