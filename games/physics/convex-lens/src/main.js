import {
  WORLD,
  LENS_X,
  AXIS_Y,
  solveLens,
  imageSummary,
  formatCm,
  formatMagnification,
} from './optics.js';
import { TASKS } from './tasks.js';

const $ = (selector) => document.querySelector(selector);
const MAX_SCORE = 500;

const state = {
  mode: 'explore',
  f: 10,
  u: 30,
  h: 4,
  screen: true,
  fan: false,
  labels: true,
  result: null,
  geo: null,
  dragging: false,
  taskIndex: 0,
  taskAnswered: false,
  taskSelected: null,
  taskScore: 0,
  taskScores: [],
};

const canvas = $('#scene');
const sceneWrap = $('#sceneWrap');
const ctx = canvas.getContext('2d');
let view = { width: 1000, height: 700, scale: 1, x: 0, y: 0 };
let dpr = 1;
let drawScheduled = false;

/* -------------------------------------------------------------------------- */
/* Geometry                                                                   */
/* -------------------------------------------------------------------------- */

function computeGeometry(result) {
  const f = result.f;
  const leftCm = Math.max(result.u, 2 * f, result.virtual ? Math.abs(result.v) : 0, 12) + 6;
  const rightCm = Math.max(result.real ? Math.abs(result.v) : 0, 2 * f, 12) + 6;
  const maxCm = Math.max(leftCm, rightCm, 24);
  const maxHeight = Math.max(result.h, Number.isFinite(result.hi) ? Math.abs(result.hi) : result.h, 6) + 2;
  const scale = Math.min(430 / maxCm, 260 / maxHeight, 30);
  return {
    scale,
    objectX: LENS_X - result.u * scale,
    imageX: Number.isFinite(result.v) ? LENS_X + result.v * scale : LENS_X + (2 * f + 8) * scale,
    objectTop: AXIS_Y - result.h * scale,
    imageTop: Number.isFinite(result.hi) ? AXIS_Y - result.hi * scale : AXIS_Y,
    lensRadius: 6 * scale,
  };
}

function resizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, sceneWrap.clientWidth);
  const height = Math.max(1, sceneWrap.clientHeight);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const scale = Math.min(width / WORLD.width, height / WORLD.height);
  view = {
    width,
    height,
    scale,
    x: (width - WORLD.width * scale) / 2,
    y: (height - WORLD.height * scale) / 2,
  };
  scheduleDraw();
}

function worldTransform() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, view.width, view.height);
  ctx.save();
  ctx.translate(view.x, view.y);
  ctx.scale(view.scale, view.scale);
}

/* -------------------------------------------------------------------------- */
/* Drawing helpers                                                            */
/* -------------------------------------------------------------------------- */

function line(x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function arrowHead(x, y, angle, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size * 0.55);
  ctx.lineTo(-size, size * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function glowLine(x1, y1, x2, y2, color, width = 1.5, dashed = false, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width + 4;
  ctx.globalAlpha = alpha * 0.13;
  ctx.setLineDash(dashed ? [7, 7] : []);
  line(x1, y1, x2, y2);
  ctx.globalAlpha = alpha;
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  line(x1, y1, x2, y2);
  ctx.restore();
}

function polyline(points, color, width = 1.4, dashed = false, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha * 0.13;
  ctx.strokeStyle = color;
  ctx.lineWidth = width + 5;
  ctx.setLineDash(dashed ? [8, 8] : []);
  ctx.beginPath();
  points.forEach((point, index) => (index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)));
  ctx.stroke();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  points.forEach((point, index) => (index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)));
  ctx.stroke();
  ctx.restore();
}

function drawArrow(x, baseY, topY, color, dashed = false, label = '') {
  const direction = topY < baseY ? -1 : 1;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.setLineDash(dashed ? [7, 6] : []);
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.lineTo(x, topY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x, topY);
  ctx.lineTo(x - 6, topY + direction * 13);
  ctx.lineTo(x + 6, topY + direction * 13);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  if (label) {
    ctx.fillStyle = color;
    ctx.font = '700 12px "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, topY + (direction < 0 ? -16 : 24));
  }
  ctx.restore();
}

