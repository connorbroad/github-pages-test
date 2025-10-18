<script lang="ts">
    import DataManager from "./data/DataManager.svelte";
    import Sidebar from "./Sidebar.svelte";
    import SecondarySidebar from "./SecondarySidebar.svelte";
    import TertiarySidebar from "./TertiarySidebar.svelte";
    import StoryView from "./lore/StoryView.svelte";
    import MapView from "./map/MapView.svelte";
    import ThemeToggle from "./theme/ThemeToggle.svelte";
    import { type Campaign } from "./data/storage-utils";
    import { activeCampaign } from "./game-management/campaign-store";
    import { theme } from "./theme/theme-store";
    import { onMount } from "svelte";
    import "./solo-rpg-styles.css";
    import HomeView from "./home/HomeView.svelte";

    type View = "home" | "tools" | "oracle" | "settings" | "map" | "story" | "chronicle";
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
        const wasOnStory = currentView === "story";
        
        // Handle map toggle behavior: if already on map, return to landing
        if (view === "map" && currentView === "map") {
            if (mapViewComponent && mapViewComponent.returnToLanding) {
                mapViewComponent.returnToLanding();
            }
            return;
        }
        
        currentView = view;
        // Reset story tab when leaving story view or chronicle view
        if (view !== "story" && view !== "chronicle") {
            activeStoryTab = "chronicle";
            // Hide tertiary sidebar when leaving story view
            showTertiarySidebar = false;
        } else if (view === "story") {
            // When navigating to story, set to characters tab
            activeStoryTab = "characters";
            // Hide tertiary sidebar when switching tabs
            showTertiarySidebar = false;
            // Use setTimeout to ensure component is mounted
            setTimeout(() => {
                if (storyViewComponent && storyViewComponent.resetCharacterView) {
                    storyViewComponent.resetCharacterView();
                }
            }, 0);
        } else if (view === "chronicle") {
            // When navigating to chronicle, set to chronicle tab
            activeStoryTab = "chronicle";
            showTertiarySidebar = false;
            // Use setTimeout to ensure component is mounted
            setTimeout(() => {
                if (storyViewComponent && storyViewComponent.reloadChronicle) {
                    storyViewComponent.reloadChronicle();
                }
            }, 0);
        }
    }

    function handleStoryTabChange(tab: "characters" | "codex") {
        activeStoryTab = tab;

        // Clear tertiary sidebar when switching tabs
        if (tab !== "characters") {
            showTertiarySidebar = false;
        } else {
            // When switching to characters tab, reset to the character list view
            setTimeout(() => {
                if (storyViewComponent && storyViewComponent.resetCharacterView) {
                    storyViewComponent.resetCharacterView();
                }
            }, 0);
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
        showTertiarySidebar = character.visibleSections.length > 1; 
    }

    function handleCharacterDeselected() {
        showTertiarySidebar = false;
        currentCharacter = null;
    }

    function handleRollCheck(event: CustomEvent) {
        const { characterId, characterName, checkName, diceFormula, modifier, resultOption } = event.detail;
        
        // Parse the dice formula (e.g., "1d20" or "2d20" -> numDice, numSides)
        const match = diceFormula.match(/^(\d+)d(\d+)$/i);
        if (!match) {
            console.error("Invalid dice formula:", diceFormula);
            return;
        }
        
        const numDice = parseInt(match[1], 10);
        const numSides = parseInt(match[2], 10);
        
        // Convert resultOption to rollType for backward compatibility
        let rollType: "normal" | "advantage" | "disadvantage" = "normal";
        if (resultOption === "Maximum") {
            rollType = "advantage";
        } else if (resultOption === "Minimum") {
            rollType = "disadvantage";
        }
        
        // Store the preset data
        diceRollPreset = {
            characterId,
            characterName,
            checkName,
            numDice,
            numSides,
            modifier,
            rollType,
        };
        
        // The FloatingOracleButton will automatically open when preset is set
    }

    function handleTertiaryToggleSection(section: string) {
        if (storyViewComponent && storyViewComponent.toggleCharacterSection) {
            storyViewComponent.toggleCharacterSection(section);
        }
    }

    function handleDataImported() {
        // After import, user can navigate back to Home to see refreshed data
        currentView = "settings";
    }

    function handleHomeLoadCampaign(event: CustomEvent<Campaign>) {
        const campaign = event.detail;
        activeCampaign.load(campaign);
        // Switch to chronicle view
        currentView = "chronicle";
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
</script>

<Sidebar {currentView} onNavigate={handleNavigate} />

<!-- Use app sidebars only on Story view; Map view uses its own map sidebars -->
<SecondarySidebar
    show={currentView === "story"}
    mode="story"
    activeTab={activeStoryTab === "chronicle" ? "characters" : activeStoryTab}
    onTabChange={handleStoryTabChange}
/>

<TertiarySidebar
    show={showTertiarySidebar}
    mode="story"
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
    class:has-tertiary={showTertiarySidebar}
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
    {:else if currentView === "chronicle" || currentView === "story"}
        <StoryView
            bind:this={storyViewComponent}
            activeTab={activeStoryTab}
            showSecondarySidebar={currentView === "story"}
            showTertiarySidebar={showTertiarySidebar}
            {diceRollPreset}
            on:openDiceRoller={() => (showDiceRoller = true)}
            on:openCardDealer={() => (showCardDealer = true)}
            on:navigateHome={() => handleNavigate("home")}
            on:navigateToStory={() => handleNavigate("chronicle")}
            on:characterSelected={handleCharacterSelected}
            on:characterDeselected={handleCharacterDeselected}
            on:rollCheck={handleRollCheck}
            on:clearPreset={() => (diceRollPreset = null)}
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
