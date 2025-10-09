<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import DiceDisplay from "./components/DiceDisplay.svelte";
    import {
        type ResultOption,
        calculateResult,
        createDiceRollerAnimation,
        DEFAULT_ANIMATION_CONFIG,
    } from "./scripts/diceRollerLogic";

    // Props for embedded mode
    export let numDice = 1;
    export let numSides = 20;
    export let modifier = 0;
    export let resultOption: ResultOption = "Sum";
    export let onResult: ((result: number) => void) | null = null;
    export let showModifier = true;

    const dispatch = createEventDispatcher();
    $: dispatch("rollingChange", rolling);
    $: dispatch("hasRolledChange", hasRolled);
    $: dispatch("diceResults", diceResults);

    let diceResults: number[] = [];
    let finalResult: number | null = null;
    let rolledNumSides = numSides;
    let rolling = false;
    let hasRolled = false;
    let diceOffsets: { x: number; y: number; r: number }[] = [];
 


    function onRollButtonClick() {
        hasRolled = true;
        const animation = createDiceRollerAnimation(
            numDice,
            numSides,
            DEFAULT_ANIMATION_CONFIG,
            (state) => {
                if (state.results !== undefined) diceResults = state.results;
                if (state.offsets !== undefined) diceOffsets = state.offsets;
                if (state.rolling !== undefined) rolling = state.rolling;
                if (state.rolledNumSides !== undefined)
                    rolledNumSides = state.rolledNumSides;
            },
            () => {
                recalculateResult();
                if (finalResult !== null) {
                    dispatch("result", finalResult);
                    if (onResult) {
                        onResult(finalResult);
                    }
                }
            },
        );
        animation.start(diceResults);
    }

    function recalculateResult() {
        const effectiveModifier = showModifier ? modifier : 0;
        finalResult = calculateResult(
            diceResults,
            resultOption,
            effectiveModifier,
        );
    }

    $: recalculateResult(); // reactive statement to update result when dependencies change
</script>

<div class="dice-roller-embed">
    <DiceDisplay
        {numDice}
        {numSides}
        {diceResults}
        {diceOffsets}
        {rolledNumSides}
    />
    {#if showModifier}
        <div class="modifier-input-group" style="margin-bottom: 0.5rem;">
            <label for="dice-modifier">Modifier:</label>
            <select
                id="dice-modifier"
                class="modifier-select"
                bind:value={modifier}
                on:change={() => {
                    recalculateResult();
                    dispatch("modifierChange", modifier);
                }}
            >
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
    {/if}

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
                aria-label="Reroll dice">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width='1em' height='1em' {...$$props}><path fill="currentColor" d="M0 224c0 17.7 14.3 32 32 32s32-14.3 32-32c0-53 43-96 96-96h160v32c0 12.9 7.8 24.6 19.8 29.6s25.7 2.2 34.9-6.9l64-64c12.5-12.5 12.5-32.8 0-45.3l-64-64c-9.2-9.2-22.9-11.9-34.9-6.9S320 19.1 320 32v32H160C71.6 64 0 135.6 0 224m512 64c0-17.7-14.3-32-32-32s-32 14.3-32 32c0 53-43 96-96 96H192v-32c0-12.9-7.8-24.6-19.8-29.6s-25.7-2.2-34.9 6.9l-64 64c-12.5 12.5-12.5 32.8 0 45.3l64 64c9.2 9.2 22.9 11.9 34.9 6.9s19.8-16.6 19.8-29.6v-32h160c88.4 0 160-71.6 160-160z"/></svg>
            </button>
        </div>
    {:else}
        <button
            class="dice-roller-button"
            on:click={onRollButtonClick}
            disabled={rolling}>Roll</button
        >
    {/if}
</div>

<style>
    .dice-roller-embed {
        width: 100%;
    }

    .dice-roller-button {
        width: 100%;
        padding: 0.75rem 0;
        font-size: 1.1rem;
        border-radius: 6px;
        border: none;
        margin: 0.5rem 0;
        margin-bottom: 0;
        background: #1976d2;
        color: #fff;
        cursor: pointer;
        transition: background 0.2s;
    }

    .dice-roller-button:active {
        background: #115293;
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
        padding: 0.5rem;
        font-size: 1rem;
        border-radius: 6px;
        border: none;
        background: #1976d2;
        color: #fff;
        cursor: pointer;
        transition: background 0.2s;

        display: flex;
        align-items: center;
        justify-content: center;
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
