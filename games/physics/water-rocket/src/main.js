import * as THREE from '../vendor/three.module.js';
import { simulate, landingError, hitTest, G } from './physics.js';
import { MISSIONS, missionAt } from './missions.js';

const $ = (selector) => document.querySelector(selector);
const DEG = Math.PI / 180;
const MAX_SCORE = 500;
const MAX_ATTEMPTS = 3;

const state = {
  missionIndex: 0,
  mission: missionAt(0),
  inputs: { ...missionAt(0).defaults },
  prediction: null,
  predictionLocked: false,
  phase: 'aim',
  attempts: 0,
  bestMission: 0,
  finalizedTotal: 0,
  lastSim: null,
  lastShot: null,
  launchStart: 0,
  finishedShot: false,
};

/* -------------------------------------------------------------------------- */
/* 3D scene                                                                    */
/* -------------------------------------------------------------------------- */

const canvas = $('#scene');
const sceneWrap = $('#sceneWrap');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07151d);
scene.fog = new THREE.Fog(0x07151d, 150, 420);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 800);
const hemi = new THREE.HemisphereLight(0x9aefff, 0x071014, 1.8);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0x9cefff, 2.4);
sun.position.set(-35, 65, 45);
scene.add(sun);
const amberLight = new THREE.PointLight(0xffb21c, 18, 40, 2);
amberLight.position.set(0, 5, 0);
scene.add(amberLight);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(320, 170),
  new THREE.MeshStandardMaterial({ color: 0x0a222b, roughness: 0.88, metalness: 0.12 }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
scene.add(ground);

const grid = new THREE.GridHelper(320, 64, 0x2a7a88, 0x17444f);
grid.position.y = 0.012;
grid.material.transparent = true;
grid.material.opacity = 0.56;
scene.add(grid);

/* A few distant stars keep the scene from feeling like a flat plane. */
const starPositions = [];
for (let i = 0; i < 260; i += 1) {
  starPositions.push(
    (Math.random() - 0.2) * 340,
    8 + Math.random() * 85,
    -80 - Math.random() * 120,
  );
}
const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
const stars = new THREE.Points(
  starGeometry,
  new THREE.PointsMaterial({ color: 0xc9f8ff, size: 0.62, transparent: true, opacity: 0.72, sizeAttenuation: true }),
);
scene.add(stars);

const pad = new THREE.Group();
const padBase = new THREE.Mesh(
  new THREE.CylinderGeometry(1.45, 1.65, 0.18, 32),
  new THREE.MeshStandardMaterial({ color: 0x0b232b, roughness: 0.45, metalness: 0.65 }),
);
padBase.position.set(0, 0.09, 0);
pad.add(padBase);
const padRing = new THREE.Mesh(
  new THREE.TorusGeometry(1.28, 0.045, 8, 32),
  new THREE.MeshBasicMaterial({ color: 0x5ff3ff }),
);
padRing.rotation.x = Math.PI / 2;
padRing.position.y = 0.19;
pad.add(padRing);
const padStripe = new THREE.Mesh(
  new THREE.BoxGeometry(2.4, 0.025, 0.1),
  new THREE.MeshBasicMaterial({ color: 0xffb21c }),
);
padStripe.position.set(0, 0.2, 0);
pad.add(padStripe);
scene.add(pad);

const target = new THREE.Group();
const ringMaterials = [
  new THREE.MeshBasicMaterial({ color: 0xffb21c, transparent: true, opacity: 0.95, side: THREE.DoubleSide }),
  new THREE.MeshBasicMaterial({ color: 0x66f6a5, transparent: true, opacity: 0.7, side: THREE.DoubleSide }),
  new THREE.MeshBasicMaterial({ color: 0x5ff3ff, transparent: true, opacity: 0.42, side: THREE.DoubleSide }),
];
for (let i = 0; i < 3; i += 1) {
  const inner = 3.65 - i * 1.2;
  const ring = new THREE.Mesh(new THREE.RingGeometry(inner, inner + 0.28, 64), ringMaterials[i]);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.035 + i * 0.002;
  target.add(ring);
}
const targetDisc = new THREE.Mesh(
  new THREE.CircleGeometry(0.46, 32),
  new THREE.MeshBasicMaterial({ color: 0xffb21c }),
);
targetDisc.rotation.x = -Math.PI / 2;
targetDisc.position.y = 0.045;
target.add(targetDisc);
const targetBeacon = new THREE.Mesh(
  new THREE.CylinderGeometry(0.04, 0.04, 10, 8),
  new THREE.MeshBasicMaterial({ color: 0x66f6a5, transparent: true, opacity: 0.5 }),
);
targetBeacon.position.set(0, 5, 0);
target.add(targetBeacon);
const targetGate = new THREE.Mesh(
  new THREE.TorusGeometry(3.5, 0.09, 8, 64),
  new THREE.MeshBasicMaterial({ color: 0xffb21c, transparent: true, opacity: 0.7 }),
);
targetGate.position.set(0, 3.5, 0);
target.add(targetGate);
const targetGateInner = new THREE.Mesh(
  new THREE.TorusGeometry(2.15, 0.045, 8, 64),
  new THREE.MeshBasicMaterial({ color: 0x66f6a5, transparent: true, opacity: 0.42 }),
);
targetGateInner.position.set(0, 3.5, 0);
target.add(targetGateInner);
scene.add(target);

const rocket = new THREE.Group();
rocket.scale.setScalar(4.1);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0xdffbff, roughness: 0.35, metalness: 0.4 });
const darkMat = new THREE.MeshStandardMaterial({ color: 0x153b46, roughness: 0.5, metalness: 0.5 });
const amberMat = new THREE.MeshStandardMaterial({ color: 0xffb21c, roughness: 0.4, metalness: 0.25 });
const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.21, 1.45, 18), bodyMat);
body.position.y = 0.85;
rocket.add(body);
const belly = new THREE.Mesh(new THREE.CylinderGeometry(0.181, 0.215, 0.18, 18), new THREE.MeshBasicMaterial({ color: 0xffb21c }));
belly.position.y = 0.4;
rocket.add(belly);
const nose = new THREE.Mesh(new THREE.ConeGeometry(0.205, 0.5, 18), darkMat);
nose.position.y = 1.82;
rocket.add(nose);
const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.17, 0.18, 12), amberMat);
nozzle.position.y = 0.1;
rocket.add(nozzle);
for (let i = 0; i < 3; i += 1) {
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.4, 0.34), amberMat);
  const angle = (i / 3) * Math.PI * 2;
  fin.position.set(Math.cos(angle) * 0.25, 0.28, Math.sin(angle) * 0.25);
  fin.rotation.y = -angle;
  rocket.add(fin);
}
const flame = new THREE.Mesh(
  new THREE.ConeGeometry(0.13, 0.7, 12),
  new THREE.MeshBasicMaterial({ color: 0xffb21c, transparent: true, opacity: 0.9 }),
);
flame.rotation.x = Math.PI;
flame.position.y = -0.26;
flame.visible = false;
rocket.add(flame);
scene.add(rocket);

