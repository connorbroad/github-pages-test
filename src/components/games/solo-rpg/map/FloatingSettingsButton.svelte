<script lang="ts">
    /**
     * FloatingSettingsButton.svelte
     *
     * Settings button floating in the top-right corner of the map view.
     * Visible in both edit and play modes.
     */
    import { fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";

    interface Props {
        onOpenSettings: () => void;
    }

    let { onOpenSettings }: Props = $props();
</script>

<div class="floating-settings-btn" transition:fly={{ duration: 300, easing: quintOut, y: -20 }}>
    <button
        class="settings-btn"
        on:click={onOpenSettings}
        aria-label="Map Settings">
        <svg
            class="settings-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2">
            <!-- Gear/Cog icon -->
            <circle cx="12" cy="12" r="3" />
            <path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    </button>
</div>

<style>
    .floating-settings-btn {
        position: fixed;
        top: 3.5rem;
        right: 1rem;
        z-index: 45;
        background: var(--bg-elevated);
        border: 1px solid var(--border-primary);
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        padding: 0.25rem;
    }

    /* Mobile: account for safe area */
    @media (max-width: 767px) {
        .floating-settings-btn {
            top: calc(3.5rem + env(safe-area-inset-top));
        }
    }

    .settings-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem;
        border: none;
        background: transparent;
        color: var(--text-secondary);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .settings-btn:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .settings-icon {
        width: 20px;
        height: 20px;
    }
</style>
