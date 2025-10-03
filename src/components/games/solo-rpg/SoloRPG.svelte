<script lang="ts">
    import DiceRoller from './dice-roller/DiceRoller.svelte';
    import CardDealer from './card-dealer/CardDealer.svelte';
    import GameOracle from './oracle/GameOracle.svelte';
    import DataManager from './data-manager/DataManager.svelte';
    let showDiceRoller = false;
    let showCardDealer = false;
    let showGameOracle = false;
    let showDataManager = false;

    function handleDataImported() {
        // Refresh all components that use stored data
        // This will trigger GameOracle to reload fortunes
        showGameOracle = false;
        setTimeout(() => {
            showGameOracle = false;
        }, 0);
    }
</script>

<h1>Solo RPG</h1>

<style>
    h1 {
        text-align: center;
    }
</style>

<button on:click={() => showDiceRoller = true} style="margin-bottom: 1rem;">Dice Roller</button>
<button on:click={() => showCardDealer = true} style="margin-bottom: 1rem;">Card Dealer</button>
<button on:click={() => showGameOracle = true} style="margin-bottom: 1rem;">Oracle</button>
<button on:click={() => showDataManager = true} style="margin-bottom: 1rem;">Data Manager</button>

<DiceRoller show={showDiceRoller} onClose={() => showDiceRoller = false} />
<CardDealer show={showCardDealer} onClose={() => showCardDealer = false} />
<GameOracle show={showGameOracle} onClose={() => showGameOracle = false} />
<DataManager show={showDataManager} onClose={() => showDataManager = false} onDataImported={handleDataImported} />