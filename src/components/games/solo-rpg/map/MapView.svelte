<script lang="ts">
    import { onMount, createEventDispatcher } from "svelte";
    import { activeCampaign } from "../game-management/campaign-store";
    import NoCampaignOverlay from "../NoCampaignOverlay.svelte";
    import FloatingOracleButton from "../shared/FloatingOracleButton.svelte";
    import { generateId } from "../oracle/scripts/oracleTypes";
    import { loadMapsByCampaign, saveMaps, loadMaps, saveActiveMapId, loadActiveMapId, type MapEntity } from "../data/storage-utils";
    import MapLanding from "./MapLanding.svelte";
    import MapEditor from "./MapEditor.svelte";
    import MapSecondarySidebar from "./MapSecondarySidebar.svelte";
    import MapTertiarySidebar from "./MapTertiarySidebar.svelte";
    import "../solo-rpg-styles.css";

    const dispatch = createEventDispatcher();

    let currentMapId: string | null = null;
    let maps: MapEntity[] = [];

    function handleNavigateHome() {
        dispatch('navigateHome');
    }

    $: campaignId = $activeCampaign?.id;

    onMount(() => {
        if (campaignId) {
            maps = loadMapsByCampaign(campaignId);
            currentMapId = loadActiveMapId();
        }
    });

    // Refresh maps when campaign changes
    $: if (campaignId) {
        maps = loadMapsByCampaign(campaignId);
    }

    function createMap(e: CustomEvent<{ name: string }>) {
        if (!campaignId) return;
        const now = Date.now();
        const newMap: MapEntity = {
            id: generateId(),
            campaignId,
            name: e.detail.name,
            createdAt: now,
            updatedAt: now,
            width: 100,
            height: 100,
            tileSize: 32,
            background: {},
            objects: [],
            view: { x: 0, y: 0, zoom: 1 },
        };
        const all = loadMaps();
        all.push(newMap);
        saveMaps(all);
        maps = loadMapsByCampaign(campaignId);
    }

    function openMap(e: CustomEvent<{ id: string }>) {
        currentMapId = e.detail.id;
        saveActiveMapId(currentMapId);
    }

    function closeMap() {
        currentMapId = null;
        saveActiveMapId(null);
    }

    function renameMap(e: CustomEvent<{ id: string; name: string }>) {
        const { id, name } = e.detail;
        const all = loadMaps();
        const idx = all.findIndex(m => m.id === id);
        if (idx >= 0) {
            all[idx] = { ...all[idx], name, updatedAt: Date.now() };
            saveMaps(all);
            if (campaignId) maps = loadMapsByCampaign(campaignId);
        }
    }

    function deleteMap(e: CustomEvent<{ id: string }>) {
        const { id } = e.detail;
        const all = loadMaps().filter(m => m.id !== id);
        saveMaps(all);
        if (currentMapId === id) {
            currentMapId = null;
            saveActiveMapId(null);
        }
        if (campaignId) maps = loadMapsByCampaign(campaignId);
    }

    // Editor UI state routed to sidebars
    let mode: "edit" | "play" = "edit";
    let tool: "paint" | "object" | "move" | "erase" = "paint";
    let currentShape: "square" | "circle" | "triangle" | "star" = "square";
    let color = "#2980b9";
</script>

<NoCampaignOverlay show={!$activeCampaign} on:navigateHome={handleNavigateHome} />

{#if $activeCampaign}
    {#if !currentMapId}
        <div class="map-view">
            <MapLanding {maps}
                on:createMap={createMap}
                on:openMap={openMap}
                on:renameMap={renameMap}
                on:deleteMap={deleteMap}
            />
        </div>
        <FloatingOracleButton on:navigateToStory />
    {:else}
        <!-- Sidebars for consistent tool UI -->
        <MapSecondarySidebar show={true} {mode}
            on:modeChange={(e) => mode = e.detail}
            on:close={closeMap}
        />
        <MapTertiarySidebar show={true} {tool} {currentShape} {color}
            on:toolChange={(e) => tool = e.detail}
            on:shapeChange={(e) => currentShape = e.detail}
            on:colorChange={(e) => color = e.detail}
        />

        <div class="map-view-full has-sidebars">
            <MapEditor mapId={currentMapId} {mode} {tool} {currentShape} {color} />
        </div>
        <FloatingOracleButton on:navigateToStory />
    {/if}
{/if}

<style>
    .map-view { max-width: 1200px; margin: 0 auto; }
    .map-view-full { position: relative; width: 100%; height: 100%; }

    /* Shift content to account for sidebars on desktop */
    @media (min-width: 769px) {
        .map-view-full.has-sidebars { margin-left: 250px; }
    }
</style>
