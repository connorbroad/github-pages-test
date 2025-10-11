<script lang="ts">
    import DiceRoller from "./oracle/components/dice-roller/DiceRoller.svelte";
    import CardDealer from "./oracle/components/card-dealer/CardDealer.svelte";
    import GameOracle from "./oracle/GameOracle.svelte";
    import DataManager from "./data/DataManager.svelte";
    import Sidebar from "./Sidebar.svelte";
    import SecondarySidebar from "./SecondarySidebar.svelte";
    import TertiarySidebar from "./TertiarySidebar.svelte";
    import GameBlueprintEditor from "./game-management/GameBlueprintEditor.svelte";
    import CampaignCreator from "./game-management/CampaignCreator.svelte";
    import CampaignLoadConfirm from "./game-management/CampaignLoadConfirm.svelte";
    import StoryView from "./lore/StoryView.svelte";
    import MapView from "./map/MapView.svelte";
    import {
        loadGameBlueprints,
        saveGameBlueprints,
        loadCampaigns,
        saveCampaigns,
    } from "./data/storage-utils";
    import { generateId } from "./oracle/scripts/oracleTypes";
    import { type GameBlueprint, type Campaign } from "./data/storage-utils";
    import { activeCampaign } from "./game-management/campaign-store";
    import { onMount } from "svelte";
    import "./solo-rpg-styles.css";

    type View = "home" | "tools" | "oracle" | "settings" | "map" | "story";
    let currentView: View = "home";
    let activeStoryTab: "chronicle" | "characters" | "codex" = "chronicle";

    // Tertiary sidebar state (for character sheet controls)
    let showTertiarySidebar = false;
    let tertiaryVisibleSections: string[] = ["information"];
    let tertiarySelectedSections: Set<string> = new Set();
    let tertiaryIsEditingSections: boolean = false;
    let currentCharacter: any = null;

    let showDiceRoller = false;
    let showCardDealer = false;
    let storyViewComponent: any;

    let showBlueprintEditor = false;
    let showCampaignCreator = false;
    let showCampaignLoadConfirm = false;
    let gameBlueprints: GameBlueprint[] = [];
    let campaigns: Campaign[] = [];
    let editingBlueprint: GameBlueprint = {
        id: "",
        title: "",
        defaultFortunes: [],
    };
    let selectedBlueprint: GameBlueprint | null = null;
    let selectedCampaignForLoad: Campaign | null = null;
    let expandedBlueprints: Set<string> = new Set();

    $: campaignsByBlueprint = gameBlueprints.reduce(
        (acc, blueprint) => {
            acc[blueprint.id] = campaigns.filter(
                (c) => c.blueprintId === blueprint.id,
            );
            return acc;
        },
        {} as Record<string, Campaign[]>,
    );

    onMount(() => {
        gameBlueprints = loadGameBlueprints();
        campaigns = loadCampaigns();
        activeCampaign.initialize();
    });

    function handleNavigate(view: View) {
        currentView = view;
        // Reset story tab when leaving story view
        if (view !== "story") {
            activeStoryTab = "chronicle";
            // Hide tertiary sidebar when leaving story view
            showTertiarySidebar = false;
        }
    }

    function handleStoryTabChange(tab: "chronicle" | "characters" | "codex") {
        activeStoryTab = tab;

        // Clear tertiary sidebar when switching tabs
        if (tab !== "characters") {
            showTertiarySidebar = false;
        }
    }

    function handleCharacterSelected(event: CustomEvent) {
        const {
            character,
            isEditing,
            isEditingSections,
            selectedSections,
            visibleSections,
        } = event.detail;
        currentCharacter = character;
        tertiaryVisibleSections = visibleSections;
        tertiarySelectedSections = selectedSections;
        tertiaryIsEditingSections = isEditingSections;
        showTertiarySidebar = true;
    }

    function handleCharacterDeselected() {
        showTertiarySidebar = false;
        currentCharacter = null;
    }

    function handleTertiaryToggleSection(section: string) {
        if (storyViewComponent && storyViewComponent.toggleCharacterSection) {
            storyViewComponent.toggleCharacterSection(section);
        }
    }

    function handleDataImported() {
        // Refresh all components that use stored data
        gameBlueprints = loadGameBlueprints();
        campaigns = loadCampaigns();
        currentView = "settings";
    }

    function openCreateBlueprint() {
        editingBlueprint = {
            id: generateId(),
            title: "",
            defaultFortunes: [],
        };
        showBlueprintEditor = true;
    }

    function openEditBlueprint(blueprint: GameBlueprint) {
        editingBlueprint = {
            id: blueprint.id,
            title: blueprint.title,
            defaultFortunes: [...blueprint.defaultFortunes],
        };
        showBlueprintEditor = true;
    }

    function saveBlueprint(event: CustomEvent<GameBlueprint>) {
        const blueprint = event.detail;
        const existingIndex = gameBlueprints.findIndex(
            (b) => b.id === blueprint.id,
        );

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
            createdAt: Date.now(),
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
        return campaigns.filter((c) => c.blueprintId === blueprintId);
    }

    function formatDate(timestamp: number): string {
        const date = new Date(timestamp);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
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

        // Switch to story view
        currentView = "story";
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function unloadCampaign() {
        activeCampaign.unload();
    }
</script>

<Sidebar {currentView} onNavigate={handleNavigate} />

<SecondarySidebar
    show={currentView === "story"}
    activeTab={activeStoryTab}
    onTabChange={handleStoryTabChange}
/>

<TertiarySidebar
    show={showTertiarySidebar}
    visibleSections={tertiaryVisibleSections}
    selectedSections={tertiarySelectedSections}
    isEditingSections={tertiaryIsEditingSections}
    onToggleSection={handleTertiaryToggleSection}
/>

<main
    class="content"
    class:has-secondary={currentView === "story"}
    class:has-tertiary={showTertiarySidebar}
>
    {#if currentView === "home"}
        <div class="home-view">
            <h1>Solo RPG</h1>
            <p>Welcome to your Solo RPG companion!</p>

            {#if $activeCampaign}
                <div class="info-card">
                    <div class="banner-content">
                        <div class="banner-info">
                            <span class="banner-label">Active Campaign:</span>
                            <span class="banner-title"
                                >{$activeCampaign.title}</span
                            >
                            <span class="banner-meta"
                                >{$activeCampaign.blueprintTitle}</span
                            >
                        </div>
                        <button
                            class="srpg-b srpg-b-sm srpg-b-normal"
                            on:click={unloadCampaign}
                            title="Unload campaign"
                        >
                            Unload
                        </button>
                    </div>
                </div>
            {/if}

            <div class="new-game-section">
                <button
                    class="srpg-b srpg-b-create srpg-b-w-full"
                    on:click={openCreateBlueprint}
                >
                    + Create Game Blueprint
                </button>

                {#if gameBlueprints.length > 0}
                    <h2>Your Games</h2>

                    <div class="blueprints-list">
                        {#each gameBlueprints as blueprint (blueprint.id)}
                            {@const blueprintCampaigns =
                                campaignsByBlueprint[blueprint.id] || []}
                            {@const isExpanded = expandedBlueprints.has(
                                blueprint.id,
                            )}

                            <div class="blueprint-section">
                                <div class="blueprint-header">
                                    <button
                                        class="blueprint-toggle"
                                        on:click={() =>
                                            toggleBlueprint(blueprint.id)}
                                    >
                                        <span
                                            class="collapse-icon"
                                            class:expanded={isExpanded}
                                        >
                                            ▶
                                        </span>
                                        <span class="blueprint-title">
                                            {blueprint.title}
                                        </span>
                                    </button>
                                    <div class="blueprint-actions">
                                        <button
                                            class="edit-blueprint-btn srpg-b srpg-b-normal srpg-b-sm"
                                            on:click={() =>
                                                openEditBlueprint(blueprint)}
                                            title="Edit blueprint"
                                            aria-label="Edit blueprint"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24"
                                                width="1em"
                                                height="1em"
                                            >
                                                <path
                                                    fill="currentColor"
                                                    d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                                                />
                                            </svg>
                                        </button>
                                        <button
                                            class="add-campaign-btn srpg-b srpg-b-create srpg-b-sm"
                                            on:click={() =>
                                                openCampaignCreator(blueprint)}
                                            title="Create new campaign"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                {#if isExpanded}
                                    <div class="campaigns-container">
                                        {#if blueprintCampaigns.length > 0}
                                            <div class="campaigns-grid">
                                                {#each blueprintCampaigns as campaign}
                                                    <div
                                                        class="info-card campaign-card"
                                                    >
                                                        <div
                                                            class="campaign-info"
                                                        >
                                                            <strong
                                                                class="campaign-name"
                                                                >{campaign.title}</strong
                                                            >
                                                            <span
                                                                class="campaign-date"
                                                            >
                                                                {formatDate(
                                                                    campaign.createdAt,
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div
                                                            class="campaign-actions"
                                                        >
                                                            <button
                                                                class="srpg-b srpg-b-normal campaign-play-button"
                                                                class:active={$activeCampaign?.id ===
                                                                    campaign.id}
                                                                on:click={() =>
                                                                    openCampaignLoadConfirm(
                                                                        campaign,
                                                                    )}
                                                                disabled={$activeCampaign?.id ===
                                                                    campaign.id}
                                                                aria-label="Load campaign"
                                                            >
                                                                {#if $activeCampaign?.id === campaign.id}
                                                                    <svg
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        viewBox="0 0 24 24"
                                                                        width="1em"
                                                                        height="1em"
                                                                        {...$$props}
                                                                        ><path
                                                                            fill="currentColor"
                                                                            d="M6 20.196V3.804a1 1 0 0 1 1.53-.848l13.113 8.196a1 1 0 0 1 0 1.696L7.53 21.044A1 1 0 0 1 6 20.196"
                                                                        /></svg
                                                                    >
                                                                {:else}
                                                                    <svg
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        viewBox="0 0 24 24"
                                                                        width="1.5em"
                                                                        height="1.5em"
                                                                        {...$$props}
                                                                        ><path
                                                                            fill="currentColor"
                                                                            d="M8 18.392V5.608L18.226 12zM6 3.804v16.392a1 1 0 0 0 1.53.848l13.113-8.196a1 1 0 0 0 0-1.696L7.53 2.956A1 1 0 0 0 6 3.804"
                                                                        /></svg
                                                                    >
                                                                {/if}
                                                            </button>
                                                        </div>
                                                    </div>
                                                {/each}
                                            </div>
                                        {:else}
                                            <p class="no-campaigns">
                                                No campaigns yet. Click the +
                                                button to create one.
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
    {:else if currentView === "oracle"}
        <div class="oracle-view">
            <h1>Oracle</h1>
            <GameOracle
                on:navigateHome={() => handleNavigate("home")}
                on:navigateToStory={() => handleNavigate("story")}
            />
        </div>
    {:else if currentView === "settings"}
        <div class="settings-view">
            <h1>Settings</h1>
            <div class="settings-description">
                <p>Manage your Solo RPG data and application settings.</p>
            </div>
            <DataManager onDataImported={handleDataImported} />
        </div>
    {:else if currentView === "map"}
        <MapView on:navigateHome={() => handleNavigate("home")} />
    {:else if currentView === "story"}
        <StoryView
            bind:this={storyViewComponent}
            activeTab={activeStoryTab}
            showTertiarySidebar={showTertiarySidebar}
            on:openDiceRoller={() => (showDiceRoller = true)}
            on:openCardDealer={() => (showCardDealer = true)}
            on:navigateHome={() => handleNavigate("home")}
            on:characterSelected={handleCharacterSelected}
            on:characterDeselected={handleCharacterDeselected}
        />
    {/if}
</main>

<DiceRoller show={showDiceRoller} onClose={() => (showDiceRoller = false)} />
<CardDealer show={showCardDealer} onClose={() => (showCardDealer = false)} />
<GameBlueprintEditor
    show={showBlueprintEditor}
    blueprint={editingBlueprint}
    on:close={() => (showBlueprintEditor = false)}
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
        padding: 1rem;
        padding-top: 0;
        box-sizing: border-box;
        min-height: 100vh;
        max-height: 100vh;
    }

    /* Desktop - account for left sidebar */
    @media (min-width: 769px) {
        .content {
            margin-left: 80px;
            padding-left: 2rem;
            padding-right: 2rem;
        }

        /* Account for secondary sidebar when shown */
        .content.has-secondary {
            margin-left: 165px;
        }

        /* Account for tertiary sidebar when shown */
        .content.has-tertiary {
            margin-left: 250px;
        }
    }

    /* Mobile   */
    @media (max-width: 768px) {
        .content { 
            /* Use dynamic viewport to avoid browser UI issues and allow scrolling */
            min-height: 100dvh;
            max-height: none;
        }

        /* Add bottom padding for non-fullscreen views (home, settings, oracle) */
        .home-view,
        .oracle-view,
        .settings-view {
            padding-bottom: calc(90px + env(safe-area-inset-bottom));
        }

        /* Account for stacked bottom bars in story view */
        /* Secondary visible (sits above primary 70px) */
        .content.has-secondary {
            padding-bottom: calc(130px + env(safe-area-inset-bottom)); /* 70 + 60 */
        }

        /* Tertiary visible too (another 60px above secondary) */
        .content.has-secondary.has-tertiary {
            padding-bottom: calc(190px + env(safe-area-inset-bottom)); /* 70 + 60 + 60 */
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
        padding: 0.5rem;
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
        min-width: 36px;
        min-height: 36px;
    }

    .blueprint-actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    .edit-blueprint-btn {
        padding: 0.4rem 0.75rem;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        min-width: 36px;
        min-height: 36px;
    }

    .edit-blueprint-btn svg {
        width: 1em;
        height: 1em;
    }

    .campaigns-container {
        padding: 1rem 1rem;
        padding-top: 0.5rem;
        background: #fafbfc;
    }

    .campaign-actions {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        min-width: 50px;
    }

    .campaigns-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 0.75rem;
    }

    .campaign-card {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        min-height: 80px;
        text-align: left;
        position: relative;
        transition: all 0.2s ease;
        width: 100%;
        gap: 0.5rem;
    }

    .campaign-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        flex-grow: 1;
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

    .campaign-play-button {
        padding: 12px;
        aspect-ratio: 1 / 1;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .no-campaigns {
        text-align: center;
        color: #999;
        font-style: italic;
        padding: 1rem;
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
