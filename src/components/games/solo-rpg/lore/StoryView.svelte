<script lang="ts">
    import { onMount, createEventDispatcher } from "svelte";
    import { activeCampaign } from "../game-management/campaign-store";
    import NoCampaignOverlay from "../NoCampaignOverlay.svelte";
    import Chronicle from "./chronicle/Chronicle.svelte";
    import CharacterManager from "./characters/CharacterManager.svelte";
    import Codex from "./codex/Codex.svelte";
    import "../solo-rpg-styles.css";

    const dispatch = createEventDispatcher();

    let activeTab: "chronicle" | "characters" | "codex" = "chronicle";

    function handleNavigateHome() {
        dispatch("navigateHome");
    }

    function setTab(tab: "chronicle" | "characters" | "codex") {
        activeTab = tab;
    }
</script>

<NoCampaignOverlay
    show={!$activeCampaign}
    on:navigateHome={handleNavigateHome}
/>

<div class="story-view">
    {#if $activeCampaign}
        <h2>{$activeCampaign.title}</h2>
        <div class="subheading">
            <p>{$activeCampaign.blueprintTitle}</p>
        </div>

        <div class="tabs">
            <button
                class="tab"
                class:active={activeTab === "chronicle"}
                on:click={() => setTab("chronicle")}
            >
                Journey
            </button>
            <button
                class="tab"
                class:active={activeTab === "characters"}
                on:click={() => setTab("characters")}
            >
                Characters
            </button>
            <button
                class="tab"
                class:active={activeTab === "codex"}
                on:click={() => setTab("codex")}
            >
                Codex
            </button>
        </div>

        <div class="tab-content">
            {#if activeTab === "chronicle"}
                <Chronicle />
            {:else if activeTab === "characters"}
                <CharacterManager />
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
            height: calc(100vh - 70px - env(safe-area-inset-bottom));
        }
    }

    h2 {
        text-align: center;
        margin: 0;
        padding: 1rem 1rem 0.5rem;
        flex-shrink: 0;
    }

    .subheading {
        flex-shrink: 0;
    }

    .subheading p {
        margin-top: 0;
        margin-bottom: 1rem;
        padding: 0 1rem;
        text-align: center;
        color: #6b7280;
        font-style: italic;
    }

    .tabs {
        display: flex;
        gap: 0.5rem;
        border-bottom: 2px solid #e5e7eb;
        margin: 0 1rem 0;
        flex-shrink: 0;
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
        flex: 1;
        overflow-y: auto;
        min-height: 0;
        padding: 1.5rem 0;
    }
</style>
