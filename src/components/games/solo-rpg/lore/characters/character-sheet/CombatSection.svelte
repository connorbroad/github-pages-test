<script lang="ts">
    import type { Character, WeaponItem, AttackSpec, ArmorItem } from "../../../data/storage-utils";
    import { loadCampaignItems } from "../../../data/storage-utils";
    import ResultOptionIcon from "../../../oracle/components/dice-roller/components/ResultOptionIcon.svelte";

    export let character: Character;
    export let editedCharacter: Character;
    export let isEditable: boolean;
    export let onRollCheck: (detail: any) => void = () => {};

    // Resolve equipped item names from campaign items
    $: campaignItems = loadCampaignItems().filter((i) => i.campaignId === character.campaignId);
    $: itemMap = new Map(campaignItems.map((i: any) => [i.id, i]));
    function nameFor(id: string) {
        return itemMap.get(id)?.name || id;
    }

    $: equippedWeaponIds = editedCharacter?.equipped?.weapons || [];
    $: equippedArmorIds = editedCharacter?.equipped?.armors || [];
    $: equippedWeaponNames = equippedWeaponIds.map((id: string) => nameFor(id));
    $: equippedArmorNames = equippedArmorIds.map((id: string) => nameFor(id));
    $: equippedWeapons = equippedWeaponIds
        .map((id: string) => itemMap.get(id))
        .filter((it: any) => it && it.type === "weapon") as WeaponItem[];
    $: equippedArmors = equippedArmorIds
        .map((id: string) => itemMap.get(id))
        .filter((it: any) => it && it.type === "armor") as ArmorItem[];
    $: computedArmorAC = equippedArmors.reduce((sum, a) => sum + (a.armorClass || 0), 0);
    $: isArmorAutoAC = equippedArmors.length > 0 && computedArmorAC > 0;

    function adjustDiceRollForAdvantageOrDisadvantage(
        diceFormula: string,
        resultOption: "Sum" | "Maximum" | "Minimum"
    ): string {
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
        onRollCheck({
            checkName: `${weapon.name} to hit`,
            diceFormula: adjusted,
            modifier,
            resultOption,
        });
    }

    function rollDamage(weapon: WeaponItem, attack: AttackSpec) {
        const { dice, modifier } = parseDiceAndModifier(attack.dice);
        const name = attack.name ? `${weapon.name} — ${attack.name}` : `${weapon.name} damage`;
        onRollCheck({
            checkName: name,
            diceFormula: dice,
            modifier,
            resultOption: "Sum",
        });
    }
</script>

