<script lang="ts">
    import {
        importData,
        downloadDataFile,
        loadGameBlueprints,
        downloadBlueprintFile,
        parseImportedBlueprints,
        importBlueprints,
        type GameBlueprint,
    } from "./storage-utils";
    import ItemsDataSection from "./ItemsDataSection.svelte";

    let fileInput: HTMLInputElement;
    let blueprintFileInput: HTMLInputElement;
    let importError = "";
    let importSuccess = false;
    let blueprintImportError = "";
    let blueprintImportSuccess = "";
    let blueprints: GameBlueprint[] = [];
    let selectedBlueprintId = "";
    let showBlueprintDropdown = false;

    // Collapsible section states (collapsed by default)
    let isDataSectionOpen = false;
    let isBlueprintSectionOpen = false;
    let isItemsSectionOpen = false;

    // Load blueprints on mount
    $: {
        blueprints = loadGameBlueprints();
        if (blueprints.length > 0 && !selectedBlueprintId) {
            selectedBlueprintId = blueprints[0].id;
        }
    }

    function handleExport() {
        downloadDataFile();
    }

    function handleImportClick() {
        const confirmed = confirm(
            "⚠️ Warning: Importing will overwrite ALL your current data.\n\nThis action cannot be undone. Are you sure you want to continue?"
        );
        if (confirmed) {
            fileInput.click();
        }
    }

    function handleFileSelect(event: Event) {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];

        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            const success = importData(content);

            if (success) {
                importError = "";
                importSuccess = true;
                setTimeout(() => {
                    importSuccess = false;
                }, 1500);
            } else {
                importError =
                    "Failed to import file. Please ensure it is a valid Solo RPG data file.";
                importSuccess = false;
            }
        };

        reader.onerror = () => {
            importError = "Failed to read file.";
            importSuccess = false;
        };

        reader.readAsText(file);

        // Reset the input so the same file can be selected again
        target.value = "";
    }

    function handleExportSingleBlueprint() {
        const blueprint = blueprints.find((b) => b.id === selectedBlueprintId);
        if (blueprint) {
            downloadBlueprintFile(blueprint);
        }
    }

    function handleBlueprintImportClick() {
        blueprintFileInput.click();
    }

    function handleBlueprintFileSelect(event: Event) {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];

        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            const result = parseImportedBlueprints(content);

            if (result) {
                const count = importBlueprints(result.blueprints);
                blueprintImportError = "";
                blueprintImportSuccess = `✓ Successfully imported ${count} blueprint${count !== 1 ? "s" : ""}!`;
                blueprints = loadGameBlueprints(); // Refresh the list
                setTimeout(() => {
                    blueprintImportSuccess = "";
                }, 3000);
            } else {
                blueprintImportError =
                    "Failed to import. Please ensure the file is a valid blueprint export.";
                blueprintImportSuccess = "";
            }
        };

        reader.onerror = () => {
            blueprintImportError = "Failed to read file.";
            blueprintImportSuccess = "";
        };

        reader.readAsText(file);
        target.value = "";
    }
</script>

