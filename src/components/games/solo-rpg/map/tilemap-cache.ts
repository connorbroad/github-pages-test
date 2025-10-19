import { getTileMapById, type TileMap, type TileMapTile, type TileRef } from "../data/storage-utils";

// Simple cache for images and per-tile sprites
const imageCache = new Map<string, HTMLImageElement | ImageBitmap>();
const spriteCache = new Map<string, HTMLCanvasElement | ImageBitmap>();
const stateCache = new Map<string, 'ok' | 'image-missing' | 'not-found'>();
// Promise cache to avoid concurrent duplicate work for same tile
const spritePromiseCache = new Map<string, Promise<HTMLCanvasElement | ImageBitmap | null>>();
// Per-tilemap fast index for tileId -> tile rect
const tileIndexCache = new Map<string, Map<string, TileMapTile>>();

function makeKey(ref: TileRef) {
    return `${ref.tileMapId}:${ref.tileId}`;
}

function makeMagenta(size: number): HTMLCanvasElement {
    const cnv = document.createElement('canvas');
    cnv.width = size; cnv.height = size;
    const ctx = cnv.getContext('2d')!;
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(0,0,size,size);
    return cnv;
}

async function loadImage(tileMap: TileMap): Promise<HTMLImageElement | ImageBitmap> {
    if (imageCache.has(tileMap.id)) return imageCache.get(tileMap.id)!;
    const src = tileMap.image.value;
    try {
        // Prefer createImageBitmap for performance if possible (base image only)
        if ('createImageBitmap' in window) {
            const resp = await fetch(src);
            if (!resp.ok) throw new Error('fetch failed');
            const blob = await resp.blob();
            const bmp = await createImageBitmap(blob);
            imageCache.set(tileMap.id, bmp);
            stateCache.set(tileMap.id, 'ok');
            return bmp;
        } else {
            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                const i = new Image();
                // Allow cross-origin for URL images
                if (tileMap.image.kind === 'url') i.crossOrigin = 'anonymous';
                i.onload = () => resolve(i);
                i.onerror = () => reject(new Error('image load error'));
                i.src = src;
            });
            imageCache.set(tileMap.id, img);
            stateCache.set(tileMap.id, 'ok');
            return img;
        }
    } catch (e) {
        stateCache.set(tileMap.id, 'image-missing');
        return Promise.reject(e);
    }
}

export async function ensureTileMapLoaded(tileMap: TileMap): Promise<void> {
    if (stateCache.get(tileMap.id) === 'ok') return;
    try {
        await loadImage(tileMap);
    } catch {
        // On failure, do not pre-seed all placeholders to avoid heavy loops; lazy on demand
    }
}

export function getTileMapLoadState(tileMapId: string): 'ok' | 'image-missing' | 'not-found' {
    if (!stateCache.has(tileMapId)) {
        const tm = getTileMapById(tileMapId);
        if (!tm) return 'not-found';
        return stateCache.get(tileMapId) ?? 'image-missing';
    }
    return stateCache.get(tileMapId)!;
}

export function invalidateTileMap(tileMapId: string): void {
    imageCache.delete(tileMapId);
    stateCache.delete(tileMapId);
    tileIndexCache.delete(tileMapId);
    // Remove all sprite entries belonging to this tilemap
    for (const k of Array.from(spriteCache.keys())) {
        if (k.startsWith(tileMapId + ':')) spriteCache.delete(k);
    }
    for (const k of Array.from(spritePromiseCache.keys())) {
        if (k.startsWith(tileMapId + ':')) spritePromiseCache.delete(k);
    }
}

function getTileIndex(tileMap: TileMap): Map<string, TileMapTile> {
    let idx = tileIndexCache.get(tileMap.id);
    if (!idx) {
        idx = new Map<string, TileMapTile>();
        for (const t of tileMap.tiles) {
            idx.set(t.id, t);
        }
        tileIndexCache.set(tileMap.id, idx);
    }
    return idx;
}

export async function getTileSprite(ref: TileRef): Promise<HTMLCanvasElement | ImageBitmap | null> {
    const key = makeKey(ref);
    if (spriteCache.has(key)) return spriteCache.get(key)!;
    if (spritePromiseCache.has(key)) return spritePromiseCache.get(key)!;

    const tileMap = getTileMapById(ref.tileMapId);
    if (!tileMap) return null;

    const p = (async () => {
        // Ensure image is loaded or placeholder state set
        try {
            await ensureTileMapLoaded(tileMap);
        } catch {
            // If image missing, return magenta placeholder lazily
            const mag = makeMagenta(tileMap.tileSize);
            spriteCache.set(key, mag);
            return mag;
        }

        const baseImg = imageCache.get(tileMap.id);
        if (!baseImg) {
            const mag = makeMagenta(tileMap.tileSize);
            spriteCache.set(key, mag);
            return mag;
        }

        const t = getTileIndex(tileMap).get(ref.tileId);
        if (!t) return null;
        const { x, y, w, h } = t;

        // Canvas-based slice (more predictable and avoids heavy createImageBitmap per tile)
        const cnv = document.createElement('canvas');
        cnv.width = w; cnv.height = h;
        const ctx = cnv.getContext('2d')!;
        // Disable smoothing for pixel art when slicing
        ctx.imageSmoothingEnabled = false;
        // @ts-ignore drawImage accepts ImageBitmap as CanvasImageSource
        ctx.drawImage(baseImg as any, x, y, w, h, 0, 0, w, h);
        spriteCache.set(key, cnv);
        return cnv;
    })();

    spritePromiseCache.set(key, p);
    try {
        const result = await p;
        return result;
    } finally {
        spritePromiseCache.delete(key);
    }
}

export function getCachedTileSprite(ref: TileRef): HTMLCanvasElement | ImageBitmap | null {
    const key = `${ref.tileMapId}:${ref.tileId}`;
    return spriteCache.get(key) ?? null;
}
