/**
 * Layout utilities for the three-sidebar system
 *
 * This module provides constants and helper functions for calculating
 * pixel offsets when working with the Primary, Secondary, and Tertiary sidebars.
 *
 * Note: For Tailwind classes, use explicit class strings in templates (not dynamic generation)
 * as Tailwind JIT requires classes to be visible at build time.
 *
 * @see CLAUDE.md#layout--sidebar-system for architecture details
 */

/**
 * Sidebar dimension constants (in pixels)
 */
export const SIDEBAR_DIMENSIONS = {
	/** Primary sidebar (Sidebar.svelte) - Main navigation */
	primary: {
		desktop: 80, // w-20
		mobile: 70,
	},
	/** Secondary sidebar (SecondarySidebar.svelte) - Contextual controls */
	secondary: {
		desktop: 90, // w-[90px]
		mobile: 60,
	},
	/** Tertiary sidebar (TertiarySidebar.svelte) - Deep context controls */
	tertiary: {
		desktop: 80, // w-20
		mobile: 60,
	},
} as const;

/**
 * Options for calculating content area spacing
 */
export interface LayoutOptions {
	/** Whether the Secondary sidebar is visible */
	hasSecondarySidebar?: boolean;
	/** Whether the Tertiary sidebar is visible */
	hasTertiarySidebar?: boolean;
}

/**
 * Get total desktop left offset in pixels
 * Useful for positioning fixed/absolute elements
 *
 * @param options - Configuration for which sidebars are active
 * @returns Total width in pixels
 */
export function getDesktopLeftOffset(options: LayoutOptions = {}): number {
	const { hasSecondarySidebar = false, hasTertiarySidebar = false } = options;

	let offset = SIDEBAR_DIMENSIONS.primary.desktop;
	if (hasSecondarySidebar) {
		offset += SIDEBAR_DIMENSIONS.secondary.desktop;
	}
	if (hasTertiarySidebar) {
		offset += SIDEBAR_DIMENSIONS.tertiary.desktop;
	}

	return offset;
}

/**
 * Get total mobile bottom offset in pixels
 * Useful for positioning fixed/absolute elements
 *
 * @param options - Configuration for which sidebars are active
 * @returns Total height in pixels (excludes safe-area-inset)
 */
export function getMobileBottomOffset(options: LayoutOptions = {}): number {
	const { hasSecondarySidebar = false, hasTertiarySidebar = false } = options;

	let offset = SIDEBAR_DIMENSIONS.primary.mobile;
	if (hasSecondarySidebar) {
		offset += SIDEBAR_DIMENSIONS.secondary.mobile;
	}
	if (hasTertiarySidebar) {
		offset += SIDEBAR_DIMENSIONS.tertiary.mobile;
	}

	return offset;
}

