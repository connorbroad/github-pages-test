<script lang="ts">
    import {
        getTileMapById,
        loadMaps,
        type MapEntity,
        type MapObject,
        type TileRef,
    } from "../data/storage-utils";
    import { updateMap } from "../data/map-persistence";
    import { ensureTileMapLoaded, getTileSprite } from "./tilemap-cache";
    import { onMount, onDestroy, createEventDispatcher } from "svelte";
    import { clamp as clampNum, getCappedDpr } from "./canvas-utils";
    import LoadingOverlay from "./LoadingOverlay.svelte";
    import { generateUUID } from "./uuid";
    import { drawGrid as renderGrid, drawFgObjects as renderFg } from "./renderer";

    export let mapId: string;
    export let editMode: "move" | "background" | "object" = "move";
    export let objectMode: "select" | "add" = "select";
    export let currentShape: MapObject["type"] = "square";
    export let color: string = "#2980b9";
    export let mapMode: "edit" | "play" = "edit";
    export let isErasing: boolean = false;

    // selected tile from tertiary sidebar
    export let selectedTile: { tileMapId: string; tileId: string } | null = null;

    // ID of the object whose turn it is (for indicator)
    export let currentTurnObjectId: string | null = null;

    const dispatch = createEventDispatcher();

    let camera = { x: 0, y: 0, zoom: 1 };

    let map: MapEntity | null = null;
    let canvasBg: HTMLCanvasElement;
    let canvasFg: HTMLCanvasElement;
    let ctxBg: CanvasRenderingContext2D;
    let ctxFg: CanvasRenderingContext2D;

    // Cached values to avoid layout thrashing
    let cachedRect: DOMRect | null = null;
    let cachedBgColor: string = "#111";
    let cachedGridColor: string = "rgba(255,255,255,0.1)";
    let rectDirty = true;

    function getCachedRect(): DOMRect {
        if (rectDirty || !cachedRect) {
            cachedRect = canvasFg.getBoundingClientRect();
            rectDirty = false;
        }
        return cachedRect;
    }

    function invalidateRect() {
        rectDirty = true;
    }

    const MIN_ZOOM = 0.25;
    const MAX_ZOOM = 4;
    const FRICTION = 0.008; // higher = quicker stop
    const VELOCITY_EPS = 0.02; // world units per ms
    const SAFE_MARGIN_TILES = 20; // Soft-bounds configuration (in tiles)
    const MAX_DPR = 2; // cap to reduce fill-rate cost on mobile
    const DRAG_SLOP = 8; // number of pixels to move before starting a drag

    const DOUBLE_TAP_DELAY = 300; // ms
    const DOUBLE_TAP_SLOP = 24; // px
    const DOUBLE_TAP_ZOOM = 1.8; // zoom-in factor on quick double-tap
    const MANUAL_ZOOM_RATE = 0.004; // per-pixel exponential rate for double-tap+drag

    // Interaction state
    let draggingObj: MapObject | null = null;
    let dragOffset = { x: 0, y: 0 };
    let isPanning = false;
    let lastPan = { x: 0, y: 0 };
    let lastPanTime = 0;
    let velocity = { x: 0, y: 0 }; // world units per ms for camera
    let inertiaRaf: number | null = null;

    // Object selection state for Object/Select mode
    let selectedObject: MapObject | null = null;
    let isDraggingHandle = false;

    // Pending selection when initial press lands on an object; will turn into a pan if moved past slop
    let pendingSelect: {
        obj: MapObject;
        startX: number;
        startY: number;
        pointerId: number;
    } | null = null;

    // Multi-touch pointer tracking
    let pointers = new Map<number, { x: number; y: number }>();
    let pinchBase = { distance: 0, zoom: 1, centerWorld: { x: 0, y: 0 } };

    let lastTapTime = 0;
    let lastTapPos = { x: 0, y: 0 };

    let manualZoomActive = false;
    let manualZoomPointerId: number | null = null;
    let manualZoomBase = {
        y: 0,
        zoom: 1,
        anchorWorld: { x: 0, y: 0 },
        anchorScreen: { x: 0, y: 0 },
    };
    let manualZoomStartTime = 0;
    let manualZoomMoved = false;

    // Cached sorted objects for hit testing (invalidate when objects change)
    let sortedObjectsCache: MapObject[] | null = null;
    function getSortedObjects(): MapObject[] {
        if (!map) return [];
        if (!sortedObjectsCache) {
            sortedObjectsCache = [...map.objects].sort((a, b) => (b.z ?? 0) - (a.z ?? 0));
        }
        return sortedObjectsCache;
    }
    function invalidateSortedObjects() {
        sortedObjectsCache = null;
    }

    // Debounce save
    let saveTimer: any;
    function queueSave() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            saveMapNow();
        }, 600);
    }

    // Immediate save (used on destroy to ensure camera state is persisted)
    function saveMapNow() {
        if (!map) return;
        const localMap = map;

        updateMap(localMap.id, (map) => {
            // Merge simple properties from local state
            map.view = localMap.view;
            map.background = localMap.background;
            if (localMap.backgroundTiles) map.backgroundTiles = localMap.backgroundTiles;
            if (localMap.backgroundTileTints)
                map.backgroundTileTints = localMap.backgroundTileTints;

            // Smart Merge for Objects:
            // We rely on localMap.objects as the source of truth for POSITIONS and VISUALS (editor controlled),
            // and source of truth for ADDITIONS/DELETIONS made in the editor.
            // But we must preserve DATA (HP, Stats) from freshMap which might have been updated by MapView.
            map.objects = localMap.objects.map((localObj) => {
                const freshObj = map.objects.find((o) => o.id === localObj.id);
                if (freshObj) {
                    // Preservation Logic:
                    // 1. Creature Ref HP/Stats (Synced from character store by MapView)
                    if (
                        localObj.creatureRef &&
                        freshObj.creatureRef &&
                        localObj.creatureRef.id === freshObj.creatureRef.id
                    ) {
                        localObj.creatureRef.currentHitPoints =
                            freshObj.creatureRef.currentHitPoints;
                        // localObj.creatureRef.hitPointMaximum = freshObj.creatureRef.hitPointMaximum;
                    }

                    // 2. QuickStats (Synced from CombatPanel by MapView)
                    // If local didn't change (still has quickStats), accept update from fresh
                    if (localObj.quickStats && freshObj.quickStats) {
                        localObj.quickStats = freshObj.quickStats;
                    }
                }
                return localObj;
            });
        });
    }

    function getDpr() {
        return getCappedDpr(MAX_DPR);
    }

    // coalesce draw calls to one per frame
    let renderQueued = false;
    function scheduleRender() {
        if (renderQueued) return;
        renderQueued = true;
        requestAnimationFrame(() => {
            renderQueued = false;
            drawGrid();
            drawFgObjects();
        });
    }

    let cachedBounds: { minX: number; minY: number; maxX: number; maxY: number } | null = null;
    let boundsDirty = true;
    function invalidateBounds() {
        boundsDirty = true;
    }

    function computeContentBounds() {
        const ts = map!.tileSize;
        let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;

        // Background colors
        for (const key in map!.background) {
            const [tx, ty] = key.split(",").map(Number);
            const x1 = tx * ts,
                y1 = ty * ts,
                x2 = x1 + ts,
                y2 = y1 + ts;
            if (x1 < minX) minX = x1;
            if (y1 < minY) minY = y1;
            if (x2 > maxX) maxX = x2;
            if (y2 > maxY) maxY = y2;
        }

        // Background tiles
        if (map!.backgroundTiles) {
            for (const key in map!.backgroundTiles) {
                const [tx, ty] = key.split(",").map(Number);
                const x1 = tx * ts,
                    y1 = ty * ts,
                    x2 = x1 + ts,
                    y2 = y1 + ts;
                if (x1 < minX) minX = x1;
                if (y1 < minY) minY = y1;
                if (x2 > maxX) maxX = x2;
                if (y2 > maxY) maxY = y2;
            }
        }

        // Foreground objects
        for (const o of map!.objects) {
            const x1 = o.x - o.w / 2,
                y1 = o.y - o.h / 2;
            const x2 = o.x + o.w / 2,
                y2 = o.y + o.h / 2;
            if (x1 < minX) minX = x1;
            if (y1 < minY) minY = y1;
            if (x2 > maxX) maxX = x2;
            if (y2 > maxY) maxY = y2;
        }

        if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
            // No content yet: define a small region around origin
            const pad = ts * 4;
            return { minX: -pad, minY: -pad, maxX: pad, maxY: pad };
        }

        return { minX, minY, maxX, maxY };
    }

    function getContentBounds() {
        if (boundsDirty || !cachedBounds) {
            cachedBounds = computeContentBounds();
            boundsDirty = false;
        }
        return cachedBounds!;
    }

    function getCombatPanelOffset(): number {
        if (typeof window !== "undefined" && window.innerWidth >= 768) {
            return 160; // Half of 320px
        }
        return 0;
    }

    function clampCameraToBounds() {
        if (!map) return;
        const bounds = getContentBounds();
        const ts = map.tileSize;
        const margin = SAFE_MARGIN_TILES * ts;
        const { vw, vh } = getViewSize();
        const minX = bounds.minX - margin;
        const maxX = bounds.maxX + margin;
        const minY = bounds.minY - margin;
        const maxY = bounds.maxY + margin;
        const regionW = maxX - minX;
        const regionH = maxY - minY;

        // Adjust center point for desktop sidebar
        const desktopOffsetWorld = getCombatPanelOffset() / camera.zoom;
        const cx = (minX + maxX) / 2 - desktopOffsetWorld;
        const cy = (minY + maxY) / 2;

        const minCamX = regionW > vw ? minX - desktopOffsetWorld : cx - vw / 2;
        const maxCamX = regionW > vw ? maxX - desktopOffsetWorld - vw : cx - vw / 2;
        const minCamY = regionH > vh ? minY : cy - vh / 2;
        const maxCamY = regionH > vh ? maxY - vh : cy - vh / 2;

        camera.x = clampNum(camera.x, minCamX, maxCamX);
        camera.y = clampNum(camera.y, minCamY, maxCamY);
    }

    function drawGrid() {
        if (!map || !ctxBg || !canvasBg) return;
        renderGrid({
            ctxBg,
            canvasBg,
            camera,
            map,
            isLoading,
            getDpr,
            onInvalidate: scheduleRender,
            bgColor: cachedBgColor,
            gridColor: cachedGridColor,
            viewRect: getCachedRect(),
            editMode,
            mapMode,
        });
    }

    function drawFgObjects() {
        if (!map || !ctxFg || !canvasFg) return;
        renderFg({
            ctxFg,
            canvasFg,
            camera,
            map,
            selectedObject,
            currentTurnObjectId,
            showSelectionHandles: (editMode === "object" || mapMode === "play") && !!selectedObject,
            getDpr,
            onInvalidate: scheduleRender,
            viewRect: getCachedRect(),
            editMode,
            mapMode,
        });
    }

    function worldToTile(wx: number, wy: number) {
        const ts = map!.tileSize;
        return { tx: Math.floor(wx / ts), ty: Math.floor(wy / ts) };
    }

    function screenToWorld(sx: number, sy: number) {
        const rect = getCachedRect();
        const x = (sx - rect.left) / camera.zoom + camera.x;
        const y = (sy - rect.top) / camera.zoom + camera.y;
        return { x, y };
    }

    function isPointInHandle(wx: number, wy: number, obj: MapObject): boolean {
        const dpr = getDpr();
        const handleSize = 16 / (camera.zoom * dpr);
        const handleOffset = 8 / (camera.zoom * dpr);
        const handleX = obj.x + obj.w / 2 + handleOffset;
        const handleY = obj.y + obj.h / 2 + handleOffset;
        return Math.abs(wx - handleX) <= handleSize / 2 && Math.abs(wy - handleY) <= handleSize / 2;
    }

    function isPointInObject(wx: number, wy: number, obj: MapObject): boolean {
        return Math.abs(wx - obj.x) <= obj.w / 2 && Math.abs(wy - obj.y) <= obj.h / 2;
    }

    function paintAt(sx: number, sy: number) {
        if (!map) return;
        const { x, y } = screenToWorld(sx, sy);
        const { tx, ty } = worldToTile(x, y);
        const key = `${tx},${ty}`;
        // Eraser mode clears the tile (same as old "clear" color behavior)
        if (isErasing) {
            if (map.backgroundTiles && map.backgroundTiles[key]) delete map.backgroundTiles[key];
            if (map.backgroundTileTints && map.backgroundTileTints[key])
                delete map.backgroundTileTints[key];
            if (map.background[key]) delete map.background[key];
        } else if (selectedTile) {
            if (!map.backgroundTiles) map.backgroundTiles = {};
            map.backgroundTiles[key] = { ...selectedTile };
            if (map.background[key]) delete map.background[key];
            if (!map.backgroundTileTints) map.backgroundTileTints = {};
            map.backgroundTileTints[key] = color;
        } else {
            map.background[key] = color;
            if (map.backgroundTiles && map.backgroundTiles[key]) delete map.backgroundTiles[key];
            if (map.backgroundTileTints && map.backgroundTileTints[key])
                delete map.backgroundTileTints[key];
        }
        queueSave();
        scheduleRender();
    }

    export function setSelectedObjectColor(newColor: string) {
        if (!selectedObject) return;
        selectedObject.color = newColor;
        scheduleRender();
        queueSave();
        emitSelection();
    }

    export function setSelectedObjectShape(newShape: MapObject["type"]) {
        if (!selectedObject) return;
        selectedObject.type = newShape;
        scheduleRender();
        queueSave();
        emitSelection();
    }

    export function setSelectedObjectTile(newTile: { tileMapId: string; tileId: string }) {
        if (!selectedObject || !map) return;
        // Load the tile to get its dimensions
        const tileMap = getTileMapById(newTile.tileMapId);
        if (!tileMap) return;
        const tile = tileMap.tiles.find((t) => t.id === newTile.tileId);
        if (!tile) return;

        // Set the tile reference
        selectedObject.tile = {
            tileMapId: newTile.tileMapId,
            tileId: newTile.tileId,
        };
        // Update the kind to "tile" since it now has a tile
        selectedObject.kind = "tile";
        // Keep the existing object size - don't update dimensions

        // Ensure the tile is loaded for rendering
        ensureTileMapLoaded(tileMap).then(() => {
            scheduleRender();
        });

        scheduleRender();
        queueSave();
        emitSelection();
    }

    export function flipSelectedObject() {
        if (!selectedObject) return;
        if (selectedObject.kind !== "tile") return;
        (selectedObject as any).flipX = !(selectedObject as any).flipX;
        scheduleRender();
        queueSave();
    }

    export function setSelectedObjectCreature(creatureRef: MapObject["creatureRef"]) {
        if (!selectedObject) return;
        selectedObject.creatureRef = creatureRef;
        scheduleRender();
        queueSave();
        emitSelection();
    }

    /**
     * Returns array of character IDs that are already assigned to map objects.
     * Characters can only be assigned to one object at a time.
     */
    export function getAssignedCharacterIds(): string[] {
        if (!map) return [];
        return map.objects
            .filter((o) => o.creatureRef?.type === "character")
            .map((o) => o.creatureRef!.id);
    }

    export function deleteSelectedObject() {
        if (!selectedObject || !map) return;
        const id = selectedObject.id;
        map.objects = map.objects.filter((o) => o.id !== id);
        selectedObject = null;
        invalidateBounds();
        invalidateSortedObjects();
        scheduleRender();
        queueSave();
        emitSelection();
    }

    // Animation state for smooth camera transitions
    let cameraAnimationRaf: number | null = null;

    /**
     * Center the camera on a specific object by its ID.
     * Used to focus on a creature during turn switching in combat.
     * @param objectId - The ID of the object to center on
     * @param offsetX - Optional X offset in screen pixels (positive = shift focus right)
     * @param offsetY - Optional Y offset in screen pixels (positive = shift focus down)
     * @param animate - Whether to animate the camera movement (default: false)
     */
    export function centerOnObject(
        objectId: string,
        offsetX: number = 0,
        offsetY: number = 0,
        animate: boolean = false
    ) {
        if (!map) return;

        const obj = map.objects.find((o) => o.id === objectId);
        if (!obj) return;

        // Object center is at (obj.x, obj.y) - objects are drawn centered at their position
        const objCenterX = obj.x;
        const objCenterY = obj.y;

        // Get canvas dimensions
        const rect = getCachedRect();
        const halfCanvasW = rect.width / 2 / camera.zoom;
        const halfCanvasH = rect.height / 2 / camera.zoom;

        // Adjust for combat panel on desktop (320px wide on left)
        const effectiveOffsetX = offsetX - getCombatPanelOffset();

        // Convert screen pixel offsets to world units and apply
        const worldOffsetX = effectiveOffsetX / camera.zoom;
        const worldOffsetY = offsetY / camera.zoom;

        // Calculate target camera position
        const targetX = objCenterX - halfCanvasW + worldOffsetX;
        const targetY = objCenterY - halfCanvasH + worldOffsetY;

        if (animate) {
            // Cancel any existing animation
            if (cameraAnimationRaf) {
                cancelAnimationFrame(cameraAnimationRaf);
                cameraAnimationRaf = null;
            }

            const startX = camera.x;
            const startY = camera.y;
            const startTime = performance.now();
            const duration = 250; // ms - matches panel animation timing

            const animateStep = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease-out cubic for smooth deceleration
                const eased = 1 - Math.pow(1 - progress, 3);

                camera.x = startX + (targetX - startX) * eased;
                camera.y = startY + (targetY - startY) * eased;

                clampCameraToBounds();
                scheduleRender();

                if (progress < 1) {
                    cameraAnimationRaf = requestAnimationFrame(animateStep);
                } else {
                    cameraAnimationRaf = null;
                    // Save final position
                    if (map) {
                        map.view.x = camera.x;
                        map.view.y = camera.y;
                        queueSave();
                    }
                }
            };

            cameraAnimationRaf = requestAnimationFrame(animateStep);
        } else {
            // Immediate positioning
            camera.x = targetX;
            camera.y = targetY;

            clampCameraToBounds();
            scheduleRender();

            // Save the new view position
            if (map) {
                map.view.x = camera.x;
                map.view.y = camera.y;
                queueSave();
            }
        }
    }

    /**
     * Returns array of object IDs for creatures currently visible in the viewport.
     * Used by EncounterSetupModal's "Select Visible" feature.
     * Includes both assigned characters (creatureRef) and unassigned tokens (quickStats).
     */
    export function getVisibleCreatureIds(): string[] {
        if (!map) return [];

        const { vw, vh } = getViewSize();
        const viewLeft = camera.x;
        const viewTop = camera.y;
        const viewRight = camera.x + vw;
        const viewBottom = camera.y + vh;

        return map.objects
            .filter((obj) => {
                // Include tokens with either creatureRef or quickStats
                if (!obj.creatureRef && !obj.quickStats) return false;

                // Objects are centered at (x, y), so calculate bounds from center
                const objLeft = obj.x - obj.w / 2;
                const objRight = obj.x + obj.w / 2;
                const objTop = obj.y - obj.h / 2;
                const objBottom = obj.y + obj.h / 2;

                // Check if object overlaps viewport (AABB intersection)
                return (
                    objRight > viewLeft &&
                    objLeft < viewRight &&
                    objBottom > viewTop &&
                    objTop < viewBottom
                );
            })
            .map((obj) => obj.id);
    }

    // Clear selection when not in Object mode (either Add or Select), but keep selection in play mode
    $: if (editMode !== "object" && mapMode !== "play") {
        if (selectedObject) {
            selectedObject = null;
            if (map) scheduleRender();
            emitSelection();
        }
        pendingSelect = null;
    }

    // Re-render when editMode or mapMode changes to update transparency/fading
    $: if ((editMode || mapMode) && map) {
        scheduleRender();
    }

    // Animation loop for turn indicator
    let indicatorRaf: number | null = null;
    $: if (mapMode === "play" && currentTurnObjectId) {
        if (!indicatorRaf) {
            const loop = () => {
                scheduleRender();
                indicatorRaf = requestAnimationFrame(loop);
            };
            loop();
        }
    } else {
        if (indicatorRaf) {
            cancelAnimationFrame(indicatorRaf);
            indicatorRaf = null;
        }
    }

    function emitSelection() {
        const obj = selectedObject;
        dispatch(
            "selectionChange",
            obj
                ? {
                      selected: true,
                      object: {
                          id: obj.id,
                          color: obj.color,
                          shape: obj.type,
                          tile: obj.tile
                              ? { tileMapId: obj.tile.tileMapId, tileId: obj.tile.tileId }
                              : null,
                          canFlip: obj.kind === "tile",
                          creatureRef: obj.creatureRef ?? null,
                      },
                  }
                : { selected: false, object: null }
        );
    }

    /** Clear the current selection (exported for external use) */
    export function clearSelection() {
        if (selectedObject) {
            selectedObject = null;
            if (map) scheduleRender();
            emitSelection();
        }
    }

    /** Select an object by ID (exported for external use, e.g., after token tap in move mode) */
    export function selectObjectById(objectId: string) {
        if (!map) return;
        const obj = map.objects.find((o) => o.id === objectId);
        if (obj) {
            selectedObject = obj;
            scheduleRender();
            emitSelection();
        }
    }

    /** Reload map data from storage (call after external changes like quickStats) */
    export function refreshMapData() {
        // If we have pending changes, save them first!
        // This ensures local moves are merged with the incoming data update
        if (saveTimer) {
            clearTimeout(saveTimer);
            saveMapNow();
        }

        const selectedId = selectedObject?.id;
        loadMap();
        invalidateSortedObjects();
        // Re-select the object if it was selected before
        if (selectedId && map) {
            selectedObject = map.objects.find((o) => o.id === selectedId) ?? null;
        }
        scheduleRender();
    }

    function cancelInertia() {
        if (inertiaRaf !== null) {
            cancelAnimationFrame(inertiaRaf);
            inertiaRaf = null;
        }
        velocity.x = 0;
        velocity.y = 0;
    }

    function startInertia() {
        if (Math.hypot(velocity.x, velocity.y) < VELOCITY_EPS) return;
        let prev = performance.now();
        const step = (ts: number) => {
            const dt = ts - prev;
            prev = ts;
            camera.x += velocity.x * dt;
            camera.y += velocity.y * dt;
            clampCameraToBounds();
            if (map) {
                map.view.x = camera.x;
                map.view.y = camera.y;
                map.view.zoom = camera.zoom;
            }
            drawGrid();
            drawFgObjects();
            const decay = Math.exp(-FRICTION * dt);
            velocity.x *= decay;
            velocity.y *= decay;
            if (Math.hypot(velocity.x, velocity.y) < VELOCITY_EPS) {
                inertiaRaf = null;
                queueSave();
                return;
            }
            inertiaRaf = requestAnimationFrame(step);
        };
        inertiaRaf = requestAnimationFrame(step);
    }

    function setZoomAround(newZoom: number, sx: number, sy: number) {
        if (!map) return;
        const rect = getCachedRect();
        const worldBefore = screenToWorld(sx, sy);
        camera.zoom = clampNum(newZoom, MIN_ZOOM, MAX_ZOOM);
        const wx = (sx - rect.left) / camera.zoom;
        const wy = (sy - rect.top) / camera.zoom;
        camera.x = worldBefore.x - wx;
        camera.y = worldBefore.y - wy;
        clampCameraToBounds();
        map.view.x = camera.x;
        map.view.y = camera.y;
        map.view.zoom = camera.zoom;
        scheduleRender();
        queueSave();
    }

    function onWheel(e: WheelEvent) {
        if (!map || isLoading) return;
        e.preventDefault();
        const factor = Math.pow(1.0015, -e.deltaY);
        setZoomAround(camera.zoom * factor, e.clientX, e.clientY);
    }

    function onPointerDown(e: PointerEvent) {
        if (isLoading) return;
        cancelInertia();
        const target = e.currentTarget as HTMLElement;
        target.setPointerCapture(e.pointerId);
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (pointers.size >= 2) {
            pendingSelect = null;
            const pts = Array.from(pointers.values()) as { x: number; y: number }[];
            const dx = pts[1].x - pts[0].x;
            const dy = pts[1].y - pts[0].y;
            pinchBase.distance = Math.hypot(dx, dy);
            pinchBase.zoom = camera.zoom;
            const midX = (pts[0].x + pts[1].x) / 2;
            const midY = (pts[0].y + pts[1].y) / 2;
            pinchBase.centerWorld = screenToWorld(midX, midY);
            isPanning = false;
            draggingObj = null;
            return;
        }

        const isTouch = e.pointerType === "touch";
        const allowDoubleTap =
            isTouch && (editMode === "move" || (editMode === "object" && objectMode === "select"));
        if (allowDoubleTap && e.button === 0) {
            const now = e.timeStamp;
            const dt = now - lastTapTime;
            const dx = e.clientX - lastTapPos.x;
            const dy = e.clientY - lastTapPos.y;
            const withinSlop = Math.hypot(dx, dy) <= DOUBLE_TAP_SLOP;
            if (dt <= DOUBLE_TAP_DELAY && withinSlop) {
                manualZoomActive = true;
                manualZoomPointerId = e.pointerId;
                manualZoomBase.y = e.clientY;
                manualZoomBase.zoom = camera.zoom;
                manualZoomBase.anchorScreen = { x: e.clientX, y: e.clientY };
                manualZoomBase.anchorWorld = screenToWorld(e.clientX, e.clientY);
                manualZoomStartTime = now;
                manualZoomMoved = false;
            } else {
                lastTapTime = now;
                lastTapPos = { x: e.clientX, y: e.clientY };
            }
            if (manualZoomActive) return;
        }

        const { x, y } = screenToWorld(e.clientX, e.clientY);

        // Play mode: clicking on a creature opens the encounter panel and allows dragging
        if (mapMode === "play") {
            // If clicking on currently selected object, start dragging it
            if (selectedObject && isPointInObject(x, y, selectedObject)) {
                isDraggingHandle = true;
                draggingObj = selectedObject;
                dragOffset.x = x - selectedObject.x;
                dragOffset.y = y - selectedObject.y;
                return;
            }

            const objs = getSortedObjects();
            const hit = objs.find((o) => isPointInObject(x, y, o));
            if (hit) {
                // Select the object internally for visual feedback and dragging
                selectedObject = hit;
                scheduleRender();
                emitSelection();

                // Dispatch for encounter panel - all tokens, not just those with creatureRef
                dispatch("encounterCreatureSelect", {
                    objectId: hit.id,
                    creatureRef: hit.creatureRef, // may be undefined
                    quickStats: hit.quickStats, // may be undefined
                });
                return;
            }
            // Clicking on empty space deselects creature
            selectedObject = null;
            scheduleRender();
            emitSelection();
            dispatch("encounterCreatureDeselect");
            // If no creature hit, allow panning
            isPanning = true;
            lastPan = { x: e.clientX, y: e.clientY };
            lastPanTime = e.timeStamp;
            return;
        }

        // Move mode: allows panning; tapping a token switches to Token/Select mode
        if (editMode === "move") {
            // Check if we tapped on an object
            const objs = getSortedObjects();
            const hit = objs.find((o) => isPointInObject(x, y, o));
            if (hit) {
                // Emit event to switch to Token/Select mode and select this object
                dispatch("tokenTapInMoveMode", {
                    objectId: hit.id,
                    object: {
                        id: hit.id,
                        color: hit.color,
                        shape: hit.type,
                        tile: hit.tile ?? null,
                        canFlip: !!hit.tile,
                        creatureRef: hit.creatureRef ?? null,
                    },
                });
                return;
            }
            // No object hit - just panning
            selectedObject = null;
            isPanning = true;
            lastPan = { x: e.clientX, y: e.clientY };
            lastPanTime = e.timeStamp;
            scheduleRender();
            emitSelection();
            return;
        }

        // Object + Select mode: select and drag objects
        if (editMode === "object" && objectMode === "select") {
            if (selectedObject && isPointInObject(x, y, selectedObject)) {
                isDraggingHandle = true;
                draggingObj = selectedObject;
                dragOffset.x = x - selectedObject.x;
                dragOffset.y = y - selectedObject.y;
                return;
            }

            const objs = getSortedObjects();
            const hit = objs.find((o) => isPointInObject(x, y, o));
            if (hit) {
                pendingSelect = {
                    obj: hit,
                    startX: e.clientX,
                    startY: e.clientY,
                    pointerId: e.pointerId,
                };
                lastPan = { x: e.clientX, y: e.clientY };
                lastPanTime = e.timeStamp;
                return;
            }

            selectedObject = null;
            isPanning = true;
            lastPan = { x: e.clientX, y: e.clientY };
            lastPanTime = e.timeStamp;
            scheduleRender();
            emitSelection();
            return;
        }

        if (e.button === 1 || e.button === 2) {
            selectedObject = null;
            isPanning = true;
            lastPan = { x: e.clientX, y: e.clientY };
            lastPanTime = e.timeStamp;
            scheduleRender();
            return;
        }

        // Background mode: grid-locked painting
        if (editMode === "background") {
            paintAt(e.clientX, e.clientY);
            return;
        }

        // Object + Add mode: place objects at exact position (not grid-locked)
        // Also allows dragging the currently selected object
        if (editMode === "object" && objectMode === "add" && (e.button === 0 || e.button === -1)) {
            // If clicking on the currently selected object, initiate drag instead of adding
            if (selectedObject && isPointInObject(x, y, selectedObject)) {
                isDraggingHandle = true;
                draggingObj = selectedObject;
                dragOffset.x = x - selectedObject.x;
                dragOffset.y = y - selectedObject.y;
                return;
            }

            // Add new object and auto-select it
            if (selectedTile) {
                const id = generateUUID();
                const ts = map.tileSize;
                const obj: MapObject = {
                    id,
                    kind: "tile",
                    type: currentShape,
                    x: x,
                    y: y,
                    w: ts,
                    h: ts,
                    color: color,
                    tile: { ...selectedTile },
                    z: map.objects.reduce((m, o) => Math.max(m, o.z ?? 0), 0) + 1,
                };
                map.objects.push(obj);
                invalidateSortedObjects();
                if (cachedBounds && !boundsDirty) {
                    const x1 = obj.x - obj.w / 2,
                        y1 = obj.y - obj.h / 2;
                    const x2 = obj.x + obj.w / 2,
                        y2 = obj.y + obj.h / 2;
                    cachedBounds.minX = Math.min(cachedBounds.minX, x1);
                    cachedBounds.minY = Math.min(cachedBounds.minY, y1);
                    cachedBounds.maxX = Math.max(cachedBounds.maxX, x2);
                    cachedBounds.maxY = Math.max(cachedBounds.maxY, y2);
                } else {
                    invalidateBounds();
                }
                // Auto-select the newly added object
                selectedObject = obj;
                queueSave();
                scheduleRender();
                emitSelection();
                return;
            }
            const newObj: MapObject = {
                id: generateUUID(),
                type: currentShape,
                x,
                y,
                w: map.tileSize,
                h: map.tileSize,
                color,
            };
            map.objects.push(newObj);
            invalidateSortedObjects();
            if (cachedBounds && !boundsDirty) {
                const x1 = newObj.x - newObj.w / 2,
                    y1 = newObj.y - newObj.h / 2;
                const x2 = newObj.x + newObj.w / 2,
                    y2 = newObj.y + newObj.h / 2;
                cachedBounds.minX = Math.min(cachedBounds.minX, x1);
                cachedBounds.minY = Math.min(cachedBounds.minY, y1);
                cachedBounds.maxX = Math.max(cachedBounds.maxX, x2);
                cachedBounds.maxY = Math.max(cachedBounds.maxY, y2);
            } else {
                invalidateBounds();
            }
            // Auto-select the newly added object
            selectedObject = newObj;
            queueSave();
            scheduleRender();
            emitSelection();
            return;
        }
    }

    function onPointerMove(e: PointerEvent) {
        if (isLoading) return;
        if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (pointers.size >= 2) {
            pendingSelect = null;
        }

        if (
            (editMode === "move" ||
                (editMode === "object" && objectMode === "select") ||
                mapMode === "play") &&
            !isDraggingHandle &&
            !isPanning
        ) {
            const { x, y } = screenToWorld(e.clientX, e.clientY);
            const target = e.currentTarget as HTMLElement;
            if (selectedObject && isPointInHandle(x, y, selectedObject)) {
                target.style.cursor = "grab";
            } else {
                const objs = getSortedObjects();
                const hit = objs.find((o) => isPointInObject(x, y, o));
                // In move mode, no hover states. In object/select or play mode, show pointer cursor.
                target.style.cursor =
                    ((editMode === "object" && objectMode === "select") || mapMode === "play") &&
                    hit
                        ? "pointer"
                        : "default";
            }
        } else if (isDraggingHandle) {
            const target = e.currentTarget as HTMLElement;
            target.style.cursor = "grabbing";
        }

        if (manualZoomActive && manualZoomPointerId === e.pointerId) {
            const dy = e.clientY - manualZoomBase.y;
            if (Math.abs(dy) > 2) manualZoomMoved = true;
            const factor = Math.exp(dy * MANUAL_ZOOM_RATE);
            const newZoom = clampNum(manualZoomBase.zoom * factor, MIN_ZOOM, MAX_ZOOM);
            if (newZoom !== camera.zoom) {
                camera.zoom = newZoom;
                const rect = getCachedRect();
                camera.x =
                    manualZoomBase.anchorWorld.x -
                    (manualZoomBase.anchorScreen.x - rect.left) / camera.zoom;
                camera.y =
                    manualZoomBase.anchorWorld.y -
                    (manualZoomBase.anchorScreen.y - rect.top) / camera.zoom;
                clampCameraToBounds();
                if (map) {
                    map.view.x = camera.x;
                    map.view.y = camera.y;
                    map.view.zoom = camera.zoom;
                }
                scheduleRender();
            }
            return;
        }

        if (pointers.size >= 2) {
            const pts = Array.from(pointers.values()) as { x: number; y: number }[];
            const dx = pts[1].x - pts[0].x;
            const dy = pts[1].y - pts[0].y;
            const dist = Math.hypot(dx, dy);

            if (pinchBase.distance > 0) {
                const scale = dist / pinchBase.distance;
                const newZoom = clampNum(pinchBase.zoom * scale, MIN_ZOOM, MAX_ZOOM);
                camera.zoom = newZoom;

                const midX = (pts[0].x + pts[1].x) / 2;
                const midY = (pts[0].y + pts[1].y) / 2;
                const rect = getCachedRect();
                camera.x = pinchBase.centerWorld.x - (midX - rect.left) / camera.zoom;
                camera.y = pinchBase.centerWorld.y - (midY - rect.top) / camera.zoom;

                clampCameraToBounds();

                map.view.x = camera.x;
                map.view.y = camera.y;
                map.view.zoom = camera.zoom;

                scheduleRender();
            }
            return;
        }

        if (
            (editMode === "move" || (editMode === "object" && objectMode === "select")) &&
            pendingSelect &&
            e.pointerId === pendingSelect.pointerId
        ) {
            const dx0 = e.clientX - pendingSelect.startX;
            const dy0 = e.clientY - pendingSelect.startY;
            if (Math.hypot(dx0, dy0) > DRAG_SLOP) {
                selectedObject = null;
                isPanning = true;
                lastPan = { x: pendingSelect.startX, y: pendingSelect.startY };
                lastPanTime = e.timeStamp;
                pendingSelect = null;
            }
        }

        if (isPanning) {
            const dx = e.clientX - lastPan.x;
            const dy = e.clientY - lastPan.y;
            const dt = Math.max(1, e.timeStamp - lastPanTime);
            const camDx = -dx / camera.zoom;
            const camDy = -dy / camera.zoom;
            camera.x += camDx;
            camera.y += camDy;
            clampCameraToBounds();
            velocity.x = camDx / dt;
            velocity.y = camDy / dt;
            lastPan = { x: e.clientX, y: e.clientY };
            lastPanTime = e.timeStamp;
            if (map) {
                map.view.x = camera.x;
                map.view.y = camera.y;
                map.view.zoom = camera.zoom;
            }
            scheduleRender();
            return;
        }

        if (draggingObj) {
            const { x, y } = screenToWorld(e.clientX, e.clientY);
            draggingObj.x = x - dragOffset.x;
            draggingObj.y = y - dragOffset.y;
            scheduleRender();
        } else if (editMode === "background" && e.buttons & 1) {
            paintAt(e.clientX, e.clientY);
        }
    }

    function onPointerUp(e?: PointerEvent) {
        if (isLoading) return;
        if (e) {
            const target = e.currentTarget as HTMLElement;
            if (target.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId);
            pointers.delete(e.pointerId);
        }

        if (pendingSelect && e && e.pointerId === pendingSelect.pointerId) {
            selectedObject = pendingSelect.obj;
            scheduleRender();
            emitSelection();
            pendingSelect = null;
        }

        if (manualZoomActive && e && manualZoomPointerId === e.pointerId) {
            const dt = e.timeStamp - manualZoomStartTime;
            if (!manualZoomMoved && dt <= DOUBLE_TAP_DELAY) {
                const newZoom = clampNum(manualZoomBase.zoom * DOUBLE_TAP_ZOOM, MIN_ZOOM, MAX_ZOOM);
                camera.zoom = newZoom;
                const rect = getCachedRect();
                camera.x =
                    manualZoomBase.anchorWorld.x -
                    (manualZoomBase.anchorScreen.x - rect.left) / camera.zoom;
                camera.y =
                    manualZoomBase.anchorWorld.y -
                    (manualZoomBase.anchorScreen.y - rect.top) / camera.zoom;
                clampCameraToBounds();
                if (map) {
                    map.view.x = camera.x;
                    map.view.y = camera.y;
                    map.view.zoom = camera.zoom;
                }
                scheduleRender();
            }
            manualZoomActive = false;
            manualZoomPointerId = null;
            manualZoomMoved = false;
            lastTapTime = 0;
        }

        if (isPanning) {
            startInertia();
        }
        if (draggingObj) {
            invalidateBounds();
            queueSave();
            emitSelection();
        }
        if (pointers.size < 2) {
            pinchBase.distance = 0;
        }
        draggingObj = null;
        isDraggingHandle = false;
        isPanning = false;
    }

    // Loading state and progress
    let isLoading = true;
    let loadTotal = 0;
    let loadDone = 0;

    function collectAllTileRefs(m: MapEntity): TileRef[] {
        const set = new Map<string, TileRef>();
        if (m.backgroundTiles) {
            for (const key in m.backgroundTiles) {
                const ref = m.backgroundTiles[key];
                if (ref) set.set(`${ref.tileMapId}:${ref.tileId}`, ref);
            }
        }
        for (const o of m.objects) {
            if (o.kind === "tile" && o.tile) {
                const ref = o.tile;
                set.set(`${ref.tileMapId}:${ref.tileId}`, ref);
            }
        }
        return Array.from(set.values());
    }

    async function preloadMapAssets(m: MapEntity) {
        const tileRefs = collectAllTileRefs(m);
        if (tileRefs.length === 0) {
            isLoading = false;
            scheduleRender();
            return;
        }

        loadTotal = tileRefs.length;
        loadDone = 0;

        const mapIds = Array.from(new Set(tileRefs.map((r) => r.tileMapId)));
        await Promise.all(
            mapIds.map((id) => {
                const tm = getTileMapById(id);
                return tm ? ensureTileMapLoaded(tm).catch(() => {}) : Promise.resolve();
            })
        );

        const CONCURRENCY = Math.min(16, tileRefs.length);
        let i = 0;
        const workers = Array.from({ length: CONCURRENCY }, async () => {
            while (i < tileRefs.length) {
                const idx = i++;
                const ref = tileRefs[idx];
                await getTileSprite(ref).catch(() => {});
                loadDone++;
                if (loadDone % 20 === 0) await new Promise(requestAnimationFrame);
            }
        });
        await Promise.all(workers);

        isLoading = false;
        scheduleRender();
    }

    let resizeObserver: ResizeObserver | null = null;
    let resizeThrottleTimer: ReturnType<typeof setTimeout> | null = null;
    let lastResizeTime = 0;
    const RESIZE_THROTTLE_MS = 250; // Throttle resize to ~4fps during rapid changes (matches animation duration)

    function throttledResize() {
        const now = Date.now();
        const timeSinceLastResize = now - lastResizeTime;

        if (timeSinceLastResize >= RESIZE_THROTTLE_MS) {
            // Enough time has passed, resize immediately
            lastResizeTime = now;
            resizeCanvas();
        } else {
            // Schedule a resize after the throttle period
            if (resizeThrottleTimer) clearTimeout(resizeThrottleTimer);
            resizeThrottleTimer = setTimeout(() => {
                lastResizeTime = Date.now();
                resizeCanvas();
            }, RESIZE_THROTTLE_MS - timeSinceLastResize);
        }
    }

    onMount(() => {
        ctxBg = canvasBg.getContext("2d")!;
        ctxFg = canvasFg.getContext("2d")!;

        loadMap();
        if (map) preloadMapAssets(map);

        window.addEventListener("resize", resizeCanvas, { passive: true });

        // Use ResizeObserver to watch for container size changes
        const container = canvasBg.parentElement;
        if (container && typeof ResizeObserver !== "undefined") {
            resizeObserver = new ResizeObserver(() => {
                throttledResize();
            });
            resizeObserver.observe(container);
        }

        resizeCanvas();
    });

    function loadMap() {
        const allMaps = loadMaps();
        map = allMaps.find((m) => m.id === mapId) || null;

        if (map) {
            // Restore camera state from saved view, with defaults
            if (map.view) {
                camera.x = map.view.x ?? 0;
                camera.y = map.view.y ?? 0;
                camera.zoom = clampNum(map.view.zoom ?? 1, MIN_ZOOM, MAX_ZOOM);
            } else {
                camera.x = 0;
                camera.y = 0;
                camera.zoom = 1;
            }

            const refByMapId = new Map<string, boolean>();
            if (map.backgroundTiles) {
                for (const key in map.backgroundTiles) {
                    const ref = map.backgroundTiles[key];
                    if (ref) refByMapId.set(ref.tileMapId, true);
                }
            }
            for (const o of map.objects) {
                if (o.kind === "tile" && o.tile) refByMapId.set(o.tile.tileMapId, true);
            }

            const missingTileMaps: string[] = [];
            for (const id of refByMapId.keys()) {
                if (!getTileMapById(id)) missingTileMaps.push(id);
            }
            if (missingTileMaps.length) {
                alert("A tilemap used by this map is missing. Tile references will be removed.");
                if (map.backgroundTiles) {
                    for (const key in map.backgroundTiles) {
                        const ref = map.backgroundTiles[key];
                        if (ref && missingTileMaps.includes(ref.tileMapId))
                            delete map.backgroundTiles[key];
                    }
                }
                map.objects = map.objects.filter(
                    (o) =>
                        !(o.kind === "tile" && o.tile && missingTileMaps.includes(o.tile.tileMapId))
                );
                invalidateSortedObjects();
            }

            // Perform bounds check after loading to ensure camera is in valid location
            // This needs to happen after canvas is ready, so we defer it
            requestAnimationFrame(() => {
                if (map) {
                    invalidateBounds(); // Ensure bounds are recalculated for this map
                    clampCameraToBounds();
                    // Sync camera back to map view after clamping
                    map.view = { x: camera.x, y: camera.y, zoom: camera.zoom };
                }
            });
        }
    }

    onDestroy(() => {
        window.removeEventListener("resize", resizeCanvas);
        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = null;
        }
        if (resizeThrottleTimer) {
            clearTimeout(resizeThrottleTimer);
            resizeThrottleTimer = null;
        }
        // Clear any pending debounced save
        clearTimeout(saveTimer);
        if (map) {
            // Persist camera state immediately on destroy
            map.view = { x: camera.x, y: camera.y, zoom: camera.zoom };
            saveMapNow();
        }
    });

    function resizeCanvas() {
        if (!canvasBg || !canvasFg) return;
        invalidateRect(); // Invalidate cached rect on resize
        const wrap = canvasBg.parentElement as HTMLElement;
        const rect = wrap.getBoundingClientRect();
        const dpr = getDpr();
        canvasBg.style.width = rect.width + "px";
        canvasBg.style.height = rect.height + "px";
        canvasFg.style.width = rect.width + "px";
        canvasFg.style.height = rect.height + "px";
        canvasBg.width = Math.max(1, Math.floor(rect.width * dpr));
        canvasBg.height = Math.max(1, Math.floor(rect.height * dpr));
        canvasFg.width = Math.max(1, Math.floor(rect.width * dpr));
        canvasFg.height = Math.max(1, Math.floor(rect.height * dpr));
        cachedBgColor =
            getComputedStyle(document.documentElement).getPropertyValue("--map-editor-bg").trim() ||
            "#111";
        cachedGridColor =
            getComputedStyle(document.documentElement)
                .getPropertyValue("--map-editor-grid")
                .trim() || "rgba(255,255,255,0.1)";
        scheduleRender();
    }

    function getViewSize() {
        const zoom = camera?.zoom ?? 1;
        if (typeof window === "undefined" || !canvasFg) {
            const vw = (typeof window !== "undefined" ? window.innerWidth : 1) / zoom;
            const vh = (typeof window !== "undefined" ? window.innerHeight : 1) / zoom;
            return { vw, vh };
        }
        const rect = getCachedRect();
        return { vw: rect.width / zoom, vh: rect.height / zoom };
    }

    if (map) {
        const refByMapId = new Map<string, boolean>();
        if (map.backgroundTiles) {
            for (const key in map.backgroundTiles) {
                const ref = map.backgroundTiles[key];
                if (ref) refByMapId.set(ref.tileMapId, true);
            }
        }
        for (const o of map.objects) {
            if (o.kind === "tile" && o.tile) refByMapId.set(o.tile.tileMapId, true);
        }
        const missing: string[] = [];
        for (const id of refByMapId.keys()) {
            if (!getTileMapById(id)) missing.push(id);
        }
        if (missing.length) {
            alert("A tilemap used by this map is missing. Tile references will be removed.");
            if (map.backgroundTiles) {
                for (const key in map.backgroundTiles) {
                    const ref = map.backgroundTiles[key];
                    if (ref && missing.includes(ref.tileMapId)) delete map.backgroundTiles[key];
                }
            }
            map.objects = map.objects.filter(
                (o) => !(o.kind === "tile" && o.tile && missing.includes(o.tile.tileMapId))
            );
            invalidateSortedObjects();
        }
    }
