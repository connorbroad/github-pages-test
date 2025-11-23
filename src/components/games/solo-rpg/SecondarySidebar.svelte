<script lang="ts">
    import { fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { createEventDispatcher } from "svelte";

    export let activeTab: "characters" | "codex" = "characters";
    export let onTabChange: (tab: "characters" | "codex") => void;
    export let show: boolean = false;

    export let mode: "story" | "map" = "story";
    export let tool: "paint" | "object" | "move" = "move";

    const dispatch = createEventDispatcher();

    function setTool(t: typeof tool) {
        if (tool !== t) dispatch("toolChange", t);
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
               z-40 flex h-[60px] w-full flex-col shadow-md
               md:fixed md:top-0 md:left-[80px] md:h-screen md:w-[90px] md:flex-col md:shadow-md"
        transition:fly={{
            duration: 300,
            easing: quintOut,
            x: isMobile ? 0 : -90,
            y: isMobile ? 60 : 0,
        }}>
        <nav class="flex h-full w-full flex-row p-0 md:w-full md:flex-col">
            <div class="flex flex-1 flex-row md:flex-none md:flex-col md:gap-0">
                {#if mode === "story"}
                    <button
                        class="hover:bg-sidebar-hover flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 border-none bg-transparent p-2 no-underline transition-all duration-200
                               md:flex-none md:p-4
                               {activeTab === 'codex'
                            ? 'bg-sidebar-active border-accent-primary border-t-3 pt-[calc(0.5rem-3px)] md:border-t-0 md:border-l-3 md:pt-4'
                            : ''}"
                        on:click={() => onTabChange("codex")}
                        aria-label="Codex">
                        <svg
                            class="h-5 w-5 shrink-0 md:h-6 md:w-6"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path
                                d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z">
                            </path>
                        </svg>
                        <span class="text-center text-[0.7rem] wrap-break-word md:text-xs">
                            Codex
                        </span>
                    </button>
                {:else if mode === "map"}
                    <!-- Map mode: Tool buttons -->
                    <button
                        class="hover:bg-sidebar-hover flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 border-none bg-transparent p-2 no-underline transition-all duration-200
                               md:flex-none md:p-4
                               {tool === 'move'
                            ? 'bg-sidebar-active border-accent-primary border-t-3 pt-[calc(0.5rem-3px)] md:border-t-0 md:border-l-3 md:pt-4'
                            : ''}"
                        on:click={() => setTool("move")}
                        aria-label="Move">
                        <svg
                            class="h-5 w-5 shrink-0 md:h-6 md:w-6"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2">
                            <polyline points="5 9 2 12 5 15"></polyline>
                            <polyline points="9 5 12 2 15 5"></polyline>
                            <polyline points="15 19 12 22 9 19"></polyline>
                            <polyline points="19 9 22 12 19 15"></polyline>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                            <line x1="12" y1="2" x2="12" y2="22"></line>
                        </svg>
                        <span class="text-center text-[0.7rem] wrap-break-word md:text-xs">
                            Move
                        </span>
                    </button>

                    <button
                        class="hover:bg-sidebar-hover flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 border-none bg-transparent p-2 no-underline transition-all duration-200
                               md:flex-none md:p-4
                               {tool === 'paint'
                            ? 'bg-sidebar-active border-accent-primary border-t-3 pt-[calc(0.5rem-3px)] md:border-t-0 md:border-l-3 md:pt-4'
                            : ''}"
                        on:click={() => setTool("paint")}
                        aria-label="Paint">
                        <svg
                            class="h-5 w-5 shrink-0 md:h-6 md:w-6"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2">
                            <path
                                d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z">
                            </path>
                            <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7"></path>
                            <path d="M14.5 17.5 4.5 15"></path>
                        </svg>
                        <span class="text-center text-[0.7rem] wrap-break-word md:text-xs">
                            Background
                        </span>
                    </button>

                    <button
                        class="hover:bg-sidebar-hover flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 border-none bg-transparent p-2 no-underline transition-all duration-200
                               md:flex-none md:p-4
                               {tool === 'object'
                            ? 'bg-sidebar-active border-accent-primary border-t-3 pt-[calc(0.5rem-3px)] md:border-t-0 md:border-l-3 md:pt-4'
                            : ''}"
                        on:click={() => setTool("object")}
                        aria-label="Object">
                        <svg
                            class="h-5 w-5 shrink-0 md:h-6 md:w-6"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        </svg>
                        <span class="text-center text-[0.7rem] wrap-break-word md:text-xs">
                            Object
                        </span>
                    </button>
                {/if}
            </div>
        </nav>
    </aside>
{/if}
