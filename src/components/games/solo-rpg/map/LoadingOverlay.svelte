<script lang="ts">
    export let done = 0;
    export let total = 0;
</script>

<div
    class="pointer-events-auto absolute inset-0 flex items-center justify-center bg-(--modal-overlay) backdrop-blur-sm"
    aria-busy="true">
    <div
        class="min-w-60 rounded-lg border border-(--card-border) bg-(--bg-elevated) px-5 py-4 text-center text-(--text-primary) shadow-lg">
        <div
            class="mx-auto mb-2.5 h-7 w-7 animate-spin rounded-full border-[3px] border-(--border-primary) border-t-(--accent-primary)">
        </div>
        <div class="mb-2 text-sm">Loading tiles… {done}/{total}</div>
        <div class="h-1.5 w-full overflow-hidden rounded bg-(--bg-tertiary)">
            <div
                class="h-full bg-(--accent-primary) transition-[width] duration-200 ease-linear"
                style="width: {total ? (done / total) * 100 : 0}%">
            </div>
        </div>
        <div class="mt-2 text-xs text-(--text-muted)">Large maps may take a moment.</div>
    </div>
</div>
