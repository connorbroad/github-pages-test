<script lang="ts">
    /**
     * Reusable dice display component
     * Shows the visual representation of rolled dice
     */
    import DiceScene from "./DiceScene.svelte";

    export let numDice: number;
    export let numSides: number;
    export let rolledNumSides: number = numSides;
    export let rolling: boolean = false;
</script>

<div class="dice-results">
    <DiceScene 
        {numDice} 
        numSides={rolledNumSides} 
        {rolling}
        on:rollComplete
    />
</div>

<style>
    .dice-results {
        margin-top: 0.5rem;
        width: 100%;
        display: flex;
        justify-content: center;
    }
</style>
