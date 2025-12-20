import { writable } from "svelte/store";

/**
 * Store to signal when new chronicle entries have been added from external sources
 * (e.g., the Sidebar oracle). Chronicle subscribes to this and triggers animations.
 */
function createChronicleEventStore() {
    const { subscribe, set } = writable<number | null>(null);

    return {
        subscribe,
        /**
         * Signal that new entries were added. Pass a timestamp to animate
         * entries created after this time.
         */
        notifyEntriesAdded: (animateAfterTimestamp: number = Date.now() - 5000) => {
            set(animateAfterTimestamp);
        },
        /**
         * Clear the notification (called after Chronicle processes it)
         */
        clear: () => {
            set(null);
        },
    };
}

export const chronicleEvents = createChronicleEventStore();
