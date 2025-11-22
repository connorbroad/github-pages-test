<script lang="ts">
    import { slide } from "svelte/transition";
    import DiceDisplay from "./components/DiceDisplay.svelte";
    import ResultOptionIcon from "./components/ResultOptionIcon.svelte";
    import {
        type ResultOption,
        calculateResult,
    } from "./scripts/diceRollerLogic";
    import { createEventDispatcher } from "svelte";
    import "../../../solo-rpg-styles.css";

    export let embedded: boolean = false;
    export let onClose: () => void = () => {};
    export let preset: {
        characterId: string;
        characterName: string;
        checkName: string;
        numDice: number;
        numSides: number;
        modifier: number;
        rollType: "normal" | "advantage" | "disadvantage";
    } | null = null;

    const dispatch = createEventDispatcher();

    let numDice = 1;
    let numSides = 20;
    let modifier = 0;
    let resultOption: ResultOption = "Sum";
    let diceResults: number[] = [];
    let finalResult: number | null = null;
    let rolledNumSides = numSides;
    let rolling = false;
    let showResultCalculator = true;
    let checkName = ""; // Editable check name

    // Apply preset when provided
    $: if (preset) {
        numDice = preset.numDice;
        numSides = preset.numSides;
        modifier = preset.modifier;
        checkName = preset.checkName || "";
        
        // Handle advantage/disadvantage for d20 rolls
        if (preset.rollType === "advantage" && numSides === 20) {
            numDice = 2;
            resultOption = "Maximum";
        } else if (preset.rollType === "disadvantage" && numSides === 20) {
            numDice = 2;
            resultOption = "Minimum";
        } else {
            resultOption = "Sum";
        }
    }

    function onRollButtonClick() {
        if (rolling) return;
        
        rolling = true;
        rolledNumSides = numSides;
        diceResults = []; // Clear results while rolling
        finalResult = null;
    }

    function onRollComplete(event: CustomEvent<number[]>) {
        diceResults = event.detail;
        rolling = false;
        recalculateResult();
    }

    function recalculateResult() {
        finalResult = calculateResult(diceResults, resultOption, modifier);
    }

    function onClickTakeResult() {
        if (embedded) {
            // When embedded in GameOracle, save to chronicle and navigate to story
            dispatch("recordFate", {
                type: "dice",
                numDice,
                numSides,
                modifier,
                resultOption,
                result: finalResult,
                individualDiceResults: diceResults,
                characterId: preset?.characterId,
                checkName: checkName || undefined // Use edited checkName
            });
        }
        
        // Clear preset after recording
        if (preset) {
            dispatch("clearPreset");
        }
        
        // Reset state
        modifier = 0;
        diceResults = [];
        finalResult = null;
        rolling = false;
        checkName = "";

        onClose();
    }

    $: recalculateResult();
</script>

