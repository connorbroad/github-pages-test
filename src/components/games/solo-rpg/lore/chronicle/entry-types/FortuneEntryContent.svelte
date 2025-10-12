<script lang="ts">
    import type { ChronicleEntry } from "../../../data/storage-utils";

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
                <span class="result-badge">
                    {entry.fortuneData.diceRoll.result}
                </span>
                {#if entry.fortuneData.diceRoll.mappedOutcome}
                    <span class="result-text">
                        {entry.fortuneData.diceRoll.mappedOutcome}
                    </span>
                {/if}
                
                {#if entry.fortuneData.diceRoll.diceSignificance && Object.keys(entry.fortuneData.diceRoll.diceSignificance).length > 0 && entry.fortuneData.diceRoll.individualDiceResults.length > 0}
                    <div class="dice-significance">
                        {#if entry.fortuneData.diceRoll.resultOption === "Sum" || entry.fortuneData.diceRoll.resultOption === "Subtract"}
                            <!-- Show all dice with significance for Sum and Subtract -->
                            {#each entry.fortuneData.diceRoll.individualDiceResults as diceValue, index}
                                {#if entry.fortuneData.diceRoll.diceSignificance[index + 1]}
                                    <span class="significance-item">
                                        <strong>{entry.fortuneData.diceRoll.diceSignificance[index + 1]}:</strong> {diceValue}
                                    </span>
                                {/if}
                            {/each}
                        {:else if entry.fortuneData.diceRoll.resultOption === "Maximum"}
                            <!-- Show only the highest die with significance -->
                            {@const maxValue = Math.max(...entry.fortuneData.diceRoll.individualDiceResults)}
                            {@const maxIndex = entry.fortuneData.diceRoll.individualDiceResults.findIndex(v => v === maxValue)}
                            {#if entry.fortuneData.diceRoll.diceSignificance[maxIndex + 1]}
                                <span class="significance-item">
                                    <strong>{entry.fortuneData.diceRoll.diceSignificance[maxIndex + 1]}:</strong> {maxValue}
                                </span>
                            {/if}
                        {:else if entry.fortuneData.diceRoll.resultOption === "Minimum"}
                            <!-- Show only the lowest die with significance -->
                            {@const minValue = Math.min(...entry.fortuneData.diceRoll.individualDiceResults)}
                            {@const minIndex = entry.fortuneData.diceRoll.individualDiceResults.findIndex(v => v === minValue)}
                            {#if entry.fortuneData.diceRoll.diceSignificance[minIndex + 1]}
                                <span class="significance-item">
                                    <strong>{entry.fortuneData.diceRoll.diceSignificance[minIndex + 1]}:</strong> {minValue}
                                </span>
                            {/if}
                        {/if}
                    </div>
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

    .dice-significance {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .significance-item {
        color: #525252;
        font-size: 0.875rem;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
    }

    .significance-item strong {
        color: #6366f1;
        font-weight: 600;
    }
</style>
