<script lang="ts">
    import type { ChronicleEntry } from "../../../data/storage-utils";
    import PlayingCard from "../../PlayingCard.svelte";

    export let entry: ChronicleEntry;

    $: cardsData = entry.cardsData;
</script>

<div class="cards-entry-content">
    {#if cardsData && cardsData.cards}
        <div class="cards-list">
            {#each cardsData.cards as card}
                <PlayingCard rank={card.rank} suit={card.suit} />
            {/each}
        </div>
    {/if}
</div>

<style>
    .cards-entry-content {
        font-size: 0.9rem;
    }

    .cards-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin-top: 0.15rem;
    }
</style>
