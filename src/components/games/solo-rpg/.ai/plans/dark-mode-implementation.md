# Dark Mode Implementation Plan

**Created:** October 13, 2025  
**Status:** Planning

## Overview

Implement a comprehensive dark mode feature for the Solo RPG application with a toggle in the Settings page. Currently, the three Sidebar components use dark styling while the rest of the application uses light styling. This plan will unify the theming system and allow users to switch between light and dark modes.

## TODO Checklist

### Phase 1: Foundation 🔄
- [x] Create `theme/theme-store.ts` with theme state management
- [x] Create `theme/theme-variables.css` with CSS custom properties
- [x] Update `solo-rpg-styles.css` to import and use CSS variables
- [x] Replace hardcoded colors in button classes with CSS variables
- [x] Replace hardcoded colors in info-card class with CSS variables
- [x] Test basic theme variable system works

### Phase 2: Core Integration ✅
- [x] Import theme store in `SoloRPG.svelte`
- [x] Add `data-theme` attribute binding to main content element
- [x] Create `theme/ThemeToggle.svelte` component
- [x] Design toggle UI (light/dark switch with icons)
- [x] Add accessibility features to toggle (ARIA, keyboard nav)
- [x] Integrate ThemeToggle into Settings view
- [x] Add "Appearance" section heading in Settings
- [x] Test theme switching works at root level
- [x] Verify theme persists in localStorage

### Phase 3: Sidebar Components ✅
- [x] Update `Sidebar.svelte` to use CSS variables
- [x] Update `SecondarySidebar.svelte` to use CSS variables
- [x] Update `TertiarySidebar.svelte` to use CSS variables
- [x] Test all sidebars in both light and dark modes
- [x] Verify hover/active states work in both themes

### Phase 4: Main Views ⏳
- [ ] Update Home view styles in `SoloRPG.svelte`
- [ ] Update Oracle view styles in `SoloRPG.svelte`
- [ ] Update Settings view styles in `SoloRPG.svelte`
- [ ] Update Map view container styles
- [ ] Update Story view container styles
- [ ] Test navigation between views in both themes

### Phase 5: Data & Settings Components ⏳
- [ ] Update `data/DataManager.svelte` styles
- [ ] Test import/export UI in both themes
- [ ] Verify file input visibility in both themes

### Phase 6: Game Management Components ⏳
- [ ] Update `game-management/GameBlueprintEditor.svelte`
- [ ] Update `game-management/CampaignCreator.svelte`
- [ ] Update `game-management/CampaignLoadConfirm.svelte`
- [ ] Test modal backgrounds and overlays
- [ ] Test form inputs visibility and readability
- [ ] Test all buttons in modals

### Phase 7: Oracle Components ⏳
- [ ] Update `oracle/GameOracle.svelte`
- [ ] Update `oracle/components/FortuneList.svelte`
- [ ] Update `oracle/components/FortuneEditor.svelte`
- [ ] Update `oracle/components/FateConsultation.svelte`
- [ ] Update `oracle/components/dice-roller/DiceRoller.svelte`
- [ ] Update `oracle/components/dice-roller/DiceRollerEmbed.svelte`
- [ ] Update dice roller sub-components (DiceIcon, DiceDisplay, ResultOptionIcon)
- [ ] Update `oracle/components/card-dealer/CardDealer.svelte`
- [ ] Test dice visuals in both themes
- [ ] Test card visuals in both themes
- [ ] Test fortune tables in both themes

### Phase 8: Chronicle/Story Components ⏳
- [ ] Update `lore/StoryView.svelte`
- [ ] Update `lore/chronicle/Chronicle.svelte`
- [ ] Update `lore/chronicle/EntryCard.svelte`
- [ ] Update `lore/chronicle/EntryEditor.svelte`
- [ ] Update `lore/chronicle/EntryActions.svelte`
- [ ] Update `lore/chronicle/entry-types/ManualEntryContent.svelte`
- [ ] Update `lore/chronicle/entry-types/CardsEntryContent.svelte`
- [ ] Update `lore/chronicle/entry-types/DiceEntryContent.svelte`
- [ ] Update `lore/chronicle/entry-types/FortuneEntryContent.svelte`
- [ ] Update `lore/chronicle/entry-types/EntryNotes.svelte`
- [ ] Test timeline visuals in both themes
- [ ] Test entry cards readability in both themes

