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
                        <span>{row.item?.name || row.invItem.itemId}</span>
                        <span>Qty: {row.invItem.quantity}</span> 
                        {#if row.item.weight}
                            <span>{row.item.weight} wt</span>
                        {/if}
                        {#if row.item.cost}
                            <span>{row.item.cost} gp</span>
                        {/if}
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
                        <span>{row.item?.name || row.invItem.itemId}</span>
                        <span>Qty: {row.invItem.quantity}</span> 
                        {#if row.item.weight}
                            <span>{row.item.weight} wt</span>
                        {/if}
                        {#if row.item.cost}
                            <span>{row.item.cost} gp</span>
                        {/if}
                    </div>
                {/each}
            {/if}

            {#if generalItems.length > 0}
                <h4>General items</h4>
                {#each generalItems as row}
                    <div class="inventory-item-row">
                        <span>{row.item?.name || row.invItem.itemId}</span>
                        <span>Qty: {row.invItem.quantity}</span>
                        {#if row.item}
                            {#if row.item.weight}
                                <span>{row.item.weight} wt</span>
                            {/if}
                            {#if row.item.cost}
                                <span>{row.item.cost} gp</span>
                            {/if}
                        {/if}
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
    .inventory-section { margin-top: 1.5rem; }
    .inventory-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
    .inventory-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .inventory-item-row { display: flex; gap: 1.5rem; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--divider); }
</style>
