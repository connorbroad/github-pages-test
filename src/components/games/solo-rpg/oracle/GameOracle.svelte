<script context="module" lang="ts">
    export type OracleView = "oracle" | "dice" | "cards";
    let lastView: OracleView = "dice";
</script>

<script lang="ts">
    import {
        loadFortunes,
        saveFortunes,
        loadGameBlueprints,
        loadChronicleEntries,
        saveChronicleEntries,
        loadActiveCharacterId,
    } from "../data/storage-utils";
    import type { FortuneResultData } from "../data/storage-utils";
    import { activeCampaign } from "../game-management/campaign-store";
    import { onMount, createEventDispatcher } from "svelte";
    import FortuneList from "./components/FortuneList.svelte";
    import FortuneEditor from "./components/FortuneEditor.svelte";
    import FateConsultation from "./components/FateConsultation.svelte";
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

    const dispatch = createEventDispatcher();

    let fortunes: Fortune[] = [];
    let defaultFortunes: Fortune[] = [];
    let customFortunes: Fortune[] = [];
    let selectedFortune: Fortune | null = null;

    // Persist view selection
    function updateLastView(v: OracleView) {
        lastView = v;
    }
    $: updateLastView(view);

    // View state for in-modal navigation
    let view: OracleView = lastView;

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

    function saveFortune(event: CustomEvent<Fortune>) {
        const fortune = event.detail;
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
        dispatch("navigateHome");
    }

    function handleAcceptFate(event: CustomEvent<FortuneResultData>) {
        const resultData = event.detail;

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

        showFate = false;
        selectedFortune = null;

        // Navigate to story page
        dispatch("navigateToStory");
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

        // Navigate to story page
        dispatch("navigateToStory");
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

        // Navigate to story page
        dispatch("navigateToStory");
    }

    function handleClose() {
        dispatch("clearPreset");
        dispatch("close");
    }

    function go(viewName: OracleView) {
        view = viewName;
    }
</script>

<SrpgModal show={true} ariaLabel="Close Oracle" maxWidth="420px" on:close={handleClose}>
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
            <NoCampaignOverlay show={!$activeCampaign} on:navigateHome={handleNavigateHome} />

            {#if view === "oracle"}
                <div class="flex flex-col gap-5">
                    <!-- Default Fortunes Section -->
                    {#if defaultFortunes.length > 0}
                        <section class="oracle-section">
                            <h2 class="oracle-section-title">Fortunes</h2>
                            <div class="oracle-fortune-list">
                                <FortuneList
                                    fortunes={defaultFortunes}
                                    allowReorder={false}
                                    allowDelete={false}
                                    on:consultFate={(e) => openFate(e.detail)}
                                    on:delete={(e) => deleteFortune(e.detail)}
                                    on:reorder={handleReorder} />
                            </div>
                        </section>
                    {/if}

                    <!-- Campaign Fortunes Section -->
                    <section class="oracle-section">
                        <div class="mb-3 flex items-center justify-between gap-3">
                            <h2 class="oracle-section-title mb-0">Campaign Fortunes</h2>
                            <button
                                class="srpg-b srpg-b-simple srpg-b-sm"
                                on:click={() => (editMode = !editMode)}
                                aria-label={editMode ? "Exit edit mode" : "Enter edit mode"}>
                                {#if editMode}
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="16"
                                        height="16"
                                        aria-hidden="true"
                                        class="shrink-0">
                                        <path
                                            fill="currentColor"
                                            d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                    </svg>
                                    <span>Done</span>
                                {:else}
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="16"
                                        height="16"
                                        aria-hidden="true"
                                        class="shrink-0">
                                        <path
                                            fill="currentColor"
                                            d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                    </svg>
                                    <span>Edit</span>
                                {/if}
                            </button>
                        </div>

                        <button
                            class="srpg-b srpg-b-create srpg-b-w-full"
                            on:click={openCreateFortune}>
                            <svg
                                viewBox="0 0 24 24"
                                width="18"
                                height="18"
                                fill="none"
                                aria-hidden="true"
                                class="shrink-0">
                                <path
                                    d="M12 5v14M5 12h14"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round" />
                            </svg>
                            Create Campaign Fortune
                        </button>

                        {#if customFortunes.length > 0}
                            <div class="oracle-fortune-list mt-3">
                                <FortuneList
                                    fortunes={customFortunes}
                                    allowReorder={editMode}
                                    allowDelete={editMode}
                                    on:consultFate={(e) => openFate(e.detail)}
                                    on:delete={(e) => deleteFortune(e.detail)}
                                    on:reorder={handleReorder} />
                            </div>
                        {:else}
                            <p class="mt-3 mb-0 text-center text-sm text-(--text-muted) italic">
                                No campaign fortunes yet. Create one above!
                            </p>
                        {/if}
                    </section>
                </div>
            {:else if view === "dice"}
                <DiceRoller
                    embedded={true}
                    onClose={() => {
                        /* noop in embedded */
                    }}
                    on:recordFate={handleDiceRecordFate}
                    preset={diceRollPreset}
                    on:clearPreset={() => dispatch("clearPreset")} />
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
    on:close={() => (showCreateFortune = false)}
    on:save={saveFortune} />

<FateConsultation
    show={showFate}
    fortune={selectedFortune}
    on:close={() => (showFate = false)}
    on:accept={handleAcceptFate} />

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

    /* Oracle Sections */
    .oracle-section {
        display: flex;
        flex-direction: column;
    }

    .oracle-section-title {
        font-size: 1rem;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 0.75rem 0;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid var(--border-primary);
    }

    /* Fortune List Container */
    .oracle-fortune-list {
        background: var(--card-bg);
        border: 1px solid var(--card-border);
        border-radius: 10px;
        padding: 0.5rem;
        max-height: 280px;
        overflow-y: auto;
    }
</style>
