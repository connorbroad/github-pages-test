<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import SrpgModal from "./shared/modal/SrpgModal.svelte";
    import "./solo-rpg-styles.css";

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
        ariaLabel="No campaign loaded"
    >
        <div class="body">
            <p class="description">
                This tool requires an active campaign.
            </p>
            <p class="description">
                Please load or create a campaign from the home page to
                continue.
            </p>
            <button
                class="srpg-b srpg-b-create srpg-b-w-full"
                on:click={navigateHome}
            >
                Go to Home Page
            </button>
        </div>
    </SrpgModal>
{/if}

<style>
    .body { 
        padding: 0rem;
        text-align: center;
    }

    .description {
        color: var(--text-secondary);
        margin-top: 0;
        margin-bottom: 1rem;
        line-height: 1.6;
    }

    .description:last-of-type {
        margin-bottom: 1.5rem;
    }

    /* Mobile adjustments */
    @media (max-width: 768px) {
        .description {
            font-size: 0.95rem;
        }
    }
</style>
