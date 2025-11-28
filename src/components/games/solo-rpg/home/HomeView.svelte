<script lang="ts">
    import { onMount, createEventDispatcher } from "svelte";
    import { activeCampaign } from "../game-management/campaign-store";
    import CampaignLoadConfirm from "../game-management/CampaignLoadConfirm.svelte";
    import CampaignCreator from "../game-management/CampaignCreator.svelte";
    import GameBlueprintEditor from "../game-management/GameBlueprintEditor.svelte";
    import {
        loadGameBlueprints,
        saveGameBlueprints,
        loadCampaigns,
        saveCampaigns,
        type GameBlueprint,
        type Campaign,
    } from "../data/storage-utils";
    import { generateId } from "../oracle/scripts/oracleTypes";
    import SrpgListPage from "../shared/layout/SrpgListPage.svelte";

    const dispatch = createEventDispatcher<{
        loadCampaign: Campaign;
    }>();

    let showBlueprintEditor = false;
    let showCampaignCreator = false;
    let showCampaignLoadConfirm = false;

    let gameBlueprints: GameBlueprint[] = [];
    let campaigns: Campaign[] = [];

    let editingBlueprint: GameBlueprint = {
        id: "",
        title: "",
        defaultFortunes: [],
    };

    let selectedBlueprint: GameBlueprint | null = null;
    let selectedCampaignForLoad: Campaign | null = null;
    let expandedBlueprints: Set<string> = new Set();

    $: campaignsByBlueprint = gameBlueprints.reduce(
        (acc, blueprint) => {
            acc[blueprint.id] = campaigns.filter((c) => c.blueprintId === blueprint.id);
            return acc;
        },
        {} as Record<string, Campaign[]>
    );

    onMount(() => {
        gameBlueprints = loadGameBlueprints();
        campaigns = loadCampaigns();
    });

    function openCreateBlueprint() {
        editingBlueprint = {
            id: generateId(),
            title: "",
            defaultFortunes: [],
        };
        showBlueprintEditor = true;
    }

    function openEditBlueprint(blueprint: GameBlueprint) {
        editingBlueprint = {
            id: blueprint.id,
            title: blueprint.title,
            defaultFortunes: [...blueprint.defaultFortunes],
        };
        showBlueprintEditor = true;
    }

    function saveBlueprint(event: CustomEvent<GameBlueprint>) {
        const blueprint = event.detail;
        const existingIndex = gameBlueprints.findIndex((b) => b.id === blueprint.id);

        if (existingIndex >= 0) {
            gameBlueprints[existingIndex] = blueprint;
        } else {
            gameBlueprints = [...gameBlueprints, blueprint];
        }

        saveGameBlueprints(gameBlueprints);
        showBlueprintEditor = false;
    }

    function openCampaignCreator(blueprint: GameBlueprint) {
        selectedBlueprint = blueprint;
        showCampaignCreator = true;
    }

    function createCampaign(event: CustomEvent<string>) {
        if (!selectedBlueprint) return;

        const campaignTitle = event.detail;
        const newCampaign: Campaign = {
            id: generateId(),
            title: campaignTitle,
            blueprintId: selectedBlueprint.id,
            blueprintTitle: selectedBlueprint.title,
            createdAt: Date.now(),
        };

        campaigns = [...campaigns, newCampaign];
        saveCampaigns(campaigns);

        // Automatically expand the blueprint to show the new campaign
        expandedBlueprints.add(selectedBlueprint.id);
        expandedBlueprints = expandedBlueprints;

        showCampaignCreator = false;
        selectedBlueprint = null;
    }

    function toggleBlueprint(blueprintId: string) {
        if (expandedBlueprints.has(blueprintId)) {
            expandedBlueprints.delete(blueprintId);
        } else {
            expandedBlueprints.add(blueprintId);
        }
        expandedBlueprints = expandedBlueprints;
    }

    function formatDate(timestamp: number): string {
        const date = new Date(timestamp);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    }

    function openCampaignLoadConfirm(campaign: Campaign) {
        selectedCampaignForLoad = campaign;
        showCampaignLoadConfirm = true;
    }

    function handleLoadCampaign(event: CustomEvent<Campaign>) {
        const campaign = event.detail;
        // Delegate actual loading/navigation to parent
        dispatch("loadCampaign", campaign);
        showCampaignLoadConfirm = false;
        selectedCampaignForLoad = null;
    }
</script>

