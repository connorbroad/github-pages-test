<script lang="ts">
    import { activeCampaign } from "../../game-management/campaign-store";
    import {
        loadCharacters,
        saveCharacters,
        loadActiveCharacterId,
        saveActiveCharacterId,
    } from "../../data/storage-utils";
    import type { Character } from "../../data/storage-utils";
    import CharacterSheet from "./CharacterSheet.svelte";
    import SrpgModal from "../../shared/modal/SrpgModal.svelte";
    import "../../solo-rpg-styles.css";
    import { createEventDispatcher } from "svelte";
    import SectionPickerModal from "./SectionPickerModal.svelte";
    import TagPickerModal from "./TagPickerModal.svelte";

    const dispatch = createEventDispatcher();

    let characters: Character[] = [];
    let selectedCharacter: Character | null = null;
    let isEditing: boolean = false;
    let isEditingSections: boolean = false;
    let showCreateModal: boolean = false;
    let newCharacterName: string = "";
    let selectedTagFilter: string = "All";
    let selectedSections: Set<string> = new Set(); // For filtering visible sections in view mode
    let showSectionPickerModal: boolean = false;
    let showTagPickerModal: boolean = false;

    $: if ($activeCampaign) {
        loadCampaignCharacters();
    }

    // Get all unique tags from all characters
    $: availableTags = getAvailableTags(characters);

    // Filter characters by selected tag
    $: filteredCharacters =
        selectedTagFilter === "All"
            ? characters
            : selectedTagFilter === "No Tags"
              ? characters.filter((c) => !c.tags || c.tags.length === 0)
              : characters.filter((c) => c.tags && c.tags.includes(selectedTagFilter));

    function getAvailableTags(chars: Character[]): string[] {
        const tags = new Set<string>();
        let hasNoTags = false;

        chars.forEach((c) => {
            if (c.tags && c.tags.length > 0) {
                c.tags.forEach(tag => tags.add(tag));
            } else {
                hasNoTags = true;
            }
        });

        const tagArray = Array.from(tags).sort();
        if (hasNoTags) {
            tagArray.push("No Tags");
        }
        return tagArray;
    }

    function loadCampaignCharacters() {
        if (!$activeCampaign) return;

        const allCharacters = loadCharacters();
        characters = allCharacters
            .filter((c) => c.campaignId === $activeCampaign.id)
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    function openCreateModal() {
        newCharacterName = "";
        showCreateModal = true;
    }

    function createCharacter() {
        if (!$activeCampaign || !newCharacterName.trim()) return;

        const newCharacter: Character = {
            id: `char-${Date.now()}`,
            campaignId: $activeCampaign.id,
            name: newCharacterName.trim(),
            tags: [],
            abilities: [],
            skills: [],
            visibleSections: ["information"], // Default to only showing information section
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        const allCharacters = loadCharacters();
        allCharacters.push(newCharacter);
        saveCharacters(allCharacters);

        loadCampaignCharacters();
        selectedCharacter = newCharacter;
        isEditing = true;
        showCreateModal = false;
    }

    function selectCharacter(character: Character) {
        selectedCharacter = character;
        isEditing = false;
        isEditingSections = false;
        dispatch('characterSelected', {
            character,
            isEditing,
            isEditingSections,
            selectedSections,
            visibleSections: character.visibleSections || ["information"]
        });
    }

    function editCharacter() {
        isEditing = true;
        isEditingSections = false;
        dispatch('characterSelected', {
            character: selectedCharacter,
            isEditing,
            isEditingSections,
            selectedSections,
            visibleSections: selectedCharacter?.visibleSections || ["information"]
        });
    }

    function editCharacterSections() {
        isEditingSections = !isEditingSections;
        dispatch('characterSelected', {
            character: selectedCharacter,
            isEditing,
            isEditingSections,
            selectedSections,
            visibleSections: selectedCharacter?.visibleSections || ["information"]
        });
    }

    function saveCharacter(event: CustomEvent<Character>) {
        const updatedCharacter = event.detail;
        const allCharacters = loadCharacters();
        const index = allCharacters.findIndex(
            (c) => c.id === updatedCharacter.id,
        );

        if (index !== -1) {
            allCharacters[index] = updatedCharacter;
            saveCharacters(allCharacters);
            loadCampaignCharacters();
            selectedCharacter = updatedCharacter;
            isEditing = false;
            isEditingSections = false;
        }
    }

    function cancelEdit() {
        isEditing = false;
        isEditingSections = false;
        // Reload to reset any changes
        if (selectedCharacter) {
            const allCharacters = loadCharacters();
            const character = allCharacters.find(
                (c) => c.id === selectedCharacter!.id,
            );
            if (character) {
                selectedCharacter = character;
            }
        }
    }

    function deleteCharacter() {
        if (!selectedCharacter) return;

        const confirmed = confirm(
            `Are you sure you want to delete ${selectedCharacter.name}? This cannot be undone.`,
        );
        if (!confirmed) return;

        const allCharacters = loadCharacters();
        const filtered = allCharacters.filter(
            (c) => c.id !== selectedCharacter!.id,
        );
        saveCharacters(filtered);

        loadCampaignCharacters();
        selectedCharacter = null;
        isEditing = false;
        isEditingSections = false;
    }

    function backToList() {
        selectedCharacter = null;
        isEditing = false;
        isEditingSections = false;
        dispatch('characterDeselected');
    }

    function handleToggleSection(event: CustomEvent<string>) {
        const section = event.detail;
        
        if (isEditingSections) {
            // In edit mode, toggle the section's inclusion in the character sheet
            toggleSectionInclusion(section);
        } else {
            // In view mode, use for filtering
            if (selectedSections.has(section)) {
                // Tapping on the same icon again clears the filter (shows all)
                selectedSections.delete(section);
            } else {
                // Switch to only this section
                selectedSections.clear();
                selectedSections.add(section);
            }
            // Trigger reactivity
            selectedSections = selectedSections;
        }

        // Emit updated state
        if (selectedCharacter) {
            dispatch('characterSelected', {
                character: selectedCharacter,
                isEditing,
                isEditingSections,
                selectedSections,
                visibleSections: selectedCharacter.visibleSections || ["information"]
            });
        }
    }

    // Expose method to be called from parent
    export function toggleSectionFromExternal(section: string) {
        handleToggleSection({ detail: section } as CustomEvent<string>);
    }

    function toggleSectionInclusion(sectionId: string) {
        if (!selectedCharacter) return;
        
        if (sectionId === "information") {
            alert("The Information section cannot be removed.");
            return;
        }

        if (!selectedCharacter.visibleSections) {
            selectedCharacter.visibleSections = ["information"];
        }

        if (!selectedCharacter.visibleSections.includes("information")) {
            selectedCharacter.visibleSections.push("information");
        }

        const isCurrentlyVisible = selectedCharacter.visibleSections.includes(sectionId);

        if (isCurrentlyVisible) {
            selectedCharacter.visibleSections = selectedCharacter.visibleSections.filter(
                (s) => s !== sectionId
            );
        } else {
            selectedCharacter.visibleSections = [
                ...selectedCharacter.visibleSections,
                sectionId,
            ];

            // Scroll to the newly enabled section after a brief delay to allow for rendering
            setTimeout(() => {
                const sectionElement = document.getElementById(`section-${sectionId}`);
                if (sectionElement) {
                    sectionElement.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    });
                }
            }, 100);
        }
        
        // Update character immediately (auto-save when editing sections)
        if (isEditingSections) {
            selectedCharacter.updatedAt = Date.now();
            const allCharacters = loadCharacters();
            const index = allCharacters.findIndex(
                (c) => c.id === selectedCharacter.id,
            );
            if (index !== -1) {
                allCharacters[index] = selectedCharacter;
                saveCharacters(allCharacters);
                loadCampaignCharacters();
            }
        }
        
        // Trigger reactivity
        selectedCharacter = selectedCharacter;
    }

    function openSectionPickerModal() {
        showSectionPickerModal = true;
    }

    function handleSectionPickerSave(newSections: string[]) {
        if (selectedCharacter) {
            selectedCharacter.visibleSections = newSections;
            selectedCharacter.updatedAt = Date.now();
            const allCharacters = loadCharacters();
            const index = allCharacters.findIndex((c) => c.id === selectedCharacter.id);
            if (index !== -1) {
                allCharacters[index] = selectedCharacter;
                saveCharacters(allCharacters);
                loadCampaignCharacters();
            }
            selectedCharacter = selectedCharacter; // ensure reactivity
        }
        showSectionPickerModal = false;
    }

    function openTagPickerModal() {
        showTagPickerModal = true;
    }

    function handleTagPickerSave(newTags: string[]) {
        if (selectedCharacter) {
            selectedCharacter.tags = newTags;
            selectedCharacter.updatedAt = Date.now();
            const allCharacters = loadCharacters();
            const index = allCharacters.findIndex((c) => c.id === selectedCharacter.id);
            if (index !== -1) {
                allCharacters[index] = selectedCharacter;
                saveCharacters(allCharacters);
                loadCampaignCharacters();
            }
            selectedCharacter = selectedCharacter; // ensure reactivity
        }
        showTagPickerModal = false;
    }

    function handleNewTag(event: CustomEvent<string>) {
        // New tag added, trigger reactivity to update availableTags
        characters = characters;
    }
