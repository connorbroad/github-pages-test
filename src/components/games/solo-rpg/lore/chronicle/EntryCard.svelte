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

<div class="entry-card {typeConfig.cardClass}">
    <div class="entry-header">
        <span class="entry-type">
            {typeConfig.icon}
            {typeConfig.label}
        </span>
        <span class="entry-timestamp">{formatTimestamp(entry.timestamp)}</span>
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
            on:cancel={handleCancelEdit}
        />
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
        on:delete={handleDelete}
    />
</div>

<style>
    .entry-card {
        background: white;
        border: 1px solid #e5e5e5;
        border-radius: 8px;
        padding: 1rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        transition: all 0.15s ease;
    }

    .entry-card:hover {
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
        border-color: #d4d4d4;
    }

    .entry-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #e5e5e5;
    }

    .entry-type {
        font-size: 0.8rem;
        font-weight: 600;
        color: #525252;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .entry-timestamp {
        font-size: 0.8rem;
        color: #a3a3a3;
        font-weight: 400;
    }

    .oracle-card {
        background: #fafafa;
        border: 1px solid #e5e5e5;
        border-left: 3px solid #6366f1;
        border-radius: 6px;
        padding: 0.65rem 0.85rem;
        box-shadow: none;
        position: relative;
        transition: all 0.15s ease;
    }

    .oracle-card:hover {
        background: #f5f5f5;
        border-left-color: #4f46e5;
    }

    .oracle-card .entry-header {
        margin-bottom: 0.3rem;
        padding-bottom: 0.4rem;
        border-bottom: 1px solid #e5e5e5;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .oracle-card .entry-type {
        font-size: 0.7rem;
        font-weight: 600;
        color: #737373;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .oracle-card .entry-timestamp {
        font-size: 0.7rem;
        color: #a3a3a3;
        font-weight: 400;
    }

    /* Fortune card styling */
    .fortune-card {
        background: #fafafa;
        border: 1px solid #e5e5e5;
        border-left: 3px solid #6366f1;
        border-radius: 6px;
        padding: 0.65rem 0.85rem;
        box-shadow: none;
        position: relative;
        transition: all 0.15s ease;
    }

    .fortune-card:hover {
        background: #f5f5f5;
        border-left-color: #4f46e5;
    }

    .fortune-card .entry-header {
        margin-bottom: 0.3rem;
        padding-bottom: 0.4rem;
        border-bottom: 1px solid #e5e5e5;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .fortune-card .entry-type {
        font-size: 0.7rem;
        font-weight: 600;
        color: #737373;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .fortune-card .entry-timestamp {
        font-size: 0.7rem;
        color: #a3a3a3;
        font-weight: 400;
    }

    /* Dice card styling */
    .dice-card {
        background: #fafafa;
        border: 1px solid #e5e5e5;
        border-left: 3px solid #10b981;
        border-radius: 6px;
        padding: 0.65rem 0.85rem;
        box-shadow: none;
        position: relative;
        transition: all 0.15s ease;
    }

    .dice-card:hover {
        background: #f5f5f5;
        border-left-color: #059669;
    }

    .dice-card .entry-header {
        margin-bottom: 0.3rem;
        padding-bottom: 0.4rem;
        border-bottom: 1px solid #e5e5e5;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .dice-card .entry-type {
        font-size: 0.7rem;
        font-weight: 600;
        color: #737373;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .dice-card .entry-timestamp {
        font-size: 0.7rem;
        color: #a3a3a3;
        font-weight: 400;
    }

    /* Cards card styling */
    .cards-card {
        background: #fafafa;
        border: 1px solid #e5e5e5;
        border-left: 3px solid #f59e0b;
        border-radius: 6px;
        padding: 0.65rem 0.85rem;
        box-shadow: none;
        position: relative;
        transition: all 0.15s ease;
    }

    .cards-card:hover {
        background: #f5f5f5;
        border-left-color: #d97706;
    }

    .cards-card .entry-header {
        margin-bottom: 0.3rem;
        padding-bottom: 0.4rem;
        border-bottom: 1px solid #e5e5e5;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .cards-card .entry-type {
        font-size: 0.7rem;
        font-weight: 600;
        color: #737373;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .cards-card .entry-timestamp {
        font-size: 0.7rem;
        color: #a3a3a3;
        font-weight: 400;
    }
</style>
