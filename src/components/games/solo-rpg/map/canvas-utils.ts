// Canvas and rendering utilities for the Solo RPG Map Editor

export function clamp(v: number, min: number, max: number) {
    return Math.min(max, Math.max(min, v));
}

// Cap device pixel ratio to reduce fill-rate cost on mobile
export function getCappedDpr(cap: number) {
    const raw =
        typeof window !== "undefined" && (window as any).devicePixelRatio
            ? (window as any).devicePixelRatio
            : 1;
    return Math.min(raw, cap);
}

export function clearCanvas(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    fill?: string
) {
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

const spriteCache: WeakMap<object, Map<string, HTMLCanvasElement>> = new WeakMap();

export function drawTintedSprite(
    ctx: CanvasRenderingContext2D,
    sprite: CanvasImageSource,
    x: number,
    y: number,
    w: number,
    h: number,
    tint: string | null
) {
    if (!tint || tint === "clear") {
        ctx.drawImage(sprite as any, x, y, w, h);
        return;
    }

    const keyW = Math.max(1, Math.floor(w));
    const keyH = Math.max(1, Math.floor(h));
    const imageSource = sprite as any as object;

    let cachedImage = spriteCache.get(imageSource);
    if (!cachedImage) {
        cachedImage = new Map();
        spriteCache.set(imageSource, cachedImage);
    }

    const cacheKey = `${keyW}x${keyH}|${tint}`;
    let cachedSprite = cachedImage.get(cacheKey);
    if (!cachedSprite) {
        cachedSprite = createAndCacheTintedSprite(sprite, keyW, keyH, tint);
    }

    ctx.drawImage(cachedSprite, x, y, w, h);
}

function createAndCacheTintedSprite(
    sprite: CanvasImageSource,
    w: number,
    h: number,
    tint: string
): HTMLCanvasElement {
    const newSprite = document.createElement("canvas");
    newSprite.width = w;
    newSprite.height = h;

    const ctx = newSprite.getContext("2d")!;
    ctx.imageSmoothingEnabled = false; // for pixel art

    // Clear previous contents
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, newSprite.width, newSprite.height);

    // Base sprite
    ctx.drawImage(sprite as any, 0, 0, w, h);

    // Multiply tint over it
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, newSprite.width, newSprite.height);

    // Mask to sprite alpha
    ctx.globalCompositeOperation = "destination-atop";

    ctx.drawImage(sprite as any, 0, 0, w, h);

    // Reset for safety
    ctx.globalCompositeOperation = "source-over";

    return newSprite;
}

export type ShapeKind = "square" | "circle" | "triangle" | "star";

export function beginShapePath(
    ctx: CanvasRenderingContext2D,
    shape: ShapeKind,
    w: number,
    h: number
) {
    ctx.beginPath();
    if (shape === "square") {
        ctx.rect(-w / 2, -h / 2, w, h);
    } else if (shape === "circle") {
        ctx.arc(0, 0, Math.min(w, h) / 2, 0, Math.PI * 2);
    } else if (shape === "triangle") {
        ctx.moveTo(0, -h / 2);
        ctx.lineTo(w / 2, h / 2);
        ctx.lineTo(-w / 2, h / 2);
        ctx.closePath();
    } else if (shape === "star") {
        const spikes = 5;
        const outer = Math.min(w, h) / 2;
        const inner = outer / 2; // match non-tile star style
        let rot = (Math.PI / 2) * 3;
        let cx = 0;
        let cy = 0;
        let step = Math.PI / spikes;
        ctx.moveTo(cx, cy - outer);
        for (let i = 0; i < spikes; i++) {
            ctx.lineTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer);
            rot += step;
            ctx.lineTo(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner);
            rot += step;
        }
        ctx.lineTo(cx, cy - outer);
        ctx.closePath();
    }
}
