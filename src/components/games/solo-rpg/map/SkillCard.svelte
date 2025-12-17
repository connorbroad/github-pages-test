<script lang="ts">
    import type { Skill } from "../data/storage-utils";
    import ResultOptionIcon from "../oracle/components/dice-roller/components/ResultOptionIcon.svelte";

    export let skill: Skill;
    export let abilityName: string;
    export let diceFormula: string = "1d20";
    export let onRoll: (resultOption: "Sum" | "Maximum" | "Minimum") => void;

    $: showAdvantageButtons = diceFormula.startsWith("1d");
</script>

<div
    class="from-card-bg to-bg-secondary border-border-primary before:from-accent-primary before:via-accent-info before:to-accent-info-hover hover:border-border-secondary relative flex flex-col overflow-hidden rounded-xl border bg-linear-to-br shadow-[0_1px_3px_var(--shadow-sm)] transition-all duration-300 ease-in-out before:absolute before:top-0 before:right-0 before:left-0 before:h-[3px] before:bg-linear-to-r before:opacity-0 before:transition-opacity before:duration-300 before:content-[''] hover:-translate-y-0.5 hover:shadow-[0_8px_25px_var(--shadow-md)] hover:before:opacity-100">
    <!-- Card content -->
    <div class="flex h-full flex-col justify-between">
        <div class="flex items-start justify-between p-5 pb-4">
            <div class="flex flex-col gap-0.5">
                <h4 class="text-text-primary m-0 text-lg font-bold tracking-tight">
                    {skill.name}
                </h4>
                <p class="text-text-tertiary m-0 text-xs font-bold tracking-wider uppercase">
                    {abilityName}
                </p>
            </div>
            <div class="flex flex-col items-end gap-1">
                <span
                    class="text-text-secondary from-bg-tertiary to-bg-secondary border-border-secondary min-w-12 rounded-lg border bg-linear-to-br px-2 py-1 text-center text-xl font-bold tracking-tight shadow-[0_1px_2px_var(--shadow-sm)]">
                    {skill.bonus >= 0 ? "+" : ""}{skill.bonus}
                </span>
                {#if skill.proficient}
                    <span
                        class="text-text-inverse from-accent-primary to-accent-info rounded-sm bg-linear-to-r px-1.5 py-0.5 text-[0.65rem] font-bold tracking-wider uppercase">
                        PRO
                    </span>
                {/if}
            </div>
        </div>

        <!-- Roll buttons -->
        <div
            class="border-border-primary bg-bg-secondary/30 divide-border-primary mt-auto flex w-full divide-x border-t">
            {#if showAdvantageButtons}
                <button
                    class="text-text-secondary hover:text-accent-primary hover:bg-accent-primary/5 active:bg-accent-primary/10 flex w-12 flex-none cursor-pointer items-center justify-center py-3 transition-colors duration-200"
                    on:click={() => onRoll("Maximum")}
                    type="button"
                    title="Roll with advantage">
                    <ResultOptionIcon option="Maximum" size="1.25em" />
                </button>
            {/if}
            <button
                class="text-text-primary hover:text-accent-primary hover:bg-accent-primary/5 active:bg-accent-primary/10 flex flex-1 cursor-pointer items-center justify-center gap-2 py-3 text-sm font-bold tracking-wide uppercase transition-colors duration-200"
                on:click={() => onRoll("Sum")}
                type="button"
                title={"Roll " + skill.name + " check"}>
                <svg
                    class="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5">
                    <rect x="4" y="4" width="16" height="16" rx="3" />
                    <circle cx="9" cy="9" r="1.5" fill="currentColor" />
                    <circle cx="15" cy="15" r="1.5" fill="currentColor" />
                </svg>
                Roll
            </button>
            {#if showAdvantageButtons}
                <button
                    class="text-text-secondary hover:text-accent-primary hover:bg-accent-primary/5 active:bg-accent-primary/10 flex w-12 flex-none cursor-pointer items-center justify-center py-3 transition-colors duration-200"
                    on:click={() => onRoll("Minimum")}
                    type="button"
                    title="Roll with disadvantage">
                    <ResultOptionIcon option="Minimum" size="1.25em" />
                </button>
            {/if}
        </div>
    </div>
</div>
