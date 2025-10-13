# Ability & Skill Roll Feature Plan

## Implementation Progress

### Status: In Progress
**Last Updated:** October 13, 2025 - Completed Phase 1  
**Current Phase:** Phase 1 - Data Model (COMPLETE)  
**Estimated Completion:** 17% (1/6 phases)

### Phase Completion Checklist

#### ✅ Phase 1: Data Model (COMPLETE)
- [x] Updated `Ability` interface to include `diceRoll` field
- [x] Updated `Skill` interface to include `diceRoll` field
- [x] Updated `DiceRollData` interface to include roll context fields
- [x] Added migration logic for existing characters (N/A - optional fields are backward compatible)
- [x] Tested data model changes

#### ✅ Phase 2: Character Sheet UI (Not Started)
- [ ] Added dice formula input to ability edit form
- [ ] Added dice formula input to skill edit form
- [ ] Added roll buttons to read-only ability cards
- [ ] Added roll buttons to read-only skill cards
- [ ] Implemented advantage/disadvantage buttons
- [ ] Added event dispatchers for roll actions
- [ ] Tested UI changes in edit and read modes

#### ✅ Phase 3: Integration Layer (Not Started)
- [ ] Updated character sheet container to handle roll events
- [ ] Updated main orchestrator (SoloRPG.svelte) to handle dice roller opening
- [ ] Implemented dice formula parsing utility
- [ ] Handled advantage/disadvantage logic (2d20 with Max/Min)
- [ ] Tested event flow from character sheet to oracle

#### ✅ Phase 4: Oracle Updates (Not Started)
- [ ] Updated GameOracle to accept and use preset
- [ ] Updated DiceRoller to accept and apply preset
- [ ] Implemented auto-navigate to dice view when preset exists
- [ ] Included roll context in recordFate event
- [ ] Tested preset application and clearing

#### ✅ Phase 5: Chronicle Integration (Not Started)
- [ ] Updated handleDiceRecordFate to include ability/skill context
- [ ] Formatted chronicle entry content with ability/skill name
- [ ] Tested normal rolls
- [ ] Tested advantage rolls
- [ ] Tested disadvantage rolls

#### ✅ Phase 6: Testing & Polish (Not Started)
- [ ] Tested with different abilities and skills
- [ ] Tested advantage/disadvantage rolls end-to-end
- [ ] Verified chronicle entries are properly formatted
- [ ] Tested edge cases (missing dice formula, invalid format)
- [ ] Added loading states and error handling
- [ ] Performed final integration testing

### Notes & Issues
- **Phase 1 Complete:** Data model updated successfully. All new fields are optional, ensuring backward compatibility with existing characters. No migration needed.
- TypeScript compilation passed with no errors.
- Added fields:
  - `Ability.diceRoll?: string` - Stores dice formula like "1d20"
  - `Skill.diceRoll?: string` - Stores dice formula like "1d20"
  - `DiceRollData.checkName?: string` - Name of the check (e.g., "Strength", "Perception", "Saving Throw")
- **Design Decisions:**
  - Removed redundant `rollType` field. The existing `resultOption` field already captures roll type:
    - `Sum` = normal roll
    - `Maximum` = advantage (roll 2d20, take max)
    - `Minimum` = disadvantage (roll 2d20, take min)
  - Merged `abilityName` and `skillName` into single `checkName` field for flexibility and simplicity

---

## Overview
Enable players to roll ability checks and skill checks directly from the character sheet. When rolled, the dice roller should be pre-filled with the appropriate configuration, and when recorded, the roll should be saved to the Chronicle with context about what was rolled (ability/skill name).

## User Story
As a player, I want to:
1. Click a "Roll" button next to an ability or skill on my character sheet
2. Have the dice roller open with pre-filled dice, modifier, and character
3. Optionally roll with advantage or disadvantage (for D&D 5e style games)
4. Record the result, which automatically includes the ability/skill name in the Chronicle entry

## Architecture Changes

### 1. Data Model Updates

#### File: `src/components/games/solo-rpg/data/storage-utils.ts`

**Add to `Ability` interface:**
```typescript
export type Ability = {
    id: string;
    name: string;
    score: number;
    modifier: number;
    proficient: boolean;
    // NEW FIELDS:
    diceRoll?: string; // e.g., "1d20" or "2d6" - the dice formula to roll
};
```

**Add to `Skill` interface:**
```typescript
export type Skill = {
    id: string;
    name: string;
    abilityId: string;
    proficient: boolean;
    bonus: number;
    // NEW FIELDS:
    diceRoll?: string; // e.g., "1d20" - the dice formula to roll
};
```

