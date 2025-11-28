# Solo RPG Design System

> **For AI assistants**: When generating UI components for this project, follow the patterns and conventions documented below. Use the existing CSS classes and variables rather than creating new styles inline.

## Tech Stack

- **Framework**: Svelte (within Astro)
- **Styling**: CSS custom properties + utility classes (Tailwind available but prefer design tokens)
- **Theme Support**: Light/Dark mode via `data-theme` attribute

---

## 🔀 Hybrid| Class | Purpose |

| ------------------------ | --------------------------------------- |
| `.srpg-empty-state` | Centered flex container with padding |
| `.srpg-empty-state-icon` | Muted, semi-transparent icon |
| `.srpg-empty-state-text` | Main message (medium weight, secondary) |
| `.srpg-empty-state-hint` | Smaller hint text (muted color) |

---

## 📝 Note View

For displaying and editing notes/entries in detail views (like Codex entries).

### Note View Structure

```svelte
<div class="srpg-note-view">
    <div class="srpg-note-header">
        <div class="srpg-note-meta-row">
            <span class="srpg-badge">
                <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="currentColor"
                    aria-hidden="true">
                    <!-- category icon -->
                </svg>
                Category
            </span>
            <span class="srpg-badge srpg-badge-info">Subcategory</span>
        </div>

        <!-- Display mode -->
        <h1 class="srpg-note-title">Note Title</h1>

        <!-- Edit mode -->
        <input type="text" class="srpg-note-title-input" value="Note Title" />

        <div class="srpg-note-dates">
            <span>Created: Jan 15, 2025</span>
            <span>Updated: Jan 20, 2025</span>
        </div>
    </div>

    <div class="srpg-note-content">
        <!-- Display mode -->
        <div class="srpg-note-display">Note content goes here...</div>

        <!-- Edit mode -->
        <textarea class="srpg-textarea" placeholder="Write your notes here..."></textarea>
    </div>
</div>
```

### Note View Elements

| Class                    | Purpose                                   |
| ------------------------ | ----------------------------------------- |
| `.srpg-note-view`        | Main container with flex column layout    |
| `.srpg-note-header`      | Header section with metadata and title    |
| `.srpg-note-meta-row`    | Flex row for badges/tags                  |
| `.srpg-note-title`       | Display-mode title (h1 styled)            |
| `.srpg-note-title-input` | Edit-mode title input field               |
| `.srpg-note-dates`       | Muted timestamp display                   |
| `.srpg-note-content`     | Content container                         |
| `.srpg-note-display`     | Read-only content display with background |

---

## 📋 Nested Lists

For hierarchical data with expandable groups and subgroups.

### Nested List Structure

```svelte
<div class="srpg-nested-list">
    <div class="group-section">
        <div class="srpg-group-header" role="button" tabindex="0">
            <div class="srpg-group-title">
                <span class="srpg-expand-icon" class:expanded={isExpanded}>
                    <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        aria-hidden="true">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </span>
                <svg
                    class="srpg-group-icon"
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="currentColor"
                    aria-hidden="true">
                    <!-- Group icon -->
                </svg>
                <span>Group Name</span>
                <span class="srpg-group-count">5</span>
            </div>
        </div>

        {#if isExpanded}
            <div class="srpg-subgroup-container">
                <div class="subgroup-section">
                    <div class="srpg-subgroup-header" role="button" tabindex="0">
                        <div class="srpg-subgroup-title">
                            <span class="srpg-expand-icon" class:expanded={isSubExpanded}>
                                <svg><!-- chevron --></svg>
                            </span>
                            <span>Subgroup Name</span>
                            <span class="srpg-group-count">3</span>
                        </div>
                    </div>

                    {#if isSubExpanded}
                        <div class="srpg-notes-container">
                            <div class="srpg-list">
                                <div class="srpg-list-item" role="button" tabindex="0">
                                    <div class="srpg-list-item-header">
                                        <span class="srpg-list-item-title">Item Title</span>
                                    </div>
                                    <div class="srpg-list-item-meta">Updated Jan 15, 2025</div>
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        {/if}
    </div>
</div>
```

### Nested List Elements

