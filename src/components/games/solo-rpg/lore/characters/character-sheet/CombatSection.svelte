<script lang="ts">
    import type { Character, WeaponItem, AttackSpec, ArmorItem } from "../../../data/storage-utils";
    import { loadCampaignItems } from "../../../data/storage-utils";
    import ResultOptionIcon from "../../../oracle/components/dice-roller/components/ResultOptionIcon.svelte";
    import { createEventDispatcher } from "svelte";
    export let character: Character;
    export let editedCharacter: Character;
    export let isEditable: boolean;

    const dispatch = createEventDispatcher();

    // Resolve equipped item names from campaign items
    $: campaignItems = loadCampaignItems().filter((i) => i.campaignId === character.campaignId);
    $: itemMap = new Map(campaignItems.map((i: any) => [i.id, i]));
    function nameFor(id: string) { return itemMap.get(id)?.name || id; }

    $: equippedWeaponIds = editedCharacter?.equipped?.weapons || [];
    $: equippedArmorIds = editedCharacter?.equipped?.armors || [];
    $: equippedWeaponNames = equippedWeaponIds.map((id: string) => nameFor(id));
    $: equippedArmorNames = equippedArmorIds.map((id: string) => nameFor(id));
    $: equippedWeapons = equippedWeaponIds
        .map((id: string) => itemMap.get(id))
        .filter((it: any) => it && it.type === 'weapon') as WeaponItem[];
    $: equippedArmors = equippedArmorIds
        .map((id: string) => itemMap.get(id))
        .filter((it: any) => it && it.type === 'armor') as ArmorItem[];
    $: computedArmorAC = equippedArmors.reduce((sum, a) => sum + (a.armorClass || 0), 0);
    $: isArmorAutoAC = equippedArmors.length > 0 && computedArmorAC > 0;

    function adjustDiceRollForAdvantageOrDisadvantage(diceFormula: string, resultOption: "Sum" | "Maximum" | "Minimum"): string {
        if (diceFormula.includes("+") || diceFormula.includes("-")) return diceFormula;
        const match = diceFormula.match(/^(\d*)d(\d+)$/);
        if (match) {
            const numDice = parseInt(match[1] || "1", 10);
            const sides = parseInt(match[2], 10);
            if (numDice === 1 && (resultOption === "Maximum" || resultOption === "Minimum")) {
                return `2d${sides}`;
            }
        }
        return diceFormula;
    }

    function parseDiceAndModifier(expr: string): { dice: string; modifier: number } {
        // Accept formats like "1d20+5", "1d20-1", "2d6", etc.
        const m = expr.trim().match(/^(\d+d\d+)([+-]\d+)?$/i);
        if (!m) return { dice: expr.trim(), modifier: 0 };
        return { dice: m[1], modifier: m[2] ? Number(m[2]) : 0 };
    }

    function rollToHit(weapon: WeaponItem, resultOption: "Sum" | "Maximum" | "Minimum") {
        const { dice, modifier } = parseDiceAndModifier(weapon.toHit || "1d20");
        const adjusted = adjustDiceRollForAdvantageOrDisadvantage(dice, resultOption);
        dispatch("rollCheck", { checkName: `${weapon.name} to hit`, diceFormula: adjusted, modifier, resultOption });
    }

    function rollDamage(weapon: WeaponItem, attack: AttackSpec) {
        const { dice, modifier } = parseDiceAndModifier(attack.dice);
        const name = attack.name ? `${weapon.name} — ${attack.name}` : `${weapon.name} damage`;
        dispatch("rollCheck", { checkName: name, diceFormula: dice, modifier, resultOption: "Sum" });
    }
</script>