**Add to `DiceRollData` interface:**
```typescript
export type DiceRollData = {
    numDice: number;
    numSides: number;
    modifier: number;
    resultOption: "Sum" | "Maximum" | "Minimum" | "Subtract";
    result: number;
    individualDiceResults: number[];
    // NEW FIELDS:
    rollType?: "ability" | "skill" | "advantage" | "disadvantage"; // Context for the roll
    abilityName?: string; // Name of ability if this was an ability check
    skillName?: string; // Name of skill if this was a skill check
};
```

**Add to `ChronicleEntry` interface:**
```typescript
export type ChronicleEntry = {
    id: string;
    campaignId: string;
    chapterId?: string;
    timestamp: number;
    type: "manual" | "fortune" | "dice" | "cards";
    content: string;
    fortuneId?: string;
    fortuneData?: FortuneResultData;
    diceData?: DiceRollData;
    cardsData?: CardsDrawData;
    userNotes?: string;
    characterId?: string;
    // NEW FIELD (already covered by diceData changes):
    // The diceData.abilityName or diceData.skillName will provide context
};
```

### 2. Character Sheet UI Updates

#### File: `src/components/games/solo-rpg/lore/characters/CharacterSheet.svelte`

**Changes needed:**

1. **Add dice roll field to ability edit form:**
   - Add an input field for `diceRoll` in the ability edit form
   - Default value: "1d20" for most RPG systems
   - Label: "Dice Formula" or "Roll"

2. **Add dice roll field to skill edit form:**
   - Add an input field for `diceRoll` in the skill edit form
   - Default value: "1d20" for most RPG systems
   - Label: "Dice Formula" or "Roll"

3. **Add roll button to read-only ability display:**
   - Add a "Roll" button in the ability card when not editing
   - If the ability has advantage/disadvantage support, add separate buttons for:
     - "Roll" (normal)
     - "Adv" (advantage - roll 2d20, take maximum)
     - "Dis" (disadvantage - roll 2d20, take minimum)
   - Button should dispatch an event with ability info

4. **Add roll button to read-only skill display:**
   - Add a "Roll" button in the skill card when not editing
   - Similar advantage/disadvantage buttons if applicable
   - Button should dispatch an event with skill info

5. **Event dispatching:**
   - Create event handler that dispatches 'rollAbility' event with:
     ```typescript
     {
       abilityId: string,
       abilityName: string,
       modifier: number,
       diceFormula: string, // e.g., "1d20"
       rollType: "normal" | "advantage" | "disadvantage"
     }
     ```
   - Create event handler that dispatches 'rollSkill' event with:
     ```typescript
     {
       skillId: string,
       skillName: string,
       bonus: number,
       diceFormula: string, // e.g., "1d20"
       rollType: "normal" | "advantage" | "disadvantage"
     }
     ```

### 3. Parent Component Integration

#### File: `src/components/games/solo-rpg/lore/characters/CharacterSheetContainer.svelte` (or wherever CharacterSheet is rendered)

**Changes needed:**

1. **Listen for roll events:**
   - Add event listeners for `rollAbility` and `rollSkill` events
   - When triggered, emit an event to the parent (likely `StoryView` or main app)

2. **Event format to parent:**
   ```typescript
   dispatch('openDiceRoller', {
     characterId: string,
     characterName: string,
     rollContext: {
       type: 'ability' | 'skill',
       name: string, // ability or skill name
       diceFormula: string,
       modifier: number,
       rollType: 'normal' | 'advantage' | 'disadvantage'
     }
   });
   ```

### 4. Oracle Integration

#### File: `src/components/games/solo-rpg/SoloRPG.svelte` (main orchestrator)

**Changes needed:**

1. **Add state for pre-filled dice roller:**
   ```typescript
   let diceRollerPreset: {
     characterId?: string,
     characterName?: string,
     numDice: number,
     numSides: number,
     modifier: number,
     resultOption: "Sum" | "Maximum" | "Minimum",
     rollContext?: {
       type: 'ability' | 'skill',
       name: string
     }
   } | null = null;
   ```

2. **Handle openDiceRoller event:**
   - Convert dice formula (e.g., "1d20") to numDice and numSides
   - Handle advantage/disadvantage:
     - Normal: 1d20 + modifier, resultOption = "Sum"
     - Advantage: 2d20 + modifier, resultOption = "Maximum"
     - Disadvantage: 2d20 + modifier, resultOption = "Minimum"
   - Set diceRollerPreset and navigate to Oracle (dice view)

