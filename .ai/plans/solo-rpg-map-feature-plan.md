# Solo RPG – Map Feature Plan

Status: Inception
Owner: Solo RPG module
Updated: 2025-10-16

Overview
- Goal: Provide a mobile-first map builder and player for campaigns. Create/list maps, edit backgrounds (tile grid) and foreground objects (basic shapes), toggle Edit/Play modes, and persist state to local storage with debounced saves.
- Scope (MVP):
  - Landing: create a map by name; list maps for the active campaign; open a map.
  - Editor: fullscreen canvas with always-on grid; pan/zoom; edit vs play mode; background tile painting (snaps to grid); foreground objects (square/circle/triangle/star) that can be placed, selected, moved; limited color palette; debounced autosave.
- Future (not in MVP): tileset image support, composite objects (groups), multiple layers (foreground/background stacks).

User Stories
- As a player, I can create a map (name only) tied to the active campaign so I can start mapping quickly.
- As a player, I can see all maps for the active campaign and open one.
- As a player, I can paint background tiles onto a grid using colors.
- As a player, I can add and move foreground objects (shapes) in Edit mode.
- As a player, I can switch to Play mode where only foreground objects are movable.
- As a player, my map changes auto-save and persist across sessions.

UX Flows
- Landing (Map list)
  - If no active campaign, show existing NoCampaignOverlay and CTA to go Home.
  - If active campaign, show: “Create Map” (text input + create button), and grid/list of existing maps for that campaign.
  - Tap a map to open Editor view.
- Editor
  - Fullscreen canvas area that accounts for primary/secondary/tertiary sidebars. Always shows grid.
  - Reuse existing sidebars for tool UI (see Sidebars Integration).
  - Edit mode: paint background tiles on grid, place shapes (foreground), move/select/erase.
  - Play mode: pan/zoom and move foreground objects only; no background edits.

Sidebars Integration (Consistency)
- Goal: Reuse layout/visuals of SecondarySidebar and TertiarySidebar for map tools to match the rest of the app.
- Approach A (preferred): Create map-specific wrappers with identical styling:
  - MapSecondarySidebar.svelte (styled like SecondarySidebar)
    - Mode toggle: Edit / Play
    - Quick actions: Home/Back, Zoom in/out (optional)
  - MapTertiarySidebar.svelte (styled like TertiarySidebar)
    - Tools: Paint, Object, Move, Erase
    - Shape pickers (■ ● ▲ ★) shown when Object tool active
    - Color palette selector
- Approach B (alternate): Make SecondarySidebar accept dynamic tab configs and slot content; use TertiarySidebar for tool palette. Requires refactor but reduces duplication.
- Mobile behavior: sidebars stack as current components do (primary bottom bar, then secondary, then tertiary). Editor height accounts for their presence via existing content classes.

Architecture
- Rendering: Canvas 2D (primary) for performance and mobile. Optional overlays for selections and hit-testing.
  - Background layer: offscreen canvas for tiles; redraw only dirty tiles when painting.
  - Foreground layer: objects rendered each frame or on changes; simple rAF loop or event-driven redraw.
  - Grid: drawn as overlay lines aligned to half-pixels for crispness at current zoom.
- State management
  - Svelte component-local state for transient UI (current tool, color, selection).
  - Svelte stores for map entities and autosave signals.
  - Debounced save (e.g., 400–800ms) and flush on navigation/unload.
- Mobile gestures
  - One-finger: paint or move selection depending on tool/mode.
  - Two-finger: pan/zoom the viewport; pinch zoom.
  - Desktop parity: wheel to zoom, drag to pan (e.g., right-button or spacebar + drag).

Data Model (proposed additions)
- Types (extend src/components/games/solo-rpg/data/storage-utils.ts)
  - MapEntity
    - id: string
    - campaignId: string
    - name: string
    - createdAt: number
    - updatedAt: number
    - width: number (in tiles)
    - height: number (in tiles)
    - tileSize: number (px)
    - background: Record<string, string> // sparse tile color map keyed by "x,y"
    - objects: MapObject[]
    - view?: { x: number; y: number; zoom: number }
  - MapObject
    - id: string
    - type: "square" | "circle" | "triangle" | "star"
    - x: number; y: number // world coords (px)
    - w: number; h: number // size (px)
    - rotation?: number
    - color: string // from palette key
    - z?: number
    - locked?: boolean
  - ColorPalette: string[] // limited set; e.g., ["#222", "#555", "#888", "#c0392b", "#27ae60", "#2980b9", "#f1c40f", "#8e44ad"]
- Storage
  - Extend SoloRPGData with: maps?: MapEntity[] and activeMapId?: string
  - Helpers to add:
    - loadMaps(): MapEntity[]
    - saveMaps(maps: MapEntity[]): void
    - loadMapsByCampaign(campaignId: string): MapEntity[]
    - loadActiveMapId(): string | null; saveActiveMapId(id: string | null)
  - Migration: default to [] if undefined.

Persistence & Autosave
- Debounce delay: 500ms after last edit.
- Trigger autosave on background paint, object add/move/delete, rename, settings.
- Flush immediately on: leaving editor, campaign switch, window beforeunload.

