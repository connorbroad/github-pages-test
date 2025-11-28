<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { MapEntity } from "../data/storage-utils";
    import SrpgModal from "../shared/modal/SrpgModal.svelte";
    import SrpgListPage from "../shared/layout/SrpgListPage.svelte";

    export let maps: MapEntity[] = [];

    const dispatch = createEventDispatcher();
    let newMapName = "";
    let showCreateModal = false;
    let sortBy: "alphabetical" | "createdAt" | "updatedAt" = "updatedAt";
    let showSortDropdown = false;

    function createMap() {
        const name = newMapName.trim();
        if (!name) return;
        dispatch("createMap", { name });
        newMapName = "";
        showCreateModal = false;
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

    function toggleFavorite(map: MapEntity) {
        dispatch("updateMap", {
            id: map.id,
            changes: { isFavorite: !map.isFavorite },
        });
    }

    $: sortedMaps = [...maps].sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) {
            return a.isFavorite ? -1 : 1;
        }
        switch (sortBy) {
            case "alphabetical":
                return a.name.localeCompare(b.name);
            case "createdAt":
                return (b.createdAt || 0) - (a.createdAt || 0);
            case "updatedAt":
                return (b.updatedAt || 0) - (a.updatedAt || 0);
            default:
                return 0;
        }
    });
</script>

