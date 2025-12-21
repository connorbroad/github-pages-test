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
        const now = Date.now();
        const diff = now - timestamp;
        if (diff < 60000) return "Just now";
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

        const date = new Date(timestamp);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    }

    // New reactive variables for the dashboard
    let searchQuery = "";
    let selectedGroup: string | null = null;
    let selectedSubGroup: string | null = null;

    $: filteredNotes = codexNotes.filter((note) => {
        const matchesSearch =
            !searchQuery ||
            note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesGroup = !selectedGroup || note.noteGroup === selectedGroup;
        const matchesSubGroup = !selectedSubGroup || note.subNoteGroup === selectedSubGroup;
        return matchesSearch && matchesGroup && matchesSubGroup;
    });

    $: recentNotes = [...codexNotes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6);

    $: groupCounts = availableGroups.reduce(
        (acc, group) => {
            acc[group] = codexNotes.filter((n) => n.noteGroup === group).length;
            return acc;
        },
        {} as Record<string, number>
    );

    function setFilter(group: string | null, subGroup: string | null = null) {
        selectedGroup = group;
        selectedSubGroup = subGroup;
        selectedNote = null;
    }

    function getSubGroups(group: string) {
        const subs = new Set<string>();
        codexNotes
            .filter((n) => n.noteGroup === group)
            .forEach((n) => {
                if (n.subNoteGroup) subs.add(n.subNoteGroup);
            });
        return Array.from(subs).sort();
    }

    function getGroupIconData(group: string): { path: string; viewBox?: string } {
        return GROUP_ICONS[group] || DEFAULT_ICON;
    }

    // Public method to reset filters (called from parent via bind:this)
    export function resetFilters() {
        searchQuery = "";
        selectedGroup = null;
        selectedSubGroup = null;
        selectedNote = null;
    }

    //export default {};
</script>

