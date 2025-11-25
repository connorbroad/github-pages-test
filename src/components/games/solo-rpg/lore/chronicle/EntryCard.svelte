<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { ChronicleEntry } from "../../data/storage-utils";
    import EntryActions from "./EntryActions.svelte";
    import EntryEditor from "./EntryEditor.svelte";
    import EntryNotes from "./entry-types/EntryNotes.svelte";
    import { getEntryTypeConfig } from "./entry-types/entry-type-config";

    export let entry: ChronicleEntry;
    export let characterName: string = "";
    export let editingEntryId: string | null = null;
    export let editText: string = "";
    export let formatTimestamp: (timestamp: number) => string;

    const dispatch = createEventDispatcher();

    $: isEditing = editingEntryId === entry.id;
    $: typeConfig = getEntryTypeConfig(entry);
    $: hasNotes = entry.userNotes && entry.userNotes.trim().length > 0;

    function handleAssignCharacter(event: CustomEvent<string>) {
        dispatch("assignCharacter", event.detail);
    }

    function handleEdit(event: CustomEvent<string>) {
        const currentText = entry[typeConfig.editField];
        dispatch("edit", {
            entryId: event.detail,
            isManual: typeConfig.editField === "content",
            currentText,
        });
    }

    function handleDelete(event: CustomEvent<string>) {
        dispatch("delete", event.detail);
    }

    function handleSave(event: CustomEvent) {
        dispatch("save", {
            entryId: event.detail.entryId,
            isManual: typeConfig.editField === "content",
        });
    }

    function handleCancelEdit() {
        dispatch("cancelEdit");
    }
</script>

<div class="{typeConfig.cardClass} shadow-2xl">
    <div
        class="mb-2 flex items-center justify-between border-b border-[var(--border-primary)] pb-2">
        <span
            class="text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase">
            {typeConfig.icon}
            {typeConfig.label}
        </span>
        <span class="text-xs font-normal text-[var(--text-muted)]">
            {formatTimestamp(entry.timestamp)}
        </span>
    </div>

    <!-- Render type-specific content -->
    {#if !isEditing}
        <svelte:component this={typeConfig.contentComponent} {entry} />

        <!-- Show notes if they exist (for types that support notes) -->
        {#if hasNotes}
            <EntryNotes notes={entry.userNotes} />
        {/if}
    {/if}

    <!-- Show editor when editing -->
    {#if isEditing}
        <EntryEditor
            entryId={entry.id}
            bind:value={editText}
            placeholder={typeConfig.editPlaceholder}
            compact={typeConfig.compact}
            on:save={handleSave}
            on:cancel={handleCancelEdit} />
    {/if}

    <!-- Actions (always shown) -->
    <EntryActions
        entryId={entry.id}
        characterId={entry.characterId}
        {characterName}
        editButtonLabel={typeConfig.editButtonLabel(entry)}
        {isEditing}
        compact={typeConfig.compact}
        on:assignCharacter={handleAssignCharacter}
        on:edit={handleEdit}
        on:delete={handleDelete} />
</div>
