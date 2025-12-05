# MapView UI Redesign - Implementation Guide

> **For AI assistants**: This document provides step-by-step instructions for implementing the MapView UI redesign. Follow each section in order, checking off tasks as you complete them.

## Overview

This redesign moves map editing controls from sidebars to floating panels over the map, and relocates the Edit/Play mode toggle to the SecondarySidebar.

### Goals

1. Move Edit/Play toggle from MapView header to SecondarySidebar
2. Replace TertiarySidebar map tools with floating panels
3. Keep SecondarySidebar visible in both edit and play modes
4. Clean up TertiarySidebar to only handle story mode

---

## Architecture

### Component Hierarchy (After Redesign)

```
MapView.svelte
├── SecondarySidebar.svelte (Edit/Play mode buttons)
├── MapEditor.svelte (the map canvas)
├── FloatingPanelContainer.svelte (layout manager) ──────────┐
│   ├── FloatingToolToggle.svelte (Move/Add toggle)          │
│   ├── FloatingPaintModeToggle.svelte (Background/Object)   │ Floating ABOVE
│   ├── FloatingBrushModeToggle.svelte (Paint/Erase)         │ the map canvas
│   ├── FloatingPaintOptions.svelte (Color + Tile + Shape*)  │ (z-index: 35)
│   │   ├── Color Drawer (vertical, anchored to button)      │ *Shape only in
│   │   └── Tile Modal (centered overlay)                    │  Object mode
│   └── FloatingSelectionPanel.svelte (Delete/Flip/Assign) ──┘
│       └── Color Drawer (vertical, anchored to button)
├── CombatPanel.svelte (play mode only)
└── InitiativeBar.svelte (play mode only)
```

### Floating Panel Layout Principles

**Key Design Rules:**

1. **Each logical group is a separate panel** - Toggles, options, and actions are in distinct floating panels
2. **Panels never share space** unless they are toggles or explicitly grouped
3. **Panel positions are stable** - Selecting a toggle does NOT change the position or size of existing panels
4. **New panels appear adjacent** - When a toggle reveals more options, the new panel appears to the right (with a gap)
5. **Overflow wraps vertically** - If panels would overflow the screen width, they wrap to a new row above

### Visual Layering (Z-Index Stack)

The floating panels are **visually positioned above the map canvas** using `position: fixed` and `z-index: 35`. They remain stationary while the map pans/zooms underneath. Clicks on the panels do not interact with the map below.