| Class                      | Purpose                                      |
| -------------------------- | -------------------------------------------- |
| `.srpg-nested-list`        | Container for the full nested list           |
| `.srpg-group-header`       | Clickable group header with hover state      |
| `.srpg-group-title`        | Title container with icon and count          |
| `.srpg-group-icon`         | SVG icon for the group category              |
| `.srpg-group-count`        | Pill badge showing item count                |
| `.srpg-expand-icon`        | Chevron that rotates when `.expanded`        |
| `.srpg-subgroup-container` | Indented container for subgroups             |
| `.srpg-subgroup-header`    | Clickable subgroup header                    |
| `.srpg-subgroup-title`     | Subgroup title (smaller than group)          |
| `.srpg-notes-container`    | Container for list items within subgroup     |
| `.srpg-list`               | Flex column container for list items         |
| `.srpg-list-item`          | Clickable card-style list item               |
| `.srpg-list-item-header`   | Header row with title and optional badges    |
| `.srpg-list-item-title`    | Bold item title                              |
| `.srpg-list-item-meta`     | Secondary metadata (dates, etc.)             |
| `.srpg-character-badge`    | Small icon badge for special item indicators |

---

## 📝 Formsystem

This project uses a **hybrid approach** combining Tailwind utilities with CSS custom properties. Here's when to use each:

### When to Use Tailwind

Use Tailwind for **layout, spacing, and typography**:

```html
<!-- ✅ Layout -->
<div class="flex flex-col items-center justify-between">
    <div class="grid grid-cols-2 gap-4">
        <!-- ✅ Spacing -->
        <div class="m-2 gap-3 p-4">
            <div class="mt-6 mb-4 px-6">
                <!-- ✅ Typography -->
                <h1 class="text-2xl font-bold">
                    <p class="text-sm font-medium">
                        <!-- ✅ Sizing -->
                    </p>

                    <div class="h-12 w-full max-w-md">
                        <!-- ✅ Responsive breakpoints -->
                        <div class="hidden md:flex lg:grid-cols-3"></div>
                    </div>
                </h1>
            </div>
        </div>
    </div>
</div>
```

### When to Use CSS Variables

Use CSS variables (via arbitrary values) for **colors, borders, and shadows**:

```html
<!-- ✅ Backgrounds -->
<div class="bg-(--card-bg)">
    <div class="bg-(--bg-secondary)">
        <!-- ✅ Text colors -->
        <p class="text-(--text-primary)">
            <span class="text-(--text-muted)">
                <!-- ✅ Borders -->
                <div class="border border-(--border-primary)">
                    <!-- ✅ Shadows (use CSS variable or Tailwind) -->
                    <div class="shadow-md"><!-- Tailwind OK for shadows --></div>
                </div>
            </span>
        </p>
    </div>
</div>
```

### When to Use `srpg-*` Classes

Use the design system classes for **complex, reusable components**:

```html
<!-- ✅ Buttons (always use srpg-b system) -->
<button class="srpg-b srpg-b-normal">Action</button>
<button class="srpg-b srpg-b-danger srpg-b-sm">Delete</button>

<!-- ✅ Forms -->
<div class="srpg-form-field">
    <label>Name</label>
    <input type="text" />
</div>

<!-- ✅ Modals -->
<div class="srpg-modal">
    <div class="srpg-modal-content">...</div>
</div>

<!-- ✅ Cards -->
<div class="info-card">...</div>
<div class="banner">...</div>
```

### Combined Example

```html
<!-- Hybrid approach in practice -->
<div class="flex flex-col gap-4 rounded-lg border border-(--card-border) bg-(--card-bg) p-6">
    <h2 class="text-xl font-bold text-(--text-primary)">Card Title</h2>
    <p class="text-sm text-(--text-secondary)">Card description goes here.</p>
    <div class="srpg-b-group">
        <button class="srpg-b srpg-b-simple">Cancel</button>
        <button class="srpg-b srpg-b-normal">Confirm</button>
    </div>
</div>
```

### Quick Reference Table

