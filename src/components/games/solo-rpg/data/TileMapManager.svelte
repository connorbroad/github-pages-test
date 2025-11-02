<script lang="ts">
    import "../solo-rpg-styles.css";
    import { onMount } from "svelte";
    import { loadTileMaps, saveTileMaps, type TileMap, type TileMapTile } from "./storage-utils";
    import { invalidateTileMap } from "../map/tilemap-cache";

    let tileMaps: TileMap[] = [];

    // Create/edit form state
    let creating = false;
    let editingId: string | null = null;
    let name = "";
    let tileSize: number = 32;
    let imageKind: 'data-url' | 'url' = 'data-url';
    let imageValue = ""; // data URL or URL

    // Derived image state
    let naturalWidth = 0;
    let naturalHeight = 0;
    let columns = 0;
    let rows = 0;
    let tiles: TileMapTile[] = [];

    let fileInput: HTMLInputElement;
    let importError = "";
    let importSuccess = false;

    onMount(() => {
        tileMaps = loadTileMaps();
    });

    function resetForm() {
        creating = false;
        editingId = null;
        name = "";
        tileSize = 32;
        imageKind = 'data-url';
        imageValue = "";
        naturalWidth = 0;
        naturalHeight = 0;
        columns = 0;
        rows = 0;
        tiles = [];
        importError = "";
        importSuccess = false;
        if (fileInput) fileInput.value = "";
    }

    function generateUUID(): string {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    async function handleFileSelect(event: Event) {
        importError = "";
        importSuccess = false;
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        try {
            const dataUrl = await readFileAsDataURL(file);
            imageKind = 'data-url';
            imageValue = dataUrl;
            const dims = await getImageDimensions(dataUrl);
            naturalWidth = dims.width;
            naturalHeight = dims.height;
            if (!tileSize || tileSize <= 0) tileSize = 32;
            columns = Math.floor(naturalWidth / tileSize);
            rows = Math.floor(naturalHeight / tileSize);
            tiles = buildTiles(columns, rows, tileSize);
            creating = true;
        } catch (e: any) {
            importError = "Failed to read image: " + (e?.message || e);
        }
    }

    function buildTiles(cols: number, rows: number, size: number): TileMapTile[] {
        const arr: TileMapTile[] = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const id = `${r}-${c}`;
                arr.push({
                    id,
                    col: c,
                    row: r,
                    x: c * size,
                    y: r * size,
                    w: size,
                    h: size,
                    include: true,
                    allowBackground: true,
                    allowForeground: true,
                });
            }
        }
        return arr;
    }

    function readFileAsDataURL(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('File read error'));
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });
    }

    function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = () => reject(new Error('Image decode error'));
            img.src = src;
        });
    }

    function selectAll(flag: boolean) {
        tiles = tiles.map(t => ({ ...t, include: flag }));
    }
    function setAllBg(flag: boolean) { tiles = tiles.map(t => ({ ...t, allowBackground: flag })); }
    function setAllFg(flag: boolean) { tiles = tiles.map(t => ({ ...t, allowForeground: flag })); }

    function startCreate() {
        creating = true;
        importError = "";
        importSuccess = false;
    }

    function cancelCreate() { resetForm(); }

    function saveTileMap() {
        if (!name.trim()) { importError = 'Please enter a name.'; return; }
        if (!imageValue) { importError = 'Please select an image.'; return; }
        if (!columns || !rows) { importError = 'Image/tile size do not produce any tiles.'; return; }

        const now = Date.now();
        const id = editingId ?? generateUUID();
        const tm: TileMap = {
            id,
            name: name.trim(),
            image: { kind: imageKind, value: imageValue },
            tileSize,
            columns,
            rows,
            tiles,
            createdAt: editingId ? (tileMaps.find(t => t.id === id)?.createdAt ?? now) : now,
            updatedAt: now,
        };

        const next = tileMaps.slice();
        const idx = next.findIndex(t => t.id === id);
        if (idx >= 0) {
            next[idx] = tm;
        } else {
            next.push(tm);
        }
        tileMaps = next;
        saveTileMaps(tileMaps);
        invalidateTileMap(id);
        importSuccess = true;
        // Reset but keep list visible
        resetForm();
    }

    function editTileMap(id: string) {
        const tm = tileMaps.find(t => t.id === id);
        if (!tm) return;
        creating = true;
        editingId = id;
        name = tm.name;
        tileSize = tm.tileSize;
        imageKind = tm.image.kind;
        imageValue = tm.image.value;
        columns = tm.columns;
        rows = tm.rows;
        tiles = tm.tiles.map(t => ({ ...t }));
    }

    function deleteTileMap(id: string) {
        if (!confirm('Delete this tilemap? Maps referencing it will lose tiles.')) return;
        tileMaps = tileMaps.filter(t => t.id !== id);
        saveTileMaps(tileMaps);
        invalidateTileMap(id);
    }
</script>

