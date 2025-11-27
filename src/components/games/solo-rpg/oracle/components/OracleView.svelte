<script context="module" lang="ts">
    // Persist section expansion states across component instances
    let persistedFortunesExpanded: boolean | null = null;
    let persistedCampaignFortunesExpanded: boolean | null = null;
</script>

<script lang="ts">
    /**
     * Oracle View Component
     * Displays fortune lists with collapsible sections for mobile-friendly navigation
     */
    import { createEventDispatcher, onMount } from "svelte";
    import type { Fortune } from "../scripts/oracleTypes";
    import FortuneList from "./FortuneList.svelte";

    export let defaultFortunes: Fortune[] = [];
    export let customFortunes: Fortune[] = [];
    export let editMode: boolean = false;

    const dispatch = createEventDispatcher();

    // Collapsible section states - restore from module state or use defaults
    let fortunesExpanded = persistedFortunesExpanded ?? true;
    let campaignFortunesExpanded = persistedCampaignFortunesExpanded ?? true;

    // Check if on mobile for initial state (only if no persisted state)
    onMount(() => {
        if (
            persistedCampaignFortunesExpanded === null &&
            typeof window !== "undefined" &&
            window.innerWidth < 769
        ) {
            // On mobile, collapse campaign fortunes by default if there are default fortunes
            campaignFortunesExpanded = defaultFortunes.length === 0;
        }
    });

    function toggleFortunes() {
        fortunesExpanded = !fortunesExpanded;
        persistedFortunesExpanded = fortunesExpanded;
    }

    function toggleCampaignFortunes() {
        campaignFortunesExpanded = !campaignFortunesExpanded;
        persistedCampaignFortunesExpanded = campaignFortunesExpanded;
    }

    function handleConsultFate(fortune: Fortune) {
        dispatch("consultFate", fortune);
    }

    function handleDeleteFortune(id: string) {
        dispatch("delete", id);
    }

    function handleReorder(event: CustomEvent<{ draggedId: string; targetId: string }>) {
        dispatch("reorder", event.detail);
    }

    function handleCreateFortune() {
        dispatch("createFortune");
    }

    function handleToggleEditMode() {
        dispatch("toggleEditMode");
    }
</script>

