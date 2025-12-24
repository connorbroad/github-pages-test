<script lang="ts">
    import { activeCampaign } from "../../game-management/campaign-store";
    import { characterStore } from "../../data/character-store";
    import type { Character } from "../../data/storage-utils";
    import CharacterSheet from "./CharacterSheet.svelte";
    import SrpgModal from "../../shared/modal/SrpgModal.svelte";

    import { onMount } from "svelte";
    import SectionPickerModal from "./SectionPickerModal.svelte";
    import TagPickerModal from "./TagPickerModal.svelte";
    import SrpgListPage from "../../shared/layout/SrpgListPage.svelte";

    export let onCharacterSelected: (detail: any) => void = () => {};
    export let onCharacterDeselected: () => void = () => {};
    export let onRollCheck: (detail: any) => void = () => {};

    const COMPACT_VIEW_KEY = "srpg-characters-compact-view";

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
    let isCompactView: boolean = false;
    let sortBy: "alphabetical" | "createdAt" | "updatedAt" = "alphabetical";
    let showSortDropdown: boolean = false;
    let hasLoadedPreferences: boolean = false;
    let isTagFilterExpanded: boolean = false;

    onMount(() => {
        // Load compact view preference from localStorage
        const saved = localStorage.getItem(COMPACT_VIEW_KEY);
        if (saved !== null) {
            isCompactView = saved === "true";
        }
        hasLoadedPreferences = true;
    });

    // Persist compact view preference (only after initial load)
    $: if (hasLoadedPreferences) {
        localStorage.setItem(COMPACT_VIEW_KEY, String(isCompactView));
    }

    $: if ($activeCampaign && $characterStore) {
        characters = $characterStore
            .filter((c) => c.campaignId === $activeCampaign.id)
            .sort((a, b) => a.name.localeCompare(b.name));

        // If the selected character was updated in the store, update our reference
        if (selectedCharacter) {
            const updated = $characterStore.find((c) => c.id === selectedCharacter!.id);
            if (updated && updated !== selectedCharacter) {
                // Determine if we need to merge or just replace
                // If we are editing, replacing might lose unsaved state?
                // But this comes from the store, so it IS the state.
                // However, `selectedCharacter` here is the View Model.
                // If isEditing is true, we might have unsaved changes in the child component.
                // The child component `CharacterSheet` takes `character` as a prop and copies it to `editedCharacter`.
                // So if we update `selectedCharacter` here, `CharacterSheet` will see a prop change.
                // `CharacterSheet` logic: `$: updatedCharacter = structuredClone(character)` only if !isEditing.
                // So updating `selectedCharacter` is safe for `isEditing=true`.
                selectedCharacter = updated;
            }
        }
    }

    // Get all unique tags from all characters
    $: availableTags = getAvailableTags(characters);

    // Filter characters by selected tag and apply sorting
    $: filteredCharacters = sortCharacters(
        selectedTagFilter === "All"
            ? characters
            : selectedTagFilter === "No Tags"
              ? characters.filter((c) => !c.tags || c.tags.length === 0)
              : characters.filter((c) => c.tags && c.tags.includes(selectedTagFilter)),
        sortBy
    );

    function sortCharacters(
        chars: Character[],
        sort: "alphabetical" | "createdAt" | "updatedAt"
    ): Character[] {
        return [...chars].sort((a, b) => {
            switch (sort) {
                case "alphabetical":
                    return a.name.localeCompare(b.name);
                case "createdAt":
                    return (b.createdAt || 0) - (a.createdAt || 0);
                case "updatedAt":
                    return (b.updatedAt || 0) - (a.updatedAt || 0);
                default:
                    return 0;
            }
        });
    }

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
            abilityCheckDice: "1d20",
            skillCheckDice: "1d20",
            visibleSections: ["information", "health", "abilities", "skills", "items", "combat"], // Default to full view
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        characterStore.add(newCharacter);

        isEditing = false;
        showCreateModal = false;
    }

    function selectCharacter(character: Character) {
        selectedCharacter = character;
        isEditing = false;
        isEditingSections = false;
        onCharacterSelected({
            character,
            isEditing,
            isEditingSections,
            selectedSections,
            visibleSections: character.visibleSections || ["information"],
        });
    }

    function saveCharacter(updatedCharacter: Character) {
        characterStore.updateCharacter(updatedCharacter);
        selectedCharacter = updatedCharacter;
        isEditing = false;
        isEditingSections = false;
    }

    function cancelEdit() {
        isEditing = false;
        // No need to reload, the store is the source of truth
    }

    function handleRollCheck(detail: any) {
        // Forward the rollCheck event to the parent (StoryView or SoloRPG)
        onRollCheck({
            ...detail,
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

        characterStore.deleteCharacter(selectedCharacter.id);

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
        onCharacterDeselected();
    }

    function handleToggleSection(section: string) {
        if (isEditingSections) {
            // In edit mode, toggle the section's inclusion in the character sheet
            toggleSectionInclusion(section);
        } else {
            // In view mode, use for filtering
            if (selectedSections.has(section)) {
                // Tapping on the same icon again clears the filter (shows all)
                selectedSections = new Set();
            } else {
                // Switch to only this section
                selectedSections = new Set([section]);
            }
        }

        // Emit updated state
        if (selectedCharacter) {
            onCharacterSelected({
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
        handleToggleSection(section);
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
            characterStore.updateCharacter(selectedCharacter);
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
            characterStore.updateCharacter(selectedCharacter);
            selectedCharacter = selectedCharacter; // ensure reactivity locally if strictly needed, but store update should cycle back
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
            characterStore.updateCharacter(selectedCharacter);
            selectedCharacter = selectedCharacter; // ensure reactivity
        }
        showTagPickerModal = false;
    }

    function handleNewTag(tag: string) {
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
            {#if availableTags.length > 1}
                <section class="srpg-collapsible-section mt-2 mb-6 max-[480px]:mb-2">
                    <button
                        class="srpg-collapsible-header"
                        class:expanded={isTagFilterExpanded}
                        on:click={() => (isTagFilterExpanded = !isTagFilterExpanded)}
                        aria-expanded={isTagFilterExpanded}
                        aria-controls="tag-filter-content">
                        <svg
                            viewBox="0 0 24 24"
                            width="20"
                            height="20"
                            fill="currentColor"
                            aria-hidden="true"
                            class="shrink-0 text-(--text-secondary)">
                            <path
                                d="M5.5 7A1.5 1.5 0 0 1 4 5.5A1.5 1.5 0 0 1 5.5 4A1.5 1.5 0 0 1 7 5.5A1.5 1.5 0 0 1 5.5 7m15.91 4.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.11 0-2 .89-2 2v7c0 .55.22 1.05.59 1.41l8.99 9c.37.36.87.59 1.42.59s1.05-.23 1.41-.59l7-7c.37-.36.59-.86.59-1.41c0-.56-.23-1.06-.59-1.42" />
                        </svg>
                        <h2 class="srpg-collapsible-title">Filter by Tag</h2>
                        <span class="srpg-collapsible-count">{selectedTagFilter}</span>
                        <svg
                            class="srpg-collapsible-chevron"
                            class:rotated={isTagFilterExpanded}
                            viewBox="0 0 24 24"
                            width="20"
                            height="20"
                            fill="none"
                            aria-hidden="true">
                            <path
                                d="M6 9l6 6 6-6"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round" />
                        </svg>
                    </button>

                    {#if isTagFilterExpanded}
                        <div id="tag-filter-content" class="srpg-collapsible-content">
                            <div class="flex items-center gap-2">
                                <button
                                    class="bg-card-bg border-border-primary text-text-secondary hover:border-accent-primary hover:bg-bg-tertiary hover:text-accent-primary flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 p-0 transition-all duration-200 active:scale-95 max-[480px]:hidden"
                                    on:click={(e) => {
                                        const container =
                                            e.currentTarget.parentElement.querySelector(
                                                ".filter-buttons"
                                            );
                                        container.scrollBy({ left: -200, behavior: "smooth" });
                                    }}
                                    aria-label="Scroll left">
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="16"
                                        height="16"
                                        fill="none"
                                        aria-hidden="true">
                                        <path
                                            d="M15 18l-6-6 6-6"
                                            stroke="currentColor"
                                            stroke-width="2"
                                            stroke-linecap="round"
                                            stroke-linejoin="round" />
                                    </svg>
                                </button>
                                <div
                                    class="filter-buttons max-[480px]:scrollbar-default scrollbar-thin scrollbar-track-bg-secondary scrollbar-thumb-border-secondary hover:scrollbar-thumb-text-muted flex flex-1 flex-nowrap gap-2 overflow-x-auto overflow-y-hidden scroll-smooth pb-1 max-[480px]:max-h-28 max-[480px]:flex-wrap max-[480px]:overflow-y-auto">
                                    <button
                                        class="tag-filter-btn cursor-pointer rounded-md border-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 {selectedTagFilter ===
                                        'All'
                                            ? 'tag-filter-btn-active'
                                            : 'bg-card-bg border-border-primary text-text-secondary hover:border-accent-primary hover:bg-bg-tertiary'}"
                                        on:click={() => (selectedTagFilter = "All")}>
                                        All ({characters.length})
                                    </button>
                                    {#each availableTags as tag}
                                        {@const count =
                                            tag === "No Tags"
                                                ? characters.filter(
                                                      (c) => !c.tags || c.tags.length === 0
                                                  ).length
                                                : characters.filter(
                                                      (c) => c.tags && c.tags.includes(tag)
                                                  ).length}
                                        {#if count > 0}
                                            <button
                                                class="tag-filter-btn cursor-pointer rounded-md border-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 max-sm:px-3 max-sm:py-2 max-sm:text-[0.8125rem] {selectedTagFilter ===
                                                tag
                                                    ? 'tag-filter-btn-active'
                                                    : 'bg-card-bg border-border-primary text-text-secondary hover:border-accent-primary hover:bg-bg-tertiary'}"
                                                on:click={() => (selectedTagFilter = tag)}>
                                                {tag} ({count})
                                            </button>
                                        {/if}
                                    {/each}
                                </div>
                                <button
                                    class="bg-card-bg border-border-primary text-text-secondary hover:border-accent-primary hover:bg-bg-tertiary hover:text-accent-primary flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 p-0 transition-all duration-200 active:scale-95 max-[480px]:hidden"
                                    on:click={(e) => {
                                        const container =
                                            e.currentTarget.parentElement.querySelector(
                                                ".filter-buttons"
                                            );
                                        container.scrollBy({ left: 200, behavior: "smooth" });
                                    }}
                                    aria-label="Scroll right">
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="16"
                                        height="16"
                                        fill="none"
                                        aria-hidden="true">
                                        <path
                                            d="M9 18l6-6-6-6"
                                            stroke="currentColor"
                                            stroke-width="2"
                                            stroke-linecap="round"
                                            stroke-linejoin="round" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    {/if}
                </section>
            {/if}

            <div class="mt-6 flex flex-row items-center justify-end gap-2">
                <!-- View Toggle Button -->
                <button
                    class="srpg-b-icon shrink-0"
                    on:click={() => (isCompactView = !isCompactView)}
                    aria-label={isCompactView ? "Switch to card view" : "Switch to compact view"}
                    title={isCompactView ? "Card view" : "Compact view"}>
                    {#if isCompactView}
                        <!-- Grid/Card icon -->
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="1.25em"
                            height="1.25em">
                            <path
                                fill="currentColor"
                                d="M3 3h8v8H3V3m0 10h8v8H3v-8m10 0h8v8h-8v-8m0-10h8v8h-8V3" />
                        </svg>
                    {:else}
                        <!-- List/Compact icon -->
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="1.25em"
                            height="1.25em">
                            <path
                                fill="currentColor"
                                d="M3 4h18v2H3V4m0 7h18v2H3v-2m0 7h18v2H3v-2" />
                        </svg>
                    {/if}
                </button>

                <!-- Sort Dropdown Button -->
                <div class="relative shrink-0">
                    <button
                        class="srpg-b-icon"
                        on:click={() => (showSortDropdown = !showSortDropdown)}
                        aria-label="Sort characters"
                        title="Sort by">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="1.25em"
                            height="1.25em">
                            <path
                                fill="currentColor"
                                d="M3 18h6v-2H3v2M3 6v2h18V6H3m0 7h12v-2H3v2" />
                        </svg>
                    </button>
                    {#if showSortDropdown}
                        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
                        <div class="fixed inset-0 z-40" on:click={() => (showSortDropdown = false)}>
                        </div>
                        <div
                            class="bg-bg-elevated border-border-primary absolute top-full right-0 left-auto z-50 mt-1 min-w-40 rounded-lg border shadow-lg">
                            <button
                                class="text-text-primary hover:bg-bg-tertiary flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors first:rounded-t-lg {sortBy ===
                                'alphabetical'
                                    ? 'bg-bg-tertiary font-semibold'
                                    : ''}"
                                on:click={() => {
                                    sortBy = "alphabetical";
                                    showSortDropdown = false;
                                }}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    width="1em"
                                    height="1em"
                                    class="text-text-muted">
                                    <path
                                        fill="currentColor"
                                        d="M2 17h4v-2H2v2m0-7h8v-2H2v2m0 3h16v-2H2v2m19.41-2.83L20 8.59l-1.41 1.58L17 8.59l-1.41 1.58L17 11.59l1.41 1.58L20 11.59l1.41 1.58M17 6l-1.41 1.41L17 8.83l1.41-1.42L17 6Z" />
                                </svg>
                                Alphabetical
                            </button>
                            <button
                                class="text-text-primary hover:bg-bg-tertiary flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors {sortBy ===
                                'createdAt'
                                    ? 'bg-bg-tertiary font-semibold'
                                    : ''}"
                                on:click={() => {
                                    sortBy = "createdAt";
                                    showSortDropdown = false;
                                }}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    width="1em"
                                    height="1em"
                                    class="text-text-muted">
                                    <path
                                        fill="currentColor"
                                        d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2m4 11h-5V6h2v5h3Z" />
                                </svg>
                                Created
                            </button>
                            <button
                                class="text-text-primary hover:bg-bg-tertiary flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors last:rounded-b-lg {sortBy ===
                                'updatedAt'
                                    ? 'bg-bg-tertiary font-semibold'
                                    : ''}"
                                on:click={() => {
                                    sortBy = "updatedAt";
                                    showSortDropdown = false;
                                }}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    width="1em"
                                    height="1em"
                                    class="text-text-muted">
                                    <path
                                        fill="currentColor"
                                        d="M21 10.12h-6.78l2.74-2.82c-2.73-2.7-7.15-2.8-9.88-.1a6.875 6.875 0 0 0 0 9.79a7.02 7.02 0 0 0 9.88 0A6.98 6.98 0 0 0 19 12.1h2a9 9 0 0 1-2.64 6.37A8.97 8.97 0 0 1 5.72 5.72a9 9 0 0 1 12.73 0L21 3v7.12M12.5 8v4.25l3.5 2.08l-.72 1.21L11 13V8h1.5Z" />
                                </svg>
                                Updated
                            </button>
                        </div>
                    {/if}
                </div>
            </div>
        {/if}
    </div>

    {#if selectedCharacter}
        <CharacterSheet
            character={selectedCharacter}
            {isEditing}
            {isEditingSections}
            {selectedSections}
            onSave={saveCharacter}
            on:cancel={cancelEdit}
            onRollCheck={handleRollCheck}
            onToggleSection={handleToggleSection} />
    {:else if filteredCharacters.length > 0}
        <div
            class="{isCompactView
                ? 'flex flex-col gap-2'
                : 'grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4'} py-2 pb-24 md:pb-4">
            {#each filteredCharacters as character}
                {@const initials = character.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                {@const hue =
                    character.name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
                    360}
                {#if isCompactView}
                    <!-- Compact View -->
                    <button
                        class="character-card-compact group"
                        on:click={() => selectCharacter(character)}>
                        <div
                            class="character-avatar-compact"
                            style="background: linear-gradient(135deg, hsl({hue}, 60%, 45%), hsl({(hue +
                                40) %
                                360}, 60%, 55%));">
                            {initials}
                        </div>
                        <div class="flex min-w-0 flex-1 flex-col">
                            <h3
                                class="text-text-primary m-0 truncate text-left text-sm font-semibold">
                                {character.name}
                            </h3>
                            {#if character.race || character.class}
                                <p class="text-text-muted m-0 truncate text-left text-xs">
                                    {#if character.race}{character.race}{/if}
                                    {#if character.race && character.class}
                                        •
                                    {/if}
                                    {#if character.class}{character.class}{/if}
                                    {#if character.level}
                                        Lv.{character.level}{/if}
                                </p>
                            {/if}
                        </div>
                        {#if character.currentHitPoints !== undefined && character.hitPointMaximum}
                            <div class="flex items-center gap-2">
                                <div class="hp-bar-compact">
                                    <div
                                        class="hp-bar-fill-compact"
                                        style="width: {Math.min(
                                            100,
                                            (character.currentHitPoints /
                                                character.hitPointMaximum) *
                                                100
                                        )}%; background: {character.currentHitPoints /
                                            character.hitPointMaximum >
                                        0.5
                                            ? 'var(--accent-success)'
                                            : character.currentHitPoints /
                                                    character.hitPointMaximum >
                                                0.25
                                              ? 'var(--accent-warning)'
                                              : 'var(--accent-danger)'};">
                                    </div>
                                </div>
                                <span class="text-text-muted text-xs whitespace-nowrap">
                                    {character.currentHitPoints}/{character.hitPointMaximum}
                                </span>
                            </div>
                        {/if}
                        {#if character.tags && character.tags.length > 0}
                            <div class="hidden items-center gap-1 sm:flex">
                                {#each character.tags.slice(0, 2) as tag}
                                    {@const tagHue =
                                        tag
                                            .split("")
                                            .reduce((acc, char) => acc + char.charCodeAt(0), 0) %
                                        360}
                                    <span
                                        class="character-tag-compact"
                                        style="--tag-hue: {tagHue};">
                                        {tag}
                                    </span>
                                {/each}
                                {#if character.tags.length > 2}
                                    <span class="text-text-muted text-xs">
                                        +{character.tags.length - 2}
                                    </span>
                                {/if}
                            </div>
                        {/if}
                    </button>
                {:else}
                    <!-- Card View -->
                    <button
                        class="character-card group"
                        on:click={() => selectCharacter(character)}>
                        <!-- Accent bar -->
                        <div
                            class="character-card-accent"
                            style="background: linear-gradient(135deg, hsl({hue}, 70%, 50%), hsl({(hue +
                                40) %
                                360}, 70%, 50%));">
                        </div>

                        <!-- Avatar -->
                        <div
                            class="character-avatar"
                            style="background: linear-gradient(135deg, hsl({hue}, 60%, 45%), hsl({(hue +
                                40) %
                                360}, 60%, 55%));">
                            {initials}
                        </div>

                        <h3 class="character-card-name">
                            {character.name}
                        </h3>

                        <div class="character-summary">
                            {#if character.race || character.class}
                                <p class="character-card-subtitle">
                                    {#if character.race}{character.race}{/if}
                                    {#if character.race && character.class}•{/if}
                                    {#if character.class}{character.class}{/if}
                                    {#if character.level}
                                        <span class="character-level">Lv.{character.level}</span>
                                    {/if}
                                </p>
                            {/if}
                            {#if character.currentHitPoints !== undefined && character.hitPointMaximum}
                                <div class="character-hp-bar">
                                    <div class="hp-bar-label">
                                        <span>HP</span>
                                        <span>
                                            {character.currentHitPoints} / {character.hitPointMaximum}
                                        </span>
                                    </div>
                                    <div class="hp-bar-track">
                                        <div
                                            class="hp-bar-fill"
                                            style="width: {Math.min(
                                                100,
                                                (character.currentHitPoints /
                                                    character.hitPointMaximum) *
                                                    100
                                            )}%; background: {character.currentHitPoints /
                                                character.hitPointMaximum >
                                            0.5
                                                ? 'var(--accent-success)'
                                                : character.currentHitPoints /
                                                        character.hitPointMaximum >
                                                    0.25
                                                  ? 'var(--accent-warning)'
                                                  : 'var(--accent-danger)'};">
                                        </div>
                                    </div>
                                </div>
                            {/if}
                        </div>

                        {#if character.tags && character.tags.length > 0}
                            <div class="character-tags">
                                {#each character.tags as tag}
                                    {@const tagHue =
                                        tag
                                            .split("")
                                            .reduce((acc, char) => acc + char.charCodeAt(0), 0) %
                                        360}
                                    <span class="character-tag" style="--tag-hue: {tagHue};">
                                        {tag}
                                    </span>
                                {/each}
                            </div>
                        {/if}
                    </button>
                {/if}
            {/each}
        </div>
    {:else}
        <div class="px-4 py-12 pb-24 text-center md:pb-12">
            <p class="my-2">No characters created yet.</p>
            <p class="text-sm italic">
                Create a character to start tracking their stats and abilities.
            </p>
        </div>
    {/if}

    <div slot="footer" class="relative mb-[calc(env(safe-area-inset-bottom))] py-2 md:mb-0">
        {#if !selectedCharacter}
            <div class="flex items-center justify-center px-2">
                {#if characters.length > 0}
                    <button
                        class="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-(--border-primary) bg-(--card-bg) text-(--text-secondary) shadow-sm transition-colors hover:bg-(--bg-tertiary) hover:text-(--accent-primary)"
                        on:click={openCreateModal}
                        title="Create new character"
                        aria-label="Create new character">
                        <svg
                            viewBox="0 0 24 24"
                            width="20"
                            height="20"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            aria-hidden="true">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>
                {:else}
                    <button
                        class="srpg-b srpg-b-create"
                        on:click={openCreateModal}
                        aria-label="Create new character">
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
                        Create Character
                    </button>
                {/if}
            </div>
        {/if}
    </div>
</SrpgListPage>

<SrpgModal bind:show={showCreateModal} maxWidth="400px" onClose={() => (showCreateModal = false)}>
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
    onChange={(sections) => {
        if (selectedCharacter) {
            selectedCharacter.visibleSections = sections;
            selectedCharacter = selectedCharacter;
            onCharacterSelected({
                character: selectedCharacter,
                isEditing,
                isEditingSections,
                selectedSections,
                visibleSections: sections,
            });
        }
    }}
    onSave={(sections) => handleSectionPickerSave(sections)}
    onClose={() => (showSectionPickerModal = false)} />

<TagPickerModal
    bind:show={showTagPickerModal}
    selectedTags={selectedCharacter?.tags || []}
    availableTags={availableTags.filter((t) => t !== "No Tags")}
    onChange={(tags) => {
        if (selectedCharacter) {
            selectedCharacter.tags = tags;
            selectedCharacter = selectedCharacter;
        }
    }}
    onNewTag={(tag) => handleNewTag(tag)}
    onSave={(tags) => handleTagPickerSave(tags)}
    onClose={() => (showTagPickerModal = false)} />

<style>
    /* Collapsible Section */
    .srpg-collapsible-section {
        background: var(--card-bg);
        border: 1px solid var(--card-border);
        border-radius: 12px;
        overflow: hidden;
    }

    /* Collapsible Header */
    .srpg-collapsible-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        padding: 0.875rem 1rem;

        background: transparent;
        border: none;
        cursor: pointer;

        transition: background-color 0.2s ease;
    }

    .srpg-collapsible-header:hover {
        background: var(--bg-tertiary);
    }

    .srpg-collapsible-header.expanded {
        border-bottom: 1px solid var(--border-primary);
    }

    /* Collapsible Title */
    .srpg-collapsible-title {
        flex: 1;
        margin: 0;

        font-size: 0.95rem;
        font-weight: 600;
        color: var(--text-primary);
        text-align: left;
    }

    /* Count Badge */
    .srpg-collapsible-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 1.5rem;
        height: 1.5rem;
        padding: 0 0.5rem;

        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-secondary);

        background: var(--bg-tertiary);
        border-radius: 999px;
    }

    /* Chevron Icon */
    .srpg-collapsible-chevron {
        color: var(--text-muted);
        transition: transform 0.2s ease;
        flex-shrink: 0;
    }

    .srpg-collapsible-chevron.rotated {
        transform: rotate(180deg);
    }

    /* Collapsible Content */
    .srpg-collapsible-content {
        padding: 0.75rem;
    }

    .character-card {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        min-height: 180px;
        width: 100%;
        padding: 1.5rem 1rem 1rem;
        border: none;
        border-radius: 1rem;
        background: var(--card-bg);
        box-shadow:
            0 2px 8px rgba(0, 0, 0, 0.08),
            0 1px 2px rgba(0, 0, 0, 0.04);
        cursor: pointer;
        font-family: inherit;
        text-align: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
    }

    .character-card::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: 1rem;
        padding: 2px;
        background: linear-gradient(135deg, transparent 40%, var(--border-primary) 100%);
        mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
        -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events: none;
    }

    .character-card:hover {
        transform: translateY(-4px);
        box-shadow:
            0 12px 24px rgba(0, 0, 0, 0.12),
            0 4px 8px rgba(0, 0, 0, 0.08);
    }

    .character-card:active {
        transform: translateY(-2px);
    }

    .character-card-accent {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        border-radius: 1rem 1rem 0 0;
    }

    .character-avatar {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        font-weight: 700;
        color: white;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        margin-bottom: 0.75rem;
        box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.15),
            inset 0 -2px 4px rgba(0, 0, 0, 0.1),
            inset 0 2px 4px rgba(255, 255, 255, 0.2);
        transition: transform 0.3s ease;
    }

    .character-card:hover .character-avatar {
        transform: scale(1.05);
    }

    .character-card-name {
        margin: 0 0 0.25rem;
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1.3;
    }

    .character-card-subtitle {
        margin: 0;
        font-size: 0.8125rem;
        color: var(--text-secondary);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.375rem;
        flex-wrap: wrap;
    }

    .character-level {
        background: var(--bg-tertiary);
        padding: 0.125rem 0.5rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-muted);
    }

    .character-hp-bar {
        width: 100%;
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px solid var(--border-primary);
    }

    .hp-bar-label {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-secondary);
        margin-bottom: 0.375rem;
    }

    .hp-bar-track {
        height: 6px;
        background: var(--bg-tertiary);
        border-radius: 999px;
        overflow: hidden;
    }

    .hp-bar-fill {
        height: 100%;
        border-radius: 999px;
        transition: width 0.3s ease;
    }

    .character-tags {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.375rem;
        margin-top: 0.75rem;
    }

    .character-tag {
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.625rem;
        border-radius: 999px;
        font-size: 0.6875rem;
        font-weight: 600;
        letter-spacing: 0.01em;
        background: hsl(var(--tag-hue), 85%, 95%);
        color: hsl(var(--tag-hue), 65%, 35%);
        border: 1px solid hsl(var(--tag-hue), 70%, 85%);
        transition: all 0.2s ease;
    }

    :global([data-theme="dark"]) .character-tag {
        background: hsl(var(--tag-hue), 50%, 20%);
        color: hsl(var(--tag-hue), 70%, 75%);
        border-color: hsl(var(--tag-hue), 45%, 30%);
    }

    .character-card:hover .character-tag {
        background: hsl(var(--tag-hue), 80%, 92%);
        border-color: hsl(var(--tag-hue), 65%, 75%);
    }

    :global([data-theme="dark"]) .character-card:hover .character-tag {
        background: hsl(var(--tag-hue), 55%, 25%);
        border-color: hsl(var(--tag-hue), 50%, 40%);
    }

    .character-summary {
        width: 100%;
    }

    /* Tag Filter Button Styles */
    .tag-filter-btn-active {
        background: var(--accent-primary);
        border-color: var(--accent-primary);
        color: white;
        font-weight: 600;
        box-shadow: 0 2px 8px rgba(var(--accent-primary-rgb, 59, 130, 246), 0.35);
    }

    .tag-filter-btn-active:hover {
        background: var(--accent-primary-hover);
        border-color: var(--accent-primary-hover);
    }

    /* Compact View Styles */
    .character-card-compact {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        padding: 0.75rem 1rem;
        border: none;
        border-radius: 0.5rem;
        background: var(--card-bg);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        cursor: pointer;
        font-family: inherit;
        text-align: left;
        transition: all 0.2s ease;
        border: 1px solid var(--border-primary);
    }

    .character-card-compact:hover {
        background: var(--bg-tertiary);
        border-color: var(--accent-primary);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .character-card-compact:active {
        transform: scale(0.99);
    }

    .character-avatar-compact {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.875rem;
        font-weight: 700;
        color: white;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        flex-shrink: 0;
        box-shadow:
            0 2px 6px rgba(0, 0, 0, 0.15),
            inset 0 -1px 2px rgba(0, 0, 0, 0.1);
    }

    .hp-bar-compact {
        width: 60px;
        height: 6px;
        background: var(--bg-tertiary);
        border-radius: 999px;
        overflow: hidden;
    }

    .hp-bar-fill-compact {
        height: 100%;
        border-radius: 999px;
        transition: width 0.3s ease;
    }

    .character-tag-compact {
        display: inline-flex;
        align-items: center;
        padding: 0.125rem 0.5rem;
        border-radius: 999px;
        font-size: 0.625rem;
        font-weight: 600;
        background: hsl(var(--tag-hue), 85%, 95%);
        color: hsl(var(--tag-hue), 65%, 35%);
        border: 1px solid hsl(var(--tag-hue), 70%, 85%);
    }

    :global([data-theme="dark"]) .character-tag-compact {
        background: hsl(var(--tag-hue), 50%, 20%);
        color: hsl(var(--tag-hue), 70%, 75%);
        border-color: hsl(var(--tag-hue), 45%, 30%);
    }

    @media (max-width: 480px) {
        .character-card {
            min-height: 160px;
            padding: 1.25rem 0.875rem 0.875rem;
        }
        .character-avatar {
            width: 48px;
            height: 48px;
            font-size: 1.125rem;
        }
        .character-card-name {
            font-size: 1rem;
        }
        .character-card-compact {
            padding: 0.625rem 0.75rem;
            gap: 0.5rem;
        }
        .character-avatar-compact {
            width: 32px;
            height: 32px;
            font-size: 0.75rem;
        }
        .hp-bar-compact {
            width: 40px;
        }
    }
</style>
