<script lang="ts">
    /**
     * FloatingBrushModeToggle.svelte
     *
     * Paint/Erase toggle button group for background mode.
     * Visible only when `tool === "paint" && paintMode === "background"`.
     * This panel appears after the Background/Object toggle.
     */
    import { createEventDispatcher } from "svelte";

    export let isErasing: boolean = false;

    const dispatch = createEventDispatcher<{
        brushModeChange: boolean; // true = erasing, false = painting
    }>();

    function setBrushMode(erasing: boolean) {
        if (isErasing !== erasing) {
            dispatch("brushModeChange", erasing);
        }
    }
</script>

<div class="floating-panel floating-brush-mode-toggle">
    <div class="toggle-group">
        <button
            class="toggle-btn"
            class:active={isErasing}
            on:click={() => setBrushMode(true)}
            aria-label="Erase mode"
            aria-pressed={isErasing}>
            <svg
                class="toggle-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2">
                <!-- Eraser icon -->
                <path
                    d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
                <path d="M22 21H7" />
                <path d="m5 11 9 9" />
            </svg>
            <span class="toggle-label">Erase</span>
        </button>
        <button
            class="toggle-btn"
            class:active={!isErasing}
            on:click={() => setBrushMode(false)}
            aria-label="Paint mode"
            aria-pressed={!isErasing}>
            <svg
                class="toggle-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2">
                <!-- Paint brush icon -->
                <path
                    d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" />
                <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" />
                <path d="M14.5 17.5 4.5 15" />
            </svg>
            <span class="toggle-label">Paint</span>
        </button>
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

    .toggle-group {
        display: flex;
        flex-direction: row;
        gap: 0.125rem;
    }

    /* Desktop: vertical layout */
    @media (min-width: 768px) {
        .toggle-group {
            flex-direction: column;
        }
    }

    .toggle-btn {
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

    .toggle-btn:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .toggle-btn.active {
        background: var(--accent-primary);
        color: white;
    }

    .toggle-btn.active:hover {
        background: var(--accent-primary-hover);
    }

    .toggle-icon {
        width: 20px;
        height: 20px;
    }

    .toggle-label {
        font-size: 0.625rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.025em;
    }
</style>
