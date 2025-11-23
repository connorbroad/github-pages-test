<script lang="ts">
    import { onMount, createEventDispatcher } from "svelte";

    import PlayingCard from "../../../lore/PlayingCard.svelte";

    const dispatch = createEventDispatcher();

    onMount(() => buildDeck());

    const suits = ["spade", "heart", "diamond", "club"] as const;
    const suitSymbols: Record<(typeof suits)[number], string> = {
        spade: "spade",
        heart: "heart",
        diamond: "diamond",
        club: "club",
    };
    const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const joker = { suit: "joker", rank: "Joker" } as const;

    type SuitKey = (typeof suits)[number] | "joker";

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
                cards: drawn.map((card) => ({
                    suit: card.suit,
                    rank: card.rank,
                })),
            });
        }

        drawn = [];
    }

    $: cardsRemaining = deck.length;
    $: deckIsNotFull = cardsRemaining < (includeJokers ? 54 : 52);
</script>

{#if embedded}
    <div class="card-dealer-embedded">
        <div class="mt-4 text-[1.05rem]">
            <p class="mb-0 text-[1.05rem]">Cards Remaining: {cardsRemaining}</p>
            {#if !deckIsNotFull}
                <div class="mb-4 flex flex-col justify-center gap-[0.1rem]">
                    <label class="m-0 text-base">
                        <input type="checkbox" bind:checked={includeJokers} on:change={buildDeck} />
                        Include Jokers
                    </label>
                </div>
            {/if}
            {#if drawn.length}
                <div class="mt-2">
                    <div class="flex flex-wrap justify-center gap-2">
                        {#each drawn as card}
                            <PlayingCard rank={card.rank} suit={card.suit} />
                        {/each}
                    </div>
                </div>
            {/if}
        </div>
        <div class="my-4 flex justify-between gap-4">
            <button
                class="border-border-primary bg-bg-secondary text-text-primary hover:bg-bg-tertiary active:bg-bg-secondary-active flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
                on:click={drawCards}
                disabled={deck.length === 0}>
                Draw
            </button>
            <button
                class="border-border-primary bg-bg-secondary text-text-primary hover:bg-bg-tertiary active:bg-bg-secondary-active flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
                on:click={handleUndo}
                disabled={drawn.length === 0}>
                Undo
            </button>
        </div>
        <hr class="border-divider my-4 border-t border-none" />
        <button
            id="take-result-button"
            class="border-border-primary bg-accent-success hover:bg-accent-success-hover active:bg-accent-success-active flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
            on:click={onClickTakeResult}
            disabled={drawn.length === 0}>
            Take cards: {drawn.length}
        </button>
        <hr class="border-divider my-4 border-t border-none" />
        <button
            id="reset-deck-button"
            class="border-border-primary bg-bg-secondary text-text-primary hover:bg-bg-tertiary active:bg-bg-secondary-active flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
            on:click={buildDeck}>
            Shuffle Deck
        </button>
    </div>
{/if}

<style>
</style>
