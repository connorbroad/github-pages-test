<script lang="ts">
    import type { Character } from "../../../data/storage-utils";
    import { createEventDispatcher } from "svelte";
    import { loadCampaignItems, saveCampaignItems } from "../../../data/storage-utils";
    import CreateItemModal from "../../../shared/modal/CreateItemModal.svelte";
    import AddInventoryItemModal from "../../../shared/modal/AddInventoryItemModal.svelte";

    export let character: Character;
    export let editedCharacter: Character;
    export let isEditable: boolean;
    export let saveSection: () => void; // callback to trigger parent save

    let showCreateItemModal = false;
    let showAddInventoryItemModal = false;
    let campaignItems = loadCampaignItems().filter((i) => i.campaignId === character.campaignId);

    function handleItemLibraryClick() { showAddInventoryItemModal = true; }
    function handleAddItemClick() { showCreateItemModal = true; }

    function handleCreateItemSave(event: CustomEvent) {
        const newItem = event.detail;
        const items = loadCampaignItems();
        items.push(newItem);
        saveCampaignItems(items);
        campaignItems = loadCampaignItems().filter((i) => i.campaignId === character.campaignId);
        showCreateItemModal = false;
        saveSection();
    }
    function handleCreateItemClose() { showCreateItemModal = false; }

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

    function toggleEquip(invItem: any) {
        const item = campaignItems.find((i) => i.id === invItem.itemId);
        if (!item) return;
        if (!editedCharacter.equipped) {
            editedCharacter.equipped = { weapons: [], armors: [] } as any;
        }
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
            editedCharacter.inventory.forEach((ii) => {
                const it = campaignItems.find((i) => i.id === ii.itemId);
                if (it && it.type === "armor") {
                    ii.equipped = false;
                }
            });
            invItem.equipped = true;
            editedCharacter.equipped.armors = [invItem.itemId];
        }
        saveSection();
    }
</script>

