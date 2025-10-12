<script lang="ts">
    import { slide } from "svelte/transition";
    import DiceDisplay from "./components/DiceDisplay.svelte";
    import ResultOptionIcon from "./components/ResultOptionIcon.svelte";
    import {
        type ResultOption,
        calculateResult,
        createDiceRollerAnimation,
        DEFAULT_ANIMATION_CONFIG,
    } from "./scripts/diceRollerLogic";
    import SrpgModal from "../../../shared/modal/SrpgModal.svelte";
    import "../../../solo-rpg-styles.css";

    export let show = false;
    export let onClose: () => void;

    let numDice = 1;
    let numSides = 20;
    let modifier = 0;
    let resultOption: ResultOption = "Sum";
    let diceResults: number[] = [];
    let finalResult: number | null = null;
    let rolledNumSides = numSides;
    let rolling = false;
    let diceOffsets: { x: number; y: number; r: number }[] = [];
    let showResultCalculator = true;

    function onRollButtonClick() {
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
            },
        );
        animation.start(diceResults);
    }

    function recalculateResult() {
        finalResult = calculateResult(diceResults, resultOption, modifier);
    }

    function onClickTakeResult() {
        modifier = 0;
        diceResults = [];
        finalResult = null;
        rolling = false;
        diceOffsets = [];

        onClose();
    }

    $: recalculateResult();
</script>

