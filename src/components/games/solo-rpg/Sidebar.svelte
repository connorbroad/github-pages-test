<script lang="ts">
    import GameOracle from "./oracle/GameOracle.svelte";

    export let currentView:
        | "home"
        | "tools"
        | "oracle"
        | "settings"
        | "map"
        | "story"
        | "chronicle"
        | "characters" = "home";
    export let onNavigate: (
        view:
            | "home"
            | "tools"
            | "oracle"
            | "settings"
            | "map"
            | "story"
            | "chronicle"
            | "characters"
    ) => void = () => {};

    // Indicates if tapping the button again will "return" to a list/landing state
    export let canReturnFromCharacters: boolean = false;
    export let canReturnFromMap: boolean = false;

    // Oracle props
    export let diceRollPreset: any = null;
    export let currentCharacterId: string | null = null;
    export let onNavigateToStory: () => void = () => {};
    export let onClearPreset: () => void = () => {};

    let showOracle = false;
    let lastPreset: any = null;

    // Automatically open oracle when preset is provided and changed
    $: if (diceRollPreset && diceRollPreset !== lastPreset) {
        showOracle = true;
        lastPreset = diceRollPreset;
    }

    function toggleOracle() {
        showOracle = !showOracle;
    }

    function closeOracle() {
        showOracle = false;
    }

    function handleNavigateToStory() {
        showOracle = false;
        onNavigateToStory();
    }

    function handleClearPreset() {
        onClearPreset();
    }
</script>

