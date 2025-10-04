<script lang="ts">
    import { onMount } from "svelte";
    import "../solo-rpg-styles.css";

    let selectedTool: "draw" | "marker" | "note" | "erase" | null = null;

    function selectTool(tool: "draw" | "marker" | "note" | "erase") {
        selectedTool = tool;
    }
</script>

<div class="story-view">
    <h1>Story</h1>

    <div class="story-description">
        <p>
            Note taking, action tracking and story management for your solo RPG
            adventures.
        </p>
    </div>

    <em>Coming soon!</em>
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
