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
 
<div class="section-filter">
    <div class="section-filter-icons">
        <!-- In edit mode, show all sections. In view mode, show only visible sections -->
        {#each availableSections as section}
            {#if isEditingSections || visibleSections.includes(section.id)}
                <button
                    class="section-icon-btn"
                    class:active={isEditingSections
                        ? visibleSections.includes(section.id)
                        : selectedSections.has(section.id)}
                    class:excluded={isEditingSections &&
                        !visibleSections.includes(section.id)}
                    class:disabled={isEditingSections &&
                        section.id === "information"}
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
                        : `Toggle ${section.name} section`}
                >
                    {#if section.icon === "info"}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="1em"
                            height="1em"
                        >
                            <path
                                fill="currentColor"
                                d="M3 10h11v2H3zm0-2h11V6H3zm0 8h7v-2H3zm15.01-3.13l.71-.71a.996.996 0 0 1 1.41 0l.71.71c.39.39.39 1.02 0 1.41l-.71.71zm-.71.71l-5.3 5.3V21h2.12l5.3-5.3z"
                            />
                        </svg>
                    {:else if section.icon === "star"}
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <path
                                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                            />
                        </svg>
                    {:else if section.icon === "heart"}
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <path
                                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                            />
                        </svg>
                    {:else if section.icon === "ability"}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 512 512"
                            width="1em"
                            height="1em"
                        >
                            <circle
                                cx="256"
                                cy="56"
                                r="40"
                                fill="none"
                                stroke="currentColor"
                                stroke-miterlimit="10"
                                stroke-width="32"
                            />
                            <path
                                fill="none"
                                stroke="currentColor"
                                stroke-miterlimit="10"
                                stroke-width="32"
                                d="m199.3 295.62l-30.4 172.2a24 24 0 0 0 19.5 27.8a23.76 23.76 0 0 0 27.6-19.5l21-119.9v.2s5.2-32.5 17.5-32.5h3.1c12.5 0 17.5 32.5 17.5 32.5v-.1l21 119.9a23.92 23.92 0 1 0 47.1-8.4l-30.4-172.2l-4.9-29.7c-2.9-18.1-4.2-47.6.5-59.7c4-10.4 14.13-14.2 23.2-14.2H424a24 24 0 0 0 0-48H88a24 24 0 0 0 0 48h92.5c9.23 0 19.2 3.8 23.2 14.2c4.7 12.1 3.4 41.6.5 59.7Z"
                            />
                        </svg>
                    {:else if section.icon === "items"}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 14 14"
                            width="1em"
                            height="1em"
                        >
                            <g
                                fill="none"
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                ><path
                                    d="M7 13.5c3.5 0 6-1.24 6-4c0-3-1.5-4.52-4.5-6.02l1.298-2.028a.65.65 0 0 0-.56-.95h-4.24a.65.65 0 0 0-.56 1L5.5 3.48C2.5 5 1 6.52 1 9.52c0 2.74 2.5 3.98 6 3.98"
                                /><path
                                    d="M5.5 3.5a1.803 1.803 0 0 0 3 0v0"
                                /></g
                            >
                        </svg>
                    {:else if section.icon === "combat"}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="1em"
                            height="1em"
                        >
                            <path
                                fill="none"
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6m-3 3l4 4m-1 1l2-2M14.5 6.5L18 3h3v3l-3.5 3.5M5 14l4 4m-2-1l-3 3m-1-1l2 2"
                            />
                        </svg>
                    {/if}

                    <!-- Edit mode indicator -->
                    {#if isEditingSections && section.id !== "information"}
                        <span
                            class="section-status-indicator"
                            class:included={visibleSections.includes(
                                section.id,
                            )}
                            class:required={section.id === "information"}
                        >
                        </span>
                    {/if}
                </button>
            {/if}
        {/each}
    </div>
</div> 

<style>
    /* Mobile Section Filter */
    .section-filter {
        position: fixed;
        bottom: calc(70px + env(safe-area-inset-bottom));
        left: 0;
        right: 0;
        z-index: 90;
        display: flex;
        flex-direction: column;
        gap: 0;
        background-color: #2c2c2c;
        border-radius: 0;
        overflow: hidden;
        margin-bottom: 0;
        box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
    }

    .section-filter-icons {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 0;

        padding: 0;
        height: 60px;

        background-color: #2c2c2c;
        border-top: 1px solid #3a3a3a;
    }

    .section-icon-btn {
        position: relative;
        flex: 1;
        height: 100%;
        min-width: 0;
        padding: 0.5rem;
        background: none;
        border: none;
        border-top: 3px solid transparent;
        border-radius: 0;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
        overflow: visible;
        box-shadow: none;
    }

    .section-icon-btn svg {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        color: #b0b0b0;
        transition: all 0.2s ease;
        position: relative;
        z-index: 1;
    }

    .section-icon-btn::before {
        display: none;
    }

    .section-icon-btn:hover {
        transform: none;
        background-color: #3a3a3a;
        border-color: transparent;
        box-shadow: none;
    }

    .section-icon-btn:hover svg {
        color: #ffffff;
        transform: none;
    }

    .section-icon-btn:active {
        transform: none;
    }

    /* Active state (included sections in edit mode or selected in view mode) */
    .section-icon-btn.active {
        background-color: #4a4a4a;
        border-top-color: #4a9eff;
        border-bottom: none;
        box-shadow: none;
        padding-top: calc(0.5rem - 3px);
    }

    .section-icon-btn.active::before {
        display: none;
    }

    .section-icon-btn.active svg {
        color: #ffffff;
        transform: none;
    }

    /* Excluded state (sections not included in edit mode) */
    .section-icon-btn.excluded {
        background: #2c2c2c;
        border-color: transparent;
        border-style: solid;
        opacity: 0.4;
    }

    .section-icon-btn.excluded svg {
        color: #b0b0b0;
    }

    .section-icon-btn.excluded:hover {
        opacity: 0.6;
        border-color: transparent;
        background: #3a3a3a;
    }

    .section-icon-btn.excluded:hover svg {
        color: #10b981;
    }

    /* Disabled state (Information section in edit mode) */
    .section-icon-btn.disabled {
        cursor: default;
    }

    .section-icon-btn.disabled:hover {
        transform: none;
        background-color: #4a4a4a;
        border-top-color: #4a9eff;
    }

    /* Section status indicator (shown in edit mode) */
    .section-status-indicator {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        border: 1px solid #2c2c2c;
        background: #0c1329;
        z-index: 2;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .section-status-indicator.included {
        background: #10b981;
    }

    .section-status-indicator.required {
        background: #f59e0b;
    }

    /* Small screen adjustments */
    @media (max-width: 380px) {
        .section-icon-btn svg {
            width: 18px;
            height: 18px;
        }

        .section-filter-icons {
            height: 55px;
        }
    }

    /* larger screens */
    @media (min-width: 768px) {
        .section-filter {
            position: relative;
            top: 0;
            right: 0;
            bottom: auto;
            left: auto;

            margin: 0;
            padding: 0;

            background-color: transparent;
            border-radius: 0;
            border-top: 0;

            display: flex;
            flex-direction: column;
            align-items: stretch;
            justify-content: flex-start;

            box-shadow: none;
        }

        .section-filter-icons {
            padding: .5rem 0;
            border: none;
            background: transparent;
            box-shadow: none; 
            height: auto;
            flex-direction: column;
            flex-wrap: nowrap;
        }

        .section-icon-btn {
            width: 100%;
            height: 5rem;
            flex: 0 0 auto;
            padding: 0.75rem;
            background: none;
            border: none;
            border-left: 3px solid transparent;
            border-radius: 0;
            box-shadow: none;
            transition: all 0.2s ease;
        }

        .section-icon-btn svg {
            width: 1.5rem;
            height: 1.5rem;
            color: #b0b0b0;
            transition: all 0.2s ease;
        }

        .section-icon-btn::before {
            display: none;
        }

        .section-icon-btn:hover {
            transform: none;
            background-color: #4a4a4a;
            border-left-color: transparent;
            box-shadow: none;
        }

        .section-icon-btn:hover svg {
            color: #ffffff;
            transform: none;
        }

        .section-icon-btn:active {
            transform: none;
        }

        .section-icon-btn.active {
            background-color: #5a5a5a;
            border-left-color: #4a9eff;
            box-shadow: none;
        }

        .section-icon-btn.active::before {
            display: none;
        }

        .section-icon-btn.active svg {
            color: #ffffff;
            transform: none;
        }

        .section-icon-btn.excluded {
            background: transparent;
            border-left-color: transparent;
            border-style: solid;
            opacity: 0.4;
        }

        .section-icon-btn.excluded svg {
            color: #b0b0b0;
        }

        .section-icon-btn.excluded:hover {
            opacity: 0.6;
            border-left-color: transparent;
            background: #4a4a4a;
        }

        .section-icon-btn.excluded:hover svg {
            color: #10b981;
        }

        .section-icon-btn.disabled:hover {
            transform: none;
            border-left-color: #4a9eff;
            background-color: #5a5a5a;
        }

        .section-status-indicator {
            top: 4px;
            right: 4px;
            width: 10px;
            height: 10px;
            border: 1px solid #404040;
        }
    }
</style>
