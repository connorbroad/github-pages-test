<script lang="ts">
    import { onMount, createEventDispatcher } from "svelte";
    import { activeCampaign } from "../campaign-store";
    import NoCampaignOverlay from "../NoCampaignOverlay.svelte";
    import Chronicle from "./Chronicle.svelte";
    import "../solo-rpg-styles.css";

    const dispatch = createEventDispatcher();

    function handleNavigateHome() {
        dispatch('navigateHome');
    }
</script>

<NoCampaignOverlay show={!$activeCampaign} on:navigateHome={handleNavigateHome} />

<div class="story-view"> 
    {#if $activeCampaign}
        <h1>{$activeCampaign.title}</h1>
        <Chronicle />
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
        margin-bottom: 1rem;
    }

    .story-description {
        text-align: center;
        margin-bottom: 2rem;
    }

    .story-description p {
        color: #666;
        font-size: 1rem;
        line-height: 1.6;
    }
</style>
