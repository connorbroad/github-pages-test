<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { activeCampaign } from "../game-management/campaign-store";
    import NoCampaignOverlay from "../NoCampaignOverlay.svelte";
    import Codex from "./codex/Codex.svelte";
    import "../solo-rpg-styles.css";

    const dispatch = createEventDispatcher();

    function handleNavigateHome() {
        dispatch("navigateHome");
    }
</script>

<NoCampaignOverlay show={!$activeCampaign} on:navigateHome={handleNavigateHome} />

<div class="story-view">
    {#if $activeCampaign}
        <h4>{$activeCampaign.title}</h4>
        <div class="tab-content">
            <Codex />
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
    }

    h4 {
        text-align: center;
        margin: 0;
        padding: 1rem 0;
        flex-shrink: 0;
    }

    .tab-content {
        flex: 1;
        overflow-y: auto;
        min-height: 0;
        padding: 0;
    }
</style>
