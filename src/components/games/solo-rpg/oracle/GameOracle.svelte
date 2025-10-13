<script lang="ts">
    import { loadFortunes, saveFortunes, loadGameBlueprints, loadChronicleEntries, saveChronicleEntries, loadActiveCharacterId } from "../data/storage-utils";
    import type { FortuneResultData } from "../data/storage-utils";
    import { activeCampaign } from "../game-management/campaign-store";
    import { onMount, createEventDispatcher } from "svelte";
    import FortuneList from "./components/FortuneList.svelte";
    import FortuneEditor from "./components/FortuneEditor.svelte";
    import FateConsultation from "./components/FateConsultation.svelte";
    import NoCampaignOverlay from "../NoCampaignOverlay.svelte";
    import { generateId, type Fortune } from "./scripts/oracleTypes";
    import "../solo-rpg-styles.css";
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

    const dispatch = createEventDispatcher();

    let fortunes: Fortune[] = [];
    let defaultFortunes: Fortune[] = [];
    let customFortunes: Fortune[] = [];
    let selectedFortune: Fortune | null = null;

    // View state for in-modal navigation
    type OracleView = "oracle" | "dice" | "cards";
    let view: OracleView = "oracle";

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
            const activeBlueprint = blueprints.find(
                (b) => b.id === $activeCampaign.blueprintId
            );
            
            if (activeBlueprint && activeBlueprint.defaultFortunes) {
                defaultFortunes = activeBlueprint.defaultFortunes;
            } else {
                defaultFortunes = [];
            }
            
            // Filter custom fortunes to only show ones for the active campaign
            customFortunes = fortunes.filter(f => f.campaign === $activeCampaign.id);
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
        const existingIndex = fortunes.findIndex(
            (f) => f.id === fortune.id,
        );
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

    function handleReorder(
        event: CustomEvent<{ draggedId: string; targetId: string }>,
    ) {
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
        dispatch('navigateHome');
    }

    function handleAcceptFate(event: CustomEvent<FortuneResultData>) {
        const resultData = event.detail;
        
        if (!$activeCampaign) return;

        // Create a chronicle entry for this fortune result
        const chronicleEntries = loadChronicleEntries();
        const activeCharacterId = loadActiveCharacterId();
        
        const newEntry = {
            id: generateId(),
            campaignId: $activeCampaign.id,
            timestamp: Date.now(),
            type: "fortune" as const,
            content: "", // Empty content, fortune data is stored separately
            fortuneId: selectedFortune?.id,
            fortuneData: resultData,
            characterId: activeCharacterId || undefined
        };

        chronicleEntries.push(newEntry);
        saveChronicleEntries(chronicleEntries);

        showFate = false;
        selectedFortune = null;

        // Navigate to story page
        dispatch('navigateToStory');
    }

    function handleDiceRecordFate(event: CustomEvent) {
        const diceData = event.detail;
        
        if (!$activeCampaign) return;

        const chronicleEntries = loadChronicleEntries();
        const activeCharacterId = loadActiveCharacterId();
        
        // Build content string with optional check name
        let content = "";
        if (diceData.checkName) {
            content = `${diceData.checkName} check: Rolled ${diceData.numDice}d${diceData.numSides}${diceData.modifier !== 0 ? (diceData.modifier > 0 ? '+' : '') + diceData.modifier : ''}: ${diceData.result}`;
        } else {
            content = `Rolled ${diceData.numDice}d${diceData.numSides}${diceData.modifier !== 0 ? (diceData.modifier > 0 ? '+' : '') + diceData.modifier : ''}: ${diceData.result}`;
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
                checkName: diceData.checkName
            },
            characterId: diceData.characterId || activeCharacterId || undefined
        };

        chronicleEntries.push(newEntry);
        saveChronicleEntries(chronicleEntries);

        // Navigate to story page
        dispatch('navigateToStory');
    }

    function handleCardsRecordFate(event: CustomEvent) {
        const cardsData = event.detail;
        
        if (!$activeCampaign) return;

        const chronicleEntries = loadChronicleEntries();
        const activeCharacterId = loadActiveCharacterId();
        
        const cardsList = cardsData.cards.map((c: any) => `${c.rank} of ${c.suit}`).join(', ');
        
        const newEntry = {
            id: generateId(),
            campaignId: $activeCampaign.id,
            timestamp: Date.now(),
            type: "cards" as const,
            content: `Drew ${cardsData.cards.length} card${cardsData.cards.length > 1 ? 's' : ''}: ${cardsList}`,
            cardsData: {
                cards: cardsData.cards
            },
            characterId: activeCharacterId || undefined
        };

        chronicleEntries.push(newEntry);
        saveChronicleEntries(chronicleEntries);

        // Navigate to story page
        dispatch('navigateToStory');
    }

    function handleClose() {
        dispatch('close');
    }

    function go(viewName: OracleView) {
        view = viewName;
    }
