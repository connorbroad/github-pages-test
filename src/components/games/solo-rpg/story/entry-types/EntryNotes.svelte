<script lang="ts">
    export let notes: string;
</script>

<div class="notes-compact">
    <span class="notes-label">Note:</span>
    <span class="notes-text-compact">{notes}</span>
</div>

<style>
    .notes-compact {
        background: #fef9c3;
        border-left: 2px solid #facc15;
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
        color: #713f12;
        flex-shrink: 0;
    }

    .notes-text-compact {
        color: #854d0e;
        flex: 1;
    }
</style>
