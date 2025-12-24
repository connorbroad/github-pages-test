<script lang="ts">
    import SrpgModal from "../../../../shared/modal/SrpgModal.svelte";
    import DiceRollerEmbed from "../../../../oracle/components/dice-roller/DiceRollerEmbed.svelte";
    import type {
        Character,
        ConsumableItem,
        ConsumableTargetTrait,
    } from "../../../../data/storage-utils";

    import { CharacterModel } from "../../../../data/CharacterModel";

    export let show = false;
    export let consumable: ConsumableItem | null = null;
    export let character: Character;
    export let onUse: (result: { consumed: boolean; rollResult?: number }) => void = () => {};
    export let onClose: () => void = () => {};
    export let onRollCheck: (detail: any) => void = () => {};

    let rollResult: number | null = null;
    let hasRolled = false;
    let rolling = false;

    // Parse dice formula into components
    function parseDiceFormula(formula: string): {
        numDice: number;
        numSides: number;
        modifier: number;
    } {
        const match = formula.trim().match(/^(\d+)d(\d+)([+-]\d+)?$/i);
        if (!match) return { numDice: 1, numSides: 4, modifier: 0 };
        return {
            numDice: parseInt(match[1], 10),
            numSides: parseInt(match[2], 10),
            modifier: match[3] ? parseInt(match[3], 10) : 0,
        };
    }

    $: diceConfig =
        consumable?.action?.effect?.kind === "dice"
            ? parseDiceFormula(consumable.action.effect.formula)
            : { numDice: 1, numSides: 4, modifier: 0 };

    function getTargetDescription(target?: ConsumableTargetTrait): string {
        if (!target) return "No effect target";
        switch (target.type) {
            case "hp":
                return "Current HP";
            case "tempHp":
                return "Temporary HP";
            case "hpMax":
                return "HP Maximum";
            case "ability":
                return `${target.abilityId} score`;
            case "skill":
                return `${target.skillId} bonus`;
            case "custom":
                return target.customName;
            default:
                return "Unknown";
        }
    }

    function handleRollResult(result: number) {
        rollResult = result;
        hasRolled = true;
    }

    function handleRollingChange(event: CustomEvent<boolean>) {
        rolling = event.detail;
    }

    function applyEffect() {
        if (!consumable) return;

        const effect = consumable.action.effect;
        const target = consumable.action.target;
        let value: number;

        if (effect.kind === "set") {
            value = effect.value;
        } else {
            if (rollResult === null) return;
            value = rollResult;
        }

        // Apply effect to character if target is specified
        if (target) {
            const model = new CharacterModel(character);
            model.applyConsumableEffect(target, value);
            character = character; // Trigger reactivity
        }

        // Record to chronicle via dice roll if applicable
        if (effect.kind === "dice" && rollResult !== null) {
            onRollCheck({
                checkName: `${consumable.name}: ${consumable.action.name}`,
                diceFormula: effect.formula,
                modifier: 0,
                resultOption: "Sum",
                result: rollResult,
            });
        }

        onUse({ consumed: true, rollResult: rollResult ?? value });
        resetAndClose();
    }

    function cancel() {
        onUse({ consumed: false });
        resetAndClose();
    }

    function resetAndClose() {
        rollResult = null;
        hasRolled = false;
        rolling = false;
        show = false;
        onClose();
    }
</script>

<SrpgModal bind:show maxWidth="400px" ariaLabel="Use Consumable" onClose={cancel}>
    {#if consumable}
        <div class="use-consumable-content">
            <h2 class="srpg-modal-heading">{consumable.name}</h2>
            <p class="action-name">{consumable.action.name}</p>

            {#if consumable.action.target}
                <div class="target-info">
                    <span class="target-label">Target:</span>
                    <span class="target-value">
                        {getTargetDescription(consumable.action.target)}
                    </span>
                </div>
            {/if}

            {#if consumable.action.effect.kind === "dice"}
                <div class="dice-section">
                    <p class="effect-label">Roll {consumable.action.effect.formula}</p>
                    <DiceRollerEmbed
                        numDice={diceConfig.numDice}
                        numSides={diceConfig.numSides}
                        modifier={diceConfig.modifier}
                        resultOption="Sum"
                        showModifier={diceConfig.modifier !== 0}
                        onResult={handleRollResult}
                        on:rollingChange={handleRollingChange} />

                    {#if hasRolled && !rolling}
                        <div class="result-display">
                            <span class="result-label">Result:</span>
                            <span class="result-value">{rollResult}</span>
                        </div>
                    {/if}
                </div>
            {:else}
                <div class="set-value-section">
                    <p class="effect-label">Effect: +{consumable.action.effect.value}</p>
                </div>
            {/if}

            <div class="modal-actions">
                <button class="srpg-b srpg-b-simple" on:click={cancel}>Cancel</button>
                <button
                    class="srpg-b srpg-b-create use-confirm-btn"
                    on:click={applyEffect}
                    disabled={consumable.action.effect.kind === "dice" && (!hasRolled || rolling)}>
                    Use & Apply
                </button>
            </div>
        </div>
    {/if}
</SrpgModal>

<style>
    .use-consumable-content {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        text-align: center;
    }

    .action-name {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--accent-success);
        margin: 0;
    }

    .target-info {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.75rem;
        background: var(--bg-secondary);
        border-radius: 8px;
    }

    .target-label {
        color: var(--text-muted);
    }

    .target-value {
        font-weight: 600;
        color: var(--text-primary);
    }

    .dice-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .effect-label {
        font-size: 1rem;
        font-weight: 500;
        color: var(--text-secondary);
        margin: 0;
    }

    .result-display {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        background: var(--accent-success);
        color: white;
        border-radius: 8px;
        font-size: 1.25rem;
    }

    .result-label {
        font-weight: 500;
    }

    .result-value {
        font-weight: 800;
        font-size: 1.5rem;
    }

    .set-value-section {
        padding: 1.5rem;
        background: var(--bg-secondary);
        border-radius: 8px;
    }

    .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 0.5rem;
    }

    .use-confirm-btn {
        background: var(--accent-success) !important;
    }

    .use-confirm-btn:hover:not(:disabled) {
        filter: brightness(1.1);
    }

    .use-confirm-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>
