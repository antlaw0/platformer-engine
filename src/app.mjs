import { TILE, LAYERS, demoLevel, resizeLevel, validateLevel, tileAt, keyOf } from './level.mjs';
import { PHYSICS, createPlayer, stepPlayer } from './physics.mjs';
import { Input } from './input.mjs';

const $ = (id) => document.getElementById(id);
const canvas = $('game');
const ctx = canvas.getContext('2d', { alpha: false });
let level = demoLevel();
let player = createPlayer(level);
let playing = false;
let cameraX = 0;
let cameraY = 0;
let viewportWidth = 640;
const viewportHeight = 360;
const input = new Input();
const colors = { solid: '#416f46', oneWay: '#d3a95c', decoration: '#7596c2' };

function status(message) { $('editor-status').textContent = message; } // end status
function gameStatus(message) { $('game-status').textContent = message; } // end gameStatus
function clamp(value, minimum, maximum) { return Math.min(Math.max(value, minimum), Math.max(minimum, maximum)); } // end clamp
function setCamera(x, y) {
  cameraX = clamp(x, 0, level.width * TILE - viewportWidth);
  cameraY = clamp(y, 0, level.height * TILE - viewportHeight);
} // end setCamera
function resetPlayer() {
  player = createPlayer(level);
  setCamera(player.x - viewportWidth / 2, player.y - viewportHeight / 2);
} // end resetPlayer
function syncLevelFields() {
  $('level-name').value = level.name;
  $('level-width').value = String(level.width);
  $('level-height').value = String(level.height);
} // end syncLevelFields
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;
  viewportWidth = viewportHeight * rect.width / rect.height;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  setCamera(cameraX, cameraY);
} // end resizeCanvas
function render() {
  const scale = canvas.height / viewportHeight;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = '#9bd1f2';
  ctx.fillRect(0, 0, viewportWidth, viewportHeight);
  ctx.fillStyle = '#cce8f7';
  ctx.fillRect(0, viewportHeight - 90, viewportWidth, 90);
  const firstX = Math.max(0, Math.floor(cameraX / TILE));
  const lastX = Math.min(level.width - 1, Math.ceil((cameraX + viewportWidth) / TILE));
  const firstY = Math.max(0, Math.floor(cameraY / TILE));
  const lastY = Math.min(level.height - 1, Math.ceil((cameraY + viewportHeight) / TILE));
  for (const layer of LAYERS) {
    for (let y = firstY; y <= lastY; y += 1) {
      for (let x = firstX; x <= lastX; x += 1) {
        const tile = tileAt(level, layer, x, y);
        if (!tile) continue;
        const sx = x * TILE - cameraX;
        const sy = y * TILE - cameraY;
        ctx.fillStyle = layer === 'background' ? '#bad7e8' : layer === 'foreground' ? '#395475' : colors[tile];
        ctx.fillRect(Math.floor(sx), Math.floor(sy), TILE + 0.3, TILE + 0.3);
        if (tile === 'oneWay' && layer === 'terrain') {
          ctx.fillStyle = '#fff0b4';
          ctx.fillRect(sx, sy, TILE, 5);
        } // end one-way marking
        ctx.strokeStyle = '#152e3380';
        ctx.lineWidth = 1;
        ctx.strokeRect(Math.floor(sx) + 0.5, Math.floor(sy) + 0.5, TILE - 1, TILE - 1);
      } // end tile x loop
    } // end tile y loop
  } // end layer loop
  const avatarX = playing ? player.x : level.spawn.x * TILE + 4;
  const avatarY = playing ? player.y : level.spawn.y * TILE + 2;
  ctx.fillStyle = '#3a368c';
  ctx.fillRect(avatarX - cameraX, avatarY - cameraY, 24, 30);
  ctx.fillStyle = '#fff';
  ctx.fillRect(avatarX - cameraX + (player.facing > 0 ? 15 : 5), avatarY - cameraY + 7, 4, 4);
  ctx.fillStyle = '#122039d9';
  ctx.fillRect(5, 5, 255, 25);
  ctx.fillStyle = '#fff';
  ctx.font = '13px sans-serif';
  ctx.fillText(playing ? 'PLAY | A/D + Space' : 'EDITOR | Configure tiles below', 12, 22);
} // end render

function updateCamera(dt) {
  if (!playing) return;
  const minX = cameraX + viewportWidth * 0.3;
  const maxX = cameraX + viewportWidth * 0.7;
  const minY = cameraY + viewportHeight * 0.3;
  const maxY = cameraY + viewportHeight * 0.7;
  let targetX = cameraX; let targetY = cameraY;
  const centerX = player.x + player.width / 2;
  const centerY = player.y + player.height / 2;
  if (centerX < minX) targetX += centerX - minX;
  if (centerX > maxX) targetX += centerX - maxX;
  if (centerY < minY) targetY += centerY - minY;
  if (centerY > maxY) targetY += centerY - maxY;
  const blend = 1 - Math.exp(-13 * dt);
  setCamera(cameraX + (targetX - cameraX) * blend, cameraY + (targetY - cameraY) * blend);
} // end updateCamera

