<script lang="ts">
    import { onMount } from "svelte";
    import { activeCampaign } from "../../game-management/campaign-store";
    import {
        loadCodexNotes,
        saveCodexNotes,
        loadCharacters,
        type CodexNote,
        type Character,
    } from "../../data/storage-utils";
    import SrpgModal from "../../shared/modal/SrpgModal.svelte";
    import "../../solo-rpg-styles.css";

    const DEFAULT_GROUPS = ["Characters", "Locations", "Items", "NPCs", "Factions", "Lore"];

    let codexNotes: CodexNote[] = [];
    let characters: Character[] = [];
    let expandedGroups: Set<string> = new Set();
    let expandedSubGroups: Set<string> = new Set();
    let selectedNote: CodexNote | null = null;
    let isEditing: boolean = false;

    // Modal state
    let showCreateModal: boolean = false;
    let showGroupModal: boolean = false;
    let newNoteTitle: string = "";
    let newNoteContent: string = "";
    let newNoteGroup: string = "";
    let newNoteSubGroup: string = "";
    let customGroupInput: string = "";
    let showCustomGroupInput: boolean = false;

    $: if ($activeCampaign) {
        loadCodexData();
    }

    // Group notes by noteGroup and subNoteGroup
    $: groupedNotes = organizeNotes(codexNotes);

    // Get all available groups (default + custom + character groups)
    $: availableGroups = getAvailableGroups(codexNotes);

    function loadCodexData() {
        if (!$activeCampaign) return;

        const allNotes = loadCodexNotes();
        codexNotes = allNotes.filter((n) => n.campaignId === $activeCampaign.id);

        const allCharacters = loadCharacters();
        characters = allCharacters.filter((c) => c.campaignId === $activeCampaign.id);

        // Auto-create character notes if they don't exist
        syncCharacterNotes();
    }

    function syncCharacterNotes() {
        if (!$activeCampaign) return;

        const newNotes: CodexNote[] = [];
        characters.forEach((character) => {
            const hasNote = codexNotes.some(
                (n) => n.characterId === character.id && n.noteGroup === "Characters"
            );

            if (!hasNote) {
                const characterNote: CodexNote = {
                    id: `note-char-${character.id}`,
                    campaignId: $activeCampaign.id,
                    title: character.name,
                    content: `Notes about ${character.name}`,
                    noteGroup: "Characters",
                    subNoteGroup: character.name || "Ungrouped",
                    characterId: character.id,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                };
                newNotes.push(characterNote);
            }
        });

        if (newNotes.length > 0) {
            codexNotes = [...codexNotes, ...newNotes];
            saveAllNotes();
        }
    }

    function organizeNotes(notes: CodexNote[]) {
        const organized: Record<string, Record<string, CodexNote[]>> = {};

        notes.forEach((note) => {
            const group = note.noteGroup || "Uncategorized";
            const subGroup = note.subNoteGroup || "General";

            if (!organized[group]) {
                organized[group] = {};
            }
            if (!organized[group][subGroup]) {
                organized[group][subGroup] = [];
            }

            organized[group][subGroup].push(note);
        });

        // Sort notes within each subgroup by title
        Object.keys(organized).forEach((group) => {
            Object.keys(organized[group]).forEach((subGroup) => {
                organized[group][subGroup].sort((a, b) => a.title.localeCompare(b.title));
            });
        });

        return organized;
    }

    function getAvailableGroups(notes: CodexNote[]): string[] {
        const groups = new Set<string>(DEFAULT_GROUPS);
        notes.forEach((n) => {
            if (n.noteGroup && !DEFAULT_GROUPS.includes(n.noteGroup)) {
                groups.add(n.noteGroup);
            }
        });
        return Array.from(groups).sort();
    }

    function toggleGroup(group: string) {
        if (expandedGroups.has(group)) {
            expandedGroups.delete(group);
        } else {
            expandedGroups.add(group);
        }
        expandedGroups = expandedGroups;
    }

    function toggleSubGroup(key: string) {
        if (expandedSubGroups.has(key)) {
            expandedSubGroups.delete(key);
        } else {
            expandedSubGroups.add(key);
        }
        expandedSubGroups = expandedSubGroups;
    }

    function openCreateModal() {
        newNoteTitle = "";
        newNoteContent = "";
        newNoteGroup = "";
        newNoteSubGroup = "";
        showCustomGroupInput = false;
        customGroupInput = "";
        showCreateModal = true;
    }

    function toggleCustomGroupInput() {
        showCustomGroupInput = !showCustomGroupInput;
        if (showCustomGroupInput) {
            customGroupInput = "";
        }
    }

    function addCustomGroup() {
        const trimmed = customGroupInput.trim();
        if (trimmed && !DEFAULT_GROUPS.includes(trimmed)) {
            newNoteGroup = trimmed;
            showCustomGroupInput = false;
            customGroupInput = "";
        }
    }

    function createNote() {
        if (!$activeCampaign || !newNoteTitle.trim() || !newNoteGroup) return;

        const newNote: CodexNote = {
            id: `note-${Date.now()}`,
            campaignId: $activeCampaign.id,
            title: newNoteTitle.trim(),
            content: newNoteContent.trim(),
            noteGroup: newNoteGroup,
            subNoteGroup: newNoteSubGroup.trim() || undefined,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        // Add to local array and trigger reactivity
        codexNotes = [...codexNotes, newNote];
        saveAllNotes();

        // Auto-expand the group and subgroup
        expandedGroups.add(newNoteGroup);
        if (newNoteSubGroup.trim()) {
            expandedSubGroups.add(`${newNoteGroup}-${newNoteSubGroup.trim()}`);
        }
        expandedGroups = expandedGroups;
        expandedSubGroups = expandedSubGroups;

        showCreateModal = false;
        selectNote(newNote);
    }

    function selectNote(note: CodexNote) {
        selectedNote = note;
        isEditing = false;
    }

    function editNote() {
        isEditing = true;
    }

    function saveNote() {
        if (!selectedNote) return;

        selectedNote.updatedAt = Date.now();
        codexNotes = codexNotes; // Trigger reactivity
        saveAllNotes();
        isEditing = false;
    }

    function cancelEdit() {
        if (!selectedNote) return;

        // Reload to reset changes
        loadCodexData();
        const reloadedNote = codexNotes.find((n) => n.id === selectedNote.id);
        selectedNote = reloadedNote || null;
        isEditing = false;
    }

    function deleteNote() {
        if (!selectedNote) return;

        // Don't allow deletion of character notes
        if (selectedNote.characterId) {
            alert("Character notes cannot be deleted. They are automatically managed.");
            return;
        }

        const confirmed = confirm(
            `Are you sure you want to delete "${selectedNote.title}"?`
        );
        if (!confirmed) return;

        const allNotes = loadCodexNotes();
        const filtered = allNotes.filter((n) => n.id !== selectedNote.id);
        
        const allSaveNotes = [...filtered];
        saveCodexNotes(allSaveNotes);

        loadCodexData();
        selectedNote = null;
        isEditing = false;
    }

    function backToList() {
        selectedNote = null;
        isEditing = false;
    }

    function saveAllNotes() {
        const allNotes = loadCodexNotes();
        const otherNotes = allNotes.filter((n) => n.campaignId !== $activeCampaign?.id);
        const updatedNotes = [...otherNotes, ...codexNotes];
        saveCodexNotes(updatedNotes);
    }

    function formatDate(timestamp: number): string {
        const date = new Date(timestamp);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    }

    function getGroupIcon(group: string): string {
        const icons: Record<string, string> = {
            Characters: "👤",
            Locations: "📍",
            Items: "🎒",
            NPCs: "👥",
            Factions: "⚔️",
            Lore: "📜",
        };
        return icons[group] || "📝";
    }
</script>

<div class="codex">
    {#if selectedNote}
        <!-- Note Detail View -->
        <div class="note-view">
            <div class="srpg-header-actions">
                <button class="srpg-b srpg-b-normal srpg-b-sm" on:click={backToList}>
                    ← Back to List
                </button>
                <div class="srpg-b-group">
                    {#if !isEditing}
                        <button class="srpg-b srpg-b-normal srpg-b-sm" on:click={editNote}>
                            Edit
                        </button>
                        {#if !selectedNote.characterId}
                            <button
                                class="srpg-b srpg-b-danger srpg-b-sm"
                                on:click={deleteNote}
                            >
                                Delete
                            </button>
                        {/if}
                    {:else}
                        <button class="srpg-b srpg-b-create srpg-b-sm" on:click={saveNote}>
                            Save
                        </button>
                        <button class="srpg-b srpg-b-normal srpg-b-sm" on:click={cancelEdit}>
                            Cancel
                        </button>
                    {/if}
                </div>
            </div>

            <div class="note-header">
                <div class="note-meta-row">
                    <span class="srpg-badge">{getGroupIcon(selectedNote.noteGroup)} {selectedNote.noteGroup}</span>
                    {#if selectedNote.subNoteGroup}
                        <span class="srpg-badge srpg-badge-info">{selectedNote.subNoteGroup}</span>
                    {/if}
                    {#if selectedNote.characterId}
                        <span class="srpg-badge srpg-badge-warning">Character Note</span>
                    {/if}
                </div>

                {#if isEditing}
                    <input
                        type="text"
                        class="note-title-input"
                        bind:value={selectedNote.title}
                        placeholder="Note title"
                        disabled={!!selectedNote.characterId}
                    />
                {:else}
                    <h1 class="note-title">{selectedNote.title}</h1>
                {/if}

                <div class="note-dates">
                    <span>Created: {formatDate(selectedNote.createdAt)}</span>
                    {#if selectedNote.updatedAt !== selectedNote.createdAt}
                        <span>Updated: {formatDate(selectedNote.updatedAt)}</span>
                    {/if}
                </div>
            </div>

            <div class="note-content">
                {#if isEditing}
                    <textarea
                        class="srpg-textarea"
                        bind:value={selectedNote.content}
                        placeholder="Write your notes here..."
                    ></textarea>
                {:else}
                    <div class="note-display">
                        {selectedNote.content || "No content yet."}
                    </div>
                {/if}
            </div>
        </div>
    {:else}
        <!-- List View -->
        <div class="codex-list-view">
            <div class="srpg-header-actions">
                <h2 class="srpg-header-title">Codex</h2>
                <button class="srpg-b srpg-b-create" on:click={openCreateModal}>
                    + New Note
                </button>
            </div>

            {#if codexNotes.length === 0}
                <div class="srpg-empty-message">
                    <p>No codex entries yet.</p>
                    <p class="hint">Create a new entry to start documenting your adventure.</p>
                </div>
            {:else}
                <div class="srpg-nested-list">
                    {#each Object.entries(groupedNotes).sort(([a], [b]) => a.localeCompare(b)) as [group, subGroups]}
                        <div class="group-section">
                            <div 
                                class="srpg-group-header" 
                                role="button"
                                tabindex="0"
                                on:click={() => toggleGroup(group)}
                                on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleGroup(group)}
                            >
                                <div class="srpg-group-title">
                                    <span class="srpg-expand-icon" class:expanded={expandedGroups.has(group)}>
                                        ▶
                                    </span>
                                    <span>{getGroupIcon(group)} {group}</span>
                                    <span class="srpg-group-count">
                                        {Object.values(subGroups).flat().length}
                                    </span>
                                </div>
                            </div>

                            {#if expandedGroups.has(group)}
                                <div class="srpg-subgroup-container">
                                    {#each Object.entries(subGroups).sort(([a], [b]) => a.localeCompare(b)) as [subGroup, notes]}
                                        <div class="subgroup-section">
                                            <div
                                                class="srpg-subgroup-header"
                                                role="button"
                                                tabindex="0"
                                                on:click={() => toggleSubGroup(`${group}-${subGroup}`)}
                                                on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleSubGroup(`${group}-${subGroup}`)}
                                            >
                                                <div class="srpg-subgroup-title">
                                                    <span
                                                        class="srpg-expand-icon"
                                                        class:expanded={expandedSubGroups.has(`${group}-${subGroup}`)}
                                                    >
                                                        ▶
                                                    </span>
                                                    <span>{subGroup}</span>
                                                    <span class="srpg-group-count">{notes.length}</span>
                                                </div>
                                            </div>

                                            {#if expandedSubGroups.has(`${group}-${subGroup}`)}
                                                <div class="srpg-notes-container">
                                                    <div class="srpg-list">
                                                        {#each notes as note}
                                                            <div
                                                                class="srpg-list-item"
                                                                role="button"
                                                                tabindex="0"
                                                                on:click={() => selectNote(note)}
                                                                on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && selectNote(note)}
                                                            >
                                                                <div class="srpg-list-item-header">
                                                                    <span class="srpg-list-item-title">
                                                                        {note.title}
                                                                    </span>
                                                                    {#if note.characterId}
                                                                        <span class="character-badge">👤</span>
                                                                    {/if}
                                                                </div>
                                                                <div class="srpg-list-item-meta">
                                                                    Updated {formatDate(note.updatedAt)}
                                                                </div>
                                                            </div>
                                                        {/each}
                                                    </div>
                                                </div>
                                            {/if}
                                        </div>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}
</div>

<!-- Create Note Modal -->
<SrpgModal
    bind:show={showCreateModal}
    maxWidth="500px"
    on:close={() => (showCreateModal = false)}
>
    <div class="modal-content">
        <h2 class="srpg-modal-heading">New Codex Entry</h2>

        <div class="srpg-form-field">
            <label for="noteTitle">Title *</label>
            <input
                id="noteTitle"
                type="text"
                bind:value={newNoteTitle}
                placeholder="Enter note title"
            />
        </div>

        <div class="srpg-form-field">
            <label for="noteGroup">Group *</label>
            <select id="noteGroup" bind:value={newNoteGroup} class="srpg-select">
                <option value="">-- Select a group --</option>
                {#each availableGroups as group}
                    <option value={group}>{getGroupIcon(group)} {group}</option>
                {/each}
            </select>
        </div>

        {#if !showCustomGroupInput}
            <button
                class="srpg-b srpg-b-normal srpg-b-sm srpg-b-w-full"
                on:click={toggleCustomGroupInput}
            >
                + Create Custom Group
            </button>
        {:else}
            <div class="custom-group-input">
                <input
                    type="text"
                    bind:value={customGroupInput}
                    placeholder="Custom group name"
                    on:keydown={(e) => e.key === "Enter" && addCustomGroup()}
                />
                <button class="srpg-b srpg-b-create srpg-b-sm" on:click={addCustomGroup}>
                    Add
                </button>
                <button
                    class="srpg-b srpg-b-normal srpg-b-sm"
                    on:click={toggleCustomGroupInput}
                >
                    Cancel
                </button>
            </div>
        {/if}

        <div class="srpg-form-field">
            <label for="noteSubGroup">Subgroup (optional)</label>
            <input
                id="noteSubGroup"
                type="text"
                bind:value={newNoteSubGroup}
                placeholder="e.g., Party Members, Major Cities, etc."
            />
        </div>

        <div class="srpg-form-field">
            <label for="noteContent">Content</label>
            <textarea
                id="noteContent"
                class="srpg-textarea"
                bind:value={newNoteContent}
                placeholder="Write your notes here..."
                style="min-height: 150px;"
            ></textarea>
        </div>

        <div class="srpg-modal-actions">
            <button
                class="srpg-b srpg-b-normal"
                on:click={() => (showCreateModal = false)}
            >
                Cancel
            </button>
            <button
                class="srpg-b srpg-b-create"
                on:click={createNote}
                disabled={!newNoteTitle.trim() || !newNoteGroup}
            >
                Create Note
            </button>
        </div>
    </div>
</SrpgModal>

<style>
    .codex {
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .codex-list-view {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
    }

    .note-view {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .note-header {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .note-meta-row {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .note-title {
        margin: 0;
        font-size: 2rem;
        color: #111827;
        font-weight: 700;
    }

    .note-title-input {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid #3b82f6;
        border-radius: 8px;
        font-size: 1.75rem;
        font-weight: 700;
        color: #111827;
        font-family: inherit;
    }

    .note-title-input:disabled {
        border-color: #d1d5db;
        background: #f9fafb;
        cursor: not-allowed;
    }

    .note-dates {
        display: flex;
        gap: 1rem;
        font-size: 0.875rem;
        color: #6b7280;
    }

    .note-content {
        flex: 1;
        min-height: 0;
    }

    .note-display {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 1.5rem;
        white-space: pre-wrap;
        word-wrap: break-word;
        color: #374151;
        line-height: 1.6;
        min-height: 200px;
    }

    .character-badge {
        font-size: 1.25rem;
    }

    .hint {
        font-style: italic;
        color: #9ca3af;
    }

    .modal-content {
        text-align: left;
    }

    .custom-group-input {
        display: flex;
        gap: 0.5rem;
        align-items: stretch;
        margin-top: 0.5rem;
    }

    .custom-group-input input {
        flex: 1;
    }

    @media (max-width: 768px) {
        .note-title {
            font-size: 1.5rem;
        }

        .note-title-input {
            font-size: 1.25rem;
        }

        .note-dates {
            flex-direction: column;
            gap: 0.25rem;
        }

        .custom-group-input {
            flex-direction: column;
        }
    }
</style>
