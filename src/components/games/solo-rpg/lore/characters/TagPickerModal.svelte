<script lang="ts">
    import SrpgModal from "../../shared/modal/SrpgModal.svelte";
    import { createEventDispatcher } from "svelte";

    export let show = false;
    export let selectedTags: string[] = [];
    export let availableTags: string[] = [];

    const dispatch = createEventDispatcher();

    let tagsSet: Set<string> = new Set(selectedTags);
    let newTagInput: string = "";
    let showNewTagInput: boolean = false;

    $: tagsSet = new Set(selectedTags);

    function toggleTag(tag: string) {
        const newTagsSet = new Set(tagsSet);
        if (newTagsSet.has(tag)) {
            newTagsSet.delete(tag);
        } else {
            newTagsSet.add(tag);
        }
        tagsSet = newTagsSet;
        dispatch("change", Array.from(tagsSet));
    }

    function addNewTag() {
        const trimmed = newTagInput.trim();
        if (trimmed && !availableTags.includes(trimmed)) {
            const newTagsSet = new Set(tagsSet);
            newTagsSet.add(trimmed);
            tagsSet = newTagsSet;
            dispatch("change", Array.from(tagsSet));
            dispatch("newTag", trimmed);
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
        dispatch("save", Array.from(tagsSet));
    }

    function close() {
        dispatch("close");
    }
</script>

<SrpgModal
    bind:show
    maxWidth="450px"
    ariaLabel="Pick tags for character"
    on:close={close}
>
    <h2 class="srpg-modal-heading">Choose Character Tags</h2>
    <form on:submit|preventDefault={save}>
        <div class="srpg-checkbox-list">
            {#each availableTags as tag}
                <label class="srpg-checkbox-item">
                    <input
                        type="checkbox"
                        checked={tagsSet.has(tag)}
                        on:change={() => toggleTag(tag)}
                    />
                    <span class="srpg-checkbox-item-content">
                        <span class="srpg-checkbox-item-icon">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="1em"
                                height="1em"
                            >
                                <path
                                    fill="currentColor"
                                    d="M5.5 7A1.5 1.5 0 0 1 4 5.5A1.5 1.5 0 0 1 5.5 4A1.5 1.5 0 0 1 7 5.5A1.5 1.5 0 0 1 5.5 7m15.91 4.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.11 0-2 .89-2 2v7c0 .55.22 1.05.59 1.41l8.99 9c.37.36.87.59 1.42.59s1.05-.23 1.41-.59l7-7c.37-.36.59-.86.59-1.41c0-.56-.23-1.06-.59-1.42"
                                />
                            </svg>
                        </span>
                        <span class="srpg-checkbox-item-label">{tag}</span>
                    </span>
                </label>
            {/each}
        </div>

        {#if !showNewTagInput}
            <button
                type="button"
                class="srpg-b srpg-b-create srpg-b-w-full srpg-b-sm"
                on:click={toggleNewTagInput}
            >
                + Add New Tag
            </button>
        {:else}
            <div class="custom-tag-input">
                <input
                    type="text"
                    bind:value={newTagInput}
                    placeholder="Enter new tag name"
                    class="srpg-form-field"
                />
                <button
                    type="button"
                    class="srpg-b srpg-b-create srpg-b-sm"
                    on:click={addNewTag}
                    disabled={!newTagInput.trim()}
                >
                    Add
                </button>
                <button
                    type="button"
                    class="srpg-b srpg-b-sm"
                    on:click={toggleNewTagInput}
                >
                    Cancel
                </button>
            </div>
        {/if}

        <div class="srpg-modal-actions">
            <button type="submit" class="srpg-b srpg-b-normal srpg-b-w-full">
                Close
            </button>
        </div>
    </form>
</SrpgModal>

<style>
    .custom-tag-input {
        display: flex;
        gap: 0.5rem;
        margin-top: 1rem;
        margin-bottom: 1rem;
        align-items: stretch;
        flex-wrap: wrap;
    }

    .custom-tag-input input {
        flex: 1;
        min-width: 150px;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 1rem;
    }

    .custom-tag-input button {
        margin: 0;
        flex-shrink: 0;
    }

    @media (max-width: 767px) {
        .custom-tag-input {
            flex-direction: column;
        }

        .custom-tag-input input {
            width: 100%;
        }

        .custom-tag-input button {
            width: 100%;
        }
    }
</style>
