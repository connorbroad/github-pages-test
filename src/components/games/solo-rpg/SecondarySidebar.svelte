<script lang="ts">
    import { fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { createEventDispatcher } from "svelte";

    export let activeTab: "characters" | "codex" = "characters";
    export let onTabChange: (tab: "characters" | "codex") => void;
    export let show: boolean = false;

    export let mode: "story" | "map" = "story";
    export let mapMode: "edit" | "play" = "edit"; // For displaying active state

    const dispatch = createEventDispatcher<{
        modeChange: "edit" | "play";
    }>();

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
               md:fixed md:top-0 md:left-20 md:h-screen md:w-[90px] md:flex-col md:shadow-md"
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
                        class="srpg-sidebar-item"
                        class:active={activeTab === "codex"}
                        on:click={() => onTabChange("codex")}
                        aria-label="Codex">
                        <svg
                            class="sidebar-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path
                                d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z">
                            </path>
                        </svg>
                        <span class="sidebar-label">Codex</span>
                    </button>
                {:else if mode === "map"}
                    <!-- Map mode: Edit/Play mode buttons -->
                    <button
                        class="srpg-sidebar-item"
                        class:active={mapMode === "edit"}
                        on:click={() => dispatch("modeChange", "edit")}
                        aria-label="Edit Mode">
                        <svg
                            class="sidebar-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2">
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z">
                            </path>
                        </svg>
                        <span class="sidebar-label">Edit</span>
                    </button>

                    <button
                        class="srpg-sidebar-item"
                        class:active={mapMode === "play"}
                        on:click={() => dispatch("modeChange", "play")}
                        aria-label="Play Mode">
                        <svg
                            class="sidebar-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2">
                            <!-- Crossed swords icon -->
                            <path d="M14.5 17.5L3 6V3h3l11.5 11.5"></path>
                            <path d="M13 19l6-6"></path>
                            <path d="M16 16l4 4"></path>
                            <path d="M19 21l2-2"></path>
                            <path d="M9.5 6.5L21 18v3h-3L6.5 9.5"></path>
                            <path d="M5 8l4-4"></path>
                            <path d="M8 5L4 1"></path>
                            <path d="M3 2l2 2"></path>
                        </svg>
                        <span class="sidebar-label">Play</span>
                    </button>
                {/if}
            </div>
        </nav>
    </aside>
{/if}
