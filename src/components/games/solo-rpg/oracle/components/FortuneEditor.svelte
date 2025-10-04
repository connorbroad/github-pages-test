<script lang="ts">
    /**
     * Fortune Editor Component
     * Modal for creating/editing fortune configuration
     */
    import type { Fortune } from "../scripts/oracleTypes";
    import { createEventDispatcher } from "svelte";
    import "../../solo-rpg-styles.css";

    export let show = false;
    export let fortune: Fortune;
    export let campaigns: string[] = [];
    export let showCampaignField = true;

    const dispatch = createEventDispatcher<{
        close: void;
        save: Fortune;
        editOutcome: void;
    }>();

    function handleClose() {
        dispatch("close");
    }

    function handleSave() {
        dispatch("save", fortune);
    }

    function handleEditOutcome() {
        dispatch("editOutcome");
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
            <button class="srpg-modal-close" on:click={handleClose}
                >&times;</button
            >
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
                        Show Modifier
                    </label>
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
                            }
                        }}
                    />
                    Include Card Draw
                </label>
            </div>

            <button class="srpg-b srpg-b-normal srpg-b-w-full" on:click={handleEditOutcome}>
                Edit Outcome Mappings
            </button>
            <hr class="divider" />
            <button class="srpg-b srpg-b-create srpg-b-w-full" on:click={handleSave}>
                Save Fortune
            </button>
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
</style>
