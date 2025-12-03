<script lang="ts">
    /**
     * Shared CreatureCard component for displaying characters
     * Supports both card and compact (list) views
     */
    import type { Character } from "../data/storage-utils";

    export let creature: Character;
    export let isCompact: boolean = false;

    // Extract display fields
    $: name = creature.name;
    $: tags = creature.tags ?? [];
    $: race = "race" in creature ? creature.race : undefined;
    $: characterClass = "class" in creature ? creature.class : undefined;
    $: level = "level" in creature ? creature.level : undefined;
    $: hitPointMaximum = creature.hitPointMaximum ?? 0;
    $: currentHitPoints =
        "currentHitPoints" in creature ? creature.currentHitPoints : hitPointMaximum;
    $: hasHP = hitPointMaximum > 0;
    $: hpPercent = hasHP
        ? Math.min(100, ((currentHitPoints ?? hitPointMaximum) / hitPointMaximum) * 100)
        : 0;
    $: hpColor =
        hpPercent > 50
            ? "var(--accent-success)"
            : hpPercent > 25
              ? "var(--accent-warning)"
              : "var(--accent-danger)";

    // Monster-specific fields
    $: armorClass = "armorClass" in creature ? creature.armorClass : undefined;

    // Compute avatar styling
    $: initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    $: hue = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;

    // Compute tag hue
    function getTagHue(tag: string): number {
        return tag.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
    }
</script>

