# Platformer Engine

First playable vertical slice of a browser-based 2D platformer with keyboard/screen-reader-accessible tile editing.

## Start

Run this command from the project folder:

```powershell
py dev_server.py
```

Open http://localhost:8000 in Chrome, Firefox or Edge. Stop the server with Ctrl+C. This development server supports `.mjs` JavaScript modules and automatically reloads the browser when local HTML, CSS, JavaScript, level JSON, or image/audio files change. No restart is needed after editing project files or running `git pull`. The server does not automatically fetch GitHub changes; run `git pull origin main` when new commits are available. Browser auto-refresh reloads the page and resets unsaved in-memory edits, so export your level JSON first when necessary.

To use a different port, run `py dev_server.py --port 8001`. No Python packages are required.

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
