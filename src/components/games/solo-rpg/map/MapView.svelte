<script lang="ts">
    import { onMount, createEventDispatcher } from "svelte";
    import { activeCampaign } from "../game-management/campaign-store";
    import NoCampaignOverlay from "../NoCampaignOverlay.svelte";
    import "../solo-rpg-styles.css";

    const dispatch = createEventDispatcher();

    let selectedTool: "draw" | "marker" | "note" | "erase" | null = null;

    function selectTool(tool: "draw" | "marker" | "note" | "erase") {
        selectedTool = tool;
    }

    function handleNavigateHome() {
        dispatch('navigateHome');
    }
</script>

<NoCampaignOverlay show={!$activeCampaign} on:navigateHome={handleNavigateHome} />

<div class="map-view">
    <h1>Map</h1>

    <div class="map-description">
        <p>
            Create and manage maps for your adventures. Draw terrain, place
            markers, and visualize your world.
        </p>
    </div>
    <em>Coming soon!</em>
</div>

<style>
    .map-view {
        max-width: 1200px;
        margin: 0 auto;
    }

    h1 {
        text-align: center;
        margin-bottom: 1rem;
    }

    .map-description {
        text-align: center;
        margin-bottom: 2rem;
    }

    .map-description p {
        color: #666;
        font-size: 1rem;
        line-height: 1.6;
    }
</style>
