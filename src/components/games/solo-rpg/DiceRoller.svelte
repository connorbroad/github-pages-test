<script lang="ts">
    export let show = false;
    export let onClose: () => void;

    let numDice = 1;
    let numSides = 6;
    let modifier = 0;
    let resultOption: "Sum" | "Maximum" | "Minimum" | "Subtract" = "Sum";
    let diceResults: number[] = [];
    let finalResult: number | null = null;
    let rolledNumSides = numSides;
    let rolling = false;
    let rollingInterval: number | null = null;
    let diceOffsets: { x: number; y: number; r: number }[] = [];
    let diceEndTimes: number[] = [];

    // Animation config
    const ROLL_DURATION = 1000; // ms
    const INTERVAL_MIN = 20; // ms
    const INTERVAL_MAX = 150; // ms
    const DICE_MOVE_RANGE = 12; // px, total range (-range/2 to +range/2)
    const DICE_ROTATE_RANGE = 40; // deg, total range (-range/2 to +range/2)
    const DICE_END_MIN = 0.5; // fraction of duration
    const DICE_END_MAX = 1.5; // fraction of duration

    function onRollButtonClick() {
        rolledNumSides = numSides;
        rolling = true;
        let elapsed = 0;
        // Each dice gets a random end time between DICE_END_MIN and DICE_END_MAX of duration
        diceEndTimes = Array.from({ length: numDice }, () => ROLL_DURATION * (DICE_END_MIN + Math.random() * (DICE_END_MAX - DICE_END_MIN)));

        function animateRoll() {
            const progress = Math.min(elapsed / ROLL_DURATION, 1);
            const interval = INTERVAL_MIN + (INTERVAL_MAX - INTERVAL_MIN) * progress;
            rollNewDice(elapsed);
            elapsed += interval;
            if (elapsed < ROLL_DURATION * DICE_END_MAX) { // allow for longest dice
                setTimeout(animateRoll, interval);
            } else {
                rolling = false;
                rollNewDice(ROLL_DURATION * DICE_END_MAX); // final roll
                recalculateResult();
            }
        }
        animateRoll();
    }

    function rollNewDice(currentElapsed?: number) {
        diceResults = diceResults.length === numDice ? [...diceResults] : Array(numDice).fill(0);
        if (rolling) {
            diceOffsets = diceOffsets.length === numDice ? [...diceOffsets] : Array(numDice).fill({ x: 0, y: 0, r: 0 });
            for (let i = 0; i < numDice; i++) {
                if (!currentElapsed || currentElapsed < diceEndTimes[i]) {
                    diceResults[i] = Math.floor(Math.random() * numSides) + 1;
                    diceOffsets[i] = {
                        x: Math.random() * DICE_MOVE_RANGE - DICE_MOVE_RANGE / 2,
                        y: Math.random() * DICE_MOVE_RANGE - DICE_MOVE_RANGE / 2,
                        r: Math.random() * DICE_ROTATE_RANGE - DICE_ROTATE_RANGE / 2
                    };
                }
            }
        }
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

    $: recalculateResult(); // reactive statement to update result when dependencies change
</script>

{#if show}
    <div
        class="dice-roller-modal"
        role="button"
        tabindex="0"
        aria-label="Close dice roller"
        on:click={() => onClose && onClose()}
        on:keydown={(e) =>
            (e.key === "Enter" || e.key === " ") && onClose && onClose()}
    >
        <div
            class="dice-roller-content"
            role="dialog"
            aria-modal="true"
            on:click|stopPropagation
            tabindex="0"
            on:keydown={(e) => {
                /* trap focus or allow esc to close if desired */
            }}
        >
            <button
                class="modal-close-btn"
                aria-label="Close"
                on:click={() => onClose && onClose()}>&times;</button
            >
            <h2>Dice Roller</h2>
            <div class="dice-results">
                <div class="dice-result-list">
                    {#if diceResults.length > 0}
                        {#each diceResults as result, i}
                            <span class="dice-result-item">
                                <span class="dice-icon-wrap">
                                    <span style="display: inline-block; width: 64px; height: 64px; position: relative; transform: translate({diceOffsets[i]?.x || 0}px, {diceOffsets[i]?.y || 0}px) rotate({diceOffsets[i]?.r || 0}deg); transition: transform 0.1s;">
                                        {#if rolledNumSides === 4}
                                            <!-- D4: triangle -->
                                            <svg class="dice-icon" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
                                                <polygon points="16,4 28,24 4,24" fill="#f8f8f8" stroke="#ccc" stroke-width="2" />
                                            </svg>
                                        {:else if rolledNumSides === 6}
                                            <!-- D6: square -->
                                            <svg class="dice-icon" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
                                                <polygon points="16,4 28,16 16,28 4,16" fill="#f8f8f8" stroke="#ccc" stroke-width="2" />
                                            </svg>
                                        {:else if rolledNumSides === 8}
                                            <!-- D8: diamond -->
                                            <svg class="dice-icon" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
                                                <polygon points="16,2 24,16 16,30 8,16" fill="#f8f8f8" stroke="#ccc" stroke-width="2" />
                                            </svg>
                                        {:else if rolledNumSides === 10}
                                            <!-- D10: pentagon -->
                                            <svg class="dice-icon" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
                                                <polygon points="16,4 28,14 28,18 16,28 4,18 4,14" fill="#f8f8f8" stroke="#ccc" stroke-width="2" />
                                            </svg>
                                        {:else if rolledNumSides === 12}
                                            <!-- D12: hexagon -->
                                            <svg class="dice-icon" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
                                                <polygon points="16,4 27.4,12.3 23.6,26.7 8.4,26.7 4.6,12.3" fill="#f8f8f8" stroke="#ccc" stroke-width="2" />
                                            </svg>
                                        {:else if rolledNumSides === 20}
                                            <!-- D20: icosahedron (simplified as circle) -->
                                            <svg class="dice-icon" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
                                                <polygon points="16,2 28,9 28,23 16,30 4,23 4,9" fill="#f8f8f8" stroke="#ccc" stroke-width="2" />
                                            </svg>
                                        {:else if rolledNumSides === 100}
                                            <!-- D100: double circle -->
                                            <svg class="dice-icon" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
                                                <polygon points="16,2.5 21.0,3.8 25.1,6.8 28.1,10.9 29.5,16 28.1,21.1 25.1,25.2 21.0,28.2 16,29.5 11.0,28.2 6.9,25.2 3.9,21.1 2.5,16 3.9,10.9 6.9,6.8 11.0,3.8" fill="#f8f8f8" stroke="#ccc" stroke-width="2" />
                                            </svg>
                                        {:else}
                                            <!-- Default: square -->
                                            <svg class="dice-icon" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
                                                <rect x="4" y="4" width="24" height="24" rx="6" fill="#f8f8f8" stroke="#ccc" stroke-width="2" />
                                            </svg>
                                        {/if}
                                        <span class="dice-number">{result}</span>
                                    </span>
                                </span>
                            </span>
                        {/each}
                    {:else}
                        <span>?</span>
                    {/if}
                </div>
                <p>Result: {rolling ? "..." : finalResult || "?"}</p>
            </div>
            <div class="result-radio-group">
                <label class="result-radio" aria-label="Sum">
                    <input
                        type="radio"
                        name="resultOption"
                        value="Sum"
                        bind:group={resultOption}
                        on:change={recalculateResult}
                    />
                    <span class="result-icon">+</span>
                </label>
                <label class="result-radio" aria-label="Maximum">
                    <input
                        type="radio"
                        name="resultOption"
                        value="Maximum"
                        bind:group={resultOption}
                        on:change={recalculateResult}
                    />
                    <span class="result-icon">&#x25B2;</span>
                </label>
                <label class="result-radio" aria-label="Minimum">
                    <input
                        type="radio"
                        name="resultOption"
                        value="Minimum"
                        bind:group={resultOption}
                        on:change={recalculateResult}
                    />
                    <span class="result-icon">&#x25BC;</span>
                </label>
                <label class="result-radio" aria-label="Subtract">
                    <input
                        type="radio"
                        name="resultOption"
                        value="Subtract"
                        bind:group={resultOption}
                        on:change={recalculateResult}
                    />
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
                    <select bind:value={modifier} on:change={recalculateResult}>
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
        margin: 1rem;
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
    }
    .dice-results > p {
        margin: 0;
        border: 1px solid #ccc;
        border-radius: 10px 10px 0 0;
    }
    .dice-result-list {
        display: flex;
        gap: 0.0rem;
        justify-content: center;
        flex-wrap: wrap;
        margin-bottom: 1.5rem;
    }
    .dice-result-item {
        display: flex;
        align-items: center;
        position: relative;
        font-size: 1.3rem;
    }
    .dice-icon-wrap {
        position: relative;
        width: 64px;
        height: 64px;
        display: inline-block;
    }
    .dice-icon {
        position: absolute;
        left: 0;
        top: 0;
        width: 64px;
        height: 64px;
        z-index: 0;
        opacity: 0.3;
    }
    .dice-number {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: 1;
        font-weight: bold;
        color: #1976d2;
        font-size: 1.2rem;
        pointer-events: none;
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