### Phase 9: Character Components ⏳
- [ ] Update `lore/characters/CharacterManager.svelte`
- [ ] Update `lore/characters/CharacterSheet.svelte`
- [ ] Update `lore/characters/CharacterSheetSection.svelte`
- [ ] Update `lore/characters/CharacterSheetControls.svelte`
- [ ] Update `lore/characters/SectionPickerModal.svelte`
- [ ] Update `lore/characters/TagPickerModal.svelte`
- [ ] Test character sheet in both themes
- [ ] Test character creation/editing in both themes

### Phase 10: Codex & Map ⏳
- [ ] Update `lore/codex/Codex.svelte`
- [ ] Update `map/MapView.svelte`
- [ ] Test codex entries in both themes
- [ ] Test map canvas and controls in both themes

### Phase 11: Shared Components ⏳
- [ ] Update `shared/FloatingOracleButton.svelte`
- [ ] Update `shared/CharacterSelector.svelte`
- [ ] Update `shared/modal/SrpgModal.svelte`
- [ ] Update `shared/modal/TemplateModal.svelte`
- [ ] Update `NoCampaignOverlay.svelte`
- [ ] Test floating button in both themes
- [ ] Test modals in both themes

### Phase 12: Visual Testing ⏳
- [ ] All text readable in light mode
- [ ] All text readable in dark mode
- [ ] Buttons have proper contrast in light mode
- [ ] Buttons have proper contrast in dark mode
- [ ] Form inputs clearly visible in light mode
- [ ] Form inputs clearly visible in dark mode
- [ ] Borders and dividers visible in both themes
- [ ] Shadows appropriate in both themes
- [ ] Hover states visible and clear in both themes
- [ ] Active/selected states clear in both themes
- [ ] Modal overlays appropriate in both themes
- [ ] Run contrast checker on all UI elements
- [ ] Test focus indicators in both themes

### Phase 13: Functionality Testing ⏳
- [ ] Theme persists across page reloads
- [ ] Theme persists across view navigation
- [ ] Toggle responds immediately
- [ ] No flash of wrong theme on initial load
- [ ] Works on mobile (portrait)
- [ ] Works on mobile (landscape)
- [ ] Works on tablet
- [ ] Works on desktop
- [ ] localStorage saves correctly
- [ ] localStorage loads correctly

### Phase 14: Edge Cases ⏳
- [ ] First-time user (no localStorage) defaults correctly
- [ ] Invalid localStorage value handled gracefully
- [ ] Rapid theme switching doesn't break UI
- [ ] Theme switch during page transitions works
- [ ] Theme switch with modals open works correctly
- [ ] Theme switch during animations doesn't cause issues

### Phase 15: Documentation & Cleanup ⏳
- [ ] Add JSDoc comments to theme store functions
- [ ] Document CSS variable naming convention
- [ ] Add inline comments for complex theme logic
- [ ] Update README with theme info (if applicable)
- [ ] Remove any console.logs or debug code
- [ ] Code cleanup and formatting pass
- [ ] Final QA review

### Progress Summary
- **Total Tasks:** 20/150+
- **Phase 1-2 (Foundation):** 15/15 ✅
- **Phase 3-11 (Components):** 5/90+ 🔄
- **Phase 12-14 (Testing):** 0/35+ ⏳
- **Phase 15 (Docs):** 0/6 ⏳

**Legend:** ⏳ = Not Started | 🔄 = In Progress | ✅ = Complete

## Current State Analysis

### Dark-Styled Components
- `Sidebar.svelte` - Primary left sidebar with dark background
- `SecondarySidebar.svelte` - Story view tabs sidebar with dark styling  
- `TertiarySidebar.svelte` - Character sheet section controls with dark styling

### Light-Styled Components
- Main content areas (`SoloRPG.svelte`)
- All view components (Home, Oracle, Settings, Map, Story)
- All child components (DataManager, GameOracle, StoryView, MapView, etc.)
- Modal components (GameBlueprintEditor, CampaignCreator, etc.)
- Shared components (FloatingOracleButton, CharacterSelector, modals)
- Oracle components (DiceRoller, CardDealer, FortuneList, etc.)
- Story/Lore components (Chronicle, Characters, Codex)

### Global Styles
- `solo-rpg-styles.css` - Contains button styles and info cards (light mode)

## Implementation Strategy

### Phase 1: Theme Infrastructure (Foundation)

