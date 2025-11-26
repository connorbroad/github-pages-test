# Solo RPG

A solo tabletop RPG companion app built with Svelte within Astro.

## Project Structure

```
solo-rpg/
├── data/           # Data management, storage utilities
├── game-management/# Campaign and game state management
├── home/           # Home view components
├── lore/           # Story and chronicle features
│   ├── characters/ # Character management
│   ├── chronicle/  # Adventure log with date separators
│   └── codex/      # World-building entries
├── map/            # Map editor and viewer
├── oracle/         # Random tables and dice rolling
├── shared/         # Reusable components (modals, layouts)
├── theme/          # Theme configuration
├── DESIGN_SYSTEM.md # Styling conventions
└── README.md       # This file
```

## Development

### Running the App

From the project root:

```bash
npm run dev
```

### Running Tests

```bash
# Run tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch
```

### Test Files

Test files are co-located with their source files using the `.test.ts` suffix:

| Source File                         | Test File                                |
| ----------------------------------- | ---------------------------------------- |
| `lore/chronicle/chronicle-utils.ts` | `lore/chronicle/chronicle-utils.test.ts` |

### Writing Tests

We use [Vitest](https://vitest.dev/) for testing. Tests follow this pattern:

```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "./my-module";

describe("myFunction", () => {
    it("should do something specific", () => {
        const result = myFunction(input);
        expect(result).toBe(expected);
    });
});
```

**Tips:**

- Extract complex logic into utility files (like `chronicle-utils.ts`) to make it testable
- Co-locate tests with source files for easy discovery
- Use descriptive test names that explain the expected behavior

## Styling

See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for styling conventions and component patterns.
