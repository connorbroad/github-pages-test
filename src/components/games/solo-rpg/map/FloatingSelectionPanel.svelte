<script lang="ts">
    /**
     * FloatingSelectionPanel.svelte
     *
     * Actions and options for selected objects in Move mode.
     * Visible only when `moveHasSelection && mapMode === "edit"`.
     * This panel appears within FloatingPanelContainer when selection exists.
     */
    import { createEventDispatcher } from "svelte";
    import CreatureAssignmentModal from "./CreatureAssignmentModal.svelte";
    import type { CreatureRef } from "../data/storage-utils";
    import { CLEAR_COLOR } from "./shared/color-palette";
    import ColorDrawer from "./shared/ColorDrawer.svelte";

    export let selectedColor: string | null = null;
    export let canFlip: boolean = false;
    export let creatureRef: CreatureRef | null = null;
    export let campaignId: string | null = null;
    export let mapId: string | null = null;

    const dispatch = createEventDispatcher<{
        colorChange: string;
        flip: void;
        delete: void;
        creatureAssign: CreatureRef | null;
    }>();

    // UI state
    let showColorDrawer = false;
    let showCreatureModal = false;

    function handleDelete() {
        dispatch("delete");
    }

    function handleFlip() {
        dispatch("flip");
    }

    function handleColorSelect(c: string) {
        dispatch("colorChange", c);
        showColorDrawer = false;
    }

    function toggleColorDrawer() {
        showColorDrawer = !showColorDrawer;
    }

    function openCreatureModal() {
        showCreatureModal = true;
    }

    function handleCreatureSelect(e: CustomEvent<{ type: "character"; id: string }>) {
        // Import the generateUUID from uuid.ts
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

<div class="floating-panel floating-selection-panel">
    <!-- Action Buttons Row -->
    <div class="actions-row">
        <button
            class="action-btn danger"
            on:click={handleDelete}
            aria-label="Delete selected object">
            <svg
                class="action-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
            <span class="action-label">Delete</span>
        </button>

        <button
            class="action-btn"
            on:click={handleFlip}
            disabled={!canFlip}
            aria-label="Flip selected object">
            <svg class="action-icon" viewBox="0 0 24 24" fill="currentColor">
                <path
                    d="M15 21h2v-2h-2zm4-12h2V7h-2zM3 5v14c0 1.1.9 2 2 2h4v-2H5V5h4V3H5c-1.1 0-2 .9-2 2m16-2v2h2c0-1.1-.9-2-2-2m-8 20h2V1h-2zm8-6h2v-2h-2zM15 5h2V3h-2zm4 8h2v-2h-2zm0 8c1.1 0 2-.9 2-2h-2z" />
            </svg>
            <span class="action-label">Flip</span>
        </button>

        <button
            class="action-btn"
            on:click={openCreatureModal}
            aria-label="Assign creature to object">
            <svg class="action-icon" viewBox="0 0 24 24" fill="currentColor">
                <path
                    d="M12 4a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4" />
            </svg>
            <span class="action-label">Assign</span>
        </button>
    </div>

    <!-- Color Selector (only if object can have color) -->
    {#if selectedColor !== null}
        <div class="color-row">
            <div class="option-wrapper">
                <button
                    class="option-btn"
                    on:click={toggleColorDrawer}
                    aria-label="Change object color"
                    aria-expanded={showColorDrawer}>
                    {#if selectedColor === CLEAR_COLOR}
                        <div class="color-swatch clear-pattern"></div>
                    {:else}
                        <div class="color-swatch" style="background: {selectedColor}"></div>
                    {/if}
                    <span class="option-label">Color</span>
                </button>

                {#if showColorDrawer}
                    <ColorDrawer
                        {selectedColor}
                        showClearOption={canFlip}
                        on:select={(e) => handleColorSelect(e.detail)} />
                {/if}
            </div>
        </div>
    {/if}
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
    /* Base floating panel style (matches other floating panels) */
    .floating-panel {
        background: var(--bg-elevated);
        border: 1px solid var(--border-primary);
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        padding: 0.25rem;
    }

    /* Selection panel specifics */
    .floating-selection-panel {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
    }

    /* Actions Row */
    .actions-row {
        display: flex;
        gap: 0.125rem;
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

    .action-btn:hover:not(:disabled) {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .action-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    .action-btn.danger:hover:not(:disabled) {
        background: var(--danger-bg);
        color: var(--accent-danger);
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

    /* Color Row */
    .color-row {
        display: flex;
        border-top: 1px solid var(--border-primary);
        padding-top: 0.375rem;
    }

    .option-wrapper {
        position: relative;
    }

    .option-btn {
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

    .option-btn:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .option-label {
        font-size: 0.625rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.025em;
    }

    /* Color Swatch */
    .color-swatch {
        width: 20px;
        height: 20px;
        border-radius: 4px;
        border: 1px solid var(--border-primary);
    }

    .color-swatch.clear-pattern {
        background: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 3px,
            var(--border-primary) 3px,
            var(--border-primary) 6px
        );
    }
</style>
