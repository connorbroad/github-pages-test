<script lang="ts">
    import SrpgModal from "../../../../shared/modal/SrpgModal.svelte";
    import CreateItemModal from "./CreateItemModal.svelte";
    import type { CampaignItem } from "../../../../data/storage-utils";

    export let show = false;
    export let campaignId: string;
    export let campaignItems: CampaignItem[] = [];
    export let onItemCreated: (item: any) => void = () => {};
    export let onItemDeleted: (itemId: string) => void = () => {};
    export let onClose: () => void = () => {};

    let showCreateItemModal = false;
    let expandedGroups: Set<string> = new Set(["simple", "weapon", "armor"]);

    let searchQuery = "";

    $: filteredItems = campaignItems.filter((item) => {
        const matchesSearch =
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.tags &&
                item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())));
        return matchesSearch;
    });

    $: groupedItems = {
        simple: filteredItems.filter((item) => item.type === "simple"),
        weapon: filteredItems.filter((item) => item.type === "weapon"),
        armor: filteredItems.filter((item) => item.type === "armor"),
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

    function handleCreateItemSave(item: any) {
        onItemCreated(item);
        showCreateItemModal = false;
    }

    function handleCreateItemClose() {
        showCreateItemModal = false;
    }

    function handleDeleteItem(itemId: string) {
        onItemDeleted(itemId);
    }

    function close() {
        onClose();
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

        if (item.weight) details.push({ icon: "weight", text: `${item.weight} wt` });
        if (item.cost) {
            const gpTotal = item.cost;
            const gp = Math.floor(gpTotal);
            const remainder = (gpTotal - gp) * 10;
            const sp = Math.floor(remainder + 0.01);
            const cp = Math.round((remainder - sp) * 10);

            const parts = [];
            if (gp > 0) parts.push(`${gp}g`);
            if (sp > 0) parts.push(`${sp}s`);
            if (cp > 0) parts.push(`${cp}c`);
            const costText = parts.length > 0 ? parts.join(" ") : "0g";
            details.push({ icon: "coin", text: costText });
        }

        if (item.type === "weapon") {
            if (item.range) details.push({ icon: "range", text: item.range });
            if (item.toHit) details.push({ icon: "target", text: `To Hit: ${item.toHit}` });
            if (item.attacks?.length) {
                item.attacks.forEach((atk) => {
                    details.push({
                        icon: "sword",
                        text: `${atk.name || "Attack"}: ${atk.dice} (${atk.kind})`,
                    });
                });
            }
        }

        if (item.type === "armor" && item.armorClass !== undefined) {
            details.push({ icon: "shield", text: `AC: ${item.armorClass}` });
        }

        return details;
    }

    function getIconSvg(iconType: string): string {
        const icons: Record<string, string> = {
            weight: "M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l7.5 3.75v7.34L12 19.02l-7.5-3.75V7.93L12 4.18z",
            coin: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z",
            range: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
            target: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z",
            sword: "M7.116 16.5v-1h7.134q-.85-.617-1.255-1.406t-.472-1.594H8.885v-1h3.638q.106-.844.51-1.633q.406-.788 1.217-1.367H3.5v-1H17q1.868 0 3.184 1.316Q21.5 10.13 21.5 11.997t-1.316 3.185T17 16.5zm9.884-1q1.442 0 2.471-1.029T20.5 12t-1.029-2.471T17 8.5t-2.471 1.029T13.5 12t1.029 2.471T17 15.5m-14.5-3v-1h5.385v1zm1 4v-1h2.616v1z",
            shield: "M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm6 9.09c0 4-2.55 7.7-6 8.83-3.45-1.13-6-4.82-6-8.83V6.31l6-2.12 6 2.12v4.78z",
        };
        return icons[iconType] || icons.weight;
    }
</script>

<SrpgModal bind:show maxWidth="600px" ariaLabel="Item Library" onClose={close}>
    <div class="modal-content">
        <div class="modal-header-sticky">
            <div class="header-main">
                <h2 class="srpg-modal-heading">Item Library</h2>
                <div class="header-actions">
                    <button class="srpg-b srpg-b-create srpg-b-sm" on:click={handleCreateItemClick}>
                        <svg
                            class="srpg-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        <span>Create</span>
                    </button>
                    {#if campaignItems.length > 0}
                        <span class="item-count-badge">
                            {campaignItems.length} items
                        </span>
                    {/if}
                </div>
            </div>

            <div class="search-bar">
                <svg
                    class="search-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                    type="text"
                    placeholder="Search items by name or tags..."
                    bind:value={searchQuery}
                    class="search-input" />
            </div>
        </div>

        <div class="library-content">
            {#if campaignItems.length === 0}
                <div class="empty-state">
                    <div class="empty-icon">📦</div>
                    <p class="srpg-empty-message">No items in library. Create your first item!</p>
                </div>
            {:else if filteredItems.length === 0}
                <div class="empty-state">
                    <p class="srpg-empty-message">No items match your search.</p>
                    <button class="srpg-b srpg-b-simple" on:click={() => (searchQuery = "")}>
                        Clear Search
                    </button>
                </div>
            {:else}
                {#each ["simple", "weapon", "armor"] as itemType}
                    {@const items = groupedItems[itemType]}
                    {#if items.length > 0}
                        <div class="item-group">
                            <button
                                class="srpg-group-header"
                                on:click={() => toggleGroup(itemType)}
                                aria-expanded={expandedGroups.has(itemType)}>
                                <div class="srpg-group-title">
                                    <span
                                        class="srpg-expand-icon"
                                        class:expanded={expandedGroups.has(itemType)}>
                                        ▶
                                    </span>
                                    {getItemTypeLabel(itemType)}
                                    <span class="srpg-group-count">{items.length}</span>
                                </div>
                            </button>

                            {#if expandedGroups.has(itemType)}
                                <div class="item-grid">
                                    {#each items as item (item.id)}
                                        <div
                                            class="item-card"
                                            class:weapon-card={item.type === "weapon"}
                                            class:armor-card={item.type === "armor"}>
                                            <div class="item-card-header">
                                                <div class="item-name">{item.name}</div>
                                                <button
                                                    class="delete-btn"
                                                    on:click={() => handleDeleteItem(item.id)}
                                                    aria-label="Delete {item.name}"
                                                    title="Delete {item.name}">
                                                    <svg
                                                        class="srpg-icon"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        stroke-width="2">
                                                        <path d="M18 6L6 18M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>

                                            <div class="item-card-details">
                                                {#each formatItemDetails(item) as detail}
                                                    <div class="card-detail">
                                                        <svg
                                                            class="detail-icon"
                                                            viewBox="0 0 24 24"
                                                            fill="currentColor">
                                                            <path d={getIconSvg(detail.icon)} />
                                                        </svg>
                                                        <span class="detail-text">
                                                            {detail.text}
                                                        </span>
                                                    </div>
                                                {/each}
                                            </div>

                                            {#if item.tags && item.tags.length > 0}
                                                <div class="item-card-tags">
                                                    {#each item.tags as tag}
                                                        <span class="item-tag">{tag}</span>
                                                    {/each}
                                                </div>
                                            {/if}
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
    onSave={handleCreateItemSave}
    onClose={handleCreateItemClose} />

<style>
    .modal-content {
        display: flex;
        flex-direction: column;
        height: 100%;
        text-align: left;
    }

    .modal-header-sticky {
        position: sticky;
        top: 0;
        background: var(--modal-bg);
        z-index: 10;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--border-primary);
        margin-bottom: 1rem;
    }

    .header-main {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .header-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .item-count-badge {
        font-size: 0.75rem;
        color: var(--text-muted);
        background: var(--bg-secondary);
        padding: 0.25rem 0.5rem;
        border-radius: 99px;
        font-weight: 500;
    }

    .search-bar {
        position: relative;
        display: flex;
        align-items: center;
    }

    .search-icon {
        position: absolute;
        left: 0.75rem;
        width: 1rem;
        height: 1rem;
        color: var(--text-muted);
        pointer-events: none;
    }

    .search-input {
        width: 100%;
        padding: 0.625rem 0.75rem 0.625rem 2.25rem;
        background: var(--input-bg);
        border: 1px solid var(--border-primary);
        border-radius: 8px;
        color: var(--text-primary);
        font-size: 0.875rem;
        transition: all 0.2s ease;
    }

    .search-input:focus {
        outline: none;
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 2px var(--srpg-focus-ring);
    }

    .library-content {
        flex: 1;
        overflow-y: auto;
        padding-right: 0.25rem;
    }

    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem 1rem;
        color: var(--text-muted);
    }

    .empty-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.5;
    }

    .item-group {
        margin-bottom: 1.5rem;
    }

    .srpg-group-header {
        width: 100%;
        display: flex;
        align-items: center;
        padding: 0.5rem 0;
        background: transparent;
        border: none;
        cursor: pointer;
        color: var(--text-primary);
        font-weight: 600;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid var(--border-secondary);
        margin-bottom: 1rem;
        transition: color 0.2s;
    }

    .srpg-group-header:hover {
        color: var(--accent-primary);
    }

    .srpg-group-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .srpg-expand-icon {
        font-size: 0.7rem;
        transition: transform 0.2s;
        display: inline-block;
        width: 1rem;
        text-align: center;
    }

    .srpg-expand-icon.expanded {
        transform: rotate(90deg);
    }

    .srpg-group-count {
        margin-left: 0.5rem;
        opacity: 0.5;
        font-weight: normal;
        font-size: 0.8rem;
    }

    .item-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 1rem;
        padding: 0.25rem;
    }

    .item-card {
        background: var(--card-bg);
        border: 1px solid var(--border-primary);
        border-radius: 10px;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        position: relative;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px var(--shadow-sm);
    }

    .item-card:hover {
        border-color: var(--accent-primary);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px var(--shadow-md);
    }

    .weapon-card {
        border-left: 3px solid var(--accent-danger);
    }

    .armor-card {
        border-left: 3px solid var(--accent-info);
    }

    .item-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.5rem;
    }

    .item-name {
        font-weight: 700;
        font-size: 1rem;
        color: var(--text-primary);
        line-height: 1.2;
    }

    .delete-btn {
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        transition: all 0.2s;
        opacity: 0.3;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .item-card:hover .delete-btn {
        opacity: 1;
    }

    .delete-btn:hover {
        color: var(--accent-danger);
        background: var(--bg-secondary);
    }

    .item-card-details {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
    }

    .card-detail {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8rem;
        color: var(--text-secondary);
    }

    .detail-icon {
        width: 0.875rem;
        height: 0.875rem;
        opacity: 0.7;
    }

    .item-card-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.375rem;
        margin-top: auto;
    }

    .item-tag {
        font-size: 0.65rem;
        background: var(--bg-secondary);
        color: var(--text-muted);
        padding: 0.125rem 0.375rem;
        border-radius: 4px;
        border: 1px solid var(--border-secondary);
    }

    .modal-actions {
        margin-top: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid var(--border-primary);
        display: flex;
        justify-content: flex-end;
    }

    @media (max-width: 480px) {
        .item-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
