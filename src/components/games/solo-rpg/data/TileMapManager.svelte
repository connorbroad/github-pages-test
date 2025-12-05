<script lang="ts">
    import { onMount } from "svelte";
    import { loadTileMaps, saveTileMaps, type TileMap, type TileMapTile } from "./storage-utils";
    import { invalidateTileMap } from "../map/tilemap-cache";

    let tileMaps: TileMap[] = [];

    // Create/edit form state
    let creating = false;
    let editingId: string | null = null;
    let name = "";
    let tileSize: number = 32;
    let imageKind: "data-url" | "url" = "data-url";
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
        imageKind = "data-url";
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
        if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
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
            imageKind = "data-url";
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
            reader.onerror = () => reject(new Error("File read error"));
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });
    }

    function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = () => reject(new Error("Image decode error"));
            img.src = src;
        });
    }

    function selectAll(flag: boolean) {
        tiles = tiles.map((t) => ({ ...t, include: flag }));
    }
    function setAllBg(flag: boolean) {
        tiles = tiles.map((t) => ({ ...t, allowBackground: flag }));
    }
    function setAllFg(flag: boolean) {
        tiles = tiles.map((t) => ({ ...t, allowForeground: flag }));
    }

    function startCreate() {
        creating = true;
        importError = "";
        importSuccess = false;
    }

    function cancelCreate() {
        resetForm();
    }

    function saveTileMap() {
        if (!name.trim()) {
            importError = "Please enter a name.";
            return;
        }
        if (!imageValue) {
            importError = "Please select an image.";
            return;
        }
        if (!columns || !rows) {
            importError = "Image/tile size do not produce any tiles.";
            return;
        }

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
            createdAt: editingId ? (tileMaps.find((t) => t.id === id)?.createdAt ?? now) : now,
            updatedAt: now,
        };

        const next = tileMaps.slice();
        const idx = next.findIndex((t) => t.id === id);
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
        const tm = tileMaps.find((t) => t.id === id);
        if (!tm) return;
        creating = true;
        editingId = id;
        name = tm.name;
        tileSize = tm.tileSize;
        imageKind = tm.image.kind;
        imageValue = tm.image.value;
        columns = tm.columns;
        rows = tm.rows;
        tiles = tm.tiles.map((t) => ({ ...t }));
    }

    function deleteTileMap(id: string) {
        if (!confirm("Delete this tilemap? Maps referencing it will lose tiles.")) return;
        tileMaps = tileMaps.filter((t) => t.id !== id);
        saveTileMaps(tileMaps);
        invalidateTileMap(id);
    }
</script>

