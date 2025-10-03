# Component Architecture

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                       │
│  (SoloRPG.svelte, biimo-player.astro, etc.)                │
└────────────────────┬────────────────────┬───────────────────┘
                     │                    │
         ┌───────────▼──────────┐    ┌───▼────────────────┐
         │  DiceRoller.svelte   │    │ DiceRollerEmbed    │
         │    (Modal Mode)      │    │  (Embedded Mode)   │
         │                      │    │                    │
         │  • Full UI controls  │    │  • Prop-driven     │
         │  • Settings panel    │    │  • Event dispatch  │
         │  • Modal overlay     │    │  • Compact layout  │
         └─────────┬────────────┘    └────────┬───────────┘
                   │                          │
                   └──────────┬───────────────┘
                              │
                   ┌──────────▼──────────┐
                   │  Shared Components  │
                   │   & Logic Layer     │
                   └──────────┬──────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐   ┌────────▼────────┐   ┌──────▼──────────┐
│ DiceDisplay    │   │ ResultOption    │   │ diceRollerLogic │
│   .svelte      │   │   Icon.svelte   │   │     .ts         │
│                │   │                 │   │                 │
│ • Dice layout  │   │ • Sum icon      │   │ • Roll logic    │
│ • State mgmt   │   │ • Max icon      │   │ • Animation     │
└───────┬────────┘   │ • Min icon      │   │ • Calculation   │
        │            │ • Subtract icon │   └─────────────────┘
        │            └─────────────────┘
        │
┌───────▼─────────┐
│  DiceIcon       │
│   .svelte       │
│                 │
│ • D4  (△)      │
│ • D6  (◇)      │
│ • D8  (◊)      │
│ • D10 (⬠)      │
│ • D12 (⬡)      │
│ • D20 (⬢)      │
│ • D100 (⬢+)    │
└─────────────────┘
```

## Data Flow

```
User Action (Click "Roll")
        │
        ▼
┌──────────────────┐
│ Parent Component │  (DiceRoller or DiceRollerEmbed)
│                  │
│ 1. Initialize    │
│    animation     │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────┐
│ diceRollerLogic.ts       │
│                          │
│ 2. createDiceRoller      │
│    Animation()           │
│    • Generate end times  │
│    • Start animation     │
│    • Update state        │
└────────┬─────────────────┘
         │
         ▼  (state updates via callback)
┌──────────────────┐
│ Parent Component │
│                  │
│ 3. Update state: │
│    • results[]   │
│    • offsets[]   │
│    • rolling     │
└────────┬─────────┘
         │
         ▼  (reactive rendering)
┌──────────────────┐
│  DiceDisplay     │
│                  │
│ 4. Render dice   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  DiceIcon × N    │
│                  │
│ 5. Show animated │
│    dice values   │
└──────────────────┘
         │
         ▼  (animation complete)
┌──────────────────────────┐
│ diceRollerLogic.ts       │
│                          │
│ 6. calculateResult()     │
│    • Apply result option │
│    • Add modifier        │
└────────┬─────────────────┘
         │
         ▼  (callback)
┌──────────────────┐
│ Parent Component │
│                  │
│ 7. Display final │
│    result        │
└──────────────────┘
```

## Import Dependencies

```
DiceRoller.svelte
├── import { slide } from 'svelte/transition'
├── import DiceDisplay from './dice-roller/DiceDisplay.svelte'
├── import ResultOptionIcon from './dice-roller/ResultOptionIcon.svelte'
└── import { 
        type ResultOption,
        calculateResult,
        createDiceRollerAnimation,
        DEFAULT_ANIMATION_CONFIG
    } from './dice-roller/diceRollerLogic'

DiceRollerEmbed.svelte
├── import { createEventDispatcher } from 'svelte'
├── import DiceDisplay from './dice-roller/DiceDisplay.svelte'
└── import { 
        type ResultOption,
        calculateResult,
        createDiceRollerAnimation,
        DEFAULT_ANIMATION_CONFIG
    } from './dice-roller/diceRollerLogic'

DiceDisplay.svelte
└── import DiceIcon from './DiceIcon.svelte'

DiceIcon.svelte
└── (no dependencies)

ResultOptionIcon.svelte
└── import type { ResultOption } from './diceRollerLogic'

diceRollerLogic.ts
└── (no dependencies - pure TypeScript)
```

## Responsibilities

| Component | Responsibility | Exports |
|-----------|---------------|---------|
| **diceRollerLogic.ts** | Business logic, calculations, animation coordination | Functions, types, constants |
| **DiceIcon.svelte** | Render single die with correct shape and value | Visual component |
| **DiceDisplay.svelte** | Layout and display multiple dice | Visual component |
| **ResultOptionIcon.svelte** | Display result calculation icons | Visual component |
| **DiceRoller.svelte** | Full-featured modal interface | User-facing component |
| **DiceRollerEmbed.svelte** | Compact embedded interface | User-facing component |
