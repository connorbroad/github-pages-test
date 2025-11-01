<script lang="ts">
    import type { Character, Ability, Skill } from "../../../data/storage-utils";
    import { createEventDispatcher } from "svelte";
    import ResultOptionIcon from "../../../oracle/components/dice-roller/components/ResultOptionIcon.svelte";
    import TemplateModal from "../../../shared/modal/TemplateModal.svelte";

    export let editedCharacter: Character;
    export let isEditable: boolean;

    const dispatch = createEventDispatcher();

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

    function openTemplateModal() { showAbilityTemplateModal = true; }

    function applyAbilityTemplate(templateKey: "dnd5e" | "daggerheart") {
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

    function applySkillTemplate(templateKey: "dnd5e" | "pathfinder2e") {
        const template = skillTemplates[templateKey];
        const baseTimestamp = Date.now();
        const newSkills: Skill[] = template
            .map((skillData, index) => {
                const ability = editedCharacter.abilities.find(
                    (a) => a.name.toLowerCase() === skillData.ability.toLowerCase(),
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
                .filter((sd) => !editedCharacter.abilities.find((a) => a.name.toLowerCase() === sd.ability.toLowerCase()))
                .map((s) => s.ability);
            alert(`Some skills could not be added because the following abilities are missing: ${[...new Set(missingAbilities)].join(", ")}`);
        }
        editedCharacter.skills = [...editedCharacter.skills, ...newSkills];
        showSkillTemplateModal = false;
    }

    function updateAbilityName(id: string, name: string) {
        editedCharacter.abilities = editedCharacter.abilities.map((a) => (a.id === id ? { ...a, name } : a));
    }
    function updateAbilityScore(id: string, score: number) {
        editedCharacter.abilities = editedCharacter.abilities.map((a) => (a.id === id ? { ...a, score } : a));
    }
    function updateAbilityModifier(id: string, modifier: number) {
        editedCharacter.abilities = editedCharacter.abilities.map((a) => (a.id === id ? { ...a, modifier } : a));
    }
    function updateAbilityProficient(id: string, proficient: boolean) {
        editedCharacter.abilities = editedCharacter.abilities.map((a) => (a.id === id ? { ...a, proficient } : a));
    }
    function removeAbility(id: string) {
        editedCharacter.abilities = editedCharacter.abilities.filter((a) => a.id !== id);
        editedCharacter.skills = editedCharacter.skills.filter((s) => s.abilityId !== id);
    }

    function updateSkillName(id: string, name: string) {
        editedCharacter.skills = editedCharacter.skills.map((s) => (s.id === id ? { ...s, name } : s));
    }
    function updateSkillAbility(id: string, abilityId: string) {
        editedCharacter.skills = editedCharacter.skills.map((s) => (s.id === id ? { ...s, abilityId } : s));
    }
    function updateSkillProficient(id: string, proficient: boolean) {
        editedCharacter.skills = editedCharacter.skills.map((s) => (s.id === id ? { ...s, proficient } : s));
    }
    function updateSkillBonus(id: string, bonus: number) {
        editedCharacter.skills = editedCharacter.skills.map((s) => (s.id === id ? { ...s, bonus } : s));
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

    function rollAbility(ability: Ability, resultOption: "Sum" | "Maximum" | "Minimum") {
        const diceFormula = editedCharacter.abilityCheckDice || "1d20";
        const adjusted = adjustDiceRollForAdvantageOrDisadvantage(diceFormula, resultOption);
        dispatch("rollCheck", { checkName: ability.name, diceFormula: adjusted, modifier: ability.modifier, resultOption });
    }
    function rollSkill(skill: Skill, resultOption: "Sum" | "Maximum" | "Minimum") {
        const diceFormula = editedCharacter.skillCheckDice || "1d20";
        const adjusted = adjustDiceRollForAdvantageOrDisadvantage(diceFormula, resultOption);
        dispatch("rollCheck", { checkName: skill.name, diceFormula: adjusted, modifier: skill.bonus, resultOption });
    }
</script>

{#if isEditable}
    <div class="section-actions">
        <button class="srpg-b srpg-b-sm srpg-b-create" on:click={addAbility}>
            <svg class="srpg-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14" />
            </svg>
            Add Ability
        </button>
        <button class="srpg-b srpg-b-normal srpg-b-sm" on:click={openTemplateModal}>
            <svg class="srpg-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Use Template
        </button>
    </div>
{/if}

{#if isEditable}
    <div class="dice-formula-input">
        <label for="abilityCheckDice">Ability Check Dice Formula</label>
        <input type="text" id="abilityCheckDice" bind:value={editedCharacter.abilityCheckDice} placeholder="e.g., 1d20" />
        <p class="input-help">This dice formula will be used for all ability checks</p>
    </div>
{/if}

{#if editedCharacter.abilities.length > 0}
    <div class="abilities-grid">
        {#each editedCharacter.abilities as ability}
            <div class="ability-card">
                {#if isEditable}
                    <div class="ability-edit-form">
                        <div class="srpg-form-field">
                            <label for={"ability-name-" + ability.id}>Name</label>
                            <input
                                type="text"
                                id={"ability-name-" + ability.id}
                                value={ability.name}
                                on:input={(e) => updateAbilityName(ability.id, (e.currentTarget as HTMLInputElement).value)}
                                placeholder="Ability Name"
                            />
                        </div>

                        <div class="ability-stats-grid">
                            <div class="srpg-form-field">
                                <label for={"ability-score-" + ability.id}>Score</label>
                                <input
                                    type="number"
                                    id={"ability-score-" + ability.id}
                                    value={ability.score}
                                    on:input={(e) => updateAbilityScore(ability.id, Number((e.currentTarget as HTMLInputElement).value))}
                                    min="1"
                                    max="30"
                                />
                            </div>

                            <div class="srpg-form-field">
                                <label for={"ability-modifier-" + ability.id}>Modifier</label>
                                <input
                                    type="number"
                                    id={"ability-modifier-" + ability.id}
                                    value={ability.modifier}
                                    on:input={(e) => updateAbilityModifier(ability.id, Number((e.currentTarget as HTMLInputElement).value))}
                                />
                            </div>
                        </div>

                        <div class="ability-proficiency">
                            <label class="proficiency-checkbox">
                                <input
                                    type="checkbox"
                                    checked={ability.proficient}
                                    on:change={(e) => updateAbilityProficient(ability.id, (e.currentTarget as HTMLInputElement).checked)}
                                />
                                <span>Proficient</span>
                            </label>
                        </div>

                        <button class="srpg-b srpg-b-danger srpg-b-sm remove-btn" on:click={() => removeAbility(ability.id)}>
                            <svg class="srpg-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            Remove
                        </button>
                    </div>
                {:else}
                    <h3>{ability.name}</h3>
                    <div class="ability-stats">
                        <p><strong>Score:</strong> {ability.score}</p>
                        <p><strong>Modifier:</strong> {ability.modifier >= 0 ? "+" : ""}{ability.modifier}</p>
                        {#if ability.proficient}
                            <span class="srpg-badge">Proficient</span>
                        {/if}
                    </div>
                    {#if editedCharacter.abilityCheckDice}
                        <div class="roll-buttons">
                            {#if editedCharacter.abilityCheckDice.startsWith("1d")}
                                <button class="srpg-b srpg-b-sm srpg-b-simple roll-btn-adv" on:click={() => rollAbility(ability, "Maximum")} title="Roll with advantage">
                                    <span class="result-icon"><ResultOptionIcon option="Maximum" size="1.5em" /></span>
                                </button>
                            {/if}
                            <button class="srpg-b srpg-b-sm srpg-b-normal roll-btn" on:click={() => rollAbility(ability, "Sum")} title={"Roll " + ability.name + " check"}>
                                <svg class="srpg-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="4" y="4" width="16" height="16" rx="3"/>
                                    <circle cx="9" cy="9" r="1.5" fill="currentColor"/>
                                    <circle cx="15" cy="15" r="1.5" fill="currentColor"/>
                                </svg>
                                Roll
                            </button>
                            {#if editedCharacter.abilityCheckDice.startsWith("1d")}
                                <button class="srpg-b srpg-b-sm srpg-b-simple roll-btn-dis" on:click={() => rollAbility(ability, "Minimum")} title="Roll with disadvantage">
                                    <span class="result-icon"><ResultOptionIcon option="Minimum" size="1.5em" /></span>
                                </button>
                            {/if}
                        </div>
                    {/if}
                {/if}
            </div>
        {/each}
    </div>
{:else}
    <p class="srpg-empty-message">No abilities added yet.</p>
{/if}

<!-- Skills Subsection -->
<div class="skills-subsection">
    <div class="subsection-header">
        <h3>Skills</h3>
    </div>

    {#if isEditable}
        <div class="section-actions">
            <button class="srpg-b srpg-b-sm srpg-b-create" on:click={addSkill}>
                <svg class="srpg-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 5v14M5 12h14" />
                </svg>
                Add Skill
            </button>
            <button class="srpg-b srpg-b-normal srpg-b-sm" on:click={openSkillTemplateModal}>
                <svg class="srpg-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Use Template
            </button>
        </div>
    {/if}

    {#if isEditable}
        <div class="dice-formula-input">
            <label for="skillCheckDice">Skill Check Dice Formula</label>
            <input type="text" id="skillCheckDice" bind:value={editedCharacter.skillCheckDice} placeholder="e.g., 1d20" />
            <p class="input-help">This dice formula will be used for all skill checks</p>
        </div>
    {/if}

    {#if editedCharacter.skills.length > 0}
        <div class="skills-grid">
            {#each editedCharacter.skills as skill}
                <div class="skill-card">
                    {#if isEditable}
                        <div class="skill-edit-form">
                            <div class="srpg-form-field">
                                <label for={"skill-name-" + skill.id}>Name</label>
                                <input
                                    type="text"
                                    id={"skill-name-" + skill.id}
                                    value={skill.name}
                                    on:input={(e) => updateSkillName(skill.id, (e.currentTarget as HTMLInputElement).value)}
                                    placeholder="Skill Name"
                                />
                            </div>

                            <div class="srpg-form-field">
                                <label for={"skill-ability-" + skill.id}>Ability</label>
                                <select
                                    id={"skill-ability-" + skill.id}
                                    value={skill.abilityId}
                                    on:change={(e) => updateSkillAbility(skill.id, (e.currentTarget as HTMLSelectElement).value)}
                                >
                                    {#each editedCharacter.abilities as ability}
                                        <option value={ability.id}>{ability.name}</option>
                                    {/each}
                                </select>
                            </div>

                            <div class="skill-stats-grid">
                                <div class="srpg-form-field">
                                    <label for={"skill-bonus-" + skill.id}>Bonus</label>
                                    <input
                                        type="number"
                                        id={"skill-bonus-" + skill.id}
                                        value={skill.bonus}
                                        on:input={(e) => updateSkillBonus(skill.id, Number((e.currentTarget as HTMLInputElement).value))}
                                    />
                                </div>

                                <div class="skill-proficiency">
                                    <label class="proficiency-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={skill.proficient}
                                            on:change={(e) => updateSkillProficient(skill.id, (e.currentTarget as HTMLInputElement).checked)}
                                        />
                                        <span>Prof.</span>
                                    </label>
                                </div>
                            </div>

                            <button class="srpg-b srpg-b-danger srpg-b-sm remove-btn" on:click={() => removeSkill(skill.id)}>
                                <svg class="srpg-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                Remove
                            </button>
                        </div>
                    {:else}
                        <div class="skill-display">
                            <h4 class="skill-name">{skill.name}</h4>
                            <p class="skill-ability">({getAbilityName(skill.abilityId)})</p>
                            <div class="skill-stats">
                                <span class="skill-bonus">{skill.bonus >= 0 ? "+" : ""}{skill.bonus}</span>
                                {#if skill.proficient}
                                    <span class="srpg-badge srpg-badge-sm">Prof</span>
                                {/if}
                            </div>
                            {#if editedCharacter.skillCheckDice}
                                <div class="roll-buttons">
                                    {#if editedCharacter.skillCheckDice === "1d20"}
                                        <button class="srpg-b srpg-b-sm srpg-b-simple roll-btn-adv" on:click={() => rollSkill(skill, "Maximum")} title="Roll with advantage">
                                            <span class="result-icon"><ResultOptionIcon option="Maximum" size="1.5em" /></span>
                                        </button>
                                    {/if}
                                    <button class="srpg-b srpg-b-sm srpg-b-normal roll-btn" on:click={() => rollSkill(skill, "Sum")} title={"Roll " + skill.name + " check"}>
                                        <svg class="srpg-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <rect x="4" y="4" width="16" height="16" rx="3"/>
                                            <circle cx="9" cy="9" r="1.5" fill="currentColor"/>
                                            <circle cx="15" cy="15" r="1.5" fill="currentColor"/>
                                        </svg>
                                        Roll
                                    </button>
                                    {#if editedCharacter.skillCheckDice === "1d20"}
                                        <button class="srpg-b srpg-b-sm srpg-b-simple roll-btn-dis" on:click={() => rollSkill(skill, "Minimum")} title="Roll with disadvantage">
                                            <span class="result-icon"><ResultOptionIcon option="Minimum" size="1.5em" /></span>
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
        <p class="srpg-empty-message">No skills added yet.</p>
    {/if}
    <TemplateModal
        bind:show={showAbilityTemplateModal}
        title="Choose Ability Template"
        description="Quickly add a set of abilities based on popular RPG systems."
        templates={abilityTemplateOptions}
        on:select={(e) => applyAbilityTemplate(e.detail)}
    />

    <TemplateModal
        bind:show={showSkillTemplateModal}
        title="Choose Skill Template"
        description="Quickly add a set of skills based on popular RPG systems."
        templates={skillTemplateOptions}
        on:select={(e) => applySkillTemplate(e.detail)}
    />
</div>

<style>
    /* Skills Subsection */
    .skills-subsection {
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 2px solid var(--divider);
    }

    .subsection-header {
        margin-bottom: 1rem;
    }

    .subsection-header h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    @media (min-width: 768px) {
        .subsection-header h3 { font-size: 1.5rem; }
    }

    /* Section Actions */
    .section-actions {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
    }

    .section-actions button {
        display: flex;
        align-items: center;
        gap: 0.375rem;
    }

    /* Grids */
    .abilities-grid, .skills-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.25rem;
        margin-top: 1rem;
    }

    @media (min-width: 640px) {
        .abilities-grid, .skills-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (min-width: 1024px) {
        .abilities-grid { grid-template-columns: repeat(3, 1fr); }
        .skills-grid { grid-template-columns: repeat(3, 1fr); }
    }

    /* Cards */
    .ability-card, .skill-card {
        background: linear-gradient(135deg, var(--card-bg) 0%, var(--bg-secondary) 100%);
        border: 1px solid var(--border-primary);
        border-radius: 12px;
        padding: 1.25rem;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 1px 3px var(--shadow-sm);
        position: relative;
        overflow: hidden;
    }

    .ability-card::before, .skill-card::before {
        content: "";
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 3px;
        background: linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-info) 50%, var(--accent-info-hover) 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .ability-card:hover, .skill-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px var(--shadow-md);
        border-color: var(--border-secondary);
    }

    .ability-card:hover::before, .skill-card:hover::before { opacity: 1; }

    .ability-card h3, .skill-name {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-primary);
        text-align: center;
        letter-spacing: -0.025em;
    }

    @media (min-width: 768px) {
        .ability-card h3, .skill-name { font-size: 1.1875rem; }
    }

    .ability-edit-form, .skill-edit-form { display: flex; flex-direction: column; gap: 1rem; }

    .ability-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

    .skill-stats-grid { display: grid; grid-template-columns: 1fr auto; gap: 0.75rem; align-items: end; }

    .ability-proficiency, .skill-proficiency { display: flex; align-items: center; justify-content: center; min-height: 2.5rem; }

    .proficiency-checkbox { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); transition: color 0.2s ease; }
    .proficiency-checkbox:hover { color: var(--text-primary); }
    .proficiency-checkbox input[type="checkbox"] { width: auto; margin: 0; cursor: pointer; transform: scale(1.1); accent-color: var(--accent-primary); }

    .remove-btn { margin-top: 0.75rem; width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.375rem; font-size: 0.875rem; }

    .ability-stats { display: flex; flex-direction: column; gap: 0.5rem; text-align: center; }
    .ability-stats p { margin: 0; font-size: 0.9375rem; padding: 0.375rem 0; min-height: auto; color: var(--text-secondary); }

    .skill-display { text-align: center; display: flex; flex-direction: column; gap: 0.625rem; }
    .skill-ability { margin: 0; font-size: 0.8125rem; color: var(--text-muted); font-weight: 500; letter-spacing: 0.025em; }

    .skill-stats { display: flex; align-items: center; justify-content: center; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.25rem; }

    .skill-bonus {
        font-size: 1.25rem; font-weight: 700; color: var(--text-secondary);
        background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
        padding: 0.375rem 0.75rem; border-radius: 8px; min-width: 3rem; text-align: center;
        border: 1px solid var(--border-secondary); box-shadow: 0 1px 2px var(--shadow-sm);
        letter-spacing: -0.025em;
    }

    .srpg-badge { background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-info) 100%); color: var(--text-inverse); font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.5rem; border-radius: 6px; letter-spacing: 0.025em; box-shadow: 0 1px 2px rgba(59, 130, 246, 0.2); }
    .srpg-badge-sm { font-size: 0.6875rem; padding: 0.1875rem 0.375rem; border-radius: 4px; }

    .roll-buttons { display: flex; gap: 0.375rem; margin-top: 0.75rem; justify-content: center; flex-wrap: wrap; }
    .roll-btn { flex: 1; min-width: fit-content; display: flex; align-items: center; justify-content: center; gap: 0.25rem; }
    .roll-btn-adv, .roll-btn-dis { flex: 0 0 auto; min-width: 3rem; }
    .roll-btn:hover { transform: translateY(-1px); }

    .dice-formula-input { margin: 1rem 0; padding: 1rem; background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 8px; }
    .dice-formula-input label { display: block; font-size: 0.875rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem; }
    .dice-formula-input input { width: 100%; padding: 0.5rem; font-size: 0.9375rem; border: 1px solid var(--border-secondary); border-radius: 6px; background: var(--bg-primary); color: var(--text-primary); }
    .dice-formula-input input:focus { outline: none; border-color: var(--accent-primary); box-shadow: 0 0 0 2px var(--focus-ring); }
    .input-help { margin: 0.5rem 0 0 0; font-size: 0.8125rem; color: var(--text-muted); font-style: italic; }
</style>
