<script lang="ts">
    export let entryId: string;
    export let value: string = "";
    export let placeholder: string = "Add your notes...";
    export let compact: boolean = false;

    export let onSave: (detail: { entryId: string; value: string }) => void = () => {};
    export let onCancel: () => void = () => {};

    function handleSave() {
        onSave({ entryId, value });
    }

    function handleCancel() {
        onCancel();
    }
</script>

<div
    class="rounded border border-(--border-primary) bg-(--bg-secondary) p-2.5 {compact
        ? 'mt-2'
        : ''}">
    <textarea
        bind:value
        {placeholder}
        rows={compact ? 2 : 4}
        class="mb-2 w-full resize-y rounded border border-(--input-border) bg-(--input-bg) px-2 py-2 text-sm text-(--text-primary) focus:border-(--input-border-focus) focus:shadow-[0_0_0_2px_var(--focus-ring)] focus:outline-none">
    </textarea>
    <div class="flex gap-1.5 max-sm:flex-col">
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
