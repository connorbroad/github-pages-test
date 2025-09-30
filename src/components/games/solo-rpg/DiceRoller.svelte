<script lang="ts">
    export let show = false;
    export let onClose: () => void;

    let numDice = 1;
    let numSides = 6;
    let modifier = 0;
    let resultOption: "Sum" | "Maximum" | "Minimum" | "Subtract" = "Sum";
    let diceResults: number[] = [];
    let finalResult: number | null = null;

    function onRollButtonClick() {
        rollNewDice();
        recalculateResult();
    }

    function rollNewDice() {
        diceResults = Array.from(
            { length: numDice },
            () => Math.floor(Math.random() * numSides) + 1,
        );
    }

    function recalculateResult() {
        if (diceResults.length === 0) {
            finalResult = null;
            return;
        }
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
            <div class="dice-results">
                <p>{diceResults.join(", ") || "?"}</p>
                <p>Result: {finalResult || "?"}</p>
            </div> 
            <div class="result-radio-group">
                <label class="result-radio" aria-label="Sum">
                    <input type="radio" name="resultOption" value="Sum" bind:group={resultOption} on:change={recalculateResult}>
                    <span class="result-icon">+</span>
                </label>
                <label class="result-radio" aria-label="Maximum">
                    <input type="radio" name="resultOption" value="Maximum" bind:group={resultOption} on:change={recalculateResult}>
                    <span class="result-icon">&#x25B2;</span>
                </label>
                <label class="result-radio" aria-label="Minimum">
                    <input type="radio" name="resultOption" value="Minimum" bind:group={resultOption} on:change={recalculateResult}>
                    <span class="result-icon">&#x25BC;</span>
                </label>
                <label class="result-radio" aria-label="Subtract">
                    <input type="radio" name="resultOption" value="Subtract" bind:group={resultOption} on:change={recalculateResult}>
                    <span class="result-icon">-</span>
                </label>
            </div>
            <div id="dice-options">
                <div>
                    <select bind:value={numDice}>
                        {#each Array(10) as _, i}
                            <option value={i + 1}>{i + 1}x</option>
                        {/each}
                    </select>
                </div>
                <div>
                    <select bind:value={numSides}>
                        <option value={4}>D4</option>
                        <option value={6} selected>D6</option>
                        <option value={8}>D8</option>
                        <option value={10}>D10</option>
                        <option value={12}>D12</option>
                        <option value={20}>D20</option>
                        <option value={100}>D100</option>
                    </select>
                </div>
                <div>
                    <select bind:value={modifier}>
                        {#each Array(16) as _, i}
                            {#if i - 5 > -1}
                                <option value={i - 5}>+{i - 5}</option> 
                            {:else if i - 5 === 0}
                                <option value={i - 5}>0</option>
                            {:else}
                                <option value={i - 5}>{i - 5}</option>
                            {/if}
                        {/each}
                    </select>
                </div>
            </div>
            <button id="roll-button" on:click={onRollButtonClick}>Roll</button> 
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
    #dice-options {
        display: flex;
        justify-content: space-between;
        margin-top: 1rem;
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
        gap: 0;
        border-radius: 0 0 8px 8px;
        overflow: hidden;
        border: 1px solid #ccc;
        border-top: none;
    }
    .result-radio {
        background: #ffffff;
        color: #333;
        box-shadow: none;
        border-radius: 0;
        border-left: none;
        border-top: none;
        border-bottom: none;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem 1rem;
        font-size: 1.3rem;
        cursor: pointer;
        margin: 0;
        transition: background 0.2s;
        position: relative;
        flex-grow: 1;
    }
    .result-radio:first-child {
        border-left: none;
    }
    .result-radio:last-child {
        border-right: none;
    }
    .result-radio input[type="radio"] {
        position: absolute;
        opacity: 0;
        pointer-events: none;
    }
    .result-radio .result-icon {
        margin: 0;
        font-size: 1.5rem;
    }
    .result-radio:has(input[type="radio"]:checked) {
        background: #1976d2;
        color: #fff;
        box-shadow: none;
    }
    .result-radio input[type="radio"]:disabled + .result-icon {
        color: #aaa;
        opacity: 0.6;
    }
    .result-radio:has(input[type="radio"]:disabled) {
        background: #eee;
        color: #aaa;
        cursor: not-allowed;
    }
    .dice-results {
        margin-top: 1rem;
        border: 1px solid #ccc;
    }
    #roll-button {
        width: 100%;
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
