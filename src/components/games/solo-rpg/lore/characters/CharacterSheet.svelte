<script lang="ts">
    import type { Character, Ability, Skill } from "../../data/storage-utils";
    import { createEventDispatcher } from "svelte";
    import TemplateModal from "../../shared/modal/TemplateModal.svelte";
    import CharacterSheetSection from "./CharacterSheetSection.svelte";
    import { loadCharacters } from "../../data/storage-utils";

    export let character: Character;
    export let isEditing: boolean = false;
    export let isEditingSections: boolean = false;
    export let selectedSections: Set<string> = new Set(); // For filtering visible sections

    const dispatch = createEventDispatcher();

    let editingSection: string | null = null;

    let editedCharacter: Character = structuredClone(character);
    let showAbilityTemplateModal: boolean = false;
    let showSkillTemplateModal: boolean = false;

    // Keep editedCharacter in sync with character prop when not actively editing
    $: if (!isEditing && !editingSection) {
        editedCharacter = structuredClone(character);
    }

    $: if (editedCharacter && !editedCharacter.visibleSections) {
        editedCharacter.visibleSections = [
            "information",
            "experience",
            "health",
            "abilities",
            "items",
            "combat",
        ];
    }

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

        // if a currently displayed section is no longer visible, clear the filter
        if (selectedSections.size > 0) {
            const visibleSet = new Set(editedCharacter.visibleSections || []);
            const intersection = new Set(
                [...selectedSections].filter((x) => visibleSet.has(x)),
            );
            if (intersection.size === 0) {
                selectedSections.clear();
            } else {
                selectedSections = intersection;
            }
        }

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

    function toggleSectionInclusion(sectionId: string) {
        if (sectionId === "information") {
            alert("The Information section cannot be removed.");
            return;
        }

        if (!editedCharacter.visibleSections.includes("information")) {
            editedCharacter.visibleSections.push("information");
        }

        const isCurrentlyVisible =
            editedCharacter.visibleSections.includes(sectionId);

        if (isCurrentlyVisible) {
            editedCharacter.visibleSections =
                editedCharacter.visibleSections.filter((s) => s !== sectionId);
        } else {
            editedCharacter.visibleSections = [
                ...editedCharacter.visibleSections,
                sectionId,
            ];

            // Scroll to the newly enabled section after a brief delay to allow for rendering
            setTimeout(() => {
                const sectionElement = document.getElementById(
                    `section-${sectionId}`,
                );
                if (sectionElement) {
                    sectionElement.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    });
                }
            }, 100);
        }
        console.log(editedCharacter.visibleSections);
    }

    // Reactive values for each section visibility
    $: characterVisibleSections = editedCharacter.visibleSections || [
        "information",
    ];
    $: showInformation =
        characterVisibleSections.includes("information") &&
        (selectedSections.size === 0 ||
            selectedSections.has("information") ||
            isEditingSections);
    $: showExperience =
        characterVisibleSections.includes("experience") &&
        (selectedSections.size === 0 ||
            selectedSections.has("experience") ||
            isEditingSections);
    $: showHealth =
        characterVisibleSections.includes("health") &&
        (selectedSections.size === 0 ||
            selectedSections.has("health") ||
            isEditingSections);
    $: showAbilities =
        characterVisibleSections.includes("abilities") &&
        (selectedSections.size === 0 ||
            selectedSections.has("abilities") ||
            isEditingSections);
    $: showItems =
        characterVisibleSections.includes("items") &&
        (selectedSections.size === 0 ||
            selectedSections.has("items") ||
            isEditingSections);
    $: showCombat =
        characterVisibleSections.includes("combat") &&
        (selectedSections.size === 0 ||
            selectedSections.has("combat") ||
            isEditingSections);

    function startEditingSection(sectionId: string) {
        editingSection = sectionId;
    }

    function saveSection() {
        editedCharacter.updatedAt = Date.now();
        dispatch("save", editedCharacter);
        editingSection = null;
    }

    function cancelSectionEdit() {
        editedCharacter = structuredClone(character);
        editingSection = null;
    }

    $: isSectionEditing = (sectionId: string) => editingSection === sectionId;

    $: isInformationEditable = isEditing || isSectionEditing("information");
    $: isExperienceEditable = isEditing || isSectionEditing("experience");
    $: isHealthEditable = isEditing || isSectionEditing("health");
    $: isAbilitiesEditable = isEditing || isSectionEditing("abilities");
    $: isCombatEditable = isEditing || isSectionEditing("combat");
