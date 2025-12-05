<script lang="ts">
    /**
     * ShapeIcon.svelte
     *
     * Renders an SVG icon for a shape type.
     */
    export let shape: "square" | "circle" | "triangle" | "star";
    export let size: number = 20;
</script>

{#if shape === "square"}
    <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
        <rect x="4" y="4" width="16" height="16" />
    </svg>
{:else if shape === "circle"}
    <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
        <circle cx="12" cy="12" r="8" />
    </svg>
{:else if shape === "triangle"}
    <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
        <path d="M12 4 4 20 h16 Z" />
    </svg>
{:else}
    <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
        <polygon points="12,2 15,10 23,10 17,15 19,23 12,18 5,23 7,15 1,10 9,10" />
    </svg>
{/if}

<style>
    .shape-icon {
        display: block;
    }
</style>
