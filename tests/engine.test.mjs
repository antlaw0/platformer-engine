import test from 'node:test';
import assert from 'node:assert/strict';
import { demoLevel, validateLevel, resizeLevel, tileAt } from '../src/level.mjs';
import { createPlayer, stepPlayer } from '../src/physics.mjs';
const dt = 1 / 120;
const idle = { left:false, right:false, down:false, jumpHeld:false, jumpPressed:false, jumpReleased:false };
function advance(player, level, frames, input=idle) {
  for(let i=0; i<frames; i+=1) stepPlayer(player, level, { ...input, jumpPressed: input.jumpPressed && i===0 }, dt);
} // end advance

test('demo level has expected terrain', () => {
  const level = validateLevel(demoLevel());
  assert.equal(level.width,80);
  assert.equal(tileAt(level,'terrain',7,10),'oneWay');
  assert.equal(tileAt(level,'terrain',0,13),'solid');
  assert.equal(tileAt(level,'terrain',20,13),null);
}); // end demo test

test('import validation rejects invalid terrain and coordinate', () => {
  const invalid = demoLevel();
  invalid.layers.terrain['500,2']='solid';
  assert.throws(() => validateLevel(invalid));
  delete invalid.layers.terrain['500,2'];
  invalid.layers.terrain['2,2']='hack';
  assert.throws(() => validateLevel(invalid));
}); // end import validation test

test('resizing removes out-of-bounds tiles without altering original', () => {
  const original=demoLevel();
  const next=resizeLevel(original,30,14);
  assert.equal(next.width,30);
  assert.equal(next.layers.terrain['33,11'],undefined);
  assert.equal(original.layers.terrain['33,11'],'solid');
}); // end resize test

test('player falls onto and remains on solid floor', () => {
  const level=demoLevel();
  const player=createPlayer(level);
  advance(player,level,150);
  assert.ok(Math.abs(player.y-(13*32-player.height))<0.1,`y=${player.y}`);
  assert.equal(player.grounded,true);
}); // end floor test

test('player can jump upward through one-way tile and land on it', () => {
  const level=demoLevel();
  const player=createPlayer(level);
  player.x=8*32+4;
  player.y=11*32;
  player.vy=-490;
  advance(player,level,10,idle);
  // The collision system must not block upward motion at the underside.
  assert.ok(player.y<11*32-20,'Player should pass upward through the underside of the one-way tile');
}); // end one-way jump test

test('player lands on one-way platform when falling from above', () => {
  const level=demoLevel();
  const player=createPlayer(level);
  player.x=8*32+4;
  player.y=7*32;
  advance(player,level,150);
  assert.ok(Math.abs(player.y-(10*32-player.height))<0.1,`y=${player.y}`);
  assert.equal(player.onOneWay,true);
}); // end landing test

test('down + jump drops through one-way platform', () => {
  const level=demoLevel();
  const player=createPlayer(level);
  player.x=8*32+4;
  player.y=7*32;
  advance(player,level,150);
  assert.equal(player.onOneWay,true);
  advance(player,level,25,{...idle,down:true,jumpPressed:true});
  assert.ok(player.y>10*32-player.height+5,`y=${player.y}`);
}); // end drop test

test('jump press while grounded produces upward velocity', () => {
  const level=demoLevel();
  const player=createPlayer(level);
  advance(player,level,150);
  const oldY=player.y;
  advance(player,level,10,{...idle,jumpPressed:true,jumpHeld:true});
  assert.ok(player.y<oldY);
}); // end jump test
