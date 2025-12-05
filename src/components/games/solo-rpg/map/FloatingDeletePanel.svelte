<script lang="ts">
    /**
     * FloatingDeletePanel.svelte
     *
     * Delete button for selected objects in Move mode.
     * Visible only when an object is selected.
     */
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher<{
        delete: void;
    }>();

    function handleDelete() {
        if (confirm("Delete this object?")) {
            dispatch("delete");
        }
    }
</script>

<div class="floating-panel floating-delete-panel">
    <button class="action-btn danger" on:click={handleDelete} aria-label="Delete selected object">
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
</div>

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

    .action-btn.danger:hover {
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
</style>
