<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import SrpgModal from "../../../../shared/modal/SrpgModal.svelte";
    import type { CampaignItem, ItemType, AttackSpec } from "../../../../data/storage-utils";

    export let show = false;
    export let campaignId: string;

    const dispatch = createEventDispatcher();

    let name = "";
    let type: ItemType = "simple";
    let weight: number | null = null;
    let cost: number | null = null;
    let tags = "";

    // Weapon fields
    let range = "";
    let toHit = "1d20+0";
    let attacks: AttackSpec[] = [];

    // Armor fields
    let armorClass: number | null = null;

    function addAttack() {
        attacks = [...attacks, { id: `attack-${Date.now()}`, name: "", dice: "", kind: "B" }];
    }

    function removeAttack(idx: number) {
        attacks = attacks.filter((_, i) => i !== idx);
    }

    function save() {
        if (!name.trim()) return;

        const base: any = {
            id: `item-${Date.now()}`,
            name,
            type,
            weight: weight ?? undefined,
            cost: cost ?? undefined,
            tags: tags ? tags.split(",").map((t) => t.trim()) : undefined,
            campaignId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        let item: CampaignItem;
        if (type === "weapon") {
            item = {
                ...base,
                type: "weapon",
                range: range || undefined,
                toHit: toHit || "1d20+0",
                attacks: attacks.length ? attacks : [],
            };
        } else if (type === "armor") {
            item = {
                ...base,
                type: "armor",
                armorClass: armorClass ?? 10,
            };
        } else {
            item = {
                ...base,
                type: "simple",
            };
        }

        dispatch("save", item);
        show = false;
    }

    function close() {
        dispatch("close");
        show = false;
    }
</script>

<SrpgModal bind:show maxWidth="420px" ariaLabel="Create Item" on:close={close}>
    <div class="modal-content">
        <h2>Create New Item</h2>
        <div class="srpg-form-grid">
            <div class="srpg-form-field">
                <label for="item-type">Type</label>
                <select id="item-type" bind:value={type}>
                    <option value="simple">Simple</option>
                    <option value="weapon">Weapon</option>
                    <option value="armor">Armor</option>
                </select>
            </div>
            <div class="srpg-form-field">
                <label for="item-name">Name</label>
                <input id="item-name" type="text" bind:value={name} required />
            </div>
            <div class="srpg-form-field">
                <label for="item-weight">Weight</label>
                <input id="item-weight" type="number" min="0" bind:value={weight} />
            </div>
            <div class="srpg-form-field">
                <label for="item-cost">Cost</label>
                <input id="item-cost" type="number" min="0" bind:value={cost} />
            </div>
            <div class="srpg-form-field">
                <label for="item-tags">Tags</label>
                <input id="item-tags" type="text" bind:value={tags} placeholder="comma separated" />
            </div>
            {#if type === "weapon"}
                <div class="srpg-form-field">
                    <label for="item-range">Range</label>
                    <input
                        id="item-range"
                        type="text"
                        bind:value={range}
                        placeholder="e.g. 30 ft" />
                </div>
                <div class="srpg-form-field">
                    <label for="item-tohit">To Hit</label>
                    <input
                        id="item-tohit"
                        type="text"
                        bind:value={toHit}
                        placeholder="e.g. 1d20+0" />
                </div>
                <div class="attacks-section">
                    <span id="attacks-label" class="srpg-label">Attacks</span>
                    {#each attacks as attack, idx}
                        <div
                            class="srpg-card attack-row responsive-attack-row"
                            aria-labelledby="attacks-label">
                            <div class="attack-fields">
                                <div class="srpg-form-field">
                                    <label for={`attack-name-${idx}`}>Name</label>
                                    <input
                                        id={`attack-name-${idx}`}
                                        type="text"
                                        bind:value={attack.name}
                                        placeholder="Name (optional)" />
                                </div>
                                <div class="srpg-form-field">
                                    <label for={`attack-dice-${idx}`}>Dice</label>
                                    <input
                                        id={`attack-dice-${idx}`}
                                        type="text"
                                        bind:value={attack.dice}
                                        placeholder="e.g. 1d6+2" />
                                </div>
                                <div class="srpg-form-field">
                                    <label for={`attack-kind-${idx}`}>Type</label>
                                    <select
                                        id={`attack-kind-${idx}`}
                                        bind:value={attack.kind}
                                        aria-label="Damage Type"
                                        class="srpg-select">
                                        <option value="B">B</option>
                                        <option value="P">P</option>
                                        <option value="S">S</option>
                                    </select>
                                </div>
                            </div>
                            <div class="remove-attack-btn">
                                <button
                                    class="srpg-b srpg-b-delete remove-attack-btn"
                                    aria-label="Remove Attack"
                                    title="Remove Attack"
                                    on:click={() => removeAttack(idx)}>
                                    Remove
                                </button>
                            </div>
                        </div>
                    {/each}
                    <button
                        class="srpg-b srpg-b-simple srpg-b-w-full"
                        aria-labelledby="attacks-label"
                        on:click={addAttack}>
                        + Add Attack
                    </button>
                </div>
            {/if}
            {#if type === "armor"}
                <div class="srpg-form-field">
                    <label for="item-ac">Armor Class (AC)</label>
                    <input id="item-ac" type="number" min="0" bind:value={armorClass} />
                </div>
            {/if}
        </div>
        <div class="modal-actions">
            <button class="srpg-b srpg-b-create" on:click={save}>Save</button>
            <button class="srpg-b srpg-b-simple" on:click={close}>Cancel</button>
        </div>
    </div>
</SrpgModal>

<style>
    .modal-content {
        padding: 1.5rem;
    }
    .attacks-section {
        margin-top: 1rem;
    }
    .attack-row {
        display: flex;
        gap: 1rem;
        align-items: flex-start;
        margin-bottom: 1rem;
        padding: 1rem;
        background: var(--srpg-card-bg);
        border: 1px solid var(--srpg-border-color);
        border-radius: 6px;
        box-shadow: 0 2px 4px var(--shadow-sm);
    }
    .attack-fields {
        flex-direction: column;
        gap: 0.5rem;
    }
    .attack-fields .srpg-form-field {
        flex: 1 1 0%;
        min-width: 0;
    }
    .responsive-attack-row {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
        padding: 0.75rem;
    }
    .remove-attack-btn {
        align-self: center;
        margin-top: 0.5rem;
    }
    .modal-actions {
        display: flex;
        gap: 1rem;
        margin-top: 1.5rem;
        justify-content: flex-end;
    }
</style>
