import * as THREE from '../vendor/three.module.js';
import {
  clamp,
  fmt,
  signed,
  outcomeFor,
  willCollide,
  comPosition,
} from './physics.js';
import { SCENARIOS, SCENARIO_ORDER, scenarioFor, defaultInputs } from './scenarios.js';
import { EXAM_TYPES, generateQuestion, checkAnswers } from './exam.js';
import { initLanguage, localizeDom } from './i18n.js';

const $ = (id) => document.getElementById(id);
const isEmbedded =
  new URLSearchParams(window.location.search).get('embed') === '1' ||
  window.parent !== window;

const refs = {
  app: $('app'),
  scene: $('scene'),
  stage: $('stage'),
  appMain: $('appMain'),
  labScreen: $('labScreen'),
  labScenarioDesc: $('labScenarioDesc'),
  scenarioTabs: $('scenarioTabs'),
  scenarioTitle: $('scenarioTitle'),
  scenarioDesc: $('scenarioDesc'),
  scenarioConcept: $('scenarioConcept'),
  scenarioTip: $('scenarioTip'),
  m1: $('m1'),
  m2: $('m2'),
  u1: $('u1'),
  u2: $('u2'),
  e: $('e'),
  energy: $('energy'),
  m1Val: $('m1Val'),
  m2Val: $('m2Val'),
  u1Val: $('u1Val'),
  u2Val: $('u2Val'),
  eVal: $('eVal'),
  energyVal: $('energyVal'),
  velocityControls: $('velocityControls'),
  restitutionGroup: $('restitutionGroup'),
  energyGroup: $('energyGroup'),
  predictionQuestion: $('predictionQuestion'),
  predictionOptions: $('predictionOptions'),
  predictionFeedback: $('predictionFeedback'),
  runBtn: $('runBtn'),
  resetBtn: $('resetBtn'),
  stageStatus: $('stageStatus'),
  timeReadout: $('timeReadout'),
  stageHint: $('stageHint'),
  stageResult: $('stageResult'),
  hudM1: $('hudM1'),
  hudM2: $('hudM2'),
  summaryM1: $('summaryM1'),
  summaryM2: $('summaryM2'),
  summaryU1: $('summaryU1'),
  summaryU2: $('summaryU2'),
  summaryExtra: $('summaryExtra'),
  summaryExtraLabel: $('summaryExtraLabel'),
  beforeSummary: $('beforeSummary'),
  afterSummary: $('afterSummary'),
  momentumBars: $('momentumBars'),
  energyBars: $('energyBars'),
  momentumNote: $('momentumNote'),
  energyNote: $('energyNote'),
  equationBlock: $('equationBlock'),
  derivationBtn: $('derivationBtn'),
  derivationBlock: $('derivationBlock'),
  systemNote: $('systemNote'),
  examBtn: $('examBtn'),
  examModal: $('examModal'),
  examClose: $('examClose'),
  examTypes: $('examTypes'),
  examMeta: $('examMeta'),
  examQuestion: $('examQuestion'),
  examFields: $('examFields'),
  examCheck: $('examCheck'),
  examHint: $('examHint'),
  examSolutionBtn: $('examSolutionBtn'),
  examNext: $('examNext'),
  examFeedback: $('examFeedback'),
  examSolution: $('examSolution'),
  guideBtn: $('guideBtn'),
  guideModal: $('guideModal'),
  guideClose: $('guideClose'),
  guideStart: $('guideStart'),
  setupPanel: $('setupPanel'),
  analysisPanel: $('analysisPanel'),
  scrim: $('scrim'),
  adjustBtn: $('adjustBtn'),
  closeControls: $('closeControls'),
  sheetDone: $('sheetDone'),
  bottomNav: $('bottomNav'),
  labNav: $('labNav'),
  analysisNav: $('analysisNav'),
  examNav: $('examNav'),
  toast: $('toast'),
};

const state = {
  scenario: 'perfectly-inelastic',
  view: 'lab',
  inputs: defaultInputs('perfectly-inelastic'),
  phase: 'idle',
  predicted: null,
  revealed: false,
  collision: false,
  exploded: false,
  result: null,
  t: 0,
  x1: -3.4,
  x2: 3.4,
  v1: 4,
  v2: -2,
  exam: {
    type: 'perfectly-inelastic',
    question: null,
    solutionOpen: false,
  },
  completedScenarios: new Set(),
};

let scene;
let camera;
let renderer;
let cartA;
let cartB;
let arrowA;
let arrowB;
let comMarker;
let flashLight;
let flashRing;
let flashAge = 1;
let particles;
let particleVelocities = [];
let particleAge = 1;
let sceneReady = false;
let resizeObserver;
let lastFrame = performance.now();
let accumulator = 0;
let toastTimer = 0;

const COLORS = {
  a: 0x5ff3ff,
  floor: 0x061019,
  dark: 0x08131c,
  white: 0xffffff,
};

/* ---------- UI / scenario ---------- */

function createScenarioTabs() {
  refs.scenarioTabs.replaceChildren();
  for (const id of SCENARIO_ORDER) {
    const scenario = scenarioFor(id);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'scenario-tab';
    button.dataset.scenario = id;
    button.setAttribute('role', 'tab');
    button.textContent = scenario.label;
    button.addEventListener('click', () => setScenario(id));
    refs.scenarioTabs.append(button);
  }
}

function setScenario(id) {
  state.scenario = id;
  state.inputs = defaultInputs(id);
  state.phase = 'idle';
  state.predicted = null;
  state.revealed = false;
  state.collision = false;
  state.exploded = false;
  state.result = null;
  state.t = 0;

  const scenario = scenarioFor(id);
  refs.app.dataset.scenario = id;
  refs.scenarioTitle.textContent = scenario.label;
  refs.labScenarioDesc.textContent = scenario.description;
  refs.scenarioDesc.textContent = scenario.description;
  refs.scenarioConcept.textContent = scenario.concept;
  refs.scenarioTip.textContent = scenario.examTip;
  refs.predictionQuestion.textContent = scenario.prediction.question;
  refs.systemNote.textContent =
    id === 'explosion'
      ? '系統：爆炸物。爆炸前後總動量守恆；外力（重力、空氣阻力）在短時間內可忽略。'
      : '系統：A + B。水平方向外力可忽略，總動量守恆；碰撞時間極短。';
  refs.derivationBlock.hidden = true;
  refs.derivationBtn.textContent = '顯示推導';

  for (const tab of refs.scenarioTabs.querySelectorAll('.scenario-tab')) {
    tab.classList.toggle('is-active', tab.dataset.scenario === id);
    tab.setAttribute('aria-selected', String(tab.dataset.scenario === id));
  }

  refs.m1.value = scenario.preset.m1;
  refs.m2.value = scenario.preset.m2;
  refs.u1.value = scenario.preset.u1;
  refs.u2.value = scenario.preset.u2;
  refs.e.value = scenario.preset.e;
  refs.energy.value = scenario.preset.energy;

  syncControlVisibility();
  syncInputLabels();
  renderPrediction();
  resetSimulation();
  updateAll();
  applySceneTheme(scenario.accent);
  if (!isWideLayout() && state.view === 'analysis') setView('lab');
  localizeDom();
}

