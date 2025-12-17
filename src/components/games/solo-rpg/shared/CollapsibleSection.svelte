<script lang="ts">
    import { slide } from "svelte/transition";

    export let title: string;
    export let isOpen: boolean = false;
    export let badgeCount: number | null = null;
    export let onToggle: () => void;
</script>

<div class="collapsible-section">
    <button on:click={onToggle} class="collapsible-header" type="button">
        <!-- Chevron icon -->
        <svg
            class="chevron"
            class:open={isOpen}
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true">
            <polyline points="9 18 15 12 9 6"></polyline>
        </svg>

        <span class="title">{title}</span>

        {#if badgeCount !== null}
            <span class="badge">{badgeCount}</span>
        {/if}
    </button>

    {#if isOpen}
        <div transition:slide={{ duration: 200 }}>
            <slot />
        </div>
    {/if}
</div>

<style>
    .collapsible-section {
        display: flex;
        flex-direction: column;
        border-bottom: 1px solid var(--border-primary);
    }

    .collapsible-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        padding: 0.75rem 1rem;
        background: transparent;
        border: none;
        cursor: pointer;
        transition: background-color 0.15s ease;
        min-height: 48px; /* Mobile-optimized touch target */
    }

    .collapsible-header:hover {
        background: var(--bg-tertiary);
    }

    .collapsible-header:active {
        background: var(--bg-quaternary, var(--bg-tertiary));
    }

    .chevron {
        flex-shrink: 0;
        color: var(--text-secondary);
        transform: rotate(0deg);
        transition: transform 0.15s ease;
    }

    .chevron.open {
        transform: rotate(90deg);
    }

    .title {
        flex: 1;
        text-align: left;
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .badge {
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 24px;
        height: 24px;
        padding: 0 0.5rem;
        background: var(--bg-tertiary);
        color: var(--text-secondary);
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
    }
</style>
