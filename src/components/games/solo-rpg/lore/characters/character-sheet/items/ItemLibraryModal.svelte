<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import SrpgModal from "../../../../shared/modal/SrpgModal.svelte";
    import CreateItemModal from "./CreateItemModal.svelte";
    import type { CampaignItem } from "../../../../data/storage-utils";

    export let show = false;
    export let campaignId: string;
    export let campaignItems: CampaignItem[] = [];

    const dispatch = createEventDispatcher();

    let showCreateItemModal = false;
    let expandedGroups: Set<string> = new Set(["simple", "weapon", "armor"]);

    $: groupedItems = {
        simple: campaignItems.filter((item) => item.type === "simple"),
        weapon: campaignItems.filter((item) => item.type === "weapon"),
        armor: campaignItems.filter((item) => item.type === "armor"),
    };

    function toggleGroup(group: string) {
        if (expandedGroups.has(group)) {
            expandedGroups.delete(group);
        } else {
            expandedGroups.add(group);
        }
        expandedGroups = expandedGroups;
    }

    function handleCreateItemClick() {
        showCreateItemModal = true;
    }

    function handleCreateItemSave(event: CustomEvent) {
        dispatch("itemCreated", event.detail);
        showCreateItemModal = false;
    }

    function handleCreateItemClose() {
        showCreateItemModal = false;
    }

    function handleDeleteItem(itemId: string) {
        dispatch("itemDeleted", itemId);
    }

    function close() {
        dispatch("close");
        show = false;
    }

    function getItemTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            simple: "General Items",
            weapon: "Weapons",
            armor: "Armor",
        };
        return labels[type] || type;
    }

    type ItemDetail = {
        icon: string;
        text: string;
    };

    function formatItemDetails(item: CampaignItem): ItemDetail[] {
        const details: ItemDetail[] = [];
        
        if (item.weight) details.push({ icon: 'weight', text: `${item.weight} wt` });
        if (item.cost) details.push({ icon: 'coin', text: `${item.cost} gp` });
        
        if (item.type === "weapon") {
            if (item.range) details.push({ icon: 'range', text: item.range });
            if (item.toHit) details.push({ icon: 'target', text: `To Hit: ${item.toHit}` });
            if (item.attacks?.length) {
                item.attacks.forEach(atk => {
                    details.push({ icon: 'sword', text: `${atk.name || "Attack"}: ${atk.dice} (${atk.kind})` });
                });
            }
        }
        
        if (item.type === "armor" && item.armorClass !== undefined) {
            details.push({ icon: 'shield', text: `AC: ${item.armorClass}` });
        }
        
        return details;
    }

    function getIconSvg(iconType: string): string {
        const icons: Record<string, string> = {
            weight: 'M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l7.5 3.75v7.34L12 19.02l-7.5-3.75V7.93L12 4.18z',
            coin: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z',
            range: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
            target: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z',
            sword: "M7.116 16.5v-1h7.134q-.85-.617-1.255-1.406t-.472-1.594H8.885v-1h3.638q.106-.844.51-1.633q.406-.788 1.217-1.367H3.5v-1H17q1.868 0 3.184 1.316Q21.5 10.13 21.5 11.997t-1.316 3.185T17 16.5zm9.884-1q1.442 0 2.471-1.029T20.5 12t-1.029-2.471T17 8.5t-2.471 1.029T13.5 12t1.029 2.471T17 15.5m-14.5-3v-1h5.385v1zm1 4v-1h2.616v1z",
            shield: 'M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm6 9.09c0 4-2.55 7.7-6 8.83-3.45-1.13-6-4.82-6-8.83V6.31l6-2.12 6 2.12v4.78z',
        };
        return icons[iconType] || icons.weight;
    }
</script>