function syncControlVisibility() {
  refs.velocityControls.hidden = state.scenario === 'explosion';
  refs.restitutionGroup.hidden = state.scenario !== 'inelastic';
  refs.energyGroup.hidden = state.scenario !== 'explosion';
}

function syncInputLabels() {
  const inputs = state.inputs;
  refs.m1Val.textContent = `${fmt(inputs.m1, 1)} kg`;
  refs.m2Val.textContent = `${fmt(inputs.m2, 1)} kg`;
  refs.u1Val.textContent = `${signed(inputs.u1, 1)} m/s`;
  refs.u2Val.textContent = `${signed(inputs.u2, 1)} m/s`;
  refs.eVal.textContent = fmt(inputs.e, 2);
  refs.energyVal.textContent = `${fmt(inputs.energy, 0)} J`;
  refs.hudM1.textContent = `${fmt(inputs.m1, 1)} kg`;
  refs.hudM2.textContent = `${fmt(inputs.m2, 1)} kg`;
  refs.summaryM1.textContent = `${fmt(inputs.m1, 1)} kg`;
  refs.summaryM2.textContent = `${fmt(inputs.m2, 1)} kg`;
  refs.summaryU1.textContent = `${signed(inputs.u1, 1)} m/s`;
  refs.summaryU2.textContent = `${signed(inputs.u2, 1)} m/s`;
  if (state.scenario === 'explosion') {
    refs.summaryExtraLabel.textContent = 'E';
    refs.summaryExtra.textContent = `${fmt(inputs.energy, 0)} J`;
  } else {
    refs.summaryExtraLabel.textContent = 'e';
    refs.summaryExtra.textContent = fmt(inputs.e, 2);
  }

  for (const input of [refs.m1, refs.m2, refs.u1, refs.u2, refs.e, refs.energy]) {
    updateRangeFill(input);
  }

  if (sceneReady) updateCartLabels();
}

function updateRangeFill(input) {
  const min = Number(input.min);
  const max = Number(input.max);
  const value = Number(input.value);
  const percent = ((value - min) / (max - min)) * 100;
  input.style.background =
    `linear-gradient(90deg, var(--accent) 0%, var(--accent) ${percent}%, ` +
    `rgba(95, 243, 255, 0.12) ${percent}%, rgba(95, 243, 255, 0.12) 100%)`;
}

function readInputs() {
  state.inputs = {
    m1: Number(refs.m1.value),
    m2: Number(refs.m2.value),
    u1: Number(refs.u1.value),
    u2: Number(refs.u2.value),
    e: Number(refs.e.value),
    energy: Number(refs.energy.value),
  };
}

function onInputChange() {
  readInputs();
  syncInputLabels();
  state.phase = 'idle';
  state.revealed = false;
  state.collision = false;
  state.exploded = false;
  state.result = null;
  state.t = 0;
  resetSimulation();
  updateAll();
}

function renderPrediction() {
  const scenario = scenarioFor(state.scenario);
  refs.predictionOptions.replaceChildren();

  scenario.prediction.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'prediction-option';
    button.dataset.index = String(index);
    button.textContent = option;
    button.disabled = state.phase === 'running';
    button.addEventListener('click', () => {
      if (state.phase === 'running') return;
      state.predicted = index;
      state.revealed = false;
      state.phase = 'idle';
      state.result = null;
      state.collision = false;
      state.exploded = false;
      resetSimulation();
      renderPrediction();
      updateAll();
    });
    if (state.predicted === index) button.classList.add('is-selected');
    refs.predictionOptions.append(button);
  });

  refs.predictionFeedback.textContent = '';
  refs.predictionFeedback.className = 'prediction-feedback';
  syncRunButton();
  localizeDom();
}

function syncRunButton() {
  if (state.phase === 'running') {
    refs.runBtn.disabled = true;
    refs.runBtn.querySelector('span').textContent = '模擬中…';
    return;
  }

  if (state.predicted === null) {
    refs.runBtn.disabled = false;
    refs.runBtn.querySelector('span').textContent = '先選預測';
    refs.runBtn.title = '點擊開啟設定，先選一個預測';
    return;
  }

  refs.runBtn.disabled = false;
  refs.runBtn.querySelector('span').textContent =
    state.phase === 'done' ? '重播模擬' : '開始模擬';
  refs.runBtn.title = '';
}

function showPredictionResult() {
  const scenario = scenarioFor(state.scenario);
  if (!state.revealed) return;

  const correct = state.predicted === scenario.prediction.correct;
  const options = refs.predictionOptions.querySelectorAll('.prediction-option');
  options.forEach((option, index) => {
    option.disabled = true;
    if (index === scenario.prediction.correct) option.classList.add('is-correct');
    if (index === state.predicted && !correct) option.classList.add('is-wrong');
  });

  refs.predictionFeedback.className = `prediction-feedback ${correct ? 'is-good' : 'is-bad'}`;
  refs.predictionFeedback.textContent = correct
    ? `預測正確。${scenario.prediction.explanation}`
    : `你的預測不是最準確的。正確答案：${scenario.prediction.options[scenario.prediction.correct]}。${scenario.prediction.explanation}`;
}