const trailPositions = new Float32Array(1400 * 3);
const trailGeometry = new THREE.BufferGeometry();
trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
trailGeometry.setDrawRange(0, 0);
const trail = new THREE.Line(
  trailGeometry,
  new THREE.LineBasicMaterial({ color: 0x5ff3ff, transparent: true, opacity: 0.92 }),
);
scene.add(trail);

const impact = new THREE.Mesh(
  new THREE.RingGeometry(0.15, 0.5, 40),
  new THREE.MeshBasicMaterial({ color: 0xffb21c, transparent: true, opacity: 0.9, side: THREE.DoubleSide }),
);
impact.rotation.x = -Math.PI / 2;
impact.position.y = 0.04;
impact.visible = false;
scene.add(impact);

const windArrows = new THREE.Group();
scene.add(windArrows);

const rangeMarks = new THREE.Group();
for (let distance = 20; distance <= 120; distance += 20) {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(distance, 0.018, -12),
    new THREE.Vector3(distance, 0.018, 12),
  ]);
  const mark = new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({ color: 0x2d7f8c, transparent: true, opacity: 0.44 }),
  );
  rangeMarks.add(mark);
}
scene.add(rangeMarks);

function resizeScene() {
  const width = Math.max(1, sceneWrap.clientWidth);
  const height = Math.max(1, sceneWrap.clientHeight);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  fitCamera(state.mission);
}