3. **Pass preset to GameOracle:**
   ```svelte
   <GameOracle 
     bind:diceRollerPreset
     on:navigateToStory={...}
     on:close={...}
   />
   ```

#### File: `src/components/games/solo-rpg/oracle/GameOracle.svelte`

**Changes needed:**

1. **Accept preset prop:**
   ```typescript
   export let diceRollerPreset: {
     characterId?: string,
     characterName?: string,
     numDice: number,
     numSides: number,
     modifier: number,
     resultOption: "Sum" | "Maximum" | "Minimum",
     rollContext?: {
       type: 'ability' | 'skill',
       name: string
     }
   } | null = null;
   ```

2. **Automatically switch to dice view if preset exists:**
   ```typescript
   $: if (diceRollerPreset) {
     view = 'dice';
   }
   ```

3. **Pass preset to DiceRoller:**
   ```svelte
   {#if view === 'dice'}
     <DiceRoller 
       embedded={true}
       preset={diceRollerPreset}
       on:recordFate={handleDiceRecordFate}
       onClose={() => view = 'oracle'}
     />
   {/if}
   ```

4. **Clear preset after use:**
   - After recording fate or closing, reset diceRollerPreset to null

#### File: `src/components/games/solo-rpg/oracle/components/dice-roller/DiceRoller.svelte`

**Changes needed:**

1. **Accept preset prop:**
   ```typescript
   export let preset: {
     characterId?: string,
     characterName?: string,
     numDice: number,
     numSides: number,
     modifier: number,
     resultOption: "Sum" | "Maximum" | "Minimum",
     rollContext?: {
       type: 'ability' | 'skill',
       name: string
     }
   } | null = null;
   ```

2. **Apply preset on mount:**
   ```typescript
   onMount(() => {
     if (preset) {
       numDice = preset.numDice;
       numSides = preset.numSides;
       modifier = preset.modifier;
       resultOption = preset.resultOption;
       
       // Optionally auto-roll?
       // onRollButtonClick();
     }
   });
   ```

3. **Include context in recordFate event:**
   ```typescript
   function onClickTakeResult() {
     if (embedded) {
       dispatch("recordFate", {
         type: "dice",
         numDice,
         numSides,
         modifier,
         resultOption,
         result: finalResult,
         individualDiceResults: diceResults,
         // NEW FIELDS:
         rollType: preset?.rollContext ? 
           (resultOption === "Maximum" ? "advantage" : 
            resultOption === "Minimum" ? "disadvantage" : 
            "normal") : undefined,
         abilityName: preset?.rollContext?.type === 'ability' ? 
           preset.rollContext.name : undefined,
         skillName: preset?.rollContext?.type === 'skill' ? 
           preset.rollContext.name : undefined
       });
     }
     // ... rest of function
   }
   ```

4. **Clear preset after recording:**
   - Reset preset to null in parent after dispatch

### 5. Chronicle Entry Updates

#### File: `src/components/games/solo-rpg/oracle/GameOracle.svelte`

**Update `handleDiceRecordFate` function:**

```typescript
function handleDiceRecordFate(event: CustomEvent) {
    const diceData = event.detail;
    
    if (!$activeCampaign) return;

    const chronicleEntries = loadChronicleEntries();
    const activeCharacterId = loadActiveCharacterId();
    
    // Build content string with context
    let contentPrefix = "";
    if (diceData.abilityName) {
        contentPrefix = `${diceData.abilityName} Check`;
        if (diceData.rollType === "advantage") {
            contentPrefix += " (Advantage)";
        } else if (diceData.rollType === "disadvantage") {
            contentPrefix += " (Disadvantage)";
        }
        contentPrefix += ": ";
    } else if (diceData.skillName) {
        contentPrefix = `${diceData.skillName}`;
        if (diceData.rollType === "advantage") {
            contentPrefix += " (Advantage)";
        } else if (diceData.rollType === "disadvantage") {
            contentPrefix += " (Disadvantage)";
        }
        contentPrefix += ": ";
    }
    
    const newEntry = {
        id: generateId(),
        campaignId: $activeCampaign.id,
        timestamp: Date.now(),
        type: "dice" as const,
        content: `${contentPrefix}Rolled ${diceData.numDice}d${diceData.numSides}${diceData.modifier !== 0 ? (diceData.modifier > 0 ? '+' : '') + diceData.modifier : ''}: ${diceData.result}`,
        diceData: {
            numDice: diceData.numDice,
            numSides: diceData.numSides,
            modifier: diceData.modifier,
            resultOption: diceData.resultOption,
            result: diceData.result,
            individualDiceResults: diceData.individualDiceResults,
            // NEW FIELDS:
            rollType: diceData.rollType,
            abilityName: diceData.abilityName,
            skillName: diceData.skillName
        },
        characterId: activeCharacterId || undefined
    };

    chronicleEntries.push(newEntry);
    saveChronicleEntries(chronicleEntries);

    // Clear the preset
    if (diceRollerPreset) {
        diceRollerPreset = null;
    }

    // Navigate to story page
    dispatch('navigateToStory');
}
```

