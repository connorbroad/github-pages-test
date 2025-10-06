<script lang="ts">
    /**
     * Campaign Load Confirmation Component
     * Modal for confirming campaign load
     */
    import type { Campaign } from "./storage-utils";
    import { createEventDispatcher } from "svelte";
    import "./solo-rpg-styles.css";

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
    <div
        class="srpg-modal"
        role="button"
        tabindex="0"
        aria-label="Close campaign load dialog"
        on:click={handleClose}
        on:keydown={(e) => {
            const tag = (e.target as HTMLElement).tagName;
            if (
                (e.key === "Enter" || e.key === " ") &&
                !["BUTTON"].includes(tag)
            ) {
                handleClose();
            }
        }}
    >
        <div
            class="srpg-modal-content"
            role="dialog"
            aria-modal="true"
            tabindex="0"
            on:click|stopPropagation
            on:keydown={(e) => {}}
        >
            <button class="srpg-b-modal-nav srpg-b-modal-nav-close" on:click={handleClose}
                >&times;</button
            >
            <h2>Campaign Info</h2>

            <div class="campaign-details">
                <p class="campaign-title">{campaign.title}</p>
                <p class="campaign-info">
                    <strong>Game:</strong>
                    {campaign.blueprintTitle}
                </p>
                <p class="campaign-info">
                    <strong>Created:</strong>
                    {formatDate(campaign.createdAt)}
                </p>
            </div>

            <div class="button-group">
                <button
                    class="srpg-b srpg-b-create srpg-b-w-full"
                    on:click={handleLoad}
                >
                    Load Campaign
                </button>
            </div>

            <p class="confirmation-message"> 
                <em>Loading a campaign makes it the active campaign for all tools.</em>
            </p>
        </div>
    </div>
{/if}

<style>
    h2 {
        margin-top: 0; 
        color: #333;
    }

    .campaign-details {
        background: #f8f9fa;
        padding: 1.25rem;
        border-radius: 6px;
        margin-bottom: 1.5rem;
        text-align: left;
    }

    .campaign-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #333;
        margin: 0 0 1rem 0;
    }

    .campaign-info {
        margin: 0.5rem 0;
        color: #666;
        font-size: 0.95rem;
    }

    .campaign-info strong {
        color: #333;
    }

    .confirmation-message { 
        color: #666;
        font-size: 0.95rem;
        line-height: 1.5;
        margin-top: 0.5rem;
        margin-bottom: 0;
    }

    .button-group {
        display: flex;
        gap: 0.75rem;
    }

    @media (max-width: 500px) {
        .button-group {
            flex-direction: column;
        }
    }
</style>
