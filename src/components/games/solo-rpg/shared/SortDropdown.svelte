<script lang="ts">
    /**
     * Shared SortDropdown component for sorting options
     */

    export let sortBy: "alphabetical" | "createdAt" | "updatedAt" = "alphabetical";
    export let showDropdown: boolean = false;

    export let onSortChange: (sort: "alphabetical" | "createdAt" | "updatedAt") => void = () => {};

    function selectSort(sort: "alphabetical" | "createdAt" | "updatedAt") {
        onSortChange(sort);
        showDropdown = false;
    }

    function toggleDropdown() {
        showDropdown = !showDropdown;
    }

    function handleClickOutside(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest(".sort-dropdown-container")) {
            showDropdown = false;
        }
    }

    $: sortLabel =
        sortBy === "alphabetical" ? "A-Z" : sortBy === "createdAt" ? "Newest" : "Updated";
</script>

<svelte:window on:click={handleClickOutside} />

<div class="sort-dropdown-container">
    <button class="sort-button" on:click|stopPropagation={toggleDropdown} type="button">
        <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="2">
            <path d="M3 6h18M6 12h12M9 18h6" />
        </svg>
        <span class="sort-label">{sortLabel}</span>
        <svg
            class="sort-chevron"
            class:rotated={showDropdown}
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
    </button>

    {#if showDropdown}
        <div class="sort-dropdown">
            <button
                class="sort-option"
                class:active={sortBy === "alphabetical"}
                on:click|stopPropagation={() => selectSort("alphabetical")}>
                <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2">
                    <path d="M3 6h18M6 12h12M9 18h6" />
                </svg>
                Alphabetical
            </button>
            <button
                class="sort-option"
                class:active={sortBy === "createdAt"}
                on:click|stopPropagation={() => selectSort("createdAt")}>
                <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Newest First
            </button>
            <button
                class="sort-option"
                class:active={sortBy === "updatedAt"}
                on:click|stopPropagation={() => selectSort("updatedAt")}>
                <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Recently Updated
            </button>
        </div>
    {/if}
</div>

<style>
    .sort-dropdown-container {
        position: relative;
    }

    .sort-button {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.5rem 0.75rem;
        border-radius: 0.5rem;
        background: var(--bg-secondary);
        border: 1px solid var(--border-primary);
        color: var(--text-secondary);
        cursor: pointer;
        font-family: inherit;
        font-size: 0.8125rem;
        font-weight: 500;
        transition: all 0.15s ease;
    }

    .sort-button:hover {
        background: var(--bg-tertiary);
        border-color: var(--accent-primary);
        color: var(--text-primary);
    }

    .sort-label {
        display: none;
    }

    @media (min-width: 480px) {
        .sort-label {
            display: inline;
        }
    }

    .sort-chevron {
        transition: transform 0.2s ease;
    }

    .sort-chevron.rotated {
        transform: rotate(180deg);
    }

    .sort-dropdown {
        position: absolute;
        top: calc(100% + 0.25rem);
        right: 0;
        min-width: 180px;
        background: var(--bg-elevated);
        border: 1px solid var(--border-primary);
        border-radius: 0.5rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 50;
        overflow: hidden;
    }

    .sort-option {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0.625rem 0.875rem;
        background: transparent;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        font-family: inherit;
        font-size: 0.8125rem;
        text-align: left;
        transition: all 0.15s ease;
    }

    .sort-option:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .sort-option.active {
        background: var(--accent-primary);
        color: white;
    }

    .sort-option.active:hover {
        background: var(--accent-primary-hover);
    }
</style>