<div class="srpg-form-grid">
    <div class="srpg-form-field">
        <h4>Money</h4>
        {#if isEditable}
            <div class="currency-inputs">
                <input id="currency-gp" type="number" min="0" bind:value={editedCharacter.currency.gp} placeholder="GP" aria-label="Gold Pieces" />
                <input type="number" min="0" bind:value={editedCharacter.currency.sp} placeholder="SP" aria-label="Silver Pieces" />
                <input type="number" min="0" bind:value={editedCharacter.currency.cp} placeholder="CP" aria-label="Copper Pieces" />
            </div>
        {:else}
            <div class="currency-badges">
                <span class="srpg-badge srpg-badge-info">{editedCharacter.currency.gp} GP</span>
                <span class="srpg-badge srpg-badge-info">{editedCharacter.currency.sp} SP</span>
                <span class="srpg-badge srpg-badge-info">{editedCharacter.currency.cp} CP</span>
            </div>
        {/if}
    </div>
</div>

<div class="inventory-section">
    <div class="inventory-header">
        <button class="srpg-b srpg-b-create" aria-label="Add Item" title="Add Item" on:click={handleItemLibraryClick} disabled={campaignItems.length === 0}>
            <svg class="srpg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            Add Item
        </button>
        <button class="srpg-b srpg-b-normal" aria-label="Item Library" title="Item Library" on:click={handleAddItemClick}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width='1.5em' height='1.5em'><path fill="currentColor" d="M12 9c2.21 0 4-1.79 4-4s-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4m0-6c1.1 0 2 .9 2 2s-.9 2-2 2s-2-.9-2-2s.9-2 2-2m0 8.55C9.64 9.35 6.48 8 3 8v11c3.48 0 6.64 1.35 9 3.55c2.36-2.19 5.52-3.55 9-3.55V8c-3.48 0-6.64 1.35-9 3.55m7 5.58c-2.53.34-4.93 1.3-7 2.82a15.2 15.2 0 0 0-7-2.83v-6.95c2.1.38 4.05 1.35 5.64 2.83L12 14.28l1.36-1.27A11.2 11.2 0 0 1 19 10.18z"/></svg>
            Item Library
        </button>
    </div>

    {#if editedCharacter.inventory && editedCharacter.inventory.length > 0}
        <div class="inventory-list">
            {#if editedCharacter.inventory.filter(invItem => campaignItems.find(i => i.id === invItem.itemId).type == "simple").length > 0}
                <h4>General items</h4>
                {#each editedCharacter.inventory.filter(invItem => campaignItems.find(i => i.id === invItem.itemId).type == "simple") as invItem}
                    <div class="inventory-item-row">
                        <span>{campaignItems.find(i => i.id === invItem.itemId)?.name || invItem.itemId}</span>
                        <span>Qty: {invItem.quantity}</span>
                        {#if campaignItems.find(i => i.id === invItem.itemId)}
                            {#if campaignItems.find(i => i.id === invItem.itemId).weight}
                                <span>{campaignItems.find(i => i.id === invItem.itemId).weight} wt</span>
                            {/if}
                            {#if campaignItems.find(i => i.id === invItem.itemId).cost}
                                <span>{campaignItems.find(i => i.id === invItem.itemId).cost} gp</span>
                            {/if}
                            {#if ['weapon','armor'].includes(campaignItems.find(i => i.id === invItem.itemId).type)}
                                <button class="srpg-b srpg-b-icon" aria-label={invItem.equipped ? `Unequip ${campaignItems.find(i => i.id === invItem.itemId).type}` : `Equip ${campaignItems.find(i => i.id === invItem.itemId).type}`} title={invItem.equipped ? `Unequip ${campaignItems.find(i => i.id === invItem.itemId).type}` : `Equip ${campaignItems.find(i => i.id === invItem.itemId).type}`} on:click={() => toggleEquip(invItem)}>
                                    {#if invItem.equipped}
                                        <svg class="srpg-icon" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5L20 7"/></svg>
                                    {:else}
                                        <svg class="srpg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg>
                                    {/if}
                                </button>
                            {/if}
                        {/if}
                    </div>
                {/each}
            {/if}

            {#if editedCharacter.inventory.filter(invItem => campaignItems.find(i => i.id === invItem.itemId).type == "weapon").length > 0}
                <h4>Weapons</h4>
                {#each editedCharacter.inventory.filter(invItem => campaignItems.find(i => i.id === invItem.itemId).type == "weapon") as invItem}
                    <div class="inventory-item-row">
                        <span>{campaignItems.find(i => i.id === invItem.itemId)?.name || invItem.itemId}</span>
                        <span>Qty: {invItem.quantity}</span>
                        {#if campaignItems.find(i => i.id === invItem.itemId)}
                            {#if campaignItems.find(i => i.id === invItem.itemId).weight}
                                <span>{campaignItems.find(i => i.id === invItem.itemId).weight} wt</span>
                            {/if}
                            {#if campaignItems.find(i => i.id === invItem.itemId).cost}
                                <span>{campaignItems.find(i => i.id === invItem.itemId).cost} gp</span>
                            {/if}
                            <button class="srpg-b srpg-b-icon" aria-label={invItem.equipped ? `Unequip ${campaignItems.find(i => i.id === invItem.itemId).type}` : `Equip ${campaignItems.find(i => i.id === invItem.itemId).type}`} title={invItem.equipped ? `Unequip ${campaignItems.find(i => i.id === invItem.itemId).type}` : `Equip ${campaignItems.find(i => i.id === invItem.itemId).type}`} on:click={() => toggleEquip(invItem)}>
                                {#if invItem.equipped}
                                    <svg class="srpg-icon" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5L20 7"/></svg>
                                {:else}
                                    <svg class="srpg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg>
                                {/if}
                            </button>
                        {/if}
                    </div>
                {/each}
            {/if}

            {#if editedCharacter.inventory.filter(invItem => campaignItems.find(i => i.id === invItem.itemId).type == "armor").length > 0}
                <h4>Armor</h4>
                {#each editedCharacter.inventory.filter(invItem => campaignItems.find(i => i.id === invItem.itemId).type == "armor") as invItem}
                    <div class="inventory-item-row">
                        <span>{campaignItems.find(i => i.id === invItem.itemId)?.name || invItem.itemId}</span>
                        <span>Qty: {invItem.quantity}</span>
                        {#if campaignItems.find(i => i.id === invItem.itemId)}
                            {#if campaignItems.find(i => i.id === invItem.itemId).weight}
                                <span>{campaignItems.find(i => i.id === invItem.itemId).weight} wt</span>
                            {/if}
                            {#if campaignItems.find(i => i.id === invItem.itemId).cost}
                                <span>{campaignItems.find(i => i.id === invItem.itemId).cost} gp</span>
                            {/if}
                            <button class="srpg-b srpg-b-icon" aria-label={invItem.equipped ? `Unequip ${campaignItems.find(i => i.id === invItem.itemId).type}` : `Equip ${campaignItems.find(i => i.id === invItem.itemId).type}`} title={invItem.equipped ? `Unequip ${campaignItems.find(i => i.id === invItem.itemId).type}` : `Equip ${campaignItems.find(i => i.id === invItem.itemId).type}`} on:click={() => toggleEquip(invItem)}>
                                {#if invItem.equipped}
                                    <svg class="srpg-icon" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5L20 7"/></svg>
                                {:else}
                                    <svg class="srpg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg>
                                {/if}
                            </button>
                        {/if}
                    </div>
                {/each}
            {/if}
        </div>
    {:else}
        <p class="srpg-empty-message">No items in inventory.</p>
    {/if}
</div>

<CreateItemModal
    bind:show={showCreateItemModal}
    campaignId={character.campaignId}
    on:save={handleCreateItemSave}
    on:close={handleCreateItemClose}
/>

<AddInventoryItemModal
    bind:show={showAddInventoryItemModal}
    campaignItems={campaignItems}
    on:save={handleAddInventoryItemSave}
    on:close={handleAddInventoryItemClose}
/>

<style>
    .currency-inputs { display: flex; gap: 0.5rem; }
    .currency-badges { display: flex; gap: 0.5rem; }
    .inventory-section { margin-top: 1.5rem; }
    .inventory-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
    .inventory-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .inventory-item-row { display: flex; gap: 1.5rem; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--divider); }
</style>