let previousTime = performance.now();
let accumulator = 0;
let pendingPressed = false;
let pendingReleased = false;
let lastHeld = { left: false, right: false, down: false, jumpHeld: false };
function frame(now) {
  const elapsed = Math.min((now - previousTime) / 1000, 0.1);
  previousTime = now;
  if (playing) {
    const sampled = input.sample();
    pendingPressed ||= sampled.jumpPressed;
    pendingReleased ||= sampled.jumpReleased;
    lastHeld = sampled;
    accumulator += elapsed;
    const dt = 1 / 120;
    let count = 0;
    while (accumulator >= dt && count < 12) {
      const action = { ...lastHeld, jumpPressed: pendingPressed, jumpReleased: pendingReleased };
      pendingPressed = false;
      pendingReleased = false;
      if (!stepPlayer(player, level, action, dt, PHYSICS)) {
        resetPlayer();
        gameStatus('Player fell into a pit and respawned.');
      } // end respawn condition
      accumulator -= dt;
      count += 1;
    } // end simulation loop
    if (count === 12) accumulator = 0;
    updateCamera(elapsed);
  } else {
    accumulator = 0;
  } // end play check
  render();
  requestAnimationFrame(frame);
} // end frame

function stopPlaying() {
  playing = false;
  input.active = false;
  input.clear();
  $('play').setAttribute('aria-pressed', 'false');
  $('play').textContent = 'Start playing';
  gameStatus('Editor mode. Gameplay paused.');
} // end stopPlaying
$('play').addEventListener('click', () => {
  if (playing) { stopPlaying(); return; }
  playing = true;
  input.active = true;
  input.clear();
  pendingPressed = false;
  pendingReleased = false;
  $('play').setAttribute('aria-pressed', 'true');
  $('play').textContent = 'Stop playing';
  gameStatus('Playing. Keyboard, touch and gamepad controls are enabled.');
  canvas.focus();
}); // end play button
$('restart').addEventListener('click', () => { resetPlayer(); gameStatus('Player restarted at the level spawn.'); });
$('resize').addEventListener('click', () => {
  try {
    const name = $('level-name').value.trim();
    if (!name) throw new Error('Level name cannot be empty.');
    level = resizeLevel(level, Number($('level-width').value), Number($('level-height').value));
    level.name = name;
    stopPlaying(); resetPlayer(); syncLevelFields();
    status(`Level resized to ${level.width} by ${level.height} tiles. Tiles outside the boundaries were discarded.`);
  } catch (error) { status('Could not resize: ' + error.message); }
}); // end resize handler

function selectedRegion() {
  const x = Number($('x').value); const y = Number($('y').value);
  const width = Number($('rect-width').value); const height = Number($('rect-height').value);
  if (![x, y, width, height].every(Number.isInteger) || x < 0 || y < 0 || width < 1 || height < 1 || x + width > level.width || y + height > level.height) throw new Error('The rectangle must contain whole-number coordinates and fit inside the level.');
  return { x, y, width, height, layer: $('layer').value, type: $('tile-type').value };
} // end selectedRegion
function mutateTiles(operation, rectangle) {
  try {
    const { x, y, width, height, layer, type } = selectedRegion();
    const actualWidth = rectangle ? width : 1;
    const actualHeight = rectangle ? height : 1;
    for (let ty = y; ty < y + actualHeight; ty += 1) {
      for (let tx = x; tx < x + actualWidth; tx += 1) {
        if (operation === 'erase') delete level.layers[layer][keyOf(tx, ty)];
        else level.layers[layer][keyOf(tx, ty)] = type;
      } // end column loop
    } // end row loop
    status(`${operation === 'erase' ? 'Erased' : 'Placed'} ${actualWidth * actualHeight} tile(s) on the ${layer} layer, starting at (${x}, ${y}).`);
    if (playing) stopPlaying();
  } catch (error) { status('Could not edit: ' + error.message); }
} // end mutateTiles
$('place').addEventListener('click', () => mutateTiles('place', false));
$('fill').addEventListener('click', () => mutateTiles('place', true));
$('erase').addEventListener('click', () => mutateTiles('erase', true));
$('inspect').addEventListener('click', () => {
  try {
    const { x, y, layer } = selectedRegion();
    status(`${layer} tile at (${x}, ${y}): ${tileAt(level, layer, x, y) ?? 'empty'}.`);
  } catch (error) { status('Could not inspect: ' + error.message); }
}); // end inspect handler
$('jump-camera').addEventListener('click', () => {
  const x = Number($('jump-x').value); const y = Number($('jump-y').value);
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= level.width || y >= level.height) { status('Invalid camera coordinate. Choose a grid position within the level.'); return; }
  if (playing) { status('Stop playing before moving the editor camera.'); return; }
  setCamera(x * TILE, y * TILE);
  status(`Editor camera moved to grid coordinate (${x}, ${y}).`);
}); // end camera jump handler
$('export').addEventListener('click', () => {
  const content = JSON.stringify(validateLevel(level), null, 2);
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'platformer-level.json';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  status('Level JSON exported.');
}); // end export handler
$('import').addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    if (file.size > 2_000_000) throw new Error('File exceeds the 2 MB import limit.');
    const imported = validateLevel(JSON.parse(await file.text()));
    level = imported;
    stopPlaying(); resetPlayer(); syncLevelFields();
    status(`Imported level ${level.name}, ${level.width} by ${level.height} tiles.`);
  } catch (error) { status('Import failed: ' + error.message); }
  finally { event.target.value = ''; }
}); // end import handler
$('restore').addEventListener('click', () => { level = demoLevel(); stopPlaying(); resetPlayer(); syncLevelFields(); status('Restored the example level.'); });

syncLevelFields();
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
new ResizeObserver(resizeCanvas).observe($('game-frame'));
requestAnimationFrame(frame);
