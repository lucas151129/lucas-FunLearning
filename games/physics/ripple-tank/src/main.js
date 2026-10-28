import {
  RippleSim,
  SCENES,
  TANK,
  NX,
  NY,
  DX,
  DY,
  C_DEEP,
} from './sim.js';
import { TASKS } from './tasks.js';

const $ = (selector) => document.querySelector(selector);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const state = {
  scene: 'free',
  view: 'water',
  running: true,
  frequency: 1.5,
  amplitude: 0.8,
  barrierAngle: 32,
  interfaceTilt: 18,
  shallowSpeed: 6,
  gap: 4,
  separation: 12,
  sourceType: 'plane',
  wavefronts: true,
  rays: true,
  nodal: false,
  measuring: false,
  points: [],
  probe: null,
  nodalSegments: [],
  taskIndex: 0,
  taskAnswered: false,
  taskSelected: null,
  taskScore: 0,
  taskScores: [],
  lastFrame: 0,
  viewport: { scale: 1, x: 0, y: 0, width: 1, height: 1 },
};

const sim = new RippleSim();
const canvas = $('#scene');
const sceneWrap = $('#sceneWrap');
const ctx = canvas.getContext('2d');
const fieldCanvas = document.createElement('canvas');
fieldCanvas.width = NX;
fieldCanvas.height = NY;
const fieldCtx = fieldCanvas.getContext('2d');
const fieldImage = fieldCtx.createImageData(NX, NY);
let dpr = 1;

/* -------------------------------------------------------------------------- */
/* Canvas transforms                                                          */
/* -------------------------------------------------------------------------- */

function resizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, sceneWrap.clientWidth);
  const height = Math.max(1, sceneWrap.clientHeight);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const scale = Math.min((width - 18) / TANK.width, (height - 18) / TANK.height);
  state.viewport = {
    scale,
    x: (width - TANK.width * scale) / 2,
    y: (height - TANK.height * scale) / 2,
    width,
    height,
  };
  draw(performance.now());
}

function worldToScreen(x, y) {
  const v = state.viewport;
  return { x: v.x + x * v.scale, y: v.y + y * v.scale };
}

function screenToWorld(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const px = ((clientX - rect.left) / rect.width) * canvas.width / dpr;
  const py = ((clientY - rect.top) / rect.height) * canvas.height / dpr;
  const v = state.viewport;
  return { x: (px - v.x) / v.scale, y: (py - v.y) / v.scale };
}

function setWorldTransform() {
  const v = state.viewport;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(v.x, v.y);
  ctx.scale(v.scale, v.scale);
}

/* -------------------------------------------------------------------------- */
/* Field rendering                                                            */
/* -------------------------------------------------------------------------- */

function renderWaterField() {
  const field = sim.u1;
  const data = fieldImage.data;
  let maxAbs = 0.001;
  for (let i = 0; i < field.length; i += 1) maxAbs = Math.max(maxAbs, Math.abs(field[i]));
  const gain = 1 / maxAbs;
  const light = { x: 0.45, y: 0.68, z: 0.58 };
  const lightLen = Math.hypot(light.x, light.y, light.z);
  light.x /= lightLen; light.y /= lightLen; light.z /= lightLen;
  const half = { x: light.x, y: light.y, z: light.z + 1 };
  const halfLen = Math.hypot(half.x, half.y, half.z);
  half.x /= halfLen; half.y /= halfLen; half.z /= halfLen;

  for (let j = 0; j < NY; j += 1) {
    for (let i = 0; i < NX; i += 1) {
      const index = j * NX + i;
      const u = field[index];
      const h = clamp(u * gain, -1, 1);
      const left = field[j * NX + Math.max(0, i - 1)];
      const right = field[j * NX + Math.min(NX - 1, i + 1)];
      const up = field[Math.max(0, j - 1) * NX + i];
      const down = field[Math.min(NY - 1, j + 1) * NX + i];
      const gx = (right - left) * 13 + Math.sin(i * 0.55 + sim.time * 1.7) * 0.018;
      const gy = (down - up) * 13 + Math.cos(j * 0.61 - sim.time * 1.3) * 0.018;
      let nx = -gx;
      let ny = -gy;
      let nz = 1;
      const nl = Math.hypot(nx, ny, nz);
      nx /= nl; ny /= nl; nz /= nl;

      const shallow = sim.c2[index] < C_DEEP * C_DEEP - 1;
      const baseDeep = [9, 57, 76];
      const baseShallow = [17, 101, 112];
      const base = shallow ? baseShallow : baseDeep;
      const diffuse = Math.max(0, nx * light.x + ny * light.y + nz * light.z);
      const spec = Math.pow(Math.max(0, nx * half.x + ny * half.y + nz * half.z), 52);
      const caustic = Math.max(0, (left + right + up + down - 4 * u) * gain * 8);
      const shade = 0.72 + diffuse * 0.5 + h * 0.16;
      const foam = Math.max(0, (h - 0.55) * 2.2) * 18;
      const pixel = index * 4;
      data[pixel] = clamp(base[0] * shade + spec * 198 + caustic * 85 + foam * 1.2, 0, 255);
      data[pixel + 1] = clamp(base[1] * shade + spec * 245 + caustic * 105 + foam * 1.3, 0, 255);
      data[pixel + 2] = clamp(base[2] * shade + spec * 255 + caustic * 125 + foam * 1.4, 0, 255);
      data[pixel + 3] = 255;
    }
  }
  fieldCtx.putImageData(fieldImage, 0, 0);
}

