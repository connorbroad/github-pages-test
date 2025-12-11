import { readable } from "svelte/store";

/**
 * Reactive store that tracks if the viewport is mobile-sized (< 768px).
 * Matches the CSS breakpoint where desktop styles (min-width: 768px) begin.
 */
export const isMobile = readable(false, (set) => {
    if (typeof window === "undefined") {
        return;
    }

    const check = () => set(window.innerWidth < 768);
    check();

    window.addEventListener("resize", check);

    return () => {
        window.removeEventListener("resize", check);
    };
});
