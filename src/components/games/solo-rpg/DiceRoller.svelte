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

    function closeDiceRoller() {
        diceResults = [];
        finalResult = null;
        onClose && onClose();
    }
</script>

{#if show}
    <div class="dice-roller-modal">
        <div class="dice-roller-content">
            <h2>Dice Roller</h2>
            <label>
                Number of Dice:
                <select bind:value={numDice}>
                    {#each Array(10) as _, i}
                        <option value={i + 1}>{i + 1}</option>
                    {/each}
                </select>
            </label>
            <label>
                Sides per Die:
                <select bind:value={numSides}>
                    <option value={4}>4</option>
                    <option value={6} selected>6</option>
                    <option value={8}>8</option>
                    <option value={10}>10</option>
                    <option value={12}>12</option>
                    <option value={20}>20</option>
                    <option value={100}>100</option>
                </select>
            </label>
            <label>
                Modifier:
                <select bind:value={modifier}>
                    {#each Array(16) as _, i}
                        <option value={i - 5}>{i - 5}</option>
                    {/each}
                </select>
            </label>
            <label>
                Result Option:
                <select bind:value={resultOption}>
                    <option value="Sum">Sum</option>
                    <option value="Maximum">Maximum</option>
                    <option value="Minimum">Minimum</option>
                    <option value="Subtract">Subtract</option>
                </select>
            </label>
            {#if diceResults.length}
                <div class="dice-results">
                    <p>Dice: {diceResults.join(", ")}</p>
                    <p>Result: {finalResult}</p>
                </div>
            {/if}
            <button on:click={rollDice}>Roll</button>
            <button on:click={closeDiceRoller}>Close</button>
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
    }
    .dice-roller-content label {
        display: block;
        margin: 1rem 0;
    }
    .dice-results {
        margin-top: 1rem;
    }
</style>
