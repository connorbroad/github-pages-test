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
            <p class="text-text-secondary mt-0 mb-4 text-[0.95rem] leading-relaxed md:text-base">
                This tool requires an active campaign.
            </p>
            <p class="text-text-secondary mt-0 mb-6 text-[0.95rem] leading-relaxed md:text-base">
                Please load or create a campaign from the home page to continue.
            </p>
            <button
                class="border-border-primary bg-accent-success hover:bg-accent-success-hover active:bg-accent-success-active flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base
                       font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0
                       active:shadow-md"
                on:click={navigateHome}>
                Go to Home Page
            </button>
        </div>
    </SrpgModal>
{/if}
