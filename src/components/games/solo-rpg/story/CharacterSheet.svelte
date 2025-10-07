<script lang="ts">
    import type { Character, Ability, Skill } from "../storage-utils";
    import { createEventDispatcher } from "svelte";
    import TemplateModal from "../shared/modal/TemplateModal.svelte";

    export let character: Character;
    export let isEditing: boolean = false;

    const dispatch = createEventDispatcher();

    let editedCharacter: Character = structuredClone(character);
    let showAbilityTemplateModal: boolean = false;
    let showSkillTemplateModal: boolean = false;

    interface TemplateOption {
        key: string;
        title: string;
        description: string;
        note?: string;
    }

    const alignmentOptions = [
        "Lawful Good",
        "Neutral Good",
        "Chaotic Good",
        "Lawful Neutral",
        "True Neutral",
        "Chaotic Neutral",
        "Lawful Evil",
        "Neutral Evil",
        "Chaotic Evil",
    ];

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
    };

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
    };

    const abilityTemplateOptions: TemplateOption[] = [
        {
            key: "dnd5e",
            title: "D&D 5e",
            description:
                "Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma",
            note: "Default score: 10",
        },
        {
            key: "daggerheart",
            title: "Daggerheart",
            description:
                "Agility, Strength, Finesse, Instinct, Presence, Knowledge",
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

        editedCharacter.abilities = [
            ...editedCharacter.abilities,
            ...newAbilities,
        ];
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
                // Find the ability by name
                const ability = editedCharacter.abilities.find(
                    (a) =>
                        a.name.toLowerCase() ===
                        skillData.ability.toLowerCase(),
                );

                // Skip if ability not found
                if (!ability) {
                    return null;
                }

                return {
                    id: `skill-${baseTimestamp + index}`,
                    name: skillData.name,
                    abilityId: ability.id,
                    proficient: false,
                    bonus: 0,
                };
            })
            .filter((skill): skill is Skill => skill !== null);

        if (newSkills.length < template.length) {
            const missingAbilities = template
                .filter((skillData) => {
                    return !editedCharacter.abilities.find(
                        (a) =>
                            a.name.toLowerCase() ===
                            skillData.ability.toLowerCase(),
                    );
                })
                .map((s) => s.ability);

            alert(
                `Some skills could not be added because the following abilities are missing: ${[...new Set(missingAbilities)].join(", ")}`,
            );
        }

        editedCharacter.skills = [...editedCharacter.skills, ...newSkills];
        showSkillTemplateModal = false;
    }

    function removeAbility(abilityId: string) {
        editedCharacter.abilities = editedCharacter.abilities.filter(
            (a) => a.id !== abilityId,
        );
        // Also remove associated skills
        editedCharacter.skills = editedCharacter.skills.filter(
            (s) => s.abilityId !== abilityId,
        );
    }

    function updateAbilityScore(abilityId: string, score: number) {
        editedCharacter.abilities = editedCharacter.abilities.map((ability) => {
            if (ability.id === abilityId) {
                return {
                    ...ability,
                    score: score,
                };
            }
            return ability;
        });
    }

    function updateAbilityName(abilityId: string, name: string) {
        editedCharacter.abilities = editedCharacter.abilities.map((ability) => {
            if (ability.id === abilityId) {
                return { ...ability, name };
            }
            return ability;
        });
    }

    function updateAbilityModifier(abilityId: string, modifier: number) {
        editedCharacter.abilities = editedCharacter.abilities.map((ability) => {
            if (ability.id === abilityId) {
                return { ...ability, modifier };
            }
            return ability;
        });
    }

    function updateAbilityProficient(abilityId: string, proficient: boolean) {
        editedCharacter.abilities = editedCharacter.abilities.map((ability) => {
            if (ability.id === abilityId) {
                return { ...ability, proficient };
            }
            return ability;
        });
    }

    function updateSkillName(skillId: string, name: string) {
        editedCharacter.skills = editedCharacter.skills.map((skill) => {
            if (skill.id === skillId) {
                return { ...skill, name };
            }
            return skill;
        });
    }

    function updateSkillAbility(skillId: string, abilityId: string) {
        editedCharacter.skills = editedCharacter.skills.map((skill) => {
            if (skill.id === skillId) {
                return { ...skill, abilityId };
            }
            return skill;
        });
    }

    function updateSkillProficient(skillId: string, proficient: boolean) {
        editedCharacter.skills = editedCharacter.skills.map((skill) => {
            if (skill.id === skillId) {
                return { ...skill, proficient };
            }
            return skill;
        });
    }

    function updateSkillBonus(skillId: string, bonus: number) {
        editedCharacter.skills = editedCharacter.skills.map((skill) => {
            if (skill.id === skillId) {
                return { ...skill, bonus };
            }
            return skill;
        });
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

    function removeSkill(skillId: string) {
        editedCharacter.skills = editedCharacter.skills.filter(
            (s) => s.id !== skillId,
        );
    }

    function saveChanges() {
        editedCharacter.updatedAt = Date.now();
        dispatch("save", editedCharacter);
    }

    function cancelEdit() {
        editedCharacter = structuredClone(character);
        dispatch("cancel");
    }

    function getAbilityName(abilityId: string): string {
        const ability = editedCharacter.abilities.find(
            (a) => a.id === abilityId,
        );
        return ability ? ability.name : "Unknown";
    }
</script>

{#if isEditing}
    <div class="edit-actions">
        <button class="srpg-b" on:click={cancelEdit}>
            Cancel
        </button>
        <button class="srpg-b srpg-b-normal" on:click={saveChanges}>
            Save Changes
        </button>
    </div>
{/if}
<div class="character-sheet">
    <!-- Core Info Section -->
    <section class="section">
        <h2>Information</h2>
        <div class="form-grid">
            <div class="form-field">
                <label for="name">Character Name</label>
                {#if isEditing}
                    <input
                        type="text"
                        id="name"
                        bind:value={editedCharacter.name}
                        required
                    />
                {:else}
                    <p>{character.name}</p>
                {/if}
            </div>

            <div class="form-field">
                <label for="race">Race</label>
                {#if isEditing}
                    <input
                        type="text"
                        id="race"
                        bind:value={editedCharacter.race}
                    />
                {:else}
                    <p>{character.race || "—"}</p>
                {/if}
            </div>

            <div class="form-field">
                <label for="alignment">Alignment</label>
                {#if isEditing}
                    <select
                        id="alignment"
                        bind:value={editedCharacter.alignment}
                    >
                        <option value="">Select Alignment</option>
                        {#each alignmentOptions as alignment}
                            <option value={alignment}>{alignment}</option>
                        {/each}
                    </select>
                {:else}
                    <p>{character.alignment || "—"}</p>
                {/if}
            </div>

            <div class="form-field">
                <label for="background">Background</label>
                {#if isEditing}
                    <input
                        type="text"
                        id="background"
                        bind:value={editedCharacter.background}
                    />
                {:else}
                    <p>{character.background || "—"}</p>
                {/if}
            </div>
        </div>
    </section>

    <!-- Experience Section -->
    <section class="section">
        <h2>Experience</h2>
        <div class="form-grid">
            <div class="form-field">
                <label for="class">Class</label>
                {#if isEditing}
                    <input
                        type="text"
                        id="class"
                        bind:value={editedCharacter.class}
                    />
                {:else}
                    <p>{character.class || "—"}</p>
                {/if}
            </div>

            <div class="form-field">
                <label for="level">Level</label>
                {#if isEditing}
                    <input
                        type="number"
                        id="level"
                        bind:value={editedCharacter.level}
                        min="1"
                    />
                {:else}
                    <p>{character.level || "—"}</p>
                {/if}
            </div>

            <div class="form-field">
                <label for="xp">Experience Points</label>
                {#if isEditing}
                    <input
                        type="number"
                        id="xp"
                        bind:value={editedCharacter.experiencePoints}
                        min="0"
                    />
                {:else}
                    <p>{character.experiencePoints || "—"}</p>
                {/if}
            </div>

            <div class="form-field">
                <label for="proficiencyBonus">Proficiency Bonus</label>
                {#if isEditing}
                    <input
                        type="number"
                        id="proficiencyBonus"
                        bind:value={editedCharacter.proficiencyBonus}
                    />
                {:else}
                    <p>{character.proficiencyBonus !== undefined ? (character.proficiencyBonus >= 0 ? `+${character.proficiencyBonus}` : character.proficiencyBonus) : "—"}</p>
                {/if}
            </div>
        </div>
    </section>

    <!-- Health Section -->
    <section class="section">
        <h2>Health</h2>
        <div class="form-grid">


            <div class="form-field">
                <label for="hpMax">Hit Point Maximum</label>
                {#if isEditing}
                    <input
                        type="number"
                        id="hpMax"
                        bind:value={editedCharacter.hitPointMaximum}
                    />
                {:else}
                    <p>{character.hitPointMaximum || "—"}</p>
                {/if}
            </div>

            <div class="form-field">
                <label for="hitDice">Hit Dice</label>
                {#if isEditing}
                    <input
                        type="text"
                        id="hitDice"
                        bind:value={editedCharacter.hitDice}
                        placeholder="e.g., 3d8"
                    />
                {:else}
                    <p>{character.hitDice || "—"}</p>
                {/if}
            </div>

            <div class="form-field">
                <label for="hpCurrent">Current Hit Points</label>
                {#if isEditing}
                    <input
                        type="number"
                        id="hpCurrent"
                        bind:value={editedCharacter.currentHitPoints}
                    />
                {:else}
                    <p>
                        {character.currentHitPoints !== undefined
                            ? character.currentHitPoints
                            : "—"}
                    </p>
                {/if}
            </div>

            <div class="form-field">
                <label for="hpTemp">Temporary Hit Points</label>
                {#if isEditing}
                    <input
                        type="number"
                        id="hpTemp"
                        bind:value={editedCharacter.temporaryHitPoints}
                    />
                {:else}
                    <p>{character.temporaryHitPoints || "—"}</p>
                {/if}
            </div>

            <div class="form-field">
                <label for="deathSaveSuccesses">Death Save Successes</label>
                {#if isEditing}
                    <input
                        type="number"
                        id="deathSaveSuccesses"
                        bind:value={editedCharacter.deathSaveSuccesses}
                        min="0"
                        max="3"
                    />
                {:else}
                    <p>{character.deathSaveSuccesses || 0} / 3</p>
                {/if}
            </div>

            <div class="form-field">
                <label for="deathSaveFailures">Death Save Failures</label>
                {#if isEditing}
                    <input
                        type="number"
                        id="deathSaveFailures"
                        bind:value={editedCharacter.deathSaveFailures}
                        min="0"
                        max="3"
                    />
                {:else}
                    <p>{character.deathSaveFailures || 0} / 3</p>
                {/if}
            </div>
        </div>
    </section>

    <!-- Abilities Section -->
    <section class="section">
        <h2>Abilities</h2>
        {#if isEditing}
            <div class="section-actions">
                <button class="srpg-b srpg-b-sm" on:click={addAbility}>
                    + Add Ability
                </button>
                <button
                    class="srpg-b srpg-b-normal srpg-b-sm"
                    on:click={openTemplateModal}>
                    📋 Use Template
                </button>
            </div>
        {/if}

        {#if editedCharacter.abilities.length > 0}
            <div class="abilities-grid">
                {#each editedCharacter.abilities as ability}
                    <div class="ability-card">
                        {#if isEditing}
                            <input
                                type="text"
                                value={ability.name}
                                on:input={(e) =>
                                    updateAbilityName(
                                        ability.id,
                                        e.currentTarget.value,
                                    )}
                                placeholder="Ability Name"
                                class="ability-name-input"
                            />
                            <div class="ability-stats">
                                <label
                                    >Score: <input
                                        type="number"
                                        value={ability.score}
                                        on:input={(e) =>
                                            updateAbilityScore(
                                                ability.id,
                                                Number(e.currentTarget.value),
                                            )}
                                        min="1"
                                        max="30"
                                    /></label
                                >
                                <label
                                    >Modifier: <input
                                        type="number"
                                        value={ability.modifier}
                                        on:input={(e) =>
                                            updateAbilityModifier(
                                                ability.id,
                                                Number(e.currentTarget.value),
                                            )}
                                    /></label
                                >
                                <label class="proficiency-label">
                                    <input
                                        type="checkbox"
                                        checked={ability.proficient}
                                        on:change={(e) =>
                                            updateAbilityProficient(
                                                ability.id,
                                                e.currentTarget.checked,
                                            )}
                                    />
                                    Proficient
                                </label>
                            </div>
                            <button
                                class="srpg-b srpg-b-danger srpg-b-sm abilities-remove-btn"
                                on:click={() => removeAbility(ability.id)}>
                                Remove
                            </button>
                        {:else}
                            <h3>{ability.name}</h3>
                            <div class="ability-stats">
                                <p><strong>Score:</strong> {ability.score}</p>
                                <p>
                                    <strong>Modifier:</strong>
                                    {ability.modifier >= 0
                                        ? "+"
                                        : ""}{ability.modifier}
                                </p>
                                {#if ability.proficient}
                                    <span class="badge ability-proficient-badge"
                                        >Proficient</span
                                    >
                                {/if}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        {:else}
            <p class="empty-message">No abilities added yet.</p>
        {/if}
    </section>

    <!-- Skills Section -->
    <section class="section">
        <h2>Skills</h2>
        {#if isEditing}
            <div class="section-actions">
                <button class="srpg-b srpg-b-sm" on:click={addSkill}>
                    + Add Skill
                </button>
                <button
                    class="srpg-b srpg-b-normal srpg-b-sm"
                    on:click={openSkillTemplateModal}>
                    📋 Use Template
                </button>
            </div>
        {/if}

        {#if editedCharacter.skills.length > 0}
            <div class="skills-list">
                {#each editedCharacter.skills as skill}
                    <div class="skill-item">
                        {#if isEditing}
                            <input
                                type="text"
                                value={skill.name}
                                on:input={(e) =>
                                    updateSkillName(
                                        skill.id,
                                        e.currentTarget.value,
                                    )}
                                placeholder="Skill Name"
                            />
                            <select
                                value={skill.abilityId}
                                on:change={(e) =>
                                    updateSkillAbility(
                                        skill.id,
                                        e.currentTarget.value,
                                    )}
                            >
                                {#each editedCharacter.abilities as ability}
                                    <option value={ability.id}
                                        >{ability.name}</option
                                    >
                                {/each}
                            </select>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={skill.proficient}
                                    on:change={(e) =>
                                        updateSkillProficient(
                                            skill.id,
                                            e.currentTarget.checked,
                                        )}
                                />
                                Proficient
                            </label>
                            <label
                                >Bonus: <input
                                    type="number"
                                    value={skill.bonus}
                                    on:input={(e) =>
                                        updateSkillBonus(
                                            skill.id,
                                            Number(e.currentTarget.value),
                                        )}
                                />
                            </label>
                            <button
                                class="srpg-b srpg-b-danger srpg-b-sm"
                                on:click={() => removeSkill(skill.id)}>
                                Remove
                            </button>
                        {:else}
                            <div class="skill-info">
                                <strong>{skill.name}</strong>
                                <span>({getAbilityName(skill.abilityId)})</span>
                                {#if skill.proficient}
                                    <span class="badge">
                                        Proficient
                                    </span>
                                {/if}
                                <span>
                                    Bonus: {skill.bonus >= 0
                                        ? "+"
                                        : ""}{skill.bonus}</span
                                >
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        {:else}
            <p class="empty-message">No skills added yet.</p>
        {/if}
    </section>

    <!-- Combat Stats Section -->
    <section class="section">
        <h2>Combat Stats</h2>
        <div class="form-grid">
            <div class="form-field">
                <label for="ac">Armor Class</label>
                {#if isEditing}
                    <input
                        type="number"
                        id="ac"
                        bind:value={editedCharacter.armorClass}
                    />
                {:else}
                    <p>{character.armorClass || "—"}</p>
                {/if}
            </div>

            <div class="form-field">
                <label for="initiative">Initiative</label>
                {#if isEditing}
                    <input
                        type="number"
                        id="initiative"
                        bind:value={editedCharacter.initiative}
                    />
                {:else}
                    <p>
                        {character.initiative
                            ? (character.initiative >= 0 ? "+" : "") +
                              character.initiative
                            : "—"}
                    </p>
                {/if}
            </div>

            <div class="form-field">
                <label for="speed">Speed</label>
                {#if isEditing}
                    <input
                        type="number"
                        id="speed"
                        bind:value={editedCharacter.speed}
                    />
                {:else}
                    <p>{character.speed ? character.speed + " ft." : "—"}</p>
                {/if}
            </div>
        </div>
    </section>
</div>

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

<style>
    .abilities-remove-btn {
        margin-top: 1rem;
        background: #ef4444;
        color: white;
    }

    .character-sheet {
        background: white;
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .edit-actions {
        display: flex;
        flex-direction: row;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
        justify-content: space-between;
    }

    .section {
        margin-bottom: 2rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
    }

    .section:last-child {
        border-bottom: none;
    }

    .section h2 {
        margin-top: 0;
        margin-bottom: 1rem;
        color: #111827;
        font-size: 1.5rem;
    }

    .section-actions {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
    }

    .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
    }

    .form-field label {
        display: block;
        font-weight: 600;
        margin-bottom: 0.25rem;
        color: #374151;
    }

    .form-field input,
    .form-field select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 1rem;
    }

    .form-field p {
        margin: 0;
        padding: 0.5rem 0;
        color: #111827;
    }

    .abilities-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }

    .ability-card {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 1rem;
        text-align: center;
    }

    .ability-card h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.1rem;
        color: #111827;
    }

    .ability-name-input {
        width: 100%;
        padding: 0.5rem;
        margin-bottom: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        text-align: center;
        font-weight: 600;
    }

    .ability-stats {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .ability-stats label {
        font-size: 0.875rem;
    }

    .ability-stats input[type="number"] {
        width: 60px;
        padding: 0.25rem;
        margin-left: 0.25rem;
    }

    .ability-stats p {
        margin: 0;
        font-size: 0.875rem;
    }

    .proficiency-label {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.875rem;
        cursor: pointer;
    }

    .proficiency-label input[type="checkbox"] {
        width: auto;
        margin: 0;
        cursor: pointer;
    }

    .ability-proficient-badge {
        margin-top: 0.5rem;
    }

    .skills-list {
        margin-top: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .skill-item {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 0.75rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
    }

    .skill-item input[type="text"] {
        flex: 1;
        min-width: 150px;
    }

    .skill-item select {
        width: auto;
    }

    .skill-item input[type="number"] {
        width: 60px;
    }

    .skill-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .badge {
        background: #10b981;
        color: white;
        padding: 0.125rem 0.5rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
    }

    .empty-message {
        color: #6b7280;
        font-style: italic;
        margin: 1rem 0;
    }
</style>
