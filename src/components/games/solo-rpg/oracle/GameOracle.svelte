<script context="module" lang="ts">
    export type OracleTabView = "oracle" | "dice" | "cards";
    let lastView: OracleTabView = "dice";
</script>

<script lang="ts">
    import {
        loadFortunes,
        saveFortunes,
        loadGameBlueprints,
        loadChronicleEntries,
        saveChronicleEntries,
    } from "../data/storage-utils";
    import { chronicleEvents } from "../lore/chronicle/chronicle-store";
    import type { FortuneResultData } from "../data/storage-utils";
    import { activeCampaign } from "../game-management/campaign-store";
    import { onMount } from "svelte";
    import FortuneEditor from "./components/FortuneEditor.svelte";
    import FateConsultation from "./components/FateConsultation.svelte";
    import OracleView from "./components/OracleView.svelte";
    import NoCampaignOverlay from "../NoCampaignOverlay.svelte";
    import { generateId, type Fortune } from "./scripts/oracleTypes";

    import CardDealer from "./components/card-dealer/CardDealer.svelte";
    import DiceRoller from "./components/dice-roller/DiceRoller.svelte";
    import CharacterSelector from "../shared/CharacterSelector.svelte";
    import SrpgModal from "../shared/modal/SrpgModal.svelte";

    // Dice roll preset for ability/skill checks
    export let diceRollPreset: {
        characterId: string;
        characterName: string;
        checkName: string;
        numDice: number;
        numSides: number;
        modifier: number;
        rollType: "normal" | "advantage" | "disadvantage";
    } | null = null;

    // Optional character ID to preselect (e.g., when opening from a character sheet)
    export let preselectedCharacterId: string | null = null;

    export let onClose: () => void = () => {};
    export let onNavigateHome: () => void = () => {};
    export let onNavigateToStory: () => void = () => {};
    export let onClearPreset: () => void = () => {};

    let fortunes: Fortune[] = [];
    let defaultFortunes: Fortune[] = [];
    let customFortunes: Fortune[] = [];
    let selectedFortune: Fortune | null = null;

    // Persist view selection
    function updateLastView(v: OracleTabView) {
        lastView = v;
    }
    $: updateLastView(view);

    // View state for in-modal navigation
    let view: OracleTabView = lastView;

    // Track the currently displayed character in the selector
    let currentDisplayedCharacterId: string | null = null;

    // Create/Edit Fortune state
    let showFate = false;
    let showCreateFortune = false;
    let editingFortune: Fortune = {
        id: "",
        campaign: "",
        title: "",
        outcome: {},
    };

    // Edit mode for campaign fortunes
    let editMode = false;

    onMount(() => {
        fortunes = loadFortunes();
    });

    // Automatically switch to dice roller view when preset is provided
    $: if (diceRollPreset) {
        view = "dice";
    }

    // Separate default fortunes from the active blueprint and user fortunes
    $: {
        if ($activeCampaign) {
            const blueprints = loadGameBlueprints();
            const activeBlueprint = blueprints.find((b) => b.id === $activeCampaign.blueprintId);

            if (activeBlueprint && activeBlueprint.defaultFortunes) {
                defaultFortunes = activeBlueprint.defaultFortunes;
            } else {
                defaultFortunes = [];
            }

            // Filter custom fortunes to only show ones for the active campaign
            customFortunes = fortunes.filter((f) => f.campaign === $activeCampaign.id);
        } else {
            defaultFortunes = [];
            customFortunes = [];
        }
    }

    function openCreateFortune() {
        editingFortune = {
            id: generateId(),
            campaign: $activeCampaign?.id || "",
            title: "",
            outcome: {},
        };
        showCreateFortune = true;
    }

    function saveFortune(fortune: Fortune) {
        const existingIndex = fortunes.findIndex((f) => f.id === fortune.id);
        if (existingIndex >= 0) {
            fortunes[existingIndex] = { ...fortune };
        } else {
            fortunes = [...fortunes, { ...fortune }];
        }
        saveFortunes(fortunes);
        showCreateFortune = false;
    }

    function deleteFortune(id: string) {
        fortunes = fortunes.filter((f) => f.id !== id);
        saveFortunes(fortunes);
    }

    function openFate(fortune: Fortune) {
        selectedFortune = fortune;
        showFate = true;
    }

    function handleReorder(event: CustomEvent<{ draggedId: string; targetId: string }>) {
        const { draggedId, targetId } = event.detail;
        const newFortunes = [...fortunes];
        const draggedIndex = newFortunes.findIndex((f) => f.id === draggedId);
        const dropIndex = newFortunes.findIndex((f) => f.id === targetId);

        if (draggedIndex !== -1 && dropIndex !== -1) {
            const [draggedFortune] = newFortunes.splice(draggedIndex, 1);
            newFortunes.splice(dropIndex, 0, draggedFortune);
            fortunes = newFortunes;
            saveFortunes(fortunes);
        }
    }

    function handleNavigateHome() {
        onNavigateHome();
    }

    function handleAcceptFate(resultData: FortuneResultData) {
        if (!$activeCampaign) return;

        // Create a chronicle entry for this fortune result
        const chronicleEntries = loadChronicleEntries();

        const newEntry = {
            id: generateId(),
            campaignId: $activeCampaign.id,
            timestamp: Date.now(),
            type: "fortune" as const,
            content: "", // Empty content, fortune data is stored separately
            fortuneId: selectedFortune?.id,
            fortuneData: resultData,
            // Use the currently displayed character ID from the selector
            characterId: currentDisplayedCharacterId || undefined,
        };

        chronicleEntries.push(newEntry);
        saveChronicleEntries(chronicleEntries);

        // Notify chronicle to animate new entries
        chronicleEvents.notifyEntriesAdded(Date.now() - 1000);

        showFate = false;
        selectedFortune = null;

        // Navigate to story page
        onNavigateToStory();
    }

    function handleDiceRecordFate(event: CustomEvent) {
        const diceData = event.detail;

        if (!$activeCampaign) return;

        const chronicleEntries = loadChronicleEntries();

        // Build content string with optional check name
        let content = "";
        if (diceData.checkName) {
            content = `${diceData.checkName} check: Rolled ${diceData.numDice}d${diceData.numSides}${diceData.modifier !== 0 ? (diceData.modifier > 0 ? "+" : "") + diceData.modifier : ""}: ${diceData.result}`;
        } else {
            content = `Rolled ${diceData.numDice}d${diceData.numSides}${diceData.modifier !== 0 ? (diceData.modifier > 0 ? "+" : "") + diceData.modifier : ""}: ${diceData.result}`;
        }

        const newEntry = {
            id: generateId(),
            campaignId: $activeCampaign.id,
            timestamp: Date.now(),
            type: "dice" as const,
            content,
            diceData: {
                numDice: diceData.numDice,
                numSides: diceData.numSides,
                modifier: diceData.modifier,
                resultOption: diceData.resultOption,
                result: diceData.result,
                individualDiceResults: diceData.individualDiceResults,
                checkName: diceData.checkName,
            },
            // Use the currently displayed character ID from the selector
            characterId: currentDisplayedCharacterId || undefined,
        };

        chronicleEntries.push(newEntry);
        saveChronicleEntries(chronicleEntries);

        // Notify chronicle to animate new entries
        chronicleEvents.notifyEntriesAdded(Date.now() - 1000);

        // Navigate to story page
        onNavigateToStory();
    }

    function handleCardsRecordFate(event: CustomEvent) {
        const cardsData = event.detail;

        if (!$activeCampaign) return;

        const chronicleEntries = loadChronicleEntries();

        const cardsList = cardsData.cards.map((c: any) => `${c.rank} of ${c.suit}`).join(", ");

        const newEntry = {
            id: generateId(),
            campaignId: $activeCampaign.id,
            timestamp: Date.now(),
            type: "cards" as const,
            content: `Drew ${cardsData.cards.length} card${cardsData.cards.length > 1 ? "s" : ""}: ${cardsList}`,
            cardsData: {
                cards: cardsData.cards,
            },
            // Use the currently displayed character ID from the selector
            characterId: currentDisplayedCharacterId || undefined,
        };

        chronicleEntries.push(newEntry);
        saveChronicleEntries(chronicleEntries);

        // Notify chronicle to animate new entries
        chronicleEvents.notifyEntriesAdded(Date.now() - 1000);

        // Navigate to story page
        onNavigateToStory();
    }

    function handleClose() {
        onClearPreset();
        onClose();
    }

    function go(viewName: OracleTabView) {
        view = viewName;
    }
