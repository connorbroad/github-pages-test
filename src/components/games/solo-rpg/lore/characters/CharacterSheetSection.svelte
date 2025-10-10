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
</script>

<section class="srpg-section" {id}>
    <div class="section-header">
        <h2>{title}</h2>
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
        {/if}
    </div>
    <slot />
</section>

<style>
    .srpg-section {
        position: relative;
        margin-bottom: 1.5rem;
        padding: 1.5rem;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        transition: all 0.2s ease;
    }

    .srpg-section:hover {
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        border-color: #cbd5e1;
    }

    .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 2px solid #e2e8f0;
    }

    .section-header h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: #1e293b;
    }

    .section-edit-btn {
        padding: 0.5rem;
        background: transparent;
        border: 1px solid #e2e8f0;
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
        color: #64748b;
        transition: color 0.2s ease;
    }

    .section-edit-btn:hover {
        background: #f1f5f9;
        border-color: #cbd5e1;
    }

    .section-edit-btn:hover svg {
        color: #3b82f6;
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
