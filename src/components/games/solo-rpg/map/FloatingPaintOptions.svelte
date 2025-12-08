<script lang="ts">
    /**
     * FloatingPaintOptions.svelte
     *
     * Shape, Tile, and Color options for paint/object mode.
     * Used both for adding new objects (Add mode) and editing selected objects (Select mode).
     *
     * In Select mode with no selection, all controls are disabled.
     * In Select mode with a selection, controls reflect and modify the selected object.
     */
    import { createEventDispatcher, onMount } from "svelte";
    import {
        loadTileMaps,
        type TileRef,
        type TileMap,
        type TileMapTile,
    } from "../data/storage-utils";
    import ColorDrawer from "./shared/ColorDrawer.svelte";
    import ShapeIcon from "./shared/ShapeIcon.svelte";
    import { CLEAR_COLOR } from "./shared/color-palette";

    /** Context for filtering tile options: "background" or "object" */
    export let context: "background" | "object" = "object";
    /** Whether controls should be disabled (e.g., Select mode with no selection) */
    export let disabled: boolean = false;
    /** Current color value */
    export let color: string = "#2980b9";
    /** Current selected tile reference */
    export let selectedTile: { tileMapId: string; tileId: string } | null = null;
    /** Current shape (only shown in object context) */
    export let currentShape: "square" | "circle" | "triangle" | "star" = "square";
    /** Whether to show the Shape option (only in object context) */
    export let showShape: boolean = true;
    /** Initial tab to open on mount (for sidebar-triggered modals) */
    export let initialTab: "tile" | "color" | "shape" | null = null;

    const dispatch = createEventDispatcher<{
        colorChange: string;
        tileSelect: { tileMapId: string; tileId: string };
        shapeChange: "square" | "circle" | "triangle" | "star";
        close: void;
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

        // Open initial tab if specified (for sidebar-triggered modals)
        if (initialTab === "tile") {
            showTileModal = true;
        } else if (initialTab === "color") {
            showColorDrawer = true;
        } else if (initialTab === "shape") {
            showShapeDrawer = true;
        }
    });

    // Rebuild tile options when context changes
    $: if (context) {
        rebuildTileOptions();
    }

    function rebuildTileOptions() {
        const allowField = context === "background" ? "allowBackground" : "allowForeground";
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
        if (disabled) return;
        dispatch("colorChange", c);
        showColorDrawer = false;
        dispatch("close");
    }

    function handleColorSelect(e: CustomEvent<string>) {
        selectColor(e.detail);
    }

    function handleColorClose() {
        showColorDrawer = false;
        dispatch("close");
    }

    function selectTile(ref: TileRef) {
        if (disabled) return;
        dispatch("tileSelect", ref);
        showTileModal = false;
        dispatch("close");
    }

    function selectShape(s: typeof currentShape) {
        if (disabled) return;
        dispatch("shapeChange", s);
        showShapeDrawer = false;
        dispatch("close");
    }

    function toggleColorDrawer() {
        if (disabled) return;
        showColorDrawer = !showColorDrawer;
        showTileModal = false;
        showShapeDrawer = false;
    }

    function openTileModal() {
        if (disabled) return;
        showTileModal = true;
        showColorDrawer = false;
        showShapeDrawer = false;
    }

    function closeTileModal() {
        showTileModal = false;
        dispatch("close");
    }

    function toggleShapeDrawer() {
        if (disabled) return;
        showShapeDrawer = !showShapeDrawer;
        showColorDrawer = false;
        showTileModal = false;
    }
</script>

<div class="floating-panel floating-paint-options" class:disabled>
    <div class="options-row">
        <!-- Shape Button with Drawer (Object context only when showShape is true) -->
        {#if context === "object" && showShape}
            <div class="option-wrapper">
                <button
                    class="option-btn"
                    on:click={toggleShapeDrawer}
                    {disabled}
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

        <!-- Tile Button -->
        <button class="option-btn" on:click={openTileModal} {disabled} aria-label="Select Tile">
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

        <!-- Color Button with Drawer -->
        <div class="option-wrapper">
            <button
                class="option-btn"
                on:click={toggleColorDrawer}
                {disabled}
                aria-label="Select Color"
                aria-expanded={showColorDrawer}>
                {#if color === CLEAR_COLOR}
                    <div class="color-swatch clear-pattern"></div>
                {:else}
                    <div class="color-swatch" style="background: {color}"></div>
                {/if}
                <span class="option-label">Color</span>
            </button>
        </div>
    </div>
</div>

<!-- Color Selection Modal -->
{#if showColorDrawer}
    <ColorDrawer selectedColor={color} on:select={handleColorSelect} on:close={handleColorClose} />
{/if}

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

    /* Desktop: vertical layout, centered */
    @media (min-width: 768px) {
        .options-row {
            flex-direction: column;
            align-items: center;
        }
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

    .option-btn:hover:not(:disabled) {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .option-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
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

    .color-swatch.clear-pattern {
        background: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 3px,
            var(--border-primary) 3px,
            var(--border-primary) 6px
        );
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
        /* Account for bottom sidebars on mobile (130px + safe area) */
        padding: 1rem;
        padding-bottom: calc(140px + env(safe-area-inset-bottom));
    }

    /* Desktop: sidebars are on the left, not bottom */
    @media (min-width: 768px) {
        .tile-modal-backdrop {
            padding: 1rem;
            padding-left: calc(170px + 1rem); /* Account for left sidebars */
        }
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