| Use Case            | Approach      | Example                        |
| ------------------- | ------------- | ------------------------------ |
| Layout/Flexbox/Grid | Tailwind      | `flex`, `grid`, `items-center` |
| Spacing             | Tailwind      | `p-4`, `gap-3`, `mt-6`         |
| Typography          | Tailwind      | `text-lg`, `font-bold`         |
| Responsive          | Tailwind      | `md:flex`, `lg:hidden`         |
| Flex wrap control   | Tailwind      | `flex-wrap`, `flex-nowrap`     |
| Background colors   | CSS Variable  | `bg-(--bg-primary)`            |
| Text colors         | CSS Variable  | `text-(--text-primary)`        |
| Borders             | CSS Variable  | `border-(--border-primary)`    |
| Buttons             | srpg-\* class | `srpg-b srpg-b-normal`         |
| Forms               | srpg-\* class | `srpg-form-field`              |
| Modals              | srpg-\* class | `srpg-modal`                   |
| Sidebar Items       | srpg-\* class | `srpg-sidebar-item`            |
| Collapsible Section | srpg-\* class | `srpg-collapsible-section`     |
| Empty States        | srpg-\* class | `srpg-empty-state`             |
| Note Views          | srpg-\* class | `srpg-note-view`               |
| Nested Lists        | srpg-\* class | `srpg-nested-list`             |
| List Items          | srpg-\* class | `srpg-list-item`               |
| Badges              | srpg-\* class | `srpg-badge`                   |

---

## 🎨 Color System

### Using Colors

**Always use CSS variables** — never hardcode colors:

```css
/* ✅ Correct */
background-color: var(--bg-primary);
color: var(--text-primary);

/* ❌ Wrong */
background-color: #1a1a1a;
color: white;
```

### Core Color Tokens

| Token                | Purpose                               |
| -------------------- | ------------------------------------- |
| `--bg-primary`       | Main background                       |
| `--bg-secondary`     | Secondary/card backgrounds            |
| `--bg-tertiary`      | Hover states, subtle backgrounds      |
| `--bg-elevated`      | Elevated surfaces (modals, dropdowns) |
| `--text-primary`     | Main text                             |
| `--text-secondary`   | Secondary/label text                  |
| `--text-muted`       | Placeholder, disabled text            |
| `--border-primary`   | Default borders                       |
| `--border-secondary` | Hover/focus borders                   |
| `--card-bg`          | Card background                       |
| `--card-border`      | Card borders                          |

### Accent Colors

| Token              | Purpose                        |
| ------------------ | ------------------------------ |
| `--accent-primary` | Primary actions (blue)         |
| `--accent-success` | Success/create actions (green) |
| `--accent-danger`  | Destructive actions (red)      |
| `--accent-warning` | Warnings (orange)              |
| `--accent-info`    | Info/highlights (indigo)       |

Each accent has `-hover` and `-active` variants (e.g., `--accent-primary-hover`).

### Shadows

```css
--shadow-sm   /* Subtle shadow */
--shadow-md   /* Default shadow */
--shadow-lg   /* Elevated shadow */
```

---

## 🔘 Buttons

### Button Classes

Use the composable `srpg-b-*` button system:

```html
<!-- Primary button -->
<button class="srpg-b srpg-b-normal">Action</button>

<!-- Success/Create button -->
<button class="srpg-b srpg-b-create">Create</button>

<!-- Danger/Delete button -->
<button class="srpg-b srpg-b-danger">Delete</button>
<button class="srpg-b srpg-b-delete">Delete</button>

<!-- Simple/secondary button -->
<button class="srpg-b srpg-b-simple">Cancel</button>

<!-- Icon button -->
<button class="srpg-b-icon">✕</button>
<button class="srpg-b-icon delete-icon">🗑</button>
```

### Button Sizes

```html
<button class="srpg-b srpg-b-normal srpg-b-sm">Small</button>
<button class="srpg-b srpg-b-normal">Default</button>
<button class="srpg-b srpg-b-normal srpg-b-lg">Large</button>
<button class="srpg-b srpg-b-normal srpg-b-xl">Extra Large</button>
```

### Button Widths

```html
<button class="srpg-b srpg-b-normal srpg-b-w-full">Full Width</button>
<button class="srpg-b srpg-b-normal srpg-b-w-fill">Flex Fill</button>
<button class="srpg-b srpg-b-normal srpg-b-w-lg">Fixed 300px</button>
```

### Button Groups

```html
<!-- Horizontal group -->
<div class="srpg-b-group">
    <button class="srpg-b srpg-b-simple">Cancel</button>
    <button class="srpg-b srpg-b-normal">Confirm</button>
</div>

<!-- Vertical group -->
<div class="srpg-b-group-vertical">
    <button class="srpg-b srpg-b-normal srpg-b-w-full">Option 1</button>
    <button class="srpg-b srpg-b-normal srpg-b-w-full">Option 2</button>
</div>
```

---

## 📱 Sidebar Items

The sidebar uses a consistent component-based styling system. All sidebar buttons use the `.srpg-sidebar-item` class with modifier classes for different states.