<div
    class="mx-auto w-full max-w-[600px] rounded-lg border border-(--card-border) bg-(--card-bg) p-0 text-(--text-primary) shadow-md">
    <div class="flex items-center justify-between border-b border-(--border-primary) p-6">
        <h2 class="m-0 text-2xl font-bold text-(--text-primary)">Tilemap Manager</h2>
        <button class="srpg-b srpg-b-create" on:click={startCreate}>
            <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true">
                <path d="M12 5v14M5 12h14" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            Create Tilemap
        </button>
    </div>

    <div class="p-6">
        <p class="mt-0 mb-2 text-(--text-secondary)">Manage tilesheets for use in the Map tool.</p>
        <p class="mt-0 text-sm text-(--text-muted)">
            <strong class="text-(--text-secondary)">BG</strong>
            = background tiles (terrain, floors).
        </p>
        <p class="mt-0 mb-4 text-sm text-(--text-muted)">
            <strong class="text-(--text-secondary)">TOK</strong>
            = tokens (moveable characters, objects).
        </p>

        {#if creating}
            <div class="creator">
                <div class="srpg-form-field">
                    <label class="text-sm font-medium text-(--text-secondary)" for="tilemap-name">
                        Name
                    </label>
                    <input
                        id="tilemap-name"
                        type="text"
                        bind:value={name}
                        placeholder="My Tilesheet" />
                </div>
                <div class="srpg-form-field">
                    <label class="text-sm font-medium text-(--text-secondary)" for="tilemap-size">
                        Tile size (px)
                    </label>
                    <input
                        id="tilemap-size"
                        type="number"
                        min="4"
                        step="1"
                        bind:value={tileSize}
                        on:change={() => {
                            if (naturalWidth && naturalHeight && tileSize > 0) {
                                columns = Math.floor(naturalWidth / tileSize);
                                rows = Math.floor(naturalHeight / tileSize);
                                tiles = buildTiles(columns, rows, tileSize);
                            }
                        }} />
                </div>
                <div class="srpg-form-field">
                    <label class="text-sm font-medium text-(--text-secondary)" for="tilemap-image">
                        Image
                    </label>
                    <div class="flex flex-wrap items-center gap-3">
                        <button class="srpg-b srpg-b-simple" on:click={() => fileInput.click()}>
                            <svg
                                viewBox="0 0 24 24"
                                width="18"
                                height="18"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                aria-hidden="true">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="M21 15l-5-5L5 21" />
                            </svg>
                            Choose Image
                        </button>
                        {#if imageValue}
                            <span class="srpg-badge srpg-badge-info">
                                {columns} × {rows} tiles @ {tileSize}px
                            </span>
                        {/if}
                    </div>
                    <input
                        id="tilemap-image"
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        bind:this={fileInput}
                        on:change={handleFileSelect}
                        style="display:none;" />
                </div>

                {#if imageValue}
                    <div class="mt-2 mb-3 flex flex-wrap gap-2">
                        <button
                            class="srpg-b srpg-b-simple srpg-b-sm"
                            on:click={() => selectAll(true)}>
                            Include all
                        </button>
                        <button
                            class="srpg-b srpg-b-simple srpg-b-sm"
                            on:click={() => selectAll(false)}>
                            Exclude all
                        </button>
                        <button
                            class="srpg-b srpg-b-simple srpg-b-sm"
                            on:click={() => setAllBg(true)}>
                            BG on
                        </button>
                        <button
                            class="srpg-b srpg-b-simple srpg-b-sm"
                            on:click={() => setAllBg(false)}>
                            BG off
                        </button>
                        <button
                            class="srpg-b srpg-b-simple srpg-b-sm"
                            on:click={() => setAllFg(true)}>
                            TOK on
                        </button>
                        <button
                            class="srpg-b srpg-b-simple srpg-b-sm"
                            on:click={() => setAllFg(false)}>
                            TOK off
                        </button>
                    </div>

                    <div
                        class="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3"
                        style="--tile-size: {tileSize}px;">
                        {#each tiles as t}
                            <div
                                class="flex items-center gap-3 rounded-lg border border-(--card-border) bg-(--card-bg) p-2">
                                <!-- Include toggle on the left -->
                                <input
                                    type="checkbox"
                                    bind:checked={t.include}
                                    class="h-4 w-4 shrink-0 cursor-pointer accent-(--accent-primary)"
                                    title="Include tile" />

                                <!-- Tile preview -->
                                <div
                                    class="relative h-8 w-8 shrink-0 overflow-hidden rounded border border-(--border-primary)">
                                    <div
                                        class="absolute top-0 left-0 shrink-0 origin-[top_left] rounded-none border-none bg-no-repeat [image-rendering:pixelated]"
                                        style="background-image: url('{imageValue}'); background-position: {-t.x}px {-t.y}px; width: {tileSize}px; height: {tileSize}px; transform: scale({32 /
                                            tileSize});">
                                    </div>
                                </div>

                                <!-- BG/OBJ toggles -->
                                <div class="flex flex-col gap-3">
                                    <label
                                        class="flex items-center gap-1 text-sm text-(--text-secondary)"
                                        class:opacity-50={!t.include}>
                                        <input
                                            type="checkbox"
                                            bind:checked={t.allowBackground}
                                            disabled={!t.include}
                                            class="h-3.5 w-3.5 cursor-pointer accent-(--accent-primary) disabled:cursor-not-allowed disabled:opacity-50" />
                                        BG
                                    </label>
                                    <label
                                        class="flex items-center gap-1 text-sm text-(--text-secondary)"
                                        class:opacity-50={!t.include}>
                                        <input
                                            type="checkbox"
                                            bind:checked={t.allowForeground}
                                            disabled={!t.include}
                                            class="h-3.5 w-3.5 cursor-pointer accent-(--accent-primary) disabled:cursor-not-allowed disabled:opacity-50" />
                                        TOKEN
                                    </label>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}

                {#if importError}
                    <div
                        class="mt-4 rounded border-l-4 border-(--accent-danger) bg-(--accent-danger)/10 p-4 text-(--accent-danger)">
                        {importError}
                    </div>
                {/if}

                <div class="srpg-b-group mt-4">
                    <button class="srpg-b srpg-b-normal" on:click={saveTileMap}>
                        <svg
                            viewBox="0 0 24 24"
                            width="18"
                            height="18"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            aria-hidden="true">
                            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                            <polyline points="17,21 17,13 7,13 7,21" />
                            <polyline points="7,3 7,8 15,8" />
                        </svg>
                        {editingId ? "Save Changes" : "Save Tilemap"}
                    </button>
                    <button class="srpg-b srpg-b-simple" on:click={cancelCreate}>Cancel</button>
                </div>
            </div>
        {/if}

        {#if tileMaps.length === 0}
            <div class="srpg-empty-state">
                <svg
                    class="srpg-empty-state-icon"
                    viewBox="0 0 24 24"
                    width="32"
                    height="32"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
                <p class="srpg-empty-state-text">No tilemaps yet</p>
                <p class="srpg-empty-state-hint">Create one to get started!</p>
            </div>
        {:else}
            <div class="srpg-list mt-4">
                {#each tileMaps as tm}
                    <div class="srpg-list-item flex items-center justify-between gap-4">
                        <button
                            class="srpg-b-icon delete-icon shrink-0"
                            aria-label="Delete tilemap"
                            on:click={() => deleteTileMap(tm.id)}>
                            <svg
                                viewBox="0 0 24 24"
                                width="18"
                                height="18"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                aria-hidden="true">
                                <path
                                    d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                        </button>
                        <div class="min-w-0 flex-1">
                            <div class="srpg-list-item-title">{tm.name}</div>
                            <div class="srpg-list-item-meta">
                                {tm.columns}×{tm.rows} @ {tm.tileSize}px • {tm.tiles.filter(
                                    (t) => t.include
                                ).length} included
                            </div>
                        </div>
                        <button
                            class="srpg-b srpg-b-normal srpg-b-sm shrink-0"
                            on:click={() => editTileMap(tm.id)}>
                            <svg
                                viewBox="0 0 24 24"
                                width="16"
                                height="16"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                aria-hidden="true">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Edit
                        </button>
                    </div>
                {/each}
            </div>
        {/if}

        {#if importSuccess}
            <div
                class="mt-4 flex items-center gap-2 rounded border-l-4 border-(--accent-success) bg-(--accent-success)/10 p-4 text-(--accent-success)">
                <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true">
                    <polyline points="20,6 9,17 4,12" />
                </svg>
                Tilemap saved.
            </div>
        {/if}
    </div>
</div>
