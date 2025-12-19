<script lang="ts">
    import { fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";

    export let activeTab: "characters" | "codex" = "characters";
    export let onTabChange: (tab: "characters" | "codex") => void;
    export let show: boolean = false;

    export let mode: "story" | "map" = "story";

    // Map mode props
    export let editMode: "move" | "background" | "object" = "move";
    export let onEditModeChange: (mode: "move" | "background" | "object") => void = () => {};

    function setEditMode(newMode: "move" | "background" | "object") {
        if (editMode !== newMode) {
            onEditModeChange(newMode);
        }
    }

    // Detect if we're on mobile
    import { isMobile } from "./ui-utils";

    export let disableFixed: boolean = false;
</script>

{#if show}
    <aside
        class="bg-sidebar-bg pointer-events-auto z-40 flex shadow-md transition-all duration-300
               {disableFixed
            ? 'relative h-[60px] w-full'
            : 'fixed right-0 bottom-[calc(70px+env(safe-area-inset-bottom))] left-0 h-[60px] w-full'}
               md:flex-col
               {disableFixed
            ? 'md:relative md:top-auto md:left-auto md:h-fit md:w-[90px] md:shadow-none'
            : 'md:fixed md:top-[48px] md:left-20 md:h-fit md:w-[90px]'}"
        transition:fly={{
            duration: 300,
            easing: quintOut,
            x: $isMobile ? 0 : -90,
            y: $isMobile ? 60 : 0,
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
                    <!-- Map mode: View/Background/Token tool buttons -->
                    <button
                        class="srpg-sidebar-item"
                        class:active={editMode === "move"}
                        on:click={() => setEditMode("move")}
                        aria-label="View">
                        <svg
                            class="sidebar-icon"
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
                        <span class="sidebar-label">View</span>
                    </button>

                    <button
                        class="srpg-sidebar-item"
                        class:active={editMode === "background"}
                        on:click={() => setEditMode("background")}
                        aria-label="Background">
                        <svg
                            class="sidebar-icon"
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
                        <span class="sidebar-label">Background</span>
                    </button>

                    <button
                        class="srpg-sidebar-item"
                        class:active={editMode === "object"}
                        on:click={() => setEditMode("object")}
                        aria-label="Token">
                        <svg
                            class="sidebar-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2">
                            <!-- Token/object icon (circle with dot) -->
                            <circle cx="12" cy="12" r="9" />
                            <circle cx="12" cy="12" r="3" fill="currentColor" />
                        </svg>
                        <span class="sidebar-label">Token</span>
                    </button>
                {/if}
            </div>
        </nav>
    </aside>
{/if}
