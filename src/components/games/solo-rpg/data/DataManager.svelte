<script lang="ts">
    import { 
        importData,
        downloadDataFile, 
    } from "./storage-utils";
    import "../solo-rpg-styles.css";

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

<div class="info-card content">
    <div class="header">
        <h2>Data Manager</h2>
    </div>

    <div class="body">
        <p class="description">
            Export all your Solo RPG data to a file or import data from another
            device. Importing will overwrite your current data.
        </p>

        <div class="srpg-b-group-vertical">
            <button class="srpg-b srpg-b-normal" on:click={handleExport}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width='1.5em' height='1.5em' {...$$props}><path fill="currentColor" d="M18 15v3H6v-3H4v3c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-3zM7 9l1.41 1.41L11 7.83V16h2V7.83l2.59 2.58L17 9l-5-5z"/></svg>
                Export Data
            </button>

            <button
                class="srpg-b srpg-b-create"
                on:click={handleImportClick}
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width='1.5em' height='1.5em' {...$$props}><path fill="currentColor" d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7zm-6 .67l2.59-2.58L17 11.5l-5 5l-5-5l1.41-1.41L11 12.67V3h2z"/></svg>
                Import Data
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
            <div class="success-message">✓ Data imported successfully!</div>
        {/if}
    </div>
</div>

<style> 
    .content {
        padding: 0;
        max-width: 500px;
        width: 100%;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid var(--border-primary);
    }

    .header h2 {
        margin: 0;
        font-size: 1.5rem;
        color: var(--text-primary);
    }

    .body {
        padding: 1.5rem;
    }

    .description {
        color: var(--text-secondary);
        margin-top: 0;
        margin-bottom: 1.5rem;
        line-height: 1.6;
    }

    .error-message {
        margin-top: 1rem;
        padding: 1rem;
        background-color: var(--danger-bg);
        border-left: 4px solid var(--danger);
        color: var(--danger-text);
        border-radius: 4px;
    }

    .success-message {
        margin-top: 1rem;
        padding: 1rem;
        background-color: var(--success-bg);
        border-left: 4px solid var(--success);
        color: var(--success-text);
        border-radius: 4px;
    }
</style>
