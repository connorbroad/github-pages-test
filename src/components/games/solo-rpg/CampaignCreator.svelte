<script lang="ts">
    /**
     * Campaign Creator Component
     * Modal for creating a new campaign from a game blueprint
     */
    import type { Campaign, GameBlueprint } from "./storage-utils";
    import { createEventDispatcher } from "svelte";
    import "./solo-rpg-styles.css";

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
    <div
        class="oracle-modal"
        role="button"
        tabindex="0"
        aria-label="Close campaign creator"
        on:click={handleClose}
        on:keydown={(e) => {
            const tag = (e.target as HTMLElement).tagName;
            if (
                (e.key === "Enter" || e.key === " ") &&
                !["INPUT", "TEXTAREA", "BUTTON"].includes(tag)
            ) {
                handleClose();
            }
        }}
    >
        <div
            class="oracle-content"
            role="dialog"
            aria-modal="true"
            on:click|stopPropagation
            tabindex="0"
            on:keydown={(e) => {}}
        >
            <button class="srpg-b-modal-nav srpg-b-modal-nav-close" on:click={handleClose}
                >&times;</button
            >
            <h2>Create New Campaign</h2>
            <p class="blueprint-subtitle">
                Using: <strong>{blueprint.title}</strong>
            </p>

            <div class="form-group">
                <label for="campaign-title">Campaign Title:</label>
                <input
                    id="campaign-title"
                    type="text"
                    bind:value={campaignTitle}
                    placeholder="Enter campaign title..."
                    on:keydown={handleKeyDown}
                />
            </div>

            <button
                class="srpg-b srpg-b-create srpg-b-w-full"
                on:click={handleCreate}
                disabled={!campaignTitle.trim()}
            >
                Create Campaign
            </button>
        </div>
    </div>
{/if}

<style>
    .oracle-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .oracle-content {
        background: #fff;
        margin: 1rem;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        min-width: 300px;
        max-width: 500px;
        text-align: center;
        position: relative;
    }

    h2 {
        margin-top: 0;
        margin-bottom: 0.5rem;
        color: #333;
    }

    .blueprint-subtitle {
        margin-bottom: 1.5rem;
        color: #666;
        font-size: 0.95rem;
    }

    .blueprint-subtitle strong {
        color: #1976d2;
    }

    .form-group {
        margin-bottom: 1.5rem;
        text-align: left;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #555;
    }

    .form-group input[type="text"] {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid #e0e0e0;
        border-radius: 6px;
        font-size: 1rem;
        box-sizing: border-box;
        transition: border-color 0.2s;
    }

    .form-group input[type="text"]:focus {
        outline: none;
        border-color: #1976d2;
    }
</style>
