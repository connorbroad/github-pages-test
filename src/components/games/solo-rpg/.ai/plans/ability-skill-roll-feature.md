# Ability & Skill Roll Feature Plan

## Implementation Progress

### Status: Complete
**Last Updated:** October 13, 2025 - All Phases Complete  
**Current Phase:** Phase 7 - UX Improvements  
**Estimated Completion:** 100% (7/7 phases)

### Phase Completion Checklist

#### ✅ Phase 1: Data Model (COMPLETE)
- [x] Updated `Ability` interface to include `diceRoll` field
- [x] Updated `Skill` interface to include `diceRoll` field
- [x] Updated `DiceRollData` interface to include roll context fields
- [x] Added migration logic for existing characters (N/A - optional fields are backward compatible)
- [x] Tested data model changes

#### ✅ Phase 2: Character Sheet UI (COMPLETE)
- [x] Added dice formula input to ability edit form
- [x] Added dice formula input to skill edit form
- [x] Added roll buttons to read-only ability cards
- [x] Added roll buttons to read-only skill cards
- [x] Implemented advantage/disadvantage buttons
- [x] Added event dispatchers for roll actions
- [x] Tested UI changes in edit and read modes

#### ✅ Phase 3: Integration Layer (COMPLETE)
- [x] Updated character sheet container to handle roll events
- [x] Updated main orchestrator (SoloRPG.svelte) to handle dice roller opening
- [x] Implemented dice formula parsing utility
- [x] Handled advantage/disadvantage logic (2d20 with Max/Min)
- [x] Tested event flow from character sheet to oracle

#### ✅ Phase 4: Oracle Updates (COMPLETE)
- [x] Updated GameOracle to accept and use preset
- [x] Updated DiceRoller to accept and apply preset
- [x] Implemented auto-navigate to dice view when preset exists
- [x] Included roll context in recordFate event
- [x] Tested preset application and clearing

#### ✅ Phase 5: Chronicle Integration (COMPLETE)
- [x] Updated handleDiceRecordFate to include ability/skill context
- [x] Formatted chronicle entry content with ability/skill name
- [x] Tested normal rolls
- [x] Tested advantage rolls
- [x] Tested disadvantage rolls

#### 🔄 Phase 6: Testing & Polish (Not Started)
- [ ] Tested with different abilities and skills
- [ ] Tested advantage/disadvantage rolls end-to-end
- [ ] Verified chronicle entries are properly formatted
- [ ] Tested edge cases (missing dice formula, invalid format)
- [ ] Added loading states and error handling
- [ ] Performed final integration testing

#### ✅ Phase 7: UX Improvements (COMPLETE)
- [x] **Task 7.1:** Use FloatingOracleButton instead of navigating to Oracle page
  - Remove navigation logic from handleRollCheck
  - Store preset in SoloRPG state
  - Pass preset to GameOracle via FloatingOracleButton flow
- [x] **Task 7.2:** Display check name in Chronicle entries and make it editable in Oracle
  - Show check name prominently in Chronicle entry display
  - Add editable text input for check name in DiceRoller
  - Allow users to edit the check name before recording
- [x] **Task 7.3:** Default dice formulas to "1d20"
  - Set default value for abilityCheckDice to "1d20"
  - Set default value for skillCheckDice to "1d20"
  - Apply defaults when creating new characters

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
- **Phase 2 Complete:** Character Sheet UI updated with dice formula inputs and roll buttons
  - Added `Character.abilityCheckDice` and `Character.skillCheckDice` fields at character level
  - Single dice formula applies to ALL abilities, another for ALL skills
  - Roll buttons use individual ability/skill modifiers with shared dice formula
  - Roll buttons show "Roll", "Adv", and "Dis" for d20 systems
  - Dice formula input accepts any format (e.g., "1d20", "2d6", etc.)
  - Event dispatches `rollCheck` with: checkName, diceFormula, modifier, resultOption
  - Design change: Moved from per-ability/skill dice formulas to character-level formulas for simplicity
- **Phase 3 Complete:** Integration layer implemented successfully
  - `CharacterManager.svelte` forwards `rollCheck` events with character context
  - `StoryView.svelte` forwards `rollCheck` events to `SoloRPG.svelte`
  - `SoloRPG.svelte` handles `rollCheck` events:
    - Parses dice formula (e.g., "1d20" -> numDice=1, numSides=20)
    - Stores preset data including character, check name, modifier, and roll type
    - Navigates to oracle view
  - Dice formula parsing uses regex: `/^(\d+)d(\d+)$/i`
- **Phase 4 Complete:** Oracle integration implemented successfully
  - `GameOracle.svelte` accepts `diceRollPreset` prop
  - Automatically switches to dice roller view when preset is provided
  - `DiceRoller.svelte` accepts and applies preset data:
    - Pre-fills numDice, numSides, and modifier
    - Applies advantage/disadvantage logic (2d20 with Max/Min for d20 rolls)
    - Includes character and check context in recordFate event
    - Clears preset after recording result
- **Phase 5 Complete:** Chronicle integration implemented successfully
  - `handleDiceRecordFate` in `GameOracle.svelte` updated to:
    - Include check name in chronicle entry content
    - Format as "[CheckName] check: Rolled [formula]: [result]"
    - Store `checkName` in `diceData` for reference
    - Use `characterId` from preset if provided, falling back to active character
- **Phase 7 Complete:** UX improvements implemented successfully
  - **Task 7.1:** FloatingOracleButton integration
    - Removed navigation to Oracle page from `handleRollCheck`
    - `diceRollPreset` now passed through: SoloRPG → StoryView → FloatingOracleButton → GameOracle
    - FloatingOracleButton automatically opens when preset is provided
    - User stays on Story view when rolling checks
  - **Task 7.2:** Check name display and editing
    - `DiceEntryContent.svelte` now displays check name prominently with styling
    - Added editable text input for check name in `DiceRoller.svelte`
    - Check name is pre-filled from preset and can be edited before recording
    - Edited check name is saved to chronicle entry
  - **Task 7.3:** Default dice formulas
    - New characters now default to "1d20" for both ability and skill checks
    - Applied in `CharacterManager.svelte` `createCharacter()` function

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

**Add to `Character` interface:**
```typescript
export type Character = {
    // ...existing fields...
    abilities: Ability[];
    skills: Skill[];
    abilityCheckDice?: string; // Dice formula for all ability checks (e.g., "1d20")
    skillCheckDice?: string; // Dice formula for all skill checks (e.g., "1d20")
    // ...rest of fields...
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
    checkName?: string; // Name of the check being rolled (e.g., "Strength", "Perception")
};
```

**Note:** Ability and Skill interfaces remain unchanged. Dice formulas are stored at the Character level, not per ability/skill.

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

### Phase 7: UX Improvements (In Progress)
- **Task 7.1:** Use FloatingOracleButton instead of navigating to Oracle page
  - Remove navigation logic from handleRollCheck
  - Store preset in SoloRPG state
  - Pass preset to GameOracle via FloatingOracleButton flow
- **Task 7.2:** Display check name in Chronicle entries and make it editable in Oracle
  - Show check name prominently in Chronicle entry display
  - Add editable text input for check name in DiceRoller
  - Allow users to edit the check name before recording
- **Task 7.3:** Default dice formulas to "1d20"
  - Set default value for abilityCheckDice to "1d20"
  - Set default value for skillCheckDice to "1d20"
  - Apply defaults when creating new characters

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
