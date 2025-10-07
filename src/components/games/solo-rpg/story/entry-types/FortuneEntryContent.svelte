<script lang="ts">
    import type { ChronicleEntry } from "../../storage-utils";

    export let entry: ChronicleEntry;

    function isRedSuit(suit: string): boolean {
        return suit === "♥" || suit === "♦";
    }
</script>

{#if entry.fortuneData}
    <div class="fortune-content">
        <div class="fortune-inline">
            <span class="fortune-label">{entry.fortuneData.fortuneTitle}:</span>

            {#if entry.fortuneData.diceRoll}
                <span class="result-badge"
                    >{entry.fortuneData.diceRoll.result}</span
                >
                {#if entry.fortuneData.diceRoll.mappedOutcome}
                    <span class="result-text"
                        >{entry.fortuneData.diceRoll.mappedOutcome}</span
                    >
                {/if}
            {/if}

            {#if entry.fortuneData.cardDraw}
                <span
                    class="card-badge"
                    style="color: {isRedSuit(entry.fortuneData.cardDraw.suit)
                        ? '#dc2626'
                        : '#334155'}"
                >
                    {entry.fortuneData.cardDraw.rank}
                    {entry.fortuneData.cardDraw.suit}
                </span>
                {#if entry.fortuneData.cardDraw.suitMapped || entry.fortuneData.cardDraw.rankMapped}
                    <span class="result-text">
                        {entry.fortuneData.cardDraw.suitMapped ||
                            ""}{#if entry.fortuneData.cardDraw.suitMapped && entry.fortuneData.cardDraw.rankMapped}
                            •
                        {/if}{entry.fortuneData.cardDraw.rankMapped || ""}
                    </span>
                {/if}
            {/if}
        </div>
    </div>
{/if}

<style>
    .fortune-content {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .fortune-inline {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
        font-size: 0.9rem;
        line-height: 1;
    }

    .fortune-label {
        font-weight: 600;
        color: #525252;
    }

    .result-badge {
        background: #6366f1;
        color: white;
        font-weight: 700;
        font-size: 0.875rem;
        padding: 0.15rem 0.5rem;
        border-radius: 4px;
        line-height: 1.4;
    }

    .card-badge {
        background: #ffffff;
        color: white;
        font-weight: 700;
        font-size: 0.875rem;
        padding: 0.15rem 0.5rem;
        border-radius: 4px;
        border: 1px solid #d1d5db;
        line-height: 1.4;
    }

    .result-text {
        color: #525252;
        font-style: italic;
        font-size: 0.875rem;
    }
</style>