{#if isCompact}
    <!-- Compact View -->
    <div class="creature-card-compact group">
        <!-- Type indicator badge -->
        <div class="type-badge">
            <svg viewBox="0 0 24 24" width="12" height="12">
                <path
                    fill="currentColor"
                    d="M12 4a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4" />
            </svg>
        </div>

        <div
            class="creature-avatar-compact"
            style="background: linear-gradient(135deg, hsl({hue}, 60%, 45%), hsl({(hue + 40) %
                360}, 60%, 55%));">
            {initials}
        </div>
        <div class="flex min-w-0 flex-1 flex-col">
            <h3 class="text-text-primary m-0 truncate text-left text-sm font-semibold">
                {name}
            </h3>
            {#if race || characterClass}
                <p class="text-text-muted m-0 truncate text-left text-xs">
                    {#if race}{race}{/if}
                    {#if race && characterClass}•{/if}
                    {#if characterClass}{characterClass}{/if}
                    {#if level}Lv.{level}{/if}
                </p>
            {/if}
        </div>
        {#if hasHP}
            <div class="flex items-center gap-2">
                <div class="hp-bar-compact">
                    <div
                        class="hp-bar-fill-compact"
                        style="width: {hpPercent}%; background: {hpColor};">
                    </div>
                </div>
                <span class="text-text-muted text-xs whitespace-nowrap">
                    {currentHitPoints}/{hitPointMaximum}
                </span>
            </div>
        {/if}
        {#if tags.length > 0}
            <div class="hidden items-center gap-1 sm:flex">
                {#each tags.slice(0, 2) as tag}
                    <span class="creature-tag-compact" style="--tag-hue: {getTagHue(tag)};">
                        {tag}
                    </span>
                {/each}
                {#if tags.length > 2}
                    <span class="text-text-muted text-xs">+{tags.length - 2}</span>
                {/if}
            </div>
        {/if}
    </div>
{:else}
    <!-- Card View -->
    <div class="creature-card group">
        <!-- Type indicator badge -->
        <div class="type-badge-card">
            <svg viewBox="0 0 24 24" width="14" height="14">
                <path
                    fill="currentColor"
                    d="M12 4a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4" />
            </svg>
        </div>

        <!-- Accent bar -->
        <div
            class="creature-card-accent"
            style="background: linear-gradient(135deg, hsl({hue}, 70%, 50%), hsl({(hue + 40) %
                360}, 70%, 50%));">
        </div>

        <!-- Avatar -->
        <div
            class="creature-avatar"
            style="background: linear-gradient(135deg, hsl({hue}, 60%, 45%), hsl({(hue + 40) %
                360}, 60%, 55%));">
            {initials}
        </div>

        <h3 class="creature-card-name">{name}</h3>

        <div class="creature-summary">
            {#if race || characterClass}
                <p class="creature-card-subtitle">
                    {#if race}{race}{/if}
                    {#if race && characterClass}•{/if}
                    {#if characterClass}{characterClass}{/if}
                    {#if level}
                        <span class="creature-level">Lv.{level}</span>
                    {/if}
                </p>
            {/if}
            {#if hasHP}
                <div class="creature-hp-bar">
                    <div class="hp-bar-label">
                        <span>HP</span>
                        <span>{currentHitPoints} / {hitPointMaximum}</span>
                    </div>
                    <div class="hp-bar-track">
                        <div
                            class="hp-bar-fill"
                            style="width: {hpPercent}%; background: {hpColor};">
                        </div>
                    </div>
                </div>
            {/if}
        </div>

        {#if tags.length > 0}
            <div class="creature-tags">
                {#each tags as tag}
                    <span class="creature-tag" style="--tag-hue: {getTagHue(tag)};">
                        {tag}
                    </span>
                {/each}
            </div>
        {/if}
    </div>
{/if}

<style>
    /* Type badges */
    .type-badge {
        position: absolute;
        top: 0.5rem;
        left: 0.5rem;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--accent-primary);
        color: white;
        z-index: 1;
    }

    .type-badge-card {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--accent-primary);
        color: white;
        z-index: 1;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
    }

    /* Card View Styles */
    .creature-card {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        min-height: 180px;
        width: 100%;
        padding: 1.5rem 1rem 1rem;
        border: none;
        border-radius: 1rem;
        background: var(--card-bg);
        box-shadow:
            0 2px 8px rgba(0, 0, 0, 0.08),
            0 1px 2px rgba(0, 0, 0, 0.04);
        cursor: pointer;
        font-family: inherit;
        text-align: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
    }

    .creature-card::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: 1rem;
        padding: 2px;
        background: linear-gradient(135deg, transparent 40%, var(--border-primary) 100%);
        mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
        -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events: none;
    }

    .creature-card:hover {
        transform: translateY(-4px);
        box-shadow:
            0 12px 24px rgba(0, 0, 0, 0.12),
            0 4px 8px rgba(0, 0, 0, 0.08);
    }

    .creature-card:active {
        transform: translateY(-2px);
    }

    .creature-card-accent {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        border-radius: 1rem 1rem 0 0;
    }

    .creature-avatar {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        font-weight: 700;
        color: white;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        margin-bottom: 0.75rem;
        box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.15),
            inset 0 -2px 4px rgba(0, 0, 0, 0.1),
            inset 0 2px 4px rgba(255, 255, 255, 0.2);
        transition: transform 0.3s ease;
    }

    .creature-card:hover .creature-avatar {
        transform: scale(1.05);
    }

    .creature-card-name {
        margin: 0 0 0.25rem;
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1.3;
    }

    .creature-card-subtitle {
        margin: 0;
        font-size: 0.8125rem;
        color: var(--text-secondary);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.375rem;
        flex-wrap: wrap;
    }

    .creature-level {
        background: var(--bg-tertiary);
        padding: 0.125rem 0.5rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-muted);
    }

    .creature-hp-bar {
        width: 100%;
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px solid var(--border-primary);
    }

    .hp-bar-label {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-secondary);
        margin-bottom: 0.375rem;
    }

    .hp-bar-track {
        height: 6px;
        background: var(--bg-tertiary);
        border-radius: 999px;
        overflow: hidden;
    }

    .hp-bar-fill {
        height: 100%;
        border-radius: 999px;
        transition: width 0.3s ease;
    }

    .creature-tags {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.375rem;
        margin-top: 0.75rem;
    }

    .creature-tag {
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.625rem;
        border-radius: 999px;
        font-size: 0.6875rem;
        font-weight: 600;
        letter-spacing: 0.01em;
        background: hsl(var(--tag-hue), 85%, 95%);
        color: hsl(var(--tag-hue), 65%, 35%);
        border: 1px solid hsl(var(--tag-hue), 70%, 85%);
        transition: all 0.2s ease;
    }

    :global([data-theme="dark"]) .creature-tag {
        background: hsl(var(--tag-hue), 50%, 20%);
        color: hsl(var(--tag-hue), 70%, 75%);
        border-color: hsl(var(--tag-hue), 45%, 30%);
    }

    .creature-card:hover .creature-tag {
        background: hsl(var(--tag-hue), 80%, 92%);
        border-color: hsl(var(--tag-hue), 65%, 75%);
    }

    :global([data-theme="dark"]) .creature-card:hover .creature-tag {
        background: hsl(var(--tag-hue), 55%, 25%);
        border-color: hsl(var(--tag-hue), 50%, 40%);
    }

    .creature-summary {
        width: 100%;
    }

    /* Compact View Styles */
    .creature-card-compact {
        position: relative;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        padding: 0.75rem 1rem;
        padding-left: 2rem;
        border: none;
        border-radius: 0.5rem;
        background: var(--card-bg);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        cursor: pointer;
        font-family: inherit;
        text-align: left;
        transition: all 0.2s ease;
        border: 1px solid var(--border-primary);
    }

    .creature-card-compact:hover {
        background: var(--bg-tertiary);
        border-color: var(--accent-primary);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .creature-card-compact:active {
        transform: scale(0.99);
    }

    .creature-avatar-compact {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.875rem;
        font-weight: 700;
        color: white;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        flex-shrink: 0;
        box-shadow:
            0 2px 6px rgba(0, 0, 0, 0.15),
            inset 0 -1px 2px rgba(0, 0, 0, 0.1);
    }

    .hp-bar-compact {
        width: 60px;
        height: 6px;
        background: var(--bg-tertiary);
        border-radius: 999px;
        overflow: hidden;
    }

    .hp-bar-fill-compact {
        height: 100%;
        border-radius: 999px;
        transition: width 0.3s ease;
    }

    .creature-tag-compact {
        display: inline-flex;
        align-items: center;
        padding: 0.125rem 0.5rem;
        border-radius: 999px;
        font-size: 0.625rem;
        font-weight: 600;
        background: hsl(var(--tag-hue), 85%, 95%);
        color: hsl(var(--tag-hue), 65%, 35%);
        border: 1px solid hsl(var(--tag-hue), 70%, 85%);
    }

    :global([data-theme="dark"]) .creature-tag-compact {
        background: hsl(var(--tag-hue), 50%, 20%);
        color: hsl(var(--tag-hue), 70%, 75%);
        border-color: hsl(var(--tag-hue), 45%, 30%);
    }

    @media (max-width: 480px) {
        .creature-card {
            min-height: 160px;
            padding: 1.25rem 0.875rem 0.875rem;
        }
        .creature-avatar {
            width: 48px;
            height: 48px;
            font-size: 1.125rem;
        }
        .creature-card-name {
            font-size: 1rem;
        }
        .creature-card-compact {
            padding: 0.625rem 0.75rem;
            padding-left: 1.75rem;
            gap: 0.5rem;
        }
        .creature-avatar-compact {
            width: 32px;
            height: 32px;
            font-size: 0.75rem;
        }
        .hp-bar-compact {
            width: 40px;
        }
        .type-badge {
            width: 18px;
            height: 18px;
            top: 0.375rem;
            left: 0.375rem;
        }
        .type-badge :global(svg) {
            width: 10px;
            height: 10px;
        }
    }
</style>