**Desktop Layout (Move selected):**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   ┌─────────────┐                                           │
│   │ Move | Add  │  ← FloatingToolToggle (always visible)    │
│   └─────────────┘                                           │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              MapEditor Canvas                       │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Desktop Layout (Add + Background mode - painting):**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   ┌─────────────┐ ┌─────────────────┐ ┌───────────────┐ ┌───────────────┐
│   │ Move | Add  │ │ Backgnd | Object│ │ Paint | Erase │ │ Color │ Tile  │
│   └─────────────┘ └─────────────────┘ └───────────────┘ └───────────────┘
│         ↑                   ↑                  ↑               ↑
│    Always here        Appears when        Appears when    Hidden when
│    (stable)           Add selected        Backgnd mode    Erase selected
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              MapEditor Canvas                       │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Desktop Layout (Add + Background mode - erasing):**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   ┌─────────────┐ ┌─────────────────┐ ┌───────────────┐     │
│   │ Move | Add  │ │ Backgnd | Object│ │ Paint | Erase │     │
│   └─────────────┘ └─────────────────┘ └───────────────┘     │
│         ↑                   ↑                  ↑             │
│    Color/Tile panel hidden when Erase is selected           │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              MapEditor Canvas                       │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Desktop Layout (Add + Object mode):**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   ┌─────────────┐ ┌─────────────────┐ ┌───────────────────────┐
│   │ Move | Add  │ │ Backgnd | Object│ │ Color │ Tile │ Shape │
│   └─────────────┘ └─────────────────┘ └───────────────────────┘
│         ↑                   ↑                     ↑
│    Always here        Mode toggle        Shape added in Object mode
│    (stable)           (no Paint/Erase in Object mode)
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              MapEditor Canvas                       │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Mobile Layout (panels stack from bottom-left, overflow upward):**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              MapEditor Canvas                       │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   ┌─────────────┐ ┌─────────────────┐ ┌───────────────┐ ... │
│   │ Move | Add  │ │ Backgnd | Object│ │ Paint | Erase │     │
│   └─────────────┘ └─────────────────┘ └───────────────┘     │
│         ↑ Row 1 (anchored bottom-left)                      │
└─────────────────────────────────────────────────────────────┘
```

### State Flow

```
MapView (parent state holder)
│
├── mapMode: "edit" | "play"
│   └── Changed by: SecondarySidebar modeChange event
│
├── tool: "move" | "paint"
│   └── Changed by: FloatingToolToggle toolChange event
│   └── Reset to "move" when entering edit mode from play
│
├── paintMode: "background" | "object"
│   └── Changed by: FloatingPaintModeToggle paintModeChange event
│
├── isErasing: boolean (default: false)
│   └── Changed by: FloatingBrushModeToggle brushModeChange event
│   └── Only relevant when paintMode === "background"
│   └── Reset to false when switching to Object mode
│
├── color: string
│   └── Changed by: FloatingPaintOptions/FloatingSelectionPanel colorChange event
│
├── selectedTileRef: { tileMapId, tileId } | null
│   └── Changed by: FloatingPaintOptions tileSelect event
│
├── currentShape: "square" | "circle" | "triangle" | "star"
│   └── Changed by: FloatingPaintOptions shapeChange event
│
└── moveHasSelection, moveSelectedColor, moveCanFlip, moveSelectedCreatureRef
    └── Changed by: MapEditor selectionChange event
    └── Used by: FloatingSelectionPanel
```

**Panel Visibility Rules:**

| Panel                   | Visibility Condition                                           |
| ----------------------- | -------------------------------------------------------------- |
| FloatingToolToggle      | Always (in edit mode)                                          |
| FloatingPaintModeToggle | `tool === "paint"`                                             |
| FloatingBrushModeToggle | `tool === "paint" && paintMode === "background"`               |
| FloatingPaintOptions    | `tool === "paint" && (paintMode === "object" \|\| !isErasing)` |
| FloatingSelectionPanel  | `tool === "move" && moveHasSelection`                          |

---

## Component Specifications

### 1. SecondarySidebar.svelte (Modified)

**Changes Required:**

- Remove `tool` prop
- Remove `mapMode` prop (will dispatch changes instead)
- Add `modeChange` event dispatcher

**Map Mode Buttons:**

```svelte
<!-- When mode === "map" -->
<button
    class="srpg-sidebar-item"
    class:active={mapMode === "edit"}
    on:click={() => dispatch("modeChange", "edit")}
    aria-label="Edit Mode">
    <svg class="sidebar-icon"><!-- pencil icon --></svg>
    <span class="sidebar-label">Edit</span>
</button>

<button
    class="srpg-sidebar-item"
    class:active={mapMode === "play"}
    on:click={() => dispatch("modeChange", "play")}
    aria-label="Play Mode">
    <svg class="sidebar-icon"><!-- crossed swords icon --></svg>
    <span class="sidebar-label">Play</span>
</button>
```

**Props Interface:**

```typescript
export let show: boolean = false;
export let mode: "story" | "map" = "story";
export let mapMode: "edit" | "play" = "edit"; // For displaying active state
export let activeTab: "characters" | "codex" = "characters";
export let onTabChange: (tab: "characters" | "codex") => void;
```

**Events:**

- `modeChange` - Dispatched with `"edit" | "play"` when mode button clicked

---

### 2. FloatingPanelContainer.svelte (New)

**Purpose:** Layout manager that positions all floating panels using flexbox with wrap.

**Position:**

- Mobile (< 768px): Bottom-left, above sidebars, grows rightward
- Desktop (≥ 768px): Top-left, after sidebars, grows rightward

**Props Interface:**

```typescript
export let show: boolean = true;
```

**Behavior:**

- Uses `display: flex` with `flex-wrap: wrap-reverse` (desktop) or `wrap` (mobile)
- Panels flow left-to-right, wrapping to a new row above when they overflow
- Gap of `0.5rem` between panels
- Container max-width prevents overflow beyond viewport

**Template Structure:**

```svelte
<div class="floating-panel-container" class:show>
    <slot />