<SrpgListPage className="map-landing">
    <div slot="header">
        <h1 class="srpg-page-header text-center">Maps</h1>
        {#if maps.length > 1}
            <div class="mb-4 flex justify-end">
                <!-- Sort Dropdown -->
                <div class="relative">
                    <button
                        class="srpg-b-icon"
                        on:click={() => (showSortDropdown = !showSortDropdown)}
                        aria-label="Sort maps"
                        title="Sort by">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="1.25em"
                            height="1.25em">
                            <path
                                fill="currentColor"
                                d="M3 18h6v-2H3v2M3 6v2h18V6H3m0 7h12v-2H3v2" />
                        </svg>
                    </button>
                    {#if showSortDropdown}
                        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
                        <div class="fixed inset-0 z-40" on:click={() => (showSortDropdown = false)}>
                        </div>
                        <div
                            class="bg-bg-elevated border-border-primary absolute top-full right-0 left-auto z-50 mt-1 min-w-40 rounded-lg border shadow-lg">
                            <button
                                class="text-text-primary hover:bg-bg-tertiary flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors first:rounded-t-lg {sortBy ===
                                'alphabetical'
                                    ? 'bg-bg-tertiary font-semibold'
                                    : ''}"
                                on:click={() => {
                                    sortBy = "alphabetical";
                                    showSortDropdown = false;
                                }}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    width="1em"
                                    height="1em"
                                    class="text-text-muted">
                                    <path
                                        fill="currentColor"
                                        d="M2 17h4v-2H2v2m0-7h8v-2H2v2m0 3h16v-2H2v2m19.41-2.83L20 8.59l-1.41 1.58L17 8.59l-1.41 1.58L17 11.59l1.41 1.58L20 11.59l1.41 1.58M17 6l-1.41 1.41L17 8.83l1.41-1.42L17 6Z" />
                                </svg>
                                Alphabetical
                            </button>
                            <button
                                class="text-text-primary hover:bg-bg-tertiary flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors {sortBy ===
                                'createdAt'
                                    ? 'bg-bg-tertiary font-semibold'
                                    : ''}"
                                on:click={() => {
                                    sortBy = "createdAt";
                                    showSortDropdown = false;
                                }}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    width="1em"
                                    height="1em"
                                    class="text-text-muted">
                                    <path
                                        fill="currentColor"
                                        d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2m4 11h-5V6h2v5h3Z" />
                                </svg>
                                Created
                            </button>
                            <button
                                class="text-text-primary hover:bg-bg-tertiary flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors last:rounded-b-lg {sortBy ===
                                'updatedAt'
                                    ? 'bg-bg-tertiary font-semibold'
                                    : ''}"
                                on:click={() => {
                                    sortBy = "updatedAt";
                                    showSortDropdown = false;
                                }}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    width="1em"
                                    height="1em"
                                    class="text-text-muted">
                                    <path
                                        fill="currentColor"
                                        d="M21 10.12h-6.78l2.74-2.82c-2.73-2.7-7.15-2.8-9.88-.1a6.875 6.875 0 0 0 0 9.79a7.02 7.02 0 0 0 9.88 0A6.98 6.98 0 0 0 19 12.1h2a9 9 0 0 1-2.64 6.37A8.97 8.97 0 0 1 5.72 5.72a9 9 0 0 1 12.73 0L21 3v7.12M12.5 8v4.25l3.5 2.08l-.72 1.21L11 13V8h1.5Z" />
                                </svg>
                                Updated
                            </button>
                        </div>
                    {/if}
                </div>
            </div>
        {/if}
    </div>

    <div class="max-w-[900px]">
        {#if sortedMaps.length > 0}
            <div class="flex flex-wrap gap-3">
                {#each sortedMaps as map, i (map.id)}
                    {#if i > 0 && sortedMaps[i - 1].isFavorite && !map.isFavorite}
                        <div class="my-2 h-px w-full bg-(--border-primary) opacity-50"></div>
                    {/if}
                    <div
                        class="srpg-card flex min-h-20 w-full cursor-pointer items-center justify-between gap-3 px-4 py-4 text-left focus:outline focus:outline-(--accent-primary) sm:w-[calc(50%-0.375rem)]"
                        role="button"
                        tabindex="0"
                        on:click={() => openMap(map.id)}
                        on:keydown={(e) => keyOpen(e, map.id)}
                        aria-label={`Open ${map.name}`}>
                        <div class="flex flex-col gap-1">
                            <div class="flex items-center gap-2 font-semibold">
                                {map.name}
                            </div>
                        </div>
                        <div class="flex gap-1.5">
                            <button
                                class="srpg-b-icon {map.isFavorite
                                    ? 'text-(--accent-warning)'
                                    : 'text-(--text-muted)'}"
                                title={map.isFavorite ? "Unfavorite" : "Favorite"}
                                aria-label={map.isFavorite ? "Unfavorite" : "Favorite"}
                                on:click|stopPropagation={() => toggleFavorite(map)}>
                                <svg
                                    viewBox="0 0 24 24"
                                    width="18"
                                    height="18"
                                    fill={map.isFavorite ? "currentColor" : "none"}
                                    aria-hidden="true">
                                    <path
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linejoin="round"
                                        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                            </button>
                            <button
                                class="srpg-b-icon"
                                title="Rename"
                                aria-label={`Rename ${map.name}`}
                                on:click|stopPropagation={() => promptRename(map)}>
                                <svg
                                    viewBox="0 0 24 24"
                                    width="18"
                                    height="18"
                                    fill="none"
                                    aria-hidden="true">
                                    <path
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                            </button>
                            <button
                                class="srpg-b-icon delete-icon"
                                title="Delete"
                                aria-label={`Delete ${map.name}`}
                                on:click|stopPropagation={() => confirmDelete(map)}>
                                <svg
                                    viewBox="0 0 24 24"
                                    width="18"
                                    height="18"
                                    fill="none"
                                    aria-hidden="true">
                                    <path
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        {:else}
            <div class="srpg-empty-state">
                <svg
                    class="srpg-empty-state-icon"
                    viewBox="0 0 24 24"
                    width="32"
                    height="32"
                    fill="none"
                    aria-hidden="true">
                    <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="2"
                        stroke="currentColor"
                        stroke-width="2" />
                    <path
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        d="M3 9h18M9 3v18" />
                </svg>
                <p class="srpg-empty-state-text">No maps yet</p>
                <p class="srpg-empty-state-hint">Create your first map to get started!</p>
            </div>
        {/if}
    </div>

    <div slot="footer" class="relative mb-[calc(env(safe-area-inset-bottom))] py-2 md:mb-0">
        <div class="flex items-center justify-center px-2">
            {#if maps.length > 0}
                <button
                    class="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-(--border-primary) bg-(--card-bg) text-(--text-secondary) shadow-sm transition-colors hover:bg-(--bg-tertiary) hover:text-(--accent-primary)"
                    on:click={() => (showCreateModal = true)}
                    title="Create new map"
                    aria-label="Create new map">
                    <svg
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
            {:else}
                <button
                    class="srpg-b srpg-b-create"
                    on:click={() => (showCreateModal = true)}
                    aria-label="Create new map">
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
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Create New Map
                </button>
            {/if}
        </div>
    </div>
</SrpgListPage>

<SrpgModal
    bind:show={showCreateModal}
    ariaLabel="Create map modal"
    on:close={() => (showCreateModal = false)}>
    <h2 class="mb-4 text-xl font-bold">Create New Map</h2>

    <div class="srpg-form-field mb-6 text-left">
        <label for="new-map-name">Map Name</label>
        <input
            id="new-map-name"
            type="text"
            placeholder="Enter map name..."
            bind:value={newMapName}
            on:keydown={(e) => e.key === "Enter" && createMap()} />
    </div>

    <div class="srpg-b-group justify-end">
        <button class="srpg-b srpg-b-simple" on:click={() => (showCreateModal = false)}>
            Cancel
        </button>
        <button class="srpg-b srpg-b-create" on:click={createMap} disabled={!newMapName.trim()}>
            Create
        </button>
    </div>
</SrpgModal>
