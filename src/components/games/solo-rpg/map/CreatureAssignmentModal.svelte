<script lang="ts">
    /**
     * CreatureAssignmentModal - Mobile-friendly modal for assigning creatures to map objects
     * Characters can only be assigned once.
     */
    import { createEventDispatcher } from "svelte";
    import {
        loadCharacters,
        loadMaps,
        type Character,
        type CreatureRef,
    } from "../data/storage-utils";
    import SrpgModal from "../shared/modal/SrpgModal.svelte";

    export let show = false;
    export let campaignId: string;
    export let mapId: string;
    export let currentCreatureRef: CreatureRef | null = null;

    const dispatch = createEventDispatcher<{
        close: void;
        assign: { type: "character"; id: string };
        clear: void;
    }>();

    let characters: Character[] = [];
    let assignedCharacterIds: Set<string> = new Set();

    // Load creatures when modal opens
    $: if (show && campaignId) {
        loadCreatures();
    }

    function loadCreatures() {
        characters = loadCharacters().filter((c) => c.campaignId === campaignId);

        // Find which characters are already assigned on the map
        const maps = loadMaps();
        const map = maps.find((m) => m.id === mapId);
        if (map) {
            assignedCharacterIds = new Set(
                map.objects
                    .filter((obj) => obj.creatureRef?.type === "character")
                    .map((obj) => obj.creatureRef!.id)
            );
        }
    }

    function handleClose() {
        dispatch("close");
    }

    function handleAssign(id: string) {
        dispatch("assign", { type: "character", id });
    }

    function handleClear() {
        dispatch("clear");
    }

    function getCreatureName(): string {
        if (!currentCreatureRef) return "";
        if (currentCreatureRef.type === "character") {
            const char = characters.find((c) => c.id === currentCreatureRef!.id);
            return char?.name ?? "Unknown Character";
        }
        return "Unknown";
    }

    function isCharacterAssigned(charId: string): boolean {
        // Don't disable if this is the currently assigned character on this object
        if (currentCreatureRef?.type === "character" && currentCreatureRef?.id === charId) {
            return false;
        }
        return assignedCharacterIds.has(charId);
    }
</script>

<SrpgModal {show} on:close={handleClose} ariaLabel="Assign creature modal" maxWidth="400px">
    <div class="creature-modal">
        <h2 class="modal-title">Assign Character</h2>

        <!-- Current assignment -->
        {#if currentCreatureRef}
            <div class="current-assignment">
                <div class="current-info">
                    <span class="current-label">Currently assigned:</span>
                    <span class="current-name">{getCreatureName()}</span>
                </div>
                <button class="remove-btn" on:click={handleClear}>
                    <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    Remove
                </button>
            </div>
        {/if}

        <!-- Creature list -->
        <div class="creature-list">
            {#if characters.length === 0}
                <div class="empty-state">
                    <p>No characters in this campaign.</p>
                    <p class="empty-hint">Create characters in the Characters tab.</p>
                </div>
            {:else}
                {#each characters as char}
                    {@const isAssigned = isCharacterAssigned(char.id)}
                    {@const isCurrentlySelected =
                        currentCreatureRef?.type === "character" &&
                        currentCreatureRef?.id === char.id}
                    <button
                        class="creature-item"
                        class:selected={isCurrentlySelected}
                        class:disabled={isAssigned}
                        disabled={isAssigned}
                        on:click={() => handleAssign(char.id)}>
                        <div class="creature-icon character">
                            <svg viewBox="0 0 24 24" width="20" height="20">
                                <path
                                    fill="currentColor"
                                    d="M12 4a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4" />
                            </svg>
                        </div>
                        <div class="creature-info">
                            <span class="creature-name">{char.name}</span>
                            {#if char.race || char.class}
                                <span class="creature-detail">
                                    {char.race ?? ""}
                                    {char.race && char.class ? "•" : ""}
                                    {char.class ?? ""}
                                    {#if char.level}Lv.{char.level}{/if}
                                </span>
                            {/if}
                        </div>
                        {#if isAssigned}
                            <span class="assigned-badge">In Use</span>
                        {:else if isCurrentlySelected}
                            <svg class="check-icon" viewBox="0 0 24 24" width="20" height="20">
                                <path
                                    fill="currentColor"
                                    d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
                        {/if}
                    </button>
                {/each}
            {/if}
        </div>
    </div>
</SrpgModal>

<style>
    .creature-modal {
        text-align: left;
    }

    .modal-title {
        margin: 0 0 1rem;
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-primary);
    }

    .current-assignment {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.75rem;
        margin-bottom: 1rem;
        background: var(--bg-secondary);
        border: 1px solid var(--border-primary);
        border-radius: 0.5rem;
    }

    .current-info {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
    }

    .current-label {
        font-size: 0.75rem;
        color: var(--text-muted);
    }

    .current-name {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .remove-btn {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.375rem 0.75rem;
        background: transparent;
        border: 1px solid var(--accent-danger);
        border-radius: 0.375rem;
        color: var(--accent-danger);
        font-size: 0.8125rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .remove-btn:hover {
        background: var(--accent-danger);
        color: white;
    }

    .creature-list {
        max-height: 300px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .creature-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        padding: 0.75rem;
        background: var(--bg-secondary);
        border: 1px solid var(--border-primary);
        border-radius: 0.5rem;
        cursor: pointer;
        font-family: inherit;
        text-align: left;
        transition: all 0.15s ease;
    }

    .creature-item:hover:not(.disabled) {
        background: var(--bg-tertiary);
        border-color: var(--accent-primary);
    }

    .creature-item.selected {
        background: var(--accent-primary);
        border-color: var(--accent-primary);
        color: white;
    }

    .creature-item.disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .creature-icon {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .creature-icon.character {
        background: var(--accent-primary);
        color: white;
    }

    .creature-item.selected .creature-icon {
        background: rgba(255, 255, 255, 0.2);
    }

    .creature-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
    }

    .creature-name {
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .creature-item.selected .creature-name {
        color: white;
    }

    .creature-detail {
        font-size: 0.75rem;
        color: var(--text-muted);
    }

    .creature-item.selected .creature-detail {
        color: rgba(255, 255, 255, 0.7);
    }

    .assigned-badge {
        padding: 0.25rem 0.5rem;
        background: var(--bg-tertiary);
        border-radius: 999px;
        font-size: 0.6875rem;
        font-weight: 600;
        color: var(--text-muted);
    }

    .check-icon {
        color: white;
        flex-shrink: 0;
    }

    .empty-state {
        padding: 2rem 1rem;
        text-align: center;
        color: var(--text-muted);
    }

    .empty-state p {
        margin: 0;
    }

    .empty-hint {
        margin-top: 0.5rem !important;
        font-size: 0.8125rem;
        font-style: italic;
    }
</style>
