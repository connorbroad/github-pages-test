<script lang="ts">
    import type { Character, Ability, Skill } from "../../data/storage-utils";
    import { createEventDispatcher } from "svelte";
    import TemplateModal from "../../shared/modal/TemplateModal.svelte";
    import CharacterSheetSection from "./CharacterSheetSection.svelte";
    import { loadCharacters } from "../../data/storage-utils";

    export let character: Character;
    export let isEditing: boolean = false;
    export let isEditingSections: boolean = false;

    const dispatch = createEventDispatcher();
    
    let editingSection: string | null = null;

    const DEFAULT_GROUPS = [];

    // Available sections that can be added to a character sheet
    const availableSections = [
        { id: "information", name: "Information", icon: "info" },
        { id: "experience", name: "Experience", icon: "star" },
        { id: "health", name: "Health", icon: "heart" },
        { id: "abilities", name: "Abilities", icon: "ability" },
        { id: "items", name: "Items", icon: "items" },
        { id: "combat", name: "Combat Stats", icon: "combat" },
    ];

    let editedCharacter: Character = structuredClone(character);
    let showAbilityTemplateModal: boolean = false;
    let showSkillTemplateModal: boolean = false;
    let selectedSections: Set<string> = new Set(); // Empty = show all sections by default
    let customGroupInput: string = "";
    let showCustomGroupInput: boolean = false;

    // Initialize visibleSections if not present (for backward compatibility)
    $: if (editedCharacter && !editedCharacter.visibleSections) {
        editedCharacter.visibleSections = [
            "information",
            "experience",
            "health",
            "abilities",
            "items",
            "combat"
        ];
    }

    // Get all existing groups from all characters in campaign + current selection
    $: allGroupOptions = getAllGroupOptions(editedCharacter.group);

    function getAllGroupOptions(currentGroup: string | undefined): string[] {
        const groups = new Set<string>(DEFAULT_GROUPS);
        const allCharacters = loadCharacters();
        const campaignCharacters = allCharacters.filter(
            (c) => c.campaignId === character.campaignId,
        );

        campaignCharacters.forEach((c) => {
            if (c.group && !DEFAULT_GROUPS.includes(c.group)) {
                groups.add(c.group);
            }
        });

        // Add current selection if it's not a default group
        if (currentGroup && !DEFAULT_GROUPS.includes(currentGroup)) {
            groups.add(currentGroup);
        }

        return Array.from(groups).sort();
    }

    function toggleCustomGroupInput() {
        showCustomGroupInput = !showCustomGroupInput;
        if (showCustomGroupInput) {
            customGroupInput = "";
        }
    }

    function addCustomGroup() {
        const trimmed = customGroupInput.trim();
        if (trimmed) {
            editedCharacter.group = trimmed;
            showCustomGroupInput = false;
            customGroupInput = "";
            // Trigger reactivity
            editedCharacter = editedCharacter;
        }
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

    function toggleSection(section: string) {
        if (isEditingSections) {
            // In edit mode, toggle the section's inclusion in the character sheet
            toggleSectionInclusion(section);
        } else {
            // In view mode, use for filtering
            if (selectedSections.has(section)) {
                // Tapping on the same icon again clears the filter (shows all)
                selectedSections.delete(section);
            } else {
                // Switch to only this section
                selectedSections.clear();
                selectedSections.add(section);
            }
            // Trigger reactivity
            selectedSections = selectedSections;
        }
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

    $: showSectionFilter =
        isEditingSections || characterVisibleSections.length > 1;

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

{#if isEditing || isEditingSections}
    <div class="edit-actions">
        <button class="srpg-b" on:click={cancelEdit}>
            <svg
                class="srpg-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >
                <path d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel
        </button>
        <button class="srpg-b srpg-b-normal save-btn" on:click={saveChanges}>
            <svg
                class="srpg-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >
                <path d="M5 13l4 4L19 7" />
            </svg>
            Save Changes
        </button>
    </div>
{/if}

<div class="character-sheet-controls">
    {#if showSectionFilter}
        <div class="section-filter">
            <div class="section-filter-icons">
                <!-- In edit mode, show all sections. In view mode, show only visible sections -->
                {#each availableSections as section}
                    {#if isEditingSections || characterVisibleSections.includes(section.id)}
                        <button
                            class="section-icon-btn"
                            class:active={isEditingSections
                                ? characterVisibleSections.includes(section.id)
                                : selectedSections.has(section.id)}
                            class:excluded={isEditingSections &&
                                !characterVisibleSections.includes(section.id)}
                            class:disabled={isEditingSections &&
                                section.id === "information"}
                            on:click={() => toggleSection(section.id)}
                            title={isEditingSections
                                ? section.id === "information"
                                    ? "Information (Required)"
                                    : characterVisibleSections.includes(
                                            section.id,
                                        )
                                      ? `Remove ${section.name}`
                                      : `Add ${section.name}`
                                : section.name}
                            aria-label={isEditingSections
                                ? characterVisibleSections.includes(section.id)
                                    ? `Remove ${section.name} section`
                                    : `Add ${section.name} section`
                                : `Toggle ${section.name} section`}
                        >
                            {#if section.icon === "info"}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    width="1em"
                                    height="1em"
                                >
                                    <path
                                        fill="currentColor"
                                        d="M3 10h11v2H3zm0-2h11V6H3zm0 8h7v-2H3zm15.01-3.13l.71-.71a.996.996 0 0 1 1.41 0l.71.71c.39.39.39 1.02 0 1.41l-.71.71zm-.71.71l-5.3 5.3V21h2.12l5.3-5.3z"
                                    />
                                </svg>
                            {:else if section.icon === "star"}
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                >
                                    <path
                                        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                    />
                                </svg>
                            {:else if section.icon === "heart"}
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                >
                                    <path
                                        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                                    />
                                </svg>
                            {:else if section.icon === "ability"}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 512 512"
                                    width="1em"
                                    height="1em"
                                >
                                    <circle
                                        cx="256"
                                        cy="56"
                                        r="40"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-miterlimit="10"
                                        stroke-width="32"
                                    />
                                    <path
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-miterlimit="10"
                                        stroke-width="32"
                                        d="m199.3 295.62l-30.4 172.2a24 24 0 0 0 19.5 27.8a23.76 23.76 0 0 0 27.6-19.5l21-119.9v.2s5.2-32.5 17.5-32.5h3.1c12.5 0 17.5 32.5 17.5 32.5v-.1l21 119.9a23.92 23.92 0 1 0 47.1-8.4l-30.4-172.2l-4.9-29.7c-2.9-18.1-4.2-47.6.5-59.7c4-10.4 14.13-14.2 23.2-14.2H424a24 24 0 0 0 0-48H88a24 24 0 0 0 0 48h92.5c9.23 0 19.2 3.8 23.2 14.2c4.7 12.1 3.4 41.6.5 59.7Z"
                                    />
                                </svg>
                            {:else if section.icon === "items"}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 14 14"
                                    width="1em"
                                    height="1em"
                                    {...$$props}
                                >
                                    <g
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        ><path
                                            d="M7 13.5c3.5 0 6-1.24 6-4c0-3-1.5-4.52-4.5-6.02l1.298-2.028a.65.65 0 0 0-.56-.95h-4.24a.65.65 0 0 0-.56 1L5.5 3.48C2.5 5 1 6.52 1 9.52c0 2.74 2.5 3.98 6 3.98"
                                        /><path
                                            d="M5.5 3.5a1.803 1.803 0 0 0 3 0v0"
                                        /></g
                                    >
                                </svg>
                            {:else if section.icon === "combat"}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    width="1em"
                                    height="1em"
                                >
                                    <path
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6m-3 3l4 4m-1 1l2-2M14.5 6.5L18 3h3v3l-3.5 3.5M5 14l4 4m-2-1l-3 3m-1-1l2 2"
                                    />
                                </svg>
                            {/if}

                            <!-- Edit mode indicator -->
                            {#if isEditingSections && section.id !== "information"}
                                <span
                                    class="section-status-indicator"
                                    class:included={characterVisibleSections.includes(
                                        section.id,
                                    )}
                                    class:required={section.id ===
                                        "information"}
                                >
                                </span>
                            {/if}
                        </button>
                    {/if}
                {/each}
            </div>
        </div>
    {/if}
</div>

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
                    <button class="srpg-b srpg-b-sm" on:click={cancelSectionEdit}>
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
                                <option value={alignment}>{alignment}</option>
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

                <div class="srpg-form-field">
                    <label for="group">Group</label>
                    {#if isInformationEditable}
                        <select
                            id="group"
                            class="srpg-select"
                            bind:value={editedCharacter.group}
                        >
                            <option value="">No Group</option>
                            {#each allGroupOptions as group}
                                <option value={group}>{group}</option>
                            {/each}
                        </select>
                        {#if !showCustomGroupInput}
                            <button
                                class="srpg-b srpg-b-sm"
                                style="margin-top: 0.5rem;"
                                on:click={toggleCustomGroupInput}
                                type="button"
                            >
                                + Add Custom Group
                            </button>
                        {:else}
                            <div
                                class="custom-group-input"
                                style="margin-top: 0.5rem;"
                            >
                                <input
                                    type="text"
                                    bind:value={customGroupInput}
                                    placeholder="Enter custom group name"
                                    on:keypress={(e) =>
                                        e.key === "Enter" && addCustomGroup()}
                                />
                                <button
                                    class="srpg-b srpg-b-sm srpg-b-normal"
                                    on:click={addCustomGroup}
                                    disabled={!customGroupInput.trim()}
                                    type="button"
                                >
                                    Add
                                </button>
                                <button
                                    class="srpg-b srpg-b-sm"
                                    on:click={toggleCustomGroupInput}
                                    type="button"
                                >
                                    Cancel
                                </button>
                            </div>
                        {/if}
                    {:else}
                        <p>{character.group || "—"}</p>
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
                    <button class="srpg-b srpg-b-sm" on:click={cancelSectionEdit}>
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
                            bind:value={editedCharacter.experiencePoints}
                            min="0"
                        />
                    {:else}
                        <p>{character.experiencePoints || "—"}</p>
                    {/if}
                </div>

                <div class="srpg-form-field">
                    <label for="proficiencyBonus">Proficiency Bonus</label>
                    {#if isExperienceEditable}
                        <input
                            type="number"
                            id="proficiencyBonus"
                            bind:value={editedCharacter.proficiencyBonus}
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
                    <button class="srpg-b srpg-b-sm" on:click={cancelSectionEdit}>
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
                            bind:value={editedCharacter.temporaryHitPoints}
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
                    <label for="deathSaveSuccesses">Death Save Successes</label>
                    {#if isHealthEditable}
                        <input
                            type="number"
                            id="deathSaveSuccesses"
                            bind:value={editedCharacter.deathSaveSuccesses}
                            min="0"
                            max="3"
                        />
                    {:else}
                        <p>{character.deathSaveSuccesses || 0}</p>
                    {/if}
                </div>

                <div class="srpg-form-field">
                    <label for="deathSaveFailures">Death Save Failures</label>
                    {#if isHealthEditable}
                        <input
                            type="number"
                            id="deathSaveFailures"
                            bind:value={editedCharacter.deathSaveFailures}
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
                    <button class="srpg-b srpg-b-sm" on:click={cancelSectionEdit}>
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
                    <button class="srpg-b srpg-b-sm" on:click={addAbility}>
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
                                        <label for="ability-name-{ability.id}"
                                            >Name</label
                                        >
                                        <input
                                            type="text"
                                            id="ability-name-{ability.id}"
                                            value={ability.name}
                                            on:input={(e) =>
                                                updateAbilityName(
                                                    ability.id,
                                                    e.currentTarget.value,
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
                                                            e.currentTarget
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
                                                            e.currentTarget
                                                                .value,
                                                        ),
                                                    )}
                                            />
                                        </div>
                                    </div>

                                    <div class="ability-proficiency">
                                        <label class="proficiency-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={ability.proficient}
                                                on:change={(e) =>
                                                    updateAbilityProficient(
                                                        ability.id,
                                                        e.currentTarget.checked,
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
                <p class="srpg-empty-message">No abilities added yet.</p>
            {/if}

            <!-- Skills Subsection -->
            <div class="skills-subsection">
                <div class="subsection-header">
                    <h3>Skills</h3>
                </div>
                {#if isAbilitiesEditable}
                <div class="section-actions">
                    <button class="srpg-b srpg-b-sm" on:click={addSkill}>
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
                                        <label for="skill-name-{skill.id}"
                                            >Name</label
                                        >
                                        <input
                                            type="text"
                                            id="skill-name-{skill.id}"
                                            value={skill.name}
                                            on:input={(e) =>
                                                updateSkillName(
                                                    skill.id,
                                                    e.currentTarget.value,
                                                )}
                                            placeholder="Skill Name"
                                        />
                                    </div>

                                    <div class="srpg-form-field">
                                        <label for="skill-ability-{skill.id}"
                                            >Ability</label
                                        >
                                        <select
                                            id="skill-ability-{skill.id}"
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
                                    </div>

                                    <div class="skill-stats-grid">
                                        <div class="srpg-form-field">
                                            <label for="skill-bonus-{skill.id}"
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
                                                            e.currentTarget
                                                                .value,
                                                        ),
                                                    )}
                                            />
                                        </div>

                                        <div class="skill-proficiency">
                                            <label class="proficiency-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={skill.proficient}
                                                    on:change={(e) =>
                                                        updateSkillProficient(
                                                            skill.id,
                                                            e.currentTarget
                                                                .checked,
                                                        )}
                                                />
                                                <span>Prof.</span>
                                            </label>
                                        </div>
                                    </div>

                                    <button
                                        class="srpg-b srpg-b-danger srpg-b-sm remove-btn"
                                        on:click={() => removeSkill(skill.id)}
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
                                    <h4 class="skill-name">{skill.name}</h4>
                                    <p class="skill-ability">
                                        ({getAbilityName(skill.abilityId)})
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
                <p class="srpg-empty-message">No skills added yet.</p>
            {/if}
            </div>
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
                    <button class="srpg-b srpg-b-sm" on:click={cancelSectionEdit}>
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
                                ? (character.initiative >= 0 ? "+" : "") +
                                  character.initiative
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
                            {character.speed ? character.speed + " ft." : "—"}
                        </p>
                    {/if}
                </div>
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
                    <button class="srpg-b srpg-b-sm" on:click={cancelSectionEdit}>
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
        color: #334155;
    }

    @media (min-width: 768px) {
        .subsection-header h3 {
            font-size: 1.5rem;
        }
    }

    /* Mobile Section Filter */
    .section-filter {
        position: fixed;
        bottom: calc(70px + env(safe-area-inset-bottom));
        left: 0;
        right: 0;
        z-index: 50;

        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .section-filter-icons {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 0.5rem;

        padding: 0.75rem 1.5rem;

        border: 1px solid #cfcfcf;
        background: rgb(250, 253, 255);

        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
    }

    .section-icon-btn {
        position: relative;
        width: 2.75rem;
        height: 2.75rem;
        padding: 0;
        background: white;
        border: 2px solid #cbd5e1;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: visible;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .section-icon-btn svg {
        width: 1.375rem;
        height: 1.375rem;
        color: #64748b;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        z-index: 1;
    }

    .section-icon-btn::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
        opacity: 0;
        transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 0;
        border-radius: 8px;
    }

    .section-icon-btn:hover {
        transform: translateY(-2px);
        border-color: #3b82f6;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .section-icon-btn:hover svg {
        color: #3b82f6;
        transform: scale(1.1);
    }

    .section-icon-btn:active {
        transform: translateY(0);
    }

    /* Active state (included sections in edit mode or selected in view mode) */
    .section-icon-btn.active {
        border-color: #3b82f6;
        box-shadow:
            0 4px 12px rgba(59, 130, 246, 0.4),
            0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .section-icon-btn.active::before {
        opacity: 1;
    }

    .section-icon-btn.active svg {
        color: white;
        transform: scale(1.05);
    }

    /* Excluded state (sections not included in edit mode) */
    .section-icon-btn.excluded {
        background: #f3f4f6;
        border-color: #e5e7eb;
        border-style: dashed;
        opacity: 0.6;
    }

    .section-icon-btn.excluded svg {
        color: #9ca3af;
    }

    .section-icon-btn.excluded:hover {
        opacity: 0.8;
        border-color: #10b981;
        background: #f0fdf4;
    }

    .section-icon-btn.excluded:hover svg {
        color: #10b981;
    }

    /* Disabled state (Information section in edit mode) */
    .section-icon-btn.disabled {
        cursor: default;
    }

    .section-icon-btn.disabled:hover {
        transform: none;
        border-color: #3b82f6;
    }

    /* Section status indicator (shown in edit mode) */
    .section-status-indicator {
        position: absolute;
        top: -4px;
        right: -4px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid white;
        background: #0c1329;
        z-index: 2;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .section-status-indicator.included {
        background: #10b981;
    }

    .section-status-indicator.required {
        background: #f59e0b;
    }

    /* Small screen adjustments */
    @media (max-width: 380px) {
        .section-icon-btn {
            width: 2.5rem;
            height: 2.5rem;
        }

        .section-icon-btn svg {
            width: 1.25rem;
            height: 1.25rem;
        }

        .section-filter-icons {
            gap: 0.375rem;
        }
    }

    /* larger screens */
    @media (min-width: 768px) {
        .section-filter {
            position: relative;
            top: 0;
            right: 0;
            bottom: auto;
            left: auto;

            margin: 0;
            margin-bottom: 0.5rem;
            padding: 0.5rem;

            border-radius: 8px;
            border-top: 0;

            display: flex;
            flex-direction: row;
            align-items: flex-end;
            justify-content: flex-end;
        }

        .section-filter-icons {
            padding: 0;
            border: none;
            background: transparent;
            box-shadow: none;
            gap: 0.5rem;
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
            padding-bottom: 1.5rem;
        }
    }

    /* Edit Actions */
    .edit-actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    @media (min-width: 640px) {
        .edit-actions {
            flex-direction: row;
            justify-content: end;
            margin-bottom: 1.5rem;
        }
    }

    .edit-actions button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
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
        background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 1.25rem;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
            #3b82f6 0%,
            #6366f1 50%,
            #8b5cf6 100%
        );
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .ability-card:hover,
    .skill-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
        border-color: #d1d5db;
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
        color: #111827;
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
        color: #374151;
        transition: color 0.2s ease;
    }

    .proficiency-checkbox:hover {
        color: #111827;
    }

    .proficiency-checkbox input[type="checkbox"] {
        width: auto;
        margin: 0;
        cursor: pointer;
        transform: scale(1.1);
        accent-color: #3b82f6;
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
        color: #374151;
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
        color: #6b7280;
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
        color: #374151;
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        padding: 0.375rem 0.75rem;
        border-radius: 8px;
        min-width: 3rem;
        text-align: center;
        border: 1px solid #cbd5e1;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        letter-spacing: -0.025em;
    }

    /* Badge Improvements */
    .srpg-badge {
        background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
        color: white;
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

    /* Custom group input */
    .custom-group-input {
        display: flex;
        gap: 0.5rem;
        align-items: stretch;
    }

    .custom-group-input input {
        flex: 1;
    }

    .custom-group-input button {
        flex-shrink: 0;
    }
 
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    } 

    .character-sheet-controls {
        position: relative;
    }
</style>
