<script lang="ts">
    /**
     * Outcome Mapping Editor Component
     * Modal for editing dice/card outcome mappings
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

    const dispatch = createEventDispatcher();

    let diceMappingArray: { value: number; outcome: string }[] = [];
    let suitMappingArray: { suit: string; outcome: string }[] = [];
    let rankMappingArray: { rank: string; outcome: string }[] = [];

    // Initialize arrays when show changes
    $: if (show) {
        initializeMappings();
    }

    function initializeMappings() {
        // Initialize dice mapping array
        if (fortune.outcome.diceRoll) {
            const possibleResults = calculatePossibleDiceResults(
                fortune.outcome.diceRoll,
            );
            diceMappingArray = possibleResults.map((value) => ({
                value,
                outcome: fortune.outcome.diceMapping?.[value] || "",
            }));
        }

        // Initialize suit mapping array
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

        dispatch("save", fortune);
    }
</script>

{#if show}
    <div
        class="oracle-modal"
        role="button"
        tabindex="0"
        aria-label="Close outcome editor"
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
            class="oracle-content outcome-editor"
            role="dialog"
            aria-modal="true"
            on:click|stopPropagation
            tabindex="0"
            on:keydown={(e) => {}}
        >
            <button class="srpg-modal-close" on:click={handleClose}
                >&times;</button
            >
            <h2>Edit Outcome Mappings</h2>

            {#if fortune.outcome.diceRoll}
                <div class="mapping-section">
                    <h3>Dice Result Mappings</h3>
                    <div class="mapping-table">
                        <div class="mapping-header">
                            <span class="mapping-col-result">Result</span>
                            <span class="mapping-col-outcome"
                                >Outcome Description</span
                            >
                        </div>
                        {#each diceMappingArray as mapping}
                            <div class="mapping-row">
                                <span class="mapping-result"
                                    >{mapping.value}</span
                                >
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
                            <span class="mapping-col-outcome"
                                >Outcome Description</span
                            >
                        </div>
                        {#each suitMappingArray as mapping}
                            <div class="mapping-row">
                                <span
                                    class="mapping-result suit-symbol"
                                    style="color: {isRedSuit(mapping.suit)
                                        ? 'red'
                                        : 'inherit'}">{mapping.suit}</span
                                >
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
                            <span class="mapping-col-outcome"
                                >Outcome Description</span
                            >
                        </div>
                        {#each rankMappingArray as mapping}
                            <div class="mapping-row">
                                <span class="mapping-result"
                                    >{mapping.rank}</span
                                >
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

            <button class="srpg-b srpg-b-create srpg-b-w-full" on:click={handleSave}
                >Save Mappings</button
            >
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

    .outcome-editor {
        max-width: 600px;
    }

    h2 {
        margin-top: 0;
        color: #333;
    }

    h3 {
        margin-top: 0;
        margin-bottom: 0.75rem;
        font-size: 1.2rem;
        color: #1976d2;
    }

    .mapping-section {
        margin-bottom: 2rem;
        text-align: left;
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
</style>
