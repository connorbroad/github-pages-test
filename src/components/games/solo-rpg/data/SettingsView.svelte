<script lang="ts">
    import ThemeToggle from "../theme/ThemeToggle.svelte";
    import DataManager from "./DataManager.svelte";
    import TileMapManager from "./TileMapManager.svelte";
    import "../solo-rpg-styles.css";
    import SrpgListPage from "../shared/layout/SrpgListPage.svelte";
</script>




<SrpgListPage className="settings" showActiveCampaign={false}>
    <div slot="header">
        <h2>Settings</h2>
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
</SrpgListPage>


<style>   
    .settings-section { 
        padding-top: 1.5rem;  
    }  
</style>