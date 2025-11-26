/**
 * Utility functions for the Chronicle component.
 * Extracted to enable unit testing of date separator logic.
 */

export interface ChronicleEntryBase {
    id: string;
    timestamp: number;
}

/**
 * Gets a date key string for grouping entries by day.
 * Format: "YYYY-M-D" (month and day are not zero-padded)
 */
export function getDateKey(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * Determines whether a date separator should be shown for an entry.
 *
 * The Chronicle displays entries in reverse chronological order (newest at bottom,
 * oldest at top) using `flex-direction: column-reverse`. The visual layout is:
 *
 *   [TOP OF SCROLL AREA]
 *   Date Separator: Nov 25
 *   Entry (oldest on Nov 25)
 *   Entry
 *   Date Separator: Nov 26
 *   Entry (oldest on Nov 26)
 *   Entry
 *   Date Separator: Nov 27
 *   Entry (oldest on Nov 27)
 *   Entry
 *   Entry (newest on Nov 27)
 *   [BOTTOM OF SCROLL AREA]
 *
 * Rules:
 * - Show a separator above the OLDEST entry for each unique date
 * - The oldest entry overall always gets a separator
 * - When the date changes between the current entry and the next older entry,
 *   show a separator for the current entry (it's the oldest for its date)
 *
 * @param entriesNewestFirst - Entries in reverse chronological order (newest first)
 * @param index - Current index in the reversed array
 * @returns true if a date separator should be shown for this entry
 */
export function shouldShowDateSeparator<T extends ChronicleEntryBase>(
    entriesNewestFirst: T[],
    index: number
): boolean {
    if (entriesNewestFirst.length === 0) return false;

    const entry = entriesNewestFirst[index];
    const nextEntry = index < entriesNewestFirst.length - 1 ? entriesNewestFirst[index + 1] : null;

    const currentDateKey = getDateKey(entry.timestamp);
    const nextDateKey = nextEntry ? getDateKey(nextEntry.timestamp) : null;

    const isLastEntry = index === entriesNewestFirst.length - 1;

    // Show separator if:
    // 1. This is the oldest entry - always needs a separator at top
    // 2. The next older entry has a different date - this entry is the oldest for its date
    return isLastEntry || (nextDateKey !== null && currentDateKey !== nextDateKey);
}

/**
 * Computes date separator visibility for all entries.
 * Useful for testing the complete separator pattern.
 *
 * @param entriesOldestFirst - Entries in chronological order (oldest first)
 * @returns Array of booleans indicating separator visibility for each entry in reversed (display) order
 */
export function computeDateSeparators<T extends ChronicleEntryBase>(
    entriesOldestFirst: T[]
): { entry: T; showSeparator: boolean }[] {
    const reversed = [...entriesOldestFirst].reverse();
    return reversed.map((entry, index) => ({
        entry,
        showSeparator: shouldShowDateSeparator(reversed, index),
    }));
}
