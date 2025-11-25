<script lang="ts">
    import type { ChronicleEntry } from "../../../data/storage-utils";

    export let entry: ChronicleEntry;
</script>

<div
    class="mb-2 text-[0.95rem] leading-relaxed wrap-break-word whitespace-pre-wrap text-[var(--text-primary)]">
    {entry.content}
</div>
