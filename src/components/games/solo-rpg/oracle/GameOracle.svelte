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

<SrpgModal show={true} ariaLabel="Close Oracle" maxWidth="400px" on:close={handleClose}>
    <div class="flex flex-col gap-3">
        <!-- Sticky utility header -->
        <div
            class="bg-bg-primary border-border-primary sticky top-0 z-2 grid grid-cols-1 gap-3 rounded-2xl border-b p-2">
            <div class="flex min-w-[150px] justify-center">
                <CharacterSelector {preselectedCharacterId} bind:currentDisplayedCharacterId />
            </div>
            <nav class="grid grid-cols-3 gap-2" aria-label="Oracle navigation">
                <button
                    class="border-border-primary bg-bg-secondary text-text-primary hover:bg-bg-tertiary focus-visible:ring-shadow-md focus-visible:border-accent-primary inline-flex items-center justify-center gap-2 rounded-[10px] border px-[0.8rem] py-[0.55rem] font-semibold transition-all duration-200 focus-visible:ring-2 focus-visible:outline-none active:translate-y-px {view ===
                    'oracle'
                        ? 'bg-accent-primary text-text-inverse border-accent-primary shadow-md'
                        : ''}"
                    on:click={() => go("oracle")}
                    aria-label="Oracle">
                    <span class="inline-flex text-[1.1rem] leading-none" aria-hidden="true">
                        <!-- Crystal ball icon -->
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
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
                    </span>
                    <span class="text-[0.95rem]">Oracle</span>
                </button>
                <button
                    class="border-border-primary bg-bg-secondary text-text-primary hover:bg-bg-tertiary focus-visible:ring-shadow-md focus-visible:border-accent-primary inline-flex items-center justify-center gap-2 rounded-[10px] border px-[0.8rem] py-[0.55rem] font-semibold transition-all duration-200 focus-visible:ring-2 focus-visible:outline-none active:translate-y-px {view ===
                    'dice'
                        ? 'bg-accent-primary text-text-inverse border-accent-primary shadow-md'
                        : ''}"
                    on:click={() => go("dice")}
                    aria-label="Dice Roller">
                    <span class="inline-flex text-[1.1rem] leading-none" aria-hidden="true">
                        <!-- Dice icon -->
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
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
                    </span>
                    <span class="text-[0.95rem]">Dice</span>
                </button>
                <button
                    class="border-border-primary bg-bg-secondary text-text-primary hover:bg-bg-tertiary focus-visible:ring-shadow-md focus-visible:border-accent-primary inline-flex items-center justify-center gap-2 rounded-[10px] border px-[0.8rem] py-[0.55rem] font-semibold transition-all duration-200 focus-visible:ring-2 focus-visible:outline-none active:translate-y-px {view ===
                    'cards'
                        ? 'bg-accent-primary text-text-inverse border-accent-primary shadow-md'
                        : ''}"
                    on:click={() => go("cards")}
                    aria-label="Card Dealer">
                    <span class="inline-flex text-[1.1rem] leading-none" aria-hidden="true">
                        <!-- Card icon -->
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
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
                    </span>
                    <span class="text-[0.95rem]">Cards</span>
                </button>
            </nav>
        </div>

        <!-- Scrollable body -->
        <div class="max-h-[70vh] overflow-y-auto p-0 px-2 pb-2 md:max-h-[60vh]">
            <!-- No campaign overlay always visible at top of body -->
            <NoCampaignOverlay show={!$activeCampaign} on:navigateHome={handleNavigateHome} />

            {#if view === "oracle"}
                <div class="w-full">
                    {#if defaultFortunes.length > 0}
                        <section class="mb-5">
                            <h2
                                class="text-text-primary border-border-primary m-0 flex-1 border-b-2 pb-1 text-xl font-bold">
                                Fortunes
                            </h2>
                            <div
                                class="border-border-primary bg-card-bg max-h-112 overflow-auto rounded-xl border p-1">
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

                    <section class="mb-5">
                        <div class="mb-2 flex items-center justify-between gap-3">
                            <h2
                                class="text-text-primary border-border-primary m-0 flex-1 border-b-2 pb-1 text-xl font-bold">
                                Campaign Fortunes
                            </h2>
                            <button
                                class="border-border-primary bg-bg-secondary text-text-primary hover:bg-bg-tertiary hover:border-border-secondary inline-flex cursor-pointer items-center gap-[0.4rem] rounded-lg border px-[0.65rem] py-[0.4rem] text-[0.9rem] font-medium transition-all duration-200 active:translate-y-px"
                                on:click={() => (editMode = !editMode)}
                                aria-label={editMode ? "Exit edit mode" : "Enter edit mode"}>
                                {#if editMode}
                                    <!-- Done/Check icon -->
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="18"
                                        height="18"
                                        aria-hidden="true"
                                        class="shrink-0">
                                        <path
                                            fill="currentColor"
                                            d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                    </svg>
                                    <span>Done</span>
                                {:else}
                                    <!-- Edit/Pencil icon -->
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="18"
                                        height="18"
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
                            class="border-border-primary bg-accent-success hover:bg-accent-success-hover active:bg-accent-success-active flex w-[300px] cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
                            on:click={openCreateFortune}>
                            + Create Campaign Fortune
                        </button>
                        {#if customFortunes.length > 0}
                            <div
                                class="border-border-primary bg-card-bg max-h-112 overflow-auto rounded-xl border p-1">
                                <FortuneList
                                    fortunes={customFortunes}
                                    allowReorder={editMode}
                                    allowDelete={editMode}
                                    on:consultFate={(e) => openFate(e.detail)}
                                    on:delete={(e) => deleteFortune(e.detail)}
                                    on:reorder={handleReorder} />
                            </div>
                        {:else}
                            <p class="bg-bg-secondary mt-2 mb-0 rounded-lg p-4 italic">
                                No campaign fortunes yet. Click the button above to create one.
                            </p>
                        {/if}
                    </section>
                </div>
            {:else if view === "dice"}
                <div class="flex flex-col gap-3">
                    <DiceRoller
                        embedded={true}
                        onClose={() => {
                            /* noop in embedded */
                        }}
                        on:recordFate={handleDiceRecordFate}
                        preset={diceRollPreset}
                        on:clearPreset={() => dispatch("clearPreset")} />
                </div>
            {:else if view === "cards"}
                <div class="flex flex-col gap-3">
                    <CardDealer embedded={true} on:recordFate={handleCardsRecordFate} />
                </div>
            {/if}
        </div>
    </div>
</SrpgModal>

<!-- Modals kept as-is for editor and fate consultation -->
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
