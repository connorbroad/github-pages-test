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

    export let show = false;
    export let fortune: Fortune | null = null;

    const dispatch = createEventDispatcher();

    let diceResult: number | null = null;
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
        drawnCard = null;
        fateOutcome = {};
        modifier = fortune?.outcome.diceRoll?.showModifier ? 0 : 0;
        diceRolling = false;
        diceHasRolled = false;
    }

    function handleDiceResult(result: number) {
        diceResult = result;
        if (fortune?.outcome.diceMapping) {
            fateOutcome.dice =
                fortune.outcome.diceMapping[result] || "No mapping found";
        }
    }

    function handleCardDraw() {
        const card = drawRandomCard();
        drawnCard = card;

        if (fortune?.outcome.suitMapping) {
            fateOutcome.suit =
                fortune.outcome.suitMapping[card.suit] || "No mapping found";
        }
        if (fortune?.outcome.rankMapping) {
            fateOutcome.rank =
                fortune.outcome.rankMapping[card.rank] || "No mapping found";
        }
    }

    function handleRollingChange(isRolling: boolean) {
        diceRolling = isRolling;
    }

    function handleHasRolledChange(hasRolled: boolean) {
        diceHasRolled = hasRolled;
    }

    function handleClose() {
        dispatch("close");
    }

    function handleAcceptFate() {
        dispatch("accept");
    }
</script>

{#if show && fortune}
    <div
        class="oracle-modal"
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
            class="oracle-content fate-content"
            role="dialog"
            aria-modal="true"
            on:click|stopPropagation
            tabindex="0"
            on:keydown={(e) => {}}
        >
            <button class="modal-close-btn" on:click={handleClose}
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
                    />
                    {#if diceResult !== null && fateOutcome.dice}
                        <div class="result-display">
                            <p class="outcome-text">{fateOutcome.dice}</p>
                        </div>
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
                    {:else}
                        <button
                            class="oracle-button draw-button"
                            on:click={handleCardDraw}
                        >
                            Draw Card
                        </button>
                    {/if}
                </div>
            {/if}

            <button
                class="oracle-button accept-fate-button"
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
    .oracle-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .oracle-content {
        background: #fff;
        margin: 1rem;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        min-width: 300px;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
        text-align: center;
        position: relative;
    }

    .fate-content {
        max-width: 450px;
    }

    .modal-close-btn {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        width: 3rem;
        height: 3rem;
        z-index: 10;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: x-large;
        background: transparent;
        border: none;
        cursor: pointer;
    }

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

    .oracle-button {
        width: 100%;
        padding: 0.75rem 0;
        font-size: 1.1rem;
        border-radius: 6px;
        border: none;
        margin: 0 0;
        background: #1976d2;
        color: #fff;
        cursor: pointer;
        transition: background 0.2s;
    }

    .oracle-button:active {
        background: #1565c0;
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

    .draw-button {
        background: #1976d2;
    }

    .draw-button:active {
        background: #1565c0;
    }

    .accept-fate-button {
        background: #1976d2;
    }

    .accept-fate-button:active {
        background: #1565c0;
    }

    .accept-fate-button:disabled {
        background: #ccc;
        color: #666;
        cursor: not-allowed;
    }
</style>
