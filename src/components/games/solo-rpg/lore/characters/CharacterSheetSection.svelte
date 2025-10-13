<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let id: string;
    export let title: string;
    export let isEditing: boolean = false;
    export let showEditButton: boolean = true;
    export let canEdit: boolean = true;

    const dispatch = createEventDispatcher();

    function handleEdit() {
        dispatch("edit");
    }

    function handleSave() {
        dispatch("save");
    }

    function handleCancel() {
        dispatch("cancel");
    }
</script>

<section class="srpg-section" {id}>
    <div class="section-header">
        <h2>{title}</h2>
        <div class="section-header-actions">
            {#if showEditButton && canEdit && !isEditing}
                <button
                    class="section-edit-btn"
                    on:click={handleEdit}
                    aria-label="Edit {title}"
                >
                    <svg
                        class="srpg-icon-sm"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path
                            d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                        />
                        <path
                            d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                        />
                    </svg>
                </button>
            {:else if isEditing && canEdit}
                <div class="section-edit-actions">
                    <button
                        class="srpg-b srpg-b-sm srpg-b-simple"
                        on:click={handleCancel}
                    >
                        Cancel
                    </button>
                    <button
                        class="srpg-b srpg-b-normal srpg-b-sm"
                        on:click={handleSave}
                    >
                        Save
                    </button>
                </div>
            {/if}
        </div>
    </div>
    <slot />
</section>

<style>
    .srpg-section {
        position: relative;
        margin-bottom: 1.5rem;
        padding: 1.5rem;
        background: var(--card-bg);
        border: 1px solid var(--border-primary);
        border-radius: 12px;
        box-shadow: 0 1px 3px var(--shadow-sm);
        transition: all 0.2s ease;
    }

    .srpg-section:hover {
        box-shadow: 0 2px 6px var(--shadow-md);
        border-color: var(--border-secondary);
    }

    .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 2px solid var(--border-primary);
    }

    .section-header h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .section-header-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .section-edit-actions {
        display: flex;
        gap: 0.5rem;
    }

    .section-edit-btn {
        padding: 0.5rem;
        background: transparent;
        border: 1px solid var(--border-primary);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .section-edit-btn svg {
        width: 1rem;
        height: 1rem;
        color: var(--text-muted);
        transition: color 0.2s ease;
    }

    .section-edit-btn:hover {
        background: var(--bg-tertiary);
        border-color: var(--border-secondary);
    }

    .section-edit-btn:hover svg {
        color: var(--accent-primary);
    }

    .section-edit-btn:active {
        transform: scale(0.95);
    }

    @media (min-width: 768px) {
        .srpg-section {
            padding: 2rem;
        }

        .section-header h2 {
            font-size: 1.75rem;
        }
    }
</style>
