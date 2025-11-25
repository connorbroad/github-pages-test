<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import SrpgModal from "./shared/modal/SrpgModal.svelte";

    export let show: boolean = false;

    const dispatch = createEventDispatcher();

    function navigateHome() {
        dispatch("navigateHome");
    }
</script>

{#if show}
    <SrpgModal
        {show}
        showCloseButton={false}
        closeOnOverlayClick={false}
        ariaLabel="No campaign loaded">
        <div class="p-0 text-center">
            <p class="text-[var(--text-secondary)] mt-0 mb-4 text-[0.95rem] leading-relaxed md:text-base">
                This tool requires an active campaign.
            </p>
            <p class="text-[var(--text-secondary)] mt-0 mb-6 text-[0.95rem] leading-relaxed md:text-base">
                Please load or create a campaign from the home page to continue.
            </p>
            <button class="srpg-b srpg-b-create srpg-b-w-full" on:click={navigateHome}>
                Go to Home Page
            </button>
        </div>
    </SrpgModal>
{/if}
