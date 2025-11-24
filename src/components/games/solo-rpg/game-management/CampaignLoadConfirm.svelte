<script lang="ts">
    /**
     * Campaign Load Confirmation Component
     * Modal for confirming campaign load
     */
    import type { Campaign } from "../data/storage-utils";
    import { createEventDispatcher } from "svelte";
    import SrpgModal from "../shared/modal/SrpgModal.svelte";

    export let show = false;
    export let campaign: Campaign | null = null;

    const dispatch = createEventDispatcher();

    function handleClose() {
        dispatch("close");
    }

    function handleLoad() {
        if (campaign) {
            dispatch("load", campaign);
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
    <SrpgModal {show} ariaLabel="Close campaign load dialog" on:close={handleClose}>
        <h2 class="text-text-primary mt-0">Campaign Info</h2>

        <div class="bg-bg-secondary mb-6 rounded-md p-5 text-left">
            <p class="text-text-primary m-0 mb-4 text-xl font-semibold">{campaign.title}</p>
            <p class="text-text-secondary my-2 text-[0.95rem]">
                <strong class="text-text-primary">Game:</strong>
                {campaign.blueprintTitle}
            </p>
            <p class="text-text-secondary my-2 text-[0.95rem]">
                <strong class="text-text-primary">Created:</strong>
                {formatDate(campaign.createdAt)}
            </p>
        </div>

        <div class="flex gap-3 max-[500px]:flex-col">
            <button
                class="border-border-primary bg-accent-success hover:bg-accent-success-hover active:bg-accent-success-active flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
                on:click={handleLoad}>
                Load Campaign
            </button>
        </div>

        <p class="text-text-secondary mt-2 mb-0 text-[0.95rem] leading-6">
            <em>Loading a campaign makes it the active campaign for all tools.</em>
        </p>
    </SrpgModal>
{/if}
