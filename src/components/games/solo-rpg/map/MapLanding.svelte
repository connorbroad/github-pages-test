<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { MapEntity } from "../data/storage-utils";

    export let maps: MapEntity[] = [];

    const dispatch = createEventDispatcher();
    let newMapName = "";

    function createMap() {
        const name = newMapName.trim();
        if (!name) return;
        dispatch("createMap", { name });
        newMapName = "";
    }

    function openMap(id: string) {
        dispatch("openMap", { id });
    }

    function promptRename(map: MapEntity) {
        const next = prompt("Rename map", map.name);
        if (!next) return;
        const name = next.trim();
        if (!name || name === map.name) return;
        dispatch("renameMap", { id: map.id, name });
    }

    function confirmDelete(map: MapEntity) {
        const ok = confirm(`Delete map "${map.name}"? This cannot be undone.`);
        if (!ok) return;
        dispatch("deleteMap", { id: map.id });
    }

    function keyOpen(e: KeyboardEvent, id: string) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openMap(id);
        }
    }

    $: sortedMaps = [...maps].sort(
        (a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt)
    );
</script>

<div class="mx-4 max-w-[900px] pb-[calc(90px+env(safe-area-inset-bottom))]">
    <h1 class="mb-4 text-center">Your Maps</h1>

    <div class="mt-4 mb-6 grid grid-cols-[1fr_auto] gap-2">
        <input
            class="rounded-lg border border-gray-300 bg-gray-100 px-3.5 py-3 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            placeholder="Map name"
            bind:value={newMapName}
            on:keydown={(e) => e.key === "Enter" && createMap()}
            aria-label="Map name" />
        <button class="srpg-b srpg-b-create" on:click={createMap} aria-label="Create map">
            + Create
        </button>
    </div>

    {#if sortedMaps.length > 0}
        <div class="flex flex-wrap gap-3 sm:justify-start">
            {#each sortedMaps as map (map.id)}
                <div
                    class="srpg-card flex min-h-[80px] w-full cursor-pointer items-center justify-between gap-3 px-4 py-4 text-left focus:outline focus:outline-blue-500 sm:w-[calc(50%-0.375rem)]"
                    role="button"
                    tabindex="0"
                    on:click={() => openMap(map.id)}
                    on:keydown={(e) => keyOpen(e, map.id)}
                    aria-label={`Open ${map.name}`}>
                    <div class="flex flex-col gap-1">
                        <div class="font-semibold">{map.name}</div>
                        <div class="text-xs opacity-70">
                            {new Date(map.updatedAt ?? map.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                    <div class="flex gap-1.5">
                        <button
                            class="rounded-md border border-gray-300 bg-gray-100 px-2 py-1.5 text-gray-900 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                            title="Rename"
                            aria-label={`Rename ${map.name}`}
                            on:click={() => promptRename(map)}>
                            ✎
                        </button>
                        <button
                            class="rounded-md border border-red-400/35 bg-gray-100 px-2 py-1.5 text-red-600 hover:bg-gray-200 dark:border-red-500/35 dark:bg-gray-700 dark:text-red-400 dark:hover:bg-gray-600"
                            title="Delete"
                            aria-label={`Delete ${map.name}`}
                            on:click={() => confirmDelete(map)}>
                            🗑
                        </button>
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <p class="text-center text-gray-500 italic dark:text-gray-400">
            No maps yet. Create your first map above.
        </p>
    {/if}
</div>
