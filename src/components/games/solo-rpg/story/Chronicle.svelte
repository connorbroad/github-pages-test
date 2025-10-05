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
            // Update existing entry
            const entryIndex = allEntries.findIndex(e => e.id === editingEntryId);
            if (entryIndex !== -1) {
                allEntries[entryIndex] = {
                    ...allEntries[entryIndex],
                    content: newEntryText.trim(),
                    timestamp: Date.now() // Update timestamp on edit
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
                <div class="entry-card">
                    <div class="entry-header">
                        <span class="entry-type">{entry.type === 'manual' ? '📝 Manual Entry' : '🎲 Fortune'}</span>
                        <span class="entry-timestamp">{formatTimestamp(entry.timestamp)}</span>
                    </div>
                    <div class="entry-content">
                        {entry.content}
                    </div>
                    <div class="entry-actions">
                        <button 
                            class="srpg-icon-button" 
                            on:click={() => openEditEntry(entry)}
                            title="Edit entry"
                        >
                            ✏️
                        </button>
                        <button 
                            class="srpg-icon-button delete-icon" 
                            on:click={() => deleteEntry(entry.id)}
                            title="Delete entry"
                        >
                            🗑️
                        </button>
                    </div>
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
        gap: 0.25rem;
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
    }
</style>