#### 1.1 Create Theme Store
**File:** `src/components/games/solo-rpg/theme/theme-store.ts`

Create a Svelte store to manage theme state:
- Store theme preference (`'light'` or `'dark'`)
- Initialize from localStorage on mount
- Provide methods to toggle theme
- Auto-save to localStorage on change
- Export reactive store and helper functions

```typescript
// Pseudocode structure
export const theme = writable<'light' | 'dark'>('light');
export function toggleTheme();
export function setTheme(newTheme: 'light' | 'dark');
export function initializeTheme(); // Load from localStorage
```

#### 1.2 Create CSS Variables System
**File:** `src/components/games/solo-rpg/theme/theme-variables.css`

Define CSS custom properties for both themes:

**Color Variables to Define:**
- Background colors (primary, secondary, tertiary)
- Text colors (primary, secondary, muted)
- Border colors
- Shadow colors
- Accent colors (info, success, warning, danger)
- Button colors
- Card/panel colors
- Sidebar colors
- Input/form colors
- Modal overlay colors

**Structure:**
```css
:root {
  /* Light theme variables */
}

[data-theme="dark"] {
  /* Dark theme variables */
}
```

#### 1.3 Update Global Styles
**File:** `src/components/games/solo-rpg/solo-rpg-styles.css`

- Import theme variables
- Replace hardcoded colors with CSS variables
- Update button styles to use theme variables
- Update info-card styles to use theme variables
- Ensure all utility classes respect theme

### Phase 2: Root Theme Application

#### 2.1 Update SoloRPG Component
**File:** `src/components/games/solo-rpg/SoloRPG.svelte`

- Import theme store
- Subscribe to theme changes
- Add `data-theme` attribute to main element
- Apply theme class to content wrapper
- Ensure theme persists across navigation

```svelte
<script>
  import { theme } from './theme/theme-store';
  $: dataTheme = $theme;
</script>

<main class="content" data-theme={dataTheme}>
  <!-- content -->
</main>
```

### Phase 3: Component Updates

#### 3.1 Update Sidebar Components

**Files to update:**
- `Sidebar.svelte`
- `SecondarySidebar.svelte`
- `TertiarySidebar.svelte`

**Changes:**
- Convert inline dark styles to use CSS variables
- Ensure styles adapt to theme changes
- Make dark/light mode consistent with app theme
- Update hover/active states to use theme variables

#### 3.2 Update Main View Components

**Files to update:**
- Home view styles in `SoloRPG.svelte`
- Oracle view styles
- Settings view styles

**Changes:**
- Replace hardcoded colors with CSS variables
- Update text colors, backgrounds, borders
- Ensure readability in both themes

#### 3.3 Update Data Manager
**File:** `src/components/games/solo-rpg/data/DataManager.svelte`

- Update component styles to use theme variables
- Ensure buttons, cards, and text adapt to theme

#### 3.4 Update Game Management Components

**Files to update:**
- `game-management/GameBlueprintEditor.svelte`
- `game-management/CampaignCreator.svelte`
- `game-management/CampaignLoadConfirm.svelte`

**Changes:**
- Modal backgrounds and overlays
- Form inputs and labels
- Button styles (already using utility classes, but verify)

#### 3.5 Update Oracle Components

**Files to update:**
- `oracle/GameOracle.svelte`
- `oracle/components/FortuneList.svelte`
- `oracle/components/FortuneEditor.svelte`
- `oracle/components/FateConsultation.svelte`
- `oracle/components/dice-roller/DiceRoller.svelte`
- `oracle/components/dice-roller/DiceRollerEmbed.svelte`
- `oracle/components/dice-roller/components/*`
- `oracle/components/card-dealer/CardDealer.svelte`

**Changes:**
- Update all component-specific styles
- Dice and card visuals should work in both themes
- Result displays and panels

#### 3.6 Update Lore/Story Components

**Files to update:**
- `lore/StoryView.svelte`
- `lore/chronicle/Chronicle.svelte`
- `lore/chronicle/EntryCard.svelte`
- `lore/chronicle/EntryEditor.svelte`
- `lore/chronicle/EntryActions.svelte`
- `lore/chronicle/entry-types/*`
- `lore/characters/CharacterManager.svelte`
- `lore/characters/CharacterSheet.svelte`
- `lore/characters/CharacterSheetSection.svelte`
- `lore/characters/CharacterSheetControls.svelte`
- `lore/characters/SectionPickerModal.svelte`
- `lore/characters/TagPickerModal.svelte`
- `lore/codex/Codex.svelte`

