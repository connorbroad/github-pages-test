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
                Result:
                <span class="result-badge">
                    {diceData.result}
                </span>
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
        font-weight: 600;
        color: var(--text-primary);
    }

    .result-option {
        font-size: 0.8rem;
        color: var(--text-secondary);
        font-weight: normal;
    }

    .dice-total {
        font-size: 0.9rem;
        color: var(--text-primary);
    }

    .individual-dice {
        font-size: 0.8rem;
        color: var(--text-secondary);
        font-style: italic;
        margin-top: 0.15rem;
    }

    .result-badge {
        background: var(--accent-info);
        color: var(--text-inverse);
        font-weight: 700;
        font-size: 0.875rem;
        padding: 0.15rem 0.5rem;
        border-radius: 4px;
        line-height: 1.4;
    }
</style>
