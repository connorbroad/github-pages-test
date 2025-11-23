<script lang="ts">
    /**
     * Fortune List Component
     * Displays a list of fortunes organized by campaign with drag-and-drop reordering
     */
    import type { Fortune } from "../scripts/oracleTypes";
    import { createEventDispatcher } from "svelte";

    export let fortunes: Fortune[] = [];
    export let allowReorder: boolean = true;
    export let allowDelete: boolean = true;

    const dispatch = createEventDispatcher();

    let draggedFortuneId: string | null = null;
    let draggedCampaign: string | null = null;
    let dragOverFortuneId: string | null = null;
    let dragOverCampaign: string | null = null;
    let touchStartY: number | null = null;
    let touchDraggedId: string | null = null;
    let touchDraggedCampaign: string | null = null;
    let touchDragOverId: string | null = null;
    let touchDragOverCampaign: string | null = null;

    function handleDragStart(campaign: string, fortuneId: string) {
        draggedFortuneId = fortuneId;
        draggedCampaign = campaign;
    }

    function handleDragOver(campaign: string, fortuneId: string, event: DragEvent) {
        event.preventDefault();
        if (draggedCampaign === campaign) {
            dragOverFortuneId = fortuneId;
            dragOverCampaign = campaign;
        }
    }

    function handleDrop(campaign: string, fortuneId: string) {
        if (
            draggedFortuneId === null ||
            draggedCampaign !== campaign ||
            draggedFortuneId === fortuneId
        ) {
            resetDragState();
            return;
        }

        dispatch("reorder", {
            draggedId: draggedFortuneId,
            targetId: fortuneId,
        });
        resetDragState();
    }

    function handleDragEnd() {
        resetDragState();
    }

    function resetDragState() {
        draggedFortuneId = null;
        draggedCampaign = null;
        dragOverFortuneId = null;
        dragOverCampaign = null;
    }

    function handleTouchStart(campaign: string, fortuneId: string, event: TouchEvent) {
        touchStartY = event.touches[0].clientY;
        touchDraggedId = fortuneId;
        touchDraggedCampaign = campaign;
        touchDragOverId = fortuneId;
        touchDragOverCampaign = campaign;
        event.stopPropagation();
    }

    function handleTouchMove(campaign: string, fortuneId: string, event: TouchEvent) {
        event.preventDefault();

        if (touchDraggedCampaign !== campaign) {
            return;
        }

        const touchY = event.touches[0].clientY;
        const campaignFortunes = fortunes.filter((f) => f.campaign === campaign);
        const allCards = Array.from(document.querySelectorAll(".fortune-card"));

        for (const card of allCards) {
            const rect = card.getBoundingClientRect();
            if (touchY >= rect.top && touchY <= rect.bottom) {
                const cardFortuneId = card.getAttribute("data-fortune-id");
                if (cardFortuneId && campaignFortunes.some((f) => f.id === cardFortuneId)) {
                    touchDragOverId = cardFortuneId;
                    touchDragOverCampaign = campaign;
                    break;
                }
            }
        }
    }

    function handleTouchEnd(campaign: string, fortuneId: string, event: TouchEvent) {
        if (
            touchDraggedId !== null &&
            touchDraggedCampaign === campaign &&
            touchDragOverId !== null &&
            touchDraggedId !== touchDragOverId
        ) {
            dispatch("reorder", {
                draggedId: touchDraggedId,
                targetId: touchDragOverId,
            });
        }
        resetTouchState();
    }

    function resetTouchState() {
        touchStartY = null;
        touchDraggedId = null;
        touchDraggedCampaign = null;
        touchDragOverId = null;
        touchDragOverCampaign = null;
    }

    function getFortuneIcons(fortune: Fortune): { hasDice: boolean; hasCards: boolean } {
        const hasDice = fortune.outcome?.diceRoll !== undefined;
        const hasCards = fortune.outcome?.cardDraw?.enabled === true;
        return { hasDice, hasCards };
    }
</script>

