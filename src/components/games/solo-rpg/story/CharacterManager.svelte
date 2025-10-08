<script lang="ts">
    import { activeCampaign } from "../campaign-store";
    import { loadCharacters, saveCharacters, loadActiveCharacterId, saveActiveCharacterId } from "../storage-utils";
    import type { Character } from "../storage-utils";
    import CharacterSheet from "./CharacterSheet.svelte";
    import SrpgModal from "../shared/modal/SrpgModal.svelte";
    import "../solo-rpg-styles.css";

    let characters: Character[] = [];
    let selectedCharacter: Character | null = null;
    let isEditing: boolean = false;
    let showCreateModal: boolean = false;
    let newCharacterName: string = "";
    let activeCharacterId: string | null = null;

    $: if ($activeCampaign) {
        loadCampaignCharacters();
        activeCharacterId = loadActiveCharacterId();
    }

    function loadCampaignCharacters() {
        if (!$activeCampaign) return;

        const allCharacters = loadCharacters();
        characters = allCharacters
            .filter((c) => c.campaignId === $activeCampaign.id)
            .sort((a, b) => a.name.localeCompare(b.name));
        
        // Reload active character ID
        activeCharacterId = loadActiveCharacterId();
    }

    function openCreateModal() {
        newCharacterName = "";
        showCreateModal = true;
    }

    function createCharacter() {
        if (!$activeCampaign || !newCharacterName.trim()) return;

        const newCharacter: Character = {
            id: `char-${Date.now()}`,
            campaignId: $activeCampaign.id,
            name: newCharacterName.trim(),
            abilities: [],
            skills: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        const allCharacters = loadCharacters();
        allCharacters.push(newCharacter);
        saveCharacters(allCharacters);

        loadCampaignCharacters();
        selectedCharacter = newCharacter;
        isEditing = true;
        showCreateModal = false;
    }

    function selectCharacter(character: Character) {
        selectedCharacter = character;
        isEditing = false;
    }

    function editCharacter() {
        isEditing = true;
    }

    function saveCharacter(event: CustomEvent<Character>) {
        const updatedCharacter = event.detail;
        const allCharacters = loadCharacters();
        const index = allCharacters.findIndex(
            (c) => c.id === updatedCharacter.id,
        );

        if (index !== -1) {
            allCharacters[index] = updatedCharacter;
            saveCharacters(allCharacters);
            loadCampaignCharacters();
            selectedCharacter = updatedCharacter;
            isEditing = false;
        }
    }

    function cancelEdit() {
        isEditing = false;
        // Reload to reset any changes
        if (selectedCharacter) {
            const allCharacters = loadCharacters();
            const character = allCharacters.find(
                (c) => c.id === selectedCharacter!.id,
            );
            if (character) {
                selectedCharacter = character;
            }
        }
    }

    function deleteCharacter() {
        if (!selectedCharacter) return;

        const confirmed = confirm(
            `Are you sure you want to delete ${selectedCharacter.name}? This cannot be undone.`,
        );
        if (!confirmed) return;

        const allCharacters = loadCharacters();
        const filtered = allCharacters.filter(
            (c) => c.id !== selectedCharacter!.id,
        );
        saveCharacters(filtered);

        loadCampaignCharacters();
        selectedCharacter = null;
        isEditing = false;
    }

    function backToList() {
        selectedCharacter = null;
        isEditing = false;
    }

    function toggleActiveCharacter() {
        if (activeCharacterId === selectedCharacter?.id) {
            clearActiveCharacter();
        } else {
            setActiveCharacter();
        }
    }

    function setActiveCharacter() {
        if (!selectedCharacter) return;
        
        activeCharacterId = selectedCharacter.id;
        saveActiveCharacterId(activeCharacterId);
    }

    function clearActiveCharacter() {
        activeCharacterId = null;
        saveActiveCharacterId(null);
    }
</script>

<div class="character-manager">
    {#if selectedCharacter}
        <div class="character-view">
            {#if !isEditing}
                <div class="view-header">
                    <button class="srpg-b" on:click={backToList}>
                        ← Back
                    </button> 

                    <button 
                        class="active-toggle" 
                        class:active={activeCharacterId === selectedCharacter.id}
                        on:click={toggleActiveCharacter} 
                        aria-label={activeCharacterId === selectedCharacter.id ? 'Deactivate character' : 'Set as active character'}
                    >
                        <span class="toggle-label">Active</span>
                        <div class="toggle-switch">
                            <div class="toggle-slider">
                                <svg class="toggle-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                            </div>
                        </div>
                    </button>

                    <button class="srpg-b srpg-b-normal" on:click={editCharacter}>
                        Edit
                    </button>
                </div>
                
            {/if} 

            <CharacterSheet
                character={selectedCharacter}
                {isEditing}
                on:save={saveCharacter}
                on:cancel={cancelEdit}
            />
            
            <br />

            {#if isEditing}
                <button
                    class="srpg-b srpg-b-sm srpg-b-w-full srpg-b-danger"
                    on:click={deleteCharacter}
                    aria-label="Delete Character">
                        Delete character
                </button>
            {/if}
        </div>
    {:else}
        <div class="character-list-view">
            <div class="list-header">
                <button class="srpg-b srpg-b-create" on:click={openCreateModal}>
                    + Create Character
                </button>
            </div>

            {#if characters.length > 0}
                <div class="character-list">
                    {#each characters as character}
                        <button
                            class="srpg-b srpg-b-overview"
                            class:is-active={activeCharacterId === character.id}
                            on:click={() => selectCharacter(character)}
                        >
                            <h3 class="character-title">
                                {#if activeCharacterId === character.id}
                                    <svg class="active-star" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                    </svg>
                                {/if}
                                {character.name}
                            </h3>
                            <div class="character-summary">
                                {#if character.race || character.class}
                                    <p>
                                        {#if character.race}{character.race}{/if}
                                        {#if character.race && character.class}
                                            •
                                        {/if}
                                        {#if character.class}{character.class}{/if}
                                        {#if character.level}
                                            (Level {character.level}){/if}
                                    </p>
                                {/if}
                                {#if character.currentHitPoints !== undefined && character.hitPointMaximum}
                                    <p class="hp-bar">
                                        <span
                                            >HP: {character.currentHitPoints} / {character.hitPointMaximum}</span
                                        >
                                    </p>
                                {/if}
                            </div>
                        </button>
                    {/each}
                </div>
            {:else}
                <div class="empty-state">
                    <p>No characters created yet.</p>
                    <p class="hint">
                        Create a character to start tracking their stats and
                        abilities.
                    </p>
                </div>
            {/if}
        </div>
    {/if}
</div>

<SrpgModal
    bind:show={showCreateModal}
    maxWidth="400px"
    on:close={() => (showCreateModal = false)}
>
    <div class="modal-content">
        <h2>New Character</h2>
        <label for="characterName">Character Name *</label>
        <input
            type="text"
            id="characterName"
            bind:value={newCharacterName}
            placeholder="Enter character name"
            on:keypress={(e) => e.key === "Enter" && createCharacter()}
        />

        <div class="modal-footer">
            <button
                class="srpg-b srpg-b-create srpg-b-w-full"
                on:click={createCharacter}
                disabled={!newCharacterName.trim()}
            >
                Create
            </button>
            <button
                class="srpg-b"
                on:click={() => (showCreateModal = false)}
            >
                Cancel
            </button>
        </div>
    </div>
</SrpgModal>

<style>
    .character-manager {
        width: 100%;
        padding-bottom: 4rem; /* Add space for fixed section filter on mobile */
    }

    @media (min-width: 768px) {
        .character-manager {
            padding-bottom: 0; /* Remove padding on larger screens */
        }
    }

    .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    } 

    .view-header {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
        gap: 1rem;
        width: 100%;
    }

    /* Modern Toggle Switch */
    .active-toggle {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem 1rem;
        background: #f3f4f6;
        border: 2px solid #e5e7eb;
        border-radius: 50px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-weight: 500;
        color: #6b7280;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .active-toggle:hover {
        background: #e5e7eb;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .active-toggle.active {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        border-color: #f59e0b;
        color: #92400e;
        box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
    }

    .active-toggle.active:hover {
        background: linear-gradient(135deg, #fde68a 0%, #fcd34d 100%);
        box-shadow: 0 6px 16px rgba(245, 158, 11, 0.35);
    }

    .toggle-label {
        font-size: 0.875rem;
        user-select: none;
    }

    .toggle-switch {
        position: relative;
        width: 2.75rem;
        height: 1.5rem;
        background: #d1d5db;
        border-radius: 50px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .active-toggle.active .toggle-switch {
        background: #f59e0b;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.15),
                    0 0 0 2px rgba(245, 158, 11, 0.2);
    }

    .toggle-slider {
        position: absolute;
        top: 0.125rem;
        left: 0.125rem;
        width: 1.25rem;
        height: 1.25rem;
        background: white;
        border-radius: 50%;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .active-toggle.active .toggle-slider {
        transform: translateX(1.25rem);
        background: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .toggle-icon {
        width: 0.75rem;
        height: 0.75rem;
        color: #f59e0b;
        opacity: 0;
        transform: scale(0.3) rotate(-72deg);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .active-toggle.active .toggle-icon {
        opacity: 1;
        transform: scale(1) rotate(0deg);
    }

    /* Add subtle pulse animation when active */
    @keyframes pulse {
        0%, 100% {
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
        }
        50% {
            box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4);
        }
    }

    .active-toggle.active {
        animation: pulse 2s ease-in-out infinite;
    }

    .active-toggle:active .toggle-slider {
        transform: translateX(0.5rem);
    }

    .active-toggle.active:active .toggle-slider {
        transform: translateX(1rem);
    }

    .character-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1rem;
    }

    .srpg-b-overview.is-active {
        border: 2px solid #f59e0b;
        background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
        box-shadow: 0 4px 6px rgba(245, 158, 11, 0.15);
    }

    .character-title {
        margin: 0 0 0.75rem 0;
        color: #111827;
        font-size: 1.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }

    .active-star {
        width: 1.125rem;
        height: 1.125rem;
        color: #f59e0b;
        flex-shrink: 0;
    }

    .character-summary p {
        margin: 0.25rem 0;
        color: #6b7280;
        font-size: 0.875rem;
    }

    .hp-bar {
        margin-top: 0.5rem;
        padding-top: 0.5rem;
        border-top: 1px solid #e5e7eb;
    }

    .hp-bar span {
        font-weight: 600;
        color: #111827;
    }

    .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        color: #6b7280;
    }

    .empty-state p {
        margin: 0.5rem 0;
    }

    .hint {
        font-size: 0.875rem;
        font-style: italic;
    }

    .modal-content h2 {
        margin-top: 0;
        margin-bottom: 1rem;
        color: #111827;
    }

    .modal-content label {
        display: block;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: #374151;
    }

    .modal-content input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 1rem;
    }

    .modal-footer {
        margin-top: 1.5rem;
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
    }
</style>
