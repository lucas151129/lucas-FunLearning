export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function fmt(value, digits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  const rounded = Math.abs(number) < 0.0005 ? 0 : number;
  const text = rounded.toFixed(digits);
  return text.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '') || '0';
}

export function signed(value, digits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return `${number >= 0 ? '+' : '−'}${fmt(Math.abs(number), digits)}`;
}

export function collisionType(e) {
  if (e >= 0.999) return 'elastic';
  if (e <= 0.001) return 'perfectly-inelastic';
  return 'inelastic';
}

export function solveCollision({ m1, m2, u1, u2, e = 0 }) {
  const a = clamp(Number(m1), 0.1, 20);
  const b = clamp(Number(m2), 0.1, 20);
  const c = clamp(Number(u1), -20, 20);
  const d = clamp(Number(u2), -20, 20);
  const restitution = clamp(Number(e), 0, 1);
  const totalMass = a + b;

  const v1 = ((a - restitution * b) * c + (1 + restitution) * b * d) / totalMass;
  const v2 = ((b - restitution * a) * d + (1 + restitution) * a * c) / totalMass;
  const pBefore = a * c + b * d;
  const pAfter = a * v1 + b * v2;
  const keBefore = 0.5 * a * c * c + 0.5 * b * d * d;
  const keAfter = 0.5 * a * v1 * v1 + 0.5 * b * v2 * v2;
  const keLoss = Math.max(0, keBefore - keAfter);
  const relativeBefore = c - d;
  const relativeAfter = v2 - v1;

  return {
    type: collisionType(restitution),
    m1: a,
    m2: b,
    u1: c,
    u2: d,
    e: restitution,
    totalMass,
    v1,
    v2,
    pBefore,
    pAfter,
    keBefore,
    keAfter,
    keLoss,
    relativeBefore,
    relativeAfter,
    energyFraction: keBefore > 0 ? keAfter / keBefore : 1,
  };
}

export function solveExplosion({ m1, m2, energy = 100 }) {
  const a = clamp(Number(m1), 0.1, 20);
  const b = clamp(Number(m2), 0.1, 20);
  const released = clamp(Number(energy), 0, 10000);
  const totalMass = a + b;

  // At rest. Fragment A moves left, B moves right.
  const v1 = -Math.sqrt((2 * b * released) / (a * totalMass));
  const v2 = -(a / b) * v1;
  const pBefore = 0;
  const pAfter = a * v1 + b * v2;
  const keBefore = 0;
  const keAfter = 0.5 * a * v1 * v1 + 0.5 * b * v2 * v2;

  return {
    type: 'explosion',
    m1: a,
    m2: b,
    u1: 0,
    u2: 0,
    totalMass,
    v1,
    v2,
    pBefore,
    pAfter,
    keBefore,
    keAfter,
    keLoss: 0,
    energyReleased: released,
  };
}

export function outcomeFor({ scenario, inputs }) {
  if (scenario === 'explosion') {
    return solveExplosion({ m1: inputs.m1, m2: inputs.m2, energy: inputs.energy });
  }
  const e = scenario === 'perfectly-inelastic' ? 0 : scenario === 'elastic' ? 1 : inputs.e;
  return solveCollision({
    m1: inputs.m1,
    m2: inputs.m2,
    u1: inputs.u1,
    u2: inputs.u2,
    e,
  });
}

export function willCollide({ u1, u2 }) {
  return Number(u1) - Number(u2) > 0.0001;
}

export function comPosition({ m1, m2, x1, x2 }) {
  const total = Number(m1) + Number(m2);
  return (Number(m1) * Number(x1) + Number(m2) * Number(x2)) / total;
}
