<script lang="ts">
    /**
     * Fortune List Component
     * Displays a list of fortunes organized by campaign with drag-and-drop reordering
     */
    import type { Fortune } from "../scripts/oracleTypes";
    import { createEventDispatcher } from "svelte";
    import "../../solo-rpg-styles.css";

    export let fortunes: Fortune[] = [];
    export let campaigns: string[] = [];

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
    {#if campaigns.length === 0}
        <p class="empty-message">No fortunes yet. Create one to get started!</p>
    {:else}
        {#each campaigns as campaign}
            <div class="campaign-group">
                <h3 class="campaign-title">{campaign}</h3>
                {#each fortunes.filter((f) => f.campaign === campaign) as fortune}
                    <div
                        class="fortune-card"
                        role="listitem"
                        data-fortune-id={fortune.id}
                        data-dragging={draggedFortuneId === fortune.id ||
                        touchDraggedId === fortune.id
                            ? "true"
                            : "false"}
                        on:dragover={(e) =>
                            handleDragOver(campaign, fortune.id, e)}
                        on:drop={() => handleDrop(campaign, fortune.id)}
                        style="border: {draggedFortuneId === fortune.id &&
                        draggedCampaign === campaign
                            ? '2px dashed #1976d2'
                            : dragOverFortuneId === fortune.id &&
                                dragOverCampaign === campaign
                              ? '2px solid #4caf50'
                              : touchDraggedId === fortune.id &&
                                  touchDraggedCampaign === campaign
                                ? '2px dashed #1976d2'
                                : touchDragOverId === fortune.id &&
                                    touchDragOverCampaign === campaign
                                  ? '2px solid #4caf50'
                                  : 'none'};"
                    >
                        <div class="fortune-action-row">
                            <span
                                class="drag-handle"
                                title="Drag to reorder"
                                role="button"
                                tabindex="0"
                                aria-label="Drag to reorder fortune"
                                draggable="true"
                                on:dragstart={() =>
                                    handleDragStart(campaign, fortune.id)}
                                on:dragend={handleDragEnd}
                                on:touchstart={(e) =>
                                    handleTouchStart(campaign, fortune.id, e)}
                                on:touchmove={(e) =>
                                    handleTouchMove(campaign, fortune.id, e)}
                                on:touchend={(e) =>
                                    handleTouchEnd(campaign, fortune.id, e)}
                                >☰</span
                            >
                            <button
                                class="srpg-b srpg-b-normal fate-button"
                                on:click={() =>
                                    dispatch("consultFate", fortune)}
                                >{fortune.title}</button
                            >
                            <button
                                class="srpg-icon-button delete-icon"
                                on:click={() => dispatch("delete", fortune.id)}
                                >×</button
                            >
                        </div>
                    </div>
                {/each}
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

    .campaign-group {
        margin-bottom: 2rem;
    }

    .campaign-title {
        font-size: 1.3rem;
        color: #1976d2;
        margin-bottom: 0.5rem;
        border-bottom: 2px solid #1976d2;
        padding-bottom: 0.25rem;
    }

    .fortune-card {
        padding: 0.5rem;
        border-radius: 6px;
        margin-bottom: 0.75rem;
        position: relative;
        transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            opacity 0.2s ease;
    }

    .fortune-card[data-dragging="true"] {
        opacity: 0.5;
        transform: scale(0.98);
    }

    .fortune-action-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        margin-bottom: 0.25rem;
    }

    .drag-handle {
        position: static;
        cursor: grab;
        user-select: none;
        color: #1976d2;
        transition:
            color 0.2s,
            transform 0.1s;
        padding: 0.25rem;
        border-radius: 4px;
        font-size: 1.5rem;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .drag-handle:hover {
        color: #1565c0;
        background: rgba(25, 118, 210, 0.1);
    }

    .drag-handle:active {
        cursor: grabbing;
        transform: scale(0.95);
    }

    .fate-button {
        width: 100%;
        font-size: 1rem;
        padding: 0.5rem 1rem;
    }
</style>
