<script lang="ts">
    import { activeCampaign } from "../../game-management/campaign-store";
    import {
        loadChronicleEntries,
        saveChronicleEntries,
        loadChapters,
        saveChapters,
        loadCharacters,
        loadActiveCharacterId,
    } from "../../data/storage-utils";
    import type {
        ChronicleEntry,
        Chapter,
        Character,
    } from "../../data/storage-utils";
    import { createEventDispatcher } from "svelte";
    import "../../solo-rpg-styles.css";
    import SrpgModal from "../../shared/modal/SrpgModal.svelte";
    import EntryCard from "./EntryCard.svelte";

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

    // Public method to force reload entries (can be called externally)
    export function reloadEntries() {
        loadEntries();
    }

    function loadEntries() {
        if (!$activeCampaign) return;

        const allEntries = loadChronicleEntries();
        entries = allEntries
            .filter((e) => {
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
            .filter((c) => c.campaignId === $activeCampaign.id)
            .sort((a, b) => b.chapterNumber - a.chapterNumber); // Most recent first
    }

    function loadCampaignCharacters() {
        if (!$activeCampaign) return;

        const allCharacters = loadCharacters();
        campaignCharacters = allCharacters
            .filter((c) => c.campaignId === $activeCampaign.id)
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
        const activeCharacterId = loadActiveCharacterId();

        // Create new entry
        const newEntry: ChronicleEntry = {
            id: generateEntryId(),
            campaignId: $activeCampaign.id,
            timestamp: Date.now(),
            type: "manual",
            content: newEntryText.trim(),
            characterId: activeCharacterId || undefined,
        };
        allEntries.push(newEntry);

        saveChronicleEntries(allEntries);
        loadEntries();
        cancelAddEntry();
    }

    function deleteEntry(entryId: string) {
        if (!confirm("Are you sure you want to delete this entry?")) return;

        const allEntries = loadChronicleEntries();
        const filtered = allEntries.filter((e) => e.id !== entryId);
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
        const entryIndex = allEntries.findIndex(
            (e) => e.id === assigningToEntryId,
        );

        if (entryIndex !== -1) {
            allEntries[entryIndex] = {
                ...allEntries[entryIndex],
                characterId: characterId || undefined,
            };
            saveChronicleEntries(allEntries);
            loadEntries();
        }

        cancelCharacterAssign();
    }

    function getCharacterName(characterId?: string): string {
        if (!characterId) return "";
        const character = campaignCharacters.find((c) => c.id === characterId);
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
            (e) => e.campaignId === $activeCampaign.id && !e.chapterId,
        );

        if (currentEntries.length === 0) {
            alert("No entries to save into a chapter!");
            return;
        }

        // Determine next chapter number
        const nextChapterNumber =
            chapters.length > 0
                ? Math.max(...chapters.map((c) => c.chapterNumber)) + 1
                : 1;

        // Create new chapter
        const newChapter: Chapter = {
            id: generateEntryId(),
            campaignId: $activeCampaign.id,
            chapterNumber: nextChapterNumber,
            customName: chapterCustomName.trim() || undefined,
            createdAt:
                currentEntries.length > 0
                    ? Math.min(...currentEntries.map((e) => e.timestamp))
                    : Date.now(),
            closedAt: Date.now(),
        };

        // Save chapter
        const allChapters = loadChapters();
        allChapters.push(newChapter);
        saveChapters(allChapters);

        // Update all current entries to belong to this chapter
        const allEntries = loadChronicleEntries();
        allEntries.forEach((entry) => {
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
        if (
            !confirm(
                "Are you sure you want to delete this chapter? All entries in this chapter will also be deleted.",
            )
        )
            return;

        // Delete all entries in this chapter
        const allEntries = loadChronicleEntries();
        const filtered = allEntries.filter((e) => e.chapterId !== chapterId);
        saveChronicleEntries(filtered);

        // Delete the chapter
        const allChapters = loadChapters();
        const filteredChapters = allChapters.filter((c) => c.id !== chapterId);
        saveChapters(filteredChapters);

        // If we were viewing this chapter, go back to current
        if (viewingChapterId === chapterId) {
            viewingChapterId = null;
        }

        loadCampaignChapters();
        loadEntries();
    }

    function openEditEntry(
        entryId: string,
        isManual: boolean,
        currentText?: string,
    ) {
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
        const entryIndex = allEntries.findIndex((e) => e.id === entryId);

        if (entryIndex !== -1) {
            if (isManual) {
                // Update manual entry content
                allEntries[entryIndex] = {
                    ...allEntries[entryIndex],
                    content: editText.trim(),
                };
            } else {
                // Update fortune entry notes
                allEntries[entryIndex] = {
                    ...allEntries[entryIndex],
                    userNotes: editText.trim(),
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
        if (diffMins < 60)
            return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
        if (diffHours < 24)
            return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
        if (diffDays < 7)
            return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }
</script>

<div class="chronicle">
    <div class="chronicle-sticky-header">
        <div class="chronicle-header">
            <div class="header-actions">
                <button class="srpg-b srpg-b-simple" on:click={toggleChaptersList}>
                    📚 {showChaptersList ? "Hide" : "View"} Chapters
                </button>
            </div>
        </div>

        {#if showChaptersList}
            <div class="chapters-list-panel">
            <div class="chapters-header">
                <h3>Chapters</h3>
                <button
                    class="close-btn"
                    on:click={toggleChaptersList}
                    title="Close chapters list"
                    aria-label="Close chapters list"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="1em"
                        height="1em"
                        {...$$props}
                    >
                        <path
                            fill="currentColor"
                            d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z"
                        />
                    </svg>
                </button>
            </div>
            <div class="chapters-content">
                <div class="current-chapter-item-wrapper">
                    <button
                        class="chapter-item {viewingChapterId === null
                            ? 'active'
                            : ''}"
                        on:click={() => viewChapter(null)}
                    >
                        <div>
                            <div class="chapter-name">📖 Current Chapter</div>
                            <div class="chapter-meta">
                                {loadChronicleEntries().filter(
                                    (e) =>
                                        e.campaignId === $activeCampaign?.id &&
                                        !e.chapterId,
                                ).length} entries
                            </div>
                        </div>
                    </button>
                    {#if entries.length > 0 && viewingChapterId === null}
                        <button
                            class="srpg-b srpg-b-create"
                            on:click={openCreateChapter}
                            aria-label="Finish Chapter"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="2em"
                                height="2em"
                            >
                                <path
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M17 16v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h2m3-4H9a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1m-1 4l-3 3m0 0l-3-3m3 3V3"
                                />
                            </svg>
                        </button>
                    {/if}
                </div>
                {#each chapters as chapter (chapter.id)}
                    <div class="chapter-item-wrapper">
                        <button
                            class="chapter-item {viewingChapterId === chapter.id
                                ? 'active'
                                : ''}"
                            on:click={() => viewChapter(chapter.id)}
                        >
                            <div class="chapter-name">
                                📜 {getChapterDisplayName(chapter)}
                            </div>
                            <div class="chapter-meta">
                                {loadChronicleEntries().filter(
                                    (e) => e.chapterId === chapter.id,
                                ).length} entries
                            </div>
                        </button>
                        <button
                            class="chapter-delete-btn srpg-b srpg-b-icon"
                            on:click|stopPropagation={() =>
                                deleteChapter(chapter.id)}
                            title="Delete chapter"
                            aria-label="Delete chapter"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="16"
                                height="16"
                            >
                                <path
                                    fill="currentColor"
                                    d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                                />
                            </svg>
                        </button>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    {#if viewingChapterId === null}
        {#if showCreateChapter}
            <SrpgModal
                show={showCreateChapter}
                ariaLabel="Close create chapter dialog"
                on:close={cancelCreateChapter}
            >
                <h3>Finish Chapter</h3>
                <p class="chapter-help">
                    All current entries will be saved to this chapter, and
                    you'll start fresh with a new current chapter.
                </p>
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
                    <button
                        class="srpg-b srpg-b-create"
                        on:click={createChapter}
                    >
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
                📜 Viewing: {getChapterDisplayName(
                    chapters.find((c) => c.id === viewingChapterId),
                )}
            </span>
        </div>
    {/if}

    {#if !viewingChapterId}
        <div style="margin-bottom: 1rem; text-align: center;">
            <button
                class="srpg-b srpg-b-create srpg-b-w-full"
                on:click={openAddEntry}
            >
                + Add entry
            </button>
        </div>
    {/if}

    </div>

    <div class="entries-list">
        {#if entries.length === 0}
            <div class="no-entries">
                <p>No chapter entries yet.</p>
                <p>Click "Add entry" to record your first adventure log,</p>
                <p>or roll the dice with the Oracle!</p>
            </div>
        {:else}
            {#each entries as entry (entry.id)}
                <EntryCard
                    {entry}
                    characterName={getCharacterName(entry.characterId)}
                    {editingEntryId}
                    bind:editText
                    {formatTimestamp}
                    on:assignCharacter={(e) => assignCharacter(e.detail)}
                    on:edit={(e) =>
                        openEditEntry(
                            e.detail.entryId,
                            e.detail.isManual,
                            e.detail.currentText,
                        )}
                    on:delete={(e) => deleteEntry(e.detail)}
                    on:save={(e) =>
                        saveEditEntry(e.detail.entryId, e.detail.isManual)}
                    on:cancelEdit={cancelEditEntry}
                />
            {/each}
        {/if}
    </div>
</div>


<SrpgModal
    bind:show={showAddEntry}
    ariaLabel="Manual chronicle entry editor"
    maxWidth="600px"
    on:close={cancelAddEntry}
>
    <div class="modal-content"> 
        <h3>New Chronicle Entry</h3>
        <textarea
            bind:value={newEntryText}
            placeholder="What happened in your adventure?"
            rows="6"
        ></textarea>
        <div class="editor-actions">
            <button
                class="srpg-b srpg-b-create"
                on:click={saveEntry}
                disabled={!newEntryText.trim()}
            >
                Save Entry
            </button>
            <button class="srpg-b srpg-b-simple" on:click={cancelAddEntry}>
                Cancel
            </button>
        </div> 
    </div>
</SrpgModal>


<!-- Character Assignment Modal -->
<SrpgModal
    bind:show={showCharacterAssign}
    maxWidth="450px"
    on:close={cancelCharacterAssign}
>
    <div class="modal-content">
        <h2>Assign Character</h2>
        <p class="modal-help">
            Select a character to associate with this entry.
        </p>

        {#if campaignCharacters.length > 0}
            <div class="character-select-list">
                <button
                    class="srpg-b character-select-item"
                    on:click={() => selectCharacterForEntry(null)}
                >
                    <span class="character-select-name"
                        >None (Remove assignment)</span
                    >
                </button>
                {#each campaignCharacters as character (character.id)}
                    <button
                        class="srpg-b character-select-item"
                        on:click={() => selectCharacterForEntry(character.id)}
                    >
                        <span class="character-select-name"
                            >{character.name}</span
                        >
                        {#if character.race || character.class}
                            <span class="character-select-info">
                                {#if character.race}{character.race}{/if}
                                {#if character.race && character.class}
                                    •
                                {/if}
                                {#if character.class}{character.class}{/if}
                            </span>
                        {/if}
                    </button>
                {/each}
            </div>
        {:else}
            <div class="no-characters-message">
                <p>No characters available.</p>
                <p class="hint">
                    Create a character in the Character Manager first.
                </p>
            </div>
        {/if}

        <div class="modal-footer">
            <button class="srpg-b srpg-b-simple" on:click={cancelCharacterAssign}>
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
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
    }

    .chronicle-sticky-header {
        flex-shrink: 0;
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
        background: var(--srpg-card-bg);
        border: 2px solid var(--srpg-border-color);
        border-radius: 8px;
        margin-bottom: 1.5rem;
        overflow: hidden;
    }

    .chapters-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.25rem;
        background: var(--srpg-secondary-bg);
        border-bottom: 1px solid var(--srpg-border-color);
    }

    .chapters-header h3 {
        margin: 0;
        font-size: 1.125rem;
        color: var(--srpg-text-primary);
    }

    .close-btn {
        background: transparent;
        border: none;
        font-size: 1.25rem;
        color: var(--srpg-text-tertiary);
        cursor: pointer;
        padding: 0.25rem;
        line-height: 1;
        transition: color 0.15s;
    }

    .close-btn:hover {
        color: var(--srpg-text-primary);
    }

    .chapters-content {
        padding: 0.5rem;
        max-height: 400px;
        overflow-y: auto;
    }

    .chapter-item-wrapper {
        position: relative;
        display: flex;
        gap: 0.25rem;
        margin-bottom: 0.25rem;
        justify-content: center;
        align-items: center;
    }

    .chapter-item {
        flex: 1;
        background: var(--srpg-secondary-bg);
        border: 1px solid var(--srpg-border-color);
        border-radius: 6px;
        padding: 0.75rem 1rem;
        text-align: left;
        cursor: pointer;
        transition: all 0.15s;
        width: 100%;
    }

    .chapter-item:hover {
        background: var(--srpg-hover-bg);
        border-color: var(--srpg-border-hover);
    }

    .chapter-item.active {
        background: var(--srpg-oracle-accent);
        color: white;
        border-color: var(--srpg-oracle-accent);
    }

    .chapter-item.active .chapter-name,
    .chapter-item.active .chapter-meta {
        color: white;
    }

    .chapter-name {
        font-weight: 600;
        font-size: 0.95rem;
        color: var(--srpg-text-primary);
        margin-bottom: 0.25rem;
    }

    .chapter-meta {
        font-size: 0.8rem;
        color: var(--srpg-text-muted);
    }

    .chapter-delete-btn {
        position: absolute;
        right: 1rem;
        color: var(--srpg-text-muted);
        background: var(--srpg-card-bg);
    }

    .chapter-delete-btn:hover {
        color: var(--srpg-error-text);
        background: var(--srpg-error-bg-light);
        border-color: var(--srpg-error-border);
    }

    .chapter-view-banner {
        background: var(--srpg-secondary-bg);
        border: 1px solid var(--srpg-border-color);
        border-radius: 8px;
        padding: 1rem 1.25rem;
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .back-btn {
        background: var(--srpg-card-bg);
        border: 1px solid var(--srpg-border-color);
        border-radius: 6px;
        padding: 0.5rem 1rem;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--srpg-text-secondary);
        transition: all 0.15s;
    }

    .back-btn:hover {
        background: var(--srpg-secondary-bg);
        border-color: var(--srpg-text-tertiary);
    }

    .viewing-chapter-name {
        font-size: 1rem;
        font-weight: 600;
        color: var(--srpg-text-primary);
    }

    .chapter-help {
        margin: 0 0 1rem 0;
        font-size: 0.9rem;
        color: var(--srpg-text-muted);
        line-height: 1.5;
    }

    .current-chapter-item-wrapper {
        display: flex;
        gap: 0.25rem;
        margin-bottom: 0.5rem;
        justify-content: center;
        align-items: center;
    }

    .chapter-name-input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--srpg-border-color);
        border-radius: 6px;
        font-family: inherit;
        font-size: 1rem;
        margin-bottom: 0.75rem;
        background: var(--srpg-input-bg);
        color: var(--srpg-text-primary);
    }

    .chapter-name-input:focus {
        outline: none;
        border-color: var(--srpg-oracle-accent);
        box-shadow: 0 0 0 3px var(--srpg-focus-ring);
    }

    .chapter-preview {
        background: var(--srpg-card-bg);
        border: 1px solid var(--srpg-border-color);
        border-radius: 6px;
        padding: 0.75rem;
        margin-bottom: 1rem;
        font-weight: 600;
        color: var(--srpg-text-secondary);
        font-size: 0.95rem;
    }

    .entry-editor {
        background: var(--srpg-secondary-bg);
        border: 2px solid var(--srpg-border-color);
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 2rem;
    }

    .modal-content h3 {
        margin: 0 0 1rem 0;
        font-size: 1.25rem;
        color: var(--srpg-text-primary);
    }

    .modal-content textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--srpg-border-color);
        border-radius: 6px;
        font-family: inherit;
        font-size: 1rem;
        resize: vertical;
        margin-bottom: 1rem;
        background: var(--srpg-input-bg);
        color: var(--srpg-text-primary);
    }

    .modal-content textarea:focus {
        outline: none;
        border-color: var(--srpg-oracle-accent);
        box-shadow: 0 0 0 3px var(--srpg-focus-ring);
    }

    .editor-actions {
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        gap: 0.75rem;
    }

    .entries-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        flex: 1;
        overflow-y: auto;
        min-height: 0;
        padding-bottom: 10rem;
    }

    .no-entries {
        text-align: center;
        padding: 3rem 1rem;
        color: var(--srpg-text-tertiary);
        background: var(--srpg-secondary-bg);
        border-radius: 8px;
    }

    .no-entries p {
        margin: 0.5rem 0;
    }

    .no-entries p:first-child {
        font-size: 1.125rem;
        font-weight: 500;
        color: var(--srpg-text-muted);
    }

    /* Character Assignment Modal Styles */
    .modal-content h2 {
        margin-top: 0;
        margin-bottom: 0.5rem;
        color: var(--srpg-text-primary);
    }

    .modal-help {
        margin: 0 0 1rem 0;
        font-size: 0.9rem;
        color: var(--srpg-text-muted);
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
        background: var(--srpg-card-bg);
        border: 2px solid var(--srpg-border-color);
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
        border-color: var(--srpg-oracle-accent);
        background: var(--srpg-hover-bg);
        transform: translateX(2px);
    }

    .character-select-name {
        font-weight: 600;
        color: var(--srpg-text-primary);
        font-size: 1rem;
    }

    .character-select-info {
        font-size: 0.85rem;
        color: var(--srpg-text-muted);
    }

    .no-characters-message {
        text-align: center;
        padding: 2rem 1rem;
        color: var(--srpg-text-muted);
        background: var(--srpg-secondary-bg);
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

    .chapter-action-btn {
        margin-left: 0.5rem;
        width: 4rem;
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
