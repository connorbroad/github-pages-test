<script lang="ts">
    import type { ChronicleEntry } from "../../../data/storage-utils";

    export let entry: ChronicleEntry;

    $: diceData = entry.diceData;
</script>

<div class="dice-entry-content">
    {#if diceData}
        <div class="dice-result">
            <div class="dice-formula">
                {diceData.numDice}d{diceData.numSides}{diceData.modifier !== 0
                    ? (diceData.modifier > 0 ? "+" : "") + diceData.modifier
                    : ""}
                {#if diceData.numDice > 1}
                    <span class="result-option">({diceData.resultOption})</span>
                {/if}
            </div>
            <div class="dice-total">
                Result: <strong>{diceData.result}</strong>
            </div>
        </div>
        {#if diceData.individualDiceResults && diceData.individualDiceResults.length > 1}
            <div class="individual-dice">
                Individual rolls: {diceData.individualDiceResults.join(", ")}
            </div>
        {/if}
    {/if}
</div>

<style>
    .dice-entry-content {
        font-size: 0.9rem;
    }

    .dice-result {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.25rem;
    }

    .dice-formula {
        font-size: 1rem;
        color: #059669;
        font-weight: 600;
    }

    .result-option {
        font-size: 0.8rem;
        color: #6b7280;
        font-weight: normal;
    }

    .dice-total {
        font-size: 0.9rem;
        color: #374151;
    }

    .dice-total strong {
        font-size: 1.1rem;
        color: #059669;
        font-weight: 700;
    }

    .individual-dice {
        font-size: 0.8rem;
        color: #6b7280;
        font-style: italic;
        margin-top: 0.15rem;
    }
</style>
