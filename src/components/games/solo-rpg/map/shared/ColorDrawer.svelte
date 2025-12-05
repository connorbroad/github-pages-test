<script lang="ts">
    /**
     * ColorDrawer.svelte
     *
     * A dropdown drawer for selecting colors from the palette.
     * Used by FloatingPaintOptions and FloatingSelectionPanel.
     */
    import { createEventDispatcher } from "svelte";
    import { COLOR_PALETTE, CLEAR_COLOR } from "./color-palette";

    export let selectedColor: string;
    export let showClearOption: boolean = false;

    const dispatch = createEventDispatcher<{
        select: string;
    }>();

    function selectColor(c: string) {
        dispatch("select", c);
    }
</script>

<div class="color-drawer">
    {#if showClearOption}
        <button
            class="color-swatch-btn"
            class:active={selectedColor === CLEAR_COLOR}
            on:click={() => selectColor(CLEAR_COLOR)}
            aria-label="Clear tint">
            <div class="color-swatch clear-pattern"></div>
        </button>
    {/if}
    {#each COLOR_PALETTE as c}
        <button
            class="color-swatch-btn"
            class:active={selectedColor === c}
            on:click={() => selectColor(c)}
            aria-label={c}>
            <div class="color-swatch" style="background: {c}"></div>
        </button>
    {/each}
</div>

<style>
    .color-drawer {
        position: absolute;
        z-index: 50;
        background: var(--bg-elevated);
        border: 1px solid var(--border-primary);
        border-radius: 8px;
        padding: 0.375rem;
        box-shadow: var(--shadow-lg);
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.25rem;
        max-height: 200px;
        overflow-y: auto;
    }

    /* Mobile: drawer expands upward */
    @media (max-width: 767px) {
        .color-drawer {
            bottom: 100%;
            left: 0;
            margin-bottom: 0.25rem;
        }
    }

    /* Desktop: drawer expands downward */
    @media (min-width: 768px) {
        .color-drawer {
            top: 100%;
            left: 0;
            margin-top: 0.25rem;
        }
    }

    .color-swatch-btn {
        padding: 0.25rem;
        background: transparent;
        border: 2px solid transparent;
        border-radius: 4px;
        cursor: pointer;
        transition: border-color 0.15s ease;
    }

    .color-swatch-btn:hover {
        border-color: var(--border-secondary);
    }

    .color-swatch-btn.active {
        border-color: var(--accent-primary);
    }

    .color-swatch {
        width: 20px;
        height: 20px;
        border-radius: 4px;
        border: 1px solid var(--border-primary);
    }

    .clear-pattern {
        background: repeating-conic-gradient(var(--bg-tertiary) 0% 25%, var(--bg-secondary) 0% 50%)
            50% / 10px 10px;
    }
</style>
