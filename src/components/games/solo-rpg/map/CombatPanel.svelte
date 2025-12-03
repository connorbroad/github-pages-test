<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import {
        loadCharacters,
        loadMaps,
        saveMaps,
        saveCharacters,
        type Character,
        type CreatureRef,
        type InitiativeEntry,
    } from "../data/storage-utils";
    import { fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { rollInitiativeForCreature } from "./combat-utils";

    export let campaignId: string;
    export let mapId: string;

    // Selected creature (can be null if none selected yet)
    export let selectedCreature: {
        objectId: string;
        creatureRef: CreatureRef;
    } | null = null;

    // Initiative state passed from parent (persisted in MapView)
    export let initiativeOrder: InitiativeEntry[] = [];
    export let currentTurnIndex: number = 0;

    // Encounter state - whether an active encounter is in progress
    export let hasActiveEncounter: boolean = false;

    // Mobile panel resize state
    const PANEL_HEIGHT_KEY = "srpg-combat-panel-height";
    let panelHeightPercent = 50;
    let isDragging = false;
    let dragStartY = 0;
    let dragStartHeight = 0;

    const dispatch = createEventDispatcher<{
        selectCreature: { objectId: string; creatureRef: CreatureRef };
        focusCreature: { objectId: string };
        initiativeRolled: { order: InitiativeEntry[]; turnIndex: number };
        turnChanged: { turnIndex: number; order: InitiativeEntry[] };
        panelHeightChanged: { heightPercent: number };
        addToEncounter: { entry: InitiativeEntry };
    }>();

    // Computed: is the selected creature already in the encounter?
    $: isInEncounter = selectedCreature
        ? initiativeOrder.some((e) => e.objectId === selectedCreature.objectId)
        : false;

    // Detect if we're on mobile
    let isMobile = false;
    if (typeof window !== "undefined") {
        isMobile = window.innerWidth < 768;
        window.addEventListener("resize", () => {
            isMobile = window.innerWidth < 768;
        });
    }

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

    $: {
        if (selectedCreature?.creatureRef.type === "character") {
            const chars = loadCharacters().filter((c) => c.campaignId === campaignId);
            creatureData = chars.find((c) => c.id === selectedCreature.creatureRef.id) ?? null;
        } else {
            creatureData = null;
        }
    }

    function getCurrentHP(): number {
        if (!selectedCreature) return 0;
        if (selectedCreature.creatureRef.currentHitPoints !== undefined) {
            return selectedCreature.creatureRef.currentHitPoints;
        }
        if (creatureData) {
            return creatureData.currentHitPoints ?? creatureData.hitPointMaximum ?? 10;
        }
        return 10;
    }

    function getMaxHP(): number {
        if (creatureData) {
            return creatureData.hitPointMaximum ?? 10;
        }
        return 10;
    }

    $: currentHP = selectedCreature ? getCurrentHP() : 0;
    $: maxHP = selectedCreature ? getMaxHP() : 10;

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
        if (!obj.creatureRef) return;

        let hp = obj.creatureRef.currentHitPoints ?? currentHP;
        hp = Math.max(0, Math.min(maxHP, hp + amount));
        obj.creatureRef.currentHitPoints = hp;

        maps[mapIndex] = map;
        saveMaps(maps);

        // Also update the character's currentHitPoints to sync with CharacterSheet
        if (selectedCreature.creatureRef.type === "character") {
            const chars = loadCharacters();
            const charIndex = chars.findIndex((c) => c.id === selectedCreature.creatureRef.id);
            if (charIndex >= 0) {
                chars[charIndex].currentHitPoints = hp;
                chars[charIndex].updatedAt = Date.now();
                saveCharacters(chars);
            }
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
    }

    // Add creature to encounter
    function handleAddToEncounter() {
        if (!selectedCreature || !creatureData) return;

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
    }

    // Drag resize handlers for mobile panel
    function handleDragStart(e: PointerEvent) {
        isDragging = true;
        dragStartY = e.clientY;
        dragStartHeight = panelHeightPercent;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }

    function handleDragMove(e: PointerEvent) {
        if (!isDragging) return;

        const deltaY = dragStartY - e.clientY;
        const viewportHeight = window.innerHeight;
        const deltaPercent = (deltaY / viewportHeight) * 100;

        panelHeightPercent = Math.max(30, Math.min(70, dragStartHeight + deltaPercent));
    }

    function handleDragEnd(e: PointerEvent) {
        if (!isDragging) return;
        isDragging = false;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        savePanelHeight();
    }
</script>

<aside
    class="combat-panel"
    class:is-dragging={isDragging}
    style="--panel-height: {panelHeightPercent}%;"
    transition:fly={{
        duration: 300,
        easing: quintOut,
        x: isMobile ? 0 : -320,
        y: isMobile ? 300 : 0,
    }}>
    <!-- Mobile drag handle -->
    <div
        class="drag-handle md:hidden"
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

    <!-- Panel Content -->
    <div class="combat-panel-content">
        <!-- Selected Creature Section -->
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
                <div class="attacks-section">
                    <p class="attacks-placeholder">Weapon attacks coming soon</p>
                </div>

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
        z-index: 25;
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
        }
    }

    /* Desktop: Left side panel - after primary sidebar (80px) only, since secondary sidebar hides in combat mode */
    @media (min-width: 768px) {
        .combat-panel {
            top: 0;
            left: 80px; /* Just after primary sidebar */
            bottom: 44px; /* Above initiative bar */
            width: 320px;
            border-radius: 0;
            border-top: none;
            border-bottom: none;
            border-left: none;
        }
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
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        color: var(--text-muted);
        text-align: center;
        padding: 2rem;
    }

    .no-creature-selected svg {
        opacity: 0.5;
    }

    .no-creature-selected p {
        margin: 0;
        font-size: 0.875rem;
    }
</style>
