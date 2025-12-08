<script lang="ts">
    /**
     * TokenPreview.svelte
     *
     * A small canvas-based preview of a token showing shape + tile + color combination.
     * Used in TokenSelectorModal preview and TertiarySidebar button thumbnail.
     */
    import { onMount, afterUpdate } from "svelte";
    import { loadTileMaps, type TileMap } from "../../data/storage-utils";
    import { beginShapePath, drawTintedSprite, type ShapeKind } from "../canvas-utils";
    import { CLEAR_COLOR } from "./color-palette";

    export let shape: ShapeKind = "square";
    export let color: string = "#2980b9";
    export let tile: { tileMapId: string; tileId: string } | null = null;
    export let size: number = 40;

    let canvas: HTMLCanvasElement;
    let tileMaps: TileMap[] = [];
    let tileImage: HTMLImageElement | null = null;
    let tileData: { x: number; y: number; w: number; h: number } | null = null;

    onMount(() => {
        try {
            tileMaps = loadTileMaps();
        } catch {}
        loadTileImage();
        draw();
    });

    // Reload tile image when tile prop changes
    $: if (tile) {
        loadTileImage();
    } else {
        tileImage = null;
        tileData = null;
    }

    // Redraw when any prop changes
    afterUpdate(() => {
        draw();
    });

    function loadTileImage() {
        if (!tile) {
            tileImage = null;
            tileData = null;
            return;
        }

        const tm = tileMaps.find((t) => t.id === tile.tileMapId);
        if (!tm?.image?.value) {
            tileImage = null;
            tileData = null;
            return;
        }

        const tileInfo = tm.tiles.find((t) => t.id === tile.tileId);
        if (!tileInfo) {
            tileImage = null;
            tileData = null;
            return;
        }

        tileData = { x: tileInfo.x, y: tileInfo.y, w: tileInfo.w, h: tileInfo.h };

        const img = new Image();
        img.onload = () => {
            tileImage = img;
            draw();
        };
        img.src = tm.image.value;
    }

    function draw() {
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Use higher internal resolution for sharper rendering
        const dpr = Math.max(window.devicePixelRatio || 1, 2);
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);

        // Disable image smoothing for crisp pixel art
        ctx.imageSmoothingEnabled = false;

        // Clear
        ctx.clearRect(0, 0, size, size);

        // Setup
        ctx.save();
        ctx.translate(size / 2, size / 2);

        const drawSize = size * 0.8;

        if (tileImage && tileData) {
            // Draw tile with shape clipping and color tint
            ctx.save();
            beginShapePath(ctx, shape, drawSize, drawSize);
            ctx.clip();

            // Create a temp canvas to extract the tile sprite
            const spriteCanvas = document.createElement("canvas");
            spriteCanvas.width = tileData.w;
            spriteCanvas.height = tileData.h;
            const spriteCtx = spriteCanvas.getContext("2d")!;
            spriteCtx.imageSmoothingEnabled = false;
            spriteCtx.drawImage(
                tileImage,
                tileData.x,
                tileData.y,
                tileData.w,
                tileData.h,
                0,
                0,
                tileData.w,
                tileData.h
            );

            // Draw tinted sprite
            const tint = color === CLEAR_COLOR ? null : color;
            drawTintedSprite(
                ctx,
                spriteCanvas,
                -drawSize / 2,
                -drawSize / 2,
                drawSize,
                drawSize,
                tint
            );

            ctx.restore();

            // Draw shape outline
            ctx.strokeStyle = "var(--border-primary)";
            ctx.lineWidth = 1;
            beginShapePath(ctx, shape, drawSize, drawSize);
            ctx.stroke();
        } else {
            // Draw color-only shape
            if (color === CLEAR_COLOR) {
                // Draw clear pattern
                ctx.fillStyle = "var(--bg-tertiary)";
                beginShapePath(ctx, shape, drawSize, drawSize);
                ctx.fill();

                // Draw diagonal lines pattern
                ctx.save();
                beginShapePath(ctx, shape, drawSize, drawSize);
                ctx.clip();
                ctx.strokeStyle = "var(--border-primary)";
                ctx.lineWidth = 1;
                for (let i = -drawSize; i < drawSize * 2; i += 4) {
                    ctx.beginPath();
                    ctx.moveTo(-drawSize / 2 + i, -drawSize / 2);
                    ctx.lineTo(-drawSize / 2 + i - drawSize, drawSize / 2);
                    ctx.stroke();
                }
                ctx.restore();
            } else {
                ctx.fillStyle = color;
                beginShapePath(ctx, shape, drawSize, drawSize);
                ctx.fill();
            }

            // Draw shape outline
            ctx.strokeStyle = "var(--border-primary)";
            ctx.lineWidth = 1;
            beginShapePath(ctx, shape, drawSize, drawSize);
            ctx.stroke();
        }

        ctx.restore();
    }
</script>

<canvas bind:this={canvas} class="token-preview-canvas" style="width: {size}px; height: {size}px;">
</canvas>

<style>
    .token-preview-canvas {
        display: block;
        image-rendering: pixelated;
        border-radius: 4px;
    }
</style>
