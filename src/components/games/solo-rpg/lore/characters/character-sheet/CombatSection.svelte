<script lang="ts">
    import type { Character } from "../../../data/storage-utils";
    export let character: Character;
    export let editedCharacter: Character;
    export let isEditable: boolean;
</script>

<div class="srpg-form-grid">
    <div class="srpg-form-field">
        <label for="ac">Armor Class</label>
        {#if isEditable}
            <input type="number" id="ac" bind:value={editedCharacter.armorClass} />
        {:else}
            <p>{character.armorClass || "—"}</p>
        {/if}
    </div>

    <div class="srpg-form-field">
        <label for="initiative">Initiative</label>
        {#if isEditable}
            <input type="number" id="initiative" bind:value={editedCharacter.initiative} />
        {:else}
            <p>{character.initiative ? (character.initiative >= 0 ? "+" : "") + character.initiative : "—"}</p>
        {/if}
    </div>

    <div class="srpg-form-field">
        <label for="speed">Speed</label>
        {#if isEditable}
            <input type="number" id="speed" bind:value={editedCharacter.speed} />
        {:else}
            <p>{character.speed ? character.speed + " ft." : "—"}</p>
        {/if}
    </div>
</div>