function drawWater() {
  setWorldTransform();
  const v = state.viewport;
  ctx.fillStyle = '#031019';
  ctx.fillRect(0, 0, v.width, v.height);

  const water = ctx.createLinearGradient(0, 0, TANK.width, TANK.height);
  water.addColorStop(0, '#041824');
  water.addColorStop(1, '#03121c');
  ctx.fillStyle = water;
  ctx.fillRect(0, 0, TANK.width, TANK.height);

  renderWaterField();
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(fieldCanvas, 0, 0, NX, NY, 0, 0, TANK.width, TANK.height);
  const vignette = ctx.createRadialGradient(
    TANK.width / 2, TANK.height / 2, TANK.height * 0.28,
    TANK.width / 2, TANK.height / 2, TANK.width * 0.65,
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,7,12,.34)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, TANK.width, TANK.height);
  ctx.restore();

  drawShallowOverlay(0.12);
  drawWaterFrame();
  drawGeometry(false);
  drawLabels();
  drawMeasurement();
  ctx.restore();
}

/* -------------------------------------------------------------------------- */
/* Diagram rendering                                                          */
/* -------------------------------------------------------------------------- */

function drawDiagram() {
  setWorldTransform();
  const v = state.viewport;
  ctx.fillStyle = '#03121c';
  ctx.fillRect(0, 0, v.width, v.height);

  ctx.fillStyle = '#061c26';
  ctx.fillRect(0, 0, TANK.width, TANK.height);
  ctx.strokeStyle = 'rgba(95,243,255,.045)';
  ctx.lineWidth = 0.06;
  for (let x = 0; x <= TANK.width; x += 2) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, TANK.height);
    ctx.stroke();
  }
  for (let y = 0; y <= TANK.height; y += 2) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(TANK.width, y);
    ctx.stroke();
  }

  drawShallowOverlay(0.16);
  if (state.wavefronts) drawWavefronts();
  if (state.nodal && state.scene === 'interference') drawNodalLines();
  if (state.rays) drawRays();
  drawGeometry(true);
  drawLabels();
  drawMeasurement();
  ctx.restore();
}

function drawWaterFrame() {
  ctx.save();
  const sheen = ctx.createLinearGradient(0, 0, TANK.width, TANK.height);
  sheen.addColorStop(0, 'rgba(255,255,255,.08)');
  sheen.addColorStop(0.35, 'rgba(255,255,255,0)');
  sheen.addColorStop(1, 'rgba(0,0,0,.16)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, TANK.width, TANK.height);
  ctx.strokeStyle = 'rgba(188,238,243,.38)';
  ctx.lineWidth = 0.24;
  ctx.strokeRect(0.12, 0.12, TANK.width - 0.24, TANK.height - 0.24);
  ctx.strokeStyle = 'rgba(255,255,255,.08)';
  ctx.lineWidth = 1.1;
  ctx.strokeRect(-0.55, -0.55, TANK.width + 1.1, TANK.height + 1.1);
  ctx.restore();
}

function drawShallowOverlay(alpha) {
  if (state.scene !== 'refraction') return;
  const tilt = (state.interfaceTilt * Math.PI) / 180;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(25 + (0 - 15) * Math.tan(tilt), 0);
  ctx.lineTo(25 + (TANK.height - 15) * Math.tan(tilt), TANK.height);
  ctx.lineTo(TANK.width, TANK.height);
  ctx.lineTo(TANK.width, 0);
  ctx.closePath();
  ctx.fillStyle = `rgba(95,243,255,${alpha})`;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,178,28,.75)';
  ctx.lineWidth = 0.22;
  ctx.setLineDash([0.8, 0.5]);
  ctx.beginPath();
  ctx.moveTo(25 + (0 - 15) * Math.tan(tilt), 0);
  ctx.lineTo(25 + (TANK.height - 15) * Math.tan(tilt), TANK.height);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,178,28,.8)';
  ctx.font = '700 0.72px "Microsoft JhengHei", sans-serif';
  ctx.fillText('SHALLOW / 淺水', 32, 3);
  ctx.restore();
}

function smoothField(field) {
  const out = new Float32Array(field.length);
  for (let j = 1; j < NY - 1; j += 1) {
    for (let i = 1; i < NX - 1; i += 1) {
      const index = j * NX + i;
      out[index] = (
        field[index] * 4
        + field[index - 1]
        + field[index + 1]
        + field[index - NX]
        + field[index + NX]
        + field[index - NX - 1]
        + field[index - NX + 1]
        + field[index + NX - 1]
        + field[index + NX + 1]
      ) / 12;
    }
  }
  return out;
}

