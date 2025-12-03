<script lang="ts">
    /**
     * Encounter Setup Modal
     * Allows selecting which creatures participate in the encounter before rolling initiative
     */
    import { createEventDispatcher } from "svelte";
    import SrpgModal from "../shared/modal/SrpgModal.svelte";
    import {
        loadMaps,
        loadCharacters,
        type MapObject,
        type Character,
    } from "../data/storage-utils";

    export let show = false;
    export let mapId: string;
    export let campaignId: string;
    /** Function to get currently visible creature object IDs from MapEditor */
    export let getVisibleCreatureIds: () => string[] = () => [];

    const dispatch = createEventDispatcher<{
        beginEncounter: { selectedObjectIds: string[] };
        cancel: void;
    }>();

    // Creature data for display
    type CreatureDisplay = {
        objectId: string;
        name: string;
        characterId: string;
        currentHP: number;
        maxHP: number;
        initiative: number;
    };

    let creatures: CreatureDisplay[] = [];
    let selectedIds = new Set<string>();

    // Load creatures when modal opens
    $: if (show) {
        loadCreatures();
    }

    function loadCreatures() {
        const maps = loadMaps();
        const map = maps.find((m) => m.id === mapId);
        if (!map) {
            creatures = [];
            selectedIds = new Set();
            return;
        }

        const chars = loadCharacters().filter((c) => c.campaignId === campaignId);

        creatures = [];
        for (const obj of map.objects) {
            if (!obj.creatureRef) continue;

            const ref = obj.creatureRef;
            if (ref.type === "character") {
                const char = chars.find((c) => c.id === ref.id);
                if (char) {
                    const maxHP = char.hitPointMaximum ?? 10;
                    creatures.push({
                        objectId: obj.id,
                        name: char.name,
                        characterId: char.id,
                        currentHP: ref.currentHitPoints ?? char.currentHitPoints ?? maxHP,
                        maxHP,
                        initiative: char.initiative ?? 0,
                    });
                }
            }
        }

        // Select all by default
        selectedIds = new Set(creatures.map((c) => c.objectId));
    }

    function toggleCreature(objectId: string) {
        if (selectedIds.has(objectId)) {
            selectedIds.delete(objectId);
        } else {
            selectedIds.add(objectId);
        }
        selectedIds = selectedIds; // Trigger reactivity
    }

    function selectAll() {
        selectedIds = new Set(creatures.map((c) => c.objectId));
    }

    function deselectAll() {
        selectedIds = new Set();
    }

    function selectVisible() {
        const visibleIds = getVisibleCreatureIds();
        // Filter to only creature objects that exist in our list
        const validIds = visibleIds.filter((id) => creatures.some((c) => c.objectId === id));
        selectedIds = new Set(validIds);
    }

    $: allSelected = selectedIds.size === creatures.length && creatures.length > 0;
    $: noneSelected = selectedIds.size === 0;
    $: selectedCount = selectedIds.size;

    function handleBeginEncounter() {
        if (selectedIds.size === 0) return;
        dispatch("beginEncounter", { selectedObjectIds: Array.from(selectedIds) });
        show = false;
    }

    function handleCancel() {
        dispatch("cancel");
        show = false;
    }

    function handleClose() {
        dispatch("cancel");
        show = false;
    }

    function getHPColor(current: number, max: number): string {
        const ratio = current / max;
        if (ratio > 0.5) return "var(--accent-success)";
        if (ratio > 0.25) return "var(--accent-warning)";
        return "var(--accent-danger)";
    }
</script>

<SrpgModal bind:show maxWidth="500px" on:close={handleClose}>
    <div class="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
        <!-- Header -->
        <div>
            <h2 class="text-text-primary m-0 text-lg font-semibold sm:text-xl">Begin Encounter</h2>
            <p class="text-text-secondary mt-1 text-sm">Select creatures to include in combat</p>
        </div>

        <!-- Selection Controls -->
        <div class="flex flex-wrap items-center gap-2">
            <button
                class="srpg-b srpg-b-simple srpg-b-sm"
                on:click={allSelected ? deselectAll : selectAll}>
                {allSelected ? "Deselect All" : "Select All"}
            </button>
            <button
                class="srpg-b srpg-b-simple srpg-b-sm"
                on:click={selectVisible}
                title="Select only creatures currently visible on the map">
                <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="shrink-0"
                    aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
                Select Visible
            </button>
            <span class="text-text-muted ml-auto text-sm">
                {selectedCount} / {creatures.length} selected
            </span>
        </div>

        <!-- Creature List -->
        {#if creatures.length === 0}
            <div class="srpg-empty-state">
                <svg
                    class="srpg-empty-state-icon"
                    viewBox="0 0 24 24"
                    width="48"
                    height="48"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    aria-hidden="true">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <p class="srpg-empty-state-text">No creatures on this map</p>
                <p class="srpg-empty-state-hint">Add characters to the map first</p>
            </div>
        {:else}
            <div
                class="border-border-primary bg-bg-secondary flex max-h-[300px] flex-col gap-1 overflow-y-auto rounded-lg border p-2">
                {#each creatures as creature (creature.objectId)}
                    <button
                        class="hover:bg-bg-tertiary flex w-full cursor-pointer items-center gap-3 rounded-md border-none bg-transparent p-2 text-left transition-colors"
                        class:bg-accent-primary-10={selectedIds.has(creature.objectId)}
                        on:click={() => toggleCreature(creature.objectId)}>
                        <!-- Checkbox -->
                        <div
                            class="border-border-primary flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors"
                            class:bg-accent-primary={selectedIds.has(creature.objectId)}
                            class:border-accent-primary={selectedIds.has(creature.objectId)}>
                            {#if selectedIds.has(creature.objectId)}
                                <svg
                                    viewBox="0 0 24 24"
                                    width="14"
                                    height="14"
                                    fill="none"
                                    stroke="white"
                                    stroke-width="3"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    aria-hidden="true">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            {/if}
                        </div>

                        <!-- Creature Info -->
                        <div class="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span class="text-text-primary truncate font-medium">
                                {creature.name}
                            </span>
                            <div class="flex items-center gap-2 text-xs">
                                <span
                                    class="font-medium"
                                    style="color: {getHPColor(creature.currentHP, creature.maxHP)}">
                                    {creature.currentHP}/{creature.maxHP} HP
                                </span>
                                <span class="text-text-muted">
                                    Init: {creature.initiative >= 0 ? "+" : ""}{creature.initiative}
                                </span>
                            </div>
                        </div>
                    </button>
                {/each}
            </div>
        {/if}

        <!-- Actions -->
        <div class="srpg-b-group mt-2 justify-end">
            <button class="srpg-b srpg-b-simple" on:click={handleCancel}>Cancel</button>
            <button
                class="srpg-b srpg-b-create"
                disabled={noneSelected}
                on:click={handleBeginEncounter}>
                <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="shrink-0"
                    aria-hidden="true">
                    <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
                    <path d="M13 19l6-6" />
                    <path d="M16 16l4 4" />
                    <path d="M19 21a2 2 0 0 0 2-2" />
                </svg>
                Start Encounter
            </button>
        </div>
    </div>
</SrpgModal>

<style>
    /* Selected item subtle highlight */
    .bg-accent-primary-10 {
        background-color: color-mix(in srgb, var(--accent-primary) 10%, transparent);
    }
</style>