</div>
```

**CSS:**

```css
.floating-panel-container {
    position: fixed;
    z-index: 35;
    display: flex;
    flex-wrap: wrap-reverse; /* Overflow wraps upward */
    align-content: flex-start;
    gap: 0.5rem;
    pointer-events: none; /* Allow clicks to pass through container */
}

.floating-panel-container > :global(*) {
    pointer-events: auto; /* Re-enable clicks on panels */
}

/* Mobile: bottom-left */
@media (max-width: 767px) {
    .floating-panel-container {
        bottom: calc(140px + env(safe-area-inset-bottom));
        left: 0.5rem;
        right: 0.5rem;
        flex-direction: row;
        flex-wrap: wrap-reverse;
        align-content: flex-end;
    }
}

/* Desktop: top-left */
@media (min-width: 768px) {
    .floating-panel-container {
        top: 0.5rem;
        left: calc(170px + 0.5rem);
        right: 0.5rem;
        flex-direction: row;
        flex-wrap: wrap;
        align-content: flex-start;
    }
}
```

---

### 3. FloatingToolToggle.svelte (New)

**Purpose:** Move/Add toggle button group. Always visible in edit mode.

**Props Interface:**

```typescript
export let tool: "move" | "paint" = "move";
```

**Events:**

```typescript
dispatch("toolChange", "move" | "paint");
```

**UI Structure:**

```
┌─────────────┐
│ Move | Add  │   ← "Add" label (internally tool="paint")
└─────────────┘
```

**Template:**

```svelte
<div class="floating-panel floating-tool-toggle">
    <div class="toggle-group">
        <button
            class="toggle-btn"
            class:active={tool === "move"}
            aria-label="Move tool"
            on:click={() => dispatch("toolChange", "move")}>
            <!-- Arrow icon -->
            Move
        </button>
        <button
            class="toggle-btn"
            class:active={tool === "paint"}
            aria-label="Add tool"
            on:click={() => dispatch("toolChange", "paint")}>
            <!-- Plus icon -->
            Add
        </button>
    </div>
</div>
```

**Note:** The UI displays "Add" to the user, but the internal state value remains `"paint"` for backward compatibility with MapEditor.

---

### 4. FloatingPaintModeToggle.svelte (New)

**Purpose:** Background/Object toggle. Only visible when Paint tool is selected.

**Visibility:** `tool === "paint"`

**Props Interface:**

```typescript
export let paintMode: "background" | "object" = "background";
```

**Events:**

```typescript
dispatch("paintModeChange", "background" | "object");
```

**UI Structure:**

```
┌─────────────────┐
│ Backgnd | Object│
└─────────────────┘
```

**Template:**

```svelte
<div class="floating-panel floating-paint-mode-toggle">
    <div class="toggle-group">
        <button
            class="toggle-btn"
            class:active={paintMode === "background"}
            on:click={() => dispatch("paintModeChange", "background")}>
            Background
        </button>
        <button
            class="toggle-btn"
            class:active={paintMode === "object"}
            on:click={() => dispatch("paintModeChange", "object")}>
            Object
        </button>
    </div>
