<script lang="ts">
    import { theme } from "./theme-store";

    function handleToggle() {
        theme.toggleTheme();
    }
</script>

<div class="theme-toggle-container">
    <div class="info-card content">
        <div class="header">
            <h2>Theme</h2>
        </div>

        <div class="body">
            <div class="theme-toggle-buttons">
                <button
                    class="theme-option"
                    class:active={$theme === "light"}
                    on:click={() => theme.setTheme("light")}
                    aria-label="Switch to light theme"
                    aria-pressed={$theme === "light"}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="1.5em"
                        height="1.5em"
                        fill="currentColor"
                    >
                        <path
                            d="M12 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12M11 1h2v3h-2zm0 19h2v3h-2zM3.515 4.929l1.414-1.414L7.05 5.636 5.636 7.05zM16.95 18.364l1.414-1.414 2.121 2.121-1.414 1.414zm2.121-14.85 1.414 1.415-2.121 2.121-1.414-1.414zM5.636 16.95l1.414 1.414-2.121 2.121-1.414-1.414zM23 11v2h-3v-2zM4 11v2H1v-2z"
                        />
                    </svg>
                    <span>Light</span>
                </button>
                <button
                    class="theme-option"
                    class:active={$theme === "dark"}
                    on:click={() => theme.setTheme("dark")}
                    aria-label="Switch to dark theme"
                    aria-pressed={$theme === "dark"}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="1.5em"
                        height="1.5em"
                        fill="currentColor"
                    >
                        <path
                            d="M10 7a7 7 0 0 0 12 4.9v.1c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2h.1A6.979 6.979 0 0 0 10 7"
                        />
                    </svg>
                    <span>Dark</span>
                </button>
            </div>
        </div>
    </div>
</div>

<style> 
    .content {
        padding: 0;
        max-width: 500px;
        width: 100%;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid var(--border-primary);
    }

    .header h2 {
        margin: 0;
        font-size: 1.5rem;
        color: var(--text-primary);
    }

    .body {
        padding: 1.5rem;
    }

    .theme-toggle-container {
        width: 100%;
    }

    .theme-toggle-buttons {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .theme-option {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.25rem;
        border: 2px solid var(--border-primary);
        background: var(--card-bg);
        color: var(--text-secondary);
        border-radius: 8px;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 500;
        transition: all 0.2s ease;
        flex: 1;
        min-width: 120px;
        justify-content: center;
    }

    .theme-option:hover {
        border-color: var(--accent-primary);
        background: var(--bg-secondary);
        transform: translateY(-1px);
        box-shadow: 0 2px 4px var(--shadow-md);
    }

    .theme-option.active {
        border-color: var(--accent-primary);
        background: var(--accent-primary);
        color: white;
        box-shadow: 0 2px 6px var(--shadow-md);
    }

    .theme-option.active:hover {
        background: var(--accent-primary-hover);
        border-color: var(--accent-primary-hover);
    }

    .theme-option svg {
        flex-shrink: 0;
    }

    /* Mobile optimizations */
    @media (max-width: 768px) {
        .theme-option {
            min-height: 44px; /* iOS minimum touch target */
            font-size: 1rem;
        }
    }

    /* Accessibility - keyboard focus */
    .theme-option:focus {
        outline: none;
        box-shadow: 0 0 0 3px var(--shadow-sm);
    }

    .theme-option:focus-visible {
        outline: 2px solid var(--accent-primary);
        outline-offset: 2px;
    }
</style>
