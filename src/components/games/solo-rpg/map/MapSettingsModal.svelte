<script lang="ts">
    /**
     * MapSettingsModal.svelte
     *
     * Modal for configuring map display settings:
     * - Background color (theme or custom)
     * - Grid color
     * - Grid thickness
     * - Background tile opacity
     */
    import type { MapSettings } from "../data/storage-utils";
    import { COLOR_PALETTE } from "./shared/color-palette";
    import { mapState } from "./map-state.svelte";

    interface Props {
        show: boolean;
        currentSettings: MapSettings | undefined;
        onSave: (settings: MapSettings) => void;
        onClose: () => void;
    }

    let { show, currentSettings, onSave, onClose }: Props = $props();

    // Local state for form values
    let useThemeBackground = $state(true);
    let customBackgroundColor = $state("#111");
    let gridColor = $state("");
    let gridThickness = $state(1);
    let gridOpacity = $state(1);
    let backgroundTileOpacity = $state(1);

    // Store original settings for cancel
    let originalSettings: MapSettings | undefined;

    // Color picker modal states
    let showBgColorPicker = $state(false);
    let showGridColorPicker = $state(false);

    // Initialize form when modal opens
    $effect(() => {
        if (show) {
            originalSettings = currentSettings ? { ...currentSettings } : undefined;
            useThemeBackground = currentSettings?.useThemeBackground !== false;
            customBackgroundColor = currentSettings?.customBackgroundColor || "#111";
            gridColor = currentSettings?.gridColor || "";
            gridThickness = currentSettings?.gridThickness ?? 1;
            gridOpacity = currentSettings?.gridOpacity ?? 1;
            backgroundTileOpacity = currentSettings?.backgroundTileOpacity ?? 1;
        }
    });

    // Live preview: update mapState when opacity changes
    function handleOpacityChange(e: Event) {
        const value = parseFloat((e.target as HTMLInputElement).value);
        backgroundTileOpacity = value;
        // Apply live preview
        applyLivePreview();
    }

    function handleThicknessChange(e: Event) {
        const value = parseFloat((e.target as HTMLInputElement).value);
        gridThickness = value;
        applyLivePreview();
    }

    function handleGridOpacityChange(e: Event) {
        const value = parseFloat((e.target as HTMLInputElement).value);
        gridOpacity = value;
        applyLivePreview();
    }

    function applyLivePreview() {
        const previewSettings: MapSettings = {
            useThemeBackground,
            customBackgroundColor: useThemeBackground ? undefined : customBackgroundColor,
            gridColor: gridColor || undefined,
            gridThickness,
            gridOpacity,
            backgroundTileOpacity,
        };
        mapState.updateSettings(previewSettings);
    }

    function handleBackgroundModeChange(useTheme: boolean) {
        useThemeBackground = useTheme;
        applyLivePreview();
    }

    function handleBgColorSelect(color: string) {
        customBackgroundColor = color;
        showBgColorPicker = false;
        applyLivePreview();
    }

    function handleGridColorSelect(color: string) {
        gridColor = color;
        showGridColorPicker = false;
        applyLivePreview();
    }

    function handleClearGridColor() {
        gridColor = "";
        showGridColorPicker = false;
        applyLivePreview();
    }

    function handleSave() {
        const settings: MapSettings = {
            useThemeBackground,
            customBackgroundColor: useThemeBackground ? undefined : customBackgroundColor,
            gridColor: gridColor || undefined,
            gridThickness,
            gridOpacity,
            backgroundTileOpacity,
        };
        onSave(settings);
    }

    function handleCancel() {
        // Restore original settings
        if (originalSettings) {
            mapState.updateSettings(originalSettings);
        } else {
            mapState.updateSettings({});
        }
        onClose();
    }

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            handleCancel();
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            handleCancel();
        }
    }

    // Flatten color palette for picker
    const allColors = Object.values(COLOR_PALETTE).flat();
</script>