function drawBackground() {
  const bg = ctx.createLinearGradient(0, 0, WORLD.width, WORLD.height);
  bg.addColorStop(0, '#081821');
  bg.addColorStop(0.55, '#06121a');
  bg.addColorStop(1, '#040c12');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  ctx.strokeStyle = 'rgba(95,243,255,.045)';
  ctx.lineWidth = 1;
  for (let x = 20; x < WORLD.width; x += 40) line(x, 0, x, WORLD.height);
  for (let y = 20; y < WORLD.height; y += 40) line(0, y, WORLD.width, y);

  const halo = ctx.createRadialGradient(LENS_X, AXIS_Y, 20, LENS_X, AXIS_Y, 280);
  halo.addColorStop(0, 'rgba(95,243,255,.075)');
  halo.addColorStop(1, 'rgba(95,243,255,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  ctx.save();
  ctx.strokeStyle = 'rgba(255,178,28,.34)';
  ctx.lineWidth = 1.3;
  ctx.setLineDash([6, 6]);
  line(45, AXIS_Y, WORLD.width - 25, AXIS_Y);
  ctx.restore();

  ctx.fillStyle = 'rgba(136,168,176,.52)';
  ctx.font = '9px Consolas, monospace';
  ctx.fillText('PRINCIPAL AXIS', 44, AXIS_Y - 10);
  ctx.fillText('OPTICAL BENCH / THIN LENS', 44, 34);
}

function drawLens(geo) {
  const { lensRadius, scale } = geo;
  const thickness = Math.max(7, 1.1 * scale);
  ctx.save();
  const glass = ctx.createLinearGradient(LENS_X - thickness, AXIS_Y - lensRadius, LENS_X + thickness, AXIS_Y + lensRadius);
  glass.addColorStop(0, 'rgba(95,243,255,.08)');
  glass.addColorStop(0.45, 'rgba(160,252,255,.22)');
  glass.addColorStop(1, 'rgba(95,243,255,.06)');
  ctx.fillStyle = glass;
  ctx.strokeStyle = 'rgba(95,243,255,.92)';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'rgba(95,243,255,.5)';
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.moveTo(LENS_X, AXIS_Y - lensRadius);
  ctx.bezierCurveTo(LENS_X + thickness, AXIS_Y - lensRadius * 0.42, LENS_X + thickness, AXIS_Y + lensRadius * 0.42, LENS_X, AXIS_Y + lensRadius);
  ctx.bezierCurveTo(LENS_X - thickness, AXIS_Y + lensRadius * 0.42, LENS_X - thickness, AXIS_Y - lensRadius * 0.42, LENS_X, AXIS_Y - lensRadius);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'rgba(255,255,255,.38)';
  ctx.lineWidth = 1;
  line(LENS_X + thickness * 0.45, AXIS_Y - lensRadius * 0.72, LENS_X + thickness * 0.45, AXIS_Y + lensRadius * 0.72);
  ctx.fillStyle = 'rgba(95,243,255,.7)';
  ctx.font = '9px Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('LENS', LENS_X, AXIS_Y - lensRadius - 10);
  ctx.restore();
}

function drawFocalPoints(result, geo) {
  const f = result.f;
  const s = geo.scale;
  const points = [
    { cm: f, label: 'F′', side: 1 },
    { cm: 2 * f, label: '2F′', side: 1 },
    { cm: f, label: 'F', side: -1 },
    { cm: 2 * f, label: '2F', side: -1 },
  ];
  ctx.save();
  for (const point of points) {
    const x = LENS_X + point.side * point.cm * s;
    ctx.fillStyle = point.label.startsWith('2') ? 'rgba(255,178,28,.68)' : 'rgba(95,243,255,.9)';
    ctx.beginPath();
    ctx.moveTo(x, AXIS_Y - 5);
    ctx.lineTo(x - 4, AXIS_Y + 3);
    ctx.lineTo(x + 4, AXIS_Y + 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(185,218,225,.7)';
    ctx.font = '8px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(point.label, x, AXIS_Y + 17);
  }
  ctx.restore();
}

function rayThirdHit(result, geo) {
  if (result.parallel) return null;
  const f = result.f;
  const u = result.u;
  if (Math.abs(u - f) < 0.05) return null;
  const yP = geo.objectTop;
  const y = AXIS_Y - ((yP - AXIS_Y) * f) / (u - f);
  if (Math.abs(y - AXIS_Y) > geo.lensRadius * 0.96) return null;
  return { x: LENS_X, y };
}

function rayPoints(result, geo) {
  const P = { x: geo.objectX, y: geo.objectTop };
  const center = { x: LENS_X, y: AXIS_Y };
  const focalRight = { x: LENS_X + result.f * geo.scale, y: AXIS_Y };
  const rays = [];
  const rightEdge = WORLD.width - 25;

  /* 1. parallel to principal axis -> through F' */
  const yParallel = P.y;
  if (Math.abs(yParallel - AXIS_Y) <= geo.lensRadius) {
    const lensPoint = { x: LENS_X, y: yParallel };
    const dx = focalRight.x - lensPoint.x;
    const dy = focalRight.y - lensPoint.y;
    const t = dx === 0 ? 1 : (rightEdge - lensPoint.x) / dx;
    const end = { x: rightEdge, y: lensPoint.y + dy * t };
    rays.push({ color: '#5ff3ff', points: [P, lensPoint, end], name: 'parallel' });
    if (result.virtual && Number.isFinite(result.v)) {
      rays.push({ color: 'rgba(95,243,255,.5)', dashed: true, points: [lensPoint, { x: geo.imageX, y: geo.imageTop }], extension: true });
    }
  }

  /* 2. through optical centre */
  const dx2 = center.x - P.x;
  const dy2 = center.y - P.y;
  const t2 = dx2 === 0 ? 1 : (rightEdge - center.x) / dx2;
  const end2 = { x: rightEdge, y: center.y + dy2 * t2 };
  rays.push({ color: '#ffb21c', points: [P, center, end2], name: 'center' });
  if (result.virtual && Number.isFinite(result.v)) {
    rays.push({ color: 'rgba(255,178,28,.48)', dashed: true, points: [center, { x: geo.imageX, y: geo.imageTop }], extension: true });
  }

  /* 3. through F -> parallel after lens */
  const hit = rayThirdHit(result, geo);
  if (hit) {
    rays.push({ color: '#66f6a5', points: [P, hit, { x: rightEdge, y: hit.y }], name: 'focal' });
    if (result.virtual && Number.isFinite(result.v)) {
      rays.push({ color: 'rgba(102,246,165,.42)', dashed: true, points: [hit, { x: geo.imageX, y: geo.imageTop }], extension: true });
    }
  }

  return rays;
}

function drawRays(result, geo) {
  const rays = rayPoints(result, geo);
  ctx.save();
  for (const ray of rays) {
    if (ray.extension) {
      polyline(ray.points, ray.color, 1.1, true, 0.8);
      continue;
    }
    polyline(ray.points, ray.color, 1.5, false, 0.92);
    const last = ray.points[ray.points.length - 1];
    const previous = ray.points[ray.points.length - 2];
    arrowHead(last.x, last.y, Math.atan2(last.y - previous.y, last.x - previous.x), 7, ray.color);
  }
  ctx.restore();
}

function drawFan(result, geo) {
  if (!state.fan || result.parallel) return;
  const N = 9;
  const radius = geo.lensRadius * 0.92;
  const P = { x: geo.objectX, y: geo.objectTop };
  const image = Number.isFinite(result.v) ? { x: geo.imageX, y: geo.imageTop } : null;
  ctx.save();
  for (let index = 0; index < N; index += 1) {
    const y = AXIS_Y - radius + (2 * radius * index) / (N - 1);
    const lensPoint = { x: LENS_X, y };
    const incident = [P, lensPoint];
    polyline(incident, 'rgba(158,233,240,.18)', 1, false, 0.8);
    if (result.real && image) {
      const dx = image.x - lensPoint.x;
      const dy = image.y - lensPoint.y;
      const t = dx === 0 ? 1 : (WORLD.width - 25 - lensPoint.x) / dx;
      polyline([lensPoint, { x: lensPoint.x + dx * t, y: lensPoint.y + dy * t }], 'rgba(95,243,255,.12)', 1, false, 0.8);
    } else if (result.virtual && image) {
      const dx = lensPoint.x - image.x;
      const dy = lensPoint.y - image.y;
      const t = (WORLD.width - 25 - lensPoint.x) / dx;
      polyline([lensPoint, { x: lensPoint.x + dx * t, y: lensPoint.y + dy * t }], 'rgba(255,178,28,.1)', 1, false, 0.7);
    }
  }
  ctx.restore();
}

function drawScreen(result, geo) {
  if (!state.screen || !result.real || !Number.isFinite(result.v)) return;
  const x = geo.imageX;
  const h = Math.max(120, Math.abs(result.hi) * geo.scale + 45);
  ctx.save();
  ctx.fillStyle = 'rgba(232,250,255,.045)';
  ctx.strokeStyle = 'rgba(95,243,255,.24)';
  ctx.lineWidth = 1;
  ctx.fillRect(x - 7, AXIS_Y - h, 14, h * 2);
  ctx.strokeRect(x - 7, AXIS_Y - h, 14, h * 2);
  ctx.fillStyle = 'rgba(232,250,255,.46)';
  ctx.font = '8px Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SCREEN', x, AXIS_Y + h + 14);
  ctx.restore();
}

function drawDistances(result, geo) {
  const y = AXIS_Y + 56;
  const objectX = geo.objectX;
  const imageX = Number.isFinite(result.v) ? geo.imageX : LENS_X + result.f * geo.scale;
  const drawBracket = (x1, x2, color, label) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
    for (const x of [x1, x2]) {
      ctx.beginPath();
      ctx.moveTo(x, y - 4);
      ctx.lineTo(x, y + 4);
      ctx.stroke();
    }
    ctx.font = '9px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, (x1 + x2) / 2, y - 7);
    ctx.restore();
  };
  drawBracket(objectX, LENS_X, 'rgba(255,178,28,.65)', `u = ${formatCm(result.u)}`);
  if (Number.isFinite(result.v)) {
    drawBracket(LENS_X, imageX, 'rgba(95,243,255,.55)', `v = ${formatCm(result.v)}`);
  }
}

