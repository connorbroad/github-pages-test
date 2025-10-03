<script lang="ts">
    import { loadFortunes, saveFortunes } from "../storage-utils";
    import { onMount } from "svelte";
    import FortuneList from "./components/FortuneList.svelte";
    import FortuneEditor from "./components/FortuneEditor.svelte";
    import OutcomeMappingEditor from "./components/OutcomeMappingEditor.svelte";
    import FateConsultation from "./components/FateConsultation.svelte";
    import { generateId, type Fortune } from "./scripts/oracleTypes";

    export let show = false;
    export let onClose: () => void;

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

{#if show}
    <div
        class="oracle-modal"
        role="button"
        tabindex="0"
        aria-label="Close oracle"
        on:click={() => onClose && onClose()}
        on:keydown={(e) => {
            const tag = (e.target as HTMLElement).tagName;
            const isEditable = (e.target as HTMLElement).isContentEditable;
            if (
                (e.key === "Enter" || e.key === " ") &&
                !["INPUT", "TEXTAREA", "SELECT"].includes(tag) &&
                !isEditable &&
                onClose
            ) {
                onClose();
            }
        }}
    >
        <div
            class="oracle-content"
            role="dialog"
            aria-modal="true"
            on:click|stopPropagation
            tabindex="0"
            on:keydown={(e) => {}}
        >
            <button
                class="modal-close-btn"
                aria-label="Close"
                on:click={() => onClose && onClose()}>&times;</button
            >
            <h2>Oracle</h2>

            <button
                class="oracle-button create-button"
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
    </div>
{/if}

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
    .oracle-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .oracle-content {
        background: #fff;
        margin: 1rem;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        min-width: 300px;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
        text-align: center;
        position: relative;
    }

    .modal-close-btn {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        width: 3rem;
        height: 3rem;
        z-index: 10;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: x-large;
        background: transparent;
        border: none;
        cursor: pointer;
    }

    h2 {
        margin-top: 0;
        color: #333;
    }

    .oracle-button {
        width: 100%;
        padding: 0.75rem 0;
        font-size: 1.1rem;
        border-radius: 6px;
        border: none;
        margin: 0 0;
        background: #1976d2;
        color: #fff;
        cursor: pointer;
        transition: background 0.2s;
    }

    .oracle-button:active {
        background: #1565c0;
    }

    .create-button {
        background: #4caf50;
        margin-bottom: 1.5rem;
    }

    .create-button:active {
        background: #45a049;
    }
</style>
