<script lang="ts">
    import { onMount, createEventDispatcher } from "svelte";
    import { activeCampaign } from "../game-management/campaign-store";
    import NoCampaignOverlay from "../NoCampaignOverlay.svelte";
    import FloatingOracleButton from "../shared/FloatingOracleButton.svelte";
    import { generateId } from "../oracle/scripts/oracleTypes";
    import { loadMapsByCampaign, saveMaps, loadMaps, saveActiveMapId, loadActiveMapId, type MapEntity } from "../data/storage-utils";
    import MapLanding from "./MapLanding.svelte";
    import MapEditor from "./MapEditor.svelte";
    import SecondarySidebar from "../SecondarySidebar.svelte";
    import TertiarySidebar from "../TertiarySidebar.svelte";
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
            const activeMapId = loadActiveMapId();
            // Validate that the active map belongs to the current campaign
            if (activeMapId && maps.some(m => m.id === activeMapId)) {
                currentMapId = activeMapId;
            } else {
                currentMapId = null;
                saveActiveMapId(null);
            }
        }
    });

    // Refresh maps when campaign changes and validate active map
    $: if (campaignId) {
        maps = loadMapsByCampaign(campaignId);
        // If there's a current map open, verify it belongs to this campaign
        if (currentMapId) {
            const mapBelongsToCampaign = maps.some(m => m.id === currentMapId);
            if (!mapBelongsToCampaign) {
                currentMapId = null;
                saveActiveMapId(null);
            }
        }
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
    let tool: "paint" | "object" | "move" = "move";
    let currentShape: "square" | "circle" | "triangle" | "star" = "square";
    let color = "#2980b9";
    // Selected tile reference for map tools
    let selectedTileRef: { tileMapId: string; tileId: string } | null = null;

    // Track sidebar visibility for smooth animations
    let showSecondarySidebar = false;
    let showTertiarySidebar = false;

    // Reactive statement to show sidebars when a map is opened
    $: if (currentMapId) {
        // Small delay to ensure DOM is ready and transition can play
        setTimeout(() => {
            showSecondarySidebar = true;
        }, 10);
    } else {
        showSecondarySidebar = false;
        showTertiarySidebar = false;
    }

    // Editor selection state for Move tool controls
    let moveHasSelection = false;
    let moveSelectedColor: string | null = null;
    let moveCanFlip = false;

    // Reference to MapEditor to call exported methods
    let editorRef: any;

    function handleEditorSelectionChange(e: CustomEvent<{ selected: boolean; object: { id: string; color: string; canFlip: boolean } | null }>) {
        moveHasSelection = !!e.detail?.selected;
        moveSelectedColor = e.detail?.object?.color ?? null;
        moveCanFlip = !!e.detail?.object?.canFlip;
    }

    function handleMoveColorChange(e: CustomEvent<string>) {
        editorRef?.setSelectedObjectColor?.(e.detail);
        moveSelectedColor = e.detail;
    }
    function handleMoveFlip() { editorRef?.flipSelectedObject?.(); }
    function handleMoveDelete() { editorRef?.deleteSelectedObject?.(); }

    // Update tertiary sidebar visibility based on tool
    $: if (currentMapId) {
        showTertiarySidebar = tool === "paint" || tool === "object" || (tool === 'move' && moveHasSelection);
    }

    // Public method to close the current map and return to landing
    export function returnToLanding() {
        if (currentMapId) {
            closeMap();
        }
    }
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
        <SecondarySidebar 
            show={showSecondarySidebar} 
            mode="map"
            {tool}
            activeTab="characters"
            onTabChange={() => {}}
            on:toolChange={(e) => tool = e.detail}
            on:close={closeMap}
        />
        <TertiarySidebar 
            show={showTertiarySidebar}
            mode="map"
            {tool} 
            {currentShape} 
            {color}
            selectedTile={selectedTileRef}
            visibleSections={[]}
            selectedSections={new Set()}
            isEditingSections={false}
            onToggleSection={() => {}}
            on:shapeChange={(e) => currentShape = e.detail}
            on:colorChange={(e) => color = e.detail}
            on:tileSelect={(e) => selectedTileRef = e.detail}
            moveHasSelection={moveHasSelection}
            moveSelectedColor={moveSelectedColor}
            moveCanFlip={moveCanFlip}
            on:moveColorChange={handleMoveColorChange}
            on:moveFlip={handleMoveFlip}
            on:moveDelete={handleMoveDelete}
        />

        <div class="map-view-full has-sidebars">
            <MapEditor bind:this={editorRef} mapId={currentMapId} {tool} {currentShape} {color} selectedTile={selectedTileRef}
                on:selectionChange={handleEditorSelectionChange}
            />
        </div>
        <FloatingOracleButton 
            hasSecondarySidebar={showSecondarySidebar}
            hasTertiarySidebar={showTertiarySidebar}
            on:navigateToStory 
        />
    {/if}
{/if}

<style>
    .map-view { max-width: 1200px; margin: 0 auto; }
    .map-view-full { position: relative; width: 100%; height: 100%; } 
</style>
