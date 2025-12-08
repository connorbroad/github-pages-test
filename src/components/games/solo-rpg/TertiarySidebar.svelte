<script lang="ts">
    import { fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import CharacterSheetControls from "./lore/characters/CharacterSheetControls.svelte";
    import TokenPreview from "./map/shared/TokenPreview.svelte";
    import { CLEAR_COLOR } from "./map/shared/color-palette";
    import { loadTileMaps, type TileMap, type TileMapTile } from "./data/storage-utils";
    import { onMount } from "svelte";

    export let show: boolean = false;
    export let mode: "story" | "map" = "story";

    // New: whether a secondary sidebar is present; affects positioning
    export let hasSecondarySidebar: boolean = false;

    // Story mode props
    export let visibleSections: string[] = ["information"];
    export let selectedSections: Set<string> = new Set();
    export let isEditingSections: boolean = false;
    export let onToggleSection: (section: string) => void = () => {};

    // Map mode props
    export let editMode: "move" | "background" | "object" = "move";
    export let objectMode: "select" | "add" = "add";
    export let isErasing: boolean = false;

    // Selection state (for Token mode)
    export let hasSelection: boolean = false;
    export let selectedCanFlip: boolean = false;

    // Current paint options (for preview)
    export let currentColor: string = "#2980b9";
    export let currentTile: { tileMapId: string; tileId: string } | null = null;
    export let currentShape: "square" | "circle" | "triangle" | "star" = "square";

    // Callbacks for map mode
    export let onObjectModeChange: (mode: "select" | "add") => void = () => {};
    export let onBrushModeChange: (erasing: boolean) => void = () => {};
    export let onOpenTileModal: () => void = () => {};
    export let onOpenColorModal: () => void = () => {};
    export let onOpenTokenModal: () => void = () => {};
    export let onFlip: () => void = () => {};
    export let onDelete: () => void = () => {};
    export let onOpenAssignModal: () => void = () => {};

    // Tile preview data
    let tileMaps: TileMap[] = [];
    onMount(() => {
        try {
            tileMaps = loadTileMaps();
        } catch {}
    });

    function getTilePreviewStyle(tileRef: { tileMapId: string; tileId: string } | null): string {
        if (!tileRef || tileMaps.length === 0) return "";
        const tm = tileMaps.find((t) => t.id === tileRef.tileMapId);
        if (!tm?.image?.value) return "";
        const tile = tm.tiles.find((t) => t.id === tileRef.tileId);
        if (!tile) return "";
        return `background-image:url(${tm.image.value}); background-position:-${tile.x}px -${tile.y}px; width:${tile.w}px; height:${tile.h}px; transform: scale(${20 / tile.w}, ${20 / tile.h});`;
    }

    // Detect if we're on mobile
    let isMobile = false;
    if (typeof window !== "undefined") {
        isMobile = window.innerWidth <= 768;
        window.addEventListener("resize", () => {
            isMobile = window.innerWidth <= 768;
        });
    }
</script>

{#if show}
    <aside
        class="bg-sidebar-bg fixed right-0 bottom-[calc(70px+env(safe-area-inset-bottom))] left-0
               z-30 flex h-(--tertiary-height,60px) w-full flex-col shadow-md
               {hasSecondarySidebar || mode === 'map'
            ? 'bottom-[calc(130px+env(safe-area-inset-bottom))]'
            : ''}
               md:fixed md:top-0 md:bottom-auto md:left-20 md:h-screen md:w-20 md:shadow-md
               {hasSecondarySidebar ? 'md:left-[170px]' : ''}"
        style="--tertiary-height: 60px;"
        transition:fly={{
            duration: 300,
            easing: quintOut,
            x: isMobile ? 0 : -80,
            y: isMobile ? 60 : 0,
        }}>
        {#if mode === "story"}
            <div class="md:[&_.section-filter]:static md:[&_.section-filter-icons]:flex-col">
                <CharacterSheetControls
                    {visibleSections}
                    {selectedSections}
                    {isEditingSections}
                    on:toggleSection={(e) => onToggleSection(e.detail)} />
            </div>
        {:else if mode === "map"}
            <nav class="flex h-full w-full flex-row p-0 md:flex-col">
                <div class="flex flex-1 flex-row md:flex-none md:flex-col md:gap-0">
                    {#if editMode === "background"}
                        <!-- Background mode: Paint/Erase, Tile+Color -->
                        <button
                            class="srpg-sidebar-item"
                            class:active={isErasing}
                            on:click={() => onBrushModeChange(true)}
                            aria-label="Erase mode">
                            <svg
                                class="sidebar-icon"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2">
                                <path
                                    d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
                                <path d="M22 21H7" />
                                <path d="m5 11 9 9" />
                            </svg>
                            <span class="sidebar-label">Erase</span>
                        </button>

                        <button
                            class="srpg-sidebar-item"
                            class:active={!isErasing}
                            on:click={() => onBrushModeChange(false)}
                            aria-label="Paint mode">
                            <svg
                                class="sidebar-icon"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2">
                                <path
                                    d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" />
                                <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" />
                                <path d="M14.5 17.5 4.5 15" />
                            </svg>
                            <span class="sidebar-label">Paint</span>
                        </button>

                        <div class="srpg-sidebar-divider"></div>

                        <button
                            class="srpg-sidebar-item"
                            on:click={onOpenColorModal}
                            disabled={isErasing}
                            aria-label="Select color">
                            {#if currentColor === CLEAR_COLOR}
                                <div class="color-swatch clear-pattern"></div>
                            {:else}
                                <div class="color-swatch" style="background: {currentColor}"></div>
                            {/if}
                            <span class="sidebar-label">Color</span>
                        </button>

                        <button
                            class="srpg-sidebar-item"
                            on:click={onOpenTileModal}
                            disabled={isErasing}
                            aria-label="Select tile">
                            <div class="tile-preview">
                                {#if currentTile}
                                    <div
                                        class="tile-sprite"
                                        style={getTilePreviewStyle(currentTile)}>
                                    </div>
                                {:else}
                                    <svg
                                        class="sidebar-icon"
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
                            </div>
                            <span class="sidebar-label">Tile</span>
                        </button>
                    {:else if editMode === "object"}
                        <!-- Token mode: Select/Add, Shape+Tile+Color+Flip, Assign+Del -->
                        <button
                            class="srpg-sidebar-item"
                            class:active={objectMode === "select"}
                            on:click={() => onObjectModeChange("select")}
                            aria-label="Select mode">
                            <svg
                                class="sidebar-icon"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2">
                                <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                                <path d="M13 13l6 6" />
                            </svg>
                            <span class="sidebar-label">Select</span>
                        </button>

                        <button
                            class="srpg-sidebar-item"
                            class:active={objectMode === "add"}
                            on:click={() => onObjectModeChange("add")}
                            aria-label="Add mode">
                            <svg
                                class="sidebar-icon"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2">
                                <path d="M12 5v14" />
                                <path d="M5 12h14" />
                            </svg>
                            <span class="sidebar-label">Add</span>
                        </button>

                        <div class="srpg-sidebar-divider"></div>

                        <button
                            class="srpg-sidebar-item"
                            on:click={onOpenTokenModal}
                            disabled={objectMode === "select" && !hasSelection}
                            aria-label="Token options">
                            <div class="token-preview-wrapper">
                                <TokenPreview
                                    shape={currentShape}
                                    color={currentColor}
                                    tile={currentTile}
                                    size={28} />
                            </div>
                            <span class="sidebar-label">Token</span>
                        </button>

                        <button
                            class="srpg-sidebar-item"
                            on:click={onFlip}
                            disabled={!hasSelection || !selectedCanFlip}
                            aria-label="Flip horizontal">
                            <svg class="sidebar-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path
                                    d="M15 21h2v-2h-2zm4-12h2V7h-2zM3 5v14c0 1.1.9 2 2 2h4v-2H5V5h4V3H5c-1.1 0-2 .9-2 2m16-2v2h2c0-1.1-.9-2-2-2m-8 20h2V1h-2zm8-6h2v-2h-2zM15 5h2V3h-2zm4 8h2v-2h-2zm0 8c1.1 0 2-.9 2-2h-2z" />
                            </svg>
                            <span class="sidebar-label">Flip</span>
                        </button>

                        <div class="srpg-sidebar-divider"></div>

                        <button
                            class="srpg-sidebar-item"
                            on:click={onOpenAssignModal}
                            disabled={!hasSelection}
                            aria-label="Assign creature">
                            <svg class="sidebar-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path
                                    d="M12 4a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4" />
                            </svg>
                            <span class="sidebar-label">Assign</span>
                        </button>

                        <button
                            class="srpg-sidebar-item danger"
                            on:click={onDelete}
                            disabled={!hasSelection}
                            aria-label="Delete object">
                            <svg
                                class="sidebar-icon"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6" />
                                <path d="M14 11v6" />
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                            <span class="sidebar-label">Del</span>
                        </button>
                    {/if}
                </div>
            </nav>
        {/if}
    </aside>
{/if}

<style>
    .srpg-sidebar-divider {
        width: 1px;
        height: 40px;
        background: var(--border-primary);
        margin: 0.5rem 0.25rem;
    }

    @media (min-width: 768px) {
        .srpg-sidebar-divider {
            width: 60px;
            height: 1px;
            margin: 0.25rem 0.5rem;
        }
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

    /* Token Preview Wrapper */
    .token-preview-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        overflow: hidden;
    }
</style>
