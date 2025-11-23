<script lang="ts">
    import type { Character } from "../../../data/storage-utils";
    export let character: Character;
    export let editedCharacter: Character;
    export let isEditable: boolean;
</script>

<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
    <div class="flex flex-col gap-1">
        <label class="text-text-secondary text-sm font-semibold" for="hpCurrent">
            Current Hit Points
        </label>
        {#if isEditable}
            <input
                class="border-input-border bg-input-bg text-input-text focus:border-input-border-focus w-full rounded border p-2 focus:outline-none"
                type="number"
                id="hpCurrent"
                bind:value={editedCharacter.currentHitPoints} />
        {:else}
            <p class="text-text-primary m-0 p-2">
                {character.currentHitPoints !== undefined ? character.currentHitPoints : "—"}
            </p>
        {/if}
    </div>

    <div class="flex flex-col gap-1">
        <label class="text-text-secondary text-sm font-semibold" for="hpMax">
            Hit Point Maximum
        </label>
        {#if isEditable}
            <input
                class="border-input-border bg-input-bg text-input-text focus:border-input-border-focus w-full rounded border p-2 focus:outline-none"
                type="number"
                id="hpMax"
                bind:value={editedCharacter.hitPointMaximum} />
        {:else}
            <p class="text-text-primary m-0 p-2">{character.hitPointMaximum || "—"}</p>
        {/if}
    </div>

    <div class="flex flex-col gap-1">
        <label class="text-text-secondary text-sm font-semibold" for="hpTemp">
            Temporary Hit Points
        </label>
        {#if isEditable}
            <input
                class="border-input-border bg-input-bg text-input-text focus:border-input-border-focus w-full rounded border p-2 focus:outline-none"
                type="number"
                id="hpTemp"
                bind:value={editedCharacter.temporaryHitPoints} />
        {:else}
            <p class="text-text-primary m-0 p-2">{character.temporaryHitPoints || "—"}</p>
        {/if}
    </div>

    <div class="flex flex-col gap-1">
        <label class="text-text-secondary text-sm font-semibold" for="hitDice">Hit Dice</label>
        {#if isEditable}
            <input
                class="border-input-border bg-input-bg text-input-text focus:border-input-border-focus w-full rounded border p-2 focus:outline-none"
                type="text"
                id="hitDice"
                bind:value={editedCharacter.hitDice}
                placeholder="e.g., 3d8" />
        {:else}
            <p class="text-text-primary m-0 p-2">{character.hitDice || "—"}</p>
        {/if}
    </div>

    <div class="flex flex-col gap-1">
        <label class="text-text-secondary text-sm font-semibold" for="deathSaveSuccesses">
            Death Save Successes
        </label>
        {#if isEditable}
            <input
                class="border-input-border bg-input-bg text-input-text focus:border-input-border-focus w-full rounded border p-2 focus:outline-none"
                type="number"
                id="deathSaveSuccesses"
                bind:value={editedCharacter.deathSaveSuccesses}
                min="0"
                max="3" />
        {:else}
            <p class="text-text-primary m-0 p-2">{character.deathSaveSuccesses || 0}</p>
        {/if}
    </div>

    <div class="flex flex-col gap-1">
        <label class="text-text-secondary text-sm font-semibold" for="deathSaveFailures">
            Death Save Failures
        </label>
        {#if isEditable}
            <input
                class="border-input-border bg-input-bg text-input-text focus:border-input-border-focus w-full rounded border p-2 focus:outline-none"
                type="number"
                id="deathSaveFailures"
                bind:value={editedCharacter.deathSaveFailures}
                min="0"
                max="3" />
        {:else}
            <p class="text-text-primary m-0 p-2">{character.deathSaveFailures || 0}</p>
        {/if}
    </div>
</div>
