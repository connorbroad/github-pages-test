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

<section class="relative mb-6 p-6 md:p-8" {id}>
    <div class="border-border-primary mb-4 flex items-center justify-between border-b-2 pb-3">
        <h2 class="text-text-primary m-0 text-2xl font-semibold md:text-[1.75rem]">{title}</h2>
        <div class="flex items-center gap-2">
            {#if showEditButton && canEdit && !isEditing}
                <button
                    class="border-border-primary hover:bg-bg-tertiary hover:border-border-secondary group flex cursor-pointer items-center justify-center rounded-lg border bg-transparent p-2 transition-all duration-200 active:scale-95"
                    on:click={handleEdit}
                    aria-label="Edit {title}">
                    <svg
                        class="text-text-muted group-hover:text-accent-primary h-4 w-4 transition-colors duration-200"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                </button>
            {:else if isEditing && canEdit}
                <div class="flex gap-2">
                    <button
                        class="border-button-simple-border bg-button-simple-bg text-button-simple-text hover:bg-button-simple-hover-bg hover:border-button-simple-hover-border active:bg-button-simple-bg flex cursor-pointer items-center justify-center gap-2 rounded-md border px-2 py-1 text-center text-sm font-medium shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-sm"
                        on:click={handleCancel}>
                        Cancel
                    </button>
                    <button
                        class="border-border-primary bg-accent-primary hover:bg-accent-primary-hover active:bg-accent-primary-active flex cursor-pointer items-center justify-center gap-2 rounded-md border px-2 py-1 text-center text-sm font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
                        on:click={handleSave}>
                        Save
                    </button>
                </div>
            {/if}
        </div>
    </div>
    <slot />
</section>

<style>
</style>
