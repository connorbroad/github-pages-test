<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import "./solo-rpg-styles.css";

    export let show: boolean = false;

    const dispatch = createEventDispatcher();

    function navigateHome() {
        dispatch("navigateHome");
    }
</script>

{#if show}
    <div class="srpg-modal">
        <div class="srpg-modal-content">
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
        </div>
    </div>
{/if}

<style>
    .srpg-modal { 
        background-color: #666;
        padding: 1rem;
    }

    .srpg-modal-content {
        padding: 0;    
    }

    .body {
        padding: 1.5rem;
        text-align: center;
    }

    .description {
        color: #4b5563;
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
