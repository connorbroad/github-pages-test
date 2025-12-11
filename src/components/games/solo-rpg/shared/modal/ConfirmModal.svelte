<script lang="ts">
    /**
     * Reusable Confirmation Modal
     * For destructive or important actions that require user confirmation
     */
    import SrpgModal from "./SrpgModal.svelte";

    export let show = false;
    export let title = "Confirm Action";
    export let message = "Are you sure you want to continue?";
    export let confirmText = "Confirm";
    export let cancelText = "Cancel";
    /** Uses danger styling for confirm button (red) */
    export let danger = false;

    export let onConfirm: () => void = () => {};
    export let onCancel: () => void = () => {};

    function handleConfirm() {
        onConfirm();
        show = false;
    }

    function handleCancel() {
        onCancel();
        show = false;
    }

    function handleClose() {
        onCancel();
        show = false;
    }
</script>

<SrpgModal bind:show maxWidth="400px" onClose={handleClose}>
    <div class="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
        <h2 class="text-text-primary m-0 text-lg font-semibold sm:text-xl">{title}</h2>

        <p class="text-text-secondary m-0 text-sm leading-relaxed sm:text-base">
            {message}
        </p>

        <div class="srpg-b-group mt-2 justify-end">
            <button class="srpg-b srpg-b-simple" on:click={handleCancel}>
                {cancelText}
            </button>
            <button
                class="srpg-b"
                class:srpg-b-danger={danger}
                class:srpg-b-normal={!danger}
                on:click={handleConfirm}>
                {confirmText}
            </button>
        </div>
    </div>
</SrpgModal>
