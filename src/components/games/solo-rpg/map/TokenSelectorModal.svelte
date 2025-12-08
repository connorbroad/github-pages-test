<script lang="ts">
    /**
     * TokenSelectorModal.svelte
     *
     * Combined modal for selecting token Shape, Color, and Tile.
     * Uses accordion sections and includes a live preview of the final token.
     * Changes are only applied when the user clicks Confirm.
     */
    import { createEventDispatcher, onMount } from "svelte";
    import { slide } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { loadTileMaps, type TileMap, type TileMapTile } from "../data/storage-utils";
    import { COLOR_PALETTE, CLEAR_COLOR } from "./shared/color-palette";
    import ShapeIcon from "./shared/ShapeIcon.svelte";
    import TokenPreview from "./shared/TokenPreview.svelte";
    import type { ShapeKind } from "./canvas-utils";

    export let show: boolean = false;
    export let currentShape: ShapeKind = "square";
    export let currentColor: string = "#2980b9";
    export let currentTile: { tileMapId: string; tileId: string } | null = null;

    const dispatch = createEventDispatcher<{
        confirm: {
            shape: ShapeKind;
            color: string;
            tile: { tileMapId: string; tileId: string } | null;
        };
        close: void;
    }>();

    // Local state for editing (only applied on confirm)
    let selectedShape: ShapeKind = currentShape;
    let selectedColor: string = currentColor;
    let selectedTile: { tileMapId: string; tileId: string } | null = currentTile;

    // Accordion state
    let expandedSection: "shape" | "tile" | "color" | null = "shape";

    // Shape options
    const shapeOptions: Array<{ id: ShapeKind; label: string }> = [
        { id: "square", label: "Square" },
        { id: "circle", label: "Circle" },
        { id: "triangle", label: "Triangle" },
        { id: "star", label: "Star" },
    ];

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

    // Reset local state when modal opens
    $: if (show) {
        selectedShape = currentShape;
        selectedColor = currentColor;
        selectedTile = currentTile;
        expandedSection = "shape";
    }

    function rebuildTileOptions() {
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
                // Only include tiles allowed for foreground/objects
                if (!t.allowForeground) continue;
                opts.push({ tileMapId: tm.id, image: img, tile: t });
            }
        }
        tileOptions = opts;
    }

    function tilePreviewStyle(opt: { image: string; tile: TileMapTile }) {
        const { image, tile } = opt;
        return `background-image:url(${image}); background-position:-${tile.x}px -${tile.y}px; width:${tile.w}px; height:${tile.h}px;`;
    }

    function toggleSection(section: "shape" | "tile" | "color") {
        expandedSection = expandedSection === section ? null : section;
    }

    function selectShape(shape: ShapeKind) {
        selectedShape = shape;
    }

    function selectColor(c: string) {
        selectedColor = c;
    }

    function selectTile(ref: { tileMapId: string; tileId: string } | null) {
        selectedTile = ref;
    }

    function clearTile() {
        selectedTile = null;
    }

    function confirm() {
        dispatch("confirm", {
            shape: selectedShape,
            color: selectedColor,
            tile: selectedTile,
        });
    }

    function close() {
        dispatch("close");
    }

    function handleBackdropClick() {
        close();
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            close();
        }
    }
</script>

