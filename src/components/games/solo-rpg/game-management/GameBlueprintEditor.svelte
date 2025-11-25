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
            blueprint.defaultFortunes = blueprint.defaultFortunes.filter((_, i) => i !== index);
        }
    }
</script>

{#if show}
    <SrpgModal {show} ariaLabel="Close game blueprint modal" on:close={handleClose}>
        <h2 class="text-[var(--text-primary)] mt-0">{isEditing ? "Edit Game" : "Create Game"}</h2>

        <div class="mb-6 text-left">
            <label class="text-[var(--text-secondary)] mb-1 block font-medium" for="blueprint-title">
                Game Title:
            </label>
            <input
                class="border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--input-text)] focus:border-[var(--input-border-focus)] box-border w-full rounded-md border p-2 text-base focus:outline-none"
                id="blueprint-title"
                type="text"
                bind:value={blueprint.title}
                placeholder="Enter game title..." />
        </div>

        <div class="mb-6 text-left">
            <h3 class="text-[var(--text-secondary)] mt-0 mb-2 text-[1.1rem]">Default Fortunes</h3>
            <button class="srpg-b srpg-b-create" on:click={openCreateFortune}>
                + Add Fortune
            </button>

            {#if blueprint.defaultFortunes.length > 0}
                <div class="mt-4 flex flex-col gap-3">
                    {#each blueprint.defaultFortunes as fortune, index}
                        <div
                            class="bg-[var(--bg-secondary)] border-[var(--border-primary)] flex items-center justify-between gap-4 rounded-md border p-3 max-[600px]:flex-col max-[600px]:items-stretch">
                            <div class="flex flex-1 flex-col gap-1">
                                <strong class="text-[var(--text-primary)]">
                                    {fortune.title || "Untitled"}
                                </strong>
                            </div>
                            <div class="flex gap-2 max-[600px]:justify-stretch">
                                <button
                                    class="srpg-b srpg-b-normal srpg-b-sm max-[600px]:flex-1"
                                    on:click={() => openEditFortune(index)}>
                                    Edit
                                </button>
                                <button
                                    class="srpg-b srpg-b-danger srpg-b-sm max-[600px]:flex-1"
                                    on:click={() => deleteFortune(index)}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>
            {:else}
                <p class="bg-[var(--bg-secondary)] mt-4 rounded-md p-4 text-center italic">
                    No fortunes added yet. Click "Add Fortune" to create one.
                </p>
            {/if}
        </div>

        <hr class="border-[var(--divider)] my-6 border-t border-none" />
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
    on:close={() => (showFortuneEditor = false)}
    on:save={saveFortune} />