</script>

<div class="relative flex h-full w-full flex-col">
    {#if map}
        <!-- Map Title Header - spans above secondary/tertiary sidebars on desktop -->
        <!-- z-50 on desktop to be above SecondarySidebar(z-40) and TertiarySidebar(z-30) -->
        <div
            class="map-header-nav border-border-primary bg-bg-primary absolute top-0 right-0 left-0 z-20 border-b md:fixed md:left-20 md:z-50">
            <!-- Title - absolutely centered across full width, behind button -->
            <h4
                class="text-text-primary pointer-events-none absolute inset-0 m-0 flex items-center justify-center truncate px-12 text-center">
                {map.name}
            </h4>
            <!-- Back button - in normal flow to define header height -->
            <button
                class="border-button-simple-border bg-button-simple-bg text-button-simple-text hover:bg-button-simple-hover-bg hover:border-button-simple-hover-border active:bg-button-simple-bg relative z-10 flex cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-3 text-center text-base font-medium shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-sm"
                on:click={() => dispatch("close")}
                aria-label="Back to maps">
                ←
            </button>
        </div>
    {/if}
    <div
        class="absolute inset-0 touch-none overflow-hidden"
        role="button"
        tabindex="0"
        on:pointerdown={onPointerDown}
        on:pointermove={onPointerMove}
        on:pointerup={onPointerUp}
        on:pointercancel={onPointerUp}
        on:wheel={onWheel}
        on:contextmenu|preventDefault>
        <canvas
            bind:this={canvasBg}
            class="layer-bg absolute inset-0 h-full w-full [image-rendering:pixelated]">
        </canvas>
        <canvas
            bind:this={canvasFg}
            class="layer-fg absolute inset-0 h-full w-full [image-rendering:pixelated]">
        </canvas>
        {#if isLoading}
            <LoadingOverlay done={loadDone} total={loadTotal} />
        {/if}
    </div>
</div>
