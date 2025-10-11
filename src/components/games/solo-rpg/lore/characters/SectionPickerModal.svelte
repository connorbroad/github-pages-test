<script lang="ts">
    import SrpgModal from "../../shared/modal/SrpgModal.svelte";
    import { createEventDispatcher } from "svelte";

    export let show = false;
    export let selectedSections: string[] = ["information"];
    const dispatch = createEventDispatcher();

    const availableSections: Array<{
        id: string;
        name: string;
        icon: string;
    }> = [
        { id: "information", name: "Information", icon: "info" },
        { id: "experience", name: "Experience", icon: "star" },
        { id: "health", name: "Health", icon: "heart" },
        { id: "abilities", name: "Abilities", icon: "ability" },
        { id: "items", name: "Items", icon: "items" },
        { id: "combat", name: "Combat Stats", icon: "combat" },
    ];

    let sectionsSet: Set<string> = new Set(selectedSections);
    $: sectionsSet = new Set(selectedSections);

    function toggleSection(id: string) {
        if (id === "information") return;
        if (sectionsSet.has(id)) {
            sectionsSet.delete(id);
        } else {
            sectionsSet.add(id);
        }
        // Always enforce 'information' included
        sectionsSet.add("information");
        dispatch("change", Array.from(sectionsSet));
    }

    function save() {
        dispatch("save", Array.from(sectionsSet));
    }

    function close() {
        dispatch("close");
    }
</script>

<SrpgModal
    bind:show
    maxWidth="450px"
    ariaLabel="Pick visible sections for character sheet"
    on:close={close}
>
    <h2 class="srpg-modal-heading">Choose Character Sections</h2>
    <form on:submit|preventDefault={save}>
        <div class="srpg-checkbox-list">
            {#each availableSections as section}
                <label
                    class="srpg-checkbox-item"
                    class:disabled={section.id === "information"}
                >
                    <input
                        type="checkbox"
                        checked={sectionsSet.has(section.id)}
                        disabled={section.id === "information"}
                        on:change={() => toggleSection(section.id)}
                    />
                    <span class="srpg-checkbox-item-icon">
                        {#if section.icon === "info"}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="1em"
                                height="1em"
                            >
                                <path
                                    fill="currentColor"
                                    d="M3 18h12v-2H3zM3 6v2h18V6zm0 7h18v-2H3z"
                                />
                            </svg>
                        {:else if section.icon === "star"}
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                            >
                                <path
                                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                />
                            </svg>
                        {:else if section.icon === "heart"}
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                            >
                                <path
                                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                                />
                            </svg>
                        {:else if section.icon === "ability"}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 512 512"
                                width="1em"
                                height="1em"
                            >
                                <circle
                                    cx="256"
                                    cy="56"
                                    r="40"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-miterlimit="10"
                                    stroke-width="32"
                                />
                                <path
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-miterlimit="10"
                                    stroke-width="32"
                                    d="m199.3 295.62l-30.4 172.2a24 24 0 0 0 19.5 27.8a23.76 23.76 0 0 0 27.6-19.5l21-119.9v.2s5.2-32.5 17.5-32.5h3.1c12.5 0 17.5 32.5 17.5 32.5v-.1l21 119.9a23.92 23.92 0 1 0 47.1-8.4l-30.4-172.2l-4.9-29.7c-2.9-18.1-4.2-47.6.5-59.7c4-10.4 14.13-14.2 23.2-14.2H424a24 24 0 0 0 0-48H88a24 24 0 0 0 0 48h92.5c9.23 0 19.2 3.8 23.2 14.2c4.7 12.1 3.4 41.6.5 59.7Z"
                                />
                            </svg>
                        {:else if section.icon === "items"}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 14 14"
                                width="1em"
                                height="1em"
                            >
                                <g
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    ><path
                                        d="M7 13.5c3.5 0 6-1.24 6-4c0-3-1.5-4.52-4.5-6.02l1.298-2.028a.65.65 0 0 0-.56-.95h-4.24a.65.65 0 0 0-.56 1L5.5 3.48C2.5 5 1 6.52 1 9.52c0 2.74 2.5 3.98 6 3.98"
                                    /><path
                                        d="M5.5 3.5a1.803 1.803 0 0 0 3 0v0"
                                    /></g
                                >
                            </svg>
                        {:else if section.icon === "combat"}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="1em"
                                height="1em"
                            >
                                <path
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6m-3 3l4 4m-1 1l2-2M14.5 6.5L18 3h3v3l-3.5 3.5M5 14l4 4m-2-1l-3 3m-1-1l2 2"
                                />
                            </svg>
                        {/if}
                    </span>
                    <span class="srpg-checkbox-item-label">{section.name}</span>
                </label>
            {/each}
        </div>
        <div class="srpg-modal-actions">
            <button type="submit" class="srpg-b srpg-b-normal srpg-b-w-full"
                >Close</button
            >
        </div>
    </form>
</SrpgModal>
