<script lang="ts">
    import { activeCampaign } from "../../game-management/campaign-store";
    import { loadCharacters, saveCharacters } from "../../data/storage-utils";
    import type { Character } from "../../data/storage-utils";
    import CharacterSheet from "./CharacterSheet.svelte";
    import SrpgModal from "../../shared/modal/SrpgModal.svelte";

    import { createEventDispatcher } from "svelte";
    import SectionPickerModal from "./SectionPickerModal.svelte";
    import TagPickerModal from "./TagPickerModal.svelte";
    import SrpgListPage from "../../shared/layout/SrpgListPage.svelte";

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
                c.tags.forEach((tag) => tags.add(tag));
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
            abilityCheckDice: "1d20", // Default dice formula for ability checks
            skillCheckDice: "1d20", // Default dice formula for skill checks
            visibleSections: ["information"], // Default to only showing information section
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        const allCharacters = loadCharacters();
        allCharacters.push(newCharacter);
        saveCharacters(allCharacters);

        loadCampaignCharacters();
        isEditing = false;
        showCreateModal = false;
    }

    function selectCharacter(character: Character) {
        selectedCharacter = character;
        isEditing = false;
        isEditingSections = false;
        dispatch("characterSelected", {
            character,
            isEditing,
            isEditingSections,
            selectedSections,
            visibleSections: character.visibleSections || ["information"],
        });
    }

    function saveCharacter(event: CustomEvent<Character>) {
        const updatedCharacter = event.detail;
        const allCharacters = loadCharacters();
        const index = allCharacters.findIndex((c) => c.id === updatedCharacter.id);

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
        loadCampaignCharacters();
    }

    function handleRollCheck(event: CustomEvent) {
        // Forward the rollCheck event to the parent (StoryView or SoloRPG)
        dispatch("rollCheck", {
            ...event.detail,
            characterId: selectedCharacter?.id,
            characterName: selectedCharacter?.name,
        });
    }

    function deleteCharacter() {
        if (!selectedCharacter) return;

        const confirmed = confirm(
            `Are you sure you want to delete ${selectedCharacter.name}? This cannot be undone.`
        );
        if (!confirmed) return;

        const allCharacters = loadCharacters();
        const filtered = allCharacters.filter((c) => c.id !== selectedCharacter!.id);
        saveCharacters(filtered);

        loadCampaignCharacters();
        selectedCharacter = null;
        isEditing = false;
        isEditingSections = false;
    }

    function backToList() {
        // If editing, confirm before discarding changes
        if (isEditing) {
            const confirmed = confirm(
                `You have unsaved changes to ${selectedCharacter?.name}. Are you sure you want to leave? All unsaved changes will be lost.`
            );
            if (!confirmed) {
                return;
            }
        }

        selectedCharacter = null;
        isEditing = false;
        isEditingSections = false;
        dispatch("characterDeselected");
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
            dispatch("characterSelected", {
                character: selectedCharacter,
                isEditing,
                isEditingSections,
                selectedSections,
                visibleSections: selectedCharacter.visibleSections || ["information"],
            });
        }
    }

    // Expose method to be called from parent
    export function toggleSectionFromExternal(section: string) {
        handleToggleSection({ detail: section } as CustomEvent<string>);
    }

    // Expose method to reset view back to character list
    export function resetToList() {
        backToList();
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
            selectedCharacter.visibleSections = [...selectedCharacter.visibleSections, sectionId];

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
            const index = allCharacters.findIndex((c) => c.id === selectedCharacter.id);
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

<SrpgListPage className="character-manager">
    <div slot="header">
        {#if selectedCharacter && !isEditing}
            <div
                class="mb-2 flex w-full shrink-0 flex-row flex-wrap items-center justify-between gap-4">
                <button
                    class="border-button-simple-border bg-button-simple-bg text-button-simple-text hover:bg-button-simple-hover-bg hover:border-button-simple-hover-border active:bg-button-simple-bg flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-sm"
                    on:click={backToList}>
                    ←
                </button>
                <h3>{selectedCharacter.name}</h3>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
                    <button
                        id="edit-tags-button"
                        class="border-border-primary bg-accent-primary hover:bg-accent-primary-hover active:bg-accent-primary-active flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
                        style="padding: 0.5rem; display: flex; align-items: center;"
                        on:click={openTagPickerModal}
                        aria-label="Edit Tags"
                        title="Edit Tags">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="1.5em"
                            height="1.5em">
                            <path
                                fill="currentColor"
                                d="M5.5 7A1.5 1.5 0 0 1 4 5.5A1.5 1.5 0 0 1 5.5 4A1.5 1.5 0 0 1 7 5.5A1.5 1.5 0 0 1 5.5 7m15.91 4.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.11 0-2 .89-2 2v7c0 .55.22 1.05.59 1.41l8.99 9c.37.36.87.59 1.42.59s1.05-.23 1.41-.59l7-7c.37-.36.59-.86.59-1.41c0-.56-.23-1.06-.59-1.42" />
                        </svg>
                    </button>
                    <button
                        id="edit-sections-button"
                        class="border-border-primary bg-accent-primary hover:bg-accent-primary-hover active:bg-accent-primary-active flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
                        style="padding: 0.5rem; display: flex; align-items: center;"
                        on:click={openSectionPickerModal}
                        aria-label="Edit Sections"
                        title="Edit Sections">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="1.5em"
                            height="1.5em">
                            <path
                                fill="currentColor"
                                d="M2.5 7a4.5 4.5 0 1 0 9 0a4.5 4.5 0 0 0-9 0m0 10a4.5 4.5 0 1 0 9 0a4.5 4.5 0 0 0-9 0m10 0a4.5 4.5 0 1 0 9 0a4.5 4.5 0 0 0-9 0m-3-10a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0m0 10a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0m10 0a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0M16 11V8h-3V6h3V3h2v3h3v2h-3v3z" />
                        </svg>
                    </button>
                </div>
            </div>
        {:else}
            <div class="srpg-header-actions">
                <button
                    class="border-border-primary bg-accent-success hover:bg-accent-success-hover active:bg-accent-success-active flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
                    on:click={openCreateModal}>
                    + Create Character
                </button>
            </div>

            {#if availableTags.length > 1}
                <div
                    class="bg-bg-secondary border-border-primary relative mb-6 flex shrink-0 items-center gap-2 rounded-lg border p-4 max-[480px]:mb-2 max-[480px]:p-3">
                    <button
                        class="bg-card-bg border-border-primary text-text-secondary hover:border-accent-primary hover:bg-bg-tertiary hover:text-accent-primary flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 p-0 text-xl leading-none font-bold transition-all duration-200 active:scale-95 max-[480px]:hidden"
                        on:click={(e) => {
                            const container =
                                e.currentTarget.parentElement.querySelector(".filter-buttons");
                            container.scrollBy({ left: -200, behavior: "smooth" });
                        }}
                        aria-label="Scroll left">
                        ←
                    </button>
                    <div
                        class="filter-buttons max-[480px]:scrollbar-default scrollbar-thin scrollbar-track-bg-secondary scrollbar-thumb-border-secondary hover:scrollbar-thumb-text-muted flex flex-1 flex-nowrap gap-2 overflow-x-auto overflow-y-hidden scroll-smooth pb-1 max-[480px]:max-h-[calc(2.5rem*2+0.5rem)] max-[480px]:flex-wrap max-[480px]:overflow-y-auto">
                        <button
                            class="bg-card-bg border-border-primary text-text-secondary hover:border-accent-primary hover:bg-bg-tertiary cursor-pointer rounded-md border-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 max-sm:px-3 max-sm:py-2 max-sm:text-[0.8125rem] {selectedTagFilter ===
                            'All'
                                ? 'from-accent-primary to-accent-info text-text-inverse border-accent-primary bg-linear-to-br shadow-md'
                                : ''}"
                            class:active={selectedTagFilter === "All"}
                            on:click={() => (selectedTagFilter = "All")}>
                            All ({characters.length})
                        </button>
                        {#each availableTags as tag}
                            {@const count =
                                tag === "No Tags"
                                    ? characters.filter((c) => !c.tags || c.tags.length === 0)
                                          .length
                                    : characters.filter((c) => c.tags && c.tags.includes(tag))
                                          .length}
                            {#if count > 0}
                                <button
                                    class="bg-card-bg border-border-primary text-text-secondary hover:border-accent-primary hover:bg-bg-tertiary cursor-pointer rounded-md border-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 max-sm:px-3 max-sm:py-2 max-sm:text-[0.8125rem] {selectedTagFilter ===
                                    tag
                                        ? 'from-accent-primary to-accent-info text-text-inverse border-accent-primary bg-linear-to-br shadow-md'
                                        : ''}"
                                    class:active={selectedTagFilter === tag}
                                    on:click={() => (selectedTagFilter = tag)}>
                                    {tag} ({count})
                                </button>
                            {/if}
                        {/each}
                    </div>
                    <button
                        class="bg-card-bg border-border-primary text-text-secondary hover:border-accent-primary hover:bg-bg-tertiary hover:text-accent-primary flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 p-0 text-xl leading-none font-bold transition-all duration-200 active:scale-95 max-[480px]:hidden"
                        on:click={(e) => {
                            const container =
                                e.currentTarget.parentElement.querySelector(".filter-buttons");
                            container.scrollBy({ left: 200, behavior: "smooth" });
                        }}
                        aria-label="Scroll right">
                        →
                    </button>
                </div>
            {/if}
        {/if}
    </div>

    {#if selectedCharacter}
        <CharacterSheet
            character={selectedCharacter}
            {isEditing}
            {isEditingSections}
            {selectedSections}
            on:save={saveCharacter}
            on:cancel={cancelEdit}
            on:rollCheck={handleRollCheck} />
    {:else if filteredCharacters.length > 0}
        <div class="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 py-2">
            {#each filteredCharacters as character}
                <button
                    class="bg-card-bg border-border-primary font-inherit hover:border-accent-primary flex min-h-[120px] w-full cursor-pointer flex-col items-center rounded-lg border-2 p-6 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    on:click={() => selectCharacter(character)}>
                    <h3
                        class="text-text-primary m-0 flex flex-wrap items-center justify-center gap-2 text-xl">
                        {character.name}
                    </h3>
                    <div class="character-summary">
                        {#if character.race || character.class}
                            <p class="text-text-muted my-1 text-center text-sm">
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
                            <p class="border-border-primary mt-2 border-t pt-2">
                                <span class="text-text-primary font-semibold">
                                    HP: {character.currentHitPoints} / {character.hitPointMaximum}
                                </span>
                            </p>
                        {/if}
                    </div>
                    {#if character.tags && character.tags.length > 0}
                        <div class="mt-2 flex flex-wrap justify-center gap-1">
                            {#each character.tags as tag}
                                <span
                                    class="bg-bg-secondary text-text-secondary border-border-primary inline-block rounded border px-2 py-0.5 text-xs">
                                    {tag}
                                </span>
                            {/each}
                        </div>
                    {/if}
                </button>
            {/each}
        </div>
    {:else}
        <div class="text-text-muted px-4 py-12 text-center">
            <p class="my-2">No characters created yet.</p>
            <p class="text-sm italic">
                Create a character to start tracking their stats and abilities.
            </p>
        </div>
    {/if}
</SrpgListPage>

<SrpgModal bind:show={showCreateModal} maxWidth="400px" on:close={() => (showCreateModal = false)}>
    <div class="p-0">
        <h2 class="text-text-primary mt-0 mb-4">New Character</h2>
        <label class="text-text-secondary mt-0 mb-2 block font-semibold" for="characterName">
            Character Name *
        </label>
        <input
            class="border-input-border bg-input-bg text-input-text focus:border-input-border-focus w-full rounded border p-2 focus:outline-none"
            type="text"
            id="characterName"
            bind:value={newCharacterName}
            placeholder="Enter character name"
            on:keypress={(e) => e.key === "Enter" && createCharacter()} />

        <div class="mt-6 flex justify-end gap-2">
            <button
                class="border-border-primary bg-accent-success hover:bg-accent-success-hover active:bg-accent-success-active flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
                on:click={createCharacter}
                disabled={!newCharacterName.trim()}>
                Create
            </button>
            <button
                class="border-border-primary flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium shadow-md transition-all duration-200"
                on:click={() => (showCreateModal = false)}>
                Cancel
            </button>
        </div>
    </div>
</SrpgModal>

<SectionPickerModal
    bind:show={showSectionPickerModal}
    selectedSections={selectedCharacter?.visibleSections || ["information"]}
    on:change={(e) => {
        if (selectedCharacter) {
            selectedCharacter.visibleSections = e.detail;
            selectedCharacter = selectedCharacter;
            dispatch("characterSelected", {
                character: selectedCharacter,
                isEditing,
                isEditingSections,
                selectedSections,
                visibleSections: e.detail,
            });
        }
    }}
    on:save={(e) => handleSectionPickerSave(e.detail)}
    on:close={() => (showSectionPickerModal = false)} />

<TagPickerModal
    bind:show={showTagPickerModal}
    selectedTags={selectedCharacter?.tags || []}
    availableTags={availableTags.filter((t) => t !== "No Tags")}
    on:change={(e) => {
        if (selectedCharacter) {
            selectedCharacter.tags = e.detail;
            selectedCharacter = selectedCharacter;
        }
    }}
    on:newTag={handleNewTag}
    on:save={(e) => handleTagPickerSave(e.detail)}
    on:close={() => (showTagPickerModal = false)} />