</div>
```

---

### 4b. FloatingBrushModeToggle.svelte (New)

**Purpose:** Paint/Erase toggle. Only visible in Background paint mode. Determines whether painting adds tiles/colors or clears them.

**Visibility:** `tool === "paint" && paintMode === "background"`

**Props Interface:**

```typescript
export let isErasing: boolean = false;
```

**Events:**

```typescript
dispatch("brushModeChange", boolean); // true = erasing, false = painting
```

**UI Structure:**

```
┌───────────────┐
│ Paint | Erase │
└───────────────┘
```

**Template:**

```svelte
<div class="floating-panel floating-brush-mode-toggle">
    <div class="toggle-group">
        <button
            class="toggle-btn"
            class:active={!isErasing}
            aria-label="Paint mode"
            on:click={() => dispatch("brushModeChange", false)}>
            <!-- Brush icon -->
            Paint
        </button>
        <button
            class="toggle-btn"
            class:active={isErasing}
            aria-label="Erase mode"
            on:click={() => dispatch("brushModeChange", true)}>
            <!-- Eraser icon -->
            Erase
        </button>
    </div>
</div>
```

**Behavior:**

- When "Paint" is active: MapEditor paints selected color/tile
- When "Erase" is active: MapEditor clears cells (removes color and tile)
- FloatingPaintOptions panel is hidden when Erase is active (no need to select color/tile for erasing)
- Resets to Paint mode when switching from Background to Object mode

---

### 5. FloatingPaintOptions.svelte (New)

**Purpose:** Color, Tile, and Shape options for paint mode.

**Visibility:** `tool === "paint" && (paintMode === "object" || !isErasing)`

When `isErasing === true` in Background mode, this panel is hidden since the user doesn't need to select a color or tile for erasing.

**Props Interface:**

```typescript
export let show: boolean = true;
export let paintMode: "background" | "object" = "background";
export let color: string = "#2980b9";
export let selectedTile: { tileMapId: string; tileId: string } | null = null;
export let currentShape: "square" | "circle" | "triangle" | "star" = "square";
```

**Events:**

```typescript
dispatch("colorChange", string);
dispatch("tileSelect", { tileMapId: string; tileId: string });
dispatch("shapeChange", "square" | "circle" | "triangle" | "star");
```

**UI Structure:**

```
Background mode:
┌─────────────────────────────────┐
│ [Color ▼] [Tile ▼]              │
└─────────────────────────────────┘

Object mode (Shape button added):
┌───────────────────────────────────────┐
│ [Color ▼] [Tile ▼] [Shape ▼]          │
└───────────────────────────────────────┘

Color Drawer (when open):
┌─────┐
│ ▓▓▓ │
│ ▓▓▓ │  ← Color swatches (single column)
│ ▓▓▓ │
│ ... │
└─────┘
  ↑ Anchored to color button, expands upward (mobile) or downward (desktop)
