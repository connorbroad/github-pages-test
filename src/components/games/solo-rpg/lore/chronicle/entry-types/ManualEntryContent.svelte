<script lang="ts">
    import type { ChronicleEntry } from "../../storage-utils";

    export let entry: ChronicleEntry;
</script>

<div class="entry-content">
    {entry.content}
</div>

<style>
    .entry-content {
        color: #262626;
        white-space: pre-wrap;
        word-wrap: break-word;
        font-size: 0.95rem;
        margin-bottom: 0.5rem;
    }
</style>
