<script lang="ts">
    /**
     * ColorDrawer.svelte
     *
     * A modal for selecting colors from the palette.
     * Used by FloatingPaintOptions and FloatingSelectionPanel.
     */
    import { createEventDispatcher } from "svelte";
    import { COLOR_PALETTE } from "./color-palette";

    export let selectedColor: string;

    const dispatch = createEventDispatcher<{
        select: string;
        close: void;
    }>();

    function selectColor(c: string) {
        dispatch("select", c);
    }

    function closeModal() {
        dispatch("close");
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
<div
    class="color-modal-backdrop"
    on:click={closeModal}
    on:keydown={(e) => e.key === "Escape" && closeModal()}
    role="dialog"
    aria-modal="true"
    tabindex="-1">
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
    <div class="color-modal" on:click|stopPropagation role="document">
        <div class="color-modal-header">
            <h3>Select Color</h3>
            <button class="color-modal-close" on:click={closeModal} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                </svg>
            </button>
        </div>
        <div class="color-drawer">
            {#each Object.values(COLOR_PALETTE) as palette}
                <div class="color-palette-section">
                    {#each palette as c}
                        <button
                            class="color-swatch-btn"
                            class:active={selectedColor === c}
                            on:click={() => selectColor(c)}
                            aria-label={c}>
                            <div class="color-swatch" style="background: {c}"></div>
                        </button>
                    {/each}
                </div>
            {/each}
        </div>
    </div>
</div>

<style>
    /* Modal Backdrop */
    .color-modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--modal-overlay);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 1rem;
        padding-bottom: calc(140px + env(safe-area-inset-bottom));
    }

    @media (min-width: 768px) {
        .color-modal-backdrop {
            padding: 1rem;
            padding-left: calc(170px + 1rem);
        }
    }

    .color-modal {
        background: var(--bg-elevated);
        border: 1px solid var(--border-primary);
        border-radius: 12px;
        box-shadow: var(--shadow-lg);
        width: min(300px, 90vw);
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .color-modal-header {
        padding: 1rem;
        border-bottom: 1px solid var(--border-primary);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .color-modal-header h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .color-modal-close {
        width: 2rem;
        height: 2rem;
        padding: 0;
        background: transparent;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        color: var(--text-muted);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
    }

    .color-modal-close:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .color-modal-close svg {
        width: 1.25rem;
        height: 1.25rem;
    }

    .color-drawer {
        padding: 1rem;
        display: flex;
        flex-wrap: wrap;
        justify-items: center;
        justify-content: center;
        gap: 0.5rem;
        overflow-y: auto;
    }

    .color-palette-section {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .color-swatch-btn {
        padding: 0.25rem;
        background: transparent;
        border: 2px solid transparent;
        border-radius: 4px;
        cursor: pointer;
        transition: border-color 0.15s ease;
        display: flex;
        justify-content: center;
    }

    .color-swatch-btn:hover {
        border-color: var(--border-secondary);
    }

    .color-swatch-btn.active {
        border-color: var(--accent-primary);
    }

    .color-swatch {
        width: 20px;
        height: 20px;
        border-radius: 4px;
        border: 1px solid var(--border-primary);
    }
</style>
