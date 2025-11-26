/**
 * Storage utility for Solo RPG data
 * Handles saving and loading game data to/from localStorage
 */

const STORAGE_KEY = "solo-rpg-data";
const ACTIVE_CAMPAIGN_KEY = "solo-rpg-active-campaign";
const ACTIVE_CHARACTER_KEY = "solo-rpg-active-character";
const ACTIVE_MAP_KEY = "solo-rpg-active-map";

export interface SoloRPGData {
    gameBlueprints?: GameBlueprint[];
    campaigns?: Campaign[];
    fortunes?: Fortune[];
    chronicleEntries?: ChronicleEntry[];
    chapters?: Chapter[];
    characters?: Character[];
    codexNotes?: CodexNote[];
    // Map data
    maps?: MapEntity[];
    activeMapId?: string;
    // Tile maps (image-based tilesets)
    tileMaps?: TileMap[];
    // New: shared campaign item library
    campaignItems?: CampaignItem[];
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
};

export type Skill = {
    id: string;
    name: string;
    abilityId: string; // Reference to the associated ability
    proficient: boolean;
    bonus: number;
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
    abilityCheckDice?: string; // Dice formula for all ability checks (e.g., "1d20")
    skillCheckDice?: string; // Dice formula for all skill checks (e.g., "1d20")
    // Inventory & Equipment
    currency?: Currency;
    inventory?: CharacterInventoryItem[];
    equipped?: { weapons: string[]; armors: string[] };
    maxCarryWeight?: number;
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

// Map types
export type MapObject = {
    /** Unique identifier for the object */
    id: string;
    /**
     * Optional discriminator for forward compatibility with tile objects.
     * When omitted or 'shape', this represents a shape object (legacy behavior).
     * When 'tile', the `tile` field should be present and `type`/`color` may be ignored by renderers.
     */
    kind?: "shape" | "tile";
    /** Shape type (used when kind !== 'tile') */
    type: "square" | "circle" | "triangle" | "star";
    x: number; // world px
    y: number; // world px
    w: number; // px
    h: number; // px
    rotation?: number;
    /** Color for shape objects. Tile objects may ignore this. */
    color: string; // palette key or hex
    /** Tile reference (used when kind === 'tile') */
    tile?: TileRef;
    z?: number;
    locked?: boolean;
};

export type MapEntity = {
    id: string;
    campaignId: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    width: number; // tiles
    height: number; // tiles
    tileSize: number; // px
    background: Record<string, string>; // key "x,y" -> color
    /** Optional background tile placements keyed by "x,y" */
    backgroundTiles?: Record<string, TileRef>;
    /** Optional background tile tint colors keyed by "x,y" */
    backgroundTileTints?: Record<string, string>;
    objects: MapObject[];
    view?: { x: number; y: number; zoom: number };
    isFavorite?: boolean;
};

/**
 * Tile map models
 */
export type TileRef = {
    tileMapId: string;
    tileId: string; // unique tile id within the tile map
};

export type TileMapTile = {
    id: string; // unique identifier for the tile entry
    col: number;
    row: number;
    x: number; // px within source image
    y: number; // px within source image
    w: number; // px
    h: number; // px
    include: boolean; // selectable/available in UI
    allowBackground: boolean;
    allowForeground: boolean;
};

export type TileMap = {
    id: string;
    name: string;
    image: { kind: "data-url" | "url"; value: string };
    tileSize: number; // px, assumed square
    columns: number;
    rows: number;
    tiles: TileMapTile[];
    createdAt: number;
    updatedAt: number;
};

/**
 * Inventory & Items models
 */
export type Currency = { gp: number; sp: number; cp: number };

export type ItemType = "simple" | "weapon" | "armor";

export type AttackSpec = {
    id: string;
    name?: string;
    dice: string; // e.g. "1d8+2"
    kind: "B" | "P" | "S";
};

export type ItemBase = {
    id: string;
    name: string;
    type: ItemType;
    weight?: number; // in whatever units you prefer
    cost?: number; // cost in gp units
    tags?: string[];
};

export type WeaponItem = ItemBase & {
    type: "weapon";
    range?: string; // e.g. "30/120 ft"
    toHit: string; // e.g. "1d20+0"
    attacks: AttackSpec[]; // one or more damage rolls
};

export type ArmorItem = ItemBase & {
    type: "armor";
    armorClass: number; // DC override
};

export type SimpleItem = ItemBase & {
    type: "simple";
};

export type CampaignItem = (WeaponItem | ArmorItem | SimpleItem) & {
    campaignId: string;
    createdAt: number;
    updatedAt: number;
};

export type CharacterInventoryItem = {
    itemId: string; // ref to CampaignItem.id
    quantity: number;
    equipped?: boolean;
    equippedSlot?: "weapon" | "armor";
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
        console.error("Failed to load Solo RPG data:", error);
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
        console.error("Failed to save Solo RPG data:", error);
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
 * Map storage helpers
 */
export function loadMaps(): MapEntity[] {
    const data = loadData();
    return data.maps || [];
}

export function saveMaps(maps: MapEntity[]): void {
    const data = loadData();
    data.maps = maps;
    saveData(data);
}

export function loadMapsByCampaign(campaignId: string): MapEntity[] {
    return loadMaps().filter((m) => m.campaignId === campaignId);
}

export function loadActiveMapId(): string | null {
    try {
        return localStorage.getItem(ACTIVE_MAP_KEY);
    } catch (error) {
        console.error("Failed to load active map:", error);
        return null;
    }
}

export function saveActiveMapId(mapId: string | null): void {
    try {
        if (mapId) {
            localStorage.setItem(ACTIVE_MAP_KEY, mapId);
        } else {
            localStorage.removeItem(ACTIVE_MAP_KEY);
        }
    } catch (error) {
        console.error("Failed to save active map:", error);
    }
}

/**
 * Tile map storage helpers
 */
export function loadTileMaps(): TileMap[] {
    const data = loadData();
    return data.tileMaps || [];
}

export function saveTileMaps(tileMaps: TileMap[]): void {
    const data = loadData();
    data.tileMaps = tileMaps;
    saveData(data);
}

export function getTileMapById(id: string): TileMap | undefined {
    return loadTileMaps().find((tm) => tm.id === id);
}

/**
 * Campaign items storage helpers
 */
export function loadCampaignItems(): CampaignItem[] {
    const data = loadData();
    return data.campaignItems || [];
}

export function saveCampaignItems(items: CampaignItem[]): void {
    const data = loadData();
    data.campaignItems = items;
    saveData(data);
}

export function loadCampaignItemsByCampaign(campaignId: string): CampaignItem[] {
    return loadCampaignItems().filter((i) => i.campaignId === campaignId);
}

export function getCampaignItemById(id: string): CampaignItem | undefined {
    return loadCampaignItems().find((i) => i.id === id);
}

/**
 * Clear all Solo RPG data from localStorage
 */
export function clearData(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(ACTIVE_CAMPAIGN_KEY);
        localStorage.removeItem(ACTIVE_CHARACTER_KEY);
        localStorage.removeItem(ACTIVE_MAP_KEY);
    } catch (error) {
        console.error("Failed to clear Solo RPG data:", error);
    }
}

/**
 * Load the active campaign ID from localStorage
 */
export function loadActiveCampaignId(): string | null {
    try {
        return localStorage.getItem(ACTIVE_CAMPAIGN_KEY);
    } catch (error) {
        console.error("Failed to load active campaign:", error);
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
        console.error("Failed to save active campaign:", error);
    }
}

/**
 * Load the active character ID from localStorage
 */
export function loadActiveCharacterId(): string | null {
    try {
        return localStorage.getItem(ACTIVE_CHARACTER_KEY);
    } catch (error) {
        console.error("Failed to load active character:", error);
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
        console.error("Failed to save active character:", error);
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
        console.error("Failed to import Solo RPG data:", error);
        return false;
    }
}

/**
 * Download data as a file
 */
export function downloadDataFile(): void {
    const data = exportData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `solo-rpg-data-${new Date().toISOString().split("T")[0]}.json`;
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
