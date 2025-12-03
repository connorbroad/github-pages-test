<script lang="ts">
    import { onMount, createEventDispatcher } from "svelte";
    import { activeCampaign } from "../game-management/campaign-store";
    import NoCampaignOverlay from "../NoCampaignOverlay.svelte";
    import FloatingOracleButton from "../shared/FloatingOracleButton.svelte";
    import { generateId } from "../oracle/scripts/oracleTypes";
    import {
        loadMapsByCampaign,
        saveMaps,
        loadMaps,
        saveActiveMapId,
        loadActiveMapId,
        loadCharacters,
        type MapEntity,
        type CreatureRef,
        type InitiativeEntry,
    } from "../data/storage-utils";
    import MapLanding from "./MapLanding.svelte";
    import MapEditor from "./MapEditor.svelte";
    import CombatPanel from "./CombatPanel.svelte";
    import InitiativeBar from "./InitiativeBar.svelte";
    import EncounterSetupModal from "./EncounterSetupModal.svelte";
    import SecondarySidebar from "../SecondarySidebar.svelte";
    import TertiarySidebar from "../TertiarySidebar.svelte";
    import {
        rollInitiativeForCreatures,
        getNextTurnIndex,
        getPrevTurnIndex,
        insertCreatureAtIndex,
        rollInitiativeForCreature,
        type CreatureInitiativeInput,
    } from "./combat-utils";
    import "../solo-rpg-styles.css";

    const dispatch = createEventDispatcher();

    let currentMapId: string | null = null;
    let maps: MapEntity[] = [];

    // Initiative state (persisted per map)
    let initiativeOrder: InitiativeEntry[] = [];
    let currentTurnIndex: number = 0;
    let hasActiveEncounter: boolean = false;
    let pendingNextObjectId: string | undefined = undefined;

    // Encounter setup modal state
    let showEncounterSetup = false;

    function handleNavigateHome() {
        dispatch("navigateHome");
    }

    $: campaignId = $activeCampaign?.id;

    onMount(() => {
        if (campaignId) {
            maps = loadMapsByCampaign(campaignId);
            const activeMapId = loadActiveMapId();
            // Validate that the active map belongs to the current campaign
            if (activeMapId && maps.some((m) => m.id === activeMapId)) {
                currentMapId = activeMapId;
                // Load combat state for this map
                loadCombatState(activeMapId);
            } else {
                currentMapId = null;
                saveActiveMapId(null);
            }
        }
    });

    // Load combat state from map entity
    function loadCombatState(mapId: string) {
        const allMaps = loadMaps();
        const map = allMaps.find((m) => m.id === mapId);
        if (map?.combatState) {
            initiativeOrder = map.combatState.initiativeOrder;
            currentTurnIndex = map.combatState.currentTurnIndex;
            hasActiveEncounter = map.combatState.hasActiveEncounter ?? false;
            pendingNextObjectId = map.combatState.pendingNextObjectId;
        } else {
            initiativeOrder = [];
            currentTurnIndex = 0;
            hasActiveEncounter = false;
            pendingNextObjectId = undefined;
        }
    }

    // Save combat state to map entity
    function saveCombatState() {
        if (!currentMapId) return;
        const allMaps = loadMaps();
        const mapIndex = allMaps.findIndex((m) => m.id === currentMapId);
        if (mapIndex < 0) return;

        allMaps[mapIndex].combatState = {
            initiativeOrder,
            currentTurnIndex,
            hasActiveEncounter,
            pendingNextObjectId,
        };
        allMaps[mapIndex].updatedAt = Date.now();
        saveMaps(allMaps);
    }

    // Refresh maps when campaign changes and validate active map
    $: if (campaignId) {
        maps = loadMapsByCampaign(campaignId);
        // If there's a current map open, verify it belongs to this campaign
        if (currentMapId) {
            const mapBelongsToCampaign = maps.some((m) => m.id === currentMapId);
            if (!mapBelongsToCampaign) {
                currentMapId = null;
                saveActiveMapId(null);
            }
        }
    }

    function createMap(e: CustomEvent<{ name: string }>) {
        if (!campaignId) return;
        const now = Date.now();
        const newMap: MapEntity = {
            id: generateId(),
            campaignId,
            name: e.detail.name,
            createdAt: now,
            updatedAt: now,
            width: 100,
            height: 100,
            tileSize: 32,
            background: {},
            objects: [],
            view: { x: 0, y: 0, zoom: 1 },
        };
        const all = loadMaps();
        all.push(newMap);
        saveMaps(all);
        maps = loadMapsByCampaign(campaignId);
    }

    function openMap(e: CustomEvent<{ id: string }>) {
        currentMapId = e.detail.id;
        saveActiveMapId(currentMapId);
        // Load combat state for this map
        loadCombatState(e.detail.id);
    }

    function closeMap() {
        currentMapId = null;
        saveActiveMapId(null);
        // Reset initiative state
        initiativeOrder = [];
        currentTurnIndex = 0;
        hasActiveEncounter = false;
        pendingNextObjectId = undefined;
        showEncounterSetup = false;
    }

    function renameMap(e: CustomEvent<{ id: string; name: string }>) {
        const { id, name } = e.detail;
        const all = loadMaps();
        const idx = all.findIndex((m) => m.id === id);
        if (idx >= 0) {
            all[idx] = { ...all[idx], name, updatedAt: Date.now() };
            saveMaps(all);
            if (campaignId) maps = loadMapsByCampaign(campaignId);
        }
    }

    function deleteMap(e: CustomEvent<{ id: string }>) {
        const { id } = e.detail;
        const all = loadMaps().filter((m) => m.id !== id);
        saveMaps(all);
        if (currentMapId === id) {
            currentMapId = null;
            saveActiveMapId(null);
        }
        if (campaignId) maps = loadMapsByCampaign(campaignId);
    }

    function updateMap(e: CustomEvent<{ id: string; changes: Partial<MapEntity> }>) {
        const { id, changes } = e.detail;
        const all = loadMaps();
        const idx = all.findIndex((m) => m.id === id);
        if (idx >= 0) {
            all[idx] = { ...all[idx], ...changes, updatedAt: Date.now() };
            saveMaps(all);
            if (campaignId) maps = loadMapsByCampaign(campaignId);
        }
    }

    // Editor UI state routed to sidebars
    let tool: "paint" | "object" | "move" = "move";
    let currentShape: "square" | "circle" | "triangle" | "star" = "square";
    let color = "#2980b9";
    // Selected tile reference for map tools
    let selectedTileRef: { tileMapId: string; tileId: string } | null = null;

    // Map mode: edit (normal editing) or combat (battle mode)
    let mapMode: "edit" | "combat" = "edit";

    // Track sidebar visibility for smooth animations
    let showSecondarySidebar = false;
    let showTertiarySidebar = false;

    // Detect if we're on mobile
    let isMobile = false;
    if (typeof window !== "undefined") {
        isMobile = window.innerWidth < 768;
        window.addEventListener("resize", () => {
            isMobile = window.innerWidth < 768;
        });
    }

    // Reactive statement to show sidebars when a map is opened
    // In combat mode, hide the secondary sidebar to make room for combat panel
    $: if (currentMapId) {
        // Small delay to ensure DOM is ready and transition can play
        setTimeout(() => {
            showSecondarySidebar = mapMode !== "combat";
        }, 10);
    } else {
        showSecondarySidebar = false;
        showTertiarySidebar = false;
    }

    // Also update when mode changes
    $: if (currentMapId) {
        showSecondarySidebar = mapMode !== "combat";
    }

    // Editor selection state for Move tool controls
    let moveHasSelection = false;
    let moveSelectedColor: string | null = null;
    let moveCanFlip = false;
    let moveSelectedCreatureRef: CreatureRef | null = null;
    let moveSelectedObjectId: string | null = null;

    // Reference to MapEditor to call exported methods
    let editorRef: any;

    function handleEditorSelectionChange(
        e: CustomEvent<{
            selected: boolean;
            object: {
                id: string;
                color: string;
                canFlip: boolean;
                creatureRef: CreatureRef | null;
            } | null;
        }>
    ) {
        moveHasSelection = !!e.detail?.selected;
        moveSelectedColor = e.detail?.object?.color ?? null;
        moveCanFlip = !!e.detail?.object?.canFlip;
        moveSelectedCreatureRef = e.detail?.object?.creatureRef ?? null;
        moveSelectedObjectId = e.detail?.object?.id ?? null;
    }

    function handleMoveColorChange(e: CustomEvent<string>) {
        editorRef?.setSelectedObjectColor?.(e.detail);
        moveSelectedColor = e.detail;
    }
    function handleMoveFlip() {
        editorRef?.flipSelectedObject?.();
    }
    function handleMoveDelete() {
        editorRef?.deleteSelectedObject?.();
    }
    function handleCreatureAssign(e: CustomEvent<CreatureRef | null>) {
        editorRef?.setSelectedObjectCreature?.(e.detail);
        moveSelectedCreatureRef = e.detail;
    }

    // Update tertiary sidebar visibility based on tool and mode
    $: if (currentMapId) {
        // In combat mode, hide tertiary sidebar (combat panel shows instead)
        if (mapMode === "combat") {
            showTertiarySidebar = false;
        } else {
            showTertiarySidebar =
                tool === "paint" || tool === "object" || (tool === "move" && moveHasSelection);
        }
    }

    // Combat mode state - no longer need creature selection for panel visibility
    let combatSelectedCreature: {
        objectId: string;
        creatureRef: CreatureRef;
    } | null = null;

    function handleCombatCreatureSelect(
        e: CustomEvent<{ objectId: string; creatureRef: CreatureRef }>
    ) {
        // In combat mode, clicking a creature switches to their turn
        combatSelectedCreature = e.detail;

        // Find this creature in initiative order and set them as current turn
        const index = initiativeOrder.findIndex((entry) => entry.objectId === e.detail.objectId);
        if (index >= 0 && index !== currentTurnIndex) {
            const newOrder = initiativeOrder.map((entry, i) => ({
                ...entry,
                isActive: i === index,
            }));
            currentTurnIndex = index;
            initiativeOrder = newOrder;
            saveCombatState();
        }
    }

    function handleCombatSelectCreature(
        e: CustomEvent<{ objectId: string; creatureRef: CreatureRef }>
    ) {
        // Switch which creature is displayed in the combat panel
        combatSelectedCreature = e.detail;
    }

    function handleCombatFocusCreature(e: CustomEvent<{ objectId: string }>) {
        // Center map on the creature's object
        editorRef?.centerOnObject?.(e.detail.objectId);
    }

    function handleInitiativeRolled(
        e: CustomEvent<{ order: InitiativeEntry[]; turnIndex: number }>
    ) {
        initiativeOrder = e.detail.order;
        currentTurnIndex = e.detail.turnIndex;
        saveCombatState();

        // Auto-select the first creature in initiative order and focus on them
        if (e.detail.order.length > 0) {
            const firstEntry = e.detail.order[e.detail.turnIndex];
            selectCreatureByObjectId(firstEntry.objectId);
            // Center the map on the first creature
            editorRef?.centerOnObject?.(firstEntry.objectId);
        }
    }

    function selectCreatureByObjectId(objectId: string) {
        const allMaps = loadMaps();
        const map = allMaps.find((m) => m.id === currentMapId);
        if (!map) return;

        const obj = map.objects.find((o) => o.id === objectId);
        if (obj?.creatureRef) {
            combatSelectedCreature = {
                objectId: obj.id,
                creatureRef: obj.creatureRef,
            };
        }
    }

    function handleTurnChanged(e: CustomEvent<{ turnIndex: number; order: InitiativeEntry[] }>) {
        currentTurnIndex = e.detail.turnIndex;
        initiativeOrder = e.detail.order;
        saveCombatState();

        // Auto-select the creature whose turn it is and focus on them
        const currentEntry = e.detail.order[e.detail.turnIndex];
        if (currentEntry) {
            selectCreatureByObjectId(currentEntry.objectId);
            // Center the map on this creature
            editorRef?.centerOnObject?.(currentEntry.objectId);
        }
    }

    // ====== Initiative Bar Event Handlers ======

    function handleOpenEncounterSetup() {
        showEncounterSetup = true;
    }

    function handleBeginEncounter(e: CustomEvent<{ selectedObjectIds: string[] }>) {
        showEncounterSetup = false;
        if (!currentMapId || !campaignId) return;

        const allMaps = loadMaps();
        const map = allMaps.find((m) => m.id === currentMapId);
        if (!map) return;

        const chars = loadCharacters().filter((c) => c.campaignId === campaignId);

        // Build creature inputs for selected objects
        const creatureInputs: CreatureInitiativeInput[] = [];
        for (const objectId of e.detail.selectedObjectIds) {
            const obj = map.objects.find((o) => o.id === objectId);
            if (!obj?.creatureRef) continue;

            const ref = obj.creatureRef;
            if (ref.type === "character") {
                const char = chars.find((c) => c.id === ref.id);
                if (char) {
                    const maxHp = char.hitPointMaximum ?? 10;
                    creatureInputs.push({
                        objectId: obj.id,
                        name: char.name,
                        initMod: char.initiative ?? 0,
                        hp: ref.currentHitPoints ?? char.currentHitPoints ?? maxHp,
                        maxHp,
                    });
                }
            }
        }

        if (creatureInputs.length === 0) return;

        // Roll initiative and sort
        const entries = rollInitiativeForCreatures(creatureInputs);

        // Set first creature as active
        if (entries.length > 0) {
            entries[0].isActive = true;
        }

        initiativeOrder = entries;
        currentTurnIndex = 0;
        hasActiveEncounter = true;
        pendingNextObjectId = undefined;
        saveCombatState();

        // Focus on first creature
        if (entries.length > 0) {
            selectCreatureByObjectId(entries[0].objectId);
            editorRef?.centerOnObject?.(entries[0].objectId);
        }
    }

    function handleEndEncounter() {
        initiativeOrder = [];
        currentTurnIndex = 0;
        hasActiveEncounter = false;
        pendingNextObjectId = undefined;
        combatSelectedCreature = null;
        saveCombatState();
    }

    function handleRerollInitiative() {
        if (!currentMapId || !campaignId || initiativeOrder.length === 0) return;

        const allMaps = loadMaps();
        const map = allMaps.find((m) => m.id === currentMapId);
        if (!map) return;

        const chars = loadCharacters().filter((c) => c.campaignId === campaignId);

        // Rebuild creature inputs from current initiative order
        const creatureInputs: CreatureInitiativeInput[] = [];
        for (const entry of initiativeOrder) {
            const obj = map.objects.find((o) => o.id === entry.objectId);
            if (!obj?.creatureRef) continue;

            const ref = obj.creatureRef;
            if (ref.type === "character") {
                const char = chars.find((c) => c.id === ref.id);
                if (char) {
                    creatureInputs.push({
                        objectId: obj.id,
                        name: entry.name,
                        initMod: char.initiative ?? 0,
                        hp: entry.currentHP,
                        maxHp: entry.maxHP,
                    });
                }
            }
        }

        if (creatureInputs.length === 0) return;

        const entries = rollInitiativeForCreatures(creatureInputs);
        if (entries.length > 0) {
            entries[0].isActive = true;
        }

        initiativeOrder = entries;
        currentTurnIndex = 0;
        pendingNextObjectId = undefined;
        saveCombatState();

        // Focus on first creature
        if (entries.length > 0) {
            selectCreatureByObjectId(entries[0].objectId);
            editorRef?.centerOnObject?.(entries[0].objectId);
        }
    }

    function handleNextTurn() {
        if (initiativeOrder.length === 0) return;

        let newIndex: number;

        // If there's a pending next, jump to that creature
        if (pendingNextObjectId) {
            const pendingIndex = initiativeOrder.findIndex(
                (e) => e.objectId === pendingNextObjectId
            );
            if (pendingIndex >= 0) {
                newIndex = pendingIndex;
            } else {
                newIndex = getNextTurnIndex(currentTurnIndex, initiativeOrder.length);
            }
            pendingNextObjectId = undefined;
        } else {
            newIndex = getNextTurnIndex(currentTurnIndex, initiativeOrder.length);
        }

        const newOrder = initiativeOrder.map((e, i) => ({
            ...e,
            isActive: i === newIndex,
        }));

        currentTurnIndex = newIndex;
        initiativeOrder = newOrder;
        saveCombatState();

        // Focus on new creature
        const entry = newOrder[newIndex];
        if (entry) {
            selectCreatureByObjectId(entry.objectId);
            editorRef?.centerOnObject?.(entry.objectId);
        }
    }

    function handlePrevTurn() {
        if (initiativeOrder.length === 0) return;

        // Clear pending next on manual navigation
        pendingNextObjectId = undefined;

        const newIndex = getPrevTurnIndex(currentTurnIndex, initiativeOrder.length);
        const newOrder = initiativeOrder.map((e, i) => ({
            ...e,
            isActive: i === newIndex,
        }));

        currentTurnIndex = newIndex;
        initiativeOrder = newOrder;
        saveCombatState();

        // Focus on new creature
        const entry = newOrder[newIndex];
        if (entry) {
            selectCreatureByObjectId(entry.objectId);
            editorRef?.centerOnObject?.(entry.objectId);
        }
    }

    function handleInitiativeBarSelectCreature(
        e: CustomEvent<{ objectId: string; index: number }>
    ) {
        // Clear pending next when user manually selects a creature
        pendingNextObjectId = undefined;

        const { objectId, index } = e.detail;
        const newOrder = initiativeOrder.map((entry, i) => ({
            ...entry,
            isActive: i === index,
        }));

        currentTurnIndex = index;
        initiativeOrder = newOrder;
        saveCombatState();

        selectCreatureByObjectId(objectId);
        editorRef?.centerOnObject?.(objectId);
    }

    function handleAddToEncounter(e: CustomEvent<{ entry: InitiativeEntry }>) {
        if (!hasActiveEncounter) return;

        const { entry: newEntry } = e.detail;

        // Store current active creature as pending next
        if (initiativeOrder.length > 0 && currentTurnIndex < initiativeOrder.length) {
            pendingNextObjectId = initiativeOrder[currentTurnIndex].objectId;
        }

        // Insert at current index (new creature becomes active immediately)
        const newOrder = insertCreatureAtIndex(initiativeOrder, newEntry, currentTurnIndex);

        // Update active states
        initiativeOrder = newOrder.map((entry, i) => ({
            ...entry,
            isActive: i === currentTurnIndex,
        }));

        saveCombatState();

        // Select and focus on new creature
        selectCreatureByObjectId(newEntry.objectId);
        editorRef?.centerOnObject?.(newEntry.objectId);
    }

    // Get visible creature IDs from MapEditor (for EncounterSetupModal)
    function getVisibleCreatureIds(): string[] {
        return editorRef?.getVisibleCreatureIds?.() ?? [];
    }

    // Combat panel height for mobile layout (CSS variable)
    let combatPanelHeight = 50;

    function handlePanelHeightChanged(e: CustomEvent<{ heightPercent: number }>) {
        combatPanelHeight = e.detail.heightPercent;
    }

    function setMapMode(mode: "edit" | "combat") {
        mapMode = mode;
        if (mode === "edit") {
            combatSelectedCreature = null;
        } else if (mode === "combat") {
            // When entering combat mode, select the first creature in initiative if available
            if (initiativeOrder.length > 0) {
                const currentEntry = initiativeOrder[currentTurnIndex];
                if (currentEntry) {
                    selectCreatureByObjectId(currentEntry.objectId);
                }
            }
        }
    }

    // Public method to close the current map and return to landing
    export function returnToLanding() {
        if (currentMapId) {
            closeMap();
        }
    }

    // Check if we should show combat panel (combat mode is active)
    $: showCombatPanel = mapMode === "combat";
