<script lang="ts">
    import type { ChronicleEntry } from "../../../data/storage-utils";

    export let entry: ChronicleEntry;

    function isRedSuit(suit: string): boolean {
        return suit === "♥" || suit === "♦";
    }
</script>

{#if entry.fortuneData}
    <div class="flex flex-col gap-1">
        <!-- Main Section: Title and Result -->
        <div class="flex flex-wrap items-center gap-2 text-sm leading-none">
            <span class="font-semibold text-gray-900 dark:text-gray-100">
                {entry.fortuneData.fortuneTitle}:
            </span>

            {#if entry.fortuneData.diceRoll}
                <span
                    class="inline-block rounded bg-blue-500 px-2 py-1 text-sm leading-snug font-bold text-white">
                    {entry.fortuneData.diceRoll.result}
                </span>
                {#if entry.fortuneData.diceRoll.mappedOutcome}
                    <span class="text-gray-900 italic dark:text-gray-100">
                        {entry.fortuneData.diceRoll.mappedOutcome}
                    </span>
                {/if}
            {/if}

            {#if entry.fortuneData.cardDraw}
                <span
                    class="inline-block rounded border border-gray-300 bg-white px-2 py-1 text-sm leading-snug font-bold text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 {isRedSuit(
                        entry.fortuneData.cardDraw.suit
                    )
                        ? 'text-red-600 dark:text-red-400'
                        : ''}">
                    {entry.fortuneData.cardDraw.rank}
                    {entry.fortuneData.cardDraw.suit}
                </span>
                {#if entry.fortuneData.cardDraw.suitMapped || entry.fortuneData.cardDraw.rankMapped}
                    <span class="text-gray-900 italic dark:text-gray-100">
                        {entry.fortuneData.cardDraw.suitMapped ||
                            ""}{#if entry.fortuneData.cardDraw.suitMapped && entry.fortuneData.cardDraw.rankMapped}
                            •
                        {/if}{entry.fortuneData.cardDraw.rankMapped || ""}
                    </span>
                {/if}
            {/if}
        </div>

        <!-- Details Section: Dice Breakdown -->
        {#if entry.fortuneData.diceRoll}
            <div
                class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                <!-- Formula -->
                <span class="font-medium">
                    {entry.fortuneData.diceRoll.numDice}d{entry.fortuneData.diceRoll.numSides}{entry
                        .fortuneData.diceRoll.modifier !== 0
                        ? (entry.fortuneData.diceRoll.modifier > 0 ? "+" : "") +
                          entry.fortuneData.diceRoll.modifier
                        : ""}
                </span>

                <!-- Significance / Individual Rolls -->
                {#if entry.fortuneData.diceRoll.diceSignificance && Object.keys(entry.fortuneData.diceRoll.diceSignificance).length > 0 && entry.fortuneData.diceRoll.individualDiceResults.length > 0}
                    <span class="text-gray-400 dark:text-gray-600">•</span>
                    <div class="flex flex-wrap items-center gap-2">
                        {#if entry.fortuneData.diceRoll.resultOption === "Sum" || entry.fortuneData.diceRoll.resultOption === "Subtract"}
                            <!-- Show all dice with significance for Sum and Subtract -->
                            {#each entry.fortuneData.diceRoll.individualDiceResults as diceValue, index}
                                {#if entry.fortuneData.diceRoll.diceSignificance[index + 1]}
                                    <span class="inline-flex items-center gap-1">
                                        <strong
                                            class="font-semibold text-blue-600 dark:text-blue-400">
                                            {entry.fortuneData.diceRoll.diceSignificance[
                                                index + 1
                                            ]}:
                                        </strong>
                                        {diceValue}
                                    </span>
                                {/if}
                            {/each}
                        {:else if entry.fortuneData.diceRoll.resultOption === "Maximum"}
                            <!-- Show only the highest die with significance -->
                            {@const maxValue = Math.max(
                                ...entry.fortuneData.diceRoll.individualDiceResults
                            )}
                            {@const maxIndex =
                                entry.fortuneData.diceRoll.individualDiceResults.findIndex(
                                    (v) => v === maxValue
                                )}
                            {#if entry.fortuneData.diceRoll.diceSignificance[maxIndex + 1]}
                                <span class="inline-flex items-center gap-1">
                                    <strong class="font-semibold text-blue-600 dark:text-blue-400">
                                        {entry.fortuneData.diceRoll.diceSignificance[maxIndex + 1]}:
                                    </strong>
                                    {maxValue}
                                </span>
                            {/if}
                        {:else if entry.fortuneData.diceRoll.resultOption === "Minimum"}
                            <!-- Show only the lowest die with significance -->
                            {@const minValue = Math.min(
                                ...entry.fortuneData.diceRoll.individualDiceResults
                            )}
                            {@const minIndex =
                                entry.fortuneData.diceRoll.individualDiceResults.findIndex(
                                    (v) => v === minValue
                                )}
                            {#if entry.fortuneData.diceRoll.diceSignificance[minIndex + 1]}
                                <span class="inline-flex items-center gap-1">
                                    <strong class="font-semibold text-blue-600 dark:text-blue-400">
                                        {entry.fortuneData.diceRoll.diceSignificance[minIndex + 1]}:
                                    </strong>
                                    {minValue}
                                </span>
                            {/if}
                        {/if}
                    </div>
                {:else if entry.fortuneData.diceRoll.individualDiceResults.length > 1}
                    <!-- Fallback for multiple dice without significance -->
                    <span class="text-gray-400 dark:text-gray-600">•</span>
                    <span class="italic">
                        Rolls: {entry.fortuneData.diceRoll.individualDiceResults.join(", ")}
                    </span>
                {/if}
            </div>
        {/if}
    </div>
{/if}
