<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import DiceDisplay from "./components/DiceDisplay.svelte";
    import { type ResultOption, calculateResult } from "./scripts/diceRollerLogic";

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

    function onRollButtonClick() {
        if (rolling) return;

        hasRolled = true;
        rolling = true;
        rolledNumSides = numSides;
        diceResults = [];
        finalResult = null;
    }

    function onRollComplete(event: CustomEvent<number[]>) {
        diceResults = event.detail;
        rolling = false;
        recalculateResult();

        if (finalResult !== null) {
            dispatch("result", finalResult);
            if (onResult) {
                onResult(finalResult);
            }
        }
    }

    function recalculateResult() {
        const effectiveModifier = showModifier ? modifier : 0;
        finalResult = calculateResult(diceResults, resultOption, effectiveModifier);
    }

    $: recalculateResult(); // reactive statement to update result when dependencies change
</script>

<div class="w-full">
    <DiceDisplay {numDice} {numSides} {rolledNumSides} {rolling} on:rollComplete={onRollComplete} />
    {#if showModifier}
        <div class="mb-2" style="margin-bottom: 0.5rem;">
            <label for="dice-modifier">Modifier:</label>
            <select
                id="dice-modifier"
                class="cursor-pointer rounded border border-[#ccc] bg-white p-2 text-base text-[#333] transition-colors duration-200 focus:border-[#1976d2] focus:outline-none"
                bind:value={modifier}
                on:change={() => {
                    recalculateResult();
                    dispatch("modifierChange", modifier);
                }}>
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
        <div class="flex items-center justify-center">
            <div class="rounded p-3 text-center text-[1.1rem]">
                {#if finalResult !== null && !rolling}
                    <strong class="text-[#1976d2]">Result: {finalResult}</strong>
                {:else if rolling}
                    Result: ...
                {:else}
                    <em>Result: ...</em>
                {/if}
            </div>
            <button
                class="flex cursor-pointer items-center justify-center rounded-md border-none bg-[#1976d2] p-2 text-base text-white transition-colors duration-200 active:bg-[#115293] disabled:cursor-not-allowed disabled:bg-[#ccc] disabled:text-[#666]"
                on:click={onRollButtonClick}
                disabled={rolling}
                aria-label="Reroll dice">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    width="1em"
                    height="1em"
                    {...$$props}>
                    <path
                        fill="currentColor"
                        d="M0 224c0 17.7 14.3 32 32 32s32-14.3 32-32c0-53 43-96 96-96h160v32c0 12.9 7.8 24.6 19.8 29.6s25.7 2.2 34.9-6.9l64-64c12.5-12.5 12.5-32.8 0-45.3l-64-64c-9.2-9.2-22.9-11.9-34.9-6.9S320 19.1 320 32v32H160C71.6 64 0 135.6 0 224m512 64c0-17.7-14.3-32-32-32s-32 14.3-32 32c0 53-43 96-96 96H192v-32c0-12.9-7.8-24.6-19.8-29.6s-25.7-2.2-34.9 6.9l-64 64c-12.5 12.5-12.5 32.8 0 45.3l64 64c9.2 9.2 22.9 11.9 34.9 6.9s19.8-16.6 19.8-29.6v-32h160c88.4 0 160-71.6 160-160z" />
                </svg>
            </button>
        </div>
    {:else}
        <button
            class="my-2 mb-0 w-full cursor-pointer rounded-md border-none bg-[#1976d2] py-3 text-[1.1rem] text-white transition-colors duration-200 active:bg-[#115293] disabled:cursor-not-allowed disabled:bg-[#ccc] disabled:text-[#666]"
            on:click={onRollButtonClick}
            disabled={rolling}>
            Roll
        </button>
    {/if}
</div>

