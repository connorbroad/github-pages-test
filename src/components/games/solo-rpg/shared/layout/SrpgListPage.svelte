<script lang="ts">
    export let className: string = "";
    export let headerClass: string = "";
    export let contentClass: string = "";
    import { activeCampaign } from "../../game-management/campaign-store";
</script>

<div class="srpg-list-page {className}">
    <h4>{$activeCampaign.title}</h4>
    <div class="srpg-list-page-header srpg-sticky-header {headerClass}">
        <slot name="header" />
    </div>
    <div class="srpg-list-page-scroll srpg-scroll-with-sidebars {contentClass}">
        <slot />
    </div>
</div>

<style>
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
</style>
