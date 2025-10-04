<script lang="ts">
    import DiceRoller from './dice-roller/DiceRoller.svelte';
    import CardDealer from './card-dealer/CardDealer.svelte';
    import GameOracle from './oracle/GameOracle.svelte';
    import DataManager from './data-manager/DataManager.svelte';
    import Sidebar from './Sidebar.svelte';
    import './solo-rpg-styles.css';
    
    type View = 'home' | 'tools' | 'oracle' | 'settings' | 'map' | 'story';
    let currentView: View = 'home';
    let showDiceRoller = false;
    let showCardDealer = false;

    function handleNavigate(view: View) {
        currentView = view;
    }

    function handleDataImported() {
        // Refresh all components that use stored data
        // This will trigger GameOracle to reload fortunes
        currentView = 'settings';
    }
</script>

<Sidebar {currentView} onNavigate={handleNavigate} />

<main class="content">
    {#if currentView === 'home'}
        <div class="home-view">
            <h1>Solo RPG</h1>
            <p>Welcome to your Solo RPG companion!</p>
            
        </div>
    {:else if currentView === 'oracle'}
        <div class="oracle-view">
            <h1>Oracle</h1>
            <GameOracle />
        </div>
    {:else if currentView === 'settings'}
        <div class="settings-view">
            <h1>Settings</h1>
            <div class="settings-description">
                <p>Manage your Solo RPG data and application settings.</p>
            </div>
            <DataManager onDataImported={handleDataImported} />
        </div>
    {:else if currentView === 'map'}
        <div class="map-view">
            <h1>Map</h1>
            <em>Coming Soon!</em>
        </div>
    {:else if currentView === 'story'}
        <div class="story-view">
            <h1>Story</h1>
            <div class="srpg-tool-grid">
                <button class="srpg-b srpg-b-normal srpg-b-normal" on:click={() => showDiceRoller = true}>Dice Roller</button>
                <button class="srpg-b srpg-b-normal srpg-b-normal" on:click={() => showCardDealer = true}>Card Dealer</button>
            </div>
            <br />
            <em>Coming Soon!</em>
        </div>
    {/if}
</main>

<DiceRoller show={showDiceRoller} onClose={() => showDiceRoller = false} />
<CardDealer show={showCardDealer} onClose={() => showCardDealer = false} />

<style>
    /* Layout */
    .content {
        min-height: 100vh;
        padding: 2rem;
        box-sizing: border-box;
    }

    /* Desktop - account for left sidebar */
    @media (min-width: 769px) {
        .content {
            margin-left: 80px;
            padding-bottom: 2rem;
        }
    }

    /* Mobile - account for bottom bar */
    @media (max-width: 768px) {
        .content {
            padding-bottom: calc(90px + env(safe-area-inset-bottom));
            padding: 1rem 1rem calc(90px + env(safe-area-inset-bottom)) 1rem;
        }
    }

    /* Views */
    h1 {
        text-align: center;
        margin-bottom: 1.5rem;
    }

    .home-view {
        max-width: 800px;
        margin: 0 auto;
    }

    .home-view p {
        text-align: center;
        font-size: 1.1rem;
        margin-bottom: 2rem;
        color: #666;
    }

    .oracle-view {
        max-width: 1200px;
        margin: 0 auto;
    }

    .oracle-view h1 {
        margin-bottom: 2rem;
    }

    .settings-view {
        max-width: 900px;
        margin: 0 auto;
    }

    .settings-view h1 {
        margin-bottom: 1rem;
    }

    .settings-description {
        text-align: center;
        margin-bottom: 2rem;
    }

    .settings-description p {
        color: #666;
        font-size: 1.1rem;
    }

    .map-view {
        max-width: 900px;
        margin: 0 auto;
    }

    .story-view {
        max-width: 900px;
        margin: 0 auto;
    }
</style>