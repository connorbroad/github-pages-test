<script lang="ts">
    export let done = 0;
    export let total = 0;
</script>

<div class="pointer-events-auto absolute inset-0 flex items-center justify-center bg-[rgba(17,17,17,0.6)] backdrop-blur-sm" aria-busy="true">
    <div class="min-w-[240px] rounded-lg bg-[rgba(0,0,0,0.7)] px-5 py-4 text-center text-white">
        <div class="mx-auto mb-2.5 h-7 w-7 animate-spin rounded-full border-[3px] border-[rgba(255,255,255,0.3)] border-t-white"></div>
        <div class="mb-2 text-sm">Loading tiles… {done}/{total}</div>
        <div class="h-1.5 w-full overflow-hidden rounded bg-[rgba(255,255,255,0.2)]">
            <div class="h-full bg-[#4aa3ff] transition-[width] duration-200 ease-linear" style="width: {total ? (done / total) * 100 : 0}%"></div>
        </div>
        <div class="mt-2 text-xs opacity-80">Large maps may take a moment.</div>
    </div>
</div>
