<script lang="ts">
    import { onMount, createEventDispatcher } from "svelte";
    import { activeCampaign } from "../game-management/campaign-store";
    import NoCampaignOverlay from "../NoCampaignOverlay.svelte";
    import { generateId } from "../oracle/scripts/oracleTypes";
    import {
        loadMapsByCampaign,
        saveMaps,
        loadMaps,
        saveActiveMapId,
        loadActiveMapId,
        loadCharacters,
        saveCharacters,
        type MapEntity,
        type CreatureRef,
        type InitiativeEntry,
        type QuickStats,
        type Character,
    } from "../data/storage-utils";
    import MapLanding from "./MapLanding.svelte";
    import MapEditor from "./MapEditor.svelte";
    import CombatPanel from "./CombatPanel.svelte";
    import InitiativeBar from "./InitiativeBar.svelte";
    import EncounterSetupModal from "./EncounterSetupModal.svelte";
    import SecondarySidebar from "../SecondarySidebar.svelte";
    import TertiarySidebar from "../TertiarySidebar.svelte";
    // Floating panels
    import FloatingEditPlayToggle from "./FloatingEditPlayToggle.svelte";
    import FloatingPaintOptions from "./FloatingPaintOptions.svelte";
    import ShapeModal from "./ShapeModal.svelte";
    import TokenSelectorModal from "./TokenSelectorModal.svelte";
    import CreatureAssignmentModal from "./CreatureAssignmentModal.svelte";
    import QuickStatsModal from "./QuickStatsModal.svelte";
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

    // Quick stats modal state
    let showQuickStatsModal = false;
    let quickStatsModalObjectId: string | null = null;
    let quickStatsModalExistingStats: QuickStats | null = null;

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
                dispatch("mapOpened");
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
        dispatch("mapOpened");
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
        // Clear encounter and edit selection state
        encounterSelectedCreature = null;
        hasSelection = false;
        selectedColor = null;
        selectedShape = null;
        selectedTile = null;
        selectedCanFlip = false;
        selectedCreatureRef = null;
        selectedObjectId = null;
        dispatch("mapClosed");
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
    // editMode: "move" (pan/zoom), "background" (paint background tiles), "object" (add/select tokens)
    let editMode: "move" | "background" | "object" = "move";
    // objectMode: "select" (select/edit existing tokens) or "add" (place new tokens)
    let objectMode: "select" | "add" = "add";
    let currentShape: "square" | "circle" | "triangle" | "star" = "square";
    let color = "#2980b9";
    // Selected tile reference for map tools
    let selectedTileRef: { tileMapId: string; tileId: string } | null = null;
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

    // Editor selection state for Object/Select mode controls
    let hasSelection = false;
    let selectedColor: string | null = null;
    let selectedShape: "square" | "circle" | "triangle" | "star" | null = null;
    let selectedTile: { tileMapId: string; tileId: string } | null = null;
    let selectedCanFlip = false;
    let selectedCreatureRef: CreatureRef | null = null;
    let selectedObjectId: string | null = null;

    // Reference to MapEditor to call exported methods
    let editorRef: any;

    function handleEditorSelectionChange(
        e: CustomEvent<{
            selected: boolean;
            object: {
                id: string;
                color: string;
                shape: "square" | "circle" | "triangle" | "star";
                tile: { tileMapId: string; tileId: string } | null;
                canFlip: boolean;
                creatureRef: CreatureRef | null;
            } | null;
        }>
    ) {
        hasSelection = !!e.detail?.selected;
        selectedColor = e.detail?.object?.color ?? null;
        selectedShape = e.detail?.object?.shape ?? null;
        selectedTile = e.detail?.object?.tile ?? null;
        selectedCanFlip = !!e.detail?.object?.canFlip;
        selectedCreatureRef = e.detail?.object?.creatureRef ?? null;
        selectedObjectId = e.detail?.object?.id ?? null;

        // Sync paint props to selected object's values so next added token matches
        // This ensures SHAPE/TILE/COLOR only changes via manual edits or selection
        if (e.detail?.selected && e.detail.object) {
            color = e.detail.object.color;
            currentShape = e.detail.object.shape;
            selectedTileRef = e.detail.object.tile;
        }
    }

    // Handle token tap in Move mode - switch to Token/Select mode and select the token
    function handleTokenTapInMoveMode(
        e: CustomEvent<{
            objectId: string;
            object: {
                id: string;
                color: string;
                shape: "square" | "circle" | "triangle" | "star";
                tile: { tileMapId: string; tileId: string } | null;
                canFlip: boolean;
                creatureRef: CreatureRef | null;
            };
        }>
    ) {
        // Switch to Token/Select mode
        editMode = "object";
        objectMode = "select";

        // Update selection state
        hasSelection = true;
        selectedColor = e.detail.object.color;
        selectedShape = e.detail.object.shape;
        selectedTile = e.detail.object.tile;
        selectedCanFlip = e.detail.object.canFlip;
        selectedCreatureRef = e.detail.object.creatureRef;
        selectedObjectId = e.detail.object.id;

        // Sync paint props
        color = e.detail.object.color;
        currentShape = e.detail.object.shape;
        selectedTileRef = e.detail.object.tile;

        // Tell MapEditor to select this object
        editorRef?.selectObjectById?.(e.detail.objectId);
    }

    function handleColorChange(e: CustomEvent<string>) {
        if (editMode === "object" && hasSelection) {
            // In object mode with selection, update the selected object's color
            editorRef?.setSelectedObjectColor?.(e.detail);
            selectedColor = e.detail;
            // Also update paint color so next added token uses same color
            color = e.detail;
        } else {
            // No selection or background mode, update the paint color
            color = e.detail;
        }
    }

    function handleShapeChange(e: CustomEvent<"square" | "circle" | "triangle" | "star">) {
        if (editMode === "object" && hasSelection) {
            // In object mode with selection, update the selected object's shape
            editorRef?.setSelectedObjectShape?.(e.detail);
            selectedShape = e.detail;
            // Also update paint shape so next added token uses same shape
            currentShape = e.detail;
        } else {
            // No selection, update the paint shape
            currentShape = e.detail;
        }
    }

    function handleTileSelect(e: CustomEvent<{ tileMapId: string; tileId: string }>) {
        if (editMode === "object" && hasSelection) {
            // In object mode with selection, update the selected object's tile
            editorRef?.setSelectedObjectTile?.(e.detail);
            selectedTile = e.detail;
            // Also update paint tile so next added token uses same tile
            selectedTileRef = e.detail;
        } else {
            // No selection or background mode, update the selected tile for painting
            selectedTileRef = e.detail;
        }
    }

    function handleFlip() {
        editorRef?.flipSelectedObject?.();
    }
    function handleDelete() {
        editorRef?.deleteSelectedObject?.();
    }
    function handleCreatureAssign(e: CustomEvent<CreatureRef | null>) {
        editorRef?.setSelectedObjectCreature?.(e.detail);
        selectedCreatureRef = e.detail;
    }

    // Clear selection when leaving Object mode entirely (preserve selection within Object mode)
    function clearSelectionIfNeeded(
        newEditMode: "move" | "background" | "object",
        newObjectMode?: "select" | "add"
    ) {
        const wasInObjectMode = editMode === "object";
        const willBeInObjectMode = newEditMode === "object";

        // Only clear selection when leaving Object mode entirely
        if (wasInObjectMode && !willBeInObjectMode) {
            editorRef?.clearSelection?.();
            hasSelection = false;
            selectedColor = null;
            selectedShape = null;
            selectedTile = null;
            selectedCanFlip = false;
            selectedCreatureRef = null;
            selectedObjectId = null;
        }
    }

    function handleEditModeChange(newMode: "move" | "background" | "object") {
        clearSelectionIfNeeded(newMode);
        editMode = newMode;
        // Default to 'select' mode if tokens exist, otherwise 'add' mode
        if (newMode === "object") {
            const allMaps = loadMaps();
            const map = allMaps.find((m) => m.id === currentMapId);
            if (map && map.objects.length > 0) {
                objectMode = "select";
            } else {
                objectMode = "add";
            }
        }
        // Reset eraser when leaving background mode
        if (newMode !== "background") {
            isErasing = false;
        }
    }

    function handleObjectModeChange(newMode: "select" | "add") {
        clearSelectionIfNeeded(editMode, newMode);
        objectMode = newMode;
    }

    function handleBrushModeChange(erasing: boolean) {
        isErasing = erasing;
    }

    // Modal state for paint options (tile, color, shape)
    let showTileModal = false;
    let showColorModal = false;
    let showShapeModal = false;
    let showTokenModal = false;
    let showAssignModal = false;

    function openTileModal() {
        showTileModal = true;
        showColorModal = false;
        showShapeModal = false;
        showTokenModal = false;
    }

    function openColorModal() {
        showColorModal = true;
        showTileModal = false;
        showShapeModal = false;
        showTokenModal = false;
    }

    function openShapeModal() {
        showShapeModal = true;
        showTileModal = false;
        showColorModal = false;
        showTokenModal = false;
    }

    function openTokenModal() {
        showTokenModal = true;
        showTileModal = false;
        showColorModal = false;
        showShapeModal = false;
    }

    function openAssignModal() {
        showAssignModal = true;
    }

    function closeAllModals() {
        showTileModal = false;
        showColorModal = false;
        showShapeModal = false;
        showTokenModal = false;
        showAssignModal = false;
    }

    // Handle token selector modal confirm
    function handleTokenConfirm(
        e: CustomEvent<{
            shape: "square" | "circle" | "triangle" | "star";
            color: string;
            tile: { tileMapId: string; tileId: string } | null;
        }>
    ) {
        const { shape, color: newColor, tile } = e.detail;

        if (editMode === "object" && hasSelection) {
            // Update selected object
            editorRef?.setSelectedObjectShape?.(shape);
            editorRef?.setSelectedObjectColor?.(newColor);
            editorRef?.setSelectedObjectTile?.(tile);
            selectedShape = shape;
            selectedColor = newColor;
            selectedTile = tile;
        }

        // Update current paint options for new tokens
        currentShape = shape;
        color = newColor;
        selectedTileRef = tile;

        showTokenModal = false;
    }

    // Show floating Edit/Play toggle when a map is open (visible in both edit and play modes)
    $: showEditPlayToggle = currentMapId;
    // Show tertiary sidebar when in background or object mode (not move)
    $: showTertiarySidebar = currentMapId && mapMode === "edit" && editMode !== "move";
    // Determine paint options context
    let paintOptionsContext: "background" | "object" = "object";
    $: paintOptionsContext = editMode === "background" ? "background" : "object";
    // Paint options disabled when erasing or in select mode with no selection
    $: paintOptionsDisabled =
        (editMode === "background" && isErasing) ||
        (editMode === "object" && objectMode === "select" && !hasSelection);

    // Handle modeChange from FloatingEditPlayToggle
    function handleMapModeChange(mode: "edit" | "play") {
        setMapMode(mode);
    }

    // Encounter mode state - supports both assigned characters and unassigned tokens
    let encounterSelectedCreature: {
        objectId: string;
        creatureRef?: CreatureRef;
        quickStats?: QuickStats;
    } | null = null;

    function handleEncounterCreatureSelect(
        e: CustomEvent<{ objectId: string; creatureRef?: CreatureRef; quickStats?: QuickStats }>
    ) {
        // In play mode, clicking a creature in the map updates the combat panel
        // but does NOT change the initiative order turn - only the initiative bar controls that
        const wasCollapsed = !encounterSelectedCreature;
        encounterSelectedCreature = e.detail;

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

    // Handle quick stats updates from CombatPanel
    function handleQuickStatsUpdate(e: CustomEvent<{ objectId: string; quickStats: QuickStats }>) {
        if (!currentMapId) return;
        const allMaps = loadMaps();
        const mapIndex = allMaps.findIndex((m) => m.id === currentMapId);
        if (mapIndex < 0) return;

        const map = allMaps[mapIndex];
        const objIndex = map.objects.findIndex((o) => o.id === e.detail.objectId);
        if (objIndex < 0) return;

        map.objects[objIndex].quickStats = e.detail.quickStats;
        map.updatedAt = Date.now();
        allMaps[mapIndex] = map;
        saveMaps(allMaps);

        // Refresh MapEditor's cached map data
        editorRef?.refreshMapData?.();

        // Update local state
        if (encounterSelectedCreature?.objectId === e.detail.objectId) {
            encounterSelectedCreature = {
                ...encounterSelectedCreature,
                quickStats: e.detail.quickStats,
            };
        }

        // Update initiative order if token is in encounter
        const initIndex = initiativeOrder.findIndex(
            (entry) => entry.objectId === e.detail.objectId
        );
        if (initIndex >= 0) {
            const newOrder = [...initiativeOrder];
            newOrder[initIndex] = {
                ...newOrder[initIndex],
                name: e.detail.quickStats.name || newOrder[initIndex].name,
                currentHP: e.detail.quickStats.currentHitPoints ?? newOrder[initIndex].currentHP,
                maxHP: e.detail.quickStats.maxHitPoints ?? newOrder[initIndex].maxHP,
            };
            initiativeOrder = newOrder;
            saveCombatState();
        }
    }

    // Handle converting quick stats token to a full character
    function handleConvertToCharacter(
        e: CustomEvent<{ objectId: string; quickStats: QuickStats }>
    ) {
        if (!currentMapId || !campaignId) return;
        const qs = e.detail.quickStats;
        if (!qs.name) return; // Name is required

        // Create new character
        const now = Date.now();
        const newCharacter: Character = {
            id: generateId(),
            campaignId,
            name: qs.name,
            hitPointMaximum: qs.maxHitPoints ?? 10,
            currentHitPoints: qs.currentHitPoints ?? 10,
            abilities: [],
            skills: [],
            createdAt: now,
            updatedAt: now,
        };

        // Save the new character
        const chars = loadCharacters();
        chars.push(newCharacter);
        saveCharacters(chars);

        // Update the map object to use creatureRef instead of quickStats
        const allMaps = loadMaps();
        const mapIndex = allMaps.findIndex((m) => m.id === currentMapId);
        if (mapIndex < 0) return;

        const map = allMaps[mapIndex];
        const objIndex = map.objects.findIndex((o) => o.id === e.detail.objectId);
        if (objIndex < 0) return;

        const obj = map.objects[objIndex];
        obj.creatureRef = {
            type: "character",
            id: newCharacter.id,
            instanceId: generateId(),
            currentHitPoints: qs.currentHitPoints ?? 10,
        };
        delete obj.quickStats; // Clear quickStats

        map.updatedAt = Date.now();
        allMaps[mapIndex] = map;
        saveMaps(allMaps);

        // Update local state to show the newly assigned character
        encounterSelectedCreature = {
            objectId: obj.id,
            creatureRef: obj.creatureRef,
        };

        // Update initiative order if token is in encounter
        const initIndex = initiativeOrder.findIndex(
            (entry) => entry.objectId === e.detail.objectId
        );
        if (initIndex >= 0) {
            // Name and HP stay the same, the token just now has a character backing it
            saveCombatState();
        }
    }

    // Handle opening the quick stats modal from CombatPanel
    function handleOpenQuickStatsModal(
        e: CustomEvent<{ objectId: string; existingStats: QuickStats | null }>
    ) {
        quickStatsModalObjectId = e.detail.objectId;
        quickStatsModalExistingStats = e.detail.existingStats;
        showQuickStatsModal = true;
    }

    // Handle saving quick stats from the modal
    function handleQuickStatsSave(e: CustomEvent<{ quickStats: QuickStats }>) {
        if (!currentMapId || !quickStatsModalObjectId) return;

        const allMaps = loadMaps();
        const mapIndex = allMaps.findIndex((m) => m.id === currentMapId);
        if (mapIndex < 0) return;

        const map = allMaps[mapIndex];
        const objIndex = map.objects.findIndex((o) => o.id === quickStatsModalObjectId);
        if (objIndex < 0) return;

        map.objects[objIndex].quickStats = e.detail.quickStats;
        map.updatedAt = Date.now();
        allMaps[mapIndex] = map;
        saveMaps(allMaps);

        // Refresh MapEditor's cached map data so re-selecting the token shows updated quickStats
        editorRef?.refreshMapData?.();

        // Update local state
        if (encounterSelectedCreature?.objectId === quickStatsModalObjectId) {
            encounterSelectedCreature = {
                ...encounterSelectedCreature,
                quickStats: e.detail.quickStats,
            };
        }

        // Update initiative order if token is in encounter
        const initIndex = initiativeOrder.findIndex(
            (entry) => entry.objectId === quickStatsModalObjectId
        );
        if (initIndex >= 0) {
            const newOrder = [...initiativeOrder];
            newOrder[initIndex] = {
                ...newOrder[initIndex],
                name: e.detail.quickStats.name || newOrder[initIndex].name,
                currentHP: e.detail.quickStats.currentHitPoints ?? newOrder[initIndex].currentHP,
                maxHP: e.detail.quickStats.maxHitPoints ?? newOrder[initIndex].maxHP,
            };
            initiativeOrder = newOrder;
            saveCombatState();
        }

        // Close the modal
        showQuickStatsModal = false;
        quickStatsModalObjectId = null;
        quickStatsModalExistingStats = null;
    }

    // Handle closing the quick stats modal
    function handleQuickStatsClose() {
        showQuickStatsModal = false;
        quickStatsModalObjectId = null;
        quickStatsModalExistingStats = null;
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
        if (obj) {
            encounterSelectedCreature = {
                objectId: obj.id,
                creatureRef: obj.creatureRef,
                quickStats: obj.quickStats,
            };
        }

        // Also update editor selection for visual feedback in play mode
        if (mapMode === "play") {
            editorRef?.selectObjectById?.(objectId);
        }
    }

    function handleTurnChanged(e: CustomEvent<{ turnIndex: number; order: InitiativeEntry[] }>) {
        const turnActuallyChanged = currentTurnIndex !== e.detail.turnIndex;
        currentTurnIndex = e.detail.turnIndex;
        initiativeOrder = e.detail.order;
        saveCombatState();

        // Only auto-select and focus if the turn actually changed (not just HP updates)
        if (turnActuallyChanged) {
            const currentEntry = e.detail.order[e.detail.turnIndex];
            if (currentEntry) {
                selectCreatureByObjectId(currentEntry.objectId);
                // Center the map on this creature
                centerOnCreature(currentEntry.objectId);
            }
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

        // Build creature inputs for selected objects (supports both creatureRef and quickStats)
        const creatureInputs: CreatureInitiativeInput[] = [];
        for (const objectId of e.detail.selectedObjectIds) {
            const obj = map.objects.find((o) => o.id === objectId);
            if (!obj) continue;

            // Handle assigned characters
            if (obj.creatureRef) {
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
            // Handle quick stats tokens
            else if (obj.quickStats) {
                const qs = obj.quickStats;
                creatureInputs.push({
                    objectId: obj.id,
                    name: qs.name || "Unknown",
                    initMod: 0, // No initiative modifier for quick stats tokens
                    hp: qs.currentHitPoints ?? 10,
                    maxHp: qs.maxHitPoints ?? 10,
                });
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
            if (!obj) continue;

            // Handle assigned characters
            if (obj.creatureRef) {
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
            // Handle quick stats tokens
            else if (obj.quickStats) {
                creatureInputs.push({
                    objectId: obj.id,
                    name: entry.name,
                    initMod: 0, // No initiative modifier for quick stats tokens
                    hp: entry.currentHP,
                    maxHp: entry.maxHP,
                });
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
        const previousMode = mapMode;
        mapMode = mode;

        if (mode === "edit") {
            // Transfer play mode selection to edit mode
            const previousEncounterObjectId = encounterSelectedCreature?.objectId ?? null;
            encounterSelectedCreature = null;

            // If we had a creature selected in play mode, switch to object/select mode
            // Otherwise reset to move mode (per redesign spec)
            if (previousMode === "play" && previousEncounterObjectId) {
                editMode = "object";
                objectMode = "select";
                // Use tick to ensure mode change is processed first
                setTimeout(() => {
                    editorRef?.selectObjectById?.(previousEncounterObjectId);
                }, 0);
            } else {
                editMode = "move";
                objectMode = "add";
            }
        } else if (mode === "play") {
            // Transfer edit mode selection to play mode
            const previousEditObjectId = selectedObjectId;

            // Clear edit-mode selection state in MapView (but not in editor - we'll set it below)
            hasSelection = false;
            selectedColor = null;
            selectedShape = null;
            selectedTile = null;
            selectedCanFlip = false;
            selectedCreatureRef = null;
            selectedObjectId = null;
            // Reset editMode to "move" in play mode
            editMode = "move";

            // If we had an object selected in edit mode, keep it selected in play mode
            if (previousMode === "edit" && previousEditObjectId) {
                // Set encounter panel selection
                selectCreatureByObjectId(previousEditObjectId);
                // Focus on the selected creature so combat panel doesn't hide it
                centerOnCreature(previousEditObjectId, true, true);
            } else if (initiativeOrder.length > 0) {
                // Otherwise, select the first creature in initiative if available
                const currentEntry = initiativeOrder[currentTurnIndex];
                if (currentEntry) {
                    selectCreatureByObjectId(currentEntry.objectId);
                    // Select in editor for visual feedback
                    editorRef?.selectObjectById?.(currentEntry.objectId);
                }
            } else {
                // No selection to transfer and no initiative - clear editor selection
                editorRef?.clearSelection?.();
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
            <!-- Secondary Sidebar (Move/Background/Token tool toggle) - hidden in play mode -->
            <SecondarySidebar
                show={showSecondarySidebar && mapMode === "edit"}
                mode="map"
                {editMode}
                activeTab="characters"
                onTabChange={() => {}}
                onEditModeChange={handleEditModeChange} />

            <!-- Tertiary Sidebar (tool-specific options) -->
            <TertiarySidebar
                show={showTertiarySidebar}
                mode="map"
                hasSecondarySidebar={true}
                {editMode}
                {objectMode}
                {isErasing}
                {hasSelection}
                {selectedCanFlip}
                currentColor={editMode === "object" && hasSelection
                    ? (selectedColor ?? color)
                    : color}
                currentTile={editMode === "object" && hasSelection ? selectedTile : selectedTileRef}
                currentShape={editMode === "object" && hasSelection
                    ? (selectedShape ?? currentShape)
                    : currentShape}
                onObjectModeChange={handleObjectModeChange}
                onBrushModeChange={handleBrushModeChange}
                onOpenTileModal={openTileModal}
                onOpenColorModal={openColorModal}
                onOpenTokenModal={openTokenModal}
                onFlip={handleFlip}
                onDelete={handleDelete}
                onOpenAssignModal={openAssignModal} />

            <!-- Floating Edit/Play Toggle (top center, only in edit mode) -->
            {#if showEditPlayToggle}
                <FloatingEditPlayToggle {mapMode} onModeChange={handleMapModeChange} />
            {/if}

            <!-- Paint Options Modal (Tile/Color selection) -->
            {#if showTileModal || showColorModal}
                <FloatingPaintOptions
                    context={paintOptionsContext}
                    disabled={paintOptionsDisabled}
                    color={editMode === "object" && hasSelection ? (selectedColor ?? color) : color}
                    selectedTile={editMode === "object" && hasSelection
                        ? selectedTile
                        : selectedTileRef}
                    currentShape={editMode === "object" && hasSelection
                        ? (selectedShape ?? currentShape)
                        : currentShape}
                    showShape={false}
                    initialTab={showTileModal ? "tile" : "color"}
                    on:colorChange={handleColorChange}
                    on:tileSelect={handleTileSelect}
                    on:shapeChange={handleShapeChange}
                    on:close={closeAllModals} />
            {/if}

            <!-- Shape Selection Modal -->
            <ShapeModal
                show={showShapeModal}
                currentShape={editMode === "object" && hasSelection
                    ? (selectedShape ?? currentShape)
                    : currentShape}
                on:select={(e) => {
                    handleShapeChange(e);
                    showShapeModal = false;
                }}
                on:close={() => (showShapeModal = false)} />

            <!-- Token Selector Modal (combined Shape/Tile/Color) -->
            <TokenSelectorModal
                show={showTokenModal}
                currentShape={editMode === "object" && hasSelection
                    ? (selectedShape ?? currentShape)
                    : currentShape}
                currentColor={editMode === "object" && hasSelection
                    ? (selectedColor ?? color)
                    : color}
                currentTile={editMode === "object" && hasSelection ? selectedTile : selectedTileRef}
                on:confirm={handleTokenConfirm}
                on:close={() => (showTokenModal = false)} />

            <!-- Creature Assignment Modal -->
            {#if showAssignModal && campaignId && currentMapId}
                <CreatureAssignmentModal
                    show={showAssignModal}
                    {campaignId}
                    mapId={currentMapId}
                    currentCreatureRef={selectedCreatureRef}
                    on:assign={(e) => {
                        import("./uuid").then(({ generateUUID }) => {
                            const ref: CreatureRef = {
                                type: e.detail.type,
                                id: e.detail.id,
                                instanceId: generateUUID(),
                            };
                            editorRef?.setSelectedObjectCreature?.(ref);
                            selectedCreatureRef = ref;
                            showAssignModal = false;
                        });
                    }}
                    on:clear={() => {
                        editorRef?.setSelectedObjectCreature?.(null);
                        selectedCreatureRef = null;
                        showAssignModal = false;
                    }}
                    on:close={() => (showAssignModal = false)} />
            {/if}

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
                    on:addToEncounter={handleAddToEncounter}
                    on:quickStatsUpdate={handleQuickStatsUpdate}
                    on:convertToCharacter={handleConvertToCharacter}
                    on:openQuickStatsModal={handleOpenQuickStatsModal} />

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

                <!-- Quick Stats Modal -->
                <QuickStatsModal
                    show={showQuickStatsModal}
                    existingStats={quickStatsModalExistingStats}
                    on:save={handleQuickStatsSave}
                    on:close={handleQuickStatsClose} />
            {/if}<!-- End showEncounterPanel -->

            <!-- Main Map Area -->
            <div class="map-main-area">
                <!-- Map Editor Canvas -->
                <div class="map-editor-wrapper">
                    <MapEditor
                        bind:this={editorRef}
                        mapId={currentMapId}
                        {editMode}
                        {objectMode}
                        {currentShape}
                        {color}
                        {isErasing}
                        selectedTile={selectedTileRef}
                        {mapMode}
                        on:selectionChange={handleEditorSelectionChange}
                        on:tokenTapInMoveMode={handleTokenTapInMoveMode}
                        on:encounterCreatureSelect={handleEncounterCreatureSelect}
                        on:encounterCreatureDeselect={handleEncounterCreatureDeselect}
                        on:close={closeMap} />
                </div>
            </div>
        </div>
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

    /* Mobile play mode: hide secondary sidebar (only primary 70px), add space for initiative bar (48px) */
    @media (max-width: 767px) {
        .map-view-container.play-mode {
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

        /* In play mode, hide secondary sidebar, only show primary (80px), add space for initiative bar (44px) */
        .map-view-container.play-mode {
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

    /* Map editor wrapper fills the entire map-main-area */
    .map-editor-wrapper {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
    }
</style>
