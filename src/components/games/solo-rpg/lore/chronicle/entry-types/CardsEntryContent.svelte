<script lang="ts">
    import type { ChronicleEntry } from "../../../data/storage-utils";
    import PlayingCard from "../../PlayingCard.svelte";

    export let entry: ChronicleEntry;

    $: cardsData = entry.cardsData;
</script>

<div class="text-sm">
    {#if cardsData && cardsData.cards}
        <div class="mt-1 flex flex-wrap gap-1.5">
            {#each cardsData.cards as card}
                <PlayingCard rank={card.rank} suit={card.suit} />
            {/each}
        </div>
    {/if}
</div>
