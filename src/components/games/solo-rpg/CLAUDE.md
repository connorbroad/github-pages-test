# CLAUDE.md - Solo RPG Project

A client-side solo tabletop RPG companion app built with Svelte 5 and TypeScript. All data persists to localStorage.

## Commands

```bash
npm run dev          # Dev server at localhost:4200
npm run build        # Build (runs astro check first)
npm test             # Run Vitest tests
npm run test:watch   # Watch mode tests
npm run format       # Prettier formatting
```

## Architecture Overview

### Entry Point
- `SoloRPG.svelte` - Main component, handles view routing and global state
- Mounted via Astro at `/games/solo-rpg` with `client:only="svelte"`

### Directory Structure

```
solo-rpg/
├── data/                 # Storage utilities and TypeScript interfaces
├── game-management/      # Campaign & blueprint stores
├── home/                 # Landing/campaign selection
├── lore/
│   ├── characters/       # Character sheets and management
│   ├── chronicle/        # Adventure journal/log
│   └── codex/            # World-building notes
├── map/                  # Canvas-based map editor & combat
├── oracle/               # Dice, cards, and fortune systems
├── shared/               # Reusable components and modals
└── theme/                # Light/dark theme system
```

### Key Files

| File | Purpose |
|------|---------|
| `data/storage-utils.ts` | All TypeScript interfaces + localStorage CRUD |
| `game-management/campaign-store.ts` | Active campaign Svelte store |
| `data/character-store.ts` | Character list Svelte store |
| `theme/theme-store.ts` | Theme state with persistence |
| `map/renderer.ts` | Canvas rendering engine |
| `solo-rpg-styles.css` | Global component styles |
| `DESIGN_SYSTEM.md` | Styling conventions |

### Data Flow

1. All persistent data stored in localStorage as JSON
2. Svelte stores (`writable`) manage reactive state
3. Components read from stores and call storage-utils for persistence
4. `activeCampaign` store gates most views - they show overlay if null

### Core Data Types (from storage-utils.ts)

- `Campaign` - Container for all game data
- `Character` - Full character sheet with abilities, skills, items
- `ChronicleEntry` - Journal entries (manual, dice, cards, fortune types)
- `MapEntity` - Map with tiles, tokens, combat state
- `Fortune` - Oracle/random generation definitions
- `CodexNote` - World-building notes

## Styling

Hybrid approach:
- **Tailwind** for layout, spacing, responsive
- **CSS custom properties** in `theme-variables.css` for colors
- **`.srpg-*` classes** in `solo-rpg-styles.css` for **reusable** component patterns only
- **Component `<style>` blocks** for component-specific styles

### solo-rpg-styles.css Guidelines

This file should **only** contain styles that are:
- Used by multiple components (e.g., `.srpg-list-item`, `.srpg-modal`, `.srpg-sidebar-item`)
- Generic patterns that don't reference specific features
- Theme-aware using CSS custom properties

**Do NOT add** component-specific styles here. Instead, use a `<style>` block within the component itself.

Common patterns: `.srpg-list`, `.srpg-empty-state`, `.srpg-modal-*`, `.srpg-button-*`, `.srpg-sidebar-item`

## Testing

Tests use Vitest. Currently only `chronicle/chronicle-utils.test.ts` has tests.

Pattern: Extract logic to `.ts` utility files (not Svelte components) for testability.

## Common Tasks

### Adding a new view
1. Create component in appropriate feature folder
2. Add case to view switch in `SoloRPG.svelte`
3. Add navigation item to `Sidebar.svelte`

### Adding a new data type
1. Define interface in `storage-utils.ts`
2. Add to `SoloRPGData` interface
3. Create load/save helper functions
4. Create Svelte store if needed for reactive access

### Adding character sheet sections
1. Create component in `lore/characters/character-sheet/`
2. Register in section picker configuration
3. Add to `visibleSections` type on Character interface

