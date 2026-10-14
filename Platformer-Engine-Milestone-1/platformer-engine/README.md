# Platformer Engine

First playable vertical slice of a browser-based 2D platformer with keyboard/screen-reader-accessible tile editing.

## Start

Run this command from the project folder:

```powershell
py -m http.server 8000
```

Open http://localhost:8000 in Chrome, Firefox or Edge. Stop the server with Ctrl+C. A local server is needed because the game uses ES modules.

## Controls

Click Start playing. Use A/D or left/right arrows to move; Space, W or Up to jump. Hold Jump for more height. Down + Jump drops through a one-way platform. Gamepad and touchscreen controls are also supported. Falling into a pit respawns at the spawn tile.

## Editing

All tile actions use labeled HTML form controls. Place, fill rectangular regions, erase or inspect; jump the editor camera to a coordinate, change dimensions, export or import JSON.

## Test

```powershell
node --test tests/*.test.mjs
```

## Architecture

- `src/level.mjs`: JSON schema and level validation.
- `src/physics.mjs`: Fixed 120 Hz tile collision and player movement.
- `src/input.mjs`: Unified input mapping.
- `src/app.mjs`: Browser rendering, camera and editor.

The initial version uses colored shapes instead of artwork. Event commands, prefabs, enemy AI, moving platforms, animations, and asset library are future milestones.
