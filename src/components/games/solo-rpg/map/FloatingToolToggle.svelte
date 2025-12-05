<script lang="ts">
    /**
     * FloatingToolToggle.svelte
     *
     * Move/Add toggle button group. Always visible in edit mode.
     * This panel's position never changes when other panels appear/disappear.
     */
    import { createEventDispatcher } from "svelte";

    export let tool: "move" | "paint" = "move";

    const dispatch = createEventDispatcher<{
        toolChange: "move" | "paint";
    }>();

    function setTool(t: "move" | "paint") {
        if (tool !== t) {
            dispatch("toolChange", t);
        }
    }
</script>

<div class="floating-panel floating-tool-toggle">
    <div class="toggle-group">
        <button
            class="toggle-btn"
            class:active={tool === "move"}
            on:click={() => setTool("move")}
            aria-label="Move tool"
            aria-pressed={tool === "move"}>
            <svg
                class="toggle-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2">
                <path d="M5 9l-3 3 3 3" />
                <path d="M9 5l3-3 3 3" />
                <path d="M15 19l-3 3-3-3" />
                <path d="M19 9l3 3-3 3" />
                <path d="M2 12h20" />
                <path d="M12 2v20" />
            </svg>
            <span class="toggle-label">Move</span>
        </button>
        <button
            class="toggle-btn"
            class:active={tool === "paint"}
            on:click={() => setTool("paint")}
            aria-label="Add tool"
            aria-pressed={tool === "paint"}>
            <svg
                class="toggle-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2">
                <!-- Plus icon -->
                <path d="M12 5v14" />
                <path d="M5 12h14" />
            </svg>
            <span class="toggle-label">Add</span>
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