{#if show}
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
    <div
        class="modal-backdrop"
        on:click={handleBackdropClick}
        on:keydown={handleKeydown}
        role="dialog"
        aria-modal="true"
        tabindex="-1">
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
        <div class="modal" on:click|stopPropagation role="document">
            <div class="modal-header">
                <h3>Map Settings</h3>
                <button class="modal-close" on:click={handleCancel} aria-label="Close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div class="modal-content">
                <!-- Background Color -->
                <div class="form-group">
                    <label class="form-label">Background</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input
                                type="radio"
                                name="bgMode"
                                checked={useThemeBackground}
                                on:change={() => handleBackgroundModeChange(true)} />
                            <span>Theme</span>
                        </label>
                        <label class="radio-option">
                            <input
                                type="radio"
                                name="bgMode"
                                checked={!useThemeBackground}
                                on:change={() => handleBackgroundModeChange(false)} />
                            <span>Custom</span>
                        </label>
                        {#if !useThemeBackground}
                            <button
                                class="color-swatch-btn"
                                on:click={() => (showBgColorPicker = !showBgColorPicker)}
                                aria-label="Select background color">
                                <div
                                    class="color-swatch"
                                    style="background: {customBackgroundColor}">
                                </div>
                            </button>
                        {/if}
                    </div>
                    {#if showBgColorPicker && !useThemeBackground}
                        <div class="color-picker">
                            {#each allColors as color}
                                <button
                                    class="picker-swatch"
                                    class:active={customBackgroundColor === color}
                                    style="background: {color}"
                                    on:click={() => handleBgColorSelect(color)}
                                    aria-label={color}>
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>

                <!-- Background Tile Opacity -->
                <div class="form-group">
                    <label class="form-label">
                        Background Tile Opacity
                        <span class="value-display">
                            {Math.round(backgroundTileOpacity * 100)}%
                        </span>
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={backgroundTileOpacity}
                        on:input={handleOpacityChange}
                        class="slider" />
                </div>

                <!-- Grid Color -->
                <div class="form-group">
                    <label class="form-label">Grid Color</label>
                    <div class="color-row">
                        <button
                            class="color-swatch-btn"
                            on:click={() => (showGridColorPicker = !showGridColorPicker)}
                            aria-label="Select grid color">
                            <div
                                class="color-swatch"
                                class:default={!gridColor}
                                style="background: {gridColor || 'rgba(255,255,255,0.1)'}">
                            </div>
                        </button>
                        <span class="color-label">{gridColor || "Default"}</span>
                        {#if gridColor}
                            <button class="reset-btn" on:click={handleClearGridColor}>Reset</button>
                        {/if}
                    </div>
                    {#if showGridColorPicker}
                        <div class="color-picker">
                            {#each allColors as color}
                                <button
                                    class="picker-swatch"
                                    class:active={gridColor === color}
                                    style="background: {color}"
                                    on:click={() => handleGridColorSelect(color)}
                                    aria-label={color}>
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>

                <!-- Grid Thickness -->
                <div class="form-group">
                    <label class="form-label">
                        Grid Thickness
                        <span class="value-display">{gridThickness.toFixed(1)}</span>
                    </label>
                    <input
                        type="range"
                        min="0.5"
                        max="60"
                        step="0.1"
                        value={gridThickness}
                        on:input={handleThicknessChange}
                        class="slider" />
                </div>

                <!-- Grid Opacity -->
                <div class="form-group">
                    <label class="form-label">
                        Grid Opacity
                        <span class="value-display">{Math.round(gridOpacity * 100)}%</span>
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={gridOpacity}
                        on:input={handleGridOpacityChange}
                        class="slider" />
                </div>
            </div>

            <div class="modal-footer">
                <button class="btn btn-secondary" on:click={handleCancel}>Cancel</button>
                <button class="btn btn-primary" on:click={handleSave}>Save</button>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--modal-overlay);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 1rem;
        padding-bottom: calc(140px + env(safe-area-inset-bottom));
    }

    @media (min-width: 768px) {
        .modal-backdrop {
            padding: 1rem;
            padding-left: calc(80px + 1rem);
        }
    }

    .modal {
        background: var(--bg-elevated);
        border: 1px solid var(--border-primary);
        border-radius: 12px;
        box-shadow: var(--shadow-xl);
        width: min(320px, 90vw);
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .modal-header {
        padding: 1rem;
        border-bottom: 1px solid var(--border-primary);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .modal-header h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .modal-close {
        width: 2rem;
        height: 2rem;
        padding: 0;
        background: transparent;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        color: var(--text-muted);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
    }

    .modal-close:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .modal-close svg {
        width: 1.25rem;
        height: 1.25rem;
    }

    .modal-content {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        overflow-y: auto;
    }

    .modal-footer {
        padding: 1rem;
        border-top: 1px solid var(--border-primary);
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .form-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-primary);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .value-display {
        font-size: 0.75rem;
        color: var(--text-secondary);
        font-weight: 400;
    }

    .radio-group {
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    .radio-option {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.875rem;
        color: var(--text-secondary);
        cursor: pointer;
    }

    .radio-option input {
        accent-color: var(--accent-primary);
    }

    .color-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .color-label {
        font-size: 0.75rem;
        color: var(--text-muted);
    }

    .color-swatch-btn {
        padding: 0.25rem;
        background: transparent;
        border: 2px solid var(--border-primary);
        border-radius: 4px;
        cursor: pointer;
        transition: border-color 0.15s ease;
    }

    .color-swatch-btn:hover {
        border-color: var(--accent-primary);
    }

    .color-swatch {
        width: 20px;
        height: 20px;
        border-radius: 2px;
    }

    .color-swatch.default {
        border: 1px dashed var(--border-secondary);
    }

    .color-picker {
        display: flex;
        flex-wrap: wrap;
        gap: 0.375rem;
        padding: 0.5rem;
        background: var(--bg-tertiary);
        border-radius: 6px;
        margin-top: 0.25rem;
    }

    .picker-swatch {
        width: 24px;
        height: 24px;
        border: 2px solid transparent;
        border-radius: 4px;
        cursor: pointer;
        transition: border-color 0.15s ease;
    }

    .picker-swatch:hover {
        border-color: var(--border-secondary);
    }

    .picker-swatch.active {
        border-color: var(--accent-primary);
    }

    .reset-btn {
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
        background: transparent;
        border: 1px solid var(--border-primary);
        border-radius: 4px;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .reset-btn:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .slider {
        width: 100%;
        height: 4px;
        background: var(--bg-tertiary);
        border-radius: 2px;
        appearance: none;
        cursor: pointer;
    }

    .slider::-webkit-slider-thumb {
        appearance: none;
        width: 16px;
        height: 16px;
        background: var(--accent-primary);
        border-radius: 50%;
        cursor: pointer;
        transition: background 0.15s ease;
    }

    .slider::-webkit-slider-thumb:hover {
        background: var(--accent-primary-hover);
    }

    .slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        background: var(--accent-primary);
        border: none;
        border-radius: 50%;
        cursor: pointer;
    }

    .btn {
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .btn-secondary {
        background: transparent;
        border: 1px solid var(--border-primary);
        color: var(--text-secondary);
    }

    .btn-secondary:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .btn-primary {
        background: var(--accent-primary);
        border: none;
        color: white;
    }

    .btn-primary:hover {
        background: var(--accent-primary-hover);
    }
</style>
