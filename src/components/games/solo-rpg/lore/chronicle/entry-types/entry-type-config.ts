import type { ComponentType } from "svelte";
import type { ChronicleEntry } from "../../../data/storage-utils";
import FortuneEntryContent from "./FortuneEntryContent.svelte";
import ManualEntryContent from "./ManualEntryContent.svelte";
import DiceEntryContent from "./DiceEntryContent.svelte";
import CardsEntryContent from "./CardsEntryContent.svelte";

export interface EntryTypeConfig {
    /** The internal type identifier */
    type: string;

    /** Display label for the entry type */
    label: string;

    /** Icon/emoji for the entry type */
    icon: string;

    /** Component to render the entry content */
    contentComponent: ComponentType;

    /** CSS class for card styling */
    cardClass: string;

    /** Whether this entry type uses compact mode */
    compact: boolean;

    /** Label for the edit button */
    editButtonLabel: (entry: ChronicleEntry) => string;

    /** Field to edit when editing this entry type */
    editField: "content" | "userNotes";

    /** Placeholder text for the editor */
    editPlaceholder: string;

    /** Check if entry has editable content/notes */
    hasEditableContent: (entry: ChronicleEntry) => boolean;
}

/**
 * Registry of all entry types
 * To add a new entry type:
 * 1. Create a new content component in this directory
 * 2. Add a new configuration object here
 * 3. That's it! Everything else is handled automatically
 */
export const ENTRY_TYPE_CONFIGS: Record<string, EntryTypeConfig> = {
    fortune: {
        type: "fortune",
        label: "Fortune",
        icon: "🎲",
        contentComponent: FortuneEntryContent,
        cardClass: "oracle-card",
        compact: true,
        editButtonLabel: (entry) => entry.userNotes ? "Edit notes" : "Add notes",
        editField: "userNotes",
        editPlaceholder: "Add your interpretation...",
        hasEditableContent: () => true, // Fortunes can always have notes added
    },

    dice: {
        type: "dice",
        label: "Dice Roll",
        icon: "🎲",
        contentComponent: DiceEntryContent,
        cardClass: "oracle-card",
        compact: true,
        editButtonLabel: (entry) => entry.userNotes ? "Edit notes" : "Add notes",
        editField: "userNotes",
        editPlaceholder: "Add notes about this roll...",
        hasEditableContent: () => true,
    },

    cards: {
        type: "cards",
        label: "Card Draw",
        icon: "🃏",
        contentComponent: CardsEntryContent,
        cardClass: "oracle-card",
        compact: true,
        editButtonLabel: (entry) => entry.userNotes ? "Edit notes" : "Add notes",
        editField: "userNotes",
        editPlaceholder: "Add notes about these cards...",
        hasEditableContent: () => true,
    },

    manual: {
        type: "manual",
        label: "Manual Entry",
        icon: "📝",
        contentComponent: ManualEntryContent,
        cardClass: "manual-card",
        compact: false,
        editButtonLabel: () => "Edit entry",
        editField: "content",
        editPlaceholder: "Edit your entry...",
        hasEditableContent: (entry) => !!entry.content,
    },
};

/**
 * Get the configuration for an entry type
 * Falls back to manual if type is unknown
 */
export function getEntryTypeConfig(entry: ChronicleEntry): EntryTypeConfig {
    const config = ENTRY_TYPE_CONFIGS[entry.type];
    if (!config) {
        console.warn(`Unknown entry type: ${entry.type}, falling back to manual`);
        return ENTRY_TYPE_CONFIGS.manual;
    }
    return config;
}
