<script lang="ts">
    import "../solo-rpg-styles.css";

    let fileInput: HTMLInputElement;
    let importError = "";
    let importSuccess = false;

    function handleFileSelect(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
            importTilemapData(file)
                .then(() => {
                    importSuccess = true;
                    importError = "";
                })
                .catch((error) => {
                    importError = "Failed to import tilemap data: " + error.message;
                    importSuccess = false;
                });
        }
    } 

    function importTilemapData(file: File): Promise<void> {
        alert("Import Tilemap Data functionality is not yet implemented.");
        return Promise.resolve();
    }

</script>

 
<div class="info-card content">
    <div class="header">
        <h2>Tilemap Manager</h2>
    </div>

    <div class="body">
        <p class="description">
            Import a tilesheet for use in the Map tool.
            <br />
            Supported formats are PNG and JPEG.
        </p> 

        <div class="srpg-b-group-vertical">
            <!-- TODO --> 
        </div>

        <input
            type="file"
            accept=".jpg,.jpeg,.png"
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