<div class="srpg-form-grid">
    <div class="srpg-form-field">
        <label for="initiative">Initiative</label>
        {#if isEditable}
            <input type="number" id="initiative" bind:value={editedCharacter.initiative} />
        {:else}
            <p>{character.initiative ? (character.initiative >= 0 ? "+" : "") + character.initiative : "—"}</p>
        {/if}
    </div>

    <div class="srpg-form-field">
        <label for="speed">Speed</label>
        {#if isEditable}
            <input type="number" id="speed" bind:value={editedCharacter.speed} />
        {:else}
            <p>{character.speed ? character.speed + " ft." : "—"}</p>
        {/if}
    </div>
    
    <div class="srpg-form-field">
        <label for="ac">Armor Class</label>
        {#if isEditable}
            {#if isArmorAutoAC}
                <input type="number" id="ac" value={computedArmorAC} disabled />
                <p class="input-help">Auto from equipped armor</p>
            {:else}
                <input type="number" id="ac" bind:value={editedCharacter.armorClass} />
            {/if}
        {:else}
            <p>{isArmorAutoAC ? computedArmorAC : (character.armorClass || "—")}</p>
        {/if}
    </div>

    <div class="srpg-form-field">
        <label for="equipped-armor">Equipped Armor</label>
        <p id="equipped-armor">{equippedArmorNames.length ? equippedArmorNames.join(", ") : "—"}</p>
    </div>

    <div class="srpg-form-field">
        <label for="equipped-weapons">Equipped Weapons</label>
        <p id="equipped-weapons">{equippedWeaponNames.length ? equippedWeaponNames.join(", ") : "—"}</p>
    </div>
</div>

{#if equippedWeapons.length > 0}
    <div class="attacks-section">
        <h3>Weapon Attacks</h3>
        <div class="weapons-grid">
            {#each equippedWeapons as weapon}
                <div class="weapon-card">
                    <div class="weapon-header">
                        <h4 class="weapon-name">{weapon.name}</h4>
                        {#if weapon.range}
                            <span class="weapon-range">{weapon.range}</span>
                        {/if}
                    </div>

                    <div class="tohit-row">
                        <div class="tohit-info">
                            <span class="label">To Hit:</span>
                            <span class="value">{weapon.toHit || "1d20"}</span>
                        </div>
                        <div class="roll-buttons">
                            {#if (weapon.toHit || "1d20").startsWith("1d")}
                                <button class="srpg-b srpg-b-sm srpg-b-simple roll-btn-adv" on:click={(e) => { e.stopPropagation(); dispatch('rollCheck', { checkName: `${weapon.name} to hit`, diceFormula: adjustDiceRollForAdvantageOrDisadvantage(parseDiceAndModifier(weapon.toHit || '1d20').dice, 'Maximum'), modifier: parseDiceAndModifier(weapon.toHit || '1d20').modifier, resultOption: 'Maximum' }); }} title="Roll with advantage">
                                    <span class="result-icon"><ResultOptionIcon option="Maximum" size="1.5em" /></span>
                                </button>
                            {/if}
                            <button class="srpg-b srpg-b-sm srpg-b-normal roll-btn" on:click={(e) => { e.stopPropagation(); rollToHit(weapon, 'Sum'); }} title={`Roll ${weapon.name} to hit`}>
                                <svg class="srpg-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="4" y="4" width="16" height="16" rx="3"/>
                                    <circle cx="9" cy="9" r="1.5" fill="currentColor"/>
                                    <circle cx="15" cy="15" r="1.5" fill="currentColor"/>
                                </svg>
                                Roll
                            </button>
                            {#if (weapon.toHit || "1d20").startsWith("1d")}
                                <button class="srpg-b srpg-b-sm srpg-b-simple roll-btn-dis" on:click={(e) => { e.stopPropagation(); dispatch('rollCheck', { checkName: `${weapon.name} to hit`, diceFormula: adjustDiceRollForAdvantageOrDisadvantage(parseDiceAndModifier(weapon.toHit || '1d20').dice, 'Minimum'), modifier: parseDiceAndModifier(weapon.toHit || '1d20').modifier, resultOption: 'Minimum' }); }} title="Roll with disadvantage">
                                    <span class="result-icon"><ResultOptionIcon option="Minimum" size="1.5em" /></span>
                                </button>
                            {/if}
                        </div>
                    </div>

                    {#if weapon.attacks && weapon.attacks.length > 0}
                        <div class="attacks-list">
                            {#each weapon.attacks as attack}
                                <div class="attack-row">
                                    <div class="attack-info">
                                        <span class="label">{attack.name || 'Attack'}:</span>
                                        <span class="value">{attack.dice}{attack.kind ? ` ${attack.kind}` : ''}</span>
                                    </div>
                                    <button class="srpg-b srpg-b-sm srpg-b-normal" on:click={(e) => { e.stopPropagation(); rollDamage(weapon, attack); }} title={`Roll ${attack.name || 'damage'}`}>
                                        <svg class="srpg-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <rect x="4" y="4" width="16" height="16" rx="3"/>
                                            <circle cx="9" cy="9" r="1.5" fill="currentColor"/>
                                            <circle cx="15" cy="15" r="1.5" fill="currentColor"/>
                                        </svg>
                                        Roll
                                    </button>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    </div>
{/if}

<style>
    .attacks-section { margin-top: 1.25rem; }
    .weapons-grid { display: grid; grid-template-columns: 1fr; gap: 0.75rem; }
    @media (min-width: 640px) { .weapons-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 1024px) { .weapons-grid { grid-template-columns: repeat(3, 1fr); } }

    .weapon-card { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 10px; padding: 0.75rem; }
    .weapon-header { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.5rem; }
    .weapon-name { margin: 0; font-size: 1rem; font-weight: 600; }
    .weapon-range { font-size: 0.8125rem; color: var(--text-muted); }

    .tohit-row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
    .tohit-info { display: flex; align-items: center; gap: 0.5rem; }
    .label { font-weight: 600; color: var(--text-secondary); }
    .value { color: var(--text-primary); }

    .attacks-list { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem; }
    .attack-row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
    .attack-info { display: flex; align-items: center; gap: 0.5rem; }

    .roll-buttons { display: flex; gap: 0.375rem; }
</style>
