<script lang="ts">
    import type { Character } from "../../../data/storage-utils";
    export let character: Character;
    export let editedCharacter: Character;
    export let isEditable: boolean;
</script>

<div class="srpg-form-grid">
    <div class="srpg-form-field">
        <label for="hpCurrent">Current Hit Points</label>
        {#if isEditable}
            <input
                type="number"
                id="hpCurrent"
                bind:value={editedCharacter.currentHitPoints}
            />
        {:else}
            <p>
                {character.currentHitPoints !== undefined
                    ? character.currentHitPoints
                    : "—"}
            </p>
        {/if}
    </div>

    <div class="srpg-form-field">
        <label for="hpMax">Hit Point Maximum</label>
        {#if isEditable}
            <input
                type="number"
                id="hpMax"
                bind:value={editedCharacter.hitPointMaximum}
            />
        {:else}
            <p>{character.hitPointMaximum || "—"}</p>
        {/if}
    </div>

    <div class="srpg-form-field">
        <label for="hpTemp">Temporary Hit Points</label>
        {#if isEditable}
            <input
                type="number"
                id="hpTemp"
                bind:value={editedCharacter.temporaryHitPoints}
            />
        {:else}
            <p>{character.temporaryHitPoints || "—"}</p>
        {/if}
    </div>

    <div class="srpg-form-field">
        <label for="hitDice">Hit Dice</label>
        {#if isEditable}
            <input
                type="text"
                id="hitDice"
                bind:value={editedCharacter.hitDice}
                placeholder="e.g., 3d8"
            />
        {:else}
            <p>{character.hitDice || "—"}</p>
        {/if}
    </div>

    <div class="srpg-form-field">
        <label for="deathSaveSuccesses">Death Save Successes</label>
        {#if isEditable}
            <input
                type="number"
                id="deathSaveSuccesses"
                bind:value={editedCharacter.deathSaveSuccesses}
                min="0"
                max="3"
            />
        {:else}
            <p>{character.deathSaveSuccesses || 0}</p>
        {/if}
    </div>

    <div class="srpg-form-field">
        <label for="deathSaveFailures">Death Save Failures</label>
        {#if isEditable}
            <input
                type="number"
                id="deathSaveFailures"
                bind:value={editedCharacter.deathSaveFailures}
                min="0"
                max="3"
            />
        {:else}
            <p>{character.deathSaveFailures || 0}</p>
        {/if}
    </div>
</div>
