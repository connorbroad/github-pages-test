<script lang="ts">
    import { onMount, createEventDispatcher } from "svelte";
    import { activeCampaign } from "../game-management/campaign-store";
    import NoCampaignOverlay from "../NoCampaignOverlay.svelte";
    import Chronicle from "./chronicle/Chronicle.svelte";
    import CharacterManager from "./characters/CharacterManager.svelte";
    import Codex from "./codex/Codex.svelte";
    import FloatingOracleButton from "../shared/FloatingOracleButton.svelte";
    import "../solo-rpg-styles.css";

    const dispatch = createEventDispatcher();

    export let activeTab: "chronicle" | "characters" | "codex" = "chronicle";
    export let showTertiarySidebar: boolean = false;
    export let showSecondarySidebar: boolean = false; // Whether secondary sidebar is visible
    export let diceRollPreset: any = null; // Preset data for ability/skill rolls

    let characterManagerComponent: any;
    let chronicleComponent: any;
    let selectedCharacterId: string | null = null; // Track the currently viewed character

    // Clear selected character when switching away from characters tab
    $: if (activeTab !== "characters") {
        selectedCharacterId = null;
    }

    function handleNavigateHome() {
        dispatch("navigateHome");
    }

    function handleCharacterSelected(event: CustomEvent) {
        selectedCharacterId = event.detail.character?.id || null;
        dispatch("characterSelected", event.detail);
    }

    function handleCharacterDeselected() {
        selectedCharacterId = null;
        dispatch("characterDeselected");
    }

    function handleRollCheck(event: CustomEvent) {
        dispatch("rollCheck", event.detail);
    }

    // Expose method to toggle sections in character manager
    export function toggleCharacterSection(section: string) {
        if (characterManagerComponent && characterManagerComponent.toggleSectionFromExternal) {
            characterManagerComponent.toggleSectionFromExternal(section);
        }
    }

    // Expose method to reset character view back to list
    export function resetCharacterView() {
        if (characterManagerComponent && characterManagerComponent.resetToList) {
            characterManagerComponent.resetToList();
        }
    }

    // Expose method to reload chronicle entries
    export function reloadChronicle() {
        if (chronicleComponent && chronicleComponent.reloadEntries) {
            chronicleComponent.reloadEntries();
        }
    }
</script>

<NoCampaignOverlay
    show={!$activeCampaign}
    on:navigateHome={handleNavigateHome}
/>

<div class="story-view" class:has-secondary={showSecondarySidebar} class:has-tertiary={showTertiarySidebar}>
    {#if $activeCampaign}
        <h4>{$activeCampaign.title}</h4>

        <div class="tab-content">
            {#if activeTab === "chronicle"}
                <Chronicle bind:this={chronicleComponent} />
            {:else if activeTab === "characters"}
                <CharacterManager
                    bind:this={characterManagerComponent}
                    on:characterSelected={handleCharacterSelected}
                    on:characterDeselected={handleCharacterDeselected}
                    on:rollCheck={handleRollCheck}
                />
            {:else if activeTab === "codex"}
                <Codex />
            {/if}
        </div>
    {:else}
        <h1>No Active Campaign</h1>
        <em>Select or create a campaign to start recording your adventure.</em>
    {/if}
</div>

{#if $activeCampaign}
    <FloatingOracleButton 
        hasSecondarySidebar={showSecondarySidebar}
        hasTertiarySidebar={showTertiarySidebar}
        on:navigateToStory 
        {diceRollPreset}
        on:clearPreset
        currentCharacterId={selectedCharacterId}
    />
{/if}

<style>
    .story-view {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
    }

    /* Desktop - use fixed viewport height */
    @media (min-width: 769px) {
        .story-view {
            height: 100vh;
            overflow: hidden;
        }
    }

    /* Mobile - calculate available height accounting for bottom bars */
    @media (max-width: 768px) {
        .story-view {
            /* Base: full viewport minus primary sidebar (70px) only */
            height: calc(100dvh - 70px - env(safe-area-inset-bottom));
            overflow: hidden;
        }
        
        /* When secondary sidebar is shown (another 60px) */
        .story-view.has-secondary {
            height: calc(100dvh - 70px - 60px - env(safe-area-inset-bottom));
        }
        
        /* When tertiary sidebar is also shown (another 60px) */
        .story-view.has-secondary.has-tertiary {
            height: calc(100dvh - 70px - 60px - 60px - env(safe-area-inset-bottom));
        }
    }

    h4 {
        text-align: center;
        margin: 0;
        padding-bottom: 1rem;
        flex-shrink: 0;
    }

    /* Thin lines above and below the h2 */
    h4::before {
        content: "";
        display: block;
        width: 100%;
        height: 1px;
        background-color: var(--border-primary);
        margin-bottom: 0.5rem;
    }
    h4::after {
        content: "";
        display: block;
        width: 100%;
        height: 1px;
        background-color: var(--border-primary);
        margin-top: 0.5rem;
    }

    .tab-content {
        flex: 1;
        overflow-y: auto;
        min-height: 0;
        padding: 0;
    }
</style>