</script>
 
<SrpgModal show={true} ariaLabel="Close Oracle" maxWidth="860px" on:close={handleClose}>
    <div class="oracle-modal">
        <!-- Sticky utility header -->
        <div class="oracle-sticky-header">
            <div class="character-selector-wrapper">
                <CharacterSelector />
            </div>
            <nav class="oracle-nav" aria-label="Oracle navigation">
                <button class="nav-btn {view === 'oracle' ? 'active' : ''}" on:click={() => go('oracle')} aria-label="Oracle">
                    <span class="nav-icon" aria-hidden="true">
                        <!-- Crystal ball icon -->
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                            <circle cx="12" cy="10" r="6" stroke="currentColor" stroke-width="2" />
                            <path d="M6 18h12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                            <path d="M8.5 6.5c.6-1 1.7-1.7 3-1.9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </span>
                    <span class="nav-label">Oracle</span>
                </button>
                <button class="nav-btn {view === 'dice' ? 'active' : ''}" on:click={() => go('dice')} aria-label="Dice Roller">
                    <span class="nav-icon" aria-hidden="true">
                        <!-- Dice icon -->
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                            <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" stroke-width="2"/>
                            <circle cx="9" cy="9" r="1.5" fill="currentColor"/>
                            <circle cx="15" cy="15" r="1.5" fill="currentColor"/>
                        </svg>
                    </span>
                    <span class="nav-label">Dice</span>
                </button>
                <button class="nav-btn {view === 'cards' ? 'active' : ''}" on:click={() => go('cards')} aria-label="Card Dealer">
                    <span class="nav-icon" aria-hidden="true">
                        <!-- Card icon -->
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                            <rect x="6" y="4" width="12" height="16" rx="2" stroke="currentColor" stroke-width="2"/>
                            <path d="M12 9.5c-1.2-1.4-3-.5-3 .9 0 1.6 1.9 2.7 3 4 1.1-1.3 3-2.4 3-4 0-1.4-1.8-2.3-3-.9z" fill="currentColor"/>
                        </svg>
                    </span>
                    <span class="nav-label">Cards</span>
                </button>
            </nav>
        </div>

        <!-- Scrollable body -->
        <div class="oracle-body">
            <!-- No campaign overlay always visible at top of body -->
            <NoCampaignOverlay show={!$activeCampaign} on:navigateHome={handleNavigateHome} />

            {#if view === 'oracle'}
                <div class="oracle-page">
                    {#if defaultFortunes.length > 0}
                        <section class="fortune-section">
                            <h2 class="section-title">Fortunes</h2>
                            <div class="fortune-list-container">
                                <FortuneList
                                    fortunes={defaultFortunes}
                                    allowReorder={false}
                                    allowDelete={false}
                                    on:consultFate={(e) => openFate(e.detail)}
                                    on:delete={(e) => deleteFortune(e.detail)}
                                    on:reorder={handleReorder}
                                />
                            </div>
                        </section>
                    {/if}

                    <section class="fortune-section">
                        <div class="section-header">
                            <h2 class="section-title">Campaign Fortunes</h2>
                            <button 
                                class="edit-toggle-btn" 
                                on:click={() => editMode = !editMode}
                                aria-label={editMode ? "Exit edit mode" : "Enter edit mode"}
                            >
                                {#if editMode}
                                    <!-- Done/Check icon -->
                                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                                        <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                    </svg>
                                    <span>Done</span>
                                {:else}
                                    <!-- Edit/Pencil icon -->
                                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                                        <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                    </svg>
                                    <span>Edit</span>
                                {/if}
                            </button>
                        </div>
                        <button class="srpg-b srpg-b-create srpg-b-w-lg" on:click={openCreateFortune}>
                            + Create Campaign Fortune
                        </button>
                        {#if customFortunes.length > 0}
                            <div class="fortune-list-container">
                                <FortuneList
                                    fortunes={customFortunes}
                                    allowReorder={editMode}
                                    allowDelete={editMode}
                                    on:consultFate={(e) => openFate(e.detail)}
                                    on:delete={(e) => deleteFortune(e.detail)}
                                    on:reorder={handleReorder}
                                />
                            </div>
                        {:else}
                            <p class="no-fortunes">No campaign fortunes yet. Click the button above to create one.</p>
                        {/if}
                    </section>
                </div>
            {:else if view === 'dice'}
                <div class="tool-page"> 
                    <DiceRoller 
                        embedded={true} 
                        onClose={() => { /* noop in embedded */ }} 
                        on:recordFate={handleDiceRecordFate}
                        preset={diceRollPreset}
                        on:clearPreset={() => dispatch("clearPreset")}
                    />
                </div>
            {:else if view === 'cards'}
                <div class="tool-page"> 
                    <CardDealer 
                        embedded={true} 
                        on:recordFate={handleCardsRecordFate}
                    />
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
    on:save={saveFortune}
/>

<FateConsultation
    show={showFate}
    fortune={selectedFortune}
    on:close={() => (showFate = false)}
    on:accept={handleAcceptFate}
/>

<style>
    /* Modal layout */
    .oracle-modal {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    /* Sticky header with character selector and nav */
    .oracle-sticky-header {
        position: sticky;
        top: 0;
        z-index: 2;
        background: var(--bg-primary);
        padding: 0.5rem ;
        border-bottom: 1px solid var(--border-primary);
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.0rem;
        border-radius: 16px;
    }
    .character-selector-wrapper { 
        display: flex;
        justify-content: center;
        min-width: 150px; 
    }
    .oracle-nav {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.5rem;
    }
    .nav-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.55rem 0.8rem;
        border: 1px solid var(--border-primary);
        border-radius: 10px;
        background: var(--bg-secondary);
        color: var(--text-primary);
        font-weight: 600;
        transition: background 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.05s;
    }
    .nav-btn:hover { background: var(--bg-tertiary); }
    .nav-btn:active { transform: translateY(1px); }
    .nav-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--shadow-md); border-color: var(--accent-primary); }
    .nav-btn.active {
        background: var(--accent-primary);
        color: var(--text-inverse);
        border-color: var(--accent-primary);
        box-shadow: 0 2px 8px var(--shadow-md);
    }
    .nav-icon { font-size: 1.1rem; line-height: 0; display: inline-flex; }
    .nav-label { font-size: 0.95rem; }

    /* Scrollable body within modal */
    .oracle-body {
        max-height: 70vh;
        overflow-y: auto;
        padding: 0 0.5rem 0.5rem 0.5rem;
    }
    @media (max-width: 768px) {
        .oracle-body { max-height: 60vh; }
    }

    .oracle-page { width: 100%; }

    .fortune-section { margin-bottom: 1.25rem; }
    .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
    }
    .section-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0;
        padding-bottom: 0.25rem;
        border-bottom: 2px solid var(--border-primary);
        flex: 1;
    }
    .edit-toggle-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.4rem 0.65rem;
        border: 1px solid var(--border-primary);
        border-radius: 8px;
        background: var(--bg-secondary);
        color: var(--text-primary);
        font-size: 0.9rem;
        font-weight: 500;
        transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.05s;
        cursor: pointer;
    }
    .edit-toggle-btn:hover {
        background: var(--bg-tertiary);
        border-color: var(--border-secondary);
    }
    .edit-toggle-btn:active {
        transform: translateY(1px);
    }
    .edit-toggle-btn svg {
        flex-shrink: 0;
    }
    .fortune-list-container {
        max-height: 28rem;
        overflow: auto;
        padding: 0.25rem;
        border: 1px solid var(--border-primary);
        border-radius: 12px;
        background: var(--card-bg);
    }
    .no-fortunes {
        color: var(--text-muted);
        font-style: italic;
        padding: 1rem;
        background: var(--bg-secondary);
        border-radius: 8px;
        margin: 0.5rem 0 0 0;
    }

    /* Embedded tool pages */
    .tool-page {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    .tool-title {
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0.5rem 0 0 0;
        text-align: center;
    }

    /* Desktop tweaks */
    @media (min-width: 768px) {
        .oracle-sticky-header {
            grid-template-columns: 1fr auto; /* selector | nav */
            align-items: center;
        }
        .oracle-nav { max-width: 420px; justify-self: end; }
        .fortune-list-container { max-height: 32rem; }
        .section-title { font-size: 1.35rem; }
    }

    @media (min-width: 1024px) {
        .oracle-body { max-height: 70vh; }
    }
</style>