function drawScene() {
  worldTransform();
  drawBackground();
  const result = state.result;
  const geo = state.geo;
  if (!result || !geo) {
    ctx.restore();
    return;
  }
  drawLens(geo);
  drawFocalPoints(result, geo);
  drawFan(result, geo);
  drawRays(result, geo);
  drawScreen(result, geo);
  drawObject(result, geo);
  drawImage(result, geo);
  if (state.labels) drawDistances(result, geo);
  ctx.restore();
}

function drawObject(result, geo) {
  const x = geo.objectX;
  ctx.save();
  ctx.fillStyle = 'rgba(255,178,28,.09)';
  ctx.beginPath();
  ctx.arc(x, AXIS_Y, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawArrow(x, AXIS_Y, geo.objectTop, '#ffb21c', false, state.labels ? '物體' : '');
  ctx.save();
  ctx.fillStyle = '#ffb21c';
  ctx.beginPath();
  ctx.ellipse(x, AXIS_Y, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawImage(result, geo) {
  if (!Number.isFinite(result.hi)) {
    ctx.save();
    ctx.fillStyle = 'rgba(95,243,255,.75)';
    ctx.font = '10px "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('折射光線平行 → 像在無限遠', LENS_X + 95, AXIS_Y - 34);
    ctx.restore();
    return;
  }
  const color = result.real ? '#5ff3ff' : '#ffb21c';
  drawArrow(geo.imageX, AXIS_Y, geo.imageTop, color, result.virtual, state.labels ? (result.real ? '實像' : '虛像') : '');
  if (state.labels) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = '9px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${imageSummary(result)}`, geo.imageX, AXIS_Y + (result.hi > 0 ? 28 : -26));
    ctx.restore();
  }
}

/* -------------------------------------------------------------------------- */
/* UI                                                                         */
/* -------------------------------------------------------------------------- */

function scheduleDraw() {
  if (drawScheduled) return;
  drawScheduled = true;
  requestAnimationFrame(() => {
    drawScheduled = false;
    drawScene();
  });
}

function refresh() {
  state.result = solveLens({ f: state.f, u: state.u, h: state.h });
  state.geo = computeGeometry(state.result);
  updateUI();
  scheduleDraw();
}

function updateUI() {
  const result = state.result;
  const isTask = state.mode === 'tasks';
  $('#explorePanel').hidden = isTask;
  $('#taskPanel').hidden = !isTask;
  $('#scoreChip').hidden = state.mode !== 'tasks';
  if (isTask) {
    updateTaskUI();
    updateHUD();
    return;
  }

  $('#fInput').value = String(state.f);
  $('#uInput').value = String(state.u);
  $('#hInput').value = String(state.h);
  $('#fValue').textContent = formatCm(state.f);
  $('#uValue').textContent = formatCm(state.u);
  $('#hValue').textContent = formatCm(state.h);
  $('#formulaText').textContent = result.parallel
    ? 'u = f → v → ∞'
    : `1/${state.f.toFixed(1)} = 1/${state.u.toFixed(1)} + 1/${Number.isFinite(result.v) ? result.v.toFixed(1) : '∞'}`;
  $('#vValue').textContent = formatCm(result.v);
  $('#mValue').textContent = formatMagnification(result.m);
  $('#hiValue').textContent = formatCm(result.hi);
  $('#natureValue').textContent = result.parallel ? '不成像' : result.nature;
  $('#caseTitle').textContent = result.caseLabel;
  $('#natureBadge').textContent = imageSummary(result);
  $('#caseText').textContent = result.description;
  $('#screenText').textContent = result.parallel
    ? '平行光，光屏上沒有清晰的像。'
    : result.virtual
      ? '虛像，光屏上接不到。'
      : state.screen
        ? '光屏在像的位置，清晰。'
        : '光屏已收起；像仍然存在。';
  const activeCase = result.caseId;
  $$('.presets button').forEach((button) => button.classList.toggle('is-active', button.dataset.case === activeCase));
  updateHUD();
}

function updateHUD() {
  const result = state.result;
  $('#hudF').textContent = formatCm(state.f);
  $('#hudU').textContent = formatCm(state.u);
  $('#hudCase').textContent = result.caseLabel;
  $('#hudNature').textContent = result.parallel ? '不成像' : result.nature;
  $('#hudNature').classList.toggle('is-virtual', Boolean(result.virtual));
}

function setExplore(patch) {
  Object.assign(state, patch);
  refresh();
}

function setMode(mode) {
  state.mode = mode;
  $('#exploreTab').classList.toggle('is-active', mode === 'explore');
  $('#taskTab').classList.toggle('is-active', mode === 'tasks');
  $('#exploreTab').setAttribute('aria-pressed', String(mode === 'explore'));
  $('#taskTab').setAttribute('aria-pressed', String(mode === 'tasks'));
  if (mode === 'tasks') {
    state.screen = true;
    state.fan = false;
    state.labels = true;
    loadTask(state.taskIndex);
    updateUI();
  } else {
    refresh();
  }
}

/* -------------------------------------------------------------------------- */
/* Task mode                                                                  */
/* -------------------------------------------------------------------------- */

function loadTask(index) {
  state.taskIndex = Math.max(0, Math.min(TASKS.length - 1, index));
  const task = TASKS[state.taskIndex];
  state.f = task.f;
  state.u = task.u;
  state.h = 4;
  state.taskAnswered = false;
  state.taskSelected = null;
  state.result = solveLens({ f: state.f, u: state.u, h: state.h });
  state.geo = computeGeometry(state.result);
  updateTaskUI();
  updateHUD();
  scheduleDraw();
}

function updateTaskUI() {
  const task = TASKS[state.taskIndex];
  $('#taskCounter').textContent = `${String(state.taskIndex + 1).padStart(2, '0')} / ${String(TASKS.length).padStart(2, '0')}`;
  $('#taskProgress').style.width = `${((state.taskIndex + 1) / TASKS.length) * 100}%`;
  $('#taskTitle').textContent = task.title;
  $('#taskSetup').textContent = `f = ${task.f} cm · u = ${task.u} cm`;
  $('#taskQuestion').textContent = task.question;
  const options = $('#taskOptions');
  options.innerHTML = '';
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
    options.appendChild(button);
  });
  const feedback = $('#taskFeedback');
  feedback.className = 'task-feedback';
  feedback.textContent = '';
  if (state.taskAnswered) {
    const correct = state.taskSelected === task.correct;
    feedback.textContent = correct
      ? `正確。${task.explanation}`
      : `再看一次光線圖。正確答案：${task.options[task.correct]}。${task.explanation}`;
    feedback.classList.toggle('is-bad', !correct);
    $('#taskNext').disabled = false;
    $('#taskNext').textContent = state.taskIndex === TASKS.length - 1 ? '看總結' : '下一題';
  } else {
    $('#taskNext').disabled = true;
    $('#taskNext').textContent = '先選答案';
  }
  $('#taskScoreNote').textContent = `目前得分 ${state.taskScore} / ${MAX_SCORE}`;
  $('#scoreValue').textContent = String(state.taskScore);
}