function drawWavefronts() {
  const lambda = C_DEEP / state.frequency;
  const offset = (sim.time * C_DEEP) % lambda;
  ctx.save();
  ctx.strokeStyle = 'rgba(95,243,255,.68)';
  ctx.lineWidth = 0.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.rect(0, 0, TANK.width, TANK.height);
  ctx.clip();

  if (state.scene === 'free') {
    if (state.sourceType === 'plane') {
      for (let n = -2; n < 12; n += 1) {
        const x = 6 + n * lambda + offset;
        if (x < 0 || x > TANK.width) continue;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, TANK.height);
      }
    } else {
      const source = sim.sourceCenters()[0];
      for (let n = 0; n < 8; n += 1) {
        const radius = n * lambda + offset;
        if (radius <= 0 || radius > 45) continue;
        ctx.moveTo(source.x + radius, source.y);
        ctx.arc(source.x, source.y, radius, 0, Math.PI * 2);
      }
    }
    ctx.stroke();
  } else if (state.scene === 'reflection') {
    const a = (state.barrierAngle * Math.PI) / 180;
    const origin = { x: 28, y: 15 };
    const dir = { x: Math.sin(a), y: Math.cos(a) };
    const reflect = (point) => {
      const vx = point.x - origin.x;
      const vy = point.y - origin.y;
      const proj = vx * dir.x + vy * dir.y;
      return {
        x: origin.x + 2 * proj * dir.x - vx,
        y: origin.y + 2 * proj * dir.y - vy,
      };
    };
    for (let n = -2; n < 12; n += 1) {
      const x = 6 + n * lambda + offset;
      if (x < 0 || x > TANK.width) continue;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, TANK.height);
      const top = reflect({ x, y: 0 });
      const bottom = reflect({ x, y: TANK.height });
      ctx.moveTo(top.x, top.y);
      ctx.lineTo(bottom.x, bottom.y);
    }
    ctx.stroke();
  } else if (state.scene === 'refraction') {
    const tilt = (state.interfaceTilt * Math.PI) / 180;
    const ratio = state.shallowSpeed / C_DEEP;
    const r = Math.asin(Math.min(1, ratio * Math.sin(tilt)));
    const boundary = (y) => 25 + (y - 15) * Math.tan(tilt);
    const deepClip = () => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(boundary(0), 0);
      ctx.lineTo(boundary(TANK.height), TANK.height);
      ctx.lineTo(0, TANK.height);
      ctx.closePath();
      ctx.clip();
    };
    const shallowClip = () => {
      ctx.beginPath();
      ctx.moveTo(boundary(0), 0);
      ctx.lineTo(TANK.width, 0);
      ctx.lineTo(TANK.width, TANK.height);
      ctx.lineTo(boundary(TANK.height), TANK.height);
      ctx.closePath();
      ctx.clip();
    };

    ctx.save();
    deepClip();
    for (let n = -3; n < 14; n += 1) {
      const x = 6 + n * lambda + offset;
      if (x < 0 || x > TANK.width) continue;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, TANK.height);
    }
    ctx.stroke();
    ctx.restore();

    ctx.save();
    shallowClip();
    ctx.strokeStyle = 'rgba(255,178,28,.5)';
    const lambda2 = state.shallowSpeed / state.frequency;
    const offset2 = (sim.time * state.shallowSpeed) % lambda2;
    const theta = tilt + r;
    const nx = Math.cos(theta);
    const ny = Math.sin(theta);
    const dx = -Math.sin(theta);
    const dy = Math.cos(theta);
    for (let n = -12; n <= 12; n += 1) {
      const px = 25 + n * lambda2 * nx + offset2 * nx;
      const py = 15 + n * lambda2 * ny + offset2 * ny;
      ctx.moveTo(px - dx * 50, py - dy * 50);
      ctx.lineTo(px + dx * 50, py + dy * 50);
    }
    ctx.stroke();
    ctx.restore();
  } else if (state.scene === 'diffraction') {
    const wallX = 26;
    const gapHalf = Math.max(0.8, state.gap / 2);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, wallX, TANK.height);
    ctx.clip();
    for (let n = -3; n < 14; n += 1) {
      const x = 6 + n * lambda + offset;
      if (x < 0 || x > wallX) continue;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, TANK.height);
    }
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.rect(wallX, 0, TANK.width - wallX, TANK.height);
    ctx.clip();
    for (let n = 0; n < 10; n += 1) {
      const radius = n * lambda + offset;
      if (radius <= 0 || radius > 46) continue;
      ctx.moveTo(wallX + radius, 15);
      ctx.arc(wallX, 15, radius, 0, Math.PI * 2);
    }
    ctx.stroke();
    ctx.restore();
  } else if (state.scene === 'interference') {
    const sources = sim.sourceCenters();
    const colors = ['rgba(95,243,255,.55)', 'rgba(255,178,28,.42)'];
    sources.forEach((source, index) => {
      ctx.strokeStyle = colors[index];
      ctx.beginPath();
      for (let n = 0; n < 9; n += 1) {
        const radius = n * lambda + offset;
        if (radius <= 0 || radius > 46) continue;
        ctx.moveTo(source.x + radius, source.y);
        ctx.arc(source.x, source.y, radius, 0, Math.PI * 2);
      }
      ctx.stroke();
    });
    ctx.strokeStyle = 'rgba(95,243,255,.68)';
  }
  ctx.restore();
}