function resetSimulation() {
  state.phase = 'idle';
  state.result = null;
  state.revealed = false;
  state.collision = false;
  state.exploded = false;
  state.t = 0;

  if (state.scenario === 'explosion') {
    state.x1 = -0.56;
    state.x2 = 0.56;
    state.v1 = 0;
    state.v2 = 0;
  } else {
    state.x1 = -2.5;
    state.x2 = 2.5;
    state.v1 = state.inputs.u1;
    state.v2 = state.inputs.u2;
  }

  refs.afterSummary.textContent = '尚未模擬';
  refs.stageStatus.textContent = '待開始';
  refs.stageStatus.classList.remove('is-running');
  refs.stageResult.hidden = true;
  refs.timeReadout.textContent = 't = 0.0 s';
  refs.stageHint.textContent =
    state.scenario === 'explosion'
      ? '爆炸前靜止；先預測碎片方向。'
      : '先選下方預測，再開始。';
  refs.predictionFeedback.textContent = '';
  refs.predictionFeedback.className = 'prediction-feedback';
  refs.analysisNav.classList.remove('has-update');
  for (const option of refs.predictionOptions.querySelectorAll('.prediction-option')) {
    option.disabled = false;
    option.classList.remove('is-correct', 'is-wrong');
    option.classList.toggle('is-selected', Number(option.dataset.index) === state.predicted);
  }
  resetEffects();
  updateVisuals();
  syncRunButton();
  localizeDom();
}

function runSimulation() {
  if (state.predicted === null) {
    const card = refs.predictionOptions.closest('.prediction-card');
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    toast('先選一個預測，再開始模擬。');
    return;
  }
  if (state.phase === 'running') return;

  readInputs();
  const result = outcomeFor({ scenario: state.scenario, inputs: state.inputs });
  if (state.scenario !== 'explosion' && !willCollide(state.inputs)) {
    toast('兩車現時不會碰撞：A 的向右速度必須大於 B 的向右速度。');
    return;
  }

  state.result = result;
  state.phase = 'running';
  state.revealed = false;
  state.collision = false;
  state.exploded = false;
  state.t = 0;

  if (state.scenario === 'explosion') {
    state.x1 = -0.56;
    state.x2 = 0.56;
    state.v1 = 0;
    state.v2 = 0;
  } else {
    state.x1 = -2.7;
    state.x2 = 2.7;
    state.v1 = state.inputs.u1;
    state.v2 = state.inputs.u2;
  }

  refs.afterSummary.textContent = '模擬中…';
  refs.stageStatus.textContent = '模擬中';
  refs.stageStatus.classList.add('is-running');
  refs.stageResult.hidden = true;
  refs.stageHint.textContent =
    state.scenario === 'explosion' ? '觀察碎片是否動量相反。' : '觀察碰撞前後總動量是否相同。';
  refs.predictionFeedback.textContent = '';
  refs.predictionFeedback.className = 'prediction-feedback';
  window.clearTimeout(toastTimer);
  refs.toast.classList.remove('is-visible');
  resetEffects();
  syncRunButton();
  updateVisuals();
  updateAll();
}

function revealResult(label) {
  state.revealed = true;
  refs.afterSummary.textContent = formatAfterSummary(state.result);
  refs.stageStatus.textContent = label;
  refs.stageStatus.classList.remove('is-running');
  refs.stageResult.hidden = false;
  if (state.scenario === 'explosion') {
    refs.stageResult.textContent =
      `Σp 前後 = 0 kg·m/s · KE 增加 ${fmt(state.result.keAfter)} J`;
  } else {
    refs.stageResult.textContent =
      `Σp 前 = ${fmt(state.result.pBefore)} → 後 = ${fmt(state.result.pAfter)} kg·m/s · ΔKE = ${fmt(state.result.keLoss)} J`;
  }
  if (state.view !== 'analysis') refs.analysisNav.classList.add('has-update');
  showPredictionResult();
  renderData();
  updateEquation();
  localizeDom();
}

function finishSimulation() {
  state.phase = 'done';
  state.t = Math.min(state.t, 3.6);
  refs.timeReadout.textContent = `t = ${fmt(state.t, 1)} s`;
  refs.stageStatus.textContent = '完成';
  refs.stageStatus.classList.remove('is-running');
  if (!state.revealed) revealResult('完成');

  const scenario = scenarioFor(state.scenario);
  if (state.predicted === scenario.prediction.correct) {
    state.completedScenarios.add(state.scenario);
    reportPlatformScore();
  }

  updateAll();
  localizeDom();
}

function updateSimulation(dt) {
  if (state.phase !== 'running') return;
  state.t += dt;

  if (state.scenario === 'explosion') {
    if (!state.exploded && state.t >= 0.7) {
      state.exploded = true;
      state.v1 = state.result.v1;
      state.v2 = state.result.v2;
      burstParticles(0);
      flash(0.5);
      revealResult('爆炸完成');
    }
    if (state.exploded) {
      state.x1 += state.v1 * dt;
      state.x2 += state.v2 * dt;
    }
  } else if (!state.collision) {
    state.x1 += state.v1 * dt;
    state.x2 += state.v2 * dt;

    if (state.x2 - state.x1 <= 1.12) {
      const mid = (state.x1 + state.x2) / 2;
      state.x1 = mid - 0.56;
      state.x2 = mid + 0.56;
      state.v1 = state.result.v1;
      state.v2 = state.result.v2;
      state.collision = true;
      flash(mid);
      revealResult('碰撞完成');
    }
  } else {
    state.x1 += state.v1 * dt;
    state.x2 += state.v2 * dt;
  }

  if (state.t >= 3.6 || Math.abs(state.x1) > 9 || Math.abs(state.x2) > 9) {
    finishSimulation();
  }

  refs.timeReadout.textContent = `t = ${fmt(state.t, 1)} s`;
}

function updateAll() {
  renderData();
  updateEquation();
  syncRunButton();
  showPredictionResult();
  localizeDom();
}

/* ---------- data / equations ---------- */

function formatBeforeSummary() {
  const { m1, m2, u1, u2 } = state.inputs;
  if (state.scenario === 'explosion') return `m₁ = ${fmt(m1, 1)} kg\nm₂ = ${fmt(m2, 1)} kg\nu₁ = u₂ = 0`;
  return `u₁ = ${signed(u1, 1)} m/s\nu₂ = ${signed(u2, 1)} m/s\np = ${fmt(m1 * u1 + m2 * u2)}`;
}

function formatAfterSummary(result) {
  if (!result) return '尚未模擬';
  if (state.scenario === 'explosion') {
    return `v₁ = ${signed(result.v1)} m/s\nv₂ = ${signed(result.v2)} m/s\np = ${fmt(result.pAfter)}`;
  }
  return `v₁ = ${signed(result.v1)} m/s\nv₂ = ${signed(result.v2)} m/s\np = ${fmt(result.pAfter)}`;
}

function barLeftWidth(value, max, positiveOnly = false) {
  const magnitude = Math.abs(value);
  if (max <= 0 || magnitude <= 0.0001) return { left: '50%', width: '0%' };
  if (positiveOnly) {
    return { left: '50%', width: `${(magnitude / max) * 50}%` };
  }
  if (value >= 0) {
    return { left: '50%', width: `${(magnitude / max) * 50}%` };
  }
  return {
    left: `${50 - (magnitude / max) * 50}%`,
    width: `${(magnitude / max) * 50}%`,
  };
}

