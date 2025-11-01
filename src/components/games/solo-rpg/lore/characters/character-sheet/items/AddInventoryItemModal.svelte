<script lang="ts">
import { createEventDispatcher, onMount } from "svelte";
import SrpgModal from "../../../../shared/modal/SrpgModal.svelte";
import type { CampaignItem } from "../../../../data/storage-utils";

export let show = false;
export let campaignItems: CampaignItem[] = [];

const dispatch = createEventDispatcher();

let selectedItemId = "";
let quantity = 1;

function handleSave() {
    if (!selectedItemId || quantity < 1) return;
    dispatch("save", { itemId: selectedItemId, quantity });
    show = false;
}
function handleClose() {
    dispatch("close");
    show = false;
}
</script>

<SrpgModal bind:show maxWidth="400px" ariaLabel="Add Inventory Item" on:close={handleClose}>
    <div class="modal-content">
        <h2>Add Item from Library</h2>
        <div class="srpg-form-grid">
            <div class="srpg-form-field">
                <label for="item-select">Item</label>
                <select id="item-select" bind:value={selectedItemId}>
                    <option value="" disabled selected>Select an item</option>
                    {#each campaignItems as item}
                        <option value={item.id}>{item.name}</option>
                    {/each}
                </select>
            </div>
            <div class="srpg-form-field">
                <label for="item-qty">Quantity</label>
                <input id="item-qty" type="number" min="1" bind:value={quantity} />
            </div>
        </div>
        <div class="modal-actions">
            <button class="srpg-b srpg-b-create" on:click={handleSave} disabled={!selectedItemId}>Add</button>
            <button class="srpg-b" on:click={handleClose}>Cancel</button>
        </div>
    </div>
</SrpgModal>

<style>
.modal-content { padding: 1.5rem; }
.modal-actions { display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: flex-end; }
</style>
