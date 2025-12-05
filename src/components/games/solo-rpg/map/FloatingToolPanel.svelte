<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import { fade } from "svelte/transition";
    import {
        loadTileMaps,
        type TileRef,
        type TileMap,
        type TileMapTile,
    } from "../data/storage-utils";

    export let show: boolean = true;
    export let tool: "move" | "paint" | "object" = "move";
    export let paintMode: "background" | "object" = "background";
    export let color: string = "#2980b9";
    export let selectedTile: { tileMapId: string; tileId: string } | null = null;
    export let currentShape: "square" | "circle" | "triangle" | "star" = "square";

    const dispatch = createEventDispatcher<{
        toolChange: "move" | "paint" | "object";
        paintModeChange: "background" | "object";
        colorChange: string;
        tileSelect: { tileMapId: string; tileId: string };
        shapeChange: "square" | "circle" | "triangle" | "star";
    }>();

    // Color palette
    const palette = [
        "#f5eee4",
        "#000000",
        "#4e3d3b",
        "#544d54",
        "#786c64",
        "#a09a92",
        "#64d5df",
        "#478fca",
        "#2f588d",
        "#252f40",
        "#63250e",
        "#9e3227",
        "#d87945",
        "#f4dc6d",
        "#89aa55",
        "#4e8357",
        "#386956",
        "#2b4a3c",
        "#e99b7c",
        "#825341",
        "#632a7b",
        "#c247b8",
    ];
    const CLEAR_COLOR = "clear";

    // UI state
    let showColorDrawer = false;
    let showTileModal = false;
    let showShapeDrawer = false;

    // Tile data
    let tileMaps: TileMap[] = [];
    let tileOptions: Array<{
        tileMapId: string;
        image: string;
        tile: TileMapTile;
    }> = [];

    onMount(() => {
        try {
            tileMaps = loadTileMaps();
            rebuildTileOptions();
        } catch {}
    });

    // Rebuild tile options when tool changes
    $: if (tool) {
        rebuildTileOptions();
    }

    function rebuildTileOptions() {
        const allowField = paintMode === "background" ? "allowBackground" : "allowForeground";
        const opts: Array<{
            tileMapId: string;
            image: string;
            tile: TileMapTile;
        }> = [];
        for (const tm of tileMaps) {
            const img = tm.image?.value;
            if (!img) continue;
            for (const t of tm.tiles) {
                if (!t.include) continue;
                // @ts-ignore index type
                if (!t[allowField]) continue;
                opts.push({ tileMapId: tm.id, image: img, tile: t });
            }
        }
        tileOptions = opts;
    }

    function tilePreviewStyle(opt: { image: string; tile: TileMapTile }) {
        const { image, tile } = opt;
        return `background-image:url(${image}); background-position:-${tile.x}px -${tile.y}px; width:${tile.w}px; height:${tile.h}px;`;
    }

    // Shape options
    const shapeOptions: Array<{ id: "square" | "circle" | "triangle" | "star"; label: string }> = [
        { id: "square", label: "Square" },
        { id: "circle", label: "Circle" },
        { id: "triangle", label: "Triangle" },
        { id: "star", label: "Star" },
    ];

    // Tool handlers
    function setTool(t: typeof tool) {
        if (tool !== t) {
            dispatch("toolChange", t);
            // Close any open drawers
            showColorDrawer = false;
            showTileModal = false;
            showShapeDrawer = false;
        }
    }

    function setPaintMode(mode: typeof paintMode) {
        if (paintMode !== mode) {
            dispatch("paintModeChange", mode);
            rebuildTileOptions();
        }
    }

    function selectColor(c: string) {
        dispatch("colorChange", c);
        showColorDrawer = false;
    }

    function selectTile(ref: TileRef) {
        dispatch("tileSelect", ref);
        showTileModal = false;
    }

    function selectShape(s: typeof currentShape) {
        dispatch("shapeChange", s);
        showShapeDrawer = false;
    }

    function toggleColorDrawer() {
        showColorDrawer = !showColorDrawer;
        showTileModal = false;
        showShapeDrawer = false;
    }

    function toggleShapeDrawer() {
        showShapeDrawer = !showShapeDrawer;
        showColorDrawer = false;
        showTileModal = false;
    }

    function openTileModal() {
        showTileModal = true;
        showColorDrawer = false;
        showShapeDrawer = false;
    }

    function closeTileModal() {
        showTileModal = false;
    }

    // Computed: is paint or object mode active?
    $: isPaintOrObject = tool === "paint" || tool === "object";
    $: isObjectMode = tool === "object";
</script>