<div
    class="bg-card-bg text-text-primary border-card-border mx-auto w-full max-w-[600px] rounded-lg border p-0 shadow-md">
    <!-- Header -->
    <div class="border-border-primary flex items-center justify-between border-b p-6">
        <h2 class="text-text-primary m-0 text-2xl">Data Manager</h2>
    </div>

    <!-- Full Data Section -->
    <div class="border-border-primary border-b">
        <button
            type="button"
            class="flex w-full cursor-pointer items-center justify-between bg-transparent p-4 text-left transition-colors hover:bg-(--bg-secondary)"
            on:click={() => (isDataSectionOpen = !isDataSectionOpen)}>
            <div class="flex items-center gap-3">
                <svg
                    class="h-4 w-4 shrink-0 transition-transform {isDataSectionOpen ? 'rotate-90' : ''}"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2">
                    <polyline points="9 18 15 12 9 6" />
                </svg>
                <div>
                    <h3 class="m-0 text-base font-semibold text-(--text-primary)">Full Data Export/Import</h3>
                    <p class="m-0 text-xs text-(--text-secondary)">Export or import all your Solo RPG data</p>
                </div>
            </div>
        </button>

        {#if isDataSectionOpen}
            <div class="px-6 pb-6">
                <div class="flex flex-col gap-3">
                    <button
                        class="border-border-primary bg-accent-primary hover:bg-accent-primary-hover active:bg-accent-primary-active flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
                        on:click={handleExport}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="1.5em"
                            height="1.5em">
                            <path
                                fill="currentColor"
                                d="M18 15v3H6v-3H4v3c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-3zM7 9l1.41 1.41L11 7.83V16h2V7.83l2.59 2.58L17 9l-5-5z" />
                        </svg>
                        Export Everything
                    </button>

                    <button
                        class="border-border-primary bg-accent-success hover:bg-accent-success-hover active:bg-accent-success-active flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
                        on:click={handleImportClick}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="1.5em"
                            height="1.5em">
                            <path
                                fill="currentColor"
                                d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7zm-6 .67l2.59-2.58L17 11.5l-5 5l-5-5l1.41-1.41L11 12.67V3h2z" />
                        </svg>
                        Import (overwrites all data)
                    </button>
                </div>

                <input
                    type="file"
                    accept=".json"
                    bind:this={fileInput}
                    on:change={handleFileSelect}
                    style="display: none;" />

                {#if importError}
                    <div class="bg-danger-bg border-danger text-danger-text mt-4 rounded border-l-4 p-4">
                        {importError}
                    </div>
                {/if}

                {#if importSuccess}
                    <div class="bg-success-bg border-success text-success-text mt-4 rounded border-l-4 p-4">
                        ✓ Data imported successfully!
                    </div>
                {/if}
            </div>
        {/if}
    </div>

    <!-- Blueprint Sharing Section -->
    <div class="border-border-primary border-b">
        <button
            type="button"
            class="flex w-full cursor-pointer items-center justify-between bg-transparent p-4 text-left transition-colors hover:bg-(--bg-secondary)"
            on:click={() => (isBlueprintSectionOpen = !isBlueprintSectionOpen)}>
            <div class="flex items-center gap-3">
                <svg
                    class="h-4 w-4 shrink-0 transition-transform {isBlueprintSectionOpen ? 'rotate-90' : ''}"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2">
                    <polyline points="9 18 15 12 9 6" />
                </svg>
                <div>
                    <h3 class="m-0 text-base font-semibold text-(--text-primary)">Game Blueprints</h3>
                    <p class="m-0 text-xs text-(--text-secondary)">Export and import game blueprints</p>
                </div>
            </div>
        </button>

        {#if isBlueprintSectionOpen}
            <div class="px-6 pb-6">
                {#if blueprints.length === 0}
                    <div
                        class="rounded-lg border border-(--border-primary) bg-(--bg-secondary) p-4 text-center">
                        <p class="m-0 text-(--text-secondary) italic">
                            No game blueprints found. Create a game first to export blueprints.
                        </p>
                    </div>
                {:else}
                    <div class="flex flex-col gap-3">
                        <!-- Export Single Blueprint -->
                        <div class="flex gap-2">
                            <div class="relative flex-1">
                                <button
                                    type="button"
                                    class="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-(--border-primary) bg-(--bg-secondary) px-3 py-3 text-left text-base text-(--text-primary) transition-all hover:bg-(--bg-tertiary)"
                                    on:click={() => (showBlueprintDropdown = !showBlueprintDropdown)}>
                                    <span class="truncate">
                                        {blueprints.find((b) => b.id === selectedBlueprintId)?.title ||
                                            "Select blueprint..."}
                                    </span>
                                    <svg
                                        class="h-4 w-4 shrink-0 transition-transform {showBlueprintDropdown
                                            ? 'rotate-180'
                                            : ''}"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2">
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>
                                {#if showBlueprintDropdown}
                                    <div
                                        class="absolute top-full right-0 left-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-md border border-(--border-primary) bg-(--card-bg) shadow-lg">
                                        {#each blueprints as blueprint}
                                            <button
                                                type="button"
                                                class="w-full cursor-pointer border-none bg-transparent px-3 py-2 text-left text-sm text-(--text-primary) hover:bg-(--bg-secondary) {blueprint.id ===
                                                selectedBlueprintId
                                                    ? 'bg-(--bg-secondary) font-medium'
                                                    : ''}"
                                                on:click={() => {
                                                    selectedBlueprintId = blueprint.id;
                                                    showBlueprintDropdown = false;
                                                }}>
                                                <span class="truncate">{blueprint.title}</span>
                                                <span class="ml-2 text-xs text-(--text-secondary)">
                                                    ({blueprint.defaultFortunes.length} fortune{blueprint
                                                        .defaultFortunes.length !== 1
                                                        ? "s"
                                                        : ""})
                                                </span>
                                            </button>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                            <button
                                class="border-border-primary bg-accent-primary hover:bg-accent-primary-hover active:bg-accent-primary-active flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-base font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
                                on:click={handleExportSingleBlueprint}
                                disabled={!selectedBlueprintId}>
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
                                Export
                            </button>
                        </div>
                    </div>
                {/if}

                <!-- Import Blueprints -->
                <div class="mt-4">
                    <button
                        class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-(--border-primary) bg-(--bg-secondary) px-4 py-3 text-base font-medium text-(--text-primary) transition-all duration-200 hover:-translate-y-px hover:bg-(--bg-tertiary) hover:shadow-md active:translate-y-0"
                        on:click={handleBlueprintImportClick}>
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
                        Import Blueprint File
                    </button>
                </div>

                <input
                    type="file"
                    accept=".json"
                    bind:this={blueprintFileInput}
                    on:change={handleBlueprintFileSelect}
                    style="display: none;" />

                {#if blueprintImportError}
                    <div class="bg-danger-bg border-danger text-danger-text mt-4 rounded border-l-4 p-4">
                        {blueprintImportError}
                    </div>
                {/if}

                {#if blueprintImportSuccess}
                    <div class="bg-success-bg border-success text-success-text mt-4 rounded border-l-4 p-4">
                        {blueprintImportSuccess}
                    </div>
                {/if}

                <p class="text-text-tertiary mt-4 mb-0 text-center text-xs">
                    Blueprints include game title and all default fortunes.
                </p>
            </div>
        {/if}
    </div>

    <!-- Items Section -->
    <div class="border-border-primary">
        <button
            type="button"
            class="flex w-full cursor-pointer items-center justify-between bg-transparent p-4 text-left transition-colors hover:bg-(--bg-secondary)"
            on:click={() => (isItemsSectionOpen = !isItemsSectionOpen)}>
            <div class="flex items-center gap-3">
                <svg
                    class="h-4 w-4 shrink-0 transition-transform {isItemsSectionOpen ? 'rotate-90' : ''}"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2">
                    <polyline points="9 18 15 12 9 6" />
                </svg>
                <div>
                    <h3 class="m-0 text-base font-semibold text-(--text-primary)">Item Library</h3>
                    <p class="m-0 text-xs text-(--text-secondary)">Export and import item definitions</p>
                </div>
            </div>
        </button>

        {#if isItemsSectionOpen}
            <div class="px-6 pb-6">
                <ItemsDataSection />
            </div>
        {/if}
    </div>
</div>
