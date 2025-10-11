<script lang="ts">
    import { onMount } from "svelte";
    import { activeCampaign } from "../../game-management/campaign-store";
    import "../../solo-rpg-styles.css";

    onMount(() => {
        if ($activeCampaign) {
            loadCodexEntries();
        }
    });

    function loadCodexEntries() {
        if (!$activeCampaign) return;
    }
</script>

<div class="codex">
    <h2>No Codex Entries</h2>
    <em>Create a new entry to start documenting your adventure.</em>
</div>

<style>
    .codex {
        padding: 1rem;
    }

    h2 {
        margin: 0 0 1rem;
    }
</style>
