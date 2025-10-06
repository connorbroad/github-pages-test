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
    import "../solo-rpg-styles.css";

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
    let showResultCalculator = false;

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
    <div
        class="srpg-modal"
        role="button"
        tabindex="0"
        aria-label="Close dice roller"
        on:click={() => onClose && onClose()}
        on:keydown={(e) =>
            (e.key === "Enter" || e.key === " ") && onClose && onClose()}
    >
        <div
            class="srpg-modal-content"
            role="dialog"
            aria-modal="true"
            tabindex="0"
            on:click|stopPropagation
            on:keydown={(e) => {
                /* trap focus or allow esc to close if desired */
            }}
        >
            <button
                class="srpg-b-modal-nav srpg-b-modal-nav-close"
                aria-label="Close"
                on:click={() => onClose && onClose()}>&times;</button
            >
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
            <button class="srpg-b srpg-b-normal srpg-b-w-full" on:click={onRollButtonClick}
                >Roll</button
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
                                        (numDice == 1 &&
                                            diceResults.length == 1)}
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
                                        (numDice == 1 &&
                                            diceResults.length == 1)}
                                    bind:group={resultOption}
                                    on:change={recalculateResult}
                                />
                                <span class="result-icon">
                                    <ResultOptionIcon
                                        option="Maximum"
                                        size="1em"
                                    />
                                </span>
                            </label>
                            <label class="result-radio" aria-label="Minimum">
                                <input
                                    type="radio"
                                    name="resultOption"
                                    value="Minimum"
                                    disabled={(diceResults.length == 0 &&
                                        numDice == 1) ||
                                        (numDice == 1 &&
                                            diceResults.length == 1)}
                                    bind:group={resultOption}
                                    on:change={recalculateResult}
                                />
                                <span class="result-icon">
                                    <ResultOptionIcon
                                        option="Minimum"
                                        size="1em"
                                    />
                                </span>
                            </label>
                            <label class="result-radio" aria-label="Subtract">
                                <input
                                    type="radio"
                                    name="resultOption"
                                    value="Subtract"
                                    disabled={(diceResults.length == 0 &&
                                        numDice == 1) ||
                                        (numDice == 1 &&
                                            diceResults.length == 1)}
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
                            Result:
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
            <button
                class="toggle-result-calculator-btn"
                aria-label={showResultCalculator
                    ? "Hide result calculator"
                    : "Show result calculator"}
                on:click={() => (showResultCalculator = !showResultCalculator)}
                style="background: none; border: none; cursor: pointer; position: absolute; top: 0.6rem; left: 0.5rem; z-index: 11;"
            >
                {#if !showResultCalculator}
                    <!-- Eye icon (visible) -->
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="28px"
                        height="28px"
                        {...$$props}
                        ><path
                            fill="currentColor"
                            d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m0 16H5V5h14z"
                        /><path
                            fill="currentColor"
                            d="M6.25 7.72h5v1.5h-5zM13 15.75h5v1.5h-5zm0-2.5h5v1.5h-5zM8 18h1.5v-2h2v-1.5h-2v-2H8v2H6V16h2zm6.09-7.05l1.41-1.41l1.41 1.41l1.06-1.06l-1.41-1.42l1.41-1.41L16.91 6L15.5 7.41L14.09 6l-1.06 1.06l1.41 1.41l-1.41 1.42z"
                        /></svg
                    >
                {:else}
                    <!-- Eye-off icon (hidden) -->
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="28px"
                        height="28px"
                        {...$$props}
                        ><path
                            fill="currentColor"
                            d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m-5.97 4.06L14.09 6l1.41 1.41L16.91 6l1.06 1.06l-1.41 1.41l1.41 1.41l-1.06 1.06l-1.41-1.4l-1.41 1.41l-1.06-1.06l1.41-1.41zm-6.78.66h5v1.5h-5zM11.5 16h-2v2H8v-2H6v-1.5h2v-2h1.5v2h2zm6.5 1.25h-5v-1.5h5zm0-2.5h-5v-1.5h5z"
                        /></svg
                    >
                {/if}
            </button>
        </div>
    </div>
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
    .result-label {
        font-size: 0.85rem;
        color: inherit;
        margin-top: 0.1rem;
        letter-spacing: 1px;
        font-weight: 500;
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
    
    .result-arrow {
        font-size: 1.3rem;
        margin-left: 0.5rem;
        color: inherit;
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
    .toggle-result-calculator-btn {
        width: 2.5rem;
        height: 2.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.2s;
    }
    .toggle-result-calculator-btn:hover {
        background: #e3eaf5;
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
