<script lang="ts">
    /**
     * Reusable Modal Component
     * Provides a consistent modal wrapper with customizable navigation buttons
     */
    import { createEventDispatcher } from "svelte";

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
        class="bg-modal-overlay fixed top-0 left-0 z-[1000] box-border flex h-[100dvh] w-full items-center justify-center p-4 md:pl-[calc(80px+1rem)]"
        role="button"
        tabindex="0"
        aria-label={ariaLabel}
        on:click={handleOverlayClick}
        on:keydown={handleOverlayKeydown}
    >
        <div
            class="bg-modal-bg relative box-border flex max-h-full w-full min-w-[300px] flex-col overflow-hidden rounded-lg p-8 text-center shadow-lg max-md:m-0 max-md:max-w-full max-md:p-6 md:max-lg:max-w-[90vw] md:max-lg:p-6"
            role="dialog"
            aria-modal="true"
            tabindex="0"
            style="max-width: {maxWidth};"
            on:click|stopPropagation
            on:keydown={(e) => {}}
        >
            {#if showBackButton}
                <button
                    class="text-text-muted hover:text-text-primary absolute top-2 left-2 cursor-pointer border-none bg-transparent p-2 text-2xl transition-all duration-200 hover:scale-110 active:scale-95"
                    on:click={handleBack}
                    aria-label="Go back"
                >
                    ←
                </button>
            {/if}

            {#if showCloseButton}
                <button
                    class="text-text-muted hover:text-text-primary absolute top-2 right-2 cursor-pointer border-none bg-transparent p-2 text-2xl transition-all duration-200 hover:scale-110 active:scale-95"
                    on:click={handleClose}
                    aria-label="Close"
                >
                    &times;
                </button>
            {/if}

            <div
                class="scrollbar-thin scrollbar-track-bg-secondary scrollbar-thumb-border-secondary hover:scrollbar-thumb-text-muted min-h-0 flex-1 overflow-x-hidden overflow-y-auto scroll-smooth"
            >
                <slot />
            </div>
        </div>
    </div>
{/if}

<style>
</style>
