<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import {
        loadMaps,
        saveMaps,
        type Character,
        type CreatureRef,
        type InitiativeEntry,
        type QuickStats,
        type Ability,
        type Skill,
    } from "../data/storage-utils";
    import { characterStore } from "../data/character-store";
    import { fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { rollInitiativeForCreature } from "./combat-utils";
    import CollapsibleSection from "../shared/CollapsibleSection.svelte";
    import AbilityCard from "./AbilityCard.svelte";
    import SkillCard from "./SkillCard.svelte";
    import { adjustDiceRollForAdvantageOrDisadvantage } from "../lore/characters/character-sheet/dice-utils";

    export let campaignId: string;
    export let mapId: string;

    // Selected creature (can be null if none selected yet)
    // Now supports both assigned characters (creatureRef) and unassigned tokens (quickStats)
    export let selectedCreature: {
        objectId: string;
        creatureRef?: CreatureRef;
        quickStats?: QuickStats;
    } | null = null;

    // Initiative state passed from parent (persisted in MapView)
    export let initiativeOrder: InitiativeEntry[] = [];
    export let currentTurnIndex: number = 0;

    // Encounter state - whether an active encounter is in progress
    export let hasActiveEncounter: boolean = false;

    // Roll check callback (modern Svelte 5 pattern)
    export let onRollCheck: (detail: {
        checkName: string;
        diceFormula: string;
        modifier: number;
        resultOption: "Sum" | "Maximum" | "Minimum";
    }) => void = () => {};

    // Mobile panel resize state
    const PANEL_HEIGHT_KEY = "srpg-combat-panel-height";
    let panelHeightPercent = 50;
    let isDragging = false;
    let dragStartY = 0;
    let dragStartHeight = 0;

    // Collapsed state when no creature is selected (but not while dragging)
    const COLLAPSED_HEIGHT = 0; // percent for mobile, or fixed px for desktop
    $: isCollapsed = !selectedCreature && !isDragging;

    // Collapsible section state
    let abilitiesSectionOpen = false;
    let skillsSectionOpen = false;

    const dispatch = createEventDispatcher<{
        selectCreature: { objectId: string; creatureRef: CreatureRef };
        focusCreature: { objectId: string };
        initiativeRolled: { order: InitiativeEntry[]; turnIndex: number };
        turnChanged: { turnIndex: number; order: InitiativeEntry[] };
        panelHeightChanged: { heightPercent: number };
        panelDragStateChanged: { isDragging: boolean };
        addToEncounter: { entry: InitiativeEntry };
        quickStatsUpdate: { objectId: string; quickStats: QuickStats };
        convertToCharacter: { objectId: string; quickStats: QuickStats };
        openQuickStatsModal: { objectId: string; existingStats: QuickStats | null };
    }>();

    // Computed: is the selected creature already in the encounter?
    $: isInEncounter = selectedCreature
        ? initiativeOrder.some((e) => e.objectId === selectedCreature.objectId)
        : false;

    // Computed: is this an assigned character or an unassigned token?
    $: isAssignedCharacter = selectedCreature?.creatureRef !== undefined;
    $: isUnassignedToken = selectedCreature && !selectedCreature.creatureRef;
    $: hasQuickStats = selectedCreature?.quickStats?.name !== undefined;

    // Detect if we're on mobile
    import { isMobile } from "../ui-utils";

    onMount(() => {
        const savedHeight = localStorage.getItem(PANEL_HEIGHT_KEY);
        if (savedHeight) {
            panelHeightPercent = Math.max(30, Math.min(70, parseFloat(savedHeight)));
        }
        // Dispatch initial height for MapView to set CSS variable
        dispatch("panelHeightChanged", { heightPercent: panelHeightPercent });
    });

    function savePanelHeight() {
        localStorage.setItem(PANEL_HEIGHT_KEY, String(panelHeightPercent));
        dispatch("panelHeightChanged", { heightPercent: panelHeightPercent });
    }

    // Load creature data
    let creatureData: Character | null = null;

    // Reactive update from store
    $: if (selectedCreature?.creatureRef?.type === "character" && $characterStore) {
        creatureData =
            $characterStore.find((c) => c.id === selectedCreature!.creatureRef!.id) ?? null;
    } else {
        creatureData = null;
    }

    function getCurrentHP(): number {
        if (!selectedCreature) return 0;
        // For unassigned tokens, use quickStats
        if (!selectedCreature.creatureRef) {
            return selectedCreature.quickStats?.currentHitPoints ?? 10;
        }
        // Always prefer freshly loaded creatureData to avoid stale prop values
        if (creatureData) {
            return creatureData.currentHitPoints ?? creatureData.hitPointMaximum ?? 10;
        }
        // Fallback to prop value if creatureData not loaded yet
        if (selectedCreature.creatureRef.currentHitPoints !== undefined) {
            return selectedCreature.creatureRef.currentHitPoints;
        }
        return 10;
    }

    function getMaxHP(): number {
        // For unassigned tokens, use quickStats
        if (!selectedCreature?.creatureRef) {
            return selectedCreature?.quickStats?.maxHitPoints ?? 10;
        }
        if (creatureData) {
            return creatureData.hitPointMaximum ?? 10;
        }
        return 10;
    }

    // Re-compute HP when selectedCreature, creatureData, or hpRefreshCounter changes
    // Using void to establish dependency without lint warnings
    let currentHP = 0;
    let maxHP = 10;
    $: {
        void creatureData;
        currentHP = selectedCreature ? getCurrentHP() : 0;
    }
    $: {
        void creatureData;
        maxHP = selectedCreature ? getMaxHP() : 10;
    }

    // HP modification
    let quickHealAmount = 1;

    function modifyHP(amount: number) {
        if (!selectedCreature) return;

        const maps = loadMaps();
        const mapIndex = maps.findIndex((m) => m.id === mapId);
        if (mapIndex < 0) return;

        const map = maps[mapIndex];
        const objIndex = map.objects.findIndex((o) => o.id === selectedCreature.objectId);
        if (objIndex < 0) return;

        const obj = map.objects[objIndex];

        // Handle assigned character
        if (obj.creatureRef) {
            let hp = obj.creatureRef.currentHitPoints ?? currentHP;
            hp = Math.max(0, Math.min(maxHP, hp + amount));
            obj.creatureRef.currentHitPoints = hp;

            maps[mapIndex] = map;
            saveMaps(maps);

            // Also update the character's currentHitPoints via store
            if (selectedCreature.creatureRef?.type === "character" && creatureData) {
                characterStore.updateCharacter({
                    ...creatureData,
                    currentHitPoints: hp,
                    updatedAt: Date.now(),
                });
            }

            // Update initiative order HP as well
            const initIndex = initiativeOrder.findIndex(
                (e) => e.objectId === selectedCreature.objectId
            );
            if (initIndex >= 0) {
                const newOrder = [...initiativeOrder];
                newOrder[initIndex] = { ...newOrder[initIndex], currentHP: hp };
                dispatch("turnChanged", { turnIndex: currentTurnIndex, order: newOrder });
            }
        } else {
            // Handle unassigned token with quickStats
            const currentQS = obj.quickStats ?? { currentHitPoints: 10, maxHitPoints: 10 };
            let hp = currentQS.currentHitPoints ?? 10;
            const max = currentQS.maxHitPoints ?? 10;
            hp = Math.max(0, Math.min(max, hp + amount));
            obj.quickStats = { ...currentQS, currentHitPoints: hp };

            maps[mapIndex] = map;
            saveMaps(maps);

            // Dispatch update so parent can update local state
            dispatch("quickStatsUpdate", {
                objectId: selectedCreature.objectId,
                quickStats: obj.quickStats,
            });

            // Update initiative order HP as well
            const initIndex = initiativeOrder.findIndex(
                (e) => e.objectId === selectedCreature.objectId
            );
            if (initIndex >= 0) {
                const newOrder = [...initiativeOrder];
                newOrder[initIndex] = { ...newOrder[initIndex], currentHP: hp };
                dispatch("turnChanged", { turnIndex: currentTurnIndex, order: newOrder });
            }
        }
    }

    function handleConvertToCharacter() {
        if (!selectedCreature || selectedCreature.creatureRef) return;
        if (!selectedCreature.quickStats?.name) return; // Name is required

        dispatch("convertToCharacter", {
            objectId: selectedCreature.objectId,
            quickStats: selectedCreature.quickStats,
        });
    }

    function handleOpenQuickStatsModal() {
        if (!selectedCreature || selectedCreature.creatureRef) return;
        dispatch("openQuickStatsModal", {
            objectId: selectedCreature.objectId,
            existingStats: selectedCreature.quickStats ?? null,
        });
    }

    // Add creature to encounter
    function handleAddToEncounter() {
        if (!selectedCreature) return;

        // For assigned characters
        if (selectedCreature.creatureRef && creatureData) {
            const initMod = creatureData.initiative ?? 0;
            const hp = getCurrentHP();
            const maxHp = getMaxHP();

            const entry = rollInitiativeForCreature(
                selectedCreature.objectId,
                creatureData.name,
                initMod,
                hp,
                maxHp
            );

            dispatch("addToEncounter", { entry });
            return;
        }

        // For unassigned tokens with quickStats
        if (!selectedCreature.creatureRef) {
            const qs = selectedCreature.quickStats;
            const name = qs?.name || "Unknown";
            const hp = qs?.currentHitPoints ?? 10;
            const maxHp = qs?.maxHitPoints ?? 10;

            const entry = rollInitiativeForCreature(
                selectedCreature.objectId,
                name,
                0, // No initiative modifier for quick stats tokens
                hp,
                maxHp
            );

            dispatch("addToEncounter", { entry });
        }
    }

    // Roll check handlers for abilities and skills
    function handleAbilityRoll(ability: Ability, resultOption: "Sum" | "Maximum" | "Minimum") {
        if (!creatureData) return;
        const formula = creatureData.abilityCheckDice || "1d20";
        const adjusted = adjustDiceRollForAdvantageOrDisadvantage(formula, resultOption);
        onRollCheck({
            checkName: ability.name,
            diceFormula: adjusted,
            modifier: ability.modifier,
            resultOption,
        });
    }

    function handleSkillRoll(skill: Skill, resultOption: "Sum" | "Maximum" | "Minimum") {
        if (!creatureData) return;
        const formula = creatureData.skillCheckDice || "1d20";
        const adjusted = adjustDiceRollForAdvantageOrDisadvantage(formula, resultOption);
        onRollCheck({
            checkName: skill.name,
            diceFormula: adjusted,
            modifier: skill.bonus,
            resultOption,
        });
    }

    function getAbilityName(abilityId: string): string {
        if (!creatureData) return "Unknown";
        const ability = creatureData.abilities?.find((a) => a.id === abilityId);
        return ability ? ability.name : "Unknown";
    }

    // Drag resize handlers for mobile panel
    function handleDragStart(e: PointerEvent) {
        isDragging = true;
        dragStartY = e.clientY;
        // When collapsed, use the collapsed height as base for dragging
        dragStartHeight = isCollapsed ? COLLAPSED_HEIGHT : panelHeightPercent;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        dispatch("panelDragStateChanged", { isDragging: true });
    }

    function handleDragMove(e: PointerEvent) {
        if (!isDragging) return;

        const deltaY = dragStartY - e.clientY;
        const viewportHeight = window.innerHeight;
        const deltaPercent = (deltaY / viewportHeight) * 100;

        // Update the saved height even when collapsed, so user can pre-size
        panelHeightPercent = Math.max(30, Math.min(70, dragStartHeight + deltaPercent));
        // Dispatch during drag for real-time map adjustment
        dispatch("panelHeightChanged", { heightPercent: panelHeightPercent });
    }

    function handleDragEnd(e: PointerEvent) {
        if (!isDragging) return;
        isDragging = false;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        savePanelHeight();
        dispatch("panelDragStateChanged", { isDragging: false });
    }
</script>

<aside
    class="combat-panel"
    class:is-dragging={isDragging}
    class:is-collapsed={isCollapsed}
    style="--panel-height: {panelHeightPercent}%; --collapsed-height: {COLLAPSED_HEIGHT}%;"
    transition:fly={{
        duration: 300,
        easing: quintOut,
        x: $isMobile ? 0 : -320,
        y: $isMobile ? 300 : 0,
    }}>
    <!-- Mobile drag handle (only rendered on mobile) -->
    {#if $isMobile}
        <div
            class="drag-handle"
            on:pointerdown={handleDragStart}
            on:pointermove={handleDragMove}
            on:pointerup={handleDragEnd}
            on:pointercancel={handleDragEnd}
            role="slider"
            aria-label="Resize combat panel"
            aria-valuemin={30}
            aria-valuemax={70}
            aria-valuenow={Math.round(panelHeightPercent)}
            tabindex="0">
            <div class="drag-indicator"></div>
        </div>
    {/if}

    <!-- Panel Content -->
    <div class="combat-panel-content">
        <!-- Assigned Character Section -->
        {#if selectedCreature && creatureData}
            <section class="creature-section">
                <h2 class="creature-name">{creatureData.name}</h2>

                <!-- HP Bar -->
                <div class="hp-section">
                    <div class="hp-header">
                        <span class="hp-label">Hit Points</span>
                        <span class="hp-value">{currentHP} / {maxHP}</span>
                    </div>
                    <div class="hp-bar-bg">
                        <div
                            class="hp-bar-fill"
                            style="width: {Math.max(0, Math.min(100, (currentHP / maxHP) * 100))}%;
                                   --hp-color: {currentHP / maxHP > 0.5
                                ? 'var(--accent-success)'
                                : currentHP / maxHP > 0.25
                                  ? 'var(--accent-warning)'
                                  : 'var(--accent-danger)'};">
                        </div>
                    </div>

                    <!-- Quick HP Controls -->
                    <div class="hp-controls">
                        <button
                            class="hp-btn hp-btn-damage"
                            on:click={() => modifyHP(-quickHealAmount)}>
                            <svg
                                viewBox="0 0 24 24"
                                width="16"
                                height="16"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            {quickHealAmount}
                        </button>
                        <input
                            type="number"
                            class="hp-input"
                            bind:value={quickHealAmount}
                            min="1"
                            max="999" />
                        <button
                            class="hp-btn hp-btn-heal"
                            on:click={() => modifyHP(quickHealAmount)}>
                            <svg
                                viewBox="0 0 24 24"
                                width="16"
                                height="16"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            {quickHealAmount}
                        </button>
                    </div>
                </div>

                <!-- Attacks placeholder -->
                <div class="attacks-section"></div>

                <!-- Abilities Section -->
                {#if creatureData.abilities?.length > 0}
                    <CollapsibleSection
                        title="Abilities"
                        isOpen={abilitiesSectionOpen}
                        badgeCount={creatureData.abilities.length}
                        onToggle={() => (abilitiesSectionOpen = !abilitiesSectionOpen)}>
                        <div class="grid grid-cols-1 gap-3 p-3">
                            {#each creatureData.abilities as ability}
                                <AbilityCard
                                    {ability}
                                    diceFormula={creatureData.abilityCheckDice || "1d20"}
                                    onRoll={(resultOption) =>
                                        handleAbilityRoll(ability, resultOption)} />
                            {/each}
                        </div>
                    </CollapsibleSection>
                {/if}

                <!-- Skills Section -->
                {#if creatureData.skills?.length > 0}
                    <CollapsibleSection
                        title="Skills"
                        isOpen={skillsSectionOpen}
                        badgeCount={creatureData.skills.length}
                        onToggle={() => (skillsSectionOpen = !skillsSectionOpen)}>
                        <div class="grid grid-cols-1 gap-3 p-3">
                            {#each creatureData.skills as skill}
                                <SkillCard
                                    {skill}
                                    abilityName={getAbilityName(skill.abilityId)}
                                    diceFormula={creatureData.skillCheckDice || "1d20"}
                                    onRoll={(resultOption) =>
                                        handleSkillRoll(skill, resultOption)} />
                            {/each}
                        </div>
                    </CollapsibleSection>
                {/if}

                <!-- Add to Encounter button -->
                {#if hasActiveEncounter && !isInEncounter}
                    <button class="add-to-encounter-btn" on:click={handleAddToEncounter}>
                        <svg
                            viewBox="0 0 24 24"
                            width="18"
                            height="18"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            aria-hidden="true">
                            <path d="M12 5v14M5 12h14"></path>
                        </svg>
                        Add to Encounter
                    </button>
                {/if}
            </section>
            <!-- Unassigned Token Section (Quick Stats) -->
        {:else if selectedCreature && !selectedCreature.creatureRef}
            <section class="creature-section">
                {#if hasQuickStats}
                    <!-- Token has quick stats - show name, HP, and edit button -->
                    <div class="quick-stats-header">
                        <h2 class="creature-name">{selectedCreature.quickStats?.name}</h2>
                        <button
                            class="edit-stats-btn"
                            on:click={handleOpenQuickStatsModal}
                            title="Edit stats"
                            aria-label="Edit stats">
                            <svg
                                viewBox="0 0 24 24"
                                width="16"
                                height="16"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2">
                                <path
                                    d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7">
                                </path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z">
                                </path>
                            </svg>
                        </button>
                    </div>

                    <!-- HP Section (only if tracking HP) -->
                    {#if selectedCreature.quickStats?.maxHitPoints !== undefined}
                        {@const qs = selectedCreature.quickStats}
                        {@const qsCurrentHP = qs.currentHitPoints ?? 0}
                        {@const qsMaxHP = qs.maxHitPoints ?? 10}
                        <div class="hp-section">
                            <div class="hp-header">
                                <span class="hp-label">Hit Points</span>
                                <span class="hp-value">{qsCurrentHP} / {qsMaxHP}</span>
                            </div>
                            <div class="hp-bar-bg">
                                <div
                                    class="hp-bar-fill"
                                    style="width: {Math.max(
                                        0,
                                        Math.min(100, (qsCurrentHP / qsMaxHP) * 100)
                                    )}%;
                                           --hp-color: {qsCurrentHP / qsMaxHP > 0.5
                                        ? 'var(--accent-success)'
                                        : qsCurrentHP / qsMaxHP > 0.25
                                          ? 'var(--accent-warning)'
                                          : 'var(--accent-danger)'};">
                                </div>
                            </div>

                            <!-- Quick HP Controls -->
                            <div class="hp-controls">
                                <button
                                    class="hp-btn hp-btn-damage"
                                    on:click={() => modifyHP(-quickHealAmount)}>
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="16"
                                        height="16"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2">
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                    {quickHealAmount}
                                </button>
                                <input
                                    type="number"
                                    class="hp-input"
                                    bind:value={quickHealAmount}
                                    min="1"
                                    max="999" />
                                <button
                                    class="hp-btn hp-btn-heal"
                                    on:click={() => modifyHP(quickHealAmount)}>
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="16"
                                        height="16"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2">
                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                    {quickHealAmount}
                                </button>
                            </div>
                        </div>
                    {/if}

                    <!-- Add to Encounter button -->
                    {#if hasActiveEncounter && !isInEncounter}
                        <button class="add-to-encounter-btn" on:click={handleAddToEncounter}>
                            <svg
                                viewBox="0 0 24 24"
                                width="18"
                                height="18"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                aria-hidden="true">
                                <path d="M12 5v14M5 12h14"></path>
                            </svg>
                            Add to Encounter
                        </button>
                    {/if}

                    <!-- Save as Character button -->
                    <button
                        class="save-as-character-btn"
                        on:click={handleConvertToCharacter}
                        title="Convert to a full character">
                        <svg
                            viewBox="0 0 24 24"
                            width="14"
                            height="14"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            aria-hidden="true">
                            <path
                                d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z">
                            </path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        Save as Character
                    </button>
                {:else}
                    <!-- Token has no quick stats - show Add Stats button -->
                    <div class="no-stats-section">
                        <p class="no-stats-text">This token has no stats assigned.</p>
                        <button class="add-stats-btn" on:click={handleOpenQuickStatsModal}>
                            <svg
                                viewBox="0 0 24 24"
                                width="18"
                                height="18"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                aria-hidden="true">
                                <path d="M12 5v14M5 12h14"></path>
                            </svg>
                            Add Stats
                        </button>
                    </div>
                {/if}
            </section>
        {:else}
            <div class="no-creature-selected">
                <svg
                    viewBox="0 0 24 24"
                    width="32"
                    height="32"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    aria-hidden="true">
                    <circle cx="12" cy="8" r="4"></circle>
                    <path d="M4 20c0-4 4-6 8-6s8 2 8 6"></path>
                </svg>
                <p>Select a creature to view details</p>
            </div>
        {/if}
    </div>
</aside>

<style>
    /* Combat Panel - responsive positioning */
    .combat-panel {
        position: fixed;
        z-index: 30; /* Below SecondarySidebar (z-40) */
        background: var(--bg-elevated);
        border: 1px solid var(--border-primary);
        box-shadow: var(--shadow-lg);
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    /* Mobile: Bottom panel - above primary sidebar (70px) + initiative bar (48px) */
    @media (max-width: 767px) {
        .combat-panel {
            bottom: calc(70px + 48px + env(safe-area-inset-bottom));
            left: 0;
            right: 0;
            height: var(--panel-height);
            border-radius: 16px 16px 0 0;
            border-bottom: none;
            /* Animate height changes for select/deselect */
            transition: height 0.25s ease-out;
        }

        .combat-panel.is-collapsed {
            height: var(--collapsed-height);
        }

        /* Disable transitions during drag for instant feedback */
        .combat-panel.is-dragging {
            transition: none !important;
        }
    }

    /* Desktop: Left side panel - after primary sidebar only (80px), below map header (48px) */
    @media (min-width: 768px) {
        .combat-panel {
            top: 48px; /* Below map header nav bar */
            left: 80px; /* After primary sidebar only */
            bottom: 0; /* Initiative bar floats - panel extends to bottom */
            width: 320px;
            border-radius: 0;
            border-top: none;
            border-bottom: none;
            border-left: none;
            /* Animate width changes for select/deselect */
            transition: width 0.25s ease-out;
        }

        .combat-panel.is-collapsed {
            width: 80px;
        }

        /* Disable transitions during drag for instant feedback */
        .combat-panel.is-dragging {
            transition: none !important;
        }

        /* Drag handle is hidden on desktop via md:hidden utility in template */
    }

    /* Drag handle for mobile resize */
    .drag-handle {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 24px;
        cursor: ns-resize;
        touch-action: none;
        background: var(--bg-primary);
        border-bottom: 1px solid var(--border-primary);
        flex-shrink: 0;
    }

    .drag-handle:hover,
    .drag-handle:active {
        background: var(--bg-tertiary);
    }

    .drag-indicator {
        width: 40px;
        height: 4px;
        background: var(--border-secondary);
        border-radius: 2px;
        transition: background-color 0.15s ease;
    }

    .drag-handle:hover .drag-indicator,
    .drag-handle:active .drag-indicator {
        background: var(--accent-primary);
    }

    .combat-panel.is-dragging {
        user-select: none;
    }

    .combat-panel.is-dragging .drag-indicator {
        background: var(--accent-primary);
    }

    /* Panel Content */
    .combat-panel-content {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    /* Creature Section */
    .creature-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .creature-name {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid var(--border-primary);
    }

    /* HP Section */
    .hp-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .hp-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .hp-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
    }

    .hp-value {
        font-size: 1rem;
        font-weight: 700;
        color: var(--text-primary);
    }

    .hp-bar-bg {
        height: 12px;
        background: var(--bg-tertiary);
        border-radius: 6px;
        overflow: hidden;
    }

    .hp-bar-fill {
        height: 100%;
        background: var(--hp-color, var(--accent-success));
        border-radius: 6px;
        transition:
            width 0.3s ease,
            background-color 0.3s ease;
    }

    .hp-controls {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    .hp-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.375rem;
        padding: 0.5rem;
        border: none;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .hp-btn-damage {
        background: var(--accent-danger);
        color: white;
    }

    .hp-btn-damage:hover {
        background: var(--accent-danger-hover);
    }

    .hp-btn-heal {
        background: var(--accent-success);
        color: white;
    }

    .hp-btn-heal:hover {
        background: var(--accent-success-hover);
    }

    .hp-input {
        width: 60px;
        padding: 0.5rem;
        text-align: center;
        border: 1px solid var(--input-border);
        border-radius: 6px;
        background: var(--input-bg);
        color: var(--input-text);
        font-size: 0.875rem;
        font-weight: 600;
    }

    .hp-input:focus {
        outline: none;
        border-color: var(--accent-primary);
    }

    /* Attacks Section */
    .attacks-section {
        padding: 1rem;
        background: var(--bg-secondary);
        border-radius: 8px;
    }

    .attacks-placeholder {
        text-align: center;
        color: var(--text-muted);
        font-size: 0.875rem;
        font-style: italic;
        margin: 0;
    }

    /* Add to Encounter Button */
    .add-to-encounter-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0.75rem 1rem;
        background: var(--accent-info);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 0.9375rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .add-to-encounter-btn:hover {
        background: var(--accent-info-hover, #0ea5e9);
        transform: translateY(-1px);
    }

    .add-to-encounter-btn:active {
        transform: translateY(0);
    }

    /* No Creature Selected */
    .no-creature-selected {
        flex: 1;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        color: var(--text-muted);
        text-align: center;
        transition: opacity 0.2s ease;
    }

    .no-creature-selected svg {
        opacity: 0.5;
    }

    .no-creature-selected p {
        margin: 0;
        font-size: 0.875rem;
    }

    /* Hide text on desktop when collapsed */
    @media (min-width: 768px) {
        .is-collapsed .no-creature-selected p {
            display: none;
        }

        .is-collapsed .no-creature-selected {
            padding: 0.5rem;
            gap: 0;
        }
    }

    /* Mobile collapsed state - minimal padding */
    @media (max-width: 767px) {
        .is-collapsed .no-creature-selected {
            padding: 0.5rem;
            gap: 0.25rem;
        }

        .is-collapsed .no-creature-selected svg {
            width: 24px;
            height: 24px;
        }

        .is-collapsed .no-creature-selected p {
            font-size: 0.75rem;
        }
    }

    /* Save as Character button */
    .save-as-character-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.375rem;
        width: 100%;
        padding: 0.5rem 0.75rem;
        background: transparent;
        color: var(--text-secondary);
        border: 1px dashed var(--border-secondary);
        border-radius: 6px;
        font-size: 0.8125rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
        margin-top: 0.5rem;
    }

    .save-as-character-btn:hover:not(:disabled) {
        color: var(--accent-primary);
        border-color: var(--accent-primary);
        background: var(--bg-secondary);
    }

    .save-as-character-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    /* Quick Stats Header with Edit button */
    .quick-stats-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
    }

    .edit-stats-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.375rem;
        background: transparent;
        color: var(--text-secondary);
        border: 1px solid var(--border-secondary);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .edit-stats-btn:hover {
        color: var(--accent-primary);
        border-color: var(--accent-primary);
        background: var(--bg-secondary);
    }

    /* No Stats section */
    .no-stats-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 1.5rem 1rem;
        text-align: center;
    }

    .no-stats-text {
        color: var(--text-secondary);
        font-size: 0.875rem;
        margin: 0;
    }

    .add-stats-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.625rem 1.25rem;
        background: var(--accent-primary);
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.15s ease;
    }

    .add-stats-btn:hover {
        background: var(--accent-primary-hover);
    }
</style>