function drawNodalLines() {
  const [s1, s2] = sim.sourceCenters();
  if (!s1 || !s2) return;
  const lambda = C_DEEP / state.frequency;
  const targets = [];
  for (let n = -4; n <= 4; n += 1) targets.push((n + 0.5) * lambda);
  ctx.save();
  ctx.strokeStyle = 'rgba(102,246,165,.7)';
  ctx.lineWidth = 0.16;
  ctx.setLineDash([0.6, 0.45]);
  for (const target of targets) {
    ctx.beginPath();
    for (let j = 0; j < NY - 1; j += 2) {
      for (let i = 0; i < NX - 1; i += 2) {
        const val = (x, y) => {
          const d1 = Math.hypot(x - s1.x, y - s1.y);
          const d2 = Math.hypot(x - s2.x, y - s2.y);
          return d1 - d2 - target;
        };
        const x0 = i * DX;
        const y0 = j * DY;
        const x1 = (i + 2) * DX;
        const y1 = (j + 2) * DY;
        const v00 = val(x0, y0);
        const v10 = val(x1, y0);
        const v11 = val(x1, y1);
        const v01 = val(x0, y1);
        const a = v00 > 0; const b = v10 > 0; const c = v11 > 0; const d = v01 > 0;
        const points = [];
        if (a !== b) points.push({ x: x0 + (x1 - x0) * Math.abs(v00) / (Math.abs(v00) + Math.abs(v10) || 1), y: y0 });
        if (b !== c) points.push({ x: x1, y: y0 + (y1 - y0) * Math.abs(v10) / (Math.abs(v10) + Math.abs(v11) || 1) });
        if (c !== d) points.push({ x: x0 + (x1 - x0) * Math.abs(v01) / (Math.abs(v01) + Math.abs(v11) || 1), y: y1 });
        if (d !== a) points.push({ x: x0, y: y0 + (y1 - y0) * Math.abs(v00) / (Math.abs(v00) + Math.abs(v01) || 1) });
        if (points.length >= 2) {
          ctx.moveTo(points[0].x, points[0].y);
          ctx.lineTo(points[1].x, points[1].y);
        }
      }
    }
    ctx.stroke();
  }
  ctx.restore();
}

/* -------------------------------------------------------------------------- */
/* Geometry and rays                                                          */
/* -------------------------------------------------------------------------- */

