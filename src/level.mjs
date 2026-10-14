import { defaultPhysics, validatePhysics } from './physics-settings.mjs';
export const TILE = 32;
export const LAYERS = ['background', 'terrain', 'foreground'];
export const TYPES = ['solid', 'oneWay', 'decoration'];
export const keyOf = (x, y) => `${x},${y}`;

export function demoLevel() {
  const level = { schemaVersion: 1, name: 'First Steps', width: 80, height: 16, spawn: { x: 3, y: 10 }, layers: { background: {}, terrain: {}, foreground: {} } };
  for (let x = 0; x < 80; x += 1) {
    if ((x >= 19 && x <= 22) || (x >= 42 && x <= 45)) continue;
    for (let y = 13; y < 16; y += 1) level.layers.terrain[keyOf(x, y)] = 'solid';
  } // end ground loop
  for (const [start, end, y, type] of [[7, 11, 10, 'oneWay'], [25, 29, 9, 'oneWay'], [33, 36, 11, 'solid'], [48, 53, 10, 'oneWay']]) {
    for (let x = start; x <= end; x += 1) level.layers.terrain[keyOf(x, y)] = type;
  } // end platform loop
  return level;
} // end demoLevel

export function tileAt(level, layer, x, y) {
  return level.layers[layer]?.[keyOf(x, y)] ?? null;
} // end tileAt

export function validateLevel(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.schemaVersion !== 1) throw new Error('Expected a version 1 level object.');
  const { width, height, name, spawn, layers } = value;
  if (!Number.isInteger(width) || width < 5 || width > 500 || !Number.isInteger(height) || height < 5 || height > 100) throw new Error('Level dimensions must be 5–500 wide and 5–100 high.');
  if (typeof name !== 'string' || name.length > 100) throw new Error('Invalid level name.');
  if (!spawn || !Number.isInteger(spawn.x) || !Number.isInteger(spawn.y) || spawn.x < 0 || spawn.x >= width || spawn.y < 0 || spawn.y >= height) throw new Error('Spawn must be within the level.');
  if (!layers || typeof layers !== 'object' || Array.isArray(layers)) throw new Error('Missing layers.');
  const clean = { schemaVersion: 1, name, width, height, spawn: { x: spawn.x, y: spawn.y }, layers: { background: {}, terrain: {}, foreground: {} } };
  for (const layer of LAYERS) {
    const tiles = layers[layer];
    if (!tiles || typeof tiles !== 'object' || Array.isArray(tiles) || Object.keys(tiles).length > width * height) throw new Error('Invalid ' + layer + ' layer.');
    for (const [key, type] of Object.entries(tiles)) {
      const match = /^(0|[1-9]\d*),(0|[1-9]\d*)$/.exec(key);
      if (!match || Number(match[1]) >= width || Number(match[2]) >= height || !TYPES.includes(type)) throw new Error('Invalid ' + layer + ' tile ' + key);
      clean.layers[layer][key] = type;
    } // end tile loop
  } // end layer loop
  clean.physics = value.physics === undefined ? defaultPhysics() : validatePhysics(value.physics);
  return clean;
} // end validateLevel

export function resizeLevel(level, width, height) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 5 || width > 500 || height < 5 || height > 100) throw new Error('Dimensions must be whole numbers within supported limits.');
  const next = structuredClone(level);
  next.width = width;
  next.height = height;
  for (const layer of LAYERS) {
    for (const key of Object.keys(next.layers[layer])) {
      const [x, y] = key.split(',').map(Number);
      if (x >= width || y >= height) delete next.layers[layer][key];
    } // end tile loop
  } // end layer loop
  next.spawn.x = Math.min(next.spawn.x, width - 1);
  next.spawn.y = Math.min(next.spawn.y, height - 1);
  return validateLevel(next);
} // end resizeLevel