```

**Note:** Shape button is only visible when `paintMode === "object"`. This keeps the panel compact for Background mode while providing shape options for Object mode in a single panel.

**Color Palette:**

```typescript
const palette = [
    "#f5eee4",
    "#000000",
    "#4e3d3b",
    "#544d54",
    "#786c64",
    "#a09a92",
    "#64d5df",
    "#478fca",
    "#2f588d",
    "#252f40",
    "#63250e",
    "#9e3227",
    "#d87945",
    "#f4dc6d",
    "#89aa55",
    "#4e8357",
    "#386956",
    "#2b4a3c",
    "#e99b7c",
    "#825341",
    "#632a7b",
    "#c247b8",
];
// Note: CLEAR_COLOR ("clear") has been removed from the palette.
// Erasing is now handled via the Paint/Erase toggle in FloatingBrushModeToggle.
```

**Drawer Behavior:**

- Toggle open/close on color button tap
- Auto-close when a color is selected
- 200ms fade animation
- Anchored to color button, expands upward (mobile) or downward (desktop)

**Tile Modal:**

- Opens on tile button tap
- Centered overlay with backdrop (80% max viewport)
- Scrollable grid of tiles
- Auto-close on tile selection
- Uses existing `srpg-modal` styling

---

### 6. FloatingShapeOptions.svelte ~~(New)~~ - DEPRECATED

> **⚠️ DESIGN CHANGE:** Shape selection has been integrated into `FloatingPaintOptions.svelte` as a conditional button that only appears in Object mode. This reduces the number of floating panels and keeps shape selection grouped with color/tile options. The separate `FloatingShapeOptions.svelte` file is no longer needed.

~~**Purpose:** Shape selector for object paint mode. Separate panel to avoid changing layout of paint options.~~

~~**Visibility:** `tool === "paint" && paintMode === "object"`~~

The Shape selector is now part of FloatingPaintOptions, shown only when `paintMode === "object"`.

---

### 7. FloatingSelectionPanel.svelte (Modified)

**Purpose:** Actions and options for selected objects in Move mode.

**Visibility:** Only when `moveHasSelection && mapMode === "edit"`

**Position:** Adjacent to FloatingToolToggle (appears in the panel flow)

**Props Interface:**

```typescript
export let show: boolean = false;
export let selectedColor: string | null = null;
export let canFlip: boolean = false;
export let creatureRef: CreatureRef | null = null;
export let campaignId: string | null = null;
export let mapId: string | null = null;
```

**Events:**

```typescript
dispatch("colorChange", string);
dispatch("flip");
dispatch("delete");
dispatch("creatureAssign", CreatureRef | null);
```

**UI Structure:**

```
┌─────────────────────────────────┐
│ [Delete] [Flip] [Assign]        │  ← Action buttons (row)
├─────────────────────────────────┤
│ [Color ▼]                       │  ← Color selector
└─────────────────────────────────┘
```

---

### 8. MapView.svelte (Modified)

**Removals:**

- Remove Edit/Play segmented control from `.map-mode-header`
- Remove `TertiarySidebar` component usage
- Remove `showTertiarySidebar` state

**Additions:**

- Import `FloatingToolPanel` and `FloatingSelectionPanel`
- Handle `modeChange` event from SecondarySidebar
- Add `paintMode` state variable

**Modified State:**

```typescript
// Change showSecondarySidebar logic
$: if (currentMapId) {
    showSecondarySidebar = true; // Always visible when map is open
} else {
    showSecondarySidebar = false;
}

// Add paintMode state
let paintMode: "background" | "object" = "background";

// Modify setMapMode to reset tool
function setMapMode(mode: "edit" | "play") {
    mapMode = mode;
    if (mode === "edit") {
        tool = "move"; // Reset to default tool
        encounterSelectedCreature = null;
    } else if (mode === "play") {
        // existing play mode logic
    }
}
```

**CSS Changes:**

```css
/* Remove .play-mode variations - sidebar always visible */
.map-view-container {
    bottom: calc(130px + env(safe-area-inset-bottom)); /* Always both sidebars on mobile */
}

@media (min-width: 768px) {
    .map-view-container {
        left: 170px; /* Always both sidebars on desktop */
        bottom: 0;
    }

    /* Play mode only adds initiative bar space */
    .map-view-container.play-mode {
        left: 170px; /* Keep secondary sidebar */
        bottom: 44px;
    }
}
```

---

### 9. InitiativeBar.svelte (Modified)

**CSS Changes Only:**

```css
.initiative-bar {
    position: fixed;
    /* Mobile: above both sidebars (130px) */
    bottom: calc(130px + env(safe-area-inset-bottom));
    left: 0;
    right: 0;
    height: 48px;
    z-index: 100;
}

@media (min-width: 768px) {
    .initiative-bar {
        left: 170px; /* After both sidebars */
        bottom: 0;
        height: 44px;
    }
}
```

---

### 10. CombatPanel.svelte (Modified)

**CSS Changes Only:**

```css
/* Mobile */
@media (max-width: 767px) {
    .combat-panel {
        /* Above both sidebars (130px) + initiative bar (48px) */
        bottom: calc(130px + 48px + env(safe-area-inset-bottom));
    }
}