</script>

<div class="character-manager">
    {#if selectedCharacter}
        <div class="character-view">
            {#if !isEditing}
                <div class="view-header">
                    <button class="srpg-b srpg-b-simple" on:click={backToList}>
                        ←
                    </button>

                    <h3>{selectedCharacter.name}</h3>

                    <div
                        style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;"
                    >
                        <button
                            id="edit-tags-button"
                            class="srpg-b srpg-b-normal"
                            style="padding: 0.5rem; display: flex; align-items: center;"
                            on:click={openTagPickerModal}
                            aria-label="Edit Tags"
                            title="Edit Tags"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="1.5em"
                                height="1.5em"
                            >
                                <path
                                    fill="currentColor"
                                    d="M5.5 7A1.5 1.5 0 0 1 4 5.5A1.5 1.5 0 0 1 5.5 4A1.5 1.5 0 0 1 7 5.5A1.5 1.5 0 0 1 5.5 7m15.91 4.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.11 0-2 .89-2 2v7c0 .55.22 1.05.59 1.41l8.99 9c.37.36.87.59 1.42.59s1.05-.23 1.41-.59l7-7c.37-.36.59-.86.59-1.41c0-.56-.23-1.06-.59-1.42"
                                />
                            </svg>
                        </button>
                        <button
                            id="edit-sections-button"
                            class="srpg-b srpg-b-normal"
                            style="padding: 0.5rem; display: flex; align-items: center;"
                            on:click={openSectionPickerModal}
                            aria-label="Edit Sections"
                            title="Edit Sections"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="1.5em"
                                height="1.5em"
                            >
                                <path
                                    fill="currentColor"
                                    d="M2.5 7a4.5 4.5 0 1 0 9 0a4.5 4.5 0 0 0-9 0m0 10a4.5 4.5 0 1 0 9 0a4.5 4.5 0 0 0-9 0m10 0a4.5 4.5 0 1 0 9 0a4.5 4.5 0 0 0-9 0m-3-10a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0m0 10a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0m10 0a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0M16 11V8h-3V6h3V3h2v3h3v2h-3v3z"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            {/if}

            <div class="character-sheet-container">
                <CharacterSheet
                    character={selectedCharacter}
                    {isEditing}
                    {isEditingSections}
                    {selectedSections}
                    on:save={saveCharacter}
                    on:cancel={cancelEdit}
                />

                <br />

                {#if isEditing}
                    <button
                        class="srpg-b srpg-b-sm srpg-b-w-full srpg-b-danger"
                        on:click={deleteCharacter}
                        aria-label="Delete Character"
                    >
                        Delete character
                    </button>
                {/if}
            </div>
        </div>
    {:else}
        <div class="character-list-view">
            <div class="list-header">
                <button class="srpg-b srpg-b-create" on:click={openCreateModal}>
                    + Create Character
                </button>
            </div>

            {#if availableTags.length > 1}
                <div class="group-filter">
                    <button 
                        class="scroll-btn scroll-btn-left" 
                        on:click={(e) => {
                            const container = e.currentTarget.parentElement.querySelector('.filter-buttons');
                            container.scrollBy({ left: -200, behavior: 'smooth' });
                        }}
                        aria-label="Scroll left"
                    >
                        ←
                    </button>
                    <div class="filter-buttons">
                        <button
                            class="filter-btn"
                            class:active={selectedTagFilter === "All"}
                            on:click={() => (selectedTagFilter = "All")}
                        >
                            All ({characters.length})
                        </button>
                        {#each availableTags as tag}
                            {@const count =
                                tag === "No Tags"
                                    ? characters.filter((c) => !c.tags || c.tags.length === 0).length
                                    : characters.filter(
                                          (c) => c.tags && c.tags.includes(tag),
                                      ).length}
                            {#if count > 0}
                                <button
                                    class="filter-btn"
                                    class:active={selectedTagFilter === tag}
                                    on:click={() =>
                                        (selectedTagFilter = tag)}
                                >
                                    {tag} ({count})
                                </button>
                            {/if}
                        {/each}
                    </div>
                    <button 
                        class="scroll-btn scroll-btn-right" 
                        on:click={(e) => {
                            const container = e.currentTarget.parentElement.querySelector('.filter-buttons');
                            container.scrollBy({ left: 200, behavior: 'smooth' });
                        }}
                        aria-label="Scroll right"
                    >
                        →
                    </button>
                </div>
            {/if}

            <div class="character-list-scroll">
                {#if filteredCharacters.length > 0}
                    <div class="character-list">
                    {#each filteredCharacters as character}
                        <button
                            class="srpg-b srpg-b-overview character-card"
                            on:click={() => selectCharacter(character)}
                        >
                            <h3 class="character-title">
                                {character.name}
                            </h3>
                            <div class="character-summary">
                                {#if character.race || character.class}
                                    <p>
                                        {#if character.race}{character.race}{/if}
                                        {#if character.race && character.class}
                                            •
                                        {/if}
                                        {#if character.class}{character.class}{/if}
                                        {#if character.level}
                                            (Level {character.level})
                                        {/if}
                                    </p>
                                {/if}
                                {#if character.currentHitPoints !== undefined && character.hitPointMaximum}
                                    <p class="hp-bar">
                                        <span
                                            >HP: {character.currentHitPoints} / {character.hitPointMaximum}</span
                                        >
                                    </p>
                                {/if}
                            </div>
                            {#if character.tags && character.tags.length > 0}
                                <div class="tag-list">
                                    {#each character.tags as tag}
                                        <span class="tag-badge">{tag}</span>
                                    {/each}
                                </div>
                            {/if}
                        </button>
                    {/each}
                </div>
            {:else}
                <div class="empty-state">
                    <p>No characters created yet.</p>
                    <p class="hint">
                        Create a character to start tracking their stats and
                        abilities.
                    </p>
                </div>
            {/if}
            </div>
        </div>
    {/if}
</div>

<SrpgModal
    bind:show={showCreateModal}
    maxWidth="400px"
    on:close={() => (showCreateModal = false)}
>
    <div class="modal-content">
        <h2>New Character</h2>
        <label for="characterName">Character Name *</label>
        <input
            type="text"
            id="characterName"
            bind:value={newCharacterName}
            placeholder="Enter character name"
            on:keypress={(e) =>
                e.key === "Enter" && createCharacter()}
        />

        <div class="modal-footer">
            <button
                class="srpg-b srpg-b-create srpg-b-w-full"
                on:click={createCharacter}
                disabled={!newCharacterName.trim()}
            >
                Create
            </button>
            <button class="srpg-b" on:click={() => (showCreateModal = false)}>
                Cancel
            </button>
        </div>
    </div>
</SrpgModal>

<SectionPickerModal
    bind:show={showSectionPickerModal}
    selectedSections={selectedCharacter?.visibleSections || ["information"]}
    on:change={e => {
        if (selectedCharacter) {
            selectedCharacter.visibleSections = e.detail;
            selectedCharacter = selectedCharacter;
            dispatch('characterSelected', {
                character: selectedCharacter,
                isEditing,
                isEditingSections,
                selectedSections,
                visibleSections: e.detail
            });
        }
    }}
    on:save={e => handleSectionPickerSave(e.detail)}
    on:close={() => (showSectionPickerModal = false)}
/>

<TagPickerModal
    bind:show={showTagPickerModal}
    selectedTags={selectedCharacter?.tags || []}
    availableTags={availableTags.filter(t => t !== "No Tags")}
    on:change={e => {
        if (selectedCharacter) {
            selectedCharacter.tags = e.detail;
            selectedCharacter = selectedCharacter;
        }
    }}
    on:newTag={handleNewTag}
    on:save={e => handleTagPickerSave(e.detail)}
    on:close={() => (showTagPickerModal = false)}
/>

<style>
    .character-manager {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .character-view {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
    }

    .character-sheet-container {
        flex: 1; 
        min-height: 0;
    }

    .character-list-view {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
    }

    .character-list-scroll {
        flex: 1;
        overflow-y: auto;
        min-height: 0;
        padding-top: 0.2rem;
    }

    @media (min-width: 768px) {
        .character-manager {
            padding-bottom: 0;
        }

        .character-sheet-container {
            padding-bottom: 0;
        }
    }

    .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        flex-shrink: 0;
    }

    .group-filter {
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: var(--bg-secondary);
        border-radius: 8px;
        border: 1px solid var(--border-primary);
        flex-shrink: 0;
        position: relative;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .filter-buttons {
        display: flex;
        gap: 0.5rem;
        flex-wrap: nowrap; /* Don't wrap on desktop - scroll horizontally instead */
        overflow-x: auto;
        overflow-y: hidden;
        flex: 1;
        /* Smooth scrolling for touch devices */
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
        /* Hide scrollbar for cleaner look on desktop */
        scrollbar-width: thin;
        scrollbar-color: var(--border-secondary) var(--bg-secondary);
        /* Ensure content doesn't get cut off */
        padding-bottom: 0.25rem;
    }

    .filter-buttons::-webkit-scrollbar {
        height: 6px;
    }

    .filter-buttons::-webkit-scrollbar-track {
        background: var(--bg-secondary);
        border-radius: 3px;
    }

    .filter-buttons::-webkit-scrollbar-thumb {
        background: var(--border-secondary);
        border-radius: 3px;
    }

    .filter-buttons::-webkit-scrollbar-thumb:hover {
        background: var(--text-muted);
    }

    .scroll-btn {
        flex-shrink: 0;
        width: 2rem;
        height: 2rem;
        padding: 0;
        background: var(--card-bg);
        border: 2px solid var(--border-primary);
        border-radius: 50%;
        cursor: pointer;
        font-size: 1.25rem;
        font-weight: bold;
        color: var(--text-secondary);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
    }

    .scroll-btn:hover {
        border-color: var(--accent-primary);
        background: var(--bg-tertiary);
        color: var(--accent-primary);
    }

    .scroll-btn:active {
        transform: scale(0.95);
    }

    /* Hide scroll buttons on very small screens where touch scrolling is more natural */
    @media (max-width: 480px) {
        .scroll-btn {
            display: none;
        }

        .group-filter {
            padding: 0.75rem;
            margin-bottom: 0.5rem;
        }

        .filter-buttons {
            /* Show scrollbar on mobile for clarity */
            scrollbar-width: auto;
            /* Allow wrapping on mobile */
            flex-wrap: wrap;
            max-height: calc(2.5rem * 2 + 0.5rem); /* 2 rows max on mobile */
            overflow-y: auto;
        }
    }

    .filter-btn {
        padding: 0.5rem 1rem;
        background: var(--card-bg);
        border: 2px solid var(--border-primary);
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
        transition: all 0.2s ease;
        white-space: nowrap;
    }

    .filter-btn:hover {
        border-color: var(--accent-primary);
        background: var(--bg-tertiary);
    }

    .filter-btn.active {
        background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-info) 100%);
        color: var(--text-inverse);
        border-color: var(--accent-primary);
        box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
    }

    @media (max-width: 640px) {
        .filter-btn { 
            font-size: 0.8125rem;
            padding: 0.5rem 0.75rem;
        }
    }

    .view-header {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
        flex-wrap: wrap;
        gap: 1rem;
        width: 100%;
        flex-shrink: 0;
    }

    /* Add subtle pulse animation when active */
    @keyframes pulse {
        0%,
        100% {
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
        }
        50% {
            box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4);
        }
    }

    .character-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1rem;
    }

    .character-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center; 
        background: var(--card-bg);
        border: 1px solid var(--border-primary);
        border-radius: 8px;
        box-shadow: 0 1px 3px var(--shadow-sm);
        transition: all 0.2s ease;
        width: 100%;
        min-height: 120px;
    }

    .character-title {
        margin: 0 0 0 0;
        color: var(--text-primary);
        font-size: 1.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .character-summary p {
        margin: 0.25rem 0;
        color: var(--text-muted);
        font-size: 0.875rem;
        text-align: center;
    }

    .hp-bar {
        margin-top: 0.5rem;
        padding-top: 0.5rem;
        border-top: 1px solid var(--border-primary);
    }

    .hp-bar span {
        font-weight: 600;
        color: var(--text-primary);
    }

    .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        color: var(--text-muted);
    }

    .empty-state p {
        margin: 0.5rem 0;
    }

    .hint {
        font-size: 0.875rem;
        font-style: italic;
    }

    .modal-content h2 {
        margin-top: 0;
        margin-bottom: 1rem;
        color: var(--text-primary);
    }

    .modal-content label {
        display: block;
        font-weight: 600;
        margin-bottom: 0.5rem;
        margin-top: 1rem;
        color: var(--text-secondary);
    }

    .modal-content label:first-of-type {
        margin-top: 0;
    }

    .modal-content input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid var(--input-border);
        border-radius: 4px;
        font-size: 1rem;
        background: var(--input-bg);
        color: var(--input-text);
    }

    .modal-content button {
        margin-top: 0.75rem;
    }

    .modal-footer {
        margin-top: 1.5rem;
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
    }

    .modal-footer button {
        margin-top: 0;
    }

    .tag-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-content: center;
        margin-top: 0.75rem;
    }

    .tag-badge {
        display: inline-block;
        background: linear-gradient(135deg, var(--accent-success) 0%, var(--accent-success-hover) 100%);
        color: var(--text-inverse);
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.25rem 0.625rem;
        border-radius: 12px;
        letter-spacing: 0.025em;
        box-shadow: 0 1px 2px rgba(16, 185, 129, 0.2);
        white-space: nowrap;
    }
</style>

