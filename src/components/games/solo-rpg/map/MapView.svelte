<script lang="ts">
    import { onMount } from "svelte";
    import "../solo-rpg-styles.css";

    let selectedTool: "draw" | "marker" | "note" | "erase" | null = null;

    function selectTool(tool: "draw" | "marker" | "note" | "erase") {
        selectedTool = tool;
    }
</script>

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
