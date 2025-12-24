<script lang="ts">
    import {
        loadCampaignItemsByCampaign,
        downloadItemsFile,
        parseImportedItems,
        importItems,
        loadCampaigns,
        type CampaignItem,
        type Campaign,
    } from "./storage-utils";
    import ItemLibraryModal from "../lore/characters/character-sheet/items/ItemLibraryModal.svelte";

    let itemFileInput: HTMLInputElement;
    let itemImportError = "";
    let itemImportSuccess = "";
    let campaignItems: CampaignItem[] = [];
    let showItemLibraryModal = false;
    let campaigns: Campaign[] = [];
    let selectedCampaignId = "";
    let showCampaignDropdown = false;

    // Load campaigns
    $: {
        campaigns = loadCampaigns();
    }

    // Load campaign items when selected campaign changes
    $: if (selectedCampaignId) {
        campaignItems = loadCampaignItemsByCampaign(selectedCampaignId);
    } else {
        campaignItems = [];
    }

    function getSelectedCampaign(): Campaign | undefined {
        return campaigns.find((c) => c.id === selectedCampaignId);
    }

    function handleExportItems() {
        const campaign = getSelectedCampaign();
        if (!campaign) return;
        downloadItemsFile(campaignItems, campaign.title);
    }

    function handleItemImportClick() {
        if (!selectedCampaignId) return;
        itemFileInput.click();
    }

    function handleItemFileSelect(event: Event) {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];

        if (!file || !selectedCampaignId) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            const result = parseImportedItems(content);

            if (result) {
                const modeChoice = confirm(
                    `Found ${result.items.length} item${result.items.length !== 1 ? "s" : ""} to import.\n\nClick OK to ADD to your existing items.\nClick Cancel to REPLACE all items in this campaign.`
                );

                let mode: "add" | "replace" = modeChoice ? "add" : "replace";

                if (mode === "replace") {
                    const confirmReplace = confirm(
                        `⚠️ Warning: This will DELETE all ${campaignItems.length} existing item${campaignItems.length !== 1 ? "s" : ""} in this campaign.\n\nAre you sure you want to replace all items?`
                    );
                    if (!confirmReplace) {
                        target.value = "";
                        return;
                    }
                }

                const count = importItems(result.items, selectedCampaignId, mode);
                itemImportError = "";
                itemImportSuccess = `✓ Successfully ${mode === "add" ? "added" : "imported"} ${count} item${count !== 1 ? "s" : ""}!`;
                campaignItems = loadCampaignItemsByCampaign(selectedCampaignId);
                setTimeout(() => {
                    itemImportSuccess = "";
                }, 3000);
            } else {
                itemImportError =
                    "Failed to import. Please ensure the file is a valid items export.";
                itemImportSuccess = "";
            }
        };

        reader.onerror = () => {
            itemImportError = "Failed to read file.";
            itemImportSuccess = "";
        };

        reader.readAsText(file);
        target.value = "";
    }

    function handleOpenItemLibrary() {
        showItemLibraryModal = true;
    }

    function handleItemCreated() {
        campaignItems = loadCampaignItemsByCampaign(selectedCampaignId);
    }

    function handleItemDeleted() {
        campaignItems = loadCampaignItemsByCampaign(selectedCampaignId);
    }

    function handleItemLibraryClose() {
        showItemLibraryModal = false;
    }
</script>

