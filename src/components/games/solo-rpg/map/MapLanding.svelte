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

<div class="map-landing">
    <h1>Your Maps</h1>

    <div class="create-row">
        <input
            class="srpg-input"
            placeholder="Map name"
            bind:value={newMapName}
            on:keydown={(e) => e.key === "Enter" && createMap()}
            aria-label="Map name" />
        <button class="srpg-b srpg-b-create" on:click={createMap} aria-label="Create map">
            + Create
        </button>
    </div>

    {#if sortedMaps.length > 0}
        <div class="maps-list">
            {#each sortedMaps as map (map.id)}
                <div
                    class="map-card srpg-card"
                    role="button"
                    tabindex="0"
                    on:click={() => openMap(map.id)}
                    on:keydown={(e) => keyOpen(e, map.id)}
                    aria-label={`Open ${map.name}`}>
                    <div class="map-info">
                        <div class="map-name">{map.name}</div>
                        <div class="map-meta">
                            {new Date(map.updatedAt ?? map.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                    <div class="map-actions">
                        <button
                            class="icon-btn"
                            title="Rename"
                            aria-label={`Rename ${map.name}`}
                            on:click={() => promptRename(map)}>
                            ✎
                        </button>
                        <button
                            class="icon-btn danger"
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
        <p class="empty">No maps yet. Create your first map above.</p>
    {/if}
</div>

<style>
    .map-landing {
        max-width: 900px;
        margin: 0 1rem;
        padding-bottom: calc(90px + env(safe-area-inset-bottom));
    }

    h1 {
        text-align: center;
        margin-bottom: 1rem;
    }

    .create-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 0.5rem;
        margin: 1rem 0 1.5rem;
    }

    .srpg-input {
        padding: 0.75rem 0.9rem;
        border: 1px solid var(--border-primary);
        border-radius: 8px;
        background: var(--bg-secondary);
        color: var(--text-primary);
    }

    .maps-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
    }

    .map-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 1rem;
        min-height: 80px;
        text-align: left;
        width: 100%;
        cursor: pointer;
    }

    .map-card:focus {
        outline: 2px solid var(--accent-primary);
    }

    .map-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    .map-name {
        font-weight: 600;
    }
    .map-meta {
        font-size: 0.8rem;
        opacity: 0.7;
    }

    .map-actions {
        display: flex;
        gap: 0.4rem;
    }
    .icon-btn {
        padding: 0.4rem 0.5rem;
        border: 1px solid var(--border-primary);
        border-radius: 6px;
        background: var(--bg-secondary);
        color: var(--text-primary);
    }
    .icon-btn:hover {
        background: var(--bg-tertiary);
    }
    .icon-btn.danger {
        color: #e74c3c;
        border-color: rgba(231, 76, 60, 0.35);
    }

    .empty {
        text-align: center;
        color: var(--text-muted);
        font-style: italic;
    }

    @media (min-width: 600px) {
        .maps-list {
            justify-content: flex-start;
        }
        .map-card {
            width: calc(50% - 0.375rem);
        }
    }
</style>
