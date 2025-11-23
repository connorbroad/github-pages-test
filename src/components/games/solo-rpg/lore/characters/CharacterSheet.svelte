<script lang="ts">
    import type { Character } from "../../data/storage-utils";
    import { createEventDispatcher } from "svelte";
    import CharacterSheetSection from "./CharacterSheetSection.svelte";
    import { loadCharacters } from "../../data/storage-utils";
    import InformationSection from "./character-sheet/InformationSection.svelte";
    import ExperienceSection from "./character-sheet/ExperienceSection.svelte";
    import HealthSection from "./character-sheet/HealthSection.svelte";
    import AbilitiesSection from "./character-sheet/AbilitiesSection.svelte";
    import ItemsSection from "./character-sheet/ItemsSection.svelte";
    import CombatSection from "./character-sheet/CombatSection.svelte";

    export let character: Character;
    export let isEditing: boolean = false;
    export let isEditingSections: boolean = false;
    export let selectedSections: Set<string> = new Set(); // For filtering visible sections

    const dispatch = createEventDispatcher();

    let editingSection: string | null = null;

    let editedCharacter: Character = structuredClone(character);
    let showAbilityTemplateModal: boolean = false; // moved to AbilitiesSection
    let showSkillTemplateModal: boolean = false; // moved to AbilitiesSection

    // Keep editedCharacter in sync with character prop when not actively editing
    $: if (!isEditing && !editingSection) {
        editedCharacter = structuredClone(character);
        // Ensure currency and inventory are always present
        if (!editedCharacter.currency) {
            editedCharacter.currency = { gp: 0, sp: 0, cp: 0 };
        }
        if (!editedCharacter.inventory) {
            editedCharacter.inventory = [];
        }
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

    function cancelEdit() {
        editedCharacter = structuredClone(character);
        dispatch("cancel");
    }

    function toggleSectionInclusion(sectionId: string) {
        if (sectionId === "information") {
            alert("The Information section cannot be removed.");
            return;
        }

        if (!editedCharacter.visibleSections.includes("information")) {
            editedCharacter.visibleSections.push("information");
        }

        const isCurrentlyVisible = editedCharacter.visibleSections.includes(sectionId);

        if (isCurrentlyVisible) {
            editedCharacter.visibleSections = editedCharacter.visibleSections.filter(
                (s) => s !== sectionId
            );
        } else {
            editedCharacter.visibleSections = [...editedCharacter.visibleSections, sectionId];

            // Scroll to the newly enabled section after a brief delay to allow for rendering
            setTimeout(() => {
                const sectionElement = document.getElementById(`section-${sectionId}`);
                if (sectionElement) {
                    sectionElement.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    });
                }
            }, 100);
        }
    }

    // Reactive values for each section visibility
    $: characterVisibleSections = editedCharacter.visibleSections || ["information"];
    $: showInformation =
        characterVisibleSections.includes("information") &&
        (selectedSections.size === 0 || selectedSections.has("information") || isEditingSections);
    $: showExperience =
        characterVisibleSections.includes("experience") &&
        (selectedSections.size === 0 || selectedSections.has("experience") || isEditingSections);
    $: showHealth =
        characterVisibleSections.includes("health") &&
        (selectedSections.size === 0 || selectedSections.has("health") || isEditingSections);
    $: showAbilities =
        characterVisibleSections.includes("abilities") &&
        (selectedSections.size === 0 || selectedSections.has("abilities") || isEditingSections);
    $: showItems =
        characterVisibleSections.includes("items") &&
        (selectedSections.size === 0 || selectedSections.has("items") || isEditingSections);
    $: showCombat =
        characterVisibleSections.includes("combat") &&
        (selectedSections.size === 0 || selectedSections.has("combat") || isEditingSections);

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
    $: isItemsEditable = isEditing || isSectionEditing("items");
</script>

<div class="flex h-full flex-col overflow-hidden">
    <div class="min-h-0 flex-1 overflow-y-auto">
        <div class="relative w-screen max-w-full md:pr-2 md:pb-6 md:pl-2">
            <!-- Core Info Section -->
            {#if showInformation}
                <CharacterSheetSection
                    id="section-information"
                    title="Information"
                    isEditing={isSectionEditing("information")}
                    showEditButton={!isEditing && !isEditingSections}
                    on:edit={() => startEditingSection("information")}
                    on:save={saveSection}
                    on:cancel={cancelSectionEdit}>
                    <InformationSection
                        {character}
                        {editedCharacter}
                        isEditable={isInformationEditable} />
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
                    on:save={saveSection}
                    on:cancel={cancelSectionEdit}>
                    <ExperienceSection
                        {character}
                        {editedCharacter}
                        isEditable={isExperienceEditable} />
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
                    on:save={saveSection}
                    on:cancel={cancelSectionEdit}>
                    <HealthSection {character} {editedCharacter} isEditable={isHealthEditable} />
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
                    on:save={saveSection}
                    on:cancel={cancelSectionEdit}>
                    <AbilitiesSection
                        {editedCharacter}
                        isEditable={isAbilitiesEditable}
                        on:rollCheck={(e) => dispatch("rollCheck", e.detail)} />
                </CharacterSheetSection>
            {/if}

            <!-- Items Section -->
            {#if showItems}
                <CharacterSheetSection
                    id="section-items"
                    title="Inventory"
                    isEditing={isSectionEditing("items")}
                    showEditButton={!isEditing && !isEditingSections}
                    on:edit={() => startEditingSection("items")}
                    on:save={saveSection}
                    on:cancel={cancelSectionEdit}>
                    <ItemsSection
                        {character}
                        {editedCharacter}
                        isEditable={isItemsEditable}
                        {saveSection} />
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
                    on:save={saveSection}
                    on:cancel={cancelSectionEdit}>
                    <CombatSection
                        {character}
                        {editedCharacter}
                        isEditable={isCombatEditable}
                        on:rollCheck={(e) => dispatch("rollCheck", e.detail)} />
                </CharacterSheetSection>
            {/if}
        </div>
    </div>
</div>

<!-- (template modals moved into AbilitiesSection) -->

<style>
</style>