function drawGeometry(diagram) {
  ctx.save();
  if (state.scene === 'reflection') {
    const a = (state.barrierAngle * Math.PI) / 180;
    const cx = 28;
    const cy = 15;
    const dx = Math.sin(a) * 20;
    const dy = Math.cos(a) * 20;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(2,8,12,.8)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(cx - dx, cy - dy);
    ctx.lineTo(cx + dx, cy + dy);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(160,230,236,.9)';
    ctx.lineWidth = 0.28;
    ctx.stroke();
    ctx.setLineDash([0.5, 0.4]);
    ctx.strokeStyle = 'rgba(255,178,28,.35)';
    ctx.lineWidth = 0.12;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * 6, cy - Math.sin(a) * 6);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (state.scene === 'diffraction') {
    const gapHalf = Math.max(0.8, state.gap / 2);
    ctx.fillStyle = 'rgba(3,10,15,.94)';
    ctx.strokeStyle = 'rgba(160,230,236,.8)';
    ctx.lineWidth = 0.18;
    ctx.fillRect(25.7, 0, 0.6, 15 - gapHalf);
    ctx.fillRect(25.7, 15 + gapHalf, 0.6, TANK.height - (15 + gapHalf));
    ctx.strokeRect(25.7, 0, 0.6, 15 - gapHalf);
    ctx.strokeRect(25.7, 15 + gapHalf, 0.6, TANK.height - (15 + gapHalf));
    ctx.fillStyle = 'rgba(255,178,28,.55)';
    ctx.font = '700 0.72px "Microsoft JhengHei", sans-serif';
    ctx.fillText('SLIT', 27.2, 15 + gapHalf + 1.8);
  }

  if (state.scene === 'interference') {
    const [s1, s2] = sim.sourceCenters();
    for (const source of [s1, s2]) {
      if (!source) continue;
      ctx.fillStyle = 'rgba(95,243,255,.16)';
      ctx.beginPath();
      ctx.arc(source.x, source.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5ff3ff';
      ctx.beginPath();
      ctx.arc(source.x, source.y, 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(232,251,255,.8)';
      ctx.font = '700 0.75px "Microsoft JhengHei", sans-serif';
      ctx.fillText(source === s1 ? 'S₁' : 'S₂', source.x + 1.1, source.y - 0.8);
    }
  } else if (state.sourceType === 'plane' && state.scene !== 'interference') {
    ctx.save();
    ctx.strokeStyle = 'rgba(95,243,255,.75)';
    ctx.lineWidth = 0.32;
    ctx.shadowColor = 'rgba(95,243,255,.55)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(6, 0.5);
    ctx.lineTo(6, TANK.height - 0.5);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = 'rgba(232,251,255,.8)';
    ctx.font = '700 0.72px "Microsoft JhengHei", sans-serif';
    ctx.fillText('PLANE SOURCE', 7, 2.2);
  } else {
    const source = sim.sourceCenters()[0];
    ctx.fillStyle = 'rgba(95,243,255,.18)';
    ctx.beginPath();
    ctx.arc(source.x, source.y, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5ff3ff';
    ctx.beginPath();
    ctx.arc(source.x, source.y, 0.42, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function arrow(x1, y1, x2, y2, color, dashed = false, width = 0.13) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dashed ? [0.6, 0.45] : []);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = 0.55;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - size * Math.cos(angle - 0.45), y2 - size * Math.sin(angle - 0.45));
  ctx.lineTo(x2 - size * Math.cos(angle + 0.45), y2 - size * Math.sin(angle + 0.45));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawRays() {
  ctx.save();
  if (state.scene === 'free') {
    for (const y of [8, 15, 22]) arrow(7, y, 36, y, 'rgba(95,243,255,.58)');
    if (state.sourceType === 'circular') {
      for (let a = 0; a < 360; a += 45) {
        const r = (a * Math.PI) / 180;
        arrow(8.2, 15, 8.2 + Math.cos(r) * 13, 15 + Math.sin(r) * 13, 'rgba(95,243,255,.38)');
      }
    }
  }
  if (state.scene === 'reflection') {
    const a = (state.barrierAngle * Math.PI) / 180;
    const cx = 28;
    const cy = 15;
    const nx = Math.cos(a);
    const ny = -Math.sin(a);
    for (const offset of [-5, 0, 5]) {
      const hitX = cx + Math.sin(a) * offset;
      const hitY = cy + Math.cos(a) * offset;
      arrow(7, hitY, hitX, hitY, 'rgba(95,243,255,.58)');
      const rx = -Math.cos(2 * a);
      const ry = Math.sin(2 * a);
      arrow(hitX, hitY, hitX + rx * 10, hitY + ry * 10, 'rgba(255,178,28,.66)');
      arrow(hitX, hitY, hitX + nx * 4, hitY + ny * 4, 'rgba(102,246,165,.55)', true, 0.09);
    }
  }
  if (state.scene === 'refraction') {
    const tilt = (state.interfaceTilt * Math.PI) / 180;
    const ratio = state.shallowSpeed / C_DEEP;
    for (const y of [8, 15, 22]) {
      const xb = 25 + (y - 15) * Math.tan(tilt);
      arrow(7, y, xb, y, 'rgba(95,243,255,.58)');
      const r = Math.asin(Math.min(1, ratio * Math.sin(tilt)));
      const rayAngle = tilt + r;
      const ex = xb + Math.cos(rayAngle) * 10;
      const ey = y + Math.sin(rayAngle) * 10;
      arrow(xb, y, ex, ey, 'rgba(255,178,28,.66)');
      arrow(xb, y, xb + Math.cos(tilt) * 4, y - Math.sin(tilt) * 4, 'rgba(102,246,165,.5)', true, 0.09);
    }
  }
  if (state.scene === 'diffraction') {
    const gapHalf = Math.max(0.8, state.gap / 2);
    for (const sy of [12, 15, 18]) {
      arrow(7, sy, 25.5, 15, 'rgba(95,243,255,.45)');
    }
    for (const a of [-32, -16, 0, 16, 32]) {
      const r = (a * Math.PI) / 180;
      arrow(26.3, 15, 26.3 + Math.cos(r) * 9, 15 + Math.sin(r) * 9, 'rgba(255,178,28,.55)');
    }
    ctx.fillStyle = 'rgba(255,178,28,.7)';
    ctx.font = '700 1px "Microsoft JhengHei", sans-serif';
    ctx.fillText(`${gapHalf * 2} cm`, 27, 15 - gapHalf - 1);
  }
  if (state.scene === 'interference') {
    const [s1, s2] = sim.sourceCenters();
    const point = state.probe || { x: 31, y: 15 };
    arrow(s1.x, s1.y, point.x, point.y, 'rgba(95,243,255,.72)');
    arrow(s2.x, s2.y, point.x, point.y, 'rgba(255,178,28,.72)');
    ctx.fillStyle = '#66f6a5';
    ctx.beginPath();
    ctx.arc(point.x, point.y, 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/* -------------------------------------------------------------------------- */
/* Labels and measurement                                                     */
/* -------------------------------------------------------------------------- */

function drawLabels() {
  ctx.save();
  ctx.fillStyle = 'rgba(232,251,255,.75)';
  ctx.font = '700 0.74px "Microsoft JhengHei", sans-serif';
  ctx.fillText(SCENES[state.scene].label, 1.2, 2.6);
  ctx.fillStyle = 'rgba(136,168,176,.75)';
  ctx.font = '0.54px Consolas, monospace';
  ctx.fillText(`f ${state.frequency.toFixed(2)} Hz   λ ${(C_DEEP / state.frequency).toFixed(1)} cm`, 1.2, TANK.height - 1.1);
  if (state.scene === 'reflection') {
    ctx.fillStyle = 'rgba(255,178,28,.78)';
    ctx.fillText(`i = r = ${Math.abs(state.barrierAngle).toFixed(0)}°`, 1.2, TANK.height - 2.8);
  }
  if (state.scene === 'refraction') {
    const m = sim.metrics();
    ctx.fillStyle = 'rgba(255,178,28,.78)';
    ctx.fillText(`i ${m.incidence.toFixed(0)}° → r ${m.refractionAngle.toFixed(1)}°   v₂ ${state.shallowSpeed.toFixed(1)} cm/s`, 1.2, TANK.height - 2.8);
  }
  ctx.restore();
}

function drawMeasurement() {
  if (!state.points.length && !state.probe) return;
  ctx.save();
  if (state.probe) {
    ctx.fillStyle = '#66f6a5';
    ctx.beginPath();
    ctx.arc(state.probe.x, state.probe.y, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(102,246,165,.55)';
    ctx.lineWidth = 0.12;
    ctx.setLineDash([0.5, 0.4]);
    ctx.beginPath();
    ctx.arc(state.probe.x, state.probe.y, 1.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  for (const point of state.points) {
    ctx.fillStyle = '#ffb21c';
    ctx.beginPath();
    ctx.arc(point.x, point.y, 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,178,28,.8)';
    ctx.lineWidth = 0.12;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 1.0, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (state.points.length === 2) {
    const [a, b] = state.points;
    ctx.strokeStyle = '#ffb21c';
    ctx.lineWidth = 0.16;
    ctx.setLineDash([0.7, 0.5]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.setLineDash([]);
    const distance = Math.hypot(a.x - b.x, a.y - b.y);
    ctx.fillStyle = '#ffb21c';
    ctx.font = '700 0.8px Consolas, monospace';
    ctx.fillText(`${distance.toFixed(1)} cm`, (a.x + b.x) / 2 + 0.7, (a.y + b.y) / 2 - 0.7);
  }
  ctx.restore();
}

/* -------------------------------------------------------------------------- */
/* Frame loop                                                                 */
/* -------------------------------------------------------------------------- */

function draw(now) {
  if (state.view === 'water') drawWater();
  else drawDiagram();
}

function frame(now) {
  if (!state.lastFrame) state.lastFrame = now;
  const dt = Math.min(0.05, (now - state.lastFrame) / 1000);
  state.lastFrame = now;
  if (state.running) sim.advance(dt);
  draw(now);
  requestAnimationFrame(frame);
}

/* -------------------------------------------------------------------------- */
/* UI                                                                         */
/* -------------------------------------------------------------------------- */

function configureSim(reset = true) {
  Object.assign(sim.options, {
    scene: state.scene,
    sourceType: state.sourceType,
    frequency: state.frequency,
    amplitude: state.amplitude,
    barrierAngle: state.barrierAngle,
    interfaceTilt: state.interfaceTilt,
    shallowSpeed: state.shallowSpeed,
    gap: state.gap,
    separation: state.separation,
  });
  sim.rebuildGeometry();
  if (reset) {
    sim.resetField();
    sim.warmUp(2.2);
    state.points = [];
    state.probe = null;
  }
  updateUI();
}

function setScene(scene) {
  state.scene = scene;
  state.measuring = false;
  state.points = [];
  state.probe = null;
  if (scene !== 'free') state.sourceType = 'plane';
  configureSim(true);
  document.querySelectorAll('#scenarios button').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.scene === scene);
  });
}

function setView(view) {
  state.view = view;
  $('#waterTab').classList.toggle('is-active', view === 'water');
  $('#diagramTab').classList.toggle('is-active', view === 'diagram');
  $('#waterTab').setAttribute('aria-pressed', String(view === 'water'));
  $('#diagramTab').setAttribute('aria-pressed', String(view === 'diagram'));
  $('#diagramTools').hidden = view !== 'diagram';
  updateUI();
}

function updateUI() {
  const scene = SCENES[state.scene];
  const metrics = sim.metrics();
  $('#freqInput').value = String(state.frequency);
  $('#ampInput').value = String(state.amplitude);
  $('#barrierInput').value = String(state.barrierAngle);
  $('#tiltInput').value = String(state.interfaceTilt);
  $('#shallowInput').value = String(state.shallowSpeed);
  $('#gapInput').value = String(state.gap);
  $('#sepInput').value = String(state.separation);
  $('#freqValue').textContent = `${state.frequency.toFixed(2)} Hz`;
  $('#ampValue').textContent = state.amplitude.toFixed(2);
  $('#barrierValue').textContent = `${state.barrierAngle.toFixed(0)}°`;
  $('#tiltValue').textContent = `${state.interfaceTilt.toFixed(0)}°`;
  $('#shallowValue').textContent = `${state.shallowSpeed.toFixed(1)} cm/s`;
  $('#gapValue').textContent = `${state.gap.toFixed(1)} cm`;
  $('#sepValue').textContent = `${state.separation.toFixed(1)} cm`;

  $('#barrierBlock').hidden = state.scene !== 'reflection';
  $('#refractionBlock').hidden = state.scene !== 'refraction';
  $('#gapBlock').hidden = state.scene !== 'diffraction';
  $('#sepBlock').hidden = state.scene !== 'interference';
  $('#sourceBlock').hidden = !(state.scene === 'free');
  $('#diagramTools').hidden = state.view !== 'diagram';
  $('#measureBtn').classList.toggle('is-active', state.measuring);

  document.querySelectorAll('#scenarios button').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.scene === state.scene);
  });
  document.querySelectorAll('.source-type button').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.source === state.sourceType);
  });

  $('#hudF').textContent = `${state.frequency.toFixed(2)} Hz`;
  $('#hudLambda').textContent = `${metrics.lambdaDeep.toFixed(1)} cm`;
  $('#hudV').textContent = `${C_DEEP.toFixed(1)} cm/s`;
  $('#hudScene').textContent = scene.label;
  $('#sceneLabel').textContent = scene.label;
  $('#sceneFormula').textContent = scene.formula;
  $('#sceneDescription').textContent = scene.description;
  $('#formulaText').textContent = `${C_DEEP.toFixed(1)} = ${state.frequency.toFixed(2)} × ${metrics.lambdaDeep.toFixed(1)}`;
  $('#readoutLambda').textContent = `λ = ${metrics.lambdaDeep.toFixed(1)} cm`;
  $('#readoutSpeed').textContent = `v = ${C_DEEP.toFixed(1)} cm/s`;
  $('#tipText').textContent = tipForScene();
  $('#statusText').textContent = state.measuring
    ? '點擊畫面量度；干涉模式點一點看程差'
    : '拖動量度工具，讀出波長與角度';
  updateMeasurementReadout();
}

function tipForScene() {
  if (state.scene === 'free') return '波峰與波峰之間的距離是一個波長；圓形波的波陣面是一圈圈。';
  if (state.scene === 'reflection') return '入射角與反射角都相對於法線量度；頻率、波速和波長不變。';
  if (state.scene === 'refraction') return '由深水進入淺水：波速變小、波長變短、頻率不變；射線向法線偏折。';
  if (state.scene === 'diffraction') return '狹縫越窄或波長越長，通過狹縫後的波陣面越彎曲，衍射越明顯。';
  return '程差是該點到兩個波源的距離差；半個波長的奇數倍是節線，整數倍是腹線。';
}

function updateMeasurementReadout() {
  const metrics = sim.metrics();
  const card = $('#measureCard');
  const extra = $('#readoutExtra');
  if (state.probe && state.scene === 'interference') {
    const [s1, s2] = sim.sourceCenters();
    const d1 = Math.hypot(state.probe.x - s1.x, state.probe.y - s1.y);
    const d2 = Math.hypot(state.probe.x - s2.x, state.probe.y - s2.y);
    const delta = Math.abs(d1 - d2);
    const ratio = delta / metrics.lambdaDeep;
    const nearInteger = Math.abs(ratio - Math.round(ratio)) < 0.12;
    const kind = nearInteger ? '相長干涉（腹線附近）' : '相消干涉（節線附近）';
    card.hidden = false;
    $('#measureDistance').textContent = `Δ = ${delta.toFixed(1)} cm`;
    $('#measureSecondary').textContent = `Δ/λ = ${ratio.toFixed(2)} · ${kind}`;
    extra.textContent = `S₁P = ${d1.toFixed(1)} cm · S₂P = ${d2.toFixed(1)} cm；${kind}。`;
    return;
  }
  if (state.points.length === 2) {
    const [a, b] = state.points;
    const distance = Math.hypot(a.x - b.x, a.y - b.y);
    card.hidden = false;
    $('#measureDistance').textContent = `${distance.toFixed(1)} cm`;
    $('#measureSecondary').textContent = `理論 λ = ${metrics.lambdaDeep.toFixed(1)} cm`;
    extra.textContent = `量度距離 ${distance.toFixed(1)} cm；與理論波長相差 ${Math.abs(distance - metrics.lambdaDeep).toFixed(1)} cm。`;
    return;
  }
  if (state.points.length === 1) {
    card.hidden = false;
    $('#measureDistance').textContent = '選第二點';
    $('#measureSecondary').textContent = '量度兩點距離';
    extra.textContent = '再點一點，完成量度。';
    return;
  }
  card.hidden = true;
  extra.textContent = state.scene === 'interference'
    ? '點擊畫面一點，查看該點的程差與干涉類型。'
    : '在畫面上點兩點，可核對波長。';
}

/* -------------------------------------------------------------------------- */
/* Task mode                                                                  */
/* -------------------------------------------------------------------------- */

function updateTaskBadge() {
  $('#taskBadge').textContent = `${state.taskScores.filter((score) => score != null).length} / ${TASKS.length} · ${state.taskScore} 分`;
}

function applyTask(task) {
  state.scene = task.scene;
  Object.assign(state, task.setup);
  state.sourceType = task.setup.sourceType || 'plane';
  state.measuring = false;
  state.points = [];
  state.probe = null;
  setView('diagram');
  configureSim(true);
  updateUI();
}

function openTask(index = 0) {
  if (state.taskScore >= 500) {
    state.taskScore = 0;
    state.taskScores = [];
  }
  state.taskIndex = index;
  state.taskAnswered = false;
  state.taskSelected = null;
  const task = TASKS[state.taskIndex];
  applyTask(task);
  $('#taskOverlay').hidden = false;
  renderTask();
  updateTaskBadge();
}

function renderTask() {
  const task = TASKS[state.taskIndex];
  $('#taskNumber').textContent = `${String(state.taskIndex + 1).padStart(2, '0')} / ${String(TASKS.length).padStart(2, '0')}`;
  $('#taskMeter').style.width = `${((state.taskIndex + 1) / TASKS.length) * 100}%`;
  $('#taskTitle').textContent = task.title;
  $('#taskQuestion').textContent = task.question;
  $('#taskOptions').innerHTML = '';
  task.options.forEach((label, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'task-option';
    button.textContent = label;
    button.dataset.index = String(index);
    if (state.taskAnswered) {
      button.disabled = true;
      if (index === task.correct) button.classList.add('is-correct');
      if (state.taskSelected === index && index !== task.correct) button.classList.add('is-wrong');
    }
    $('#taskOptions').appendChild(button);
  });
  const feedback = $('#taskFeedback');
  feedback.className = 'task-feedback';
  if (state.taskAnswered) {
    const correct = state.taskSelected === task.correct;
    feedback.textContent = correct
      ? `正確。${task.explanation}`
      : `再想想。正確答案：${task.options[task.correct]}。${task.explanation}`;
    feedback.classList.toggle('is-bad', !correct);
    $('#taskNext').disabled = false;
    $('#taskNext').textContent = state.taskIndex === TASKS.length - 1 ? '完成' : '下一題';
  } else {
    feedback.textContent = '';
    $('#taskNext').disabled = true;
    $('#taskNext').textContent = '先選答案';
  }
  updateTaskBadge();
}

function answerTask(index) {
  if (state.taskAnswered) return;
  const task = TASKS[state.taskIndex];
  state.taskAnswered = true;
  state.taskSelected = index;
  const correct = index === task.correct;
  state.taskScores[state.taskIndex] = correct ? 100 : 0;
  state.taskScore = state.taskScores.reduce((sum, value) => sum + (value || 0), 0);
  renderTask();
  updateTaskBadge();
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'game-score', score: state.taskScore }, location.origin);
  }
}