<div class="codex-dashboard">
    <!-- Sidebar Navigation -->
    <aside class="codex-sidebar">
        <div class="sidebar-header">
            <h2 class="sidebar-title">Categories</h2>
            <button class="add-note-btn" on:click={openCreateModal} title="New Note">
                <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            </button>
        </div>

        <div class="search-box">
            <svg
                class="search-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" placeholder="Search notes..." bind:value={searchQuery} />
        </div>

        <nav class="sidebar-nav">
            <button class="nav-item" class:active={!selectedGroup} on:click={() => setFilter(null)}>
                <span class="nav-icon">
                    <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                </span>
                <span class="nav-label">Overview</span>
            </button>

            {#each availableGroups as group}
                {@const count = groupCounts[group]}
                {#if count > 0 || DEFAULT_GROUPS.includes(group)}
                    <div class="nav-group-wrapper" class:expanded={expandedGroups.has(group)}>
                        <button
                            class="nav-item"
                            class:active={selectedGroup === group}
                            on:click={() => {
                                setFilter(group);
                                toggleGroup(group);
                            }}>
                            <span class="nav-icon">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                    <path d={getGroupIconData(group).path} />
                                </svg>
                            </span>
                            <span class="nav-label">{group}</span>
                            <span class="nav-count">{count}</span>
                        </button>

                        {#if expandedGroups.has(group)}
                            <div class="nav-subgroups">
                                {#each getSubGroups(group) as sub}
                                    <button
                                        class="nav-sub-item"
                                        class:active={selectedSubGroup === sub}
                                        on:click|stopPropagation={() => setFilter(group, sub)}>
                                        {sub}
                                    </button>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/if}
            {/each}
        </nav>
    </aside>

    <!-- Main Content Area -->
    <main class="codex-main">
        {#if selectedNote}
            <div class="note-view-container">
                <header class="note-header">
                    <nav class="note-breadcrumbs">
                        <button class="breadcrumb-item" on:click={() => setFilter(null)}>
                            <svg
                                viewBox="0 0 24 24"
                                width="14"
                                height="14"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                            Codex
                        </button>
                        <span class="breadcrumb-separator">/</span>
                        <button class="breadcrumb-item" on:click={() => setFilter(selectedNote.noteGroup)}>
                            {selectedNote.noteGroup}
                        </button>
                        {#if selectedNote.subNoteGroup}
                            <span class="breadcrumb-separator">/</span>
                            <button class="breadcrumb-item" on:click={() => setFilter(selectedNote.noteGroup, selectedNote.subNoteGroup)}>
                                {selectedNote.subNoteGroup}
                            </button>
                        {/if}
                    </nav>

                    <div class="note-title-row">
                        {#if isEditing}
                            <input
                                type="text"
                                class="note-title-input"
                                bind:value={selectedNote.title}
                                placeholder="Note title"
                                disabled={!!selectedNote.characterId} />
                        {:else}
                            <h1 class="note-title">{selectedNote.title}</h1>
                        {/if}

                        <div class="note-actions">
                            {#if isEditing}
                                <button class="action-btn save" on:click={saveNote} title="Save">
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="18"
                                        height="18"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2.5">
                                        <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                </button>
                                <button
                                    class="action-btn cancel"
                                    on:click={cancelEdit}
                                    title="Cancel">
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="18"
                                        height="18"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2.5">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </button>
                            {:else}
                                <button class="action-btn edit" on:click={editNote} title="Edit">
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="18"
                                        height="18"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2">
                                        <path
                                            d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path
                                            d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </button>
                                {#if !selectedNote.characterId}
                                    <button
                                        class="action-btn delete"
                                        on:click={deleteNote}
                                        title="Delete">
                                        <svg
                                            viewBox="0 0 24 24"
                                            width="18"
                                            height="18"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="2">
                                            <path
                                                d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </button>
                                {/if}
                            {/if}
                        </div>
                    </div>
                </header>

                <div class="note-body">
                    {#if isEditing}
                        <textarea
                            class="note-editor"
                            bind:value={selectedNote.content}
                            placeholder="Write your adventure notes here...">
                        </textarea>
                    {:else}
                        <div class="note-display">
                            {selectedNote.content || "No content yet."}
                        </div>
                    {/if}
                </div>

                <footer class="note-footer">
                    <span>Last updated {formatDate(selectedNote.updatedAt)}</span>
                </footer>
            </div>
        {:else}
            <!-- Dashboard Overview -->
            <div class="dashboard-overview">
                {#if !selectedGroup && !searchQuery}
                    <section class="overview-section">
                        <h2 class="section-heading">Recent Notes</h2>
                        <div class="note-grid">
                            {#each recentNotes as note}
                                <button class="note-card" on:click={() => selectNote(note)}>
                                    <div class="card-header">
                                        <span class="card-category">{note.noteGroup}</span>
                                        <span class="card-date">{formatDate(note.updatedAt)}</span>
                                    </div>
                                    <h3 class="card-title">{note.title}</h3>
                                    <p class="card-excerpt">{note.content || "No content..."}</p>
                                </button>
                            {/each}
                        </div>
                    </section>
                {/if}

                <section class="overview-section">
                    <div class="section-header">
                        <h2 class="section-heading">
                            {searchQuery ? "Search Results" : selectedGroup || "All Notes"}
                            {#if selectedSubGroup}
                                <span class="heading-sub">/ {selectedSubGroup}</span>
                            {/if}
                            <span class="res-count">{filteredNotes.length}</span>
                        </h2>

                        {#if selectedGroup || searchQuery}
                            <button
                                class="srpg-b srpg-b-create srpg-b-sm"
                                on:click={openCreateModal}>
                                <svg
                                    viewBox="0 0 24 24"
                                    width="16"
                                    height="16"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2.5">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Add Note
                            </button>
                        {/if}
                    </div>

                    {#if filteredNotes.length === 0}
                        <div class="empty-results">
                            <div class="empty-icon">
                                <svg
                                    viewBox="0 0 24 24"
                                    width="48"
                                    height="48"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.5">
                                    <path
                                        d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                </svg>
                            </div>
                            <p>No notes found matching your filters.</p>
                            <button
                                class="srpg-b srpg-b-simple"
                                on:click={() => {
                                    searchQuery = "";
                                    setFilter(null);
                                }}>
                                Clear All Filters
                            </button>
                        </div>
                    {:else}
                        <div class="note-list">
                            {#each filteredNotes as note}
                                <button class="note-list-card" on:click={() => selectNote(note)}>
                                    <div class="list-card-content">
                                        <div class="list-card-icon">
                                            <svg
                                                viewBox="0 0 24 24"
                                                width="18"
                                                height="18"
                                                fill="currentColor">
                                                <path d={getGroupIconData(note.noteGroup).path} />
                                            </svg>
                                        </div>
                                        <div class="list-card-info">
                                            <h4 class="list-card-title">{note.title}</h4>
                                            <div class="list-card-meta">
                                                {note.noteGroup}
                                                {#if note.subNoteGroup}· {note.subNoteGroup}{/if}
                                            </div>
                                        </div>
                                        <div class="list-card-date">
                                            {formatDate(note.updatedAt)}
                                        </div>
                                    </div>
                                </button>
                            {/each}
                        </div>
                    {/if}
                </section>
            </div>
        {/if}
    </main>
</div>

<!-- Create Note Modal -->
<SrpgModal bind:show={showCreateModal} maxWidth="600px" on:close={() => (showCreateModal = false)}>
    <div class="srpg-modal-container">
        <header class="srpg-modal-header">
            <div class="srpg-modal-header-icon create">
                <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
            </div>
            <div>
                <h2 class="srpg-modal-title">New Codex Entry</h2>
                <p class="srpg-modal-subtitle">Document your world, NPCs, and lore</p>
            </div>
        </header>

        <div class="srpg-modal-body">
            <div class="srpg-form-grid">
                <div class="srpg-form-field full-width">
                    <label for="noteTitle">Entry Title</label>
                    <div class="srpg-input-wrapper">
                        <input
                            id="noteTitle"
                            type="text"
                            bind:value={newNoteTitle}
                            placeholder="e.g. The Whispering Woods, Captain Valerius..." />
                    </div>
                </div>

                <div class="srpg-form-field">
                    <label for="noteGroup">Category</label>
                    <div class="srpg-input-wrapper">
                        <select id="noteGroup" bind:value={newNoteGroup} class="srpg-select">
                            <option value="">Select Category</option>
                            {#each availableGroups as group}
                                <option value={group}>{group}</option>
                            {/each}
                        </select>
                    </div>
                </div>

                <div class="srpg-form-field">
                    <label for="noteSubGroup">
                        Sub-Category <span class="optional">(Optional)</span>
                    </label>
                    <div class="srpg-input-wrapper">
                        <input
                            id="noteSubGroup"
                            type="text"
                            bind:value={newNoteSubGroup}
                            placeholder="e.g. Regions, Notable NPCs..." />
                    </div>
                </div>

                {#if !showCustomGroupInput}
                    <div class="srpg-form-field full-width">
                        <button
                            class="srpg-b srpg-b-simple srpg-b-sm srpg-b-w-full"
                            on:click={toggleCustomGroupInput}>
                            <svg
                                viewBox="0 0 24 24"
                                width="14"
                                height="14"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2.5">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Create New Category
                        </button>
                    </div>
                {:else}
                    <div class="srpg-form-field full-width custom-group-section">
                        <label for="customGroupInput">New Category Name</label>
                        <div class="srpg-input-group">
                            <input
                                id="customGroupInput"
                                type="text"
                                bind:value={customGroupInput}
                                placeholder="Enter category name..."
                                on:keydown={(e) => e.key === "Enter" && addCustomGroup()} />
                            <button
                                class="srpg-b srpg-b-create srpg-b-sm"
                                on:click={addCustomGroup}>
                                Add
                            </button>
                            <button
                                class="srpg-b srpg-b-simple srpg-b-sm"
                                on:click={toggleCustomGroupInput}>
                                Cancel
                            </button>
                        </div>
                    </div>
                {/if}

                <div class="srpg-form-field full-width">
                    <label for="noteContent">Notes & Lore</label>
                    <div class="srpg-input-wrapper">
                        <textarea
                            id="noteContent"
                            class="srpg-textarea"
                            bind:value={newNoteContent}
                            placeholder="Describe this entry in detail..."
                            style="min-height: 180px;">
                        </textarea>
                    </div>
                </div>
            </div>
        </div>

        <footer class="srpg-modal-footer">
            <button class="srpg-b srpg-b-simple" on:click={() => (showCreateModal = false)}>
                Discard
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
                    stroke-width="2.5">
                    <path d="M20 6L9 17l-5-5" />
                </svg>
                Save Entry
            </button>
        </footer>
    </div>
</SrpgModal>

<style>
    .codex-dashboard {
        display: flex;
        height: 100vh;
        height: 100dvh;
        background: var(--bg-primary);
        overflow: hidden;
    }

    /* Sidebar Styles */
    .codex-sidebar {
        width: 280px;
        display: flex;
        flex-direction: column;
        background: var(--bg-secondary);
        border-right: 1px solid var(--border-primary);
        padding: 1.25rem;
        gap: 1.25rem;
        flex-shrink: 0;
        min-height: 0;
        overflow: hidden;
    }

    .sidebar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .sidebar-title {
        font-size: 0.75rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--text-muted);
        margin: 0;
    }

    .add-note-btn {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: var(--accent-primary);
        color: white;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 2px 8px rgba(var(--accent-primary-rgb, 59, 130, 246), 0.3);
    }

    .add-note-btn:hover {
        transform: scale(1.05);
        background: var(--accent-hover);
    }

    .search-box {
        position: relative;
        display: flex;
        align-items: center;
    }

    .search-icon {
        position: absolute;
        left: 0.75rem;
        width: 14px;
        height: 14px;
        color: var(--text-muted);
        pointer-events: none;
    }

    .search-box input {
        width: 100%;
        padding: 0.625rem 0.75rem 0.625rem 2.25rem;
        background: var(--input-bg);
        border: 1px solid var(--border-primary);
        border-radius: 10px;
        color: var(--text-primary);
        font-size: 0.875rem;
        transition: all 0.2s;
    }

    .search-box input:focus {
        outline: none;
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 2px var(--srpg-focus-ring);
    }

    .sidebar-nav {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding-right: 0.25rem;
        min-height: 0;
    }

    .nav-item {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.625rem 0.75rem;
        background: transparent;
        border: none;
        border-radius: 10px;
        color: var(--text-secondary);
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
    }

    .nav-item:hover:not(.active) {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .nav-item.active {
        background: var(--bg-tertiary);
        color: var(--accent-primary);
        box-shadow: inset 0 0 0 1px var(--border-primary);
    }

    .nav-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
    }

    .nav-label {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .nav-count {
        font-size: 0.7rem;
        font-weight: 700;
        background: var(--bg-secondary);
        padding: 0.125rem 0.375rem;
        border-radius: 6px;
        opacity: 0.6;
    }

    .nav-group-wrapper {
        display: flex;
        flex-direction: column;
    }

    .nav-subgroups {
        display: flex;
        flex-direction: column;
        padding-left: 2rem;
        margin-top: 0.125rem;
        margin-bottom: 0.5rem;
    }

    .nav-sub-item {
        padding: 0.375rem 0.75rem;
        font-size: 0.8rem;
        color: var(--text-muted);
        background: transparent;
        border: none;
        border-left: 1px solid var(--border-primary);
        text-align: left;
        cursor: pointer;
        transition: all 0.2s;
    }

    .nav-sub-item:hover {
        color: var(--text-primary);
        border-left-color: var(--accent-primary);
    }

    .nav-sub-item.active {
        color: var(--accent-primary);
        font-weight: 700;
        border-left-color: var(--accent-primary);
    }

    /* Main Area Styles */
    .codex-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: var(--modal-bg);
        overflow: hidden;
        min-height: 0;
    }

    /* Note View Styles */
    .note-view-container {
        display: flex;
        flex-direction: column;
        flex: 1;
        max-width: 900px;
        margin: 0 auto;
        padding: 2rem;
        width: 100%;
        overflow-y: auto;
        min-height: 0;
    }

    .note-header {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        margin-bottom: 2rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid var(--border-primary);
        flex-shrink: 0;
    }

    .note-breadcrumbs {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .breadcrumb-item {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        background: none;
        border: none;
        padding: 0.25rem 0.5rem;
        margin: -0.25rem -0.5rem;
        border-radius: 6px;
        color: var(--text-secondary);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s;
    }

    .breadcrumb-item:hover {
        background: var(--bg-tertiary);
        color: var(--accent-primary);
    }

    .breadcrumb-separator {
        color: var(--text-muted);
        font-size: 0.875rem;
        opacity: 0.5;
        user-select: none;
    }

    .note-title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1.5rem;
    }

    .note-title {
        font-size: 2.25rem;
        font-weight: 900;
        color: var(--text-primary);
        margin: 0;
        line-height: 1.1;
    }

    .note-title-input {
        flex: 1;
        font-size: 2.25rem;
        font-weight: 900;
        background: transparent;
        border: none;
        border-bottom: 2px solid var(--accent-primary);
        color: var(--text-primary);
        padding: 0;
    }

    .note-title-input:focus {
        outline: none;
    }

    .note-actions {
        display: flex;
        gap: 0.5rem;
    }

    .action-btn {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--border-primary);
        background: var(--bg-secondary);
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.2s;
    }

    .action-btn:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
        transform: translateY(-2px);
    }

    .action-btn.save {
        color: var(--accent-success);
        border-color: var(--accent-success);
    }
    .action-btn.delete:hover {
        color: var(--accent-danger);
        border-color: var(--accent-danger);
    }

    .note-body {
        flex: 1;
        font-size: 1.125rem;
        line-height: 1.7;
        color: var(--text-primary);
        padding-bottom: 2rem;
    }

    .note-display {
        white-space: pre-wrap;
    }

    .note-editor {
        width: 100%;
        height: 100%;
        min-height: 400px;
        background: transparent;
        border: none;
        resize: none;
        color: var(--text-primary);
        font-family: inherit;
        font-size: inherit;
        line-height: inherit;
    }

    .note-editor:focus {
        outline: none;
    }

    .note-footer {
        padding-top: 1.5rem;
        border-top: 1px solid var(--border-primary);
        font-size: 0.8rem;
        color: var(--text-muted);
        text-align: right;
        flex-shrink: 0;
    }

    /* Dashboard Overview Styles */
    .dashboard-overview {
        padding: 2rem;
        display: flex;
        flex-direction: column;
        gap: 3rem;
        max-width: 1200px;
        overflow-y: auto;
        min-height: 0;
        flex: 1;
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1.5rem;
        margin-bottom: 0.5rem;
    }

    .section-heading {
        font-size: 1.25rem;
        font-weight: 800;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin: 0;
    }

    .heading-sub {
        opacity: 0.4;
        font-weight: 500;
    }

    .res-count {
        font-size: 0.8rem;
        background: var(--bg-secondary);
        padding: 0.25rem 0.625rem;
        border-radius: 99px;
        opacity: 0.6;
    }

    .note-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1.25rem;
    }

    .note-card {
        background: var(--card-bg);
        border: 1px solid var(--border-primary);
        border-radius: 16px;
        padding: 1.25rem;
        text-align: left;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    .note-card:hover {
        transform: translateY(-4px) scale(1.01);
        border-color: var(--accent-primary);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .card-category {
        font-size: 0.7rem;
        font-weight: 800;
        text-transform: uppercase;
        color: var(--accent-primary);
        background: rgba(var(--accent-primary-rgb, 59, 130, 246), 0.1);
        padding: 0.125rem 0.5rem;
        border-radius: 4px;
    }

    .card-date {
        font-size: 0.75rem;
        color: var(--text-muted);
    }

    .card-title {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--text-primary);
    }

    .card-excerpt {
        margin: 0;
        font-size: 0.9rem;
        color: var(--text-secondary);
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        line-height: 1.5;
    }

    .note-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .note-list-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-primary);
        border-radius: 12px;
        width: 100%;
        padding: 0.75rem 1rem;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
    }

    .note-list-card:hover {
        background: var(--bg-tertiary);
        border-color: var(--accent-primary);
    }

    .list-card-content {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .list-card-icon {
        color: var(--text-muted);
        opacity: 0.5;
    }

    .list-card-info {
        flex: 1;
    }

    .list-card-title {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .list-card-meta {
        font-size: 0.8rem;
        color: var(--text-muted);
    }

    .list-card-date {
        font-size: 0.85rem;
        color: var(--text-muted);
    }

    .empty-results {
        text-align: center;
        padding: 3rem;
        background: var(--bg-secondary);
        border-radius: 16px;
        color: var(--text-muted);
    }

    .empty-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.3;
    }

    /* Modal Layout & Form Grid */
    .srpg-modal-container {
        display: flex;
        flex-direction: column;
        max-height: 85vh;
        overflow: hidden;
    }

    .srpg-modal-header {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        padding: 1.5rem 2rem;
        border-bottom: 2px solid var(--border-primary);
        background: var(--modal-bg);
        border-radius: 20px 20px 0 0;
    }

    .srpg-modal-header-icon {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(var(--accent-primary-rgb, 59, 130, 246), 0.1);
        color: var(--accent-primary);
        flex-shrink: 0;
    }

    .srpg-modal-title {
        font-size: 1.375rem;
        font-weight: 800;
        margin: 0;
        line-height: 1.2;
    }

    .srpg-modal-subtitle {
        font-size: 0.875rem;
        color: var(--text-muted);
        margin: 0.25rem 0 0;
    }

    .srpg-modal-body {
        padding: 2rem;
        overflow-y: auto;
        flex: 1;
    }

    .srpg-modal-footer {
        padding: 1.5rem 2rem;
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        border-top: 2px solid var(--border-primary);
        background: var(--bg-secondary);
        border-radius: 0 0 20px 20px;
    }

    .srpg-form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.25rem;
    }

    .full-width {
        grid-column: span 2;
    }

    .custom-group-section {
        background: rgba(var(--accent-primary-rgb, 59, 130, 246), 0.05);
        padding: 1rem;
        border-radius: 12px;
        border: 1px dashed var(--accent-primary);
    }

    .srpg-input-group {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.5rem;
    }

    .srpg-input-group input {
        flex: 1;
        background: var(--input-bg);
        border: 1px solid var(--border-primary);
        color: var(--text-primary);
        padding: 0.5rem 0.75rem;
        border-radius: 8px;
    }

    .optional {
        font-size: 0.75rem;
        color: var(--text-muted);
        font-weight: normal;
    }

    @media (max-width: 768px) {
        .codex-dashboard {
            flex-direction: column;
            height: calc(100vh - 70px - env(safe-area-inset-bottom));
            height: calc(100dvh - 70px - env(safe-area-inset-bottom));
        }

        .codex-sidebar {
            width: 100%;
            height: auto;
            border-right: none;
            border-bottom: 1px solid var(--border-primary);
            padding: 0.75rem;
            gap: 0.75rem;
            background: var(--bg-primary);
            z-index: 10;
        }

        .sidebar-header {
            display: none; /* Hide header on mobile to save space */
        }

        .search-box {
            margin-bottom: 0.25rem;
        }

        .sidebar-nav {
            flex-direction: row;
            overflow-x: auto;
            overflow-y: hidden;
            padding: 0.25rem 0.125rem 0.5rem;
            gap: 0.5rem;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
        }

        .sidebar-nav::-webkit-scrollbar {
            display: none;
        }

        .nav-item {
            width: auto;
            white-space: nowrap;
            padding: 0.5rem 0.875rem;
            background: var(--bg-secondary);
            border: 1px solid var(--border-primary);
            flex-shrink: 0;
        }

        .nav-item.active {
            background: var(--bg-tertiary);
            border-color: var(--accent-primary);
        }

        .nav-group-wrapper {
            flex-direction: row;
            flex-shrink: 0;
        }

        .nav-subgroups {
            display: none; /* Subgroups are too deep for mobile horizontal nav */
        }

        .nav-count {
            display: none; /* Hide count on mobile chips to keep them small */
        }

        .codex-main {
            height: calc(100% - 130px); /* Account for mobile sidebar height */
        }

        .note-view-container {
            padding: 1rem;
            overflow-x: hidden;
        }

        .note-title {
            font-size: 1.5rem;
        }

        .note-title-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
        }

        .note-title-input {
            width: 100%;
            font-size: 1.5rem;
            min-width: 0;
        }

        .note-actions {
            align-self: flex-end;
        }

        .srpg-modal-header {
            padding: 1.25rem 1.5rem;
        }

        .srpg-modal-body {
            padding: 1.5rem;
        }

        .srpg-modal-footer {
            padding: 1.125rem 1.25rem;
        }

        .srpg-form-grid {
            grid-template-columns: 1fr;
        }

        .full-width {
            grid-column: span 1;
        }

        .section-header {
            flex-direction: column;
            gap: 1rem;
        }

        .section-header .srpg-b {
            width: 100%;
        }
    }
</style>
