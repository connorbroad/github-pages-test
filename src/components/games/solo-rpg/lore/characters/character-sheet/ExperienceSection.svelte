<script lang="ts">
    import type { Character } from "../../../data/storage-utils";
    export let character: Character;
    export let editedCharacter: Character;
    export let isEditable: boolean;
</script>

<div class="srpg-form-grid">
    <div class="srpg-form-field">
        <label for="level">Level</label>
        {#if isEditable}
            <input
                type="number"
                id="level"
                bind:value={editedCharacter.level}
                min="1"
            />
        {:else}
            <p>{character.level || "—"}</p>
        {/if}
    </div>

    <div class="srpg-form-field">
        <label for="xp">Experience Points</label>
        {#if isEditable}
            <input
                type="number"
                id="xp"
                bind:value={editedCharacter.experiencePoints}
                min="0"
            />
        {:else}
            <p>{character.experiencePoints || "—"}</p>
        {/if}
    </div>

    <div class="srpg-form-field">
        <label for="proficiencyBonus">Proficiency Bonus</label>
        {#if isEditable}
            <input
                type="number"
                id="proficiencyBonus"
                bind:value={editedCharacter.proficiencyBonus}
            />
        {:else}
            <p>
                {character.proficiencyBonus !== undefined
                    ? character.proficiencyBonus >= 0
                        ? `+${character.proficiencyBonus}`
                        : character.proficiencyBonus
                    : "—"}
            </p>
        {/if}
    </div>
</div>