function fitCamera(mission) {
  const aspect = Math.max(0.45, camera.aspect || 1);
  const halfFov = Math.tan((camera.fov * DEG) / 2);
  const range = Math.max(30, mission.target);
  const distanceForWidth = (range * 0.68) / (halfFov * aspect);
  const distanceForHeight = Math.max(20, range * 0.42) / halfFov;
  const distance = Math.max(48, distanceForWidth * 0.84, distanceForHeight * 0.84);
  camera.position.set(range * 0.5, Math.max(9, range * 0.085), distance);
  camera.lookAt(range * 0.5, Math.max(3.2, range * 0.035), 0);
  camera.updateProjectionMatrix();
}

function resetScene() {
  rocket.position.set(0, 0.55, 0);
  rocket.rotation.z = -state.inputs.angle * DEG;
  flame.visible = false;
  trailGeometry.setDrawRange(0, 0);
  impact.visible = false;
}

function updateSceneForMission(mission) {
  target.position.x = mission.target;
  target.scale.setScalar(mission.radius / 4);
  resetScene();
  windArrows.clear();
  if (mission.wind > 0) {
    for (let i = 0; i < 3; i += 1) {
      const arrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(mission.target * (0.22 + i * 0.2), 5 + i * 2.6, -2),
        Math.min(12, Math.max(3, mission.wind * 1.4)),
        0xffb21c,
        1.2,
        0.55,
      );
      windArrows.add(arrow);
    }
  }
  amberLight.position.set(mission.target * 0.35, 5, 0);
  fitCamera(mission);
}

function setTrail(upTo) {
  const points = state.lastSim?.points || [];
  const count = Math.min(points.length, upTo + 1, 1400);
  for (let i = 0; i < count; i += 1) {
    trailPositions[i * 3] = points[i].x;
    trailPositions[i * 3 + 1] = Math.max(0.04, points[i].y);
    trailPositions[i * 3 + 2] = 0;
  }
  trailGeometry.attributes.position.needsUpdate = true;
  trailGeometry.setDrawRange(0, count);
}

/* -------------------------------------------------------------------------- */
/* Simulation animation                                                        */
/* -------------------------------------------------------------------------- */

function updateFlight(now) {
  if (!state.lastSim || state.phase !== 'flying') return;
  const elapsed = (now - state.launchStart) / 1000;
  const points = state.lastSim.points;
  let index = 0;
  while (index + 1 < points.length && points[index + 1].t <= elapsed) index += 1;
  const point = points[index];
  rocket.position.set(point.x, Math.max(0.55, point.y), 0);
  rocket.rotation.z = -state.inputs.angle * DEG;
  flame.visible = state.mission.mode === 'water' && elapsed < state.lastSim.thrustTime;
  setTrail(index);

  const status = $('#statusText');
  if (state.mission.mode === 'water' && elapsed < state.lastSim.thrustTime) {
    status.textContent = 'THRUST / 推力段';
    $('#phaseChip').textContent = 'THRUST';
  } else {
    status.textContent = 'COAST / 滑翔段';
    $('#phaseChip').textContent = 'COAST';
  }

  if (elapsed >= state.lastSim.flight + 0.35 && !state.finishedShot) {
    state.finishedShot = true;
    impact.position.set(state.lastSim.range, 0.04, 0);
    impact.visible = true;
    showResult();
  }
}

