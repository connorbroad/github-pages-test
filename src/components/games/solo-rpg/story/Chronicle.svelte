<script lang="ts">
    import { activeCampaign } from "../campaign-store";
    import { loadChronicleEntries, saveChronicleEntries } from "../storage-utils";
    import type { ChronicleEntry } from "../storage-utils";
    import { createEventDispatcher } from "svelte";
    import "../solo-rpg-styles.css";

    const dispatch = createEventDispatcher();

    let entries: ChronicleEntry[] = [];
    let showAddEntry = false;
    let newEntryText = "";
    let editingEntryId: string | null = null;
    let addingNoteToEntry: string | null = null;
    let noteText = "";

    $: if ($activeCampaign) {
        loadEntries();
    }

    function loadEntries() {
        if (!$activeCampaign) return;
        
        const allEntries = loadChronicleEntries();
        entries = allEntries
            .filter(e => e.campaignId === $activeCampaign.id)
            .sort((a, b) => b.timestamp - a.timestamp); // Most recent first
    }

    function openAddEntry() {
        newEntryText = "";
        editingEntryId = null;
        showAddEntry = true;
    }

    function openEditEntry(entry: ChronicleEntry) {
        newEntryText = entry.content;
        editingEntryId = entry.id;
        showAddEntry = true;
    }

    function cancelAddEntry() {
        showAddEntry = false;
        newEntryText = "";
        editingEntryId = null;
    }

    function saveEntry() {
        if (!$activeCampaign || !newEntryText.trim()) return;

        const allEntries = loadChronicleEntries();

        if (editingEntryId) {
            const entryIndex = allEntries.findIndex(e => e.id === editingEntryId);
            if (entryIndex !== -1) {
                allEntries[entryIndex] = {
                    ...allEntries[entryIndex],
                    content: newEntryText.trim()
                };
            }
        } else {
            // Create new entry
            const newEntry: ChronicleEntry = {
                id: generateEntryId(),
                campaignId: $activeCampaign.id,
                timestamp: Date.now(),
                type: "manual",
                content: newEntryText.trim()
            };
            allEntries.push(newEntry);
        }

        saveChronicleEntries(allEntries);
        loadEntries();
        cancelAddEntry();
    }

    function deleteEntry(entryId: string) {
        if (!confirm("Are you sure you want to delete this entry?")) return;

        const allEntries = loadChronicleEntries();
        const filtered = allEntries.filter(e => e.id !== entryId);
        saveChronicleEntries(filtered);
        
        loadEntries();
    }

    function openAddNote(entryId: string, currentNotes?: string) {
        addingNoteToEntry = entryId;
        noteText = currentNotes || "";
    }

    function cancelAddNote() {
        addingNoteToEntry = null;
        noteText = "";
    }

    function saveNote(entryId: string) {
        if (!noteText.trim()) return;

        const allEntries = loadChronicleEntries();
        const entryIndex = allEntries.findIndex(e => e.id === entryId);
        
        if (entryIndex !== -1) {
            allEntries[entryIndex] = {
                ...allEntries[entryIndex],
                userNotes: noteText.trim()
            };
            saveChronicleEntries(allEntries);
            loadEntries();
        }

        cancelAddNote();
    }

    function generateEntryId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    function formatTimestamp(timestamp: number): string {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function isRedSuit(suit: string): boolean {
        return suit === '♥' || suit === '♦';
    }

</script>

<div class="chronicle">
    <div class="chronicle-header">
        <h2>Chronicle</h2>
        <button class="srpg-b srpg-b-create" on:click={openAddEntry}>
            + Add Entry
        </button>
    </div>

    {#if showAddEntry}
        <div class="entry-editor">
            <h3>{editingEntryId ? 'Edit Chronicle Entry' : 'New Chronicle Entry'}</h3>
            <textarea
                bind:value={newEntryText}
                placeholder="What happened in your adventure?"
                rows="6"
            ></textarea>
            <div class="editor-actions">
                <button class="srpg-b srpg-b-create" on:click={saveEntry} disabled={!newEntryText.trim()}>
                    {editingEntryId ? 'Update Entry' : 'Save Entry'}
                </button>
                <button class="srpg-b" on:click={cancelAddEntry}>
                    Cancel
                </button>
            </div>
        </div>
    {/if}

    <div class="entries-list">
        {#if entries.length === 0}
            <div class="no-entries">
                <p>No chronicle entries yet.</p>
                <p>Click "Add Entry" to record your first adventure log!</p>
            </div>
        {:else}
            {#each entries as entry (entry.id)}
                <div class="entry-card {entry.type === 'fortune' ? 'fortune-card' : 'manual-card'}">
                    <div class="entry-header">
                        <span class="entry-type">{entry.type === 'manual' ? '📝 Manual Entry' : '🎲 Fortune'}</span>
                        <span class="entry-timestamp">{formatTimestamp(entry.timestamp)}</span>
                    </div>
                    
                    {#if entry.type === 'fortune' && entry.fortuneData}
                        <!-- Fortune Result Display - Compact -->
                        <div class="fortune-content">
                            <div class="fortune-inline">
                                <span class="fortune-label">{entry.fortuneData.fortuneTitle}:</span>
                                
                                {#if entry.fortuneData.diceRoll}
                                    <span class="result-badge">{entry.fortuneData.diceRoll.result}</span>
                                    {#if entry.fortuneData.diceRoll.mappedOutcome}
                                        <span class="result-text">{entry.fortuneData.diceRoll.mappedOutcome}</span>
                                    {/if}
                                {/if}
                                
                                {#if entry.fortuneData.cardDraw}
                                    <span class="card-badge" style="color: {isRedSuit(entry.fortuneData.cardDraw.suit) ? '#dc2626' : '#334155'}">
                                        {entry.fortuneData.cardDraw.rank}{entry.fortuneData.cardDraw.suit}
                                    </span>
                                    {#if entry.fortuneData.cardDraw.suitMapped || entry.fortuneData.cardDraw.rankMapped}
                                        <span class="result-text">
                                            {entry.fortuneData.cardDraw.suitMapped || ''}{#if entry.fortuneData.cardDraw.suitMapped && entry.fortuneData.cardDraw.rankMapped} • {/if}{entry.fortuneData.cardDraw.rankMapped || ''}
                                        </span>
                                    {/if}
                                {/if}
                            </div>

                            {#if entry.userNotes}
                                <div class="fortune-notes-compact">
                                    <span class="notes-label">Note:</span>
                                    <span class="notes-text-compact">{entry.userNotes}</span>
                                </div>
                            {/if}

                            {#if addingNoteToEntry === entry.id}
                                <div class="fortune-note-editor">
                                    <textarea
                                        bind:value={noteText}
                                        placeholder="Add your interpretation..."
                                        rows="2"
                                    ></textarea>
                                    <div class="note-editor-actions">
                                        <button class="srpg-b srpg-b-create srpg-b-sm" on:click={() => saveNote(entry.id)} disabled={!noteText.trim()}>
                                            Save
                                        </button>
                                        <button class="srpg-b srpg-b-sm" on:click={cancelAddNote}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            {/if}
                        </div>

                        <div class="fortune-actions">
                            {#if !addingNoteToEntry}
                                <button 
                                    class="fortune-action-btn" 
                                    on:click={() => openAddNote(entry.id, entry.userNotes)}
                                    title={entry.userNotes ? "Edit notes" : "Add notes"}
                                    aria-label={entry.userNotes ? "Edit notes" : "Add notes"}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14">
                                        <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                    </svg>
                                </button>
                            {/if}
                            <button 
                                class="fortune-action-btn delete-btn" 
                                on:click={() => deleteEntry(entry.id)}
                                title="Delete entry"
                                aria-label="Delete entry"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14">
                                    <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                </svg>
                            </button>
                        </div>
                    {:else}
                        <!-- Manual Entry Display -->
                        <div class="entry-content">
                            {entry.content}
                        </div>
                        <div class="entry-actions">
                            <button 
                                class="entry-action-btn srpg-b srpg-b-normal srpg-b-small" 
                                on:click={() => openEditEntry(entry)}
                                title="Edit entry"
                                aria-label="Edit entry"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em">
                                    <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                </svg>
                            </button>
                            <button 
                                class="entry-action-btn srpg-b srpg-b-danger srpg-b-small" 
                                on:click={() => deleteEntry(entry.id)}
                                title="Delete entry"
                                aria-label="Delete entry"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em">
                                    <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                </svg>
                            </button>
                        </div>
                    {/if}
                </div>
            {/each}
        {/if}
    </div>
</div>

<style>
    .chronicle {
        width: 100%;
        max-width: 900px;
        margin: 0 auto;
    }

    .chronicle-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #e5e7eb;
    }

    .chronicle-header h2 {
        margin: 0;
        font-size: 1.75rem;
        color: #333;
    }

    .entry-editor {
        background: #f9fafb;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 2rem;
    }

    .entry-editor h3 {
        margin: 0 0 1rem 0;
        font-size: 1.25rem;
        color: #333;
    }

    .entry-editor textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-family: inherit;
        font-size: 1rem;
        resize: vertical;
        margin-bottom: 1rem;
    }

    .entry-editor textarea:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .editor-actions {
        display: flex;
        gap: 0.75rem;
    }

    .entries-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .no-entries {
        text-align: center;
        padding: 3rem 1rem;
        color: #9ca3af;
        background: #f9fafb;
        border-radius: 8px;
    }

    .no-entries p {
        margin: 0.5rem 0;
    }

    .no-entries p:first-child {
        font-size: 1.125rem;
        font-weight: 500;
        color: #6b7280;
    }

    .entry-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 1.25rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        transition: box-shadow 0.2s;
    }

    .entry-card:hover {
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
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
        font-size: 1.1rem;
        font-weight: 700;
        line-height: 1;
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

    .fortune-note-editor {
        background: #fafafa;
        border: 1px solid #e5e5e5;
        border-radius: 4px;
        padding: 0.6rem;
    }

    .fortune-note-editor textarea {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #d4d4d4;
        border-radius: 3px;
        font-family: inherit;
        font-size: 0.85rem;
        resize: vertical;
        margin-bottom: 0.5rem;
    }

    .fortune-note-editor textarea:focus {
        outline: none;
        border-color: #6366f1;
        box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
    }

    .note-editor-actions {
        display: flex;
        gap: 0.4rem;
    }

    .fortune-actions {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 0.3rem;
        margin-top: 0.4rem;
        padding-top: 0.4rem;
        border-top: 1px solid #e5e5e5;
    }

    .fortune-action-btn {
        background: transparent;
        border: 1px solid #e5e5e5;
        border-radius: 4px;
        padding: 0.3rem;
        cursor: pointer;
        transition: all 0.15s;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #737373;
    }

    .fortune-action-btn:hover {
        background: #f5f5f5;
        border-color: #d4d4d4;
        color: #525252;
    }

    .fortune-action-btn.delete-btn:hover {
        background: #fef2f2;
        border-color: #fca5a5;
        color: #dc2626;
    }

    .entry-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #f3f4f6;
    }

    .entry-type {
        font-size: 0.875rem;
        font-weight: 600;
        color: #4b5563;
    }

    .entry-timestamp {
        font-size: 0.875rem;
        color: #9ca3af;
    }

    .entry-content {
        color: #374151;
        line-height: 1.6;
        white-space: pre-wrap;
        word-wrap: break-word;
        margin-bottom: 0.75rem;
    }

    .entry-actions {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 0.5rem;
    }

    .entry-action-btn {
        padding: 0.4rem 0.75rem;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        min-width: 36px;
        min-height: 36px;
        font-size: 1.2rem;
        font-weight: bold;
    }

    .entry-action-btn svg {
        width: 1em;
        height: 1em;
        font-size: 1rem;
    }

    @media (max-width: 640px) {
        .chronicle-header {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
        }

        .editor-actions {
            flex-direction: column;
        }

        .note-editor-actions {
            flex-direction: column;
        }
    }
</style>