</script>

<NoCampaignOverlay show={!$activeCampaign} on:navigateHome={handleNavigateHome} />

{#if $activeCampaign}
    {#if !currentMapId}
        <div class="mx-auto max-w-[1200px]">
            <MapLanding
                {maps}
                on:createMap={createMap}
                on:openMap={openMap}
                on:renameMap={renameMap}
                on:deleteMap={deleteMap}
                on:updateMap={updateMap} />
        </div>
    {:else}
        <!-- Map View Container: uses flexbox to accommodate combat panel -->
        <div
            class="map-view-container"
            class:combat-mode={showCombatPanel}
            style="--combat-panel-height: {combatPanelHeight}%;">
            <!-- Secondary Sidebar (tools) -->
            <SecondarySidebar
                show={showSecondarySidebar}
                mode="map"
                {tool}
                {mapMode}
                activeTab="characters"
                onTabChange={() => {}}
                on:toolChange={(e) => (tool = e.detail)}
                on:close={closeMap} />

            <!-- Tertiary Sidebar (tool options) -->
            <TertiarySidebar
                show={showTertiarySidebar}
                hasSecondarySidebar={showSecondarySidebar}
                mode="map"
                {tool}
                {currentShape}
                {color}
                selectedTile={selectedTileRef}
                visibleSections={[]}
                selectedSections={new Set()}
                isEditingSections={false}
                onToggleSection={() => {}}
                on:shapeChange={(e) => (currentShape = e.detail)}
                on:colorChange={(e) => (color = e.detail)}
                on:tileSelect={(e) => (selectedTileRef = e.detail)}
                {moveHasSelection}
                {moveSelectedColor}
                {moveCanFlip}
                {moveSelectedCreatureRef}
                {campaignId}
                mapId={currentMapId}
                on:moveColorChange={handleMoveColorChange}
                on:moveFlip={handleMoveFlip}
                on:moveDelete={handleMoveDelete}
                on:creatureAssign={handleCreatureAssign} />

            <!-- Combat Panel (left side on desktop, bottom on mobile) -->
            {#if showCombatPanel}
                <CombatPanel
                    {campaignId}
                    mapId={currentMapId}
                    selectedCreature={combatSelectedCreature}
                    {initiativeOrder}
                    {currentTurnIndex}
                    {hasActiveEncounter}
                    on:selectCreature={handleCombatSelectCreature}
                    on:focusCreature={handleCombatFocusCreature}
                    on:initiativeRolled={handleInitiativeRolled}
                    on:turnChanged={handleTurnChanged}
                    on:panelHeightChanged={handlePanelHeightChanged}
                    on:addToEncounter={handleAddToEncounter} />

                <!-- Initiative Bar (bottom of screen in combat mode) -->
                <InitiativeBar
                    {hasActiveEncounter}
                    {initiativeOrder}
                    {currentTurnIndex}
                    {pendingNextObjectId}
                    on:openEncounterSetup={handleOpenEncounterSetup}
                    on:endEncounter={handleEndEncounter}
                    on:rerollInitiative={handleRerollInitiative}
                    on:nextTurn={handleNextTurn}
                    on:prevTurn={handlePrevTurn}
                    on:selectCreature={handleInitiativeBarSelectCreature} />

                <!-- Encounter Setup Modal -->
                <EncounterSetupModal
                    bind:show={showEncounterSetup}
                    mapId={currentMapId}
                    {campaignId}
                    {getVisibleCreatureIds}
                    on:beginEncounter={handleBeginEncounter}
                    on:cancel={() => (showEncounterSetup = false)} />
            {/if}

            <!-- Main Map Area -->
            <div class="map-main-area">
                <!-- Mode Toggle Header -->
                <div class="map-mode-header">
                    <div class="srpg-segmented-control">
                        <button
                            class="srpg-segment"
                            class:active={mapMode === "edit"}
                            on:click={() => setMapMode("edit")}
                            aria-pressed={mapMode === "edit"}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="16"
                                height="16"
                                fill="currentColor"
                                aria-hidden="true">
                                <path
                                    d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83l3.75 3.75M3 17.25V21h3.75L17.81 9.93l-3.75-3.75z" />
                            </svg>
                            <span>Edit</span>
                        </button>
                        <button
                            class="srpg-segment"
                            class:active={mapMode === "combat"}
                            on:click={() => setMapMode("combat")}
                            aria-pressed={mapMode === "combat"}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="16"
                                height="16"
                                fill="currentColor"
                                aria-hidden="true">
                                <path
                                    d="m6.92 5H5l4 4l1.47-1.47L6.92 5m5.86 4.41l4.75 4.75a1.67 1.67 0 0 1 0 2.36L13.7 20.3a1.66 1.66 0 0 1-2.36 0L7 16l-1.41-1.41l3.29-3.29l-3.88-3.89V5h2.41l3.88 3.88l3.47-3.47a1.66 1.66 0 0 1 2.36 0l.83.83a1.67 1.67 0 0 1 0 2.36l-3.47 3.47l.83.82" />
                            </svg>
                            <span>Combat</span>
                        </button>
                    </div>
                </div>

                <!-- Map Editor Canvas -->
                <div class="map-editor-wrapper">
                    <MapEditor
                        bind:this={editorRef}
                        mapId={currentMapId}
                        {tool}
                        {currentShape}
                        {color}
                        selectedTile={selectedTileRef}
                        {mapMode}
                        on:selectionChange={handleEditorSelectionChange}
                        on:combatCreatureSelect={handleCombatCreatureSelect} />
                </div>
            </div>
        </div>

        <!-- <FloatingOracleButton
            hasSecondarySidebar={showSecondarySidebar}
            hasTertiarySidebar={showTertiarySidebar}
            on:navigateToStory /> -->
    {/if}
{/if}

<style>
    /* Map View Container - fills available viewport space accounting for sidebars */
    .map-view-container {
        position: fixed;
        top: 0;
        right: 0;
        /* Mobile: above primary (70px) + secondary (60px) sidebars */
        bottom: calc(130px + env(safe-area-inset-bottom));
        left: 0;
        display: flex;
        flex-direction: column;
    }

    /* Mobile combat mode: secondary sidebar hides, so reduce bottom offset */
    /* Add space for initiative bar (48px) */
    @media (max-width: 767px) {
        .map-view-container.combat-mode {
            bottom: calc(70px + 48px + env(safe-area-inset-bottom));
        }
    }

    /* Desktop: adjust for left sidebars */
    @media (min-width: 768px) {
        .map-view-container {
            bottom: 0;
            /* After primary (80px) + secondary (90px) sidebars */
            left: 170px;
        }

        /* In combat mode, secondary sidebar is hidden, add space for initiative bar (44px) */
        .map-view-container.combat-mode {
            left: 80px; /* Only primary sidebar */
            bottom: 44px; /* Initiative bar height */
        }
    }

    /* Main map area fills remaining space */
    .map-main-area {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        overflow: hidden;
    }

    /* Mobile: When in combat mode, reduce height for bottom combat panel */
    @media (max-width: 767px) {
        .map-view-container.combat-mode .map-main-area {
            /* Combat panel takes var(--panel-height) from bottom */
            bottom: var(--combat-panel-height, 40%);
        }
    }

    /* Desktop: When in combat mode, add left offset for combat panel */
    @media (min-width: 768px) {
        .map-view-container.combat-mode .map-main-area {
            left: 320px; /* Width of combat panel */
        }
    }

    /* Map mode toggle header */
    .map-mode-header {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        z-index: 20;
        padding: 0.5rem;
    }

    /* Segmented control styles */
    .srpg-segmented-control {
        display: inline-flex;
        background: var(--bg-secondary);
        border: 1px solid var(--border-primary);
        border-radius: 8px;
        padding: 3px;
        gap: 2px;
        box-shadow: var(--shadow-sm);
    }

    .srpg-segment {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.5rem 0.875rem;
        border: none;
        background: transparent;
        color: var(--text-secondary);
        font-size: 0.875rem;
        font-weight: 500;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .srpg-segment:hover:not(.active) {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .srpg-segment.active {
        background: var(--accent-primary);
        color: white;
        box-shadow: var(--shadow-sm);
    }

    .srpg-segment svg {
        flex-shrink: 0;
    }

    /* Map editor wrapper fills the entire map-main-area */
    .map-editor-wrapper {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
    }
</style>
