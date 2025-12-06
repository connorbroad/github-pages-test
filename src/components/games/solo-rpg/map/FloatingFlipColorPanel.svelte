<script lang="ts">
    /**
     * FloatingFlipColorPanel.svelte
     *
     * Flip and Color options for selected objects in Move mode.
     * Visible only when an object is selected.
     */
    import { createEventDispatcher } from "svelte";
    import { CLEAR_COLOR } from "./shared/color-palette";
    import ColorDrawer from "./shared/ColorDrawer.svelte";

    export let selectedColor: string | null = null;
    export let canFlip: boolean = false;

    const dispatch = createEventDispatcher<{
        colorChange: string;
        flip: void;
    }>();

    let showColorDrawer = false;

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
</script>

<div class="floating-panel floating-flip-color-panel">
    <div class="options-row">
        <!-- Flip Button -->
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

        <!-- Color Button with Drawer (only if object has color) -->
        {#if selectedColor !== null}
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
            </div>
        {/if}
    </div>
</div>

<!-- Color Selection Modal -->
{#if showColorDrawer}
    <ColorDrawer
        {selectedColor}
        on:select={(e) => handleColorSelect(e.detail)}
        on:close={() => (showColorDrawer = false)} />
{/if}

<style>
    .floating-panel {
        background: var(--bg-elevated);
        border: 1px solid var(--border-primary);
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        padding: 0.25rem;
    }

    .options-row {
        display: flex;
        gap: 0.125rem;
    }

    .option-wrapper {
        position: relative;
    }

    .action-btn,
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

    .action-btn:hover:not(:disabled),
    .option-btn:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .action-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    .action-icon {
        width: 20px;
        height: 20px;
    }

    .action-label,
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
