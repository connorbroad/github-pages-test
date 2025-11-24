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

<div
    class="rounded border border-gray-300 bg-gray-50 p-2.5 dark:border-gray-600 dark:bg-zinc-800 {compact
        ? 'mt-2'
        : ''}">
    <textarea
        bind:value
        {placeholder}
        rows={compact ? 2 : 4}
        class="mb-2 w-full resize-y rounded border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 focus:border-blue-500 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.2)] focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-400">
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
