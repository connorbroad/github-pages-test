<script lang="ts">
    import { fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { createEventDispatcher } from "svelte";

    export let activeTab: "characters" | "codex" = "characters";
    export let onTabChange: (tab: "characters" | "codex") => void;
    export let show: boolean = false;
    
    // Map-specific props
    export let mode: "story" | "map" = "story"; // Which context are we in?
    export let tool: "paint" | "object" | "move" = "move";

    const dispatch = createEventDispatcher();

    function setTool(t: typeof tool) {
        if (tool !== t) dispatch("toolChange", t);
    }

    function handleClose() {
        dispatch('close');
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
        class="secondary-sidebar"
        transition:fly={{
            duration: 300,
            easing: quintOut,
            x: isMobile ? 0 : -80,
            y: isMobile ? 70 : 0,
        }}
    >
        <nav>
            <div class="nav-items">
                {#if mode === "story"}
                    <!-- Story mode: Characters and Codex tabs -->
                    <button
                        class="nav-item"
                        class:active={activeTab === "characters"}
                        on:click={() => onTabChange("characters")}
                        aria-label="Characters"
                    >
                        <svg
                            class="icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                            ></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span class="label">Characters</span>
                    </button>

                    <button
                        class="nav-item"
                        class:active={activeTab === "codex"}
                        on:click={() => onTabChange("codex")}
                        aria-label="Codex"
                    >
                        <svg
                            class="icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path
                                d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
                            ></path>
                        </svg>
                        <span class="label">Codex</span>
                    </button>
                {:else}
                    <!-- Map mode: Tool buttons -->
                    <button
                        class="nav-item"
                        on:click={handleClose}
                        aria-label="Back to Maps"
                    >
                        <svg
                            class="icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        <span class="label">Back</span>
                    </button>

                    <button
                        class="nav-item"
                        class:active={tool === 'move'}
                        on:click={() => setTool('move')}
                        aria-label="Move"
                    >
                        <svg
                            class="icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
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
                        class:active={tool === 'paint'}
                        on:click={() => setTool('paint')}
                        aria-label="Paint"
                    >
                        <svg
                            class="icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
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
                        <svg
                            class="icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        </svg>
                        <span class="label">Object</span>
                    </button>
                {/if}
            </div>
        </nav>
    </aside>

    <style>
        .secondary-sidebar {
            background-color: var(--sidebar-bg);
            color: var(--sidebar-text);
            box-shadow: 2px 0 5px var(--shadow-md);
            z-index: 99;
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

        /* Desktop - Left sidebar */
        @media (min-width: 769px) {
            .secondary-sidebar {
                position: fixed;
                left: 80px;
                top: 0;
                width: 90px;
                height: 100vh;
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
        }

        /* Mobile - Bottom bar (above primary sidebar) */
        @media (max-width: 768px) {
            .secondary-sidebar {
                position: fixed;
                bottom: calc(70px + env(safe-area-inset-bottom));
                left: 0;
                right: 0;
                width: 100%;
                height: 60px;
                box-shadow: 0 -2px 5px var(--shadow-md);
                flex-direction: row;
            }

            nav {
                flex-direction: row;
                padding: 0;
                width: 100%;
            }

            .nav-items {
                flex-direction: row;
                flex: 1;
            }

            .nav-item {
                padding: 0.5rem;
                height: 100%;
                box-sizing: border-box;
                flex: 1;
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
        }
    </style>
{/if}