function animate(now) {
  if (state.phase === 'flying') updateFlight(now);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

/* -------------------------------------------------------------------------- */
/* Game flow                                                                   */
/* -------------------------------------------------------------------------- */

function currentTotal() {
  return Math.min(MAX_SCORE, Math.round(state.finalizedTotal + state.bestMission));
}

function reportScore() {
  if (window.parent === window) return;
  window.parent.postMessage({ type: 'game-score', score: currentTotal() }, location.origin);
}

function setPrediction(index) {
  if (state.phase !== 'aim' || state.predictionLocked) return;
  state.prediction = index;
  renderPrediction();
  updateLaunchButton();
}

function launch() {
  if (state.phase !== 'aim') return;
  if (state.prediction === null) {
    toast('先选一个预测，才能发射。');
    return;
  }

  state.attempts += 1;
  state.predictionLocked = true;
  state.lastSim = simulate(state.mission, state.inputs);
  state.lastShot = null;
  state.phase = 'flying';
  state.launchStart = performance.now();
  state.finishedShot = false;

  resetScene();
  setTrail(0);
  updateAll();
  $('#phaseChip').textContent = 'THRUST';
  $('#statusText').textContent = 'LAUNCH / 发射';
}

function scoreShot(sim) {
  const mission = state.mission;
  const error = landingError(sim.range, mission.target);
  const hit = hitTest(sim.range, mission.target, mission.radius);
  const away = Math.min(1, Math.abs(error) / mission.radius);
  const accuracy = hit ? Math.round(60 * (1 - 0.5 * away)) : 0;
  const predictionCorrect = state.prediction === mission.prediction.correct;
  const prediction = predictionCorrect ? 20 : 0;
  const efficiency = hit ? Math.max(0, 20 - 5 * (state.attempts - 1)) : 0;
  const shotScore = accuracy + prediction + efficiency;
  state.bestMission = Math.max(state.bestMission, shotScore);
  return {
    error,
    hit,
    accuracy,
    prediction,
    efficiency,
    shotScore,
    predictionCorrect,
    missionBest: state.bestMission,
    total: currentTotal(),
  };
}

function showResult() {
  state.phase = 'result';
  const mission = state.mission;
  const sim = state.lastSim;
  state.lastShot = scoreShot(sim);
  const shot = state.lastShot;
  const canRetry = !shot.hit && state.attempts < MAX_ATTEMPTS;
  const title = shot.hit ? '精准命中' : '偏离目标';
  const summary = shot.hit
    ? `落点距离目标中心 ${Math.abs(shot.error).toFixed(1)} m，在 ±${mission.radius} m 的目标区內。`
    : `落点${shot.error > 0 ? '超过' : '不足'}目标中心 ${Math.abs(shot.error).toFixed(1)} m；目标区半径 ${mission.radius} m。`;

  $('#resultEyebrow').textContent = `SHOT ${state.attempts} / ${MAX_ATTEMPTS}`;
  $('#resultBadge').textContent = shot.hit ? 'HIT' : 'MISS';
  $('#resultBadge').className = `result-badge${shot.hit ? ' is-good' : ''}`;
  $('#resultTitle').textContent = title;
  $('#resultSummary').textContent = summary;
  $('#resultRange').textContent = `${sim.range.toFixed(1)} m`;
  $('#resultTarget').textContent = `${mission.target.toFixed(1)} m`;
  $('#resultError').textContent = `${shot.error >= 0 ? '+' : ''}${shot.error.toFixed(1)} m`;
  $('#resultApex').textContent = `${sim.apex.toFixed(1)} m`;
  $('#resultTime').textContent = `${sim.flight.toFixed(2)} s`;
  $('#scoreAccuracy').textContent = shot.accuracy;
  $('#scorePrediction').textContent = shot.prediction;
  $('#scoreEfficiency').textContent = shot.efficiency;
  $('#scoreMission').textContent = state.bestMission;
  $('#resultExplanation').textContent = shot.predictionCorrect
    ? `预测正确。${mission.prediction.explanation} ${mission.debrief[0]}`
    : `预测未中。${mission.prediction.explanation}`;

  renderPrediction();
  $('#retryBtn').hidden = !canRetry;
  $('#nextBtn').hidden = canRetry;
  $('#nextBtn span').textContent = mission.id === MISSIONS[MISSIONS.length - 1].id ? '查看总结' : '下一关';
  $('#resultOverlay').hidden = false;
  updateAll();
  reportScore();
  requestAnimationFrame(() => drawChart(sim, mission));
}

function retry() {
  if (state.phase !== 'result') return;
  $('#resultOverlay').hidden = true;
  state.phase = 'aim';
  state.lastSim = null;
  state.finishedShot = false;
  impact.visible = false;
  resetScene();
  updateAll();
}

function advance() {
  if (state.phase !== 'result') return;
  state.finalizedTotal += state.bestMission;
  state.bestMission = 0;
  if (state.missionIndex >= MISSIONS.length - 1) {
    showFinal();
    return;
  }
  state.missionIndex += 1;
  loadMission(state.missionIndex);
}

function showFinal() {
  state.phase = 'final';
  reportScore();
  const total = currentTotal();
  $('#finalScore').textContent = String(total).padStart(3, '0');
  $('#finalSummary').textContent = total >= 450
    ? '你已經能把角度、分量、水量與風阻放在同一個模型裡思考。'
    : total >= 300
      ? '主要概念已經掌握；再回頭比較理想軌跡與水火箭軌跡，會更清楚差異。'
      : '先從角度與分量重新觀察，再挑戰水量與風阻關卡。';
  $('#finalOverlay').hidden = false;
  $('#resultOverlay').hidden = true;
}

function loadMission(index) {
  state.missionIndex = Math.max(0, Math.min(MISSIONS.length - 1, index));
  state.mission = missionAt(state.missionIndex);
  state.inputs = { ...state.mission.defaults };
  state.prediction = null;
  state.predictionLocked = false;
  state.phase = 'aim';
  state.attempts = 0;
  state.bestMission = 0;
  state.lastSim = null;
  state.lastShot = null;
  state.finishedShot = false;
  $('#resultOverlay').hidden = true;
  $('#finalOverlay').hidden = true;
  setControlsFromInputs();
  updateSceneForMission(state.mission);
  renderPrediction();
  updateAll();
}

function restart() {
  state.finalizedTotal = 0;
  state.missionIndex = 0;
  state.bestMission = 0;
  loadMission(0);
  toast('任务重新开始。');
}

/* -------------------------------------------------------------------------- */
/* UI                                                                          */
/* -------------------------------------------------------------------------- */

function updateAll() {
  const mission = state.mission;
  const total = currentTotal();
  $('#missionCounter').textContent = `MISSION ${String(state.missionIndex + 1).padStart(2, '0')} / ${String(MISSIONS.length).padStart(2, '0')}`;
  $('#progressFill').style.width = `${((state.missionIndex + 1) / MISSIONS.length) * 100}%`;
  $('#scoreValue').textContent = String(total).padStart(3, '0');
  $('#missionMode').textContent = mission.mode === 'ideal' ? 'IDEAL PROJECTILE' : 'WATER ROCKET';
  $('#controlMode').textContent = mission.mode === 'ideal' ? '理想抛体' : '水火箭';
  $('#missionTitle').textContent = mission.title;
  $('#missionSubtitle').textContent = mission.subtitle;
  $('#missionObjective').textContent = mission.objective;
  $('#conceptText').textContent = mission.concept;
  $('#formulaText').textContent = mission.formula;
  $('#hudTarget').textContent = `${mission.target.toFixed(1)} m`;
  $('#hudWind').textContent = `${mission.wind.toFixed(1)} m/s ${mission.wind > 0 ? '→' : ''}`;
  $('#attemptsValue').textContent = `${Math.max(0, MAX_ATTEMPTS - state.attempts)} 次`;
  $('#phaseChip').textContent = state.phase === 'aim' ? 'AIM' : state.phase === 'flying' ? 'FLIGHT' : 'RESULT';
  if (state.phase === 'aim') $('#statusText').textContent = '选择预测后发射';
  if (state.phase === 'final') $('#statusText').textContent = '任务完成';

  $('#predictionQuestion').textContent = mission.prediction.question;
  $('#predictionScore').textContent = state.prediction === mission.prediction.correct ? '+20 已取得' : '+20';
  renderPrediction();
  updateControlVisibility();
  updateControlValues();
  updateLaunchButton();
  updateReadouts();
  updatePredictionFeedback();
}

function renderPrediction() {
  const mission = state.mission;
  const box = $('#predictionOptions');
  box.innerHTML = '';
  mission.prediction.options.forEach((label, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'prediction-option';
    button.textContent = label;
    button.dataset.index = String(index);
    if (state.prediction === index) button.classList.add('is-selected');
    if (state.predictionLocked) {
      button.disabled = true;
      if (state.phase === 'result' || state.phase === 'final') {
        if (index === mission.prediction.correct) button.classList.add('is-correct');
        if (state.prediction === index && state.prediction !== mission.prediction.correct) {
          button.classList.add('is-wrong');
        }
      }
    } else if (state.phase !== 'aim') {
      button.disabled = true;
    }
    box.appendChild(button);
  });
}

function updatePredictionFeedback() {
  const el = $('#predictionFeedback');
  el.className = 'prediction-feedback';
  el.textContent = '';
  if (!state.predictionLocked || state.prediction === null) return;
  if (state.phase !== 'result' && state.phase !== 'final') return;
  const correct = state.prediction === state.mission.prediction.correct;
  el.textContent = correct
    ? `预测正确：${state.mission.prediction.explanation}`
    : `预测未中：${state.mission.prediction.explanation}`;
  el.classList.add(correct ? 'is-good' : 'is-bad');
  $('#predictionScore').textContent = correct ? '+20 已取得' : '+0';
}

function updateControlVisibility() {
  const controls = state.mission.controls;
  $('#angleControl').hidden = !controls.angle;
  $('#waterControl').hidden = !controls.water;
  $('#pressureControl').hidden = !controls.pressure;
}

function setControlsFromInputs() {
  $('#angleInput').value = String(state.inputs.angle);
  $('#waterInput').value = String(state.inputs.water);
  $('#pressureInput').value = String(state.inputs.pressure);
}

function updateControlValues() {
  $('#angleValue').textContent = `${state.inputs.angle}°`;
  $('#waterValue').textContent = `${state.inputs.water}%`;
  $('#pressureValue').textContent = `${state.inputs.pressure.toFixed(1)} bar`;
  const locked = state.phase !== 'aim';
  for (const input of document.querySelectorAll('.control input[type="range"]')) {
    input.disabled = locked;
  }
  rocket.rotation.z = -state.inputs.angle * DEG;
}

function updateLaunchButton() {
  const button = $('#launchBtn');
  const label = button.querySelector('span');
  if (state.phase === 'flying') {
    button.disabled = true;
    label.textContent = '飞行中';
  } else if (state.phase !== 'aim') {
    button.disabled = true;
    label.textContent = '查看结果';
  } else if (state.prediction === null) {
    button.disabled = true;
    label.textContent = '先选预测';
  } else {
    button.disabled = false;
    label.textContent = '执行发射';
  }
  $('#controlNote').textContent = state.predictionLocked
    ? '预测已锁定；可以调整参数后重试。'
    : state.prediction === null
      ? '先选一个预测，才能发射。'
      : '预测已选择；按下发射开始模拟。';
}

function updateReadouts() {
  const angle = state.inputs.angle * DEG;
  if (state.mission.mode === 'ideal') {
    const v0 = state.mission.v0;
    const vx = v0 * Math.cos(angle);
    const vy = v0 * Math.sin(angle);
    const apex = (vy * vy) / (2 * G);
    $('#readoutALabel').textContent = '初速度 V0';
    $('#readoutA').textContent = `${v0.toFixed(1)} m/s`;
    $('#readoutB').textContent = `${vx.toFixed(1)} m/s`;
    $('#readoutC').textContent = `${vy.toFixed(1)} m/s`;
    $('#readoutDLabel').textContent = '最高点 H';
    $('#readoutD').textContent = `${apex.toFixed(1)} m`;
  } else {
    const mass = 0.35 + (state.inputs.water / 100) * 2;
    $('#readoutALabel').textContent = '总质量';
    $('#readoutA').textContent = `${mass.toFixed(2)} kg`;
    $('#readoutB').textContent = `${state.inputs.pressure.toFixed(1)} bar`;
    $('#readoutC').textContent = `${state.inputs.water}%`;
    $('#readoutDLabel').textContent = '风';
    $('#readoutD').textContent = `${state.mission.wind.toFixed(1)} m/s`;
  }
}

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('is-visible');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('is-visible'), 1900);
}

