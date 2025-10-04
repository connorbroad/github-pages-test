<script lang="ts">
    import { onMount } from "svelte";
    import "../solo-rpg-styles.css";
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
    let includeJokers = false;

    export let show = false;
    export let onClose: () => void;

    function buildDeck() {
        deck = [];
        for (const suit of suits) {
            for (const rank of ranks) {
                deck.push({ suit, rank });
            }
        }
        if (includeJokers) {
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

    function handleUndo() {
        deck = [...drawn, ...deck]; // Put drawn cards back in order
        drawn = [];
    }

    function drawCards() {
        if (deck.length === 0) return;
        const drawCount = Math.min(numToDraw, deck.length);
        const drawnCards = deck.slice(0, drawCount);
        deck = deck.slice(drawCount); // Reassign deck for Svelte reactivity
        drawn = [...drawn, ...drawnCards];
    }

    function onClickTakeResult() {
        if (drawn.length === 0) return;
        // Here you would typically pass the drawn cards to the parent component or game state
        // For now, we'll just clear the drawn cards
        drawn = [];
    }

    $: cardsRemaining = deck.length;
    $: deckIsNotFull = cardsRemaining < (includeJokers ? 54 : 52);
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
                <button
                    class="solo-rpg-modal-close"
                    aria-label="Close"
                    on:click={() => onClose && onClose()}>&times;</button
                >
                <h2>Card Dealer</h2>
                <div class="card-drawer-info">
                    <p>Cards Remaining: {cardsRemaining}</p>
                    {#if !deckIsNotFull}
                        <div class="options">
                            <label>
                                <input
                                    type="checkbox"
                                    bind:checked={includeJokers}
                                    on:change={buildDeck}
                                /> Include Jokers
                            </label>
                        </div>
                    {/if}
                    {#if drawn.length}
                        <div class="drawn-cards">
                            <div class="cards-list">
                                {#each drawn as card}
                                    <span
                                        class="card-chip"
                                        style="color: {card.suit === '♥' ||
                                        card.suit === '♦'
                                            ? 'red'
                                            : 'inherit'}"
                                    >
                                        {card.rank}
                                        {card.suit}
                                    </span>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
                <div class="card-drawer-actions">
                    <button
                        class="solo-rpg-button solo-rpg-button-normal"
                        on:click={drawCards}
                        disabled={deck.length === 0}>Draw</button
                    >
                    <button
                        class="solo-rpg-button solo-rpg-button-normal"
                        on:click={handleUndo}
                        disabled={drawn.length === 0}
                    >
                        Undo
                    </button>
                </div>
                <hr class="divider" />
                <button
                    id="take-result-button"
                    class="solo-rpg-button solo-rpg-button-create solo-rpg-button-full"
                    on:click={onClickTakeResult}
                    disabled={drawn.length === 0}
                >
                    Take cards: {drawn.length}
                </button>
                <hr class="divider" />
                <button
                    id="reset-deck-button"
                    class="solo-rpg-button solo-rpg-button-normal solo-rpg-button-full"
                    on:click={buildDeck}
                >
                    Shuffle Deck
                </button>
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
        min-width: 300px;
        max-width: 350px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 1rem;
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
        gap: 1rem;
    }
    
    .card-drawer-info {
        margin-top: 1rem;
        font-size: 1.1rem;
    }
    .card-drawer-info p {
        margin-bottom: 0;
        font-size: 1.1rem;
    }
    .card-drawer-info label {
        font-size: 1rem;
        margin: 0;
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
    
    .options {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 0.1rem;
        margin-bottom: 1rem;
    }
    .divider {
        border: none;
        border-top: 1px solid #ccc;
        margin: 1rem 0;
    }
</style>
