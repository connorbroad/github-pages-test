<script lang="ts">
    import type { Character } from "../../../data/storage-utils";
    import { createEventDispatcher } from "svelte";
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
    $: invWithItem = (editedCharacter?.inventory || []).map((invItem: any) => ({ invItem, item: getItem(invItem.itemId) }));
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
            return sum + (item.weight * invItem.quantity);
        }
        return sum;
    }, 0);

    // Check if over weight limit
    $: maxCarryWeight = editedCharacter?.maxCarryWeight ?? 0;
    $: isOverWeight = maxCarryWeight > 0 && totalWeight > maxCarryWeight;

    function handleItemLibraryClick() { showItemLibraryModal = true; }
    function handleAddItemClick() { showAddInventoryItemModal = true; }

    function handleItemCreated(event: CustomEvent) {
        const newItem = event.detail;
        const items = loadCampaignItems();
        items.push(newItem);
        saveCampaignItems(items);
        campaignItems = loadCampaignItems().filter((i) => i.campaignId === character.campaignId);
        saveSection();
    }

    function handleItemDeleted(event: CustomEvent) {
        const itemId = event.detail;
        const items = loadCampaignItems().filter((i) => i.id !== itemId);
        saveCampaignItems(items);
        
        // Remove from character inventory if present
        if (editedCharacter.inventory) {
            editedCharacter.inventory = editedCharacter.inventory.filter((invItem) => invItem.itemId !== itemId);
        }
        
        // Remove from equipped if present
        if (editedCharacter.equipped) {
            editedCharacter.equipped.weapons = editedCharacter.equipped.weapons.filter((id) => id !== itemId);
            editedCharacter.equipped.armors = editedCharacter.equipped.armors.filter((id) => id !== itemId);
        }
        
        campaignItems = loadCampaignItems().filter((i) => i.campaignId === character.campaignId);
        saveSection();
    }

    function handleItemLibraryClose() { showItemLibraryModal = false; }

    function handleAddInventoryItemSave(event: CustomEvent) {
        const { itemId, quantity } = event.detail;
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
    function handleAddInventoryItemClose() { showAddInventoryItemModal = false; }

    function ensureEquippedArrays() {
        if (!editedCharacter.equipped) {
            editedCharacter.equipped = { weapons: [], armors: [] } as any;
        } else {
            editedCharacter.equipped.weapons = editedCharacter.equipped.weapons || [];
            editedCharacter.equipped.armors = editedCharacter.equipped.armors || [];
        }
    }

    function toggleEquip(entry: any) {
        const { invItem, item } = entry.item ? entry : { invItem: entry, item: getItem(entry.itemId) };
        if (!item) return;
        ensureEquippedArrays();

        if (item.type === "weapon") {
            invItem.equipped = !invItem.equipped;
            if (invItem.equipped) {
                if (!editedCharacter.equipped.weapons.includes(invItem.itemId)) {
                    editedCharacter.equipped.weapons.push(invItem.itemId);
                }
            } else {
                editedCharacter.equipped.weapons = editedCharacter.equipped.weapons.filter((id) => id !== invItem.itemId);
            }
        } else if (item.type === "armor") {
            // Allow multiple armors: toggle this one without touching others
            invItem.equipped = !invItem.equipped;
            if (invItem.equipped) {
                if (!editedCharacter.equipped.armors.includes(invItem.itemId)) {
                    editedCharacter.equipped.armors.push(invItem.itemId);
                }
            } else {
                editedCharacter.equipped.armors = editedCharacter.equipped.armors.filter((id) => id !== invItem.itemId);
            }
        }
        saveSection();
    }

    // ----- Item details + icons (shared with ItemLibraryModal pattern) -----
    type ItemDetail = { icon: string; text: string };
    function formatItemDetails(item: any): ItemDetail[] {
        if (!item) return [];
        const details: ItemDetail[] = [];
        if (item.weight) details.push({ icon: 'weight', text: `${item.weight} wt` });
        if (item.cost) details.push({ icon: 'coin', text: `${item.cost} gp` });

        if (item.type === 'weapon') {
            if (item.range) details.push({ icon: 'range', text: item.range });
            if (item.toHit) details.push({ icon: 'target', text: `To Hit: ${item.toHit}` });
            if (item.attacks?.length) {
                item.attacks.forEach((atk: any) => {
                    details.push({ icon: 'sword', text: `${atk.name || 'Attack'}: ${atk.dice} (${atk.kind})` });
                });
            }
        }
        if (item.type === 'armor' && item.armorClass !== undefined) {
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

<div class="srpg-form-grid">
    <div class="srpg-form-field">
        <h4>Money</h4>
        {#if isEditable}
            <div class="currency-inputs">
                <input id="currency-gp" type="number" min="0" bind:value={editedCharacter.currency.gp} placeholder="G" aria-label="Gold Pieces" />
                <input type="number" min="0" bind:value={editedCharacter.currency.sp} placeholder="S" aria-label="Silver Pieces" />
                <input type="number" min="0" bind:value={editedCharacter.currency.cp} placeholder="C" aria-label="Copper Pieces" />
            </div>
        {:else}
            <div class="currency-badges">
                <span class="srpg-badge srpg-badge-info">{editedCharacter.currency.gp} G</span>
                <span class="srpg-badge srpg-badge-info">{editedCharacter.currency.sp} S</span>
                <span class="srpg-badge srpg-badge-info">{editedCharacter.currency.cp} C</span>
            </div>
        {/if}
    </div>
    
    <div class="srpg-form-field">
        <h4>Carry Weight</h4>
        <div class="weight-display">
            <div class="weight-info" class:over-weight={isOverWeight}>
                <svg class="weight-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l7.5 3.75v7.34L12 19.02l-7.5-3.75V7.93L12 4.18z"/>
                </svg>
                <span class="weight-value">{totalWeight.toFixed(1)}</span>
                {#if maxCarryWeight > 0}
                    <span class="weight-separator">/</span>
                    <span class="weight-max">{maxCarryWeight}</span>
                {/if}
            </div>
            {#if isEditable}
                <input 
                    type="number" 
                    min="0" 
                    step="0.5"
                    bind:value={editedCharacter.maxCarryWeight} 
                    placeholder="Max" 
                    aria-label="Maximum Carry Weight"
                    class="weight-input"
                />
            {/if}
        </div>
    </div>
</div>

<div class="inventory-section">
    <div class="inventory-header">
        <button class="srpg-b srpg-b-create" aria-label="Add Item" title="Add Item" on:click={handleAddItemClick} disabled={campaignItems.length === 0}>
            <svg class="srpg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            Add Item
        </button>
        <button class="srpg-b srpg-b-normal" aria-label="Item Library" title="Item Library" on:click={handleItemLibraryClick}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width='1.5em' height='1.5em'><path fill="currentColor" d="M12 9c2.21 0 4-1.79 4-4s-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4m0-6c1.1 0 2 .9 2 2s-.9 2-2 2s-2-.9-2-2s.9-2 2-2m0 8.55C9.64 9.35 6.48 8 3 8v11c3.48 0 6.64 1.35 9 3.55c2.36-2.19 5.52-3.55 9-3.55V8c-3.48 0-6.64 1.35-9 3.55m7 5.58c-2.53.34-4.93 1.3-7 2.82a15.2 15.2 0 0 0-7-2.83v-6.95c2.1.38 4.05 1.35 5.64 2.83L12 14.28l1.36-1.27A11.2 11.2 0 0 1 19 10.18z"/></svg>
            Item Library
        </button>
    </div>

    {#if editedCharacter.inventory && editedCharacter.inventory.length > 0}
        <div class="inventory-list">
            {#if weaponItems.length > 0}
                <h4>Weapons</h4>
                {#each weaponItems as row}
                    <div class="inventory-item-row">
                        <button class="srpg-b srpg-b-icon" aria-label={row.invItem.equipped ? `Unequip ${row.item.type}` : `Equip ${row.item.type}`} title={row.invItem.equipped ? `Unequip ${row.item.type}` : `Equip ${row.item.type}`} on:click={() => toggleEquip(row)}>
                            {#if row.invItem.equipped}
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width='1em' height='1em'><g fill="none" fill-rule="evenodd"><path d="m12.594 23.258l-.012.002l-.071.035l-.02.004l-.014-.004l-.071-.036q-.016-.004-.024.006l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.016-.018m.264-.113l-.014.002l-.184.093l-.01.01l-.003.011l.018.43l.005.012l.008.008l.201.092q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.003-.011l.018-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="M19.071 3.929a1 1 0 0 1 1 1v5.657a1 1 0 0 1-.405.804l-7.198 5.32l.946.947a1 1 0 0 1 0 1.414L12 20.485a1 1 0 0 1-1.154.187l-2.184-1.091l-1.612 1.611a1 1 0 0 1-1.414 0l-2.828-2.828a1 1 0 0 1 0-1.414l1.611-1.612l-1.091-2.184A1 1 0 0 1 3.515 12l1.414-1.414a1 1 0 0 1 1.414 0l.947.946l5.32-7.198a1 1 0 0 1 .804-.405z"/></g></svg>                            
                            {:else}
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width='1em' height='1em'><g fill="none" fill-rule="evenodd"><path d="m12.594 23.258l-.012.002l-.071.035l-.02.004l-.014-.004l-.071-.036q-.016-.004-.024.006l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.016-.018m.264-.113l-.014.002l-.184.093l-.01.01l-.003.011l.018.43l.005.012l.008.008l.201.092q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.003-.011l.018-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="M19.071 3.93a1 1 0 0 1 .993.883l.007.116v5.657a1 1 0 0 1-.315.729l-.09.075l-7.198 5.32l.946.947a1 1 0 0 1 .084 1.32l-.084.094L12 20.485a1 1 0 0 1-1.036.238l-.118-.05l-2.184-1.092l-1.612 1.612a1 1 0 0 1-1.32.083l-.094-.083l-2.828-2.829a1 1 0 0 1-.083-1.32l.083-.094l1.611-1.612l-1.091-2.183a1 1 0 0 1 .102-1.059L3.515 12l1.414-1.414a1 1 0 0 1 1.32-.083l.094.083l.947.947l5.32-7.198a1 1 0 0 1 .687-.399l.117-.007h5.657ZM5.636 12.706l-.197.198l1.092 2.184a1 1 0 0 1-.188 1.154L4.93 17.657l1.414 1.414l1.415-1.414a1 1 0 0 1 1.154-.187l2.184 1.092l.197-.198l-5.657-5.657ZM18.071 5.93H13.92l-5.2 7.033l2.318 2.317l7.033-5.198z"/></g></svg>                            
                            {/if}
                        </button> 
                        <div class="item-info">
                            <div class="item-name">{row.item?.name || row.invItem.itemId}</div>
                            {#if row.item && formatItemDetails(row.item).length > 0}
                                <div class="item-details">
                                    {#each formatItemDetails(row.item) as detail}
                                        <span class="item-detail">
                                            <svg class="detail-icon" viewBox="0 0 24 24" fill="currentColor">
                                                <path d={getIconSvg(detail.icon)} />
                                            </svg>
                                            <span class="detail-text">{detail.text}</span>
                                        </span>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                        <span class="qty">Qty: {row.invItem.quantity}</span> 
                    </div>
                {/each}
            {/if}

            {#if armorItems.length > 0}
                <h4>Armor</h4>
                {#each armorItems as row}
                    <div class="inventory-item-row">
                        <button class="srpg-b srpg-b-icon" aria-label={row.invItem.equipped ? `Unequip ${row.item.type}` : `Equip ${row.item.type}`} title={row.invItem.equipped ? `Unequip ${row.item.type}` : `Equip ${row.item.type}`} on:click={() => toggleEquip(row)}>
                            {#if row.invItem.equipped}
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width='1em' height='1em'><g fill="none" fill-rule="evenodd"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="M5.707 3.879A3 3 0 0 1 7.828 3c.79 0 1.948-.22 2.302.711a2.001 2.001 0 0 0 3.74 0c.354-.93 1.513-.71 2.302-.71a3 3 0 0 1 2.12.878L22 7.586a2 2 0 0 1 0 2.828l-1.478 1.478c-.52.52-1.246.689-1.9.526l.272 5.432A3 3 0 0 1 15.898 21H8.102a3 3 0 0 1-2.996-3.15l.272-5.432a2 2 0 0 1-1.9-.526L2 10.414a2 2 0 0 1 0-2.828z"/></g></svg>
                            {:else}
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width='1em' height='1em'><g fill="none" fill-rule="evenodd"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="M7.121 5.293L3.414 9l1.478 1.478l.788-1.052c.598-.797 1.867-.339 1.817.657l-.393 7.867A1 1 0 0 0 8.102 19h7.796a1 1 0 0 0 .998-1.05l-.393-7.867c-.05-.996 1.219-1.454 1.817-.657l.788 1.052L20.586 9l-3.707-3.707C16.5 4.915 15.95 5 15.465 5A4 4 0 0 1 12 7a4 4 0 0 1-3.465-2c-.486 0-1.036-.085-1.414.293M5.707 3.879A3 3 0 0 1 7.828 3H9.1c.472 0 .872.297 1.03.71a2.001 2.001 0 0 0 3.74 0c.158-.413.558-.71 1.03-.71h1.272a3 3 0 0 1 2.12.879L22 7.586a2 2 0 0 1 0 2.828l-1.478 1.478c-.52.52-1.246.689-1.9.526l.272 5.432A3 3 0 0 1 15.898 21H8.102a3 3 0 0 1-2.996-3.15l.272-5.432a2 2 0 0 1-1.9-.526L2 10.414a2 2 0 0 1 0-2.828z"/></g></svg>
                            {/if}
                        </button>
                        <div class="item-info">
                            <div class="item-name">{row.item?.name || row.invItem.itemId}</div>
                            {#if row.item && formatItemDetails(row.item).length > 0}
                                <div class="item-details">
                                    {#each formatItemDetails(row.item) as detail}
                                        <span class="item-detail">
                                            <svg class="detail-icon" viewBox="0 0 24 24" fill="currentColor">
                                                <path d={getIconSvg(detail.icon)} />
                                            </svg>
                                            <span class="detail-text">{detail.text}</span>
                                        </span>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                        <span class="qty">Qty: {row.invItem.quantity}</span> 
                    </div>
                {/each}
            {/if}

            {#if generalItems.length > 0}
                <h4>Other items</h4>
                {#each generalItems as row}
                    <div class="inventory-item-row">
                        <div class="item-info">
                            <div class="item-name">{row.item?.name || row.invItem.itemId}</div>
                            {#if row.item && formatItemDetails(row.item).length > 0}
                                <div class="item-details">
                                    {#each formatItemDetails(row.item) as detail}
                                        <span class="item-detail">
                                            <svg class="detail-icon" viewBox="0 0 24 24" fill="currentColor">
                                                <path d={getIconSvg(detail.icon)} />
                                            </svg>
                                            <span class="detail-text">{detail.text}</span>
                                        </span>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                        <span class="qty">Qty: {row.invItem.quantity}</span>
                    </div>
                {/each}
            {/if}
        </div>
    {:else}
        <p class="srpg-empty-message">No items in inventory.</p>
    {/if}
</div>

<ItemLibraryModal
    bind:show={showItemLibraryModal}
    campaignId={character.campaignId}
    bind:campaignItems
    on:itemCreated={handleItemCreated}
    on:itemDeleted={handleItemDeleted}
    on:close={handleItemLibraryClose}
/>

<AddInventoryItemModal
    bind:show={showAddInventoryItemModal}
    campaignItems={campaignItems}
    on:save={handleAddInventoryItemSave}
    on:close={handleAddInventoryItemClose}
/>

<style>
    h4 { margin-top: 1rem; margin-bottom: 0.5rem; }
    .currency-inputs { display: flex; gap: 0.5rem; }
    .currency-badges { display: flex; gap: 0.5rem; }
    
    .weight-display { display: flex; align-items: center; gap: 0.75rem; }
    .weight-info { 
        display: flex; 
        align-items: center; 
        gap: 0.35rem; 
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
        transition: color 0.2s ease;
    }
    .weight-info.over-weight {
        color: #ef4444;
    }
    .weight-icon { 
        width: 1.25em; 
        height: 1.25em; 
        flex-shrink: 0;
        opacity: 0.8;
    }
    .weight-value {
        font-variant-numeric: tabular-nums;
    }
    .weight-separator {
        opacity: 0.5;
        margin: 0 0.15rem;
    }
    .weight-max {
        opacity: 0.7;
        font-variant-numeric: tabular-nums;
    }
    .weight-input {
        width: 80px;
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
    }
    
    .inventory-section { margin-top: 1.5rem; }
    .inventory-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
    .inventory-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .inventory-item-row { display: flex; gap: 1rem; align-items: flex-start; padding: 0.5rem 0; border-bottom: 1px solid var(--divider); }
    .item-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.25rem; }
    .item-name { font-weight: 600; color: var(--text-primary); line-height: 1.3; word-break: break-word; }
    .item-details { display: flex; flex-wrap: wrap; gap: 0.4rem 0.6rem; font-size: 0.875rem; color: var(--text-muted); line-height: 1.4; }
    .item-detail { display: inline-flex; align-items: center; gap: 0.25rem; white-space: nowrap; }
    .detail-icon { width: 14px; height: 14px; flex-shrink: 0; opacity: 0.75; }
    .detail-text { line-height: 1; }
    .qty { margin-left: auto; white-space: nowrap; align-self: center; }

    @media (max-width: 767px) {
        .inventory-item-row { gap: 0.75rem; }
        .item-details { font-size: 0.8rem; gap: 0.35rem 0.5rem; }
        .detail-icon { width: 12px; height: 12px; }
        .weight-display { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
        .weight-input { width: 100%; }
    }
</style>