/* Desktop */
@media (min-width: 768px) {
    .combat-panel {
        left: 170px; /* After both sidebars */
        bottom: 44px; /* Above initiative bar */
    }
}
```

---

### 11. TertiarySidebar.svelte (Modified)

**Remove all map-related code:**

**Props to Remove:**

- `tool`
- `currentShape`
- `color`
- `selectedTile`
- `autoShowOnMapTools`
- `moveHasSelection`
- `moveSelectedColor`
- `moveCanFlip`
- `moveSelectedCreatureRef`
- `campaignId`
- `mapId`

**Code to Remove:**

- `palette` array
- `CLEAR_COLOR` constant
- Tile loading logic (`tileMaps`, `tileOptions`, `rebuildTileOptions`)
- Shape options
- All map mode template sections
- Map-related event dispatchers
- `CreatureAssignmentModal` import and usage

**Keep:**

- Story mode props (`visibleSections`, `selectedSections`, `isEditingSections`, `onToggleSection`)
- `CharacterSheetControls` component
- Story mode template section

---

## CSS Specifications

### Floating Panel Base Styles

```css
.floating-panel {
    position: fixed;
    z-index: 35;
    background: var(--bg-elevated);
    border: 1px solid var(--border-primary);
    border-radius: 8px;
    box-shadow: var(--shadow-lg);
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

/* Mobile: bottom-right */
@media (max-width: 767px) {
    .floating-panel {
        bottom: calc(140px + env(safe-area-inset-bottom)); /* Above sidebars + margin */
        right: 0.5rem;
    }
}

/* Desktop: top-left */
@media (min-width: 768px) {
    .floating-panel {
        top: 0.5rem;
        left: calc(170px + 0.5rem); /* After sidebars + margin */
    }
}
```

### Color Drawer Styles

```css
.color-drawer {
    position: absolute;
    background: var(--bg-elevated);
    border: 1px solid var(--border-primary);
    border-radius: 6px;
    box-shadow: var(--shadow-md);
    padding: 0.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    max-height: 300px;
    overflow-y: auto;

    /* Animation */
    opacity: 0;
    transform: scale(0.95);
    transition:
        opacity 200ms ease,
        transform 200ms ease;
}

.color-drawer.open {
    opacity: 1;
    transform: scale(1);
}

/* Anchor to button - mobile expands upward */
@media (max-width: 767px) {
    .color-drawer {
        bottom: 100%;
        left: 0;
        margin-bottom: 0.25rem;
    }
}

/* Desktop expands downward */
@media (min-width: 768px) {
    .color-drawer {
        top: 100%;
        left: 0;
        margin-top: 0.25rem;
    }
}

.color-swatch-btn {
    width: 32px;
    height: 32px;
    border: 2px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    transition: border-color 0.15s ease;
}

.color-swatch-btn:hover {
    border-color: var(--border-secondary);
}

.color-swatch-btn.active {
    border-color: var(--accent-primary);
}
```

### Tile Modal Styles

```css
.tile-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
}

