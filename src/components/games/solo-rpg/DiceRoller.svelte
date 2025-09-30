<script lang="ts">
    export let show = false;
    export let onClose: () => void;

    let numDice = 1;
    let numSides = 6;
    let modifier = 0;
    let resultOption: "Sum" | "Maximum" | "Minimum" | "Subtract" = "Sum";
    let diceResults: number[] = [];
    let finalResult: number | null = null;

    function rollDice() {
        diceResults = Array.from(
            { length: numDice },
            () => Math.floor(Math.random() * numSides) + 1,
        );
        switch (resultOption) {
            case "Sum":
                finalResult = diceResults.reduce((a, b) => a + b, 0) + modifier;
                break;
            case "Maximum":
                finalResult = Math.max(...diceResults) + modifier;
                break;
            case "Minimum":
                finalResult = Math.min(...diceResults) + modifier;
                break;
            case "Subtract":
                finalResult = diceResults.reduce((a, b) => a - b) + modifier;
                break;
        }
    }
</script>

{#if show}
    <div
        class="dice-roller-modal"
        role="button"
        tabindex="0"
        aria-label="Close dice roller"
        on:click={() => onClose && onClose()}
        on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && onClose && onClose()}
    >
        <div
            class="dice-roller-content"
            role="dialog"
            aria-modal="true"
            on:click|stopPropagation
            tabindex="0"
            on:keydown={(e) => {/* trap focus or allow esc to close if desired */}}
        >
            <button class="modal-close-btn" aria-label="Close" on:click={() => onClose && onClose()}>&times;</button>
            <h2>Dice Roller</h2>
            <label>
                <select bind:value={numSides}>
                    <option value={4}>D4</option>
                    <option value={6} selected>D6</option>
                    <option value={8}>D8</option>
                    <option value={10}>D10</option>
                    <option value={12}>D12</option>
                    <option value={20}>D20</option>
                    <option value={100}>D100</option>
                </select>
            </label>
            <label>
                Number of Dice:
                <select bind:value={numDice}>
                    {#each Array(10) as _, i}
                        <option value={i + 1}>{i + 1}</option>
                    {/each}
                </select>
            </label>
            {#if numDice > 1}
                <div class="result-radio-group">
                    <label class="result-radio">
                        <input type="radio" name="resultOption" value="Sum" bind:group={resultOption}>
                        <span class="result-icon">+</span> Sum
                    </label>
                    <label class="result-radio">
                        <input type="radio" name="resultOption" value="Maximum" bind:group={resultOption}>
                        <span class="result-icon">&#x25B2;</span> Maximum
                    </label>
                    <label class="result-radio">
                        <input type="radio" name="resultOption" value="Minimum" bind:group={resultOption}>
                        <span class="result-icon">&#x25BC;</span> Minimum
                    </label>
                    <label class="result-radio">
                        <input type="radio" name="resultOption" value="Subtract" bind:group={resultOption}>
                        <span class="result-icon">-</span> Subtract
                    </label>
                </div>
            {/if}
            <label>
                Modifier:
                <select bind:value={modifier}>
                    {#each Array(16) as _, i}
                        <option value={i - 5}>{i - 5}</option>
                    {/each}
                </select>
            </label>
            <button id="roll-button" on:click={rollDice}>Roll</button>
            {#if diceResults.length}
                <div class="dice-results">
                    {#if diceResults.length > 1}
                        <p>Dice: {diceResults.join(", ")}</p>
                    {/if}
                    <p>Result: {finalResult}</p>
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
    .dice-roller-modal {
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
    .dice-roller-content {
        background: #fff;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        min-width: 300px;
        text-align: center;
        position: relative;
    }
    .dice-roller-content label {
        display: block;
        margin: 1rem 0;
    }
    .dice-roller-content select {
        width: 100%;
        padding: 0.75rem 1rem;
        font-size: 1.25rem;
        border-radius: 6px;
        border: 1px solid #ccc;
        margin-top: 0.5rem;
        margin-bottom: 0.5rem;
        background: #f8f8f8;
        appearance: none;
    }
    .result-radio-group {
        display: flex;
        justify-content: space-between;
        margin: 1rem 0;
        gap: 0.5rem;
    }
    .result-radio {
        display: flex;
        align-items: center;
        background: #f8f8f8;
        border-radius: 6px;
        padding: 0.5rem 1rem;
        font-size: 1.1rem;
        cursor: pointer;
        border: 1px solid #ccc;
        flex: 1;
        transition: background 0.2s;
    }
    .result-radio input[type="radio"] {
        margin-right: 0.5rem;
        accent-color: #1976d2;
    }
    .result-radio .result-icon {
        margin-right: 0.5rem;
        font-size: 1.3rem;
    }
    .result-radio input[type="radio"]:focus + .result-icon {
        outline: 2px solid #1976d2;
    }
    .dice-results {
        margin-top: 1rem;
    }
    #roll-button {
        width: 48%;
        padding: 0.75rem 0;
        font-size: 1.25rem;
        border-radius: 6px;
        border: none;
        margin: 0.5rem 1%;
        background: #1976d2;
        color: #fff;
        cursor: pointer;
        transition: background 0.2s;
    }
    #roll-button:active {
        background: #1565c0;
    }
    .modal-close-btn {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        width: 3rem;
        height: 3rem;
        z-index: 10; 
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: x-large;
        background: transparent;
        border: none;
        cursor: pointer;
    }
</style>
