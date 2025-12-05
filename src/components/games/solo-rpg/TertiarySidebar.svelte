<script lang="ts">
    import { fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import CharacterSheetControls from "./lore/characters/CharacterSheetControls.svelte";

    export let show: boolean = false;

    // New: whether a secondary sidebar is present; affects positioning
    export let hasSecondarySidebar: boolean = false;

    // Story mode props
    export let visibleSections: string[] = ["information"];
    export let selectedSections: Set<string> = new Set();
    export let isEditingSections: boolean = false;
    export let onToggleSection: (section: string) => void = () => {};

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
               {hasSecondarySidebar
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
        <div class="md:[&_.section-filter]:static md:[&_.section-filter-icons]:flex-col">
            <CharacterSheetControls
                {visibleSections}
                {selectedSections}
                {isEditingSections}
                on:toggleSection={(e) => onToggleSection(e.detail)} />
        </div>
    </aside>
{/if}
