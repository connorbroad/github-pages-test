/**
 * Shared color palette for map painting tools.
 */
export const COLOR_PALETTE = [
    "#f5eee4",
    "#000000",
    "#4e3d3b",
    "#544d54",
    "#786c64",
    "#a09a92",
    "#64d5df",
    "#478fca",
    "#2f588d",
    "#252f40",
    "#63250e",
    "#9e3227",
    "#d87945",
    "#f4dc6d",
    "#89aa55",
    "#4e8357",
    "#386956",
    "#2b4a3c",
    "#e99b7c",
    "#825341",
    "#632a7b",
    "#c247b8",
] as const;

export const CLEAR_COLOR = "clear";

export type PaletteColor = (typeof COLOR_PALETTE)[number];
