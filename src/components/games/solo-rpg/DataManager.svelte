<script lang="ts">
    import { exportData, importData, downloadDataFile, loadData } from './storage-utils';
    
    export let show = false;
    export let onClose: () => void;
    export let onDataImported: () => void;

    let fileInput: HTMLInputElement;
    let importError = '';
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
                importError = '';
                importSuccess = true;
                setTimeout(() => {
                    importSuccess = false;
                    onDataImported();
                    onClose();
                }, 1500);
            } else {
                importError = 'Failed to import file. Please ensure it is a valid Solo RPG data file.';
                importSuccess = false;
            }
        };
        
        reader.onerror = () => {
            importError = 'Failed to read file.';
            importSuccess = false;
        };
        
        reader.readAsText(file);
        
        // Reset the input so the same file can be selected again
        target.value = '';
    }

    function handleClose() {
        importError = '';
        importSuccess = false;
        onClose();
    }

    function handleBackdropClick(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            handleClose();
        }
    }

    function handleBackdropKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            handleClose();
        }
    }
</script>

{#if show}
    <div class="modal-backdrop" on:click={handleBackdropClick} on:keydown={handleBackdropKeydown} role="button" tabindex="-1">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Data Manager</h2>
                <button class="close-button" on:click={handleClose}>&times;</button>
            </div>
            
            <div class="modal-body">
                <p class="description">
                    Export your Solo RPG data to a file or import data from another device.
                    Importing will overwrite your current data.
                </p>

                <div class="button-group">
                    <button class="action-button export-button" on:click={handleExport}>
                        📥 Export Data
                    </button>
                    
                    <button class="action-button import-button" on:click={handleImportClick}>
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
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        padding: 1rem;
    }

    .modal-content {
        background-color: white;
        border-radius: 8px;
        max-width: 500px;
        width: 100%;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        max-height: 90vh;
        overflow-y: auto;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h2 {
        margin: 0;
        font-size: 1.5rem;
        color: #1f2937;
    }

    .close-button {
        background: none;
        border: none;
        font-size: 2rem;
        cursor: pointer;
        color: #6b7280;
        line-height: 1;
        padding: 0;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .close-button:hover {
        color: #1f2937;
    }

    .modal-body {
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
