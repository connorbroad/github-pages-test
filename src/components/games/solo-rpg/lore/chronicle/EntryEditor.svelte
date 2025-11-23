<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let entryId: string;
    export let value: string = "";
    export let placeholder: string = "Add your notes...";
    export let compact: boolean = false;

    const dispatch = createEventDispatcher();

    function handleSave() {
        dispatch("save", { entryId, value });
    }

    function handleCancel() {
        dispatch("cancel");
    }
</script>

<div class="entry-editor {compact ? 'compact' : ''}">
    <textarea bind:value {placeholder} rows={compact ? 2 : 4}></textarea>
    <div class="editor-actions">
        <button
            class="srpg-b srpg-b-create {compact ? 'srpg-b-sm' : ''}"
            on:click={handleSave}
            disabled={!value.trim()}>
            Save
        </button>
        <button class="srpg-b srpg-b-simple {compact ? 'srpg-b-sm' : ''}" on:click={handleCancel}>
            Cancel
        </button>
    </div>
</div>

<style>
    .entry-editor {
        background: var(--srpg-secondary-bg);
        border: 1px solid var(--srpg-border-color);
        border-radius: 4px;
        padding: 0.6rem;
    }

    .entry-editor.compact {
        margin-top: 0.5rem;
    }

    .entry-editor textarea {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid var(--srpg-border-color);
        border-radius: 3px;
        font-family: inherit;
        font-size: 0.85rem;
        resize: vertical;
        margin-bottom: 0.5rem;
        background: var(--srpg-input-bg);
        color: var(--srpg-text-primary);
    }

    .entry-editor textarea:focus {
        outline: none;
        border-color: var(--srpg-oracle-accent);
        box-shadow: 0 0 0 2px var(--srpg-focus-ring);
    }

    .editor-actions {
        display: flex;
        gap: 0.4rem;
    }

    @media (max-width: 640px) {
        .editor-actions {
            flex-direction: column;
        }
    }
</style>