{#if show}
    <SrpgModal {show} ariaLabel="Close dice roller" on:close={onClose}>
        <h2>Dice Roller</h2>
        <DiceDisplay
            {numDice}
            {numSides}
            {diceResults}
            {diceOffsets}
            {rolledNumSides}
        />
        <hr class="dice-roller-divider" />
        <div id="dice-options">
            <div class="dice-options-select">
                <select bind:value={numDice}>
                    {#each Array(10) as _, i}
                        <option value={i + 1}>{i + 1}x</option>
                    {/each}
                </select>
            </div>
            <div class="dice-options-select">
                <select bind:value={numSides}>
                    <option value={4}>D4</option>
                    <option value={6} selected>D6</option>
                    <option value={8}>D8</option>
                    <option value={10}>D10</option>
                    <option value={12}>D12</option>
                    <option value={20}>D20</option>
                    <option value={100}>D100</option>
                </select>
            </div>
        </div>
        <button
            class="srpg-b srpg-b-normal srpg-b-w-full"
            on:click={onRollButtonClick}>Roll</button
        >
        {#if showResultCalculator}
            <div class="result-calculator-container" transition:slide>
                <hr class="dice-roller-divider" />

                <div id="result-options">
                    <div class="result-radio-group">
                        <label class="result-radio" aria-label="Sum">
                            <input
                                type="radio"
                                name="resultOption"
                                value="Sum"
                                disabled={(diceResults.length == 0 &&
                                    numDice == 1) ||
                                    (numDice == 1 && diceResults.length == 1)}
                                bind:group={resultOption}
                                on:change={recalculateResult}
                            />
                            <span class="result-icon">
                                <ResultOptionIcon option="Sum" size="1em" />
                            </span>
                        </label>
                        <label class="result-radio" aria-label="Maximum">
                            <input
                                type="radio"
                                name="resultOption"
                                value="Maximum"
                                disabled={(diceResults.length == 0 &&
                                    numDice == 1) ||
                                    (numDice == 1 && diceResults.length == 1)}
                                bind:group={resultOption}
                                on:change={recalculateResult}
                            />
                            <span class="result-icon">
                                <ResultOptionIcon option="Maximum" size="1em" />
                            </span>
                        </label>
                        <label class="result-radio" aria-label="Minimum">
                            <input
                                type="radio"
                                name="resultOption"
                                value="Minimum"
                                disabled={(diceResults.length == 0 &&
                                    numDice == 1) ||
                                    (numDice == 1 && diceResults.length == 1)}
                                bind:group={resultOption}
                                on:change={recalculateResult}
                            />
                            <span class="result-icon">
                                <ResultOptionIcon option="Minimum" size="1em" />
                            </span>
                        </label>
                        <label class="result-radio" aria-label="Subtract">
                            <input
                                type="radio"
                                name="resultOption"
                                value="Subtract"
                                disabled={(diceResults.length == 0 &&
                                    numDice == 1) ||
                                    (numDice == 1 && diceResults.length == 1)}
                                bind:group={resultOption}
                                on:change={recalculateResult}
                            />
                            <span class="result-icon">
                                <ResultOptionIcon
                                    option="Subtract"
                                    size="1em"
                                />
                            </span>
                        </label>
                    </div>
                    <div class="dice-options-select">
                        <select
                            bind:value={modifier}
                            on:change={recalculateResult}
                        >
                            {#each Array(16) as _, i}
                                {#if i - 5 > -1}
                                    <option value={i - 5}>+{i - 5}</option>
                                {:else if i - 5 === 0}
                                    <option value={i - 5}>0</option>
                                {:else}
                                    <option value={i - 5}>{i - 5}</option>
                                {/if}
                            {/each}
                        </select>
                    </div>
                </div>

                <button
                    id="take-result-button"
                    class="srpg-b srpg-b-create srpg-b-w-full"
                    on:click={onClickTakeResult}
                    disabled={diceResults.length === 0 ||
                        finalResult === null ||
                        rolling}
                >
                    {#if diceResults.length > 1 && !rolling}
                        <div
                            id="result-option-indicator"
                            aria-live="polite"
                            style="position: absolute; left: 0.5rem; right: auto;"
                        >
                            <span class="result-icon">
                                <ResultOptionIcon
                                    option={resultOption}
                                    size="1em"
                                />
                            </span>
                        </div>
                    {/if}
                    <p>
                        Record fate:
                        {rolling ? "..." : finalResult || "..."}
                    </p>
                    {#if diceResults.length > 1 && !rolling}
                        <div
                            id="result-option-indicator"
                            aria-live="polite"
                            style="position: absolute; right: 0.5rem; left: auto;"
                        >
                            <span class="result-icon">
                                <ResultOptionIcon
                                    option={resultOption}
                                    size="1em"
                                />
                            </span>
                        </div>
                    {/if}
                </button>
            </div>
        {/if}
    </SrpgModal>
{/if}

<style>
    #dice-options {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        margin: 1rem;
    }
    .dice-options-select select {
        padding: 0.75rem 1rem;
        font-size: 1.25rem;
        border-radius: 6px;
        border: 1px solid #ccc;
        margin: 0;
        background: #f8f8f8;
        appearance: none;
    }
    .result-radio-group {
        display: flex;
        justify-content: space-between;
        gap: 0;
        border-radius: 8px 8px;
        overflow: hidden;
        border: 1px solid #ccc;
        flex-direction: row; /* restore horizontal layout */
    }
    .result-radio {
        background: #f8f8f8;
        transition: background 0.2s;
        color: #333;
        box-shadow: none;

        border-radius: 0;
        border-left: none;
        border-top: none;
        border-bottom: none;

        display: flex;
        flex-direction: column; /* stack icon and label vertically */
        align-items: center;
        justify-content: center;

        margin: 0;
        padding: 0.5rem 0.5rem;

        font-size: 1.3rem;
        cursor: pointer;
        position: relative;
        flex-grow: 1;
    }
    .result-radio input[type="radio"] {
        position: absolute;
        opacity: 0;
        pointer-events: none;
    }
    .result-icon {
        margin: 0;
        height: 30px;
    }
    .result-radio .result-icon {
        font-size: 1.5rem;
    }
    .result-radio:has(input[type="radio"]:checked) {
        background: #3d5d82;
        color: #fff;
        box-shadow: none;
    }
    .result-radio input[type="radio"]:disabled + .result-icon {
        color: #aaa;
        opacity: 0.6;
    }
    .result-radio:has(input[type="radio"]:disabled) {
        background: #eee;
        color: #aaa;
        cursor: not-allowed;
    }

    #take-result-button {
        margin-bottom: 0;
        padding: 0;
        position: relative;
    }
    #take-result-button p {
        margin: 0;
        padding: 0.75rem 0;
        font-size: 1.25rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }
    #take-result-button .result-icon {
        font-size: 1rem;
    }
    #result-option-indicator {
        position: absolute;
        top: 25%;
        height: 50%;
        right: 0.5rem;
        width: 1em;
        display: flex;
        align-items: center;
        padding: 0.5em;
        justify-content: center;
        pointer-events: none;
        border-radius: 100px;
    }
    #result-option-indicator .result-icon {
        font-size: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .dice-roller-divider {
        border: none;
        border-top: 1px solid #ccc;
        margin: 1rem 0;
    }
    #result-options {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        align-items: center;
        margin-bottom: 1rem;
    }
    .result-calculator-container {
        overflow: hidden;
        max-height: 1000px;
        transition:
            max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1),
            padding 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        will-change: max-height, padding;
    }
    .result-calculator-container:not(:has(*)) {
        max-height: 0;
        padding: 0;
    }
</style>
