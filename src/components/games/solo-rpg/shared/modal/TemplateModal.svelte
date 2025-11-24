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
    <div class="p-4 sm:p-6">
        <h2 class="text-text-primary mt-0 mb-2 text-xl sm:text-2xl">{title}</h2>
        {#if description}
            <p class="text-text-secondary mb-5 text-sm leading-6 sm:mb-6">{description}</p>
        {/if}

        <div class="mb-5 flex flex-col gap-3 sm:mb-6 sm:gap-4">
            {#each templates as template}
                <button
                    class="bg-card-bg border-border-primary font-inherit hover:border-accent-primary w-full cursor-pointer rounded-lg border-2 p-6 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    on:click={() => selectTemplate(template.key)}
                >
                    <h3 class="text-text-primary m-0 mb-2 text-lg sm:text-xl">{template.title}</h3>
                    <p class="text-text-secondary my-2 text-[0.8125rem] leading-6 sm:text-sm">
                        {template.description}
                    </p>
                    {#if template.note}
                        <span
                            class="bg-accent-info text-text-inverse mt-2 inline-block rounded px-2 py-1 text-xs font-semibold"
                        >
                            {template.note}
                        </span>
                    {/if}
                </button>
            {/each}
        </div>

        <div class="flex justify-end gap-2">
            <button
                class="border-button-simple-border bg-button-simple-bg text-button-simple-text hover:bg-button-simple-hover-bg hover:border-button-simple-hover-border active:bg-button-simple-bg flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-center text-base font-medium shadow-md transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-sm"
                on:click={cancel}
            >
                Cancel
            </button>
        </div>
    </div>
</SrpgModal>

