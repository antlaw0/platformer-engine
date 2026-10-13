import { TILE, tileAt } from './level.mjs';

export const PHYSICS = Object.freeze({ acceleration: 1500, maxSpeed: 205, friction: 1800, gravity: 1450, jumpSpeed: 490, jumpCut: 0.46, maxFall: 720, coyote: 0.11, buffer: 0.12, dropTime: 0.25 });
export const PLAYER_WIDTH = 24;
export const PLAYER_HEIGHT = 30;

export function createPlayer(level) {
  return { x: level.spawn.x * TILE + 4, y: level.spawn.y * TILE + 2, vx: 0, vy: 0, width: PLAYER_WIDTH, height: PLAYER_HEIGHT, grounded: false, onOneWay: false, coyote: 0, buffer: 0, dropTimer: 0, facing: 1 };
} // end createPlayer

function approach(value, target, maxChange) {
  return value < target ? Math.min(target, value + maxChange) : Math.max(target, value - maxChange);
} // end approach

function solidAt(level, tx, ty) {
  // Map sides are solid; bottom is handled by the death/respawn condition.
  return tx < 0 || tx >= level.width || ty < 0 || (ty < level.height && tileAt(level, 'terrain', tx, ty) === 'solid');
} // end solidAt

function solidIntersects(level, x, y, width, height) {
  const left = Math.floor(x / TILE);
  const right = Math.floor((x + width - 0.001) / TILE);
  const top = Math.floor(y / TILE);
  const bottom = Math.floor((y + height - 0.001) / TILE);
  for (let ty = top; ty <= bottom; ty += 1) {
    for (let tx = left; tx <= right; tx += 1) {
      if (solidAt(level, tx, ty)) return true;
    } // end horizontal search
  } // end vertical search
  return false;
} // end solidIntersects

export function stepPlayer(player, level, input, dt, config = PHYSICS) {
  if (input.jumpPressed) player.buffer = config.buffer;
  else player.buffer = Math.max(0, player.buffer - dt);
  player.coyote = player.grounded ? config.coyote : Math.max(0, player.coyote - dt);
  player.dropTimer = Math.max(0, player.dropTimer - dt);
  const dir = Number(Boolean(input.right)) - Number(Boolean(input.left));
  if (dir) player.facing = dir;
  player.vx = approach(player.vx, dir * config.maxSpeed, (dir ? config.acceleration : config.friction) * dt);
  if (input.jumpPressed && input.down && player.grounded && player.onOneWay) {
    player.dropTimer = config.dropTime;
    player.grounded = false;
    player.onOneWay = false;
    player.coyote = 0;
    player.buffer = 0;
    player.y += 2;
  } else if (player.buffer > 0 && player.coyote > 0) {
    player.vy = -config.jumpSpeed;
    player.grounded = false;
    player.onOneWay = false;
    player.coyote = 0;
    player.buffer = 0;
  } // end jump decision
  if (input.jumpReleased && player.vy < 0) player.vy *= config.jumpCut;
  player.vy = Math.min(config.maxFall, player.vy + config.gravity * dt);

  // Substeps prevent fast movement from tunneling through terrain.
  const travel = Math.max(Math.abs(player.vx * dt), Math.abs(player.vy * dt));
  const steps = Math.max(1, Math.ceil(travel / 7));
  const subDt = dt / steps;
  player.grounded = false;
  player.onOneWay = false;
  for (let i = 0; i < steps; i += 1) {
    const dx = player.vx * subDt;
    if (dx !== 0) {
      if (!solidIntersects(level, player.x + dx, player.y, player.width, player.height)) player.x += dx;
      else {
        const direction = Math.sign(dx);
        let left = Math.abs(dx);
        while (left > 0) {
          const increment = direction * Math.min(0.5, left);
          if (solidIntersects(level, player.x + increment, player.y, player.width, player.height)) break;
          player.x += increment;
          left -= Math.abs(increment);
        } // end horizontal refinement
        player.vx = 0;
      } // end horizontal collision
    } // end horizontal travel
    const dy = player.vy * subDt;
    if (dy === 0) continue;
    const nextY = player.y + dy;
    const previousBottom = player.y + player.height;
    let landingY = Infinity;
    if (dy > 0 && player.dropTimer === 0) {
      const txStart = Math.floor(player.x / TILE);
      const txEnd = Math.floor((player.x + player.width - 0.001) / TILE);
      const tyStart = Math.floor((previousBottom - 0.001) / TILE);
      const tyEnd = Math.floor((nextY + player.height - 0.001) / TILE);
      for (let ty = tyStart; ty <= tyEnd; ty += 1) {
        const platformTop = ty * TILE;
        if (previousBottom > platformTop + 0.001 || nextY + player.height < platformTop) continue;
        for (let tx = txStart; tx <= txEnd; tx += 1) {
          if (tileAt(level, 'terrain', tx, ty) === 'oneWay') landingY = Math.min(landingY, platformTop - player.height);
        } // end one-way x search
      } // end one-way y search
    } // end one-way detection
    if (!solidIntersects(level, player.x, nextY, player.width, player.height) && nextY <= landingY) {
      player.y = nextY;
      if (nextY === landingY) { player.vy = 0; player.grounded = true; player.onOneWay = true; }
    } else {
      if (dy > 0 && landingY !== Infinity && landingY >= player.y && !solidIntersects(level, player.x, landingY, player.width, player.height)) {
        player.y = landingY;
        player.vy = 0;
        player.grounded = true;
        player.onOneWay = true;
      } else {
        const direction = Math.sign(dy);
        let left = Math.abs(dy);
        while (left > 0) {
          const increment = direction * Math.min(0.5, left);
          if (solidIntersects(level, player.x, player.y + increment, player.width, player.height)) break;
          player.y += increment;
          left -= Math.abs(increment);
        } // end vertical refinement
        if (dy > 0) player.grounded = true;
        player.vy = 0;
      } // end landing selection
    } // end vertical collision
  } // end substep loop
  if (player.y > level.height * TILE + 180) return false;
  return true;
} // end stepPlayer
