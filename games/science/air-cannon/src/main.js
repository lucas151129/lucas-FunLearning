import { simulate, bestOf, scoreMission, candles, CONTAINERS, NOZZLES, CANDLE_Y, CANDLE_X, NOZZLE, WORLD } from './physics.js';
import { MISSIONS, missionAt } from './missions.js';

const $ = (selector) => document.querySelector(selector);
const MAX_SCORE = 500;
const TOTAL_MISSIONS = MISSIONS.length;

const state = {
  missionIndex: 0,
  mission: missionAt(0),
  prediction: null,
  predictionLocked: false,
  phase: 'predict',
  trialResults: [],
  activeTrial: -1,
  conclusionChoice: null,
  conclusionWrong: false,
  conclusionScore: 0,
  missionScore: 0,
  breakdown: null,
  total: 0,
  finalPrediction: null,
  finalAttempts: 0,
  finalResults: [],
  finalScore: 0,
  lastSim: null,
  anim: null,
  candleState: new Set(),
  aim: 0,
  pull: 0.9,
};

const canvas = $('#scene');
const sceneWrap = $('#sceneWrap');
const ctx = canvas.getContext('2d');
let view = { width: 900, height: 560, scale: 1, x: 0, y: 0 };
let animStart = 0;
let dpr = 1;

/* -------------------------------------------------------------------------- */
/* Canvas                                                                     */
/* -------------------------------------------------------------------------- */

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
}

function worldTransform() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, view.width, view.height);
  ctx.save();
  ctx.translate(view.x, view.y);
  ctx.scale(view.scale, view.scale);
}

function roundedRect(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, 450);
  sky.addColorStop(0, '#e6f9ff');
  sky.addColorStop(0.7, '#f7fdff');
  sky.addColorStop(1, '#fff8ec');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  /* window */
  ctx.fillStyle = '#c8efff';
  roundedRect(570, 45, 280, 220, 14);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  ctx.fillRect(710, 45, 7, 220);
  ctx.fillRect(570, 150, 280, 7);
  ctx.fillStyle = '#ffffff';
  roundedRect(558, 33, 304, 244, 18);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.28)';
  roundedRect(570, 45, 280, 220, 14);
  ctx.fill();

  /* wall banner */
  ctx.fillStyle = '#ffffff';
  roundedRect(70, 38, 330, 62, 16);
  ctx.fill();
  ctx.fillStyle = '#0c8f86';
  ctx.font = '900 25px "Microsoft JhengHei", sans-serif';
  ctx.fillText('空氣炮實驗室', 92, 78);
  ctx.fillStyle = '#ff7a3c';
  ctx.font = '900 12px Consolas, monospace';
  ctx.fillText('AIR CANNON LAB', 260, 78);

  /* table */
  ctx.fillStyle = '#d99a5d';
  ctx.fillRect(0, 448, WORLD.width, 112);
  ctx.fillStyle = '#b87c45';
  ctx.fillRect(0, 448, WORLD.width, 12);
  ctx.fillStyle = 'rgba(255,255,255,.14)';
  for (let x = 20; x < WORLD.width; x += 80) ctx.fillRect(x, 465, 3, 80);

  /* floor label */
  ctx.fillStyle = '#9d6a37';
  ctx.font = '700 11px "Microsoft JhengHei", sans-serif';
  ctx.fillText('公平測試：每次只改變一個條件', 28, 535);

  /* target rack */
  ctx.strokeStyle = '#8b5a2b';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(610, 205);
  ctx.lineTo(610, 442);
  ctx.moveTo(790, 205);
  ctx.lineTo(790, 442);
  ctx.stroke();
  [270, 320, 370, 420].forEach((y) => {
    ctx.fillStyle = '#b67c43';
    roundedRect(600, y, 200, 14, 5);
    ctx.fill();
  });
  ctx.fillStyle = '#fff5dc';
  roundedRect(600, 205, 200, 38, 8);
  ctx.fill();
  ctx.fillStyle = '#8b5a2b';
  ctx.font = '900 14px "Microsoft JhengHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('8 支蠟燭', 700, 230);
  ctx.textAlign = 'left';
}