function nextTask() {
  if (!state.taskAnswered) return;
  if (state.taskIndex >= TASKS.length - 1) {
    $('#taskOverlay').hidden = true;
    toast(`知識任務完成：${state.taskScore} / 500。`);
    return;
  }
  state.taskIndex += 1;
  state.taskAnswered = false;
  state.taskSelected = null;
  applyTask(TASKS[state.taskIndex]);
  renderTask();
  $('#taskOverlay').hidden = false;
}

$('#taskOptions').addEventListener('click', (event) => {
  const button = event.target.closest('.task-option');
  if (!button || button.disabled) return;
  answerTask(Number(button.dataset.index));
});
$('#taskNext').addEventListener('click', nextTask);
$('#taskBtn').addEventListener('click', () => openTask(0));
$('#taskClose').addEventListener('click', () => { $('#taskOverlay').hidden = true; updateTaskBadge(); });

/* -------------------------------------------------------------------------- */
/* Events                                                                     */
/* -------------------------------------------------------------------------- */

$('#scenarios').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-scene]');
  if (!button) return;
  setScene(button.dataset.scene);
  toast(`${SCENES[state.scene].label}：${SCENES[state.scene].description}`);
});

$('#waterTab').addEventListener('click', () => setView('water'));
$('#diagramTab').addEventListener('click', () => setView('diagram'));

