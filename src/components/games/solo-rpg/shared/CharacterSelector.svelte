<script lang="ts">
    import { activeCampaign } from "../game-management/campaign-store";
    import {
        loadCharacters,
        loadActiveCharacterId,
        saveActiveCharacterId,
    } from "../data/storage-utils";
    import type { Character } from "../data/storage-utils";
    import { onMount } from "svelte";

    // Optional prop to temporarily pre-select a character (e.g., from a roll preset)
    export let preselectedCharacterId: string | null = null;

    // Expose the currently displayed character ID (whether active or preselected)
    export let currentDisplayedCharacterId: string | null = null;

    let characters: Character[] = [];
    let activeCharacterId: string | null = null;
    let isOpen = false;
    let selectedGroupFilter: string = "All";
    let isUsingPreselection = false; // Track if we're showing a temporary preselection
    let lastAppliedPreselection: string | null = null; // Track which preselection we last applied

    $: {
        if ($activeCampaign) {
            loadCampaignCharacters();
        }
    }

    // Apply preselection only when it changes to a new value (not continuously)
    $: if (
        preselectedCharacterId &&
        characters.length > 0 &&
        preselectedCharacterId !== lastAppliedPreselection
    ) {
        const preselectedExists = characters.find((c) => c.id === preselectedCharacterId);
        if (preselectedExists) {
            activeCharacterId = preselectedCharacterId;
            isUsingPreselection = true;
            lastAppliedPreselection = preselectedCharacterId;
        }
    } else if (!preselectedCharacterId && isUsingPreselection) {
        // When preset is cleared, reload the saved active character
        activeCharacterId = loadActiveCharacterId();
        isUsingPreselection = false;
        lastAppliedPreselection = null;
    }

    onMount(() => {
        loadCampaignCharacters();
    });

    // Get all unique tags from characters
    $: availableGroups = getAvailableTags(characters);

    // Filter characters by selected tag
    $: filteredCharacters =
        selectedGroupFilter === "All"
            ? characters
            : selectedGroupFilter === "No Tags"
              ? characters.filter((c) => !c.tags || c.tags.length === 0)
              : characters.filter((c) => c.tags && c.tags.includes(selectedGroupFilter));

    // Show tag filter if there are multiple tags with characters
    $: showGroupFilter = availableGroups.length > 1;

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
        if (!$activeCampaign) {
            characters = [];
            return;
        }

        const allCharacters = loadCharacters();
        characters = allCharacters
            .filter((c) => c.campaignId === $activeCampaign.id)
            .sort((a, b) => a.name.localeCompare(b.name));

        // Always load saved active character (unless preselection overrides it)
        if (!preselectedCharacterId) {
            activeCharacterId = loadActiveCharacterId();
        }
    }

    function selectCharacter(characterId: string) {
        // User explicitly selected a character - save it as the new active character
        activeCharacterId = characterId;
        saveActiveCharacterId(characterId);
        isUsingPreselection = false; // No longer using preset
        isOpen = false;
    }

    function clearSelection() {
        // User explicitly cleared selection - save that choice
        activeCharacterId = null;
        saveActiveCharacterId(null);
        isUsingPreselection = false; // No longer using preset
        isOpen = false;
    }

    function toggleDropdown() {
        isOpen = !isOpen;
    }

    function closeDropdown() {
        isOpen = false;
    }

    $: activeCharacter = characters.find((c) => c.id === activeCharacterId);

    // Keep the exported currentDisplayedCharacterId in sync with activeCharacterId
    $: currentDisplayedCharacterId = activeCharacterId;
</script>

