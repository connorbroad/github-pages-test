<script lang="ts">
    /**
     * Fate Consultation Component
     * Modal for rolling dice/drawing cards to consult a fortune
     */
    import type { Fortune } from "../scripts/oracleTypes";
    import { drawRandomCard, isRedSuit } from "../scripts/oracleTypes";
    import DiceRollerEmbed from "./dice-roller/DiceRollerEmbed.svelte";
    import SrpgModal from "../../shared/modal/SrpgModal.svelte";
    import { createEventDispatcher } from "svelte";

    export let show = false;
    export let fortune: Fortune | null = null;

    const dispatch = createEventDispatcher();

    let diceResult: number | null = null;
    let individualDiceResults: number[] = [];
    let drawnCard: { suit: string; rank: string } | null = null;
    let fateOutcome: { dice?: string; suit?: string; rank?: string } = {};
    let modifier: number = 0;

    let fateDecided: boolean = false;
    let diceHasRolled: boolean = false;
    let diceRolling: boolean = false;

    // Reset state when show changes
    $: if (show && fortune) {
        resetState();
    }

    function resetState() {
        diceResult = null;
        individualDiceResults = [];
        drawnCard = null;
        fateOutcome = {};
        modifier = fortune?.outcome.diceRoll?.showModifier ? 0 : 0;
        diceRolling = false;
        diceHasRolled = false;
    }

    function handleDiceResult(result: number) {
        diceResult = result;
        if (fortune?.outcome.diceMapping && fortune.outcome.diceMapping[result]) {
            fateOutcome.dice = fortune.outcome.diceMapping[result];
        }
    }

    function handleCardDraw() {
        const card = drawRandomCard();
        drawnCard = card;

        if (fortune?.outcome.suitMapping && fortune.outcome.suitMapping[card.suit]) {
            fateOutcome.suit = fortune.outcome.suitMapping[card.suit];
        }
        if (fortune?.outcome.rankMapping && fortune.outcome.rankMapping[card.rank]) {
            fateOutcome.rank = fortune.outcome.rankMapping[card.rank];
        }
    }

    function handleRollingChange(isRolling: boolean) {
        diceRolling = isRolling;
    }

    function handleHasRolledChange(hasRolled: boolean) {
        diceHasRolled = hasRolled;
    }

    function handleDiceResultsChange(results: number[]) {
        individualDiceResults = results;
    }

    function handleClose() {
        dispatch("close");
    }

    function handleAcceptFate() {
        // Prepare the fortune result data
        const resultData: any = {
            fortuneTitle: fortune!.title,
        };

        if (fortune?.outcome.diceRoll && diceResult !== null) {
            resultData.diceRoll = {
                numDice: fortune.outcome.diceRoll.numDice,
                numSides: fortune.outcome.diceRoll.numSides,
                modifier: modifier,
                resultOption: fortune.outcome.diceRoll.resultOption,
                result: diceResult,
                individualDiceResults: individualDiceResults,
                diceSignificance: fortune.outcome.diceRoll.diceSignificance,
                mappedOutcome: fateOutcome.dice,
            };
        }

        if (fortune?.outcome.cardDraw?.enabled && drawnCard) {
            resultData.cardDraw = {
                suit: drawnCard.suit,
                rank: drawnCard.rank,
                suitMapped: fateOutcome.suit,
                rankMapped: fateOutcome.rank,
            };
        }

        dispatch("accept", resultData);
    }
</script>

