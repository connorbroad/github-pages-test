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
    <div
        class="oracle-modal"
        role="button"
        tabindex="0"
        aria-label="Close create fortune modal"
        on:click={handleClose}
        on:keydown={(e) => {
            const tag = (e.target as HTMLElement).tagName;
            const isEditable = (e.target as HTMLElement).isContentEditable;
            if (
                (e.key === "Enter" || e.key === " ") &&
                !["INPUT", "TEXTAREA", "SELECT"].includes(tag) &&
                !isEditable
            ) {
                handleClose();
            }
        }}
    >
        <div
            class="oracle-content"
            role="dialog"
            aria-modal="true"
            on:click|stopPropagation
            tabindex="0"
            on:keydown={(e) => {}}
        >
            {#if viewMode === 'main'}
                <button class="srpg-b-modal-nav srpg-b-modal-nav-close" on:click={handleClose}>&times;</button>
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
                <button class="srpg-b-modal-nav srpg-b-modal-nav-back" on:click={handleBackToMain} aria-label="Go back">
                    ←
                </button>
                <h2>Edit Outcome Mappings</h2>

                {#if fortune.outcome.diceRoll}
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
        </div>
    </div>
{/if}

<style>
    .oracle-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .oracle-content {
        background: #fff;
        margin: 1rem;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        min-width: 300px;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
        text-align: center;
        position: relative;
    }

    h2 {
        margin-top: 0;
        color: #333;
    }

    h3 {
        margin-top: 0;
        margin-bottom: 0.5rem;
        color: #555;
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
        color: #555;
    }

    .form-group input[type="text"] {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1rem;
        box-sizing: border-box;
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
        border: 1.5px solid #1976d2;
        border-radius: 8px;
        background: #f8faff;
        font-size: 1.05rem;
        color: #333;
        box-shadow: 0 1px 4px rgba(25, 118, 210, 0.08);
        transition:
            border-color 0.2s,
            box-shadow 0.2s;
    }

    .dice-config select:focus {
        outline: none;
        border-color: #1565c0;
        box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.15);
        background: #e3f2fd;
    }

    .divider {
        border: none;
        border-top: 1px solid #ccc;
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
        color: #1976d2;
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
        background: #f0f0f0;
        border-radius: 4px;
        font-weight: 600;
        font-size: 0.9rem;
        color: #555;
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
        background: #f5f5f5;
        border-radius: 4px;
        color: #333;
    }

    .suit-symbol {
        font-size: 1.5rem;
    }

    .mapping-input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1rem;
        box-sizing: border-box;
    }

    .mapping-input:focus {
        outline: none;
        border-color: #1976d2;
        box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
    }

    .mapping-col-result,
    .mapping-col-outcome {
        text-align: center;
    }

    .mapping-col-outcome {
        text-align: left;
    }

    @media (max-width: 600px) {
        .oracle-content {
            max-width: 95vw;
            margin: 0.5rem;
            padding: 1.5rem;
        }
    }
</style>
