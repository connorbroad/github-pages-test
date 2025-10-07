<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { ChronicleEntry } from "../storage-utils";
    import EntryActions from "./EntryActions.svelte";
    import EntryEditor from "./EntryEditor.svelte";

    export let entry: ChronicleEntry;
    export let characterName: string = "";
    export let editingEntryId: string | null = null;
    export let editText: string = "";
    export let formatTimestamp: (timestamp: number) => string;

    const dispatch = createEventDispatcher();

    $: isEditing = editingEntryId === entry.id;
    $: isFortune = entry.type === "fortune";

    function isRedSuit(suit: string): boolean {
        return suit === "♥" || suit === "♦";
    }

    function handleAssignCharacter(event: CustomEvent<string>) {
        dispatch("assignCharacter", event.detail);
    }

    function handleEdit(event: CustomEvent<string>) {
        const currentText = isFortune ? entry.userNotes : entry.content;
        dispatch("edit", {
            entryId: event.detail,
            isManual: !isFortune,
            currentText,
        });
    }

    function handleDelete(event: CustomEvent<string>) {
        dispatch("delete", event.detail);
    }

    function handleSave(event: CustomEvent) {
        dispatch("save", {
            entryId: event.detail.entryId,
            isManual: !isFortune,
        });
    }

    function handleCancelEdit() {
        dispatch("cancelEdit");
    }
</script>

<div class="entry-card {isFortune ? 'fortune-card' : 'manual-card'}">
    <div class="entry-header">
        <span class="entry-type">
            {isFortune ? "🎲 Fortune" : "📝 Manual Entry"}
        </span>
        <span class="entry-timestamp">{formatTimestamp(entry.timestamp)}</span>
    </div>

    {#if isFortune && entry.fortuneData}
        <!-- Fortune Result Display - Compact -->
        <div class="fortune-content">
            <div class="fortune-inline">
                <span class="fortune-label"
                    >{entry.fortuneData.fortuneTitle}:</span
                >

                {#if entry.fortuneData.diceRoll}
                    <span class="result-badge"
                        >{entry.fortuneData.diceRoll.result}</span
                    >
                    {#if entry.fortuneData.diceRoll.mappedOutcome}
                        <span class="result-text"
                            >{entry.fortuneData.diceRoll.mappedOutcome}</span
                        >
                    {/if}
                {/if}

                {#if entry.fortuneData.cardDraw}
                    <span
                        class="card-badge"
                        style="color: {isRedSuit(
                            entry.fortuneData.cardDraw.suit,
                        )
                            ? '#dc2626'
                            : '#334155'}"
                    >
                        {entry.fortuneData.cardDraw.rank}
                        {entry.fortuneData.cardDraw.suit}
                    </span>
                    {#if entry.fortuneData.cardDraw.suitMapped || entry.fortuneData.cardDraw.rankMapped}
                        <span class="result-text">
                            {entry.fortuneData.cardDraw.suitMapped ||
                                ""}{#if entry.fortuneData.cardDraw.suitMapped && entry.fortuneData.cardDraw.rankMapped}
                                •
                            {/if}{entry.fortuneData.cardDraw.rankMapped || ""}
                        </span>
                    {/if}
                {/if}
            </div>

            {#if entry.userNotes && !isEditing}
                <div class="fortune-notes-compact">
                    <span class="notes-label">Note:</span>
                    <span class="notes-text-compact">{entry.userNotes}</span>
                </div>
            {/if}

            {#if isEditing}
                <EntryEditor
                    entryId={entry.id}
                    bind:value={editText}
                    placeholder="Add your interpretation..."
                    compact={true}
                    on:save={handleSave}
                    on:cancel={handleCancelEdit}
                />
            {/if}
        </div>

        <EntryActions
            entryId={entry.id}
            characterId={entry.characterId}
            {characterName}
            editButtonLabel={entry.userNotes ? "Edit notes" : "Add notes"}
            {isEditing}
            compact={true}
            on:assignCharacter={handleAssignCharacter}
            on:edit={handleEdit}
            on:delete={handleDelete}
        />
    {:else}
        <!-- Manual Entry Display -->
        {#if !isEditing}
            <div class="entry-content">
                {entry.content}
            </div>
        {/if}

        {#if isEditing}
            <EntryEditor
                entryId={entry.id}
                bind:value={editText}
                placeholder="Edit your entry..."
                compact={false}
                on:save={handleSave}
                on:cancel={handleCancelEdit}
            />
        {/if}

        <EntryActions
            entryId={entry.id}
            characterId={entry.characterId}
            {characterName}
            editButtonLabel="Edit entry"
            {isEditing}
            compact={false}
            on:assignCharacter={handleAssignCharacter}
            on:edit={handleEdit}
            on:delete={handleDelete}
        />
    {/if}
</div>

<style>
    .entry-card {
        background: white;
        border: 1px solid #e5e5e5;
        border-radius: 8px;
        padding: 1.25rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        transition: all 0.15s ease;
    }

    .entry-card:hover {
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
        border-color: #d4d4d4;
    }

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
        margin-bottom: 0.5rem;
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

    .fortune-content {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .fortune-inline {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
        font-size: 0.9rem;
        line-height: 1.4;
    }

    .fortune-label {
        font-weight: 600;
        color: #525252;
    }

    .result-badge {
        background: #6366f1;
        color: white;
        font-weight: 700;
        font-size: 0.875rem;
        padding: 0.15rem 0.5rem;
        border-radius: 4px;
        line-height: 1.4;
    }

    .card-badge {
        background: #ffffff;
        color: white;
        font-weight: 700;
        font-size: 0.875rem;
        padding: 0.15rem 0.5rem;
        border-radius: 4px;
        border: 1px solid #d1d5db;
        line-height: 1.4;
    }

    .result-text {
        color: #525252;
        font-style: italic;
        font-size: 0.875rem;
    }

    .fortune-notes-compact {
        background: #fef9c3;
        border-left: 2px solid #facc15;
        border-radius: 3px;
        padding: 0.4rem 0.6rem;
        font-size: 0.85rem;
        line-height: 1.4;
        display: flex;
        gap: 0.4rem;
        align-items: baseline;
    }

    .notes-label {
        font-weight: 600;
        color: #713f12;
        flex-shrink: 0;
    }

    .notes-text-compact {
        color: #854d0e;
        flex: 1;
    }

    .entry-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.85rem;
        padding-bottom: 0.65rem;
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

    .entry-content {
        color: #262626;
        line-height: 1.65;
        white-space: pre-wrap;
        word-wrap: break-word;
        margin-bottom: 0.85rem;
        font-size: 0.95rem;
    }
</style>
