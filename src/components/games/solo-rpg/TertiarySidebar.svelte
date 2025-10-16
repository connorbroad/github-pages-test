<script lang="ts">
    import { fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { createEventDispatcher } from "svelte";
    import CharacterSheetControls from "./lore/characters/CharacterSheetControls.svelte";

    export let show: boolean = false;
    export let mode: "story" | "map" = "story"; // Which context are we in?
    
    // Story mode props
    export let visibleSections: string[] = ["information"];
    export let selectedSections: Set<string> = new Set();
    export let isEditingSections: boolean = false;
    export let onToggleSection: (section: string) => void = () => {};

    // Map mode props
    export let tool: "paint" | "object" | "move" | "erase" = "paint";
    export let currentShape: "square" | "circle" | "triangle" | "star" = "square";
    export let color: string = "#2980b9";

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
</script>

{#if show}
    <aside
        class="tertiary-sidebar"
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
            <!-- Map mode: Tools, Shapes, Colors -->
            <nav>
                <div class="nav-items">
                    <!-- Tools -->
                    <button
                        class="nav-item"
                        class:active={tool === 'paint'}
                        on:click={() => setTool('paint')}
                        aria-label="Paint"
                    >
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z"></path>
                            <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7"></path>
                            <path d="M14.5 17.5 4.5 15"></path>
                        </svg>
                        <span class="label">Paint</span>
                    </button>

                    <button
                        class="nav-item"
                        class:active={tool === 'object'}
                        on:click={() => setTool('object')}
                        aria-label="Object"
                    >
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        </svg>
                        <span class="label">Object</span>
                    </button>

                    <button
                        class="nav-item"
                        class:active={tool === 'move'}
                        on:click={() => setTool('move')}
                        aria-label="Move"
                    >
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="5 9 2 12 5 15"></polyline>
                            <polyline points="9 5 12 2 15 5"></polyline>
                            <polyline points="15 19 12 22 9 19"></polyline>
                            <polyline points="19 9 22 12 19 15"></polyline>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                            <line x1="12" y1="2" x2="12" y2="22"></line>
                        </svg>
                        <span class="label">Move</span>
                    </button>

                    <button
                        class="nav-item"
                        class:active={tool === 'erase'}
                        on:click={() => setTool('erase')}
                        aria-label="Erase"
                    >
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"></path>
                            <path d="M22 21H7"></path>
                            <path d="m5 11 9 9"></path>
                        </svg>
                        <span class="label">Erase</span>
                    </button>

                    {#if tool === 'object'}
                        <!-- Shapes (only shown when object tool is active) -->
                        <div class="divider"></div>
                        
                        <button
                            class="nav-item"
                            class:active={currentShape === 'square'}
                            on:click={() => setShape('square')}
                            aria-label="Square"
                        >
                            <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="4" y="4" width="16" height="16"></rect>
                            </svg>
                            <span class="label">Square</span>
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
                            <span class="label">Circle</span>
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
                            <span class="label">Triangle</span>
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
                            <span class="label">Star</span>
                        </button>
                    {/if}

                    <div class="divider"></div>

                    <!-- Colors -->
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
        z-index: 98;
        display: flex;
        flex-direction: column;
    }

    nav {
        display: flex;
        height: 100%;
        flex-direction: column;
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

    .color-item.active .color-swatch {
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 2px var(--sidebar-active);
    }

    /* Desktop - Left sidebar (third from left) */
    @media (min-width: 769px) {
        .tertiary-sidebar {
            position: fixed;
            left: 170px;
            top: 0;
            width: 80px;
            height: 100vh;
        }

        .tertiary-sidebar :global(.section-filter-icons) {
            flex-direction: column;
        }

        .nav-items {
            flex-direction: column;
            gap: 0;
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

    /* Mobile - Bottom bar (above secondary sidebar) */
    @media (max-width: 768px) {
        .tertiary-sidebar {
            position: fixed;
            bottom: calc(130px + env(safe-area-inset-bottom)); /* primary 70 + secondary 60 */
            left: 0;
            right: 0;
            width: 100%;
            height: var(--tertiary-height, 60px);
            box-shadow: 0 -2px 5px var(--shadow-md);
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

        .nav-items {
            flex-direction: row;
            flex: 1;
            overflow-x: auto;
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
