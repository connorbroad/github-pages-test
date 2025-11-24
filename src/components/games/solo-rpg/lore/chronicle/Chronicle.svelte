<script lang="ts">
    import { activeCampaign } from "../../game-management/campaign-store";
    import {
        loadChronicleEntries,
        saveChronicleEntries,
        loadChapters,
        saveChapters,
        loadCharacters,
        loadActiveCharacterId,
    } from "../../data/storage-utils";
    import type { ChronicleEntry, Chapter, Character } from "../../data/storage-utils";
    import { createEventDispatcher } from "svelte";
    import "../../solo-rpg-styles.css";
    import SrpgModal from "../../shared/modal/SrpgModal.svelte";
    import EntryCard from "./EntryCard.svelte";
    import SrpgListPage from "../../shared/layout/SrpgListPage.svelte";

    const dispatch = createEventDispatcher();

    let entries: ChronicleEntry[] = [];
    let chapters: Chapter[] = [];
    let showAddEntry = false;
    let newEntryText = "";
    let editingEntryId: string | null = null;
    let editText = ""; // Unified edit text for both manual and fortune entries
    let showCreateChapter = false;
    let chapterCustomName = "";
    let viewingChapterId: string | null = null; // null means viewing current entries
    let showChaptersList = false;
    let showCharacterAssign = false;
    let assigningToEntryId: string | null = null;
    let campaignCharacters: Character[] = [];

    $: if ($activeCampaign) {
        loadEntries();
        loadCampaignChapters();
        loadCampaignCharacters();
    }

    // Public method to force reload entries (can be called externally)
    export function reloadEntries() {
        loadEntries();
    }

    function loadEntries() {
        if (!$activeCampaign) return;

        const allEntries = loadChronicleEntries();
        entries = allEntries
            .filter((e) => {
                if (e.campaignId !== $activeCampaign.id) return false;
                // When viewing current chapter (viewingChapterId is null), show entries without a chapterId
                if (viewingChapterId === null) {
                    return !e.chapterId;
                }
                // When viewing a specific chapter, match that chapterId
                return e.chapterId === viewingChapterId;
            })
            .sort((a, b) => b.timestamp - a.timestamp); // Most recent first
    }

    function loadCampaignChapters() {
        if (!$activeCampaign) return;

        const allChapters = loadChapters();
        chapters = allChapters
            .filter((c) => c.campaignId === $activeCampaign.id)
            .sort((a, b) => b.chapterNumber - a.chapterNumber); // Most recent first
    }

    function loadCampaignCharacters() {
        if (!$activeCampaign) return;

        const allCharacters = loadCharacters();
        campaignCharacters = allCharacters
            .filter((c) => c.campaignId === $activeCampaign.id)
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    function getChapterDisplayName(chapter: Chapter): string {
        if (chapter.customName) {
            return `Chapter ${chapter.chapterNumber} - ${chapter.customName}`;
        }
        return `Chapter ${chapter.chapterNumber}`;
    }

    function openAddEntry() {
        newEntryText = "";
        editingEntryId = null;
        showAddEntry = true;
    }

    function cancelAddEntry() {
        showAddEntry = false;
        newEntryText = "";
        editingEntryId = null;
    }

    function saveEntry() {
        if (!$activeCampaign || !newEntryText.trim()) return;

        const allEntries = loadChronicleEntries();
        const activeCharacterId = loadActiveCharacterId();

        // Create new entry
        const newEntry: ChronicleEntry = {
            id: generateEntryId(),
            campaignId: $activeCampaign.id,
            timestamp: Date.now(),
            type: "manual",
            content: newEntryText.trim(),
            characterId: activeCharacterId || undefined,
        };
        allEntries.push(newEntry);

        saveChronicleEntries(allEntries);
        loadEntries();
        cancelAddEntry();
    }

    function deleteEntry(entryId: string) {
        if (!confirm("Are you sure you want to delete this entry?")) return;

        const allEntries = loadChronicleEntries();
        const filtered = allEntries.filter((e) => e.id !== entryId);
        saveChronicleEntries(filtered);

        loadEntries();
    }

    function assignCharacter(entryId: string) {
        assigningToEntryId = entryId;
        showCharacterAssign = true;
    }

    function cancelCharacterAssign() {
        assigningToEntryId = null;
        showCharacterAssign = false;
    }

    function selectCharacterForEntry(characterId: string | null) {
        if (!assigningToEntryId) return;

        const allEntries = loadChronicleEntries();
        const entryIndex = allEntries.findIndex((e) => e.id === assigningToEntryId);

        if (entryIndex !== -1) {
            allEntries[entryIndex] = {
                ...allEntries[entryIndex],
                characterId: characterId || undefined,
            };
            saveChronicleEntries(allEntries);
            loadEntries();
        }

        cancelCharacterAssign();
    }

    function getCharacterName(characterId?: string): string {
        if (!characterId) return "";
        const character = campaignCharacters.find((c) => c.id === characterId);
        return character ? character.name : "";
    }

    function openCreateChapter() {
        chapterCustomName = "";
        showCreateChapter = true;
    }

    function cancelCreateChapter() {
        showCreateChapter = false;
        chapterCustomName = "";
    }

    function createChapter() {
        if (!$activeCampaign) return;

        const currentEntries = loadChronicleEntries().filter(
            (e) => e.campaignId === $activeCampaign.id && !e.chapterId
        );

        if (currentEntries.length === 0) {
            alert("No entries to save into a chapter!");
            return;
        }

        // Determine next chapter number
        const nextChapterNumber =
            chapters.length > 0 ? Math.max(...chapters.map((c) => c.chapterNumber)) + 1 : 1;

        // Create new chapter
        const newChapter: Chapter = {
            id: generateEntryId(),
            campaignId: $activeCampaign.id,
            chapterNumber: nextChapterNumber,
            customName: chapterCustomName.trim() || undefined,
            createdAt:
                currentEntries.length > 0
                    ? Math.min(...currentEntries.map((e) => e.timestamp))
                    : Date.now(),
            closedAt: Date.now(),
        };

        // Save chapter
        const allChapters = loadChapters();
        allChapters.push(newChapter);
        saveChapters(allChapters);

        // Update all current entries to belong to this chapter
        const allEntries = loadChronicleEntries();
        allEntries.forEach((entry) => {
            if (entry.campaignId === $activeCampaign.id && !entry.chapterId) {
                entry.chapterId = newChapter.id;
            }
        });
        saveChronicleEntries(allEntries);

        // Reload data
        loadCampaignChapters();
        loadEntries();
        cancelCreateChapter();
    }

    function viewChapter(chapterId: string | null) {
        viewingChapterId = chapterId;
        showChaptersList = false;
        loadEntries();
    }

    function toggleChaptersList() {
        showChaptersList = !showChaptersList;
    }

    function deleteChapter(chapterId: string) {
        if (
            !confirm(
                "Are you sure you want to delete this chapter? All entries in this chapter will also be deleted."
            )
        )
            return;

        // Delete all entries in this chapter
        const allEntries = loadChronicleEntries();
        const filtered = allEntries.filter((e) => e.chapterId !== chapterId);
        saveChronicleEntries(filtered);

        // Delete the chapter
        const allChapters = loadChapters();
        const filteredChapters = allChapters.filter((c) => c.id !== chapterId);
        saveChapters(filteredChapters);

        // If we were viewing this chapter, go back to current
        if (viewingChapterId === chapterId) {
            viewingChapterId = null;
        }

        loadCampaignChapters();
        loadEntries();
    }

    function openEditEntry(entryId: string, isManual: boolean, currentText?: string) {
        editingEntryId = entryId;
        editText = currentText || "";
    }

    function cancelEditEntry() {
        editingEntryId = null;
        editText = "";
    }

    function saveEditEntry(entryId: string, isManual: boolean) {
        if (!editText.trim()) return;

        const allEntries = loadChronicleEntries();
        const entryIndex = allEntries.findIndex((e) => e.id === entryId);

        if (entryIndex !== -1) {
            if (isManual) {
                // Update manual entry content
                allEntries[entryIndex] = {
                    ...allEntries[entryIndex],
                    content: editText.trim(),
                };
            } else {
                // Update fortune entry notes
                allEntries[entryIndex] = {
                    ...allEntries[entryIndex],
                    userNotes: editText.trim(),
                };
            }
            saveChronicleEntries(allEntries);
            loadEntries();
        }

        cancelEditEntry();
    }

    function generateEntryId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    function formatTimestamp(timestamp: number): string {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }
</script>

<SrpgListPage
    className="mx-auto flex w-full max-w-[900px] flex-col overflow-hidden"
    headerClass=""
    contentClass="">
    <div slot="header" class="flex shrink-0 items-center justify-between pb-4">
        <div class="flex gap-2">
            <button class="srpg-b srpg-b-simple" on:click={toggleChaptersList}>
                📚 {showChaptersList ? "Hide" : "View"} Chapters
            </button>
        </div>
    </div>

    {#if showChaptersList}
        <div
            class="mb-6 overflow-hidden rounded-lg border-2 border-gray-300 bg-white dark:border-gray-600 dark:bg-zinc-800">
            <div
                class="flex items-center justify-between border-b border-gray-300 bg-gray-100 px-5 py-4 dark:border-gray-600 dark:bg-gray-700">
                <h3 class="m-0 text-lg text-gray-900 dark:text-gray-100">Chapters</h3>
                <button
                    class="cursor-pointer border-none bg-transparent p-1 text-xl leading-none text-gray-500 transition-colors duration-150 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    on:click={toggleChaptersList}
                    title="Close chapters list"
                    aria-label="Close chapters list">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="1em"
                        height="1em"
                        {...$$props}>
                        <path
                            fill="currentColor"
                            d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z" />
                    </svg>
                </button>
            </div>
            <div class="max-h-[400px] overflow-y-auto p-2">
                <div class="relative mb-1 flex items-center justify-center gap-1">
                    <button
                        class="flex-1 cursor-pointer rounded-md border border-gray-300 bg-gray-100 px-4 py-3 text-left transition-all duration-150 hover:border-gray-400 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600 {viewingChapterId ===
                        null
                            ? 'border-blue-500 bg-blue-500 text-white dark:border-blue-500 dark:bg-blue-500'
                            : ''}"
                        on:click={() => viewChapter(null)}>
                        <div>
                            <div
                                class="mb-1 text-[0.95rem] font-semibold {viewingChapterId === null
                                    ? 'text-white'
                                    : 'text-gray-900 dark:text-gray-100'}">
                                📖 Current Chapter
                            </div>
                            <div
                                class="text-xs {viewingChapterId === null
                                    ? 'text-white'
                                    : 'text-gray-500 dark:text-gray-400'}">
                                {loadChronicleEntries().filter(
                                    (e) => e.campaignId === $activeCampaign?.id && !e.chapterId
                                ).length} entries
                            </div>
                        </div>
                    </button>
                    {#if entries.length > 0 && viewingChapterId === null}
                        <button
                            class="srpg-b srpg-b-create w-16"
                            on:click={openCreateChapter}
                            aria-label="Finish Chapter">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="1.5em"
                                height="1.5em">
                                <path
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M17 16v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h2m3-4H9a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1m-1 4l-3 3m0 0l-3-3m3 3V3" />
                            </svg>
                        </button>
                    {/if}
                </div>
                {#each chapters as chapter (chapter.id)}
                    <div class="relative mb-1 flex items-center justify-center gap-1">
                        <button
                            class="flex-1 cursor-pointer rounded-md border border-gray-300 bg-gray-100 px-4 py-3 text-left transition-all duration-150 hover:border-gray-400 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600 {viewingChapterId ===
                            chapter.id
                                ? 'border-blue-500 bg-blue-500 text-white dark:border-blue-500 dark:bg-blue-500'
                                : ''}"
                            on:click={() => viewChapter(chapter.id)}>
                            <div
                                class="mb-1 text-[0.95rem] font-semibold {viewingChapterId ===
                                chapter.id
                                    ? 'text-white'
                                    : 'text-gray-900 dark:text-gray-100'}">
                                📜 {getChapterDisplayName(chapter)}
                            </div>
                            <div
                                class="text-xs {viewingChapterId === chapter.id
                                    ? 'text-white'
                                    : 'text-gray-500 dark:text-gray-400'}">
                                {loadChronicleEntries().filter((e) => e.chapterId === chapter.id)
                                    .length} entries
                            </div>
                        </button>
                        <button
                            class="srpg-b srpg-b-icon absolute right-4 cursor-pointer rounded border border-gray-300 bg-white p-1 text-gray-500 transition-all duration-150 hover:border-red-400 hover:bg-red-50 hover:text-red-600 dark:border-gray-600 dark:bg-zinc-800 dark:text-gray-400 dark:hover:border-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                            on:click|stopPropagation={() => deleteChapter(chapter.id)}
                            title="Delete chapter"
                            aria-label="Delete chapter">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="16"
                                height="16">
                                <path
                                    fill="currentColor"
                                    d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                            </svg>
                        </button>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    {#if viewingChapterId === null}
        {#if showCreateChapter}
            <SrpgModal
                show={showCreateChapter}
                ariaLabel="Close create chapter dialog"
                on:close={cancelCreateChapter}>
                <h3 class="mt-0 mb-4 text-xl text-gray-900 dark:text-gray-100">Finish Chapter</h3>
                <p class="m-0 mb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    All current entries will be saved to this chapter, and you'll start fresh with a
                    new current chapter.
                </p>
                <input
                    type="text"
                    bind:value={chapterCustomName}
                    placeholder="Chapter name (optional)"
                    class="mb-3 w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-base text-gray-900 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)] focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" />
                <div
                    class="mb-4 rounded-md border border-gray-300 bg-white px-3 py-3 text-[0.95rem] font-semibold text-gray-700 dark:border-gray-600 dark:bg-zinc-800 dark:text-gray-300">
                    {#if chapterCustomName.trim()}
                        Preview: Chapter {chapters.length + 1} - {chapterCustomName.trim()}
                    {:else}
                        Preview: Chapter {chapters.length + 1}
                    {/if}
                </div>
                <div class="flex flex-col justify-end gap-3">
                    <button class="srpg-b srpg-b-create" on:click={createChapter}>
                        Finish Chapter
                    </button>
                    <button class="srpg-b srpg-b-simple" on:click={cancelCreateChapter}>
                        Cancel
                    </button>
                </div>
            </SrpgModal>
        {/if}
    {:else}
        <!-- Viewing a Saved Chapter -->
        <div
            class="mb-6 flex items-center gap-4 rounded-lg border border-gray-300 bg-gray-100 px-5 py-4 dark:border-gray-600 dark:bg-gray-700">
            <button
                class="cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-150 hover:border-gray-400 hover:bg-gray-200 dark:border-gray-600 dark:bg-zinc-800 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-700"
                on:click={() => viewChapter(null)}>
                ← Back to Current
            </button>
            <span class="text-base font-semibold text-gray-900 dark:text-gray-100">
                📜 Viewing: {getChapterDisplayName(chapters.find((c) => c.id === viewingChapterId))}
            </span>
        </div>
    {/if}

    {#if !viewingChapterId}
        <div class="mb-4 text-center">
            <button class="srpg-b srpg-b-create srpg-b-w-full" on:click={openAddEntry}>
                + Add entry
            </button>
        </div>
    {/if}

    <div class="flex flex-1 flex-col gap-2 overflow-y-auto">
        {#if entries.length === 0}
            <div
                class="rounded-lg bg-gray-100 px-4 py-12 text-center text-gray-500 dark:bg-zinc-800 dark:text-gray-400">
                <p class="my-2">No chapter entries yet.</p>
                <p class="my-2">Click "Add entry" to record your first adventure log,</p>
                <p class="my-2">or roll the dice with the Oracle!</p>
            </div>
        {:else}
            {#each entries as entry (entry.id)}
                <EntryCard
                    {entry}
                    characterName={getCharacterName(entry.characterId)}
                    {editingEntryId}
                    bind:editText
                    {formatTimestamp}
                    on:assignCharacter={(e) => assignCharacter(e.detail)}
                    on:edit={(e) =>
                        openEditEntry(e.detail.entryId, e.detail.isManual, e.detail.currentText)}
                    on:delete={(e) => deleteEntry(e.detail)}
                    on:save={(e) => saveEditEntry(e.detail.entryId, e.detail.isManual)}
                    on:cancelEdit={cancelEditEntry} />
            {/each}
        {/if}
    </div>
</SrpgListPage>

<SrpgModal
    bind:show={showAddEntry}
    ariaLabel="Manual chronicle entry editor"
    maxWidth="600px"
    on:close={cancelAddEntry}>
    <div class="text-left">
        <h3 class="mt-0 mb-4 text-xl text-gray-900 dark:text-gray-100">New Chronicle Entry</h3>
        <textarea
            bind:value={newEntryText}
            placeholder="What happened in your adventure?"
            rows="6"
            class="mb-4 w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-3 text-base text-gray-900 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)] focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100">
        </textarea>
        <div class="flex flex-col justify-end gap-3 max-sm:flex-col">
            <button
                class="srpg-b srpg-b-create"
                on:click={saveEntry}
                disabled={!newEntryText.trim()}>
                Save Entry
            </button>
            <button class="srpg-b srpg-b-simple" on:click={cancelAddEntry}>Cancel</button>
        </div>
    </div>
</SrpgModal>

<!-- Character Assignment Modal -->
<SrpgModal bind:show={showCharacterAssign} maxWidth="450px" on:close={cancelCharacterAssign}>
    <div class="text-left">
        <h2 class="mt-0 mb-2 text-gray-900 dark:text-gray-100">Assign Character</h2>
        <p class="m-0 mb-4 text-sm text-gray-600 dark:text-gray-400">
            Select a character to associate with this entry.
        </p>

        {#if campaignCharacters.length > 0}
            <div class="mb-4 flex max-h-[400px] flex-col gap-2 overflow-y-auto">
                <button
                    class="srpg-b flex flex-col gap-1 rounded-md border-2 border-gray-300 bg-white px-4 py-3 text-left transition-all duration-200 hover:translate-x-0.5 hover:border-blue-500 hover:bg-gray-50 dark:border-gray-600 dark:bg-zinc-800 dark:hover:border-blue-500 dark:hover:bg-gray-700"
                    on:click={() => selectCharacterForEntry(null)}>
                    <span class="text-base font-semibold text-gray-900 dark:text-gray-100">
                        None (Remove assignment)
                    </span>
                </button>
                {#each campaignCharacters as character (character.id)}
                    <button
                        class="srpg-b flex flex-col gap-1 rounded-md border-2 border-gray-300 bg-white px-4 py-3 text-left transition-all duration-200 hover:translate-x-0.5 hover:border-blue-500 hover:bg-gray-50 dark:border-gray-600 dark:bg-zinc-800 dark:hover:border-blue-500 dark:hover:bg-gray-700"
                        on:click={() => selectCharacterForEntry(character.id)}>
                        <span class="text-base font-semibold text-gray-900 dark:text-gray-100">
                            {character.name}
                        </span>
                        {#if character.race || character.class}
                            <span class="text-[0.85rem] text-gray-600 dark:text-gray-400">
                                {#if character.race}{character.race}{/if}
                                {#if character.race && character.class}
                                    •
                                {/if}
                                {#if character.class}{character.class}{/if}
                            </span>
                        {/if}
                    </button>
                {/each}
            </div>
        {:else}
            <div
                class="mb-4 rounded-md bg-gray-100 px-4 py-8 text-center text-gray-600 dark:bg-zinc-800 dark:text-gray-400">
                <p class="my-1">No characters available.</p>
                <p class="my-1 text-sm italic">
                    Create a character in the Character Manager first.
                </p>
            </div>
        {/if}

        <div class="flex justify-end gap-2">
            <button class="srpg-b srpg-b-simple" on:click={cancelCharacterAssign}>Cancel</button>
        </div>
    </div>
</SrpgModal>
