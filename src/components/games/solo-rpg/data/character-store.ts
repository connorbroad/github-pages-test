import { writable, get } from "svelte/store";
import { type Character, loadCharacters, saveCharacters as saveToStorage } from "./storage-utils";

function createCharacterStore() {
    // Initialize with empty array, will be populated by reload()
    const { subscribe, set, update } = writable<Character[]>([]);

    return {
        subscribe,

        // Reload all characters from localStorage
        reload: () => {
            const chars = loadCharacters();
            set(chars);
        },

        // Add a new character
        add: (character: Character) => {
            update((chars) => {
                const newChars = [...chars, character];
                saveToStorage(newChars);
                return newChars;
            });
        },

        // Update an existing character
        updateCharacter: (updatedCharacter: Character) => {
            update((chars) => {
                const newChars = chars.map((c) =>
                    c.id === updatedCharacter.id ? updatedCharacter : c
                );
                saveToStorage(newChars);
                return newChars;
            });
        },

        // Delete a character
        deleteCharacter: (characterId: string) => {
            update((chars) => {
                const newChars = chars.filter((c) => c.id !== characterId);
                saveToStorage(newChars);
                return newChars;
            });
        },

        // Get a specific character by ID (non-reactive helper)
        getById: (id: string): Character | undefined => {
            const chars = get({ subscribe });
            return chars.find((c) => c.id === id);
        },
    };
}

export const characterStore = createCharacterStore();

// Initialize immediately so subscribers get data
characterStore.reload();
