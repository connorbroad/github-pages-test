# Modal Component Usage Guide

The `SrpgModal.svelte` component provides a reusable modal wrapper with consistent styling and behavior across the Solo RPG application.

## Features

- **Consistent Styling**: Uses shared `srpg-modal` styles
- **Accessibility**: Built-in ARIA attributes and keyboard navigation
- **Customizable Navigation**: Optional close and back buttons
- **Flexible Content**: Uses slots for custom content
- **Overlay Click Handling**: Configurable overlay dismissal

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `show` | `boolean` | `false` | Controls modal visibility |
| `showCloseButton` | `boolean` | `true` | Shows/hides the close (×) button |
| `showBackButton` | `boolean` | `false` | Shows/hides the back (←) button |
| `closeOnOverlayClick` | `boolean` | `true` | Allows closing modal by clicking overlay |
| `ariaLabel` | `string` | `"Close modal"` | Accessibility label for the overlay |
| `maxWidth` | `string` | `"500px"` | Maximum width of the modal content |

## Events

| Event | Description |
|-------|-------------|
| `on:close` | Fired when the modal should be closed (close button or overlay click) |
| `on:back` | Fired when the back button is clicked |

## Basic Usage

```svelte
<script lang="ts">
    import Modal from "./shared/modal/SrpgModal.svelte";
    
    let showModal = false;
    
    function handleClose() {
        showModal = false;
    }
</script>

{#if showModal}
    <Modal show={showModal} on:close={handleClose}>
        <h2>My Modal Title</h2>
        <p>Modal content goes here</p>
        <button on:click={handleClose}>Confirm</button>
    </Modal>
{/if}
```

## Advanced Usage Examples

### Modal with Back Button

Use this pattern when you have multi-step workflows:

```svelte
<script lang="ts">
    import Modal from "./Modal.svelte";
    
    let showModal = false;
    let viewMode: 'main' | 'details' = 'main';
    
    function handleBack() {
        viewMode = 'main';
    }
    
    function handleClose() {
        showModal = false;
        viewMode = 'main';
    }
</script>

{#if showModal}
    <Modal 
        show={showModal} 
        showBackButton={viewMode === 'details'}
        on:close={handleClose}
        on:back={handleBack}
    >
        {#if viewMode === 'main'}
            <h2>Main View</h2>
            <button on:click={() => viewMode = 'details'}>View Details</button>
        {:else}
            <h2>Details View</h2>
            <p>Detailed information here</p>
        {/if}
    </Modal>
{/if}
```

### Modal Without Close Button

Use this pattern when you want to force user interaction:

```svelte
<Modal 
    show={showModal}
    showCloseButton={false}
    closeOnOverlayClick={false}
    on:close={handleClose}
>
    <h2>Required Action</h2>
    <p>You must make a selection before continuing.</p>
    <button on:click={handleConfirm}>Confirm</button>
</Modal>
```

### Modal with Custom Width

```svelte
<Modal 
    show={showModal}
    maxWidth="800px"
    on:close={handleClose}
>
    <h2>Wide Modal</h2>
    <p>This modal can display more content horizontally.</p>
</Modal>
```

### Modal with Custom Aria Label

```svelte
<Modal 
    show={showModal}
    ariaLabel="Close campaign creator"
    on:close={handleClose}
>
    <h2>Create Campaign</h2>
    <!-- Content -->
</Modal>
```

## Migration from Old Pattern

**Before:**
```svelte
{#if show}
    <div
        class="srpg-modal"
        role="button"
        tabindex="0"
        aria-label="Close modal"
        on:click={handleClose}
        on:keydown={(e) => {
            const tag = (e.target as HTMLElement).tagName;
            if (
                (e.key === "Enter" || e.key === " ") &&
                !["INPUT", "TEXTAREA", "BUTTON"].includes(tag)
            ) {
                handleClose();
            }
        }}
    >
        <div
            class="srpg-modal-content"
            role="dialog"
            aria-modal="true"
            tabindex="0"
            on:click|stopPropagation
            on:keydown={(e) => {}}
        >
            <button class="srpg-b-modal-nav srpg-b-modal-nav-close" on:click={handleClose}
                >&times;</button
            >
            <h2>Modal Title</h2>
            <!-- Content -->
        </div>
    </div>
{/if}
```

**After:**
```svelte
<script lang="ts">
    import Modal from "./Modal.svelte";
</script>

{#if show}
    <Modal {show} ariaLabel="Close modal" on:close={handleClose}>
        <h2>Modal Title</h2>
        <!-- Content -->
    </Modal>
{/if}
```

## Components Already Migrated

The following components have been updated to use the new Modal component:

- ✅ `CampaignCreator.svelte`
- ✅ `CampaignLoadConfirm.svelte`
- ✅ `GameBlueprintEditor.svelte`
- ✅ `NoCampaignOverlay.svelte`

## Components to Migrate

The following components still use the old modal pattern:

- ⏳ `DiceRoller.svelte`
- ⏳ `oracle/components/FateConsultation.svelte`
- ⏳ `oracle/components/FortuneEditor.svelte` (uses back button)

## Styling

The Modal component automatically uses styles from `solo-rpg-styles.css`. No additional styling is needed unless you want to customize the content inside the modal.

Content-specific styles should be added to the component using the Modal, not to the Modal component itself.
