<script lang="ts">
    import DiceRoller from "./DiceRoller.svelte";
    import CardDealer from "./CardDealer.svelte";

    export let show = false;
    export let onClose: () => void;

    type DiceRoll = {
        numDice: number;
        numSides: number;
        modifier: number;
        resultOption: "Sum" | "Maximum" | "Minimum" | "Subtract";
    };

    type CardDraw = {
        enabled: boolean;
    };

    type Outcome = {
        diceRoll?: DiceRoll;
        cardDraw?: CardDraw;
        diceMapping?: { [key: number]: string };
        suitMapping?: { [key: string]: string };
        rankMapping?: { [key: string]: string };
    };

    type Fortune = {
        id: string;
        campaign: string;
        title: string;
        description: string;
        outcome: Outcome;
    };

    let fortunes: Fortune[] = [];
    let selectedFortune: Fortune | null = null;
    let showFate = false;
    let showCreateFortune = false;
    let showEditOutcome = false;

    // Fate state
    let diceResult: number | null = null;
    let drawnCard: { suit: string; rank: string } | null = null;
    let fateOutcome: { dice?: string; suit?: string; rank?: string } = {};

    // Create/Edit Fortune state
    let editingFortune: Fortune = {
        id: "",
        campaign: "",
        title: "",
        description: "",
        outcome: {},
    };

    let campaigns: string[] = [];

    $: {
        campaigns = [...new Set(fortunes.map((f) => f.campaign))].filter(
            Boolean,
        );
    }

    function generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    function openCreateFortune() {
        editingFortune = {
            id: generateId(),
            campaign: "",
            title: "",
            description: "",
            outcome: {},
        };
        showCreateFortune = true;
    }

    function saveFortune() {
        const existingIndex = fortunes.findIndex(
            (f) => f.id === editingFortune.id,
        );
        if (existingIndex >= 0) {
            fortunes[existingIndex] = { ...editingFortune };
        } else {
            fortunes = [...fortunes, { ...editingFortune }];
        }
        showCreateFortune = false;
        showEditOutcome = false;
    }

    function deleteFortune(id: string) {
        fortunes = fortunes.filter((f) => f.id !== id);
    }

    function openFate(fortune: Fortune) {
        selectedFortune = fortune;
        diceResult = null;
        drawnCard = null;
        fateOutcome = {};
        showFate = true;
    }

    function handleDiceResult(result: number) {
        diceResult = result;
        if (selectedFortune?.outcome.diceMapping) {
            fateOutcome.dice =
                selectedFortune.outcome.diceMapping[result] ||
                "No mapping found";
        }
    }

    function handleCardResult(card: { suit: string; rank: string }) {
        drawnCard = card;
        if (selectedFortune?.outcome.suitMapping) {
            fateOutcome.suit =
                selectedFortune.outcome.suitMapping[card.suit] ||
                "No mapping found";
        }
        if (selectedFortune?.outcome.rankMapping) {
            fateOutcome.rank =
                selectedFortune.outcome.rankMapping[card.rank] ||
                "No mapping found";
        }
    }

    function closeFate() {
        showFate = false;
        selectedFortune = null;
    }

    // Outcome editing helpers
    let diceMappingArray: { value: number; outcome: string }[] = [];
    let suitMappingArray: { suit: string; outcome: string }[] = [];
    let rankMappingArray: { rank: string; outcome: string }[] = [];

    const suits = ["♠", "♥", "♦", "♣"];
    const ranks = [
        "A",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "J",
        "Q",
        "K",
    ];

    function calculatePossibleDiceResults(): number[] {
        if (!editingFortune.outcome.diceRoll) return [];
        const dr = editingFortune.outcome.diceRoll;
        const minRoll = dr.numDice * 1;
        const maxRoll = dr.numDice * dr.numSides;
        const results: number[] = [];

        for (let i = minRoll; i <= maxRoll; i++) {
            let finalValue = i;
            switch (dr.resultOption) {
                case "Sum":
                    finalValue = i + dr.modifier;
                    break;
                case "Maximum":
                case "Minimum":
                    // For max/min, possible results are 1 to numSides + modifier
                    if (i === minRoll) {
                        for (let j = 1; j <= dr.numSides; j++) {
                            results.push(j + dr.modifier);
                        }
                        return results;
                    }
                    break;
                case "Subtract":
                    // More complex, for now just show range
                    finalValue = i + dr.modifier;
                    break;
            }
            results.push(finalValue);
        }
        return [...new Set(results)].sort((a, b) => a - b);
    }

    function openOutcomeEditor() {
        // Initialize dice mapping array
        if (editingFortune.outcome.diceRoll) {
            const possibleResults = calculatePossibleDiceResults();
            diceMappingArray = possibleResults.map((value) => ({
                value,
                outcome: editingFortune.outcome.diceMapping?.[value] || "",
            }));
        }

        // Initialize suit mapping array
        if (editingFortune.outcome.cardDraw?.enabled) {
            suitMappingArray = suits.map((suit) => ({
                suit,
                outcome: editingFortune.outcome.suitMapping?.[suit] || "",
            }));

            rankMappingArray = ranks.map((rank) => ({
                rank,
                outcome: editingFortune.outcome.rankMapping?.[rank] || "",
            }));
        }

        showEditOutcome = true;
    }

    function saveOutcome() {
        // Convert arrays back to mappings
        if (editingFortune.outcome.diceRoll) {
            const diceMapping: { [key: number]: string } = {};
            diceMappingArray.forEach(({ value, outcome }) => {
                if (outcome.trim()) {
                    diceMapping[value] = outcome.trim();
                }
            });
            editingFortune.outcome.diceMapping = diceMapping;
        }

        if (editingFortune.outcome.cardDraw?.enabled) {
            const suitMapping: { [key: string]: string } = {};
            suitMappingArray.forEach(({ suit, outcome }) => {
                if (outcome.trim()) {
                    suitMapping[suit] = outcome.trim();
                }
            });
            editingFortune.outcome.suitMapping = suitMapping;

            const rankMapping: { [key: string]: string } = {};
            rankMappingArray.forEach(({ rank, outcome }) => {
                if (outcome.trim()) {
                    rankMapping[rank] = outcome.trim();
                }
            });
            editingFortune.outcome.rankMapping = rankMapping;
        }

        showEditOutcome = false;
    }