<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
    <div class="flex flex-col gap-1">
        <label class="text-text-secondary text-sm font-semibold" for="initiative">Initiative</label>
        {#if isEditable}
            <input
                class="border-input-border bg-input-bg text-input-text focus:border-input-border-focus w-full rounded border p-2 focus:outline-none"
                type="number"
                id="initiative"
                bind:value={editedCharacter.initiative} />
        {:else}
            <p class="text-text-primary m-0 p-2">
                {character.initiative
                    ? (character.initiative >= 0 ? "+" : "") + character.initiative
                    : "—"}
            </p>
        {/if}
    </div>

    <div class="flex flex-col gap-1">
        <label class="text-text-secondary text-sm font-semibold" for="speed">Speed</label>
        {#if isEditable}
            <input
                class="border-input-border bg-input-bg text-input-text focus:border-input-border-focus w-full rounded border p-2 focus:outline-none"
                type="number"
                id="speed"
                bind:value={editedCharacter.speed} />
        {:else}
            <p class="text-text-primary m-0 p-2">
                {character.speed ? character.speed + " ft." : "—"}
            </p>
        {/if}
    </div>

    <div class="flex flex-col gap-1">
        <label class="text-text-secondary text-sm font-semibold" for="ac">Armor Class</label>
        {#if isEditable}
            {#if isArmorAutoAC}
                <input
                    class="border-input-border bg-input-bg text-input-text focus:border-input-border-focus w-full rounded border p-2 focus:outline-none"
                    type="number"
                    id="ac"
                    value={computedArmorAC}
                    disabled />
                <p class="mt-1 text-xs">Auto from equipped armor</p>
            {:else}
                <input
                    class="border-input-border bg-input-bg text-input-text focus:border-input-border-focus w-full rounded border p-2 focus:outline-none"
                    type="number"
                    id="ac"
                    bind:value={editedCharacter.armorClass} />
            {/if}
        {:else}
            <p class="text-text-primary m-0 p-2">
                {isArmorAutoAC ? computedArmorAC : character.armorClass || "—"}
            </p>
        {/if}
    </div>

    <div class="flex flex-col gap-1">
        <label class="text-text-secondary text-sm font-semibold" for="equipped-armor">
            Equipped Armor
        </label>
        <p class="text-text-primary m-0 p-2" id="equipped-armor">
            {equippedArmorNames.length ? equippedArmorNames.join(", ") : "—"}
        </p>
    </div>

    <div class="flex flex-col gap-1">
        <label class="text-text-secondary text-sm font-semibold" for="equipped-weapons">
            Equipped Weapons
        </label>
        <p class="text-text-primary m-0 p-2" id="equipped-weapons">
            {equippedWeaponNames.length ? equippedWeaponNames.join(", ") : "—"}
        </p>
    </div>
</div>

{#if equippedWeapons.length > 0}
    <div class="mt-5">
        <h3>Weapon Attacks</h3>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {#each equippedWeapons as weapon}
                <div class="bg-bg-secondary border-border-primary rounded-[10px] border p-3">
                    <div class="mb-2 flex items-center justify-between gap-2">
                        <h4 class="m-0 text-base font-semibold">{weapon.name}</h4>
                        {#if weapon.range}
                            <span class="text-[0.8125rem]">{weapon.range}</span>
                        {/if}
                    </div>

                    <div class="flex items-center justify-between gap-3">
                        <div class="flex items-center gap-2">
                            <span class="text-text-secondary font-semibold">To Hit:</span>
                            <span class="text-text-primary">{weapon.toHit || "1d20"}</span>
                        </div>
                        <div class="flex gap-1.5">
                            {#if (weapon.toHit || "1d20").startsWith("1d")}
                                <button
                                    class="border-button-simple-border bg-button-simple-bg text-button-simple-text hover:bg-button-simple-hover-bg hover:border-button-simple-hover-border active:bg-button-simple-bg flex cursor-pointer items-center justify-center gap-2 rounded-md border px-2 py-1 text-center text-sm font-medium shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-sm"
                                    on:click={(e) => {
                                        e.stopPropagation();
                                        e.stopPropagation();
                                        onRollCheck({
                                            checkName: `${weapon.name} to hit`,
                                            diceFormula: adjustDiceRollForAdvantageOrDisadvantage(
                                                parseDiceAndModifier(weapon.toHit || "1d20").dice,
                                                "Maximum"
                                            ),
                                            modifier: parseDiceAndModifier(weapon.toHit || "1d20")
                                                .modifier,
                                            resultOption: "Maximum",
                                        });
                                    }}
                                    title="Roll with advantage">
                                    <span class="inline-block">
                                        <ResultOptionIcon option="Maximum" size="1.5em" />
                                    </span>
                                </button>
                            {/if}
                            <button
                                class="border-border-primary bg-accent-primary hover:bg-accent-primary-hover active:bg-accent-primary-active flex cursor-pointer items-center justify-center gap-2 rounded-md border px-2 py-1 text-center text-sm font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
                                on:click={(e) => {
                                    e.stopPropagation();
                                    rollToHit(weapon, "Sum");
                                }}
                                title={`Roll ${weapon.name} to hit`}>
                                <svg
                                    class="h-4 w-4"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2">
                                    <rect x="4" y="4" width="16" height="16" rx="3" />
                                    <circle cx="9" cy="9" r="1.5" fill="currentColor" />
                                    <circle cx="15" cy="15" r="1.5" fill="currentColor" />
                                </svg>
                                Roll
                            </button>
                            {#if (weapon.toHit || "1d20").startsWith("1d")}
                                <button
                                    class="border-button-simple-border bg-button-simple-bg text-button-simple-text hover:bg-button-simple-hover-bg hover:border-button-simple-hover-border active:bg-button-simple-bg flex cursor-pointer items-center justify-center gap-2 rounded-md border px-2 py-1 text-center text-sm font-medium shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-sm"
                                    on:click={(e) => {
                                        e.stopPropagation();
                                        e.stopPropagation();
                                        onRollCheck({
                                            checkName: `${weapon.name} to hit`,
                                            diceFormula: adjustDiceRollForAdvantageOrDisadvantage(
                                                parseDiceAndModifier(weapon.toHit || "1d20").dice,
                                                "Minimum"
                                            ),
                                            modifier: parseDiceAndModifier(weapon.toHit || "1d20")
                                                .modifier,
                                            resultOption: "Minimum",
                                        });
                                    }}
                                    title="Roll with disadvantage">
                                    <span class="inline-block">
                                        <ResultOptionIcon option="Minimum" size="1.5em" />
                                    </span>
                                </button>
                            {/if}
                        </div>
                    </div>

                    {#if weapon.attacks && weapon.attacks.length > 0}
                        <div class="mt-2 flex flex-col gap-2">
                            {#each weapon.attacks as attack}
                                <div class="flex items-center justify-between gap-3">
                                    <div class="flex items-center gap-2">
                                        <span class="text-text-secondary font-semibold">
                                            {attack.name || "Attack"}:
                                        </span>
                                        <span class="text-text-primary">
                                            {attack.dice}{attack.kind ? ` ${attack.kind}` : ""}
                                        </span>
                                    </div>
                                    <button
                                        class="border-border-primary bg-accent-primary hover:bg-accent-primary-hover active:bg-accent-primary-active flex cursor-pointer items-center justify-center gap-2 rounded-md border px-2 py-1 text-center text-sm font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
                                        on:click={(e) => {
                                            e.stopPropagation();
                                            rollDamage(weapon, attack);
                                        }}
                                        title={`Roll ${attack.name || "damage"}`}>
                                        <svg
                                            class="h-4 w-4"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="2">
                                            <rect x="4" y="4" width="16" height="16" rx="3" />
                                            <circle cx="9" cy="9" r="1.5" fill="currentColor" />
                                            <circle cx="15" cy="15" r="1.5" fill="currentColor" />
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