$('#playBtn').addEventListener('click', () => {
  state.running = !state.running;
  $('#playBtn').textContent = state.running ? 'Ⅱ' : '▶';
  $('#playBtn').setAttribute('aria-label', state.running ? '暫停' : '播放');
});
$('#resetBtn').addEventListener('click', () => {
  sim.resetField();
  sim.warmUp(2.2);
  state.points = [];
  state.probe = null;
  updateUI();
  toast('已重新開始水波。');
});

$('#freqInput').addEventListener('input', (event) => {
  state.frequency = Number(event.target.value);
  sim.options.frequency = state.frequency;
  updateUI();
});
$('#ampInput').addEventListener('input', (event) => {
  state.amplitude = Number(event.target.value);
  sim.options.amplitude = state.amplitude;
  updateUI();
});
$('#barrierInput').addEventListener('input', (event) => {
  state.barrierAngle = Number(event.target.value);
  configureSim(true);
});
$('#tiltInput').addEventListener('input', (event) => {
  state.interfaceTilt = Number(event.target.value);
  configureSim(true);
});
$('#shallowInput').addEventListener('input', (event) => {
  state.shallowSpeed = Number(event.target.value);
  configureSim(true);
});
$('#gapInput').addEventListener('input', (event) => {
  state.gap = Number(event.target.value);
  configureSim(true);
});
$('#sepInput').addEventListener('input', (event) => {
  state.separation = Number(event.target.value);
  configureSim(true);
});