### Basic Sidebar Item

```html
<button class="srpg-sidebar-item" aria-label="Home">
    <svg class="sidebar-icon" viewBox="0 0 24 24">...</svg>
    <span class="sidebar-label">Home</span>
</button>
```

### Active/Selected State

Use the `.active` class or Svelte's `class:active` directive for **navigation/permanent state**:

```svelte
<button class="srpg-sidebar-item" class:active={currentView === "home"} aria-label="Home">
    <svg class="sidebar-icon">...</svg>
    <span class="sidebar-label">Home</span>
</button>
```

Use the `.selected` class for **temporary filtering/selection** (lighter visual treatment):

```svelte
<button
    class="srpg-sidebar-item"
    class:selected={selectedSections.has("abilities")}
    aria-label="Abilities">
    <svg class="sidebar-icon">...</svg>
</button>
```

**Visual differences:**

- Both `.active` and `.selected` add the same border accent and background
- `.selected` additionally adds a drop-shadow glow effect to the icon
- `.active` is for persistent navigation state; `.selected` is for temporary filtering

### Toggleable Items (for edit modes)

For items that can be toggled on/off (like character sheet sections in edit mode):

```svelte
<button
    class="srpg-sidebar-item toggleable"
    class:show-indicator={isEditingSections}
    class:active={isEditingSections && isVisible}
    class:toggled-on={isEditingSections && isVisible}
    class:toggled-off={isEditingSections && !isVisible}
    class:required={isEditingSections && isRequired}>
    <svg class="sidebar-icon">...</svg>
</button>
```

**Modifier classes:**

- `.toggleable` - Enables toggle indicator dot
- `.show-indicator` - Makes the indicator dot visible
- `.toggled-on` - Green indicator, item is enabled
- `.toggled-off` - Faded appearance (40% opacity), item is disabled
- `.required` - Amber indicator, item cannot be toggled off
- `.selected` - Used in view mode for filtering (not edit mode)

### Color Swatches

For color palette items:

```html
<button class="srpg-sidebar-item" class:active="{isSelected}">
    <div class="color-swatch" style="background: #ff5500"></div>
</button>

<!-- Clear/eraser option -->
<button class="srpg-sidebar-item">
    <div class="color-swatch clear-pattern"></div>
</button>
```

### Tile Previews

For tile/sprite selection:

```html
<button class="srpg-sidebar-item" class:active="{isSelected}">
    <div class="tile-preview">
        <div style="background-image: url(...); ..."></div>
    </div>
</button>
```

### Sidebar Divider

For visual separation between groups:

```html
<div class="srpg-sidebar-divider"></div>
```

### Visual States Summary

| State           | Mobile                                    | Desktop                                    |
| --------------- | ----------------------------------------- | ------------------------------------------ |
| Default         | Transparent background                    | Transparent background                     |
| Hover           | `--sidebar-hover` background              | `--sidebar-hover` background               |
| Active/Selected | `--sidebar-active` bg + top border accent | `--sidebar-active` bg + left border accent |
| Disabled        | 50% opacity, no cursor                    | 50% opacity, no cursor                     |
| Toggleable Off  | 40% opacity                               | 40% opacity                                |

---

## 🏷️ Badges

For displaying labels, categories, and status indicators.

### Basic Badge

```html
<span class="srpg-badge">Default Badge</span>
<span class="srpg-badge srpg-badge-info">Info Badge</span>
<span class="srpg-badge srpg-badge-warning">Warning Badge</span>
<span class="srpg-badge srpg-badge-danger">Danger Badge</span>
```

### Badge with Icon

```html
<span class="srpg-badge">
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
        <!-- icon path -->
    </svg>
    Category Name
</span>
```

### Badge Sizes

```html
<span class="srpg-badge">Default</span>
<span class="srpg-badge srpg-badge-sm">Small</span>
```

### Badge Variants

| Class                 | Color  | Use Case                       |
| --------------------- | ------ | ------------------------------ |
| `.srpg-badge`         | Green  | Default/success state          |
| `.srpg-badge-info`    | Blue   | Informational, subcategories   |
| `.srpg-badge-warning` | Orange | Warnings, special indicators   |
| `.srpg-badge-danger`  | Red    | Errors, destructive indicators |
| `.srpg-badge-sm`      | -      | Smaller padding and font size  |

---

## 📦 Cards & Containers

### Info Card

