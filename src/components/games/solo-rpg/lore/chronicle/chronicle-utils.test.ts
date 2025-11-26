import { describe, it, expect } from "vitest";
import {
    getDateKey,
    shouldShowDateSeparator,
    computeDateSeparators,
    type ChronicleEntryBase,
} from "./chronicle-utils";

// Helper to create a timestamp for a specific date
function makeTimestamp(year: number, month: number, day: number, hour = 12): number {
    return new Date(year, month - 1, day, hour, 0, 0).getTime();
}

// Helper to create test entries
function makeEntry(id: string, timestamp: number): ChronicleEntryBase {
    return { id, timestamp };
}

describe("getDateKey", () => {
    it("should return same key for entries on the same day", () => {
        const morning = makeTimestamp(2025, 11, 27, 9);
        const evening = makeTimestamp(2025, 11, 27, 21);

        expect(getDateKey(morning)).toBe(getDateKey(evening));
    });

    it("should return different keys for entries on different days", () => {
        const day1 = makeTimestamp(2025, 11, 27, 12);
        const day2 = makeTimestamp(2025, 11, 28, 12);

        expect(getDateKey(day1)).not.toBe(getDateKey(day2));
    });

    it("should return different keys for entries in different months", () => {
        const nov = makeTimestamp(2025, 11, 15, 12);
        const dec = makeTimestamp(2025, 12, 15, 12);

        expect(getDateKey(nov)).not.toBe(getDateKey(dec));
    });

    it("should return different keys for entries in different years", () => {
        const year2024 = makeTimestamp(2024, 11, 27, 12);
        const year2025 = makeTimestamp(2025, 11, 27, 12);

        expect(getDateKey(year2024)).not.toBe(getDateKey(year2025));
    });
});

describe("shouldShowDateSeparator", () => {
    describe("single entry", () => {
        it("should show separator for a single entry", () => {
            const entries = [makeEntry("1", makeTimestamp(2025, 11, 27, 12))];
            const reversed = [...entries].reverse();

            expect(shouldShowDateSeparator(reversed, 0)).toBe(true);
        });
    });

    describe("multiple entries on the same day", () => {
        it("should show exactly one separator for the oldest entry", () => {
            const entries = [
                makeEntry("1", makeTimestamp(2025, 11, 27, 9)), // oldest
                makeEntry("2", makeTimestamp(2025, 11, 27, 12)),
                makeEntry("3", makeTimestamp(2025, 11, 27, 15)), // newest
            ];

            const result = computeDateSeparators(entries);

            // Should have exactly 1 separator
            const separatorCount = result.filter((r) => r.showSeparator).length;
            expect(separatorCount).toBe(1);

            // Reversed order: [newest, middle, oldest]
            expect(result[0].showSeparator).toBe(false); // newest
            expect(result[1].showSeparator).toBe(false); // middle
            expect(result[2].showSeparator).toBe(true); // oldest
            expect(result[2].entry.id).toBe("1");
        });

        it("should handle many entries on the same day", () => {
            const entries = Array.from({ length: 10 }, (_, i) =>
                makeEntry(`${i}`, makeTimestamp(2025, 11, 27, 8 + i))
            );

            const result = computeDateSeparators(entries);

            // Only the oldest entry should show separator
            const separatorCount = result.filter((r) => r.showSeparator).length;
            expect(separatorCount).toBe(1);
            expect(result[result.length - 1].showSeparator).toBe(true);
        });
    });

    describe("entries across multiple days", () => {
        it("should show separator at each date boundary", () => {
            const entries = [
                makeEntry("1", makeTimestamp(2025, 11, 25, 12)), // Nov 25
                makeEntry("2", makeTimestamp(2025, 11, 26, 12)), // Nov 26
                makeEntry("3", makeTimestamp(2025, 11, 27, 12)), // Nov 27
            ];

            const result = computeDateSeparators(entries);

            // All should have separators (each is the only entry for its day)
            expect(result.every((r) => r.showSeparator)).toBe(true);
        });

        it("should show separator only for oldest entry of each day", () => {
            const entries = [
                makeEntry("a1", makeTimestamp(2025, 11, 25, 10)), // Nov 25 - oldest
                makeEntry("a2", makeTimestamp(2025, 11, 25, 14)), // Nov 25 - newest
                makeEntry("b1", makeTimestamp(2025, 11, 26, 12)), // Nov 26 - only entry
                makeEntry("c1", makeTimestamp(2025, 11, 27, 9)), // Nov 27 - oldest
                makeEntry("c2", makeTimestamp(2025, 11, 27, 12)), // Nov 27 - middle
                makeEntry("c3", makeTimestamp(2025, 11, 27, 15)), // Nov 27 - newest
            ];

            const result = computeDateSeparators(entries);

            // Should have exactly 3 separators (one per unique date)
            const separatorCount = result.filter((r) => r.showSeparator).length;
            expect(separatorCount).toBe(3);

            // Verify correct entries have separators
            const entriesWithSeparators = result
                .filter((r) => r.showSeparator)
                .map((r) => r.entry.id);

            expect(entriesWithSeparators).toContain("a1"); // oldest Nov 25
            expect(entriesWithSeparators).toContain("b1"); // only Nov 26 entry
            expect(entriesWithSeparators).toContain("c1"); // oldest Nov 27
        });
    });

    describe("edge cases", () => {
        it("should return false for empty array", () => {
            expect(shouldShowDateSeparator([], 0)).toBe(false);
        });

        it("should handle entries at midnight boundaries", () => {
            const entries = [
                makeEntry("1", new Date(2025, 10, 26, 23, 59, 59).getTime()), // Nov 26 23:59:59
                makeEntry("2", new Date(2025, 10, 27, 0, 0, 0).getTime()), // Nov 27 00:00:00
            ];

            const result = computeDateSeparators(entries);

            // Both should have separators (different days)
            expect(result[0].showSeparator).toBe(true); // Nov 27
            expect(result[1].showSeparator).toBe(true); // Nov 26
        });

        it("should handle entries across year boundary", () => {
            const entries = [
                makeEntry("1", makeTimestamp(2024, 12, 31, 23)), // Dec 31, 2024
                makeEntry("2", makeTimestamp(2025, 1, 1, 1)), // Jan 1, 2025
            ];

            const result = computeDateSeparators(entries);

            expect(result[0].showSeparator).toBe(true); // Jan 1, 2025
            expect(result[1].showSeparator).toBe(true); // Dec 31, 2024
        });
    });
});
