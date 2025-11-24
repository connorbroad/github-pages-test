<script lang="ts">
    export let notes: string;
</script>

<div
    class="mt-1 flex items-baseline gap-1.5 rounded border-l-2 border-amber-500 bg-amber-50 px-2.5 py-1.5 text-sm leading-snug dark:border-amber-600 dark:bg-amber-900/20">
    <span class="shrink-0 font-semibold text-amber-700 dark:text-amber-500">Note:</span>
    <span class="flex-1 text-amber-900 dark:text-amber-300">{notes}</span>
</div>
