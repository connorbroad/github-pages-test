<script lang="ts">
    import DiceRoller from './dice-roller/DiceRoller.svelte';
    import CardDealer from './card-dealer/CardDealer.svelte';
    import GameOracle from './oracle/GameOracle.svelte';
    import DataManager from './data-manager/DataManager.svelte';
    import Sidebar from './Sidebar.svelte';
    import GameBlueprintEditor from './GameBlueprintEditor.svelte';
    import { loadGameBlueprints, saveGameBlueprints } from './storage-utils';
    import { generateId } from './oracle/scripts/oracleTypes';
    import { type GameBlueprint } from './storage-utils';
    import { onMount } from 'svelte';
    import './solo-rpg-styles.css';
    
    type View = 'home' | 'tools' | 'oracle' | 'settings' | 'map' | 'story';
    let currentView: View = 'home';
    let showDiceRoller = false;
    let showCardDealer = false;
    let showBlueprintEditor = false;
    let gameBlueprints: GameBlueprint[] = [];
    let editingBlueprint: GameBlueprint = {
        id: '',
        title: '',
        defaultFortunes: []
    };

    onMount(() => {
        gameBlueprints = loadGameBlueprints();
    });

    function handleNavigate(view: View) {
        currentView = view;
    }

    function handleDataImported() {
        // Refresh all components that use stored data
        gameBlueprints = loadGameBlueprints();
        currentView = 'settings';
    }

    function openCreateBlueprint() {
        editingBlueprint = {
            id: generateId(),
            title: '',
            defaultFortunes: []
        };
        showBlueprintEditor = true;
    }

    function saveBlueprint(event: CustomEvent<GameBlueprint>) {
        const blueprint = event.detail;
        const existingIndex = gameBlueprints.findIndex(b => b.id === blueprint.id);
        
        if (existingIndex >= 0) {
            gameBlueprints[existingIndex] = blueprint;
        } else {
            gameBlueprints = [...gameBlueprints, blueprint];
        }
        
        saveGameBlueprints(gameBlueprints);
        showBlueprintEditor = false;
    }
</script>

<Sidebar {currentView} onNavigate={handleNavigate} />

<main class="content">
    {#if currentView === 'home'}
        <div class="home-view">
            <h1>Solo RPG</h1>
            <p>Welcome to your Solo RPG companion!</p>
            
            <div class="new-game-section">
                <button class="srpg-b srpg-b-create srpg-b-w-full" on:click={openCreateBlueprint}>
                    + Create Game Blueprint
                </button>
                
                {#if gameBlueprints.length > 0}
                    <h2>New Game</h2>
                    <div class="blueprint-grid">
                        {#each gameBlueprints as blueprint}
                            <button class="blueprint-button srpg-b srpg-b-normal">
                                <strong>{blueprint.title}</strong>
                                <span class="blueprint-info">
                                    {blueprint.defaultFortunes.length} fortune{blueprint.defaultFortunes.length !== 1 ? 's' : ''}
                                </span>
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
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
<GameBlueprintEditor 
    show={showBlueprintEditor} 
    blueprint={editingBlueprint}
    on:close={() => showBlueprintEditor = false}
    on:save={saveBlueprint}
/>

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

    .new-game-section {
        margin-top: 2rem;
    }

    .new-game-section h2 {
        margin-top: 2rem;
        margin-bottom: 1rem;
        color: #333;
        font-size: 1.3rem;
    }

    .blueprint-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }

    .blueprint-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 1.5rem 1rem;
        min-height: 100px;
        text-align: center;
        gap: 0.5rem;
    }

    .blueprint-button strong {
        font-size: 1.1rem;
    }

    .blueprint-info {
        font-size: 0.875rem;
        opacity: 0.8;
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