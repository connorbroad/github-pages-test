<script lang="ts">
    /**
     * Fortune Editor Component
     * Modal for creating/editing fortune configuration
     */
    import type { Fortune } from "../scripts/oracleTypes";
    import {
        CARD_SUITS,
        CARD_RANKS,
        calculatePossibleDiceResults,
        isRedSuit,
    } from "../scripts/oracleTypes";
    import SrpgModal from "../../shared/modal/SrpgModal.svelte";
    import { createEventDispatcher } from "svelte";

    export let show = false;
    export let fortune: Fortune;
    export let campaigns: string[] = [];
    export let showCampaignField = true;
    export let onClose: () => void = () => {};
    export let onSave: (fortune: Fortune) => void = () => {};

    let viewMode: "main" | "mappings" = "main";

    let diceMappingArray: { value: number; outcome: string }[] = [];
    let suitMappingArray: { suit: string; outcome: string }[] = [];
    let rankMappingArray: { rank: string; outcome: string }[] = [];
    let diceSignificanceArray: { index: number; label: string }[] = [];

    // Initialize mappings when entering mapping view
    $: if (viewMode === "mappings") {
        initializeMappings();
    }

    // Reset view mode when modal is opened/closed
    $: if (show) {
        viewMode = "main";
    }

    function initializeMappings() {
        if (fortune.outcome.diceRoll) {
            const possibleResults = calculatePossibleDiceResults(fortune.outcome.diceRoll);
            diceMappingArray = possibleResults.map((value) => ({
                value,
                outcome: fortune.outcome.diceMapping?.[value] || "",
            }));

            // Initialize dice significance array
            if (fortune.outcome.diceRoll.numDice > 1) {
                diceSignificanceArray = Array.from(
                    { length: fortune.outcome.diceRoll.numDice },
                    (_, i) => ({
                        index: i + 1,
                        label: fortune.outcome.diceRoll?.diceSignificance?.[i + 1] || "",
                    })
                );
            }
        }

        if (fortune.outcome.cardDraw?.enabled) {
            suitMappingArray = CARD_SUITS.map((suit) => ({
                suit,
                outcome: fortune.outcome.suitMapping?.[suit] || "",
            }));

            rankMappingArray = CARD_RANKS.map((rank) => ({
                rank,
                outcome: fortune.outcome.rankMapping?.[rank] || "",
            }));
        }
    }

    function handleClose() {
        onClose();
    }

    function handleSave() {
        onSave(fortune);
    }

    function handleEditOutcome() {
        viewMode = "mappings";
    }

    function handleBackToMain() {
        viewMode = "main";
    }

    function handleSaveMappings() {
        // Convert arrays back to mappings
        if (fortune.outcome.diceRoll) {
            const diceMapping: { [key: number]: string } = {};
            diceMappingArray.forEach(({ value, outcome }) => {
                if (outcome.trim()) {
                    diceMapping[value] = outcome.trim();
                }
            });
            fortune.outcome.diceMapping = diceMapping;

            // Save dice significance
            if (fortune.outcome.diceRoll.numDice > 1) {
                const diceSignificance: { [key: number]: string } = {};
                diceSignificanceArray.forEach(({ index, label }) => {
                    if (label.trim()) {
                        diceSignificance[index] = label.trim();
                    }
                });
                fortune.outcome.diceRoll.diceSignificance = diceSignificance;
            }
        }

        if (fortune.outcome.cardDraw?.enabled) {
            const suitMapping: { [key: string]: string } = {};
            suitMappingArray.forEach(({ suit, outcome }) => {
                if (outcome.trim()) {
                    suitMapping[suit] = outcome.trim();
                }
            });
            fortune.outcome.suitMapping = suitMapping;

            const rankMapping: { [key: string]: string } = {};
            rankMappingArray.forEach(({ rank, outcome }) => {
                if (outcome.trim()) {
                    rankMapping[rank] = outcome.trim();
                }
            });
            fortune.outcome.rankMapping = rankMapping;
        }

        viewMode = "main";
    }
