<script lang="ts">
    import { theme } from "./theme-store";

    function handleToggle() {
        theme.toggleTheme();
    }
</script>

<div class="w-full">
    <div
        class="bg-card-bg text-text-primary border-card-border mx-auto w-full max-w-[500px] rounded-lg border p-0 shadow-md">
        <div class="border-border-primary flex items-center justify-between border-b p-6">
            <h2 class="text-text-primary m-0 text-2xl">Theme</h2>
        </div>

        <div class="p-6">
            <div class="flex flex-wrap gap-2">
                <button
                    class="border-border-primary bg-card-bg text-text-secondary hover:border-accent-primary hover:bg-bg-secondary focus-visible:outline-accent-primary flex min-w-[120px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 px-5 py-3 text-base font-medium transition-all duration-200 hover:-translate-y-px hover:shadow-md focus:shadow-[0_0_0_3px_var(--shadow-sm)] focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 max-md:min-h-11 max-md:text-base {$theme ===
                    'light'
                        ? 'border-accent-primary bg-accent-primary hover:bg-accent-primary-hover hover:border-accent-primary-hover text-text-on-accent shadow-md'
                        : ''}"
                    class:active={$theme === "light"}
                    on:click={() => theme.setTheme("light")}
                    aria-label="Switch to light theme"
                    aria-pressed={$theme === "light"}>
                    <svg
                        class="shrink-0"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="1.5em"
                        height="1.5em"
                        fill="currentColor">
                        <path
                            d="M12 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12M11 1h2v3h-2zm0 19h2v3h-2zM3.515 4.929l1.414-1.414L7.05 5.636 5.636 7.05zM16.95 18.364l1.414-1.414 2.121 2.121-1.414 1.414zm2.121-14.85 1.414 1.415-2.121 2.121-1.414-1.414zM5.636 16.95l1.414 1.414-2.121 2.121-1.414-1.414zM23 11v2h-3v-2zM4 11v2H1v-2z" />
                    </svg>
                    <span>Light</span>
                </button>
                <button
                    class="border-border-primary bg-card-bg text-text-secondary hover:border-accent-primary hover:bg-bg-secondary focus-visible:outline-accent-primary flex min-w-[120px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 px-5 py-3 text-base font-medium transition-all duration-200 hover:-translate-y-px hover:shadow-md focus:shadow-[0_0_0_3px_var(--shadow-sm)] focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 max-md:min-h-11 max-md:text-base {$theme ===
                    'dark'
                        ? 'border-accent-primary bg-accent-primary hover:bg-accent-primary-hover hover:border-accent-primary-hover text-text-on-accent shadow-md'
                        : ''}"
                    class:active={$theme === "dark"}
                    on:click={() => theme.setTheme("dark")}
                    aria-label="Switch to dark theme"
                    aria-pressed={$theme === "dark"}>
                    <svg
                        class="shrink-0"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="1.5em"
                        height="1.5em"
                        fill="currentColor">
                        <path
                            d="M10 7a7 7 0 0 0 12 4.9v.1c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2h.1A6.979 6.979 0 0 0 10 7" />
                    </svg>
                    <span>Dark</span>
                </button>
            </div>
        </div>
    </div>
</div>
