<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let entryId: string;
    export let characterId: string | undefined = undefined;
    export let characterName: string = "";
    export let showEditButton: boolean = true;
    export let editButtonLabel: string = "Edit";
    export let isEditing: boolean = false;
    export let compact: boolean = false; // For fortune cards

    const dispatch = createEventDispatcher();

    function handleAssignCharacter() {
        dispatch("assignCharacter", entryId);
    }

    function handleEdit() {
        dispatch("edit", entryId);
    }

    function handleDelete() {
        dispatch("delete", entryId);
    }
</script>

<div class="entry-actions {compact ? 'compact' : ''}">
    <button
        class="entry-action-btn"
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
        <p class="entry-character-name">{characterName}</p>
    {/if}
    <div class="spacer"></div>
    {#if showEditButton && !isEditing}
        <button
            class="entry-action-btn"
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
        class="entry-action-btn delete-btn"
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

<style>
    .entry-actions {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 0.4rem;
        padding-top: 0.65rem;
        border-top: 1px solid var(--srpg-border-color);
    }

    .entry-actions.compact {
        margin-top: 0.4rem;
        padding-top: 0.4rem;
    }

    .entry-character-name {
        font-size: 0.9rem;
        font-style: italic;
        color: var(--srpg-text-muted);
        margin: 0;
    }

    .entry-action-btn {
        background: transparent;
        border: 1px solid var(--srpg-border-color);
        border-radius: 4px;
        padding: 0.35rem;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.15s;
        color: var(--srpg-text-muted);
        min-width: auto;
        min-height: auto;
    }

    .entry-actions.compact .entry-action-btn {
        padding: 0.3rem;
    }

    .entry-action-btn:hover {
        background: var(--srpg-hover-bg);
        border-color: var(--srpg-border-hover);
        color: var(--srpg-text-secondary);
    }

    .entry-action-btn.delete-btn:hover {
        background: var(--srpg-error-bg-light);
        border-color: var(--srpg-error-border);
        color: var(--srpg-error-text);
    }

    .spacer {
        flex-grow: 1;
    }
</style>
