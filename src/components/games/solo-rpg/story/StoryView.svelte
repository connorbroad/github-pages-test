<script lang="ts">
    import { onMount, createEventDispatcher } from "svelte";
    import { activeCampaign } from "../campaign-store";
    import NoCampaignOverlay from "../NoCampaignOverlay.svelte";
    import Chronicle from "./Chronicle.svelte";
    import CharacterManager from "./CharacterManager.svelte";
    import "../solo-rpg-styles.css";

    const dispatch = createEventDispatcher();

    let activeTab: "chronicle" | "characters" = "chronicle";

    function handleNavigateHome() {
        dispatch('navigateHome');
    }

    function setTab(tab: "chronicle" | "characters") {
        activeTab = tab;
    }
</script>

<NoCampaignOverlay show={!$activeCampaign} on:navigateHome={handleNavigateHome} />

<div class="story-view"> 
    {#if $activeCampaign}
        <h1>{$activeCampaign.title}</h1>
        <div class="subheading">
            <p>{$activeCampaign.blueprintTitle}</p>
        </div>

        <div class="tabs">
            <button 
                class="tab" 
                class:active={activeTab === "chronicle"}
                on:click={() => setTab("chronicle")}
            >
                Chronicle
            </button>
            <button 
                class="tab" 
                class:active={activeTab === "characters"}
                on:click={() => setTab("characters")}
            >
                Characters
            </button>
        </div>

        <div class="tab-content">
            {#if activeTab === "chronicle"}
                <Chronicle />
            {:else if activeTab === "characters"}
                <CharacterManager />
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
    }

    h1 {
        text-align: center;
        margin-bottom: 0;
    }

    .subheading p {
        margin-top: 0;
        margin-bottom: 2rem;
        text-align: center;
        color: #6b7280;
        font-style: italic;
    }

    .tabs {
        display: flex;
        gap: 0.5rem;
        border-bottom: 2px solid #e5e7eb;
        margin-bottom: 1.5rem;
    }

    .tab {
        padding: 0.75rem 1.5rem;
        background: none;
        border: none;
        border-bottom: 3px solid transparent;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 500;
        color: #6b7280;
        transition: all 0.2s;
        margin-bottom: -2px;
    }

    .tab:hover {
        color: #111827;
        background: #f9fafb;
    }

    .tab.active {
        color: #3b82f6;
        border-bottom-color: #3b82f6;
    }

    .tab-content {
        min-height: 400px;
    }
</style>
