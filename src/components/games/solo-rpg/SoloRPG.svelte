<script lang="ts">
    import SettingsView from "./data/SettingsView.svelte";
    import Sidebar from "./Sidebar.svelte";
    import TertiarySidebar from "./TertiarySidebar.svelte";
    import Chronicle from "./lore/chronicle/Chronicle.svelte";
    import CharacterManager from "./lore/characters/CharacterManager.svelte";
    import FloatingOracleButton from "./shared/FloatingOracleButton.svelte";
    import NoCampaignOverlay from "./NoCampaignOverlay.svelte";
    import MapView from "./map/MapView.svelte";
    import { type Campaign } from "./data/storage-utils";
    import { activeCampaign } from "./game-management/campaign-store";
    import { theme } from "./theme/theme-store";
    import { onMount } from "svelte";
    import "./solo-rpg-styles.css";
    import HomeView from "./home/HomeView.svelte";
    import Codex from "./lore/codex/Codex.svelte";

    type View =
        | "home"
        | "tools"
        | "oracle"
        | "settings"
        | "map"
        | "story"
        | "chronicle"
        | "characters";
    let currentView: View = "home";

    // Tertiary sidebar state (for character sheet controls)
    let showTertiarySidebar = false;
    let tertiaryVisibleSections: string[] = ["information"];
    let tertiarySelectedSections: Set<string> = new Set();
    let tertiaryIsEditingSections: boolean = false;
    let currentCharacter: any = null;
    let selectedCharacterId: string | null = null;

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
        // Characters special-case: return to character list when already on characters
        if (view === "characters" && currentView === "characters") {
            characterManagerComponent?.resetToList?.();
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
        const { character, isEditingSections, selectedSections, visibleSections } = event.detail;
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
        const { characterId, characterName, checkName, diceFormula, modifier, resultOption } =
            event.detail;
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
        diceRollPreset = {
            characterId,
            characterName,
            checkName,
            numDice,
            numSides,
            modifier,
            rollType,
        };
    }

    function handleTertiaryToggleSection(section: string) {
        characterManagerComponent?.toggleSectionFromExternal?.(section);
    }

    function handleHomeLoadCampaign(event: CustomEvent<Campaign>) {
        const campaign = event.detail;
        activeCampaign.load(campaign);
        currentView = "chronicle";
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
    function handleNavigateToChronicle() {
        if (currentView === "chronicle") {
            // If already on chronicle, force reload to show new entries
            chronicleComponent?.reloadEntries?.();
        } else {
            handleNavigate("chronicle");
        }
    }
</script>

<Sidebar {currentView} onNavigate={handleNavigate} />

<TertiarySidebar
    show={showTertiarySidebar}
    mode="story"
    hasSecondarySidebar={false}
    tool="paint"
    currentShape="square"
    color="#2980b9"
    visibleSections={tertiaryVisibleSections}
    selectedSections={tertiarySelectedSections}
    isEditingSections={tertiaryIsEditingSections}
    onToggleSection={handleTertiaryToggleSection} />

<main
    class="bg-bg-primary text-text-primary box-border py-0 transition-all duration-300
           md:ml-[80px]
           {currentView === 'map' ? 'md:ml-[170px]' : ''}
           {currentView === 'characters' && showTertiarySidebar ? 'md:ml-[160px]' : ''}"
    data-theme={$theme}
    style="--secondary-sidebar-visible: 0; --tertiary-sidebar-visible: {showTertiarySidebar
        ? 1
        : 0};">
    {#if currentView === "home"}
        <HomeView on:loadCampaign={handleHomeLoadCampaign} />
    {:else if currentView === "chronicle"}
        <NoCampaignOverlay show={!$activeCampaign} on:navigateHome={() => handleNavigate("home")} />
        {#if $activeCampaign}
            <Chronicle bind:this={chronicleComponent} />
        {:else}
            <h1 class="mb-6 text-center text-4xl font-bold">No Active Campaign</h1>
            <em class="block text-center">
                Select or create a campaign to start recording your adventure.
            </em>
        {/if}
    {:else if currentView === "characters"}
        <NoCampaignOverlay show={!$activeCampaign} on:navigateHome={() => handleNavigate("home")} />
        {#if $activeCampaign}
            <CharacterManager
                bind:this={characterManagerComponent}
                on:characterSelected={handleCharacterSelected}
                on:characterDeselected={handleCharacterDeselected}
                on:rollCheck={handleRollCheck} />
        {:else}
            <h1 class="mb-6 text-center text-4xl font-bold">No Active Campaign</h1>
            <em class="block text-center">
                Select or create a campaign to start managing characters.
            </em>
        {/if}
    {:else if currentView === "story"}
        <NoCampaignOverlay show={!$activeCampaign} on:navigateHome={() => handleNavigate("home")} />

        {#if $activeCampaign}
            <Codex />
        {:else}
            <h1 class="mb-6 text-center text-4xl font-bold">No Active Campaign</h1>
            <em class="block text-center">Select or create a campaign to use this page.</em>
        {/if}
    {:else if currentView === "map"}
        <MapView
            bind:this={mapViewComponent}
            on:navigateHome={() => handleNavigate("home")}
            on:navigateToStory={handleNavigateToChronicle} />
    {:else if currentView === "settings"}
        <SettingsView />
    {/if}

    {#if $activeCampaign && (currentView === "chronicle" || currentView === "characters")}
        <FloatingOracleButton
            hasSecondarySidebar={false}
            hasTertiarySidebar={currentView === "characters" && showTertiarySidebar}
            {diceRollPreset}
            on:clearPreset={() => (diceRollPreset = null)}
            on:navigateToStory={handleNavigateToChronicle}
            currentCharacterId={selectedCharacterId} />
    {/if}
</main>
