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
    on:close={() => (showFortuneEditor = false)}
    on:save={saveFortune} />
