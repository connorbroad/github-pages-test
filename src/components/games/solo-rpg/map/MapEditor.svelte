<script lang="ts">
    import { getTileMapById, loadMaps, loadTileMaps, saveMaps, type MapEntity, type MapObject, type MapObject as MO, type TileMap, type TileRef } from "../data/storage-utils";
    import { ensureTileMapLoaded, getCachedTileSprite, getTileMapLoadState, getTileSprite } from "./tilemap-cache";
    import { onMount, onDestroy, createEventDispatcher } from "svelte";

    export let mapId: string;
    // Receive editor UI state from sidebars
    export let tool: "paint" | "object" | "move" = "move";
    export let currentShape: MapObject["type"] = "square";
    export let color: string = "#2980b9";
    // New: selected tile from tertiary sidebar
    export let selectedTile: { tileMapId: string; tileId: string } | null = null;

    const dispatch = createEventDispatcher();

    // Camera
    let camera = { x: 0, y: 0, zoom: 1 };

    // Map data
    let map: MapEntity | null = null;

    // Canvas refs
    let canvasBg: HTMLCanvasElement;
    let canvasFg: HTMLCanvasElement;
    let ctxBg: CanvasRenderingContext2D;
    let ctxFg: CanvasRenderingContext2D;

    // Debounce save
    let saveTimer: any;
    function queueSave() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            if (!map) return;
            map.updatedAt = Date.now();
            const all = loadMaps();
            const i = all.findIndex(m => m.id === map!.id);
            if (i >= 0) {
                all[i] = map!;
                saveMaps(all);
            }
        }, 600);
    }

    // Helpers
    const MIN_ZOOM = 0.25;
    const MAX_ZOOM = 4;
    const FRICTION = 0.008; // higher = quicker stop
    const VELOCITY_EPS = 0.02; // world units per ms
    function clamp(v: number, min: number, max: number) { return Math.min(max, Math.max(min, v)); }

    // Soft-bounds configuration (in tiles)
    const SAFE_MARGIN_TILES = 20;

    // Cached content bounds to avoid O(N) scans on every clamp
    let cachedBounds: { minX: number; minY: number; maxX: number; maxY: number } | null = null;
    let boundsDirty = true;
    function invalidateBounds() { boundsDirty = true; }

    function computeContentBounds() {
        const ts = map!.tileSize;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        // Background tiles
        for (const key in map!.background) {
            const [tx, ty] = key.split(',').map(Number);
            const x1 = tx * ts, y1 = ty * ts, x2 = x1 + ts, y2 = y1 + ts;
            if (x1 < minX) minX = x1;
            if (y1 < minY) minY = y1;
            if (x2 > maxX) maxX = x2;
            if (y2 > maxY) maxY = y2;
        }
        // Foreground objects
        for (const o of map!.objects) {
            const x1 = o.x - o.w / 2, y1 = o.y - o.h / 2;
            const x2 = o.x + o.w / 2, y2 = o.y + o.h / 2;
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
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const minCamX = regionW > vw ? minX : cx - vw / 2;
        const maxCamX = regionW > vw ? maxX - vw : cx - vw / 2;
        const minCamY = regionH > vh ? minY : cy - vh / 2;
        const maxCamY = regionH > vh ? maxY - vh : cy - vh / 2;
        camera.x = clamp(camera.x, minCamX, maxCamX);
        camera.y = clamp(camera.y, minCamY, maxCamY);
    }

    // Render background tiles in drawGrid
    function drawGrid() {
        if (!map || !ctxBg) return;
        if (isLoading) { // Fill background while loading
            const bgFill = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary') || '#111';
            clearCanvas(ctxBg, canvasBg, bgFill);
            return;
        }
        const ts = map.tileSize;
        const bgFill = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary') || '#111';
        // Clear and fill full canvas in device pixels
        clearCanvas(ctxBg, canvasBg, bgFill);

        // Compute visible world rect
        const rect = canvasBg.getBoundingClientRect();
        const viewW = rect.width / camera.zoom;
        const viewH = rect.height / camera.zoom;
        const startTx = Math.floor(camera.x / ts) - 1;
        const endTx = Math.ceil((camera.x + viewW) / ts) + 1;
        const startTy = Math.floor(camera.y / ts) - 1;
        const endTy = Math.ceil((camera.y + viewH) / ts) + 1;

        // Grid
        ctxBg.save();
        ctxBg.scale(camera.zoom, camera.zoom);
        ctxBg.translate(-camera.x, -camera.y); 
        ctxBg.imageSmoothingEnabled = false; // Disable smoothing for pixel art tiles
        ctxBg.strokeStyle = 'rgba(255,255,255,0.1)';
        ctxBg.lineWidth = 1 / camera.zoom;

        const left = startTx * ts;
        const right = endTx * ts;
        const top = startTy * ts;
        const bottom = endTy * ts;

        // Vertical lines
        for (let tx = startTx; tx <= endTx; tx++) {
            const gx = Math.round(tx * ts) + 0.5;
            ctxBg.beginPath();
            ctxBg.moveTo(gx, top);
            ctxBg.lineTo(gx, bottom);
            ctxBg.stroke();
        }

        // Horizontal lines
        for (let ty = startTy; ty <= endTy; ty++) {
            const gy = Math.round(ty * ts) + 0.5;
            ctxBg.beginPath();
            ctxBg.moveTo(left, gy);
            ctxBg.lineTo(right, gy);
            ctxBg.stroke();
        }

        // Paint background colors (existing)...
        for (const key in map.background) {
            const [tx, ty] = key.split(',').map(Number);
            if (tx < startTx || tx > endTx || ty < startTy || ty > endTy) continue;
            const fill = map.background[key];
            ctxBg.fillStyle = fill;
            ctxBg.fillRect(tx * ts, ty * ts, ts, ts);
        }

        // Paint background tiles
        if (map.backgroundTiles) {
            for (let ty = startTy; ty <= endTy; ty++) {
                for (let tx = startTx; tx <= endTx; tx++) {
                    const key = `${tx},${ty}`;
                    const ref = map.backgroundTiles[key];
                    if (!ref) continue;
                    const sprite = getCachedTileSprite(ref);
                    const x = tx * ts;
                    const y = ty * ts;
                    const tint = map.backgroundTileTints?.[key] ?? null;
                    if (sprite) {
                        drawTintedSprite(ctxBg, sprite as any, x, y, ts, ts, tint);
                    } else {
                        // Trigger async load and schedule redraw when done
                        getTileSprite(ref).then(() => { drawGrid(); }).catch(() => {
                            ctxBg.save(); ctxBg.fillStyle = '#ff00ff'; ctxBg.fillRect(x, y, ts, ts); ctxBg.restore();
                        });
                    }
                }
            }
        }
        ctxBg.restore();
        // Reset composite to default for safety
        ctxBg.globalCompositeOperation = 'source-over';
    }

    // Draw objects including tile objects
    function drawObjects() {
        if (!map || !ctxFg) return;
        if (isLoading) { 
            clearCanvas(ctxFg, canvasFg); 
            return; 
        }
        clearCanvas(ctxFg, canvasFg);

        const rect = canvasFg.getBoundingClientRect();
        const viewW = rect.width / camera.zoom;
        const viewH = rect.height / camera.zoom;
        const left = camera.x;
        const right = camera.x + viewW;
        const top = camera.y;
        const bottom = camera.y + viewH;
        ctxFg.save();
        ctxFg.globalCompositeOperation = 'source-over';
        ctxFg.scale(camera.zoom, camera.zoom);
        ctxFg.translate(-camera.x, -camera.y); 
        ctxFg.imageSmoothingEnabled = false; // Disable smoothing for pixel art tiles

        const objs = [...map.objects];
        for (const o of objs) {
            // Ignore objects outside the viewport
            if (o.x + o.w/2 < left || o.x - o.w/2 > right || o.y + o.h/2 < top || o.y - o.h/2 > bottom) {
                continue;
            } 

            // Handle tile objects
            if (o.kind === 'tile' && o.tile) {
                const ref = o.tile;
                const sprite = getCachedTileSprite(ref);
                const x = o.x - o.w/2;
                const y = o.y - o.h/2;
                // Use per-object tint and shape
                const tint = (!o.color || o.color === 'clear') ? null : o.color;
                const shape = (o.type ?? 'square') as 'square'|'circle'|'triangle'|'star';
                if (sprite) {
                    if (shape === 'square') {
                        drawTintedSprite(ctxFg, sprite as any, x, y, o.w, o.h, tint);
                        // Outline for square tile objects
                        ctxFg.strokeStyle = '#000000';
                        ctxFg.lineWidth = 2 / camera.zoom;
                        ctxFg.strokeRect(x, y, o.w, o.h);
                    } else {
                        // Masked draw with shape, then outline
                        ctxFg.save();
                        ctxFg.translate(o.x, o.y);
                        beginShapePath(ctxFg, shape, o.w, o.h);
                        ctxFg.clip();
                        ctxFg.translate(-o.x, -o.y);
                        drawTintedSprite(ctxFg, sprite as any, x, y, o.w, o.h, tint);
                        ctxFg.restore();
                        // Draw outline of the shape
                        ctxFg.save();
                        ctxFg.translate(o.x, o.y);
                        beginShapePath(ctxFg, shape, o.w, o.h);
                        ctxFg.strokeStyle = '#000000';
                        ctxFg.lineWidth = 2 / camera.zoom;
                        ctxFg.stroke();
                        ctxFg.restore();
                    }
                } else {
                    getTileSprite(ref).then(() => drawObjects()).catch(() => {
                        ctxFg.save(); ctxFg.fillStyle = '#ff00ff'; ctxFg.fillRect(x, y, o.w, o.h); ctxFg.restore();
                    });
                }
            } 
            // Handle shape objects
            else {
                ctxFg.fillStyle = o.color;
                ctxFg.strokeStyle = '#000000'; // Black outline
                ctxFg.lineWidth = 2 / camera.zoom; // Scale-aware outline width
                ctxFg.save();
                ctxFg.translate(o.x, o.y);
                if (o.rotation) ctxFg.rotate(o.rotation);
                // Unified path-based rendering for all shapes
                beginShapePath(ctxFg, o.type, o.w, o.h);
                ctxFg.fill();
                ctxFg.stroke();
                ctxFg.restore();
            }
        }

        // Draw selection handle if in move tool and an object is selected
        if (selectedObject && tool === 'move') {
            const handleSize = 16 / camera.zoom; // Fixed screen size
            const handleOffset = 8 / camera.zoom; // Distance from object edge
            
            // Position handle at bottom-right of object
            const handleX = selectedObject.x + selectedObject.w/2 + handleOffset;
            const handleY = selectedObject.y + selectedObject.h/2 + handleOffset;
            
            // Draw handle background (white)
            ctxFg.fillStyle = '#ffffff';
            ctxFg.fillRect(handleX - handleSize/2, handleY - handleSize/2, handleSize, handleSize);
            
            // Draw handle border (blue)
            ctxFg.strokeStyle = '#3498db';
            ctxFg.lineWidth = 2 / camera.zoom;
            ctxFg.strokeRect(handleX - handleSize/2, handleY - handleSize/2, handleSize, handleSize);
            
            // Draw selection outline around object
            ctxFg.strokeStyle = '#3498db';
            ctxFg.lineWidth = 2 / camera.zoom;
            ctxFg.setLineDash([8 / camera.zoom, 4 / camera.zoom]);
            ctxFg.strokeRect(
                selectedObject.x - selectedObject.w/2,
                selectedObject.y - selectedObject.h/2,
                selectedObject.w,
                selectedObject.h
            );
            ctxFg.setLineDash([]);
        }
        ctxFg.restore();
        // Reset composite to default for safety
        ctxFg.globalCompositeOperation = 'source-over';
    }

    function clearCanvas(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, fill?: string) {
        ctx.save();
        // Reset to identity to cover entire pixel buffer regardless of current scaling
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (fill) {
            ctx.fillStyle = fill;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.restore();
    }

    function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, spikes: number, outerRadius: number, innerRadius: number) {
        let rot = Math.PI / 2 * 3;
        let cx = x;
        let cy = y;
        let step = Math.PI / spikes;
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
            rot += step;
            ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
    }

    function worldToTile(wx: number, wy: number) {
        const ts = map!.tileSize;
        return { tx: Math.floor(wx / ts), ty: Math.floor(wy / ts) };
    }

    function screenToWorld(sx: number, sy: number) {
        const rect = canvasFg.getBoundingClientRect();
        // Apply zoom first, then add camera offset
        const x = (sx - rect.left) / camera.zoom + camera.x;
        const y = (sy - rect.top) / camera.zoom + camera.y;
        return { x, y };
    }

    function isPointInHandle(wx: number, wy: number, obj: MapObject): boolean {
        const handleSize = 16 / camera.zoom;
        const handleOffset = 8 / camera.zoom;
        const handleX = obj.x + obj.w/2 + handleOffset;
        const handleY = obj.y + obj.h/2 + handleOffset;
        return Math.abs(wx - handleX) <= handleSize/2 && Math.abs(wy - handleY) <= handleSize/2;
    }

    function isPointInObject(wx: number, wy: number, obj: MapObject): boolean {
        return Math.abs(wx - obj.x) <= obj.w/2 && Math.abs(wy - obj.y) <= obj.h/2;
    }

    function paintAt(sx: number, sy: number) {
        if (!map) return;
        const { x, y } = screenToWorld(sx, sy);
        const { tx, ty } = worldToTile(x, y);
        const key = `${tx},${ty}`;
        if (color === 'clear') {
            if (map.backgroundTiles && map.backgroundTiles[key]) delete map.backgroundTiles[key];
            if (map.backgroundTileTints && map.backgroundTileTints[key]) delete map.backgroundTileTints[key];
            if (map.background[key]) delete map.background[key];
        } else if (selectedTile) {
            if (!map.backgroundTiles) map.backgroundTiles = {};
            map.backgroundTiles[key] = { ...selectedTile };
            // overwrite any background color
            if (map.background[key]) delete map.background[key];
            if (!map.backgroundTileTints) map.backgroundTileTints = {};
            map.backgroundTileTints[key] = color;
        } else {
            // fallback to color fill background
            map.background[key] = color;
            if (map.backgroundTiles && map.backgroundTiles[key]) delete map.backgroundTiles[key];
            if (map.backgroundTileTints && map.backgroundTileTints[key]) delete map.backgroundTileTints[key];
        }
        queueSave();
        drawGrid();
    }

    // Reusable offscreen canvas for tinting to avoid per-draw allocations
    let tintOffscreen: HTMLCanvasElement | null = null;

    function drawTintedSprite(ctx: CanvasRenderingContext2D, sprite: CanvasImageSource, x: number, y: number, w: number, h: number, tint: string | null) {
        if (!tint || tint === 'clear') {
            // @ts-ignore
            ctx.drawImage(sprite as any, x, y, w, h);
            return;
        }
        // Reuse a single offscreen canvas to isolate compositing and reduce GC pressure
        if (!tintOffscreen) tintOffscreen = document.createElement('canvas');
        const off = tintOffscreen;
        off.width = Math.max(1, Math.floor(w));
        off.height = Math.max(1, Math.floor(h));
        const octx = off.getContext('2d')!;
        // Disable smoothing for pixel art
        octx.imageSmoothingEnabled = false;
        // Clear previous contents
        octx.setTransform(1,0,0,1,0,0);
        octx.clearRect(0, 0, off.width, off.height);
        // Base sprite
        // @ts-ignore
        octx.drawImage(sprite as any, 0, 0, w, h);
        // Multiply tint over it
        octx.globalCompositeOperation = 'multiply';
        octx.fillStyle = tint;
        octx.fillRect(0, 0, off.width, off.height);
        // Mask to sprite alpha
        octx.globalCompositeOperation = 'destination-atop';
        // @ts-ignore
        octx.drawImage(sprite as any, 0, 0, w, h);
        // Draw result to main canvas using normal compositing
        ctx.drawImage(off, x, y, w, h);
        // Reset for safety
        octx.globalCompositeOperation = 'source-over';
    }

    function beginShapePath(ctx: CanvasRenderingContext2D, shape: 'square'|'circle'|'triangle'|'star', w: number, h: number) {
        ctx.beginPath();
        if (shape === 'square') {
            ctx.rect(-w/2, -h/2, w, h);
        } else if (shape === 'circle') {
            ctx.arc(0, 0, Math.min(w, h)/2, 0, Math.PI*2);
        } else if (shape === 'triangle') {
            ctx.moveTo(0, -h/2);
            ctx.lineTo(w/2, h/2);
            ctx.lineTo(-w/2, h/2);
            ctx.closePath();
        } else if (shape === 'star') {
            const spikes = 5, outer = Math.min(w,h)/2, inner = outer/2; // match non-tile star style
            let rot = Math.PI / 2 * 3; let cx = 0; let cy = 0; let step = Math.PI / spikes;
            ctx.moveTo(cx, cy - outer);
            for (let i = 0; i < spikes; i++) {
                ctx.lineTo(cx + Math.cos(rot)*outer, cy + Math.sin(rot)*outer);
                rot += step;
                ctx.lineTo(cx + Math.cos(rot)*inner, cy + Math.sin(rot)*inner);
                rot += step;
            }
            ctx.lineTo(cx, cy - outer);
            ctx.closePath();
        }
    }

    // Interaction state
    let draggingObj: MapObject | null = null;
    let dragOffset = { x: 0, y: 0 };
    let isPanning = false;
    let lastPan = { x: 0, y: 0 };
    let lastPanTime = 0;
    let velocity = { x: 0, y: 0 }; // world units per ms for camera
    let inertiaRaf: number | null = null;
    
    // Object selection state for move tool
    let selectedObject: MapObject | null = null;
    let isDraggingHandle = false;

    // Clear selection when switching away from move tool
    $: if (tool !== 'move') {
        if (selectedObject) {
            selectedObject = null;
            if (map) drawObjects();
        }
    }
    
    // Multi-touch pointer tracking
    let pointers = new Map<number, { x: number; y: number }>();
    let pinchBase = { distance: 0, zoom: 1, centerWorld: { x: 0, y: 0 } };

    // Double-tap gestures (touch) for Move tool
    const DOUBLE_TAP_DELAY = 300; // ms
    const DOUBLE_TAP_SLOP = 24;   // px
    const DOUBLE_TAP_ZOOM = 1.8;  // zoom-in factor on quick double-tap
    const MANUAL_ZOOM_RATE = 0.004; // per-pixel exponential rate for double-tap+drag

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

    function cancelInertia() {
        if (inertiaRaf !== null) {
            cancelAnimationFrame(inertiaRaf);
            inertiaRaf = null;
        }
        velocity.x = 0; velocity.y = 0;
    }

    function startInertia() {
        if (Math.hypot(velocity.x, velocity.y) < VELOCITY_EPS) return;
        let prev = performance.now();
        const step = (ts: number) => {
            const dt = ts - prev; prev = ts;
            // Apply velocity
            camera.x += velocity.x * dt;
            camera.y += velocity.y * dt;
            clampCameraToBounds();
            if (map) map.view = { ...camera };
            drawGrid();
            drawObjects();
            // Decay
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
        const rect = canvasFg.getBoundingClientRect();
        const worldBefore = screenToWorld(sx, sy);
        camera.zoom = clamp(newZoom, MIN_ZOOM, MAX_ZOOM);
        // Keep the same world point under the cursor
        const wx = (sx - rect.left) / camera.zoom;
        const wy = (sy - rect.top) / camera.zoom;
        camera.x = worldBefore.x - wx;
        camera.y = worldBefore.y - wy;
        clampCameraToBounds();
        map.view = { ...camera };
        drawGrid();
        drawObjects();
        queueSave();
    }

    function onWheel(e: WheelEvent) {
        if (!map || isLoading) return;
        e.preventDefault();
        const factor = Math.pow(1.0015, -e.deltaY);
        setZoomAround(camera.zoom * factor, e.clientX, e.clientY);
    }

    function onPointerDown(e: PointerEvent) {
        if (isLoading) return; // Block all interactions during load
        cancelInertia();
        const target = e.currentTarget as HTMLElement;
        target.setPointerCapture(e.pointerId);
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        // Multi-touch pinch shortcut
        if (pointers.size >= 2) {
            // Start pinch
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

        // Double-tap detection on touch for Move tool
        const isTouch = e.pointerType === 'touch';
        const allowDoubleTap = isTouch && tool === 'move';
        if (allowDoubleTap && e.button === 0) {
            const now = e.timeStamp;
            const dt = now - lastTapTime;
            const dx = e.clientX - lastTapPos.x;
            const dy = e.clientY - lastTapPos.y;
            const withinSlop = Math.hypot(dx, dy) <= DOUBLE_TAP_SLOP;
            if (dt <= DOUBLE_TAP_DELAY && withinSlop) {
                // Start manual zoom gesture
                manualZoomActive = true;
                manualZoomPointerId = e.pointerId;
                manualZoomBase.y = e.clientY;
                manualZoomBase.zoom = camera.zoom;
                manualZoomBase.anchorScreen = { x: e.clientX, y: e.clientY };
                manualZoomBase.anchorWorld = screenToWorld(e.clientX, e.clientY);
                manualZoomStartTime = now;
                manualZoomMoved = false;
                // Do not start panning yet; wait to see if drag happens
            } else {
                // Record tap as possible first tap
                lastTapTime = now;
                lastTapPos = { x: e.clientX, y: e.clientY };
            }
            // If manual zoom just initiated, don't fall through to pan/other interactions
            if (manualZoomActive) return;
        }

        // Compute world position to decide object hit vs other interactions
        const { x, y } = screenToWorld(e.clientX, e.clientY);

        // Handle move tool interactions
        if (tool === 'move') {
            // Check if clicking on the selected object (body or handle) to drag it
            if (selectedObject && isPointInObject(x, y, selectedObject)) {
                isDraggingHandle = true;
                draggingObj = selectedObject;
                dragOffset.x = x - selectedObject.x;
                dragOffset.y = y - selectedObject.y;
                return;
            }

            // Check if clicking on any object to select it
            const objs = [...map.objects].sort((a,b) => (b.z ?? 0) - (a.z ?? 0));
            const hit = objs.find(o => isPointInObject(x, y, o));
            if (hit) {
                selectedObject = hit;
                drawObjects();
                return;
            }

            // Otherwise, deselect and start panning
            selectedObject = null;
            isPanning = true;
            lastPan = { x: e.clientX, y: e.clientY };
            lastPanTime = e.timeStamp;
            drawObjects();
            return;
        }

        // Start panning on middle/right button
        if (e.button === 1 || e.button === 2) {
            selectedObject = null;
            isPanning = true;
            lastPan = { x: e.clientX, y: e.clientY };
            lastPanTime = e.timeStamp;
            drawObjects();
            return;
        }

        if (tool === 'paint') {
            paintAt(e.clientX, e.clientY);
            return;
        }

        // Foreground interaction for other edit tools (single finger/mouse left)
        const objs = [...map.objects].sort((a,b) => (b.z ?? 0) - (a.z ?? 0));
        const hit = objs.find(o => isPointInObject(x, y, o));
        if (hit) {
            draggingObj = hit;
            dragOffset.x = x - hit.x;
            dragOffset.y = y - hit.y;
            return;
        }

        // Object placement with object tool
        // Touch events have button === -1 or 0, mouse left-click is 0
        if (tool === 'object' && (e.button === 0 || e.button === -1)) {
            if (selectedTile) {
                const id = generateUUID();
                const ts = map.tileSize;
                const obj: MapObject = {
                    id,
                    kind: 'tile',
                    // Persist shape for tile objects
                    type: currentShape,
                    // Free placement at cursor
                    x: x,
                    y: y,
                    w: ts,
                    h: ts,
                    // Persist tint color for tile objects
                    color: color,
                    tile: { ...selectedTile },
                    z: (map.objects.reduce((m, o) => Math.max(m, o.z ?? 0), 0) + 1)
                };
                map.objects.push(obj);
                // Expand cached bounds quickly
                if (cachedBounds && !boundsDirty) {
                    const x1 = obj.x - obj.w/2, y1 = obj.y - obj.h/2;
                    const x2 = obj.x + obj.w/2, y2 = obj.y + obj.h/2;
                    cachedBounds.minX = Math.min(cachedBounds.minX, x1);
                    cachedBounds.minY = Math.min(cachedBounds.minY, y1);
                    cachedBounds.maxX = Math.max(cachedBounds.maxX, x2);
                    cachedBounds.maxY = Math.max(cachedBounds.maxY, y2);
                } else {
                    invalidateBounds();
                }
                queueSave();
                drawObjects();
                return;
            }
            const newObj: MapObject = {
                id: generateUUID(),
                type: currentShape,
                x, y,
                w: map.tileSize,
                h: map.tileSize,
                color,
            };
            map.objects.push(newObj);
            // Expand cached bounds quickly
            if (cachedBounds && !boundsDirty) {
                const x1 = newObj.x - newObj.w/2, y1 = newObj.y - newObj.h/2;
                const x2 = newObj.x + newObj.w/2, y2 = newObj.y + newObj.h/2;
                cachedBounds.minX = Math.min(cachedBounds.minX, x1);
                cachedBounds.minY = Math.min(cachedBounds.minY, y1);
                cachedBounds.maxX = Math.max(cachedBounds.maxX, x2);
                cachedBounds.maxY = Math.max(cachedBounds.maxY, y2);
            } else {
                invalidateBounds();
            }
            queueSave();
            drawObjects();
            return;
        }
    }

    function onPointerMove(e: PointerEvent) {
        if (isLoading) return; // Block all interactions during load
        // Update pointer
        if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        // Update cursor based on hover state (only in move tool)
        if (tool === 'move' && !isDraggingHandle && !isPanning) {
            const { x, y } = screenToWorld(e.clientX, e.clientY);
            const target = e.currentTarget as HTMLElement;
            
            if (selectedObject && isPointInHandle(x, y, selectedObject)) {
                target.style.cursor = 'grab';
            } else {
                const objs = [...map.objects].sort((a,b) => (b.z ?? 0) - (a.z ?? 0));
                const hit = objs.find(o => isPointInObject(x, y, o));
                target.style.cursor = hit ? 'pointer' : 'default';
            }
        } else if (isDraggingHandle) {
            const target = e.currentTarget as HTMLElement;
            target.style.cursor = 'grabbing';
        }

        // Manual zoom via double-tap+drag (touch)
        if (manualZoomActive && manualZoomPointerId === e.pointerId) {
            const dy = e.clientY - manualZoomBase.y;
            if (Math.abs(dy) > 2) manualZoomMoved = true;
            const factor = Math.exp(dy * MANUAL_ZOOM_RATE); // drag down => zoom in
            const newZoom = clamp(manualZoomBase.zoom * factor, MIN_ZOOM, MAX_ZOOM);
            if (newZoom !== camera.zoom) {
                camera.zoom = newZoom;
                const rect = canvasFg.getBoundingClientRect();
                camera.x = manualZoomBase.anchorWorld.x - (manualZoomBase.anchorScreen.x - rect.left) / camera.zoom;
                camera.y = manualZoomBase.anchorWorld.y - (manualZoomBase.anchorScreen.y - rect.top) / camera.zoom;
                clampCameraToBounds();
                if (map) map.view = { ...camera };
                drawGrid();
                drawObjects();
            }
            return;
        }

        // Pinch zoom/pan when two pointers active
        if (pointers.size >= 2) {
            const pts = Array.from(pointers.values()) as { x: number; y: number }[];
            const dx = pts[1].x - pts[0].x;
            const dy = pts[1].y - pts[0].y;
            const dist = Math.hypot(dx, dy);
            if (pinchBase.distance > 0) {
                const scale = dist / pinchBase.distance;
                const newZoom = clamp(pinchBase.zoom * scale, MIN_ZOOM, MAX_ZOOM);
                const midX = (pts[0].x + pts[1].x) / 2;
                const midY = (pts[0].y + pts[1].y) / 2;
                camera.zoom = newZoom;
                const rect = canvasFg.getBoundingClientRect();
                camera.x = pinchBase.centerWorld.x - (midX - rect.left) / camera.zoom;
                camera.y = pinchBase.centerWorld.y - (midY - rect.top) / camera.zoom;
                clampCameraToBounds();
                map.view = { ...camera };
                drawGrid();
                drawObjects();
            }
            return;
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
            // Velocity in world units per ms
            velocity.x = camDx / dt;
            velocity.y = camDy / dt;
            lastPan = { x: e.clientX, y: e.clientY };
            lastPanTime = e.timeStamp;
            if (map) map.view = { ...camera };
            drawGrid();
            drawObjects();
            return;
        }

        if (draggingObj) {
            const { x, y } = screenToWorld(e.clientX, e.clientY);
            draggingObj.x = x - dragOffset.x;
            draggingObj.y = y - dragOffset.y;
            drawObjects();
        } else if (tool === 'paint' && (e.buttons & 1)) {
            paintAt(e.clientX, e.clientY);
        }
    }

    function onPointerUp(e?: PointerEvent) {
        if (isLoading) return; // Block all interactions during load
        if (e) {
            const target = e.currentTarget as HTMLElement;
            if (target.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId);
            pointers.delete(e.pointerId);
        }

        // Finish manual zoom gesture
        if (manualZoomActive && e && manualZoomPointerId === e.pointerId) {
            const dt = e.timeStamp - manualZoomStartTime;
            if (!manualZoomMoved && dt <= DOUBLE_TAP_DELAY) {
                // Quick double-tap without drag: zoom in by fixed factor around anchor
                const newZoom = clamp(manualZoomBase.zoom * DOUBLE_TAP_ZOOM, MIN_ZOOM, MAX_ZOOM);
                camera.zoom = newZoom;
                const rect = canvasFg.getBoundingClientRect();
                camera.x = manualZoomBase.anchorWorld.x - (manualZoomBase.anchorScreen.x - rect.left) / camera.zoom;
                camera.y = manualZoomBase.anchorWorld.y - (manualZoomBase.anchorScreen.y - rect.top) / camera.zoom;
                clampCameraToBounds();
                if (map) map.view = { ...camera };
                drawGrid();
                drawObjects();
            }
            manualZoomActive = false;
            manualZoomPointerId = null;
            manualZoomMoved = false;
            lastTapTime = 0; // reset sequence
        }

        if (isPanning) {
            startInertia();
        }
        if (draggingObj) {
            // Object move may expand or shrink bounds; recompute lazily
            invalidateBounds();
            queueSave();
        }
        if (pointers.size < 2) {
            pinchBase.distance = 0;
        }
        draggingObj = null;
        isDraggingHandle = false;
        isPanning = false;
    }

    // UUID generator with fallback for browsers without crypto.randomUUID
    function generateUUID(): string {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        // Fallback UUID generator
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
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
            if (o.kind === 'tile' && o.tile) {
                const ref = o.tile;
                set.set(`${ref.tileMapId}:${ref.tileId}`, ref);
            }
        }
        return Array.from(set.values());
    }

    async function preloadMapAssets(m: MapEntity) {
        const refs = collectAllTileRefs(m);
        // If nothing to load, finish quickly
        if (refs.length === 0) { isLoading = false; drawGrid(); drawObjects(); return; }
        loadTotal = refs.length; loadDone = 0;
        // Preload distinct base images first
        const mapIds = Array.from(new Set(refs.map(r => r.tileMapId)));
        await Promise.all(mapIds.map(id => {
            const tm = getTileMapById(id);
            return tm ? ensureTileMapLoaded(tm).catch(() => {}) : Promise.resolve();
        }));
        // Limit concurrency to keep UI responsive
        const CONCURRENCY = Math.min(16, refs.length);
        let i = 0;
        const workers = Array.from({ length: CONCURRENCY }, async () => {
            while (i < refs.length) {
                const idx = i++;
                const ref = refs[idx];
                await getTileSprite(ref).catch(() => {});
                loadDone++;
                // Yield occasionally to allow paint
                if (loadDone % 20 === 0) await new Promise(requestAnimationFrame);
            }
        });
        await Promise.all(workers);
        isLoading = false;
        drawGrid();
        drawObjects();
    }

    onMount(() => {
        ctxBg = canvasBg.getContext('2d')!;
        ctxFg = canvasFg.getContext('2d')!;
        const all = loadMaps();
        map = all.find(m => m.id === mapId) || null;
        // Cleanup missing tilemaps
        if (map) {
            const refByMapId = new Map<string, boolean>();
            // collect refs from backgroundTiles
            if (map.backgroundTiles) {
                for (const key in map.backgroundTiles) {
                    const ref = map.backgroundTiles[key];
                    if (ref) refByMapId.set(ref.tileMapId, true);
                }
            }
            // collect from objects
            for (const o of map.objects) {
                if (o.kind === 'tile' && o.tile) refByMapId.set(o.tile.tileMapId, true);
            }
            const missing: string[] = [];
            for (const id of refByMapId.keys()) {
                if (!getTileMapById(id)) missing.push(id);
            }
            if (missing.length) {
                alert('A tilemap used by this map is missing. Tile references will be removed.');
                // purge
                if (map.backgroundTiles) {
                    for (const key in map.backgroundTiles) {
                        const ref = map.backgroundTiles[key];
                        if (ref && missing.includes(ref.tileMapId)) delete map.backgroundTiles[key];
                    }
                }
                map.objects = map.objects.filter(o => !(o.kind === 'tile' && o.tile && missing.includes(o.tile.tileMapId)));
                // saving moved earlier
            }
        }
        window.addEventListener('resize', resizeCanvas, { passive: true });
        // Initial size
        resizeCanvas();
        if (map) preloadMapAssets(map);
    });

    onDestroy(() => {
        window.removeEventListener('resize', resizeCanvas);
        if (map) {
            map.view = camera;
            queueSave();
        }
    });

    function resizeCanvas() {
        if (!canvasBg || !canvasFg) return;
        const wrap = canvasBg.parentElement as HTMLElement;
        const rect = wrap.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        // Set CSS size
        canvasBg.style.width = rect.width + 'px';
        canvasBg.style.height = rect.height + 'px';
        canvasFg.style.width = rect.width + 'px';
        canvasFg.style.height = rect.height + 'px';
        // Set actual pixel buffer size
        canvasBg.width = Math.max(1, Math.floor(rect.width * dpr));
        canvasBg.height = Math.max(1, Math.floor(rect.height * dpr));
        canvasFg.width = Math.max(1, Math.floor(rect.width * dpr));
        canvasFg.height = Math.max(1, Math.floor(rect.height * dpr));
        drawGrid();
        drawObjects();
    }

    function getViewSize() {
        const zoom = camera?.zoom ?? 1;
        // Guard for early calls before canvas is bound/mounted
        if (typeof window === 'undefined' || !canvasFg) {
            const vw = (typeof window !== 'undefined' ? window.innerWidth : 1) / zoom;
            const vh = (typeof window !== 'undefined' ? window.innerHeight : 1) / zoom;
            return { vw, vh };
        }
        const rect = canvasFg.getBoundingClientRect();
        return { vw: rect.width / zoom, vh: rect.height / zoom };
    }

    // Cleanup missing tilemaps
    if (map) {
        const refByMapId = new Map<string, boolean>();
        // collect refs from backgroundTiles
        if (map.backgroundTiles) {
            for (const key in map.backgroundTiles) {
                const ref = map.backgroundTiles[key];
                if (ref) refByMapId.set(ref.tileMapId, true);
            }
        }
        // collect from objects
        for (const o of map.objects) {
            if (o.kind === 'tile' && o.tile) refByMapId.set(o.tile.tileMapId, true);
        }
        const missing: string[] = [];
        for (const id of refByMapId.keys()) {
            if (!getTileMapById(id)) missing.push(id);
        }
        if (missing.length) {
            alert('A tilemap used by this map is missing. Tile references will be removed.');
            // purge
            if (map.backgroundTiles) {
                for (const key in map.backgroundTiles) {
                    const ref = map.backgroundTiles[key];
                    if (ref && missing.includes(ref.tileMapId)) delete map.backgroundTiles[key];
                }
            }
            map.objects = map.objects.filter(o => !(o.kind === 'tile' && o.tile && missing.includes(o.tile.tileMapId)));
            // saving moved earlier
        }
    }
</script>

<div class="map-editor">
    <div class="canvas-wrap"
         role="button"
         tabindex="0"
         on:pointerdown={onPointerDown}
         on:pointermove={onPointerMove}
         on:pointerup={onPointerUp}
         on:pointercancel={onPointerUp}
         on:wheel={onWheel}
         on:contextmenu|preventDefault
    >
        <canvas bind:this={canvasBg} class="layer layer-bg"></canvas>
        <canvas bind:this={canvasFg} class="layer layer-fg"></canvas>
        {#if isLoading}
        <div class="loading-overlay" aria-busy="true">
            <div class="loading-box">
                <div class="spinner"></div>
                <div class="loading-text">Loading tiles… {loadDone}/{loadTotal}</div>
                <div class="loading-bar"><div class="fill" style="width: {loadTotal ? (loadDone/loadTotal*100) : 0}%"></div></div>
                <div class="loading-note">Large maps may take a moment.</div>
            </div>
        </div>
        {/if}
    </div>

    <!-- Inline toolbar removed; sidebars provide controls -->
</div>

<style>
    .map-editor {
        position: relative;
        width: 100%;
        height: calc(100dvh - 90px); /* mobile baseline; accounted by sidebars outside */
    }

    .canvas-wrap { position: absolute; inset: 0; overflow: hidden; touch-action: none; }
    .layer { position: absolute; inset: 0; width: 100%; height: 100%;
        image-rendering: pixelated; image-rendering: crisp-edges; }

    .loading-overlay {
        position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
        background: rgba(17,17,17,0.6); backdrop-filter: blur(2px);
        pointer-events: all; /* block interactions while loading */
    }
    .loading-box { background: rgba(0,0,0,0.7); color: #fff; padding: 16px 20px; border-radius: 8px; min-width: 240px; text-align: center; }
    .spinner { width: 28px; height: 28px; border: 3px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; margin: 0 auto 10px; animation: spin 1s linear infinite; }
    .loading-text { font-size: 14px; margin-bottom: 8px; }
    .loading-bar { width: 100%; height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; overflow: hidden; }
    .loading-bar .fill { height: 100%; background: #4aa3ff; width: 0%; transition: width 0.2s ease; }
    .loading-note { font-size: 12px; opacity: 0.8; margin-top: 8px; }
    @keyframes spin { to { transform: rotate(360deg); } }
</style>
