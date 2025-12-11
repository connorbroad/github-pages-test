<script lang="ts">
    export let entryId: string;
    export let characterId: string | undefined = undefined;
    export let characterName: string = "";
    export let showEditButton: boolean = true;
    export let editButtonLabel: string = "Edit";
    export let isEditing: boolean = false;
    export let compact: boolean = false; // For fortune cards

    export let onAssignCharacter: (entryId: string) => void = () => {};
    export let onEdit: (entryId: string) => void = () => {};
    export let onDelete: (entryId: string) => void = () => {};

    function handleAssignCharacter() {
        onAssignCharacter(entryId);
    }

    function handleEdit() {
        onEdit(entryId);
    }

    function handleDelete() {
        onDelete(entryId);
    }
</script>

<div
    class="flex items-center justify-end gap-1.5 border-t border-(--border-primary) pt-2.5 {compact
        ? 'mt-1.5 pt-1.5'
        : ''}">
    <button
        class="flex min-h-0 min-w-0 cursor-pointer items-center justify-center rounded border border-(--border-primary) bg-transparent leading-none text-(--text-muted) transition-all duration-150 hover:border-(--border-secondary) hover:bg-(--bg-tertiary) hover:text-(--text-secondary) {compact
            ? 'p-1.5'
            : 'p-1.5'}"
        on:click={handleAssignCharacter}
        title="Assign character"
        aria-label="Assign character">
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width={compact ? "14" : "16"}
            height={compact ? "14" : "16"}>
            <path
                fill="currentColor"
                d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4m0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4" />
        </svg>
    </button>
    {#if characterId && characterName}
        <p class="m-0 text-sm text-(--text-muted) italic">{characterName}</p>
    {/if}
    <div class="grow"></div>
    {#if showEditButton && !isEditing}
        <button
            class="flex min-h-0 min-w-0 cursor-pointer items-center justify-center rounded border border-(--border-primary) bg-transparent leading-none text-(--text-muted) transition-all duration-150 hover:border-(--border-secondary) hover:bg-(--bg-tertiary) hover:text-(--text-secondary) {compact
                ? 'p-1.5'
                : 'p-1.5'}"
            on:click={handleEdit}
            title={editButtonLabel}
            aria-label={editButtonLabel}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width={compact ? "14" : "16"}
                height={compact ? "14" : "16"}>
                <path
                    fill="currentColor"
                    d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
            </svg>
        </button>
    {/if}
    <button
        class="flex min-h-0 min-w-0 cursor-pointer items-center justify-center rounded border border-(--border-primary) bg-transparent leading-none text-(--text-muted) transition-all duration-150 hover:border-(--accent-danger) hover:bg-(--danger-bg) hover:text-(--accent-danger) {compact
            ? 'p-1.5'
            : 'p-1.5'}"
        on:click={handleDelete}
        title="Delete entry"
        aria-label="Delete entry">
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width={compact ? "14" : "16"}
            height={compact ? "14" : "16"}>
            <path
                fill="currentColor"
                d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
        </svg>
    </button>
</div>
