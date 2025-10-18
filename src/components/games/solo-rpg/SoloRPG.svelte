<script lang="ts">
    import DataManager from "./data/DataManager.svelte";
    import Sidebar from "./Sidebar.svelte";
    import TertiarySidebar from "./TertiarySidebar.svelte";
    import StoryView from "./lore/StoryView.svelte"; // now Codex-only
    import Chronicle from "./lore/chronicle/Chronicle.svelte";
    import CharacterManager from "./lore/characters/CharacterManager.svelte";
    import FloatingOracleButton from "./shared/FloatingOracleButton.svelte";
    import NoCampaignOverlay from "./NoCampaignOverlay.svelte";
    import MapView from "./map/MapView.svelte";
    import ThemeToggle from "./theme/ThemeToggle.svelte";
    import { type Campaign } from "./data/storage-utils";
    import { activeCampaign } from "./game-management/campaign-store";
    import { theme } from "./theme/theme-store";
    import { onMount } from "svelte";
    import "./solo-rpg-styles.css";
    import HomeView from "./home/HomeView.svelte";

    type View = "home" | "tools" | "oracle" | "settings" | "map" | "story" | "chronicle" | "characters";
    let currentView: View = "home";

    // Tertiary sidebar state (for character sheet controls)
    let showTertiarySidebar = false;
    let tertiaryVisibleSections: string[] = ["information"];
    let tertiarySelectedSections: Set<string> = new Set();
    let tertiaryIsEditingSections: boolean = false;
    let currentCharacter: any = null;
    let selectedCharacterId: string | null = null;

    let showDiceRoller = false;
    let showCardDealer = false;
    let chronicleComponent: any;
    let characterManagerComponent: any;
    let mapViewComponent: any;

    // Dice roll preset data for ability/skill checks
    let diceRollPreset: {
        characterId: string;
        characterName: string;
        checkName: string;
        numDice: number;
        numSides: number;
        modifier: number;
        rollType: "normal" | "advantage" | "disadvantage";
    } | null = null;

    onMount(() => {
        // Initialize theme before other components load
        theme.initialize();
        activeCampaign.initialize();
    });

    function handleNavigate(view: View) {
        // Map special-case: toggle to landing when already on map
        if (view === "map" && currentView === "map") {
            mapViewComponent?.returnToLanding?.();
            return;
        }
        // Set view and reset per-view UI
        currentView = view;
        showTertiarySidebar = false;
        selectedCharacterId = null;
        // Clear any dice preset when changing primary views
        diceRollPreset = null;
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
        selectedCharacterId = character?.id ?? null;
        tertiaryVisibleSections = visibleSections;
        tertiarySelectedSections = selectedSections;
        tertiaryIsEditingSections = isEditingSections;
        showTertiarySidebar = character?.visibleSections?.length > 1;
    }

    function handleCharacterDeselected() {
        showTertiarySidebar = false;
        currentCharacter = null;
        selectedCharacterId = null;
    }

    function handleRollCheck(event: CustomEvent) {
        const { characterId, characterName, checkName, diceFormula, modifier, resultOption } = event.detail;
        const match = diceFormula.match(/^(\d+)d(\d+)$/i);
        if (!match) {
            console.error("Invalid dice formula:", diceFormula);
            return;
        }
        const numDice = parseInt(match[1], 10);
        const numSides = parseInt(match[2], 10);
        let rollType: "normal" | "advantage" | "disadvantage" = "normal";
        if (resultOption === "Maximum") rollType = "advantage";
        else if (resultOption === "Minimum") rollType = "disadvantage";
        diceRollPreset = { characterId, characterName, checkName, numDice, numSides, modifier, rollType };
    }

    function handleTertiaryToggleSection(section: string) {
        characterManagerComponent?.toggleSectionFromExternal?.(section);
    }

    function handleDataImported() {
        // After import, user can navigate back to Home to see refreshed data
        currentView = "settings";
    }

    function handleHomeLoadCampaign(event: CustomEvent<Campaign>) {
        const campaign = event.detail;
        activeCampaign.load(campaign);
        currentView = "chronicle";
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
</script>

<Sidebar {currentView} onNavigate={handleNavigate} />

<!-- Tertiary sidebar only for Characters view -->
<TertiarySidebar
    show={showTertiarySidebar}
    mode="story"
    hasSecondarySidebar={currentView === "story"}
    tool="paint"
    currentShape="square"
    color="#2980b9"
    visibleSections={tertiaryVisibleSections}
    selectedSections={tertiarySelectedSections}
    isEditingSections={tertiaryIsEditingSections}
    onToggleSection={handleTertiaryToggleSection}
/>

<main
    class="content"
    class:has-secondary={currentView === "story"}
    class:has-tertiary-only={currentView === "characters" && showTertiarySidebar}
    data-theme={$theme}
>
    {#if currentView === "home"}
        <HomeView on:loadCampaign={handleHomeLoadCampaign} />
    {:else if currentView === "settings"}
        <div class="settings-view">
            <h1>Settings</h1>
            <div class="settings-description">
                <p>Manage your Solo RPG data and application settings.</p>
            </div>
            
            <div class="settings-section">
                <ThemeToggle />
            </div>
            
            <div class="settings-section">
                <DataManager onDataImported={handleDataImported} />
            </div>
        </div>
    {:else if currentView === "map"}
        <MapView 
            bind:this={mapViewComponent}
            on:navigateHome={() => handleNavigate("home")}
            on:navigateToStory={() => handleNavigate("chronicle")}
        />
    {:else if currentView === "chronicle"}
        <NoCampaignOverlay show={!$activeCampaign} on:navigateHome={() => handleNavigate("home")} />
        {#if $activeCampaign}
            <div class="story-view">
                <h4>{$activeCampaign.title}</h4>
                <div class="tab-content">
                    <Chronicle bind:this={chronicleComponent} />
                </div>
            </div>
        {:else}
            <h1>No Active Campaign</h1>
            <em>Select or create a campaign to start recording your adventure.</em>
        {/if}
    {:else if currentView === "characters"}
        <NoCampaignOverlay show={!$activeCampaign} on:navigateHome={() => handleNavigate("home")} />
        {#if $activeCampaign}
            <CharacterManager
                bind:this={characterManagerComponent}
                on:characterSelected={handleCharacterSelected}
                on:characterDeselected={handleCharacterDeselected}
                on:rollCheck={handleRollCheck}
            />
        {:else}
            <h1>No Active Campaign</h1>
            <em>Select or create a campaign to start managing characters.</em>
        {/if}
    {:else if currentView === "story"}
        <!-- Codex only -->
        <StoryView on:navigateHome={() => handleNavigate("home")} />
    {/if}

    {#if $activeCampaign && (currentView === "chronicle" || currentView === "characters")}
        <FloatingOracleButton 
            hasSecondarySidebar={false}
            hasTertiarySidebar={currentView === "characters" && showTertiarySidebar}
            {diceRollPreset}
            on:clearPreset={() => (diceRollPreset = null)}
            currentCharacterId={selectedCharacterId}
        />
    {/if}
</main>
 
<style>
    /* Layout */
    .content { 
        padding: 1rem;
        padding-top: 0;
        box-sizing: border-box;
        min-height: 100vh;
        max-height: 100vh;
        background-color: var(--bg-primary);
        color: var(--text-primary);
    }

    /* Desktop - account for left sidebar */
    @media (min-width: 769px) {
        .content {
            margin-left: 80px;
            padding-left: 2rem;
            padding-right: 2rem;
        }

        /* When only tertiary is present (no secondary sidebar) */
        .content.has-tertiary-only {
            margin-left: 160px; /* primary (80) + tertiary (80) */
        }
    }

    /* Mobile   */
    @media (max-width: 768px) {
        .content { 
            /* Use dynamic viewport to avoid browser UI issues */
            min-height: 100dvh;
            max-height: none;
            padding-bottom: 0;
        }

        /* Add bottom padding for non-fullscreen views (settings only) */
        .settings-view {
            padding-bottom: calc(90px + env(safe-area-inset-bottom));
        }
    }

    /* Views */
    h1 {
        text-align: center;
        margin-bottom: 1.5rem;
    }

    .story-view {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
    }

    /* Desktop - fixed viewport height for story containers */
    @media (min-width: 769px) {
        .story-view {
            height: 100vh;
            overflow: hidden;
        }
    }

    /* Mobile - height accounting for bottom bar */
    @media (max-width: 768px) {
        .story-view {
            height: calc(100dvh - 70px - env(safe-area-inset-bottom));
            overflow: hidden;
        }
    }

    .tab-content {
        flex: 1;
        overflow-y: auto;
        min-height: 0;
        padding: 0;
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
        color: var(--text-secondary);
        font-size: 1.1rem;
    }

    .settings-section { 
        padding: 1.5rem; 
        padding-top: 0;
    } 
</style>
