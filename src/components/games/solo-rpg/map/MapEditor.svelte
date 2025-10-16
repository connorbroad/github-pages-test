<script lang="ts">
    import { onMount, onDestroy, createEventDispatcher } from "svelte";
    import { loadMaps, saveMaps, type MapEntity, type MapObject } from "../data/storage-utils";

    export let mapId: string;
    // Receive editor UI state from sidebars
    export let mode: "edit" | "play" = "edit";
    export let tool: "paint" | "object" | "move" | "erase" = "paint";
    export let currentShape: MapObject["type"] = "square";
    export let color: string = "#2980b9";

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

    function drawGrid() {
        if (!map || !ctxBg) return;
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

        // Paint background tiles (only visible region)
        for (const key in map.background) {
            const [tx, ty] = key.split(',').map(Number);
            if (tx < startTx || tx > endTx || ty < startTy || ty > endTy) continue;
            const fill = map.background[key];
            ctxBg.fillStyle = fill;
            ctxBg.fillRect(tx * ts, ty * ts, ts, ts);
        }
        ctxBg.restore();
    }

    function drawObjects() {
        if (!map || !ctxFg) return;
        // Clear full canvas (no fill background on fg layer)
        clearCanvas(ctxFg, canvasFg);

        // Compute visible world rect
        const rect = canvasFg.getBoundingClientRect();
        const viewW = rect.width / camera.zoom;
        const viewH = rect.height / camera.zoom;
        const left = camera.x;
        const right = camera.x + viewW;
        const top = camera.y;
        const bottom = camera.y + viewH;

        ctxFg.save();
        ctxFg.scale(camera.zoom, camera.zoom);
        ctxFg.translate(-camera.x, -camera.y);
        const objs = [...map.objects]
            .sort((a,b) => (a.z ?? 0) - (b.z ?? 0))
            .filter(o => {
                const ox1 = o.x - o.w/2, ox2 = o.x + o.w/2;
                const oy1 = o.y - o.h/2, oy2 = o.y + o.h/2;
                return ox2 >= left && ox1 <= right && oy2 >= top && oy1 <= bottom;
            });
        for (const o of objs) {
            ctxFg.fillStyle = o.color;
            ctxFg.strokeStyle = o.color;
            ctxFg.save();
            ctxFg.translate(o.x, o.y);
            if (o.rotation) ctxFg.rotate(o.rotation);
            switch (o.type) {
                case 'square':
                    ctxFg.fillRect(-o.w/2, -o.h/2, o.w, o.h);
                    break;
                case 'circle':
                    ctxFg.beginPath();
                    ctxFg.arc(0, 0, Math.min(o.w, o.h)/2, 0, Math.PI*2);
                    ctxFg.fill();
                    break;
                case 'triangle':
                    ctxFg.beginPath();
                    ctxFg.moveTo(0, -o.h/2);
                    ctxFg.lineTo(-o.w/2, o.h/2);
                    ctxFg.lineTo(o.w/2, o.h/2);
                    ctxFg.closePath();
                    ctxFg.fill();
                    break;
                case 'star':
                    drawStar(ctxFg, 0, 0, 5, Math.min(o.w,o.h)/2, Math.min(o.w,o.h)/4);
                    break;
            }
            ctxFg.restore();
        }
        ctxFg.restore();
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

    function paintAt(sx: number, sy: number) {
        if (!map || mode === 'play') return;
        const { x, y } = screenToWorld(sx, sy);
        const { tx, ty } = worldToTile(x, y);
        const key = `${tx},${ty}`;
        const existed = Object.prototype.hasOwnProperty.call(map.background, key);
        if (tool === 'erase') {
            if (existed) {
                delete map.background[key];
                // Erase can shrink bounds; mark dirty to recompute lazily
                invalidateBounds();
            }
        } else {
            map.background[key] = color;
            if (!existed) {
                // Expand cached bounds if present, else mark dirty
                if (cachedBounds && !boundsDirty) {
                    const ts = map.tileSize;
                    const x1 = tx * ts, y1 = ty * ts, x2 = x1 + ts, y2 = y1 + ts;
                    cachedBounds.minX = Math.min(cachedBounds.minX, x1);
                    cachedBounds.minY = Math.min(cachedBounds.minY, y1);
                    cachedBounds.maxX = Math.max(cachedBounds.maxX, x2);
                    cachedBounds.maxY = Math.max(cachedBounds.maxY, y2);
                } else {
                    invalidateBounds();
                }
            }
        }
        queueSave();
        drawGrid();
    }

    // Interaction state
    let draggingObj: MapObject | null = null;
    let dragOffset = { x: 0, y: 0 };
    let isPanning = false;
    let lastPan = { x: 0, y: 0 };
    let lastPanTime = 0;
    let velocity = { x: 0, y: 0 }; // world units per ms for camera
    let inertiaRaf: number | null = null;
    
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
        if (!map) return;
        e.preventDefault();
        const factor = Math.pow(1.0015, -e.deltaY);
        setZoomAround(camera.zoom * factor, e.clientX, e.clientY);
    }

    function onPointerDown(e: PointerEvent) {
        if (!map) return;
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

        // Double-tap detection on touch for Move tool / Play mode
        const isTouch = e.pointerType === 'touch';
        const allowDoubleTap = isTouch && (tool === 'move' || mode === 'play');
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
        }

        // If manual zoom just initiated, don't fall through to pan/other interactions
        if (manualZoomActive) return;

        // Start panning on middle/right button, or when using Move tool (or play mode) with left/touch
        if (e.button === 1 || e.button === 2 || tool === 'move' || mode === 'play') {
            isPanning = true;
            lastPan = { x: e.clientX, y: e.clientY };
            lastPanTime = e.timeStamp;
            return;
        }

        // Compute world position to decide object hit vs other interactions
        const { x, y } = screenToWorld(e.clientX, e.clientY);

        if (mode === 'edit' && (tool === 'paint' || tool === 'erase')) {
            paintAt(e.clientX, e.clientY);
            return;
        }

        // Foreground interaction (single finger/mouse left)
        const objs = [...map.objects].sort((a,b) => (b.z ?? 0) - (a.z ?? 0));
        const hit = objs.find(o => Math.abs(x - o.x) <= o.w/2 && Math.abs(y - o.y) <= o.h/2);
        if (hit) {
            draggingObj = hit;
            dragOffset.x = x - hit.x;
            dragOffset.y = y - hit.y;
            return;
        }

        // Object placement in edit mode with object tool
        if (mode === 'edit' && tool === 'object' && e.button === 0) {
            const newObj: MapObject = {
                id: crypto.randomUUID(),
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
        if (!map) return;
        // Update pointer
        if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

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
        } else if (mode === 'edit' && (tool === 'paint' || tool === 'erase') && (e.buttons & 1)) {
            paintAt(e.clientX, e.clientY);
        }

        // Handle manual zoom with double-tap+drag
        if (manualZoomActive && e.pointerId === manualZoomPointerId) {
            const dy = e.clientY - manualZoomBase.anchorScreen.y;
            const dt = Math.max(1, e.timeStamp - manualZoomStartTime);
            const zoomDelta = Math.exp(-MANUAL_ZOOM_RATE * dy);
            camera.zoom = clamp(manualZoomBase.zoom * zoomDelta, MIN_ZOOM, MAX_ZOOM);
            const { x, y } = manualZoomBase.anchorWorld;
            camera.x = x - (x - camera.x) * zoomDelta;
            camera.y = y - (y - camera.y) * zoomDelta;
            clampCameraToBounds();
            map.view = { ...camera };
            drawGrid();
            drawObjects();
        }
    }

    function onPointerUp(e?: PointerEvent) {
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
        isPanning = false;
    }

    onMount(() => {
        ctxBg = canvasBg.getContext('2d')!;
        ctxFg = canvasFg.getContext('2d')!;
        // Load map entity from storage
        const all = loadMaps();
        map = all.find(m => m.id === mapId) || null;
        if (!map) return;
        camera = map.view || { x: 0, y: 0, zoom: 1 };
        // Set canvas size to container size
        resizeCanvas();
        drawGrid();
        drawObjects();
        window.addEventListener('resize', resizeCanvas, { passive: true });
    });

    onDestroy(() => {
        window.removeEventListener('resize', resizeCanvas);
        if (map) {
            map.view = camera;
            queueSave();
        }
    });

    function resizeCanvas() {
        const parent = canvasFg.parentElement!;
        const dpr = window.devicePixelRatio || 1;
        const w = parent.clientWidth;
        const h = parent.clientHeight;
        for (const c of [canvasBg, canvasFg]) {
            c.width = Math.floor(w * dpr);
            c.height = Math.floor(h * dpr);
            c.style.width = w + 'px';
            c.style.height = h + 'px';
            const ctx = c.getContext('2d')!;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        clampCameraToBounds();
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
    </div>

    <!-- Inline toolbar removed; sidebars provide controls -->
</div>

<style>
    .map-editor {
        position: relative;
        width: 100%;
        height: calc(100dvh - 90px); /* mobile baseline; accounted by sidebars outside */
    }

    .canvas-wrap {
        position: absolute;
        inset: 0;
        overflow: hidden;
        touch-action: none; /* pinch/pan handled manually */
    }

    .layer { position: absolute; inset: 0; }
    .layer-bg { z-index: 0; }
    .layer-fg { z-index: 1; }
</style>
