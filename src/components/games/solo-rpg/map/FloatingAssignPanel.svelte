<script lang="ts">
    /**
     * FloatingAssignPanel.svelte
     *
     * Assign creature button for selected objects in Move mode.
     * Visible only when an object is selected.
     */
    import { createEventDispatcher } from "svelte";
    import CreatureAssignmentModal from "./CreatureAssignmentModal.svelte";
    import type { CreatureRef } from "../data/storage-utils";

    export let creatureRef: CreatureRef | null = null;
    export let campaignId: string | null = null;
    export let mapId: string | null = null;

    const dispatch = createEventDispatcher<{
        creatureAssign: CreatureRef | null;
    }>();

    let showCreatureModal = false;

    function openCreatureModal() {
        showCreatureModal = true;
    }

    function handleCreatureSelect(e: CustomEvent<{ type: "character"; id: string }>) {
        import("./uuid").then(({ generateUUID }) => {
            const ref: CreatureRef = {
                type: e.detail.type,
                id: e.detail.id,
                instanceId: generateUUID(),
            };
            dispatch("creatureAssign", ref);
            showCreatureModal = false;
        });
    }

    function handleCreatureRemove() {
        dispatch("creatureAssign", null);
        showCreatureModal = false;
    }
</script>

<div class="floating-panel floating-assign-panel">
    <button class="action-btn" on:click={openCreatureModal} aria-label="Assign creature to object">
        <svg class="action-icon" viewBox="0 0 24 24" fill="currentColor">
            <path
                d="M12 4a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4" />
        </svg>
        <span class="action-label">Assign</span>
    </button>
</div>

<!-- Creature Assignment Modal -->
{#if showCreatureModal && campaignId && mapId}
    <CreatureAssignmentModal
        show={showCreatureModal}
        {campaignId}
        {mapId}
        currentCreatureRef={creatureRef}
        on:assign={handleCreatureSelect}
        on:clear={handleCreatureRemove}
        on:close={() => (showCreatureModal = false)} />
{/if}

<style>
    .floating-panel {
        background: var(--bg-elevated);
        border: 1px solid var(--border-primary);
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        padding: 0.25rem;
    }

    .action-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.125rem;
        padding: 0.5rem 0.75rem;
        background: transparent;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        color: var(--text-secondary);
        transition:
            background-color 0.15s ease,
            color 0.15s ease;
        min-width: 56px;
    }

    .action-btn:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .action-icon {
        width: 20px;
        height: 20px;
    }

    .action-label {
        font-size: 0.625rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.025em;
    }
</style>
