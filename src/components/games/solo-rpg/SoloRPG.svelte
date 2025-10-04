<script lang="ts">
    import DiceRoller from './dice-roller/DiceRoller.svelte';
    import CardDealer from './card-dealer/CardDealer.svelte';
    import GameOracle from './oracle/GameOracle.svelte';
    import DataManager from './data-manager/DataManager.svelte';
    import Sidebar from './Sidebar.svelte';
    
    type View = 'home' | 'tools' | 'oracle' | 'settings';
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
            <p>Welcome to your Solo RPG companion! Use the sidebar to navigate to different tools and features.</p>
            <div class="quick-links">
                <h2>Quick Links</h2>
                <button on:click={() => handleNavigate('tools')}>Go to Tools</button>
                <button on:click={() => handleNavigate('oracle')}>Open Oracle</button>
                <button on:click={() => handleNavigate('settings')}>View Settings</button>
            </div>
        </div>
    {:else if currentView === 'oracle'}
        <div class="oracle-view">
            <h1>Oracle</h1>
            <GameOracle />
        </div>
    {:else if currentView === 'tools'}
        <div class="tools-view">
            <h1>Tools</h1>
            <div class="tool-buttons">
                <button on:click={() => showDiceRoller = true}>Dice Roller</button>
                <button on:click={() => showCardDealer = true}>Card Dealer</button>
            </div>
        </div>
    {:else if currentView === 'settings'}
        <div class="settings-view">
            <h1>Settings</h1>
            <div class="settings-description">
                <p>Manage your Solo RPG data and application settings.</p>
            </div>
            <DataManager onDataImported={handleDataImported} />
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

    h2 {
        margin-top: 1.5rem;
        margin-bottom: 1rem;
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

    .quick-links {
        background: #f5f5f5;
        padding: 2rem;
        border-radius: 8px;
        margin-top: 2rem;
    }

    .quick-links h2 {
        margin-top: 0;
    }

    .quick-links button {
        display: block;
        width: 100%;
        margin-bottom: 1rem;
        padding: 1rem;
        font-size: 1rem;
        background-color: #4a9eff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .quick-links button:hover {
        background-color: #3a8eef;
    }

    .tools-view, .settings-view {
        max-width: 1000px;
        margin: 0 auto;
    }

    .tool-buttons {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
        margin-top: 2rem;
    }

    .tool-buttons button {
        padding: 2rem;
        font-size: 1.1rem;
        background-color: #4a9eff;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .tool-buttons button:hover {
        background-color: #3a8eef;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
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

</style>