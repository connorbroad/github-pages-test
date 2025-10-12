<script lang="ts">
    /**
     * Game Blueprint Editor Component
     * Modal for creating/editing game blueprints with default fortunes
     */
    import type { GameBlueprint, Fortune } from "../oracle/scripts/oracleTypes";
    import { generateId } from "../oracle/scripts/oracleTypes";
    import { createEventDispatcher } from "svelte";
    import SrpgModal from "../shared/modal/SrpgModal.svelte";
    import FortuneEditor from "../oracle/components/FortuneEditor.svelte";
    import "../solo-rpg-styles.css";

    export let show = false;
    export let blueprint: GameBlueprint;

    const dispatch = createEventDispatcher();

    $: isEditing = blueprint.id && blueprint.title !== "";

    // Fortune editing state
    let showFortuneEditor = false;
    let editingFortune: Fortune = {
        id: "",
        title: "",
        outcome: {},
    };
    let editingFortuneIndex: number = -1;

    function handleClose() {
        dispatch("close");
    }

    function handleSave() {
        dispatch("save", blueprint);
    }

    function openCreateFortune() {
        editingFortune = {
            id: generateId(),
            title: "",
            outcome: {},
        };
        editingFortuneIndex = -1;
        showFortuneEditor = true;
    }

    function openEditFortune(index: number) {
        editingFortune = { ...blueprint.defaultFortunes[index] };
        editingFortuneIndex = index;
        showFortuneEditor = true;
    }

    function saveFortune(event: CustomEvent<Fortune>) {
        const fortune = event.detail;
        if (editingFortuneIndex >= 0) {
            blueprint.defaultFortunes[editingFortuneIndex] = fortune;
        } else {
            blueprint.defaultFortunes = [...blueprint.defaultFortunes, fortune];
        }
        showFortuneEditor = false;
    }

    function deleteFortune(index: number) {
        if (confirm("Are you sure you want to delete this fortune?")) {
            blueprint.defaultFortunes = blueprint.defaultFortunes.filter(
                (_, i) => i !== index,
            );
        }
    }
</script>

{#if show}
    <SrpgModal
        {show}
        ariaLabel="Close game blueprint modal"
        on:close={handleClose}
    >
        <h2>{isEditing ? "Edit Game" : "Create Game"}</h2>

        <div class="form-group">
            <label for="blueprint-title">Game Title:</label>
            <input
                id="blueprint-title"
                type="text"
                bind:value={blueprint.title}
                placeholder="Enter game title..."
            />
        </div>

        <div class="form-group">
            <h3>Default Fortunes</h3>
            <button
                class="srpg-b srpg-b-create srpg-b-w-full"
                on:click={openCreateFortune}
            >
                + Add Fortune
            </button>

            {#if blueprint.defaultFortunes.length > 0}
                <div class="fortunes-list">
                    {#each blueprint.defaultFortunes as fortune, index}
                        <div class="fortune-item">
                            <div class="fortune-info">
                                <strong>{fortune.title || "Untitled"}</strong>
                            </div>
                            <div class="fortune-actions">
                                <button
                                    class="srpg-b srpg-b-sm srpg-b-normal"
                                    on:click={() => openEditFortune(index)}
                                >
                                    Edit
                                </button>
                                <button
                                    class="srpg-b srpg-b-sm srpg-b-delete"
                                    on:click={() => deleteFortune(index)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>
            {:else}
                <p class="empty-state">
                    No fortunes added yet. Click "Add Fortune" to create one.
                </p>
            {/if}
        </div>

        <hr class="divider" />
        <button
            class="srpg-b srpg-b-create srpg-b-w-full"
            on:click={handleSave}
        >
            Save Game Blueprint
        </button>
    </SrpgModal>
{/if}

<FortuneEditor
    show={showFortuneEditor}
    fortune={editingFortune}
    campaigns={[blueprint.title]}
    showCampaignField={false}
    on:close={() => (showFortuneEditor = false)}
    on:save={saveFortune}
/>

<style>
    h2 {
        margin-top: 0;
        color: var(--text-primary);
    }

    h3 {
        margin-top: 0;
        margin-bottom: 0.5rem;
        color: var(--text-secondary);
        font-size: 1.1rem;
    }

    .form-group {
        margin-bottom: 1.5rem;
        text-align: left;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.25rem;
        font-weight: 500;
        color: var(--text-secondary);
    }

    .form-group input[type="text"] {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid var(--input-border);
        border-radius: 4px;
        font-size: 1rem;
        box-sizing: border-box;
        background-color: var(--input-bg);
        color: var(--input-text);
    }

    .form-group input[type="text"]:focus {
        outline: none;
        border-color: var(--input-border-focus);
    }

    .fortunes-list {
        margin-top: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .fortune-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        background: var(--bg-secondary);
        border: 1px solid var(--border-primary);
        border-radius: 6px;
        gap: 1rem;
    }

    .fortune-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .fortune-info strong {
        color: var(--text-primary);
    }

    .fortune-actions {
        display: flex;
        gap: 0.5rem;
    }

    .empty-state {
        text-align: center;
        color: var(--text-muted);
        font-style: italic;
        margin-top: 1rem;
        padding: 1rem;
        background: var(--bg-secondary);
        border-radius: 6px;
    }

    .divider {
        border: none;
        border-top: 1px solid var(--divider);
        margin: 1.5rem 0;
    }

    @media (max-width: 600px) {
        .fortune-item {
            flex-direction: column;
            align-items: stretch;
        }

        .fortune-actions {
            justify-content: stretch;
        }

        .fortune-actions button {
            flex: 1;
        }
    }
</style>