function addBar(container, label, value, max, color, signedValue = true) {
  const row = document.createElement('div');
  row.className = 'bar-row';

  const name = document.createElement('span');
  name.className = 'bar-label';
  name.textContent = label;

  const track = document.createElement('span');
  track.className = 'bar-track';
  const fill = document.createElement('span');
  fill.className = 'bar-fill';
  const position = barLeftWidth(value, max);
  fill.style.setProperty('--bar-left', position.left);
  fill.style.setProperty('--bar-width', position.width);
  fill.style.setProperty('--bar-color', color);
  track.append(fill);

  const amount = document.createElement('span');
  amount.className = 'bar-value';
  amount.textContent = signedValue ? signed(value) : fmt(value);

  row.append(name, track, amount);
  container.append(row);
}

function addBarGroup(container, label, rows) {
  const group = document.createElement('div');
  group.className = 'bar-group';
  const title = document.createElement('span');
  title.className = 'bar-group-label';
  title.textContent = label;
  group.append(title);
  for (const row of rows) group.append(row);
  container.append(group);
}

function makeBarRow(label, value, max, color, signedValue = true) {
  const row = document.createElement('div');
  row.className = 'bar-row';
  const name = document.createElement('span');
  name.className = 'bar-label';
  name.textContent = label;
  const track = document.createElement('span');
  track.className = 'bar-track';
  const fill = document.createElement('span');
  fill.className = 'bar-fill';
  const position = barLeftWidth(value, max);
  fill.style.setProperty('--bar-left', position.left);
  fill.style.setProperty('--bar-width', position.width);
  fill.style.setProperty('--bar-color', color);
  track.append(fill);
  const amount = document.createElement('span');
  amount.className = 'bar-value';
  amount.textContent = signedValue ? signed(value) : fmt(value);
  row.append(name, track, amount);
  return row;
}

function renderData() {
  const inputs = state.inputs;
  const before = state.result || outcomeFor({ scenario: state.scenario, inputs });
  const revealed = state.revealed && Boolean(state.result);
  const result = state.result || before;

  refs.beforeSummary.textContent = formatBeforeSummary();
  refs.afterSummary.textContent = revealed
    ? formatAfterSummary(result)
    : state.phase === 'running'
      ? '模擬中…'
      : '尚未模擬';

  const p1 = inputs.m1 * (state.scenario === 'explosion' ? 0 : inputs.u1);
  const p2 = inputs.m2 * (state.scenario === 'explosion' ? 0 : inputs.u2);
  const pTotal = p1 + p2;
  const pAfter1 = revealed ? result.m1 * result.v1 : 0;
  const pAfter2 = revealed ? result.m2 * result.v2 : 0;
  const momentumMax = Math.max(1, Math.abs(p1), Math.abs(p2), Math.abs(pTotal), Math.abs(pAfter1), Math.abs(pAfter2));

  refs.momentumBars.replaceChildren();
  const beforeRows = [
    makeBarRow('p₁', p1, momentumMax, 'var(--cyan)'),
    makeBarRow('p₂', p2, momentumMax, 'var(--accent)'),
    makeBarRow('Σp', pTotal, momentumMax, 'var(--ink-soft)'),
  ];
  addBarGroup(refs.momentumBars, '碰撞前', beforeRows);

  if (revealed) {
    const afterRows = [
      makeBarRow("p₁′", pAfter1, momentumMax, 'var(--cyan)'),
      makeBarRow("p₂′", pAfter2, momentumMax, 'var(--accent)'),
      makeBarRow('Σp′', result.pAfter, momentumMax, 'var(--ink-soft)'),
    ];
    addBarGroup(refs.momentumBars, '碰撞後', afterRows);
    refs.momentumNote.textContent = `Σp 前 = ${fmt(pTotal)} kg·m/s；Σp 後 = ${fmt(result.pAfter)} kg·m/s。`;
  } else {
    refs.momentumNote.textContent = `Σp 前 = ${fmt(pTotal)} kg·m/s；總動量是向量，正負要相加。`;
  }

  const ke1 = 0.5 * inputs.m1 * (state.scenario === 'explosion' ? 0 : inputs.u1) ** 2;
  const ke2 = 0.5 * inputs.m2 * (state.scenario === 'explosion' ? 0 : inputs.u2) ** 2;
  const keBefore = ke1 + ke2;
  const keAfter = revealed ? result.keAfter : 0;
  const energyMax = Math.max(1, ke1, ke2, keBefore, keAfter);

  refs.energyBars.replaceChildren();
  const energyBeforeRows = [
    makeBarRow('KE₁', ke1, energyMax, 'var(--cyan)', false),
    makeBarRow('KE₂', ke2, energyMax, 'var(--accent)', false),
    makeBarRow('ΣKE', keBefore, energyMax, 'var(--ink-soft)', false),
  ];
  addBarGroup(refs.energyBars, '碰撞前', energyBeforeRows);

  if (revealed) {
    const afterKe1 = 0.5 * result.m1 * result.v1 ** 2;
    const afterKe2 = 0.5 * result.m2 * result.v2 ** 2;
    const energyAfterRows = [
      makeBarRow("KE₁′", afterKe1, energyMax, 'var(--cyan)', false),
      makeBarRow("KE₂′", afterKe2, energyMax, 'var(--accent)', false),
      makeBarRow('ΣKE′', result.keAfter, energyMax, 'var(--ink-soft)', false),
    ];
    addBarGroup(refs.energyBars, '碰撞後', energyAfterRows);
    if (state.scenario === 'explosion') {
      refs.energyNote.textContent = `爆炸前 KE = 0；爆炸後 KE = ${fmt(result.keAfter)} J，增加 ${fmt(result.keAfter)} J，來自化學能／彈性能。`;
    } else if (result.keLoss < 0.02) {
      refs.energyNote.textContent = `動能守恆：碰前 ${fmt(result.keBefore)} J，碰後 ${fmt(result.keAfter)} J。`;
    } else {
      refs.energyNote.textContent = `動能損失 ${fmt(result.keLoss)} J（${fmt((result.keLoss / Math.max(result.keBefore, 0.0001)) * 100, 0)}%），轉為熱、聲和形變。`;
    }
  } else {
    refs.energyNote.textContent = '碰撞後能量要另外計算，不要用動量代替動能。';
  }
}

