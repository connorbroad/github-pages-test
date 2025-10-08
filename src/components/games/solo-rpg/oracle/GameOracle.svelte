<script lang="ts">
    import { loadFortunes, saveFortunes, loadGameBlueprints, loadChronicleEntries, saveChronicleEntries, loadActiveCharacterId } from "../storage-utils";
    import type { FortuneResultData } from "../storage-utils";
    import { activeCampaign } from "../campaign-store";
    import { onMount, createEventDispatcher } from "svelte";
    import FortuneList from "./components/FortuneList.svelte";
    import FortuneEditor from "./components/FortuneEditor.svelte";
    import FateConsultation from "./components/FateConsultation.svelte";
    import NoCampaignOverlay from "../NoCampaignOverlay.svelte";
    import { generateId, type Fortune } from "./scripts/oracleTypes";
    import "../solo-rpg-styles.css";
    import CardDealer from "../card-dealer/CardDealer.svelte";
    import DiceRoller from "../dice-roller/DiceRoller.svelte";

    const dispatch = createEventDispatcher();

    let fortunes: Fortune[] = [];
    let defaultFortunes: Fortune[] = [];
    let customFortunes: Fortune[] = [];
    let selectedFortune: Fortune | null = null;
    let showFate = false;
    let showCreateFortune = false;
    let showCardDealer = false;
    let showDiceRoller = false;

    // Create/Edit Fortune state
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
</script>

<NoCampaignOverlay show={!$activeCampaign} on:navigateHome={handleNavigateHome} />

<div class="oracle-page">
    <div class="button-group">
        <button class="srpg-b srpg-b-normal" aria-label="Open Dice Roller" on:click={() => (showDiceRoller = true)}>
            <svg xmlns="http://www.w3.org/2000/svg" stroke-width="2" viewBox="0 0 48 48" width='1.5em' height='1.5em' {...$$props}><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="m39.227 38.684l5.111-20.5L29.111 3.5L8.773 9.316l-5.111 20.5L18.889 44.5z"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="m33.729 34.984l10.61-16.8l-17.151-6.97L8.773 9.316l1.48 19.815L18.89 44.5z"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M33.729 34.984L10.254 29.13l16.934-17.916zm-6.541-23.77L29.111 3.5m4.618 31.484l5.498 3.7M10.254 29.13l-6.592.685"/></svg>
        </button>
        <button class="srpg-b srpg-b-normal" aria-label="Open Card Dealer" on:click={() => (showCardDealer = true)}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" width='1.3em' height='1.3em' {...$$props}><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M6.546.857a.475.475 0 0 1 .581-.335l6.02 1.612a.475.475 0 0 1 .337.581l-2.31 8.618a.475.475 0 0 1-.582.335l-6.02-1.612a.475.475 0 0 1-.336-.581z"/><path d="M6.108 2.535L.852 3.944a.475.475 0 0 0-.336.581l2.308 8.618a.475.475 0 0 0 .582.335l3.01-.806"/></g></svg>
        </button>
    </div>

    {#if defaultFortunes.length > 0}
        <div class="fortune-section">
            <h2 class="section-title">Fortunes</h2>
            <FortuneList
                fortunes={defaultFortunes}
                allowReorder={false}
                allowDelete={false}
                on:consultFate={(e) => openFate(e.detail)}
                on:delete={(e) => deleteFortune(e.detail)}
                on:reorder={handleReorder}
            />
        </div>
    {/if}

    <div class="fortune-section">
        <h2 class="section-title">Custom Fortunes</h2>

    <button
        class="srpg-b srpg-b-create srpg-b-w-full"
        on:click={openCreateFortune}>
        + Create Custom Fortune
    </button>
        {#if customFortunes.length > 0}
            <FortuneList
                fortunes={customFortunes}
                on:consultFate={(e) => openFate(e.detail)}
                on:delete={(e) => deleteFortune(e.detail)}
                on:reorder={handleReorder}
            />
        {:else}
            <p class="no-fortunes">No custom fortunes yet. Click the button above to create one.</p>
        {/if}
    </div>
</div>

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

<CardDealer
    show={showCardDealer}
    onClose={() => (showCardDealer = false)}
    on:close={() => (showCardDealer = false)}
/>

<DiceRoller
    show={showDiceRoller}
    onClose={() => (showDiceRoller = false)}
    on:close={() => (showDiceRoller = false)}
/>

<style>
    .oracle-page {
        width: 100%;
        text-align: center;
    }

    .button-group {
        display: flex;
        justify-content: center;
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .fortune-section {
        margin-bottom: 2rem;
    }

    .section-title {
        font-size: 1.5rem;
        font-weight: 600;
        color: #333;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #e5e7eb;
    }

    .no-fortunes {
        color: #999;
        font-style: italic;
        padding: 2rem;
        background: #f9fafb;
        border-radius: 8px;
        margin: 0;
    }
</style>
