<script lang="ts">
    /**
     * Initiative Bar Component
     * Bottom bar showing encounter controls and turn order
     * Displayed when in Combat Mode
     */
    import { createEventDispatcher, tick } from "svelte";
    import { fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import type { InitiativeEntry } from "../data/storage-utils";
    import ConfirmModal from "../shared/modal/ConfirmModal.svelte";

    export let hasActiveEncounter = false;
    export let initiativeOrder: InitiativeEntry[] = [];
    export let currentTurnIndex = 0;
    export let pendingNextObjectId: string | undefined = undefined;

    const dispatch = createEventDispatcher<{
        openEncounterSetup: void;
        endEncounter: void;
        nextTurn: void;
        prevTurn: void;
        selectCreature: { objectId: string; index: number };
    }>();

    // Confirmation modal state
    let showEndConfirm = false;

    // Reference to scroll container for auto-scroll
    let scrollContainer: HTMLDivElement;

    // Detect mobile
    import { isMobile } from "../ui-utils";

    // Auto-scroll to active creature when turn changes
    $: if (scrollContainer && initiativeOrder.length > 0) {
        scrollToActive();
    }

    async function scrollToActive() {
        await tick();
        if (!scrollContainer) return;
        const activeEl = scrollContainer.querySelector('[data-active="true"]');
        if (activeEl) {
            activeEl.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "center",
            });
        }
    }

    function handleBeginEncounter() {
        dispatch("openEncounterSetup");
    }

    function handleEndEncounter() {
        showEndConfirm = true;
    }

    function confirmEndEncounter() {
        dispatch("endEncounter");
        showEndConfirm = false;
    }

    function handleNextTurn() {
        dispatch("nextTurn");
    }

    function handlePrevTurn() {
        dispatch("prevTurn");
    }

    function handleSelectCreature(objectId: string, index: number) {
        dispatch("selectCreature", { objectId, index });
    }
</script>

