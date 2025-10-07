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
            disabled={!value.trim()}
        >
            Save
        </button>
        <button
            class="srpg-b {compact ? 'srpg-b-sm' : ''}"
            on:click={handleCancel}
        >
            Cancel
        </button>
    </div>
</div>

<style>
    .entry-editor {
        background: #fafafa;
        border: 1px solid #e5e5e5;
        border-radius: 4px;
        padding: 0.6rem;
    }

    .entry-editor.compact {
        margin-top: 0.5rem;
    }

    .entry-editor textarea {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #d4d4d4;
        border-radius: 3px;
        font-family: inherit;
        font-size: 0.85rem;
        resize: vertical;
        margin-bottom: 0.5rem;
    }

    .entry-editor textarea:focus {
        outline: none;
        border-color: #6366f1;
        box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
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