function updateEquation() {
  const inputs = state.inputs;
  const result = state.result;
  const revealed = state.revealed && Boolean(result);
  const pBefore = state.scenario === 'explosion' ? 0 : inputs.m1 * inputs.u1 + inputs.m2 * inputs.u2;

  if (state.scenario === 'explosion') {
    const v1 = revealed ? result.v1 : null;
    const v2 = revealed ? result.v2 : null;
    refs.equationBlock.textContent =
      `0 = m₁v₁ + m₂v₂\n` +
      `0 = (${fmt(inputs.m1, 1)})v₁ + (${fmt(inputs.m2, 1)})v₂\n` +
      (revealed
        ? `v₁ = ${signed(v1)} m/s，v₂ = ${signed(v2)} m/s\n` +
          `E = ½(${fmt(inputs.m1, 1)})(${fmt(Math.abs(v1))})² + ½(${fmt(inputs.m2, 1)})(${fmt(Math.abs(v2))})²\n` +
          `E = ${fmt(result.keAfter)} J`
        : '代入質量後，碎片速度與質量成反比。');

    refs.derivationBlock.replaceChildren();
    const steps = [
      '選系統：爆炸物；爆炸前靜止，總動量 = 0。',
      '沒有外力，所以爆炸前後總動量守恆：0 = m₁v₁ + m₂v₂。',
      '因此兩塊動量大小相等、方向相反：m₁v₁ = −m₂v₂。',
      '爆炸能量 E 轉為兩塊的動能：E = ½m₁v₁² + ½m₂v₂²。',
      '先由動量求速度比，再用能量求大小；最後補方向。',
    ];
    for (const step of steps) {
      const p = document.createElement('p');
      p.textContent = step;
      refs.derivationBlock.append(p);
    }
    return;
  }

  const e = state.scenario === 'perfectly-inelastic' ? 0 : state.scenario === 'elastic' ? 1 : inputs.e;
  if (e === 0) {
    refs.equationBlock.textContent =
      `m₁u₁ + m₂u₂ = (m₁ + m₂)v\n` +
      `(${fmt(inputs.m1, 1)})(${signed(inputs.u1)}) + (${fmt(inputs.m2, 1)})(${signed(inputs.u2)}) = ${fmt(pBefore)} kg·m/s\n` +
      (revealed
        ? `v = ${fmt(pBefore)} ÷ ${fmt(inputs.m1 + inputs.m2, 1)} = ${signed(result.v1)} m/s\n` +
          `ΔKE = ${fmt(result.keLoss)} J`
        : '碰後兩車共用同一個速度 v。');
  } else {
    refs.equationBlock.textContent =
      `m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂\n` +
      `(${fmt(inputs.m1, 1)})(${signed(inputs.u1)}) + (${fmt(inputs.m2, 1)})(${signed(inputs.u2)}) = ${fmt(pBefore)} kg·m/s\n` +
      (revealed
        ? `v₁ = ${signed(result.v1)} m/s，v₂ = ${signed(result.v2)} m/s\n` +
          `Σp′ = ${fmt(result.pAfter)} kg·m/s`
        : '代入兩車的質量與初速度，求碰後兩個未知速度。');
  }

  refs.derivationBlock.replaceChildren();
  const steps =
    e === 0
      ? [
          '選系統：A + B；水平方向外力可忽略。',
          '取向右為正，速度向左要代入負數。',
          '動量守恆：m₁u₁ + m₂u₂ = (m₁ + m₂)v。',
          '解出共同速度 v；完全非彈性碰撞只有這一條速度條件。',
          '動能不一定守恆：ΔKE = KE前 − KE後，差額轉為熱、聲和形變。',
        ]
      : [
          '選系統：A + B；水平方向外力可忽略。',
          '取向右為正，速度向左要代入負數。',
          '動量守恆：m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂。',
          e >= 0.999
            ? '彈性碰撞再加動能守恆：½m₁u₁² + ½m₂u₂² = ½m₁v₁² + ½m₂v₂²。'
            : '非彈性碰撞不再有動能守恆；用動量求兩個速度中的未知數。',
          '最後檢查方向、單位，以及能量去了哪裡。',
        ];

  for (const step of steps) {
    const p = document.createElement('p');
    p.textContent = step;
    refs.derivationBlock.append(p);
  }
}

/* ---------- prediction / toast / panels ---------- */

function toast(message, duration = 3800) {
  window.clearTimeout(toastTimer);
  refs.toast.textContent = message;
  localizeDom(refs.toast);
  refs.toast.classList.add('is-visible');
  toastTimer = window.setTimeout(() => refs.toast.classList.remove('is-visible'), duration);
}

/* One point per scenario completed after a correct prediction. */
function reportPlatformScore() {
  if (!isEmbedded) return;
  try {
    window.parent.postMessage(
      {
        type: 'game-score',
        score: state.completedScenarios.size,
        metadata: { game: 'momentum' },
      },
      window.location.origin,
    );
  } catch (error) {
    // Not framed by the FunLearning host.
  }
}

function isWideLayout() {
  return window.innerWidth >= 1024;
}

