<script lang="ts">
    import { loadFortunes, saveFortunes, loadGameBlueprints } from "../storage-utils";
    import { activeCampaign } from "../campaign-store";
    import { onMount, createEventDispatcher } from "svelte";
    import FortuneList from "./components/FortuneList.svelte";
    import FortuneEditor from "./components/FortuneEditor.svelte";
    import OutcomeMappingEditor from "./components/OutcomeMappingEditor.svelte";
    import FateConsultation from "./components/FateConsultation.svelte";
    import NoCampaignOverlay from "../NoCampaignOverlay.svelte";
    import { generateId, type Fortune } from "./scripts/oracleTypes";
    import "../solo-rpg-styles.css";

    const dispatch = createEventDispatcher();

    let fortunes: Fortune[] = [];
    let defaultFortunes: Fortune[] = [];
    let customFortunes: Fortune[] = [];
    let selectedFortune: Fortune | null = null;
    let showFate = false;
    let showCreateFortune = false;
    let showEditOutcome = false;

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
        showEditOutcome = false;
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
</script>

<NoCampaignOverlay show={!$activeCampaign} on:navigateHome={handleNavigateHome} />

<div class="oracle-page">

    {#if defaultFortunes.length > 0}
        <div class="fortune-section">
            <h2 class="section-title">Game Fortunes</h2>
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
        class="srpg-b srpg-b-create srpg-b-w-full srpg-b-margin-bottom"
        on:click={openCreateFortune}>+ Create Custom Fortune</button
    >
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
    on:editOutcome={() => (showEditOutcome = true)}
/>

<OutcomeMappingEditor
    show={showEditOutcome}
    fortune={editingFortune}
    on:close={() => (showEditOutcome = false)}
    on:save={(e) => {
        editingFortune = e.detail;
        saveFortune(e);
    }}
/>

<FateConsultation
    show={showFate}
    fortune={selectedFortune}
    on:close={() => (showFate = false)}
    on:accept={() => {
        showFate = false;
        selectedFortune = null;
    }}
/>

<style>
    .oracle-page {
        width: 100%;
        text-align: center;
    }

    .fortune-section {
        margin-bottom: 3rem;
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
