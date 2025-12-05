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
    // Floating panels (redesigned)
    import FloatingPanelContainer from "./FloatingPanelContainer.svelte";
    import FloatingToolToggle from "./FloatingToolToggle.svelte";
    import FloatingPaintModeToggle from "./FloatingPaintModeToggle.svelte";
    import FloatingBrushModeToggle from "./FloatingBrushModeToggle.svelte";
    import FloatingPaintOptions from "./FloatingPaintOptions.svelte";
    import FloatingSelectionPanel from "./FloatingSelectionPanel.svelte";
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

    // Editor UI state routed to floating panels
    let tool: "move" | "paint" = "move";
    let currentShape: "square" | "circle" | "triangle" | "star" = "square";
    let color = "#2980b9";
    // Selected tile reference for map tools
    let selectedTileRef: { tileMapId: string; tileId: string } | null = null;
    // Paint mode: background or object layer
    let paintMode: "background" | "object" = "background";
    // Eraser mode for background painting (clears tiles)
    let isErasing: boolean = false;

    // Map mode: edit (normal editing) or play (battle/encounter mode)
    let mapMode: "edit" | "play" = "edit";

    // Track sidebar visibility for smooth animations
    let showSecondarySidebar = false;

    // Detect if we're on mobile
    let isMobile = false;
    if (typeof window !== "undefined") {
        isMobile = window.innerWidth < 768;
        window.addEventListener("resize", () => {
            isMobile = window.innerWidth < 768;
        });
    }

    // Reactive statement to show sidebars when a map is opened
    // SecondarySidebar is always visible when map is open (per redesign)
    $: if (currentMapId) {
        // Small delay to ensure DOM is ready and transition can play
        setTimeout(() => {
            showSecondarySidebar = true;
        }, 10);
    } else {
        showSecondarySidebar = false;
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

    // Floating panels visibility based on mode
    $: showFloatingToolPanel = currentMapId && mapMode === "edit";
    $: showFloatingSelectionPanel = currentMapId && mapMode === "edit" && moveHasSelection;

    // Handle modeChange from SecondarySidebar
    function handleModeChange(e: CustomEvent<"edit" | "play">) {
        setMapMode(e.detail);
    }

    // Encounter mode state - no longer need creature selection for panel visibility
    let encounterSelectedCreature: {
        objectId: string;
        creatureRef: CreatureRef;
    } | null = null;

    function handleEncounterCreatureSelect(
        e: CustomEvent<{ objectId: string; creatureRef: CreatureRef }>
    ) {
        // In play mode, clicking a creature switches to their turn
        const wasCollapsed = !encounterSelectedCreature;
        encounterSelectedCreature = e.detail;

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

        // Center on the selected creature with animation
        // Use forceExpanded=true if panel was collapsed, so we account for where it's animating to
        centerOnCreature(e.detail.objectId, true, wasCollapsed);
    }

    function handleEncounterCreatureDeselect() {
        // Clicking on empty map space deselects the creature
        encounterSelectedCreature = null;
    }

    function handleEncounterSelectCreature(
        e: CustomEvent<{ objectId: string; creatureRef: CreatureRef }>
    ) {
        // Switch which creature is displayed in the encounter panel
        const wasCollapsed = !encounterSelectedCreature;
        encounterSelectedCreature = e.detail;

        // Center on creature with animation, accounting for panel expansion
        centerOnCreature(e.detail.objectId, true, wasCollapsed);
    }

    function handleEncounterFocusCreature(e: CustomEvent<{ objectId: string }>) {
        // Center map on the creature's object
        centerOnCreature(e.detail.objectId);
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
            centerOnCreature(firstEntry.objectId);
        }
    }

    function selectCreatureByObjectId(objectId: string) {
        const allMaps = loadMaps();
        const map = allMaps.find((m) => m.id === currentMapId);
        if (!map) return;

        const obj = map.objects.find((o) => o.id === objectId);
        if (obj?.creatureRef) {
            encounterSelectedCreature = {
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
            centerOnCreature(currentEntry.objectId);
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
            centerOnCreature(entries[0].objectId);
        }
    }

    function handleEndEncounter() {
        initiativeOrder = [];
        currentTurnIndex = 0;
        hasActiveEncounter = false;
        pendingNextObjectId = undefined;
        encounterSelectedCreature = null;
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
            centerOnCreature(entries[0].objectId);
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

        // Focus on new creature with animation
        const entry = newOrder[newIndex];
        if (entry) {
            selectCreatureByObjectId(entry.objectId);
            centerOnCreature(entry.objectId, true);
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

        // Focus on new creature with animation
        const entry = newOrder[newIndex];
        if (entry) {
            selectCreatureByObjectId(entry.objectId);
            centerOnCreature(entry.objectId, true);
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
        centerOnCreature(objectId, true);
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
        centerOnCreature(newEntry.objectId);
    }

    // Get visible creature IDs from MapEditor (for EncounterSetupModal)
    function getVisibleCreatureIds(): string[] {
        return editorRef?.getVisibleCreatureIds?.() ?? [];
    }

    // Constants for combat panel dimensions (must match CombatPanel.svelte CSS)
    const DESKTOP_PANEL_WIDTH = 320;
    const DESKTOP_COLLAPSED_WIDTH = 80;
    const MOBILE_COLLAPSED_HEIGHT_PERCENT = 15;

    /**
     * Calculate focus offset to account for overlaying combat panel.
     * Returns offset in screen pixels - positive X shifts focus right, positive Y shifts focus down.
     * This ensures the focused creature appears in the visible (non-obscured) center of the map.
     * @param forceExpanded - If true, calculate offset as if panel will be expanded (for predictive focusing)
     */
    function getFocusOffset(forceExpanded: boolean = false): { x: number; y: number } {
        // Only apply offset when in play mode with panel visible
        if (!showEncounterPanel) return { x: 0, y: 0 };

        const isCollapsed = forceExpanded
            ? false
            : !encounterSelectedCreature && !encounterPanelDragging;

        if (isMobile) {
            // Mobile: panel at bottom, shift creature UP on screen (into visible area)
            const panelPercent = isCollapsed
                ? MOBILE_COLLAPSED_HEIGHT_PERCENT
                : encounterPanelHeight;
            // Panel height is a percentage of viewport (window.innerHeight)
            const panelHeightPx = (window.innerHeight * panelPercent) / 100;
            // To shift creature UP on screen, camera needs to move DOWN (positive Y)
            // Shift by full panel height to center creature in visible area above panel
            const yOffset = 2.4;
            return { x: 0, y: panelHeightPx / yOffset };
        } else {
            // Desktop: panel on left, shift focus RIGHT by half of panel width
            const panelWidth = isCollapsed ? DESKTOP_COLLAPSED_WIDTH : DESKTOP_PANEL_WIDTH;
            // Positive X to shift focus point rightward (camera moves left)
            return { x: panelWidth / 2, y: 0 };
        }
    }

    /**
     * Center map on a creature with offset to account for overlay panel.
     * @param objectId - The ID of the object to center on
     * @param animate - Whether to animate the camera movement
     * @param forceExpanded - Calculate offset as if panel will be expanded
     */
    function centerOnCreature(
        objectId: string,
        animate: boolean = false,
        forceExpanded: boolean = false
    ) {
        const offset = getFocusOffset(forceExpanded);
        editorRef?.centerOnObject?.(objectId, offset.x, offset.y, animate);
    }

    // Encounter panel height for mobile layout (CSS variable)
    let encounterPanelHeight = 50;
    let encounterPanelDragging = false;

    function handlePanelHeightChanged(e: CustomEvent<{ heightPercent: number }>) {
        encounterPanelHeight = e.detail.heightPercent;
    }

    function handlePanelDragStateChanged(e: CustomEvent<{ isDragging: boolean }>) {
        encounterPanelDragging = e.detail.isDragging;
    }

    function setMapMode(mode: "edit" | "play") {
        mapMode = mode;
        if (mode === "edit") {
            encounterSelectedCreature = null;
            // Reset tool to "move" when entering edit mode (per redesign spec)
            tool = "move";
        } else if (mode === "play") {
            // When entering play mode, select the first creature in initiative if available
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

    // Check if we should show encounter panel (play mode is active)
    $: showEncounterPanel = mapMode === "play";
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
        <!-- Map View Container: uses flexbox to accommodate encounter panel -->
        <div
            class="map-view-container"
            class:play-mode={showEncounterPanel}
            class:encounter-panel-collapsed={showEncounterPanel &&
                !encounterSelectedCreature &&
                !encounterPanelDragging}
            class:panel-dragging={encounterPanelDragging}
            style="--encounter-panel-height: {encounterPanelHeight}%;">
            <!-- Secondary Sidebar (Edit/Play mode toggle) -->
            <SecondarySidebar
                show={showSecondarySidebar}
                mode="map"
                {mapMode}
                activeTab="characters"
                onTabChange={() => {}}
                on:modeChange={handleModeChange}
                on:close={closeMap} />

            <!-- Floating Panels Container (edit mode only) -->
            <FloatingPanelContainer show={showFloatingToolPanel}>
                <!-- Move/Add toggle - always visible in edit mode -->
                <FloatingToolToggle {tool} on:toolChange={(e) => (tool = e.detail)} />

                <!-- Background/Object toggle - visible when Add tool selected -->
                {#if tool === "paint"}
                    <FloatingPaintModeToggle
                        {paintMode}
                        on:paintModeChange={(e) => {
                            paintMode = e.detail;
                            // Reset eraser when switching modes
                            isErasing = false;
                        }} />

                    <!-- Paint/Erase toggle - visible when Add + Background mode -->
                    {#if paintMode === "background"}
                        <FloatingBrushModeToggle
                            {isErasing}
                            on:brushModeChange={(e) => (isErasing = e.detail)} />
                    {/if}

                    <!-- Color, Tile & Shape options - visible when Add tool selected, hidden when erasing -->
                    {#if paintMode === "object" || !isErasing}
                        <FloatingPaintOptions
                            {paintMode}
                            {color}
                            selectedTile={selectedTileRef}
                            {currentShape}
                            on:colorChange={(e) => (color = e.detail)}
                            on:tileSelect={(e) => (selectedTileRef = e.detail)}
                            on:shapeChange={(e) => (currentShape = e.detail)} />
                    {/if}
                {/if}

                <!-- Selection panel - visible when object selected in Move mode -->
                {#if showFloatingSelectionPanel}
                    <FloatingSelectionPanel
                        selectedColor={moveSelectedColor}
                        canFlip={moveCanFlip}
                        creatureRef={moveSelectedCreatureRef}
                        {campaignId}
                        mapId={currentMapId}
                        on:colorChange={handleMoveColorChange}
                        on:flip={handleMoveFlip}
                        on:delete={handleMoveDelete}
                        on:creatureAssign={handleCreatureAssign} />
                {/if}
            </FloatingPanelContainer>

            <!-- Encounter Panel (left side on desktop, bottom on mobile) -->
            {#if showEncounterPanel}
                <CombatPanel
                    {campaignId}
                    mapId={currentMapId}
                    selectedCreature={encounterSelectedCreature}
                    {initiativeOrder}
                    {currentTurnIndex}
                    {hasActiveEncounter}
                    on:selectCreature={handleEncounterSelectCreature}
                    on:focusCreature={handleEncounterFocusCreature}
                    on:initiativeRolled={handleInitiativeRolled}
                    on:turnChanged={handleTurnChanged}
                    on:panelHeightChanged={handlePanelHeightChanged}
                    on:panelDragStateChanged={handlePanelDragStateChanged}
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
            {/if}<!-- End showEncounterPanel -->

            <!-- Main Map Area -->
            <div class="map-main-area">
                <!-- Map Editor Canvas -->
                <div class="map-editor-wrapper">
                    <MapEditor
                        bind:this={editorRef}
                        mapId={currentMapId}
                        {tool}
                        {paintMode}
                        {currentShape}
                        {color}
                        {isErasing}
                        selectedTile={selectedTileRef}
                        {mapMode}
                        on:selectionChange={handleEditorSelectionChange}
                        on:encounterCreatureSelect={handleEncounterCreatureSelect}
                        on:encounterCreatureDeselect={handleEncounterCreatureDeselect} />
                </div>
            </div>
        </div>

        <!-- <FloatingOracleButton
            hasSecondarySidebar={showSecondarySidebar}
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

    /* Mobile play mode: keep sidebars visible, add space for initiative bar (48px) */
    @media (max-width: 767px) {
        .map-view-container.play-mode {
            bottom: calc(130px + 48px + env(safe-area-inset-bottom));
        }
    }

    /* Desktop: adjust for left sidebars */
    @media (min-width: 768px) {
        .map-view-container {
            bottom: 0;
            /* After primary (80px) + secondary (90px) sidebars */
            left: 170px;
        }

        /* In play mode, keep secondary sidebar visible, add space for initiative bar (44px) */
        .map-view-container.play-mode {
            left: 170px; /* Keep both sidebars */
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

    /* Map editor wrapper fills the entire map-main-area */
    .map-editor-wrapper {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
    }
</style>
