import { getCachedTileSprite, getTileSprite } from "./tilemap-cache";
import { beginShapePath, clearCanvas, drawTintedSprite } from "./canvas-utils";
import type { MapEntity, MapObject } from "../data/storage-utils";

export type Camera = { x: number; y: number; zoom: number };

export function drawGrid(opts: {
    ctxBg: CanvasRenderingContext2D;
    canvasBg: HTMLCanvasElement;
    camera: Camera;
    map: MapEntity;
    isLoading: boolean;
    getDpr: () => number;
    onInvalidate: () => void; // call when async sprite loads to schedule a repaint
    bgColor?: string;
    gridColor?: string;
    viewRect?: DOMRect;
    editMode?: "move" | "background" | "object";
    mapMode?: "edit" | "play";
}) {
    const {
        ctxBg,
        canvasBg,
        camera,
        map,
        isLoading,
        getDpr,
        onInvalidate,
        bgColor,
        gridColor,
        viewRect,
        editMode,
        mapMode,
    } = opts;
    if (!ctxBg) return;

    // Apply faded effect when in object mode AND edit mode (background should be less prominent)
    // In play mode, always render at full opacity
    const shouldFade = mapMode === "edit" && editMode === "object";
    const fadeAlpha = shouldFade ? 0.4 : 1.0;

    const bgFill =
        bgColor ||
        getComputedStyle(document.documentElement).getPropertyValue("--bg-primary") ||
        "#111";

    if (isLoading) {
        clearCanvas(ctxBg, canvasBg, bgFill);
        return;
    }

    const ts = map.tileSize;
    clearCanvas(ctxBg, canvasBg, bgFill);

    const rect = viewRect || canvasBg.getBoundingClientRect();
    const viewW = rect.width / camera.zoom;
    const viewH = rect.height / camera.zoom;
    const startTx = Math.floor(camera.x / ts) - 1;
    const endTx = Math.ceil((camera.x + viewW) / ts) + 1;
    const startTy = Math.floor(camera.y / ts) - 1;
    const endTy = Math.ceil((camera.y + viewH) / ts) + 1;

    const dpr = getDpr();
    ctxBg.save();
    ctxBg.scale(dpr * camera.zoom, dpr * camera.zoom);
    ctxBg.translate(-camera.x, -camera.y);
    ctxBg.imageSmoothingEnabled = false;
    ctxBg.globalAlpha = fadeAlpha;
    ctxBg.strokeStyle = gridColor || "rgba(255,255,255,0.1)";
    ctxBg.lineWidth = 1 / (camera.zoom * dpr);

    const left = startTx * ts;
    const right = endTx * ts;
    const top = startTy * ts;
    const bottom = endTy * ts;
    const px = 0.5 / dpr;

    let gridStep = 1;
    if (camera.zoom < 0.35) gridStep = 0;
    else if (camera.zoom < 0.5) gridStep = 4;
    else if (camera.zoom < 0.75) gridStep = 2;

    if (gridStep > 0) {
        const gridStartTx = Math.floor(startTx / gridStep) * gridStep;
        const gridStartTy = Math.floor(startTy / gridStep) * gridStep;

        ctxBg.beginPath();
        for (let tx = gridStartTx; tx <= endTx; tx += gridStep) {
            const gx = Math.round(tx * ts) + px;
            ctxBg.moveTo(gx, top);
            ctxBg.lineTo(gx, bottom);
        }
        for (let ty = gridStartTy; ty <= endTy; ty += gridStep) {
            const gy = Math.round(ty * ts) + px;
            ctxBg.moveTo(left, gy);
            ctxBg.lineTo(right, gy);
        }
        ctxBg.stroke();
    }

    for (const key in map.background) {
        const [tx, ty] = key.split(",").map(Number);
        if (tx < startTx || tx > endTx || ty < startTy || ty > endTy) continue;
        const fill = map.background[key];
        ctxBg.fillStyle = fill;
        ctxBg.fillRect(tx * ts, ty * ts, ts, ts);
    }

    if (map.backgroundTiles) {
        const dict = map.backgroundTiles;
        const total = Object.keys(dict).length;
        const visibleCount = (endTx - startTx + 1) * (endTy - startTy + 1);
        if (total < visibleCount) {
            for (const key in dict) {
                const ref = dict[key];
                if (!ref) continue;
                const [tx, ty] = key.split(",").map(Number);
                if (tx < startTx || tx > endTx || ty < startTy || ty > endTy) continue;
                const sprite = getCachedTileSprite(ref);
                const x = tx * ts;
                const y = ty * ts;
                const tint = (map as any).backgroundTileTints?.[key] ?? null;
                if (sprite) {
                    drawTintedSprite(ctxBg, sprite as any, x, y, ts, ts, tint);
                } else {
                    getTileSprite(ref)
                        .then(onInvalidate)
                        .catch(() => {
                            ctxBg.save();
                            ctxBg.fillStyle = "#ff00ff";
                            ctxBg.fillRect(x, y, ts, ts);
                            ctxBg.restore();
                        });
                }
            }
        } else {
            for (let ty = startTy; ty <= endTy; ty++) {
                for (let tx = startTx; tx <= endTx; tx++) {
                    const key = `${tx},${ty}`;
                    const ref = dict[key];
                    if (!ref) continue;
                    const sprite = getCachedTileSprite(ref);
                    const x = tx * ts;
                    const y = ty * ts;
                    const tint = (map as any).backgroundTileTints?.[key] ?? null;
                    if (sprite) {
                        drawTintedSprite(ctxBg, sprite as any, x, y, ts, ts, tint);
                    } else {
                        getTileSprite(ref)
                            .then(onInvalidate)
                            .catch(() => {
                                ctxBg.save();
                                ctxBg.fillStyle = "#ff00ff";
                                ctxBg.fillRect(x, y, ts, ts);
                                ctxBg.restore();
                            });
                    }
                }
            }
        }
    }
    ctxBg.restore();
    ctxBg.globalAlpha = 1.0;
    ctxBg.globalCompositeOperation = "source-over";
}

