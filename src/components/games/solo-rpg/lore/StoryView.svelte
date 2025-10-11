<script lang="ts">
    import { onMount, createEventDispatcher } from "svelte";
    import { activeCampaign } from "../game-management/campaign-store";
    import NoCampaignOverlay from "../NoCampaignOverlay.svelte";
    import Chronicle from "./chronicle/Chronicle.svelte";
    import CharacterManager from "./characters/CharacterManager.svelte";
    import Codex from "./codex/Codex.svelte";
    import "../solo-rpg-styles.css";

    const dispatch = createEventDispatcher();

    export let activeTab: "chronicle" | "characters" | "codex" = "chronicle";
    export let showTertiarySidebar: boolean = false;

    let characterManagerComponent: any;

    function handleNavigateHome() {
        dispatch("navigateHome");
    }

    function handleCharacterSelected(event: CustomEvent) {
        dispatch("characterSelected", event.detail);
    }

    function handleCharacterDeselected() {
        dispatch("characterDeselected");
    }

    // Expose method to toggle sections in character manager
    export function toggleCharacterSection(section: string) {
        if (characterManagerComponent && characterManagerComponent.toggleSectionFromExternal) {
            characterManagerComponent.toggleSectionFromExternal(section);
        }
    }
</script>

<NoCampaignOverlay
    show={!$activeCampaign}
    on:navigateHome={handleNavigateHome}
/>

<div class="story-view" class:has-tertiary={showTertiarySidebar}>
    {#if $activeCampaign}
        <h4>{$activeCampaign.title}</h4>

        <div class="tab-content">
            {#if activeTab === "chronicle"}
                <Chronicle />
            {:else if activeTab === "characters"}
                <CharacterManager
                    bind:this={characterManagerComponent}
                    on:characterSelected={handleCharacterSelected}
                    on:characterDeselected={handleCharacterDeselected}
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

<style>
    .story-view {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        height: 100vh;
        overflow: hidden;
    }

    /* Mobile - account for bottom sidebar */
    @media (max-width: 768px) {
        .story-view {
            height: calc(100vh - 70px - 60px - env(safe-area-inset-bottom));
        }
        
        /* When tertiary sidebar is shown, account for it too */
        .story-view.has-tertiary {
            height: calc(100vh - 70px - 60px - 60px - env(safe-area-inset-bottom));
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
        background-color: #ddd;
        margin-bottom: 0.5rem;
    }
    h4::after {
        content: "";
        display: block;
        width: 100%;
        height: 1px;
        background-color: #ddd;
        margin-top: 0.5rem;
    }

    .tab-content {
        flex: 1;
        overflow-y: auto;
        min-height: 0;
        padding: 0;
    }
</style>
