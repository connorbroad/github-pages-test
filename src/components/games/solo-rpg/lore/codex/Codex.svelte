<script lang="ts">
    import { activeCampaign } from "../../game-management/campaign-store";
    import {
        loadCodexNotes,
        saveCodexNotes,
        loadCharacters,
        type CodexNote,
        type Character,
    } from "../../data/storage-utils";
    import SrpgModal from "../../shared/modal/SrpgModal.svelte";
    import SrpgListPage from "../../shared/layout/SrpgListPage.svelte";
    import "../../solo-rpg-styles.css";

    const DEFAULT_GROUPS = [
        "Game Rules",
        "Characters",
        "Locations",
        "Items",
        "NPCs",
        "Factions",
        "Lore",
    ];

    // SVG icon paths for each group
    const GROUP_ICONS: Record<string, { path: string; viewBox?: string }> = {
        "Game Rules": {
            path: "M12 2L4 7v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V7l-8-5zm-1 14v-2h2v2h-2zm0-4V8h2v4h-2z",
        },
        Characters: {
            path: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
        },
        Locations: {
            path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
        },
        Items: {
            path: "M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 0h-4V4h4v2z",
        },
        NPCs: {
            path: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
        },
        Factions: {
            path: "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 9h-2v2H9v-2H7v-2h2V7h2v2h2v2zm-2-6V3.5L16.5 9H11z",
        },
        Lore: {
            path: "M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z",
        },
    };

    // Default icon for custom groups
    const DEFAULT_ICON = {
        path: "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
    };

    let codexNotes: CodexNote[] = [];
    let characters: Character[] = [];
    let expandedGroups: Set<string> = new Set();
    let expandedSubGroups: Set<string> = new Set();
    let selectedNote: CodexNote | null = null;
    let isEditing: boolean = false;

    // Modal state
    let showCreateModal: boolean = false;
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

        const confirmed = confirm(`Are you sure you want to delete "${selectedNote.title}"?`);
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

    function getGroupIconData(group: string): { path: string; viewBox?: string } {
        return GROUP_ICONS[group] || DEFAULT_ICON;
    }
</script>