Components (proposed)
- MapView.svelte (router/host)
  - Landing subview (if no map selected): create + list for $activeCampaign
  - Editor subview (if a map is selected/open)
- map/
  - MapLanding.svelte: create input, list of maps for campaign; open map
  - MapEditor.svelte: canvas renderer, camera, grid; initial inline toolbar for scaffolding
  - MapSecondarySidebar.svelte: mode toggle + quick actions (reuse SecondarySidebar look)
  - MapTertiarySidebar.svelte: tools + shapes + palette (reuse TertiarySidebar look)
  - MapStore.ts: store utilities (current map, tools, mode, debounce)

APIs & Events
- MapLanding
  - dispatch('openMap', { id })
  - dispatch('createMap', { name })
- MapEditor
  - Props: mapId
  - Events: 'save', 'back', 'navigateHome', 'navigateToStory'
- Storage Utils additions (non-breaking): new load/save helpers as above.

Rendering Details
- World coords vs screen coords with camera {x, y, zoom}.
- Grid lines every tileSize; adjust for zoom; use Math.round((coord) + 0.5) trick for crispness.
- Hit-testing
  - Background: map tile from world position -> tile index -> key "x,y".
  - Foreground: iterate objects by z; simple bounding-box or per-shape hit test.

Behavior & Rules
- Edit mode
  - Tools: paint (bg), object (place shapes), select/move (fg), erase (bg/fg depending on target).
  - Background paint snaps to tiles; foreground free-move (optionally snap toggle later).
- Play mode
  - Move foreground objects only; no background edits; painting disabled.

Layout & Responsiveness
- Fullscreen within app content area.
- Mobile: 100dvh height; use env(safe-area-inset-bottom); toolbars sized for touch.
- Respect primary/secondary/tertiary sidebars by toggling content classes already used by SoloRPG layout.

Acceptance Criteria (MVP)
- [ ] Creating a map (name only) saves it to local storage under the active campaign.
- [ ] Landing lists maps for active campaign and opens a map on tap.
- [ ] Editor shows always-on grid, supports pan and zoom.
- [ ] Edit mode paints background tiles snapped to grid with selectable colors.
- [ ] Edit mode adds and moves foreground objects (4 shapes) with selectable colors.
- [ ] Play mode prevents background edits and allows moving foreground objects.
- [ ] Map state auto-saves with debounce and persists across reloads.
- [ ] Works on mobile (touch) and desktop (mouse) with responsive UI.
- [ ] Map tools are presented via Secondary/Tertiary-style sidebars (consistent visuals).

Milestones & Tasks
1) Data & Storage
- [x] Define MapEntity/MapObject types in storage-utils.ts
- [x] Add maps[] and activeMapId to SoloRPGData
- [x] Implement loadMaps/saveMaps, loadMapsByCampaign, load/saveActiveMapId
- [ ] Add debounce utility (shared or local)

2) Landing UI
- [x] MapLanding.svelte (create by name, list maps)
- [x] Wire to MapView: open map -> Editor
- [x] Persist to storage utils

3) Editor Base
- [x] MapEditor.svelte with canvas, camera, grid rendering (inline toolbar scaffold)
- [ ] Pan/zoom gestures (touch + mouse)

4) Sidebar Tooling (Consistency)
- [ ] MapSecondarySidebar.svelte with Edit/Play toggle and quick actions
- [ ] MapTertiarySidebar.svelte with tools, shapes, color palette
- [ ] Integrate sidebars into MapView; remove temporary inline toolbar

5) Background Painting
- [x] Paint/erase tiles; sparse storage; redraw
- [x] Color palette selector

6) Foreground Objects
- [x] Object placement (square/circle/triangle/star)
- [x] Selection and move
- [ ] Color reassignment for selected object

7) Modes & Persistence
- [x] Mode toggle and enforcement (basic)
- [x] Debounced autosave + flush on exit (basic)
- [ ] Restore last camera view per map (persist updates continuously)

8) Polish
- [ ] Empty states, error handling
- [ ] Performance pass (dirty rects, throttling)
- [ ] QA on mobile and desktop

Open Questions / Risks
- Map bounds: fixed grid size vs unbounded. Proposal: fixed (e.g., 100x100 tiles), configurable per map.
- Deletion/rename: MVP omits delete; consider adding safely later.
- Undo/redo: out of scope for MVP; plan for operation log later.
- Tileset images: design MapEntity to later support tileId instead of color.
- Layers: plan to extend with layers[] array; current background/foreground are implicit.

File Plan (not yet fully implemented)
- Update: src/components/games/solo-rpg/data/storage-utils.ts (done)
- Add: src/components/games/solo-rpg/map/MapLanding.svelte (done)
- Add: src/components/games/solo-rpg/map/MapEditor.svelte (scaffold done)
- Add: src/components/games/solo-rpg/map/MapSecondarySidebar.svelte (pending)
- Add: src/components/games/solo-rpg/map/MapTertiarySidebar.svelte (pending)
- Add: src/components/games/solo-rpg/map/stores/MapStore.ts (pending)
- Update: MapView.svelte to route between Landing and Editor subviews and wire events (done)
- Styles: reuse solo-rpg-styles.css; add scoped editor styles if needed

Tracking
- Link PRs/commits against each milestone item above.
- Check off Acceptance Criteria as they pass manual QA.