function drawCandle(candle, index, extinguished, time) {
  const x = candle.x;
  const baseY = candle.y + 30;
  ctx.fillStyle = '#fffdf3';
  roundedRect(x - 6, candle.y, 12, 30, 5);
  ctx.fill();
  ctx.fillStyle = '#e7c47a';
  ctx.fillRect(x - 6, candle.y + 24, 12, 4);
  ctx.fillStyle = '#ff7a3c';
  ctx.beginPath();
  ctx.moveTo(x, candle.y - 10);
  ctx.quadraticCurveTo(x + 7, candle.y - 2, x, candle.y + 4);
  ctx.quadraticCurveTo(x - 7, candle.y - 2, x, candle.y - 10);
  ctx.fill();
  if (!extinguished) {
    ctx.fillStyle = '#ffd34e';
    ctx.beginPath();
    ctx.ellipse(x, candle.y - 2, 3.5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = 'rgba(100,120,125,.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, candle.y - 4);
    ctx.bezierCurveTo(x + 10, candle.y - 18, x - 8, candle.y - 30, x + 4, candle.y - 42 - (time % 10));
    ctx.stroke();
  }
  if (index === 0) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - 12, baseY + 4, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCandles(extinguished, time) {
  candles().forEach((candle, index) => {
    drawCandle(candle, index, extinguished.has(index), time);
  });
}

function drawCannon(settings, extinguishedCount) {
  const container = CONTAINERS[settings.container] || CONTAINERS.s;
  const nozzle = NOZZLES[settings.nozzle] || NOZZLES.mid;
  const pull = settings.pull == null ? 0.9 : settings.pull;
  const sealed = settings.sealed !== false;

  /* tabletop stand */
  ctx.fillStyle = '#6bb7ad';
  roundedRect(120, 390, 190, 26, 8);
  ctx.fill();
  ctx.fillStyle = '#3f8f86';
  ctx.fillRect(150, 410, 12, 38);
  ctx.fillRect(270, 410, 12, 38);

  /* balloon at the back */
  const balloonW = 36 + pull * 50;
  const balloonH = 30 + pull * 22;
  ctx.fillStyle = 'rgba(22,50,79,.1)';
  ctx.beginPath();
  ctx.ellipse(94 - pull * 24, 315, balloonW, balloonH, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = sealed ? '#b9f0e7' : '#ffe1c8';
  ctx.strokeStyle = sealed ? '#0c8f86' : '#ff7a3c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(94 - pull * 24, 315, balloonW, balloonH, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e8b23f';
  ctx.beginPath();
  ctx.arc(94 - pull * 24, 315, 8, 0, Math.PI * 2);
  ctx.fill();

  /* bottle/box */
  if (settings.container === 'box') {
    ctx.fillStyle = '#dba66a';
    roundedRect(132, 260, 125, 120, 12);
    ctx.fill();
    ctx.strokeStyle = '#b9854c';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(150, 280);
    ctx.lineTo(230, 360);
    ctx.stroke();
  } else {
    ctx.fillStyle = container.color;
    roundedRect(132, 270, 120, 105, 30);
    ctx.fill();
    ctx.strokeStyle = '#8fd1d1';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    roundedRect(148, 286, 18, 65, 9);
    ctx.fill();
    ctx.fillStyle = '#0c8f86';
    ctx.font = '900 13px "Microsoft JhengHei", sans-serif';
    ctx.fillText(container.id === 's' ? '500 mL' : '1.5 L', 166, 345);
  }

  /* nozzle */
  ctx.fillStyle = nozzle.color;
  roundedRect(248, 298, 18, 34, 7);
  ctx.fill();
  ctx.fillStyle = '#16324f';
  roundedRect(262, 302, 13, 26, 5);
  ctx.fill();

  /* pull arrow */
  ctx.strokeStyle = '#ff7a3c';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(132, 245);
  ctx.lineTo(132 + 68 * pull, 245);
  ctx.stroke();
  ctx.fillStyle = '#ff7a3c';
  ctx.beginPath();
  ctx.moveTo(132 + 68 * pull, 238);
  ctx.lineTo(132 + 68 * pull + 14, 245);
  ctx.lineTo(132 + 68 * pull, 252);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#b45626';
  ctx.font = '900 11px "Microsoft JhengHei", sans-serif';
  ctx.fillText(`力度 ${Math.round(pull * 100)}%`, 144, 235);
}

function drawAim(settings) {
  const center = NOZZLE.y + (settings.aim || 0) * 80 - (settings.wind || 0) * 35;
  ctx.strokeStyle = 'rgba(255,122,60,.6)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(278, 315);
  ctx.lineTo(620, center);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,122,60,.85)';
  ctx.beginPath();
  ctx.arc(620, center, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawAir(now, settings, result) {
  if (!state.anim) return;
  const t = Math.min(1, (now - state.anim.start) / state.anim.duration);
  const center = result.centerY;
  const ringX = 278 + (670 - 278) * Math.min(1, t * 1.3);
  const radius = Math.max(8, result.radius * (0.35 + 0.65 * Math.min(1, t * 1.3)));
  const alpha = Math.max(0, Math.sin(Math.PI * Math.min(1, t)));
  ctx.save();
  ctx.globalAlpha = alpha * 0.9;
  const gradient = ctx.createRadialGradient(ringX, center, radius * 0.15, ringX, center, radius);
  gradient.addColorStop(0, 'rgba(255,255,255,0)');
  gradient.addColorStop(0.6, 'rgba(92,224,222,.12)');
  gradient.addColorStop(0.85, 'rgba(12,143,134,.55)');
  gradient.addColorStop(1, 'rgba(12,143,134,0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(ringX, center, radius * 1.05, radius * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.75)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(ringX, center, radius * 0.72, radius * 0.54, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  /* little air puffs */
  ctx.save();
  ctx.globalAlpha = alpha * 0.7;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 10; i += 1) {
    const px = 290 + (i / 10) * (ringX - 290) + Math.sin(i * 3) * 10;
    const py = center + Math.cos(i * 2.1) * radius * 0.65;
    ctx.beginPath();
    ctx.arc(px, py, 3 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  /* leak puffs */
  if (!settings.sealed) {
    ctx.save();
    ctx.globalAlpha = alpha * 0.7;
    ctx.fillStyle = '#ffb38a';
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.arc(210 - i * 12, 280 - i * 8, 5 + i * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawWind() {
  if (!state.mission.wind) return;
  ctx.strokeStyle = 'rgba(255,122,60,.5)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i += 1) {
    const y = 170 + i * 22;
    ctx.beginPath();
    ctx.moveTo(460, y);
    ctx.lineTo(540, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(540, y);
    ctx.lineTo(531, y - 6);
    ctx.moveTo(540, y);
    ctx.lineTo(531, y + 6);
    ctx.stroke();
  }
}

function renderCanvas(now) {
  worldTransform();
  drawBackground();
  drawWind();
  const settings = state.lastSim || {
    container: state.mission.standard.container || 's',
    nozzle: state.mission.standard.nozzle || 'mid',
    pull: state.pull,
    sealed: state.mission.standard.sealed !== false,
    aim: state.aim,
    wind: state.mission.wind || 0,
  };
  drawAim(settings);
  drawCannon(settings, 0);
  const extinguished = new Set(state.candleState);
  if (state.anim) {
    const t = Math.min(1, (now - state.anim.start) / state.anim.duration);
    if (t > 0.66) {
      state.anim.result.extinguished.forEach((index) => extinguished.add(index));
    }
    drawAir(now, settings, state.anim.result);
  }
  drawCandles(extinguished, now);
  ctx.restore();
}

function animate(now) {
  renderCanvas(now);
  if (state.anim && now - state.anim.start >= state.anim.duration) {
    const finished = state.anim;
    state.anim = null;
    finishAnimation(finished);
  }
  requestAnimationFrame(animate);
}

/* -------------------------------------------------------------------------- */
/* Game flow                                                                  */
/* -------------------------------------------------------------------------- */

function phaseLabel() {
  if (state.phase === 'predict') return '預測';
  if (state.phase === 'test') return '實驗';
  if (state.phase === 'flying') return '發射';
  if (state.phase === 'conclusion') return '結論';
  if (state.phase === 'concluded') return '完成';
  if (state.phase === 'finalPredict') return '預測';
  if (state.phase === 'finalAim') return '挑戰';
  if (state.phase === 'finalFlying') return '發射';
  if (state.phase === 'finalResult') return '結果';
  return '完成';
}

function displayScore() {
  return Math.min(MAX_SCORE, state.total + (state.phase === 'concluded' ? state.missionScore : 0) + (state.phase === 'finalResult' ? state.finalScore : 0));
}

function reportScore() {
  if (window.parent === window) return;
  window.parent.postMessage({ type: 'game-score', score: Math.min(MAX_SCORE, state.total) }, location.origin);
}

function loadMission(index) {
  state.missionIndex = Math.max(0, Math.min(TOTAL_MISSIONS - 1, index));
  state.mission = missionAt(state.missionIndex);
  state.prediction = null;
  state.predictionLocked = false;
  state.phase = state.mission.id === 'challenge' ? 'finalPredict' : 'predict';
  state.trialResults = [];
  state.activeTrial = -1;
  state.conclusionChoice = null;
  state.conclusionWrong = false;
  state.conclusionScore = 0;
  state.missionScore = 0;
  state.breakdown = null;
  state.finalPrediction = null;
  state.finalAttempts = 0;
  state.finalResults = [];
  state.finalScore = 0;
  state.lastSim = null;
  state.anim = null;
  state.candleState = new Set();
  state.aim = 0;
  state.pull = state.mission.standard.pull || 0.9;
  $('#finalOverlay').hidden = true;
  $('#aimInput').value = '0';
  $('#pullInput').value = String(Math.round(state.pull * 100));
  updateUI();
}

function speechForPhase() {
  const m = state.mission;
  if (m.id === 'challenge') {
    if (state.phase === 'finalPredict') return '風會把氣圈推高。先猜一猜，再調整瞄準。';
    if (state.phase === 'finalAim') return '把氣圈瞄回蠟燭中間。試試向下調整。';
    if (state.phase === 'finalResult') return '看看氣圈經過哪裡，再決定要不要調整。';
    return '你已經完成挑戰。';
  }
  if (state.phase === 'predict') return '先猜一猜，再做實驗。';
  if (state.phase === 'test') return '選一個條件按下去，看看氣圈會怎樣。';
  if (state.phase === 'flying') return '氣圈正在飛過去，留意蠟燭的位置。';
  if (state.phase === 'conclusion') return '比較紀錄上的數字，選出你的結論。';
  if (state.phase === 'concluded') return '好結論！按「下一關」繼續。';
  return '';
}

function fairText() {
  const m = state.mission;
  if (m.id === 'seal') return '<b>改變：</b>密封／未密封　<b>保持：</b>小膠樽、剛剛好、力度 90%';
  if (m.id === 'bottle') return '<b>改變：</b>膠樽大小　<b>保持：</b>剛剛好、力度 90%、密封';
  if (m.id === 'nozzle') return '<b>改變：</b>出氣口大小　<b>保持：</b>大膠樽、力度 90%、密封';
  if (m.id === 'pull') return '<b>改變：</b>力度　<b>保持：</b>大膠樽、剛剛好、密封';
  return '<b>改變：</b>瞄準、力度　<b>保持：</b>紙箱、剛剛好、密封';
}

function updateUI() {
  const m = state.mission;
  $('#missionCounter').textContent = `任務 ${state.missionIndex + 1} / ${TOTAL_MISSIONS}`;
  $('#progressFill').style.width = `${((state.missionIndex + 1) / TOTAL_MISSIONS) * 100}%`;
  $('#scoreValue').textContent = String(displayScore());
  $('#hudScore').textContent = String(displayScore());
  $('#missionLabel').textContent = `任務 ${state.missionIndex + 1} · ${phaseLabel()}`;
  $('#missionTitle').textContent = m.title;
  $('#missionSubtitle').textContent = m.subtitle;
  $('#conceptText').textContent = m.concept;
  $('#fairBox').innerHTML = fairText();
  $('#targetValue').textContent = `${m.target} 支蠟燭`;
  $('#windChip').textContent = m.wind ? '側風：向上推' : '無風';
  $('#phaseChip').textContent = phaseLabel();
  $('#speech').textContent = speechForPhase();
  $('#hintText').textContent = m.id === 'challenge' ? '風向會改變氣圈位置' : '只改變一個條件，才是公平測試';
  $('#statusText').textContent = currentStatus();

  renderPrediction();
  renderTrials();
  renderData();
  renderConclusion();
  renderFinal();
  updateMainButton();
}

function currentStatus() {
  if (state.phase === 'predict') return '先選預測，才能做實驗';
  if (state.phase === 'test') return '選一個實驗按鈕';
  if (state.phase === 'flying' || state.phase === 'finalFlying') return '氣圈飛行中…';
  if (state.phase === 'conclusion') return '看紀錄，選出結論';
  if (state.phase === 'concluded') return '本關完成，按下一關';
  if (state.phase === 'finalPredict') return '先預測風向';
  if (state.phase === 'finalAim') return '調整瞄準和力度，再發射';
  if (state.phase === 'finalResult') return '看看結果，再決定下一步';
  return '任務完成';
}

function renderPrediction() {
  const box = $('#predictionBox');
  const options = $('#predictionOptions');
  const prediction = state.mission.id === 'challenge' ? state.finalPrediction : state.prediction;
  box.hidden = !['predict', 'test', 'flying', 'conclusion', 'concluded', 'finalPredict', 'finalAim', 'finalFlying', 'finalResult'].includes(state.phase);
  options.innerHTML = '';
  state.mission.prediction.options.forEach((label, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'option-btn';
    button.textContent = label;
    button.dataset.index = String(index);
    if (prediction === index) button.classList.add('is-selected');
    if (state.predictionLocked && (state.phase === 'conclusion' || state.phase === 'concluded' || state.phase === 'finalResult')) {
      if (index === state.mission.prediction.correct) button.classList.add('is-correct');
      if (prediction === index && prediction !== state.mission.prediction.correct) button.classList.add('is-wrong');
    }
    button.disabled = state.predictionLocked;
    options.appendChild(button);
  });
}

function $$(selector) { return document.querySelectorAll(selector); }

function renderTrials() {
  const box = $('#trialsBox');
  const list = $('#trialList');
  if (state.mission.id === 'challenge') {
    box.hidden = true;
    return;
  }
  box.hidden = !['predict', 'test', 'flying', 'conclusion', 'concluded'].includes(state.phase);
  list.innerHTML = '';
  state.mission.trials.forEach((trial, index) => {
    const result = state.trialResults[index];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `trial-btn${result ? ' done' : ''}`;
    button.dataset.index = String(index);
    button.innerHTML = `<span class="trial-copy"><b>${trial.label}</b><small>${trial.note}</small></span><span class="trial-result">${result ? `${result.count}<small> 支</small>` : '▶'}</span>`;
    button.disabled = state.phase !== 'test' || Boolean(result);
    list.appendChild(button);
  });
  const done = state.trialResults.filter(Boolean).length;
  $('#trialProgress').textContent = `${done} / ${state.mission.trials.length}`;
}

function renderData() {
  const box = $('#dataBox');
  const table = $('#dataTable');
  if (state.mission.id === 'challenge') {
    box.hidden = true;
    return;
  }
  box.hidden = state.trialResults.every((item) => !item);
  table.innerHTML = '';
  state.mission.trials.forEach((trial, index) => {
    const result = state.trialResults[index];
    const row = document.createElement('div');
    row.className = 'data-row';
    row.innerHTML = `<span>${trial.label}</span><b>${result ? `${result.count} 支` : '未測試'}</b>`;
    table.appendChild(row);
  });
  $('#bestValue').textContent = `${bestOf(state.trialResults)} 支`;
}

function renderConclusion() {
  const box = $('#conclusionBox');
  const options = $('#conclusionOptions');
  const m = state.mission;
  if (m.id === 'challenge') {
    box.hidden = true;
    return;
  }
  box.hidden = state.phase !== 'conclusion' && state.phase !== 'concluded';
  if (box.hidden) return;
  options.innerHTML = '';
  m.conclusion.options.forEach((label, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'option-btn';
    button.textContent = label;
    button.dataset.index = String(index);
    if (state.conclusionChoice === index) {
      button.classList.add(index === m.conclusion.correct ? 'is-correct' : 'is-wrong');
    }
    if (state.conclusionChoice === m.conclusion.correct) button.disabled = true;
    options.appendChild(button);
  });
  $('#conclusionQuestion').textContent = m.conclusion.question;
  const note = $('#conclusionNote');
  if (state.conclusionChoice === m.conclusion.correct) {
    note.textContent = `結論正確！${m.conclusion.options[m.conclusion.correct]}`;
    note.className = 'conclusion-note';
  } else {
    note.textContent = state.conclusionWrong ? '再看看紀錄，哪個條件令蠟燭吹得較多？' : '';
    note.className = 'conclusion-note is-bad';
  }
  if (state.conclusionChoice === m.conclusion.correct) {
    const parts = state.breakdown;
    $('#scoreNote').textContent = `預測 ${parts.prediction} + 實驗 ${parts.tests} + 結論 ${parts.conclusion} + 表現 ${parts.performance} = ${state.missionScore} 分`;
  } else {
    $('#scoreNote').textContent = '完成實驗和結論，就會得到本關分數。';
  }
}

function renderFinal() {
  const isFinal = state.mission.id === 'challenge';
  const box = $('#finalBox');
  box.hidden = !(isFinal && (state.phase === 'finalAim' || state.phase === 'finalFlying'));
  if (isFinal) {
    $('#attemptLabel').textContent = `${2 - state.finalAttempts} 次機會`;
    $('#aimValue').textContent = state.aim === 0 ? '中間' : state.aim < 0 ? '向上' : '向下';
    $('#pullValue').textContent = `${Math.round(state.pull * 100)}%`;
  }
  if (isFinal && state.phase === 'finalResult') {
    $('#scoreNote').textContent = `吹熄 ${bestOf(state.finalResults)} 支（目標 ${state.mission.target} 支）。${state.finalScore ? `本關 ${state.finalScore} 分。` : ''}`;
  }
}

function updateMainButton() {
  const button = $('#mainBtn');
  const retry = $('#retryBtn');
  button.hidden = false;
  retry.hidden = true;
  if (state.phase === 'predict') {
    button.disabled = true;
    button.textContent = '先選預測';
  } else if (state.phase === 'test') {
    button.disabled = true;
    button.textContent = '請做實驗';
  } else if (state.phase === 'flying') {
    button.disabled = true;
    button.textContent = '實驗中…';
  } else if (state.phase === 'conclusion') {
    button.disabled = true;
    button.textContent = '先選結論';
  } else if (state.phase === 'concluded') {
    button.disabled = false;
    button.textContent = state.missionIndex === TOTAL_MISSIONS - 2 ? '進入挑戰' : '下一關';
  } else if (state.phase === 'finalPredict') {
    button.disabled = true;
    button.textContent = '先選預測';
  } else if (state.phase === 'finalAim') {
    button.disabled = false;
    button.textContent = state.finalAttempts ? '再發射一次' : '發射';
  } else if (state.phase === 'finalFlying') {
    button.disabled = true;
    button.textContent = '發射中…';
  } else if (state.phase === 'finalResult') {
    const hit = bestOf(state.finalResults) >= state.mission.target;
    if (hit || state.finalAttempts >= 2) {
      button.disabled = false;
      button.textContent = '看總結';
    } else {
      button.disabled = true;
      button.textContent = '看結果';
      retry.hidden = false;
    }
  } else {
    button.disabled = true;
    button.textContent = '完成';
  }
}

function selectPrediction(index) {
  if (state.phase === 'predict') {
    state.prediction = index;
    state.predictionLocked = true;
    state.phase = 'test';
  } else if (state.phase === 'finalPredict') {
    state.finalPrediction = index;
    state.predictionLocked = true;
    state.phase = 'finalAim';
  } else return;
  updateUI();
}

function trialSettings(index) {
  return { ...state.mission.standard, ...state.mission.trials[index].settings };
}

function runTrial(index) {
  if (state.phase !== 'test') return;
  if (!state.predictionLocked) return;
  if (state.trialResults[index]) return;
  const settings = trialSettings(index);
  const result = simulate(settings);
  state.lastSim = settings;
  state.activeTrial = index;
  state.phase = 'flying';
  state.anim = { start: performance.now(), duration: 1700, result, mode: 'trial', index };
  updateUI();
}

function chooseConclusion(index) {
  if (state.phase !== 'conclusion') return;
  const m = state.mission;
  if (index !== m.conclusion.correct) {
    state.conclusionWrong = true;
    state.conclusionChoice = index;
    updateUI();
    return;
  }
  state.conclusionChoice = index;
  state.phase = 'concluded';
  const best = bestOf(state.trialResults);
  const parts = scoreMission({
    predictionCorrect: state.prediction === m.prediction.correct,
    testedAll: state.trialResults.filter(Boolean).length === m.trials.length,
    conclusionCorrect: true,
    best,
    target: m.target,
  });
  parts.conclusion = state.conclusionWrong ? 20 : 40;
  state.breakdown = parts;
  state.conclusionScore = parts.conclusion;
  state.missionScore = parts.prediction + parts.tests + parts.conclusion + parts.performance;
  updateUI();
}

function finishAnimation(animation) {
  if (animation.mode === 'trial') {
    state.candleState = new Set(animation.result.extinguished);
    state.trialResults[animation.index] = animation.result;
    state.activeTrial = -1;
    state.phase = 'test';
    updateUI();
    if (state.trialResults.filter(Boolean).length === state.mission.trials.length) {
      state.phase = 'conclusion';
      updateUI();
    }
    return;
  }
  if (animation.mode === 'final') {
    state.candleState = new Set(animation.result.extinguished);
    state.finalAttempts += 1;
    state.finalResults.push(animation.result);
    const best = bestOf(state.finalResults);
    const hit = best >= state.mission.target;
    const prediction = state.finalPrediction === state.mission.prediction.correct ? 20 : 0;
    const perform = hit ? 60 : 0;
    const efficiency = hit ? (state.finalAttempts === 1 ? 20 : 10) : 0;
    state.finalScore = prediction + perform + efficiency;
    state.phase = 'finalResult';
    updateUI();
  }
}

function launchFinal() {
  if (state.phase !== 'finalAim') return;
  const settings = {
    ...state.mission.standard,
    pull: state.pull,
    aim: state.aim,
    wind: state.mission.wind,
  };
  const result = simulate(settings);
  state.lastSim = settings;
  state.phase = 'finalFlying';
  state.anim = { start: performance.now(), duration: 1900, result, mode: 'final' };
  updateUI();
}

function retryFinal() {
  if (state.phase !== 'finalResult') return;
  state.phase = 'finalAim';
  updateUI();
}

function nextStep() {
  if (state.phase === 'concluded') {
    state.total += state.missionScore;
    if (state.missionIndex >= TOTAL_MISSIONS - 2) {
      loadMission(TOTAL_MISSIONS - 1);
    } else {
      loadMission(state.missionIndex + 1);
    }
    reportScore();
    return;
  }
  if (state.phase === 'finalResult') {
    const hit = bestOf(state.finalResults) >= state.mission.target;
    if (!hit && state.finalAttempts < 2) {
      retryFinal();
      return;
    }
    showFinal();
  }
}

function showFinal() {
  state.total += state.finalScore;
  state.phase = 'final';
  reportScore();
  $('#finalScore').textContent = String(Math.min(MAX_SCORE, state.total));
  $('#finalSummary').textContent = state.total >= 450
    ? '你能用公平測試找出空氣炮的秘密，也會用證據做結論！'
    : state.total >= 300
      ? '你已經掌握大部分概念，再比較紀錄就會更清楚。'
      : '再試一次，記得只改變一個條件，並觀察蠟燭的數量。';
  $('#finalOverlay').hidden = false;
  updateUI();
}

function restart() {
  state.total = 0;
  state.missionIndex = 0;
  loadMission(0);
  reportScore();
  toast('重新開始，先選一個預測。');
}

/* -------------------------------------------------------------------------- */
/* Events                                                                     */
/* -------------------------------------------------------------------------- */

$('#predictionOptions').addEventListener('click', (event) => {
  const button = event.target.closest('.option-btn');
  if (!button || button.disabled) return;
  const index = Number(button.dataset.index);
  if (state.phase === 'predict' || state.phase === 'finalPredict') {
    selectPrediction(index);
  }
});

$('#trialList').addEventListener('click', (event) => {
  const button = event.target.closest('.trial-btn');
  if (!button || button.disabled) return;
  runTrial(Number(button.dataset.index));
});

$('#conclusionOptions').addEventListener('click', (event) => {
  const button = event.target.closest('.option-btn');
  if (!button || button.disabled) return;
  chooseConclusion(Number(button.dataset.index));
});

$('#mainBtn').addEventListener('click', () => {
  if (state.phase === 'finalAim') launchFinal();
  else if (state.phase === 'finalResult' || state.phase === 'concluded') nextStep();
});
$('#retryBtn').addEventListener('click', retryFinal);
$('#restartBtn').addEventListener('click', restart);
$('#finalRestart').addEventListener('click', restart);

$('#aimInput').addEventListener('input', (event) => {
  if (state.phase !== 'finalAim') return;
  state.aim = Number(event.target.value) / 100;
  state.lastSim = {
    ...state.mission.standard,
    pull: state.pull,
    aim: state.aim,
    wind: state.mission.wind,
  };
  $('#aimValue').textContent = state.aim === 0 ? '中間' : state.aim < 0 ? '向上' : '向下';
  renderCanvas(performance.now());
});
$('#pullInput').addEventListener('input', (event) => {
  if (state.phase !== 'finalAim') return;
  state.pull = Number(event.target.value) / 100;
  $('#pullValue').textContent = `${Math.round(state.pull * 100)}%`;
  state.lastSim = {
    ...state.mission.standard,
    pull: state.pull,
    aim: state.aim,
    wind: state.mission.wind,
  };
  renderCanvas(performance.now());
});

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('is-visible');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('is-visible'), 1800);
}

new ResizeObserver(resizeCanvas).observe(sceneWrap);
window.addEventListener('resize', resizeCanvas);

/* Debug API for automated checks. */
window.__AIR_CANNON__ = {
  getState: () => ({
    missionIndex: state.missionIndex,
    missionId: state.mission.id,
    phase: state.phase,
    prediction: state.mission.id === 'challenge' ? state.finalPrediction : state.prediction,
    trialResults: state.trialResults.map((item) => (item ? item.count : null)),
    conclusionChoice: state.conclusionChoice,
    missionScore: state.missionScore,
    finalAttempts: state.finalAttempts,
    finalResults: state.finalResults.map((item) => item.count),
    finalScore: state.finalScore,
    total: state.total,
    aim: state.aim,
    pull: state.pull,
  }),
  selectPrediction,
  runTrial,
  chooseConclusion,
  next: nextStep,
  setFinal: (aim, pull) => {
    state.aim = Math.max(-1, Math.min(1, aim));
    state.pull = Math.max(0.3, Math.min(1, pull));
    $('#aimInput').value = String(Math.round(state.aim * 100));
    $('#pullInput').value = String(Math.round(state.pull * 100));
    $('#aimValue').textContent = state.aim === 0 ? '中間' : state.aim < 0 ? '向上' : '向下';
    $('#pullValue').textContent = `${Math.round(state.pull * 100)}%`;
    renderCanvas(performance.now());
  },
  launchFinal,
  retryFinal,
  restart,
};

/* Boot */
loadMission(0);
resizeCanvas();
requestAnimationFrame(animate);
