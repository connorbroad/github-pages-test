/**
 * Storage utility for Solo RPG data
 * Handles saving and loading game data to/from localStorage
 */

const STORAGE_KEY = 'solo-rpg-data';
const ACTIVE_CAMPAIGN_KEY = 'solo-rpg-active-campaign';
const ACTIVE_CHARACTER_KEY = 'solo-rpg-active-character';

export interface SoloRPGData {
    gameBlueprints?: GameBlueprint[];
    campaigns?: Campaign[];
    fortunes?: Fortune[];
    chronicleEntries?: ChronicleEntry[];
    chapters?: Chapter[];
    characters?: Character[];
    codexNotes?: CodexNote[];
    // Future additions:
    // notes?: GameNote[];
    // fortuneOutcomes?: FortuneOutcome[];
}

export type Campaign = {
    id: string;
    title: string;
    blueprintId: string;
    blueprintTitle: string;
    createdAt: number;
};

export type Chapter = {
    id: string;
    campaignId: string;
    chapterNumber: number;
    customName?: string; // Optional custom name
    createdAt: number;
    closedAt: number; // When the chapter was closed/saved
};

export type CodexNote = {
    id: string;
    campaignId: string;
    title: string;
    content: string;
    noteGroup: string; // e.g., "Characters", "Locations", "Items", "Custom Group"
    subNoteGroup?: string; // Optional subgroup, e.g., character name
    characterId?: string; // Link to character if this is a character note
    createdAt: number;
    updatedAt: number;
};

export type Ability = {
    id: string;
    name: string;
    score: number;
    modifier: number;
    proficient: boolean;
    diceRoll?: string; // e.g., "1d20" or "2d6" - the dice formula to roll for this ability check
};

export type Skill = {
    id: string;
    name: string;
    abilityId: string; // Reference to the associated ability
    proficient: boolean;
    bonus: number;
    diceRoll?: string; // e.g., "1d20" - the dice formula to roll for this skill check
};

export type Character = {
    id: string;
    campaignId: string;
    name: string;
    tags?: string[]; // Tags for categorizing/grouping characters
    // Core Info
    class?: string;
    level?: number;
    proficiencyBonus?: number;
    background?: string;
    playerName?: string;
    race?: string;
    alignment?: string;
    experiencePoints?: number;
    // Abilities
    abilities: Ability[];
    skills: Skill[];
    // Combat Stats
    armorClass?: number;
    initiative?: number;
    speed?: number;
    hitPointMaximum?: number;
    currentHitPoints?: number;
    temporaryHitPoints?: number;
    hitDice?: string;
    deathSaveSuccesses?: number;
    deathSaveFailures?: number;
    // UI Configuration
    visibleSections?: string[]; // Tracks which sections are enabled for this character
    // Metadata
    createdAt: number;
    updatedAt: number;
};

export type ChronicleEntry = {
    id: string;
    campaignId: string;
    chapterId?: string; // Optional reference to chapter (undefined = current/active entries)
    timestamp: number;
    type: "manual" | "fortune" | "dice" | "cards";
    content: string;
    fortuneId?: string; // Optional reference to fortune if type is "fortune"
    fortuneData?: FortuneResultData; // Fortune roll/draw results
    diceData?: DiceRollData; // Standalone dice roll results
    cardsData?: CardsDrawData; // Standalone card draw results
    userNotes?: string; // User-added notes to fortune results
    characterId?: string; // Optional reference to character
};

export type FortuneResultData = {
    fortuneTitle: string;
    diceRoll?: {
        numDice: number;
        numSides: number;
        modifier: number;
        resultOption: "Sum" | "Maximum" | "Minimum" | "Subtract";
        result: number;
        individualDiceResults: number[];
        diceSignificance?: { [key: number]: string };
        mappedOutcome?: string;
    };
    cardDraw?: {
        suit: string;
        rank: string;
        suitMapped?: string;
        rankMapped?: string;
    };
};

export type DiceRollData = {
    numDice: number;
    numSides: number;
    modifier: number;
    resultOption: "Sum" | "Maximum" | "Minimum" | "Subtract";
    result: number;
    individualDiceResults: number[];
    checkName?: string; // Name of the check being rolled (e.g., "Strength", "Perception", "Saving Throw")
};

export type CardsDrawData = {
    cards: Array<{
        suit: string;
        rank: string;
    }>;
};

export type GameBlueprint = {
    id: string;
    title: string;
    defaultFortunes: Fortune[];
};

export type Fortune = {
    id: string;
    campaign?: string;
    title: string;
    outcome: Outcome;
};

type FortuneDiceRoll = {
    numDice: number;
    numSides: number;
    resultOption: "Sum" | "Maximum" | "Minimum" | "Subtract";
    showModifier?: boolean;
    modifier: number;
    diceSignificance?: { [key: number]: string };
};

type FortuneCardDraw = {
    enabled: boolean;
};

type Outcome = {
    diceRoll?: FortuneDiceRoll;
    cardDraw?: FortuneCardDraw;
    diceMapping?: { [key: number]: string };
    suitMapping?: { [key: string]: string };
    rankMapping?: { [key: string]: string };
};

