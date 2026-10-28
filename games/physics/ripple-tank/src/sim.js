/* A compact 2D finite-difference ripple tank.
 *
 * The simulation solves the scalar wave equation on a regular grid:
 *
 *   u_tt = c(x,y)^2 (u_xx + u_yy) - damping * u_t
 *
 * Variable c creates refraction, hard cells create reflection and diffraction,
 * and two oscillating sources create an interference pattern. This is a real
 * field simulation rather than a set of painted curves.
 */

export const TANK = { width: 40, height: 30 };
export const NX = 220;
export const NY = 165;
export const DX = TANK.width / NX;
export const DY = TANK.height / NY;
export const C_DEEP = 12; // cm/s
export const SOURCE_X = 6.0;
export const SOURCE_Y = 15.0;

const C_MAX = C_DEEP;
const DT = 0.35 * Math.min(DX, DY) / C_MAX;
const DEEP2 = C_DEEP * C_DEEP;

export const SCENES = {
  free: {
    id: 'free',
    label: '自由水波',
    short: '自由',
    description: '觀察平面波或圓形波。波陣面之間的距離就是波長 λ。',
    formula: 'v = f λ',
  },
  reflection: {
    id: 'reflection',
    label: '反射',
    short: '反射',
    description: '平面波撞向斜放的障礙物。入射角等於反射角，頻率、波速和波長都不變。',
    formula: 'i = r',
  },
  refraction: {
    id: 'refraction',
    label: '折射',
    short: '折射',
    description: '水波斜射入淺水區。速度與波長變小，頻率保持不變。',
    formula: 'sin i / sin r = v₁ / v₂',
  },
  diffraction: {
    id: 'diffraction',
    label: '衍射',
    short: '衍射',
    description: '平面波通過狹縫後向兩側擴散。狹縫越窄、波長越長，扩散越明顯。',
    formula: 'λ ↑ 或 縫寬 ↓ → 衍射更明顯',
  },
  interference: {
    id: 'interference',
    label: '雙源干涉',
    short: '干涉',
    description: '兩個同相相干源產生穩定的腹線與節線。程差決定相長或相消干涉。',
    formula: 'Δ = nλ（相長）；Δ = (n+½)λ（相消）',
  },
};

export class RippleSim {
  constructor() {
    this.u0 = new Float32Array(NX * NY);
    this.u1 = new Float32Array(NX * NY);
    this.u2 = new Float32Array(NX * NY);
    this.c2 = new Float32Array(NX * NY).fill(DEEP2);
    this.solid = new Uint8Array(NX * NY);
    this.damp = new Float32Array(NX * NY);
    this.options = {
      scene: 'free',
      sourceType: 'plane',
      frequency: 1.5,
      amplitude: 0.8,
      barrierAngle: 32,
      interfaceTilt: 18,
      shallowSpeed: 6,
      gap: 4,
      separation: 12,
    };
    this.time = 0;
    this.phase = 0;
    this.acc = 0;
    this.configure(this.options);
  }

  configure(patch = {}) {
    this.options = { ...this.options, ...patch };
    this.rebuildGeometry();
    this.resetField();
  }

  resetField() {
    this.u0.fill(0);
    this.u1.fill(0);
    this.u2.fill(0);
    this.time = 0;
    this.phase = 0;
    this.acc = 0;
  }

