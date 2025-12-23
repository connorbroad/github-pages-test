<script lang="ts">
    /**
     * Campaign Load Confirmation Component
     * Modal for confirming campaign load
     */
    import type { Campaign } from "../data/storage-utils";
    import SrpgModal from "../shared/modal/SrpgModal.svelte";

    export let show = false;
    export let campaign: Campaign | null = null;
    export let onClose: () => void = () => {};
    export let onLoad: (campaign: Campaign) => void = () => {};

    function handleClose() {
        onClose();
    }

    function handleLoad() {
        if (campaign) {
            onLoad(campaign);
        }
    }

    function formatDate(timestamp: number): string {
        const date = new Date(timestamp);
        return date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    }
</script>

{#if show && campaign}
    <SrpgModal {show} ariaLabel="Close campaign load dialog" onClose={handleClose}>
        <h2 class="mt-0 text-(--text-primary)">Campaign Info</h2>

        <div class="mb-6 rounded-md bg-(--bg-secondary) p-5 text-left">
            <p class="m-0 mb-4 text-xl font-semibold text-(--text-primary)">{campaign.title}</p>
            <p class="my-2 text-[0.95rem] text-(--text-secondary)">
                <strong class="text-(--text-primary)">Game:</strong>
                {campaign.blueprintTitle}
            </p>
            <p class="my-2 text-[0.95rem] text-(--text-secondary)">
                <strong class="text-(--text-primary)">Created:</strong>
                {formatDate(campaign.createdAt)}
            </p>
        </div>

        <div class="flex gap-3 max-[500px]:flex-col">
            <button class="srpg-b srpg-b-create srpg-b-w-full" on:click={handleLoad}>
                Load Campaign
            </button>
        </div>

        <p class="mt-2 mb-0 text-[0.95rem] leading-6 text-(--text-secondary)">
            <em>Loading a campaign makes it the active campaign for all tools.</em>
        </p>
    </SrpgModal>
{/if}
