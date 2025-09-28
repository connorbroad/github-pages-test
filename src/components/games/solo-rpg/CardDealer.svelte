<script lang="ts">
    import { onMount } from "svelte";
    onMount(() => buildDeck());

    const suits = ["♠", "♥", "♦", "♣"];
    const ranks = [
        "A",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "J",
        "Q",
        "K",
    ];
    const joker = { suit: "🃏", rank: "Joker" };

    let deck: { suit: string; rank: string }[] = [];
    let drawn: { suit: string; rank: string }[] = [];
    let numToDraw = 1;
    let includeJoker = false;

    export let show = false;
    export let onClose: () => void;

    function buildDeck() {
        deck = [];
        for (const suit of suits) {
            for (const rank of ranks) {
                deck.push({ suit, rank });
            }
        }
        if (includeJoker) {
            deck.push({ ...joker });
            deck.push({ ...joker });
        }
        shuffleDeck();
        drawn = [];
    }

    function shuffleDeck() {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    function handleShuffleOrReset() {
        buildDeck();
    }

    function drawCards() {
        if (deck.length === 0) return;
        const drawCount = Math.min(numToDraw, deck.length);
        const drawnCards = deck.slice(0, drawCount);
        deck = deck.slice(drawCount); // Reassign deck for Svelte reactivity
        drawn = [...drawn, ...drawnCards];
    }

    $: cardsRemaining = deck.length;
    $: isReset = drawn.length > 0;
</script>

{#if show}
    <div
        class="card-drawer-modal-overlay"
        role="button"
        tabindex="0"
        aria-label="Close card drawer"
        on:click={() => onClose && onClose()}
        on:keydown={(e) =>
            (e.key === "Enter" || e.key === " ") && onClose && onClose()}
    >
        <div
            class="card-drawer-modal"
            role="dialog"
            aria-modal="true"
            tabindex="0"
            on:click|stopPropagation
            on:keydown={(e) => {
                /* Prevent modal from closing on keydown inside modal */
            }}
        >
            <div class="card-drawer-content">
                <h2>Card Dealer</h2>
                <label>
                    <input
                        type="checkbox"
                        bind:checked={includeJoker}
                        on:change={buildDeck}
                    /> Include Jokers
                </label>
                <div class="card-drawer-actions">
                    <button on:click={drawCards}>Draw</button>
                    <button on:click={handleShuffleOrReset}
                        >{isReset ? "Reset" : "Shuffle"}</button
                    >
                </div>
                <div class="card-drawer-info">
                    <p>Cards Remaining: {cardsRemaining}</p>
                    {#if drawn.length}
                        <div class="drawn-cards">
                            <p>Drawn Cards:</p>
                            <div class="cards-list">
                                {#each drawn as card}
                                    <span class="card-chip" style="color: {card.suit === '♥' || card.suit === '♦' ? 'red' : 'inherit'}">
                                        {card.rank} {card.suit}
                                    </span>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .card-drawer-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1001;
    }
    .card-drawer-modal {
        position: relative;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .card-drawer-content {
        background: #fff;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        min-width: 300px;
        text-align: center;
        position: relative;
    }
    .card-drawer-content label {
        display: block;
        margin: 1rem 0;
        font-size: 1.1rem;
    }
    .card-drawer-actions {
        display: flex;
        justify-content: space-between;
        margin: 1rem 0;
    }
    .card-drawer-content button {
        width: 48%;
        padding: 0.75rem 0;
        font-size: 1.25rem;
        border-radius: 6px;
        border: none;
        margin: 0.5rem 1%;
        background: #1976d2;
        color: #fff;
        cursor: pointer;
        transition: background 0.2s;
    }
    .card-drawer-content button:last-child {
        background: #9da3aa;
    }
    .card-drawer-content button:active {
        background: #1565c0;
    }
    .card-drawer-info {
        margin-top: 1rem;
    }
    .drawn-cards {
        margin-top: 0.5rem;
    }
    .cards-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-content: center;
    }
    .card-chip {
        display: inline-block;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        background: #eee;
        font-size: 1.1rem;
        margin: 0.2rem;
        min-width: 48px;
    }
</style>