document.querySelectorAll('.source-type button').forEach((button) => {
  button.addEventListener('click', () => {
    state.sourceType = button.dataset.source;
    configureSim(true);
  });
});

$('#measureBtn').addEventListener('click', () => {
  state.measuring = !state.measuring;
  if (!state.measuring) {
    state.points = [];
    state.probe = null;
  }
  updateUI();
  toast(state.measuring ? '量度模式：點擊畫面。' : '已退出量度模式。');
});
$('#clearMeasureBtn').addEventListener('click', () => {
  state.points = [];
  state.probe = null;
  updateUI();
});
$('#measureClose').addEventListener('click', () => {
  state.measuring = false;
  state.points = [];
  state.probe = null;
  updateUI();
});
$('#wavefrontToggle').addEventListener('change', (event) => { state.wavefronts = event.target.checked; });
$('#rayToggle').addEventListener('change', (event) => { state.rays = event.target.checked; });
$('#nodalToggle').addEventListener('change', (event) => { state.nodal = event.target.checked; });
$('#helpBtn').addEventListener('click', () => { $('#helpPop').hidden = false; });
$('#helpClose').addEventListener('click', () => { $('#helpPop').hidden = true; });

canvas.addEventListener('pointerdown', (event) => {
  if (!state.measuring) return;
  const point = screenToWorld(event.clientX, event.clientY);
  if (point.x < 0 || point.x > TANK.width || point.y < 0 || point.y > TANK.height) return;
  if (state.scene === 'interference') {
    state.probe = point;
    state.points = [];
  } else {
    state.points.push(point);
    if (state.points.length > 2) state.points = [point];
  }
  updateMeasurementReadout();
  draw(performance.now());
});

new ResizeObserver(resizeCanvas).observe(sceneWrap);
window.addEventListener('resize', resizeCanvas);

window.__RIPPLE_TANK__ = {
  getState: () => ({
    scene: state.scene,
    view: state.view,
    frequency: state.frequency,
    amplitude: state.amplitude,
    barrierAngle: state.barrierAngle,
    interfaceTilt: state.interfaceTilt,
    shallowSpeed: state.shallowSpeed,
    gap: state.gap,
    separation: state.separation,
    sourceType: state.sourceType,
    simOptions: { ...sim.options },
    running: state.running,
    probe: state.probe,
    points: state.points,
    metrics: sim.metrics(),
  }),
  setScene,
  setView,
  configure: (patch) => {
    Object.assign(state, patch);
    configureSim(true);
  },
  setRunning: (running) => {
    state.running = Boolean(running);
    $('#playBtn').textContent = state.running ? 'Ⅱ' : '▶';
  },
  reset: () => {
    sim.resetField();
    state.points = [];
    state.probe = null;
    updateUI();
  },
};

function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('is-visible');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove('is-visible'), 2200);
}

/* Boot */
resizeCanvas();
configureSim(true);
setView('water');
requestAnimationFrame(frame);
