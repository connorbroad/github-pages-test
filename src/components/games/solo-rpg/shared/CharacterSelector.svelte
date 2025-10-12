<script lang="ts">
    import { activeCampaign } from "../game-management/campaign-store";
    import {
        loadCharacters,
        loadActiveCharacterId,
        saveActiveCharacterId,
    } from "../data/storage-utils";
    import type { Character } from "../data/storage-utils";
    import { onMount } from "svelte";
    import "../solo-rpg-styles.css";

    let characters: Character[] = [];
    let activeCharacterId: string | null = null;
    let isOpen = false;
    let selectedGroupFilter: string = "All";

    $: {
        if ($activeCampaign) {
            loadCampaignCharacters();
        }
    }

    onMount(() => {
        loadCampaignCharacters();
    });

    // Get all unique tags from characters
    $: availableGroups = getAvailableTags(characters);

    // Filter characters by selected tag
    $: filteredCharacters = selectedGroupFilter === "All" 
        ? characters 
        : selectedGroupFilter === "No Tags"
        ? characters.filter(c => !c.tags || c.tags.length === 0)
        : characters.filter(c => c.tags && c.tags.includes(selectedGroupFilter));

    // Show tag filter if there are multiple tags with characters
    $: showGroupFilter = availableGroups.length > 1;

    function getAvailableTags(chars: Character[]): string[] {
        const tags = new Set<string>();
        let hasNoTags = false;
        
        chars.forEach(c => {
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
        if (!$activeCampaign) {
            characters = [];
            return;
        }

        const allCharacters = loadCharacters();
        characters = allCharacters
            .filter((c) => c.campaignId === $activeCampaign.id)
            .sort((a, b) => a.name.localeCompare(b.name));

        activeCharacterId = loadActiveCharacterId();
    }

    function selectCharacter(characterId: string) {
        activeCharacterId = characterId;
        saveActiveCharacterId(characterId);
        isOpen = false;
    }

    function clearSelection() {
        activeCharacterId = null;
        saveActiveCharacterId(null);
        isOpen = false;
    }

    function toggleDropdown() {
        isOpen = !isOpen;
    }

    function closeDropdown() {
        isOpen = false;
    }

    $: activeCharacter = characters.find((c) => c.id === activeCharacterId);
</script>

<div class="character-selector">
    <button
        class="selector-button"
        on:click={toggleDropdown}
        aria-label="Select active character"
        aria-expanded={isOpen}
    >
        <svg
            class="icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
        >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
        <span class="selector-text">
            {#if activeCharacter}
                {activeCharacter.name}
            {:else if characters.length > 0}
                Select Character
            {:else}
                No Characters
            {/if}
        </span>
        <svg
            class="chevron"
            class:open={isOpen}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
        >
            <path d="m6 9 6 6 6-6" />
        </svg>
    </button>

    {#if isOpen}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div class="dropdown-overlay" on:click={closeDropdown}></div>
        <div class="dropdown-menu">
            {#if characters.length > 0}
                {#if showGroupFilter}
                    <div class="group-filter-dropdown">
                        <button 
                            class="filter-chip" 
                            class:active={selectedGroupFilter === "All"}
                            on:click={() => selectedGroupFilter = "All"}
                        >
                            All
                        </button>
                        {#each availableGroups as tag}
                            {@const count = tag === "No Tags" 
                                ? characters.filter(c => !c.tags || c.tags.length === 0).length 
                                : characters.filter(c => c.tags && c.tags.includes(tag)).length}
                            {#if count > 0}
                                <button 
                                    class="filter-chip" 
                                    class:active={selectedGroupFilter === tag}
                                    on:click={() => selectedGroupFilter = tag}
                                >
                                    {tag}
                                </button>
                            {/if}
                        {/each}
                    </div>
                    <div class="dropdown-divider"></div>
                {/if}

                {#if activeCharacterId}
                    <button
                        class="dropdown-item clear-item"
                        on:click={clearSelection}
                    >
                        <svg
                            class="item-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Clear Selection
                    </button>
                    <div class="dropdown-divider"></div>
                {/if}
                {#each filteredCharacters as character}
                    <button
                        class="dropdown-item"
                        class:active={character.id === activeCharacterId}
                        on:click={() => selectCharacter(character.id)}
                    >
                        <svg
                            class="item-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <path
                                d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                            />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span class="character-name">{character.name}</span>
                        {#if character.tags && character.tags.length > 0 && selectedGroupFilter === "All"}
                            <span class="character-tags">
                                {character.tags.join(", ")}
                            </span>
                        {/if}
                        {#if character.class}
                            <span class="character-class"
                                >{character.class}</span
                            >
                        {/if}
                        {#if character.level}
                            <span class="character-level"
                                >Lv. {character.level}</span
                            >
                        {/if}
                        {#if character.id === activeCharacterId}
                            <svg
                                class="check-icon"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="3"
                            >
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        {/if}
                    </button>
                {/each}
            {:else}
                <div class="empty-state">
                    <p>No characters in this campaign.</p>
                    <p class="empty-hint">Create one in the Story section.</p>
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .character-selector {
        position: relative;
        width: 100%;
        max-width: 300px;
    }

    .selector-button {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        width: 100%;
        padding: 0.625rem 1rem;
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 0.9375rem;
        font-weight: 500;
        color: #374151;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .selector-button:hover {
        border-color: #3b82f6;
        box-shadow: 0 2px 6px rgba(59, 130, 246, 0.15);
    }

    .selector-button:active {
        transform: scale(0.98);
    }

    .icon {
        width: 1.25rem;
        height: 1.25rem;
        flex-shrink: 0;
        color: #6b7280;
    }

    .selector-text {
        flex: 1;
        text-align: left;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .chevron {
        width: 1rem;
        height: 1rem;
        flex-shrink: 0;
        color: #9ca3af;
        transition: transform 0.2s ease;
    }

    .chevron.open {
        transform: rotate(180deg);
    }

    .dropdown-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 40;
    }

    .dropdown-menu {
        position: absolute;
        top: calc(100% + 0.5rem);
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        z-index: 50;
        max-height: 300px;
        overflow-y: auto;
        animation: slideDown 0.2s ease;
        min-width: 100%;
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .dropdown-item {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        width: 100%;
        padding: 0.75rem 1rem;
        background: white;
        border: none;
        cursor: pointer;
        transition: all 0.15s ease;
        text-align: left;
        font-size: 0.875rem;
        color: #374151;
        border-bottom: 1px solid #f3f4f6;
    }

    .dropdown-item:last-child {
        border-bottom: none;
    }

    .dropdown-item:hover {
        background: #f9fafb;
    }

    .dropdown-item.active {
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        color: #1e40af;
    }

    .dropdown-item.active:hover {
        background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    }

    .dropdown-item.clear-item {
        color: #ef4444;
        font-weight: 500;
    }

    .dropdown-item.clear-item:hover {
        background: #fef2f2;
    }

    .item-icon {
        width: 1.125rem;
        height: 1.125rem;
        flex-shrink: 0;
    }

    .character-name {
        flex: 1;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
    }

    .character-class {
        font-size: 0.75rem;
        color: #6b7280;
        padding: 0.125rem 0.375rem;
        background: #f3f4f6;
        border-radius: 4px;
        white-space: nowrap;
    }

    .character-level {
        font-size: 0.75rem;
        color: #6b7280;
        padding: 0.125rem 0.375rem;
        background: #f3f4f6;
        border-radius: 4px;
        white-space: nowrap;
        font-weight: 600;
    }

    .dropdown-item.active .character-class,
    .dropdown-item.active .character-level {
        background: rgba(59, 130, 246, 0.1);
        color: #1e40af;
    }

    .check-icon {
        width: 1rem;
        height: 1rem;
        flex-shrink: 0;
        color: #3b82f6;
    }

    .dropdown-divider {
        height: 1px;
        background: #e5e7eb;
        margin: 0.25rem 0;
    }

    .group-filter-dropdown {
        padding: 0.75rem 1rem;
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        background: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
    }

    .filter-chip {
        padding: 0.375rem 0.75rem;
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 16px;
        cursor: pointer;
        font-size: 0.8125rem;
        font-weight: 500;
        color: #374151;
        transition: all 0.2s ease;
        white-space: nowrap;
    }

    .filter-chip:hover {
        border-color: #3b82f6;
        background: #eff6ff;
    }

    .filter-chip.active {
        background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
        color: white;
        border-color: #3b82f6;
        box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
    }

    .character-tags {
        font-size: 0.75rem;
        color: white;
        padding: 0.125rem 0.5rem;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border-radius: 10px;
        white-space: nowrap;
        font-weight: 600;
        box-shadow: 0 1px 2px rgba(16, 185, 129, 0.2);
        max-width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .dropdown-item.active .character-tags {
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
    }

    .empty-state {
        padding: 2rem 1rem;
        text-align: center;
        color: #6b7280;
    }

    .empty-state p {
        margin: 0 0 0.5rem 0;
        font-size: 0.875rem;
    }

    .empty-hint {
        font-size: 0.75rem;
        font-style: italic;
        color: #9ca3af;
    }

    /* Mobile adjustments */
    @media (max-width: 640px) {
        .character-selector {
            max-width: 100%;
        }

        .selector-button {
            font-size: 0.875rem;
            min-height: 44px;
        }

        .dropdown-menu {
            max-height: 250px;
        }

        .character-class,
        .character-level {
            display: none;
        }

        .filter-chip {
            font-size: 0.75rem;
            padding: 0.3125rem 0.625rem;
        }

        .group-filter-dropdown {
            padding: 0.625rem 0.75rem;
        }
    }

    /* Tablet adjustments */
    @media (min-width: 641px) and (max-width: 1024px) {
        .character-selector {
            max-width: 350px;
        }

        .dropdown-menu {
            min-width: 400px;
        }
    }

    /* Desktop adjustments */
    @media (min-width: 1025px) {
        .dropdown-menu {
            min-width: 450px;
        }

        .character-class,
        .character-level,
        .character-tags {
            flex-shrink: 0;
        }

        .dropdown-item {
            padding: 0.875rem 1.25rem;
        }
    }
</style>
