export const DEFAULT_PHYSICS = Object.freeze({ acceleration:1500, maxSpeed:205, friction:1800, gravity:1450, jumpSpeed:490, jumpCut:0.46, maxFall:720, coyote:0.11, buffer:0.12, dropTime:0.25 }); // end defaults
export const PHYSICS_LIMITS = Object.freeze({ acceleration:[0,10000],maxSpeed:[0,2000],friction:[0,10000],gravity:[0,10000],jumpSpeed:[0,2000],jumpCut:[0,1],maxFall:[0,2000],coyote:[0,1],buffer:[0,1],dropTime:[0.01,2] }); // end limits
export function defaultPhysics() { return { ...DEFAULT_PHYSICS }; } // end defaultPhysics
export function validatePhysics(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Physics settings must be an object.');
  const clean = {};
  for (const [name,[min,max]] of Object.entries(PHYSICS_LIMITS)) {
    if (typeof value[name] !== 'number' || !Number.isFinite(value[name]) || value[name] < min || value[name] > max) throw new Error(name+' must be between '+min+' and '+max+'.');
    clean[name] = value[name];
  } // end fields
  return clean;
} // end validatePhysics
export function estimatedJumpHeight(config) {
  if (config.gravity <= 0) return null;
  const pixels = config.jumpSpeed ** 2 / (2 * config.gravity);
  return { pixels, tiles:pixels/32 };
} // end estimatedJumpHeight
