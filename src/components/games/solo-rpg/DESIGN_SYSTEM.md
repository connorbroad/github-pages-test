# Solo RPG Design System

> **For AI assistants**: When generating UI components for this project, follow the patterns and conventions documented below. Use the existing CSS classes and variables rather than creating new styles inline.

## Tech Stack

- **Framework**: Svelte (within Astro)
- **Styling**: CSS custom properties + utility classes (Tailwind available but prefer design tokens)
- **Theme Support**: Light/Dark mode via `data-theme` attribute

---

## 🔀 Hybrid Styling System

This project uses a **hybrid approach** combining Tailwind utilities with CSS custom properties. Here's when to use each:

### When to Use Tailwind

Use Tailwind for **layout, spacing, and typography**:

```html
<!-- ✅ Layout -->
<div class="flex flex-col items-center justify-between">
<div class="grid grid-cols-2 gap-4">

<!-- ✅ Spacing -->
<div class="p-4 m-2 gap-3">
<div class="mt-6 mb-4 px-6">

<!-- ✅ Typography -->
<h1 class="text-2xl font-bold">
<p class="text-sm font-medium">

<!-- ✅ Sizing -->
<div class="w-full max-w-md h-12">

<!-- ✅ Responsive breakpoints -->
<div class="hidden md:flex lg:grid-cols-3">
```

### When to Use CSS Variables

Use CSS variables (via arbitrary values) for **colors, borders, and shadows**:

```html
<!-- ✅ Backgrounds -->
<div class="bg-[var(--card-bg)]">
<div class="bg-[var(--bg-secondary)]">

<!-- ✅ Text colors -->
<p class="text-[var(--text-primary)]">
<span class="text-[var(--text-muted)]">

<!-- ✅ Borders -->
<div class="border border-[var(--border-primary)]">

<!-- ✅ Shadows (use CSS variable or Tailwind) -->
<div class="shadow-md">  <!-- Tailwind OK for shadows -->
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
<div class="flex flex-col gap-4 p-6 rounded-lg 
            bg-[var(--card-bg)] border border-[var(--card-border)]">
    <h2 class="text-xl font-bold text-[var(--text-primary)]">
        Card Title
    </h2>
    <p class="text-sm text-[var(--text-secondary)]">
        Card description goes here.
    </p>
    <div class="srpg-b-group">
        <button class="srpg-b srpg-b-simple">Cancel</button>
        <button class="srpg-b srpg-b-normal">Confirm</button>
    </div>
</div>
```

### Quick Reference Table

| Use Case | Approach | Example |
|----------|----------|---------|
| Layout/Flexbox/Grid | Tailwind | `flex`, `grid`, `items-center` |
| Spacing | Tailwind | `p-4`, `gap-3`, `mt-6` |
| Typography | Tailwind | `text-lg`, `font-bold` |
| Responsive | Tailwind | `md:flex`, `lg:hidden` |
| Flex wrap control | Tailwind | `flex-wrap`, `flex-nowrap` |
| Background colors | CSS Variable | `bg-[var(--bg-primary)]` |
| Text colors | CSS Variable | `text-[var(--text-primary)]` |
| Borders | CSS Variable | `border-[var(--border-primary)]` |
| Buttons | srpg-* class | `srpg-b srpg-b-normal` |
| Forms | srpg-* class | `srpg-form-field` |
| Modals | srpg-* class | `srpg-modal` |

> **Note**: Layout utility classes like `srpg-flex-center`, `srpg-gap-md`, `srpg-mt-2`, etc. have been removed. Use Tailwind equivalents instead:
> - `srpg-flex-center` → `flex items-center justify-center`
> - `srpg-flex-between` → `flex items-center justify-between`
> - `srpg-gap-sm` → `gap-2`
> - `srpg-gap-md` → `gap-4`
> - `srpg-nowrap` → `flex-nowrap`
> - `srpg-mt-1` → `mt-2`
> - `srpg-mt-2` → `mt-4`

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

| Token | Purpose |
|-------|---------|
| `--bg-primary` | Main background |
| `--bg-secondary` | Secondary/card backgrounds |
| `--bg-tertiary` | Hover states, subtle backgrounds |
| `--bg-elevated` | Elevated surfaces (modals, dropdowns) |
| `--text-primary` | Main text |
| `--text-secondary` | Secondary/label text |
| `--text-muted` | Placeholder, disabled text |
| `--border-primary` | Default borders |
| `--border-secondary` | Hover/focus borders |
| `--card-bg` | Card background |
| `--card-border` | Card borders |

### Accent Colors

| Token | Purpose |
|-------|---------|
| `--accent-primary` | Primary actions (blue) |
| `--accent-success` | Success/create actions (green) |
| `--accent-danger` | Destructive actions (red) |
| `--accent-warning` | Warnings (orange) |
| `--accent-info` | Info/highlights (indigo) |

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

## 📝 Forms

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

---

## 💡 Tips for AI Assistants

1. **Ask for this file** if not provided — it ensures consistency
2. **Prefer composition** — combine existing classes rather than new CSS
3. **Check theme compatibility** — use variables that work in both themes
4. **Follow existing patterns** — look at similar components in the codebase
5. **Keep it simple** — this is a personal project, avoid over-engineering