function answerTask(index) {
  if (state.taskAnswered || state.mode !== 'tasks') return;
  const task = TASKS[state.taskIndex];
  state.taskSelected = index;
  state.taskAnswered = true;
  const correct = index === task.correct;
  const points = correct ? 100 : 0;
  state.taskScores[state.taskIndex] = points;
  state.taskScore = state.taskScores.reduce((total, item) => total + (item || 0), 0);
  $('#scoreValue').textContent = String(state.taskScore);
  updateTaskUI();
  scheduleDraw();
  reportScore();
}

function nextTask() {
  if (!state.taskAnswered) return;
  if (state.taskIndex >= TASKS.length - 1) {
    showFinal();
    return;
  }
  loadTask(state.taskIndex + 1);
}

function showFinal() {
  $('#finalScore').textContent = String(state.taskScore);
  $('#finalSummary').textContent = state.taskScore >= 500
    ? '你已掌握凸透鏡五個成像規律，能從光線圖直接判斷像的性質。'
    : state.taskScore >= 300
      ? '大部分成像規律已掌握；回到探索模式，觀察 u = f 與 u < f 的光線延長線。'
      : '先回到探索模式，拖動物體並比較三條主光線，再回來挑戰。';
  $('#finalOverlay').hidden = false;
  reportScore();
}