/* -------------------------------------------------------------------------- */
/* Result chart                                                                */
/* -------------------------------------------------------------------------- */

function drawChart(sim, mission) {
  const chart = $('#resultChart');
  const rect = chart.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  chart.width = Math.max(180, Math.round(rect.width * dpr));
  chart.height = Math.max(80, Math.round(rect.height * dpr));
  const ctx = chart.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const width = chart.width / dpr;
  const height = chart.height / dpr;
  ctx.clearRect(0, 0, width, height);

  const pad = { left: 24, right: 8, top: 10, bottom: 17 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const maxX = Math.max(10, sim.range * 1.08, mission.target * 1.1);
  const maxY = Math.max(4, sim.apex * 1.18);

  ctx.fillStyle = '#041017';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = 'rgba(95,243,255,0.12)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = pad.top + (plotH * i) / 4;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(width - pad.right, y);
    ctx.stroke();
  }

  const xToPx = (x) => pad.left + (x / maxX) * plotW;
  const yToPx = (y) => pad.top + plotH - (y / maxY) * plotH;

  ctx.strokeStyle = '#ffb21c';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(xToPx(mission.target), pad.top);
  ctx.lineTo(xToPx(mission.target), pad.top + plotH);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = '#5ff3ff';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  sim.points.forEach((point, index) => {
    const x = xToPx(point.x);
    const y = yToPx(point.y);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = '#88a8b0';
  ctx.font = '7px Consolas, monospace';
  ctx.fillText('0', 4, pad.top + plotH);
  ctx.fillText(`${maxY.toFixed(0)}m`, 2, pad.top + 7);
  ctx.fillText(`${maxX.toFixed(0)}m`, width - 28, height - 3);
}

/* -------------------------------------------------------------------------- */
/* Events                                                                      */
/* -------------------------------------------------------------------------- */

$('#angleInput').addEventListener('input', (event) => {
  if (state.phase !== 'aim') return;
  state.inputs.angle = Number(event.target.value);
  updateControlValues();
  updateReadouts();
  rocket.rotation.z = -state.inputs.angle * DEG;
});

$('#waterInput').addEventListener('input', (event) => {
  if (state.phase !== 'aim') return;
  state.inputs.water = Number(event.target.value);
  updateControlValues();
  updateReadouts();
});

$('#pressureInput').addEventListener('input', (event) => {
  if (state.phase !== 'aim') return;
  state.inputs.pressure = Number(event.target.value);
  updateControlValues();
  updateReadouts();
});

$('#predictionOptions').addEventListener('click', (event) => {
  const button = event.target.closest('.prediction-option');
  if (!button) return;
  setPrediction(Number(button.dataset.index));
});

$('#launchBtn').addEventListener('click', launch);
$('#retryBtn').addEventListener('click', retry);
$('#nextBtn').addEventListener('click', advance);
$('#restartBtn').addEventListener('click', restart);
$('#finalRestart').addEventListener('click', restart);

new ResizeObserver(() => {
  resizeScene();
}).observe(sceneWrap);

window.addEventListener('resize', resizeScene);

/* Test/debug API. It is deliberately read-mostly; production UI still owns flow. */
window.__WATER_ROCKET__ = {
  getState: () => ({
    missionIndex: state.missionIndex,
    missionId: state.mission.id,
    mode: state.mission.mode,
    phase: state.phase,
    attempts: state.attempts,
    prediction: state.prediction,
    bestMission: state.bestMission,
    total: currentTotal(),
    inputs: { ...state.inputs },
    last: state.lastSim
      ? {
          range: Number(state.lastSim.range.toFixed(2)),
          apex: Number(state.lastSim.apex.toFixed(2)),
          flight: Number(state.lastSim.flight.toFixed(2)),
          thrustTime: Number(state.lastSim.thrustTime.toFixed(3)),
        }
      : null,
    lastShot: state.lastShot,
  }),
  setInputs: (patch) => {
    state.inputs = { ...state.inputs, ...patch };
    setControlsFromInputs();
    updateControlValues();
    updateReadouts();
  },
  selectPrediction: (index) => setPrediction(index),
  launch: () => launch(),
  retry: () => retry(),
  next: () => advance(),
  restart: () => restart(),
};

/* -------------------------------------------------------------------------- */
/* Boot                                                                        */
/* -------------------------------------------------------------------------- */

setControlsFromInputs();
updateSceneForMission(state.mission);
renderPrediction();
updateAll();
resizeScene();
requestAnimationFrame(animate);