</script>

{#if show}
    <div
        class="oracle-modal"
        role="button"
        tabindex="0"
        aria-label="Close oracle"
        on:click={() => onClose && onClose()}
        on:keydown={(e) =>
            (e.key === "Enter" || e.key === " ") && onClose && onClose()}
    >
        <div
            class="oracle-content"
            role="dialog"
            aria-modal="true"
            on:click|stopPropagation
            tabindex="0"
            on:keydown={(e) => {}}
        >
            <button
                class="modal-close-btn"
                aria-label="Close"
                on:click={() => onClose && onClose()}>&times;</button
            >
            <h2>Game Oracle</h2>

            <button
                class="oracle-button create-button"
                on:click={openCreateFortune}>Create Fortune</button
            >

            <div class="fortunes-list">
                {#if campaigns.length === 0}
                    <p class="empty-message">
                        No fortunes yet. Create one to get started!
                    </p>
                {:else}
                    {#each campaigns as campaign}
                        <div class="campaign-group">
                            <h3 class="campaign-title">{campaign}</h3>
                            {#each fortunes.filter((f) => f.campaign === campaign) as fortune}
                                <div class="fortune-card">
                                    <div class="fortune-header">
                                        <h4>{fortune.title}</h4>
                                        <button
                                            class="delete-btn"
                                            on:click={() =>
                                                deleteFortune(fortune.id)}
                                            >×</button
                                        >
                                    </div>
                                    <p class="fortune-description">
                                        {fortune.description}
                                    </p>
                                    <button
                                        class="oracle-button fate-button"
                                        on:click={() => openFate(fortune)}
                                        >Consult Fate</button
                                    >
                                </div>
                            {/each}
                        </div>
                    {/each}
                {/if}
            </div>
        </div>
    </div>
{/if}

<!-- Create/Edit Fortune Modal -->
{#if showCreateFortune}
    <div
        class="oracle-modal"
        role="button"
        tabindex="0"
        aria-label="Close create fortune modal"
        on:click={() => (showCreateFortune = false)}
        on:keydown={(e) =>
            (e.key === "Enter" || e.key === " ") && (showCreateFortune = false)}
    >
        <div
            class="oracle-content"
            role="dialog"
            aria-modal="true"
            on:click|stopPropagation
            tabindex="0"
            on:keydown={(e) => {}}
        >
            <button
                class="modal-close-btn"
                on:click={() => (showCreateFortune = false)}>&times;</button
            >
            <h2>Create Fortune</h2>

            <div class="form-group">
                <label for="campaign">Campaign:</label>
                <input
                    id="campaign"
                    type="text"
                    bind:value={editingFortune.campaign}
                    list="campaigns-list"
                />
                <datalist id="campaigns-list">
                    {#each campaigns as campaign}
                        <option value={campaign}></option>
                    {/each}
                </datalist>
            </div>

            <div class="form-group">
                <label for="title">Title:</label>
                <input
                    id="title"
                    type="text"
                    bind:value={editingFortune.title}
                />
            </div>

            <div class="form-group">
                <label for="description">Description:</label>
                <textarea
                    id="description"
                    bind:value={editingFortune.description}
                    rows="3"
                ></textarea>
            </div>

            <div class="form-group">
                <h3>Outcome Options</h3>
                <label>
                    <input
                        type="checkbox"
                        checked={!!editingFortune.outcome.diceRoll}
                        on:change={(e) => {
                            if (e.currentTarget.checked) {
                                editingFortune.outcome.diceRoll = {
                                    numDice: 1,
                                    numSides: 20,
                                    modifier: 0,
                                    resultOption: "Sum",
                                };
                            } else {
                                delete editingFortune.outcome.diceRoll;
                                delete editingFortune.outcome.diceMapping;
                            }
                        }}
                    />
                    Include Dice Roll
                </label>

                {#if editingFortune.outcome.diceRoll}
                    <div class="dice-config">
                        <select
                            bind:value={editingFortune.outcome.diceRoll.numDice}
                        >
                            {#each Array(10) as _, i}
                                <option value={i + 1}>{i + 1}x</option>
                            {/each}
                        </select>
                        <select
                            bind:value={
                                editingFortune.outcome.diceRoll.numSides
                            }
                        >
                            <option value={4}>D4</option>
                            <option value={6}>D6</option>
                            <option value={8}>D8</option>
                            <option value={10}>D10</option>
                            <option value={12}>D12</option>
                            <option value={20}>D20</option>
                            <option value={100}>D100</option>
                        </select>
                        <select
                            bind:value={
                                editingFortune.outcome.diceRoll.modifier
                            }
                        >
                            {#each Array(16) as _, i}
                                {#if i - 5 > 0}
                                    <option value={i - 5}>+{i - 5}</option>
                                {:else if i - 5 === 0}
                                    <option value={i - 5}>0</option>
                                {:else}
                                    <option value={i - 5}>{i - 5}</option>
                                {/if}
                            {/each}
                        </select>
                        <select
                            bind:value={
                                editingFortune.outcome.diceRoll.resultOption
                            }
                        >
                            <option value="Sum">Sum</option>
                            <option value="Maximum">Max</option>
                            <option value="Minimum">Min</option>
                            <option value="Subtract">Sub</option>
                        </select>
                    </div>
                {/if}

                <label>
                    <input
                        type="checkbox"
                        checked={!!editingFortune.outcome.cardDraw?.enabled}
                        on:change={(e) => {
                            if (e.currentTarget.checked) {
                                editingFortune.outcome.cardDraw = {
                                    enabled: true,
                                };
                            } else {
                                delete editingFortune.outcome.cardDraw;
                                delete editingFortune.outcome.suitMapping;
                                delete editingFortune.outcome.rankMapping;
                            }
                        }}
                    />
                    Include Card Draw
                </label>
            </div>

            <button class="oracle-button" on:click={openOutcomeEditor}
                >Edit Outcome Mappings</button
            >
            <hr class="divider" />
            <button class="oracle-button" on:click={saveFortune}
                >Save Fortune</button
            >
        </div>
    </div>
{/if}

<!-- Outcome Mapping Editor Modal -->
{#if showEditOutcome}
    <div
        class="oracle-modal"
        role="button"
        tabindex="0"
        aria-label="Close outcome editor"
        on:click={() => (showEditOutcome = false)}
        on:keydown={(e) =>
            (e.key === "Enter" || e.key === " ") && (showEditOutcome = false)}
    >
        <div
            class="oracle-content outcome-editor"
            role="dialog"
            aria-modal="true"
            on:click|stopPropagation
            tabindex="0"
            on:keydown={(e) => {}}
        >
            <button
                class="modal-close-btn"
                on:click={() => (showEditOutcome = false)}>&times;</button
            >
            <h2>Edit Outcome Mappings</h2>

            {#if editingFortune.outcome.diceRoll}
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

            {#if editingFortune.outcome.cardDraw?.enabled}
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
                                    style="color: {mapping.suit === '♥' ||
                                    mapping.suit === '♦'
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

            <button class="oracle-button" on:click={saveOutcome}
                >Save Mappings</button
            >
        </div>
    </div>
{/if}

<!-- Fate Consultation Modal -->
{#if showFate && selectedFortune}
    <div
        class="oracle-modal"
        role="button"
        tabindex="0"
        aria-label="Close fate modal"
        on:click={closeFate}
        on:keydown={(e) => (e.key === "Enter" || e.key === " ") && closeFate()}
    >
        <div
            class="oracle-content fate-content"
            role="dialog"
            aria-modal="true"
            on:click|stopPropagation
            tabindex="0"
            on:keydown={(e) => {}}
        >
            <button class="modal-close-btn" on:click={closeFate}>&times;</button
            >
            <h2>Fate: {selectedFortune.title}</h2>
            <p class="fate-description">{selectedFortune.description}</p>

            {#if selectedFortune.outcome.diceRoll}
                <div class="fate-section">
                    <h3>Dice Roll</h3>
                    <div class="dice-display">
                        {selectedFortune.outcome.diceRoll.numDice}x D{selectedFortune
                            .outcome.diceRoll.numSides}
                        {#if selectedFortune.outcome.diceRoll.modifier !== 0}
                            {selectedFortune.outcome.diceRoll.modifier > 0
                                ? "+"
                                : ""}{selectedFortune.outcome.diceRoll.modifier}
                        {/if}
                        ({selectedFortune.outcome.diceRoll.resultOption})
                    </div>
                    {#if diceResult !== null}
                        <div class="result-display">
                            <strong>Result: {diceResult}</strong>
                            {#if fateOutcome.dice}
                                <p class="outcome-text">{fateOutcome.dice}</p>
                            {/if}
                        </div>
                    {:else}
                        <button
                            class="oracle-button roll-button"
                            on:click={() => {
                                // Trigger a dice roll - we'll need to integrate with DiceRoller differently
                                // For now, simulate a roll
                                const dr = selectedFortune.outcome.diceRoll;
                                if (dr) {
                                    let result = 0;
                                    const rolls = [];
                                    for (let i = 0; i < dr.numDice; i++) {
                                        rolls.push(
                                            Math.floor(
                                                Math.random() * dr.numSides,
                                            ) + 1,
                                        );
                                    }
                                    switch (dr.resultOption) {
                                        case "Sum":
                                            result = rolls.reduce(
                                                (a, b) => a + b,
                                                0,
                                            );
                                            break;
                                        case "Maximum":
                                            result = Math.max(...rolls);
                                            break;
                                        case "Minimum":
                                            result = Math.min(...rolls);
                                            break;
                                        case "Subtract":
                                            result = rolls.reduce(
                                                (a, b) => a - b,
                                            );
                                            break;
                                    }
                                    result += dr.modifier;
                                    handleDiceResult(result);
                                }
                            }}>Roll Dice</button
                        >
                    {/if}
                </div>
            {/if}

            {#if selectedFortune.outcome.cardDraw?.enabled}
                <div class="fate-section">
                    <h3>Card Draw</h3>
                    {#if drawnCard}
                        <div class="result-display">
                            <div
                                class="card-display"
                                style="color: {drawnCard.suit === '♥' ||
                                drawnCard.suit === '♦'
                                    ? 'red'
                                    : 'inherit'}"
                            >
                                {drawnCard.rank}
                                {drawnCard.suit}
                            </div>
                            {#if fateOutcome.suit}
                                <p class="outcome-text">
                                    <strong>Suit:</strong>
                                    {fateOutcome.suit}
                                </p>
                            {/if}
                            {#if fateOutcome.rank}
                                <p class="outcome-text">
                                    <strong>Rank:</strong>
                                    {fateOutcome.rank}
                                </p>
                            {/if}
                        </div>
                    {:else}
                        <button
                            class="oracle-button draw-button"
                            on:click={() => {
                                // Draw a random card
                                const suits = ["♠", "♥", "♦", "♣"];
                                const ranks = [
                                    "A",
                                    "2",
                                    "3",
                                    "4",
                                    "5",
                                    "6",
                                    "7",
                                    "8",
                                    "9",
                                    "10",
                                    "J",
                                    "Q",
                                    "K",
                                ];
                                const suit =
                                    suits[
                                        Math.floor(Math.random() * suits.length)
                                    ];
                                const rank =
                                    ranks[
                                        Math.floor(Math.random() * ranks.length)
                                    ];
                                handleCardResult({ suit, rank });
                            }}>Draw Card</button
                        >
                    {/if}
                </div>
            {/if}

            <hr class="divider" />
            <button class="oracle-button close-fate-button" on:click={closeFate}
                >Close</button
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

    .fate-content {
        max-width: 450px;
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

    h2 {
        margin-top: 0;
        color: #333;
    }

    h3 {
        margin-top: 1.5rem;
        margin-bottom: 0.5rem;
        color: #555;
        font-size: 1.1rem;
    }

    .oracle-button {
        width: 100%;
        padding: 0.75rem 0;
        font-size: 1.1rem;
        border-radius: 6px;
        border: none;
        margin: 0.5rem 0;
        background: #1976d2;
        color: #fff;
        cursor: pointer;
        transition: background 0.2s;
    }

    .oracle-button:active {
        background: #1565c0;
    }

    .oracle-button:disabled {
        background: #ccc;
        color: #666;
        cursor: not-allowed;
    }

    .create-button {
        background: #4caf50;
        margin-bottom: 1.5rem;
    }

    .create-button:active {
        background: #45a049;
    }

    .fortunes-list {
        text-align: left;
        margin-top: 1rem;
    }

    .empty-message {
        text-align: center;
        color: #999;
        font-style: italic;
    }

    .campaign-group {
        margin-bottom: 2rem;
    }

    .campaign-title {
        font-size: 1.3rem;
        color: #1976d2;
        margin-bottom: 0.5rem;
        border-bottom: 2px solid #1976d2;
        padding-bottom: 0.25rem;
    }

    .fortune-card {
        background: #f5f5f5;
        padding: 1rem;
        border-radius: 6px;
        margin-bottom: 0.75rem;
        position: relative;
    }

    .fortune-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
    }

    .fortune-header h4 {
        margin: 0 0 0.5rem 0;
        color: #333;
        flex-grow: 1;
    }

    .delete-btn {
        background: transparent;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #999;
        padding: 0;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .delete-btn:hover {
        color: #f44336;
    }

    .fortune-description {
        margin: 0 0 0.75rem 0;
        color: #666;
        font-size: 0.95rem;
    }

    .fate-button {
        font-size: 1rem;
        padding: 0.5rem 0;
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

    .form-group input[type="text"],
    .form-group textarea {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1rem;
        box-sizing: border-box;
    }

    .form-group textarea {
        resize: vertical;
        font-family: inherit;
    }

    .dice-config {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.5rem;
    }

    .dice-config select {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        background: #fff;
    }

    .divider {
        border: none;
        border-top: 1px solid #ccc;
        margin: 1rem 0;
    }

    .fate-description {
        text-align: left;
        color: #666;
        font-style: italic;
        margin-bottom: 1.5rem;
    }

    .fate-section {
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: #f9f9f9;
        border-radius: 6px;
    }

    .dice-display,
    .card-display {
        font-size: 1.2rem;
        font-weight: bold;
        margin: 0.5rem 0;
        padding: 0.75rem;
        background: #fff;
        border-radius: 4px;
    }

    .result-display {
        margin-top: 1rem;
        padding: 1rem;
        background: #e8f5e9;
        border-radius: 6px;
        border: 2px solid #4caf50;
    }

    .result-display strong {
        font-size: 1.2rem;
        color: #2e7d32;
    }

    .outcome-text {
        margin: 0.5rem 0 0 0;
        color: #333;
        text-align: left;
    }

    .roll-button,
    .draw-button {
        background: #ff9800;
    }

    .roll-button:active,
    .draw-button:active {
        background: #f57c00;
    }

    .close-fate-button {
        background: #666;
    }

    .close-fate-button:active {
        background: #555;
    }

    .mapping-section {
        margin-bottom: 2rem;
        text-align: left;
    }

    .mapping-section h3 {
        margin-top: 0;
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
</style>
