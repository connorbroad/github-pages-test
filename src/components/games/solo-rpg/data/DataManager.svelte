<script lang="ts">
    import { importData, downloadDataFile } from "./storage-utils";

    let fileInput: HTMLInputElement;
    let importError = "";
    let importSuccess = false;

    function handleExport() {
        downloadDataFile();
    }

    function handleImportClick() {
        fileInput.click();
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
</script>

<div
    class="bg-card-bg text-text-primary border-card-border mx-auto w-full max-w-[500px] rounded-lg border p-0 shadow-md">
    <div class="border-border-primary flex items-center justify-between border-b p-6">
        <h2 class="text-text-primary m-0 text-2xl">Data Manager</h2>
    </div>

    <div class="p-6">
        <p class="text-text-secondary mt-0 mb-6 leading-relaxed">
            Export all your Solo RPG data to a file or import data from another device. Importing
            will overwrite your current data.
        </p>

        <div class="flex flex-col gap-3">
            <button
                class="border-border-primary bg-accent-primary hover:bg-accent-primary-hover active:bg-accent-primary-active flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
                on:click={handleExport}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="1.5em"
                    height="1.5em"
                    {...$$props}>
                    <path
                        fill="currentColor"
                        d="M18 15v3H6v-3H4v3c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-3zM7 9l1.41 1.41L11 7.83V16h2V7.83l2.59 2.58L17 9l-5-5z" />
                </svg>
                Export Data
            </button>

            <button
                class="border-border-primary bg-accent-success hover:bg-accent-success-hover active:bg-accent-success-active flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
                on:click={handleImportClick}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="1.5em"
                    height="1.5em"
                    {...$$props}>
                    <path
                        fill="currentColor"
                        d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7zm-6 .67l2.59-2.58L17 11.5l-5 5l-5-5l1.41-1.41L11 12.67V3h2z" />
                </svg>
                Import Data
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
</div>

