<script lang="ts">
    /**
     * FloatingPaintModeToggle.svelte
     *
     * Background/Object toggle button group. Visible when Paint tool is selected.
     * This panel appears to the right of FloatingToolToggle with a gap.
     */
    import { createEventDispatcher } from "svelte";

    export let paintMode: "background" | "object" = "background";

    const dispatch = createEventDispatcher<{
        paintModeChange: "background" | "object";
    }>();

    function setPaintMode(mode: "background" | "object") {
        if (paintMode !== mode) {
            dispatch("paintModeChange", mode);
        }
    }
</script>

<div class="floating-panel floating-paint-mode-toggle">
    <div class="toggle-group">
        <button
            class="toggle-btn"
            class:active={paintMode === "background"}
            on:click={() => setPaintMode("background")}
            aria-label="Background layer"
            aria-pressed={paintMode === "background"}>
            <svg
                class="toggle-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2">
                <!-- Grid/background icon -->
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M3 15h18" />
                <path d="M9 3v18" />
                <path d="M15 3v18" />
            </svg>
            <span class="toggle-label">Backgnd</span>
        </button>
        <button
            class="toggle-btn"
            class:active={paintMode === "object"}
            on:click={() => setPaintMode("object")}
            aria-label="Object layer"
            aria-pressed={paintMode === "object"}>
            <svg
                class="toggle-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2">
                <!-- Cube/object icon -->
                <path
                    d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <span class="toggle-label">Object</span>
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