**Changes:**
- Entry cards and timeline visuals
- Character sheet styling
- Form inputs and editors
- Modal components

#### 3.7 Update Map Component
**File:** `map/MapView.svelte`

- Update canvas/map backgrounds
- Ensure controls are visible in both themes

#### 3.8 Update Shared Components

**Files to update:**
- `shared/FloatingOracleButton.svelte`
- `shared/CharacterSelector.svelte`
- `shared/modal/SrpgModal.svelte`
- `shared/modal/TemplateModal.svelte`

**Changes:**
- Modal overlays and containers
- Floating button styles
- Selector dropdowns

#### 3.9 Update NoCampaignOverlay
**File:** `NoCampaignOverlay.svelte`

- Update overlay background and text
- Ensure visibility in both themes

### Phase 4: Settings Page Theme Toggle

#### 4.1 Create Theme Toggle Component
**File:** `src/components/games/solo-rpg/theme/ThemeToggle.svelte`

Create a dedicated toggle component:
- Visual toggle switch (light/dark icons)
- Current theme indicator
- Smooth transition animations
- Accessible (keyboard navigation, ARIA labels)
- Mobile-friendly touch target

**UI Design:**
```
[☀️ Light] [🌙 Dark]
```

or

```
Theme: [Toggle Switch] 🌙
```

#### 4.2 Integrate into Settings View
**File:** `SoloRPG.svelte` (settings view section)

- Import ThemeToggle component
- Place prominently in settings view
- Add section heading "Appearance"
- Position above or below DataManager

### Phase 5: Testing & Polish

#### 5.1 Visual Testing Checklist
- [ ] All text is readable in both themes
- [ ] Buttons have proper contrast
- [ ] Form inputs are clearly visible
- [ ] Borders and dividers are visible
- [ ] Shadows work in both themes
- [ ] Hover states are visible
- [ ] Active/selected states are clear
- [ ] Modal overlays are appropriate
- [ ] No color contrast issues (WCAG AA minimum)

#### 5.2 Component Testing Checklist
- [ ] Sidebars (all 3) adapt to theme
- [ ] Home view (campaigns, blueprints)
- [ ] Oracle view (dice, cards, fortunes)
- [ ] Settings view (including theme toggle)
- [ ] Map view
- [ ] Story view (chronicle, characters, codex)
- [ ] All modals and overlays
- [ ] Character sheets and editors
- [ ] Entry cards and editors

#### 5.3 Functionality Testing
- [ ] Theme persists across page reloads
- [ ] Theme persists across navigation
- [ ] Toggle responds immediately
- [ ] No flash of wrong theme on load
- [ ] Works on mobile devices
- [ ] Works on tablets
- [ ] Works on desktop
- [ ] localStorage correctly saves preference

#### 5.4 Edge Cases
- [ ] First-time user (no localStorage value)
- [ ] Invalid localStorage value
- [ ] Rapid theme switching
- [ ] Theme switch during animations
- [ ] Theme switch with modals open

### Phase 6: Documentation

#### 6.1 Code Documentation
- Add JSDoc comments to theme store functions
- Document CSS variable naming convention
- Add comments for complex theme-dependent styles

#### 6.2 User Documentation
- Update README if applicable
- Add section about theme preference
- Note that theme is saved locally

## Implementation Order

### Iteration 1: Foundation (Phase 1)
1. Create theme-store.ts
2. Create theme-variables.css
3. Update solo-rpg-styles.css to use variables
4. Test basic variable system

### Iteration 2: Core Integration (Phase 2)
1. Update SoloRPG.svelte with theme application
2. Create ThemeToggle component
3. Add toggle to Settings view
4. Test theme switching at root level

### Iteration 3: Component Updates - High Priority (Phase 3)
1. Update all three Sidebar components
2. Update main view containers
3. Update GameOracle and DiceRoller
4. Update StoryView and Chronicle
5. Test major user flows

### Iteration 4: Component Updates - Remaining (Phase 3 continued)
1. Update all modal components
2. Update character management components
3. Update entry type components
4. Update remaining oracle components
5. Update shared components