<div>
    {#if campaigns.length === 0}
        <div
            class="rounded-lg border border-(--border-primary) bg-(--bg-secondary) p-4 text-center">
            <p class="m-0 text-(--text-secondary) italic">
                No campaigns found. Create a campaign first to manage items.
            </p>
        </div>
    {:else}
        <div class="flex flex-col gap-3">
            <!-- Campaign Selector -->
            <div class="relative">
                <button
                    type="button"
                    class="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-(--border-primary) bg-(--bg-secondary) px-3 py-3 text-left text-base text-(--text-primary) transition-all hover:bg-(--bg-tertiary)"
                    on:click={() => (showCampaignDropdown = !showCampaignDropdown)}>
                    <span class="truncate">
                        {campaigns.find((c) => c.id === selectedCampaignId)?.title ||
                            "Select a campaign..."}
                    </span>
                    <svg
                        class="h-4 w-4 shrink-0 transition-transform {showCampaignDropdown
                            ? 'rotate-180'
                            : ''}"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </button>
                {#if showCampaignDropdown}
                    <div
                        class="absolute top-full right-0 left-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-md border border-(--border-primary) bg-(--card-bg) shadow-lg">
                        {#each campaigns as campaign}
                            <button
                                type="button"
                                class="w-full cursor-pointer border-none bg-transparent px-3 py-2 text-left text-sm text-(--text-primary) hover:bg-(--bg-secondary) {campaign.id ===
                                selectedCampaignId
                                    ? 'bg-(--bg-secondary) font-medium'
                                    : ''}"
                                on:click={() => {
                                    selectedCampaignId = campaign.id;
                                    showCampaignDropdown = false;
                                }}>
                                <span class="truncate">{campaign.title}</span>
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>

            {#if selectedCampaignId}
                <!-- Export/Import Buttons -->
                <div class="flex gap-2">
                    <button
                        class="border-border-primary bg-accent-primary hover:bg-accent-primary-hover active:bg-accent-primary-active flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-base font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
                        on:click={handleExportItems}
                        disabled={campaignItems.length === 0}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="1.25em"
                            height="1.25em"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Export ({campaignItems.length})
                    </button>
                    <button
                        class="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-(--border-primary) bg-(--bg-secondary) px-4 py-3 text-base font-medium text-(--text-primary) transition-all duration-200 hover:-translate-y-px hover:bg-(--bg-tertiary) hover:shadow-md active:translate-y-0"
                        on:click={handleItemImportClick}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="1.25em"
                            height="1.25em"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Import
                    </button>
                </div>
            {/if}
        </div>
    {/if}

    <input
        type="file"
        accept=".json"
        bind:this={itemFileInput}
        on:change={handleItemFileSelect}
        style="display: none;" />

    {#if itemImportError}
        <div class="bg-danger-bg border-danger text-danger-text mt-4 rounded border-l-4 p-4">
            {itemImportError}
        </div>
    {/if}

    {#if itemImportSuccess}
        <div class="bg-success-bg border-success text-success-text mt-4 rounded border-l-4 p-4">
            {itemImportSuccess}
        </div>
    {/if}

    {#if selectedCampaignId}
        <div class="mt-4 flex justify-center">
            <button
                class="flex cursor-pointer items-center gap-1.5 rounded-md border border-(--border-primary) bg-(--bg-secondary) px-3 py-2 text-sm font-medium text-(--text-primary) transition-all hover:bg-(--bg-tertiary)"
                on:click={handleOpenItemLibrary}>
                <svg viewBox="0 0 24 24" width="1.2em" height="1.2em" fill="currentColor">
                    <path
                        d="M12 9c2.21 0 4-1.79 4-4s-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4m0-6c1.1 0 2 .9 2 2s-.9 2-2 2s-2-.9-2-2s.9-2 2-2m0 8.55C9.64 9.35 6.48 8 3 8v11c3.48 0 6.64 1.35 9 3.55c2.36-2.19 5.52-3.55 9-3.55V8c-3.48 0-6.64 1.35-9 3.55m7 5.58c-2.53.34-4.93 1.3-7 2.82a15.2 15.2 0 0 0-7-2.83v-6.95c2.1.38 4.05 1.35 5.64 2.83L12 14.28l1.36-1.27A11.2 11.2 0 0 1 19 10.18z" />
                </svg>
                Open Library
            </button>
        </div>
    {/if}

    <p class="text-text-tertiary mt-4 mb-0 text-center text-xs">
        Items can be imported into any campaign without ID conflicts.
    </p>
</div>

{#if selectedCampaignId && showItemLibraryModal}
    <ItemLibraryModal
        bind:show={showItemLibraryModal}
        campaignId={selectedCampaignId}
        {campaignItems}
        onItemCreated={handleItemCreated}
        onItemDeleted={handleItemDeleted}
        onClose={handleItemLibraryClose} />
{/if}
