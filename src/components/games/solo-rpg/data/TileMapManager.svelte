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
    class="bg-card-bg text-text-primary border-card-border mx-auto w-full max-w-[500px] rounded-lg border p-0 shadow-md">
    <div class="border-border-primary flex items-center justify-between border-b p-6">
        <h2 class="text-text-primary m-0 text-2xl">Tilemap Manager</h2>
        <div class="flex flex-wrap gap-3">
            <button
                class="border-border-primary bg-accent-success hover:bg-accent-success-hover active:bg-accent-success-active flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
                on:click={startCreate}>
                Create Tilemap
            </button>
        </div>
    </div>

    <div class="p-6">
        <p class="text-text-secondary mt-0 mb-4">Manage tilesheets for use in the Map tool.</p>

        {#if creating}
            <div class="creator">
                <div class="mb-4 flex flex-col gap-1">
                    <label class="text-text-secondary" for="tilemap-name">Name</label>
                    <input
                        id="tilemap-name"
                        type="text"
                        bind:value={name}
                        placeholder="My Tilesheet" />
                </div>
                <div class="mb-4 flex flex-col gap-1">
                    <label class="text-text-secondary" for="tilemap-size">Tile size (px)</label>
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
                <div class="mb-4 flex flex-col gap-1">
                    <label class="text-text-secondary" for="tilemap-image">Image</label>
                    <div class="flex flex-wrap gap-3">
                        <button
                            class="border-border-primary flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium shadow-md transition-all duration-200"
                            on:click={() => fileInput.click()}>
                            Choose Image
                        </button>
                        {#if imageValue}
                            <span class="text-text-secondary text-sm">
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
                            class="border-border-primary flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium shadow-md transition-all duration-200"
                            on:click={() => selectAll(true)}>
                            Include all
                        </button>
                        <button
                            class="border-border-primary flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium shadow-md transition-all duration-200"
                            on:click={() => selectAll(false)}>
                            Exclude all
                        </button>
                        <button
                            class="border-border-primary flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium shadow-md transition-all duration-200"
                            on:click={() => setAllBg(true)}>
                            BG on
                        </button>
                        <button
                            class="border-border-primary flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium shadow-md transition-all duration-200"
                            on:click={() => setAllBg(false)}>
                            BG off
                        </button>
                        <button
                            class="border-border-primary flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium shadow-md transition-all duration-200"
                            on:click={() => setAllFg(true)}>
                            FG on
                        </button>
                        <button
                            class="border-border-primary flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium shadow-md transition-all duration-200"
                            on:click={() => setAllFg(false)}>
                            FG off
                        </button>
                    </div>

                    <div
                        class="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3"
                        style="--tile-size: {tileSize}px;">
                        {#each tiles as t}
                            <div
                                class="border-border-primary flex items-center gap-2 rounded-md border p-2">
                                <div
                                    class="border-border-primary relative h-6 w-6 shrink-0 overflow-hidden rounded border">
                                    <div
                                        class="rendering-pixelated absolute top-0 left-0 shrink-0 origin-[top_left] rounded-none border-none bg-no-repeat"
                                        style="background-image: url('{imageValue}'); background-position: {-t.x}px {-t.y}px; width: {tileSize}px; height: {tileSize}px; transform: scale({24 /
                                            tileSize});">
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <label>
                                        <input type="checkbox" bind:checked={t.include} />
                                        Include
                                    </label>
                                    <label>
                                        <input type="checkbox" bind:checked={t.allowBackground} />
                                        BG
                                    </label>
                                    <label>
                                        <input type="checkbox" bind:checked={t.allowForeground} />
                                        FG
                                    </label>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}

                {#if importError}
                    <div
                        class="bg-danger-bg border-danger text-danger-text mt-4 rounded border-l-4 p-4">
                        {importError}
                    </div>
                {/if}

                <div class="flex flex-wrap gap-3" style="margin-top:1rem;">
                    <button
                        class="border-border-primary bg-accent-primary hover:bg-accent-primary-hover active:bg-accent-primary-active flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
                        on:click={saveTileMap}>
                        {editingId ? "Save Changes" : "Save Tilemap"}
                    </button>
                    <button
                        class="border-button-simple-border bg-button-simple-bg text-button-simple-text hover:bg-button-simple-hover-bg hover:border-button-simple-hover-border active:bg-button-simple-bg flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-sm"
                        on:click={cancelCreate}>
                        Cancel
                    </button>
                </div>
            </div>
        {/if}

        {#if tileMaps.length === 0}
            <em>No tilemaps yet.</em>
        {:else}
            <div class="mt-2 flex flex-col gap-2">
                {#each tileMaps as tm}
                    <div
                        class="border-border-primary flex justify-between gap-4 rounded-md border p-3 px-4">
                        <button
                            class="border-border-primary text-text-muted hover:bg-bg-secondary hover:text-accent-danger flex h-8 w-8 cursor-pointer items-center justify-center rounded border bg-transparent p-1 text-2xl transition-all duration-200"
                            aria-label="Delete tilemap"
                            on:click={() => deleteTileMap(tm.id)}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                fill="currentColor"
                                viewBox="0 0 16 16">
                                <path
                                    d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                                <path
                                    fill-rule="evenodd"
                                    d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0                             0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                            </svg>
                        </button>
                        <div class="meta">
                            <strong>{tm.name}</strong>
                            <div class="text-text-secondary text-sm">
                                {tm.columns}×{tm.rows} @ {tm.tileSize}px • {tm.tiles.filter(
                                    (t) => t.include
                                ).length} included
                            </div>
                        </div>
                        <button
                            class="border-border-primary bg-accent-primary hover:bg-accent-primary-hover active:bg-accent-primary-active flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
                            on:click={() => editTileMap(tm.id)}>
                            Edit
                        </button>
                    </div>
                {/each}
            </div>
        {/if}

        {#if importSuccess}
            <div class="bg-success-bg border-success text-success-text mt-4 rounded border-l-4 p-4">
                ✓ Tilemap saved.
            </div>
        {/if}
    </div>
</div>

<style>
    .rendering-pixelated {
        image-rendering: pixelated;
    }
</style>