<SrpgListPage showActiveCampaign={false}>
    <div slot="header" class="mb-4 text-center">
        <h1>Solo RPG</h1>
    </div>
    <div class="mx-auto max-w-[800px] px-2 pb-[calc(90px+env(safe-area-inset-bottom))]">
        <p class="mb-8 text-center text-[1.1rem] text-(--text-secondary)">
            Welcome to your Solo RPG companion!
        </p>

        {#if $activeCampaign}
            <div class="banner">
                <div
                    class="flex items-center justify-between gap-4 max-[600px]:flex-col max-[600px]:items-stretch">
                    <div class="flex flex-wrap items-center gap-2 max-[600px]:justify-center">
                        <span class="text-sm opacity-90">Active Campaign:</span>
                        <span class="text-[1.1rem] font-semibold">{$activeCampaign.title}</span>
                        <span class="text-sm opacity-85">{$activeCampaign.blueprintTitle}</span>
                    </div>
                </div>
            </div>
        {/if}

        <div class="mt-8">
            <button class="srpg-b srpg-b-create srpg-b-w-full" on:click={openCreateBlueprint}>
                + Create Game Blueprint
            </button>

            {#if gameBlueprints.length > 0}
                <h2 class="mt-8 mb-4 text-[1.3rem] text-(--text-primary)">Your Games</h2>

                <div class="mt-4 flex flex-col gap-3">
                    {#each gameBlueprints as blueprint (blueprint.id)}
                        {@const blueprintCampaigns = campaignsByBlueprint[blueprint.id] || []}
                        {@const isExpanded = expandedBlueprints.has(blueprint.id)}

                        <div class="rounded-lg border border-(--border-primary) bg-(--card-bg)">
                            <div class="flex items-center gap-3 bg-(--bg-secondary) p-2">
                                <button
                                    class="flex flex-1 cursor-pointer items-center gap-3 rounded-md border-none bg-transparent p-2 text-left text-base transition-colors duration-200 hover:bg-(--bg-tertiary) md:p-3"
                                    on:click={() => toggleBlueprint(blueprint.id)}>
                                    <span
                                        class="inline-block w-4 text-xs text-(--text-secondary) transition-transform duration-200 {isExpanded
                                            ? 'rotate-90'
                                            : ''}">
                                        ▶
                                    </span>
                                    <span class="flex-1 font-semibold text-(--text-primary)">
                                        {blueprint.title}
                                    </span>
                                </button>
                                <div class="flex items-center gap-2">
                                    <button
                                        class="srpg-b srpg-b-normal srpg-b-sm"
                                        on:click={() => openEditBlueprint(blueprint)}
                                        title="Edit blueprint"
                                        aria-label="Edit blueprint">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            width="1em"
                                            height="1em">
                                            <path
                                                fill="currentColor"
                                                d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                        </svg>
                                    </button>
                                    <button
                                        class="srpg-b srpg-b-create srpg-b-sm"
                                        on:click={() => openCampaignCreator(blueprint)}
                                        title="Create new campaign">
                                        +
                                    </button>
                                </div>
                            </div>

                            {#if isExpanded}
                                <div class="bg-(--bg-tertiary) p-4 pt-2">
                                    {#if blueprintCampaigns.length > 0}
                                        <div
                                            class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
                                            {#each blueprintCampaigns as campaign}
                                                <div
                                                    class="relative flex min-h-20 w-full flex-row items-center justify-center gap-2 p-4 text-left transition-all duration-200">
                                                    <div class="flex grow flex-col gap-1">
                                                        <strong class="text-base wrap-break-word">
                                                            {campaign.title}
                                                        </strong>
                                                        <span
                                                            class="text-xs font-normal opacity-70">
                                                            {formatDate(campaign.createdAt)}
                                                        </span>
                                                    </div>
                                                    <div
                                                        class="flex min-w-[50px] flex-row items-center justify-center">
                                                        <button
                                                            class="srpg-b srpg-b-normal {$activeCampaign?.id ===
                                                            campaign.id
                                                                ? 'active'
                                                                : ''}"
                                                            on:click={() =>
                                                                openCampaignLoadConfirm(campaign)}
                                                            disabled={$activeCampaign?.id ===
                                                                campaign.id}
                                                            aria-label="Load campaign">
                                                            {#if $activeCampaign?.id === campaign.id}
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    viewBox="0 0 24 24"
                                                                    width="1em"
                                                                    height="1em"
                                                                    {...$$props}>
                                                                    <path
                                                                        fill="currentColor"
                                                                        d="M6 20.196V3.804a1 1 0 0 1 1.53-.848l13.113 8.196a1 1 0 0 1 0 1.696L7.53 21.044A1 1 0 0 1 6 20.196" />
                                                                </svg>
                                                            {:else}
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    viewBox="0 0 24 24"
                                                                    width="1.5em"
                                                                    height="1.5em"
                                                                    {...$$props}>
                                                                    <path
                                                                        fill="currentColor"
                                                                        d="M8 18.392V5.608L18.226 12zM6 3.804v16.392a1 1 0 0 0 1.53.848l13.113-8.196a1 1 0 0 0 0-1.696L7.53 2.956A1 1 0 0 0 6 3.804" />
                                                                </svg>
                                                            {/if}
                                                        </button>
                                                    </div>
                                                </div>
                                            {/each}
                                        </div>
                                    {:else}
                                        <p class="m-0 p-4 text-center italic">
                                            No campaigns yet. Click the + button to create one.
                                        </p>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
</SrpgListPage>

<CampaignLoadConfirm
    bind:show={showCampaignLoadConfirm}
    campaign={selectedCampaignForLoad}
    on:load={handleLoadCampaign}
    on:close={() => (showCampaignLoadConfirm = false)} />

<GameBlueprintEditor
    bind:show={showBlueprintEditor}
    blueprint={editingBlueprint}
    on:save={saveBlueprint}
    on:close={() => (showBlueprintEditor = false)} />

<CampaignCreator
    bind:show={showCampaignCreator}
    blueprint={selectedBlueprint}
    on:create={createCampaign}
    on:close={() => (showCampaignCreator = false)} />
