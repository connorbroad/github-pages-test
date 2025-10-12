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

    onMount(() => {
        fortunes = loadFortunes();
    });

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
                    <span class="nav-icon">🔮</span>
                    <span class="nav-label">Oracle</span>
                </button>
                <button class="nav-btn {view === 'dice' ? 'active' : ''}" on:click={() => go('dice')} aria-label="Dice Roller">
                    <span class="nav-icon">🎲</span>
                    <span class="nav-label">Dice</span>
                </button>
                <button class="nav-btn {view === 'cards' ? 'active' : ''}" on:click={() => go('cards')} aria-label="Card Dealer">
                    <span class="nav-icon">🃏</span>
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
                        <h2 class="section-title">Campaign Fortunes</h2>
                        <button class="srpg-b srpg-b-create srpg-b-w-full" on:click={openCreateFortune}>
                            + Create Campaign Fortune
                        </button>
                        {#if customFortunes.length > 0}
                            <div class="fortune-list-container">
                                <FortuneList
                                    fortunes={customFortunes}
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
                    <h2 class="tool-title">Dice Roller</h2>
                    <DiceRoller embedded={true} show={true} onClose={() => { /* noop in embedded */ }} />
                </div>
            {:else if view === 'cards'}
                <div class="tool-page">
                    <h2 class="tool-title">Card Dealer</h2>
                    <CardDealer embedded={true} show={true} onClose={() => { /* noop in embedded */ }} />
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
        background: #fff;
        padding: 0.5rem 0.25rem;
        border-bottom: 1px solid #e5e7eb;
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.5rem;
    }
    .character-selector-wrapper {
        width: 100%;
        display: flex;
        justify-content: center;
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
        padding: 0.5rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        background: #f9fafb;
        color: #374151;
        font-weight: 600;
    }
    .nav-btn.active {
        background: #3d5d82;
        color: #fff;
        border-color: #3d5d82;
    }
    .nav-icon { font-size: 1.1rem; }
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
    .section-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #333;
        margin: 0 0 0.5rem 0;
        padding-bottom: 0.25rem;
        border-bottom: 2px solid #e5e7eb;
    }
    .fortune-list-container {
        max-height: 28rem;
        overflow: auto;
        padding: 0.25rem;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background: #fff;
    }
    .no-fortunes {
        color: #6b7280;
        font-style: italic;
        padding: 1rem;
        background: #f9fafb;
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
    .tool-page-footer { margin-top: 0.5rem; }

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