{#if show}
    <div class="floating-tool-panel">
        <!-- Main Tool Buttons -->
        <div class="tool-row">
            <button
                class="tool-btn"
                class:active={tool === "move"}
                on:click={() => setTool("move")}
                aria-label="Move Tool"
                aria-pressed={tool === "move"}>
                <svg
                    class="tool-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2">
                    <path
                        d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20" />
                </svg>
                <span class="tool-label">Move</span>
            </button>

            <button
                class="tool-btn"
                class:active={tool === "paint"}
                on:click={() => setTool("paint")}
                aria-label="Paint Tool"
                aria-pressed={tool === "paint"}>
                <svg
                    class="tool-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2">
                    <path
                        d="M19 11H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2z" />
                    <path d="M17 11V7a4 4 0 0 0-8 0v4" />
                </svg>
                <span class="tool-label">Paint</span>
            </button>
        </div>

        <!-- Paint Mode Sub-toggle (only when Paint selected) -->
        {#if tool === "paint"}
            <div class="sub-toggle-row">
                <button
                    class="sub-toggle-btn"
                    class:active={paintMode === "background"}
                    on:click={() => setPaintMode("background")}
                    aria-pressed={paintMode === "background"}>
                    Background
                </button>
                <button
                    class="sub-toggle-btn"
                    class:active={paintMode === "object"}
                    on:click={() => setPaintMode("object")}
                    aria-pressed={paintMode === "object"}>
                    Object
                </button>
            </div>
        {/if}

        <!-- Sub-options Row (when paint or object tool is active) -->
        {#if isPaintOrObject}
            <div class="options-row">
                <!-- Color Button with Drawer -->
                <div class="option-wrapper">
                    <button
                        class="option-btn"
                        on:click={toggleColorDrawer}
                        aria-label="Select Color"
                        aria-expanded={showColorDrawer}>
                        {#if color === CLEAR_COLOR}
                            <div class="color-swatch clear-pattern"></div>
                        {:else}
                            <div class="color-swatch" style="background: {color}"></div>
                        {/if}
                    </button>

                    {#if showColorDrawer}
                        <div class="color-drawer" transition:fade={{ duration: 150 }}>
                            <button
                                class="color-swatch-btn"
                                class:active={color === CLEAR_COLOR}
                                on:click={() => selectColor(CLEAR_COLOR)}
                                aria-label="Clear">
                                <div class="color-swatch clear-pattern"></div>
                            </button>
                            {#each palette as c}
                                <button
                                    class="color-swatch-btn"
                                    class:active={color === c}
                                    on:click={() => selectColor(c)}
                                    aria-label={c}>
                                    <div class="color-swatch" style="background: {c}"></div>
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>

                <!-- Tile Button -->
                <button class="option-btn" on:click={openTileModal} aria-label="Select Tile">
                    <div class="tile-preview">
                        {#if selectedTile && tileMaps.length}
                            {#each tileMaps as tm}
                                {#if tm.id === selectedTile.tileMapId}
                                    {#each tm.tiles as t}
                                        {#if t.id === selectedTile.tileId}
                                            <div
                                                class="tile-sprite"
                                                style={`${tilePreviewStyle({ image: tm.image.value, tile: t })} transform: scale(${20 / t.w}, ${20 / t.h});`}>
                                            </div>
                                        {/if}
                                    {/each}
                                {/if}
                            {/each}
                        {/if}
                    </div>
                    <span class="option-label">Tile</span>
                </button>

                <!-- Shape Button (only for Object mode) -->
                {#if isObjectMode}
                    <div class="option-wrapper">
                        <button
                            class="option-btn"
                            on:click={toggleShapeDrawer}
                            aria-label="Select Shape"
                            aria-expanded={showShapeDrawer}>
                            {#if currentShape === "square"}
                                <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="4" y="4" width="16" height="16" />
                                </svg>
                            {:else if currentShape === "circle"}
                                <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="12" cy="12" r="8" />
                                </svg>
                            {:else if currentShape === "triangle"}
                                <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 4 4 20 h16 Z" />
                                </svg>
                            {:else}
                                <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon
                                        points="12,2 15,10 23,10 17,15 19,23 12,18 5,23 7,15 1,10 9,10" />
                                </svg>
                            {/if}
                        </button>

                        {#if showShapeDrawer}
                            <div class="shape-drawer" transition:fade={{ duration: 150 }}>
                                {#each shapeOptions as shape}
                                    <button
                                        class="shape-option-btn"
                                        class:active={currentShape === shape.id}
                                        on:click={() => selectShape(shape.id)}
                                        aria-label={shape.label}>
                                        {#if shape.id === "square"}
                                            <svg
                                                class="shape-icon"
                                                viewBox="0 0 24 24"
                                                fill="currentColor">
                                                <rect x="4" y="4" width="16" height="16" />
                                            </svg>
                                        {:else if shape.id === "circle"}
                                            <svg
                                                class="shape-icon"
                                                viewBox="0 0 24 24"
                                                fill="currentColor">
                                                <circle cx="12" cy="12" r="8" />
                                            </svg>
                                        {:else if shape.id === "triangle"}
                                            <svg
                                                class="shape-icon"
                                                viewBox="0 0 24 24"
                                                fill="currentColor">
                                                <path d="M12 4 4 20 h16 Z" />
                                            </svg>
                                        {:else}
                                            <svg
                                                class="shape-icon"
                                                viewBox="0 0 24 24"
                                                fill="currentColor">
                                                <polygon
                                                    points="12,2 15,10 23,10 17,15 19,23 12,18 5,23 7,15 1,10 9,10" />
                                            </svg>
                                        {/if}
                                    </button>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
        {/if}
    </div>

    <!-- Tile Selection Modal -->
    {#if showTileModal}
        <div
            class="tile-modal-backdrop"
            role="button"
            tabindex="0"
            on:click={closeTileModal}
            on:keydown={(e) => e.key === "Escape" && closeTileModal()}>
            <div
                class="tile-modal"
                role="dialog"
                aria-modal="true"
                tabindex="-1"
                on:click|stopPropagation
                on:keydown|stopPropagation>
                <div class="tile-modal-header">
                    <h3>Select Tile</h3>
                    <button class="tile-modal-close" on:click={closeTileModal} aria-label="Close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="tile-modal-grid">
                    {#if tileOptions.length === 0}
                        <p class="tile-modal-empty">No tiles available</p>
                    {:else}
                        {#each tileOptions as opt}
                            <button
                                class="tile-option"
                                class:active={selectedTile &&
                                    selectedTile.tileMapId === opt.tileMapId &&
                                    selectedTile.tileId === opt.tile.id}
                                on:click={() =>
                                    selectTile({ tileMapId: opt.tileMapId, tileId: opt.tile.id })}
                                aria-label={`Tile ${opt.tile.col},${opt.tile.row}`}>
                                <div class="tile-preview-large">
                                    <div
                                        class="tile-sprite"
                                        style={`${tilePreviewStyle(opt)} transform: scale(${40 / opt.tile.w}, ${40 / opt.tile.h});`}>
                                    </div>
                                </div>
                            </button>
                        {/each}
                    {/if}
                </div>
            </div>
        </div>
    {/if}
{/if}

<style>
    /* Floating Panel Base */
    .floating-tool-panel {
        position: fixed;
        z-index: 35;
        background: var(--bg-elevated);
        border: 1px solid var(--border-primary);
        border-radius: 0.5rem;
        padding: 0.5rem;
        box-shadow: var(--shadow-lg);
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    /* Mobile: bottom-right, above sidebars */
    @media (max-width: 767px) {
        .floating-tool-panel {
            bottom: calc(140px + env(safe-area-inset-bottom));
            right: 1rem;
        }
    }

    /* Desktop: top-left, after sidebars */
    @media (min-width: 768px) {
        .floating-tool-panel {
            top: 4rem;
            left: calc(170px + 1rem);
        }
    }

    /* Tool Row */
    .tool-row {
        display: flex;
        gap: 0.25rem;
    }

    .tool-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.125rem;
        padding: 0.5rem 0.75rem;
        background: transparent;
        border: 1px solid transparent;
        border-radius: 0.375rem;
        cursor: pointer;
        color: var(--text-secondary);
        transition: all 0.15s ease;
    }

    .tool-btn:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .tool-btn.active {
        background: var(--accent-primary);
        color: white;
        border-color: var(--accent-primary);
    }

    .tool-icon {
        width: 1.25rem;
        height: 1.25rem;
    }

    .tool-label {
        font-size: 0.65rem;
        font-weight: 500;
    }

    /* Sub-toggle Row (Background/Object) */
    .sub-toggle-row {
        display: flex;
        background: var(--bg-secondary);
        border-radius: 0.375rem;
        padding: 0.125rem;
    }

    .sub-toggle-btn {
        flex: 1;
        padding: 0.25rem 0.5rem;
        font-size: 0.7rem;
        font-weight: 500;
        background: transparent;
        border: none;
        border-radius: 0.25rem;
        cursor: pointer;
        color: var(--text-secondary);
        transition: all 0.15s ease;
    }

    .sub-toggle-btn:hover {
        color: var(--text-primary);
    }

    .sub-toggle-btn.active {
        background: var(--bg-elevated);
        color: var(--text-primary);
        box-shadow: var(--shadow-sm);
    }

    /* Options Row */
    .options-row {
        display: flex;
        gap: 0.5rem;
        align-items: flex-start;
    }

    .option-wrapper {
        position: relative;
    }

    .option-btn {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.375rem 0.5rem;
        background: var(--bg-secondary);
        border: 1px solid var(--border-primary);
        border-radius: 0.375rem;
        cursor: pointer;
        color: var(--text-secondary);
        transition: all 0.15s ease;
    }

    .option-btn:hover {
        border-color: var(--border-secondary);
        color: var(--text-primary);
    }

    .option-label {
        font-size: 0.7rem;
        font-weight: 500;
    }

    /* Color Swatch */
    .color-swatch {
        width: 1.25rem;
        height: 1.25rem;
        border-radius: 0.25rem;
        border: 1px solid var(--border-primary);
    }

    .color-swatch.clear-pattern {
        background: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 3px,
            var(--border-primary) 3px,
            var(--border-primary) 6px
        );
    }

    /* Color Drawer */
    .color-drawer {
        position: absolute;
        bottom: 100%;
        left: 0;
        margin-bottom: 0.25rem;
        background: var(--bg-elevated);
        border: 1px solid var(--border-primary);
        border-radius: 0.375rem;
        padding: 0.375rem;
        box-shadow: var(--shadow-lg);
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.25rem;
        max-height: 200px;
        overflow-y: auto;
    }

    @media (min-width: 768px) {
        .color-drawer {
            bottom: auto;
            top: 100%;
            margin-bottom: 0;
            margin-top: 0.25rem;
        }
    }

    .color-swatch-btn {
        padding: 0.25rem;
        background: transparent;
        border: 2px solid transparent;
        border-radius: 0.25rem;
        cursor: pointer;
        transition: border-color 0.15s ease;
    }

    .color-swatch-btn:hover {
        border-color: var(--border-secondary);
    }

    .color-swatch-btn.active {
        border-color: var(--accent-primary);
    }

    /* Shape Drawer */
    .shape-drawer {
        position: absolute;
        bottom: 100%;
        left: 0;
        margin-bottom: 0.25rem;
        background: var(--bg-elevated);
        border: 1px solid var(--border-primary);
        border-radius: 0.375rem;
        padding: 0.375rem;
        box-shadow: var(--shadow-lg);
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    @media (min-width: 768px) {
        .shape-drawer {
            bottom: auto;
            top: 100%;
            margin-bottom: 0;
            margin-top: 0.25rem;
        }
    }

    .shape-icon {
        width: 1.25rem;
        height: 1.25rem;
    }

    .shape-option-btn {
        padding: 0.375rem;
        background: transparent;
        border: 2px solid transparent;
        border-radius: 0.25rem;
        cursor: pointer;
        color: var(--text-secondary);
        transition: all 0.15s ease;
    }

    .shape-option-btn:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .shape-option-btn.active {
        border-color: var(--accent-primary);
        color: var(--accent-primary);
    }

    /* Tile Preview */
    .tile-preview {
        position: relative;
        width: 1.25rem;
        height: 1.25rem;
        overflow: hidden;
        border-radius: 0.25rem;
        border: 1px solid var(--border-primary);
        background: var(--bg-secondary);
        image-rendering: pixelated;
    }

    .tile-sprite {
        position: absolute;
        top: 0;
        left: 0;
        transform-origin: top left;
        background-repeat: no-repeat;
        image-rendering: pixelated;
    }

    /* Tile Modal */
    .tile-modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--modal-overlay);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 1rem;
    }

    .tile-modal {
        background: var(--bg-elevated);
        border-radius: 0.5rem;
        box-shadow: var(--shadow-lg);
        max-width: 80vw;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .tile-modal-header {
        padding: 1rem;
        border-bottom: 1px solid var(--border-primary);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .tile-modal-header h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .tile-modal-close {
        width: 2rem;
        height: 2rem;
        padding: 0;
        background: transparent;
        border: none;
        border-radius: 0.25rem;
        cursor: pointer;
        color: var(--text-muted);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
    }

    .tile-modal-close:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .tile-modal-close svg {
        width: 1.25rem;
        height: 1.25rem;
    }

    .tile-modal-grid {
        padding: 1rem;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
        gap: 0.5rem;
        overflow-y: auto;
    }

    .tile-modal-empty {
        grid-column: 1 / -1;
        text-align: center;
        color: var(--text-muted);
        padding: 2rem;
    }

    .tile-option {
        width: 48px;
        height: 48px;
        padding: 0.25rem;
        background: var(--bg-secondary);
        border: 2px solid var(--border-primary);
        border-radius: 0.375rem;
        cursor: pointer;
        overflow: hidden;
        transition: border-color 0.15s ease;
    }

    .tile-option:hover {
        border-color: var(--border-secondary);
    }

    .tile-option.active {
        border-color: var(--accent-primary);
    }

    .tile-preview-large {
        position: relative;
        width: 40px;
        height: 40px;
        overflow: hidden;
        image-rendering: pixelated;
    }
</style>
