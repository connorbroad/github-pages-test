<script lang="ts">
    import type { ChronicleEntry } from "../../../data/storage-utils";

    export let entry: ChronicleEntry;

    $: diceData = entry.diceData;
</script>

<div class="text-sm">
    {#if diceData}
        <!-- Main Section: Title and Result -->
        <div class="flex flex-wrap items-center gap-2 leading-none">
            <span class="font-semibold text-(--text-primary)">
                {diceData.checkName || "Result"}
            </span>

            <span
                class="inline-block rounded bg-(--accent-primary) px-2 py-1 text-sm leading-snug font-bold text-white">
                {diceData.result}
            </span>
        </div>

        <!-- Details Section: Formula and Breakdown -->
        <div
            class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-(--text-secondary)">
            <span class="font-medium">
                {diceData.numDice}d{diceData.numSides}{diceData.modifier !== 0
                    ? (diceData.modifier > 0 ? "+" : "") + diceData.modifier
                    : ""}
                {#if diceData.numDice > 1}
                    ({diceData.resultOption})
                {/if}
            </span>

            {#if diceData.individualDiceResults && diceData.individualDiceResults.length > 0}
                <span class="text-(--text-muted)">•</span>
                <span class="italic">
                    Rolls: {diceData.individualDiceResults.join(", ")}
                </span>
            {/if}
        </div>
    {/if}
</div>
