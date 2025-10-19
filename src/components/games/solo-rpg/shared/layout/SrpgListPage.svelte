<script lang="ts">
    export let className: string = "";
    export let headerClass: string = "";
    export let contentClass: string = "";
    import { activeCampaign } from "../../game-management/campaign-store";

    export let showActiveCampaign: boolean = true;
</script>

<div class="tab-content">
    <div class="srpg-list-page {className}">
        {#if showActiveCampaign}
            <h4>{$activeCampaign.title}</h4>
        {/if}
        <div class="srpg-list-page-header srpg-sticky-header {headerClass}">
            <slot name="header" />
        </div>
        <div class="srpg-list-page-scroll srpg-scroll-with-sidebars {contentClass}">
            <slot />
        </div>
    </div>
</div>

<style> 
    .tab-content {
        flex: 1;
        overflow-y: auto;
        min-height: 0;
        padding: 0;
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        height: 100dvh;
    }

    .srpg-list-page {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        overflow: hidden;
    }

    .srpg-list-page-scroll {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
    }

    h4 {
        margin-top: 1rem;
        margin-bottom: 1rem;
        text-align: center;
    }

    @media (min-width: 769px) { 
        .tab-content { 
            height: calc(100vh - 2rem - 1.5rem); 
        }
    }
</style>
