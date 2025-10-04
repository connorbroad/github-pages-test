<script lang="ts">
    import { loadFortunes, saveFortunes } from "../storage-utils";
    import { onMount } from "svelte";
    import FortuneList from "./components/FortuneList.svelte";
    import FortuneEditor from "./components/FortuneEditor.svelte";
    import OutcomeMappingEditor from "./components/OutcomeMappingEditor.svelte";
    import FateConsultation from "./components/FateConsultation.svelte";
    import { generateId, type Fortune } from "./scripts/oracleTypes";
    import "../solo-rpg-styles.css";

    // Props kept for backwards compatibility but not used in page mode

    let fortunes: Fortune[] = [];
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

    let campaigns: string[] = [];

    onMount(() => {
        fortunes = loadFortunes();
    });

    $: {
        campaigns = [...new Set(fortunes.map((f) => f.campaign))].filter(
            Boolean,
        );
    }

    function openCreateFortune() {
        editingFortune = {
            id: generateId(),
            campaign: "",
            title: "",
            outcome: {},
        };
        showCreateFortune = true;
    }

    function saveFortune() {
        const existingIndex = fortunes.findIndex(
            (f) => f.id === editingFortune.id,
        );
        if (existingIndex >= 0) {
            fortunes[existingIndex] = { ...editingFortune };
        } else {
            fortunes = [...fortunes, { ...editingFortune }];
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
</script>

<div class="oracle-page">
    <button
        class="srpg-b srpg-b-create srpg-b-w-full srpg-b-margin-bottom"
        on:click={openCreateFortune}>Create Fortune</button
    >

    <FortuneList
        {fortunes}
        {campaigns}
        on:consultFate={(e) => openFate(e.detail)}
        on:delete={(e) => deleteFortune(e.detail)}
        on:reorder={handleReorder}
    />
</div>

<FortuneEditor
    show={showCreateFortune}
    fortune={editingFortune}
    {campaigns}
    on:close={() => (showCreateFortune = false)}
    on:save={saveFortune}
    on:editOutcome={() => (showEditOutcome = true)}
/>

<OutcomeMappingEditor
    show={showEditOutcome}
    fortune={editingFortune}
    on:close={() => (showEditOutcome = false)}
    on:save={saveFortune}
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
</style>
