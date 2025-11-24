<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let visibleSections: string[] = ["information"];
    export let selectedSections: Set<string> = new Set();
    export let isEditingSections: boolean = false;

    const dispatch = createEventDispatcher();

    // Available sections that can be added to a character sheet
    const availableSections: Array<{
        id: string;
        name: string;
        icon: string;
    }> = [
        { id: "information", name: "Information", icon: "info" },
        { id: "experience", name: "Experience", icon: "star" },
        { id: "health", name: "Health", icon: "heart" },
        { id: "abilities", name: "Abilities", icon: "ability" },
        { id: "items", name: "Items", icon: "items" },
        { id: "combat", name: "Combat Stats", icon: "combat" },
    ];

    function toggleSection(section: string) {
        dispatch("toggleSection", section);
    }
</script>

<div
    class="mb-0 flex flex-col gap-0 overflow-hidden rounded-none bg-[#2c2c2c] shadow-[0_-2px_5px_rgba(0,0,0,0.1)] md:relative md:top-0 md:right-0 md:bottom-auto md:left-auto md:m-0 md:items-stretch md:justify-start md:border-t-0 md:bg-transparent md:p-0 md:shadow-none">
    <div
        class="flex h-[60px] flex-wrap justify-center gap-0 border-t border-[#3a3a3a] bg-[#2c2c2c] p-0 max-[380px]:h-[55px] md:h-auto md:flex-col md:flex-nowrap md:border-none md:bg-transparent md:shadow-none">
        <!-- In edit mode, show all sections. In view mode, show only visible sections -->
        {#each availableSections as section}
            {#if isEditingSections || visibleSections.includes(section.id)}
                <button
                    class="group relative flex h-full min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 overflow-visible rounded-none border-t-[3px] border-none border-transparent bg-transparent p-2 shadow-none transition-all duration-200 hover:transform-none hover:border-transparent hover:bg-[#3a3a3a] hover:shadow-none active:transform-none md:h-16 md:w-full md:flex-none md:border-t-0 md:border-l-[3px] md:p-3 md:hover:border-l-transparent md:hover:bg-[#4a4a4a] {isEditingSections
                        ? visibleSections.includes(section.id)
                            ? 'border-b-0 border-t-[#4a9eff] bg-[#4a4a4a] pt-[calc(0.5rem-3px)] shadow-none md:border-t-transparent md:border-l-[#4a9eff] md:bg-[#5a5a5a] md:pt-3'
                            : 'border-solid border-transparent bg-[#2c2c2c] opacity-40 hover:border-transparent hover:bg-[#3a3a3a] hover:opacity-60 md:border-l-transparent md:bg-transparent md:hover:bg-[#4a4a4a]'
                        : selectedSections.has(section.id)
                          ? 'border-b-0 border-t-[#4a9eff] bg-[#4a4a4a] pt-[calc(0.5rem-3px)] shadow-none md:border-t-transparent md:border-l-[#4a9eff] md:bg-[#5a5a5a] md:pt-3'
                          : ''} {isEditingSections && section.id === 'information'
                        ? 'cursor-default hover:transform-none hover:border-t-[#4a9eff] hover:bg-[#4a4a4a] md:hover:border-l-[#4a9eff] md:hover:bg-[#5a5a5a]'
                        : ''}"
                    on:click={() => toggleSection(section.id)}
                    title={isEditingSections
                        ? section.id === "information"
                            ? "Information (Required)"
                            : visibleSections.includes(section.id)
                              ? `Remove ${section.name}`
                              : `Add ${section.name}`
                        : section.name}
                    aria-label={isEditingSections
                        ? visibleSections.includes(section.id)
                            ? `Remove ${section.name} section`
                            : `Add ${section.name} section`
                        : `Toggle ${section.name} section`}>
                    {#if section.icon === "info"}
                        <svg
                            class="relative z-10 h-5 w-5 shrink-0 text-[#b0b0b0] transition-all duration-200 group-hover:transform-none group-hover:text-white max-[380px]:h-[18px] max-[380px]:w-[18px] md:h-6 md:w-6 {isEditingSections
                                ? visibleSections.includes(section.id)
                                    ? 'transform-none text-white'
                                    : 'text-[#b0b0b0] group-hover:text-[#10b981]'
                                : selectedSections.has(section.id)
                                  ? 'transform-none text-white'
                                  : ''}"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="1em"
                            height="1em">
                            <path fill="currentColor" d="M3 18h12v-2H3zM3 6v2h18V6zm0 7h18v-2H3z" />
                        </svg>
                    {:else if section.icon === "star"}
                        <svg
                            class="relative z-10 h-5 w-5 shrink-0 text-[#b0b0b0] transition-all duration-200 group-hover:transform-none group-hover:text-white max-[380px]:h-[18px] max-[380px]:w-[18px] md:h-6 md:w-6 {isEditingSections
                                ? visibleSections.includes(section.id)
                                    ? 'transform-none text-white'
                                    : 'text-[#b0b0b0] group-hover:text-[#10b981]'
                                : selectedSections.has(section.id)
                                  ? 'transform-none text-white'
                                  : ''}"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2">
                            <path
                                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                    {:else if section.icon === "heart"}
                        <svg
                            class="relative z-10 h-5 w-5 shrink-0 text-[#b0b0b0] transition-all duration-200 group-hover:transform-none group-hover:text-white max-[380px]:h-[18px] max-[380px]:w-[18px] md:h-6 md:w-6 {isEditingSections
                                ? visibleSections.includes(section.id)
                                    ? 'transform-none text-white'
                                    : 'text-[#b0b0b0] group-hover:text-[#10b981]'
                                : selectedSections.has(section.id)
                                  ? 'transform-none text-white'
                                  : ''}"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2">
                            <path
                                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                    {:else if section.icon === "ability"}
                        <svg
                            class="relative z-10 h-5 w-5 shrink-0 text-[#b0b0b0] transition-all duration-200 group-hover:transform-none group-hover:text-white max-[380px]:h-[18px] max-[380px]:w-[18px] md:h-6 md:w-6 {isEditingSections
                                ? visibleSections.includes(section.id)
                                    ? 'transform-none text-white'
                                    : 'text-[#b0b0b0] group-hover:text-[#10b981]'
                                : selectedSections.has(section.id)
                                  ? 'transform-none text-white'
                                  : ''}"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 512 512"
                            width="1em"
                            height="1em">
                            <circle
                                cx="256"
                                cy="56"
                                r="40"
                                fill="none"
                                stroke="currentColor"
                                stroke-miterlimit="10"
                                stroke-width="32" />
                            <path
                                fill="none"
                                stroke="currentColor"
                                stroke-miterlimit="10"
                                stroke-width="32"
                                d="m199.3 295.62l-30.4 172.2a24 24 0 0 0 19.5 27.8a23.76 23.76 0 0 0 27.6-19.5l21-119.9v.2s5.2-32.5 17.5-32.5h3.1c12.5 0 17.5 32.5 17.5 32.5v-.1l21 119.9a23.92 23.92 0 1 0 47.1-8.4l-30.4-172.2l-4.9-29.7c-2.9-18.1-4.2-47.6.5-59.7c4-10.4 14.13-14.2 23.2-14.2H424a24 24 0 0 0 0-48H88a24 24 0 0 0 0 48h92.5c9.23 0 19.2 3.8 23.2 14.2c4.7 12.1 3.4 41.6.5 59.7Z" />
                        </svg>
                    {:else if section.icon === "items"}
                        <svg
                            class="relative z-10 h-5 w-5 shrink-0 text-[#b0b0b0] transition-all duration-200 group-hover:transform-none group-hover:text-white max-[380px]:h-[18px] max-[380px]:w-[18px] md:h-6 md:w-6 {isEditingSections
                                ? visibleSections.includes(section.id)
                                    ? 'transform-none text-white'
                                    : 'text-[#b0b0b0] group-hover:text-[#10b981]'
                                : selectedSections.has(section.id)
                                  ? 'transform-none text-white'
                                  : ''}"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 14 14"
                            width="1em"
                            height="1em">
                            <g
                                fill="none"
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round">
                                <path
                                    d="M7 13.5c3.5 0 6-1.24 6-4c0-3-1.5-4.52-4.5-6.02l1.298-2.028a.65.65 0 0 0-.56-.95h-4.24a.65.65 0 0 0-.56 1L5.5 3.48C2.5 5 1 6.52 1 9.52c0 2.74 2.5 3.98 6 3.98" />
                                <path d="M5.5 3.5a1.803 1.803 0 0 0 3 0v0" />
                            </g>
                        </svg>
                    {:else if section.icon === "combat"}
                        <svg
                            class="relative z-10 h-5 w-5 shrink-0 text-[#b0b0b0] transition-all duration-200 group-hover:transform-none group-hover:text-white max-[380px]:h-[18px] max-[380px]:w-[18px] md:h-6 md:w-6 {isEditingSections
                                ? visibleSections.includes(section.id)
                                    ? 'transform-none text-white'
                                    : 'text-[#b0b0b0] group-hover:text-[#10b981]'
                                : selectedSections.has(section.id)
                                  ? 'transform-none text-white'
                                  : ''}"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="1em"
                            height="1em">
                            <path
                                fill="none"
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6m-3 3l4 4m-1 1l2-2M14.5 6.5L18 3h3v3l-3.5 3.5M5 14l4 4m-2-1l-3 3m-1-1l2 2" />
                        </svg>
                    {/if}

                    <!-- Edit mode indicator -->
                    {#if isEditingSections && section.id !== "information"}
                        <span
                            class="absolute top-1 right-1 z-20 h-2 w-2 rounded-full border border-[#2c2c2c] bg-[#0c1329] transition-all duration-250 ease-in-out md:h-2.5 md:w-2.5 md:border-[#404040] {visibleSections.includes(
                                section.id
                            )
                                ? 'bg-[#10b981]'
                                : ''} {section.id === 'information' ? 'bg-[#f59e0b]' : ''}">
                        </span>
                    {/if}
                </button>
            {/if}
        {/each}
    </div>
</div>

