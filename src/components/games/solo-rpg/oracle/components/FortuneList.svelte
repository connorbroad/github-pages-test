<script lang="ts">
    /**
     * Fortune List Component
     * Displays a list of fortunes organized by campaign with drag-and-drop reordering
     */
    import type { Fortune } from "../scripts/oracleTypes";
    import { createEventDispatcher } from "svelte";
    import "../../solo-rpg-styles.css";

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

    function handleDragOver(
        campaign: string,
        fortuneId: string,
        event: DragEvent,
    ) {
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

    function handleTouchStart(
        campaign: string,
        fortuneId: string,
        event: TouchEvent,
    ) {
        touchStartY = event.touches[0].clientY;
        touchDraggedId = fortuneId;
        touchDraggedCampaign = campaign;
        touchDragOverId = fortuneId;
        touchDragOverCampaign = campaign;
        event.stopPropagation();
    }

    function handleTouchMove(
        campaign: string,
        fortuneId: string,
        event: TouchEvent,
    ) {
        event.preventDefault();

        if (touchDraggedCampaign !== campaign) {
            return;
        }

        const touchY = event.touches[0].clientY;
        const campaignFortunes = fortunes.filter(
            (f) => f.campaign === campaign,
        );
        const allCards = Array.from(document.querySelectorAll(".fortune-card"));

        for (const card of allCards) {
            const rect = card.getBoundingClientRect();
            if (touchY >= rect.top && touchY <= rect.bottom) {
                const cardFortuneId = card.getAttribute("data-fortune-id");
                if (
                    cardFortuneId &&
                    campaignFortunes.some((f) => f.id === cardFortuneId)
                ) {
                    touchDragOverId = cardFortuneId;
                    touchDragOverCampaign = campaign;
                    break;
                }
            }
        }
    }

    function handleTouchEnd(
        campaign: string,
        fortuneId: string,
        event: TouchEvent,
    ) {
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
</script>

<div class="fortunes-list">
    {#if fortunes.length === 0}
        <p class="empty-message">No fortunes yet. Create one to get started!</p>
    {:else}
        {#each fortunes as fortune}
            <div
                class="fortune-card"
                role="listitem"
                data-fortune-id={fortune.id}
                data-dragging={draggedFortuneId === fortune.id ||
                touchDraggedId === fortune.id
                    ? "true"
                    : "false"}
                on:dragover={(e) =>
                    handleDragOver(fortune.campaign || '', fortune.id, e)}
                on:drop={() => handleDrop(fortune.campaign || '', fortune.id)}
                style="outline: {draggedFortuneId === fortune.id
                    ? '2px dashed #3d5d82'
                    : dragOverFortuneId === fortune.id
                      ? '2px solid #4caf50'
                      : touchDraggedId === fortune.id
                        ? '2px dashed #3d5d82'
                        : touchDragOverId === fortune.id
                          ? '2px solid #4caf50'
                          : 'none'};"
            >
                <div class="fortune-action-row">
                    {#if allowReorder}
                        <span
                            class="drag-handle"
                            title="Drag to reorder"
                            role="button"
                            tabindex="0"
                            aria-label="Drag to reorder fortune"
                            draggable="true"
                            on:dragstart={() =>
                                handleDragStart(fortune.campaign || '', fortune.id)}
                            on:dragend={handleDragEnd}
                            on:touchstart={(e) =>
                                handleTouchStart(fortune.campaign || '', fortune.id, e)}
                            on:touchmove={(e) =>
                                handleTouchMove(fortune.campaign || '', fortune.id, e)}
                            on:touchend={(e) =>
                                handleTouchEnd(fortune.campaign || '', fortune.id, e)}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                                <path fill="currentColor" d="M7 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m5-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m5-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/>
                            </svg>
                        </span>
                    {/if}
                    <button
                        class="srpg-b srpg-b-normal fate-button"
                        on:click={() =>
                            dispatch("consultFate", fortune)}
                    >{fortune.title}</button>
                    {#if allowDelete}
                        <button
                            class="srpg-b-icon delete-icon"
                            on:click={() => dispatch("delete", fortune.id)}
                            aria-label="Delete fortune"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                                <path fill="currentColor" d="M18.3 5.71 12 12.01l-6.3-6.3-1.4 1.42 6.29 6.29-6.3 6.3 1.42 1.4 6.29-6.29 6.29 6.3 1.41-1.41-6.3-6.3 6.3-6.29z"/>
                            </svg>
                        </button>
                    {/if}
                </div>
            </div>
        {/each}
    {/if}
</div>

<style>
    .fortunes-list {
        text-align: left;
        margin-top: 1rem;
    }

    .empty-message {
        text-align: center;
        color: #999;
        font-style: italic;
    }

    .fortune-card {
        padding: 0.5rem;
        border-radius: 10px;
        margin-bottom: 0.75rem;
        position: relative;
        transition:
            transform 0.15s ease,
            box-shadow 0.15s ease,
            opacity 0.15s ease,
            background 0.2s ease;
        border: 1px solid #e5e7eb;
        background: #ffffff;
    }

    .fortune-card:hover {
        box-shadow: 0 2px 10px rgba(0,0,0,0.06);
        background: #fcfdff;
    }

    .fortune-card[data-dragging="true"] {
        opacity: 0.6;
        transform: scale(0.985);
    }

    .fortune-action-row {
        display: flex; 
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.1rem;
    }

    .drag-handle {
        cursor: grab;
        user-select: none;
        color: #3d5d82;
        transition: color 0.2s, transform 0.1s, background 0.2s;
        padding: 0.35rem;
        border-radius: 8px;
        width: 2rem;
        height: 2rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .drag-handle:hover {
        color: #2e4766;
        background: rgba(61,93,130,0.08);
    }

    .drag-handle:active {
        cursor: grabbing;
        transform: scale(0.96);
    }

    .fate-button { 
        width: 100%;
        font-size: 1rem;
        padding: 0.6rem 0.9rem;
        text-align: left;
    }

    .delete-icon {
        color: #9ca3af;
        transition: color 0.15s, background 0.15s, transform 0.05s;
        border-radius: 8px;
        width: 2rem;
        height: 2rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }
    .delete-icon:hover { color: #ef4444; background: rgba(239,68,68,0.08); }
    .delete-icon:active { transform: translateY(1px); }
</style>