<div class="mt-4 text-left">
    {#if fortunes.length === 0}
        <p class="text-text-muted text-center italic">
            No fortunes yet. Create one to get started!
        </p>
    {:else}
        {#each fortunes as fortune}
            <div
                class="border-card-border bg-card-bg group/card before:bg-accent-primary hover:border-border-secondary relative mb-3.5 overflow-hidden rounded-xl border-[1.5px] transition-all
                       duration-200 ease-out before:absolute before:top-0 before:right-0 before:left-0 before:h-[3px] before:opacity-40 before:transition-opacity before:duration-200
                       before:content-[''] hover:-translate-y-[2px] hover:shadow-md hover:before:opacity-70
                       {draggedFortuneId === fortune.id || touchDraggedId === fortune.id
                    ? 'scale-[0.98] opacity-50'
                    : ''}
                       {draggedFortuneId === fortune.id || touchDraggedId === fortune.id
                    ? 'outline-accent-primary outline-2 outline-dashed'
                    : ''}
                       {dragOverFortuneId === fortune.id || touchDragOverId === fortune.id
                    ? 'outline-accent-success outline-2 outline-solid'
                    : ''}"
                role="listitem"
                data-fortune-id={fortune.id}
                data-dragging={draggedFortuneId === fortune.id || touchDraggedId === fortune.id
                    ? "true"
                    : "false"}
                on:dragover={(e) => handleDragOver(fortune.campaign || "", fortune.id, e)}
                on:drop={() => handleDrop(fortune.campaign || "", fortune.id)}>
                <div class="flex items-center justify-between gap-2 px-2.5 pt-2 pb-1">
                    {#if allowReorder}
                        <span
                            class="text-text-secondary hover:text-text-primary hover:bg-bg-secondary inline-flex cursor-grab items-center justify-center rounded-md p-1 opacity-50 transition-all duration-200 select-none hover:opacity-100 active:scale-95 active:cursor-grabbing"
                            title="Drag to reorder"
                            role="button"
                            tabindex="0"
                            aria-label="Drag to reorder fortune"
                            draggable="true"
                            on:dragstart={() => handleDragStart(fortune.campaign || "", fortune.id)}
                            on:dragend={handleDragEnd}
                            on:touchstart={(e) =>
                                handleTouchStart(fortune.campaign || "", fortune.id, e)}
                            on:touchmove={(e) =>
                                handleTouchMove(fortune.campaign || "", fortune.id, e)}
                            on:touchend={(e) =>
                                handleTouchEnd(fortune.campaign || "", fortune.id, e)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                                <path
                                    fill="currentColor"
                                    d="M7 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m5-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m5-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2" />
                            </svg>
                        </span>
                    {/if}
                    {#if allowDelete}
                        <button
                            class="text-text-muted hover:text-accent-danger hover:bg-danger-bg inline-flex cursor-pointer items-center justify-center rounded-md border-none bg-transparent p-1 opacity-50 transition-all duration-150 hover:opacity-100 active:scale-95"
                            on:click|stopPropagation={() => dispatch("delete", fortune.id)}
                            aria-label="Delete fortune">
                            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                                <path
                                    fill="currentColor"
                                    d="M18.3 5.71 12 12.01l-6.3-6.3-1.4 1.42 6.29 6.29-6.3 6.3 1.42 1.4 6.29-6.29 6.29 6.3 1.41-1.41-6.3-6.3 6.3-6.29z" />
                            </svg>
                        </button>
                    {/if}
                </div>

                <button
                    class="hover:bg-bg-secondary group/content flex w-full cursor-pointer items-center gap-4 border-none bg-transparent px-5 py-3.5 pb-4.5 text-left transition-all duration-200 active:scale-[0.99]"
                    on:click={() => dispatch("consultFate", fortune)}>
                    <div
                        class="flex shrink-0 items-center justify-center text-[#5b7095] transition-all duration-300 group-hover/content:text-[#4a5d7a]">
                        {#if getFortuneIcons(fortune).hasDice && getFortuneIcons(fortune).hasCards}
                            <!-- Both dice and cards -->
                            <div class="flex items-center gap-1">
                                <svg
                                    class="transition-transform duration-300 group-hover/content:rotate-180"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    aria-hidden="true">
                                    <rect
                                        x="3"
                                        y="3"
                                        width="18"
                                        height="18"
                                        rx="3"
                                        stroke="currentColor"
                                        stroke-width="2" />
                                    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                                    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                                    <circle cx="16" cy="16" r="1.5" fill="currentColor" />
                                    <circle cx="8" cy="16" r="1.5" fill="currentColor" />
                                    <circle cx="16" cy="8" r="1.5" fill="currentColor" />
                                </svg>
                                <svg
                                    class="transition-transform duration-300 group-hover/content:transform-[rotateY(180deg)]"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    aria-hidden="true">
                                    <rect
                                        x="4"
                                        y="4"
                                        width="16"
                                        height="20"
                                        rx="2"
                                        stroke="currentColor"
                                        stroke-width="2" />
                                    <path
                                        d="M12 8 L12 16 M8 12 L16 12"
                                        stroke="currentColor"
                                        stroke-width="2" />
                                </svg>
                            </div>
                        {:else if getFortuneIcons(fortune).hasDice}
                            <!-- Dice only -->
                            <svg
                                class="transition-transform duration-300 group-hover/content:rotate-180"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true">
                                <rect
                                    x="3"
                                    y="3"
                                    width="18"
                                    height="18"
                                    rx="3"
                                    stroke="currentColor"
                                    stroke-width="2" />
                                <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                                <circle cx="16" cy="16" r="1.5" fill="currentColor" />
                                <circle cx="8" cy="16" r="1.5" fill="currentColor" />
                                <circle cx="16" cy="8" r="1.5" fill="currentColor" />
                            </svg>
                        {:else if getFortuneIcons(fortune).hasCards}
                            <!-- Cards only -->
                            <svg
                                class=" transition-transform duration-300 group-hover/content:transform-[rotateY(180deg)]"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true">
                                <rect
                                    x="4"
                                    y="4"
                                    width="16"
                                    height="20"
                                    rx="2"
                                    stroke="currentColor"
                                    stroke-width="2" />
                                <path
                                    d="M12 8 L12 16 M8 12 L16 12"
                                    stroke="currentColor"
                                    stroke-width="2" />
                            </svg>
                        {:else}
                            <!-- Default oracle icon -->
                            <svg
                                class="transition-transform duration-300 group-hover/content:rotate-90"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true">
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="9"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                    opacity="0.3" />
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="5"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                    opacity="0.5" />
                                <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.7" />
                                <path
                                    d="M12 3 L12 7"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                    opacity="0.4" />
                                <path
                                    d="M12 17 L12 21"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                    opacity="0.4" />
                                <path
                                    d="M3 12 L7 12"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                    opacity="0.4" />
                                <path
                                    d="M17 12 L21 12"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                    opacity="0.4" />
                            </svg>
                        {/if}
                    </div>
                    <div
                        class="text-text-primary flex-1 text-[1.05rem] leading-snug font-medium tracking-wide">
                        {fortune.title}
                    </div>
                </button>
            </div>
        {/each}
    {/if}
</div>