{#if embedded}
    <div class="dice-roller-embedded"> 
        <!-- Check name input (shown when preset exists) -->
        {#if preset}
            <div class="check-name-container"> 
                <input
                    id="check-name-input"
                    type="text"
                    bind:value={checkName}
                    placeholder="Enter check name (e.g., Strength, Perception)"
                    class="check-name-input"
                />
            </div> 
        {/if}
        
        <DiceDisplay
            {numDice}
            {numSides}
            {rolledNumSides}
            {rolling}
            on:rollComplete={onRollComplete}
        />
        <hr class="dice-roller-divider" />
        <div id="dice-options">
            <div id="dice-selection-options">
                <div class="dice-options-select">
                    <select bind:value={numDice} aria-label="Number of dice">
                        {#each Array(10) as _, i}
                            <option value={i + 1}>{i + 1}x</option>
                        {/each}
                    </select>
                </div>
                <div class="dice-options-select">
                    <select bind:value={numSides} aria-label="Die type">
                        <option value={4}>D4</option>
                        <option value={6} selected>D6</option>
                        <option value={8}>D8</option>
                        <option value={10}>D10</option>
                        <option value={12}>D12</option>
                        <option value={20}>D20</option>
                        <option value={100}>D100</option>
                    </select>
                </div>
                <div class="dice-options-select">
                    <select bind:value={modifier} on:change={recalculateResult} aria-label="Modifier">
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
            <div id="result-options">
                <div class="result-radio-group">
                    <label class="result-radio" aria-label="Sum">
                        <input type="radio" name="resultOption" value="Sum"
                            disabled={(diceResults.length == 0 && numDice == 1) || (numDice == 1 && diceResults.length == 1)}
                            bind:group={resultOption} on:change={recalculateResult} />
                        <span class="result-icon"><ResultOptionIcon option="Sum" size="1em" /></span>
                    </label>
                    <label class="result-radio" aria-label="Maximum">
                        <input type="radio" name="resultOption" value="Maximum"
                            disabled={(diceResults.length == 0 && numDice == 1) || (numDice == 1 && diceResults.length == 1)}
                            bind:group={resultOption} on:change={recalculateResult} />
                        <span class="result-icon"><ResultOptionIcon option="Maximum" size="1em" /></span>
                    </label>
                    <label class="result-radio" aria-label="Minimum">
                        <input type="radio" name="resultOption" value="Minimum"
                            disabled={(diceResults.length == 0 && numDice == 1) || (numDice == 1 && diceResults.length == 1)}
                            bind:group={resultOption} on:change={recalculateResult} />
                        <span class="result-icon"><ResultOptionIcon option="Minimum" size="1em" /></span>
                    </label>
                    <label class="result-radio" aria-label="Subtract">
                        <input type="radio" name="resultOption" value="Subtract"
                            disabled={(diceResults.length == 0 && numDice == 1) || (numDice == 1 && diceResults.length == 1)}
                            bind:group={resultOption} on:change={recalculateResult} />
                        <span class="result-icon"><ResultOptionIcon option="Subtract" size="1em" /></span>
                    </label>
                </div>
            </div>
        </div>
        <div class="result-buttons" transition:slide>
            <button class="srpg-b srpg-b-normal srpg-b-w-lg" on:click={onRollButtonClick}>Roll</button>  
            <button id="take-result-button" class="srpg-b srpg-b-create srpg-b-w-lg"
                on:click={onClickTakeResult}
                disabled={diceResults.length === 0 || finalResult === null || rolling}>
                {#if diceResults.length > 1 && !rolling}
                    <div id="result-option-indicator" aria-live="polite" style="position: absolute; left: 0.5rem; right: auto;">
                        <span class="result-icon"><ResultOptionIcon option={resultOption} size="1em" /></span>
                    </div>
                {/if}
                <p>Record fate: {rolling ? "..." : finalResult || "..."}</p>
                {#if diceResults.length > 1 && !rolling}
                    <div id="result-option-indicator" aria-live="polite" style="position: absolute; right: 0.5rem; left: auto;">
                        <span class="result-icon"><ResultOptionIcon option={resultOption} size="1em" /></span>
                    </div>
                {/if}
            </button>
        </div>
    </div> 
{/if}

<style>
    #dice-options {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 0.75rem;
        margin: 1rem;
        margin-bottom: 0;
        flex-wrap: wrap;
    }

    #dice-selection-options {
        display: flex; 
        justify-content: center;
        gap: 0.75rem;
        flex-wrap: wrap;
    }

    .dice-options-select select {
        padding: 0.6rem 1rem;
        font-size: 1.05rem;
        border-radius: 10px;
        border: 1.5px solid var(--border-primary);
        margin: 0;
        background: var(--input-bg);
        color: var(--input-text);
        appearance: none;
        transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    }
    .dice-options-select select:focus-visible {
        outline: none;
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 3px var(--shadow-md);
        background: var(--bg-secondary);
    }
    .result-radio-group {
        display: flex;
        justify-content: space-between;
        gap: 0;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--border-primary);
        flex-direction: row;
        background: var(--bg-secondary);
    }
    .result-radio {
        background: transparent;
        transition: background 0.2s, color 0.2s, transform 0.05s;
        color: var(--text-primary);
        box-shadow: none;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin: 0;
        padding: 0.45rem 0.6rem;
        font-size: 1.2rem;
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
    .result-radio .result-icon { font-size: 1.4rem; }
    .result-radio:has(input[type="radio"]:checked) {
        background: var(--accent-primary);
        color: var(--text-inverse);
    }
    .result-radio input[type="radio"]:disabled + .result-icon {
        color: var(--text-muted);
        opacity: 0.6;
    }
    .result-radio:has(input[type="radio"]:disabled) {
        background: var(--bg-tertiary);
        color: var(--text-muted);
        cursor: not-allowed;
    }

    #take-result-button {
        margin-top: 0;
        margin-bottom: 0;
        padding: 0;
        position: relative;
    }
    #take-result-button p {
        margin: 0;
        padding: 0.75rem 0;
        font-size: 1.2rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }
    #take-result-button .result-icon { font-size: 1rem; }
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
        font-size: 1.4rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .dice-roller-divider {
        border: none;
        border-top: 1px solid var(--divider);
        margin: 1rem 0;
    }
    #result-options {
        display: flex;
        justify-content: center;
        gap: 0.75rem;
        align-items: center;
        margin-bottom: 1rem;
        flex-wrap: wrap;
    }
    .result-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center; 
        align-items: center;
        margin-bottom: 1rem;
        flex-wrap: wrap;
    }

    .check-name-container {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin: 0 1rem;
        margin-bottom: 1rem;
    } 

    .check-name-input {
        padding: 0.75rem;
        font-size: 1rem;
        border-radius: 8px;
        border: 1.5px solid var(--border-primary);
        background: var(--input-bg);
        color: var(--input-text);
        transition: border-color 0.2s, box-shadow 0.2s;
    }

    .check-name-input:focus {
        outline: none;
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 3px var(--shadow-md);
    }

    .check-name-input::placeholder {
        color: var(--text-muted);
        opacity: 0.6;
    }
</style>