</script>

{#if show}
    <SrpgModal
        {show}
        showBackButton={viewMode === "mappings"}
        ariaLabel="Close fortune editor"
        onClose={handleClose}
        onBack={handleBackToMain}>
        {#if viewMode === "main"}
            <header class="modal-header">
                <div class="modal-header-icon">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                </div>
                <div>
                    <h2 class="modal-title">Create Fortune</h2>
                    <p class="modal-subtitle">Define dice rolls and card draws</p>
                </div>
            </header>

            {#if showCampaignField}
                <div class="mb-4 text-left">
                    <label class="text-text-secondary mb-1 block font-medium" for="campaign">
                        Campaign:
                    </label>
                    <input
                        class="border-input-border bg-input-bg text-input-text focus:border-input-border-focus box-border w-full rounded border p-2 text-base focus:outline-none"
                        id="campaign"
                        type="text"
                        bind:value={fortune.campaign}
                        list="campaigns-list" />
                    <datalist id="campaigns-list">
                        {#each campaigns as campaign}
                            <option value={campaign}></option>
                        {/each}
                    </datalist>
                </div>
            {/if}

            <div class="mb-4 text-left">
                <label class="text-text-secondary mb-1 block font-medium" for="title">Title:</label>
                <input
                    class="border-input-border bg-input-bg text-input-text focus:border-input-border-focus box-border w-full rounded border p-2 text-base focus:outline-none"
                    id="title"
                    type="text"
                    bind:value={fortune.title} />
            </div>

            <div class="mb-4 text-left">
                <h3 class="text-text-secondary mt-0 mb-2 text-[1.1rem]">Outcome Options</h3>
                <label class="text-text-secondary mb-1 block font-medium">
                    <input
                        type="checkbox"
                        checked={!!fortune.outcome.diceRoll}
                        on:change={(e) => {
                            if (e.currentTarget.checked) {
                                fortune.outcome.diceRoll = {
                                    numDice: 1,
                                    numSides: 20,
                                    modifier: 0,
                                    resultOption: "Sum",
                                    showModifier: false,
                                };
                            } else {
                                delete fortune.outcome.diceRoll;
                                delete fortune.outcome.diceMapping;
                                fortune = { ...fortune };
                            }
                        }} />
                    Include Dice Roll
                </label>

                {#if fortune.outcome.diceRoll}
                    <div class="px-2">
                        <div class="mt-2 flex gap-2">
                            <select
                                class="border-accent-primary bg-input-bg text-input-text focus:border-accent-primary-hover focus:ring-shadow-md focus:bg-bg-secondary flex-1 rounded-lg border-[1.5px] p-[0.6rem] px-4 text-[1.05rem] shadow-sm transition-all duration-200 focus:ring-2 focus:outline-none"
                                bind:value={fortune.outcome.diceRoll.numDice}>
                                {#each Array(10) as _, i}
                                    <option value={i + 1}>{i + 1}x</option>
                                {/each}
                            </select>
                            <select
                                class="border-accent-primary bg-input-bg text-input-text focus:border-accent-primary-hover focus:ring-shadow-md focus:bg-bg-secondary flex-1 rounded-lg border-[1.5px] p-[0.6rem] px-4 text-[1.05rem] shadow-sm transition-all duration-200 focus:ring-2 focus:outline-none"
                                bind:value={fortune.outcome.diceRoll.numSides}>
                                <option value={4}>D4</option>
                                <option value={6}>D6</option>
                                <option value={8}>D8</option>
                                <option value={10}>D10</option>
                                <option value={12}>D12</option>
                                <option value={20}>D20</option>
                                <option value={100}>D100</option>
                            </select>
                            {#if fortune.outcome.diceRoll.numDice > 1}
                                <select
                                    class="border-accent-primary bg-input-bg text-input-text focus:border-accent-primary-hover focus:ring-shadow-md focus:bg-bg-secondary flex-1 rounded-lg border-[1.5px] p-[0.6rem] px-4 text-[1.05rem] shadow-sm transition-all duration-200 focus:ring-2 focus:outline-none"
                                    bind:value={fortune.outcome.diceRoll.resultOption}>
                                    <option value="Sum">Sum</option>
                                    <option value="Maximum">Max</option>
                                    <option value="Minimum">Min</option>
                                    <option value="Subtract">Sub</option>
                                </select>
                            {/if}
                        </div>
                        <label
                            style="display: block; margin-top: 0.5rem;"
                            class="text-text-secondary mb-1 block font-medium">
                            <input
                                type="checkbox"
                                bind:checked={fortune.outcome.diceRoll.showModifier} />
                            Include Modifier
                        </label>
                    </div>
                {/if}

                <label class="text-text-secondary mb-1 block font-medium">
                    <input
                        type="checkbox"
                        checked={!!fortune.outcome.cardDraw?.enabled}
                        on:change={(e) => {
                            if (e.currentTarget.checked) {
                                fortune.outcome.cardDraw = { enabled: true };
                            } else {
                                delete fortune.outcome.cardDraw;
                                delete fortune.outcome.suitMapping;
                                delete fortune.outcome.rankMapping;
                                fortune = { ...fortune }; // Force Svelte reactivity
                            }
                        }} />
                    Include Card Draw
                </label>
            </div>

            <button
                class="border-border-primary bg-accent-primary hover:bg-accent-primary-hover active:bg-accent-primary-active flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
                on:click={handleEditOutcome}
                disabled={!fortune.outcome.diceRoll && !fortune.outcome.cardDraw}>
                Edit Outcome Mappings
            </button>
            <hr class="border-divider my-4 border-t border-none" />
            <button
                class="border-border-primary bg-accent-success hover:bg-accent-success-hover active:bg-accent-success-active flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
                on:click={handleSave}
                disabled={fortune.title.length === 0 ||
                    (!fortune.outcome.diceRoll && !fortune.outcome.cardDraw)}>
                Save Fortune
            </button>
        {:else if viewMode === "mappings"}
            <h2 class="text-text-primary mt-0">Edit Outcome Mappings</h2>

            {#if fortune.outcome.diceRoll}
                <!-- Dice Significance Section (only if multiple dice) -->
                {#if fortune.outcome.diceRoll.numDice > 1}
                    <div class="mb-8 text-left">
                        <h3 class="text-accent-primary mb-3 text-[1.2rem]">Dice Significance</h3>
                        <p class="text-text-secondary mb-2 text-sm italic">
                            Assign labels to individual dice (optional)
                        </p>
                        <div class="flex flex-col gap-2">
                            <div
                                class="bg-bg-secondary text-text-secondary grid grid-cols-[60px_1fr] gap-3 rounded p-2 text-sm font-semibold">
                                <span class="text-center">Die #</span>
                                <span class="text-left">Label</span>
                            </div>
                            {#each diceSignificanceArray as significance}
                                <div class="grid grid-cols-[60px_1fr] items-center gap-3 p-1">
                                    <span
                                        class="bg-bg-secondary text-text-primary rounded p-2 text-center text-[1rem] font-semibold">
                                        Die {significance.index}
                                    </span>
                                    <input
                                        type="text"
                                        class="border-input-border bg-input-bg text-input-text focus:border-input-border-focus focus:ring-shadow-md box-border w-full rounded border p-2 text-base focus:ring-2 focus:outline-none"
                                        bind:value={significance.label}
                                        placeholder="e.g., Action, Detail..." />
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}

                <div class="mb-8 text-left">
                    <h3 class="text-accent-primary mb-3 text-[1.2rem]">Dice Result Mappings</h3>
                    <div class="flex flex-col gap-2">
                        <div
                            class="bg-bg-secondary text-text-secondary grid grid-cols-[60px_1fr] gap-3 rounded p-2 text-sm font-semibold">
                            <span class="text-center">Result</span>
                            <span class="text-left">Outcome Description</span>
                        </div>
                        {#each diceMappingArray as mapping}
                            <div class="grid grid-cols-[60px_1fr] items-center gap-3 p-1">
                                <span
                                    class="bg-bg-secondary text-text-primary rounded p-2 text-center text-[1rem] font-semibold">
                                    {mapping.value}
                                </span>
                                <input
                                    type="text"
                                    class="border-input-border bg-input-bg text-input-text focus:border-input-border-focus focus:ring-shadow-md box-border w-full rounded border p-2 text-base focus:ring-2 focus:outline-none"
                                    bind:value={mapping.outcome}
                                    placeholder="Enter outcome..." />
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}

            {#if fortune.outcome.cardDraw?.enabled}
                <div class="mb-8 text-left">
                    <h3 class="text-accent-primary mb-3 text-[1.2rem]">Suit Mappings</h3>
                    <div class="flex flex-col gap-2">
                        <div
                            class="bg-bg-secondary text-text-secondary grid grid-cols-[60px_1fr] gap-3 rounded p-2 text-sm font-semibold">
                            <span class="text-center">Suit</span>
                            <span class="text-left">Outcome Description</span>
                        </div>
                        {#each suitMappingArray as mapping}
                            <div class="grid grid-cols-[60px_1fr] items-center gap-3 p-1">
                                <span
                                    class="bg-bg-secondary text-text-primary rounded p-2 text-center text-xl font-semibold"
                                    style="color: {isRedSuit(mapping.suit) ? 'red' : 'inherit'}">
                                    {mapping.suit}
                                </span>
                                <input
                                    type="text"
                                    class="border-input-border bg-input-bg text-input-text focus:border-input-border-focus focus:ring-shadow-md box-border w-full rounded border p-2 text-base focus:ring-2 focus:outline-none"
                                    bind:value={mapping.outcome}
                                    placeholder="Enter outcome..." />
                            </div>
                        {/each}
                    </div>
                </div>

                <div class="mb-8 text-left">
                    <h3 class="text-accent-primary mb-3 text-[1.2rem]">Rank Mappings</h3>
                    <div class="flex flex-col gap-2">
                        <div
                            class="bg-bg-secondary text-text-secondary grid grid-cols-[60px_1fr] gap-3 rounded p-2 text-sm font-semibold">
                            <span class="text-center">Rank</span>
                            <span class="text-left">Outcome Description</span>
                        </div>
                        {#each rankMappingArray as mapping}
                            <div class="grid grid-cols-[60px_1fr] items-center gap-3 p-1">
                                <span
                                    class="bg-bg-secondary text-text-primary rounded p-2 text-center text-[1rem] font-semibold">
                                    {mapping.rank}
                                </span>
                                <input
                                    type="text"
                                    class="border-input-border bg-input-bg text-input-text focus:border-input-border-focus focus:ring-shadow-md box-border w-full rounded border p-2 text-base focus:ring-2 focus:outline-none"
                                    bind:value={mapping.outcome}
                                    placeholder="Enter outcome..." />
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}

            <button
                class="border-border-primary bg-accent-success hover:bg-accent-success-hover active:bg-accent-success-active flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md"
                on:click={handleSaveMappings}>
                Save Mappings
            </button>
        {/if}
    </SrpgModal>
{/if}

<style>
    .modal-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .modal-header-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(var(--accent-primary-rgb, 59, 130, 246), 0.1);
        color: var(--accent-primary);
        flex-shrink: 0;
    }

    .modal-title {
        font-size: 1.125rem;
        font-weight: 700;
        margin: 0;
        line-height: 1.2;
        color: var(--text-primary);
    }

    .modal-subtitle {
        font-size: 0.8rem;
        color: var(--text-muted);
        margin: 0.125rem 0 0;
    }
</style>
