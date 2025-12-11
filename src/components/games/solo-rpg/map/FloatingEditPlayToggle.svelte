<script lang="ts">
    /**
     * FloatingEditPlayToggle.svelte
     *
     * Edit/Play toggle floating panel. Positioned top-center, below map header.
     * Allows switching between map editing and combat/play mode.
     */
    import { fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";

    export let mapMode: "edit" | "play" = "edit";
    export let onModeChange: (mode: "edit" | "play") => void;

    function setMode(mode: "edit" | "play") {
        if (mapMode !== mode) {
            onModeChange(mode);
        }
    }
</script>

<div class="floating-edit-play-toggle" transition:fly={{ duration: 300, easing: quintOut, y: -20 }}>
    <div class="toggle-group">
        <button
            class="toggle-btn"
            class:active={mapMode === "edit"}
            on:click={() => setMode("edit")}
            aria-label="Edit Mode"
            aria-pressed={mapMode === "edit"}>
            <svg
                class="toggle-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
            <span class="toggle-label">Edit</span>
        </button>
        <button
            class="toggle-btn"
            class:active={mapMode === "play"}
            on:click={() => setMode("play")}
            aria-label="Play Mode"
            aria-pressed={mapMode === "play"}>
            <svg
                class="toggle-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2">
                <!-- Compass icon - represents exploration, adventure, discovery -->
                <circle cx="12" cy="12" r="10" />
                <polygon
                    points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
                    fill="currentColor"
                    stroke="none" />
            </svg>
            <span class="toggle-label">Play</span>
        </button>
    </div>
</div>

<style>
    .floating-edit-play-toggle {
        position: fixed;
        top: 3.5rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 45;
        background: var(--bg-elevated);
        border: 1px solid var(--border-primary);
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        padding: 0.25rem;
    }

    /* Mobile: account for safe area */
    @media (max-width: 767px) {
        .floating-edit-play-toggle {
            top: calc(3.5rem + env(safe-area-inset-top));
        }
    }

    /* Desktop: offset center to account for primary sidebar (80px / 2 = 40px) */
    @media (min-width: 768px) {
        .floating-edit-play-toggle {
            left: calc(50% + 40px);
        }
    }

    .toggle-group {
        display: flex;
        flex-direction: row;
        gap: 0.125rem;
    }

    .toggle-btn {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.5rem 0.875rem;
        border: none;
        background: transparent;
        color: var(--text-secondary);
        font-size: 0.875rem;
        font-weight: 500;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .toggle-btn:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .toggle-btn.active {
        background: var(--accent-primary);
        color: white;
    }

    .toggle-btn.active:hover {
        background: var(--accent-primary-hover);
    }

    .toggle-icon {
        width: 20px;
        height: 20px;
    }

    .toggle-label {
        font-size: 0.625rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.025em;
    }
</style>
