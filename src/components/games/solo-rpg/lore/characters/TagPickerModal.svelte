<script lang="ts">
    import SrpgModal from "../../shared/modal/SrpgModal.svelte";
    export let show = false;
    export let selectedTags: string[] = [];
    export let availableTags: string[] = [];
    export let onChange: (tags: string[]) => void = () => {};
    export let onNewTag: (tag: string) => void = () => {};
    export let onSave: (tags: string[]) => void = () => {};
    export let onClose: () => void = () => {};

    let tagsSet: Set<string> = new Set(selectedTags);
    let newTagInput: string = "";
    let showNewTagInput: boolean = false;
    let localAvailableTags: string[] = [];

    $: tagsSet = new Set(selectedTags);
    $: localAvailableTags = [...availableTags];

    function toggleTag(tag: string) {
        const newTagsSet = new Set(tagsSet);
        if (newTagsSet.has(tag)) {
            newTagsSet.delete(tag);
        } else {
            newTagsSet.add(tag);
        }
        tagsSet = newTagsSet;
        onChange(Array.from(tagsSet));
    }

    function addNewTag() {
        const trimmed = newTagInput.trim();
        if (trimmed && !localAvailableTags.includes(trimmed)) {
            // Add to local available tags so it appears in the list
            localAvailableTags = [...localAvailableTags, trimmed];
            // Also select the new tag
            const newTagsSet = new Set(tagsSet);
            newTagsSet.add(trimmed);
            tagsSet = newTagsSet;
            onChange(Array.from(tagsSet));
            onNewTag(trimmed);
            newTagInput = "";
            showNewTagInput = false;
        }
    }

    function toggleNewTagInput() {
        showNewTagInput = !showNewTagInput;
        if (showNewTagInput) {
            newTagInput = "";
        }
    }

    function save() {
        onSave(Array.from(tagsSet));
    }

    function close() {
        onClose();
    }
</script>

<SrpgModal bind:show maxWidth="450px" ariaLabel="Pick tags for character" onClose={close}>
    <h2 class="text-text-primary m-0 mb-4 text-xl font-bold">Choose Character Tags</h2>
    <form on:submit|preventDefault={save}>
        <div class="mb-6 flex flex-col gap-2">
            {#each localAvailableTags as tag}
                <label
                    class="bg-card-bg border-border-primary hover:border-accent-primary hover:bg-bg-tertiary flex cursor-pointer items-center rounded-lg border p-3 transition-all duration-200">
                    <input
                        type="checkbox"
                        class="accent-accent-primary mr-3 h-5 w-5 cursor-pointer"
                        checked={tagsSet.has(tag)}
                        on:change={() => toggleTag(tag)} />
                    <span class="flex flex-1 items-center">
                        <span
                            class="text-text-secondary mr-3 flex h-6 w-6 items-center justify-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="1em"
                                height="1em">
                                <path
                                    fill="currentColor"
                                    d="M5.5 7A1.5 1.5 0 0 1 4 5.5A1.5 1.5 0 0 1 5.5 4A1.5 1.5 0 0 1 7 5.5A1.5 1.5 0 0 1 5.5 7m15.91 4.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.11 0-2 .89-2 2v7c0 .55.22 1.05.59 1.41l8.99 9c.37.36.87.59 1.42.59s1.05-.23 1.41-.59l7-7c.37-.36.59-.86.59-1.41c0-.56-.23-1.06-.59-1.42" />
                            </svg>
                        </span>
                        <span class="text-text-primary text-base font-medium">{tag}</span>
                    </span>
                </label>
            {/each}
        </div>

        {#if !showNewTagInput}
            <button
                type="button"
                class="border-border-primary bg-accent-success hover:bg-accent-success-hover active:bg-accent-success-active flex w-full cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-3 text-center font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
                on:click={toggleNewTagInput}>
                + Add New Tag
            </button>
        {:else}
            <div class="mt-4 mb-4 flex flex-wrap items-stretch gap-2 max-md:flex-col">
                <input
                    type="text"
                    bind:value={newTagInput}
                    placeholder="Enter new tag name"
                    class="border-input-border bg-input-bg text-input-text min-w-[150px] flex-1 rounded border p-2 max-md:w-full" />
                <button
                    type="button"
                    class="border-border-primary bg-accent-success hover:bg-accent-success-hover active:bg-accent-success-active m-0 flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-sm font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md max-md:w-full"
                    on:click={addNewTag}
                    disabled={!newTagInput.trim()}>
                    Add
                </button>
                <button
                    type="button"
                    class="border-button-simple-border bg-button-simple-bg text-button-simple-text hover:bg-button-simple-hover-bg hover:border-button-simple-hover-border active:bg-button-simple-bg m-0 flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border px-2 py-3 text-center text-sm font-medium shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-sm max-md:w-full"
                    on:click={toggleNewTagInput}>
                    Cancel
                </button>
            </div>
        {/if}

        <div class="mt-6 flex justify-end">
            <button
                type="submit"
                class="border-border-primary bg-accent-primary hover:bg-accent-primary-hover active:bg-accent-primary-active flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md">
                Close
            </button>
        </div>
    </form>
</SrpgModal>
