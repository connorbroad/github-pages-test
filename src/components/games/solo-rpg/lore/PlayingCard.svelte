<script lang="ts">
    export let rank: string;
    export let suit: string;

    function isRedSuit(s: string): boolean {
        return s === "heart" || s === "diamond";
    }
</script>

<span class="card-chip" class:red-suit={isRedSuit(suit)}>
    {rank}
    <span class="suit-icon" aria-hidden="true">
        {#if suit === "spade"}
            <svg viewBox="0 0 24 24" width="14" height="14"
                ><path
                    fill="currentColor"
                    d="M12 2c3 3 7 6.5 7 10a4 4 0 0 1-7 2.65A4 4 0 0 1 5 12c0-3.5 4-7 7-10Zm-2.5 18h5c.5 0 .5-.6.2-.9l-1.7-1.7c-.3-.3-.8-.4-1.2-.3-.4-.1-.9 0-1.2.3L9.3 19.1c-.3.3-.3.9.2.9Z"
                /></svg
            >
        {:else if suit === "heart"}
            <svg viewBox="0 0 24 24" width="14" height="14"
                ><path
                    fill="currentColor"
                    d="M12.1 8.64l-.1.1-.1-.1C10.14 6.82 7.1 6.3 5.4 8.04c-1.83 1.86-1.35 5.02.98 7.37l5.72 5.74 5.72-5.74c2.33-2.35 2.81-5.51.98-7.37-1.7-1.74-4.74-1.22-6.6.6Z"
                /></svg
            >
        {:else if suit === "diamond"}
            <svg viewBox="0 0 24 24" width="14" height="14"
                ><path
                    fill="currentColor"
                    d="m12 2 7 10-7 10L5 12 12 2Z"
                /></svg
            >
        {:else if suit === "club"}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" width='1em' height='1em'><path fill="currentColor" d="M5.91 32.453c0 5.602 4.406 9.938 10.008 9.938c3.117 0 6.305-1.032 7.688-3.774h.234c0 3.117-3.422 5.696-4.805 7.149c-1.687 1.757-.656 4.195 1.524 4.195H35.44c2.157 0 3.188-2.438 1.5-4.195c-1.382-1.453-4.804-4.032-4.804-7.149h.258c1.359 2.742 4.57 3.774 7.664 3.774c5.601 0 10.03-4.336 10.03-9.938c0-5.625-4.265-10.383-9.866-10.383a9.97 9.97 0 0 0-6.07 2.086c2.906-2.367 3.937-5.343 3.937-8.015A10.09 10.09 0 0 0 27.988 6.039c-5.554 0-10.078 4.5-10.078 10.102c0 2.672 1.008 5.648 3.914 8.015c-1.71-1.36-3.937-2.086-6.07-2.086c-5.602 0-9.844 4.758-9.844 10.383"/></svg>
        {:else}
            <svg viewBox="0 0 24 24" width="14" height="14"
                ><rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="2"
                    stroke="currentColor"
                    fill="none"
                /></svg
            >
        {/if}
    </span>
</span>

<style>
    .card-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        background: var(--card-bg);
        border: 2px solid var(--border-primary);
        border-radius: 6px;
        padding: 0.35rem 0.55rem;
        font-weight: 600;
        font-size: 0.9rem;
        box-shadow: 0 1px 2px var(--shadow-sm);
        transition: all 0.15s ease;
        color: var(--text-primary);
    }

    .card-chip.red-suit {
        color: var(--accent-danger);
    }

    .card-chip:hover {
        box-shadow: 0 2px 4px var(--shadow-md);
        transform: translateY(-1px);
    }

    .suit-icon {
        display: inline-flex;
        align-items: center;
    }
</style>