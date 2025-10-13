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

    function getFortuneIcons(fortune: Fortune): { hasDice: boolean; hasCards: boolean } {
        const hasDice = fortune.outcome?.diceRoll !== undefined;
        const hasCards = fortune.outcome?.cardDraw?.enabled === true;
        return { hasDice, hasCards };
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
                class:dragging={draggedFortuneId === fortune.id || touchDraggedId === fortune.id}
                class:drag-over={dragOverFortuneId === fortune.id || touchDragOverId === fortune.id}
            >
                <div class="fortune-card-header">
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
                            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                                <path fill="currentColor" d="M7 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m5-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m5-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/>
                            </svg>
                        </span>
                    {/if}
                    {#if allowDelete}
                        <button
                            class="delete-icon"
                            on:click|stopPropagation={() => dispatch("delete", fortune.id)}
                            aria-label="Delete fortune"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                                <path fill="currentColor" d="M18.3 5.71 12 12.01l-6.3-6.3-1.4 1.42 6.29 6.29-6.3 6.3 1.42 1.4 6.29-6.29 6.29 6.3 1.41-1.41-6.3-6.3 6.3-6.29z"/>
                            </svg>
                        </button>
                    {/if}
                </div>
                
                <button
                    class="fortune-card-content"
                    on:click={() => dispatch("consultFate", fortune)}
                >
                    <div class="oracle-icons">
                        {#if getFortuneIcons(fortune).hasDice && getFortuneIcons(fortune).hasCards}
                            <!-- Both dice and cards -->
                            <div class="icon-group">
                                <svg class="dice-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="2"/>
                                    <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
                                    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                                    <circle cx="16" cy="16" r="1.5" fill="currentColor"/>
                                    <circle cx="8" cy="16" r="1.5" fill="currentColor"/>
                                    <circle cx="16" cy="8" r="1.5" fill="currentColor"/>
                                </svg>
                                <svg class="card-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <rect x="4" y="4" width="16" height="20" rx="2" stroke="currentColor" stroke-width="2"/>
                                    <path d="M12 8 L12 16 M8 12 L16 12" stroke="currentColor" stroke-width="2"/>
                                </svg>
                            </div>
                        {:else if getFortuneIcons(fortune).hasDice}
                            <!-- Dice only -->
                            <svg class="dice-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="2"/>
                                <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
                                <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                                <circle cx="16" cy="16" r="1.5" fill="currentColor"/>
                                <circle cx="8" cy="16" r="1.5" fill="currentColor"/>
                                <circle cx="16" cy="8" r="1.5" fill="currentColor"/>
                            </svg>
                        {:else if getFortuneIcons(fortune).hasCards}
                            <!-- Cards only -->
                            <svg class="card-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <rect x="4" y="4" width="16" height="20" rx="2" stroke="currentColor" stroke-width="2"/>
                                <path d="M12 8 L12 16 M8 12 L16 12" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        {:else}
                            <!-- Default oracle icon -->
                            <svg class="oracle-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
                                <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
                                <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.7"/>
                                <path d="M12 3 L12 7" stroke="currentColor" stroke-width="1.5" opacity="0.4"/>
                                <path d="M12 17 L12 21" stroke="currentColor" stroke-width="1.5" opacity="0.4"/>
                                <path d="M3 12 L7 12" stroke="currentColor" stroke-width="1.5" opacity="0.4"/>
                                <path d="M17 12 L21 12" stroke="currentColor" stroke-width="1.5" opacity="0.4"/>
                            </svg>
                        {/if}
                    </div>
                    <div class="fortune-title">{fortune.title}</div>
                </button>
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
        color: var(--text-muted);
        font-style: italic;
    }

    .fortune-card {
        position: relative;
        border-radius: 12px;
        margin-bottom: 0.875rem;
        transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            opacity 0.15s ease;
        border: 1.5px solid var(--card-border);
        background: var(--card-bg);
        overflow: hidden;
    }

    .fortune-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: var(--accent-primary);
        opacity: 0.4;
        transition: opacity 0.2s ease;
    }

    .fortune-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px var(--shadow-md);
        border-color: var(--border-secondary);
    }

    .fortune-card:hover::before {
        opacity: 0.7;
    }

    .fortune-card[data-dragging="true"] {
        opacity: 0.5;
        transform: scale(0.98);
    }

    .fortune-card.dragging {
        outline: 2px dashed var(--accent-primary);
    }

    .fortune-card.drag-over {
        outline: 2px solid var(--accent-success);
    }

    .fortune-card-header {
        display: flex; 
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 0.625rem 0.25rem 0.625rem;
        gap: 0.5rem;
    }

    .drag-handle {
        cursor: grab;
        user-select: none;
        color: var(--text-secondary);
        transition: color 0.2s, transform 0.1s, background 0.2s;
        padding: 0.25rem;
        border-radius: 6px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        opacity: 0.5;
    }

    .drag-handle:hover {
        color: var(--text-primary);
        background: var(--bg-secondary);
        opacity: 1;
    }

    .drag-handle:active {
        cursor: grabbing;
        transform: scale(0.95);
    }

    .delete-icon {
        color: var(--text-muted);
        transition: color 0.15s, background 0.15s, transform 0.05s;
        border-radius: 6px;
        padding: 0.25rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
        cursor: pointer;
        opacity: 0.5;
    }
    
    .delete-icon:hover { 
        color: var(--accent-danger);
        background: var(--danger-bg);
        opacity: 1;
    }
    
    .delete-icon:active { 
        transform: scale(0.95); 
    }

    .fortune-card-content {
        width: 100%;
        background: transparent;
        border: none;
        padding: 0.875rem 1.25rem 1.125rem 1.25rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 1rem;
        transition: all 0.2s ease;
        text-align: left;
    }

    .fortune-card-content:hover {
        background: var(--bg-secondary);
    }

    .fortune-card-content:active {
        transform: scale(0.99);
    }

    .oracle-icons {
        flex-shrink: 0;
        color: #5b7095;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.3s ease, color 0.2s ease;
    }

    .icon-group {
        display: flex;
        gap: 0.25rem;
        align-items: center;
    }

    .dice-icon {
        transition: transform 0.3s ease;
    }

    .card-icon {
        transition: transform 0.3s ease;
    }

    .oracle-icon {
        transition: transform 0.3s ease;
    }

    .fortune-card-content:hover .oracle-icons {
        color: #4a5d7a;
    }

    .fortune-card-content:hover .dice-icon {
        transform: rotate(180deg);
    }

    .fortune-card-content:hover .card-icon {
        transform: rotateY(180deg);
    }

    .fortune-card-content:hover .oracle-icon {
        transform: rotate(90deg);
    }

    .fortune-card-content:hover .icon-group .dice-icon {
        transform: rotate(180deg);
    }

    .fortune-card-content:hover .icon-group .card-icon {
        transform: rotateY(180deg);
    }

    .fortune-title {
        flex: 1;
        font-size: 1.05rem;
        font-weight: 500;
        color: var(--text-primary);
        letter-spacing: 0.01em;
        line-height: 1.4;
    }
</style>
