<script lang="ts">
    import ThemeToggle from "../theme/ThemeToggle.svelte";
    import DataManager from "./DataManager.svelte";
    import TileMapManager from "./TileMapManager.svelte";
</script>


<div class="settings-view">
    <h1>Settings</h1>
    <div class="settings-description">
        <p>Manage your Solo RPG data and application settings.</p>
    </div>

    <div class="settings-section">
        <ThemeToggle />
    </div>

    <div class="settings-section">
        <DataManager />
    </div>

    <div class="settings-section">
        <TileMapManager />
    </div>
</div>


<style>
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

    /* Mobile   */
    @media (max-width: 768px) {
        /* Add bottom padding for non-fullscreen views (settings only) */
        .settings-view {
            padding-bottom: calc(90px + env(safe-area-inset-bottom));
        }
    }
</style>