<script lang="ts">
    import DiceRoller from './DiceRoller.svelte';
    let showDiceRoller = false;
</script>

<button on:click={() => showDiceRoller = true} style="margin-bottom: 1rem;">Open Dice Roller</button>

<DiceRoller show={showDiceRoller} onClose={() => showDiceRoller = false} />

<h1>Solo RPG</h1>

<style>
    h1 {
        text-align: center;
    }
</style>