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
    export let onSave: (detail: { entryId: string; isManual: boolean }) => void = () => {};
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

    function handleSave(event: CustomEvent) {
        onSave({
            entryId: event.detail.entryId,
            isManual: typeConfig.editField === "content",
        });
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
            onSave={handleSave}
            onCancel={handleCancelEdit} />
    {/if}

    <!-- Actions (always shown) -->
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