### Working with maps
- `MapEditor.svelte` handles edit mode (drawing, tiles, tokens)
- `CombatPanel.svelte` handles play mode (initiative, combat tracking)
- `renderer.ts` handles all canvas operations
- Token positions are grid-based (multiply by tileSize for pixels)

## Code Conventions

- Feature-based directory organization
- Co-locate tests with source (`.test.ts` suffix)
- Strong TypeScript typing on all data structures
- Use discriminated unions for flexible types
- Prefer Svelte stores for cross-component state
- Mobile-first responsive design (bottom nav on mobile, left sidebar on desktop)

## Known Large Components

These components are complex and may benefit from refactoring:
- `CharacterManager.svelte` (~57KB)
- `MapEditor.svelte` (~54KB)
- `CombatPanel.svelte` (~35KB)
- `Chronicle.svelte` (~32KB)

## Layout & Sidebar System

**IMPORTANT**: When adding UI, always account for the sidebar system.

### Sidebar Structure

| Sidebar | Desktop | Mobile | Z-Index |
|---------|---------|--------|---------|
| Primary (`Sidebar.svelte`) | Left, 80px wide | Bottom, 70px tall | 50 |
| Secondary (`SecondarySidebar.svelte`) | Left, 90px (after primary) | Bottom, 60px (above primary) | 40 |
| Tertiary (`TertiarySidebar.svelte`) | Left, 80px (after secondary) | Bottom, 60px (above secondary) | 30 |

### Sidebar Visibility by View

- **Home/Chronicle/Settings**: Primary only
- **Story (with character sheet)**: Primary + Tertiary (for section filters)
- **Map Edit mode**: Primary + Secondary + Tertiary (when tool selected)
- **Map Play mode**: Primary only (+ floating CombatPanel)

### Required Offsets for New UI

**Desktop (`md:` breakpoint = 768px)**:
- Primary only: `md:ml-20` (80px)
- Primary + Secondary: `md:ml-[170px]`
- Primary + Tertiary (no secondary): `md:ml-40` (160px)
- All three: `md:ml-[250px]`

**Mobile**:
- Content should have bottom padding to avoid sidebar overlap
- Use `pb-[calc(70px+env(safe-area-inset-bottom))]` minimum
- Add 60px per additional visible sidebar

### Fixed/Absolute Positioned Elements

For floating buttons, panels, or fixed UI:
- Desktop: Set `left` offset = sum of visible sidebar widths
- Mobile: Set `bottom` offset = sum of visible sidebar heights + safe-area-inset
- Check `SoloRPG.svelte` for `showSecondarySidebar` and `showTertiarySidebar` logic

### Layout Helper Utilities

**Use `shared/layout-utils.ts` for pixel calculations:**

```typescript
import { SIDEBAR_DIMENSIONS, getDesktopLeftOffset, getMobileBottomOffset } from './shared/layout-utils';

// Get pixel offsets for positioning fixed/absolute elements
const leftOffset = getDesktopLeftOffset({ hasSecondarySidebar: true });
const bottomOffset = getMobileBottomOffset({ hasSecondarySidebar: true });
```

**Available exports:**
- `SIDEBAR_DIMENSIONS` - Pixel constants for all sidebar widths/heights
- `getDesktopLeftOffset(options)` - Returns total left offset in pixels
- `getMobileBottomOffset(options)` - Returns total bottom offset in pixels

**Note:** For main content layout, use explicit Tailwind classes in templates (see `SoloRPG.svelte`). Dynamic class generation doesn't work with Tailwind JIT.

**Other utility classes:**
- `.srpg-scroll-with-sidebars` - Adds proper padding for scrollable content
- Modal positioning handled by `.srpg-modal` in `solo-rpg-styles.css`

## Gotchas

- Campaign must be active for most views to work (check `$activeCampaign`)
- Map coordinates are in tile units, not pixels
- Character abilities have both `score` and `modifier` fields
- Chronicle entries have different content shapes based on `type` field
- Theme applies via `data-theme` attribute on document root