/**
 * Load all Solo RPG data from localStorage
 */
export function loadData(): SoloRPGData {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Failed to load Solo RPG data:', error);
    }
    return {};
}

/**
 * Save all Solo RPG data to localStorage
 */
export function saveData(data: SoloRPGData): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Failed to save Solo RPG data:', error);
    }
}

/**
 * Load fortunes from storage
 */
export function loadFortunes(): Fortune[] {
    const data = loadData();
    return data.fortunes || [];
}

/**
 * Save fortunes to storage
 */
export function saveFortunes(fortunes: Fortune[]): void {
    const data = loadData();
    data.fortunes = fortunes;
    saveData(data);
}

/**
 * Load game blueprints from storage
 */
export function loadGameBlueprints(): GameBlueprint[] {
    const data = loadData();
    return data.gameBlueprints || [];
}

/**
 * Save game blueprints to storage
 */
export function saveGameBlueprints(blueprints: GameBlueprint[]): void {
    const data = loadData();
    data.gameBlueprints = blueprints;
    saveData(data);
}

/**
 * Load campaigns from storage
 */
export function loadCampaigns(): Campaign[] {
    const data = loadData();
    return data.campaigns || [];
}

/**
 * Save campaigns to storage
 */
export function saveCampaigns(campaigns: Campaign[]): void {
    const data = loadData();
    data.campaigns = campaigns;
    saveData(data);
}

/**
 * Load chronicle entries from storage
 */
export function loadChronicleEntries(): ChronicleEntry[] {
    const data = loadData();
    return data.chronicleEntries || [];
}

/**
 * Save chronicle entries to storage
 */
export function saveChronicleEntries(entries: ChronicleEntry[]): void {
    const data = loadData();
    data.chronicleEntries = entries;
    saveData(data);
}

/**
 * Load chapters from storage
 */
export function loadChapters(): Chapter[] {
    const data = loadData();
    return data.chapters || [];
}

/**
 * Save chapters to storage
 */
export function saveChapters(chapters: Chapter[]): void {
    const data = loadData();
    data.chapters = chapters;
    saveData(data);
}

/**
 * Clear all Solo RPG data from localStorage
 */
export function clearData(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(ACTIVE_CAMPAIGN_KEY);
        localStorage.removeItem(ACTIVE_CHARACTER_KEY);
    } catch (error) {
        console.error('Failed to clear Solo RPG data:', error);
    }
}

/**
 * Load the active campaign ID from localStorage
 */
export function loadActiveCampaignId(): string | null {
    try {
        return localStorage.getItem(ACTIVE_CAMPAIGN_KEY);
    } catch (error) {
        console.error('Failed to load active campaign:', error);
        return null;
    }
}

/**
 * Save the active campaign ID to localStorage
 */
export function saveActiveCampaignId(campaignId: string | null): void {
    try {
        if (campaignId) {
            localStorage.setItem(ACTIVE_CAMPAIGN_KEY, campaignId);
        } else {
            localStorage.removeItem(ACTIVE_CAMPAIGN_KEY);
        }
    } catch (error) {
        console.error('Failed to save active campaign:', error);
    }
}

/**
 * Load the active character ID from localStorage
 */
export function loadActiveCharacterId(): string | null {
    try {
        return localStorage.getItem(ACTIVE_CHARACTER_KEY);
    } catch (error) {
        console.error('Failed to load active character:', error);
        return null;
    }
}

/**
 * Save the active character ID to localStorage
 */
export function saveActiveCharacterId(characterId: string | null): void {
    try {
        if (characterId) {
            localStorage.setItem(ACTIVE_CHARACTER_KEY, characterId);
        } else {
            localStorage.removeItem(ACTIVE_CHARACTER_KEY);
        }
    } catch (error) {
        console.error('Failed to save active character:', error);
    }
}

/**
 * Export all data as a JSON string
 */
export function exportData(): string {
    const data = loadData();
    return JSON.stringify(data, null, 2);
}

/**
 * Import data from a JSON string, overwriting existing data
 */
export function importData(jsonString: string): boolean {
    try {
        const data = JSON.parse(jsonString);
        saveData(data);
        return true;
    } catch (error) {
        console.error('Failed to import Solo RPG data:', error);
        return false;
    }
}

/**
 * Download data as a file
 */
export function downloadDataFile(): void {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solo-rpg-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Load characters from storage
 */
export function loadCharacters(): Character[] {
    const data = loadData();
    return data.characters || [];
}

/**
 * Save characters to storage
 */
export function saveCharacters(characters: Character[]): void {
    const data = loadData();
    data.characters = characters;
    saveData(data);
}

/**
 * Load codex notes from storage
 */
export function loadCodexNotes(): CodexNote[] {
    const data = loadData();
    return data.codexNotes || [];
}

/**
 * Save codex notes to storage
 */
export function saveCodexNotes(codexNotes: CodexNote[]): void {
    const data = loadData();
    data.codexNotes = codexNotes;
    saveData(data);
}
