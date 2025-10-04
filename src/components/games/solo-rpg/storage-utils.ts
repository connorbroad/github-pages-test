/**
 * Storage utility for Solo RPG data
 * Handles saving and loading game data to/from localStorage
 */

const STORAGE_KEY = 'solo-rpg-data';

export interface SoloRPGData {
    gameBlueprints?: GameBlueprint[];
    fortunes?: Fortune[];
    // Future additions:
    // notes?: GameNote[];
    // fortuneOutcomes?: FortuneOutcome[];
    // characters?: CharacterAttribute[];
}

export type GameBlueprint = {
    id: string;
    title: string;
    defaultFortunes: Fortune[];
};

export type Fortune = {
    id: string;
    campaign: string;
    title: string;
    outcome: Outcome;
};

type FortuneDiceRoll = {
    numDice: number;
    numSides: number;
    resultOption: "Sum" | "Maximum" | "Minimum" | "Subtract";
    showModifier?: boolean;
    modifier: number;
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
 * Clear all Solo RPG data from localStorage
 */
export function clearData(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear Solo RPG data:', error);
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
