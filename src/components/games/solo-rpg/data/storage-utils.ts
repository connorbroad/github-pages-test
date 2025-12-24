/**
 * Storage utility for Solo RPG data
 * Handles saving and loading game data to/from localStorage
 */

const STORAGE_KEY = "solo-rpg-data";
const ACTIVE_CAMPAIGN_KEY = "solo-rpg-active-campaign";
const ACTIVE_CHARACTER_KEY = "solo-rpg-active-character";
const ACTIVE_MAP_KEY = "solo-rpg-active-map";
const MAP_MODE_KEY = "solo-rpg-map-mode";

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

/** Reference to a creature (character) assigned to a map object */
export type CreatureRef = {
    type: "character";
    id: string; // Character.id
    instanceId: string; // Unique instance ID for this placement
    currentHitPoints?: number; // Override HP for this instance (undefined = use template max)
    initiative?: number; // Initiative roll for combat ordering
};

/** Quick stats for unassigned tokens - mutually exclusive with CreatureRef */
export type QuickStats = {
    name?: string;
    currentHitPoints?: number;
    maxHitPoints?: number;
};

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
    /** Optional creature (character or monster) assigned to this object */
    creatureRef?: CreatureRef;
    /** Quick stats for unassigned tokens - mutually exclusive with creatureRef */
    quickStats?: QuickStats;
    /** Whether the object (usually a tile) is flipped horizontally */
    flipX?: boolean;
    /** Whether the object is flipped vertically */
    flipY?: boolean;
};

/** Initiative entry for combat turn order */
export type InitiativeEntry = {
    objectId: string;
    name: string;
    initiative: number;
    currentHP: number;
    maxHP: number;
    isActive: boolean;
};

/** Combat state persisted per map */
export type CombatState = {
    initiativeOrder: InitiativeEntry[];
    currentTurnIndex: number;
    /** Whether an active encounter is in progress */
    hasActiveEncounter: boolean;
    /** Object ID of creature to return to after an interrupting add (for "Next Turn" logic) */
    pendingNextObjectId?: string;
};

