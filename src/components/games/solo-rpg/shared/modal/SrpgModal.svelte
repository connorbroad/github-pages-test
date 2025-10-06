<script lang="ts">
    /**
     * Reusable Modal Component
     * Provides a consistent modal wrapper with customizable navigation buttons
     */
    import { createEventDispatcher } from "svelte";
    import "../../solo-rpg-styles.css";

    export let show = false;
    export let showCloseButton = true;
    export let showBackButton = false;
    export let closeOnOverlayClick = true;
    export let ariaLabel = "Close modal";
    export let maxWidth = "500px";

    const dispatch = createEventDispatcher<{
        close: void;
        back: void;
    }>();

    function handleOverlayClick() {
        if (closeOnOverlayClick) {
            dispatch("close");
        }
    }

    function handleOverlayKeydown(e: KeyboardEvent) {
        if (!closeOnOverlayClick) return;

        const tag = (e.target as HTMLElement).tagName;
        const isEditable = (e.target as HTMLElement).isContentEditable;
        if (
            (e.key === "Enter" || e.key === " ") &&
            !["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(tag) &&
            !isEditable
        ) {
            dispatch("close");
        }
    }

    function handleClose() {
        dispatch("close");
    }

    function handleBack() {
        dispatch("back");
    }
</script>

{#if show}
    <div
        class="srpg-modal"
        role="button"
        tabindex="0"
        aria-label={ariaLabel}
        on:click={handleOverlayClick}
        on:keydown={handleOverlayKeydown}
    >
        <div
            class="srpg-modal-content"
            role="dialog"
            aria-modal="true"
            tabindex="0"
            style="max-width: {maxWidth};"
            on:click|stopPropagation
            on:keydown={(e) => {}}
        >
            {#if showBackButton}
                <button
                    class="srpg-b-modal-nav srpg-b-modal-nav-back"
                    on:click={handleBack}
                    aria-label="Go back"
                >
                    ←
                </button>
            {/if}

            {#if showCloseButton}
                <button
                    class="srpg-b-modal-nav srpg-b-modal-nav-close"
                    on:click={handleClose}
                    aria-label="Close"
                >
                    &times;
                </button>
            {/if}

            <slot />
        </div>
    </div>
{/if}