## UI/UX Considerations

### 1. Roll Button Placement
- **In Edit Mode:** No roll buttons (only dice formula input)
- **In Read Mode:** 
  - For abilities: Show roll button prominently in the ability card
  - For skills: Show roll button prominently in the skill card

### 2. Advantage/Disadvantage Support
- **Option 1: Dropdown or split button**
  - Main button: "Roll"
  - Dropdown options: "Roll Normal", "Roll w/ Advantage", "Roll w/ Disadvantage"
  
- **Option 2: Three separate buttons (compact)**
  - "Roll" | "Adv" | "Dis"
  - Only show Adv/Dis if the dice formula is "1d20" (D&D specific)

- **Recommended:** Option 2 for quick access, but only show for d20 systems

### 3. Dice Formula Input
- Default to "1d20" for most RPG systems
- Allow custom formulas like "2d6", "1d12+1d8", etc.
- Parse formula on roll button click to extract numDice and numSides
- For complex formulas (multiple dice types), may need to handle differently

### 4. Visual Feedback
- When a roll button is clicked, provide immediate visual feedback (button animation)
- Navigate smoothly to the dice roller
- Show the ability/skill name in the dice roller header or context area

### 5. Chronicle Entry Display
- Format: `{Ability/Skill Name} [(Advantage/Disadvantage)]: Rolled XdY+Z: Result`
- Examples:
  - "Strength Check: Rolled 1d20+3: 17"
  - "Perception (Advantage): Rolled 2d20+5: 18"
  - "Stealth (Disadvantage): Rolled 2d20+2: 8"

## Implementation Steps

### Phase 1: Data Model (1-2 hours)
1. Update `Ability` and `Skill` interfaces to include `diceRoll` field
2. Update `DiceRollData` interface to include roll context fields
3. Add migration logic if needed for existing characters

### Phase 2: Character Sheet UI (2-3 hours)
1. Add dice formula input to ability edit form
2. Add dice formula input to skill edit form
3. Add roll buttons to read-only ability cards
4. Add roll buttons to read-only skill cards
5. Implement advantage/disadvantage buttons (if d20 system)
6. Add event dispatchers for roll actions

### Phase 3: Integration Layer (2-3 hours)
1. Update character sheet container to handle roll events
2. Update main orchestrator (SoloRPG.svelte) to handle dice roller opening
3. Implement dice formula parsing utility
4. Handle advantage/disadvantage logic (2d20 with Max/Min)

### Phase 4: Oracle Updates (2-3 hours)
1. Update GameOracle to accept and use preset
2. Update DiceRoller to accept and apply preset
3. Auto-navigate to dice view when preset exists
4. Include roll context in recordFate event

### Phase 5: Chronicle Integration (1-2 hours)
1. Update handleDiceRecordFate to include ability/skill context
2. Format chronicle entry content with ability/skill name
3. Test various scenarios (normal, advantage, disadvantage)

### Phase 6: Testing & Polish (1-2 hours)
1. Test with different abilities and skills
2. Test advantage/disadvantage rolls
3. Verify chronicle entries are properly formatted
4. Test edge cases (missing dice formula, invalid format)
5. Add loading states and error handling

## Total Estimated Time: 9-15 hours

## Future Enhancements
1. **Dice Formula Builder:** UI helper to build complex dice formulas
2. **Roll History:** Show recent rolls for quick re-rolling
3. **Passive Checks:** Auto-calculate passive perception, insight, etc.
4. **Critical Success/Failure:** Highlight nat 20s and nat 1s in chronicle
5. **Saving Throws:** Add saving throw support similar to ability checks
6. **Custom Roll Types:** Allow users to define custom roll types beyond ability/skill

## Notes
- Keep the dice formula simple initially (XdY format only)
- Consider game system differences (D&D 5e vs Pathfinder vs Daggerheart)
- Ensure the feature is optional (characters can exist without dice formulas)
- Maintain backward compatibility with existing characters