</script>

<div class="character-sheet-wrapper">
    <div class="character-sheet-scroll">
        <div class="character-sheet">
            <!-- Core Info Section -->
            {#if showInformation}
                <CharacterSheetSection
                    id="section-information"
                    title="Information"
                    isEditing={isSectionEditing("information")}
                    showEditButton={!isEditing && !isEditingSections}
                    on:edit={() => startEditingSection("information")}
                >
                    {#if isSectionEditing("information")}
                        <div class="section-edit-actions">
                            <button
                                class="srpg-b srpg-b-sm srpg-b-simple"
                                on:click={cancelSectionEdit}
                            >
                                Cancel
                            </button>
                            <button
                                class="srpg-b srpg-b-normal srpg-b-sm"
                                on:click={saveSection}
                            >
                                Save
                            </button>
                        </div>
                    {/if}
                    <div class="srpg-form-grid">
                        <div class="srpg-form-field">
                            <label for="name">Character Name</label>
                            {#if isInformationEditable}
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

                        <div class="srpg-form-field">
                            <label for="class">Class</label>
                            {#if isInformationEditable}
                                <input
                                    type="text"
                                    id="class"
                                    bind:value={editedCharacter.class}
                                />
                            {:else}
                                <p>{character.class || "—"}</p>
                            {/if}
                        </div>

                        <div class="srpg-form-field">
                            <label for="race">Race</label>
                            {#if isInformationEditable}
                                <input
                                    type="text"
                                    id="race"
                                    bind:value={editedCharacter.race}
                                />
                            {:else}
                                <p>{character.race || "—"}</p>
                            {/if}
                        </div>

                        <div class="srpg-form-field">
                            <label for="alignment">Alignment</label>
                            {#if isInformationEditable}
                                <select
                                    id="alignment"
                                    bind:value={editedCharacter.alignment}
                                >
                                    <option value="">Select Alignment</option>
                                    {#each alignmentOptions as alignment}
                                        <option value={alignment}
                                            >{alignment}</option
                                        >
                                    {/each}
                                </select>
                            {:else}
                                <p>{character.alignment || "—"}</p>
                            {/if}
                        </div>

                        <div class="srpg-form-field">
                            <label for="background">Background</label>
                            {#if isInformationEditable}
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
                </CharacterSheetSection>
            {/if}

            <!-- Experience Section -->
            {#if showExperience}
                <CharacterSheetSection
                    id="section-experience"
                    title="Experience"
                    isEditing={isSectionEditing("experience")}
                    showEditButton={!isEditing && !isEditingSections}
                    on:edit={() => startEditingSection("experience")}
                >
                    {#if isSectionEditing("experience")}
                        <div class="section-edit-actions">
                            <button
                                class="srpg-b srpg-b-sm srpg-b-simple"
                                on:click={cancelSectionEdit}
                            >
                                Cancel
                            </button>
                            <button
                                class="srpg-b srpg-b-normal srpg-b-sm"
                                on:click={saveSection}
                            >
                                Save
                            </button>
                        </div>
                    {/if}
                    <div class="srpg-form-grid">
                        <div class="srpg-form-field">
                            <label for="level">Level</label>
                            {#if isExperienceEditable}
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

                        <div class="srpg-form-field">
                            <label for="xp">Experience Points</label>
                            {#if isExperienceEditable}
                                <input
                                    type="number"
                                    id="xp"
                                    bind:value={
                                        editedCharacter.experiencePoints
                                    }
                                    min="0"
                                />
                            {:else}
                                <p>{character.experiencePoints || "—"}</p>
                            {/if}
                        </div>

                        <div class="srpg-form-field">
                            <label for="proficiencyBonus"
                                >Proficiency Bonus</label
                            >
                            {#if isExperienceEditable}
                                <input
                                    type="number"
                                    id="proficiencyBonus"
                                    bind:value={
                                        editedCharacter.proficiencyBonus
                                    }
                                />
                            {:else}
                                <p>
                                    {character.proficiencyBonus !== undefined
                                        ? character.proficiencyBonus >= 0
                                            ? `+${character.proficiencyBonus}`
                                            : character.proficiencyBonus
                                        : "—"}
                                </p>
                            {/if}
                        </div>
                    </div>
                </CharacterSheetSection>
            {/if}

            <!-- Health Section -->
            {#if showHealth}
                <CharacterSheetSection
                    id="section-health"
                    title="Health"
                    isEditing={isSectionEditing("health")}
                    showEditButton={!isEditing && !isEditingSections}
                    on:edit={() => startEditingSection("health")}
                >
                    {#if isSectionEditing("health")}
                        <div class="section-edit-actions">
                            <button
                                class="srpg-b srpg-b-sm srpg-b-simple"
                                on:click={cancelSectionEdit}
                            >
                                Cancel
                            </button>
                            <button
                                class="srpg-b srpg-b-normal srpg-b-sm"
                                on:click={saveSection}
                            >
                                Save
                            </button>
                        </div>
                    {/if}
                    <div class="srpg-form-grid">
                        <div class="srpg-form-field">
                            <label for="hpCurrent">Current Hit Points</label>
                            {#if isHealthEditable}
                                <input
                                    type="number"
                                    id="hpCurrent"
                                    bind:value={
                                        editedCharacter.currentHitPoints
                                    }
                                />
                            {:else}
                                <p>
                                    {character.currentHitPoints !== undefined
                                        ? character.currentHitPoints
                                        : "—"}
                                </p>
                            {/if}
                        </div>

                        <div class="srpg-form-field">
                            <label for="hpMax">Hit Point Maximum</label>
                            {#if isHealthEditable}
                                <input
                                    type="number"
                                    id="hpMax"
                                    bind:value={editedCharacter.hitPointMaximum}
                                />
                            {:else}
                                <p>{character.hitPointMaximum || "—"}</p>
                            {/if}
                        </div>

                        <div class="srpg-form-field">
                            <label for="hpTemp">Temporary Hit Points</label>
                            {#if isHealthEditable}
                                <input
                                    type="number"
                                    id="hpTemp"
                                    bind:value={
                                        editedCharacter.temporaryHitPoints
                                    }
                                />
                            {:else}
                                <p>{character.temporaryHitPoints || "—"}</p>
                            {/if}
                        </div>

                        <div class="srpg-form-field">
                            <label for="hitDice">Hit Dice</label>
                            {#if isHealthEditable}
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

                        <div class="srpg-form-field">
                            <label for="deathSaveSuccesses"
                                >Death Save Successes</label
                            >
                            {#if isHealthEditable}
                                <input
                                    type="number"
                                    id="deathSaveSuccesses"
                                    bind:value={
                                        editedCharacter.deathSaveSuccesses
                                    }
                                    min="0"
                                    max="3"
                                />
                            {:else}
                                <p>{character.deathSaveSuccesses || 0}</p>
                            {/if}
                        </div>

                        <div class="srpg-form-field">
                            <label for="deathSaveFailures"
                                >Death Save Failures</label
                            >
                            {#if isHealthEditable}
                                <input
                                    type="number"
                                    id="deathSaveFailures"
                                    bind:value={
                                        editedCharacter.deathSaveFailures
                                    }
                                    min="0"
                                    max="3"
                                />
                            {:else}
                                <p>{character.deathSaveFailures || 0}</p>
                            {/if}
                        </div>
                    </div>
                </CharacterSheetSection>
            {/if}

            <!-- Abilities Section -->
            {#if showAbilities}
                <CharacterSheetSection
                    id="section-abilities"
                    title="Abilities"
                    isEditing={isSectionEditing("abilities")}
                    showEditButton={!isEditing && !isEditingSections}
                    on:edit={() => startEditingSection("abilities")}
                >
                    {#if isSectionEditing("abilities")}
                        <div class="section-edit-actions">
                            <button
                                class="srpg-b srpg-b-sm srpg-b-simple"
                                on:click={cancelSectionEdit}
                            >
                                Cancel
                            </button>
                            <button
                                class="srpg-b srpg-b-normal srpg-b-sm"
                                on:click={saveSection}
                            >
                                Save
                            </button>
                        </div>
                    {/if}
                    {#if isAbilitiesEditable}
                        <div class="section-actions">
                            <button
                                class="srpg-b srpg-b-sm"
                                on:click={addAbility}
                            >
                                <svg
                                    class="srpg-icon-sm"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                >
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                                Add Ability
                            </button>
                            <button
                                class="srpg-b srpg-b-normal srpg-b-sm"
                                on:click={openTemplateModal}
                            >
                                <svg
                                    class="srpg-icon-sm"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                >
                                    <rect
                                        x="9"
                                        y="9"
                                        width="13"
                                        height="13"
                                        rx="2"
                                        ry="2"
                                    />
                                    <path
                                        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                                    />
                                </svg>
                                Use Template
                            </button>
                        </div>
                    {/if}

                    {#if editedCharacter.abilities.length > 0}
                        <div class="abilities-grid">
                            {#each editedCharacter.abilities as ability}
                                <div class="ability-card">
                                    {#if isAbilitiesEditable}
                                        <div class="ability-edit-form">
                                            <div class="srpg-form-field">
                                                <label
                                                    for="ability-name-{ability.id}"
                                                    >Name</label
                                                >
                                                <input
                                                    type="text"
                                                    id="ability-name-{ability.id}"
                                                    value={ability.name}
                                                    on:input={(e) =>
                                                        updateAbilityName(
                                                            ability.id,
                                                            e.currentTarget
                                                                .value,
                                                        )}
                                                    placeholder="Ability Name"
                                                />
                                            </div>

                                            <div class="ability-stats-grid">
                                                <div class="srpg-form-field">
                                                    <label
                                                        for="ability-score-{ability.id}"
                                                        >Score</label
                                                    >
                                                    <input
                                                        type="number"
                                                        id="ability-score-{ability.id}"
                                                        value={ability.score}
                                                        on:input={(e) =>
                                                            updateAbilityScore(
                                                                ability.id,
                                                                Number(
                                                                    e
                                                                        .currentTarget
                                                                        .value,
                                                                ),
                                                            )}
                                                        min="1"
                                                        max="30"
                                                    />
                                                </div>

                                                <div class="srpg-form-field">
                                                    <label
                                                        for="ability-modifier-{ability.id}"
                                                        >Modifier</label
                                                    >
                                                    <input
                                                        type="number"
                                                        id="ability-modifier-{ability.id}"
                                                        value={ability.modifier}
                                                        on:input={(e) =>
                                                            updateAbilityModifier(
                                                                ability.id,
                                                                Number(
                                                                    e
                                                                        .currentTarget
                                                                        .value,
                                                                ),
                                                            )}
                                                    />
                                                </div>
                                            </div>

                                            <div class="ability-proficiency">
                                                <label
                                                    class="proficiency-checkbox"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={ability.proficient}
                                                        on:change={(e) =>
                                                            updateAbilityProficient(
                                                                ability.id,
                                                                e.currentTarget
                                                                    .checked,
                                                            )}
                                                    />
                                                    <span>Proficient</span>
                                                </label>
                                            </div>

                                            <button
                                                class="srpg-b srpg-b-danger srpg-b-sm remove-btn"
                                                on:click={() =>
                                                    removeAbility(ability.id)}
                                            >
                                                <svg
                                                    class="srpg-icon-sm"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    stroke-width="2"
                                                >
                                                    <path
                                                        d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                                                    />
                                                </svg>
                                                Remove
                                            </button>
                                        </div>
                                    {:else}
                                        <h3>{ability.name}</h3>
                                        <div class="ability-stats">
                                            <p>
                                                <strong>Score:</strong>
                                                {ability.score}
                                            </p>
                                            <p>
                                                <strong>Modifier:</strong>
                                                {ability.modifier >= 0
                                                    ? "+"
                                                    : ""}{ability.modifier}
                                            </p>
                                            {#if ability.proficient}
                                                <span class="srpg-badge"
                                                    >Proficient</span
                                                >
                                            {/if}
                                        </div>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <p class="srpg-empty-message">
                            No abilities added yet.
                        </p>
                    {/if}

                    <!-- Skills Subsection -->
                    <div class="skills-subsection">
                        <div class="subsection-header">
                            <h3>Skills</h3>
                        </div>
                        {#if isAbilitiesEditable}
                            <div class="section-actions">
                                <button
                                    class="srpg-b srpg-b-sm"
                                    on:click={addSkill}
                                >
                                    <svg
                                        class="srpg-icon-sm"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                    >
                                        <path d="M12 5v14M5 12h14" />
                                    </svg>
                                    Add Skill
                                </button>
                                <button
                                    class="srpg-b srpg-b-normal srpg-b-sm"
                                    on:click={openSkillTemplateModal}
                                >
                                    <svg
                                        class="srpg-icon-sm"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                    >
                                        <rect
                                            x="9"
                                            y="9"
                                            width="13"
                                            height="13"
                                            rx="2"
                                            ry="2"
                                        />
                                        <path
                                            d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                                        />
                                    </svg>
                                    Use Template
                                </button>
                            </div>
                        {/if}

                        {#if editedCharacter.skills.length > 0}
                            <div class="skills-grid">
                                {#each editedCharacter.skills as skill}
                                    <div class="skill-card">
                                        {#if isAbilitiesEditable}
                                            <div class="skill-edit-form">
                                                <div class="srpg-form-field">
                                                    <label
                                                        for="skill-name-{skill.id}"
                                                        >Name</label
                                                    >
                                                    <input
                                                        type="text"
                                                        id="skill-name-{skill.id}"
                                                        value={skill.name}
                                                        on:input={(e) =>
                                                            updateSkillName(
                                                                skill.id,
                                                                e.currentTarget
                                                                    .value,
                                                            )}
                                                        placeholder="Skill Name"
                                                    />
                                                </div>

                                                <div class="srpg-form-field">
                                                    <label
                                                        for="skill-ability-{skill.id}"
                                                        >Ability</label
                                                    >
                                                    <select
                                                        id="skill-ability-{skill.id}"
                                                        value={skill.abilityId}
                                                        on:change={(e) =>
                                                            updateSkillAbility(
                                                                skill.id,
                                                                e.currentTarget
                                                                    .value,
                                                            )}
                                                    >
                                                        {#each editedCharacter.abilities as ability}
                                                            <option
                                                                value={ability.id}
                                                                >{ability.name}</option
                                                            >
                                                        {/each}
                                                    </select>
                                                </div>

                                                <div class="skill-stats-grid">
                                                    <div
                                                        class="srpg-form-field"
                                                    >
                                                        <label
                                                            for="skill-bonus-{skill.id}"
                                                            >Bonus</label
                                                        >
                                                        <input
                                                            type="number"
                                                            id="skill-bonus-{skill.id}"
                                                            value={skill.bonus}
                                                            on:input={(e) =>
                                                                updateSkillBonus(
                                                                    skill.id,
                                                                    Number(
                                                                        e
                                                                            .currentTarget
                                                                            .value,
                                                                    ),
                                                                )}
                                                        />
                                                    </div>

                                                    <div
                                                        class="skill-proficiency"
                                                    >
                                                        <label
                                                            class="proficiency-checkbox"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={skill.proficient}
                                                                on:change={(
                                                                    e,
                                                                ) =>
                                                                    updateSkillProficient(
                                                                        skill.id,
                                                                        e
                                                                            .currentTarget
                                                                            .checked,
                                                                    )}
                                                            />
                                                            <span>Prof.</span>
                                                        </label>
                                                    </div>
                                                </div>

                                                <button
                                                    class="srpg-b srpg-b-danger srpg-b-sm remove-btn"
                                                    on:click={() =>
                                                        removeSkill(skill.id)}
                                                >
                                                    <svg
                                                        class="srpg-icon-sm"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        stroke-width="2"
                                                    >
                                                        <path
                                                            d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                                                        />
                                                    </svg>
                                                    Remove
                                                </button>
                                            </div>
                                        {:else}
                                            <div class="skill-display">
                                                <h4 class="skill-name">
                                                    {skill.name}
                                                </h4>
                                                <p class="skill-ability">
                                                    ({getAbilityName(
                                                        skill.abilityId,
                                                    )})
                                                </p>
                                                <div class="skill-stats">
                                                    <span class="skill-bonus">
                                                        {skill.bonus >= 0
                                                            ? "+"
                                                            : ""}{skill.bonus}
                                                    </span>
                                                    {#if skill.proficient}
                                                        <span
                                                            class="srpg-badge srpg-badge-sm"
                                                            >Prof</span
                                                        >
                                                    {/if}
                                                </div>
                                            </div>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        {:else}
                            <p class="srpg-empty-message">
                                No skills added yet.
                            </p>
                        {/if}
                    </div>
                </CharacterSheetSection>
            {/if}

            <!-- Items Section -->
            {#if showItems}
                <CharacterSheetSection
                    id="section-items"
                    title="Items"
                    isEditing={isSectionEditing("items")}
                    showEditButton={!isEditing && !isEditingSections}
                    on:edit={() => startEditingSection("items")}
                >
                    {#if isSectionEditing("items")}
                        <div class="section-edit-actions">
                            <button
                                class="srpg-b srpg-b-sm srpg-b-simple"
                                on:click={cancelSectionEdit}
                            >
                                Cancel
                            </button>
                            <button
                                class="srpg-b srpg-b-normal srpg-b-sm"
                                on:click={saveSection}
                            >
                                Save
                            </button>
                        </div>
                    {/if}
                </CharacterSheetSection>
            {/if}

            <!-- Combat Stats Section -->
            {#if showCombat}
                <CharacterSheetSection
                    id="section-combat"
                    title="Combat Stats"
                    isEditing={isSectionEditing("combat")}
                    showEditButton={!isEditing && !isEditingSections}
                    on:edit={() => startEditingSection("combat")}
                >
                    {#if isSectionEditing("combat")}
                        <div class="section-edit-actions">
                            <button
                                class="srpg-b srpg-b-sm srpg-b-simple"
                                on:click={cancelSectionEdit}
                            >
                                Cancel
                            </button>
                            <button
                                class="srpg-b srpg-b-normal srpg-b-sm"
                                on:click={saveSection}
                            >
                                Save
                            </button>
                        </div>
                    {/if}
                    <div class="srpg-form-grid">
                        <div class="srpg-form-field">
                            <label for="ac">Armor Class</label>
                            {#if isCombatEditable}
                                <input
                                    type="number"
                                    id="ac"
                                    bind:value={editedCharacter.armorClass}
                                />
                            {:else}
                                <p>{character.armorClass || "—"}</p>
                            {/if}
                        </div>

                        <div class="srpg-form-field">
                            <label for="initiative">Initiative</label>
                            {#if isCombatEditable}
                                <input
                                    type="number"
                                    id="initiative"
                                    bind:value={editedCharacter.initiative}
                                />
                            {:else}
                                <p>
                                    {character.initiative
                                        ? (character.initiative >= 0
                                              ? "+"
                                              : "") + character.initiative
                                        : "—"}
                                </p>
                            {/if}
                        </div>

                        <div class="srpg-form-field">
                            <label for="speed">Speed</label>
                            {#if isCombatEditable}
                                <input
                                    type="number"
                                    id="speed"
                                    bind:value={editedCharacter.speed}
                                />
                            {:else}
                                <p>
                                    {character.speed
                                        ? character.speed + " ft."
                                        : "—"}
                                </p>
                            {/if}
                        </div>
                    </div>
                </CharacterSheetSection>
            {/if}
        </div>
    </div>
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
    .character-sheet-wrapper {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
    }

    .character-sheet-scroll {
        flex: 1;
        overflow-y: auto;
        min-height: 0;
    }

    /* Section Edit Actions */
    .section-edit-actions {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
        justify-content: flex-end;
    }

    /* Skills Subsection */
    .skills-subsection {
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 2px solid #e2e8f0;
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
        .subsection-header h3 {
            font-size: 1.5rem;
        }
    }

    /* Character Sheet Container */
    .character-sheet {
        position: relative;
        max-width: 100%;
        width: 100vw;
    }

    @media (min-width: 768px) {
        .character-sheet {
            padding-right: 0.5rem; /* Small room for the scrollbar */
            padding-left: 0.5rem; /* Small room for the scrollbar */
            padding-bottom: 1.5rem;
        }
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

    /* Shared Grid Styles */
    .abilities-grid,
    .skills-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.25rem;
        margin-top: 1rem;
    }

    @media (min-width: 640px) {
        .abilities-grid,
        .skills-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    @media (min-width: 1024px) {
        .abilities-grid {
            grid-template-columns: repeat(3, 1fr);
        }

        .skills-grid {
            grid-template-columns: repeat(3, 1fr);
        }
    }

    @media (min-width: 1280px) {
        .skills-grid {
            grid-template-columns: repeat(4, 1fr);
        }
    }

    /* Shared Card Styles */
    .ability-card,
    .skill-card {
        background: linear-gradient(135deg, var(--card-bg) 0%, var(--bg-secondary) 100%);
        border: 1px solid var(--border-primary);
        border-radius: 12px;
        padding: 1.25rem;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 1px 3px var(--shadow-sm);
        position: relative;
        overflow: hidden;
    }

    .ability-card::before,
    .skill-card::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(
            90deg,
            var(--accent-primary) 0%,
            var(--accent-info) 50%,
            var(--accent-info-hover) 100%
        );
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .ability-card:hover,
    .skill-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px var(--shadow-md);
        border-color: var(--border-secondary);
    }

    .ability-card:hover::before,
    .skill-card:hover::before {
        opacity: 1;
    }

    /* Card Header Styles */
    .ability-card h3,
    .skill-name {
        margin: 0 0 0.75rem 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-primary);
        text-align: center;
        letter-spacing: -0.025em;
    }

    @media (min-width: 768px) {
        .ability-card h3,
        .skill-name {
            font-size: 1.1875rem;
        }
    }

    /* Edit Form Styles */
    .ability-edit-form,
    .skill-edit-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .ability-stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
    }

    .skill-stats-grid {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 0.75rem;
        align-items: end;
    }

    /* Proficiency Styles */
    .ability-proficiency,
    .skill-proficiency {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 2.5rem;
    }

    .proficiency-checkbox {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
        transition: color 0.2s ease;
    }

    .proficiency-checkbox:hover {
        color: var(--text-primary);
    }

    .proficiency-checkbox input[type="checkbox"] {
        width: auto;
        margin: 0;
        cursor: pointer;
        transform: scale(1.1);
        accent-color: var(--accent-primary);
    }

    /* Remove Button Styles */
    .remove-btn {
        margin-top: 0.75rem;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.375rem;
        font-size: 0.875rem;
    }

    /* Read-only Display Styles */
    .ability-stats {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        text-align: center;
    }

    .ability-stats p {
        margin: 0;
        font-size: 0.9375rem;
        padding: 0.375rem 0;
        min-height: auto;
        color: var(--text-secondary);
    }

    .skill-display {
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
    }

    .skill-ability {
        margin: 0;
        font-size: 0.8125rem;
        color: var(--text-muted);
        font-weight: 500;
        letter-spacing: 0.025em;
    }

    .skill-stats {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    /* Value Display Styles */
    .skill-bonus {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-secondary);
        background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
        padding: 0.375rem 0.75rem;
        border-radius: 8px;
        min-width: 3rem;
        text-align: center;
        border: 1px solid var(--border-secondary);
        box-shadow: 0 1px 2px var(--shadow-sm);
        letter-spacing: -0.025em;
    }

    /* Badge Improvements */
    .srpg-badge {
        background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-info) 100%);
        color: var(--text-inverse);
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.25rem 0.5rem;
        border-radius: 6px;
        letter-spacing: 0.025em;
        box-shadow: 0 1px 2px rgba(59, 130, 246, 0.2);
    }

    .srpg-badge-sm {
        font-size: 0.6875rem;
        padding: 0.1875rem 0.375rem;
        border-radius: 4px;
    }
</style>
