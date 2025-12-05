<script lang="ts">
    /**
     * FloatingPaintOptions.svelte
     *
     * Color, Tile, and Shape options for paint mode. Visible when Paint tool is selected.
     * This panel appears to the right of FloatingPaintModeToggle with a gap.
     * Shape option only appears in Object mode.
     */
    import { createEventDispatcher, onMount } from "svelte";
    import {
        loadTileMaps,
        type TileRef,
        type TileMap,
        type TileMapTile,
    } from "../data/storage-utils";
    import { COLOR_PALETTE } from "./shared/color-palette";
    import ColorDrawer from "./shared/ColorDrawer.svelte";
    import ShapeIcon from "./shared/ShapeIcon.svelte";

    export let paintMode: "background" | "object" = "background";
    export let color: string = "#2980b9";
    export let selectedTile: { tileMapId: string; tileId: string } | null = null;
    export let currentShape: "square" | "circle" | "triangle" | "star" = "square";

    const dispatch = createEventDispatcher<{
        colorChange: string;
        tileSelect: { tileMapId: string; tileId: string };
        shapeChange: "square" | "circle" | "triangle" | "star";
    }>();

    // Shape options (for object mode)
    const shapeOptions: Array<{
        id: "square" | "circle" | "triangle" | "star";
        label: string;
    }> = [
        { id: "square", label: "Square" },
        { id: "circle", label: "Circle" },
        { id: "triangle", label: "Triangle" },
        { id: "star", label: "Star" },
    ];

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

    // Rebuild tile options when paintMode changes
    $: if (paintMode) {
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

    function selectColor(c: string) {
        dispatch("colorChange", c);
        showColorDrawer = false;
    }

    function handleColorSelect(e: CustomEvent<string>) {
        selectColor(e.detail);
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

    function openTileModal() {
        showTileModal = true;
        showColorDrawer = false;
        showShapeDrawer = false;
    }

    function closeTileModal() {
        showTileModal = false;
    }

    function toggleShapeDrawer() {
        showShapeDrawer = !showShapeDrawer;
        showColorDrawer = false;
        showTileModal = false;
    }
</script>

<div class="floating-panel floating-paint-options">
    <div class="options-row">
        <!-- Color Button with Drawer -->
        <div class="option-wrapper">
            <button
                class="option-btn"
                on:click={toggleColorDrawer}
                aria-label="Select Color"
                aria-expanded={showColorDrawer}>
                <div class="color-swatch" style="background: {color}"></div>
                <span class="option-label">Color</span>
            </button>

            {#if showColorDrawer}
                <ColorDrawer selectedColor={color} on:select={handleColorSelect} />
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

        <!-- Shape Button with Drawer (Object mode only) -->
        {#if paintMode === "object"}
            <div class="option-wrapper">
                <button
                    class="option-btn"
                    on:click={toggleShapeDrawer}
                    aria-label="Select Shape"
                    aria-expanded={showShapeDrawer}>
                    <ShapeIcon shape={currentShape} />
                    <span class="option-label">Shape</span>
                </button>

                {#if showShapeDrawer}
                    <div class="shape-drawer">
                        {#each shapeOptions as shape}
                            <button
                                class="shape-option-btn"
                                class:active={currentShape === shape.id}
                                on:click={() => selectShape(shape.id)}
                                aria-label={shape.label}>
                                <ShapeIcon shape={shape.id} />
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>

<!-- Tile Selection Modal -->
{#if showTileModal}
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
    <div
        class="tile-modal-backdrop"
        on:click={closeTileModal}
        on:keydown={(e) => e.key === "Escape" && closeTileModal()}
        role="dialog"
        aria-modal="true"
        tabindex="-1">
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
        <div class="tile-modal" on:click|stopPropagation role="document">
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

<style>
    .floating-panel {
        background: var(--bg-elevated);
        border: 1px solid var(--border-primary);
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        padding: 0.25rem;
    }

    .options-row {
        display: flex;
        gap: 0.25rem;
        align-items: flex-start;
    }

    .option-wrapper {
        position: relative;
    }

    .option-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.125rem;
        padding: 0.5rem 0.75rem;
        background: transparent;
        border: none;
        border-radius: 6px;
        color: var(--text-secondary);
        cursor: pointer;
        transition:
            background-color 0.15s ease,
            color 0.15s ease;
        min-width: 56px;
    }

    .option-btn:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .option-label {
        font-size: 0.625rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.025em;
    }

    /* Color Swatch */
    .color-swatch {
        width: 20px;
        height: 20px;
        border-radius: 4px;
        border: 1px solid var(--border-primary);
    }

    /* Tile Preview */
    .tile-preview {
        position: relative;
        width: 20px;
        height: 20px;
        overflow: hidden;
        border-radius: 4px;
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
        border: 1px solid var(--border-primary);
        border-radius: 12px;
        box-shadow: var(--shadow-lg);
        width: min(600px, 90vw);
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
        border-radius: 4px;
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
        border-radius: 6px;
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

    /* Shape Drawer */
    .shape-drawer {
        position: absolute;
        background: var(--bg-elevated);
        border: 1px solid var(--border-primary);
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        padding: 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        z-index: 50;
    }

    /* Mobile: drawer expands upward */
    @media (max-width: 767px) {
        .shape-drawer {
            bottom: 100%;
            left: 0;
            margin-bottom: 0.25rem;
        }
    }

    /* Desktop: drawer expands downward */
    @media (min-width: 768px) {
        .shape-drawer {
            top: 100%;
            left: 0;
            margin-top: 0.25rem;
        }
    }

    .shape-option-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        background: transparent;
        border: 2px solid transparent;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s ease;
        color: var(--text-secondary);
    }

    .shape-option-btn:hover {
        background: var(--bg-tertiary);
        border-color: var(--border-secondary);
        color: var(--text-primary);
    }

    .shape-option-btn.active {
        border-color: var(--accent-primary);
        background: var(--accent-primary);
        color: white;
    }
</style>
