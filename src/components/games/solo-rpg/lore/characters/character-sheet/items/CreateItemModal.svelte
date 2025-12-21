<script lang="ts">
    import SrpgModal from "../../../../shared/modal/SrpgModal.svelte";
    import type { CampaignItem, ItemType, AttackSpec } from "../../../../data/storage-utils";

    export let show = false;
    export let campaignId: string;
    export let onSave: (item: CampaignItem) => void = () => {};
    export let onClose: () => void = () => {};

    let name = "";
    let type: ItemType = "simple";
    let weight: number | null = null;
    let gp: number | null = null;
    let sp: number | null = null;
    let cp: number | null = null;
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
            cost: gp || sp || cp ? (gp || 0) + (sp || 0) / 10 + (cp || 0) / 100 : undefined,
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

        onSave(item);
        resetAndClose();
    }

    function close() {
        onClose();
        resetAndClose();
    }

    function resetAndClose() {
        name = "";
        type = "simple";
        weight = null;
        gp = null;
        sp = null;
        cp = null;
        tags = "";
        range = "";
        toHit = "1d20+0";
        attacks = [];
        armorClass = null;
        show = false;
    }

    function setType(newType: ItemType) {
        type = newType;
    }
</script>

<SrpgModal bind:show maxWidth="500px" ariaLabel="Create Item" onClose={close}>
    <div
        class="modal-content"
        class:type-weapon={type === "weapon"}
        class:type-armor={type === "armor"}>
        <h2 class="srpg-modal-heading">Create New Item</h2>

        <div class="form-section">
            <span class="section-label">Item Type</span>
            <div class="type-selector" role="group" aria-label="Item Type">
                <button
                    class="type-btn"
                    class:active={type === "simple"}
                    on:click={() => setType("simple")}>
                    Simple
                </button>
                <button
                    class="type-btn"
                    class:active={type === "weapon"}
                    on:click={() => setType("weapon")}>
                    Weapon
                </button>
                <button
                    class="type-btn"
                    class:active={type === "armor"}
                    on:click={() => setType("armor")}>
                    Armor
                </button>
            </div>
        </div>

        <div class="form-scroll-area">
            <div class="form-group">
                <div class="srpg-form-field">
                    <label for="item-name">
                        Name <span class="required">*</span>
                    </label>
                    <input
                        id="item-name"
                        type="text"
                        bind:value={name}
                        placeholder="e.g. Iron Longsword"
                        required />
                </div>

                <div class="grid-fields">
                    <div class="srpg-form-field">
                        <label for="item-weight">
                            <svg class="label-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path
                                    d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l7.5 3.75v7.34L12 19.02l-7.5-3.75V7.93L12 4.18z" />
                            </svg>
                            Weight
                        </label>
                        <input
                            id="item-weight"
                            type="number"
                            min="0"
                            step="0.1"
                            bind:value={weight}
                            placeholder="0.0" />
                    </div>
                    <div class="srpg-form-field">
                        <label for="item-cost-gp">
                            <svg class="label-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path
                                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" />
                            </svg>
                            Cost
                        </label>
                        <div class="cost-inputs">
                            <div class="cost-col">
                                <input
                                    id="item-cost-gp"
                                    type="number"
                                    min="0"
                                    bind:value={gp}
                                    placeholder="0" />
                                <span class="unit">G</span>
                            </div>
                            <div class="cost-col">
                                <input
                                    id="item-cost-sp"
                                    type="number"
                                    min="0"
                                    bind:value={sp}
                                    placeholder="0" />
                                <span class="unit">S</span>
                            </div>
                            <div class="cost-col">
                                <input
                                    id="item-cost-cp"
                                    type="number"
                                    min="0"
                                    bind:value={cp}
                                    placeholder="0" />
                                <span class="unit">C</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="srpg-form-field">
                    <label for="item-tags">Tags</label>
                    <input
                        id="item-tags"
                        type="text"
                        bind:value={tags}
                        placeholder="martial, versatile, magic..." />
                    <small class="field-help">Comma separated labels</small>
                </div>
            </div>

            {#if type === "weapon"}
                <div class="form-group special-group weapon-group">
                    <h3 class="group-title">Weapon Stats</h3>
                    <div class="grid-fields">
                        <div class="srpg-form-field">
                            <label for="item-range">Range</label>
                            <input
                                id="item-range"
                                type="text"
                                bind:value={range}
                                placeholder="e.g. 5 ft" />
                        </div>
                        <div class="srpg-form-field">
                            <label for="item-tohit">To Hit</label>
                            <input
                                id="item-tohit"
                                type="text"
                                bind:value={toHit}
                                placeholder="1d20+0" />
                        </div>
                    </div>

                    <div class="attacks-list">
                        <div class="list-header">
                            <span class="field-label">Damage / Attacks</span>
                            <button class="add-btn" on:click={addAttack}>
                                <span>+ Add</span>
                            </button>
                        </div>

                        {#each attacks as attack, idx}
                            <div class="attack-card">
                                <div class="attack-inputs">
                                    <input
                                        class="atk-name"
                                        type="text"
                                        bind:value={attack.name}
                                        placeholder="Default Damage" />
                                    <input
                                        class="atk-dice"
                                        type="text"
                                        bind:value={attack.dice}
                                        placeholder="1d8+2" />
                                    <select class="atk-kind" bind:value={attack.kind}>
                                        <option value="B">Bludg.</option>
                                        <option value="P">Pierc.</option>
                                        <option value="S">Slash.</option>
                                    </select>
                                </div>
                                <button
                                    class="remove-atk"
                                    on:click={() => removeAttack(idx)}
                                    aria-label="Remove attack"
                                    title="Remove">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        {/each}
                    </div>
                </div>
            {:else if type === "armor"}
                <div class="form-group special-group armor-group">
                    <h3 class="group-title">Armor Stats</h3>
                    <div class="srpg-form-field">
                        <label for="item-ac">Armor Class (AC)</label>
                        <input
                            id="item-ac"
                            type="number"
                            min="0"
                            bind:value={armorClass}
                            placeholder="10" />
                    </div>
                </div>
            {/if}
        </div>

        <div class="modal-actions">
            <button class="srpg-b srpg-b-simple" on:click={close}>Cancel</button>
            <button class="srpg-b srpg-b-create" on:click={save} disabled={!name.trim()}>
                Create Item
            </button>
        </div>
    </div>
</SrpgModal>

<style>
    .modal-content {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        text-align: left;
        max-height: 80vh;
    }

    .srpg-modal-heading {
        margin-bottom: 0.5rem;
    }

    .form-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .section-label,
    .field-label {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-muted);
    }

    .type-selector {
        display: flex;
        background: var(--bg-secondary);
        padding: 0.25rem;
        border-radius: 10px;
        border: 1px solid var(--border-primary);
    }

    .type-btn {
        flex: 1;
        padding: 0.5rem;
        border: none;
        background: transparent;
        color: var(--text-secondary);
        font-weight: 600;
        font-size: 0.875rem;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .type-btn:hover:not(.active) {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .type-btn.active {
        background: var(--modal-bg);
        color: var(--accent-primary);
        box-shadow: 0 2px 4px var(--shadow-sm);
    }

    .type-weapon .type-btn.active {
        color: var(--accent-danger);
    }

    .type-armor .type-btn.active {
        color: var(--accent-info);
    }

    .form-scroll-area {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding-right: 0.5rem;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    .special-group {
        padding: 1.25rem;
        background: var(--bg-secondary);
        border-radius: 12px;
        border: 1px dashed var(--border-primary);
    }

    .weapon-group {
        border-color: var(--accent-danger);
        background: rgba(var(--danger-rgb, 239, 68, 68), 0.03);
    }

    .armor-group {
        border-color: var(--accent-info);
        background: rgba(var(--info-rgb, 59, 130, 246), 0.03);
    }

    .group-title {
        margin: 0 0 1rem 0;
        font-size: 0.9rem;
        color: var(--text-primary);
        font-weight: 700;
    }

    .srpg-form-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .srpg-form-field label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    .required {
        color: var(--accent-danger);
    }

    .label-icon {
        width: 1rem;
        height: 1rem;
        opacity: 0.6;
    }

    .srpg-form-field input {
        padding: 0.625rem 0.75rem;
        background: var(--input-bg);
        border: 1px solid var(--border-primary);
        border-radius: 8px;
        color: var(--text-primary);
        font-size: 0.875rem;
        transition: all 0.2s ease;
    }

    .srpg-form-field input:focus {
        outline: none;
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 2px var(--srpg-focus-ring);
    }

    .grid-fields {
        display: grid;
        grid-template-columns: 1fr 1.5fr;
        gap: 1rem;
    }

    .cost-inputs {
        display: flex;
        gap: 0.5rem;
    }

    .cost-col {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        flex: 1;
        min-width: 0;
    }

    .cost-col input {
        width: 100%;
        padding: 0.5rem 0.25rem;
        text-align: right;
    }

    .unit {
        font-size: 0.65rem;
        font-weight: 800;
        color: var(--text-muted);
        opacity: 0.7;
    }

    .field-help {
        font-size: 0.7rem;
        color: var(--text-muted);
        margin-top: -0.25rem;
    }

    .attacks-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-top: 1rem;
    }

    .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .list-header .field-label {
        font-weight: 600;
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    .add-btn {
        background: var(--bg-tertiary);
        border: 1px solid var(--border-primary);
        padding: 0.25rem 0.75rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--text-primary);
        cursor: pointer;
        transition: all 0.2s;
    }

    .add-btn:hover {
        background: var(--accent-primary);
        color: white;
        border-color: var(--accent-primary);
    }

    .attack-card {
        background: var(--modal-bg);
        border: 1px solid var(--border-primary);
        border-radius: 8px;
        padding: 0.5rem;
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    .attack-inputs {
        display: flex;
        gap: 0.375rem;
        flex: 1;
    }

    .attack-inputs input,
    .attack-inputs select {
        padding: 0.375rem 0.5rem;
        background: var(--input-bg);
        border: 1px solid var(--border-primary);
        border-radius: 4px;
        font-size: 0.8rem;
        color: var(--text-primary);
    }

    .atk-name {
        flex: 2;
    }
    .atk-dice {
        flex: 1.5;
    }
    .atk-kind {
        flex: 1;
    }

    .remove-atk {
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        display: flex;
        align-items: center;
    }

    .remove-atk:hover {
        color: var(--accent-danger);
        background: var(--bg-secondary);
    }

    .remove-atk svg {
        width: 1rem;
        height: 1rem;
    }

    .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 0.5rem;
    }

    @media (max-width: 480px) {
        .grid-fields {
            grid-template-columns: 1fr;
        }

        .attack-inputs {
            flex-direction: column;
        }

        .modal-actions {
            flex-direction: column-reverse;
        }

        .modal-actions button {
            width: 100%;
        }
    }
</style>