function openControls() {
  if (isWideLayout()) {
    refs.setupPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  refs.setupPanel.classList.add('is-open');
  refs.scrim.hidden = false;
  document.body.classList.add('sheet-open');
}

function closeControls() {
  refs.setupPanel.classList.remove('is-open');
  refs.scrim.hidden = true;
  document.body.classList.remove('sheet-open');
}

function setNavActive(view) {
  for (const button of [refs.labNav, refs.analysisNav, refs.examNav]) {
    button.classList.toggle('is-active', button.dataset.view === view);
  }
}

function setView(view) {
  if (view !== 'lab' && view !== 'analysis') return;
  state.view = view;
  closeControls();

  if (isWideLayout()) {
    refs.labScreen.hidden = false;
    refs.analysisPanel.hidden = false;
    refs.appMain.scrollTop = 0;
  } else {
    refs.labScreen.hidden = view !== 'lab';
    refs.analysisPanel.hidden = view !== 'analysis';
    refs.appMain.scrollTop = 0;
  }

  setNavActive(view);
  refs.analysisNav.classList.remove('has-update');
}


/* ---------- exam ---------- */

function setupExamTypes() {
  refs.examTypes.replaceChildren();
  for (const type of EXAM_TYPES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'exam-type-btn';
    button.textContent = type.label;
    button.dataset.type = type.id;
    button.addEventListener('click', () => newExamQuestion(type.id));
    refs.examTypes.append(button);
  }
}

function newExamQuestion(type = state.exam.type) {
  state.exam.type = type;
  state.exam.solutionOpen = false;
  const question = generateQuestion(type);
  state.exam.question = question;

  for (const button of refs.examTypes.querySelectorAll('.exam-type-btn')) {
    button.classList.toggle('is-active', button.dataset.type === type);
  }

  const label = EXAM_TYPES.find((item) => item.id === type)?.label || '';
  refs.examMeta.textContent = `${label} · 一維動量 · 取向右為正`;
  refs.examQuestion.textContent = question.prompt;
  refs.examFields.replaceChildren();

  question.fields.forEach((field) => {
    const row = document.createElement('div');
    row.className = 'exam-field';
    const labelNode = document.createElement('label');
    labelNode.textContent = field.label;
    labelNode.htmlFor = `exam-${field.id}`;
    const input = document.createElement('input');
    input.id = `exam-${field.id}`;
    input.type = 'number';
    input.step = 'any';
    input.inputMode = 'decimal';
    input.placeholder = '輸入數值';
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') checkExam();
    });
    const unit = document.createElement('span');
    unit.className = 'exam-unit';
    unit.textContent = field.unit;
    row.append(labelNode, input, unit);
    refs.examFields.append(row);
  });

  refs.examFeedback.textContent = '';
  refs.examFeedback.className = 'exam-feedback';
  refs.examSolution.hidden = true;
  refs.examSolution.replaceChildren();
  refs.examSolutionBtn.textContent = '顯示解法';
  refs.examCheck.disabled = false;
  refs.examCheck.focus({ preventScroll: true });
  localizeDom();
}

function openExam() {
  closeControls();
  refs.examModal.hidden = false;
  setNavActive('exam');
  if (!state.exam.question || state.exam.type !== state.scenario) {
    newExamQuestion(state.scenario);
  } else {
    refs.examCheck.focus({ preventScroll: true });
  }
}

function closeExam() {
  refs.examModal.hidden = true;
  setNavActive(state.view);
}

function checkExam() {
  const question = state.exam.question;
  if (!question) return;
  const inputs = [...refs.examFields.querySelectorAll('input')];
  const outcome = checkAnswers(question, inputs.map((input) => input.value));

  outcome.results.forEach((result, index) => {
    const input = inputs[index];
    input.classList.remove('is-correct', 'is-wrong');
    if (result.correct) input.classList.add('is-correct');
    else if (!result.blank) input.classList.add('is-wrong');
  });

  if (outcome.correct) {
    refs.examFeedback.className = 'exam-feedback is-good';
    refs.examFeedback.textContent = `✓ 全部正確。${question.tip}`;
    localizeDom();
    return;
  }

  const reversals = outcome.results.filter((result) => result.reversed);
  const blanks = outcome.results.filter((result) => result.blank);
  refs.examFeedback.className = 'exam-feedback is-bad';

  if (blanks.length) {
    refs.examFeedback.textContent = '請先填寫所有數值；方向用正負號表示。';
  } else if (reversals.length) {
    refs.examFeedback.textContent =
      '數值大小接近，但方向錯了。題目已說明取向右為正；向左的速度要加負號。';
  } else {
    refs.examFeedback.textContent =
      '尚未完全正確。先檢查：正方向、總動量、單位，以及是否有把動能守恆錯用在非彈性碰撞。';
  }
  localizeDom();
}

function toggleExamSolution() {
  const question = state.exam.question;
  if (!question) return;

  if (state.exam.solutionOpen) {
    state.exam.solutionOpen = false;
    refs.examSolution.hidden = true;
    refs.examSolutionBtn.textContent = '顯示解法';
    localizeDom();
    return;
  }

  state.exam.solutionOpen = true;
  refs.examSolution.hidden = false;
  refs.examSolution.replaceChildren();

  const title = document.createElement('h3');
  title.textContent = '解題步驟（marking scheme）';
  const list = document.createElement('ol');
  for (const step of question.steps) {
    const item = document.createElement('li');
    item.textContent = step;
    list.append(item);
  }
  const tip = document.createElement('p');
  tip.className = 'exam-tip-line';
  tip.textContent = `考試提示：${question.tip}`;
  refs.examSolution.append(title, list, tip);
  refs.examSolutionBtn.textContent = '收起解法';
  localizeDom();
}

function showExamHint() {
  const question = state.exam.question;
  if (!question) return;
  refs.examFeedback.className = 'exam-feedback';
  refs.examFeedback.textContent = `提示：${question.steps[0]}`;
  localizeDom();
}

/* ---------- Three.js ---------- */

function createLabelTexture(text, color = '#e9f8ff') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = '600 34px "Microsoft JhengHei", sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = color;
  context.shadowColor = color;
  context.shadowBlur = 12;
  context.fillText(text, 256, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createCart(color) {
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.14,
    metalness: 0.55,
    roughness: 0.3,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.46, 0.76), bodyMaterial);
  body.position.y = 0.38;
  group.add(body);

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(body.geometry),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 }),
  );
  edges.position.copy(body.position);
  group.add(edges);

  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.11, 0.03, 20),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 }),
  );
  core.position.set(0, 0.63, 0);
  group.add(core);

  const wheelMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a141b,
    metalness: 0.5,
    roughness: 0.65,
  });
  const wheelGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16);
  for (const x of [-0.32, 0.32]) {
    for (const z of [-0.39, 0.39]) {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, 0.12, z);
      group.add(wheel);
    }
  }

  const label = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createLabelTexture('m = 2.0 kg', '#e9f8ff'),
      transparent: true,
      depthTest: false,
    }),
  );
  label.position.set(0, 1.22, 0);
  label.scale.set(2.4, 0.6, 1);
  label.renderOrder = 10;
  group.add(label);

  group.userData = { body, bodyMaterial, edges, label, core };
  return group;
}

