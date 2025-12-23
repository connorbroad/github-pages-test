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
        <h3 class="text-text-primary m-0 mb-4 text-xl font-semibold md:text-2xl">Weapon Attacks</h3>
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {#each equippedWeapons as weapon}
                <div
                    class="from-card-bg to-bg-secondary border-border-primary before:from-accent-danger before:via-accent-warning before:to-accent-warning hover:border-border-secondary relative flex flex-col overflow-hidden rounded-xl border bg-linear-to-br shadow-[0_1px_3px_var(--shadow-sm)] transition-all duration-300 ease-in-out before:absolute before:top-0 before:right-0 before:left-0 before:h-[3px] before:bg-linear-to-r before:opacity-0 before:transition-opacity before:duration-300 before:content-[''] hover:-translate-y-0.5 hover:shadow-[0_8px_25px_var(--shadow-md)] hover:before:opacity-100">
                    <div class="flex flex-col p-5 pb-4">
                        <div class="flex items-start justify-between gap-2">
                            <div class="flex flex-col gap-0.5">
                                <h4 class="text-text-primary m-0 text-lg font-bold tracking-tight">
                                    {weapon.name}
                                </h4>
                                {#if weapon.range}
                                    <p
                                        class="text-text-tertiary m-0 text-xs font-bold tracking-wider uppercase">
                                        {weapon.range}
                                    </p>
                                {/if}
                            </div>
                            <!-- Weapon icon -->
                            <svg
                                class="text-text-tertiary/50 h-6 w-6 flex-none"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1.5"
                                stroke-linecap="round"
                                stroke-linejoin="round">
                                <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
                                <path d="M13 19l6-6" />
                                <path d="M16 16l4 4" />
                                <path d="M19 21l2-2" />
                            </svg>
                        </div>

                        {#if weapon.attacks && weapon.attacks.length > 0}
                            <div class="mt-3 flex flex-col gap-2">
                                {#each weapon.attacks as attack}
                                    <button
                                        class="bg-bg-secondary/50 hover:bg-bg-secondary active:bg-bg-tertiary group flex cursor-pointer items-center justify-between gap-2 rounded-lg border-none px-3 py-2.5 transition-colors duration-200"
                                        on:click={(e) => {
                                            e.stopPropagation();
                                            rollDamage(weapon, attack);
                                        }}
                                        title={`Roll ${attack.name || "damage"}`}
                                        aria-label={`Roll ${attack.name || "damage"} for ${weapon.name}`}>
                                        <span class="text-text-secondary text-sm font-medium">
                                            {attack.name || "Damage"}
                                        </span>
                                        <div class="flex items-center gap-2">
                                            {#if attack.kind}
                                                <span
                                                    class="text-text-tertiary bg-bg-tertiary rounded px-1.5 py-0.5 text-[0.65rem] font-bold tracking-wider uppercase">
                                                    {attack.kind}
                                                </span>
                                            {/if}
                                            <span
                                                class="text-text-secondary from-bg-tertiary to-bg-secondary border-border-secondary min-w-14 rounded-lg border bg-linear-to-br px-2 py-1 text-center text-lg font-bold tracking-tight shadow-[0_1px_2px_var(--shadow-sm)]">
                                                {attack.dice}
                                            </span>
                                            <svg
                                                class="text-text-tertiary group-hover:text-accent-primary h-5 w-5 transition-colors duration-200"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-width="2.5">
                                                <rect x="4" y="4" width="16" height="16" rx="3" />
                                                <circle cx="9" cy="9" r="1.5" fill="currentColor" />
                                                <circle cx="15" cy="15" r="1.5" fill="currentColor" />
                                            </svg>
                                        </div>
                                    </button>
                                {/each}
                            </div>
                        {/if}
                    </div>

                    <!-- Roll footer matching ability/skill cards -->
                    <div
                        class="border-border-primary bg-bg-secondary/30 divide-border-primary mt-auto flex w-full divide-x border-t">
                        {#if (weapon.toHit || "1d20").startsWith("1d")}
                            <button
                                class="text-text-secondary hover:text-accent-primary hover:bg-accent-primary/5 active:bg-accent-primary/10 flex w-12 flex-none cursor-pointer items-center justify-center py-3 transition-colors duration-200"
                                on:click={(e) => {
                                    e.stopPropagation();
                                    rollToHit(weapon, "Maximum");
                                }}
                                title="Roll to hit with advantage">
                                <ResultOptionIcon option="Maximum" size="1.25em" />
                            </button>
                        {/if}
                        <button
                            class="text-text-primary hover:text-accent-primary hover:bg-accent-primary/5 active:bg-accent-primary/10 flex flex-1 cursor-pointer items-center justify-center gap-2 py-3 text-sm font-bold tracking-wide uppercase transition-colors duration-200"
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
                                stroke-width="2.5">
                                <rect x="4" y="4" width="16" height="16" rx="3" />
                                <circle cx="9" cy="9" r="1.5" fill="currentColor" />
                                <circle cx="15" cy="15" r="1.5" fill="currentColor" />
                            </svg>
                            Hit
                        </button>
                        {#if (weapon.toHit || "1d20").startsWith("1d")}
                            <button
                                class="text-text-secondary hover:text-accent-primary hover:bg-accent-primary/5 active:bg-accent-primary/10 flex w-12 flex-none cursor-pointer items-center justify-center py-3 transition-colors duration-200"
                                on:click={(e) => {
                                    e.stopPropagation();
                                    rollToHit(weapon, "Minimum");
                                }}
                                title="Roll to hit with disadvantage">
                                <ResultOptionIcon option="Minimum" size="1.25em" />
                            </button>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    </div>
{/if}
