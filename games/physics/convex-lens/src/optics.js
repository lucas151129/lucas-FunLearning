/* Thin-lens geometric optics.
 *
 * Sign convention used throughout the simulator:
 *   f > 0
 *   u > 0  (object on the left)
 *   v > 0  real image on the right, v < 0 virtual image on the left
 *   m = -v/u
 *   1/f = 1/u + 1/v
 *
 * The drawing layer never invents an image position; it always uses the
 * result of solveLens() so the ray diagram and the numbers stay consistent.
 */

export const WORLD = { width: 1000, height: 700 };
export const LENS_X = 500;
export const AXIS_Y = 350;

const EPS = 0.05;

export function solveLens({ f, u, h = 4 }) {
  const safeF = Math.max(1, Number(f));
  const safeU = Math.max(1, Number(u));
  const safeH = Math.max(0.5, Number(h));
  const atFocus = Math.abs(safeU - safeF) <= EPS;

  if (atFocus) {
    return {
      f: safeF,
      u: safeU,
      h: safeH,
      v: Infinity,
      m: Infinity,
      hi: Infinity,
      real: false,
      virtual: false,
      parallel: true,
      upright: false,
      inverted: false,
      magnified: false,
      sameSize: false,
      diminished: false,
      caseId: 'atf',
      caseLabel: '物體在焦點上',
      nature: '不成像',
      description: '折射光線平行射出，像在無限遠，光屏上沒有清晰的像。',
    };
  }

  const v = (safeU * safeF) / (safeU - safeF);
  const m = -v / safeU;
  const hi = m * safeH;
  const real = v > 0;
  const virtual = v < 0;
  const upright = hi > 0;
  const inverted = hi < 0;
  const size = Math.abs(m);
  const sameSize = Math.abs(size - 1) < 0.02;
  const magnified = size > 1.02;
  const diminished = size < 0.98;

  let caseId;
  let caseLabel;
  if (safeU > 2 * safeF + EPS) {
    caseId = 'beyond2f';
    caseLabel = '物距大於 2f';
  } else if (Math.abs(safeU - 2 * safeF) <= EPS) {
    caseId = 'at2f';
    caseLabel = '物距等於 2f';
  } else if (safeU > safeF + EPS) {
    caseId = 'between';
    caseLabel = '物距在 f 與 2f 之間';
  } else {
    caseId = 'inside';
    caseLabel = '物距小於 f';
  }

  let nature;
  let description;
  if (real) {
    nature = '實像';
    description = virtual ? '' : '光線實際會聚，光屏上可以接到清晰的像。';
  } else {
    nature = '虛像';
    description = '折射光線發散，眼睛看到的是反向延長線形成的虛像，光屏接不到。';
  }

  return {
    f: safeF,
    u: safeU,
    h: safeH,
    v,
    m,
    hi,
    real,
    virtual,
    parallel: false,
    upright,
    inverted,
    magnified,
    diminished,
    sameSize,
    size,
    caseId,
    caseLabel,
    nature,
    description,
  };
}

export function imageSummary(result) {
  if (result.parallel) {
    return '平行光線；不成像';
  }
  const orientation = result.upright ? '正立' : '倒立';
  const size = result.sameSize ? '等大' : result.magnified ? '放大' : '縮小';
  return `${orientation}、${size}、${result.nature}`;
}

export function formatCm(value, digits = 1) {
  if (!Number.isFinite(value)) return '∞';
  return `${value.toFixed(digits)} cm`;
}

export function formatMagnification(value) {
  if (!Number.isFinite(value)) return '∞';
  return `${value.toFixed(2)}×`;
}

export function objectDistanceRange(f) {
  return { min: 3, max: Math.max(60, f * 5) };
}

/**
 * Screen sharpness is intentionally simple: a real image forms a sharp spot
 * only when the screen is within a small tolerance of the image plane.
 */
export function screenSharpness(screenX, imageX, f) {
  if (!Number.isFinite(imageX)) return 0;
  const tolerance = Math.max(1.2, f * 0.12);
  const distance = Math.abs(screenX - imageX);
  return Math.max(0, 1 - distance / tolerance);
}
