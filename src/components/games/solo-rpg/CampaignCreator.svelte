<script lang="ts">
    /**
     * Campaign Creator Component
     * Modal for creating a new campaign from a game blueprint
     */
    import type { Campaign, GameBlueprint } from "./storage-utils";
    import { createEventDispatcher } from "svelte";
    import SrpgModal from "./shared/modal/SrpgModal.svelte";
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
    <SrpgModal {show} ariaLabel="Close campaign creator" on:close={handleClose}>
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
    </SrpgModal>
{/if}

<style>  
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