function setupScene() {
  try {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02060c, 0.035);

    camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 4.8, 11);
    camera.lookAt(0, 0.45, 0);

    renderer = new THREE.WebGLRenderer({
      canvas: refs.scene,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    scene.add(new THREE.HemisphereLight(0x8bdfff, 0x03070c, 0.6));
    const directional = new THREE.DirectionalLight(0xffffff, 1.05);
    directional.position.set(5, 9, 7);
    scene.add(directional);
    const accentLight = new THREE.PointLight(0x5ff3ff, 5, 18);
    accentLight.position.set(-4, 3, 4);
    scene.add(accentLight);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 7.5),
      new THREE.MeshStandardMaterial({
        color: COLORS.floor,
        metalness: 0.25,
        roughness: 0.85,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    scene.add(floor);

    const grid = new THREE.GridHelper(16, 32, 0x1a4a5c, 0x0a1a24);
    grid.position.y = 0.005;
    grid.material.transparent = true;
    grid.material.opacity = 0.45;
    scene.add(grid);

    const railMaterial = new THREE.MeshStandardMaterial({
      color: 0x0b3442,
      emissive: 0x2bd3e5,
      emissiveIntensity: 0.7,
      metalness: 0.5,
      roughness: 0.35,
    });
    for (const z of [-0.52, 0.52]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(14, 0.035, 0.05), railMaterial);
      rail.position.set(0, 0.06, z);
      scene.add(rail);
    }

    const sleeperMaterial = new THREE.MeshStandardMaterial({
      color: 0x07151d,
      metalness: 0.2,
      roughness: 0.9,
    });
    for (let i = -7; i <= 7; i += 0.7) {
      const sleeper = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.022, 1.16), sleeperMaterial);
      sleeper.position.set(i, 0.025, 0);
      scene.add(sleeper);
    }

    for (const x of [-5, -3, -1, 1, 3, 5]) {
      const marker = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.012, 0.18),
        new THREE.MeshBasicMaterial({ color: 0x2c7b8c }),
      );
      marker.position.set(x, 0.03, 1.05);
      scene.add(marker);
    }

    const starGeometry = new THREE.BufferGeometry();
    const starPositions = [];
    for (let i = 0; i < 180; i += 1) {
      starPositions.push(
        (Math.random() - 0.5) * 24,
        1 + Math.random() * 8,
        -4 - Math.random() * 10,
      );
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({
        color: 0x9beaff,
        size: 0.035,
        transparent: true,
        opacity: 0.65,
        sizeAttenuation: true,
      }),
    );
    scene.add(stars);

    const halo = new THREE.Group();
    for (const [radius, opacity] of [[2.1, 0.22], [2.8, 0.1], [3.5, 0.055]]) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(radius, radius + 0.012, 96),
        new THREE.MeshBasicMaterial({
          color: 0x5fd8e8,
          transparent: true,
          opacity,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      ring.position.set(0, 3.2, -4.2);
      halo.add(ring);
    }
    const haloCore = new THREE.Mesh(
      new THREE.CircleGeometry(0.09, 24),
      new THREE.MeshBasicMaterial({ color: 0xbffaff, transparent: true, opacity: 0.75 }),
    );
    haloCore.position.set(0, 3.2, -4.18);
    halo.add(haloCore);
    const haloBeam = new THREE.Mesh(
      new THREE.PlaneGeometry(0.012, 2.8),
      new THREE.MeshBasicMaterial({
        color: 0x5fd8e8,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    haloBeam.position.set(0, 1.8, -4.2);
    halo.add(haloBeam);
    scene.add(halo);

    cartA = createCart(COLORS.a);
    cartB = createCart(0xff9b6a);
    scene.add(cartA, cartB);

    arrowA = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1.1, 0), 1, COLORS.a, 0.16, 0.09);
    arrowB = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1.1, 0), 1, 0xff9b6a, 0.16, 0.09);
    scene.add(arrowA, arrowB);

    comMarker = new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.014, 8, 32),
      new THREE.MeshBasicMaterial({ color: 0xd8f7ff, transparent: true, opacity: 0.7 }),
    );
    comMarker.rotation.x = -Math.PI / 2;
    comMarker.position.y = 0.02;
    scene.add(comMarker);

    flashLight = new THREE.PointLight(0xffffff, 0, 10);
    flashLight.position.set(0, 1, 0);
    scene.add(flashLight);

    flashRing = new THREE.Mesh(
      new THREE.RingGeometry(0.22, 0.27, 40),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      }),
    );
    flashRing.rotation.x = -Math.PI / 2;
    flashRing.position.y = 0.03;
    scene.add(flashRing);

    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(90 * 3);
    particlePositions.fill(999);
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        color: 0xffcf8a,
        size: 0.07,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    scene.add(particles);

    resizeObserver = new ResizeObserver(resizeScene);
    resizeObserver.observe(refs.stage);
    resizeScene();
    sceneReady = true;
    updateVisuals();
    requestAnimationFrame(animate);
  } catch (error) {
    sceneReady = false;
    refs.stageHint.textContent = '此瀏覽器未能啟動 WebGL；請改用支援 WebGL 的瀏覽器。';
    console.error(error);
  }
}

function resizeScene() {
  if (!sceneReady) return;
  const width = refs.stage.clientWidth;
  const height = refs.stage.clientHeight;
  if (!width || !height) return;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.fov = width < 760 ? 45 : 40;
  camera.position.set(0, width < 760 ? 4.1 : 4.8, width < 760 ? 8.8 : 10.8);
  camera.lookAt(0, 0.45, 0);
  camera.updateProjectionMatrix();
}

function updateCartLabels() {
  if (!sceneReady || !cartA || !cartB) return;
  const textA = `A · ${fmt(state.inputs.m1, 1)} kg`;
  const textB = `B · ${fmt(state.inputs.m2, 1)} kg`;

  if (cartA.userData.label.material.map) cartA.userData.label.material.map.dispose();
  cartA.userData.label.material.map = createLabelTexture(textA, '#bffaff');
  cartA.userData.label.material.needsUpdate = true;

  if (cartB.userData.label.material.map) cartB.userData.label.material.map.dispose();
  cartB.userData.label.material.map = createLabelTexture(textB, '#ffd6a8');
  cartB.userData.label.material.needsUpdate = true;
}

function applySceneTheme(accent) {
  if (!sceneReady) return;
  const color = new THREE.Color(accent);
  cartB.userData.bodyMaterial.color.copy(color);
  cartB.userData.bodyMaterial.emissive.copy(color);
  cartB.userData.edges.material.color.copy(color);
  cartB.userData.core.material.color.copy(color);
  arrowB.setColor(color);
  particles.material.color.set(accent);
  flashLight.color.set(accent);
  flashRing.material.color.set(accent);
}

function setArrow(arrow, velocity, x) {
  if (!arrow) return;
  const magnitude = Math.abs(velocity);
  if (magnitude < 0.04) {
    arrow.visible = false;
    return;
  }
  arrow.visible = true;
  arrow.position.set(x, 1.02, 0);
  arrow.setDirection(new THREE.Vector3(Math.sign(velocity), 0, 0));
  arrow.setLength(clamp(0.35 + magnitude * 0.22, 0.4, 2.3), 0.15, 0.075);
}