<SrpgModal bind:show maxWidth="600px" ariaLabel="Item Library" on:close={close}>
    <div class="modal-content">
        <div class="modal-header-sticky">
            <h2 class="srpg-modal-heading">Item Library</h2>
            
            <div class="library-header">
                <button class="srpg-b srpg-b-create srpg-b-sm" on:click={handleCreateItemClick}>
                    <svg class="srpg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 5v14M5 12h14"/>
                    </svg>
                    <span class="button-text">Create</span>
                </button>
                {#if campaignItems.length > 0}
                    <span class="item-count-badge">
                        {campaignItems.length} {campaignItems.length === 1 ? 'item' : 'items'}
                    </span>
                {/if}
            </div>
        </div>

        <div class="library-content">
            {#if campaignItems.length === 0}
                <p class="srpg-empty-message">No items in library. Create your first item!</p>
            {:else}
                {#each ["simple", "weapon", "armor"] as itemType}
                    {@const items = groupedItems[itemType]}
                    {#if items.length > 0}
                        <div class="item-group">
                            <button 
                                class="srpg-group-header" 
                                on:click={() => toggleGroup(itemType)}
                                aria-expanded={expandedGroups.has(itemType)}
                            >
                                <div class="srpg-group-title">
                                    <span class="srpg-expand-icon" class:expanded={expandedGroups.has(itemType)}>
                                        ▶
                                    </span>
                                    {getItemTypeLabel(itemType)}
                                    <span class="srpg-group-count">{items.length}</span>
                                </div>
                            </button>
                            
                            {#if expandedGroups.has(itemType)}
                                <div class="item-list">
                                    {#each items as item (item.id)}
                                        <div class="item-row">
                                            <div class="item-info">
                                                <div class="item-header-row">
                                                    <div class="item-name">{item.name}</div>
                                                    <button 
                                                        class="srpg-b srpg-b-icon delete-icon" 
                                                        on:click={() => handleDeleteItem(item.id)}
                                                        aria-label="Delete {item.name}"
                                                        title="Delete {item.name}"
                                                    >
                                                        <svg class="srpg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                                        </svg>
                                                    </button>
                                                </div>
                                                {#if formatItemDetails(item).length > 0}
                                                    <div class="item-details">
                                                        {#each formatItemDetails(item) as detail}
                                                            <span class="item-detail">
                                                                <svg class="detail-icon" viewBox="0 0 24 24" fill="currentColor">
                                                                    <path d={getIconSvg(detail.icon)} />
                                                                </svg>
                                                                <span class="detail-text">{detail.text}</span>
                                                            </span>
                                                        {/each}
                                                    </div>
                                                {/if}
                                                {#if item.tags && item.tags.length > 0}
                                                    <div class="item-tags">
                                                        {#each item.tags as tag}
                                                            <span class="srpg-badge srpg-badge-sm">{tag}</span>
                                                        {/each}
                                                    </div>
                                                {/if}
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    {/if}
                {/each}
            {/if}
        </div>

        <div class="modal-actions">
            <button class="srpg-b srpg-b-simple" on:click={close}>Close</button>
        </div>
    </div>
</SrpgModal>

<CreateItemModal
    bind:show={showCreateItemModal}
    {campaignId}
    on:save={handleCreateItemSave}
    on:close={handleCreateItemClose}
/>

<style>
    .modal-content {
        padding: 0;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .modal-header-sticky {
        position: sticky;
        top: 0;
        z-index: 10;
        background: var(--modal-bg);
        padding: 1.5rem 1.5rem 1rem;
        border-bottom: 1px solid var(--border-primary);
    }

    .modal-header-sticky h2 {
        margin-bottom: 1rem;
    }

    .library-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
    }

    .item-count-badge {
        font-size: 0.875rem;
        color: var(--text-secondary);
        font-weight: 600;
        padding: 0.25rem 0.75rem;
        background: var(--bg-secondary);
        border-radius: 12px;
        white-space: nowrap;
    }

    .library-content {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 1rem 1.5rem;
        /* Smooth scrolling on mobile */
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
    }

    .item-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .item-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding-left: 0.5rem;
    }

    .item-row {
        display: flex;
        align-items: stretch;
        padding: 0.75rem 0.875rem;
        background: var(--card-bg);
        border: 1px solid var(--border-primary);
        border-radius: 8px;
        transition: all 0.2s ease;
        /* Prevent text selection on mobile tap */
        -webkit-tap-highlight-color: transparent;
    }

    .item-row:hover {
        border-color: var(--accent-primary);
        box-shadow: 0 2px 4px var(--shadow-sm);
    }

    .item-row:active {
        transform: scale(0.99);
    }

    .item-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
        min-width: 0; /* Allow text truncation */
    }

    .item-header-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.75rem;
        margin-bottom: 0.125rem;
    }

    .item-name {
        flex: 1;
        font-weight: 600;
        color: var(--text-primary);
        font-size: 1.05rem;
        line-height: 1.3;
        word-break: break-word;
    }

    .item-details {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem 0.75rem;
        font-size: 0.8125rem;
        color: var(--text-muted);
        line-height: 1.4;
    }

    .item-detail {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        white-space: nowrap;
    }

    .detail-icon {
        width: 14px;
        height: 14px;
        flex-shrink: 0;
        opacity: 0.7;
    }

    .detail-text {
        line-height: 1;
    }

    .item-detail::after {
        content: "";
        display: none;
    }

    .item-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
    }

    .delete-icon {
        flex-shrink: 0;
        margin: -0.25rem 0;
    }

    .modal-actions {
        display: flex;
        gap: 0.75rem;
        padding: 1rem 1.5rem;
        justify-content: flex-end;
        border-top: 1px solid var(--border-primary);
        background: var(--modal-bg);
    }

    /* Mobile optimizations */
    @media (max-width: 767px) {
        .modal-content {
            max-height: 85vh;
        }

        .modal-header-sticky {
            padding: 1rem 1rem 0.75rem;
        }

        .modal-header-sticky h2 {
            font-size: 1.25rem;
            margin-bottom: 0.75rem;
        }

        .library-header {
            flex-direction: row;
            justify-content: space-between;
        } 

        .srpg-b-create {
            padding: 0.5rem 0.75rem;
        }

        .library-content {
            padding: 0.75rem 1rem;
            gap: 0.5rem;
        }

        .item-list {
            padding-left: 0.25rem;
            gap: 0.5rem;
        }

        .item-row {
            padding: 0.625rem 0.75rem;
        }

        .item-header-row {
            gap: 0.5rem;
            margin-bottom: 0.125rem;
        }

        .item-name {
            font-size: 0.95rem;
        }

        .item-details {
            flex-direction: row;
            gap: 0.375rem 0.625rem;
            font-size: 0.75rem;
        }

        .detail-icon {
            width: 12px;
            height: 12px;
        }

        .item-detail::after {
            display: none;
        }

        .delete-icon {
            /* Larger touch target on mobile */
            min-width: 36px;
            min-height: 36px;
        }

        .modal-actions {
            padding: 0.875rem 1rem;
        }

        .modal-actions button {
            flex: 1;
        }
    }

    /* Tablet optimizations */
    @media (min-width: 768px) and (max-width: 1024px) {
        .modal-header-sticky {
            padding: 1.25rem 1.25rem 0.875rem;
        }

        .library-content {
            padding: 0.875rem 1.25rem;
        }

        .modal-actions {
            padding: 0.875rem 1.25rem;
        }
    }

    /* Better scrollbar styling for webkit browsers */
    @media (min-width: 768px) {
        .library-content::-webkit-scrollbar {
            width: 8px;
        }

        .library-content::-webkit-scrollbar-track {
            background: var(--bg-secondary);
            border-radius: 4px;
        }

        .library-content::-webkit-scrollbar-thumb {
            background: var(--border-primary);
            border-radius: 4px;
        }

        .library-content::-webkit-scrollbar-thumb:hover {
            background: var(--border-secondary);
        }
    }

    /* Ensure smooth animations */
    @media (prefers-reduced-motion: reduce) {
        .item-row {
            transition: none;
        }
        
        .item-row:active {
            transform: none;
        }
    }
</style>
