<script lang="ts">
    /**
     * Game Blueprint Editor Component
     * Modal for creating/editing game blueprints with default fortunes
     */
    import type { GameBlueprint, Fortune } from "../oracle/scripts/oracleTypes";
    import { generateId } from "../oracle/scripts/oracleTypes";
    import SrpgModal from "../shared/modal/SrpgModal.svelte";
    import FortuneEditor from "../oracle/components/FortuneEditor.svelte";

    export let show = false;
    export let blueprint: GameBlueprint;
    export let onClose: () => void = () => {};
    export let onSave: (blueprint: GameBlueprint) => void = () => {};

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
        onClose();
    }

    function handleSave() {
        onSave(blueprint);
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

    function saveFortune(fortune: Fortune) {
        if (editingFortuneIndex >= 0) {
            blueprint.defaultFortunes[editingFortuneIndex] = fortune;
        } else {
            blueprint.defaultFortunes = [...blueprint.defaultFortunes, fortune];
        }
        showFortuneEditor = false;
    }

    function deleteFortune(index: number) {
        if (confirm("Are you sure you want to delete this fortune?")) {
            blueprint.defaultFortunes = blueprint.defaultFortunes.filter((_, i) => i !== index);
        }
    }
</script>

{#if show}
    <SrpgModal {show} ariaLabel="Close game blueprint modal" onClose={handleClose}>
        <h2 class="mt-0 text-(--text-primary)">{isEditing ? "Edit Game" : "Create Game"}</h2>

        <div class="mb-6 text-left">
            <label class="mb-1 block font-medium text-(--text-secondary)" for="blueprint-title">
                Game Title:
            </label>
            <input
                class="box-border w-full rounded-md border border-(--input-border) bg-(--input-bg) p-2 text-base text-(--input-text) focus:border-(--input-border-focus) focus:outline-none"
                id="blueprint-title"
                type="text"
                bind:value={blueprint.title}
                placeholder="Enter game title..." />
        </div>

        <div class="mb-6 text-left">
            <h3 class="mt-0 mb-2 text-[1.1rem] text-(--text-secondary)">Default Fortunes</h3>
            <button class="srpg-b srpg-b-create" on:click={openCreateFortune}>+ Add Fortune</button>

            {#if blueprint.defaultFortunes.length > 0}
                <div class="mt-4 flex flex-col gap-3">
                    {#each blueprint.defaultFortunes as fortune, index}
                        <div
                            class="flex items-center justify-between gap-4 rounded-md border border-(--border-primary) bg-(--bg-secondary) p-3 max-[600px]:flex-col max-[600px]:items-stretch">
                            <div class="flex flex-1 flex-col gap-1">
                                <strong class="text-(--text-primary)">
                                    {fortune.title || "Untitled"}
                                </strong>
                            </div>
                            <div class="flex gap-2">
                                <button
                                    class="action-btn edit"
                                    on:click={() => openEditFortune(index)}
                                    title="Edit"
                                    aria-label="Edit Fortune">
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="18"
                                        height="18"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </button>
                                <button
                                    class="action-btn delete"
                                    on:click={() => deleteFortune(index)}
                                    title="Delete"
                                    aria-label="Delete Fortune">
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="18"
                                        height="18"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2">
                                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>
            {:else}
                <p class="mt-4 rounded-md bg-(--bg-secondary) p-4 text-center italic">
                    No fortunes added yet. Click "Add Fortune" to create one.
                </p>
            {/if}
        </div>

        <hr class="my-6 border-t border-none border-(--divider)" />
        <button class="srpg-b srpg-b-create srpg-b-w-full" on:click={handleSave}>
            Save Game Blueprint
        </button>
    </SrpgModal>
{/if}

<FortuneEditor
    show={showFortuneEditor}
    fortune={editingFortune}
    campaigns={[blueprint.title]}
    showCampaignField={false}
    onClose={() => (showFortuneEditor = false)}
    onSave={saveFortune} />

<style>
    .action-btn {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--border-primary);
        background: var(--bg-secondary);
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.2s;
    }

    .action-btn:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
        transform: translateY(-2px);
    }

    .action-btn.delete:hover {
        color: var(--accent-danger);
        border-color: var(--accent-danger);
    }
</style>