<div class="relative w-full sm:max-w-full md:max-w-[350px]">
    <button
        class="bg-card-bg border-border-primary text-text-secondary hover:border-accent-primary flex w-full cursor-pointer items-center gap-2.5 rounded-lg border-2 p-2.5 text-[0.9375rem] font-medium shadow-sm transition-all duration-200 hover:shadow-[0_2px_6px_rgba(59,130,246,0.15)] active:scale-95 sm:min-h-11 sm:text-sm {isUsingPreselection
            ? 'border-accent-info hover:border-accent-primary bg-[linear-gradient(135deg,var(--card-bg)_0%,rgba(59,130,246,0.05)_100%)] shadow-[0_2px_6px_rgba(59,130,246,0.2)] hover:shadow-[0_2px_8px_rgba(59,130,246,0.25)]'
            : ''}"
        on:click={toggleDropdown}
        aria-label="Select active character"
        aria-expanded={isOpen}
        title={isUsingPreselection
            ? "Character auto-selected for this roll (click to change)"
            : "Select active character"}>
        <svg
            class="h-5 w-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
        <span
            class="flex flex-1 items-center gap-2 overflow-hidden text-left text-ellipsis whitespace-nowrap">
            {#if activeCharacter}
                {activeCharacter.name}
                {#if isUsingPreselection}
                    <span
                        class="text-accent-info shrink-0 animate-pulse text-[0.625rem]"
                        title="Auto-selected">
                        ●
                    </span>
                {/if}
            {:else if characters.length > 0}
                Select Character
            {:else}
                No Characters
            {/if}
        </span>
        <svg
            class="text-text-tertiary h-4 w-4 shrink-0 transition-transform duration-200 {isOpen
                ? 'rotate-180'
                : ''}"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2">
            <path d="m6 9 6 6 6-6" />
        </svg>
    </button>

    {#if isOpen}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div class="fixed inset-0 z-40" on:click={closeDropdown}></div>
        <div
            class="bg-card-bg border-border-primary animate-in slide-in-from-top-2 fade-in absolute top-[calc(100%+0.5rem)] right-0 left-0 z-50 max-h-[300px] min-w-full overflow-y-auto rounded-lg border shadow-lg duration-200 sm:max-h-[250px] md:min-w-[400px] lg:min-w-[450px]">
            {#if characters.length > 0}
                {#if showGroupFilter}
                    <div
                        class="bg-bg-secondary border-border-primary flex flex-wrap gap-2 border-b p-[0.75rem_1rem] sm:p-[0.625rem_0.75rem]">
                        <button
                            class="bg-card-bg border-border-primary text-text-secondary hover:border-accent-primary hover:bg-bg-tertiary cursor-pointer rounded-2xl border-2 px-3 py-1.5 text-[0.8125rem] font-medium whitespace-nowrap transition-all duration-200 sm:px-2.5 sm:py-1.25 sm:text-xs {selectedGroupFilter ===
                            'All'
                                ? 'text-text-inverse border-accent-primary bg-[linear-gradient(135deg,var(--accent-primary)_0%,var(--accent-info)_100%)] shadow-[0_2px_4px_rgba(59,130,246,0.3)]'
                                : ''}"
                            on:click={() => (selectedGroupFilter = "All")}>
                            All
                        </button>
                        {#each availableGroups as tag}
                            {@const count =
                                tag === "No Tags"
                                    ? characters.filter((c) => !c.tags || c.tags.length === 0)
                                          .length
                                    : characters.filter((c) => c.tags && c.tags.includes(tag))
                                          .length}
                            {#if count > 0}
                                <button
                                    class="bg-card-bg border-border-primary text-text-secondary hover:border-accent-primary hover:bg-bg-tertiary cursor-pointer rounded-2xl border-2 px-3 py-1.5 text-[0.8125rem] font-medium whitespace-nowrap transition-all duration-200 sm:px-2.5 sm:py-1.25 sm:text-xs {selectedGroupFilter ===
                                    tag
                                        ? 'text-text-inverse border-accent-primary bg-[linear-gradient(135deg,var(--accent-primary)_0%,var(--accent-info)_100%)] shadow-[0_2px_4px_rgba(59,130,246,0.3)]'
                                        : ''}"
                                    on:click={() => (selectedGroupFilter = tag)}>
                                    {tag}
                                </button>
                            {/if}
                        {/each}
                    </div>
                    <div class="bg-border-primary my-1 h-px"></div>
                {/if}

                {#if activeCharacterId}
                    <button
                        class="bg-card-bg text-text-secondary border-border-subtle hover:bg-bg-secondary flex w-full cursor-pointer items-center gap-2.5 border-b border-none p-3 text-left text-sm font-medium transition-all duration-150 last:border-b-0 lg:p-[0.875rem_1.25rem]"
                        on:click={clearSelection}>
                        <svg
                            class="h-4.5 w-4.5 shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Clear Selection
                    </button>
                    <div class="bg-border-primary my-1 h-px"></div>
                {/if}
                {#each filteredCharacters as character}
                    <button
                        class="bg-card-bg text-text-secondary border-border-subtle hover:bg-bg-secondary flex w-full cursor-pointer items-center gap-2.5 border-b border-none p-3 text-left text-sm transition-all duration-150 last:border-b-0 lg:p-[0.875rem_1.25rem] {character.id ===
                        activeCharacterId
                            ? 'text-accent-primary bg-[linear-gradient(135deg,var(--bg-tertiary)_0%,var(--bg-secondary)_100%)] hover:bg-[linear-gradient(135deg,var(--bg-secondary)_0%,var(--bg-tertiary)_100%)]'
                            : ''}"
                        on:click={() => selectCharacter(character.id)}>
                        <svg
                            class="h-4.5 w-4.5 shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span
                            class="min-w-0 flex-1 overflow-hidden font-medium text-ellipsis whitespace-nowrap">
                            {character.name}
                        </span>
                        {#if character.tags && character.tags.length > 0 && selectedGroupFilter === "All"}
                            <span
                                class="text-text-inverse max-w-[150px] overflow-hidden rounded-lg bg-[linear-gradient(135deg,var(--accent-success)_0%,var(--accent-success-hover)_100%)] px-2 py-0.5 text-xs font-semibold text-ellipsis whitespace-nowrap shadow-[0_1px_2px_rgba(16,185,129,0.2)] lg:shrink-0 {character.id ===
                                activeCharacterId
                                    ? 'bg-[linear-gradient(135deg,var(--accent-success-hover)_0%,var(--accent-success-active)_100%)]'
                                    : ''}">
                                {character.tags.join(", ")}
                            </span>
                        {/if}
                        {#if character.class}
                            <span
                                class="bg-bg-tertiary rounded px-1.5 py-0.5 text-xs whitespace-nowrap sm:hidden lg:block lg:shrink-0 {character.id ===
                                activeCharacterId
                                    ? 'text-accent-primary bg-[rgba(59,130,246,0.1)]'
                                    : ''}">
                                {character.class}
                            </span>
                        {/if}
                        {#if character.level}
                            <span
                                class="bg-bg-tertiary rounded px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap sm:hidden lg:block lg:shrink-0 {character.id ===
                                activeCharacterId
                                    ? 'text-accent-primary bg-[rgba(59,130,246,0.1)]'
                                    : ''}">
                                Lv. {character.level}
                            </span>
                        {/if}
                        {#if character.id === activeCharacterId}
                            <svg
                                class="text-accent-primary h-4 w-4 shrink-0"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="3">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        {/if}
                    </button>
                {/each}
            {:else}
                <div class="p-8 text-center">
                    <p class="m-0 mb-2 text-sm">No characters in this campaign.</p>
                    <p class="text-text-tertiary text-xs italic">
                        Create one in the Story section.
                    </p>
                </div>
            {/if}
        </div>
    {/if}
</div>