<SrpgListPage className="codex">
    <div slot="header" class="srpg-header-actions">
        <h1 class="srpg-page-header text-center">Notes</h1>
        {#if selectedNote}
            <button class="srpg-b srpg-b-simple" on:click={backToList}>
                <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="shrink-0"
                    aria-hidden="true">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back to List
            </button>
            {#if isEditing}
                <div class="srpg-b-group flex-nowrap">
                    <button class="srpg-b srpg-b-create srpg-b-w-full" on:click={saveNote}>
                        <svg
                            viewBox="0 0 24 24"
                            width="18"
                            height="18"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="shrink-0"
                            aria-hidden="true">
                            <path d="M20 6L9 17l-5-5" />
                        </svg>
                        Save
                    </button>
                    <button class="srpg-b srpg-b-simple" on:click={cancelEdit}>Cancel</button>
                </div>
            {:else}
                <button class="srpg-b srpg-b-normal srpg-b-w-full" on:click={editNote}>
                    <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="shrink-0"
                        aria-hidden="true">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit
                </button>
                {#if !selectedNote.characterId}
                    <button class="srpg-b srpg-b-danger" on:click={deleteNote}>
                        <svg
                            viewBox="0 0 24 24"
                            width="18"
                            height="18"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="shrink-0"
                            aria-hidden="true">
                            <path
                                d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        Delete
                    </button>
                {/if}
            {/if}
        {/if}
    </div>

    {#if selectedNote}
        <div class="srpg-note-view">
            <div class="srpg-note-header">
                <div class="srpg-note-meta-row">
                    <span class="srpg-badge">
                        <svg
                            viewBox="0 0 24 24"
                            width="14"
                            height="14"
                            fill="currentColor"
                            class="shrink-0"
                            aria-hidden="true">
                            <path d={getGroupIconData(selectedNote.noteGroup).path} />
                        </svg>
                        {selectedNote.noteGroup}
                    </span>
                    {#if selectedNote.subNoteGroup}
                        <span class="srpg-badge srpg-badge-info">{selectedNote.subNoteGroup}</span>
                    {/if}
                    {#if selectedNote.characterId}
                        <span class="srpg-badge srpg-badge-warning">
                            <svg
                                viewBox="0 0 24 24"
                                width="14"
                                height="14"
                                fill="currentColor"
                                class="shrink-0"
                                aria-hidden="true">
                                <path
                                    d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                            Character Note
                        </span>
                    {/if}
                </div>

                {#if isEditing}
                    <input
                        type="text"
                        class="srpg-note-title-input"
                        bind:value={selectedNote.title}
                        placeholder="Note title"
                        disabled={!!selectedNote.characterId} />
                {:else}
                    <h1 class="srpg-note-title">{selectedNote.title}</h1>
                {/if}

                <div class="srpg-note-dates">
                    <span>Created: {formatDate(selectedNote.createdAt)}</span>
                    {#if selectedNote.updatedAt !== selectedNote.createdAt}
                        <span>Updated: {formatDate(selectedNote.updatedAt)}</span>
                    {/if}
                </div>
            </div>

            <div class="srpg-note-content">
                {#if isEditing}
                    <textarea
                        class="srpg-textarea"
                        bind:value={selectedNote.content}
                        placeholder="Write your notes here...">
                    </textarea>
                {:else}
                    <div class="srpg-note-display">
                        {selectedNote.content || "No content yet."}
                    </div>
                {/if}
            </div>
        </div>
    {:else if codexNotes.length === 0}
        <div class="srpg-empty-state">
            <svg
                class="srpg-empty-state-icon"
                viewBox="0 0 24 24"
                width="48"
                height="48"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
            <p class="srpg-empty-state-text">No codex entries yet.</p>
            <p class="srpg-empty-state-hint">
                Create a new entry to start documenting your adventure.
            </p>
        </div>
    {:else}
        <div class="srpg-nested-list">
            {#each Object.entries(groupedNotes).sort( ([a], [b]) => a.localeCompare(b) ) as [group, subGroups]}
                <div class="group-section">
                    <div
                        class="srpg-group-header"
                        role="button"
                        tabindex="0"
                        on:click={() => toggleGroup(group)}
                        on:keydown={(e) =>
                            (e.key === "Enter" || e.key === " ") && toggleGroup(group)}>
                        <div class="srpg-group-title">
                            <span
                                class="srpg-expand-icon"
                                class:expanded={expandedGroups.has(group)}>
                                <svg
                                    viewBox="0 0 24 24"
                                    width="16"
                                    height="16"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    aria-hidden="true">
                                    <path d="M9 18l6-6-6-6" />
                                </svg>
                            </span>
                            <svg
                                class="srpg-group-icon"
                                viewBox="0 0 24 24"
                                width="20"
                                height="20"
                                fill="currentColor"
                                aria-hidden="true">
                                <path d={getGroupIconData(group).path} />
                            </svg>
                            <span>{group}</span>
                            <span class="srpg-group-count">
                                {Object.values(subGroups).flat().length}
                            </span>
                        </div>
                    </div>
                    {#if expandedGroups.has(group)}
                        <div class="srpg-subgroup-container">
                            {#each Object.entries(subGroups).sort( ([a], [b]) => a.localeCompare(b) ) as [subGroup, notes]}
                                <div class="subgroup-section">
                                    <div
                                        class="srpg-subgroup-header"
                                        role="button"
                                        tabindex="0"
                                        on:click={() => toggleSubGroup(`${group}-${subGroup}`)}
                                        on:keydown={(e) =>
                                            (e.key === "Enter" || e.key === " ") &&
                                            toggleSubGroup(`${group}-${subGroup}`)}>
                                        <div class="srpg-subgroup-title">
                                            <span
                                                class="srpg-expand-icon"
                                                class:expanded={expandedSubGroups.has(
                                                    `${group}-${subGroup}`
                                                )}>
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    width="14"
                                                    height="14"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    stroke-width="2"
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    aria-hidden="true">
                                                    <path d="M9 18l6-6-6-6" />
                                                </svg>
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
                                                        on:keydown={(e) =>
                                                            (e.key === "Enter" || e.key === " ") &&
                                                            selectNote(note)}>
                                                        <div class="srpg-list-item-header">
                                                            <span class="srpg-list-item-title">
                                                                {note.title}
                                                            </span>
                                                            {#if note.characterId}
                                                                <svg
                                                                    class="srpg-character-badge"
                                                                    viewBox="0 0 24 24"
                                                                    width="16"
                                                                    height="16"
                                                                    fill="currentColor"
                                                                    aria-label="Character note">
                                                                    <path
                                                                        d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                                                </svg>
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

    <div slot="footer" class="relative mb-[calc(env(safe-area-inset-bottom))] pt-2 md:mb-0">
        {#if !selectedNote}
            <div class="flex items-center justify-center px-2">
                <button
                    class="srpg-b srpg-b-create"
                    on:click={openCreateModal}
                    aria-label="Create new note">
                    <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="shrink-0"
                        aria-hidden="true">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    New Note
                </button>
            </div>
        {/if}
    </div>
</SrpgListPage>

<!-- Create Note Modal -->
<SrpgModal bind:show={showCreateModal} maxWidth="500px" on:close={() => (showCreateModal = false)}>
    <div class="modal-content">
        <h2 class="srpg-modal-heading">New Codex Entry</h2>

        <div class="srpg-form-field">
            <label for="noteTitle">Title *</label>
            <input
                id="noteTitle"
                type="text"
                bind:value={newNoteTitle}
                placeholder="Enter note title" />
        </div>

        <div class="srpg-form-field">
            <label for="noteGroup">Group *</label>
            <select id="noteGroup" bind:value={newNoteGroup} class="srpg-select">
                <option value="">-- Select a group --</option>
                {#each availableGroups as group}
                    <option value={group}>{group}</option>
                {/each}
            </select>
        </div>

        {#if !showCustomGroupInput}
            <button
                class="srpg-b srpg-b-normal srpg-b-sm srpg-b-w-full"
                on:click={toggleCustomGroupInput}>
                <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="shrink-0"
                    aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Create Custom Group
            </button>
        {:else}
            <div class="srpg-custom-group-input">
                <input
                    type="text"
                    bind:value={customGroupInput}
                    placeholder="Custom group name"
                    on:keydown={(e) => e.key === "Enter" && addCustomGroup()} />
                <button class="srpg-b srpg-b-create srpg-b-sm" on:click={addCustomGroup}>
                    Add
                </button>
                <button class="srpg-b srpg-b-simple srpg-b-sm" on:click={toggleCustomGroupInput}>
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
                placeholder="e.g., Party Members, Major Cities, etc." />
        </div>

        <div class="srpg-form-field">
            <label for="noteContent">Content</label>
            <textarea
                id="noteContent"
                class="srpg-textarea"
                bind:value={newNoteContent}
                placeholder="Write your notes here..."
                style="min-height: 150px;">
            </textarea>
        </div>

        <div class="srpg-modal-actions">
            <button class="srpg-b srpg-b-simple" on:click={() => (showCreateModal = false)}>
                Cancel
            </button>
            <button
                class="srpg-b srpg-b-create"
                on:click={createNote}
                disabled={!newNoteTitle.trim() || !newNoteGroup}>
                <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="shrink-0"
                    aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Create Note
            </button>
        </div>
    </div>
</SrpgModal>
