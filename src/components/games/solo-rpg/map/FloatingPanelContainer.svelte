<script lang="ts">
    /**
     * FloatingPanelContainer.svelte
     *
     * Layout manager that positions all floating panels using flexbox with wrap.
     * - Mobile (< 768px): Bottom-left, above sidebars, grows rightward
     * - Desktop (≥ 768px): Top-left, after sidebars, grows rightward
     */

    export let show: boolean = true;
</script>

{#if show}
    <div class="floating-panel-container">
        <slot />
    </div>
{/if}

<style>
    .floating-panel-container {
        position: fixed;
        z-index: 35;
        display: flex;
        flex-wrap: wrap-reverse; /* Overflow wraps upward */
        align-content: flex-start;
        gap: 0.5rem;
        pointer-events: none; /* Allow clicks to pass through container */
        margin-top: 60px;
    }

    .floating-panel-container > :global(*) {
        pointer-events: auto; /* Re-enable clicks on panels */
    }

    /* Mobile: bottom-left, above sidebars */
    @media (max-width: 767px) {
        .floating-panel-container {
            /* Above primary (70px) + secondary (60px) sidebars + margin */
            bottom: calc(140px + env(safe-area-inset-bottom));
            left: 0.5rem;
            right: 0.5rem;
            flex-direction: row;
            flex-wrap: wrap-reverse;
            align-content: flex-end;
        }
    }

    /* Desktop: top-left, after sidebars, grows downward then wraps to new column */
    @media (min-width: 768px) {
        .floating-panel-container {
            top: 0.5rem;
            bottom: 0.5rem;
            /* After primary (80px) + secondary (90px) sidebars + margin */
            left: calc(170px + 0.5rem);
            flex-direction: column;
            flex-wrap: wrap;
            align-content: flex-start;
        }
    }
</style>