```html
<div class="info-card">
    <h2>Title</h2>
    <p>Content goes here</p>
</div>
```

### Banner (Featured Content)

```html
<div class="banner">
    <h2 class="banner-title">Welcome</h2>
    <p class="banner-subtitle">Subtitle text</p>
    <div class="banner-actions">
        <button class="srpg-b srpg-b-normal">Action</button>
    </div>
</div>
```

### Overview Button (Clickable Card)

```html
<button class="srpg-b-overview">
    <h3>Campaign Name</h3>
    <p>Description</p>
</button>
```

---

## � Collapsible Sections

For mobile-friendly sections that can expand/collapse to save space. Useful for grouping related content that users may not need to see all at once.

### Basic Collapsible Section

```svelte
<section class="srpg-collapsible-section">
    <button
        class="srpg-collapsible-header"
        class:expanded={isExpanded}
        on:click={() => (isExpanded = !isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="section-content">
        <h2 class="srpg-collapsible-title">Section Title</h2>
        <span class="srpg-collapsible-count">5</span>
        <svg
            class="srpg-collapsible-chevron"
            class:rotated={isExpanded}
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            aria-hidden="true">
            <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round" />
        </svg>
    </button>

    {#if isExpanded}
        <div id="section-content" class="srpg-collapsible-content">
            <!-- Content here -->
        </div>
    {/if}
</section>
```

### Collapsible Section Elements

| Class                               | Purpose                                           |
| ----------------------------------- | ------------------------------------------------- |
| `.srpg-collapsible-section`         | Container with card styling (bg, border, rounded) |
| `.srpg-collapsible-header`          | Clickable header button with hover state          |
| `.srpg-collapsible-header.expanded` | Adds bottom border when section is open           |
| `.srpg-collapsible-title`           | Section heading (h2) styled for inline display    |
| `.srpg-collapsible-count`           | Badge showing item count (pill-shaped)            |
| `.srpg-collapsible-chevron`         | Chevron icon for expand/collapse indication       |
| `.srpg-collapsible-chevron.rotated` | Rotates chevron 180° when expanded                |
| `.srpg-collapsible-content`         | Content container with padding                    |

### Accessibility Notes

- Always use `aria-expanded` on the header button
- Use `aria-controls` to link header to content region
- Content should have a matching `id`

---

## 🔲 Empty States

For displaying helpful messages when a list or section has no content.

### Basic Empty State

```html
<div class="srpg-empty-state">
    <svg
        class="srpg-empty-state-icon"
        viewBox="0 0 24 24"
        width="32"
        height="32"
        fill="none"
        aria-hidden="true"
    >
        <!-- Icon SVG path -->
    </svg>
    <p class="srpg-empty-state-text">No items yet</p>
    <p class="srpg-empty-state-hint">Create one to get started!</p>
</div>
```

### Empty State Elements

| Class                    | Purpose                                 |
| ------------------------ | --------------------------------------- |
| `.srpg-empty-state`      | Centered flex container with padding    |
| `.srpg-empty-state-icon` | Muted, semi-transparent icon            |
| `.srpg-empty-state-text` | Main message (medium weight, secondary) |
| `.srpg-empty-state-hint` | Smaller hint text (muted color)         |

---

## �📝 Forms

### Form Structure

```html
<div class="srpg-form-grid">
    <div class="srpg-form-field">
        <label for="name">Name</label>
        <input type="text" id="name" placeholder="Enter name" />
    </div>

    <div class="srpg-form-field">
        <label for="type">Type</label>
        <select id="type">
            <option>Option 1</option>
        </select>
    </div>
</div>
```

### Form Field Styling

Form inputs automatically get themed styling when inside `.srpg-form-field`:

- Background: `var(--input-bg)`
- Border: `var(--input-border)`
- Focus: `var(--input-border-focus)` with shadow

---

## 🪟 Modals

### Modal Structure

```html
<div class="srpg-modal">
    <div class="srpg-modal-content">
        <!-- Close button -->
        <button class="srpg-b-modal-nav srpg-b-modal-nav-close">✕</button>

        <!-- Optional back button -->
        <button class="srpg-b-modal-nav srpg-b-modal-nav-back">←</button>

        <h2>Modal Title</h2>
        <p>Modal content</p>

        <div class="srpg-b-group">
            <button class="srpg-b srpg-b-simple">Cancel</button>
            <button class="srpg-b srpg-b-normal">Confirm</button>
        </div>
    </div>
</div>
```

