<script lang="ts">
    /**
     * Reusable dice display component
     * Shows the visual representation of rolled dice
     */
    import DiceIcon from "./DiceIcon.svelte";

    export let numDice: number;
    export let numSides: number;
    export let diceResults: number[] = [];
    export let diceOffsets: { x: number; y: number; r: number }[] = [];
    export let rolledNumSides: number = numSides;
</script>

<div class="dice-results">
    <div class="dice-result-list">
        {#if diceResults.length > 0}
            {#each diceResults as result, i}
                <span class="dice-result-item">
                    <DiceIcon
                        numSides={rolledNumSides}
                        value={result}
                        offset={diceOffsets[i] || { x: 0, y: 0, r: 0 }}
                    />
                </span>
            {/each}
        {:else}
            {#each Array(numDice) as _, i}
                <span class="dice-result-item">
                    <DiceIcon
                        {numSides}
                        offset={{ x: 0, y: 0, r: 0 }}
                        animated={false}
                    />
                </span>
            {/each}
        {/if}
    </div>
</div>

<style>
    .dice-results {
        margin-top: 1rem;
    }

    .dice-result-list {
        display: flex;
        gap: 0rem;
        justify-content: center;
        flex-wrap: wrap;
        margin-bottom: 1rem;
    }

    .dice-result-item {
        display: flex;
        align-items: center;
        position: relative;
        font-size: 1.3rem;
    }
</style>