<aside
    class="bg-sidebar-bg fixed right-0 bottom-0 left-0
              z-50 flex h-[calc(70px+env(safe-area-inset-bottom))] w-full flex-col pb-[env(safe-area-inset-bottom)] shadow-md
              md:fixed md:top-0 md:left-0 md:h-screen md:w-20 md:flex-col md:pb-0 md:shadow-md">
    <div class="border-sidebar-border hidden items-center justify-center border-b py-6 md:flex">
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="stroke-accent-primary h-9 w-9">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
        </svg>
    </div>

    <nav
        class="flex h-full w-full flex-row p-0
                md:w-auto md:flex-1 md:flex-col md:justify-between md:p-0">
        <div
            class="flex flex-5 flex-row
                    md:flex-none md:flex-col md:gap-0">
            <button
                class="srpg-sidebar-item"
                class:active={currentView === "home"}
                on:click={() => onNavigate("home")}
                aria-label="Home">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="sidebar-icon">
                    <g
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.5"
                        color="currentColor">
                        <path
                            d="M16 2h-4c-2.828 0-4.243 0-5.121.946C6 3.893 6 5.416 6 8.462v1.076c0 3.047 0 4.57.879 5.516C7.757 16 9.172 16 12 16h4c2.828 0 4.243 0 5.121-.946c.879-.947.879-2.47.879-5.516V8.462c0-3.046 0-4.57-.879-5.516C20.243 2 18.828 2 16 2" />
                        <path
                            d="M18 16.608c-.012 2.346-.109 3.616-.877 4.444c-.879.948-2.293.948-5.122.948h-4c-2.83 0-4.243 0-5.122-.948C2 20.106 2 18.58 2 15.53v-1.078c0-3.05 0-4.576.879-5.523C3.52 8.237 4.447 8.05 6 8" />
                    </g>
                </svg>
                <span class="sidebar-label"></span>
            </button>

            <button
                class="srpg-sidebar-item"
                class:active={currentView === "chronicle"}
                on:click={() => onNavigate("chronicle")}
                aria-label="Journey">
                <svg
                    class="sidebar-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    <path d="M2 17l10 5 10-5"></path>
                    <path d="M2 12l10 5 10-5"></path>
                </svg>
                <span class="sidebar-label"></span>
            </button>

            <button
                class="srpg-sidebar-item"
                class:active={currentView === "characters"}
                class:can-return={currentView === "characters" && canReturnFromCharacters}
                on:click={() => onNavigate("characters")}
                aria-label="Characters">
                <div class="sidebar-icon-wrapper">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        class="sidebar-icon"
                        stroke-width="2">
                        <path
                            fill="currentColor"
                            d="M12 4a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4" />
                    </svg>
                    {#if currentView === "characters" && canReturnFromCharacters}
                        <span class="return-badge" aria-hidden="true">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="3">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                        </span>
                    {/if}
                </div>
                <span class="sidebar-label"></span>
            </button>

            <!-- Oracle Button - Mystical Orb (centered in mobile nav) -->
            <div class="oracle-container">
                <button
                    class="oracle-orb"
                    class:active={showOracle}
                    class:has-preset={diceRollPreset !== null}
                    on:click={toggleOracle}
                    aria-label="Oracle">
                    <div class="orb-glow"></div>
                    <div class="orb-inner-glow"></div>
                    <div class="orb-surface"></div>
                    <!-- D20 dice icon (from Chronicle) -->
                    <svg viewBox="0 0 512 512" class="oracle-icon">
                        <path
                            fill="currentColor"
                            d="M510.923 324.993L325.507 509.894c-.515.515-1.545.515-3.091.515L69.529 442.938c-.515 0-1.545-.515-2.06-2.06L-.002 188.507c0-.515 0-2.06.515-3.09L185.929.517c.515-.515 1.545-.515 3.09-.515l252.887 67.986c.515 0 1.545.515 2.06 2.06l67.471 252.371c1.03 1.03.515 2.06-.515 2.575zM263.188 124.126L14.937 191.082q-.773 0 0 1.545l181.81 181.811c.515.515.515 0 1.545 0l66.955-247.736c-1.03-2.575-2.06-2.575-2.06-2.575z"
                        />
                    </svg>
                </button>
            </div>

            <button
                class="srpg-sidebar-item"
                class:active={currentView === "map"}
                class:can-return={currentView === "map" && canReturnFromMap}
                on:click={() => onNavigate("map")}
                aria-label="Map">
                <div class="sidebar-icon-wrapper">
                    <svg
                        class="sidebar-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="0">
                        <path
                            fill="currentColor"
                            d="m20.5 3l-.16.03L15 5.1L9 3L3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1l5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5M10 5.47l4 1.4v11.66l-4-1.4zm-5 .99l3-1.01v11.7l-3 1.16zm14 11.08l-3 1.01V6.86l3-1.16z" />
                    </svg>
                    {#if currentView === "map" && canReturnFromMap}
                        <span class="return-badge" aria-hidden="true">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="3">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                        </span>
                    {/if}
                </div>

                <span class="sidebar-label"></span>
            </button>

            <button
                class="srpg-sidebar-item"
                class:active={currentView === "story"}
                on:click={() => onNavigate("story")}
                aria-label="Lore">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="sidebar-icon">
                    <g
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2">
                        <path
                            d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4M2 6h4m-4 4h4m-4 4h4m-4 4h4" />
                        <path
                            d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" />
                    </g>
                </svg>
                <span class="sidebar-label"></span>
            </button>
        </div>

        <div
            class="flex flex-1 flex-row
                    md:mt-auto md:flex-none md:flex-col">
            <button
                class="srpg-sidebar-item"
                class:active={currentView === "settings"}
                on:click={() => onNavigate("settings")}
                aria-label="Settings">
                <svg
                    class="sidebar-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="0">
                    <path
                        fill="currentColor"
                        d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46a.5.5 0 0 0-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65A.49.49 0 0 0 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1a.6.6 0 0 0-.18-.03c-.17 0-.34.09-.43.25l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46a.5.5 0 0 0 .61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1q.09.03.18.03c.17 0 .34-.09.43-.25l2-3.46c.12-.22.07-.49-.12-.64zm-1.98-1.71c.04.31.05.52.05.73s-.02.43-.05.73l-.14 1.13l.89.7l1.08.84l-.7 1.21l-1.27-.51l-1.04-.42l-.9.68c-.43.32-.84.56-1.25.73l-1.06.43l-.16 1.13l-.2 1.35h-1.4l-.19-1.35l-.16-1.13l-1.06-.43c-.43-.18-.83-.41-1.23-.71l-.91-.7l-1.06.43l-1.27.51l-.7-1.21l1.08-.84l.89-.7l-.14-1.13c-.03-.31-.05-.54-.05-.74s.02-.43.05-.73l.14-1.13l-.89-.7l-1.08-.84l.7-1.21l1.27.51l1.04.42l.9-.68c.43-.32.84-.56 1.25-.73l1.06-.43l.16-1.13l.2-1.35h1.39l.19 1.35l.16 1.13l1.06.43c.43.18.83.41 1.23.71l.91.7l1.06-.43l1.27-.51l.7 1.21l-1.07.85l-.89.7zM12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4s4-1.79 4-4s-1.79-4-4-4m0 6c-1.1 0-2-.9-2-2s.9-2 2-2s2 .9 2 2s-.9 2-2 2" />
                </svg>
                <span class="sidebar-label"></span>
            </button>
        </div>
    </nav>
</aside>

{#if showOracle}
    <GameOracle
        {diceRollPreset}
        onClose={closeOracle}
        onNavigateToStory={handleNavigateToStory}
        onClearPreset={handleClearPreset}
        preselectedCharacterId={diceRollPreset?.characterId || currentCharacterId} />
{/if}

<style>
    /* ============================================
       ORACLE ORB - MYSTICAL CRYSTAL BALL
       A round glowing orb embedded in the sidebar
       ============================================ */

    /* Container to hold the orb and take up sidebar slot space */
    .oracle-container {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
        min-width: 0;
        padding: 0.25rem;
    }

    @media (min-width: 769px) {
        .oracle-container {
            flex: none;
            padding: 0.75rem 1rem;
        }
    }

    /* The orb itself - a perfect circle */
    .oracle-orb {
        position: relative;
        width: 44px;
        height: 44px;
        min-width: 44px;
        min-height: 44px;
        flex-shrink: 0;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        aspect-ratio: 1 / 1;

        /* Center the icon */
        display: flex;
        align-items: center;
        justify-content: center;

        /* Base orb appearance - glass-like sphere */
        background:
            radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.15) 0%, transparent 40%),
            radial-gradient(circle at 70% 70%, rgba(0, 0, 0, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%,
                #7c3aed 0%,
                #6d28d9 30%,
                #5b21b6 60%,
                #4c1d95 100%
            );

        /* 3D sphere effect with shadows */
        box-shadow:
            inset 0 -4px 8px rgba(0, 0, 0, 0.4),
            inset 0 4px 8px rgba(255, 255, 255, 0.1),
            0 2px 8px rgba(0, 0, 0, 0.5),
            0 0 20px rgba(139, 92, 246, 0.3);

        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
    }

    @media (min-width: 769px) {
        .oracle-orb {
            width: 52px;
            height: 52px;
            min-width: 52px;
            min-height: 52px;
        }
    }

    /* Outer glow that rotates */
    .orb-glow {
        position: absolute;
        inset: -8px;
        border-radius: 50%;
        background: conic-gradient(
            from 0deg,
            transparent 0deg,
            rgba(168, 85, 247, 0.6) 45deg,
            rgba(236, 72, 153, 0.4) 90deg,
            transparent 135deg,
            rgba(99, 102, 241, 0.5) 180deg,
            rgba(139, 92, 246, 0.4) 225deg,
            transparent 270deg,
            rgba(168, 85, 247, 0.5) 315deg,
            transparent 360deg
        );
        animation: orb-rotate 10s linear infinite;
        opacity: 0.6;
        pointer-events: none;
    }

    .oracle-orb:hover .orb-glow {
        opacity: 1;
        animation-duration: 4s;
        inset: -12px;
    }

    .oracle-orb.active .orb-glow {
        opacity: 1;
        animation-duration: 3s;
        inset: -16px;
    }

    @keyframes orb-rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    /* Inner glow pulse */
    .orb-inner-glow {
        position: absolute;
        inset: 2px;
        border-radius: 50%;
        background: radial-gradient(circle at center,
            rgba(196, 181, 253, 0.3) 0%,
            transparent 60%
        );
        opacity: 0.5;
        pointer-events: none;
        transition: all 0.3s ease;
    }

    .oracle-orb:hover .orb-inner-glow {
        opacity: 0.8;
        background: radial-gradient(circle at center,
            rgba(233, 213, 255, 0.5) 0%,
            transparent 70%
        );
    }

    .oracle-orb.active .orb-inner-glow {
        opacity: 1;
        animation: inner-pulse 2s ease-in-out infinite;
    }

    @keyframes inner-pulse {
        0%, 100% {
            background: radial-gradient(circle at center,
                rgba(233, 213, 255, 0.5) 0%,
                transparent 60%
            );
        }
        50% {
            background: radial-gradient(circle at center,
                rgba(253, 244, 255, 0.7) 0%,
                rgba(192, 132, 252, 0.3) 40%,
                transparent 70%
            );
        }
    }

    /* Glass highlight on the orb surface */
    .orb-surface {
        position: absolute;
        top: 4px;
        left: 8px;
        width: 35%;
        height: 25%;
        border-radius: 50%;
        background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.5) 0%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 100%
        );
        pointer-events: none;
        transition: all 0.3s ease;
    }

    .oracle-orb:hover .orb-surface {
        opacity: 0.8;
    }

    /* Dice icon inside the orb */
    .oracle-icon {
        position: relative;
        width: 22px;
        height: 22px;
        color: #e9d5ff;
        filter: drop-shadow(0 0 3px rgba(168, 85, 247, 0.8));
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 2;
    }

    @media (min-width: 769px) {
        .oracle-icon {
            width: 26px;
            height: 26px;
        }
    }

    .oracle-orb:hover .oracle-icon {
        color: #faf5ff;
        filter: drop-shadow(0 0 6px rgba(236, 72, 153, 0.9));
        transform: scale(1.1);
    }

    .oracle-orb.active .oracle-icon {
        color: #ffffff;
        filter: drop-shadow(0 0 8px rgba(253, 244, 255, 1));
        animation: dice-float 2.5s ease-in-out infinite;
    }

    @keyframes dice-float {
        0%, 100% { transform: translateY(0) scale(1.05); }
        50% { transform: translateY(-1px) scale(1.1) rotate(3deg); }
    }

    /* Hover state - orb lifts and glows */
    .oracle-orb:hover {
        transform: translateY(-2px) scale(1.05);
        box-shadow:
            inset 0 -4px 8px rgba(0, 0, 0, 0.4),
            inset 0 4px 8px rgba(255, 255, 255, 0.15),
            0 4px 16px rgba(0, 0, 0, 0.4),
            0 0 30px rgba(168, 85, 247, 0.5),
            0 0 50px rgba(139, 92, 246, 0.3);
    }

    /* Active state - orb is open, maximum glow */
    .oracle-orb.active {
        transform: translateY(-2px) scale(1.08);
        background:
            radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 40%),
            radial-gradient(circle at 70% 70%, rgba(0, 0, 0, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%,
                #a78bfa 0%,
                #8b5cf6 25%,
                #7c3aed 50%,
                #6d28d9 100%
            );
        box-shadow:
            inset 0 -4px 8px rgba(0, 0, 0, 0.3),
            inset 0 4px 8px rgba(255, 255, 255, 0.2),
            0 4px 20px rgba(0, 0, 0, 0.3),
            0 0 40px rgba(168, 85, 247, 0.7),
            0 0 70px rgba(139, 92, 246, 0.4),
            0 0 100px rgba(124, 58, 237, 0.2);
    }

    /* Has preset - pulsing urgency effect */
    .oracle-orb.has-preset {
        animation: orb-urgency 1.5s ease-in-out infinite;
    }

    .oracle-orb.has-preset .orb-glow {
        animation-duration: 2s;
        opacity: 1;
        inset: -14px;
    }

    @keyframes orb-urgency {
        0%, 100% {
            box-shadow:
                inset 0 -4px 8px rgba(0, 0, 0, 0.4),
                inset 0 4px 8px rgba(255, 255, 255, 0.1),
                0 2px 8px rgba(0, 0, 0, 0.5),
                0 0 25px rgba(236, 72, 153, 0.5),
                0 0 40px rgba(168, 85, 247, 0.4);
        }
        50% {
            box-shadow:
                inset 0 -4px 8px rgba(0, 0, 0, 0.4),
                inset 0 4px 8px rgba(255, 255, 255, 0.15),
                0 2px 12px rgba(0, 0, 0, 0.4),
                0 0 40px rgba(236, 72, 153, 0.7),
                0 0 60px rgba(168, 85, 247, 0.5),
                0 0 80px rgba(192, 132, 252, 0.3);
        }
    }

    /* Preset notification dot */
    .oracle-orb.has-preset::after {
        content: "";
        position: absolute;
        top: -2px;
        right: -2px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: radial-gradient(circle at 30% 30%,
            #fdf4ff 0%,
            #f0abfc 25%,
            #e879f9 50%,
            #c026d3 100%
        );
        border: 2px solid var(--sidebar-bg);
        box-shadow:
            0 0 8px rgba(236, 72, 153, 1),
            0 0 16px rgba(192, 132, 252, 0.8);
        animation: dot-pulse 1s ease-in-out infinite;
        z-index: 10;
    }

    @keyframes dot-pulse {
        0%, 100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.2);
        }
    }

    /* Sparkle effect when active */
    .oracle-orb.active::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background-image:
            radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.9) 0%, transparent 3%),
            radial-gradient(circle at 75% 35%, rgba(255, 255, 255, 0.7) 0%, transparent 2%),
            radial-gradient(circle at 60% 70%, rgba(255, 255, 255, 0.6) 0%, transparent 2%);
        animation: sparkle 1.5s ease-in-out infinite;
        pointer-events: none;
        z-index: 3;
    }

    @keyframes sparkle {
        0%, 100% { opacity: 0.2; }
        25% { opacity: 0.7; }
        50% { opacity: 0.3; }
        75% { opacity: 0.8; }
    }
</style>
