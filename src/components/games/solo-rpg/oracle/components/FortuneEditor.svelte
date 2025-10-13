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
    import "../../solo-rpg-styles.css";

    export let show = false;
    export let fortune: Fortune;
    export let campaigns: string[] = [];
    export let showCampaignField = true;

    const dispatch = createEventDispatcher<{
        close: void;
        save: Fortune;
    }>();

    let viewMode: 'main' | 'mappings' = 'main';
    
    let diceMappingArray: { value: number; outcome: string }[] = [];
    let suitMappingArray: { suit: string; outcome: string }[] = [];
    let rankMappingArray: { rank: string; outcome: string }[] = [];
    let diceSignificanceArray: { index: number; label: string }[] = [];

    // Initialize mappings when entering mapping view
    $: if (viewMode === 'mappings') {
        initializeMappings();
    }

    // Reset view mode when modal is opened/closed
    $: if (show) {
        viewMode = 'main';
    }

    function initializeMappings() {
        if (fortune.outcome.diceRoll) {
            const possibleResults = calculatePossibleDiceResults(
                fortune.outcome.diceRoll,
            );
            diceMappingArray = possibleResults.map((value) => ({
                value,
                outcome: fortune.outcome.diceMapping?.[value] || "",
            }));

            // Initialize dice significance array
            if (fortune.outcome.diceRoll.numDice > 1) {
                diceSignificanceArray = Array.from({ length: fortune.outcome.diceRoll.numDice }, (_, i) => ({
                    index: i + 1,
                    label: fortune.outcome.diceRoll?.diceSignificance?.[i + 1] || ""
                }));
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
        dispatch("close");
    }

    function handleSave() {
        dispatch("save", fortune);
    }

    function handleEditOutcome() {
        viewMode = 'mappings';
    }

    function handleBackToMain() {
        viewMode = 'main';
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

        viewMode = 'main';
    }
</script>

{#if show}
    <SrpgModal 
        {show} 
        showBackButton={viewMode === 'mappings'}
        ariaLabel="Close fortune editor" 
        on:close={handleClose}
        on:back={handleBackToMain}
    >
        {#if viewMode === 'main'}
            <h2>Create Fortune</h2>

            {#if showCampaignField}
                    <div class="form-group">
                        <label for="campaign">Campaign:</label>
                        <input
                            id="campaign"
                            type="text"
                            bind:value={fortune.campaign}
                            list="campaigns-list"
                        />
                        <datalist id="campaigns-list">
                            {#each campaigns as campaign}
                                <option value={campaign}></option>
                            {/each}
                        </datalist>
                    </div>
                {/if}

                <div class="form-group">
                    <label for="title">Title:</label>
                    <input id="title" type="text" bind:value={fortune.title} />
                </div>

                <div class="form-group">
                    <h3>Outcome Options</h3>
                    <label>
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
                            }}
                        />
                        Include Dice Roll
                    </label>

                    {#if fortune.outcome.diceRoll}
                        <div class="fortune-outcome-options">
                            <div class="dice-config">
                                <select bind:value={fortune.outcome.diceRoll.numDice}>
                                    {#each Array(10) as _, i}
                                        <option value={i + 1}>{i + 1}x</option>
                                    {/each}
                                </select>
                                <select bind:value={fortune.outcome.diceRoll.numSides}>
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
                                        bind:value={
                                            fortune.outcome.diceRoll.resultOption
                                        }
                                    >
                                        <option value="Sum">Sum</option>
                                        <option value="Maximum">Max</option>
                                        <option value="Minimum">Min</option>
                                        <option value="Subtract">Sub</option>
                                    </select>
                                {/if}
                            </div>
                            <label style="display: block; margin-top: 0.5rem;">
                                <input
                                    type="checkbox"
                                    bind:checked={fortune.outcome.diceRoll.showModifier}
                                />
                                Include Modifier
                            </label>
                        </div>
                    {/if}

                    <label>
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
                            }}
                        />
                        Include Card Draw
                    </label>
                </div>

                <button class="srpg-b srpg-b-normal srpg-b-w-full" on:click={handleEditOutcome} disabled={!fortune.outcome.diceRoll && !fortune.outcome.cardDraw}>
                    Edit Outcome Mappings
                </button>
                <hr class="divider" />
                <button class="srpg-b srpg-b-create srpg-b-w-full" on:click={handleSave} disabled={fortune.title.length === 0 || (!fortune.outcome.diceRoll && !fortune.outcome.cardDraw)}>
                    Save Fortune
                </button>

            {:else if viewMode === 'mappings'}
                <h2>Edit Outcome Mappings</h2>

                {#if fortune.outcome.diceRoll}
                    <!-- Dice Significance Section (only if multiple dice) -->
                    {#if fortune.outcome.diceRoll.numDice > 1}
                        <div class="mapping-section">
                            <h3>Dice Significance</h3>
                            <p class="section-description">Assign labels to individual dice (optional)</p>
                            <div class="mapping-table">
                                <div class="mapping-header">
                                    <span class="mapping-col-result">Die #</span>
                                    <span class="mapping-col-outcome">Label</span>
                                </div>
                                {#each diceSignificanceArray as significance}
                                    <div class="mapping-row">
                                        <span class="mapping-result">Die {significance.index}</span>
                                        <input
                                            type="text"
                                            class="mapping-input"
                                            bind:value={significance.label}
                                            placeholder="e.g., Action, Detail..."
                                        />
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    <div class="mapping-section">
                        <h3>Dice Result Mappings</h3>
                        <div class="mapping-table">
                            <div class="mapping-header">
                                <span class="mapping-col-result">Result</span>
                                <span class="mapping-col-outcome">
                                    Outcome Description
                                </span>
                            </div>
                            {#each diceMappingArray as mapping}
                                <div class="mapping-row">
                                    <span class="mapping-result">{mapping.value}</span>
                                    <input
                                        type="text"
                                        class="mapping-input"
                                        bind:value={mapping.outcome}
                                        placeholder="Enter outcome..."
                                    />
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}

                {#if fortune.outcome.cardDraw?.enabled}
                    <div class="mapping-section">
                        <h3>Suit Mappings</h3>
                        <div class="mapping-table">
                            <div class="mapping-header">
                                <span class="mapping-col-result">Suit</span>
                                <span class="mapping-col-outcome">
                                    Outcome Description
                                </span>
                            </div>
                            {#each suitMappingArray as mapping}
                                <div class="mapping-row">
                                    <span
                                        class="mapping-result suit-symbol"
                                        style="color: {isRedSuit(mapping.suit)
                                            ? 'red'
                                            : 'inherit'}">{mapping.suit}
                                    </span>
                                    <input
                                        type="text"
                                        class="mapping-input"
                                        bind:value={mapping.outcome}
                                        placeholder="Enter outcome..."
                                    />
                                </div>
                            {/each}
                        </div>
                    </div>

                    <div class="mapping-section">
                        <h3>Rank Mappings</h3>
                        <div class="mapping-table">
                            <div class="mapping-header">
                                <span class="mapping-col-result">Rank</span>
                                <span class="mapping-col-outcome">
                                    Outcome Description
                                </span>
                            </div>
                            {#each rankMappingArray as mapping}
                                <div class="mapping-row">
                                    <span class="mapping-result">{mapping.rank}</span>
                                    <input
                                        type="text"
                                        class="mapping-input"
                                        bind:value={mapping.outcome}
                                        placeholder="Enter outcome..."
                                    />
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}

                <button class="srpg-b srpg-b-create srpg-b-w-full" on:click={handleSaveMappings}>
                    Save Mappings
                </button>
            {/if}
    </SrpgModal>
{/if}

<style>
    h2 {
        margin-top: 0;
        color: var(--text-primary);
    }

    h3 {
        margin-top: 0;
        margin-bottom: 0.5rem;
        color: var(--text-secondary);
        font-size: 1.1rem;
    }

    .form-group {
        margin-bottom: 1rem;
        text-align: left;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.25rem;
        font-weight: 500;
        color: var(--text-secondary);
    }

    .form-group input[type="text"] {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid var(--input-border);
        border-radius: 4px;
        font-size: 1rem;
        box-sizing: border-box;
        background-color: var(--input-bg);
        color: var(--input-text);
    }

    .form-group input[type="text"]:focus {
        outline: none;
        border-color: var(--input-border-focus);
    }

    .fortune-outcome-options { 
        padding: 0 0.5rem;
    }

    .dice-config {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.5rem;
    }

    .dice-config select {
        flex: 1;
        padding: 0.6rem 1rem;
        border: 1.5px solid var(--accent-primary);
        border-radius: 8px;
        background: var(--input-bg);
        font-size: 1.05rem;
        color: var(--input-text);
        box-shadow: 0 1px 4px var(--shadow-sm);
        transition:
            border-color 0.2s,
            box-shadow 0.2s;
    }

    .dice-config select:focus {
        outline: none;
        border-color: var(--accent-primary-hover);
        box-shadow: 0 0 0 2px var(--shadow-md);
        background: var(--bg-secondary);
    }

    .divider {
        border: none;
        border-top: 1px solid var(--divider);
        margin: 1rem 0;
    }

    /* Mapping editor styles */
    .mapping-section {
        margin-bottom: 2rem;
        text-align: left;
    }

    .mapping-section h3 {
        margin-bottom: 0.75rem;
        font-size: 1.2rem;
        color: var(--accent-primary);
    }

    .section-description {
        font-size: 0.9rem;
        color: var(--text-secondary);
        margin: 0 0 0.5rem 0;
        font-style: italic;
    }

    .mapping-table {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .mapping-header {
        display: grid;
        grid-template-columns: 80px 1fr;
        gap: 0.75rem;
        padding: 0.5rem;
        background: var(--bg-secondary);
        border-radius: 4px;
        font-weight: 600;
        font-size: 0.9rem;
        color: var(--text-secondary);
    }

    .mapping-row {
        display: grid;
        grid-template-columns: 80px 1fr;
        gap: 0.75rem;
        align-items: center;
        padding: 0.25rem;
    }

    .mapping-result {
        font-weight: 600;
        font-size: 1.1rem;
        text-align: center;
        padding: 0.5rem;
        background: var(--bg-secondary);
        border-radius: 4px;
        color: var(--text-primary);
    }

    .suit-symbol {
        font-size: 1.5rem;
    }

    .mapping-input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid var(--input-border);
        border-radius: 4px;
        font-size: 1rem;
        box-sizing: border-box;
        background-color: var(--input-bg);
        color: var(--input-text);
    }

    .mapping-input:focus {
        outline: none;
        border-color: var(--input-border-focus);
        box-shadow: 0 0 0 2px var(--shadow-md);
    }

    .mapping-col-result,
    .mapping-col-outcome {
        text-align: center;
    }

    .mapping-col-outcome {
        text-align: left;
    }
</style>
