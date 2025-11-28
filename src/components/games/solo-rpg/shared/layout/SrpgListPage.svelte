<script lang="ts">
    export let className: string = "";
    export let headerClass: string = "";
    export let contentClass: string = "";
    import { activeCampaign } from "../../game-management/campaign-store";

    export let showActiveCampaign: boolean = true;
</script>

<div
    class="mx-auto flex h-dvh min-h-0 max-w-[1200px] flex-1 flex-col overflow-y-auto py-4 pb-[calc(70px+env(safe-area-inset-bottom)+1rem)] md:h-screen md:pb-4">
    <div class="flex min-h-0 flex-1 flex-col {className}">
        {#if showActiveCampaign}
            <h4 class="text-center">{$activeCampaign.title}</h4>
        {/if}
        <div class="bg-bg-primary sticky top-0 z-10 px-2 pb-2 {headerClass}">
            <slot name="header" />
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto px-2 {contentClass}">
            <slot />
        </div>
        <slot name="footer" />
    </div>
</div>