function resetAll() {
  state.mode = 'explore';
  state.f = 10;
  state.u = 30;
  state.h = 4;
  state.screen = true;
  state.fan = false;
  state.labels = true;
  state.taskIndex = 0;
  state.taskAnswered = false;
  state.taskSelected = null;
  state.taskScore = 0;
  state.taskScores = [];
  $('#screenToggle').checked = true;
  $('#fanToggle').checked = false;
  $('#labelToggle').checked = true;
  $('#finalOverlay').hidden = true;
  $('#exploreTab').classList.add('is-active');
  $('#taskTab').classList.remove('is-active');
  $('#exploreTab').setAttribute('aria-pressed', 'true');
  $('#taskTab').setAttribute('aria-pressed', 'false');
  refresh();
  toast('已重設到 u > 2f 的起始情境。');
}

function reportScore() {
  if (window.parent === window) return;
  window.parent.postMessage({ type: 'game-score', score: Math.min(MAX_SCORE, state.taskScore) }, location.origin);
}

function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('is-visible');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove('is-visible'), 1800);
}

function $$(selector) {
  return document.querySelectorAll(selector);
}

/* -------------------------------------------------------------------------- */
/* Events                                                                     */
/* -------------------------------------------------------------------------- */

$('#fInput').addEventListener('input', (event) => setExplore({ f: Number(event.target.value) }));
$('#uInput').addEventListener('input', (event) => setExplore({ u: Number(event.target.value) }));
$('#hInput').addEventListener('input', (event) => setExplore({ h: Number(event.target.value) }));

