<script lang="ts">
    import { onMount, createEventDispatcher } from "svelte";
    import "../../../solo-rpg-styles.css";
    import PlayingCard from "../../../lore/PlayingCard.svelte";
    
    const dispatch = createEventDispatcher();
    
    onMount(() => buildDeck());

    const suits = ["spade", "heart", "diamond", "club"] as const;
    const suitSymbols: Record<typeof suits[number], string> = {
        spade: "spade",
        heart: "heart",
        diamond: "diamond",
        club: "club"
    };
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
    const joker = { suit: "joker", rank: "Joker" } as const;

    type SuitKey = typeof suits[number] | "joker";

    let deck: { suit: SuitKey; rank: string }[] = [];
    let drawn: { suit: SuitKey; rank: string }[] = [];
    let numToDraw = 1;
    let includeJokers = false;

    export let embedded: boolean = false;

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
        
        if (embedded) {
            // When embedded in GameOracle, save to chronicle and navigate to story
            dispatch("recordFate", {
                type: "cards",
                cards: drawn.map(card => ({
                    suit: card.suit,
                    rank: card.rank
                }))
            });
        }
        
        drawn = [];
    }

    $: cardsRemaining = deck.length;
    $: deckIsNotFull = cardsRemaining < (includeJokers ? 54 : 52);
</script>

{#if embedded}
    <div class="card-dealer-embedded">
        <div class="card-drawer-info">
            <p>Cards Remaining: {cardsRemaining}</p>
            {#if !deckIsNotFull}
                <div class="options">
                    <label>
                        <input type="checkbox" bind:checked={includeJokers} on:change={buildDeck} /> Include Jokers
                    </label>
                </div>
            {/if}
            {#if drawn.length}
                <div class="drawn-cards">
                    <div class="cards-list">
                        {#each drawn as card}
                            <PlayingCard rank={card.rank} suit={card.suit} />
                        {/each}
                    </div>
                </div>
            {/if}
        </div>
        <div class="card-drawer-actions">
            <button class="srpg-b srpg-b-normal" on:click={drawCards} disabled={deck.length === 0}>Draw</button>
            <button class="srpg-b srpg-b-normal" on:click={handleUndo} disabled={drawn.length === 0}>Undo</button>
        </div>
        <hr class="divider" />
        <button id="take-result-button" class="srpg-b srpg-b-create srpg-b-w-full" on:click={onClickTakeResult} disabled={drawn.length === 0}>
            Take cards: {drawn.length}
        </button>
        <hr class="divider" />
        <button id="reset-deck-button" class="srpg-b srpg-b-normal srpg-b-w-full" on:click={buildDeck}>
            Shuffle Deck
        </button>
    </div>
{/if}

<style>
    .card-drawer-actions {
        display: flex;
        justify-content: space-between;
        margin: 1rem 0;
        gap: 1rem;
    }

    .card-drawer-info {
        margin-top: 1rem;
        font-size: 1.05rem;
    }
    .card-drawer-info p {
        margin-bottom: 0;
        font-size: 1.05rem;
    }
    .card-drawer-info label {
        font-size: 1rem;
        margin: 0;
    }
    .drawn-cards { margin-top: 0.5rem; }
    .cards-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-content: center;
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
        border-top: 1px solid var(--divider);
        margin: 1rem 0;
    }
</style>
