<script lang="ts">
    import DiceRoller from './DiceRoller.svelte';
    import CardDealer from './CardDealer.svelte';
    let showDiceRoller = false;
    let showCardDealer = false;
</script>

<button on:click={() => showDiceRoller = true} style="margin-bottom: 1rem;">Dice Roller</button>
<button on:click={() => showCardDealer = true} style="margin-bottom: 1rem;">Card Dealer</button>

<DiceRoller show={showDiceRoller} onClose={() => showDiceRoller = false} />
<CardDealer show={showCardDealer} onClose={() => showCardDealer = false} />

<h1>Solo RPG</h1>

<style>
    h1 {
        text-align: center;
    }
</style>