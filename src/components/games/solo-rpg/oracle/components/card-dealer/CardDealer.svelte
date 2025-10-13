<script lang="ts">
    import { onMount, createEventDispatcher } from "svelte";
    import "../../../solo-rpg-styles.css";
    
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
                            <span class="card-chip" class:red-suit={card.suit === 'heart' || card.suit === 'diamond'}>
                                {card.rank}
                                <span class="suit-icon" aria-hidden="true">
                                    {#if card.suit === 'spade'}
                                        <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M12 2c3 3 7 6.5 7 10a4 4 0 0 1-7 2.65A4 4 0 0 1 5 12c0-3.5 4-7 7-10Zm-2.5 18h5c.5 0 .5-.6.2-.9l-1.7-1.7c-.3-.3-.8-.4-1.2-.3-.4-.1-.9 0-1.2.3L9.3 19.1c-.3.3-.3.9.2.9Z"/></svg>
                                    {:else if card.suit === 'heart'}
                                        <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M12.1 8.64l-.1.1-.1-.1C10.14 6.82 7.1 6.3 5.4 8.04c-1.83 1.86-1.35 5.02.98 7.37l5.72 5.74 5.72-5.74c2.33-2.35 2.81-5.51.98-7.37-1.7-1.74-4.74-1.22-6.6.6Z"/></svg>
                                    {:else if card.suit === 'diamond'}
                                        <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="m12 2 7 10-7 10L5 12 12 2Z"/></svg>
                                    {:else if card.suit === 'club'}
                                        <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M12 6a3 3 0 0 1 2.65 4.36A3 3 0 1 1 9.35 10 3 3 0 1 1 12 6Zm-2.5 14h5c.5 0 .5-.6.2-.9l-1.7-1.7c-.3-.3-.8-.4-1.2-.3-.4-.1-.9 0-1.2.3L9.3 19.1c-.3.3-.3.9.2.9Z"/></svg>
                                    {:else}
                                        <svg viewBox="0 0 24 24" width="14" height="14"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" fill="none"/></svg>
                                    {/if}
                                </span>
                            </span>
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
    .card-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.4rem 0.7rem;
        border-radius: 999px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-primary);
        font-size: 0.95rem;
        margin: 0.2rem;
        min-width: 48px;
        color: var(--text-primary);
    }
    .card-chip.red-suit {
        color: var(--accent-danger);
    }
    .suit-icon { display: inline-flex; }

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