{#if show && fortune}
    <SrpgModal {show} ariaLabel="Close fate modal" on:close={handleClose}>
        <h2 class="text-text-primary mt-0">{fortune.title}</h2>

        {#if fortune.outcome.diceRoll}
            <div class="border-border-primary mb-6 rounded-md border p-2">
                <DiceRollerEmbed
                    numDice={fortune.outcome.diceRoll.numDice}
                    numSides={fortune.outcome.diceRoll.numSides}
                    {modifier}
                    resultOption={fortune.outcome.diceRoll.resultOption}
                    showModifier={fortune.outcome.diceRoll.showModifier ?? false}
                    on:result={(e) => handleDiceResult(e.detail)}
                    on:rollingChange={(e) => handleRollingChange(e.detail)}
                    on:hasRolledChange={(e) => handleHasRolledChange(e.detail)}
                    on:diceResults={(e) => handleDiceResultsChange(e.detail)} />
                {#if diceResult !== null}
                    {#if fateOutcome.dice || (fortune.outcome.diceRoll.diceSignificance && Object.keys(fortune.outcome.diceRoll.diceSignificance).length > 0 && individualDiceResults.length > 0)}
                        <div class="bg-success-bg border-success mt-2 rounded-md border-2 p-4">
                            {#if fateOutcome.dice}
                                <p class="text-text-primary m-0 text-left">{fateOutcome.dice}</p>
                            {/if}
                            {#if fortune.outcome.diceRoll.diceSignificance && Object.keys(fortune.outcome.diceRoll.diceSignificance).length > 0 && individualDiceResults.length > 0}
                                <div
                                    class="border-success mt-3 border-t pt-3 first:mt-0 first:border-t-0 first:pt-0">
                                    {#if fortune.outcome.diceRoll.resultOption === "Sum" || fortune.outcome.diceRoll.resultOption === "Subtract"}
                                        <!-- Show all dice with significance for Sum and Subtract -->
                                        {#each individualDiceResults as diceValue, index}
                                            {#if fortune.outcome.diceRoll.diceSignificance[index + 1]}
                                                <p
                                                    class="text-text-secondary my-1 text-left text-[0.95rem]">
                                                    <strong class="text-accent-primary text-base">
                                                        {fortune.outcome.diceRoll.diceSignificance[
                                                            index + 1
                                                        ]}:
                                                    </strong>
                                                    {diceValue}
                                                </p>
                                            {/if}
                                        {/each}
                                    {:else if fortune.outcome.diceRoll.resultOption === "Maximum"}
                                        <!-- Show only the highest die with significance -->
                                        {@const maxValue = Math.max(...individualDiceResults)}
                                        {@const maxIndex = individualDiceResults.findIndex(
                                            (v) => v === maxValue
                                        )}
                                        {#if fortune.outcome.diceRoll.diceSignificance[maxIndex + 1]}
                                            <p
                                                class="text-text-secondary my-1 text-left text-[0.95rem]">
                                                <strong class="text-accent-primary text-base">
                                                    {fortune.outcome.diceRoll.diceSignificance[
                                                        maxIndex + 1
                                                    ]}:
                                                </strong>
                                                {maxValue}
                                            </p>
                                        {/if}
                                    {:else if fortune.outcome.diceRoll.resultOption === "Minimum"}
                                        <!-- Show only the lowest die with significance -->
                                        {@const minValue = Math.min(...individualDiceResults)}
                                        {@const minIndex = individualDiceResults.findIndex(
                                            (v) => v === minValue
                                        )}
                                        {#if fortune.outcome.diceRoll.diceSignificance[minIndex + 1]}
                                            <p
                                                class="text-text-secondary my-1 text-left text-[0.95rem]">
                                                <strong class="text-accent-primary text-base">
                                                    {fortune.outcome.diceRoll.diceSignificance[
                                                        minIndex + 1
                                                    ]}:
                                                </strong>
                                                {minValue}
                                            </p>
                                        {/if}
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    {/if}
                {/if}
            </div>
        {/if}

        {#if fortune.outcome.cardDraw?.enabled}
            <div class="border-border-primary mb-6 rounded-md border p-2">
                <h3 class="text-text-secondary mt-0 mb-2 text-[1.1rem]">Card Draw</h3>
                {#if drawnCard}
                    <div class="flex justify-center">
                        <div
                            class="bg-bg-secondary mt-0 mb-2 rounded px-4 py-2 text-[1.2rem] font-bold"
                            style="color: {isRedSuit(drawnCard.suit) ? 'red' : 'inherit'}">
                            {drawnCard.rank}
                            {drawnCard.suit}
                        </div>
                    </div>
                    {#if fateOutcome.suit || fateOutcome.rank}
                        <div class="bg-success-bg border-success mt-2 rounded-md border-2 p-4">
                            {#if fateOutcome.suit}
                                <p class="text-text-primary m-0 text-left">
                                    <strong class="text-success-text text-[1.2rem]">Suit:</strong>
                                    {fateOutcome.suit}
                                </p>
                            {/if}
                            {#if fateOutcome.rank}
                                <p class="text-text-primary m-0 text-left">
                                    <strong class="text-success-text text-[1.2rem]">Rank:</strong>
                                    {fateOutcome.rank}
                                </p>
                            {/if}
                        </div>
                    {/if}
                {:else}
                    <button
                        class="border-border-primary bg-bg-secondary text-text-primary hover:bg-bg-tertiary active:bg-bg-secondary-active flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
                        on:click={handleCardDraw}>
                        Draw Card
                    </button>
                {/if}
            </div>
        {/if}

        <button
            class="border-border-primary bg-accent-success hover:bg-accent-success-hover active:bg-accent-success-active flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
            disabled={(fortune.outcome.diceRoll && (!diceHasRolled || diceResult === null)) ||
                (fortune.outcome.cardDraw?.enabled && drawnCard === null) ||
                fateDecided ||
                diceRolling}
            on:click={handleAcceptFate}>
            Record fate
        </button>
    </SrpgModal>
{/if}

<style>
</style>
