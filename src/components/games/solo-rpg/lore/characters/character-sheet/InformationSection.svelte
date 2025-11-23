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

<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
    <div class="flex flex-col gap-1">
        <label class="text-text-secondary text-sm font-semibold" for="name">Character Name</label>
        {#if isEditable}
            <input
                class="border-input-border bg-input-bg text-input-text focus:border-input-border-focus w-full rounded border p-2 focus:outline-none"
                type="text"
                id="name"
                bind:value={editedCharacter.name}
                required />
        {:else}
            <p class="text-text-primary m-0 p-2">{character.name}</p>
        {/if}
    </div>

    <div class="flex flex-col gap-1">
        <label class="text-text-secondary text-sm font-semibold" for="race">Race</label>
        {#if isEditable}
            <input
                class="border-input-border bg-input-bg text-input-text focus:border-input-border-focus w-full rounded border p-2 focus:outline-none"
                type="text"
                id="race"
                bind:value={editedCharacter.race} />
        {:else}
            <p class="text-text-primary m-0 p-2">{character.race || "—"}</p>
        {/if}
    </div>

    <div class="flex flex-col gap-1">
        <label class="text-text-secondary text-sm font-semibold" for="class">Class</label>
        {#if isEditable}
            <input
                class="border-input-border bg-input-bg text-input-text focus:border-input-border-focus w-full rounded border p-2 focus:outline-none"
                type="text"
                id="class"
                bind:value={editedCharacter.class} />
        {:else}
            <p class="text-text-primary m-0 p-2">{character.class || "—"}</p>
        {/if}
    </div>

    <div class="flex flex-col gap-1">
        <label class="text-text-secondary text-sm font-semibold" for="alignment">Alignment</label>
        {#if isEditable}
            <select
                class="border-input-border bg-input-bg text-input-text focus:border-input-border-focus w-full rounded border p-2 focus:outline-none"
                id="alignment"
                bind:value={editedCharacter.alignment}>
                <option value="">Select Alignment</option>
                {#each alignmentOptions as alignment}
                    <option value={alignment}>{alignment}</option>
                {/each}
            </select>
        {:else}
            <p class="text-text-primary m-0 p-2">{character.alignment || "—"}</p>
        {/if}
    </div>

    <div class="flex flex-col gap-1">
        <label class="text-text-secondary text-sm font-semibold" for="background">Background</label>
        {#if isEditable}
            <input
                class="border-input-border bg-input-bg text-input-text focus:border-input-border-focus w-full rounded border p-2 focus:outline-none"
                type="text"
                id="background"
                bind:value={editedCharacter.background} />
        {:else}
            <p class="text-text-primary m-0 p-2">{character.background || "—"}</p>
        {/if}
    </div>
</div>
