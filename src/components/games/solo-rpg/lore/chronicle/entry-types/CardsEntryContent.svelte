<script lang="ts">
    import type { ChronicleEntry } from "../../../data/storage-utils";

    export let entry: ChronicleEntry;

    $: cardsData = entry.cardsData;

    function isRedSuit(suit: string): boolean {
        return suit === "heart" || suit === "diamond";
    }
</script>

<div class="cards-entry-content">
    {#if cardsData && cardsData.cards}
        <div class="cards-list">
            {#each cardsData.cards as card}
                <span
                    class="card-chip"
                    class:red-suit={isRedSuit(card.suit)}
                >
                    {card.rank}
                    <span class="suit-icon" aria-hidden="true">
                        {#if card.suit === "spade"}
                            <svg viewBox="0 0 24 24" width="14" height="14"
                                ><path
                                    fill="currentColor"
                                    d="M12 2c3 3 7 6.5 7 10a4 4 0 0 1-7 2.65A4 4 0 0 1 5 12c0-3.5 4-7 7-10Zm-2.5 18h5c.5 0 .5-.6.2-.9l-1.7-1.7c-.3-.3-.8-.4-1.2-.3-.4-.1-.9 0-1.2.3L9.3 19.1c-.3.3-.3.9.2.9Z"
                                /></svg
                            >
                        {:else if card.suit === "heart"}
                            <svg viewBox="0 0 24 24" width="14" height="14"
                                ><path
                                    fill="currentColor"
                                    d="M12.1 8.64l-.1.1-.1-.1C10.14 6.82 7.1 6.3 5.4 8.04c-1.83 1.86-1.35 5.02.98 7.37l5.72 5.74 5.72-5.74c2.33-2.35 2.81-5.51.98-7.37-1.7-1.74-4.74-1.22-6.6.6Z"
                                /></svg
                            >
                        {:else if card.suit === "diamond"}
                            <svg viewBox="0 0 24 24" width="14" height="14"
                                ><path
                                    fill="currentColor"
                                    d="m12 2 7 10-7 10L5 12 12 2Z"
                                /></svg
                            >
                        {:else if card.suit === "club"}
                            <svg viewBox="0 0 24 24" width="14" height="14"
                                ><path
                                    fill="currentColor"
                                    d="M12 6a3 3 0 0 1 2.65 4.36A3 3 0 1 1 9.35 10 3 3 0 1 1 12 6Zm-2.5 14h5c.5 0 .5-.6.2-.9l-1.7-1.7c-.3-.3-.8-.4-1.2-.3-.4-.1-.9 0-1.2.3L9.3 19.1c-.3.3-.3.9.2.9Z"
                                /></svg
                            >
                        {:else}
                            <svg viewBox="0 0 24 24" width="14" height="14"
                                ><rect
                                    x="3"
                                    y="3"
                                    width="18"
                                    height="18"
                                    rx="2"
                                    stroke="currentColor"
                                    fill="none"
                                /></svg
                            >
                        {/if}
                    </span>
                </span>
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

    .card-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        background: var(--card-bg);
        border: 2px solid var(--border-primary);
        border-radius: 6px;
        padding: 0.35rem 0.55rem;
        font-weight: 600;
        font-size: 0.9rem;
        box-shadow: 0 1px 2px var(--shadow-sm);
        transition: all 0.15s ease;
        color: var(--text-primary);
    }

    .card-chip.red-suit {
        color: var(--accent-danger);
    }

    .card-chip:hover {
        box-shadow: 0 2px 4px var(--shadow-md);
        transform: translateY(-1px);
    }

    .suit-icon {
        display: inline-flex;
        align-items: center;
    }
</style>
