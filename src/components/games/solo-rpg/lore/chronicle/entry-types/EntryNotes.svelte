<script lang="ts">
    export let notes: string;
</script>

<div class="notes-compact">
    <span class="notes-label">Note:</span>
    <span class="notes-text-compact">{notes}</span>
</div>

<style>
    .notes-compact {
        background: var(--srpg-note-bg);
        border-left: 2px solid var(--srpg-note-border);
        border-radius: 3px;
        margin-top: 0.2rem;
        padding: 0.4rem 0.6rem;
        font-size: 0.85rem;
        line-height: 1.4;
        display: flex;
        gap: 0.4rem;
        align-items: baseline;
    }

    .notes-label {
        font-weight: 600;
        color: var(--srpg-note-label-color);
        flex-shrink: 0;
    }

    .notes-text-compact {
        color: var(--srpg-note-text-color);
        flex: 1;
    }
</style>
