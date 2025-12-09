<script lang="ts">
    /**
     * QuickStatsModal.svelte
     *
     * Modal for adding/editing quick stats on unassigned tokens.
     * Allows setting a name (required) and optionally tracking hit points.
     */
    import { createEventDispatcher } from "svelte";
    import { slide } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import type { QuickStats } from "../data/storage-utils";

    export let show: boolean = false;
    export let existingStats: QuickStats | null = null;

    const dispatch = createEventDispatcher<{
        save: { quickStats: QuickStats };
        close: void;
    }>();

    // Form state
    let name = "";
    let trackHP = false;
    let currentHP = 10;
    let maxHP = 10;

    // Reset form when modal opens
    $: if (show) {
        if (existingStats) {
            name = existingStats.name ?? "";
            trackHP = existingStats.maxHitPoints !== undefined;
            currentHP = existingStats.currentHitPoints ?? 10;
            maxHP = existingStats.maxHitPoints ?? 10;
        } else {
            name = "";
            trackHP = false;
            currentHP = 10;
            maxHP = 10;
        }
    }

    // Validation
    $: canSave = name.trim().length > 0;
    $: isEditing = existingStats !== null;

    function handleSave() {
        if (!canSave) return;

        const quickStats: QuickStats = {
            name: name.trim(),
        };

        if (trackHP) {
            quickStats.maxHitPoints = maxHP;
            quickStats.currentHitPoints = Math.min(currentHP, maxHP);
        }

        dispatch("save", { quickStats });
    }

    function handleClose() {
        dispatch("close");
    }

    function handleBackdropClick() {
        handleClose();
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            handleClose();
        }
    }

    // Clamp current HP when max changes
    function handleMaxHPChange() {
        if (currentHP > maxHP) {
            currentHP = maxHP;
        }
    }
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
                <h3>{isEditing ? "Edit Stats" : "Add Stats"}</h3>
                <button class="modal-close" on:click={handleClose} aria-label="Close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div class="modal-content">
                <!-- Name Field -->
                <div class="form-group">
                    <label for="quick-stats-name" class="form-label">
                        Name <span class="required">*</span>
                    </label>
                    <input
                        id="quick-stats-name"
                        type="text"
                        class="form-input"
                        placeholder="Enter name..."
                        bind:value={name}
                        autofocus />
                </div>

                <!-- Track HP Checkbox -->
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" class="checkbox-input" bind:checked={trackHP} />
                        <span class="checkbox-text">Track Hit Points</span>
                    </label>
                </div>

                <!-- HP Fields (shown when tracking HP) -->
                {#if trackHP}
                    <div class="hp-fields" transition:slide={{ duration: 200, easing: quintOut }}>
                        <div class="hp-field">
                            <label for="quick-stats-current-hp" class="form-label">
                                Current HP
                            </label>
                            <input
                                id="quick-stats-current-hp"
                                type="number"
                                class="form-input hp-input"
                                min="0"
                                max={maxHP}
                                bind:value={currentHP} />
                        </div>
                        <div class="hp-field">
                            <label for="quick-stats-max-hp" class="form-label">Max HP</label>
                            <input
                                id="quick-stats-max-hp"
                                type="number"
                                class="form-input hp-input"
                                min="1"
                                bind:value={maxHP}
                                on:change={handleMaxHPChange} />
                        </div>
                    </div>
                {/if}
            </div>

            <div class="modal-footer">
                <button class="btn-cancel" on:click={handleClose}>Cancel</button>
                <button
                    class="btn-save"
                    on:click={handleSave}
                    disabled={!canSave}
                    title={!canSave ? "Name is required" : ""}>
                    Save
                </button>
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
        padding-bottom: calc(80px + env(safe-area-inset-bottom));
    }

    @media (min-width: 768px) {
        .modal-backdrop {
            padding: 1rem;
            padding-left: calc(170px + 1rem);
        }
    }

    .modal {
        background: var(--bg-elevated);
        border: 1px solid var(--border-primary);
        border-radius: 12px;
        box-shadow: var(--shadow-xl);
        max-width: 360px;
        width: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        border-bottom: 1px solid var(--border-primary);
    }

    .modal-header h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .modal-close {
        background: none;
        border: none;
        padding: 0.25rem;
        cursor: pointer;
        color: var(--text-secondary);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
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
        gap: 1rem;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
    }

    .form-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
    }

    .required {
        color: var(--accent-danger);
    }

    .form-input {
        padding: 0.625rem 0.75rem;
        font-size: 0.9375rem;
        color: var(--text-primary);
        background: var(--input-bg);
        border: 1px solid var(--input-border);
        border-radius: 6px;
        transition: border-color 0.15s ease;
    }

    .form-input::placeholder {
        color: var(--text-muted);
    }

    .form-input:focus {
        outline: none;
        border-color: var(--accent-primary);
    }

    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        padding: 0.25rem 0;
    }

    .checkbox-input {
        width: 1.125rem;
        height: 1.125rem;
        accent-color: var(--accent-primary);
        cursor: pointer;
    }

    .checkbox-text {
        font-size: 0.9375rem;
        color: var(--text-primary);
    }

    .hp-fields {
        display: flex;
        gap: 1rem;
        padding-top: 0.25rem;
    }

    .hp-field {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
    }

    .hp-input {
        text-align: center;
        font-weight: 600;
    }

    .modal-footer {
        display: flex;
        gap: 0.75rem;
        padding: 1rem;
        border-top: 1px solid var(--border-primary);
    }

    .btn-cancel,
    .btn-save {
        flex: 1;
        padding: 0.625rem 1rem;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .btn-cancel {
        background: var(--bg-secondary);
        border: 1px solid var(--border-primary);
        color: var(--text-secondary);
    }

    .btn-cancel:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .btn-save {
        background: var(--accent-primary);
        border: 1px solid var(--accent-primary);
        color: white;
    }

    .btn-save:hover:not(:disabled) {
        background: var(--accent-primary-hover);
    }

    .btn-save:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>