<div class="srpg-oracle-view">
    <!-- Default Fortunes Section -->
    {#if defaultFortunes.length > 0}
        <section class="srpg-collapsible-section">
            <button
                class="srpg-collapsible-header"
                class:expanded={fortunesExpanded}
                on:click={toggleFortunes}
                aria-expanded={fortunesExpanded}
                aria-controls="fortunes-content">
                <h2 class="srpg-collapsible-title">Fortunes</h2>
                <span class="srpg-collapsible-count">{defaultFortunes.length}</span>
                <svg
                    class="srpg-collapsible-chevron"
                    class:rotated={fortunesExpanded}
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    aria-hidden="true">
                    <path
                        d="M6 9l6 6 6-6"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round" />
                </svg>
            </button>

            {#if fortunesExpanded}
                <div id="fortunes-content" class="srpg-collapsible-content">
                    <FortuneList
                        fortunes={defaultFortunes}
                        allowReorder={false}
                        allowDelete={false}
                        on:consultFate={(e) => handleConsultFate(e.detail)}
                        on:delete={(e) => handleDeleteFortune(e.detail)}
                        on:reorder={handleReorder} />
                </div>
            {/if}
        </section>
    {/if}

    <!-- Campaign Fortunes Section -->
    <section class="srpg-collapsible-section">
        <button
            class="srpg-collapsible-header"
            class:expanded={campaignFortunesExpanded}
            on:click={toggleCampaignFortunes}
            aria-expanded={campaignFortunesExpanded}
            aria-controls="campaign-fortunes-content">
            <h2 class="srpg-collapsible-title">Campaign Fortunes</h2>
            <span class="srpg-collapsible-count">{customFortunes.length}</span>
            <svg
                class="srpg-collapsible-chevron"
                class:rotated={campaignFortunesExpanded}
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                aria-hidden="true">
                <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round" />
            </svg>
        </button>

        {#if campaignFortunesExpanded}
            <div id="campaign-fortunes-content" class="srpg-collapsible-content">
                <!-- Action buttons -->
                <div class="srpg-oracle-actions">
                    <button
                        class="srpg-b srpg-b-create srpg-b-w-fill"
                        on:click={handleCreateFortune}>
                        <svg
                            viewBox="0 0 24 24"
                            width="18"
                            height="18"
                            fill="none"
                            aria-hidden="true"
                            class="shrink-0">
                            <path
                                d="M12 5v14M5 12h14"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round" />
                        </svg>
                        <span>Create Fortune</span>
                    </button>

                    <button
                        class="srpg-b srpg-b-simple"
                        on:click={handleToggleEditMode}
                        aria-label={editMode ? "Exit edit mode" : "Enter edit mode"}
                        aria-pressed={editMode}>
                        {#if editMode}
                            <svg
                                viewBox="0 0 24 24"
                                width="18"
                                height="18"
                                aria-hidden="true"
                                class="shrink-0">
                                <path
                                    fill="currentColor"
                                    d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
                            <span class="sr-only md:not-sr-only">Done</span>
                        {:else}
                            <svg
                                viewBox="0 0 24 24"
                                width="18"
                                height="18"
                                aria-hidden="true"
                                class="shrink-0">
                                <path
                                    fill="currentColor"
                                    d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                            </svg>
                            <span class="sr-only md:not-sr-only">Edit</span>
                        {/if}
                    </button>
                </div>

                {#if customFortunes.length > 0}
                    <FortuneList
                        fortunes={customFortunes}
                        allowReorder={editMode}
                        allowDelete={editMode}
                        on:consultFate={(e) => handleConsultFate(e.detail)}
                        on:delete={(e) => handleDeleteFortune(e.detail)}
                        on:reorder={handleReorder} />
                {:else}
                    <div class="srpg-empty-state">
                        <svg
                            viewBox="0 0 24 24"
                            width="32"
                            height="32"
                            fill="none"
                            aria-hidden="true"
                            class="srpg-empty-state-icon">
                            <circle
                                cx="12"
                                cy="10"
                                r="6"
                                stroke="currentColor"
                                stroke-width="1.5" />
                            <path
                                d="M6 18h12"
                                stroke="currentColor"
                                stroke-width="1.5"
                                stroke-linecap="round" />
                            <path
                                d="M8.5 6.5c.6-1 1.7-1.7 3-1.9"
                                stroke="currentColor"
                                stroke-width="1.5"
                                stroke-linecap="round" />
                        </svg>
                        <p class="srpg-empty-state-text">No campaign fortunes yet</p>
                        <p class="srpg-empty-state-hint">Create one above to get started!</p>
                    </div>
                {/if}
            </div>
        {/if}
    </section>
</div>

<style>
    /* Oracle View Container */
    .srpg-oracle-view {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    /* Collapsible Section */
    .srpg-collapsible-section {
        background: var(--card-bg);
        border: 1px solid var(--card-border);
        border-radius: 12px;
        overflow: hidden;
    }

    /* Collapsible Header */
    .srpg-collapsible-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        padding: 0.875rem 1rem;

        background: transparent;
        border: none;
        cursor: pointer;

        transition: background-color 0.2s ease;
    }

    .srpg-collapsible-header:hover {
        background: var(--bg-tertiary);
    }

    .srpg-collapsible-header.expanded {
        border-bottom: 1px solid var(--border-primary);
    }

    /* Collapsible Title */
    .srpg-collapsible-title {
        flex: 1;
        margin: 0;

        font-size: 0.95rem;
        font-weight: 600;
        color: var(--text-primary);
        text-align: left;
    }

    /* Count Badge */
    .srpg-collapsible-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 1.5rem;
        height: 1.5rem;
        padding: 0 0.5rem;

        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-secondary);

        background: var(--bg-tertiary);
        border-radius: 999px;
    }

    /* Chevron Icon */
    .srpg-collapsible-chevron {
        color: var(--text-muted);
        transition: transform 0.2s ease;
        flex-shrink: 0;
    }

    .srpg-collapsible-chevron.rotated {
        transform: rotate(180deg);
    }

    /* Collapsible Content */
    .srpg-collapsible-content {
        padding: 0 0.75rem;
    }

    /* Oracle Actions */
    .srpg-oracle-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.75rem;
        margin-bottom: 0.75rem;
    }

    /* Empty State */
    .srpg-empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 2rem 1rem;
        text-align: center;
    }

    .srpg-empty-state-icon {
        color: var(--text-muted);
        opacity: 0.5;
    }

    .srpg-empty-state-text {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 500;
        color: var(--text-secondary);
    }

    .srpg-empty-state-hint {
        margin: 0;
        font-size: 0.85rem;
        color: var(--text-muted);
    }

    /* Screen reader only class */
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }

    @media (min-width: 768px) {
        .md\:not-sr-only {
            position: static;
            width: auto;
            height: auto;
            padding: 0;
            margin: 0;
            overflow: visible;
            clip: auto;
            white-space: normal;
        }
    }
</style>
