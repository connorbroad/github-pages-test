<script lang="ts">
    import DiceRoller from './dice-roller/DiceRoller.svelte';
    import CardDealer from './card-dealer/CardDealer.svelte';
    import GameOracle from './oracle/GameOracle.svelte';
    import DataManager from './data-manager/DataManager.svelte';
    import Sidebar from './Sidebar.svelte';
    import GameBlueprintEditor from './GameBlueprintEditor.svelte';
    import CampaignCreator from './CampaignCreator.svelte';
    import CampaignLoadConfirm from './CampaignLoadConfirm.svelte';
    import StoryView from './story/StoryView.svelte';
    import MapView from './map/MapView.svelte';
    import { loadGameBlueprints, saveGameBlueprints, loadCampaigns, saveCampaigns } from './storage-utils';
    import { generateId } from './oracle/scripts/oracleTypes';
    import { type GameBlueprint, type Campaign } from './storage-utils';
    import { activeCampaign } from './campaign-store';
    import { onMount } from 'svelte';
    import './solo-rpg-styles.css';
    
    type View = 'home' | 'tools' | 'oracle' | 'settings' | 'map' | 'story';
    let currentView: View = 'home';
    let showDiceRoller = false;
    let showCardDealer = false;
    let showBlueprintEditor = false;
    let showCampaignCreator = false;
    let showCampaignLoadConfirm = false;
    let gameBlueprints: GameBlueprint[] = [];
    let campaigns: Campaign[] = [];
    let editingBlueprint: GameBlueprint = {
        id: '',
        title: '',
        defaultFortunes: []
    };
    let selectedBlueprint: GameBlueprint | null = null;
    let selectedCampaignForLoad: Campaign | null = null;
    let expandedBlueprints: Set<string> = new Set();

    onMount(() => {
        gameBlueprints = loadGameBlueprints();
        campaigns = loadCampaigns();
        activeCampaign.initialize();
    });

    function handleNavigate(view: View) {
        currentView = view;
    }

    function handleDataImported() {
        // Refresh all components that use stored data
        gameBlueprints = loadGameBlueprints();
        campaigns = loadCampaigns();
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

    function openCampaignCreator(blueprint: GameBlueprint) {
        selectedBlueprint = blueprint;
        showCampaignCreator = true;
    }

    function createCampaign(event: CustomEvent<string>) {
        if (!selectedBlueprint) return;
        
        const campaignTitle = event.detail;
        const newCampaign: Campaign = {
            id: generateId(),
            title: campaignTitle,
            blueprintId: selectedBlueprint.id,
            blueprintTitle: selectedBlueprint.title,
            createdAt: Date.now()
        };
        
        campaigns = [...campaigns, newCampaign];
        saveCampaigns(campaigns);
        
        // Automatically expand the blueprint to show the new campaign
        expandedBlueprints.add(selectedBlueprint.id);
        expandedBlueprints = expandedBlueprints;
        
        showCampaignCreator = false;
        selectedBlueprint = null;
    }

    function toggleBlueprint(blueprintId: string) {
        if (expandedBlueprints.has(blueprintId)) {
            expandedBlueprints.delete(blueprintId);
        } else {
            expandedBlueprints.add(blueprintId);
        }
        expandedBlueprints = expandedBlueprints;
    }

    function getCampaignsForBlueprint(blueprintId: string): Campaign[] {
        return campaigns.filter(c => c.blueprintId === blueprintId);
    }

    function formatDate(timestamp: number): string {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }

    function openCampaignLoadConfirm(campaign: Campaign) {
        selectedCampaignForLoad = campaign;
        showCampaignLoadConfirm = true;
    }

    function handleLoadCampaign(event: CustomEvent<Campaign>) {
        const campaign = event.detail;
        activeCampaign.load(campaign);
        showCampaignLoadConfirm = false;
        selectedCampaignForLoad = null;
    }
</script>

<Sidebar {currentView} onNavigate={handleNavigate} />

<main class="content">
    {#if currentView === 'home'}
        <div class="home-view">
            <h1>Solo RPG</h1>
            <p>Welcome to your Solo RPG companion!</p>
            
            {#if $activeCampaign}
                <div class="active-campaign-banner">
                    <div class="banner-content">
                        <div class="banner-info">
                            <span class="banner-label">Active Campaign:</span>
                            <span class="banner-title">{$activeCampaign.title}</span>
                            <span class="banner-meta">{$activeCampaign.blueprintTitle}</span>
                        </div>
                    </div>
                </div>
            {/if}

            <div class="new-game-section">
                <button class="srpg-b srpg-b-create srpg-b-w-full" on:click={openCreateBlueprint}>
                    + Create Game Blueprint
                </button>
                
                {#if gameBlueprints.length > 0}
                    <h2>Your Games</h2>
                    
                    <div class="blueprints-list">
                        {#each gameBlueprints as blueprint}
                            {@const blueprintCampaigns = getCampaignsForBlueprint(blueprint.id)}
                            {@const isExpanded = expandedBlueprints.has(blueprint.id)}
                            
                            <div class="blueprint-section">
                                <div class="blueprint-header">
                                    <button 
                                        class="blueprint-toggle"
                                        on:click={() => toggleBlueprint(blueprint.id)}
                                    >
                                        <span class="collapse-icon" class:expanded={isExpanded}>
                                            ▶
                                        </span>
                                        <span class="blueprint-title">
                                            {blueprint.title}
                                        </span>
                                        <span class="blueprint-meta">
                                            ({blueprintCampaigns.length} campaign{blueprintCampaigns.length !== 1 ? 's' : ''})
                                        </span>
                                    </button>
                                    <button 
                                        class="add-campaign-btn srpg-b srpg-b-create srpg-b-small"
                                        on:click={() => openCampaignCreator(blueprint)}
                                        title="Create new campaign"
                                    >
                                        +
                                    </button>
                                </div>

                                {#if isExpanded}
                                    <div class="campaigns-container">
                                        {#if blueprintCampaigns.length > 0}
                                            <div class="campaigns-grid">
                                                {#each blueprintCampaigns as campaign}
                                                    <button 
                                                        class="campaign-card srpg-b srpg-b-normal"
                                                        class:active={$activeCampaign?.id === campaign.id}
                                                        on:click={() => openCampaignLoadConfirm(campaign)}
                                                    >
                                                        <strong class="campaign-name">{campaign.title}</strong>
                                                        <span class="campaign-date">
                                                            {formatDate(campaign.createdAt)}
                                                        </span>
                                                    </button>
                                                {/each}
                                            </div>
                                        {:else}
                                            <p class="no-campaigns">
                                                No campaigns yet. Click the + button to create one.
                                            </p>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
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
        <MapView />
    {:else if currentView === 'story'}
        <StoryView 
            on:openDiceRoller={() => showDiceRoller = true}
            on:openCardDealer={() => showCardDealer = true}
        />
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
<CampaignCreator
    show={showCampaignCreator}
    blueprint={selectedBlueprint}
    on:close={() => {
        showCampaignCreator = false;
        selectedBlueprint = null;
    }}
    on:create={createCampaign}
/>
<CampaignLoadConfirm
    show={showCampaignLoadConfirm}
    campaign={selectedCampaignForLoad}
    on:close={() => {
        showCampaignLoadConfirm = false;
        selectedCampaignForLoad = null;
    }}
    on:load={handleLoadCampaign}
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

    .active-campaign-banner { 
        background: white;
        color: rgb(47, 48, 50);
        padding: 1rem 1.5rem; 
        margin-bottom: 2rem; 
 
        border-radius: 8px;  
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        margin: 0 auto;
    }

    .banner-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
    }

    .banner-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .banner-label {
        font-size: 0.9rem;
        opacity: 0.9;
    }

    .banner-title {
        font-size: 1.1rem;
        font-weight: 600;
    }

    .banner-meta {
        font-size: 0.9rem;
        opacity: 0.85;
    }

    @media (max-width: 600px) {
        .banner-content {
            flex-direction: column;
            align-items: stretch;
        }

        .banner-info {
            justify-content: center;
        }
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

    .blueprints-list {
        margin-top: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .blueprint-section {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        overflow: hidden;
        background: #fff;
    }

    .blueprint-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem 0.75rem 0.5rem 0.5rem;
        background: #f8f9fa;
    }

    .blueprint-toggle {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem 0.75rem;
        background: transparent;
        border: none;
        cursor: pointer;
        transition: background-color 0.2s;
        font-size: 1rem;
        text-align: left;
        border-radius: 6px;
    }

    .blueprint-toggle:hover {
        background: rgba(0, 0, 0, 0.05);
    }

    .collapse-icon {
        font-size: 0.75rem;
        color: #666;
        transition: transform 0.2s;
        display: inline-block;
        width: 1rem;
    }

    .collapse-icon.expanded {
        transform: rotate(90deg);
    }

    .blueprint-title {
        flex: 1;
        font-weight: 600;
        color: #333;
    }

    .blueprint-meta {
        font-weight: 400;
        font-size: 0.875rem;
        color: #666;
        margin-left: 0.5rem;
    }

    .add-campaign-btn {
        padding: 0.4rem 0.75rem;
        font-size: 1.2rem;
        line-height: 1;
        font-weight: bold;
        flex-shrink: 0;
    }

    .campaigns-container {
        padding: 1rem 1.25rem;
        background: #fafbfc;
    }

    .campaigns-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 0.75rem;
    }

    .campaign-card {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        padding: 1rem;
        min-height: 80px;
        text-align: left;
        gap: 0.5rem;
        position: relative;
        transition: all 0.2s ease;
    }

    .campaign-card.active {
        background-color: #10b981;
        border-color: #059669;
    }

    .campaign-card.active:hover:not(:disabled) {
        background-color: #059669;
        border-color: #047857;
    }

    .campaign-card.active::after {
        content: "✓ Active";
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        font-size: 0.7rem;
        font-weight: 600;
        opacity: 0.9;
    }

    .campaign-name {
        font-size: 1rem;
        word-break: break-word;
    }

    .campaign-date {
        font-size: 0.75rem;
        opacity: 0.7;
        font-weight: normal;
    }

    .no-campaigns {
        text-align: center;
        color: #999;
        font-style: italic;
        padding: 1.5rem;
        margin: 0;
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