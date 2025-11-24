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

<div class="mt-2 flex w-full justify-center">
    <DiceScene {numDice} numSides={rolling ? rolledNumSides : numSides} {rolling} on:rollComplete />
</div>
