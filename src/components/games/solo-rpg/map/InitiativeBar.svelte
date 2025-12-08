<script lang="ts">
    /**
     * Initiative Bar Component
     * Bottom bar showing encounter controls and turn order
     * Displayed when in Combat Mode
     */
    import { createEventDispatcher, onMount, tick } from "svelte";
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
        rerollInitiative: void;
        nextTurn: void;
        prevTurn: void;
        selectCreature: { objectId: string; index: number };
    }>();

    // Confirmation modal states
    let showEndConfirm = false;
    let showRerollConfirm = false;

    // Reference to scroll container for auto-scroll
    let scrollContainer: HTMLDivElement;

    // Detect mobile
    let isMobile = false;
    if (typeof window !== "undefined") {
        isMobile = window.innerWidth < 768;
        window.addEventListener("resize", () => {
            isMobile = window.innerWidth < 768;
        });
    }

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

    function handleReroll() {
        showRerollConfirm = true;
    }

    function confirmReroll() {
        dispatch("rerollInitiative");
        showRerollConfirm = false;
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

    function getHPColor(current: number, max: number): string {
        const ratio = current / max;
        if (ratio > 0.5) return "var(--accent-success)";
        if (ratio > 0.25) return "var(--accent-warning)";
        return "var(--accent-danger)";
    }
</script>

<div
    class="initiative-bar"
    transition:fly={{ y: isMobile ? 48 : 44, duration: 300, delay: 50, easing: quintOut }}>
    {#if !hasActiveEncounter}
        <!-- No active encounter - show begin button -->
        <div class="bar-content bar-content-centered">
            <button class="srpg-b srpg-b-normal" on:click={handleBeginEncounter}>
                <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="shrink-0"
                    aria-hidden="true">
                    <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
                    <path d="M13 19l6-6" />
                    <path d="M16 16l4 4" />
                    <path d="M19 21a2 2 0 0 0 2-2" />
                </svg>
                Begin Encounter
            </button>
        </div>
    {:else}
        <!-- Active encounter - show initiative tracker -->
        <div class="bar-content">
            <!-- Left: End/Reroll buttons -->
            <div class="bar-controls bar-controls-left">
                <button
                    class="srpg-b srpg-b-danger srpg-b-sm"
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
                        class="shrink-0"
                        aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    </svg>
                    <span class="button-label">End</span>
                </button>
                <button
                    class="srpg-b srpg-b-simple srpg-b-sm"
                    on:click={handleReroll}
                    title="Re-roll Initiative">
                    <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="shrink-0"
                        aria-hidden="true">
                        <path d="M21 2v6h-6" />
                        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                        <path d="M3 22v-6h6" />
                        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                    </svg>
                    <span class="button-label">Roll</span>
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
                    class="srpg-b srpg-b-normal next-turn-btn"
                    on:click={handleNextTurn}
                    title="Next Turn">
                    <span class="button-label">Next</span>
                    <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="shrink-0"
                        aria-hidden="true">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </button>
            </div>
        </div>
    {/if}
</div>

<!-- Confirmation Modals -->
<ConfirmModal
    bind:show={showEndConfirm}
    title="End Encounter"
    message="End this encounter? All initiative order will be cleared."
    confirmText="End Encounter"
    cancelText="Cancel"
    danger={true}
    on:confirm={confirmEndEncounter}
    on:cancel={() => (showEndConfirm = false)} />

<ConfirmModal
    bind:show={showRerollConfirm}
    title="Re-roll Initiative"
    message="Re-roll initiative? This will randomize the turn order."
    confirmText="Re-roll"
    cancelText="Cancel"
    on:confirm={confirmReroll}
    on:cancel={() => (showRerollConfirm = false)} />

<style>
    .initiative-bar {
        position: fixed;
        /* Mobile: Above primary sidebar only (70px) - secondary sidebar is hidden in play mode */
        bottom: calc(70px + env(safe-area-inset-bottom));
        left: 0;
        right: 0;
        height: var(--initiative-bar-height, 48px);
        background: var(--bg-secondary);
        border-top: 1px solid var(--border-primary);
        z-index: 35; /* Below SecondarySidebar (z-40) */
        display: flex;
        align-items: center;
    }

    /* Desktop: account for primary sidebar on left only (80px), sit at bottom */
    @media (min-width: 769px) {
        .initiative-bar {
            left: 80px; /* Primary sidebar width only */
            bottom: 0; /* Desktop sidebars are on left, not bottom */
            height: var(--initiative-bar-height, 44px);
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
        gap: 0.25rem;
        flex-shrink: 0;
    }

    .bar-controls-left {
        padding-left: 0.25rem;
    }

    .bar-controls-right {
        padding-right: 0.25rem;
    }

    /* Hide button labels on mobile */
    @media (max-width: 768px) {
        .button-label {
            display: none;
        }

        .bar-controls .srpg-b {
            padding: 0.5rem;
        }
    }

    /* Show button labels on desktop */
    @media (min-width: 769px) {
        .button-label {
            display: inline;
        }
    }

    /* Initiative scroll wrapper */
    .initiative-scroll-wrapper {
        display: flex;
        align-items: center;
        flex: 1;
        min-width: 0;
        gap: 0.25rem;
    }

    .initiative-scroll {
        display: flex;
        gap: 0.375rem;
        overflow-x: auto;
        overflow-y: hidden;
        flex: 1;
        min-width: 0;
        padding: 0.25rem 0;
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;

        /* Hide scrollbar but allow scroll */
        scrollbar-width: none;
        -ms-overflow-style: none;
    }

    .initiative-scroll::-webkit-scrollbar {
        display: none;
    }

    .initiative-item {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.375rem;
        background: var(--card-bg);
        border: 1px solid var(--border-primary);
        border-radius: 6px;
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
        transition: all 0.15s ease;
        font-size: 0.8125rem;
    }

    .initiative-item:hover {
        background: var(--bg-tertiary);
        border-color: var(--border-secondary);
    }

    .initiative-item.active {
        background: var(--accent-primary);
        border-color: var(--accent-primary);
        color: white;
    }

    .initiative-item.active .init-roll {
        background: rgba(255, 255, 255, 0.2);
        color: white;
    }
    .initiative-item.pending-next {
        border-color: var(--accent-info);
        box-shadow: 0 0 0 1px var(--accent-info);
    }

    .init-roll {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 1.5rem;
        padding: 0.125rem 0.375rem;
        background: var(--bg-tertiary);
        border-radius: 4px;
        font-weight: 600;
        font-size: 0.75rem;
        color: var(--text-secondary);
    }

    .init-name {
        font-weight: 500;
        color: var(--text-primary);
        max-width: 100px;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .initiative-item.active .init-name {
        color: white;
    }

    .next-indicator {
        font-size: 0.625rem;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--accent-info);
        background: color-mix(in srgb, var(--accent-info) 15%, transparent);
        padding: 0.0625rem 0.25rem;
        border-radius: 3px;
    }

    .initiative-item.active .next-indicator {
        color: white;
        background: rgba(255, 255, 255, 0.2);
    }

    /* Next Turn button - larger touch target */
    .next-turn-btn {
        padding: 0.5rem 0.75rem;
        font-weight: 600;
    }

    @media (min-width: 769px) {
        .next-turn-btn {
            padding: 0.5rem 1rem;
        }
    }
</style>