</script>

<SrpgModal show={true} ariaLabel="Close Oracle" maxWidth="420px" onClose={handleClose}>
    <div class="flex flex-col gap-4">
        <!-- Header with character selector and navigation -->
        <div class="flex flex-col gap-3">
            <!-- Character Selector -->
            <div class="flex justify-center">
                <CharacterSelector {preselectedCharacterId} bind:currentDisplayedCharacterId />
            </div>

            <!-- Navigation Tabs -->
            <nav class="oracle-nav" aria-label="Oracle navigation">
                <button
                    class="oracle-nav-tab"
                    class:active={view === "oracle"}
                    on:click={() => go("oracle")}
                    aria-label="Oracle"
                    aria-current={view === "oracle" ? "page" : undefined}>
                    <svg
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        fill="none"
                        aria-hidden="true"
                        class="shrink-0">
                        <circle cx="12" cy="10" r="6" stroke="currentColor" stroke-width="2" />
                        <path
                            d="M6 18h12"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round" />
                        <path
                            d="M8.5 6.5c.6-1 1.7-1.7 3-1.9"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round" />
                    </svg>
                    <span>Oracle</span>
                </button>
                <button
                    class="oracle-nav-tab"
                    class:active={view === "dice"}
                    on:click={() => go("dice")}
                    aria-label="Dice Roller"
                    aria-current={view === "dice" ? "page" : undefined}>
                    <svg
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        fill="none"
                        aria-hidden="true"
                        class="shrink-0">
                        <rect
                            x="4"
                            y="4"
                            width="16"
                            height="16"
                            rx="3"
                            stroke="currentColor"
                            stroke-width="2" />
                        <circle cx="9" cy="9" r="1.5" fill="currentColor" />
                        <circle cx="15" cy="15" r="1.5" fill="currentColor" />
                    </svg>
                    <span>Dice</span>
                </button>
                <button
                    class="oracle-nav-tab"
                    class:active={view === "cards"}
                    on:click={() => go("cards")}
                    aria-label="Card Dealer"
                    aria-current={view === "cards" ? "page" : undefined}>
                    <svg
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        fill="none"
                        aria-hidden="true"
                        class="shrink-0">
                        <rect
                            x="6"
                            y="4"
                            width="12"
                            height="16"
                            rx="2"
                            stroke="currentColor"
                            stroke-width="2" />
                        <path
                            d="M12 9.5c-1.2-1.4-3-.5-3 .9 0 1.6 1.9 2.7 3 4 1.1-1.3 3-2.4 3-4 0-1.4-1.8-2.3-3-.9z"
                            fill="currentColor" />
                    </svg>
                    <span>Cards</span>
                </button>
            </nav>
        </div>

        <!-- Content Area -->
        <div class="max-h-[65vh] overflow-y-auto">
            <!-- No campaign overlay -->
            <NoCampaignOverlay show={!$activeCampaign} onNavigateHome={handleNavigateHome} />

            {#if view === "oracle"}
                <OracleView
                    {defaultFortunes}
                    {customFortunes}
                    {editMode}
                    on:consultFate={(e) => openFate(e.detail)}
                    on:delete={(e) => deleteFortune(e.detail)}
                    on:reorder={handleReorder}
                    on:createFortune={openCreateFortune}
                    on:toggleEditMode={() => (editMode = !editMode)} />
            {:else if view === "dice"}
                <DiceRoller
                    embedded={true}
                    onClose={() => {
                        /* noop in embedded */
                    }}
                    on:recordFate={handleDiceRecordFate}
                    preset={diceRollPreset}
                    on:clearPreset={onClearPreset} />
            {:else if view === "cards"}
                <CardDealer embedded={true} on:recordFate={handleCardsRecordFate} />
            {/if}
        </div>
    </div>
</SrpgModal>

<!-- Modals for editor and fate consultation -->
<FortuneEditor
    show={showCreateFortune}
    fortune={editingFortune}
    showCampaignField={false}
    onClose={() => (showCreateFortune = false)}
    onSave={saveFortune} />

<FateConsultation
    show={showFate}
    fortune={selectedFortune}
    onClose={() => (showFate = false)}
    onAccept={handleAcceptFate} />

<style>
    /* Oracle Navigation Tabs */
    .oracle-nav {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.5rem;
        background: var(--bg-secondary);
        padding: 0.375rem;
        border-radius: 12px;
        border: 1px solid var(--border-primary);
    }

    .oracle-nav-tab {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.625rem 0.75rem;

        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text-secondary);

        background: transparent;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .oracle-nav-tab:hover:not(.active) {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .oracle-nav-tab.active {
        background: var(--accent-primary);
        color: white;
        box-shadow: 0 2px 8px var(--shadow-md);
    }
</style>
