<script lang="ts">
    import {
        exportData,
        importData,
        downloadDataFile,
        loadData,
    } from "../storage-utils";

    export let onDataImported: () => void;
    // Props kept for backwards compatibility but not used in page mode

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
                    onDataImported();
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

<div class="data-manager-page">
    <div class="content">
        <div class="header">
            <h2>Data Manager</h2>
        </div>

        <div class="body">
            <p class="description">
                Export your Solo RPG data to a file or import data from
                another device. Importing will overwrite your current data.
            </p>

            <div class="button-group">
                <button
                    class="action-button export-button"
                    on:click={handleExport}
                >
                    📥 Export Data
                </button>

                <button
                    class="action-button import-button"
                    on:click={handleImportClick}
                >
                    📤 Import Data
                </button>
            </div>

            <input
                type="file"
                accept=".json"
                bind:this={fileInput}
                on:change={handleFileSelect}
                style="display: none;"
            />

            {#if importError}
                <div class="error-message">
                    {importError}
                </div>
            {/if}

            {#if importSuccess}
                <div class="success-message">
                    ✓ Data imported successfully!
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .data-manager-page {
        width: 100%;
    }

    .content {
        background-color: white;
        border-radius: 8px;
        max-width: 500px;
        width: 100%;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        margin: 0 auto;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
    }

    .header h2 {
        margin: 0;
        font-size: 1.5rem;
        color: #1f2937;
    }

    .body {
        padding: 1.5rem;
    }

    .description {
        color: #4b5563;
        margin-bottom: 1.5rem;
        line-height: 1.6;
    }

    .button-group {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .action-button {
        padding: 1rem;
        font-size: 1rem;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }

    .export-button {
        background-color: #3b82f6;
        color: white;
    }

    .export-button:hover {
        background-color: #2563eb;
    }

    .import-button {
        background-color: #10b981;
        color: white;
    }

    .import-button:hover {
        background-color: #059669;
    }

    .error-message {
        margin-top: 1rem;
        padding: 1rem;
        background-color: #fee2e2;
        border-left: 4px solid #ef4444;
        color: #991b1b;
        border-radius: 4px;
    }

    .success-message {
        margin-top: 1rem;
        padding: 1rem;
        background-color: #d1fae5;
        border-left: 4px solid #10b981;
        color: #065f46;
        border-radius: 4px;
    }

    @media (min-width: 640px) {
        .button-group {
            flex-direction: row;
        }

        .action-button {
            flex: 1;
        }
    }
</style>
