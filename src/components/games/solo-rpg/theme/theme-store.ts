import { writable } from "svelte/store";

/**
 * Theme type - either 'light' or 'dark'
 */
export type Theme = "light" | "dark";

/**
 * Local storage key for theme preference
 */
const THEME_STORAGE_KEY = "solo-rpg-theme";

/**
 * Default theme value
 */
const DEFAULT_THEME: Theme = "dark";

/**
 * Check if we're in a browser environment
 */
const isBrowser = typeof window !== "undefined";

/**
 * Creates the theme store with localStorage persistence
 */
function createThemeStore() {
    // Initialize from localStorage if available, otherwise use default
    const initialTheme = isBrowser
        ? (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || DEFAULT_THEME
        : DEFAULT_THEME;

    const { subscribe, set, update } = writable<Theme>(initialTheme);

    return {
        subscribe,
        /**
         * Set the theme to a specific value
         * @param newTheme - The theme to set ('light' or 'dark')
         */
        setTheme: (newTheme: Theme) => {
            if (newTheme !== "light" && newTheme !== "dark") {
                console.warn(`Invalid theme value: ${newTheme}. Using default.`);
                newTheme = DEFAULT_THEME;
            }

            set(newTheme);

            if (isBrowser) {
                localStorage.setItem(THEME_STORAGE_KEY, newTheme);
                // Apply theme to document root for CSS variables
                document.documentElement.setAttribute("data-theme", newTheme);
            }
        },
        /**
         * Toggle between light and dark themes
         */
        toggleTheme: () => {
            update((currentTheme) => {
                const newTheme: Theme = currentTheme === "light" ? "dark" : "light";

                if (isBrowser) {
                    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
                    document.documentElement.setAttribute("data-theme", newTheme);
                }

                return newTheme;
            });
        },
        /**
         * Initialize theme - sets the data-theme attribute on document root
         * Call this on app mount to prevent flash of wrong theme
         */
        initialize: () => {
            if (isBrowser) {
                const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
                const themeToUse =
                    savedTheme === "light" || savedTheme === "dark" ? savedTheme : DEFAULT_THEME;

                document.documentElement.setAttribute("data-theme", themeToUse);
                set(themeToUse);
            }
        },
    };
}

/**
 * Theme store - reactive store for current theme
 * Subscribe to this in components to react to theme changes
 */
export const theme = createThemeStore();
