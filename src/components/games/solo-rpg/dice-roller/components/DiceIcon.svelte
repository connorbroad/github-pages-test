<script lang="ts">
    /**
     * Reusable dice icon component
     */
    export let numSides: number;
    export let value: number | null = null;
    export let offset: { x: number; y: number; r: number } = {
        x: 0,
        y: 0,
        r: 0,
    };
    export let animated = true;
</script>

<span
    class="dice-icon-wrap"
    style="display: inline-block; width: 64px; height: 64px; position: relative; transform: translate({offset.x}px, {offset.y}px) rotate({offset.r}deg); transition: {animated
        ? 'transform 0.1s'
        : 'none'};"
>
    {#if numSides === 4}
        <!-- D4: triangle -->
        <svg
            class="dice-icon"
            viewBox="0 0 32 32"
            width="32"
            height="32"
            aria-hidden="true"
        >
            <polygon
                points="16,4 28,24 4,24"
                fill="#f8f8f8"
                stroke="#ccc"
                stroke-width="2"
            />
        </svg>
    {:else if numSides === 6}
        <!-- D6: square -->
        <svg
            class="dice-icon"
            viewBox="0 0 32 32"
            width="32"
            height="32"
            aria-hidden="true"
        >
            <polygon
                points="16,4 28,16 16,28 4,16"
                fill="#f8f8f8"
                stroke="#ccc"
                stroke-width="2"
            />
        </svg>
    {:else if numSides === 8}
        <!-- D8: diamond -->
        <svg
            class="dice-icon"
            viewBox="0 0 32 32"
            width="32"
            height="32"
            aria-hidden="true"
        >
            <polygon
                points="16,2 24,16 16,30 8,16"
                fill="#f8f8f8"
                stroke="#ccc"
                stroke-width="2"
            />
        </svg>
    {:else if numSides === 10}
        <!-- D10: pentagon -->
        <svg
            class="dice-icon"
            viewBox="0 0 32 32"
            width="32"
            height="32"
            aria-hidden="true"
        >
            <polygon
                points="16,4 28,14 28,18 16,28 4,18 4,14"
                fill="#f8f8f8"
                stroke="#ccc"
                stroke-width="2"
            />
        </svg>
    {:else if numSides === 12}
        <!-- D12: hexagon -->
        <svg
            class="dice-icon"
            viewBox="0 0 32 32"
            width="32"
            height="32"
            aria-hidden="true"
        >
            <polygon
                points="16,4 27.4,12.3 23.6,26.7 8.4,26.7 4.6,12.3"
                fill="#f8f8f8"
                stroke="#ccc"
                stroke-width="2"
            />
        </svg>
    {:else if numSides === 20}
        <!-- D20: icosahedron (simplified as polygon) -->
        <svg
            class="dice-icon"
            viewBox="0 0 32 32"
            width="32"
            height="32"
            aria-hidden="true"
        >
            <polygon
                points="16,2 28,9 28,23 16,30 4,23 4,9"
                fill="#f8f8f8"
                stroke="#ccc"
                stroke-width="2"
            />
        </svg>
    {:else if numSides === 100}
        <!-- D100: complex polygon -->
        <svg
            class="dice-icon"
            viewBox="0 0 32 32"
            width="32"
            height="32"
            aria-hidden="true"
        >
            <polygon
                points="16,2.5 21.0,3.8 25.1,6.8 28.1,10.9 29.5,16 28.1,21.1 25.1,25.2 21.0,28.2 16,29.5 11.0,28.2 6.9,25.2 3.9,21.1 2.5,16 3.9,10.9 6.9,6.8 11.0,3.8"
                fill="#f8f8f8"
                stroke="#ccc"
                stroke-width="2"
            />
        </svg>
    {:else}
        <!-- Default: rounded square -->
        <svg
            class="dice-icon"
            viewBox="0 0 32 32"
            width="32"
            height="32"
            aria-hidden="true"
        >
            <rect
                x="4"
                y="4"
                width="24"
                height="24"
                rx="6"
                fill="#f8f8f8"
                stroke="#ccc"
                stroke-width="2"
            />
        </svg>
    {/if}
    <span class="dice-number">{value !== null ? value : numSides}</span>
</span>

<style>
    .dice-icon-wrap {
        position: relative;
        width: 64px;
        height: 64px;
        display: inline-block;
    }

    .dice-icon {
        position: absolute;
        left: 0;
        top: 0;
        width: 64px;
        height: 64px;
        z-index: 0;
        opacity: 0.3;
    }

    .dice-number {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: 1;
        font-weight: bold;
        color: #1976d2;
        font-size: 1.2rem;
        pointer-events: none;
    }
</style>
