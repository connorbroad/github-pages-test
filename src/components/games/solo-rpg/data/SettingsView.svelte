<script lang="ts">
    import ThemeToggle from "../theme/ThemeToggle.svelte";
    import DataManager from "./DataManager.svelte";
    import TileMapManager from "./TileMapManager.svelte";

    import SrpgListPage from "../shared/layout/SrpgListPage.svelte";
</script>

<SrpgListPage className="settings" showActiveCampaign={false}>
    <div slot="header">
        <h2 class="mb-4 text-center text-2xl">Settings</h2>
    </div>

    <div class="px-2">
        <div class="pt-6">
            <ThemeToggle />
        </div>
        <div class="pt-6">
            <DataManager />
        </div>
        <div class="pt-6">
            <TileMapManager />
        </div>
    </div>
</SrpgListPage>