<div class="info-card content">
    <div class="header">
        <h2>Tilemap Manager</h2>
        <div class="srpg-b-group-horizontal">
            <button class="srpg-b srpg-b-create" on:click={startCreate}>Create Tilemap</button>
        </div>
    </div>

    <div class="body">
        <p class="description">
            Manage tilesheets for use in the Map tool.
        </p>

        {#if creating}
            <div class="creator">
                <div class="form-row">
                    <label for="tilemap-name">Name</label>
                    <input id="tilemap-name" type="text" bind:value={name} placeholder="My Tilesheet" />
                </div>
                <div class="form-row">
                    <label for="tilemap-size">Tile size (px)</label>
                    <input id="tilemap-size" type="number" min="4" step="1" bind:value={tileSize} on:change={() => {
                        if (naturalWidth && naturalHeight && tileSize > 0) {
                            columns = Math.floor(naturalWidth / tileSize);
                            rows = Math.floor(naturalHeight / tileSize);
                            tiles = buildTiles(columns, rows, tileSize);
                        }
                    }} />
                </div>
                <div class="form-row">
                    <label for="tilemap-image">Image</label>
                    <div class="srpg-b-group-horizontal">
                        <button class="srpg-b" on:click={() => fileInput.click()}>Choose Image</button>
                        {#if imageValue}
                            <span class="hint">{columns} × {rows} tiles @ {tileSize}px</span>
                        {/if}
                    </div>
                    <input
                        id="tilemap-image"
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        bind:this={fileInput}
                        on:change={handleFileSelect}
                        style="display:none;"
                    />
                </div>

                {#if imageValue}
                    <div class="bulk-actions">
                        <button class="srpg-b" on:click={() => selectAll(true)}>Include all</button>
                        <button class="srpg-b" on:click={() => selectAll(false)}>Exclude all</button>
                        <button class="srpg-b" on:click={() => setAllBg(true)}>BG on</button>
                        <button class="srpg-b" on:click={() => setAllBg(false)}>BG off</button>
                        <button class="srpg-b" on:click={() => setAllFg(true)}>FG on</button>
                        <button class="srpg-b" on:click={() => setAllFg(false)}>FG off</button>
                    </div>

                    <div class="tiles-grid" style="--tile-size: {tileSize}px;">
                        {#each tiles as t}
                            <div class="tile-card">
                                <div class="tile-preview-frame">
                                    <div class="tile-preview" style="background-image: url('{imageValue}'); background-position: {-t.x}px {-t.y}px; width: {tileSize}px; height: {tileSize}px; transform: scale({24 / tileSize});"></div>
                                </div>
                                <div class="tile-flags">
                                    <label><input type="checkbox" bind:checked={t.include} /> Include</label>
                                    <label><input type="checkbox" bind:checked={t.allowBackground} /> BG</label>
                                    <label><input type="checkbox" bind:checked={t.allowForeground} /> FG</label>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}

                {#if importError}
                    <div class="error-message">{importError}</div>
                {/if}

                <div class="srpg-b-group-horizontal" style="margin-top:1rem;">
                    <button class="srpg-b srpg-b-normal" on:click={saveTileMap}>{editingId ? 'Save Changes' : 'Save Tilemap'}</button>
                    <button class="srpg-b srpg-b-simple" on:click={cancelCreate}>Cancel</button>
                </div>
            </div>
        {/if}
 
        {#if tileMaps.length === 0}
            <em>No tilemaps yet.</em>
        {:else}
            <div class="tilemaps-list">
                {#each tileMaps as tm}
                    <div class="tilemap-row">
                        <button class="srpg-b srpg-b-icon srpg-b-danger" aria-label="Delete tilemap" on:click={() => deleteTileMap(tm.id)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0                             0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                            </svg>
                        </button> 
                        <div class="meta">
                            <strong>{tm.name}</strong>
                            <div class="sub">{tm.columns}×{tm.rows} @ {tm.tileSize}px • {tm.tiles.filter(t=>t.include).length} included</div>
                        </div> 
                        <button class="srpg-b srpg-b-normal" on:click={() => editTileMap(tm.id)}>Edit</button>
                    </div>
                {/each}
            </div>
        {/if}

        {#if importSuccess}
            <div class="success-message">✓ Tilemap saved.</div>
        {/if}
    </div>
</div>

<style>
    .content { padding: 0; max-width: 500px; width: 100%; }
    .header { display:flex; justify-content: space-between; align-items:center; padding:1.5rem; border-bottom:1px solid var(--border-primary); }
    .header h2 { margin:0; font-size:1.5rem; color: var(--text-primary); }
    .body { padding:1.5rem; }
    .description { color: var(--text-secondary); margin-top:0; margin-bottom:1rem; }
    .creator .form-row { margin-bottom: 1rem; display:flex; flex-direction:column; gap:0.25rem; }
    .creator label { color: var(--text-secondary); }
    .hint { color: var(--text-secondary); font-size: 0.9rem; }
    .bulk-actions { display:flex; gap:0.5rem; flex-wrap: wrap; margin: 0.5rem 0 0.75rem; }

    .tiles-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.75rem; }
    .tile-card { border:1px solid var(--border-primary); border-radius:6px; padding:0.5rem; display:flex; gap:0.5rem; align-items:center; }
    .tile-preview { image-rendering: pixelated; background-repeat: no-repeat; border:1px solid var(--border-primary); border-radius:4px; flex-shrink:0; }

    /* 24px preview frame and inner sprite anchoring */
    .tile-preview-frame { width:24px; height:24px; position:relative; overflow:hidden; border:1px solid var(--border-primary); border-radius:4px; flex-shrink:0; }
    .tile-preview-frame > .tile-preview { position:absolute; top:0; left:0; transform-origin: top left; border:none; border-radius:0; }

    .tile-flags { display:flex; gap:0.5rem; align-items:center; }

    .tilemaps-list { display:flex; flex-direction:column; gap:0.5rem; margin-top:0.5rem; }
    .tilemap-row { display:flex; justify-content:space-between; gap:1rem; border:1px solid var(--border-primary); border-radius:6px; padding:0.75rem 1rem; }
    .tilemap-row .sub { color: var(--text-secondary); font-size: 0.9rem; }
</style>