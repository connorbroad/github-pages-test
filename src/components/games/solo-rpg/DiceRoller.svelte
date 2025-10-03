<script lang="ts">
    export let show = false;
    export let onClose: () => void;

    let numDice = 1;
    let numSides = 20;
    let modifier = 0;
    let resultOption: "Sum" | "Maximum" | "Minimum" | "Subtract" = "Sum";
    let diceResults: number[] = [];
    let finalResult: number | null = null;
    let rolledNumSides = numSides;
    let rolling = false;
    let rollingInterval: number | null = null;
    let diceOffsets: { x: number; y: number; r: number }[] = [];
    let diceEndTimes: number[] = [];
    let showResultCalculator = true;

    // Animation config
    const ROLL_DURATION = 1000; // ms
    const INTERVAL_MIN = 20; // ms
    const INTERVAL_MAX = 150; // ms
    const DICE_MOVE_RANGE = 6; // px
    const DICE_ROTATE_RANGE = 40; // deg, total range (-range/2 to +range/2)
    const DICE_END_MIN = 0.5; // fraction of duration
    const DICE_END_MAX = 1.5; // fraction of duration

    function onRollButtonClick() {
        rolledNumSides = numSides;
        rolling = true;
        let elapsed = 0;
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
                    let newValue: number;
                    do {
                        newValue = Math.floor(Math.random() * numSides) + 1;
                    } while (newValue === diceResults[i] && numSides > 1); // ensure value always changes during animation
                    diceResults[i] = newValue;
                    
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

    function onClickTakeResult() {
        modifier = 0;
        diceResults = [];
        finalResult = null;
        rolling = false;
        rollingInterval = null;
        diceOffsets = [];
        diceEndTimes = [];

        onClose();
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
                        {#each Array(numDice) as _, i}
                            <span class="dice-result-item">
                                <span class="dice-icon-wrap">
                                    <span style="display: inline-block; width: 64px; height: 64px; position: relative;">
                                        {#if numSides === 4}
                                            <!-- D4: triangle -->
                                            <svg class="dice-icon" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
                                                <polygon points="16,4 28,24 4,24" fill="#f8f8f8" stroke="#ccc" stroke-width="2" />
                                            </svg>
                                        {:else if numSides === 6}
                                            <!-- D6: square -->
                                            <svg class="dice-icon" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
                                                <polygon points="16,4 28,16 16,28 4,16" fill="#f8f8f8" stroke="#ccc" stroke-width="2" />
                                            </svg>
                                        {:else if numSides === 8}
                                            <!-- D8: diamond -->
                                            <svg class="dice-icon" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
                                                <polygon points="16,2 24,16 16,30 8,16" fill="#f8f8f8" stroke="#ccc" stroke-width="2" />
                                            </svg>
                                        {:else if numSides === 10}
                                            <!-- D10: pentagon -->
                                            <svg class="dice-icon" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
                                                <polygon points="16,4 28,14 28,18 16,28 4,18 4,14" fill="#f8f8f8" stroke="#ccc" stroke-width="2" />
                                            </svg>
                                        {:else if numSides === 12}
                                            <!-- D12: hexagon -->
                                            <svg class="dice-icon" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
                                                <polygon points="16,4 27.4,12.3 23.6,26.7 8.4,26.7 4.6,12.3" fill="#f8f8f8" stroke="#ccc" stroke-width="2" />
                                            </svg>
                                        {:else if numSides === 20}
                                            <!-- D20: icosahedron (simplified as circle) -->
                                            <svg class="dice-icon" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
                                                <polygon points="16,2 28,9 28,23 16,30 4,23 4,9" fill="#f8f8f8" stroke="#ccc" stroke-width="2" />
                                            </svg>
                                        {:else if numSides === 100}
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
                                        <span class="dice-number">{numSides}</span>
                                    </span>
                                </span>
                            </span>
                        {/each}
                    {/if}
                </div>
            </div>
            <hr class="dice-roller-divider" />
            <div id="dice-options">
                <div class="dice-options-select">
                    <select bind:value={numDice}>
                        {#each Array(10) as _, i}
                            <option value={i + 1}>{i + 1}x</option>
                        {/each}
                    </select>
                </div>
                <div class="dice-options-select">
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
            </div>
            <button class="dice-roller-button" on:click={onRollButtonClick}>Roll</button>
            {#if showResultCalculator}
                <hr class="dice-roller-divider" />

                <div id="result-options">
                    <div class="result-radio-group">
                        <label class="result-radio" aria-label="Sum">
                            <input
                                type="radio" 
                                name="resultOption"
                                value="Sum"
                                disabled={diceResults.length == 0 && numDice == 1 || numDice == 1 && diceResults.length == 1}
                                bind:group={resultOption}
                                on:change={recalculateResult}
                            />
                            <span class="result-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width='1em' height='1em' {...$$props}><path fill="currentColor" d="M19 12.998h-6v6h-2v-6H5v-2h6v-6h2v6h6z"/></svg>
                            </span>
                        </label>
                        <label class="result-radio" aria-label="Maximum">
                            <input
                                type="radio"
                                name="resultOption"
                                value="Maximum"
                                disabled={diceResults.length == 0 && numDice == 1 || numDice == 1 && diceResults.length == 1}
                                bind:group={resultOption}
                                on:change={recalculateResult}
                            />
                            <span class="result-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width='1em' height='1em' {...$$props}><path fill="currentColor" d="M6.7 18.29c.39.39 1.02.39 1.41 0L12 14.42l3.88 3.88a.996.996 0 1 0 1.41-1.41L12.7 12.3a.996.996 0 0 0-1.41 0L6.7 16.88a.996.996 0 0 0 0 1.41"/><path fill="currentColor" d="M6.7 11.7c.39.39 1.02.39 1.41 0L12 7.83l3.88 3.88a.996.996 0 1 0 1.41-1.41L12.7 5.71a.996.996 0 0 0-1.41 0L6.7 10.29a.996.996 0 0 0 0 1.41"/></svg>                            
                            </span>
                        </label>
                        <label class="result-radio" aria-label="Minimum">
                            <input
                                type="radio"
                                name="resultOption"
                                value="Minimum"
                                disabled={diceResults.length == 0 && numDice == 1 || numDice == 1 && diceResults.length == 1}
                                bind:group={resultOption}
                                on:change={recalculateResult}
                            />
                            <span class="result-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width='1em' height='1em' {...$$props}><path fill="currentColor" d="M18 6.41L16.59 5L12 9.58L7.41 5L6 6.41l6 6z"/><path fill="currentColor" d="m18 13l-1.41-1.41L12 16.17l-4.59-4.58L6 13l6 6z"/></svg>
                            </span>
                        </label>
                        <label class="result-radio" aria-label="Subtract">
                            <input
                                type="radio"
                                name="resultOption"
                                value="Subtract"
                                disabled={diceResults.length == 0 && numDice == 1 || numDice == 1 && diceResults.length == 1}
                                bind:group={resultOption}
                                on:change={recalculateResult}
                            />
                            <span class="result-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width='1em' height='1em' {...$$props}><path fill="currentColor" d="M18 12.998H6a1 1 0 0 1 0-2h12a1 1 0 0 1 0 2"/></svg>
                            </span>
                        </label>
                    </div>
                    <div class="dice-options-select">
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
                
                <button id="take-result-button" class="dice-roller-button" on:click={onClickTakeResult} disabled={diceResults.length === 0 || finalResult === null || rolling}>
                    <p>
                        Result:
                        {rolling ? "..." : finalResult || "..."}
                    </p>
                    {#if diceResults.length > 1 && !rolling} 
                        <div id="result-option-indicator" aria-live="polite">
                            {#if resultOption === "Sum"}
                                <span class="result-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width='1em' height='1em' {...$$props}><path fill="currentColor" d="M19 12.998h-6v6h-2v-6H5v-2h6v-6h2v6h6z"/></svg>
                                </span>
                            {:else if resultOption === "Maximum"}
                                <span class="result-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width='1em' height='1em' {...$$props}><path fill="currentColor" d="M6.7 18.29c.39.39 1.02.39 1.41 0L12 14.42l3.88 3.88a.996.996 0 1 0 1.41-1.41L12.7 12.3a.996.996 0 0 0-1.41 0L6.7 16.88a.996.996 0 0 0 0 1.41"/><path fill="currentColor" d="M6.7 11.7c.39.39 1.02.39 1.41 0L12 7.83l3.88 3.88a.996.996 0 1 0 1.41-1.41L12.7 5.71a.996.996 0 0 0-1.41 0L6.7 10.29a.996.996 0 0 0 0 1.41"/></svg>                            
                                </span>
                            {:else if resultOption === "Minimum"}
                                <span class="result-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width='1em' height='1em' {...$$props}><path fill="currentColor" d="M18 6.41L16.59 5L12 9.58L7.41 5L6 6.41l6 6z"/><path fill="currentColor" d="m18 13l-1.41-1.41L12 16.17l-4.59-4.58L6 13l6 6z"/></svg>
                                </span>
                            {:else if resultOption === "Subtract"}
                                <span class="result-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width='1em' height='1em' {...$$props}><path fill="currentColor" d="M18 12.998H6a1 1 0 0 1 0-2h12a1 1 0 0 1 0 2"/></svg>
                                </span>
                            {/if}
                        </div>
                    {/if}
                </button>
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
        margin: 1rem;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        min-width: 300px;
        max-width: 350px;
        text-align: center;
        position: relative;
    }
    #dice-options {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        margin-top: 1rem;
    }
    .dice-options-select select { 
        padding: 0.75rem 1rem;
        font-size: 1.25rem;
        border-radius: 6px;
        border: 1px solid #ccc;
        margin: 0;
        background: #f8f8f8;
        appearance: none;
    }
    .result-radio-group {
        display: flex;
        justify-content: space-between;
        gap: 0;
        border-radius: 8px 8px;
        overflow: hidden;
        border: 1px solid #ccc;
        flex-direction: row; /* restore horizontal layout */ 
    }
    .result-radio {
        background: #f8f8f8;
        transition: background 0.2s;
        color: #333;
        box-shadow: none;

        border-radius: 0;
        border-left: none;
        border-top: none;
        border-bottom: none;

        display: flex;
        flex-direction: column; /* stack icon and label vertically */
        align-items: center;
        justify-content: center;

        margin: 0;
        padding: 0.5rem 0.5rem;

        font-size: 1.3rem;
        cursor: pointer;
        position: relative;
        flex-grow: 1;
    }
    .result-label {
        font-size: 0.85rem;
        color: inherit;
        margin-top: 0.1rem;
        letter-spacing: 1px;
        font-weight: 500;
    } 
    .result-radio input[type="radio"] {
        position: absolute;
        opacity: 0;
        pointer-events: none;
    }
    .result-icon {
        margin: 0;
        height: 30px;
    }
    .result-radio .result-icon {
        font-size: 1.5rem;
    }
    .result-radio:has(input[type="radio"]:checked) {
        background: #3d5d82;
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
    .dice-results-summary {
        margin: 1rem 0;
        margin-bottom: 0;
        gap: 0.1rem;
        display: flex;
        flex-direction: column;
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
    .dice-roller-button {
        width: 100%;
        padding: 0.75rem 0;
        font-size: 1.25rem;
        border-radius: 6px;
        border: none;
        margin: 0.5rem 0;
        margin-bottom: 0;
        background: #1976d2;
        color: #fff;
        cursor: pointer;
        transition: background 0.2s;
        overflow: hidden;
    }
    .dice-roller-button:active {
        background: #1565c0;
    }
    .dice-roller-button:disabled {
        background: #ccc;
        color: #666;
        cursor: not-allowed;
    }
    .result-arrow {
        font-size: 1.3rem;
        margin-left: 0.5rem;
        color: inherit;
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
    #take-result-button {
        margin-bottom: 0;
        padding: 0;
        position: relative;
    }
    #take-result-button p {
        margin: 0;
        padding: 0.75rem 0;
        font-size: 1.25rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }
    #take-result-button .result-icon { 
        font-size: 1.0rem;
    }
    #result-option-indicator {
        position: absolute;
        top: 25%;
        height: 50%;
        right: 0.5rem;
        width: 1.0em;
        display: flex;
        align-items: center;
        padding: 0.5em;
        justify-content: center;
        pointer-events: none; 
        border-radius: 100px;
        border: 1px solid #fff;
    }
    #result-option-indicator .result-icon {
        font-size: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .dice-roller-divider {
        border: none;
        border-top: 1px solid #ccc;
        margin: 1rem 0;
    }
    #result-options {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        align-items: center;
    }
</style>
