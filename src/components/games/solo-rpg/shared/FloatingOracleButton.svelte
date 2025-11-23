<script lang="ts">
    import GameOracle from "../oracle/GameOracle.svelte";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    export let hasSecondarySidebar = false;
    export let hasTertiarySidebar = false;
    export let diceRollPreset: any = null;
    export let currentCharacterId: string | null = null; // Currently viewed character ID

    let showOracle = false;

    // Automatically open oracle when preset is provided
    $: if (diceRollPreset && !showOracle) {
        showOracle = true;
    }

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
    class="fixed right-4 z-999 flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-none bg-[linear-gradient(135deg,#4a9eff_0%,#3d5d82_100%)] text-white shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-110 hover:shadow-[0_6px_16px_rgba(0,0,0,0.4)] active:scale-95 max-md:h-14 max-md:w-14 md:right-6 md:bottom-6"
    class:bottom-[calc(70px+env(safe-area-inset-bottom)+1rem)]={!hasSecondarySidebar &&
        !hasTertiarySidebar}
    class:bottom-[calc(130px+env(safe-area-inset-bottom)+1rem)]={(hasSecondarySidebar &&
        !hasTertiarySidebar) ||
        (!hasSecondarySidebar && hasTertiarySidebar)}
    class:bottom-[calc(190px+env(safe-area-inset-bottom)+1rem)]={hasSecondarySidebar &&
        hasTertiarySidebar}
    on:click={toggleOracle}
    aria-label="Open Oracle">
    <svg viewBox="0 0 512 512" width="1.5em" height="1.5em">
        <path
            fill="currentColor"
            d="M510.923 324.993L325.507 509.894c-.515.515-1.545.515-3.091.515L69.529 442.938c-.515 0-1.545-.515-2.06-2.06L-.002 188.507c0-.515 0-2.06.515-3.09L185.929.517c.515-.515 1.545-.515 3.09-.515l252.887 67.986c.515 0 1.545.515 2.06 2.06l67.471 252.371c1.03 1.03.515 2.06-.515 2.575zM263.188 124.126L14.937 191.082q-.773 0 0 1.545l181.81 181.811c.515.515.515 0 1.545 0l66.955-247.736c-1.03-2.575-2.06-2.575-2.06-2.575z" />
    </svg>
</button>

{#if showOracle}
    <GameOracle
        {diceRollPreset}
        on:close={closeOracle}
        on:navigateToStory={handleNavigateToStory}
        on:clearPreset
        preselectedCharacterId={diceRollPreset?.characterId || currentCharacterId} />
{/if}

<style>
</style>
