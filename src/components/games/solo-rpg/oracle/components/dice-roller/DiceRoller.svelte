<script lang="ts">
    import { slide } from "svelte/transition";
    import DiceDisplay from "./components/DiceDisplay.svelte";
    import ResultOptionIcon from "./components/ResultOptionIcon.svelte";
    import { type ResultOption, calculateResult } from "./scripts/diceRollerLogic";
    import { createEventDispatcher } from "svelte";

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
    let checkName = ""; // Editable name for the check, e.g. "Strength Check"

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
                checkName: checkName || undefined, // Use edited checkName
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

    function onRollStart() {
        rolling = true;
        rolledNumSides = numSides;
        diceResults = [];
        finalResult = null;
    }

    $: recalculateResult();
</script>

{#if embedded}
    <div class="dice-roller-embedded">
        <!-- Check name input (shown when preset exists) -->
        {#if preset}
            <div class="mx-4 mb-4 flex flex-col gap-2">
                <input
                    id="check-name-input"
                    type="text"
                    bind:value={checkName}
                    placeholder="Enter check name (e.g., Strength, Perception)"
                    class="border-border-primary bg-input-bg text-input-text focus:border-accent-primary focus:ring-shadow-md rounded-lg border-[1.5px] p-3 text-base transition-all duration-200 placeholder:opacity-60 focus:ring-2 focus:outline-none" />
            </div>
        {/if}

        <DiceDisplay
            {numDice}
            {numSides}
            {rolledNumSides}
            {rolling}
            on:rollComplete={onRollComplete}
            on:rollStart={onRollStart} />
        <hr class="border-divider my-4 border-t border-none" />
        <div class="m-4 mb-0 flex flex-col flex-wrap justify-center gap-3">
            <div class="flex flex-wrap justify-center gap-3">
                <div class="dice-options-select">
                    <select
                        class="border-border-primary bg-input-bg text-input-text focus-visible:border-accent-primary focus-visible:ring-shadow-md focus-visible:bg-bg-secondary m-0 appearance-none rounded-[10px] border-[1.5px] px-4 py-[0.6rem] text-[1.05rem] transition-all duration-200 focus-visible:ring-2 focus-visible:outline-none"
                        bind:value={numDice}
                        aria-label="Number of dice">
                        {#each Array(10) as _, i}
                            <option value={i + 1}>{i + 1}x</option>
                        {/each}
                    </select>
                </div>
                <div class="dice-options-select">
                    <select
                        class="border-border-primary bg-input-bg text-input-text focus-visible:border-accent-primary focus-visible:ring-shadow-md focus-visible:bg-bg-secondary m-0 appearance-none rounded-[10px] border-[1.5px] px-4 py-[0.6rem] text-[1.05rem] transition-all duration-200 focus-visible:ring-2 focus-visible:outline-none"
                        bind:value={numSides}
                        aria-label="Die type">
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
                    <select
                        class="border-border-primary bg-input-bg text-input-text focus-visible:border-accent-primary focus-visible:ring-shadow-md focus-visible:bg-bg-secondary m-0 appearance-none rounded-[10px] border-[1.5px] px-4 py-[0.6rem] text-[1.05rem] transition-all duration-200 focus-visible:ring-2 focus-visible:outline-none"
                        bind:value={modifier}
                        on:change={recalculateResult}
                        aria-label="Modifier">
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
            <div class="mb-4 flex flex-wrap items-center justify-center gap-3">
                <div
                    class="border-border-primary bg-bg-secondary flex flex-row justify-between gap-0 overflow-hidden rounded-xl border">
                    <label
                        class="text-text-primary has-checked:bg-accent-primary has-checked:text-text-inverse has-disabled:bg-bg-tertiary has-disabled:text-text-primary group relative m-0 flex grow cursor-pointer flex-col items-center justify-center bg-transparent px-[0.6rem] py-[0.45rem] text-[1.2rem] shadow-none transition-all duration-200 has-disabled:cursor-not-allowed"
                        aria-label="Sum">
                        <input
                            class="pointer-events-none absolute opacity-0"
                            type="radio"
                            name="resultOption"
                            value="Sum"
                            disabled={(diceResults.length == 0 && numDice == 1) ||
                                (numDice == 1 && diceResults.length == 1)}
                            bind:group={resultOption}
                            on:change={recalculateResult} />
                        <span
                            class="m-0 flex h-[30px] items-center justify-center text-[1.4rem] group-has-disabled:opacity-60">
                            <ResultOptionIcon option="Sum" size="1em" />
                        </span>
                    </label>
                    <label
                        class="text-text-primary has-checked:bg-accent-primary has-checked:text-text-inverse has-disabled:bg-bg-tertiary has-disabled:text-text-primary group relative m-0 flex grow cursor-pointer flex-col items-center justify-center bg-transparent px-[0.6rem] py-[0.45rem] text-[1.2rem] shadow-none transition-all duration-200 has-disabled:cursor-not-allowed"
                        aria-label="Maximum">
                        <input
                            class="pointer-events-none absolute opacity-0"
                            type="radio"
                            name="resultOption"
                            value="Maximum"
                            disabled={(diceResults.length == 0 && numDice == 1) ||
                                (numDice == 1 && diceResults.length == 1)}
                            bind:group={resultOption}
                            on:change={recalculateResult} />
                        <span
                            class="m-0 flex h-[30px] items-center justify-center text-[1.4rem] group-has-disabled:opacity-60">
                            <ResultOptionIcon option="Maximum" size="1em" />
                        </span>
                    </label>
                    <label
                        class="text-text-primary has-checked:bg-accent-primary has-checked:text-text-inverse has-disabled:bg-bg-tertiary has-disabled:text-text-primary group relative m-0 flex grow cursor-pointer flex-col items-center justify-center bg-transparent px-[0.6rem] py-[0.45rem] text-[1.2rem] shadow-none transition-all duration-200 has-disabled:cursor-not-allowed"
                        aria-label="Minimum">
                        <input
                            class="pointer-events-none absolute opacity-0"
                            type="radio"
                            name="resultOption"
                            value="Minimum"
                            disabled={(diceResults.length == 0 && numDice == 1) ||
                                (numDice == 1 && diceResults.length == 1)}
                            bind:group={resultOption}
                            on:change={recalculateResult} />
                        <span
                            class="m-0 flex h-[30px] items-center justify-center text-[1.4rem] group-has-disabled:opacity-60">
                            <ResultOptionIcon option="Minimum" size="1em" />
                        </span>
                    </label>
                    <label
                        class="text-text-primary has-checked:bg-accent-primary has-checked:text-text-inverse has-disabled:bg-bg-tertiary has-disabled:text-text-primary group relative m-0 flex grow cursor-pointer flex-col items-center justify-center bg-transparent px-[0.6rem] py-[0.45rem] text-[1.2rem] shadow-none transition-all duration-200 has-disabled:cursor-not-allowed"
                        aria-label="Subtract">
                        <input
                            class="pointer-events-none absolute opacity-0"
                            type="radio"
                            name="resultOption"
                            value="Subtract"
                            disabled={(diceResults.length == 0 && numDice == 1) ||
                                (numDice == 1 && diceResults.length == 1)}
                            bind:group={resultOption}
                            on:change={recalculateResult} />
                        <span
                            class="m-0 flex h-[30px] items-center justify-center text-[1.4rem] group-has-disabled:opacity-60">
                            <ResultOptionIcon option="Subtract" size="1em" />
                        </span>
                    </label>
                </div>
            </div>
        </div>
        <div class="mb-4 flex flex-wrap items-center justify-center gap-4" transition:slide>
            <button
                class="border-border-primary bg-accent-primary text-text-primary hover:bg-bg-tertiary active:bg-bg-secondary-active flex w-lg cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
                on:click={onRollButtonClick}>
                Roll
            </button>
            <button
                id="take-result-button"
                class="border-border-primary bg-accent-success hover:bg-accent-success-hover active:bg-accent-success-active relative mt-0 mb-0 flex w-lg cursor-pointer items-center justify-center gap-2 rounded-md border p-0 px-4 py-3 text-center text-base font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                on:click={onClickTakeResult}
                disabled={diceResults.length === 0 || finalResult === null || rolling}>
                {#if diceResults.length > 1 && !rolling}
                    <div
                        class="pointer-events-none absolute top-1/4 left-2 flex h-1/2 w-[1em] items-center justify-center rounded-full p-[0.5em]"
                        aria-live="polite">
                        <span class="flex items-center justify-center text-[1.4rem]">
                            <ResultOptionIcon option={resultOption} size="1em" />
                        </span>
                    </div>
                {/if}
                <p class="m-0 inline-flex items-center justify-center gap-2">
                    Record fate: {rolling ? "..." : finalResult || "..."}
                </p>
                {#if diceResults.length > 1 && !rolling}
                    <div
                        class="pointer-events-none absolute top-1/4 right-2 flex h-1/2 w-[1em] items-center justify-center rounded-full p-[0.5em]"
                        aria-live="polite">
                        <span class="flex items-center justify-center text-[1.4rem]">
                            <ResultOptionIcon option={resultOption} size="1em" />
                        </span>
                    </div>
                {/if}
            </button>
        </div>
    </div>
{/if}
