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
    import GameOracle from "../../oracle/GameOracle.svelte";
    import { tick } from "svelte";
    import { fly } from "svelte/transition";
    import { flip } from "svelte/animate";

    const dispatch = createEventDispatcher();

    let entries: ChronicleEntry[] = [];
    let chapters: Chapter[] = [];
    let newEntryText = "";
    let editingEntryId: string | null = null;
    let editText = "";
    let showCreateChapter = false;
    let chapterCustomName = "";
    let viewingChapterId: string | null = null; // null means viewing current entries
    let showChaptersList = false;
    let showCharacterAssign = false;
    let assigningToEntryId: string | null = null;
    let campaignCharacters: Character[] = [];
    let showOracle = false;
    let showReturnConfirm = false;
    let bottomRef: HTMLElement;
    let topRef: HTMLElement;
    let chaptersListRef: HTMLElement;
    let isAutoScrolling = false;

    // Timestamp threshold - entries created after this timestamp will animate
    // Only used for entries added directly on this page
    let animateEntriesAfter: number | null = null;

    $: if (showChaptersList) {
        scrollChaptersToBottom();
    }

    async function scrollChaptersToBottom() {
        await tick();
        if (chaptersListRef) {
            chaptersListRef.scrollTop = chaptersListRef.scrollHeight;
        }
    }

    $: if ($activeCampaign) {
        loadEntries();
        loadCampaignChapters();
        loadCampaignCharacters();
    }

    function loadEntries() {
        if (!$activeCampaign) return;

        const allEntries = loadChronicleEntries();
        const filteredEntries = allEntries
            .filter((e) => {
                if (e.campaignId !== $activeCampaign.id) return false;
                // When viewing current chapter (viewingChapterId is null), show entries without a chapterId
                if (viewingChapterId === null) {
                    return !e.chapterId;
                }
                return e.chapterId === viewingChapterId;
            })
            .sort((a, b) => a.timestamp - b.timestamp);

        entries = filteredEntries;

        if (viewingChapterId === null) {
            scrollTo(bottomRef);
        } else {
            scrollTo(topRef);
        }
    }

    // Check if an entry should animate (created after the animation threshold)
    function shouldAnimate(entry: ChronicleEntry): boolean {
        if (animateEntriesAfter === null) return false;
        return entry.timestamp >= animateEntriesAfter;
    }

    // Clear the animation threshold after animation completes
    function onAnimationEnd() {
        // Use a small delay to ensure all animations complete
        setTimeout(() => {
            animateEntriesAfter = null;
        }, 350);
    }

    async function scrollTo(element: HTMLElement) {
        isAutoScrolling = true;
        await tick();
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
        setTimeout(() => (isAutoScrolling = false), 500);
    }

    function loadCampaignChapters() {
        if (!$activeCampaign) return;

        const allChapters = loadChapters();
        chapters = allChapters
            .filter((c) => c.campaignId === $activeCampaign.id)
            .sort((a, b) => a.chapterNumber - b.chapterNumber);
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

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            saveEntry();
        }
    }

    function saveEntry() {
        if (!$activeCampaign || !newEntryText.trim()) return;

        const allEntries = loadChronicleEntries();
        const activeCharacterId = loadActiveCharacterId();

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
        animateEntriesAfter = Date.now() - 1000; // Animate entries from last second
        loadEntries();
        newEntryText = "";
        scrollTo(bottomRef);
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

        const nextChapterNumber =
            chapters.length > 0 ? Math.max(...chapters.map((c) => c.chapterNumber)) + 1 : 1;

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

        const allChapters = loadChapters();
        allChapters.push(newChapter);
        saveChapters(allChapters);

        const allEntries = loadChronicleEntries();
        allEntries.forEach((entry) => {
            if (entry.campaignId === $activeCampaign.id && !entry.chapterId) {
                entry.chapterId = newChapter.id;
            }
        });
        saveChronicleEntries(allEntries);

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

        const allEntries = loadChronicleEntries();
        const filtered = allEntries.filter((e) => e.chapterId !== chapterId);
        saveChronicleEntries(filtered);

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

    function formatTime(timestamp: number): string {
        const date = new Date(timestamp);
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function formatDate(timestamp: number): string {
        const date = new Date(timestamp);
        return date.toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    }

    function getDateKey(timestamp: number): string {
        const date = new Date(timestamp);
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    }
</script>

<SrpgListPage
    className="mx-auto flex w-full max-w-[900px] flex-col overflow-hidden"
    headerClass=""
    contentClass="">
    <div slot="header" class="flex shrink-0 flex-col gap-2">
        {#if viewingChapterId !== null}
            {@const currentChapter = chapters.find((c) => c.id === viewingChapterId)}
            {#if currentChapter}
                <div
                    class="flex items-center gap-4 rounded-lg border border-(--border-primary) bg-(--bg-secondary) px-5 py-4">
                    <span class="text-base font-semibold text-(--text-primary)">
                        📜 Viewing: {getChapterDisplayName(currentChapter)}
                    </span>
                </div>
            {/if}
        {/if}
    </div>

    {#if viewingChapterId === null && showCreateChapter}
        <SrpgModal
            show={showCreateChapter}
            ariaLabel="Close create chapter dialog"
            on:close={cancelCreateChapter}>
            <h3 class="mt-0 mb-4 text-xl text-(--text-primary)">Finish Chapter</h3>
            <p class="m-0 mb-4 text-sm leading-relaxed text-(--text-secondary)">
                All current entries will be saved to this chapter, and you'll start fresh with a new
                current chapter.
            </p>
            <input
                type="text"
                bind:value={chapterCustomName}
                placeholder="Chapter name (optional)"
                class="mb-3 w-full rounded-md border border-(--input-border) bg-(--input-bg) px-3 py-3 text-base text-(--input-text) focus:border-(--input-border-focus) focus:shadow-[0_0_0_3px_var(--focus-ring)] focus:outline-none" />
            <div
                class="mb-4 rounded-md border border-(--border-primary) bg-(--card-bg) px-3 py-3 text-[0.95rem] font-semibold text-(--text-secondary)">
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
                <button class="srpg-b srpg-b-simple" on:click={cancelCreateChapter}>Cancel</button>
            </div>
        </SrpgModal>
    {/if}

    <div
        class="chronicle-bg flex h-full flex-col-reverse gap-2 overflow-y-auto border-t border-b border-(--border-primary) px-3">
        <div bind:this={bottomRef} class="h-1"></div>
        {#each [...entries].reverse() as entry, index (entry.id)}
            {@const reversedEntries = [...entries].reverse()}
            {@const nextEntry =
                index < reversedEntries.length - 1 ? reversedEntries[index + 1] : null}
            {@const currentDateKey = getDateKey(entry.timestamp)}
            {@const nextDateKey = nextEntry ? getDateKey(nextEntry.timestamp) : null}
            {@const isFirstEntry = index === 0}
            {@const isLastEntry = index === reversedEntries.length - 1}
            {@const showDateSeparator =
                isFirstEntry || isLastEntry || (nextDateKey && currentDateKey !== nextDateKey)}

            <div
                in:fly={{
                    y: shouldAnimate(entry) ? 30 : 0,
                    duration: shouldAnimate(entry) ? 300 : 0,
                    opacity: shouldAnimate(entry) ? 0 : 1,
                }}
                animate:flip={{ duration: 300 }}
                on:introend={onAnimationEnd}
                class="flex flex-col gap-2">
                {#if showDateSeparator}
                    <div class="flex items-center justify-center pt-4 pb-2">
                        <span class="text-xs font-medium text-(--text-muted)">
                            {formatDate(entry.timestamp)}
                        </span>
                    </div>
                {/if}

                <EntryCard
                    {entry}
                    characterName={getCharacterName(entry.characterId)}
                    {editingEntryId}
                    bind:editText
                    formatTimestamp={formatTime}
                    on:assignCharacter={(e) => assignCharacter(e.detail)}
                    on:edit={(e) =>
                        openEditEntry(e.detail.entryId, e.detail.isManual, e.detail.currentText)}
                    on:delete={(e) => deleteEntry(e.detail)}
                    on:save={(e) => saveEditEntry(e.detail.entryId, e.detail.isManual)}
                    on:cancelEdit={cancelEditEntry} />
            </div>
        {:else}
            <div
                class="rounded-lg bg-(--bg-secondary) mb-4 px-4 py-12 text-center text-(--text-muted)">
                <p class="my-2">No chapter entries yet.</p>
                <p class="my-2">Type a message below to record your first adventure log,</p>
                <p class="my-2">or roll the dice with the Oracle!</p>
            </div>
        {/each}
        <div bind:this={topRef} class="h-1"></div>
    </div>

    <div slot="footer" class="relative mb-[calc(env(safe-area-inset-bottom))] pt-2 md:mb-0">
        <div class="flex items-start gap-2">
            <button
                class="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-(--border-primary) bg-(--card-bg) text-(--text-secondary) shadow-sm transition-colors hover:bg-(--bg-tertiary) hover:text-(--accent-primary)"
                on:click={toggleChaptersList}
                title="View Chapters"
                aria-label="View Chapters">
                <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    <line x1="8" y1="7" x2="16" y2="7"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
            </button>

            <button
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-(--border-primary) bg-(--card-bg) text-(--text-secondary) shadow-sm transition-colors {viewingChapterId !==
                null
                    ? 'cursor-pointer opacity-50'
                    : 'cursor-pointer hover:bg-(--bg-tertiary) hover:text-(--accent-primary)'}"
                on:click={() =>
                    viewingChapterId !== null ? (showReturnConfirm = true) : (showOracle = true)}
                title={viewingChapterId !== null
                    ? "Return to current chapter to use Oracle"
                    : "Open Oracle"}
                aria-label={viewingChapterId !== null
                    ? "Return to current chapter to use Oracle"
                    : "Open Oracle"}>
                <svg viewBox="0 0 512 512" width="20" height="20">
                    <path
                        fill="currentColor"
                        d="M510.923 324.993L325.507 509.894c-.515.515-1.545.515-3.091.515L69.529 442.938c-.515 0-1.545-.515-2.06-2.06L-.002 188.507c0-.515 0-2.06.515-3.09L185.929.517c.515-.515 1.545-.515 3.09-.515l252.887 67.986c.515 0 1.545.515 2.06 2.06l67.471 252.371c1.03 1.03.515 2.06-.515 2.575zM263.188 124.126L14.937 191.082q-.773 0 0 1.545l181.81 181.811c.515.515.515 0 1.545 0l66.955-247.736c-1.03-2.575-2.06-2.575-2.06-2.575z" />
                </svg>
            </button>

            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                class="relative flex-1 {viewingChapterId !== null ? 'cursor-pointer' : ''}"
                on:click={() => viewingChapterId !== null && (showReturnConfirm = true)}>
                <textarea
                    bind:value={newEntryText}
                    on:keydown={handleKeydown}
                    placeholder={viewingChapterId !== null ? "..." : "What happens next?"}
                    rows="1"
                    disabled={viewingChapterId !== null}
                    class="max-h-[120px] min-h-10 w-full resize-none rounded-2xl border border-(--input-border) bg-(--input-bg) px-4 py-2 pr-10 text-base leading-6 text-(--text-primary) shadow-sm focus:border-(--input-border-focus) focus:ring-1 focus:ring-(--input-border-focus) focus:outline-none disabled:pointer-events-none disabled:cursor-pointer disabled:opacity-50"
                    style="field-sizing: content;">
                </textarea>
            </div>

            <button
                class="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-(--accent-primary) text-white shadow-sm transition-colors hover:bg-(--accent-primary-hover) disabled:cursor-not-allowed disabled:opacity-50"
                on:click={saveEntry}
                disabled={!newEntryText.trim() || viewingChapterId !== null}
                title="Send Entry"
                aria-label="Send Entry">
                <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
            </button>
        </div>
    </div>
</SrpgListPage>

<!-- Chapters List Modal -->
<SrpgModal
    bind:show={showChaptersList}
    ariaLabel="Chapters List"
    maxWidth="500px"
    on:close={toggleChaptersList}>
    <div class="flex h-[60vh] flex-col">
        <h2 class="mt-0 mb-4 text-xl font-bold text-(--text-primary)">Chapters</h2>

        <div class="flex-1 overflow-y-auto pr-2" bind:this={chaptersListRef}>
            <!-- Past Chapters -->
            {#if chapters.length > 0}
                <div class="flex flex-col gap-2 pb-4">
                    {#each chapters as chapter (chapter.id)}
                        <div class="group relative">
                            <button
                                class="flex w-full flex-col items-start rounded-lg border p-3 transition-all duration-200 {viewingChapterId ===
                                chapter.id
                                    ? 'border-(--accent-primary) bg-(--accent-info)/10'
                                    : 'border-(--border-primary) bg-(--card-bg) hover:border-(--accent-primary) hover:bg-(--bg-tertiary)'}"
                                on:click={() => viewChapter(chapter.id)}>
                                <div class="flex w-full items-center justify-between">
                                    <span
                                        class="font-medium {viewingChapterId === chapter.id
                                            ? 'text-(--accent-primary)'
                                            : 'text-(--text-primary)'}">
                                        {getChapterDisplayName(chapter)}
                                    </span>
                                </div>
                                <span class="mt-1 text-xs text-(--text-muted)">
                                    {loadChronicleEntries().filter(
                                        (e) => e.chapterId === chapter.id
                                    ).length} entries
                                </span>
                            </button>

                            <button
                                class="absolute top-3 right-3 rounded p-1 text-(--text-muted) opacity-0 transition-opacity group-hover:opacity-100 hover:bg-(--danger-bg) hover:text-(--accent-danger)"
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
            {:else}
                <div class="flex h-full items-center justify-center text-(--text-muted) italic">
                    No past chapters
                </div>
            {/if}
        </div>

        <div class="mt-2 flex flex-col gap-3 border-t border-(--border-primary) pt-4">
            <!-- Current Chapter Button -->
            <button
                class="flex w-full flex-col items-start rounded-lg border-2 p-4 transition-all duration-200 {viewingChapterId ===
                null
                    ? 'border-(--accent-primary) bg-(--accent-info)/10'
                    : 'border-(--border-primary) bg-(--card-bg) hover:border-(--accent-primary) hover:bg-(--bg-tertiary)'}"
                on:click={() => viewChapter(null)}>
                <div class="flex w-full items-center justify-between">
                    <span
                        class="font-bold {viewingChapterId === null
                            ? 'text-(--accent-primary)'
                            : 'text-(--text-primary)'}">
                        📖 Current Chapter
                    </span>
                    {#if viewingChapterId === null}
                        <span
                            class="rounded-full bg-(--accent-info)/20 px-2 py-0.5 text-xs font-medium text-(--accent-primary)">
                            Active
                        </span>
                    {/if}
                </div>
                <span class="mt-1 text-sm text-(--text-muted)">
                    {loadChronicleEntries().filter(
                        (e) => e.campaignId === $activeCampaign?.id && !e.chapterId
                    ).length} entries
                </span>
            </button>

            <button
                class="srpg-b srpg-b-normal srpg-b-w-full"
                on:click={() => {
                    toggleChaptersList();
                    openCreateChapter();
                }}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z">
                    </path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                Save Current Chapter
            </button>
        </div>
    </div>
</SrpgModal>

{#if showOracle}
    <GameOracle
        on:close={() => (showOracle = false)}
        on:navigateToStory={() => {
            showOracle = false;
            animateEntriesAfter = Date.now() - 5000;
            loadEntries();
        }}
        on:clearPreset={() => {}} />
{/if}

<!-- Character Assignment Modal -->
<SrpgModal bind:show={showCharacterAssign} maxWidth="450px" on:close={cancelCharacterAssign}>
    <div class="text-left">
        <h2 class="mt-0 mb-2 text-(--text-primary)">Assign Character</h2>
        <p class="m-0 mb-4 text-sm text-(--text-secondary)">
            Select a character to associate with this entry.
        </p>

        {#if campaignCharacters.length > 0}
            <div class="mb-4 flex max-h-[400px] flex-col gap-2 overflow-y-auto">
                <button
                    class="flex flex-col gap-1 rounded-md border-2 border-(--border-primary) bg-(--card-bg) px-4 py-3 text-left transition-all duration-200 hover:translate-x-0.5 hover:border-(--accent-primary) hover:bg-(--bg-tertiary)"
                    on:click={() => selectCharacterForEntry(null)}>
                    <span class="text-base font-semibold text-(--text-primary)">
                        None (Remove assignment)
                    </span>
                </button>
                {#each campaignCharacters as character (character.id)}
                    <button
                        class="flex flex-col gap-1 rounded-md border-2 border-(--border-primary) bg-(--card-bg) px-4 py-3 text-left transition-all duration-200 hover:translate-x-0.5 hover:border-(--accent-primary) hover:bg-(--bg-tertiary)"
                        on:click={() => selectCharacterForEntry(character.id)}>
                        <span class="text-base font-semibold text-(--text-primary)">
                            {character.name}
                        </span>
                        {#if character.race || character.class}
                            <span class="text-[0.85rem] text-(--text-secondary)">
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
                class="mb-4 rounded-md bg-(--bg-secondary) px-4 py-8 text-center text-(--text-secondary)">
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

<!-- Return to Current Chapter Confirmation Modal -->
<SrpgModal
    bind:show={showReturnConfirm}
    maxWidth="400px"
    on:close={() => (showReturnConfirm = false)}>
    <div class="text-left">
        <h2 class="mt-0 mb-2 text-(--text-primary)">Return to Current Chapter?</h2>
        <p class="m-0 mb-6 text-sm text-(--text-secondary)">
            You're currently viewing a past chapter. Would you like to return to the current chapter
            to add new entries or use the Oracle?
        </p>

        <div class="flex justify-end gap-2">
            <button class="srpg-b srpg-b-simple" on:click={() => (showReturnConfirm = false)}>
                Cancel
            </button>
            <button
                class="srpg-b srpg-b-create"
                on:click={() => {
                    showReturnConfirm = false;
                    viewChapter(null);
                }}>
                Yes, Return
            </button>
        </div>
    </div>
</SrpgModal>