/** Map display settings - persists per map */
export type MapSettings = {
    /** Use theme background color (follows light/dark mode). Default true. */
    useThemeBackground?: boolean;
    /** Custom background color when useThemeBackground is false */
    customBackgroundColor?: string;
    /** Custom grid line color. null = use theme default */
    gridColor?: string;
    /** Grid line thickness multiplier (0.5 to 3). Default 1 */
    gridThickness?: number;
    /** Grid opacity (0 to 1). Default 1 */
    gridOpacity?: number;
    /** Background tile opacity (0 to 1). Default 1 */
    backgroundTileOpacity?: number;
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
    /** Combat state - persists initiative order across creature/map switches */
    combatState?: CombatState;
    /** Map display settings */
    settings?: MapSettings;
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

export type ItemType = "general" | "weapon" | "armor";

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

export type GeneralItem = ItemBase & {
    type: "general";
};

export type CampaignItem = (WeaponItem | ArmorItem | GeneralItem) & {
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
 * Load the map mode (edit/play) from localStorage
 */
export function loadMapMode(): "edit" | "play" {
    try {
        const mode = localStorage.getItem(MAP_MODE_KEY);
        if (mode === "play") return "play";
        return "edit"; // Default to edit mode
    } catch (error) {
        console.error("Failed to load map mode:", error);
        return "edit";
    }
}

/**
 * Save the map mode (edit/play) to localStorage
 */
export function saveMapMode(mode: "edit" | "play"): void {
    try {
        localStorage.setItem(MAP_MODE_KEY, mode);
    } catch (error) {
        console.error("Failed to save map mode:", error);
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
 * Export a single game blueprint to JSON string
 */
export function exportBlueprint(blueprint: GameBlueprint): string {
    const exportData = {
        version: "1.0",
        type: "solo-rpg-blueprint",
        exportedAt: new Date().toISOString(),
        blueprint: blueprint,
    };
    return JSON.stringify(exportData, null, 2);
}

/**
 * Export multiple game blueprints to JSON string
 */
export function exportBlueprints(blueprints: GameBlueprint[]): string {
    const exportData = {
        version: "1.0",
        type: "solo-rpg-blueprints",
        exportedAt: new Date().toISOString(),
        blueprints: blueprints,
    };
    return JSON.stringify(exportData, null, 2);
}

/**
 * Download a single blueprint as a file
 */
export function downloadBlueprintFile(blueprint: GameBlueprint): void {
    const data = exportBlueprint(blueprint);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeTitle = blueprint.title.replace(/[^a-z0-9]/gi, "-").toLowerCase();
    a.download = `blueprint-${safeTitle}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Download all blueprints as a single file
 */
export function downloadAllBlueprintsFile(): void {
    const blueprints = loadGameBlueprints();
    const data = exportBlueprints(blueprints);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `all-blueprints-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Validate and parse imported blueprint data
 * Returns the blueprints if valid, or null if invalid
 */
export function parseImportedBlueprints(
    jsonString: string
): { blueprints: GameBlueprint[]; isSingle: boolean } | null {
    try {
        const data = JSON.parse(jsonString);

        // Check for single blueprint format
        if (data.type === "solo-rpg-blueprint" && data.blueprint) {
            const blueprint = data.blueprint as GameBlueprint;
            if (validateBlueprint(blueprint)) {
                return { blueprints: [blueprint], isSingle: true };
            }
        }

        // Check for multiple blueprints format
        if (data.type === "solo-rpg-blueprints" && Array.isArray(data.blueprints)) {
            const blueprints = data.blueprints as GameBlueprint[];
            if (blueprints.every(validateBlueprint)) {
                return { blueprints, isSingle: false };
            }
        }

        return null;
    } catch (error) {
        console.error("Failed to parse blueprint data:", error);
        return null;
    }
}

/**
 * Validate that an object is a valid GameBlueprint
 */
function validateBlueprint(obj: unknown): obj is GameBlueprint {
    if (!obj || typeof obj !== "object") return false;
    const blueprint = obj as Record<string, unknown>;

    return (
        typeof blueprint.id === "string" &&
        typeof blueprint.title === "string" &&
        Array.isArray(blueprint.defaultFortunes)
    );
}

/**
 * Import blueprints, optionally generating new IDs to avoid conflicts
 * Returns the number of blueprints imported
 */
export function importBlueprints(
    blueprints: GameBlueprint[],
    generateNewIds: boolean = true
): number {
    const existingBlueprints = loadGameBlueprints();
    const existingIds = new Set(existingBlueprints.map((b) => b.id));

    const newBlueprints: GameBlueprint[] = [];

    for (const blueprint of blueprints) {
        // Generate new ID if requested or if ID already exists
        let newBlueprint = { ...blueprint };
        if (generateNewIds || existingIds.has(blueprint.id)) {
            const newId = generateBlueprintId();
            newBlueprint = {
                ...blueprint,
                id: newId,
                defaultFortunes: blueprint.defaultFortunes.map((f) => ({
                    ...f,
                    id: generateBlueprintId(), // Also generate new fortune IDs
                })),
            };
        }
        newBlueprints.push(newBlueprint);
    }

    saveGameBlueprints([...existingBlueprints, ...newBlueprints]);
    return newBlueprints.length;
}

/**
 * Generate a unique ID for blueprints/fortunes
 */
function generateBlueprintId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Export campaign items to JSON string
 * Strips IDs, campaignId, and timestamps - these are regenerated on import
 */
export function exportItems(items: CampaignItem[]): string {
    const exportData = {
        version: "1.0",
        type: "solo-rpg-items",
        exportedAt: new Date().toISOString(),
        items: items.map((item) => {
            // Strip internal fields - they'll be regenerated on import
            const { id, campaignId, createdAt, updatedAt, ...exportItem } = item;

            // For weapons, strip attack IDs as well
            if (exportItem.type === "weapon" && "attacks" in exportItem) {
                const weaponItem = exportItem as { attacks: AttackSpec[] } & typeof exportItem;
                return {
                    ...exportItem,
                    attacks: weaponItem.attacks.map(({ id: attackId, ...attack }) => attack),
                };
            }

            return exportItem;
        }),
    };
    return JSON.stringify(exportData, null, 2);
}

/**
 * Download campaign items as a file
 */
export function downloadItemsFile(items: CampaignItem[], campaignTitle?: string): void {
    const data = exportItems(items);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeTitle = campaignTitle
        ? campaignTitle.replace(/[^a-z0-9]/gi, "-").toLowerCase()
        : "campaign";
    a.download = `items-${safeTitle}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Type for exported item (without IDs, campaignId, or timestamps)
 */
type ExportedAttack = Omit<AttackSpec, "id">;
type ExportedItem = Omit<CampaignItem, "id" | "campaignId" | "createdAt" | "updatedAt"> & {
    attacks?: ExportedAttack[];
};

/**
 * Validate and parse imported items data
 * Returns the items if valid, or null if invalid
 */
export function parseImportedItems(jsonString: string): { items: ExportedItem[] } | null {
    try {
        const data = JSON.parse(jsonString);

        // Check for items format
        if (data.type === "solo-rpg-items" && Array.isArray(data.items)) {
            const items = data.items as ExportedItem[];
            if (items.every(validateExportedItem)) {
                return { items };
            }
        }

        return null;
    } catch (error) {
        console.error("Failed to parse items data:", error);
        return null;
    }
}

/**
 * Validate that an object is a valid exported Item (without IDs/timestamps)
 */
function validateExportedItem(obj: unknown): obj is ExportedItem {
    if (!obj || typeof obj !== "object") return false;
    const item = obj as Record<string, unknown>;

    // Core required fields
    if (typeof item.name !== "string") return false;
    if (item.type !== "general" && item.type !== "weapon" && item.type !== "armor") return false;

    // Validate weapon-specific fields
    if (item.type === "weapon") {
        if (!Array.isArray(item.attacks)) return false;
        // Validate each attack has required fields (but not id)
        for (const attack of item.attacks) {
            if (typeof attack !== "object" || !attack) return false;
            const atk = attack as Record<string, unknown>;
            if (typeof atk.dice !== "string") return false;
            if (atk.kind !== "B" && atk.kind !== "P" && atk.kind !== "S") return false;
        }
    }

    // Validate armor-specific fields
    if (item.type === "armor") {
        if (typeof item.armorClass !== "number") return false;
    }

    return true;
}

/**
 * Generate a unique ID for items
 */
export function generateItemId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Import items into a campaign
 * @param items - Exported items (without IDs/timestamps)
 * @param campaignId - Target campaign ID
 * @param mode - "add" to add to existing items, "replace" to replace all items in campaign
 * @returns Number of items imported
 */
export function importItems(
    items: ExportedItem[],
    campaignId: string,
    mode: "add" | "replace"
): number {
    const allItems = loadCampaignItems();
    const existingCampaignItems = allItems.filter((i) => i.campaignId === campaignId);
    const otherCampaignItems = allItems.filter((i) => i.campaignId !== campaignId);

    const now = Date.now();
    const newItems: CampaignItem[] = [];

    for (const item of items) {
        // Generate fresh IDs and timestamps
        let newItem: CampaignItem;

        if (item.type === "weapon" && item.attacks) {
            // Regenerate attack IDs for weapons
            newItem = {
                ...item,
                id: generateItemId(),
                campaignId: campaignId,
                createdAt: now,
                updatedAt: now,
                attacks: item.attacks.map((attack) => ({
                    ...attack,
                    id: generateItemId(),
                })),
            } as CampaignItem;
        } else {
            newItem = {
                ...item,
                id: generateItemId(),
                campaignId: campaignId,
                createdAt: now,
                updatedAt: now,
            } as CampaignItem;
        }

        newItems.push(newItem);
    }

    if (mode === "replace") {
        // Replace all campaign items: keep other campaigns, use only new items for this campaign
        saveCampaignItems([...otherCampaignItems, ...newItems]);
    } else {
        // Add mode: keep existing items for this campaign, add new ones
        saveCampaignItems([...otherCampaignItems, ...existingCampaignItems, ...newItems]);
    }

    return newItems.length;
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

/**
 * Unified tag system - collects tags from characters for a campaign
 */
export function loadCampaignTags(campaignId: string): string[] {
    const characters = loadCharacters().filter((c) => c.campaignId === campaignId);

    const tagSet = new Set<string>();

    // Collect tags from characters
    for (const char of characters) {
        if (char.tags) {
            for (const tag of char.tags) {
                tagSet.add(tag);
            }
        }
    }

    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
}

/**
 * Get all unique tags across all campaigns (for global tag suggestions)
 */
export function loadAllTags(): string[] {
    const characters = loadCharacters();

    const tagSet = new Set<string>();

    for (const char of characters) {
        if (char.tags) {
            for (const tag of char.tags) {
                tagSet.add(tag);
            }
        }
    }

    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
}
