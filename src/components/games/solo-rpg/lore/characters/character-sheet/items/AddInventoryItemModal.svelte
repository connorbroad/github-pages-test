<script lang="ts">
    import SrpgModal from "../../../../shared/modal/SrpgModal.svelte";
    import type { CampaignItem } from "../../../../data/storage-utils";

    export let show = false;
    export let campaignItems: CampaignItem[] = [];
    export let onSave: (detail: { itemId: string; quantity: number }) => void = () => {};
    export let onClose: () => void = () => {};

    let selectedItemId = "";
    let quantity = 1;
    let searchQuery = "";
    let filterType: "all" | "weapon" | "armor" | "general" = "all";

    $: filteredItems = campaignItems.filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === "all" || item.type === filterType;
        return matchesSearch && matchesType;
    });

    function handleSave() {
        if (!selectedItemId || quantity < 1) return;
        onSave({ itemId: selectedItemId, quantity });
        resetAndClose();
    }

    function handleClose() {
        onClose();
        resetAndClose();
    }

    function resetAndClose() {
        selectedItemId = "";
        quantity = 1;
        searchQuery = "";
        filterType = "all";
        show = false;
    }

    function selectItem(id: string) {
        selectedItemId = id;
    }

    function adjustQuantity(amount: number) {
        quantity = Math.max(1, quantity + amount);
    }
</script>

<SrpgModal bind:show maxWidth="600px" ariaLabel="Add Inventory Item" onClose={handleClose}>
    <div class="modal-content">
        <h2 class="srpg-modal-heading">Add Item from Library</h2>

        <div class="selection-controls">
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
                    placeholder="Search items..."
                    bind:value={searchQuery}
                    class="search-input" />
            </div>

            <div class="filter-chips">
                {#each ["all", "weapon", "armor", "general"] as type}
                    <button
                        class="filter-chip"
                        class:active={filterType === type}
                        on:click={() => (filterType = type as any)}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                {/each}
            </div>
        </div>

        <div class="item-selection-grid">
            {#if filteredItems.length === 0}
                <p class="empty-msg">No items found matching your filters.</p>
            {:else}
                {#each filteredItems as item (item.id)}
                    <button
                        class="item-chip"
                        class:selected={selectedItemId === item.id}
                        on:click={() => selectItem(item.id)}>
                        <span class="item-chip-name">{item.name}</span>
                        {#if item.type === "weapon"}
                            <span class="item-chip-type weapon">W</span>
                        {:else if item.type === "armor"}
                            <span class="item-chip-type armor">A</span>
                        {/if}
                    </button>
                {/each}
            {/if}
        </div>

        <div class="bottom-controls">
            <div class="quantity-control">
                <label for="qty">Quantity</label>
                <div class="stepper">
                    <button
                        class="step-btn"
                        on:click={() => adjustQuantity(-1)}
                        disabled={quantity <= 1}>
                        −
                    </button>
                    <div class="qty-display">{quantity}</div>
                    <button class="step-btn" on:click={() => adjustQuantity(1)}>+</button>
                </div>
            </div>

            <div class="modal-actions">
                <button class="srpg-b srpg-b-simple" on:click={handleClose}>Cancel</button>
                <button
                    class="srpg-b srpg-b-create"
                    on:click={handleSave}
                    disabled={!selectedItemId}>
                    Add to Inventory
                </button>
            </div>
        </div>
    </div>
</SrpgModal>

<style>
    .modal-content {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        text-align: left;
    }

    .selection-controls {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
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

    .filter-chips {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .filter-chip {
        padding: 0.25rem 0.75rem;
        border-radius: 99px;
        font-size: 0.75rem;
        background: var(--bg-secondary);
        border: 1px solid var(--border-primary);
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.2s;
        font-weight: 500;
    }

    .filter-chip:hover {
        background: var(--bg-tertiary);
        border-color: var(--border-secondary);
    }

    .filter-chip.active {
        background: var(--accent-primary);
        color: white;
        border-color: var(--accent-primary);
    }

    .item-selection-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 0.5rem;
        max-height: 300px;
        overflow-y: auto;
        padding: 0.25rem;
        border: 1px solid var(--border-primary);
        border-radius: 8px;
        background: var(--bg-secondary);
    }

    .item-chip {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.625rem 0.75rem;
        background: var(--card-bg);
        border: 1px solid var(--border-primary);
        border-radius: 6px;
        cursor: pointer;
        text-align: left;
        transition: all 0.2s;
        gap: 0.5rem;
    }

    .item-chip:hover {
        border-color: var(--accent-primary);
        background: var(--bg-tertiary);
    }

    .item-chip.selected {
        border-color: var(--accent-primary);
        background: var(--srpg-focus-ring);
        box-shadow: 0 0 0 1px var(--accent-primary);
    }

    .item-chip-name {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .item-chip-type {
        font-size: 0.6rem;
        font-weight: 800;
        width: 1.25rem;
        height: 1.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 3px;
        flex-shrink: 0;
    }

    .item-chip-type.weapon {
        background: var(--accent-danger);
        color: white;
    }

    .item-chip-type.armor {
        background: var(--accent-info);
        color: white;
    }

    .empty-msg {
        grid-column: 1 / -1;
        text-align: center;
        padding: 2rem;
        color: var(--text-muted);
        font-size: 0.875rem;
    }

    .bottom-controls {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        margin-top: 0.5rem;
    }

    .quantity-control {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem;
        background: var(--bg-secondary);
        border-radius: 8px;
        border: 1px dashed var(--border-primary);
    }

    .quantity-control label {
        font-weight: 600;
        font-size: 0.9rem;
        color: var(--text-secondary);
    }

    .stepper {
        display: flex;
        align-items: center;
        background: var(--card-bg);
        border: 1px solid var(--border-primary);
        border-radius: 6px;
        overflow: hidden;
    }

    .step-btn {
        width: 2.5rem;
        height: 2.5rem;
        border: none;
        background: transparent;
        color: var(--text-primary);
        cursor: pointer;
        font-size: 1.25rem;
        transition: background 0.2s;
    }

    .step-btn:hover:not(:disabled) {
        background: var(--bg-tertiary);
    }

    .step-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }

    .qty-display {
        width: 3rem;
        text-align: center;
        font-weight: 700;
        font-size: 1.125rem;
        border-left: 1px solid var(--border-primary);
        border-right: 1px solid var(--border-primary);
    }

    .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
    }

    @media (max-width: 480px) {
        .item-selection-grid {
            grid-template-columns: 1fr;
        }

        .modal-actions {
            flex-direction: column-reverse;
        }

        .modal-actions button {
            width: 100%;
        }
    }
</style>
