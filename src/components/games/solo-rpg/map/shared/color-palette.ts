/**
 * Shared color palette for map painting tools.
 */
export const COLOR_PALETTE = {
    BlackWhite: ["#f5eee4", "#000000"],
    Muted: ["#4e3d3b", "#544d54", "#786c64", "#a09a92"],
    Blues: ["#64d5df", "#478fca", "#2f588d", "#252f40"],
    Reds: ["#f4dc6d", "#d87945", "#9e3227", "#63250e"],
    Greens: ["#89aa55", "#4e8357", "#386956", "#2b4a3c"],
    Tans: ["#e99b7c", "#825341"],
    Purples: ["#632a7b", "#c247b8"],
} as const;

export const CLEAR_COLOR = "clear";

export type PaletteColor = (typeof COLOR_PALETTE)[keyof typeof COLOR_PALETTE][number];
