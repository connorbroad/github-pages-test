# Dice Roller Components

This directory contains a set of reusable components for implementing dice rolling functionality in the solo-rpg application.

## Architecture

The dice roller functionality has been refactored into a modular, reusable structure:

### Core Components

#### 1. **Shared Logic** (`diceRollerLogic.ts`)
Contains all the business logic for dice rolling:
- `calculateResult()` - Calculates final result based on dice results, result option (Sum/Max/Min/Subtract), and modifier
- `createDiceRollerAnimation()` - Manages the dice rolling animation with configurable timing
- Type definitions: `ResultOption`, `DiceRollState`, `AnimationConfig`
- Default animation configuration constants

#### 2. **Visual Components**

**`DiceIcon.svelte`**
- Renders a single die with the appropriate shape for different dice types (D4, D6, D8, D10, D12, D20, D100)
- Displays the current value or default number of sides
- Supports animated offsets for rolling effects
- Props:
  - `numSides` - Type of die (4, 6, 8, 10, 12, 20, 100)
  - `value` - Current rolled value (null for unrolled state)
  - `offset` - Animation offset for position and rotation
  - `animated` - Enable/disable animation transitions

**`DiceDisplay.svelte`**
- Displays a collection of dice
- Shows either rolled results or placeholder dice
- Props:
  - `numDice` - Number of dice to display
  - `numSides` - Type of dice
  - `diceResults` - Array of rolled values
  - `diceOffsets` - Array of animation offsets
  - `rolledNumSides` - Type of dice that were rolled (may differ from current numSides)

**`ResultOptionIcon.svelte`**
- Renders icons for result calculation options (Sum, Maximum, Minimum, Subtract)
- Props:
  - `option` - Which result option to display
  - `size` - Icon size (default: '1em')

### Parent Components

#### **`DiceRoller.svelte`** (Modal)
A full-featured modal dice roller with:
- Dice selection (1-10 dice, D4-D100)
- Rolling animation
- Collapsible result calculator with:
  - Result options (Sum, Maximum, Minimum, Subtract)
  - Modifier selection (-5 to +10)
- Visual result indicators
- Close/dismiss functionality

**Purpose**: Standalone dice roller that can be opened as a modal/overlay.

**Props**:
- `show` - Whether the modal is visible
- `onClose` - Callback when modal is closed

#### **`DiceRollerEmbed.svelte`** (Embedded)
A simplified embedded dice roller for inline use:
- Configurable via props (no UI for changing dice/sides)
- Optional modifier display
- Event dispatching for integration
- Compact re-roll interface

**Purpose**: Embeddable dice roller for use within other components (e.g., game interfaces).

**Props**:
- `numDice` - Number of dice to roll
- `numSides` - Type of dice
- `modifier` - Dice modifier
- `resultOption` - How to calculate result
- `onResult` - Callback when roll completes
- `showModifier` - Show/hide modifier selector

**Events**:
- `result` - Dispatched with final result value
- `modifierChange` - Dispatched when modifier changes

## Usage Examples

### Using the Modal Dice Roller

```svelte
<script>
  import DiceRoller from './DiceRoller.svelte';
  
  let showDiceRoller = false;
</script>

<button on:click={() => showDiceRoller = true}>
  Roll Dice
</button>

<DiceRoller 
  show={showDiceRoller}
  onClose={() => showDiceRoller = false}
/>
```

### Using the Embedded Dice Roller

```svelte
<script>
  import DiceRollerEmbed from './DiceRollerEmbed.svelte';
  
  let result = null;
  
  function handleResult(value) {
    result = value;
    console.log('Rolled:', value);
  }
</script>

<DiceRollerEmbed
  numDice={2}
  numSides={6}
  modifier={3}
  resultOption="Sum"
  onResult={handleResult}
  showModifier={true}
/>
```

### Using Individual Components

```svelte
<script>
  import DiceIcon from './dice-roller/DiceIcon.svelte';
  import DiceDisplay from './dice-roller/DiceDisplay.svelte';
  import ResultOptionIcon from './dice-roller/ResultOptionIcon.svelte';
  import { calculateResult } from './dice-roller/diceRollerLogic';
  
  let results = [4, 6, 2];
  let offsets = [
    { x: 0, y: 0, r: 0 },
    { x: 2, y: -1, r: 5 },
    { x: -1, y: 1, r: -3 }
  ];
</script>

<!-- Single die -->
<DiceIcon numSides={20} value={15} offset={{ x: 0, y: 0, r: 0 }} />

<!-- Multiple dice -->
<DiceDisplay 
  numDice={3}
  numSides={6}
  diceResults={results}
  diceOffsets={offsets}
  rolledNumSides={6}
/>

<!-- Result icon -->
<ResultOptionIcon option="Sum" size="2em" />

<!-- Use logic directly -->
<p>Total: {calculateResult(results, "Sum", 5)}</p>
```

## Benefits of This Structure

1. **Code Reusability**: Shared logic and components eliminate duplication between modal and embedded versions
2. **Maintainability**: Bug fixes and features only need to be implemented once in shared code
3. **Flexibility**: Easy to create new dice roller variants or integrate into different contexts
4. **Testability**: Business logic is separated and can be unit tested independently
5. **Consistency**: All dice rollers share the same animation behavior and visual appearance
6. **Performance**: Shared components are loaded once and reused

## Future Enhancements

Potential improvements to consider:
- Add custom dice types beyond standard RPG dice
- Support for dice notation parsing (e.g., "2d6+3")
- Roll history/logging
- Sound effects for rolling
- Customizable themes/colors
- Advantage/disadvantage modes for D&D-style rolling
