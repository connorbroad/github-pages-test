<script lang="ts">
    import type { Character, Ability, Skill } from "../../../data/storage-utils";

    import ResultOptionIcon from "../../../oracle/components/dice-roller/components/ResultOptionIcon.svelte";
    import TemplateModal from "../../../shared/modal/TemplateModal.svelte";
    import { adjustDiceRollForAdvantageOrDisadvantage } from "./dice-utils";

    export let editedCharacter: Character;
    export let isEditable: boolean;
    export let onRollCheck: (detail: any) => void = () => {};

    // Local state for template modals
    let showAbilityTemplateModal = false;
    let showSkillTemplateModal = false;

    interface TemplateOption {
        key: string;
        title: string;
        description: string;
        note?: string;
    }

    const abilityTemplates = {
        dnd5e: [
            { name: "Strength", score: 10 },
            { name: "Dexterity", score: 10 },
            { name: "Constitution", score: 10 },
            { name: "Intelligence", score: 10 },
            { name: "Wisdom", score: 10 },
            { name: "Charisma", score: 10 },
        ],
        daggerheart: [
            { name: "Agility", score: 0 },
            { name: "Strength", score: 0 },
            { name: "Finesse", score: 0 },
            { name: "Instinct", score: 0 },
            { name: "Presence", score: 0 },
            { name: "Knowledge", score: 0 },
        ],
    } as const;

    const skillTemplates = {
        dnd5e: [
            { name: "Acrobatics", ability: "Dexterity" },
            { name: "Animal Handling", ability: "Wisdom" },
            { name: "Arcana", ability: "Intelligence" },
            { name: "Athletics", ability: "Strength" },
            { name: "Deception", ability: "Charisma" },
            { name: "History", ability: "Intelligence" },
            { name: "Insight", ability: "Wisdom" },
            { name: "Intimidation", ability: "Charisma" },
            { name: "Investigation", ability: "Intelligence" },
            { name: "Medicine", ability: "Wisdom" },
            { name: "Nature", ability: "Intelligence" },
            { name: "Perception", ability: "Wisdom" },
            { name: "Performance", ability: "Charisma" },
            { name: "Persuasion", ability: "Charisma" },
            { name: "Religion", ability: "Intelligence" },
            { name: "Sleight of Hand", ability: "Dexterity" },
            { name: "Stealth", ability: "Dexterity" },
            { name: "Survival", ability: "Wisdom" },
        ],
        pathfinder2e: [
            { name: "Acrobatics", ability: "Dexterity" },
            { name: "Arcana", ability: "Intelligence" },
            { name: "Athletics", ability: "Strength" },
            { name: "Crafting", ability: "Intelligence" },
            { name: "Deception", ability: "Charisma" },
            { name: "Diplomacy", ability: "Charisma" },
            { name: "Intimidation", ability: "Charisma" },
            { name: "Medicine", ability: "Wisdom" },
            { name: "Nature", ability: "Wisdom" },
            { name: "Occultism", ability: "Intelligence" },
            { name: "Performance", ability: "Charisma" },
            { name: "Religion", ability: "Wisdom" },
            { name: "Society", ability: "Intelligence" },
            { name: "Stealth", ability: "Dexterity" },
            { name: "Survival", ability: "Wisdom" },
            { name: "Thievery", ability: "Dexterity" },
        ],
    } as const;

    const abilityTemplateOptions: TemplateOption[] = [
        {
            key: "dnd5e",
            title: "D&D 5e",
            description: "Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma",
            note: "Default score: 10",
        },
        {
            key: "daggerheart",
            title: "Daggerheart",
            description: "Agility, Strength, Finesse, Instinct, Presence, Knowledge",
            note: "Default score: 0",
        },
    ];

    const skillTemplateOptions: TemplateOption[] = [
        {
            key: "dnd5e",
            title: "D&D 5e Skills",
            description:
                "18 standard skills: Acrobatics, Animal Handling, Arcana, Athletics, Deception, History, Insight, Intimidation, Investigation, Medicine, Nature, Perception, Performance, Persuasion, Religion, Sleight of Hand, Stealth, Survival",
            note: "Linked to standard D&D 5e abilities",
        },
        {
            key: "pathfinder2e",
            title: "Pathfinder 2e Skills",
            description:
                "16 skills: Acrobatics, Arcana, Athletics, Crafting, Deception, Diplomacy, Intimidation, Medicine, Nature, Occultism, Performance, Religion, Society, Stealth, Survival, Thievery",
            note: "Linked to standard abilities",
        },
    ];

    // Methods now internal to this section
    function addAbility() {
        const newAbility: Ability = {
            id: `ability-${Date.now()}`,
            name: "New Ability",
            score: 10,
            modifier: 0,
            proficient: false,
        };
        editedCharacter.abilities = [...editedCharacter.abilities, newAbility];
    }

    function openTemplateModal() {
        showAbilityTemplateModal = true;
    }

    function applyAbilityTemplate(templateKey: string) {
        if (templateKey !== "dnd5e" && templateKey !== "daggerheart") return;
        const template = abilityTemplates[templateKey];
        const baseTimestamp = Date.now();
        const newAbilities: Ability[] = template.map((abilityData, index) => ({
            id: `ability-${baseTimestamp + index}`,
            name: abilityData.name,
            score: abilityData.score,
            modifier: 0,
            proficient: false,
        }));
        editedCharacter.abilities = [...editedCharacter.abilities, ...newAbilities];
        showAbilityTemplateModal = false;
    }

    function openSkillTemplateModal() {
        if (editedCharacter.abilities.length === 0) {
            alert("Please add abilities first before using skill templates.");
            return;
        }
        showSkillTemplateModal = true;
    }

    function applySkillTemplate(templateKey: string) {
        if (templateKey !== "dnd5e" && templateKey !== "pathfinder2e") return;

        const template = skillTemplates[templateKey];
        const baseTimestamp = Date.now();
        const newSkills: Skill[] = template
            .map((skillData, index) => {
                const ability = editedCharacter.abilities.find(
                    (a) => a.name.toLowerCase() === skillData.ability.toLowerCase()
                );
                if (!ability) return null;
                return {
                    id: `skill-${baseTimestamp + index}`,
                    name: skillData.name,
                    abilityId: ability.id,
                    proficient: false,
                    bonus: 0,
                };
            })
            .filter((s): s is Skill => s !== null);

        if (newSkills.length < template.length) {
            const missingAbilities = template
                .filter(
                    (sd) =>
                        !editedCharacter.abilities.find(
                            (a) => a.name.toLowerCase() === sd.ability.toLowerCase()
                        )
                )
                .map((s) => s.ability);
            alert(
                `Some skills could not be added because the following abilities are missing: ${[...new Set(missingAbilities)].join(", ")}`
            );
        }
        editedCharacter.skills = [...editedCharacter.skills, ...newSkills];
        showSkillTemplateModal = false;
    }

    function updateAbilityName(id: string, name: string) {
        editedCharacter.abilities = editedCharacter.abilities.map((a) =>
            a.id === id ? { ...a, name } : a
        );
    }
    function updateAbilityScore(id: string, score: number) {
        editedCharacter.abilities = editedCharacter.abilities.map((a) =>
            a.id === id ? { ...a, score } : a
        );
    }
    function updateAbilityModifier(id: string, modifier: number) {
        editedCharacter.abilities = editedCharacter.abilities.map((a) =>
            a.id === id ? { ...a, modifier } : a
        );
    }
    function updateAbilityProficient(id: string, proficient: boolean) {
        editedCharacter.abilities = editedCharacter.abilities.map((a) =>
            a.id === id ? { ...a, proficient } : a
        );
    }
    function removeAbility(id: string) {
        editedCharacter.abilities = editedCharacter.abilities.filter((a) => a.id !== id);
        editedCharacter.skills = editedCharacter.skills.filter((s) => s.abilityId !== id);
    }

    function updateSkillName(id: string, name: string) {
        editedCharacter.skills = editedCharacter.skills.map((s) =>
            s.id === id ? { ...s, name } : s
        );
    }
    function updateSkillAbility(id: string, abilityId: string) {
        editedCharacter.skills = editedCharacter.skills.map((s) =>
            s.id === id ? { ...s, abilityId } : s
        );
    }
    function updateSkillProficient(id: string, proficient: boolean) {
        editedCharacter.skills = editedCharacter.skills.map((s) =>
            s.id === id ? { ...s, proficient } : s
        );
    }
    function updateSkillBonus(id: string, bonus: number) {
        editedCharacter.skills = editedCharacter.skills.map((s) =>
            s.id === id ? { ...s, bonus } : s
        );
    }
    function addSkill() {
        if (editedCharacter.abilities.length === 0) {
            alert("Please add an ability first before adding skills.");
            return;
        }
        const newSkill: Skill = {
            id: `skill-${Date.now()}`,
            name: "New Skill",
            abilityId: editedCharacter.abilities[0].id,
            proficient: false,
            bonus: 0,
        };
        editedCharacter.skills = [...editedCharacter.skills, newSkill];
    }
    function removeSkill(id: string) {
        editedCharacter.skills = editedCharacter.skills.filter((s) => s.id !== id);
    }

    function getAbilityName(abilityId: string): string {
        const ability = editedCharacter.abilities.find((a) => a.id === abilityId);
        return ability ? ability.name : "Unknown";
    }

    function rollAbility(ability: Ability, resultOption: "Sum" | "Maximum" | "Minimum") {
        const diceFormula = editedCharacter.abilityCheckDice || "1d20";
        const adjusted = adjustDiceRollForAdvantageOrDisadvantage(diceFormula, resultOption);
        onRollCheck({
            checkName: ability.name,
            diceFormula: adjusted,
            modifier: ability.modifier,
            resultOption,
        });
    }
    function rollSkill(skill: Skill, resultOption: "Sum" | "Maximum" | "Minimum") {
        const diceFormula = editedCharacter.skillCheckDice || "1d20";
        const adjusted = adjustDiceRollForAdvantageOrDisadvantage(diceFormula, resultOption);
        onRollCheck({
            checkName: skill.name,
            diceFormula: adjusted,
            modifier: skill.bonus,
            resultOption,
        });
    }
