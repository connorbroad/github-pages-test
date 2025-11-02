<script lang="ts">
    import type { Character } from "../../../data/storage-utils";
    export let character: Character;
    export let editedCharacter: Character;
    export let isEditable: boolean; 

    const alignmentOptions = [
        "Lawful Good",
        "Neutral Good",
        "Chaotic Good",
        "Lawful Neutral",
        "True Neutral",
        "Chaotic Neutral",
        "Lawful Evil",
        "Neutral Evil",
        "Chaotic Evil",
    ];
</script>

<div class="srpg-form-grid">
    <div class="srpg-form-field">
        <label for="name">Character Name</label>
        {#if isEditable}
            <input
                type="text"
                id="name"
                bind:value={editedCharacter.name}
                required
            />
        {:else}
            <p>{character.name}</p>
        {/if}
    </div>

    <div class="srpg-form-field">
        <label for="race">Race</label>
        {#if isEditable}
            <input
                type="text"
                id="race"
                bind:value={editedCharacter.race}
            />
        {:else}
            <p>{character.race || "—"}</p>
        {/if}
    </div>

    <div class="srpg-form-field">
        <label for="class">Class</label>
        {#if isEditable}
            <input
                type="text"
                id="class"
                bind:value={editedCharacter.class}
            />
        {:else}
            <p>{character.class || "—"}</p>
        {/if}
    </div>

    <div class="srpg-form-field">
        <label for="alignment">Alignment</label>
        {#if isEditable}
            <select
                id="alignment"
                bind:value={editedCharacter.alignment}
            >
                <option value="">Select Alignment</option>
                {#each alignmentOptions as alignment}
                    <option value={alignment}>{alignment}</option>
                {/each}
            </select>
        {:else}
            <p>{character.alignment || "—"}</p>
        {/if}
    </div>

    <div class="srpg-form-field">
        <label for="background">Background</label>
        {#if isEditable}
            <input
                type="text"
                id="background"
                bind:value={editedCharacter.background}
            />
        {:else}
            <p>{character.background || "—"}</p>
        {/if}
    </div>
</div>
