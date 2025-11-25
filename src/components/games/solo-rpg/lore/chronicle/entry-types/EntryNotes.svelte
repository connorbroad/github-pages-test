<script lang="ts">
    export let notes: string;
</script>

<div
    class="mt-1 flex items-baseline gap-1.5 rounded border-l-2 border-(--srpg-note-border) bg-(--srpg-note-bg) px-2.5 py-1.5 text-sm leading-snug">
    <span class="shrink-0 font-semibold text-(--srpg-note-label-color)">Note:</span>
    <span class="flex-1 text-(--srpg-note-text-color)">{notes}</span>
</div>