</script>

{#if isEditable}
    <div class="mb-4 flex flex-wrap gap-2">
        <button
            class="border-border-primary bg-accent-success hover:bg-accent-success-hover active:bg-accent-success-active flex cursor-pointer items-center justify-center gap-1.5 rounded-md border px-2 py-1 text-center text-sm font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
            on:click={addAbility}>
            <svg
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2">
                <path d="M12 5v14M5 12h14" />
            </svg>
            Add Ability
        </button>
        <button
            class="border-border-primary bg-accent-primary hover:bg-accent-primary-hover active:bg-accent-primary-active flex cursor-pointer items-center justify-center gap-1.5 rounded-md border px-2 py-1 text-center text-sm font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
            on:click={openTemplateModal}>
            <svg
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Use Template
        </button>
    </div>
{/if}

{#if isEditable}
    <div class="bg-bg-secondary border-border-primary my-4 rounded-lg border p-4">
        <label class="text-text-primary mb-2 block text-sm font-semibold" for="abilityCheckDice">
            Ability Check Dice Formula
        </label>
        <input
            class="border-border-secondary bg-bg-primary text-text-primary focus:border-accent-primary w-full rounded-md border p-2 text-[0.9375rem] focus:shadow-[0_0_0_2px_var(--focus-ring)] focus:outline-none"
            type="text"
            id="abilityCheckDice"
            bind:value={editedCharacter.abilityCheckDice}
            placeholder="e.g., 1d20" />
        <p class="mt-2 mb-0 text-[0.8125rem] italic">
            This dice formula will be used for all ability checks
        </p>
    </div>
{/if}

{#if editedCharacter.abilities.length > 0}
    <div class="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {#each editedCharacter.abilities as ability}
            <div
                class="from-card-bg to-bg-secondary border-border-primary before:from-accent-primary before:via-accent-info before:to-accent-info-hover hover:border-border-secondary relative flex flex-col overflow-hidden rounded-xl border bg-linear-to-br shadow-[0_1px_3px_var(--shadow-sm)] transition-all duration-300 ease-in-out before:absolute before:top-0 before:right-0 before:left-0 before:h-[3px] before:bg-linear-to-r before:opacity-0 before:transition-opacity before:duration-300 before:content-[''] hover:-translate-y-0.5 hover:shadow-[0_8px_25px_var(--shadow-md)] hover:before:opacity-100">
                {#if isEditable}
                    <div class="p-5">
                        <div class="flex flex-col gap-1">
                            <label
                                class="text-text-secondary text-sm font-semibold"
                                for={"ability-name-" + ability.id}>
                                Name
                            </label>
                            <input
                                class="border-input-border bg-input-bg text-input-text focus:border-input-border-focus w-full rounded border p-2 focus:outline-none"
                                type="text"
                                id={"ability-name-" + ability.id}
                                value={ability.name}
                                on:input={(e) =>
                                    updateAbilityName(
                                        ability.id,
                                        (e.currentTarget as HTMLInputElement).value
                                    )}
                                placeholder="Ability Name" />
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <div class="flex flex-col gap-1">
                                <label
                                    class="text-text-secondary text-sm font-semibold"
                                    for={"ability-score-" + ability.id}>
                                    Score
                                </label>
                                <input
                                    class="border-input-border bg-input-bg text-input-text focus:border-input-border-focus w-full rounded border p-2 focus:outline-none"
                                    type="number"
                                    id={"ability-score-" + ability.id}
                                    value={ability.score}
                                    on:input={(e) =>
                                        updateAbilityScore(
                                            ability.id,
                                            Number((e.currentTarget as HTMLInputElement).value)
                                        )}
                                    min="1"
                                    max="30" />
                            </div>

                            <div class="flex flex-col gap-1">
                                <label
                                    class="text-text-secondary text-sm font-semibold"
                                    for={"ability-modifier-" + ability.id}>
                                    Modifier
                                </label>
                                <input
                                    class="border-input-border bg-input-bg text-input-text focus:border-input-border-focus w-full rounded border p-2 focus:outline-none"
                                    type="number"
                                    id={"ability-modifier-" + ability.id}
                                    value={ability.modifier}
                                    on:input={(e) =>
                                        updateAbilityModifier(
                                            ability.id,
                                            Number((e.currentTarget as HTMLInputElement).value)
                                        )} />
                            </div>
                        </div>

                        <div class="flex min-h-10 items-center justify-center">
                            <label
                                class="text-text-secondary hover:text-text-primary flex cursor-pointer items-center gap-2 text-sm font-medium transition-colors duration-200">
                                <input
                                    class="accent-accent-primary m-0 w-auto scale-110 cursor-pointer"
                                    type="checkbox"
                                    checked={ability.proficient}
                                    on:change={(e) =>
                                        updateAbilityProficient(
                                            ability.id,
                                            (e.currentTarget as HTMLInputElement).checked
                                        )} />
                                <span>Proficient</span>
                            </label>
                        </div>

                        <button
                            class="border-border-primary bg-accent-danger hover:bg-accent-danger-hover active:bg-accent-danger-active mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border px-2 py-1 text-center text-sm font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
                            on:click={() => removeAbility(ability.id)}>
                            <svg
                                class="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2">
                                <path
                                    d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            Remove
                        </button>
                    </div>
                {:else}
                    <div class="flex flex-col justify-between p-5 pb-2">
                        <div class="flex items-start justify-between">
                            <div class="flex flex-col">
                                <h3
                                    class="text-text-secondary m-0 text-xs font-bold tracking-wider uppercase">
                                    {ability.name}
                                </h3>
                                <p
                                    class="text-text-primary mt-1 text-5xl leading-none font-black tracking-tight">
                                    {ability.score}
                                </p>
                            </div>
                            <div class="flex flex-col items-end gap-1">
                                <span
                                    class="text-text-secondary from-bg-tertiary to-bg-secondary border-border-secondary min-w-12 rounded-lg border bg-linear-to-br px-2 py-1 text-center text-xl font-bold tracking-tight shadow-[0_1px_2px_var(--shadow-sm)]">
                                    {ability.modifier >= 0 ? "+" : ""}{ability.modifier}
                                </span>
                                {#if ability.proficient}
                                    <span
                                        class="text-text-inverse from-accent-primary to-accent-info rounded-sm bg-linear-to-r px-1.5 py-0.5 text-[0.65rem] font-bold tracking-wider uppercase">
                                        PRO
                                    </span>
                                {/if}
                            </div>
                        </div>
                    </div>

                    {#if editedCharacter.abilityCheckDice}
                        <div
                            class="border-border-primary bg-bg-secondary/30 divide-border-primary mt-auto flex w-full divide-x border-t">
                            {#if editedCharacter.abilityCheckDice.startsWith("1d")}
                                <button
                                    class="text-text-secondary hover:text-accent-primary hover:bg-accent-primary/5 active:bg-accent-primary/10 flex w-12 flex-none cursor-pointer items-center justify-center py-3 transition-colors duration-200"
                                    on:click={() => rollAbility(ability, "Maximum")}
                                    title="Roll with advantage">
                                    <ResultOptionIcon option="Maximum" size="1.25em" />
                                </button>
                            {/if}
                            <button
                                class="text-text-primary hover:text-accent-primary hover:bg-accent-primary/5 active:bg-accent-primary/10 flex flex-1 cursor-pointer items-center justify-center gap-2 py-3 text-sm font-bold tracking-wide uppercase transition-colors duration-200"
                                on:click={() => rollAbility(ability, "Sum")}
                                title={"Roll " + ability.name + " check"}>
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
                                Roll
                            </button>
                            {#if editedCharacter.abilityCheckDice.startsWith("1d")}
                                <button
                                    class="text-text-secondary hover:text-accent-primary hover:bg-accent-primary/5 active:bg-accent-primary/10 flex w-12 flex-none cursor-pointer items-center justify-center py-3 transition-colors duration-200"
                                    on:click={() => rollAbility(ability, "Minimum")}
                                    title="Roll with disadvantage">
                                    <ResultOptionIcon option="Minimum" size="1.25em" />
                                </button>
                            {/if}
                        </div>
                    {/if}
                {/if}
            </div>
        {/each}
    </div>
{:else}
    <p class="px-4 py-8 text-center text-base">No abilities added yet.</p>
{/if}

<!-- Skills Subsection -->
<div class="border-divider mt-8 border-t-2 pt-6">
    <div class="mb-4">
        <h3 class="text-text-primary m-0 text-xl font-semibold md:text-2xl">Skills</h3>
    </div>

    {#if isEditable}
        <div class="mb-4 flex flex-wrap gap-2">
            <button
                class="border-border-primary bg-accent-success hover:bg-accent-success-hover active:bg-accent-success-active flex cursor-pointer items-center justify-center gap-1.5 rounded-md border px-2 py-1 text-center text-sm font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
                on:click={addSkill}>
                <svg
                    class="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2">
                    <path d="M12 5v14M5 12h14" />
                </svg>
                Add Skill
            </button>
            <button
                class="border-border-primary bg-accent-primary hover:bg-accent-primary-hover active:bg-accent-primary-active flex cursor-pointer items-center justify-center gap-1.5 rounded-md border px-2 py-1 text-center text-sm font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
                on:click={openSkillTemplateModal}>
                <svg
                    class="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Use Template
            </button>
        </div>
    {/if}

    {#if isEditable}
        <div class="bg-bg-secondary border-border-primary my-4 rounded-lg border p-4">
            <label class="text-text-primary mb-2 block text-sm font-semibold" for="skillCheckDice">
                Skill Check Dice Formula
            </label>
            <input
                class="border-border-secondary bg-bg-primary text-text-primary focus:border-accent-primary w-full rounded-md border p-2 text-[0.9375rem] focus:shadow-[0_0_0_2px_var(--focus-ring)] focus:outline-none"
                type="text"
                id="skillCheckDice"
                bind:value={editedCharacter.skillCheckDice}
                placeholder="e.g., 1d20" />
            <p class="mt-2 mb-0 text-[0.8125rem] italic">
                This dice formula will be used for all skill checks
            </p>
        </div>
    {/if}

    {#if editedCharacter.skills.length > 0}
        <div class="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {#each editedCharacter.skills as skill}
                <div
                    class="from-card-bg to-bg-secondary border-border-primary before:from-accent-primary before:via-accent-info before:to-accent-info-hover hover:border-border-secondary relative flex flex-col overflow-hidden rounded-xl border bg-linear-to-br shadow-[0_1px_3px_var(--shadow-sm)] transition-all duration-300 ease-in-out before:absolute before:top-0 before:right-0 before:left-0 before:h-[3px] before:bg-linear-to-r before:opacity-0 before:transition-opacity before:duration-300 before:content-[''] hover:-translate-y-0.5 hover:shadow-[0_8px_25px_var(--shadow-md)] hover:before:opacity-100">
                    {#if isEditable}
                        <div class="p-5 pb-2">
                            <div class="flex flex-col gap-4">
                                <div class="flex flex-col gap-1">
                                    <label
                                        class="text-text-secondary text-sm font-semibold"
                                        for={"skill-name-" + skill.id}>
                                        Name
                                    </label>
                                    <input
                                        class="border-input-border bg-input-bg text-input-text focus:border-input-border-focus w-full rounded border p-2 focus:outline-none"
                                        type="text"
                                        id={"skill-name-" + skill.id}
                                        value={skill.name}
                                        on:input={(e) =>
                                            updateSkillName(
                                                skill.id,
                                                (e.currentTarget as HTMLInputElement).value
                                            )}
                                        placeholder="Skill Name" />
                                </div>

                                <div class="flex flex-col gap-1">
                                    <label
                                        class="text-text-secondary text-sm font-semibold"
                                        for={"skill-ability-" + skill.id}>
                                        Ability
                                    </label>
                                    <select
                                        class="border-input-border bg-input-bg text-input-text focus:border-input-border-focus w-full rounded border p-2 focus:outline-none"
                                        id={"skill-ability-" + skill.id}
                                        value={skill.abilityId}
                                        on:change={(e) =>
                                            updateSkillAbility(
                                                skill.id,
                                                (e.currentTarget as HTMLSelectElement).value
                                            )}>
                                        {#each editedCharacter.abilities as ability}
                                            <option value={ability.id}>{ability.name}</option>
                                        {/each}
                                    </select>
                                </div>

                                <div class="grid grid-cols-[1fr_auto] items-end gap-3">
                                    <div class="flex flex-col gap-1">
                                        <label
                                            class="text-text-secondary text-sm font-semibold"
                                            for={"skill-bonus-" + skill.id}>
                                            Bonus
                                        </label>
                                        <input
                                            class="border-input-border bg-input-bg text-input-text focus:border-input-border-focus w-full rounded border p-2 focus:outline-none"
                                            type="number"
                                            id={"skill-bonus-" + skill.id}
                                            value={skill.bonus}
                                            on:input={(e) =>
                                                updateSkillBonus(
                                                    skill.id,
                                                    Number(
                                                        (e.currentTarget as HTMLInputElement).value
                                                    )
                                                )} />
                                    </div>

                                    <div class="flex min-h-10 items-center justify-center">
                                        <label
                                            class="text-text-secondary hover:text-text-primary flex cursor-pointer items-center gap-2 text-sm font-medium transition-colors duration-200">
                                            <input
                                                class="accent-accent-primary m-0 w-auto scale-110 cursor-pointer"
                                                type="checkbox"
                                                checked={skill.proficient}
                                                on:change={(e) =>
                                                    updateSkillProficient(
                                                        skill.id,
                                                        (e.currentTarget as HTMLInputElement)
                                                            .checked
                                                    )} />
                                            <span>Prof.</span>
                                        </label>
                                    </div>
                                </div>

                                <button
                                    class="border-border-primary bg-accent-danger hover:bg-accent-danger-hover active:bg-accent-danger-active mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border px-2 py-1 text-center text-sm font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
                                    on:click={() => removeSkill(skill.id)}>
                                    <svg
                                        class="h-4 w-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2">
                                        <path
                                            d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                    Remove
                                </button>
                            </div>
                        </div>
                    {:else}
                        <div class="flex h-full flex-col justify-between">
                            <div class="flex items-start justify-between p-5 pb-4">
                                <div class="flex flex-col gap-0.5">
                                    <h4
                                        class="text-text-primary m-0 text-lg font-bold tracking-tight">
                                        {skill.name}
                                    </h4>
                                    <p
                                        class="text-text-tertiary m-0 text-xs font-bold tracking-wider uppercase">
                                        {getAbilityName(skill.abilityId)}
                                    </p>
                                </div>
                                <div class="flex flex-col items-end gap-1">
                                    <span
                                        class="text-text-secondary from-bg-tertiary to-bg-secondary border-border-secondary min-w-12 rounded-lg border bg-linear-to-br px-2 py-1 text-center text-xl font-bold tracking-tight shadow-[0_1px_2px_var(--shadow-sm)]">
                                        {skill.bonus >= 0 ? "+" : ""}{skill.bonus}
                                    </span>
                                    {#if skill.proficient}
                                        <span
                                            class="text-text-inverse from-accent-primary to-accent-info rounded-sm bg-linear-to-r px-1.5 py-0.5 text-[0.65rem] font-bold tracking-wider uppercase">
                                            PRO
                                        </span>
                                    {/if}
                                </div>
                            </div>

                            {#if editedCharacter.skillCheckDice}
                                <div
                                    class="border-border-primary bg-bg-secondary/30 divide-border-primary mt-auto flex w-full divide-x border-t">
                                    {#if editedCharacter.skillCheckDice === "1d20"}
                                        <button
                                            class="text-text-secondary hover:text-accent-primary hover:bg-accent-primary/5 active:bg-accent-primary/10 flex w-12 flex-none cursor-pointer items-center justify-center py-3 transition-colors duration-200"
                                            on:click={() => rollSkill(skill, "Maximum")}
                                            title="Roll with advantage">
                                            <ResultOptionIcon option="Maximum" size="1.25em" />
                                        </button>
                                    {/if}
                                    <button
                                        class="text-text-primary hover:text-accent-primary hover:bg-accent-primary/5 active:bg-accent-primary/10 flex flex-1 cursor-pointer items-center justify-center gap-2 py-3 text-sm font-bold tracking-wide uppercase transition-colors duration-200"
                                        on:click={() => rollSkill(skill, "Sum")}
                                        title={"Roll " + skill.name + " check"}>
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
                                        Roll
                                    </button>
                                    {#if editedCharacter.skillCheckDice === "1d20"}
                                        <button
                                            class="text-text-secondary hover:text-accent-primary hover:bg-accent-primary/5 active:bg-accent-primary/10 flex w-12 flex-none cursor-pointer items-center justify-center py-3 transition-colors duration-200"
                                            on:click={() => rollSkill(skill, "Minimum")}
                                            title="Roll with disadvantage">
                                            <ResultOptionIcon option="Minimum" size="1.25em" />
                                        </button>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {:else}
        <p class="px-4 py-8 text-center text-base">No skills added yet.</p>
    {/if}
    <TemplateModal
        bind:show={showAbilityTemplateModal}
        title="Choose Ability Template"
        description="Quickly add a set of abilities based on popular RPG systems."
        templates={abilityTemplateOptions}
        onSelect={(key) => applyAbilityTemplate(key)} />

    <TemplateModal
        bind:show={showSkillTemplateModal}
        title="Choose Skill Template"
        description="Quickly add a set of skills based on popular RPG systems."
        templates={skillTemplateOptions}
        onSelect={(key) => applySkillTemplate(key)} />
</div>