function updateVisuals() {
  if (!sceneReady) return;
  cartA.position.x = state.x1;
  cartB.position.x = state.x2;
  setArrow(arrowA, state.v1, state.x1);
  setArrow(arrowB, state.v2, state.x2);

  const com = comPosition({
    m1: state.inputs.m1,
    m2: state.inputs.m2,
    x1: state.x1,
    x2: state.x2,
  });
  comMarker.position.x = com;
  comMarker.visible = Math.abs(state.x1 - state.x2) > 0.1;

  if (flashAge < 1) {
    flashAge = Math.min(1, flashAge + 0.04);
    const opacity = Math.max(0, 1 - flashAge);
    flashRing.material.opacity = opacity * 0.9;
    flashRing.scale.setScalar(0.7 + flashAge * 2.8);
    flashLight.intensity = opacity * 2.4;
  } else {
    flashRing.material.opacity = 0;
    flashLight.intensity = 0;
  }

  if (particleAge < 1.1) {
    particleAge += 0.025;
    const positions = particles.geometry.attributes.position.array;
    for (let i = 0; i < particleVelocities.length; i += 1) {
      positions[i * 3] += particleVelocities[i].x * 0.016;
      positions[i * 3 + 1] += particleVelocities[i].y * 0.016;
      positions[i * 3 + 2] += particleVelocities[i].z * 0.016;
      particleVelocities[i].y -= 0.035;
    }
    particles.geometry.attributes.position.needsUpdate = true;
    particles.material.opacity = Math.max(0, 1 - particleAge / 1.1);
  } else {
    particles.material.opacity = 0;
  }
}

function flash(x) {
  flashAge = 0;
  flashRing.position.x = x;
  flashLight.position.x = x;
}

function resetEffects() {
  flashAge = 1;
  particleAge = 1.1;
  if (flashRing) flashRing.material.opacity = 0;
  if (flashLight) flashLight.intensity = 0;
  if (particles) particles.material.opacity = 0;
}

function burstParticles(x) {
  if (!particles) return;
  const positions = particles.geometry.attributes.position.array;
  particleVelocities = [];
  for (let i = 0; i < 90; i += 1) {
    positions[i * 3] = x + (Math.random() - 0.5) * 0.2;
    positions[i * 3 + 1] = 0.45 + Math.random() * 0.2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 2.5;
    particleVelocities.push(
      new THREE.Vector3(Math.cos(angle) * speed, Math.sin(angle) * speed * 0.6 + 0.7, 0),
    );
  }
  particles.geometry.attributes.position.needsUpdate = true;
  particleAge = 0;
  particles.material.opacity = 0.8;
}

function animate(now) {
  const delta = Math.min((now - lastFrame) / 1000, 0.05);
  lastFrame = now;

  if (state.phase === 'running') {
    accumulator += delta;
    const fixed = 1 / 120;
    let guard = 0;
    while (accumulator >= fixed && guard < 8) {
      updateSimulation(fixed);
      accumulator -= fixed;
      guard += 1;
    }
  } else {
    accumulator = 0;
  }

  updateVisuals();
  if (renderer && scene && camera) renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

/* ---------- bindings / init ---------- */

function bindEvents() {
  for (const input of [refs.m1, refs.m2, refs.u1, refs.u2, refs.e, refs.energy]) {
    input.addEventListener('input', onInputChange);
  }

  refs.runBtn.addEventListener('click', runSimulation);
  refs.resetBtn.addEventListener('click', () => {
    readInputs();
    resetSimulation();
    state.revealed = false;
    updateAll();
  });

  refs.derivationBtn.addEventListener('click', () => {
    const open = !refs.derivationBlock.hidden;
    refs.derivationBlock.hidden = open;
    refs.derivationBtn.textContent = open ? '顯示推導' : '收起推導';
  });

  refs.examBtn.addEventListener('click', openExam);
  refs.examClose.addEventListener('click', closeExam);
  refs.examModal.addEventListener('click', (event) => {
    if (event.target === refs.examModal) closeExam();
  });
  refs.examCheck.addEventListener('click', checkExam);
  refs.examHint.addEventListener('click', showExamHint);
  refs.examSolutionBtn.addEventListener('click', toggleExamSolution);
  refs.examNext.addEventListener('click', () => newExamQuestion(state.exam.type));

  refs.guideBtn.addEventListener('click', () => {
    refs.guideModal.hidden = false;
  });
  refs.guideClose.addEventListener('click', () => {
    refs.guideModal.hidden = true;
  });
  refs.guideStart.addEventListener('click', () => {
    refs.guideModal.hidden = true;
    refs.m1.focus({ preventScroll: true });
  });
  refs.guideModal.addEventListener('click', (event) => {
    if (event.target === refs.guideModal) refs.guideModal.hidden = true;
  });

  refs.adjustBtn.addEventListener('click', openControls);
  refs.closeControls.addEventListener('click', closeControls);
  refs.sheetDone.addEventListener('click', closeControls);
  refs.scrim.addEventListener('click', closeControls);
  refs.labNav.addEventListener('click', () => setView('lab'));
  refs.analysisNav.addEventListener('click', () => setView('analysis'));
  refs.examNav.addEventListener('click', openExam);

  window.addEventListener('resize', () => {
    if (isWideLayout()) closeControls();
    setView(state.view);
    resizeScene();
  });

  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!refs.examModal.hidden) {
      closeExam();
      return;
    }
    if (!refs.guideModal.hidden) {
      refs.guideModal.hidden = true;
      return;
    }
    if (refs.setupPanel.classList.contains('is-open')) {
      closeControls();
      return;
    }
    if (!isWideLayout() && state.view === 'analysis') setView('lab');
  });
}

function setupPWA() {
  if (isEmbedded) return;
  if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {
        // Offline caching is optional; the game still works online.
      });
    });
  }
}

function init() {
  document.body.classList.toggle('is-embed', isEmbedded);
  initLanguage();
  createScenarioTabs();
  setupExamTypes();
  bindEvents();
  setScenario('perfectly-inelastic');
  setupScene();
  syncInputLabels();
  applySceneTheme(scenarioFor(state.scenario).accent);
  setView('lab');
  setupPWA();

  window.__MOMENTUM__ = {
    getState: () => ({
      scenario: state.scenario,
      phase: state.phase,
      inputs: { ...state.inputs },
      result: state.result ? { ...state.result } : null,
      completed: [...state.completedScenarios],
      language: document.documentElement.lang,
    }),
    getExamQuestion: () => state.exam.question,
    setScenario,
  };
}

init();
