<script lang="ts">
    import { fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import CharacterSheetControls from "./lore/characters/CharacterSheetControls.svelte";

    export let show: boolean = false;
    export let visibleSections: string[] = ["information"];
    export let selectedSections: Set<string> = new Set();
    export let isEditingSections: boolean = false;
    export let onToggleSection: (section: string) => void;

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
        class="tertiary-sidebar"
        transition:fly={{
            duration: 300,
            easing: quintOut,
            x: isMobile ? 0 : -80,
            y: isMobile ? 60 : 0,
        }}
    >
        <CharacterSheetControls
            {visibleSections}
            {selectedSections}
            {isEditingSections}
            on:toggleSection={(e) => onToggleSection(e.detail)}
        />
    </aside>
{/if}

<style>
    .tertiary-sidebar {
        background-color: #404040;
        color: #ffffff;
        box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
        z-index: 98;
        display: flex;
        flex-direction: column;
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
    }

    /* Mobile - Bottom bar (above secondary sidebar) */
    @media (max-width: 768px) {
        .tertiary-sidebar {
            position: fixed;
            bottom: calc(130px + env(safe-area-inset-bottom));
            left: 0;
            right: 0;
            width: 100%;
            height: 60px;
            box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
        }

        /* Override CharacterSheetControls styles for mobile */
        .tertiary-sidebar :global(.section-filter) {
            position: static;
            margin: 0;
            background-color: transparent;
            box-shadow: none;
            height: 60px;
        }
    }
</style>