$('#presets').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-case]');
  if (!button) return;
  const map = {
    beyond2f: { f: 10, u: 30 },
    at2f: { f: 10, u: 20 },
    between: { f: 10, u: 15 },
    atf: { f: 10, u: 10 },
    inside: { f: 10, u: 5 },
  };
  const patch = map[button.dataset.case];
  if (patch) setExplore(patch);
});

$('#screenToggle').addEventListener('change', (event) => {
  state.screen = event.target.checked;
  updateUI();
  scheduleDraw();
});
$('#fanToggle').addEventListener('change', (event) => {
  state.fan = event.target.checked;
  scheduleDraw();
});
$('#labelToggle').addEventListener('change', (event) => {
  state.labels = event.target.checked;
  scheduleDraw();
});

$('#taskOptions').addEventListener('click', (event) => {
  const button = event.target.closest('.task-option');
  if (!button || button.disabled) return;
  answerTask(Number(button.dataset.index));
});
$('#taskNext').addEventListener('click', nextTask);
$('#exploreTab').addEventListener('click', () => setMode('explore'));
$('#taskTab').addEventListener('click', () => setMode('tasks'));
$('#resetBtn').addEventListener('click', resetAll);
$('#finalRestart').addEventListener('click', () => {
  $('#finalOverlay').hidden = true;
  state.taskIndex = 0;
  state.taskScore = 0;
  state.taskScores = [];
  loadTask(0);
});
$('#helpBtn').addEventListener('click', () => { $('#helpPop').hidden = false; });
$('#helpClose').addEventListener('click', () => { $('#helpPop').hidden = true; });

