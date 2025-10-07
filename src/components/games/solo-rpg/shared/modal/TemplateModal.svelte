<script lang="ts">
    import SrpgModal from "./SrpgModal.svelte";
    import { createEventDispatcher } from "svelte";

    interface Template {
        key: string;
        title: string;
        description: string;
        note?: string;
    }

    export let show: boolean = false;
    export let title: string = "Choose Template";
    export let description: string = "";
    export let templates: Template[] = [];

    const dispatch = createEventDispatcher();

    function selectTemplate(templateKey: string) {
        dispatch("select", templateKey);
        show = false;
    }

    function cancel() {
        dispatch("cancel");
        show = false;
    }
</script>

<SrpgModal bind:show maxWidth="500px">
    <div class="template-modal-content">
        <h2>{title}</h2>
        {#if description}
            <p class="template-description">{description}</p>
        {/if}

        <div class="template-options">
            {#each templates as template}
                <button
                    class="srpg-b-overview"
                    on:click={() => selectTemplate(template.key)}
                >
                    <h3 class="template-option-title">{template.title}</h3>
                    <p class="template-abilities">{template.description}</p>
                    {#if template.note}
                        <span class="template-note">{template.note}</span>
                    {/if}
                </button>
            {/each}
        </div>

        <div class="template-footer">
            <button class="srpg-b" on:click={cancel}>Cancel</button>
        </div>
    </div>
</SrpgModal>

<style>
    .template-modal-content {
        padding: 1.5rem;
    }

    .template-modal-content h2 {
        margin-top: 0;
        margin-bottom: 0.5rem;
        color: #111827;
    }

    .template-description {
        margin-bottom: 1.5rem;
        color: #6b7280;
        font-size: 0.875rem;
    }

    .template-options {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .template-option-title {
        margin: 0 0 0.5rem 0;
        color: #111827;
        font-size: 1.25rem;
    }

    .template-abilities {
        margin: 0.5rem 0;
        color: #4b5563;
        font-size: 0.875rem;
        line-height: 1.5;
    }

    .template-note {
        display: inline-block;
        margin-top: 0.5rem;
        padding: 0.25rem 0.5rem;
        background: #e0e7ff;
        color: #3730a3;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
    }

    .template-footer {
        display: flex;
        justify-content: flex-end;
    }
</style>
