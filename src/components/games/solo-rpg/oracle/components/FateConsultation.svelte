<script lang="ts">
    /**
     * Fate Consultation Component
     * Modal for rolling dice/drawing cards to consult a fortune
     */
    import type { Fortune } from "../scripts/oracleTypes";
    import {
        drawRandomCard,
        isRedSuit
    } from "../scripts/oracleTypes";
    import DiceRollerEmbed from "../../dice-roller/DiceRollerEmbed.svelte";
    import { createEventDispatcher } from "svelte";
    import "../../solo-rpg-styles.css";

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
            fortuneTitle: fortune!.title
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
                mappedOutcome: fateOutcome.dice
            };
        }

        if (fortune?.outcome.cardDraw?.enabled && drawnCard) {
            resultData.cardDraw = {
                suit: drawnCard.suit,
                rank: drawnCard.rank,
                suitMapped: fateOutcome.suit,
                rankMapped: fateOutcome.rank
            };
        }

        dispatch("accept", resultData);
    }
</script>

{#if show && fortune}
    <div
        class="srpg-modal"
        role="button"
        tabindex="0"
        aria-label="Close fate modal"
        on:click={handleClose}
        on:keydown={(e) => {
            const tag = (e.target as HTMLElement).tagName;
            const isEditable = (e.target as HTMLElement).isContentEditable;
            if (
                (e.key === "Enter" || e.key === " ") &&
                !["INPUT", "TEXTAREA", "SELECT"].includes(tag) &&
                !isEditable
            ) {
                handleClose();
            }
        }}
    >
        <div
            class="srpg-modal-content"
            role="dialog"
            aria-modal="true"
            tabindex="0"
            on:click|stopPropagation
            on:keydown={(e) => {}}
        >
            <button class="srpg-b-modal-nav srpg-b-modal-nav-close" on:click={handleClose}
                >&times;</button
            >
            <h2>{fortune.title}</h2>

            {#if fortune.outcome.diceRoll}
                <div class="fate-section">
                    <DiceRollerEmbed
                        numDice={fortune.outcome.diceRoll.numDice}
                        numSides={fortune.outcome.diceRoll.numSides}
                        {modifier}
                        resultOption={fortune.outcome.diceRoll.resultOption}
                        showModifier={fortune.outcome.diceRoll.showModifier ?? false}
                        on:result={(e) => handleDiceResult(e.detail)}
                        on:rollingChange={(e) =>
                            handleRollingChange(e.detail)}
                        on:hasRolledChange={(e) =>
                            handleHasRolledChange(e.detail)}
                        on:diceResults={(e) =>
                            handleDiceResultsChange(e.detail)}
                    />
                    {#if diceResult !== null}
                        {#if fateOutcome.dice || (fortune.outcome.diceRoll.diceSignificance && Object.keys(fortune.outcome.diceRoll.diceSignificance).length > 0 && individualDiceResults.length > 0)}
                            <div class="result-display">
                                {#if fateOutcome.dice}
                                    <p class="outcome-text">{fateOutcome.dice}</p>
                                {/if}
                                {#if fortune.outcome.diceRoll.diceSignificance && Object.keys(fortune.outcome.diceRoll.diceSignificance).length > 0 && individualDiceResults.length > 0}
                                    <div class="dice-significance">
                                        {#if fortune.outcome.diceRoll.resultOption === "Sum" || fortune.outcome.diceRoll.resultOption === "Subtract"}
                                            <!-- Show all dice with significance for Sum and Subtract -->
                                            {#each individualDiceResults as diceValue, index}
                                                {#if fortune.outcome.diceRoll.diceSignificance[index + 1]}
                                                    <p class="significance-item">
                                                        <strong>{fortune.outcome.diceRoll.diceSignificance[index + 1]}:</strong> {diceValue}
                                                    </p>
                                                {/if}
                                            {/each}
                                        {:else if fortune.outcome.diceRoll.resultOption === "Maximum"}
                                            <!-- Show only the highest die with significance -->
                                            {@const maxValue = Math.max(...individualDiceResults)}
                                            {@const maxIndex = individualDiceResults.findIndex(v => v === maxValue)}
                                            {#if fortune.outcome.diceRoll.diceSignificance[maxIndex + 1]}
                                                <p class="significance-item">
                                                    <strong>{fortune.outcome.diceRoll.diceSignificance[maxIndex + 1]}:</strong> {maxValue}
                                                </p>
                                            {/if}
                                        {:else if fortune.outcome.diceRoll.resultOption === "Minimum"}
                                            <!-- Show only the lowest die with significance -->
                                            {@const minValue = Math.min(...individualDiceResults)}
                                            {@const minIndex = individualDiceResults.findIndex(v => v === minValue)}
                                            {#if fortune.outcome.diceRoll.diceSignificance[minIndex + 1]}
                                                <p class="significance-item">
                                                    <strong>{fortune.outcome.diceRoll.diceSignificance[minIndex + 1]}:</strong> {minValue}
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
                <div class="fate-section">
                    <h3>Card Draw</h3>
                    {#if drawnCard}
                        <div class="card-draw-result">
                            <div
                                class="card-display"
                                style="color: {isRedSuit(drawnCard.suit)
                                    ? 'red'
                                    : 'inherit'}"
                            >
                                {drawnCard.rank} {drawnCard.suit}
                            </div>
                        </div>
                        {#if fateOutcome.suit || fateOutcome.rank}
                            <div class="result-display">
                                {#if fateOutcome.suit}
                                    <p class="outcome-text">
                                        <strong>Suit:</strong>
                                        {fateOutcome.suit}
                                    </p>
                                {/if}
                                {#if fateOutcome.rank}
                                    <p class="outcome-text">
                                        <strong>Rank:</strong>
                                        {fateOutcome.rank}
                                    </p>
                                {/if}
                            </div>
                        {/if}
                    {:else}
                        <button
                            class="srpg-b srpg-b-normal srpg-b-w-full"
                            on:click={handleCardDraw}
                        >
                            Draw Card
                        </button>
                    {/if}
                </div>
            {/if}

            <button
                class="srpg-b srpg-b-create srpg-b-w-full"
                disabled={
                    (fortune.outcome.diceRoll && (!diceHasRolled || diceResult === null)) ||
                    (fortune.outcome.cardDraw?.enabled && drawnCard === null) ||
                    fateDecided ||
                    diceRolling
                }
                on:click={handleAcceptFate}
            >
                Accept fate
            </button>
        </div>
    </div>
{/if}

<style>  
    h2 {
        margin-top: 0;
        color: #333;
    }

    h3 {
        margin-top: 0;
        margin-bottom: 0.5rem;
        color: #555;
        font-size: 1.1rem;
    }

    .fate-section {
        margin-bottom: 1.5rem;
        padding: 0.5rem;
        border-radius: 6px;
        border: 1px solid #ddd;
    }

    .card-draw-result {
        display: flex;
        justify-content: center;
    }

    .card-display {
        font-size: 1.2rem;
        font-weight: bold;
        border-radius: 4px;
        background: #f0f0f0;
        padding: 0.5rem 1rem;
    }

    .card-display {
        margin-top: 0;
        margin-bottom: 0.5rem;
    }

    .result-display {
        margin-top: 0.5rem;
        padding: 1rem;
        background: #e8f5e9;
        border-radius: 6px;
        border: 2px solid #4caf50;
    }

    .result-display strong {
        font-size: 1.2rem;
        color: #2e7d32;
    }

    .outcome-text {
        margin: 0;
        color: #333;
        text-align: left;
    }

    .dice-significance {
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px solid #4caf50;
    }

    .dice-significance:first-child {
        margin-top: 0;
        padding-top: 0;
        border-top: none;
    }

    .significance-item {
        margin: 0.25rem 0;
        color: #555;
        font-size: 0.95rem;
        text-align: left;
    }

    .significance-item strong {
        color: #1976d2;
        font-size: 1rem;
    }
</style>
