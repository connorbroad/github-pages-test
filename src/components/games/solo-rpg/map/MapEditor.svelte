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

    function clampCameraToBounds() {
        if (!map || !canvasFg) return;
        const rect = canvasFg.getBoundingClientRect();
        const viewW = rect.width / camera.zoom;
        const viewH = rect.height / camera.zoom;
        const worldW = map.width * map.tileSize;
        const worldH = map.height * map.tileSize;
        const maxX = Math.max(0, worldW - viewW);
        const maxY = Math.max(0, worldH - viewH);
        camera.x = clamp(camera.x, 0, maxX);
        camera.y = clamp(camera.y, 0, maxY);
    }

    function drawGrid() {
        if (!map || !ctxBg) return;
        const { tileSize } = map;
        const { width, height } = canvasBg;
        ctxBg.clearRect(0, 0, width, height);
        // Background fill
        ctxBg.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary') || '#111';
        ctxBg.fillRect(0, 0, width, height);
        // Grid
        ctxBg.save();
        ctxBg.scale(camera.zoom, camera.zoom);
        ctxBg.translate(-camera.x, -camera.y);
        const cols = map.width;
        const rows = map.height;
        ctxBg.strokeStyle = 'rgba(255,255,255,0.1)';
        ctxBg.lineWidth = 1 / camera.zoom;
        for (let x = 0; x <= cols; x++) {
            const gx = Math.round(x * tileSize) + 0.5;
            ctxBg.beginPath();
            ctxBg.moveTo(gx, 0);
            ctxBg.lineTo(gx, rows * tileSize);
            ctxBg.stroke();
        }
        for (let y = 0; y <= rows; y++) {
            const gy = Math.round(y * tileSize) + 0.5;
            ctxBg.beginPath();
            ctxBg.moveTo(0, gy);
            ctxBg.lineTo(cols * tileSize, gy);
            ctxBg.stroke();
        }
        // Paint background tiles
        for (const key in map.background) {
            const [tx, ty] = key.split(',').map(Number);
            const fill = map.background[key];
            ctxBg.fillStyle = fill;
            ctxBg.fillRect(tx * tileSize, ty * tileSize, tileSize, tileSize);
        }
        ctxBg.restore();
    }

    function drawObjects() {
        if (!map || !ctxFg) return;
        ctxFg.clearRect(0, 0, canvasFg.width, canvasFg.height);
        ctxFg.save();
        ctxFg.scale(camera.zoom, camera.zoom);
        ctxFg.translate(-camera.x, -camera.y);
        const objs = [...map.objects].sort((a,b) => (a.z ?? 0) - (b.z ?? 0));
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
        if (tool === 'erase') {
            delete map.background[key];
        } else {
            map.background[key] = color;
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

        // Start panning on middle/right button, or when using Move tool (or play mode) with left/touch
        // Check this FIRST so right/middle click always pans, regardless of objects
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
            queueSave();
            drawObjects();
            return;
        }
    }

    function onPointerMove(e: PointerEvent) {
        if (!map) return;
        // Update pointer
        if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

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
                // Keep base center world under current midpoint
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
    }

    function onPointerUp(e?: PointerEvent) {
        if (e) {
            const target = e.currentTarget as HTMLElement;
            if (target.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId);
            pointers.delete(e.pointerId);
        }
        if (isPanning) {
            startInertia();
        }
        if (draggingObj) {
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
        clampCameraToBounds();
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
