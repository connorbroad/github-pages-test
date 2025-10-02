<script lang="ts">
    import DiceRoller from './DiceRoller.svelte';
    import CardDealer from './CardDealer.svelte';
    import GameOracle from './GameOracle.svelte';
    let showDiceRoller = false;
    let showCardDealer = false;
    let showGameOracle = false;
</script>

<h1>Solo RPG</h1>

<style>
    h1 {
        text-align: center;
    }
</style>

<button on:click={() => showDiceRoller = true} style="margin-bottom: 1rem;">Dice Roller</button>
<button on:click={() => showCardDealer = true} style="margin-bottom: 1rem;">Card Dealer</button>
<button on:click={() => showGameOracle = true} style="margin-bottom: 1rem;">Game Oracle</button>

<DiceRoller show={showDiceRoller} onClose={() => showDiceRoller = false} />
<CardDealer show={showCardDealer} onClose={() => showCardDealer = false} />
<GameOracle show={showGameOracle} onClose={() => showGameOracle = false} />