<div
    class="initiative-bar"
    transition:fly={{ y: $isMobile ? 48 : 32, duration: 300, delay: 50, easing: quintOut }}>
    {#if !hasActiveEncounter}
        <!-- No active encounter - show begin button -->
        <div class="bar-content bar-content-centered">
            <button class="control-btn control-btn-primary" on:click={handleBeginEncounter}>
                <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="btn-icon"
                    aria-hidden="true">
                    <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
                    <path d="M13 19l6-6" />
                    <path d="M16 16l4 4" />
                    <path d="M19 21a2 2 0 0 0 2-2" />
                </svg>
                <span class="btn-label">Begin Encounter</span>
            </button>
        </div>
    {:else}
        <!-- Active encounter - show initiative tracker -->
        <div class="bar-content">
            <!-- Left: End button -->
            <div class="bar-controls bar-controls-left">
                <button
                    class="control-btn control-btn-danger"
                    on:click={handleEndEncounter}
                    title="End Encounter">
                    <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="btn-icon"
                        aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    </svg>
                    <span class="btn-label">End</span>
                </button>
            </div>

            <!-- Center: Initiative order with scroll -->
            <div class="initiative-scroll-wrapper">
                <div class="initiative-scroll" bind:this={scrollContainer}>
                    {#each initiativeOrder as entry, index (entry.objectId)}
                        <button
                            class="initiative-item"
                            class:active={index === currentTurnIndex}
                            class:pending-next={entry.objectId === pendingNextObjectId}
                            data-active={index === currentTurnIndex}
                            on:click={() => handleSelectCreature(entry.objectId, index)}
                            title="{entry.name} - {entry.currentHP}/{entry.maxHP} HP">
                            <span class="init-roll">{entry.initiative}</span>
                            <span class="init-name">{entry.name}</span>
                            {#if entry.objectId === pendingNextObjectId}
                                <span class="next-indicator">next</span>
                            {/if}
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Right: Next Turn button -->
            <div class="bar-controls bar-controls-right">
                <button
                    class="control-btn control-btn-primary"
                    on:click={handleNextTurn}
                    title="Next Turn">
                    <span class="btn-label">Next</span>
                    <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="btn-icon"
                        aria-hidden="true">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </button>
            </div>
        </div>
    {/if}
</div>

<!-- Confirmation Modal -->
<ConfirmModal
    bind:show={showEndConfirm}
    title="End Encounter"
    message="End this encounter? All initiative order will be cleared."
    confirmText="End Encounter"
    cancelText="Cancel"
    danger={true}
    on:confirm={confirmEndEncounter}
    on:cancel={() => (showEndConfirm = false)} />

<style>
    .initiative-bar {
        position: fixed;
        /* Mobile: Above primary sidebar only (70px) - secondary sidebar is hidden in play mode */
        bottom: calc(70px + env(safe-area-inset-bottom));
        left: 0;
        right: 0;
        height: var(--initiative-bar-height, 64px);
        background: linear-gradient(
            to top,
            var(--bg-secondary),
            color-mix(in srgb, var(--bg-secondary) 95%, var(--bg-tertiary))
        );
        border-top: 1px solid var(--border-primary);
        box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.15);
        z-index: 35; /* Below SecondarySidebar (z-40) */
        display: flex;
        align-items: center;
    }

    /* Desktop: Floating centered bar at bottom (similar to FloatingEditPlayToggle style) */
    @media (min-width: 769px) {
        .initiative-bar {
            /* Centered floating position, offset for sidebar (80px / 2 = 40px) */
            left: calc(50% + 40px);
            right: auto;
            transform: translateX(-50%);
            bottom: 0.75rem;
            /* Sizing */
            width: auto;
            max-width: min(680px, calc(100vw - 200px)); /* Leave room for side buttons */
            min-width: 180px;
            height: auto;
            min-height: 52px;
            /* Floating pill style */
            background: var(--bg-elevated);
            border: 1px solid var(--border-primary);
            border-radius: 12px;
            box-shadow: var(--shadow-lg);
            padding: 0.25rem;
        }
    }

    .bar-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        height: 100%;
        padding: 0;
    }

    .bar-content-centered {
        justify-content: center;
    }

    .bar-controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-shrink: 0;
    }

    .bar-controls-left {
        padding-left: 0.5rem;
    }

    .bar-controls-right {
        padding-right: 0.5rem;
    }

    /* Consistent button styling */
    .control-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.375rem;
        padding: 0.625rem 0.75rem;
        min-height: 44px;
        min-width: 44px;
        border: none;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
        white-space: nowrap;
    }

    .control-btn-primary {
        background: var(--accent-primary);
        color: white;
        box-shadow: 0 2px 6px color-mix(in srgb, var(--accent-primary) 40%, transparent);
    }

    .control-btn-primary:hover {
        background: color-mix(in srgb, var(--accent-primary) 85%, black);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px color-mix(in srgb, var(--accent-primary) 50%, transparent);
    }

    .control-btn-primary:active {
        transform: translateY(0);
    }

    .control-btn-danger {
        background: color-mix(in srgb, var(--accent-danger) 15%, var(--bg-tertiary));
        color: var(--accent-danger);
        border: 1px solid color-mix(in srgb, var(--accent-danger) 30%, transparent);
    }

    .control-btn-danger:hover {
        background: var(--accent-danger);
        color: white;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px color-mix(in srgb, var(--accent-danger) 40%, transparent);
    }

    .control-btn-danger:active {
        transform: translateY(0);
    }

    .btn-icon {
        flex-shrink: 0;
    }

    /* Mobile: icon-only buttons with larger touch targets */
    @media (max-width: 768px) {
        .btn-label {
            display: none;
        }

        .control-btn {
            padding: 0.75rem;
            min-height: 48px;
            min-width: 48px;
        }

        .bar-controls-left,
        .bar-controls-right {
            padding-left: 0.375rem;
            padding-right: 0.375rem;
        }
    }

    /* Desktop: show labels, compact styling for floating bar */
    @media (min-width: 769px) {
        .btn-label {
            display: inline;
        }

        .control-btn {
            padding: 0.375rem 0.75rem;
            min-height: 40px;
            border-radius: 8px;
        }

        .bar-controls-left,
        .bar-controls-right {
            padding-left: 0.25rem;
            padding-right: 0.25rem;
        }

        .bar-content {
            gap: 0.25rem;
        }
    }

    /* Initiative scroll wrapper */
    .initiative-scroll-wrapper {
        display: flex;
        align-items: center;
        flex: 1;
        min-width: 0;
        gap: 0.25rem;
        position: relative;
    }

    /* Fade edges to indicate scrollability */
    .initiative-scroll-wrapper::before,
    .initiative-scroll-wrapper::after {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        width: 24px;
        pointer-events: none;
        z-index: 1;
    }

    .initiative-scroll-wrapper::before {
        left: 0;
        background: linear-gradient(to right, var(--bg-secondary), transparent);
    }

    .initiative-scroll-wrapper::after {
        right: 0;
        background: linear-gradient(to left, var(--bg-secondary), transparent);
    }

    /* Desktop: fade edges match floating bar's elevated background */
    @media (min-width: 769px) {
        .initiative-scroll-wrapper::before {
            background: linear-gradient(to right, var(--bg-elevated), transparent);
        }

        .initiative-scroll-wrapper::after {
            background: linear-gradient(to left, var(--bg-elevated), transparent);
        }
    }

    .initiative-scroll {
        display: flex;
        gap: 0.5rem;
        overflow-x: auto;
        overflow-y: hidden;
        flex: 1;
        min-width: 0;
        padding: 0.5rem 0.75rem;
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;

        /* Hide scrollbar but allow scroll */
        scrollbar-width: none;
        -ms-overflow-style: none;
    }

    /* Desktop: tighter padding for compact floating bar */
    @media (min-width: 769px) {
        .initiative-scroll {
            padding: 0.25rem 0.5rem;
            gap: 0.375rem;
        }
    }

    .initiative-scroll::-webkit-scrollbar {
        display: none;
    }

    .initiative-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.625rem;
        min-height: 40px;
        background: var(--card-bg);
        border: 1px solid var(--border-primary);
        border-radius: 8px;
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
        transition: all 0.2s ease;
        font-size: 0.875rem;
    }

    @media (max-width: 768px) {
        .initiative-item {
            min-height: 44px;
            padding: 0.5rem 0.75rem;
        }
    }

    /* Desktop: compact initiative items for floating bar */
    @media (min-width: 769px) {
        .initiative-item {
            min-height: 36px;
            padding: 0.375rem 0.5rem;
            font-size: 0.8125rem;
            gap: 0.375rem;
        }
    }

    .initiative-item:hover {
        background: var(--bg-tertiary);
        border-color: var(--border-secondary);
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .initiative-item.active {
        background: linear-gradient(
            135deg,
            var(--accent-primary),
            color-mix(in srgb, var(--accent-primary) 70%, #ff6b35)
        );
        border: 2px solid rgba(255, 255, 255, 0.4);
        color: white;
        transform: scale(1.05);
        box-shadow:
            0 0 0 3px color-mix(in srgb, var(--accent-primary) 40%, transparent),
            0 4px 16px color-mix(in srgb, var(--accent-primary) 60%, transparent),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        animation: active-pulse 2s ease-in-out infinite;
        z-index: 2;
    }

    @keyframes active-pulse {
        0%,
        100% {
            box-shadow:
                0 0 0 3px color-mix(in srgb, var(--accent-primary) 40%, transparent),
                0 4px 16px color-mix(in srgb, var(--accent-primary) 60%, transparent),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        50% {
            box-shadow:
                0 0 0 5px color-mix(in srgb, var(--accent-primary) 25%, transparent),
                0 6px 24px color-mix(in srgb, var(--accent-primary) 70%, transparent),
                inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }
    }

    .initiative-item.active:hover {
        transform: scale(1.08);
        box-shadow:
            0 0 0 4px color-mix(in srgb, var(--accent-primary) 35%, transparent),
            0 6px 20px color-mix(in srgb, var(--accent-primary) 65%, transparent),
            inset 0 1px 0 rgba(255, 255, 255, 0.25);
        animation: none;
    }

    .initiative-item.active .init-roll {
        background: rgba(255, 255, 255, 0.25);
        color: white;
    }

    /* Light theme adjustments for active item */
    :global([data-theme="light"]) .initiative-item.active {
        background: linear-gradient(
            135deg,
            color-mix(in srgb, var(--accent-primary) 90%, #1a1a2e),
            color-mix(in srgb, var(--accent-primary) 75%, #c44536)
        );
        border: 2px solid rgba(255, 255, 255, 0.6);
        box-shadow:
            0 0 0 3px color-mix(in srgb, var(--accent-primary) 50%, transparent),
            0 4px 20px rgba(0, 0, 0, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.35);
    }

    @keyframes active-pulse-light {
        0%,
        100% {
            box-shadow:
                0 0 0 3px color-mix(in srgb, var(--accent-primary) 50%, transparent),
                0 4px 20px rgba(0, 0, 0, 0.25),
                inset 0 1px 0 rgba(255, 255, 255, 0.35);
        }
        50% {
            box-shadow:
                0 0 0 5px color-mix(in srgb, var(--accent-primary) 35%, transparent),
                0 6px 28px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }
    }

    :global([data-theme="light"]) .initiative-item.active {
        animation: active-pulse-light 2s ease-in-out infinite;
    }

    :global([data-theme="light"]) .initiative-item.active:hover {
        box-shadow:
            0 0 0 4px color-mix(in srgb, var(--accent-primary) 45%, transparent),
            0 6px 24px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
    }

    .initiative-item.pending-next {
        border-color: var(--accent-info);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-info) 30%, transparent);
    }

    .init-roll {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 1.75rem;
        padding: 0.25rem 0.5rem;
        background: var(--bg-tertiary);
        border-radius: 6px;
        font-weight: 700;
        font-size: 0.8125rem;
        color: var(--text-secondary);
    }

    .init-name {
        font-weight: 500;
        color: var(--text-primary);
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    @media (max-width: 768px) {
        .init-name {
            max-width: 80px;
        }
    }

    .initiative-item.active .init-name {
        color: white;
    }

    .next-indicator {
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.02em;
        color: var(--accent-info);
        background: color-mix(in srgb, var(--accent-info) 15%, transparent);
        padding: 0.125rem 0.375rem;
        border-radius: 4px;
    }

    .initiative-item.active .next-indicator {
        color: white;
        background: rgba(255, 255, 255, 0.25);
    }
</style>
