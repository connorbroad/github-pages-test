<script lang="ts">
    /**
     * Shared TagFilterBar component for filtering by tags
     * Displays collapsible tag filter buttons
     */

    export let tags: string[] = [];
    export let selectedTag: string = "All";
    export let itemCount: number = 0;
    export let isExpanded: boolean = false;

    export let onTagSelect: (tag: string) => void = () => {};
    export let onToggleExpand: (isExpanded: boolean) => void = () => {};

    function selectTag(tag: string) {
        onTagSelect(tag);
    }

    function toggleExpand() {
        isExpanded = !isExpanded;
        onToggleExpand(isExpanded);
    }

    function getTagHue(tag: string): number {
        return tag.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
    }
</script>

<div class="srpg-collapsible-section">
    <button class="srpg-collapsible-header" on:click={toggleExpand} type="button">
        <span class="srpg-collapsible-title">
            Filter by Tag
            {#if selectedTag !== "All"}
                <span class="active-filter-badge">{selectedTag}</span>
            {/if}
        </span>
        <svg
            class="srpg-collapsible-chevron"
            class:rotated={isExpanded}
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
    </button>

    {#if isExpanded}
        <div class="srpg-collapsible-content">
            <div class="tag-filter-container">
                <button
                    class="tag-filter-btn"
                    class:tag-filter-btn-active={selectedTag === "All"}
                    on:click={() => selectTag("All")}>
                    All ({itemCount})
                </button>
                {#each tags as tag}
                    {@const tagHue = getTagHue(tag)}
                    <button
                        class="tag-filter-btn"
                        class:tag-filter-btn-active={selectedTag === tag}
                        style="--tag-hue: {tagHue};"
                        on:click={() => selectTag(tag)}>
                        {tag}
                    </button>
                {/each}
            </div>
        </div>
    {/if}
</div>

<style>
    .srpg-collapsible-section {
        border-radius: 0.5rem;
        overflow: hidden;
        background: var(--bg-secondary);
        border: 1px solid var(--border-primary);
    }

    .srpg-collapsible-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 0.75rem 1rem;
        background: transparent;
        border: none;
        cursor: pointer;
        font-family: inherit;
        transition: background-color 0.15s ease;
    }

    .srpg-collapsible-header:hover {
        background: var(--bg-tertiary);
    }

    .srpg-collapsible-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-secondary);
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .active-filter-badge {
        padding: 0.125rem 0.5rem;
        background: var(--accent-primary);
        color: white;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 500;
    }

    .srpg-collapsible-chevron {
        color: var(--text-muted);
        transition: transform 0.2s ease;
    }

    .srpg-collapsible-chevron.rotated {
        transform: rotate(180deg);
    }

    .srpg-collapsible-content {
        padding: 0.75rem;
        border-top: 1px solid var(--border-primary);
    }

    .tag-filter-container {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .tag-filter-btn {
        padding: 0.375rem 0.75rem;
        border-radius: 999px;
        font-size: 0.8125rem;
        font-weight: 500;
        background: var(--bg-tertiary);
        color: var(--text-secondary);
        border: 1px solid var(--border-primary);
        cursor: pointer;
        transition: all 0.15s ease;
        font-family: inherit;
    }

    .tag-filter-btn:hover {
        background: var(--bg-elevated);
        border-color: var(--accent-primary);
        color: var(--text-primary);
    }

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
</style>