{#if show}
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
    <div
        class="token-modal-backdrop"
        on:click={handleBackdropClick}
        on:keydown={handleKeydown}
        role="dialog"
        aria-modal="true"
        tabindex="-1">
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
        <div class="token-modal" on:click|stopPropagation role="document">
            <div class="token-modal-header">
                <h3>Token Options</h3>
                <button class="token-modal-close" on:click={close} aria-label="Close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <!-- Preview Section (sticky at top) -->
            <div class="token-preview-section">
                <div class="preview-label">Preview</div>
                <div class="preview-container">
                    <TokenPreview
                        shape={selectedShape}
                        color={selectedColor}
                        tile={selectedTile}
                        size={64} />
                </div>
            </div>

            <!-- Scrollable Content -->
            <div class="token-modal-content">
                <!-- Shape Accordion -->
                <div class="accordion-section">
                    <button
                        class="accordion-header"
                        class:expanded={expandedSection === "shape"}
                        on:click={() => toggleSection("shape")}
                        aria-expanded={expandedSection === "shape"}>
                        <span class="accordion-title">
                            <ShapeIcon shape={selectedShape} size={16} />
                            Shape
                        </span>
                        <svg
                            class="accordion-chevron"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2">
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </button>
                    {#if expandedSection === "shape"}
                        <div
                            class="accordion-content"
                            transition:slide={{ duration: 200, easing: quintOut }}>
                            <div class="shape-grid">
                                {#each shapeOptions as shape}
                                    <button
                                        class="shape-option"
                                        class:active={selectedShape === shape.id}
                                        on:click={() => selectShape(shape.id)}
                                        aria-label={shape.label}>
                                        <ShapeIcon shape={shape.id} size={32} />
                                        <span class="shape-label">{shape.label}</span>
                                    </button>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>

                <!-- Color Accordion -->
                <div class="accordion-section">
                    <button
                        class="accordion-header"
                        class:expanded={expandedSection === "color"}
                        on:click={() => toggleSection("color")}
                        aria-expanded={expandedSection === "color"}>
                        <span class="accordion-title">
                            {#if selectedColor === CLEAR_COLOR}
                                <div class="header-color-swatch clear-pattern"></div>
                            {:else}
                                <div
                                    class="header-color-swatch"
                                    style="background: {selectedColor}">
                                </div>
                            {/if}
                            Color
                        </span>
                        <svg
                            class="accordion-chevron"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2">
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </button>
                    {#if expandedSection === "color"}
                        <div
                            class="accordion-content"
                            transition:slide={{ duration: 200, easing: quintOut }}>
                            <div class="color-section">
                                <!-- Clear color button -->
                                <button
                                    class="color-clear-btn"
                                    class:active={selectedColor === CLEAR_COLOR}
                                    on:click={() => selectColor(CLEAR_COLOR)}
                                    aria-label="Clear/No tint">
                                    <div class="color-swatch-btn clear-pattern"></div>
                                    <span>None</span>
                                </button>
                                <!-- Color palette -->
                                <div class="color-palette">
                                    {#each Object.values(COLOR_PALETTE) as palette}
                                        <div class="color-row">
                                            {#each palette as c}
                                                <button
                                                    class="color-option"
                                                    class:active={selectedColor === c}
                                                    on:click={() => selectColor(c)}
                                                    aria-label={c}>
                                                    <div
                                                        class="color-swatch"
                                                        style="background: {c}">
                                                    </div>
                                                </button>
                                            {/each}
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>

                <!-- Tile Accordion -->
                <div class="accordion-section">
                    <button
                        class="accordion-header"
                        class:expanded={expandedSection === "tile"}
                        on:click={() => toggleSection("tile")}
                        aria-expanded={expandedSection === "tile"}>
                        <span class="accordion-title">
                            {#if selectedTile}
                                <div class="header-tile-preview">
                                    {#each tileMaps as tm}
                                        {#if tm.id === selectedTile.tileMapId}
                                            {#each tm.tiles as t}
                                                {#if t.id === selectedTile.tileId}
                                                    <div
                                                        class="tile-sprite-mini"
                                                        style={`${tilePreviewStyle({ image: tm.image.value, tile: t })} transform: scale(${16 / t.w}, ${16 / t.h});`}>
                                                    </div>
                                                {/if}
                                            {/each}
                                        {/if}
                                    {/each}
                                </div>
                            {:else}
                                <svg
                                    class="section-icon"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2">
                                    <rect x="3" y="3" width="7" height="7" />
                                    <rect x="14" y="3" width="7" height="7" />
                                    <rect x="3" y="14" width="7" height="7" />
                                    <rect x="14" y="14" width="7" height="7" />
                                </svg>
                            {/if}
                            Tile
                        </span>
                        <svg
                            class="accordion-chevron"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2">
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </button>
                    {#if expandedSection === "tile"}
                        <div
                            class="accordion-content"
                            transition:slide={{ duration: 200, easing: quintOut }}>
                            <div class="tile-section">
                                <!-- Clear tile button -->
                                <button
                                    class="tile-clear-btn"
                                    class:active={selectedTile === null}
                                    on:click={clearTile}
                                    aria-label="No tile">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M4.93 4.93l14.14 14.14" />
                                    </svg>
                                    <span>None</span>
                                </button>
                                <!-- Tile grid -->
                                <div class="tile-grid">
                                    {#if tileOptions.length === 0}
                                        <p class="tile-empty">No tiles available</p>
                                    {:else}
                                        {#each tileOptions as opt}
                                            <button
                                                class="tile-option"
                                                class:active={selectedTile &&
                                                    selectedTile.tileMapId === opt.tileMapId &&
                                                    selectedTile.tileId === opt.tile.id}
                                                on:click={() =>
                                                    selectTile({
                                                        tileMapId: opt.tileMapId,
                                                        tileId: opt.tile.id,
                                                    })}
                                                aria-label={`Tile ${opt.tile.col},${opt.tile.row}`}>
                                                <div class="tile-preview-box">
                                                    <div
                                                        class="tile-sprite"
                                                        style={`${tilePreviewStyle(opt)} transform: scale(${36 / opt.tile.w}, ${36 / opt.tile.h});`}>
                                                    </div>
                                                </div>
                                            </button>
                                        {/each}
                                    {/if}
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Footer with Confirm button -->
            <div class="token-modal-footer">
                <button class="btn-cancel" on:click={close}>Cancel</button>
                <button class="btn-confirm" on:click={confirm}>Confirm</button>
            </div>
        </div>
    </div>
{/if}

<style>
    .token-modal-backdrop {
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
        padding-bottom: calc(80px + env(safe-area-inset-bottom));
    }

    @media (min-width: 768px) {
        .token-modal-backdrop {
            padding: 1rem;
            padding-left: calc(170px + 1rem);
        }
    }

    .token-modal {
        background: var(--bg-elevated);
        border: 1px solid var(--border-primary);
        border-radius: 12px;
        box-shadow: var(--shadow-xl);
        max-width: 400px;
        width: 100%;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .token-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        border-bottom: 1px solid var(--border-primary);
        flex-shrink: 0;
    }

    .token-modal-header h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .token-modal-close {
        background: none;
        border: none;
        padding: 0.25rem;
        cursor: pointer;
        color: var(--text-secondary);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .token-modal-close:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .token-modal-close svg {
        width: 1.25rem;
        height: 1.25rem;
    }

    /* Preview Section */
    .token-preview-section {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        padding: 1rem;
        background: var(--bg-secondary);
        border-bottom: 1px solid var(--border-primary);
        flex-shrink: 0;
    }

    .preview-label {
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .preview-container {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem;
        background: var(--bg-primary);
        border: 1px solid var(--border-primary);
        border-radius: 8px;
    }

    /* Scrollable Content */
    .token-modal-content {
        flex: 1;
        overflow-y: auto;
        padding: 0.5rem;
    }

    /* Accordion */
    .accordion-section {
        border: 1px solid var(--border-primary);
        border-radius: 8px;
        margin-bottom: 0.5rem;
        overflow: hidden;
    }

    .accordion-section:last-child {
        margin-bottom: 0;
    }

    .accordion-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 0.75rem 1rem;
        background: var(--bg-secondary);
        border: none;
        cursor: pointer;
        color: var(--text-primary);
        font-size: 0.875rem;
        font-weight: 500;
        transition: background-color 0.15s ease;
    }

    .accordion-header:hover {
        background: var(--bg-tertiary);
    }

    .accordion-header.expanded {
        border-bottom: 1px solid var(--border-primary);
    }

    .accordion-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .accordion-chevron {
        width: 1rem;
        height: 1rem;
        transition: transform 0.2s ease;
    }

    .accordion-header.expanded .accordion-chevron {
        transform: rotate(180deg);
    }

    .accordion-content {
        padding: 0.75rem;
        background: var(--bg-primary);
    }

    .section-icon {
        width: 16px;
        height: 16px;
    }

    /* Shape Grid */
    .shape-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.5rem;
    }

    .shape-option {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        padding: 0.5rem;
        background: var(--bg-secondary);
        border: 2px solid transparent;
        border-radius: 8px;
        cursor: pointer;
        color: var(--text-secondary);
        transition: all 0.15s ease;
    }

    .shape-option:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .shape-option.active {
        border-color: var(--accent-primary);
        background: var(--accent-primary-alpha);
        color: var(--accent-primary);
    }

    .shape-label {
        font-size: 0.625rem;
        font-weight: 500;
        text-transform: uppercase;
    }

    /* Tile Section */
    .tile-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .tile-clear-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        background: var(--bg-secondary);
        border: 2px solid transparent;
        border-radius: 6px;
        cursor: pointer;
        color: var(--text-secondary);
        font-size: 0.75rem;
        transition: all 0.15s ease;
    }

    .tile-clear-btn:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .tile-clear-btn.active {
        border-color: var(--accent-primary);
        background: var(--accent-primary-alpha);
        color: var(--accent-primary);
    }

    .tile-clear-btn svg {
        width: 16px;
        height: 16px;
    }

    .tile-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
        gap: 0.375rem;
        max-height: 250px;
        overflow-y: auto;
    }

    .tile-empty {
        grid-column: 1 / -1;
        text-align: center;
        color: var(--text-muted);
        font-size: 0.75rem;
        padding: 1rem;
    }

    .tile-option {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.25rem;
        background: var(--bg-secondary);
        border: 2px solid transparent;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .tile-option:hover {
        background: var(--bg-tertiary);
    }

    .tile-option.active {
        border-color: var(--accent-primary);
        background: var(--accent-primary-alpha);
    }

    .tile-preview-box {
        width: 36px;
        height: 36px;
        overflow: hidden;
        border-radius: 4px;
        background: var(--bg-primary);
        image-rendering: pixelated;
    }

    .tile-sprite {
        transform-origin: top left;
        background-repeat: no-repeat;
        image-rendering: pixelated;
    }

    .tile-sprite-mini {
        transform-origin: top left;
        background-repeat: no-repeat;
        image-rendering: pixelated;
    }

    .header-tile-preview {
        width: 16px;
        height: 16px;
        overflow: hidden;
        border-radius: 2px;
        background: var(--bg-tertiary);
        image-rendering: pixelated;
    }

    /* Color Section */
    .color-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .color-clear-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        background: var(--bg-secondary);
        border: 2px solid transparent;
        border-radius: 6px;
        cursor: pointer;
        color: var(--text-secondary);
        font-size: 0.75rem;
        transition: all 0.15s ease;
    }

    .color-clear-btn:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .color-clear-btn.active {
        border-color: var(--accent-primary);
        background: var(--accent-primary-alpha);
        color: var(--accent-primary);
    }

    .color-swatch-btn {
        width: 20px;
        height: 20px;
        border-radius: 4px;
        border: 1px solid var(--border-primary);
    }

    .color-palette {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
    }

    .color-row {
        display: flex;
        gap: 0.375rem;
        justify-content: center;
    }

    .color-option {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.125rem;
        background: transparent;
        border: 2px solid transparent;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .color-option:hover {
        background: var(--bg-tertiary);
    }

    .color-option.active {
        border-color: var(--accent-primary);
    }

    .color-swatch {
        width: 28px;
        height: 28px;
        border-radius: 4px;
        border: 1px solid var(--border-primary);
    }

    .header-color-swatch {
        width: 16px;
        height: 16px;
        border-radius: 3px;
        border: 1px solid var(--border-primary);
    }

    .clear-pattern {
        background: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 3px,
            var(--border-primary) 3px,
            var(--border-primary) 6px
        );
    }

    /* Footer */
    .token-modal-footer {
        display: flex;
        gap: 0.75rem;
        padding: 1rem;
        border-top: 1px solid var(--border-primary);
        flex-shrink: 0;
    }

    .btn-cancel,
    .btn-confirm {
        flex: 1;
        padding: 0.625rem 1rem;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .btn-cancel {
        background: var(--bg-secondary);
        border: 1px solid var(--border-primary);
        color: var(--text-secondary);
    }

    .btn-cancel:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .btn-confirm {
        background: var(--accent-primary);
        border: 1px solid var(--accent-primary);
        color: white;
    }

    .btn-confirm:hover {
        background: var(--accent-primary-hover);
    }
</style>