---

## 📐 Layout Patterns

### Tool Grid

For displaying tool/option buttons in a responsive grid:

```html
<div class="srpg-tool-grid">
    <button class="srpg-b-overview">Tool 1</button>
    <button class="srpg-b-overview">Tool 2</button>
</div>
```

### Spacing Convention

- **Small gaps**: `0.5rem` (8px)
- **Default gaps**: `0.75rem` (12px) or `1rem` (16px)
- **Section spacing**: `1.5rem` (24px) or `2rem` (32px)
- **Page padding**: `1rem` mobile, `1.5rem`+ desktop

---

## 🌗 Theme Support

### Applying Theme

The theme is controlled via `data-theme` attribute on the main container:

```svelte
<main data-theme={$theme}>
    <!-- Content -->
</main>
```

### Theme-Aware Custom Styles

```css
/* Default (light theme) styles */
.my-component {
    background: var(--bg-primary);
}

/* Dark theme overrides if needed */
[data-theme="dark"] .my-component {
    /* Usually not needed if using CSS variables */
}
```

---

## 📏 Typography

### Font Sizes

- **Headings**: Use Tailwind or standard sizes
    - h1: `text-4xl` / `2.25rem`
    - h2: `text-2xl` / `1.5rem`
    - h3: `text-xl` / `1.25rem`
- **Body**: `1rem` (16px)
- **Small**: `0.875rem` (14px)
- **Tiny**: `0.75rem` (12px)

### Font Weights

- **Normal**: 400
- **Medium**: 500 (buttons)
- **Semibold**: 600 (labels)
- **Bold**: 700 (headings)
- **Extra Bold**: 800 (banner titles)

---

## ✅ Component Checklist for AI

When creating new UI components:

1. **Use CSS variables** for all colors, shadows, and borders
2. **Use `srpg-b-*` classes** for buttons
3. **Use `srpg-form-field`** for form inputs
4. **Ensure theme support** — test both light and dark modes
5. **Use existing patterns** from this guide before creating new ones
6. **Keep responsive** — mobile-first with `md:` breakpoints
7. **Match existing spacing** — `0.5rem`, `0.75rem`, `1rem` increments

---

## 📁 File Structure

```
solo-rpg/
├── solo-rpg-styles.css      # Global component styles
├── theme/
│   ├── theme-variables.css  # CSS custom properties
│   ├── theme-store.ts       # Svelte theme store
│   └── ThemeToggle.svelte   # Theme toggle component
├── shared/
│   ├── modal/               # Reusable modal components
│   └── layout/              # Layout components
└── [feature]/               # Feature-specific components
```

---

## 🚫 Anti-Patterns

Avoid these common mistakes:

```css
/* ❌ Don't hardcode colors */
color: #333;
background: white;

/* ❌ Don't use inline styles for theming */
style="background: black"

/* ❌ Don't create one-off button styles */
.my-special-button { ... }

/* ❌ Don't mix spacing systems */
padding: 7px 13px;  /* Use rem-based values */
```

```html
<!-- ❌ Don't use emoji icons -->
<button>🎲 Roll Dice</button>
<span>✕</span>

<!-- ✅ Use SVG icons instead -->
<button>
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
        <!-- dice icon path -->
    </svg>
    Roll Dice
</button>
```

---

## 🎨 Icons

**Always use SVG icons** — never use emoji characters for icons:

- SVG icons scale properly and look crisp at all sizes
- SVG icons can be styled with CSS (color, size, stroke-width)
- SVG icons are more accessible with proper `aria-hidden="true"` attributes
- Emoji rendering varies across platforms and can look inconsistent

### Icon Sizing

| Context         | Size                       |
| --------------- | -------------------------- |
| Small buttons   | `width="16"` `height="16"` |
| Default buttons | `width="18"` `height="18"` |
| Large buttons   | `width="20"` `height="20"` |
| Sidebar icons   | `width="24"` `height="24"` |

### Icon Styling

```html
<svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" class="shrink-0">
    <path stroke="currentColor" stroke-width="2" d="..." />
</svg>
```

---

## 💡 Tips for AI Assistants

1. **Ask for this file** if not provided — it ensures consistency
2. **Prefer composition** — combine existing classes rather than new CSS
3. **Check theme compatibility** — use variables that work in both themes
4. **Follow existing patterns** — look at similar components in the codebase
5. **Keep it simple** — this is a personal project, avoid over-engineering
