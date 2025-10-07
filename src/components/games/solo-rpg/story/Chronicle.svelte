<script lang="ts">
    import { activeCampaign } from "../campaign-store";
    import { loadChronicleEntries, saveChronicleEntries, loadChapters, saveChapters, loadCharacters } from "../storage-utils";
    import type { ChronicleEntry, Chapter, Character } from "../storage-utils";
    import { createEventDispatcher } from "svelte";
    import "../solo-rpg-styles.css";
    import SrpgModal from "../shared/modal/SrpgModal.svelte";
    import EntryActions from "./EntryActions.svelte";
    import EntryEditor from "./EntryEditor.svelte";

    const dispatch = createEventDispatcher();

    let entries: ChronicleEntry[] = [];
    let chapters: Chapter[] = [];
    let showAddEntry = false;
    let newEntryText = "";
    let editingEntryId: string | null = null;
    let editText = ""; // Unified edit text for both manual and fortune entries
    let showCreateChapter = false;
    let chapterCustomName = "";
    let viewingChapterId: string | null = null; // null means viewing current entries
    let showChaptersList = false;
    let showCharacterAssign = false;
    let assigningToEntryId: string | null = null;
    let campaignCharacters: Character[] = [];

    $: if ($activeCampaign) {
        loadEntries();
        loadCampaignChapters();
        loadCampaignCharacters();
    }

    function loadEntries() {
        if (!$activeCampaign) return;
        
        const allEntries = loadChronicleEntries();
        entries = allEntries
            .filter(e => {
                if (e.campaignId !== $activeCampaign.id) return false;
                // When viewing current chapter (viewingChapterId is null), show entries without a chapterId
                if (viewingChapterId === null) {
                    return !e.chapterId;
                }
                // When viewing a specific chapter, match that chapterId
                return e.chapterId === viewingChapterId;
            })
            .sort((a, b) => b.timestamp - a.timestamp); // Most recent first
    }

    function loadCampaignChapters() {
        if (!$activeCampaign) return;
        
        const allChapters = loadChapters();
        chapters = allChapters
            .filter(c => c.campaignId === $activeCampaign.id)
            .sort((a, b) => b.chapterNumber - a.chapterNumber); // Most recent first
    }

    function loadCampaignCharacters() {
        if (!$activeCampaign) return;
        
        const allCharacters = loadCharacters();
        campaignCharacters = allCharacters
            .filter(c => c.campaignId === $activeCampaign.id)
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    function getChapterDisplayName(chapter: Chapter): string {
        if (chapter.customName) {
            return `Chapter ${chapter.chapterNumber} - ${chapter.customName}`;
        }
        return `Chapter ${chapter.chapterNumber}`;
    }

    function openAddEntry() {
        newEntryText = "";
        editingEntryId = null;
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

        // Create new entry
        const newEntry: ChronicleEntry = {
            id: generateEntryId(),
            campaignId: $activeCampaign.id,
            timestamp: Date.now(),
            type: "manual",
            content: newEntryText.trim()
        };
        allEntries.push(newEntry);

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

    function assignCharacter(entryId: string) {
        assigningToEntryId = entryId;
        showCharacterAssign = true;
    }

    function cancelCharacterAssign() {
        assigningToEntryId = null;
        showCharacterAssign = false;
    }

    function selectCharacterForEntry(characterId: string | null) {
        if (!assigningToEntryId) return;

        const allEntries = loadChronicleEntries();
        const entryIndex = allEntries.findIndex(e => e.id === assigningToEntryId);
        
        if (entryIndex !== -1) {
            allEntries[entryIndex] = {
                ...allEntries[entryIndex],
                characterId: characterId || undefined
            };
            saveChronicleEntries(allEntries);
            loadEntries();
        }

        cancelCharacterAssign();
    }

    function getCharacterName(characterId?: string): string {
        if (!characterId) return "";
        const character = campaignCharacters.find(c => c.id === characterId);
        return character ? character.name : "";
    }

    function openCreateChapter() {
        chapterCustomName = "";
        showCreateChapter = true;
    }

    function cancelCreateChapter() {
        showCreateChapter = false;
        chapterCustomName = "";
    }

    function createChapter() {
        if (!$activeCampaign) return;

        const currentEntries = loadChronicleEntries().filter(
            e => e.campaignId === $activeCampaign.id && !e.chapterId
        );

        if (currentEntries.length === 0) {
            alert("No entries to save into a chapter!");
            return;
        }

        // Determine next chapter number
        const nextChapterNumber = chapters.length > 0 
            ? Math.max(...chapters.map(c => c.chapterNumber)) + 1 
            : 1;

        // Create new chapter
        const newChapter: Chapter = {
            id: generateEntryId(),
            campaignId: $activeCampaign.id,
            chapterNumber: nextChapterNumber,
            customName: chapterCustomName.trim() || undefined,
            createdAt: currentEntries.length > 0 
                ? Math.min(...currentEntries.map(e => e.timestamp)) 
                : Date.now(),
            closedAt: Date.now()
        };

        // Save chapter
        const allChapters = loadChapters();
        allChapters.push(newChapter);
        saveChapters(allChapters);

        // Update all current entries to belong to this chapter
        const allEntries = loadChronicleEntries();
        allEntries.forEach(entry => {
            if (entry.campaignId === $activeCampaign.id && !entry.chapterId) {
                entry.chapterId = newChapter.id;
            }
        });
        saveChronicleEntries(allEntries);

        // Reload data
        loadCampaignChapters();
        loadEntries();
        cancelCreateChapter();
    }

    function viewChapter(chapterId: string | null) {
        viewingChapterId = chapterId;
        showChaptersList = false;
        loadEntries();
    }

    function toggleChaptersList() {
        showChaptersList = !showChaptersList;
    }

    function deleteChapter(chapterId: string) {
        if (!confirm("Are you sure you want to delete this chapter? All entries in this chapter will also be deleted.")) return;

        // Delete all entries in this chapter
        const allEntries = loadChronicleEntries();
        const filtered = allEntries.filter(e => e.chapterId !== chapterId);
        saveChronicleEntries(filtered);

        // Delete the chapter
        const allChapters = loadChapters();
        const filteredChapters = allChapters.filter(c => c.id !== chapterId);
        saveChapters(filteredChapters);

        // If we were viewing this chapter, go back to current
        if (viewingChapterId === chapterId) {
            viewingChapterId = null;
        }

        loadCampaignChapters();
        loadEntries();
    }

    function openEditEntry(entryId: string, isManual: boolean, currentText?: string) {
        editingEntryId = entryId;
        editText = currentText || "";
    }

    function cancelEditEntry() {
        editingEntryId = null;
        editText = "";
    }

    function saveEditEntry(entryId: string, isManual: boolean) {
        if (!editText.trim()) return;

        const allEntries = loadChronicleEntries();
        const entryIndex = allEntries.findIndex(e => e.id === entryId);
        
        if (entryIndex !== -1) {
            if (isManual) {
                // Update manual entry content
                allEntries[entryIndex] = {
                    ...allEntries[entryIndex],
                    content: editText.trim()
                };
            } else {
                // Update fortune entry notes
                allEntries[entryIndex] = {
                    ...allEntries[entryIndex],
                    userNotes: editText.trim()
                };
            }
            saveChronicleEntries(allEntries);
            loadEntries();
        }

        cancelEditEntry();
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
        <div class="header-actions">
            <button class="srpg-b" on:click={toggleChaptersList}>
                📚 View Chapters
            </button>
        </div>
    </div>

    {#if showChaptersList}
        <div class="chapters-list-panel">
            <div class="chapters-header">
                <h3>Chapters</h3>
                <button class="close-btn" on:click={toggleChaptersList}>✕</button>
            </div>
            <div class="chapters-content">
                <button 
                    class="chapter-item {viewingChapterId === null ? 'active' : ''}"
                    on:click={() => viewChapter(null)}
                >
                    <div class="chapter-name">📖 Current Chapter</div>
                    <div class="chapter-meta">{loadChronicleEntries().filter(e => e.campaignId === $activeCampaign?.id && !e.chapterId).length} entries</div>
                </button>
                {#each chapters as chapter (chapter.id)}
                    <div class="chapter-item-wrapper">
                        <button 
                            class="chapter-item {viewingChapterId === chapter.id ? 'active' : ''}"
                            on:click={() => viewChapter(chapter.id)}
                        >
                            <div class="chapter-name">📜 {getChapterDisplayName(chapter)}</div>
                            <div class="chapter-meta">
                                {loadChronicleEntries().filter(e => e.chapterId === chapter.id).length} entries
                            </div>
                        </button>
                        <button 
                            class="chapter-delete-btn"
                            on:click|stopPropagation={() => deleteChapter(chapter.id)}
                            title="Delete chapter"
                        >
                            🗑️
                        </button>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    {#if viewingChapterId === null} 
         <div class="current-chapter-banner">
            <div class="banner-content">
                <span class="banner-icon">📖</span>
                <span class="banner-text">Chapter {(chapters?.length || 0) + 1}</span>
            </div>
            {#if entries.length > 0}
                <button class="srpg-b srpg-b-create srpg-b-sm" on:click={openCreateChapter}>
                    💾 Next chapter
                </button>
            {/if}
        </div>

        {#if showCreateChapter}
            <SrpgModal show={showCreateChapter} ariaLabel="Close create chapter dialog" on:close={cancelCreateChapter}>
                <h3>Finish Chapter</h3>
                <p class="chapter-help">All current entries will be saved to this chapter, and you'll start fresh with a new current chapter.</p>
                <input
                    type="text"
                    bind:value={chapterCustomName}
                    placeholder="Chapter name (optional)"
                    class="chapter-name-input"
                />
                <div class="chapter-preview">
                    {#if chapterCustomName.trim()}
                        Preview: Chapter {chapters.length + 1} - {chapterCustomName.trim()}
                    {:else}
                        Preview: Chapter {chapters.length + 1}
                    {/if}
                </div>
                <div class="editor-actions">
                    <button class="srpg-b srpg-b-create" on:click={createChapter}>
                        Finish Chapter
                    </button>
                    <button class="srpg-b" on:click={cancelCreateChapter}>
                        Cancel
                    </button>
                </div>
            </SrpgModal>
        {/if}
    {:else}
        <!-- Viewing a Saved Chapter -->
        <div class="chapter-view-banner">
            <button class="back-btn" on:click={() => viewChapter(null)}>
                ← Back to Current
            </button>
            <span class="viewing-chapter-name">
                📜 Viewing: {getChapterDisplayName(chapters.find(c => c.id === viewingChapterId))}
            </span>
        </div>
    {/if}

    {#if !viewingChapterId}
        <div style="margin-bottom: 1rem; text-align: center;">
            <button class="srpg-b srpg-b-create srpg-b-w-full" on:click={openAddEntry}>
                + Add entry
            </button>
        </div>
    {/if}

    {#if showAddEntry}
        <div class="entry-editor">
            <h3>New Chronicle Entry</h3>
            <textarea
                bind:value={newEntryText}
                placeholder="What happened in your adventure?"
                rows="6"
            ></textarea>
            <div class="editor-actions">
                <button class="srpg-b srpg-b-create" on:click={saveEntry} disabled={!newEntryText.trim()}>
                    Save Entry
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
                <p>No chapter entries yet.</p>
                <p>Click "Add entry" to record your first adventure log!</p>
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
                                        {entry.fortuneData.cardDraw.rank} {entry.fortuneData.cardDraw.suit}
                                    </span>
                                    {#if entry.fortuneData.cardDraw.suitMapped || entry.fortuneData.cardDraw.rankMapped}
                                        <span class="result-text">
                                            {entry.fortuneData.cardDraw.suitMapped || ''}{#if entry.fortuneData.cardDraw.suitMapped && entry.fortuneData.cardDraw.rankMapped} • {/if}{entry.fortuneData.cardDraw.rankMapped || ''}
                                        </span>
                                    {/if}
                                {/if}
                            </div>

                            {#if entry.userNotes && editingEntryId !== entry.id}
                                <div class="fortune-notes-compact">
                                    <span class="notes-label">Note:</span>
                                    <span class="notes-text-compact">{entry.userNotes}</span>
                                </div>
                            {/if}

                            {#if editingEntryId === entry.id}
                                <EntryEditor
                                    entryId={entry.id}
                                    bind:value={editText}
                                    placeholder="Add your interpretation..."
                                    compact={true}
                                    on:save={() => saveEditEntry(entry.id, false)}
                                    on:cancel={cancelEditEntry}
                                />
                            {/if}
                        </div>

                        <EntryActions
                            entryId={entry.id}
                            characterId={entry.characterId}
                            characterName={getCharacterName(entry.characterId)}
                            editButtonLabel={entry.userNotes ? "Edit notes" : "Add notes"}
                            isEditing={editingEntryId === entry.id}
                            compact={true}
                            on:assignCharacter={(e) => assignCharacter(e.detail)}
                            on:edit={(e) => openEditEntry(e.detail, false, entry.userNotes)}
                            on:delete={(e) => deleteEntry(e.detail)}
                        />
                    {:else}
                        <!-- Manual Entry Display -->
                        {#if editingEntryId !== entry.id}
                            <div class="entry-content">
                                {entry.content}
                            </div>
                        {/if}

                        {#if editingEntryId === entry.id}
                            <EntryEditor
                                entryId={entry.id}
                                bind:value={editText}
                                placeholder="Edit your entry..."
                                compact={false}
                                on:save={() => saveEditEntry(entry.id, true)}
                                on:cancel={cancelEditEntry}
                            />
                        {/if}

                        <EntryActions
                            entryId={entry.id}
                            characterId={entry.characterId}
                            characterName={getCharacterName(entry.characterId)}
                            editButtonLabel="Edit entry"
                            isEditing={editingEntryId === entry.id}
                            compact={false}
                            on:assignCharacter={(e) => assignCharacter(e.detail)}
                            on:edit={(e) => openEditEntry(e.detail, true, entry.content)}
                            on:delete={(e) => deleteEntry(e.detail)}
                        />
                    {/if}
                </div>
            {/each}
        {/if}
    </div>
</div>

<!-- Character Assignment Modal -->
<SrpgModal
    bind:show={showCharacterAssign}
    maxWidth="450px"
    on:close={cancelCharacterAssign}
>
    <div class="modal-content">
        <h2>Assign Character</h2>
        <p class="modal-help">Select a character to associate with this entry.</p>
        
        {#if campaignCharacters.length > 0}
            <div class="character-select-list">
                <button 
                    class="srpg-b character-select-item"
                    on:click={() => selectCharacterForEntry(null)}
                >
                    <span class="character-select-name">None (Remove assignment)</span>
                </button>
                {#each campaignCharacters as character (character.id)}
                    <button 
                        class="srpg-b character-select-item"
                        on:click={() => selectCharacterForEntry(character.id)}
                    >
                        <span class="character-select-name">{character.name}</span>
                        {#if character.race || character.class}
                            <span class="character-select-info">
                                {#if character.race}{character.race}{/if}
                                {#if character.race && character.class} • {/if}
                                {#if character.class}{character.class}{/if}
                            </span>
                        {/if}
                    </button>
                {/each}
            </div>
        {:else}
            <div class="no-characters-message">
                <p>No characters available.</p>
                <p class="hint">Create a character in the Character Manager first.</p>
            </div>
        {/if}
        
        <div class="modal-footer">
            <button class="srpg-b" on:click={cancelCharacterAssign}>
                Cancel
            </button>
        </div>
    </div>
</SrpgModal>

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
        padding-bottom: 1rem; 
    }

    .header-actions {
        display: flex;
        gap: 0.5rem;
    }

    .chapters-list-panel {
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        overflow: hidden;
    }

    .chapters-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.25rem;
        background: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
    }

    .chapters-header h3 {
        margin: 0;
        font-size: 1.125rem;
        color: #333;
    }

    .close-btn {
        background: transparent;
        border: none;
        font-size: 1.25rem;
        color: #9ca3af;
        cursor: pointer;
        padding: 0.25rem;
        line-height: 1;
        transition: color 0.15s;
    }

    .close-btn:hover {
        color: #333;
    }

    .chapters-content {
        padding: 0.5rem;
        max-height: 400px;
        overflow-y: auto;
    }

    .chapter-item-wrapper {
        display: flex;
        gap: 0.25rem;
        margin-bottom: 0.25rem;
    }

    .chapter-item {
        flex: 1;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 0.75rem 1rem;
        text-align: left;
        cursor: pointer;
        transition: all 0.15s;
        width: 100%;
    }

    .chapter-item:hover {
        background: #f3f4f6;
        border-color: #d1d5db;
    }

    .chapter-item.active {
        background: #6366f1;
        color: white;
        border-color: #6366f1;
    }

    .chapter-item.active .chapter-name,
    .chapter-item.active .chapter-meta {
        color: white;
    }

    .chapter-name {
        font-weight: 600;
        font-size: 0.95rem;
        color: #333;
        margin-bottom: 0.25rem;
    }

    .chapter-meta {
        font-size: 0.8rem;
        color: #6b7280;
    }

    .chapter-delete-btn {
        background: transparent;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 0.5rem;
        cursor: pointer;
        transition: all 0.15s;
        font-size: 1rem;
        flex-shrink: 0;
    }

    .chapter-delete-btn:hover {
        background: #fef2f2;
        border-color: #fca5a5;
    } 
    
    .current-chapter-banner {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        color: white;
        padding: 1rem 1.25rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .banner-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .banner-icon {
        font-size: 1.5rem;
    }

    .banner-text {
        font-size: 1.125rem;
        font-weight: 600;
    }

    .chapter-view-banner {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 1rem 1.25rem;
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .back-btn {
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        padding: 0.5rem 1rem;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 500;
        color: #525252;
        transition: all 0.15s;
    }

    .back-btn:hover {
        background: #f9fafb;
        border-color: #9ca3af;
    }

    .viewing-chapter-name {
        font-size: 1rem;
        font-weight: 600;
        color: #333;
    } 

    .chapter-help {
        margin: 0 0 1rem 0;
        font-size: 0.9rem;
        color: #6b7280;
        line-height: 1.5;
    }

    .chapter-name-input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-family: inherit;
        font-size: 1rem;
        margin-bottom: 0.75rem;
    }

    .chapter-name-input:focus {
        outline: none;
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    .chapter-preview {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 0.75rem;
        margin-bottom: 1rem;
        font-weight: 600;
        color: #525252;
        font-size: 0.95rem;
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

    /* Character Assignment Modal Styles */
    .modal-content h2 {
        margin-top: 0;
        margin-bottom: 0.5rem;
        color: #111827;
    }

    .modal-help {
        margin: 0 0 1rem 0;
        font-size: 0.9rem;
        color: #6b7280;
    }

    .character-select-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-height: 400px;
        overflow-y: auto;
        margin-bottom: 1rem;
    }

    .character-select-item {
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 6px;
        padding: 0.75rem 1rem;
        text-align: left;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .character-select-item:hover {
        border-color: #3b82f6;
        background: #eff6ff;
        transform: translateX(2px);
    }

    .character-select-name {
        font-weight: 600;
        color: #111827;
        font-size: 1rem;
    }

    .character-select-info {
        font-size: 0.85rem;
        color: #6b7280;
    }

    .no-characters-message {
        text-align: center;
        padding: 2rem 1rem;
        color: #6b7280;
        background: #f9fafb;
        border-radius: 6px;
        margin-bottom: 1rem;
    }

    .no-characters-message p {
        margin: 0.25rem 0;
    }

    .no-characters-message .hint {
        font-size: 0.875rem;
        font-style: italic;
    }

    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
    }

    @media (max-width: 640px) {
        .chronicle-header {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
        }

        .header-actions {
            flex-direction: row;
            justify-content: stretch;
        }

        .header-actions button {
            flex: 1;
        }

        .editor-actions {
            flex-direction: column;
        }

        .chapter-view-banner {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
        }

        .viewing-chapter-name {
            text-align: center;
        }
    }
</style>
