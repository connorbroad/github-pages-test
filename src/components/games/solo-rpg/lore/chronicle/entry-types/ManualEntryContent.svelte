<script lang="ts">
    import type { ChronicleEntry } from "../../../data/storage-utils";

    export let entry: ChronicleEntry;
</script>

<div class="entry-content">
    {entry.content}
</div>

<style>
    .entry-content {
        color: var(--text-primary);
        white-space: pre-wrap;
        word-wrap: break-word;
        font-size: 0.95rem;
        margin-bottom: 0.5rem;
    }
</style>
