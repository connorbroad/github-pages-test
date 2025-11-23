<script lang="ts">
    import type { Character } from "../../../data/storage-utils";
    export let character: Character;
    export let editedCharacter: Character;
    export let isEditable: boolean;
</script>

<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
    <div class="flex flex-col gap-1">
        <label class="text-text-secondary text-sm font-semibold" for="level">Level</label>
        {#if isEditable}
            <input
                class="border-input-border bg-input-bg text-input-text focus:border-input-border-focus w-full rounded border p-2 focus:outline-none"
                type="number"
                id="level"
                bind:value={editedCharacter.level}
                min="1" />
        {:else}
            <p class="text-text-primary m-0 p-2">{character.level || "—"}</p>
        {/if}
    </div>

    <div class="flex flex-col gap-1">
        <label class="text-text-secondary text-sm font-semibold" for="xp">Experience Points</label>
        {#if isEditable}
            <input
                class="border-input-border bg-input-bg text-input-text focus:border-input-border-focus w-full rounded border p-2 focus:outline-none"
                type="number"
                id="xp"
                bind:value={editedCharacter.experiencePoints}
                min="0" />
        {:else}
            <p class="text-text-primary m-0 p-2">{character.experiencePoints || "—"}</p>
        {/if}
    </div>

    <div class="flex flex-col gap-1">
        <label class="text-text-secondary text-sm font-semibold" for="proficiencyBonus">
            Proficiency Bonus
        </label>
        {#if isEditable}
            <input
                class="border-input-border bg-input-bg text-input-text focus:border-input-border-focus w-full rounded border p-2 focus:outline-none"
                type="number"
                id="proficiencyBonus"
                bind:value={editedCharacter.proficiencyBonus} />
        {:else}
            <p class="text-text-primary m-0 p-2">
                {character.proficiencyBonus !== undefined
                    ? character.proficiencyBonus >= 0
                        ? `+${character.proficiencyBonus}`
                        : character.proficiencyBonus
                    : "—"}
            </p>
        {/if}
    </div>
</div>
