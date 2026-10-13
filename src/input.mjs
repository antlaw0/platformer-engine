const KEY_MAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowDown: 'down', KeyS: 'down', Space: 'jump', ArrowUp: 'jump', KeyW: 'jump' };
export class Input {
  constructor() {
    this.keys = new Set();
    this.touch = new Map();
    this.previousJump = false;
    this.previousKeyboardJump = false;
    this.previousGamepadJump = false;
    this.active = false;
    window.addEventListener('keydown', (event) => {
      if (!this.active || this.isEditing(event.target)) return;
      const action = KEY_MAP[event.code];
      if (action) { event.preventDefault(); this.keys.add(event.code); }
    }); // end keydown handler
    window.addEventListener('keyup', (event) => { if (KEY_MAP[event.code]) this.keys.delete(event.code); });
    window.addEventListener('blur', () => this.clear());
    document.querySelectorAll('[data-control]').forEach((button) => {
      button.addEventListener('pointerdown', (event) => {
        if (!this.active) return;
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        this.touch.set(event.pointerId, button.dataset.control);
      }); // end pointerdown handler
      button.addEventListener('pointerup', (event) => { this.touch.delete(event.pointerId); });
      button.addEventListener('pointercancel', (event) => { this.touch.delete(event.pointerId); });
      button.addEventListener('lostpointercapture', (event) => { this.touch.delete(event.pointerId); });
    }); // end button loop
  } // end constructor

  isEditing(target) {
    return target instanceof HTMLElement && Boolean(target.closest('input, select, textarea, [contenteditable="true"]'));
  } // end isEditing

  clear() {
    this.keys.clear();
    this.touch.clear();
    this.previousJump = false;
  } // end clear

  sample() {
    let axis = 0; let padJump = false; let padDown = false;
    const pads = navigator.getGamepads?.() ?? [];
    for (const pad of pads) {
      if (!pad) continue;
      axis = Math.abs(pad.axes[0] ?? 0) > 0.25 ? pad.axes[0] : 0;
      if (pad.buttons[14]?.pressed) axis = -1;
      if (pad.buttons[15]?.pressed) axis = 1;
      padJump ||= Boolean(pad.buttons[0]?.pressed);
      padDown ||= Boolean(pad.buttons[13]?.pressed) || (pad.axes[1] ?? 0) > 0.55;
      break;
    } // end gamepad search
    const held = (action) => [...this.keys].some((key) => KEY_MAP[key] === action) || [...this.touch.values()].includes(action);
    const left = held('left') || axis < -0.25;
    const right = held('right') || axis > 0.25;
    const jump = held('jump') || padJump;
    const result = { left, right, down: held('down') || padDown, jumpHeld: jump, jumpPressed: jump && !this.previousJump, jumpReleased: !jump && this.previousJump };
    this.previousJump = jump;
    return result;
  } // end sample
} // end Input
