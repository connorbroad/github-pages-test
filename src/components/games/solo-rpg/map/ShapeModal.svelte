<script lang="ts">
    /**
     * ShapeModal.svelte
     *
     * Modal for selecting a shape type.
     */
    import { createEventDispatcher } from "svelte";
    import ShapeIcon from "./shared/ShapeIcon.svelte";

    export let show: boolean = false;
    export let currentShape: "square" | "circle" | "triangle" | "star" = "square";

    const dispatch = createEventDispatcher<{
        select: "square" | "circle" | "triangle" | "star";
        close: void;
    }>();

    const shapeOptions: Array<{
        id: "square" | "circle" | "triangle" | "star";
        label: string;
    }> = [
        { id: "square", label: "Square" },
        { id: "circle", label: "Circle" },
        { id: "triangle", label: "Triangle" },
        { id: "star", label: "Star" },
    ];

    function selectShape(shape: "square" | "circle" | "triangle" | "star") {
        dispatch("select", shape);
    }

    function close() {
        dispatch("close");
    }

    function handleBackdropClick() {
        close();
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            close();
        }
    }
</script>

{#if show}
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
    <div
        class="shape-modal-backdrop"
        on:click={handleBackdropClick}
        on:keydown={handleKeydown}
        role="dialog"
        aria-modal="true"
        tabindex="-1">
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
        <div class="shape-modal" on:click|stopPropagation role="document">
            <div class="shape-modal-header">
                <h3>Select Shape</h3>
                <button class="shape-modal-close" on:click={close} aria-label="Close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div class="shape-modal-grid">
                {#each shapeOptions as shape}
                    <button
                        class="shape-option"
                        class:active={currentShape === shape.id}
                        on:click={() => selectShape(shape.id)}
                        aria-label={shape.label}>
                        <ShapeIcon shape={shape.id} size={40} />
                        <span class="shape-label">{shape.label}</span>
                    </button>
                {/each}
            </div>
        </div>
    </div>
{/if}

<style>
    .shape-modal-backdrop {
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
        .shape-modal-backdrop {
            padding: 1rem;
            padding-left: calc(170px + 1rem);
        }
    }

    .shape-modal {
        background: var(--bg-elevated);
        border: 1px solid var(--border-primary);
        border-radius: 12px;
        box-shadow: var(--shadow-xl);
        max-width: 320px;
        width: 100%;
        max-height: 80vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .shape-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        border-bottom: 1px solid var(--border-primary);
    }

    .shape-modal-header h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .shape-modal-close {
        background: none;
        border: none;
        padding: 0.25rem;
        cursor: pointer;
        color: var(--text-secondary);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .shape-modal-close:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .shape-modal-close svg {
        width: 20px;
        height: 20px;
    }

    .shape-modal-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
        padding: 1rem;
    }

    .shape-option {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem;
        background: var(--bg-secondary);
        border: 2px solid transparent;
        border-radius: 8px;
        cursor: pointer;
        transition:
            border-color 0.15s ease,
            background-color 0.15s ease;
        color: var(--text-secondary);
    }

    .shape-option:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .shape-option.active {
        border-color: var(--accent-primary);
        background: var(--bg-tertiary);
        color: var(--accent-primary);
    }

    .shape-label {
        font-size: 0.75rem;
        font-weight: 500;
    }
</style>
