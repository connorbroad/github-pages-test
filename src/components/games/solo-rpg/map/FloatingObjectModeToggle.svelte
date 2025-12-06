<script lang="ts">
    /**
     * FloatingObjectModeToggle.svelte
     *
     * Select/Add toggle for Object mode. Visible when editMode === "object".
     * - Select: allows selecting and editing existing tokens
     * - Add: allows placing new tokens on the map
     */
    import { createEventDispatcher } from "svelte";

    export let objectMode: "select" | "add" = "select";

    const dispatch = createEventDispatcher<{
        objectModeChange: "select" | "add";
    }>();

    function setObjectMode(mode: "select" | "add") {
        if (objectMode !== mode) {
            dispatch("objectModeChange", mode);
        }
    }
</script>

<div class="floating-panel floating-object-mode-toggle">
    <div class="toggle-group">
        <button
            class="toggle-btn"
            class:active={objectMode === "select"}
            on:click={() => setObjectMode("select")}
            aria-label="Select mode"
            aria-pressed={objectMode === "select"}>
            <svg
                class="toggle-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2">
                <!-- Cursor/pointer icon -->
                <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                <path d="M13 13l6 6" />
            </svg>
            <span class="toggle-label">Select</span>
        </button>
        <button
            class="toggle-btn"
            class:active={objectMode === "add"}
            on:click={() => setObjectMode("add")}
            aria-label="Add mode"
            aria-pressed={objectMode === "add"}>
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
