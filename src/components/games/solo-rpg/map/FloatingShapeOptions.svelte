<script lang="ts">
    /**
     * FloatingShapeOptions.svelte
     *
     * Shape selector for object paint mode. Separate panel to avoid changing
     * layout of paint options when switching between Background and Object modes.
     * Visible only when `tool === "paint" && paintMode === "object"`.
     */
    import { createEventDispatcher } from "svelte";
    import { fade } from "svelte/transition";

    export let currentShape: "square" | "circle" | "triangle" | "star" = "square";

    const dispatch = createEventDispatcher<{
        shapeChange: "square" | "circle" | "triangle" | "star";
    }>();

    // Shape options
    const shapeOptions: Array<{
        id: "square" | "circle" | "triangle" | "star";
        label: string;
    }> = [
        { id: "square", label: "Square" },
        { id: "circle", label: "Circle" },
        { id: "triangle", label: "Triangle" },
        { id: "star", label: "Star" },
    ];

    // UI state
    let showShapeDrawer = false;

    function selectShape(s: typeof currentShape) {
        dispatch("shapeChange", s);
        showShapeDrawer = false;
    }

    function toggleShapeDrawer() {
        showShapeDrawer = !showShapeDrawer;
    }
</script>

<div class="floating-panel floating-shape-options">
    <div class="option-wrapper">
        <button
            class="option-btn"
            on:click={toggleShapeDrawer}
            aria-label="Select Shape"
            aria-expanded={showShapeDrawer}>
            {#if currentShape === "square"}
                <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="4" y="4" width="16" height="16" />
                </svg>
            {:else if currentShape === "circle"}
                <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="8" />
                </svg>
            {:else if currentShape === "triangle"}
                <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4 4 20 h16 Z" />
                </svg>
            {:else}
                <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="12,2 15,10 23,10 17,15 19,23 12,18 5,23 7,15 1,10 9,10" />
                </svg>
            {/if}
            <span class="option-label">Shape</span>
        </button>

        {#if showShapeDrawer}
            <div class="shape-drawer" transition:fade={{ duration: 150 }}>
                {#each shapeOptions as shape}
                    <button
                        class="shape-option-btn"
                        class:active={currentShape === shape.id}
                        on:click={() => selectShape(shape.id)}
                        aria-label={shape.label}>
                        {#if shape.id === "square"}
                            <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="4" y="4" width="16" height="16" />
                            </svg>
                        {:else if shape.id === "circle"}
                            <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="12" cy="12" r="8" />
                            </svg>
                        {:else if shape.id === "triangle"}
                            <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 4 4 20 h16 Z" />
                            </svg>
                        {:else}
                            <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor">
                                <polygon
                                    points="12,2 15,10 23,10 17,15 19,23 12,18 5,23 7,15 1,10 9,10" />
                            </svg>
                        {/if}
                    </button>
                {/each}
            </div>
        {/if}
    </div>
</div>

<style>
    .floating-panel {
        background: var(--bg-elevated);
        border: 1px solid var(--border-primary);
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        padding: 0.25rem;
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
        color: var(--text-secondary);
        cursor: pointer;
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

    /* Shape Icon */
    .shape-icon {
        width: 20px;
        height: 20px;
    }

    /* Shape Drawer */
    .shape-drawer {
        position: absolute;
        background: var(--bg-elevated);
        border: 1px solid var(--border-primary);
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        padding: 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        z-index: 40;
    }

    /* Mobile: drawer expands upward */
    @media (max-width: 767px) {
        .shape-drawer {
            bottom: 100%;
            left: 0;
            margin-bottom: 0.25rem;
        }
    }

    /* Desktop: drawer expands downward */
    @media (min-width: 768px) {
        .shape-drawer {
            top: 100%;
            left: 0;
            margin-top: 0.25rem;
        }
    }

    .shape-option-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        background: transparent;
        border: 2px solid transparent;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s ease;
        color: var(--text-secondary);
    }

    .shape-option-btn:hover {
        background: var(--bg-tertiary);
        border-color: var(--border-secondary);
        color: var(--text-primary);
    }

    .shape-option-btn.active {
        border-color: var(--accent-primary);
        background: var(--accent-primary);
        color: white;
    }

    .shape-option-btn .shape-icon {
        width: 20px;
        height: 20px;
    }
</style>