/* Drag the object directly on the optical bench. */
function canvasWorldPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const px = ((event.clientX - rect.left) / rect.width) * view.width;
  const py = ((event.clientY - rect.top) / rect.height) * view.height;
  return {
    x: (px - view.x) / view.scale,
    y: (py - view.y) / view.scale,
  };
}

canvas.addEventListener('pointerdown', (event) => {
  if (state.mode !== 'explore' || !state.geo) return;
  const point = canvasWorldPoint(event);
  const onObject = Math.abs(point.x - state.geo.objectX) < 34
    && point.y > state.geo.objectTop - 26
    && point.y < AXIS_Y + 18;
  if (!onObject) return;
  state.dragging = true;
  canvas.setPointerCapture(event.pointerId);
  canvas.style.cursor = 'grabbing';
});
canvas.addEventListener('pointermove', (event) => {
  if (!state.geo) return;
  if (!state.dragging) {
    const point = canvasWorldPoint(event);
    const onObject = Math.abs(point.x - state.geo.objectX) < 34
      && point.y > state.geo.objectTop - 26
      && point.y < AXIS_Y + 18;
    canvas.style.cursor = onObject ? 'grab' : 'default';
    return;
  }
  const point = canvasWorldPoint(event);
  const u = Math.max(3, Math.min(70, (LENS_X - point.x) / state.geo.scale));
  state.u = Math.round(u * 2) / 2;
  refresh();
});
function endDrag() {
  state.dragging = false;
  canvas.style.cursor = 'default';
}
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

new ResizeObserver(resizeCanvas).observe(sceneWrap);
window.addEventListener('resize', resizeCanvas);

window.__CONVEX_LENS__ = {
  getState: () => ({
    mode: state.mode,
    f: state.f,
    u: state.u,
    h: state.h,
    v: state.result?.v,
    m: state.result?.m,
    hi: state.result?.hi,
    caseId: state.result?.caseId,
    nature: state.result?.nature,
    taskIndex: state.taskIndex,
    taskAnswered: state.taskAnswered,
    taskSelected: state.taskSelected,
    taskScore: state.taskScore,
  }),
  setExplore: (patch) => setExplore(patch),
  setMode,
  answerTask,
  nextTask,
  resetAll,
};

refresh();
resizeCanvas();