  rebuildGeometry() {
    const opt = this.options;
    this.c2.fill(DEEP2);
    this.solid.fill(0);
    this.damp.fill(0);

    /* Sponge layer at the outer edge keeps the tank visually clean. */
    const spongeCells = Math.round(3.2 / DX);
    for (let j = 0; j < NY; j += 1) {
      for (let i = 0; i < NX; i += 1) {
        const edge = Math.min(i, j, NX - 1 - i, NY - 1 - j);
        if (edge < spongeCells) {
          this.damp[j * NX + i] = 0.0015 + 0.018 * (1 - edge / spongeCells);
        }
      }
    }

    if (opt.scene === 'reflection') {
      const a = (opt.barrierAngle * Math.PI) / 180;
      const cx = 28;
      const cy = 15;
      const dx = Math.sin(a) * 20;
      const dy = Math.cos(a) * 20;
      this.markLine(cx - dx, cy - dy, cx + dx, cy + dy, 0.45);
    }

    if (opt.scene === 'refraction') {
      const tilt = (opt.interfaceTilt * Math.PI) / 180;
      const cShallow = Math.max(3, Math.min(10, opt.shallowSpeed));
      for (let j = 0; j < NY; j += 1) {
        const y = (j + 0.5) * DY;
        const boundary = 25 + (y - 15) * Math.tan(tilt);
        for (let i = 0; i < NX; i += 1) {
          const x = (i + 0.5) * DX;
          if (x > boundary) this.c2[j * NX + i] = cShallow * cShallow;
        }
      }
    }

    if (opt.scene === 'diffraction') {
      const cx = 26;
      const gapHalf = Math.max(0.8, opt.gap / 2);
      const y1 = 15 - gapHalf;
      const y2 = 15 + gapHalf;
      this.markLine(cx, 0, cx, y1, 0.5);
      this.markLine(cx, y2, cx, TANK.height, 0.5);
    }

    /* Make sure the source area is not blocked. */
    if (opt.scene !== 'interference') {
      this.clearDisk(SOURCE_X, SOURCE_Y, 1.2);
    }
  }

