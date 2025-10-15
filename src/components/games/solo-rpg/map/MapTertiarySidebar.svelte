<script lang="ts">
    import { fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { createEventDispatcher } from "svelte";

    export let show: boolean = true;
    export let tool: "paint" | "object" | "move" | "erase" = "paint";
    export let currentShape: "square" | "circle" | "triangle" | "star" = "square";
    export let color: string = "#2980b9";

    const dispatch = createEventDispatcher();

    function setTool(t: typeof tool) { if (tool !== t) dispatch('toolChange', t); }
    function setShape(s: typeof currentShape) { if (currentShape !== s) dispatch('shapeChange', s); }
    function setColor(c: string) { if (color !== c) dispatch('colorChange', c); }

    // Detect if we're on mobile
    let isMobile = false;
    if (typeof window !== "undefined") {
        isMobile = window.innerWidth <= 768;
        window.addEventListener("resize", () => {
            isMobile = window.innerWidth <= 768;
        });
    }

    const palette = ["#222","#555","#888","#c0392b","#27ae60","#2980b9","#f1c40f","#8e44ad"];
</script>

{#if show}
    <aside
        class="tertiary-sidebar"
        style="--tertiary-height: 60px;"
        transition:fly={{
            duration: 300,
            easing: quintOut,
            x: isMobile ? 0 : -80,
            y: isMobile ? 60 : 0,
        }}
    >
        <div class="tools">
            <button class="tool" class:active={tool==='paint'} on:click={() => setTool('paint')} aria-label="Paint">🖌</button>
            <button class="tool" class:active={tool==='object'} on:click={() => setTool('object')} aria-label="Object">⬚</button>
            <button class="tool" class:active={tool==='move'} on:click={() => setTool('move')} aria-label="Move">✥</button>
            <button class="tool" class:active={tool==='erase'} on:click={() => setTool('erase')} aria-label="Erase">⌫</button>
        </div>
        <div class="shapes" hidden={tool!=='object'}>
            <button class:active={currentShape==='square'} on:click={() => setShape('square')}>■</button>
            <button class:active={currentShape==='circle'} on:click={() => setShape('circle')}>●</button>
            <button class:active={currentShape==='triangle'} on:click={() => setShape('triangle')}>▲</button>
            <button class:active={currentShape==='star'} on:click={() => setShape('star')}>★</button>
        </div>
        <div class="colors">
            {#each palette as c}
                <button class:active={color===c} style={`--c:${c}`} on:click={() => setColor(c)} aria-label={c}></button>
            {/each}
        </div>
    </aside>
{/if}

<style>
    .tertiary-sidebar {
        background-color: var(--sidebar-bg);
        color: var(--sidebar-text);
        box-shadow: 2px 0 5px var(--shadow-md);
        z-index: 98;
        display: flex;
        flex-direction: column;
        gap: .25rem;
        padding: .25rem;
    }

    .tools, .shapes, .colors {
        display: flex; gap: .25rem; justify-content: center; align-items: center;
    }

    .tool, .shapes button {
        padding: .5rem; background: var(--bg-secondary); border: 1px solid var(--border-primary);
        border-radius: 6px; color: var(--text-primary);
    }

    .tool.active, .shapes button.active { outline: 2px solid var(--accent-primary); }
    .colors button { width: 24px; height: 24px; border-radius: 4px; background: var(--c); border: 1px solid var(--border-primary); }

    /* Desktop */
    @media (min-width: 769px) {
        .tertiary-sidebar { position: fixed; left: 170px; top: 0; width: 80px; height: 100vh; }
        .tools, .shapes, .colors { flex-direction: column; }
    }

    /* Mobile */
    @media (max-width: 768px) {
        .tertiary-sidebar {
            position: fixed;
            bottom: calc(130px + env(safe-area-inset-bottom));
            left: 0; right: 0; width: 100%; height: var(--tertiary-height, 60px);
            box-shadow: 0 -2px 5px var(--shadow-md);
        }
    }
</style>