### Iteration 5: Polish & Testing (Phase 5)
1. Visual testing pass
2. Fix contrast issues
3. Test all interactions
4. Mobile testing
5. Edge case testing

### Iteration 6: Final Review (Phase 6)
1. Code cleanup
2. Documentation
3. Performance check
4. Final QA pass

## Color Palette Recommendations

### Light Theme (Current)
- **Background Primary:** `#ffffff`
- **Background Secondary:** `#f8f9fa` / `#fafbfc`
- **Background Tertiary:** `#e0e0e0`
- **Text Primary:** `#333333`
- **Text Secondary:** `#666666`
- **Text Muted:** `#999999`
- **Border:** `#e0e0e0`
- **Shadow:** `rgba(0, 0, 0, 0.1)`

### Dark Theme (Proposed)
- **Background Primary:** `#1a1a1a` / `#1e1e1e`
- **Background Secondary:** `#2a2a2a` / `#252525`
- **Background Tertiary:** `#3a3a3a` / `#333333`
- **Text Primary:** `#e0e0e0` / `#f5f5f5`
- **Text Secondary:** `#b0b0b0` / `#a0a0a0`
- **Text Muted:** `#808080` / `#707070`
- **Border:** `#404040` / `#3a3a3a`
- **Shadow:** `rgba(0, 0, 0, 0.3)`

### Accent Colors (Same for both themes, adjust opacity/saturation if needed)
- **Primary Blue:** `#1976d2` → `#42a5f5` (lighter for dark mode)
- **Success Green:** `#10b981` → `#4ade80` (lighter for dark mode)
- **Danger Red:** `#ef4444` → `#f87171` (lighter for dark mode)
- **Warning Yellow/Orange:** `#f59e0b` → `#fbbf24` (adjust as needed)

## Technical Considerations

### Performance
- CSS variables have minimal performance impact
- Theme switching should be instant
- No layout shift during theme change
- Consider using `prefers-color-scheme` media query as default

### Browser Support
- CSS custom properties (variables) supported in all modern browsers
- No polyfills needed for target audience

### Accessibility
- Ensure WCAG AA contrast ratios (4.5:1 for text)
- Provide clear toggle UI
- Respect `prefers-color-scheme` system preference initially
- Maintain focus indicators in both themes

### Mobile Considerations
- Touch-friendly toggle (minimum 44x44px)
- Test in both portrait and landscape
- Ensure sidebars look good in dark mode
- Test with mobile browser UI showing/hiding

## Future Enhancements (Post-MVP)

1. **System Theme Detection**
   - Detect `prefers-color-scheme` on first load
   - Use as default if no saved preference

2. **Additional Themes**
   - High contrast mode
   - Sepia/warm mode
   - Custom color schemes

3. **Per-Campaign Themes**
   - Allow different themes per campaign
   - Store preference with campaign data

4. **Smooth Transitions**
   - Add CSS transitions for theme changes
   - Fade between themes (optional, may be jarring)

5. **Theme Preview**
   - Show preview before applying
   - Sidebar preview in settings

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Colors have poor contrast in dark mode | High | Use contrast checker, test thoroughly |
| Theme doesn't persist | Medium | Test localStorage thoroughly, add fallbacks |
| Performance issues with many CSS variables | Low | CSS variables are performant, but test on older devices |
| Components missed in update | Medium | Create comprehensive checklist, systematic review |
| Flash of wrong theme on load | Low | Initialize theme before rendering, use inline script |

## Success Criteria

- ✅ Theme toggle present and functional in Settings
- ✅ All components adapt to theme changes
- ✅ Theme persists across sessions
- ✅ No accessibility issues (contrast, focus)
- ✅ Smooth user experience (no flashing)
- ✅ Mobile-friendly
- ✅ Consistent styling between sidebars and content
- ✅ All text readable in both modes
- ✅ All interactive elements visible in both modes

## Timeline Estimate

- **Iteration 1:** 2-3 hours
- **Iteration 2:** 2-3 hours
- **Iteration 3:** 4-6 hours
- **Iteration 4:** 4-6 hours
- **Iteration 5:** 3-4 hours
- **Iteration 6:** 1-2 hours

**Total Estimate:** 16-24 hours of development time

## Notes

- Start with high-traffic components (Home, Oracle, Story)
- Test frequently during implementation
- Get feedback early on dark theme colors
- Consider creating a theme preview mode during development
- Document any component-specific theme considerations
