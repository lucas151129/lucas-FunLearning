/* Deterministic water-rocket model for the learning game.
 *
 * This is intentionally NOT a rigid-body physics engine. The flight is a
 * point-mass simulation so every force, phase and equation can be shown to
 * the learner. The visual layer (Three.js) only renders the state.
 */

export const G = 9.81;
export const RHO_WATER = 1000;
export const P_ATM = 101325;
export const RHO_AIR = 1.225;

export const ROCKET = {
  dryMass: 0.35,
  bottleVolume: 0.002,
  maxWaterMass: 2,
  nozzleArea: 2.4e-4,
  discharge: 0.8,
  dragArea: 0.0075,
  dragCd: 0.5,
  startHeight: 0.55,
};

const DEG = Math.PI / 180;

function point(x, y, t) {
  return { x, y, t };
}

/** Ideal projectile with no thrust, drag or wind. */
export function simulateIdeal({ v0, angle, sampleCount = 180 }) {
  const theta = angle * DEG;
  const vx0 = v0 * Math.cos(theta);
  const vy0 = v0 * Math.sin(theta);
  const flight = (2 * vy0) / G;
  const range = vx0 * flight;
  const apex = (vy0 * vy0) / (2 * G);
  const points = [];

  for (let index = 0; index <= sampleCount; index += 1) {
    const t = (flight * index) / sampleCount;
    points.push(point(vx0 * t, Math.max(0, vy0 * t - 0.5 * G * t * t), t));
  }

  return {
    mode: 'ideal',
    points,
    range,
    apex,
    flight,
    vx0,
    vy0,
    launchSpeed: v0,
    thrustTime: 0,
    maxSpeed: v0,
    mass0: null,
    massFinal: null,
    peakThrust: 0,
  };
}

/**
 * Water rocket:
 *  1. compressed air pushes water out of the nozzle;
 *  2. water momentum creates thrust;
 *  3. after the water is exhausted the rocket coasts under gravity + drag.
 *
 * Assumptions are deliberately documented in the UI: fixed nozzle direction,
 * adiabatic air expansion, no liquid sloshing and no rigid-body tumbling.
 */
export function simulateWater({
  angle,
  waterFraction,
  pressureBar,
  wind = 0,
  dt = 1 / 240,
  maxTime = 20,
}) {
  const theta = angle * DEG;
  const waterMass = Math.max(0.01, waterFraction) * ROCKET.maxWaterMass;
  const airVolume0 = ROCKET.bottleVolume * (1 - Math.max(0.01, Math.min(0.95, waterFraction)));
  const pressure0 = (pressureBar + P_ATM / 1e5) * 1e5;

  let waterLeft = waterMass;
  let airVolume = airVolume0;
  let mass = ROCKET.dryMass + waterLeft;
  let x = 0;
  let y = ROCKET.startHeight;
  let vx = 0;
  let vy = 0;
  let t = 0;
  let apex = y;
  let thrustTime = 0;
  let peakThrust = 0;
  let maxSpeed = 0;
  let phase = 'thrust';

  const points = [point(x, y, t)];
  let sampleTimer = 0;

  while (t < maxTime && y >= 0) {
    let thrust = 0;

    if (waterLeft > 1e-7) {
      const pressure = pressure0 * (airVolume0 / airVolume) ** 1.4;
      const pressureDrop = Math.max(0, pressure - P_ATM);
      const exhaustSpeed = Math.sqrt((2 * pressureDrop) / RHO_WATER);
      const massFlow = ROCKET.discharge * ROCKET.nozzleArea * RHO_WATER * exhaustSpeed;
      const expelled = Math.min(waterLeft, massFlow * dt);

      if (expelled > 0) {
        const actualFlow = expelled / dt;
        thrust = actualFlow * exhaustSpeed;
        waterLeft -= expelled;
        airVolume += expelled / RHO_WATER;
        mass = ROCKET.dryMass + waterLeft;
        thrustTime += dt;
        peakThrust = Math.max(peakThrust, thrust);
      }
    } else {
      phase = 'coast';
    }

    let ax = (thrust * Math.cos(theta)) / mass;
    let ay = (thrust * Math.sin(theta)) / mass - G;

    const relativeX = vx - wind;
    const speed = Math.hypot(relativeX, vy);
    const dragFactor = 0.5 * RHO_AIR * ROCKET.dragCd * ROCKET.dragArea * speed;
    ax -= (dragFactor * relativeX) / mass;
    ay -= (dragFactor * vy) / mass;

    vx += ax * dt;
    vy += ay * dt;
    x += vx * dt;
    y += vy * dt;
    t += dt;

    apex = Math.max(apex, y);
    maxSpeed = Math.max(maxSpeed, Math.hypot(vx, vy));

    sampleTimer += dt;
    if (sampleTimer >= 1 / 90 || y <= 0) {
      points.push(point(x, Math.max(0, y), t));
      sampleTimer = 0;
    }

    if (waterLeft <= 1e-7) phase = 'coast';
  }

  return {
    mode: 'water',
    points,
    range: x,
    apex,
    flight: t,
    vx0: 0,
    vy0: 0,
    launchSpeed: 0,
    thrustTime,
    maxSpeed,
    mass0: ROCKET.dryMass + waterMass,
    massFinal: mass,
    peakThrust,
    phase,
  };
}

export function simulate(mission, inputs) {
  if (mission.mode === 'ideal') {
    return simulateIdeal({
      v0: mission.v0,
      angle: inputs.angle,
    });
  }
  return simulateWater({
    angle: inputs.angle,
    waterFraction: inputs.water / 100,
    pressureBar: inputs.pressure,
    wind: mission.wind || 0,
  });
}

export function landingError(range, target) {
  return range - target;
}

export function hitTest(range, target, radius) {
  return Math.abs(range - target) <= radius;
}

export function angleForRange(v0, target) {
  const sin2theta = Math.min(1, (target * G) / (v0 * v0));
  const theta = 0.5 * Math.asin(sin2theta);
  return { low: theta / DEG, high: 90 - theta / DEG };
}
