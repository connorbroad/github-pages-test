<script lang="ts">
    import { fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { createEventDispatcher, onMount } from "svelte";
    import CharacterSheetControls from "./lore/characters/CharacterSheetControls.svelte";
    import CreatureAssignmentModal from "./map/CreatureAssignmentModal.svelte";
    import {
        loadTileMaps,
        loadCharacters,
        type TileRef,
        type TileMap,
        type TileMapTile,
        type CreatureRef,
        type Character,
    } from "./data/storage-utils";
    import { generateUUID } from "./map/uuid";

    export let show: boolean = false;
    export let mode: "story" | "map" = "story"; // Which context are we in?

    // New: whether a secondary sidebar is present; affects positioning
    export let hasSecondarySidebar: boolean = false;

    // Story mode props
    export let visibleSections: string[] = ["information"];
    export let selectedSections: Set<string> = new Set();
    export let isEditingSections: boolean = false;
    export let onToggleSection: (section: string) => void = () => {};

    // Map mode props
    export let tool: "paint" | "object" | "move" = "move";
    export let currentShape: "square" | "circle" | "triangle" | "star" = "square";
    export let color: string = "#2980b9";
    // Selected tile for map tools
    export let selectedTile: TileRef | null = null;

    // Track whether tertiary should be visible on map tools
    export let autoShowOnMapTools: boolean = true;
    $: showTertiaryOnMap =
        autoShowOnMapTools && mode === "map" && (tool === "paint" || tool === "object");

    // Move tool selection props
    export let moveHasSelection: boolean = false;
    export let moveSelectedColor: string | null = null; // current selected object's color/tint
    export let moveCanFlip: boolean = false; // only tile objects can flip
    export let moveSelectedCreatureRef: CreatureRef | null = null; // creature assigned to selected object
    export let campaignId: string | null = null; // current campaign for loading creatures
    export let mapId: string | null = null; // current map for creature assignment

    const dispatch = createEventDispatcher();

    function setTool(t: typeof tool) {
        if (tool !== t) dispatch("toolChange", t);
    }

    function setShape(s: typeof currentShape) {
        if (currentShape !== s) dispatch("shapeChange", s);
    }

    function setColor(c: string) {
        if (color !== c) dispatch("colorChange", c);
    }

    function selectTile(ref: TileRef) {
        dispatch("tileSelect", ref);
    }

    // Detect if we're on mobile
    let isMobile = false;
    if (typeof window !== "undefined") {
        isMobile = window.innerWidth <= 768;
        window.addEventListener("resize", () => {
            isMobile = window.innerWidth <= 768;
        });
    }

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
    const CLEAR_COLOR = "clear"; // Special value for erasing/clearing tiles

    // --- Sticky filter state for Map mode ---
    type MapCategory = "tile" | "shape" | "color";
    $: isObjectMode = tool === "object";
    $: availableCategories = isObjectMode
        ? (["tile", "shape", "color"] as MapCategory[])
        : (["tile", "color"] as MapCategory[]);
    let activeCategory: MapCategory = isObjectMode ? "shape" : "color";
    $: if (!availableCategories.includes(activeCategory)) {
        activeCategory = availableCategories[0];
    }
    function setCategory(cat: MapCategory) {
        if (availableCategories.includes(cat)) activeCategory = cat;
    }

    // Tile list for Tile category
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

    $: if (tool && mode === "map") {
        rebuildTileOptions();
    }

    function rebuildTileOptions() {
        const allowField = tool === "paint" ? "allowBackground" : "allowForeground";
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

    const shapeOptions: Array<{ id: "square" | "circle" | "triangle" | "star"; label: string }> = [
        { id: "square", label: "Square" },
        { id: "circle", label: "Circle" },
        { id: "triangle", label: "Triangle" },
        { id: "star", label: "Star" },
    ];
    function selectShape(shape: typeof currentShape) {
        setShape(shape);
    }

    // Events for move-tool actions
    function moveSetColor(c: string) {
        dispatch("moveColorChange", c);
    }
    function moveFlip() {
        dispatch("moveFlip");
    }
    function moveDelete() {
        dispatch("moveDelete");
    }

    // Creature assignment for move tool
    let characters: Character[] = [];
    $: if (campaignId && mode === "map" && moveHasSelection) {
        characters = loadCharacters().filter((c) => c.campaignId === campaignId);
    }

    function assignCreature(type: "character", id: string) {
        const ref: CreatureRef = {
            type,
            id,
            instanceId: generateUUID(),
        };
        dispatch("creatureAssign", ref);
    }

    function clearCreature() {
        dispatch("creatureAssign", null);
    }

    function getCreatureName(ref: CreatureRef | null): string {
        if (!ref) return "None";
        if (ref.type === "character") {
            const char = characters.find((c) => c.id === ref.id);
            return char?.name ?? "Unknown Character";
        }
        return "Unknown";
    }

    // Modal state for creature selector
    let showCreatureModal = false;

    function handleCreatureSelect(e: CustomEvent<{ type: "character"; id: string }>) {
        assignCreature(e.detail.type, e.detail.id);
        showCreatureModal = false;
    }

    function handleCreatureRemove() {
        clearCreature();
        showCreatureModal = false;
    }
</script>

{#if show || showTertiaryOnMap}
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
        {:else if tool === "move" && moveHasSelection}
            <!-- Move mode controls when an object is selected -->
            <nav class="flex h-full w-full flex-row p-0 md:flex-col">
                <div class="bg-sidebar-bg sticky top-0 left-0 z-10 flex flex-row md:flex-col">
                    <div
                        class="flex h-full flex-1 flex-row overflow-x-auto md:h-auto md:flex-col md:gap-0 md:overflow-visible">
                        <button
                            class="srpg-sidebar-item sticky-item"
                            on:click={moveDelete}
                            aria-label="Delete object">
                            <svg
                                class="sidebar-icon"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                                <path d="M10 11v6"></path>
                                <path d="M14 11v6"></path>
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                            </svg>
                            <span class="sidebar-label">Delete</span>
                        </button>
                        <button
                            class="srpg-sidebar-item sticky-item"
                            on:click={moveFlip}
                            aria-label="Flip horizontal"
                            disabled={!moveCanFlip}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                class="sidebar-icon">
                                <path
                                    fill="currentColor"
                                    d="M15 21h2v-2h-2zm4-12h2V7h-2zM3 5v14c0 1.1.9 2 2 2h4v-2H5V5h4V3H5c-1.1 0-2 .9-2 2m16-2v2h2c0-1.1-.9-2-2-2m-8 20h2V1h-2zm8-6h2v-2h-2zM15 5h2V3h-2zm4 8h2v-2h-2zm0 8c1.1 0 2-.9 2-2h-2z" />
                            </svg>
                            <span class="sidebar-label">Flip</span>
                        </button>
                        <!-- Creature assignment button -->
                        <button
                            class="srpg-sidebar-item sticky-item"
                            on:click={() => (showCreatureModal = true)}
                            aria-label="Assign creature">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                class="sidebar-icon">
                                <path
                                    fill="currentColor"
                                    d="M12 4a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4" />
                            </svg>
                            <span class="sidebar-label text-[10px]">Assign</span>
                        </button>
                    </div>
                </div>
                <div class="srpg-sidebar-divider"></div>
                <div
                    class="h-full flex-1 overflow-x-auto overflow-y-hidden md:overflow-x-hidden md:overflow-y-auto">
                    <div
                        class="flex h-full flex-1 flex-row overflow-x-auto md:h-auto md:flex-col md:gap-0 md:overflow-visible">
                        {#if moveCanFlip}
                            <!-- Provide CLEAR for tile-object tint removal -->
                            <button
                                class="srpg-sidebar-item scrollable-item"
                                class:active={moveSelectedColor === CLEAR_COLOR}
                                on:click={() => moveSetColor(CLEAR_COLOR)}
                                aria-label="Clear tint">
                                <div class="color-swatch clear-pattern"></div>
                            </button>
                        {/if}
                        {#each palette as c}
                            <button
                                class="srpg-sidebar-item scrollable-item"
                                class:active={moveSelectedColor === c}
                                on:click={() => moveSetColor(c)}
                                aria-label={c}>
                                <div class="color-swatch" style="background: {c}"></div>
                                <span class="sr-only">{c}</span>
                            </button>
                        {/each}
                    </div>
                </div>
                <div class="srpg-sidebar-divider"></div>
            </nav>
        {:else}
            <!-- Map mode: Sticky category buttons + filtered scrollable options -->
            <nav class="flex h-full w-full flex-row p-0 md:flex-col">
                <div class="bg-sidebar-bg sticky top-0 left-0 z-10 flex flex-row md:flex-col">
                    <!-- Tile category button -->
                    <button
                        class="srpg-sidebar-item sticky-item"
                        class:active={activeCategory === "tile"}
                        on:click={() => setCategory("tile")}
                        aria-label="Tile">
                        <div class="tile-preview" title="Selected tile">
                            {#if selectedTile}
                                {#if tileMaps.length}
                                    {#each tileMaps as tm}
                                        {#if tm.id === selectedTile.tileMapId}
                                            {#each tm.tiles as t}
                                                {#if t.id === selectedTile.tileId}
                                                    <div
                                                        class="absolute top-0 left-0 origin-top-left rounded-none border-none"
                                                        style={`${tilePreviewStyle({ image: tm.image.value, tile: t })} transform: scale(${24 / t.w}, ${24 / t.h});`}>
                                                    </div>
                                                {/if}
                                            {/each}
                                        {/if}
                                    {/each}
                                {/if}
                            {/if}
                        </div>
                        <span class="sidebar-label">Tile</span>
                    </button>

                    {#if isObjectMode}
                        <!-- Shape category button remains available in object mode -->
                        <button
                            class="srpg-sidebar-item sticky-item"
                            class:active={activeCategory === "shape"}
                            on:click={() => setCategory("shape")}
                            aria-label="Shape">
                            {#if currentShape === "square"}
                                <svg class="sidebar-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="4" y="4" width="16" height="16"></rect>
                                </svg>
                            {:else if currentShape === "circle"}
                                <svg class="sidebar-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="12" cy="12" r="8"></circle>
                                </svg>
                            {:else if currentShape === "triangle"}
                                <svg class="sidebar-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 4 4 20 h16 Z"></path>
                                </svg>
                            {:else}
                                <svg class="sidebar-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon
                                        points="12,2 15,10 23,10 17,15 19,23 12,18 5,23 7,15 1,10 9,10">
                                    </polygon>
                                </svg>
                            {/if}
                            <span class="sidebar-label">Shape</span>
                        </button>
                    {/if}

                    <!-- Color category (shows selected color/clear) -->
                    <button
                        class="srpg-sidebar-item sticky-item"
                        class:active={activeCategory === "color"}
                        on:click={() => setCategory("color")}
                        aria-label="Color">
                        {#if color === CLEAR_COLOR}
                            <div class="color-swatch clear-pattern"></div>
                        {:else}
                            <div class="color-swatch" style="background: {color}"></div>
                        {/if}
                        <span class="sidebar-label">Color</span>
                    </button>
                </div>

                <div class="srpg-sidebar-divider"></div>

                <div
                    class="h-full flex-1 overflow-x-auto overflow-y-hidden md:overflow-x-hidden md:overflow-y-auto">
                    <div
                        class="flex h-full flex-1 flex-row overflow-x-auto md:h-auto md:flex-col md:gap-0 md:overflow-visible">
                        {#if activeCategory === "tile"}
                            {#if tileOptions.length === 0}
                                <em class="p-4 text-center text-sm text-(--text-muted)">
                                    No tiles available
                                </em>
                            {:else}
                                {#each tileOptions as opt}
                                    <button
                                        class="srpg-sidebar-item scrollable-item"
                                        class:active={selectedTile &&
                                            selectedTile.tileMapId === opt.tileMapId &&
                                            selectedTile.tileId === opt.tile.id}
                                        on:click={() =>
                                            selectTile({
                                                tileMapId: opt.tileMapId,
                                                tileId: opt.tile.id,
                                            })}
                                        aria-label={`Tile ${opt.tile.col},${opt.tile.row}`}>
                                        <div class="tile-preview">
                                            <div
                                                class="absolute top-0 left-0 origin-top-left rounded-none border-none"
                                                style={`${tilePreviewStyle(opt)} transform: scale(${24 / opt.tile.w}, ${24 / opt.tile.h});`}>
                                            </div>
                                        </div>
                                        <span class="sr-only">Tile</span>
                                    </button>
                                {/each}
                            {/if}
                        {:else if activeCategory === "shape"}
                            {#if isObjectMode}
                                <!-- Shapes (only shown when object tool is active) -->
                                <button
                                    class="srpg-sidebar-item scrollable-item"
                                    class:active={currentShape === "square"}
                                    on:click={() => setShape("square")}
                                    aria-label="Square">
                                    <svg
                                        class="sidebar-icon"
                                        viewBox="0 0 24 24"
                                        fill="currentColor">
                                        <rect x="4" y="4" width="16" height="16"></rect>
                                    </svg>
                                </button>

                                <button
                                    class="srpg-sidebar-item scrollable-item"
                                    class:active={currentShape === "circle"}
                                    on:click={() => setShape("circle")}
                                    aria-label="Circle">
                                    <svg
                                        class="sidebar-icon"
                                        viewBox="0 0 24 24"
                                        fill="currentColor">
                                        <circle cx="12" cy="12" r="8"></circle>
                                    </svg>
                                </button>

                                <button
                                    class="srpg-sidebar-item scrollable-item"
                                    class:active={currentShape === "triangle"}
                                    on:click={() => setShape("triangle")}
                                    aria-label="Triangle">
                                    <svg
                                        class="sidebar-icon"
                                        viewBox="0 0 24 24"
                                        fill="currentColor">
                                        <path d="M12 4 4 20 h16 Z"></path>
                                    </svg>
                                </button>

                                <button
                                    class="srpg-sidebar-item scrollable-item"
                                    class:active={currentShape === "star"}
                                    on:click={() => setShape("star")}
                                    aria-label="Star">
                                    <svg
                                        class="sidebar-icon"
                                        viewBox="0 0 24 24"
                                        fill="currentColor">
                                        <polygon
                                            points="12,2 15,10 23,10 17,15 19,23 12,18 5,23 7,15 1,10 9,10">
                                        </polygon>
                                    </svg>
                                </button>
                            {/if}
                        {:else if activeCategory === "color"}
                            <!-- Colors (clear + palette) -->
                            <button
                                class="srpg-sidebar-item scrollable-item"
                                class:active={color === CLEAR_COLOR}
                                on:click={() => setColor(CLEAR_COLOR)}
                                aria-label="Clear">
                                <div class="color-swatch clear-pattern"></div>
                            </button>
                            {#each palette as c}
                                <button
                                    class="srpg-sidebar-item scrollable-item"
                                    class:active={color === c}
                                    on:click={() => setColor(c)}
                                    aria-label={c}>
                                    <div class="color-swatch" style="background: {c}"></div>
                                    <span class="sr-only">{c}</span>
                                </button>
                            {/each}
                        {/if}
                    </div>
                </div>
            </nav>
        {/if}
    </aside>
{/if}

<!-- Creature Assignment Modal -->
{#if showCreatureModal && campaignId && mapId}
    <CreatureAssignmentModal
        show={showCreatureModal}
        {campaignId}
        {mapId}
        currentCreatureRef={moveSelectedCreatureRef}
        on:assign={handleCreatureSelect}
        on:clear={handleCreatureRemove}
        on:close={() => (showCreatureModal = false)} />
{/if}
