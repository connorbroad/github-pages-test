<script lang="ts">
    import GameOracle from "../oracle/GameOracle.svelte";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    export let hasSecondarySidebar = false;
    export let hasTertiarySidebar = false;

    let showOracle = false;

    function toggleOracle() {
        showOracle = !showOracle;
    }

    function closeOracle() {
        showOracle = false;
    }

    function handleNavigateToStory() {
        showOracle = false; // Close the oracle when navigating to story
        dispatch("navigateToStory");
    }
</script>

<button
    class="floating-oracle-button"
    class:has-secondary={hasSecondarySidebar}
    class:has-tertiary={hasTertiarySidebar}
    on:click={toggleOracle}
    aria-label="Open Oracle"
>
    <svg viewBox="0 0 512 512" width="1.5em" height="1.5em">
        <path
            fill="currentColor"
            d="M510.923 324.993L325.507 509.894c-.515.515-1.545.515-3.091.515L69.529 442.938c-.515 0-1.545-.515-2.06-2.06L-.002 188.507c0-.515 0-2.06.515-3.09L185.929.517c.515-.515 1.545-.515 3.09-.515l252.887 67.986c.515 0 1.545.515 2.06 2.06l67.471 252.371c1.03 1.03.515 2.06-.515 2.575zM263.188 124.126L14.937 191.082q-.773 0 0 1.545l181.81 181.811c.515.515.515 0 1.545 0l66.955-247.736c-1.03-2.575-2.06-2.575-2.06-2.575z"
        />
    </svg>
</button>

{#if showOracle}
    <GameOracle 
        on:close={closeOracle}
        on:navigateToStory={handleNavigateToStory}
    />
{/if}

<style>
    .floating-oracle-button {
        position: fixed;
        bottom: 1rem;
        right: 1rem;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: linear-gradient(135deg, #4a9eff 0%, #3d5d82 100%);
        color: white;
        border: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999;
        transition: all 0.3s ease;
    }

    .floating-oracle-button:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
    }

    .floating-oracle-button:active {
        transform: scale(0.95);
    }

    /* Desktop - account for left sidebar */
    @media (min-width: 769px) {
        .floating-oracle-button {
            right: 1.5rem;
            bottom: 1.5rem;
        }
    }

    /* Mobile - account for bottom navbar */
    @media (max-width: 768px) {
        .floating-oracle-button {
            bottom: calc(70px + env(safe-area-inset-bottom) + 1rem);
            right: 1rem;
            width: 56px;
            height: 56px;
        }

        /* On mobile, secondary/tertiary sidebars are also at the bottom */
        .floating-oracle-button.has-secondary {
            bottom: calc(70px + 60px + env(safe-area-inset-bottom) + 1rem);
        }

        .floating-oracle-button.has-secondary.has-tertiary {
            bottom: calc(
                70px + 60px + 60px + env(safe-area-inset-bottom) + 1rem
            );
        }
    }
</style>
