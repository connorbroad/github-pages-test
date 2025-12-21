<script lang="ts">
    import type { Character } from "../../../data/storage-utils";
    import { loadCampaignItems, saveCampaignItems } from "../../../data/storage-utils";
    import ItemLibraryModal from "./items/ItemLibraryModal.svelte";
    import AddInventoryItemModal from "./items/AddInventoryItemModal.svelte";

    export let character: Character;
    export let editedCharacter: Character;
    export let isEditable: boolean;
    export let saveSection: () => void; // callback to trigger parent save

    let showItemLibraryModal = false;
    let showAddInventoryItemModal = false;
    let campaignItems = loadCampaignItems().filter((i) => i.campaignId === character.campaignId);

    // Build a fast lookup map and helper to avoid repeated array.find calls in the template
    $: itemMap = new Map(campaignItems.map((i: any) => [i.id, i]));
    function getItem(id: string) {
        return itemMap.get(id);
    }

    // Precompute inventory entries with their item data and group by type for simpler templates
    $: invWithItem = (editedCharacter?.inventory || []).map((invItem: any) => ({
        invItem,
        item: getItem(invItem.itemId),
    }));
    $: generalItems = invWithItem.filter((x: any) => x.item?.type === "simple");
    $: weaponItems = invWithItem.filter((x: any) => x.item?.type === "weapon");
    $: armorItems = invWithItem.filter((x: any) => x.item?.type === "armor");

    // Keep invItem.equipped in sync with editedCharacter.equipped arrays
    $: {
        const eq = editedCharacter?.equipped;
        if (eq && editedCharacter?.inventory) {
            for (const { invItem, item } of invWithItem) {
                if (!item) continue;
                if (item.type === "weapon") {
                    invItem.equipped = !!eq.weapons?.includes(invItem.itemId);
                } else if (item.type === "armor") {
                    invItem.equipped = !!eq.armors?.includes(invItem.itemId);
                }
            }
        }
    }

    // Calculate total weight carried
    $: totalWeight = invWithItem.reduce((sum, { invItem, item }) => {
        if (item?.weight) {
            return sum + item.weight * invItem.quantity;
        }
        return sum;
    }, 0);

    // Check if over weight limit
    $: maxCarryWeight = editedCharacter?.maxCarryWeight ?? 0;
    $: isOverWeight = maxCarryWeight > 0 && totalWeight > maxCarryWeight;

    function handleItemLibraryClick() {
        showItemLibraryModal = true;
    }
    function handleAddItemClick() {
        showAddInventoryItemModal = true;
    }

    function handleItemCreated(newItem: any) {
        const items = loadCampaignItems();
        items.push(newItem);
        saveCampaignItems(items);
        campaignItems = loadCampaignItems().filter((i) => i.campaignId === character.campaignId);
        saveSection();
    }

    function handleItemDeleted(itemId: string) {
        const items = loadCampaignItems().filter((i) => i.id !== itemId);
        saveCampaignItems(items);

        // Remove from character inventory if present
        if (editedCharacter.inventory) {
            editedCharacter.inventory = editedCharacter.inventory.filter(
                (invItem) => invItem.itemId !== itemId
            );
        }

        // Remove from equipped if present
        if (editedCharacter.equipped) {
            editedCharacter.equipped.weapons = editedCharacter.equipped.weapons.filter(
                (id) => id !== itemId
            );
            editedCharacter.equipped.armors = editedCharacter.equipped.armors.filter(
                (id) => id !== itemId
            );
        }

        campaignItems = loadCampaignItems().filter((i) => i.campaignId === character.campaignId);
        saveSection();
    }

    function handleItemLibraryClose() {
        showItemLibraryModal = false;
    }

    function handleAddInventoryItemSave(detail: any) {
        const { itemId, quantity } = detail;
        let inv = editedCharacter.inventory || [];
        const idx = inv.findIndex((i) => i.itemId === itemId);
        if (idx >= 0) {
            inv[idx].quantity += quantity;
        } else {
            inv.push({ itemId, quantity });
        }
        editedCharacter.inventory = inv;
        campaignItems = loadCampaignItems().filter((i) => i.campaignId === character.campaignId);
        showAddInventoryItemModal = false;
        saveSection();
    }
    function handleAddInventoryItemClose() {
        showAddInventoryItemModal = false;
    }

    function ensureEquippedArrays() {
        if (!editedCharacter.equipped) {
            editedCharacter.equipped = { weapons: [], armors: [] } as any;
        } else {
            editedCharacter.equipped.weapons = editedCharacter.equipped.weapons || [];
            editedCharacter.equipped.armors = editedCharacter.equipped.armors || [];
        }
    }

    function toggleEquip(entry: any) {
        const { invItem, item } = entry.item
            ? entry
            : { invItem: entry, item: getItem(entry.itemId) };
        if (!item) return;
        ensureEquippedArrays();

        if (item.type === "weapon") {
            invItem.equipped = !invItem.equipped;
            if (invItem.equipped) {
                if (!editedCharacter.equipped.weapons.includes(invItem.itemId)) {
                    editedCharacter.equipped.weapons.push(invItem.itemId);
                }
            } else {
                editedCharacter.equipped.weapons = editedCharacter.equipped.weapons.filter(
                    (id) => id !== invItem.itemId
                );
            }
        } else if (item.type === "armor") {
            // Allow multiple armors: toggle this one without touching others
            invItem.equipped = !invItem.equipped;
            if (invItem.equipped) {
                if (!editedCharacter.equipped.armors.includes(invItem.itemId)) {
                    editedCharacter.equipped.armors.push(invItem.itemId);
                }
            } else {
                editedCharacter.equipped.armors = editedCharacter.equipped.armors.filter(
                    (id) => id !== invItem.itemId
                );
            }
        }
        saveSection();
    }

    // ----- Item details + icons (shared with ItemLibraryModal pattern) -----
    type ItemDetail = { icon: string; text: string };
    function formatItemDetails(item: any): ItemDetail[] {
        if (!item) return [];
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
                item.attacks.forEach((atk: any) => {
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

<div class="inventory-section">
    <div class="stats-header">
        <div class="stat-group money-group">
            <h4 class="stat-label">Currency</h4>
            <div class="currency-chips">
                {#if isEditable}
                    <div class="currency-inputs">
                        <div class="curr-input gold">
                            <svg class="coin-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path
                                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" />
                            </svg>
                            <input
                                type="number"
                                bind:value={editedCharacter.currency.gp}
                                aria-label="Gold" />
                        </div>
                        <div class="curr-input silver">
                            <svg class="coin-icon" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="12" cy="12" r="10" />
                            </svg>
                            <input
                                type="number"
                                bind:value={editedCharacter.currency.sp}
                                aria-label="Silver" />
                        </div>
                        <div class="curr-input copper">
                            <svg class="coin-icon" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="12" cy="12" r="10" />
                            </svg>
                            <input
                                type="number"
                                bind:value={editedCharacter.currency.cp}
                                aria-label="Copper" />
                        </div>
                    </div>
                {:else}
                    <div class="currency-badges">
                        <div class="curr-badge gold">
                            <span class="curr-value">G</span>
                            <span class="curr-num">{editedCharacter.currency.gp}</span>
                        </div>
                        <div class="curr-badge silver">
                            <span class="curr-value">S</span>
                            <span class="curr-num">{editedCharacter.currency.sp}</span>
                        </div>
                        <div class="curr-badge copper">
                            <span class="curr-value">C</span>
                            <span class="curr-num">{editedCharacter.currency.cp}</span>
                        </div>
                    </div>
                {/if}
            </div>
        </div>

        <div class="stat-group weight-group" class:over-capacity={isOverWeight}>
            <h4 class="stat-label">Carry Weight</h4>
            <div class="weight-display">
                <div class="weight-main">
                    <svg class="weight-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path
                            d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l7.5 3.75v7.34L12 19.02l-7.5-3.75V7.93L12 4.18z" />
                    </svg>
                    <span class="weight-current">{totalWeight.toFixed(1)}</span>
                    {#if maxCarryWeight > 0}
                        <span class="weight-sep">/</span>
                        {#if isEditable}
                            <input
                                class="weight-limit-input"
                                type="number"
                                bind:value={editedCharacter.maxCarryWeight} />
                        {:else}
                            <span class="weight-max">{maxCarryWeight}</span>
                        {/if}
                    {/if}
                </div>
                {#if isOverWeight}
                    <span class="overweight-tag">Encumbered</span>
                {/if}
            </div>
        </div>
    </div>

    <div class="inventory-actions">
        <button class="srpg-b srpg-b-secondary lib-btn" on:click={handleItemLibraryClick}>
            <svg viewBox="0 0 24 24" width="1.2em" height="1.2em" fill="currentColor">
                <path
                    d="M12 9c2.21 0 4-1.79 4-4s-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4m0-6c1.1 0 2 .9 2 2s-.9 2-2 2s-2-.9-2-2s.9-2 2-2m0 8.55C9.64 9.35 6.48 8 3 8v11c3.48 0 6.64 1.35 9 3.55c2.36-2.19 5.52-3.55 9-3.55V8c-3.48 0-6.64 1.35-9 3.55m7 5.58c-2.53.34-4.93 1.3-7 2.82a15.2 15.2 0 0 0-7-2.83v-6.95c2.1.38 4.05 1.35 5.64 2.83L12 14.28l1.36-1.27A11.2 11.2 0 0 1 19 10.18z" />
            </svg>
            Library
        </button>
        <button
            class="srpg-b srpg-b-create add-btn"
            on:click={handleAddItemClick}
            disabled={campaignItems.length === 0}>
            <svg
                viewBox="0 0 24 24"
                width="1.2em"
                height="1.2em"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5">
                <path d="M12 5v14M5 12h14" />
            </svg>
            Add Item
        </button>
    </div>

    <div class="inventory-list">
        {#if (editedCharacter.inventory || []).length === 0}
            <div class="empty-state">
                <p>Your inventory is empty.</p>
                <button class="srpg-b srpg-b-simple" on:click={handleAddItemClick}>
                    Add your first item
                </button>
            </div>
        {:else}
            {#if weaponItems.length > 0}
                <div class="inventory-group">
                    <div class="srpg-group-header">
                        <span class="srpg-group-title">Weapons</span>
                        <span class="srpg-group-count">{weaponItems.length}</span>
                    </div>
                    <div class="category-grid">
                        {#each weaponItems as row}
                            <div class="inventory-card" class:equipped={row.invItem.equipped}>
                                <div class="card-left">
                                    <button
                                        class="equip-toggle"
                                        class:is-equipped={row.invItem.equipped}
                                        on:click={() => toggleEquip(row)}>
                                        {row.invItem.equipped ? "EQUIPPED" : "EQUIP"}
                                    </button>
                                </div>
                                <div class="card-main">
                                    <div class="item-header">
                                        <span class="item-name">
                                            {row.item?.name || row.invItem.itemId}
                                        </span>
                                        <span class="item-qty">x{row.invItem.quantity}</span>
                                    </div>
                                    <div class="item-details">
                                        {#each formatItemDetails(row.item) as detail}
                                            <div class="detail-tag">
                                                <svg
                                                    class="detail-icon"
                                                    viewBox="0 0 24 24"
                                                    fill="currentColor">
                                                    <path d={getIconSvg(detail.icon)} />
                                                </svg>
                                                {detail.text}
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}

            {#if armorItems.length > 0}
                <div class="inventory-group">
                    <div class="srpg-group-header">
                        <span class="srpg-group-title">Armor</span>
                        <span class="srpg-group-count">{armorItems.length}</span>
                    </div>
                    <div class="category-grid">
                        {#each armorItems as row}
                            <div
                                class="inventory-card armor-card"
                                class:equipped={row.invItem.equipped}>
                                <div class="card-left">
                                    <button
                                        class="equip-toggle"
                                        class:is-equipped={row.invItem.equipped}
                                        on:click={() => toggleEquip(row)}>
                                        {row.invItem.equipped ? "EQUIPPED" : "EQUIP"}
                                    </button>
                                </div>
                                <div class="card-main">
                                    <div class="item-header">
                                        <span class="item-name">
                                            {row.item?.name || row.invItem.itemId}
                                        </span>
                                        <span class="item-qty">x{row.invItem.quantity}</span>
                                    </div>
                                    <div class="item-details">
                                        {#each formatItemDetails(row.item) as detail}
                                            <div class="detail-tag">
                                                <svg
                                                    class="detail-icon"
                                                    viewBox="0 0 24 24"
                                                    fill="currentColor">
                                                    <path d={getIconSvg(detail.icon)} />
                                                </svg>
                                                {detail.text}
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}

            {#if generalItems.length > 0}
                <div class="inventory-group">
                    <div class="srpg-group-header">
                        <span class="srpg-group-title">Other Items</span>
                        <span class="srpg-group-count">{generalItems.length}</span>
                    </div>
                    <div class="category-grid">
                        {#each generalItems as row}
                            <div class="inventory-card simple-card">
                                <div class="card-main">
                                    <div class="item-header">
                                        <span class="item-name">
                                            {row.item?.name || row.invItem.itemId}
                                        </span>
                                        <span class="item-qty">x{row.invItem.quantity}</span>
                                    </div>
                                    <div class="item-details">
                                        {#each formatItemDetails(row.item) as detail}
                                            <div class="detail-tag">
                                                <svg
                                                    class="detail-icon"
                                                    viewBox="0 0 24 24"
                                                    fill="currentColor">
                                                    <path d={getIconSvg(detail.icon)} />
                                                </svg>
                                                {detail.text}
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
        {/if}
    </div>
</div>

<ItemLibraryModal
    bind:show={showItemLibraryModal}
    campaignId={character.campaignId}
    bind:campaignItems
    onItemCreated={handleItemCreated}
    onItemDeleted={handleItemDeleted}
    onClose={handleItemLibraryClose} />

<AddInventoryItemModal
    bind:show={showAddInventoryItemModal}
    {campaignItems}
    onSave={handleAddInventoryItemSave}
    onClose={handleAddInventoryItemClose} />

<style>
    .inventory-section {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .stats-header {
        display: flex;
        gap: 2rem;
        padding: 1.25rem;
        background: var(--bg-secondary);
        border-radius: 12px;
        border: 1px solid var(--border-primary);
    }

    .stat-group {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        flex: 1;
    }

    .stat-label {
        margin: 0;
        font-size: 0.75rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-muted);
    }

    /* Currency Styling */
    .currency-badges,
    .currency-inputs {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
    }

    .curr-badge,
    .curr-input {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.375rem 0.75rem;
        border-radius: 8px;
        font-weight: 700;
        font-size: 0.9rem;
    }

    .curr-badge {
        background: var(--card-bg);
        border: 1px solid var(--border-primary);
        box-shadow: 0 2px 4px var(--shadow-sm);
    }

    .curr-input {
        background: var(--input-bg);
        border: 1px solid var(--border-primary);
        padding: 0.25rem 0.5rem;
    }

    .curr-input input {
        width: 3rem;
        background: transparent;
        border: none;
        color: var(--text-primary);
        font-weight: 700;
        font-size: 0.9rem;
        text-align: right;
    }

    .curr-input input:focus {
        outline: none;
    }

    .gold {
        color: #facc15;
        border-color: rgba(250, 204, 21, 0.3);
    }
    .silver {
        color: #94a3b8;
        border-color: rgba(148, 163, 184, 0.3);
    }
    .copper {
        color: #b45309;
        border-color: rgba(180, 83, 9, 0.3);
    }

    .coin-icon {
        width: 1.125rem;
        height: 1.125rem;
    }
    .curr-value {
        font-size: 0.65rem;
        opacity: 0.6;
    }

    /* Weight Styling */
    .weight-display {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .weight-main {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 700;
        font-size: 1.125rem;
        color: var(--text-primary);
    }

    .weight-icon {
        width: 1.25rem;
        height: 1.25rem;
        color: var(--text-muted);
    }
    .weight-sep {
        opacity: 0.3;
        font-weight: 400;
    }
    .weight-max {
        color: var(--text-secondary);
        opacity: 0.7;
    }

    .weight-limit-input {
        width: 4rem;
        background: var(--input-bg);
        border: 1px solid var(--border-primary);
        border-radius: 4px;
        padding: 0.125rem 0.375rem;
        font-size: 0.9rem;
        color: var(--text-primary);
        font-weight: 700;
    }

    .over-capacity .weight-main {
        color: var(--accent-danger);
    }
    .overweight-tag {
        font-size: 0.65rem;
        text-transform: uppercase;
        font-weight: 800;
        background: var(--accent-danger);
        color: white;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0% {
            opacity: 1;
        }
        50% {
            opacity: 0.7;
        }
        100% {
            opacity: 1;
        }
    }

    /* Actions */
    .inventory-actions {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
    }

    .inventory-actions button {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        font-weight: 700;
    }

    /* List & Cards */
    .inventory-list {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .inventory-group {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .category-grid {
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
    }

    .inventory-card {
        display: flex;
        background: var(--card-bg);
        border: 1px solid var(--border-primary);
        border-radius: 10px;
        overflow: hidden;
        transition: all 0.2s ease;
        position: relative;
    }

    .inventory-card:hover {
        border-color: var(--border-secondary);
    }
    .inventory-card.equipped {
        border-color: var(--accent-success);
        box-shadow:
            0 0 0 1px var(--accent-success),
            0 4px 12px rgba(34, 197, 94, 0.1);
        background: rgba(34, 197, 94, 0.02);
    }

    .card-left {
        display: flex;
        align-items: center;
        padding: 0 0.75rem;
        background: var(--bg-secondary);
        border-right: 1px solid var(--border-primary);
    }

    .card-main {
        flex: 1;
        padding: 0.875rem 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .item-name {
        font-weight: 700;
        font-size: 1rem;
        color: var(--text-primary);
    }

    .item-qty {
        font-size: 0.75rem;
        font-weight: 700;
        background: var(--bg-tertiary);
        padding: 0.125rem 0.5rem;
        border-radius: 99px;
        color: var(--text-secondary);
    }

    .item-details {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
    }

    .detail-tag {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-muted);
    }

    .detail-icon {
        width: 0.875rem;
        height: 0.875rem;
        opacity: 0.6;
    }

    /* Equip Toggle Button */
    .equip-toggle {
        padding: 0.4rem 0.75rem;
        font-size: 0.7rem;
        font-weight: 800;
        letter-spacing: 0.05em;
        border-radius: 6px;
        border: 1px solid var(--border-primary);
        background: var(--modal-bg);
        color: var(--text-muted);
        cursor: pointer;
        transition: all 0.2s;
        min-width: 80px;
    }

    .equip-toggle:hover {
        background: var(--bg-tertiary);
        border-color: var(--text-secondary);
        color: var(--text-primary);
    }

    .equip-toggle.is-equipped {
        background: var(--accent-success);
        color: white;
        border-color: var(--accent-success);
        box-shadow: 0 2px 8px rgba(34, 197, 94, 0.4);
    }

    .empty-state {
        padding: 3rem;
        text-align: center;
        background: var(--bg-secondary);
        border: 1px dashed var(--border-primary);
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        color: var(--text-muted);
    }

    @media (max-width: 640px) {
        .stats-header {
            flex-direction: column;
            gap: 1.5rem;
        }

        .inventory-card {
            flex-direction: column;
        }

        .card-left {
            border-right: none;
            border-bottom: 1px solid var(--border-primary);
            padding: 0.5rem;
            justify-content: center;
        }

        .equip-toggle {
            width: 100%;
        }
    }
</style>