export function drawFgObjects(opts: {
    ctxFg: CanvasRenderingContext2D;
    canvasFg: HTMLCanvasElement;
    camera: Camera;
    map: MapEntity;
    selectedObject: MapObject | null;
    currentTurnObjectId?: string | null;
    showSelectionHandles: boolean;
    getDpr: () => number;
    onInvalidate: () => void;
    viewRect?: DOMRect;
    editMode?: "move" | "background" | "object";
    mapMode?: "edit" | "play";
}) {
    const {
        ctxFg,
        canvasFg,
        camera,
        map,
        selectedObject,
        currentTurnObjectId,
        showSelectionHandles,
        getDpr,
        onInvalidate,
        viewRect,
        editMode,
        mapMode,
    } = opts;
    if (!ctxFg) return;

    clearCanvas(ctxFg, canvasFg);

    // Apply transparent effect when in background mode AND edit mode (objects should be less prominent)
    // In play mode, always render at full opacity
    const shouldFade = mapMode === "edit" && editMode === "background";
    const fadeAlpha = shouldFade ? 0.3 : 1.0;

    const dpr = getDpr();
    ctxFg.save();
    ctxFg.globalCompositeOperation = "source-over";
    ctxFg.globalAlpha = fadeAlpha;
    ctxFg.scale(dpr * camera.zoom, dpr * camera.zoom);
    ctxFg.translate(-camera.x, -camera.y);
    ctxFg.imageSmoothingEnabled = false;

    const rect = viewRect || canvasFg.getBoundingClientRect();
    const viewW = rect.width / camera.zoom;
    const viewH = rect.height / camera.zoom;
    const cameraLeft = camera.x;
    const cameraRight = camera.x + viewW;
    const cameraTop = camera.y;
    const cameraBottom = camera.y + viewH;

    for (const o of map.objects) {
        const objectRight = o.x + o.w / 2;
        const objectBottom = o.y + o.h / 2;
        const objectLeft = o.x - o.w / 2;
        const objectTop = o.y - o.h / 2;
        if (
            objectRight < cameraLeft ||
            objectLeft > cameraRight ||
            objectBottom < cameraTop ||
            objectTop > cameraBottom
        ) {
            continue;
        }

        ctxFg.save();
        ctxFg.translate(o.x, o.y);

        // Apply rotation if any
        if (o.rotation) {
            ctxFg.rotate(o.rotation);
        }

        // Apply flips
        const fx = o.flipX ? -1 : 1;
        const fy = o.flipY ? -1 : 1;
        if (fx !== 1 || fy !== 1) {
            ctxFg.scale(fx, fy);
        }

        if (o.kind === "tile" && o.tile) {
            const ref = o.tile;
            const sprite = getCachedTileSprite(ref);
            const tint = !o.color || o.color === "clear" ? null : o.color;
            const shape = (o.type ?? "square") as "square" | "circle" | "triangle" | "star";

            if (sprite) {
                if (shape === "square") {
                    drawTintedSprite(ctxFg, sprite as any, -o.w / 2, -o.h / 2, o.w, o.h, tint);
                } else {
                    beginShapePath(ctxFg, shape, o.w, o.h);
                    ctxFg.clip();
                    drawTintedSprite(ctxFg, sprite as any, -o.w / 2, -o.h / 2, o.w, o.h, tint);
                }

                // Always draw a fine black outline around everything to help it "pop"
                ctxFg.strokeStyle = "#000000";
                ctxFg.lineWidth = 2 / (camera.zoom * dpr);
                if (shape === "square") {
                    ctxFg.strokeRect(-o.w / 2, -o.h / 2, o.w, o.h);
                } else {
                    beginShapePath(ctxFg, shape, o.w, o.h);
                    ctxFg.stroke();
                }
            } else {
                getTileSprite(ref)
                    .then(onInvalidate)
                    .catch(() => {
                        ctxFg.fillStyle = "#ff00ff";
                        ctxFg.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
                    });
            }
        } else {
            // Shape only
            const shape = (o.type ?? "square") as any;
            ctxFg.fillStyle = o.color;
            ctxFg.strokeStyle = "#000000";
            ctxFg.lineWidth = 2 / (camera.zoom * dpr);

            beginShapePath(ctxFg, shape, o.w, o.h);
            ctxFg.fill();
            ctxFg.stroke();
        }

        ctxFg.restore();

        // Draw turn indicator if this is the current turn object
        if (mapMode === "play" && currentTurnObjectId === o.id) {
            const time = performance.now();

            // Cute bouncing star above
            const bounceHeight = 6;
            const bounceSpeed = 0.004;
            const offset = Math.sin(time * bounceSpeed) * bounceHeight;

            const indicatorSize = Math.max(20, Math.min(40, o.w * 0.6));

            const starY = o.y - o.h / 2 - indicatorSize / 2 - 8 - Math.abs(offset);

            ctxFg.save();
            ctxFg.translate(o.x, starY);

            // Add a glow effect
            ctxFg.shadowColor = "#f1c40f";
            ctxFg.shadowBlur = 10;
            ctxFg.fillStyle = "#f1c40f";
            ctxFg.strokeStyle = "#ffffff";
            ctxFg.lineWidth = 2 / (camera.zoom * dpr);

            // Stylized triangle (Arrowhead/Chevron)
            // Points down to the token
            // Top middle is recessed (lower) than the top corners

            const halfSize = indicatorSize / 2;
            const indentation = halfSize * 0.4; // How deep the top dip is

            ctxFg.beginPath();
            // Bottom tip (pointing to token)
            ctxFg.lineTo(0, halfSize);
            // Top Right
            ctxFg.lineTo(halfSize, -halfSize);
            // Top Middle (recessed)
            ctxFg.lineTo(0, -halfSize + indentation);
            // Top Left
            ctxFg.lineTo(-halfSize, -halfSize);

            ctxFg.closePath();

            ctxFg.fill();
            ctxFg.stroke();
            ctxFg.restore();
        }
    }

    if (selectedObject && showSelectionHandles) {
        const handleSize = 16 / (camera.zoom * dpr);
        const handleOffset = 8 / (camera.zoom * dpr);

        const handleX = selectedObject.x + selectedObject.w / 2 + handleOffset;
        const handleY = selectedObject.y + selectedObject.h / 2 + handleOffset;

        ctxFg.fillStyle = "#ffffff";
        ctxFg.fillRect(handleX - handleSize / 2, handleY - handleSize / 2, handleSize, handleSize);

        ctxFg.strokeStyle = "#3498db";
        ctxFg.lineWidth = 2 / (camera.zoom * dpr);
        ctxFg.strokeRect(
            handleX - handleSize / 2,
            handleY - handleSize / 2,
            handleSize,
            handleSize
        );

        ctxFg.strokeStyle = "#3498db";
        ctxFg.lineWidth = 2 / (camera.zoom * dpr);
        ctxFg.setLineDash([8 / (camera.zoom * dpr), 4 / (camera.zoom * dpr)]);
        ctxFg.strokeRect(
            selectedObject.x - selectedObject.w / 2,
            selectedObject.y - selectedObject.h / 2,
            selectedObject.w,
            selectedObject.h
        );
        ctxFg.setLineDash([]);
    }
    ctxFg.restore();
    ctxFg.globalAlpha = 1.0;
    ctxFg.globalCompositeOperation = "source-over";
}
