<script lang="ts">
    import { fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { createEventDispatcher } from "svelte";
    import CharacterSheetControls from "./lore/characters/CharacterSheetControls.svelte";

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

    // Track whether tertiary should be visible on map tools
    export let autoShowOnMapTools: boolean = true;
    $: showTertiaryOnMap = autoShowOnMapTools && mode === 'map' && (tool === 'paint' || tool === 'object');

    const dispatch = createEventDispatcher();

    function setTool(t: typeof tool) { 
        if (tool !== t) dispatch('toolChange', t); 
    }
    
    function setShape(s: typeof currentShape) { 
        if (currentShape !== s) dispatch('shapeChange', s); 
    }
    
    function setColor(c: string) { 
        if (color !== c) dispatch('colorChange', c); 
    }

    // Detect if we're on mobile
    let isMobile = false;
    if (typeof window !== "undefined") {
        isMobile = window.innerWidth <= 768;
        window.addEventListener("resize", () => {
            isMobile = window.innerWidth <= 768;
        });
    }

    const palette = ["#222","#555","#888","#c0392b","#27ae60","#2980b9","#f1c40f","#8e44ad"];
    const CLEAR_COLOR = "clear"; // Special value for erasing/clearing tiles

    // --- Sticky filter state for Map mode ---
    type MapCategory = 'tile' | 'shape' | 'color';
    $: isObjectMode = tool === 'object';
    $: availableCategories = (isObjectMode ? (['tile', 'shape', 'color'] as MapCategory[]) : (['tile', 'color'] as MapCategory[]));
    let activeCategory: MapCategory = isObjectMode ? 'shape' : 'color';
    $: if (!availableCategories.includes(activeCategory)) {
        activeCategory = availableCategories[0];
    }
    function setCategory(cat: MapCategory) {
        if (availableCategories.includes(cat)) activeCategory = cat;
    }
</script>

{#if show || showTertiaryOnMap}
    <aside
        class="tertiary-sidebar"
        class:with-secondary={hasSecondarySidebar || mode === 'map'}
        style="--tertiary-height: 60px;"
        transition:fly={{
            duration: 300,
            easing: quintOut,
            x: isMobile ? 0 : -80,
            y: isMobile ? 60 : 0,
        }}
    >
        {#if mode === "story"}
            <CharacterSheetControls
                {visibleSections}
                {selectedSections}
                {isEditingSections}
                on:toggleSection={(e) => onToggleSection(e.detail)}
            />
        {:else}
            <!-- Map mode: Sticky category buttons + filtered scrollable options -->
            <nav>
                <div class="sticky-group">
                    <!-- Tile category -->
                    <button
                        class="nav-item"
                        class:active={activeCategory === 'tile'}
                        on:click={() => setCategory('tile')}
                        aria-label="Tile"
                    >
                        <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="3" y="3" width="8" height="8"></rect>
                            <rect x="13" y="3" width="8" height="8"></rect>
                            <rect x="3" y="13" width="8" height="8"></rect>
                            <rect x="13" y="13" width="8" height="8"></rect>
                        </svg>
                        <span class="label">Tile</span>
                    </button>

                    {#if isObjectMode}
                        <!-- Shape category (shows current shape icon) -->
                        <button
                            class="nav-item"
                            class:active={activeCategory === 'shape'}
                            on:click={() => setCategory('shape')}
                            aria-label="Shape"
                        >
                            {#if currentShape === 'square'}
                                <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="4" y="4" width="16" height="16"></rect>
                                </svg>
                            {:else if currentShape === 'circle'}
                                <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="12" cy="12" r="8"></circle>
                                </svg>
                            {:else if currentShape === 'triangle'}
                                <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 4 4 20 h16 Z"></path>
                                </svg>
                            {:else}
                                <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="12,2 15,10 23,10 17,15 19,23 12,18 5,23 7,15 1,10 9,10"></polygon>
                                </svg>
                            {/if}
                            <span class="label">Shape</span>
                        </button>
                    {/if}

                    <!-- Color category (shows selected color/clear) -->
                    <button
                        class="nav-item color-item"
                        class:active={activeCategory === 'color'}
                        on:click={() => setCategory('color')}
                        aria-label="Color"
                    >
                        {#if color === CLEAR_COLOR}
                            <div class="color-swatch clear-swatch">
                                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </div>
                        {:else}
                            <div class="color-swatch" style="background: {color}"></div>
                        {/if}
                        <span class="label">Color</span>
                    </button>
                </div> 

                <div class="divider"></div>

                <div class="scrollable-options">
                    <div class="nav-items">
                        {#if activeCategory === 'tile'}
                            <!-- Tile options will be implemented later -->
                        {:else if activeCategory === 'shape'}
                            {#if isObjectMode}
                                <!-- Shapes (only shown when object tool is active) -->
                                <button
                                    class="nav-item"
                                    class:active={currentShape === 'square'}
                                    on:click={() => setShape('square')}
                                    aria-label="Square"
                                >
                                    <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                                        <rect x="4" y="4" width="16" height="16"></rect>
                                    </svg> 
                                </button>

                                <button
                                    class="nav-item"
                                    class:active={currentShape === 'circle'}
                                    on:click={() => setShape('circle')}
                                    aria-label="Circle"
                                >
                                    <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                                        <circle cx="12" cy="12" r="8"></circle>
                                    </svg> 
                                </button>

                                <button
                                    class="nav-item"
                                    class:active={currentShape === 'triangle'}
                                    on:click={() => setShape('triangle')}
                                    aria-label="Triangle"
                                >
                                    <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 4 4 20 h16 Z"></path>
                                    </svg> 
                                </button>

                                <button
                                    class="nav-item"
                                    class:active={currentShape === 'star'}
                                    on:click={() => setShape('star')}
                                    aria-label="Star"
                                >
                                    <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                                        <polygon points="12,2 15,10 23,10 17,15 19,23 12,18 5,23 7,15 1,10 9,10"></polygon>
                                    </svg> 
                                </button>
                            {/if}
                        {:else if activeCategory === 'color'}
                            <!-- Colors (clear + palette) -->
                            <button
                                class="nav-item color-item"
                                class:active={color === CLEAR_COLOR}
                                on:click={() => setColor(CLEAR_COLOR)}
                                aria-label="Clear"
                            >
                                <div class="color-swatch clear-swatch">
                                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </div> 
                            </button>
                            {#each palette as c}
                                <button
                                    class="nav-item color-item"
                                    class:active={color === c}
                                    on:click={() => setColor(c)}
                                    aria-label={c}
                                >
                                    <div class="color-swatch" style="background: {c}"></div>
                                    <span class="label visually-hidden">{c}</span>
                                </button>
                            {/each}
                        {/if}
                    </div>
                </div>
            </nav>
        {/if}
    </aside>
{/if}

<style>
    .tertiary-sidebar {
        background-color: var(--sidebar-bg);
        color: var(--sidebar-text);
        box-shadow: 2px 0 5px var(--shadow-md);
        z-index: 98; /* below primary (100) and secondary (99) sidebars */
        display: flex;
        flex-direction: column;
    }

    nav {
        display: flex;
        height: 100%;
        flex-direction: column;
    }

    .sticky-group {
        position: sticky;
        top: 0;
        left: 0;
        z-index: 1;
        display: flex;
        background: var(--sidebar-bg);
    }

    .scrollable-options {
        flex: 1;
        overflow-y: auto; 
    }

    .nav-items {
        display: flex;
    }

    .nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
        padding: 0.75rem;
        background: none;
        border: none;
        color: var(--sidebar-text-muted);
        cursor: pointer;
        transition: all 0.2s ease;
        flex: 1;
        text-decoration: none;
        min-width: 0;
    }

    .nav-item:hover {
        background-color: var(--sidebar-hover);
        color: var(--sidebar-text);
    }

    .nav-item.active {
        background-color: var(--sidebar-active);
        color: var(--sidebar-text);
        border-left: 3px solid var(--accent-primary);
    }

    .icon {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
    }

    .label {
        font-size: 0.75rem;
        text-align: center;
        word-break: break-word;
    }

    .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
    }

    .divider {
        width: 2px;
        background-color: var(--sidebar-border);
        margin: 0.5rem 0;
    }

    .color-item {
        min-width: 48px;
    }

    .color-swatch {
        width: 24px;
        height: 24px;
        border-radius: 4px;
        border: 2px solid var(--sidebar-border);
        flex-shrink: 0;
    }

    .clear-swatch {
        background: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 3px,
            var(--sidebar-border) 3px,
            var(--sidebar-border) 6px
        );
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .clear-swatch .icon {
        width: 16px;
        height: 16px;
        color: var(--sidebar-text);
    }

    .color-item.active .color-swatch {
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 2px var(--sidebar-active);
    }

    /* Desktop - Left sidebar */
    @media (min-width: 769px) {
        .tertiary-sidebar {
            position: fixed;
            left: 80px; /* default: just to the right of primary sidebar */
            top: 0;
            width: 80px;
            height: 100vh;
        }

        .tertiary-sidebar.with-secondary {
            left: 170px; /* primary (80) + secondary (90) */
        }

        .tertiary-sidebar :global(.section-filter-icons) {
            flex-direction: column;
        }

        .nav-items {
            flex-direction: column;
            gap: 0;
        }

        .sticky-group {
            flex-direction: column;
        }

        .scrollable-options {
            overflow-y: auto;
        }

        .nav-item {
            padding: 1rem 0.5rem;
            flex: 0 0 auto;
        }

        .nav-item.active {
            border-left: 3px solid var(--accent-primary);
            border-bottom: none;
        }

        .divider {
            height: 2px;
            width: 100%;
            margin: 0.5rem 0;
        }
    }

    /* Mobile - Bottom bar */
    @media (max-width: 768px) {
        .tertiary-sidebar {
            position: fixed;
            bottom: calc(70px + env(safe-area-inset-bottom)); /* just above primary bottom bar */
            left: 0;
            right: 0;
            width: 100%;
            height: var(--tertiary-height, 60px);
            box-shadow: 0 -2px 5px var(--shadow-md);
        }

        .tertiary-sidebar.with-secondary {
            bottom: calc(130px + env(safe-area-inset-bottom)); /* above secondary + primary */
        }

        /* Override CharacterSheetControls styles for mobile */
        .tertiary-sidebar :global(.section-filter) {
            position: static;
        }

        nav {
            flex-direction: row;
            padding: 0;
            width: 100%;
        }

        .sticky-group {
            position: sticky;
            left: 0;
            flex-direction: row;
        }

        .scrollable-options {
            flex: 1;
            overflow-x: auto;
            overflow-y: hidden;
            height: 100%;
        }

        .nav-items {
            flex-direction: row;
            flex: 1;
            overflow-x: auto;
            height: 100%;
        }

        .nav-item {
            padding: 0.5rem;
            height: 100%;
            box-sizing: border-box;
            flex: 0 0 auto;
            min-width: 60px;
        }

        .nav-item.active {
            border-left: none;
            border-top: 3px solid var(--accent-primary);
            padding-top: calc(0.5rem - 3px);
        }

        .label {
            font-size: 0.7rem;
        }

        .icon {
            width: 20px;
            height: 20px;
        }

        .divider {
            width: 2px;
            height: 100%;
            margin: 0 0.25rem;
        }
    }
</style>