.tile-modal {
    background: var(--bg-elevated);
    border: 1px solid var(--border-primary);
    border-radius: 12px;
    box-shadow: var(--shadow-lg);
    max-width: 80vw;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.tile-modal-header {
    padding: 1rem;
    border-bottom: 1px solid var(--border-primary);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.tile-modal-grid {
    padding: 1rem;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
    gap: 0.5rem;
    overflow-y: auto;
}

.tile-option {
    width: 48px;
    height: 48px;
    border: 2px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    overflow: hidden;
}

.tile-option:hover {
    border-color: var(--border-secondary);
}

.tile-option.active {
    border-color: var(--accent-primary);
}
```

---

## Implementation Checklist

### Phase 1: Create Implementation Document

- [x] Create MAP_VIEW_REDESIGN.md

### Phase 2: Update SecondarySidebar

- [x] Remove `tool` prop handling in map mode
- [x] Add Edit/Play buttons with `srpg-sidebar-item` styling
- [x] Add `modeChange` event dispatcher
- [x] Keep `mapMode` prop for active state display
- [x] Test: Buttons display correctly, events dispatch

### Phase 3: Create FloatingPanelContainer

- [x] Create new component file `FloatingPanelContainer.svelte`
- [x] Implement flexbox layout with wrap-reverse (desktop) / wrap (mobile)
- [x] Add pointer-events pass-through for container, re-enable for children
- [x] Add responsive positioning (desktop: top-left, mobile: bottom-left)
- [~] Test: Container positions correctly, panels wrap on overflow _(skipped - will test after integration)_

### Phase 4: Create FloatingToolToggle

- [x] Create new component file `FloatingToolToggle.svelte`
- [x] Implement Move/Paint toggle with consistent toggle-group styling
- [x] Add `toolChange` event dispatcher
- [~] Test: Toggle works, panel does not change size/position on selection _(skipped - will test after integration)_

### Phase 5: Create FloatingPaintModeToggle

- [x] Create new component file `FloatingPaintModeToggle.svelte`
- [x] Implement Background/Object toggle with same styling as FloatingToolToggle
- [x] Add `paintModeChange` event dispatcher
- [ ] Only render when `tool === "paint"` _(handled by parent - MapView)_
- [~] Test: Appears to the right of tool toggle with gap, does not shift existing panels _(skipped - will test after integration)_

### Phase 6: Create FloatingPaintOptions

- [x] Create new component file `FloatingPaintOptions.svelte`
- [x] Implement color button with drawer (toggle behavior)
- [x] Implement tile button with modal
- [x] Only render when `tool === "paint"` _(handled by parent - MapView)_
- [x] **UPDATED:** Implement Shape button (Object mode only)
- [x] **UPDATED:** Panel hidden when `isErasing === true` in Background mode
- [~] Test: Appears to the right of paint mode toggle, drawers work correctly _(skipped - will test after integration)_

### Phase 7: ~~Create FloatingShapeOptions~~ - DEPRECATED

> **⚠️ Design Change:** Shape selector is now part of FloatingPaintOptions. No separate component needed.

- [x] ~~Create new component file `FloatingShapeOptions.svelte`~~ → Shape is now in FloatingPaintOptions
- [x] ~~Implement shape selector dropdown~~ → Implemented in FloatingPaintOptions
- [N/A] ~~Only render when `tool === "paint" && paintMode === "object"`~~ → Handled within FloatingPaintOptions
- [~] ~~Test: Appears as separate panel~~ → Now part of FloatingPaintOptions panel

### Phase 7b: Create FloatingBrushModeToggle (NEW)

- [x] Create new component file `FloatingBrushModeToggle.svelte`
- [x] Implement Paint/Erase toggle
- [x] Add `brushModeChange` event dispatcher
- [x] Only render when `tool === "paint" && paintMode === "background"` _(handled by parent - MapView)_
- [~] Test: Appears after Background/Object toggle in Background mode _(skipped - will test after integration)_

### Phase 8: Update FloatingSelectionPanel

- [x] Refactor to work within FloatingPanelContainer
- [x] Ensure it appears in the panel flow when selection exists
- [x] Implement Delete/Flip/Assign buttons row
- [x] Implement color drawer (same behavior as paint options)
- [x] Import and use CreatureAssignmentModal
- [~] Test: Panel shows/hides correctly, actions work _(skipped - will test after integration)_

### Phase 9: Update MapView

- [x] Remove old FloatingToolPanel import and usage
- [x] Add FloatingPanelContainer import
- [x] Add all new floating panel component imports
- [x] Wire up all events between panels and MapView state
- [x] Ensure tool resets to "move" when entering edit mode
- [x] Update MapEditor: change tool type to `"move" | "paint"`, add `paintMode` prop
- [x] **UPDATED:** Add FloatingBrushModeToggle import
- [x] **UPDATED:** Add `isErasing` state and pass to MapEditor
- [x] **UPDATED:** FloatingToolToggle displays "Add" label (internal state remains "paint")
- [x] **UPDATED:** FloatingPaintOptions hidden when `isErasing === true` in Background mode
- [x] Test: Full workflow edit → play → edit, all panels appear/hide correctly

### Phase 10: Update InitiativeBar Positioning

- [x] Update mobile CSS: `bottom: calc(130px + env(safe-area-inset-bottom))`
- [x] Update desktop CSS: `left: 170px`
- [ ] Test: Bar positions correctly in play mode

### Phase 11: Update CombatPanel Positioning

- [x] Update mobile CSS: `bottom: calc(130px + 48px + env(safe-area-inset-bottom))`
- [x] Update desktop CSS: `left: 170px`
- [ ] Test: Panel positions correctly in play mode

### Phase 12: Clean Up TertiarySidebar

- [x] Remove all map-related props
- [x] Remove palette, CLEAR_COLOR, tile loading
- [x] Remove shape options
- [x] Remove map mode template sections
- [x] Remove CreatureAssignmentModal
- [x] Keep only story mode functionality
- [x] Test: Story mode still works _(Updated SoloRPG.svelte to remove obsolete props)_

### Phase 13: Remove Old FloatingToolPanel

- [ ] Delete `FloatingToolPanel.svelte` file
- [ ] Verify no remaining imports reference it
- [ ] Test: No build errors

### Phase 14: Add Tests

- [ ] Create `map/__tests__/floating-panel.test.ts`
- [ ] Test tool defaults to Move
- [ ] Test paint sub-mode toggle
- [ ] Test color drawer toggle behavior
- [ ] Test tile modal auto-close
- [ ] Test panels hidden in play mode
- [ ] Test tool resets on play mode exit
- [ ] Test panel positions remain stable when toggles change

---

## Testing Scenarios

### Manual Testing Checklist

1. **Edit Mode - Move Tool**
    - [ ] Move tool selected by default
    - [ ] Can select objects on map
    - [ ] FloatingSelectionPanel appears when object selected
    - [ ] Delete/Flip/Assign buttons work
    - [ ] Color drawer opens/closes on button tap
    - [ ] Color selection updates object and closes drawer

2. **Edit Mode - Add Tool (Background Mode - Paint)**
    - [ ] Clicking Add shows Background/Object toggle
    - [ ] Background mode: Paint/Erase toggle visible, Color and Tile options visible
    - [ ] Paint mode: Color/Tile options show, painting adds to map
    - [ ] Color drawer works as expected
    - [ ] Tile modal opens, shows grid, closes on selection
    - [ ] Painting works on map

3. **Edit Mode - Add Tool (Background Mode - Erase)**
    - [ ] Selecting "Erase" hides Color/Tile panel
    - [ ] Erasing clears cells on map (removes color and tile)
    - [ ] Switching back to "Paint" shows Color/Tile panel again

4. **Edit Mode - Add Tool (Object Mode)**
    - [ ] Object mode: Color, Tile, and Shape options visible (no Paint/Erase toggle)
    - [ ] Shape dropdown works correctly
    - [ ] Placing objects works on map

5. **Mode Switching**
    - [ ] Edit button in sidebar activates edit mode
    - [ ] Play button in sidebar activates play mode
    - [ ] Floating panels hidden in play mode
    - [ ] Tool resets to Move when returning to edit mode
    - [ ] Initiative bar and combat panel position correctly

6. **Responsive Behavior**
    - [ ] Mobile: Floating panels at bottom-left, grow rightward
    - [ ] Desktop: Floating panels at top-left, grow rightward
    - [ ] Color drawer anchors correctly on both
    - [ ] All touch targets accessible on mobile
    - [ ] Panels wrap to new row above when overflowing

7. **Panel Stability**
    - [ ] FloatingToolToggle never moves when other panels appear/disappear
    - [ ] Selecting Add does not change position of Move/Add toggle
    - [ ] FloatingPaintModeToggle appears to the right with gap
    - [ ] FloatingBrushModeToggle appears after Background/Object toggle (Background mode only)
    - [ ] FloatingPaintOptions appears to the right of brush mode toggle
    - [ ] Switching Background/Object does not reposition Color/Tile panel
    - [ ] Shape button appears inline in Object mode (no separate panel)

---

## Rollback Plan

If issues arise, revert changes in this order:

1. Restore MapView.svelte to use TertiarySidebar
2. Restore SecondarySidebar map mode tools
3. Remove FloatingToolPanel and FloatingSelectionPanel
4. Restore original positioning CSS

Keep the MAP_VIEW_REDESIGN.md for future reference.
