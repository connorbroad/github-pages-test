<script lang="ts">
    import { type Character } from "../../data/storage-utils";
    import CharacterSheetSection from "./CharacterSheetSection.svelte";
    import InformationSection from "./character-sheet/InformationSection.svelte";
    import ExperienceSection from "./character-sheet/ExperienceSection.svelte";
    import HealthSection from "./character-sheet/HealthSection.svelte";
    import AbilitiesSection from "./character-sheet/AbilitiesSection.svelte";
    import ItemsSection from "./character-sheet/ItemsSection.svelte";
    import CombatSection from "./character-sheet/CombatSection.svelte";
    import CharacterSheetControls from "./CharacterSheetControls.svelte";
    import { isMobile } from "../../ui-utils";

    export let character: Character;
    export let isEditing: boolean = false;
    export let isEditingSections: boolean = false;
    export let selectedSections: Set<string> = new Set(); // For filtering visible sections
    export let onSave: (character: Character) => void = () => {};
    export let onRollCheck: (detail: any) => void = () => {};
    export let onToggleSection: (section: string) => void = () => {};

    let editingSection: string | null = null;

    let editedCharacter: Character = structuredClone(character);

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
        onSave(editedCharacter);
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
        <div
            class="relative flex w-full max-w-full flex-col pb-[60px] md:flex-row md:pr-2 md:pb-6 md:pl-2">
            <!-- Sidebar for Desktop -->
            {#if !$isMobile && characterVisibleSections.length > 1}
                <div class="hidden md:block">
                    <CharacterSheetControls
                        visibleSections={characterVisibleSections}
                        {selectedSections}
                        {isEditingSections}
                        {onToggleSection}
                        variant="sticky-sidebar" />
                </div>
            {/if}

            <div class="flex-1">
                <!-- Core Info Section -->
                {#if showInformation}
                    <CharacterSheetSection
                        id="section-information"
                        title="Information"
                        isEditing={isSectionEditing("information")}
                        showEditButton={!isEditing && !isEditingSections}
                        onEdit={() => startEditingSection("information")}
                        onSave={saveSection}
                        onCancel={cancelSectionEdit}>
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
                        onEdit={() => startEditingSection("experience")}
                        onSave={saveSection}
                        onCancel={cancelSectionEdit}>
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
                        onEdit={() => startEditingSection("health")}
                        onSave={saveSection}
                        onCancel={cancelSectionEdit}>
                        <HealthSection
                            {character}
                            {editedCharacter}
                            isEditable={isHealthEditable} />
                    </CharacterSheetSection>
                {/if}

                <!-- Abilities Section -->
                {#if showAbilities}
                    <CharacterSheetSection
                        id="section-abilities"
                        title="Abilities"
                        isEditing={isSectionEditing("abilities")}
                        showEditButton={!isEditing && !isEditingSections}
                        onEdit={() => startEditingSection("abilities")}
                        onSave={saveSection}
                        onCancel={cancelSectionEdit}>
                        <AbilitiesSection
                            {editedCharacter}
                            isEditable={isAbilitiesEditable}
                            {onRollCheck} />
                    </CharacterSheetSection>
                {/if}

                <!-- Items Section -->
                {#if showItems}
                    <CharacterSheetSection
                        id="section-items"
                        title="Inventory"
                        isEditing={isSectionEditing("items")}
                        showEditButton={!isEditing && !isEditingSections}
                        onEdit={() => startEditingSection("items")}
                        onSave={saveSection}
                        onCancel={cancelSectionEdit}>
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
                        onEdit={() => startEditingSection("combat")}
                        onSave={saveSection}
                        onCancel={cancelSectionEdit}>
                        <CombatSection
                            {character}
                            {editedCharacter}
                            isEditable={isCombatEditable}
                            {onRollCheck} />
                    </CharacterSheetSection>
                {/if}
            </div>
        </div>
    </div>

    <!-- Controls for Mobile - fixed bottom strip -->
    {#if $isMobile && characterVisibleSections.length > 1}
        <div class="mobile-controls-fixed">
            <CharacterSheetControls
                visibleSections={characterVisibleSections}
                {selectedSections}
                {isEditingSections}
                {onToggleSection}
                variant="fixed-strip" />
        </div>
    {/if}
</div>

<style>
    .mobile-controls-fixed {
        position: fixed;
        bottom: calc(70px + env(safe-area-inset-bottom));
        left: 0;
        right: 0;
        z-index: 20;
    }
</style>
