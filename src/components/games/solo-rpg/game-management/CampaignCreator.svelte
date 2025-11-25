<script lang="ts">
    /**
     * Campaign Creator Component
     * Modal for creating a new campaign from a game blueprint
     */
    import type { Campaign, GameBlueprint } from "../data/storage-utils";
    import { createEventDispatcher } from "svelte";
    import SrpgModal from "../shared/modal/SrpgModal.svelte";

    export let show = false;
    export let blueprint: GameBlueprint | null = null;
    export let campaignTitle = "";

    const dispatch = createEventDispatcher();

    function handleClose() {
        campaignTitle = "";
        dispatch("close");
    }

    function handleCreate() {
        if (campaignTitle.trim()) {
            dispatch("create", campaignTitle.trim());
            campaignTitle = "";
        }
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Enter" && campaignTitle.trim()) {
            handleCreate();
        }
    }
</script>

{#if show && blueprint}
    <SrpgModal {show} ariaLabel="Close campaign creator" on:close={handleClose}>
        <h2 class="text-[var(--text-primary)] mt-0 mb-2">New Campaign</h2>
        <p class="text-[var(--text-secondary)] mb-6 text-[0.95rem]">
            Using: <strong class="text-[var(--accent-primary)]">{blueprint.title}</strong>
        </p>

        <div class="mb-6 text-left">
            <label class="text-[var(--text-secondary)] mb-2 block font-medium" for="campaign-title">
                Campaign Title:
            </label>
            <input
                class="border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--input-text)] focus:border-[var(--input-border-focus)] box-border w-full rounded-md border-2 p-3 text-base transition-colors duration-200 focus:outline-none"
                id="campaign-title"
                type="text"
                bind:value={campaignTitle}
                placeholder="Enter campaign title..."
                on:keydown={handleKeyDown} />
        </div>

        <button
            class="srpg-b srpg-b-create srpg-b-w-full"
            on:click={handleCreate}
            disabled={!campaignTitle.trim()}>
            Create Campaign
        </button>
    </SrpgModal>
{/if}
