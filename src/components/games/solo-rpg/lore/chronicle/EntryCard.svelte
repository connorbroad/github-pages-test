<script lang="ts">
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

    export let onAssignCharacter: (characterId: string) => void = () => {};
    export let onEdit: (detail: {
        entryId: string;
        isManual: boolean;
        currentText: string;
    }) => void = () => {};
    export let onDelete: (entryId: string) => void = () => {};
    export let onCancelEdit: () => void = () => {};

    $: isEditing = editingEntryId === entry.id;
    $: typeConfig = getEntryTypeConfig(entry);
    $: hasNotes = entry.userNotes && entry.userNotes.trim().length > 0;

    function handleAssignCharacter(entryId: string) {
        onAssignCharacter(entryId);
    }

    function handleEdit(entryId: string) {
        const currentText = entry[typeConfig.editField];
        onEdit({
            entryId: entryId,
            isManual: typeConfig.editField === "content",
            currentText,
        });
    }

    function handleDelete(entryId: string) {
        onDelete(entryId);
    }

    function handleCancelEdit() {
        onCancelEdit();
    }
</script>

<div class={typeConfig.cardClass}>
    <div class="mb-2 flex items-center justify-between border-b border-(--border-primary) pb-2">
        <span class="text-xs font-semibold tracking-wide text-(--text-secondary) uppercase">
            {typeConfig.icon}
            {typeConfig.label}
        </span>
        <span class="text-xs font-normal text-(--text-muted)">
            {formatTimestamp(entry.timestamp)}
        </span>
    </div>

    {#if !isEditing}
        <svelte:component this={typeConfig.contentComponent} {entry} />

        {#if hasNotes}
            <EntryNotes notes={entry.userNotes} />
        {/if}
    {/if}

    {#if isEditing}
        <EntryEditor
            entryId={entry.id}
            bind:value={editText}
            placeholder={typeConfig.editPlaceholder}
            compact={typeConfig.compact}
            onCancel={handleCancelEdit} />
    {/if}

    <EntryActions
        entryId={entry.id}
        characterId={entry.characterId}
        {characterName}
        editButtonLabel={typeConfig.editButtonLabel(entry)}
        {isEditing}
        compact={typeConfig.compact}
        onAssignCharacter={handleAssignCharacter}
        onEdit={handleEdit}
        onDelete={handleDelete} />
</div>