  markLine(x1, y1, x2, y2, thickness) {
    const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / (DX * 0.5));
    const radius = thickness / 2;
    for (let s = 0; s <= steps; s += 1) {
      const t = s / steps;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      this.markDisk(x, y, radius);
    }
  }

  markDisk(x, y, radius) {
    const i0 = Math.max(0, Math.floor((x - radius) / DX));
    const i1 = Math.min(NX - 1, Math.ceil((x + radius) / DX));
    const j0 = Math.max(0, Math.floor((y - radius) / DY));
    const j1 = Math.min(NY - 1, Math.ceil((y + radius) / DY));
    for (let j = j0; j <= j1; j += 1) {
      for (let i = i0; i <= i1; i += 1) {
        const px = (i + 0.5) * DX;
        const py = (j + 0.5) * DY;
        if (Math.hypot(px - x, py - y) <= radius + DX * 0.5) {
          this.solid[j * NX + i] = 1;
        }
      }
    }
  }

  clearDisk(x, y, radius) {
    const i0 = Math.max(0, Math.floor((x - radius) / DX));
    const i1 = Math.min(NX - 1, Math.ceil((x + radius) / DX));
    const j0 = Math.max(0, Math.floor((y - radius) / DY));
    const j1 = Math.min(NY - 1, Math.ceil((y + radius) / DY));
    for (let j = j0; j <= j1; j += 1) {
      for (let i = i0; i <= i1; i += 1) {
        this.solid[j * NX + i] = 0;
      }
    }
  }

  sourceCenters() {
    const opt = this.options;
    if (opt.scene === 'interference') {
      const sep = Math.max(3, opt.separation);
      return [
        { x: 10, y: 15 - sep / 2 },
        { x: 10, y: 15 + sep / 2 },
      ];
    }
    if (opt.sourceType === 'circular' || opt.scene === 'free') {
      return [{ x: SOURCE_X + 2, y: SOURCE_Y }];
    }
    return [{ x: SOURCE_X, y: SOURCE_Y }];
  }

  injectSource() {
    const opt = this.options;
    const amp = Math.max(0.05, opt.amplitude);
    const wave = Math.sin(this.phase) * amp;
    const W = NX;
    if (opt.scene !== 'interference' && opt.sourceType === 'plane') {
      const i = Math.max(1, Math.min(NX - 2, Math.round(SOURCE_X / DX)));
      for (let j = 1; j < NY - 1; j += 1) {
        if (this.solid[j * W + i]) continue;
        this.u1[j * W + i] = wave;
        this.u0[j * W + i] = wave * 0.86;
      }
      return;
    }

    for (const source of this.sourceCenters()) {
      const ci = source.x / DX;
      const cj = source.y / DY;
      const r = 3.2;
      for (let j = Math.max(1, Math.floor(cj - r)); j <= Math.min(NY - 2, Math.ceil(cj + r)); j += 1) {
        for (let i = Math.max(1, Math.floor(ci - r)); i <= Math.min(NX - 2, Math.ceil(ci + r)); i += 1) {
          if (this.solid[j * W + i]) continue;
          const d = Math.hypot(i - ci, j - cj);
          if (d <= r) {
            const falloff = 1 - d / (r + 1);
            this.u1[j * W + i] = wave * falloff;
          }
        }
      }
    }
  }

  step() {
    this.phase += 2 * Math.PI * this.options.frequency * DT;
    this.time += DT;
    this.injectSource();

    const W = NX;
    const k = (DT * DT) / (DX * DX);
    const u0 = this.u0;
    const u1 = this.u1;
    const u2 = this.u2;
    const c2 = this.c2;
    const solid = this.solid;
    const damp = this.damp;

    for (let j = 1; j < NY - 1; j += 1) {
      for (let i = 1; i < NX - 1; i += 1) {
        const index = j * W + i;
        if (solid[index]) {
          u2[index] = 0;
          continue;
        }
        const lap = u1[index + 1] + u1[index - 1] + u1[index + W] + u1[index - W] - 4 * u1[index];
        u2[index] = 2 * u1[index] - u0[index] + c2[index] * k * lap - damp[index] * (u1[index] - u0[index]);
      }
    }

    this.u0 = u1;
    this.u1 = u2;
    this.u2 = u0;
  }

  advance(realDt) {
    this.acc += Math.min(0.05, Math.max(0, realDt));
    let steps = 0;
    while (this.acc >= DT && steps < 4) {
      this.step();
      this.acc -= DT;
      steps += 1;
    }
    return steps;
  }

  warmUp(seconds = 1.2) {
    const steps = Math.min(420, Math.round(seconds / DT));
    for (let i = 0; i < steps; i += 1) this.step();
    this.acc = 0;
  }

  sample(x, y) {
    const gx = Math.max(0, Math.min(NX - 1.001, x / DX));
    const gy = Math.max(0, Math.min(NY - 1.001, y / DY));
    const i = Math.floor(gx);
    const j = Math.floor(gy);
    const fx = gx - i;
    const fy = gy - j;
    const W = NX;
    const a = this.u1[j * W + i];
    const b = this.u1[j * W + i + 1];
    const c = this.u1[(j + 1) * W + i];
    const d = this.u1[(j + 1) * W + i + 1];
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
  }

  metrics() {
    const opt = this.options;
    const f = opt.frequency;
    const deep = C_DEEP;
    const shallow = opt.shallowSpeed;
    const lambdaDeep = deep / f;
    const lambdaShallow = shallow / f;
    let reflectionAngle = Math.abs(opt.barrierAngle);
    const incidence = Math.abs(opt.interfaceTilt);
    const ratio = shallow / deep;
    const sinR = Math.min(1, ratio * Math.sin((incidence * Math.PI) / 180));
    const refractionAngle = (Math.asin(sinR) * 180) / Math.PI;
    return {
      f,
      deep,
      shallow,
      lambdaDeep,
      lambdaShallow,
      reflectionAngle,
      incidence,
      refractionAngle,
      ratio,
    };
  }
}

/* A small helper shared by the diagram renderer. */
export function gridValue(field, i, j) {
  return field[Math.max(0, Math.min(NY - 1, j)) * NX + Math.max(0, Math.min(NX - 1, i))];
}
