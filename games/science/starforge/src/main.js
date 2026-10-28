import * as THREE from 'three';
import {
  GHOST_FILL,
  GHOST_LINE,
  clamp,
  formatTime,
  glowTexture,
  highlight,
  disposeObject,
  SoundEngine,
} from './utils.js';
import { createWorld } from './world.js';
import { LEVELS } from './levels.js';

const $ = (id) => document.getElementById(id);

const refs = {
  boot: $('boot'),
  introOverlay: $('introOverlay'),
  completeOverlay: $('completeOverlay'),
  finaleOverlay: $('finaleOverlay'),
  finaleBar: $('finaleBar'),
  notebookModal: $('notebookModal'),
  iosChoice: $('iosChoice'),
  choiceOptions: $('choiceOptions'),
  choiceSteps: $('choiceSteps'),
  choiceInstall: $('choiceInstall'),
  choiceBrowser: $('choiceBrowser'),
  choiceClose: $('choiceClose'),
  choiceStepsBack: $('choiceStepsBack'),
  choiceBrowserFromSteps: $('choiceBrowserFromSteps'),
  choiceBrowserNote: $('choiceBrowserNote'),
  startBtn: $('startBtn'),
  introNotebookBtn: $('introNotebookBtn'),
  notebookBtn: $('notebookBtn'),
  finaleNotebookBtn: $('finaleNotebookBtn'),
  finaleNotebookBtn2: $('finaleNotebookBtn2'),
  closeNotebook: $('closeNotebook'),
  soundBtn: $('soundBtn'),
  progress: $('progress'),
  missionCard: $('missionCard'),
  levelNumber: $('levelNumber'),
  levelTag: $('levelTag'),
  targetBadge: $('targetBadge'),
  missionTitle: $('missionTitle'),
  missionObjective: $('missionObjective'),
  missionHint: $('missionHint'),
  meter: $('meter'),
  meterFill: $('meterFill'),
  meterValue: $('meterValue'),
  meterLabel: $('meterLabel'),
  meterFoot: $('meterFoot'),
  consoleTitle: $('consoleTitle'),
  sliders: $('sliders'),
  levelExtra: $('levelExtra'),
  missionExtra: $('missionExtra'),
  resetLevel: $('resetLevel'),
  codeDock: $('codeDock'),
  codeFile: $('codeFile'),
  codeBlock: $('codeBlock'),
  copyCode: $('copyCode'),
  closeCode: $('closeCode'),
  codeToggle: $('codeToggle'),
  codeBackdrop: $('codeBackdrop'),
  fullscreenBtn: $('fullscreenBtn'),
  installBtn: $('installBtn'),
  installIntroBtn: $('installIntroBtn'),
  orientationLock: $('orientationLock'),
  toast: $('toast'),
  completeEyebrow: $('completeEyebrow'),
  completeTitle: $('completeTitle'),
  completeSummary: $('completeSummary'),
  lessonTitle: $('lessonTitle'),
  lessonBody: $('lessonBody'),
  lessonCode: $('lessonCode'),
  lessonPoints: $('lessonPoints'),
  nextLevelBtn: $('nextLevelBtn'),
  nextHint: $('nextHint'),
  finaleTime: $('finaleTime'),
  exploreBtn: $('exploreBtn'),
  restartBtn: $('restartBtn'),
  finaleRestart: $('finaleRestart'),
};

const audio = new SoundEngine();
const game = {
  phase: 'intro',
  index: 0,
  restored: new Set(),
  values: {},
  controlMap: {},
  runtime: null,
  startedAt: 0,
  lastProgress: -1,
  lastFoot: '',
  completeTimer: null,
  finaleTimer: null,
  toastTimer: null,
  currentCode: '',
  flash: 0,
  bootHidden: false,
  lastFocused: null,
  deferredInstallPrompt: null,
  installAvailable: false,
  isStandalone: false,
};

try {
  const storedSound = localStorage.getItem('starforge.sound');
  if (storedSound === 'off') audio.enabled = false;
} catch (error) {
  // localStorage may be unavailable in private or file contexts.
}

let world;
try {
  world = createWorld();
} catch (error) {
  console.error('Unable to initialize WebGL scene:', error);
  showWebGLError();
}

let levelRoot = null;
let camTween = null;
const clock = new THREE.Clock();
const clockTime = { elapsed: 0 };
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const coarsePointer = window.matchMedia('(any-pointer: coarse)');
const isTouchDevice = coarsePointer.matches || navigator.maxTouchPoints > 1;
const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  window.matchMedia('(display-mode: fullscreen)').matches ||
  window.matchMedia('(display-mode: minimal-ui)').matches ||
  navigator.standalone === true;
/* FunLearning loads games with ?embed=1 inside a same-origin iframe.
   The host owns the page chrome, fullscreen and install flow. */
const isEmbedded =
  new URLSearchParams(window.location.search).get('embed') === '1' ||
  window.parent !== window;
const isIOS =
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = /Android/i.test(navigator.userAgent);
const isIOSSafari =
  isIOS && !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/i.test(navigator.userAgent);

function showWebGLError() {
  if (refs.boot) refs.boot.remove();
  const panel = document.createElement('div');
  panel.className = 'webgl-error';
  const title = document.createElement('strong');
  title.textContent = '無法啟動 3D 場景';
  const message = document.createElement('span');
  message.textContent = '這個遊戲需要支援 WebGL 的瀏覽器。請嘗試更新 Chrome、Edge 或 Safari，並確認硬體加速已開啟。';
  const wrap = document.createElement('div');
  wrap.append(title, message);
  panel.append(wrap);
  document.body.append(panel);
}

function setSoundUI() {
  if (!refs.soundBtn) return;
  refs.soundBtn.classList.toggle('is-muted', !audio.enabled);
  refs.soundBtn.setAttribute('aria-pressed', String(audio.enabled));
  refs.soundBtn.setAttribute('aria-label', audio.enabled ? '關閉音效' : '開啟音效');
  refs.soundBtn.querySelector('span').textContent = audio.enabled ? '音效' : '靜音';
}

function saveSoundPreference() {
  try {
    localStorage.setItem('starforge.sound', audio.enabled ? 'on' : 'off');
  } catch (error) {
    // Ignore storage errors.
  }
}

function isPortraitTouch() {
  return isTouchDevice && window.innerHeight > window.innerWidth;
}

function isTouchLandscape() {
  return isTouchDevice && window.innerWidth >= window.innerHeight;
}

function haptic(pattern = 8) {
  if (!isTouchDevice || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(pattern);
  } catch (error) {
    // Vibration is optional.
  }
}

function setInstallAvailable(available) {
  game.installAvailable = available;
  document.body.classList.toggle('can-install', available && !isStandalone && !isEmbedded);
}

/* The host maps score / maxScore to a percentage for its leaderboard.
   One point per restored exhibit, so maxScore is 5. */
function reportPlatformScore() {
  if (!isEmbedded) return;
  try {
    window.parent.postMessage(
      {
        type: 'game-score',
        score: game.restored.size,
        metadata: { game: 'starforge' },
      },
      window.location.origin,
    );
  } catch (error) {
    // Nothing to report to when the page is not actually framed.
  }
}

function fullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function syncFullscreenButton() {
  if (!refs.fullscreenBtn) return;
  const active = Boolean(fullscreenElement());
  refs.fullscreenBtn.classList.toggle('is-active', active);
  refs.fullscreenBtn.setAttribute('aria-label', active ? '離開全螢幕' : '進入全螢幕');
  const label = refs.fullscreenBtn.querySelector('span');
  if (label) label.textContent = active ? '退出' : '全螢幕';
}

function showFullscreenHelp() {
  if (isIOS) {
    toast('Safari 分頁無法強制全螢幕。請「分享 → 加入主畫面」，從主畫面啟動即可全螢幕。', 7000, true);
  } else {
    toast('此瀏覽器不支援網頁全螢幕；可將遊戲安裝到主畫面。', 6000, true);
  }
}

async function requestFullscreenForGame() {
  if (isEmbedded) return false;
  const element = document.documentElement;
  const request = element.requestFullscreen || element.webkitRequestFullscreen;
  if (!request) return false;

  try {
    await request.call(element);
    if (screen.orientation && typeof screen.orientation.lock === 'function') {
      screen.orientation.lock('landscape').catch(() => {});
    }
    syncFullscreenButton();
    return true;
  } catch (error) {
    return false;
  }
}

async function toggleFullscreen() {
  audio.click();
  haptic(8);
  if (fullscreenElement()) {
    try {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (exit) await exit.call(document);
    } catch (error) {
      // Ignore exit failures.
    }
    syncFullscreenButton();
    return;
  }

  const entered = await requestFullscreenForGame();
  if (!entered) showFullscreenHelp();
}

function updateViewportMode() {
  document.body.classList.toggle('is-touch', isTouchDevice);
  document.body.classList.toggle('is-portrait', isPortraitTouch());
  document.body.classList.toggle('is-landscape', isTouchLandscape());
  syncExtraPlacement();
  if (world) world.resize();
  syncControlsEnabled();
}

function setupPWA() {
  document.body.classList.toggle('is-standalone', isStandalone);
  document.body.classList.toggle('is-embed', isEmbedded);
  if (isEmbedded) {
    setInstallAvailable(false);
    return;
  }
  if (isStandalone) {
    setInstallAvailable(false);
    return;
  }

  if (isIOS || isTouchDevice) setInstallAvailable(true);

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    game.deferredInstallPrompt = event;
    setInstallAvailable(true);
  });

  window.addEventListener('appinstalled', () => {
    game.deferredInstallPrompt = null;
    setInstallAvailable(false);
    toast('星際工坊已安裝到主畫面', 4200, true);
  });

  if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {
        // The game still works online when a service worker cannot register.
      });
    });
  }
}

async function installApp() {
  if (isEmbedded) return;
  audio.click();
  haptic(8);
  if (game.deferredInstallPrompt) {
    const prompt = game.deferredInstallPrompt;
    game.deferredInstallPrompt = null;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === 'accepted') setInstallAvailable(false);
    } catch (error) {
      // The install prompt may already be consumed.
    }
    return;
  }

  if (isIOS) {
    toast('Safari：點「分享」圖示 →「加入主畫面」即可安裝。', 6500, true);
  } else {
    toast('請開啟瀏覽器選單，選擇「安裝應用程式」或「加入主畫面」。', 6500, true);
  }
}

function openIosChoice() {
  if (!refs.iosChoice || isEmbedded) return;
  refs.iosChoice.hidden = false;
  refs.choiceOptions.hidden = false;
  refs.choiceSteps.hidden = true;
  refs.iosChoice.querySelector('.ios-choice-card')?.classList.remove('is-steps');
  document.body.classList.add('choice-open');
  syncControlsEnabled();
  refs.choiceInstall.focus({ preventScroll: true });
  audio.click();
}

function closeIosChoice(restoreFocus = true) {
  if (!refs.iosChoice || refs.iosChoice.hidden) return;
  refs.iosChoice.hidden = true;
  refs.iosChoice.querySelector('.ios-choice-card')?.classList.remove('is-steps');
  document.body.classList.remove('choice-open');
  syncControlsEnabled();
  if (restoreFocus) refs.startBtn.focus({ preventScroll: true });
  audio.click();
}

function showIosInstallSteps() {
  refs.choiceOptions.hidden = true;
  refs.choiceSteps.hidden = false;
  refs.iosChoice.querySelector('.ios-choice-card')?.classList.add('is-steps');
  if (refs.choiceBrowserNote) {
    refs.choiceBrowserNote.textContent = isIOSSafari
      ? '加入後請關閉這個分頁，從主畫面啟動，就會以全螢幕開啟。'
      : '你目前使用的不是 Safari；請先用 Safari 開啟這個網址，再依上面步驟加入主畫面。';
  }
  refs.choiceStepsBack.focus({ preventScroll: true });
  audio.click();
}

function chooseIosBrowser() {
  closeIosChoice(false);
  startGame();
}

function handleStartRequest() {
  if (game.phase !== 'intro' || !world || isPortraitTouch()) return;
  if (isEmbedded) {
    startGame();
    return;
  }
  if (isIOS && !isStandalone) {
    openIosChoice();
    return;
  }
  if (isAndroid && !isStandalone) {
    requestFullscreenForGame().then((entered) => {
      if (!entered) {
        toast('此瀏覽器未允許自動全螢幕；可點右上角全螢幕按鈕再試。', 4200, true);
      }
    });
  }
  startGame();
}

function renderProgress(activeIndex = -1) {
  if (!refs.progress) return;
  refs.progress.innerHTML = LEVELS.map((level, index) => {
    const done = index < activeIndex;
    const active = index === activeIndex;
    return `
      <li class="step${done ? ' is-done' : ''}${active ? ' is-active' : ''}">
        <span class="step-dot">${String(index + 1).padStart(2, '0')}</span>
        <span class="step-label">${level.short}</span>
      </li>`;
  }).join('');
}

function setProgress(progress, foot, force = false) {
  const value = clamp(progress, 0, 1);
  if (!force && Math.abs(value - game.lastProgress) < 0.003 && foot === game.lastFoot) return;
  game.lastProgress = value;
  game.lastFoot = foot || '';
  const percent = Math.round(value * 100);
  if (refs.meterFill) refs.meterFill.style.width = `${value * 100}%`;
  if (refs.meterValue) refs.meterValue.textContent = `${percent}%`;
  if (refs.meter) {
    refs.meter.setAttribute('aria-valuenow', String(percent));
    refs.meter.classList.toggle('is-complete', value >= 0.999);
  }
  if (refs.meterFoot && foot) refs.meterFoot.textContent = foot;
}

function formatControlValue(control, value) {
  if (control.unit === '°') return `${Math.round(value)}`;
  return Number(value).toFixed(control.decimals ?? 1);
}

function buildControlPanel(level) {
  refs.sliders.innerHTML = level.controls
    .map((control) => {
      const percent = ((control.value - control.min) / (control.max - control.min)) * 100;
      const unit = control.unit ? `<em>${control.unit}</em>` : '';
      return `
        <div class="slider-group" data-key="${control.key}" style="--c:${control.color};">
          <div class="slider-head">
            <span class="axis-label"><i style="--c:${control.color}"></i>${control.label}</span>
            <span class="slider-value"><b>${formatControlValue(control, control.value)}</b>${unit}</span>
          </div>
          <div class="slider-control">
            <button class="nudge" type="button" data-key="${control.key}" data-dir="-1" aria-label="減少 ${control.label}">−</button>
            <input
              type="range"
              data-key="${control.key}"
              min="${control.min}"
              max="${control.max}"
              step="${control.step}"
              value="${control.value}"
              style="--c:${control.color}; --pct:${percent}%;"
              aria-label="${control.label}"
            />
            <button class="nudge" type="button" data-key="${control.key}" data-dir="1" aria-label="增加 ${control.label}">+</button>
          </div>
        </div>`;
    })
    .join('');

  game.controlMap = Object.fromEntries(level.controls.map((control) => [control.key, control]));
  level.controls.forEach((control) => {
    paintControl(control.key);
  });
}

function paintControl(key) {
  const control = game.controlMap[key];
  if (!control) return;
  const group = refs.sliders.querySelector(`.slider-group[data-key="${key}"]`);
  if (!group) return;
  const input = group.querySelector('input');
  const valueNode = group.querySelector('.slider-value b');
  const value = game.values[key];
  if (input) {
    input.value = String(value);
    input.style.setProperty('--pct', `${((value - control.min) / (control.max - control.min)) * 100}%`);
    input.setAttribute(
      'aria-valuetext',
      `${formatControlValue(control, value)}${control.unit || ''}`,
    );
  }
  if (valueNode) valueNode.textContent = formatControlValue(control, value);
}

function syncControlPanel() {
  Object.keys(game.controlMap).forEach((key) => paintControl(key));
}

function refreshCode() {
  const level = LEVELS[game.index];
  if (!level) return;
  game.currentCode = level.code(game.values);
  refs.codeBlock.innerHTML = highlight(game.currentCode);
  refs.codeFile.textContent = level.file;
}

function refreshExtraUI() {
  const level = LEVELS[game.index];
  if (level && level.syncUI && game.runtime) {
    level.syncUI(game.runtime, game.values);
  }
}

function syncExtraPlacement() {
  if (!refs.missionExtra || !refs.levelExtra) return;
  const level = LEVELS[game.index];
  const moveToMission = isTouchLandscape() && level?.id === 'light';
  const source = moveToMission ? refs.levelExtra : refs.missionExtra;
  const target = moveToMission ? refs.missionExtra : refs.levelExtra;
  if (source.childNodes.length) target.append(...source.childNodes);
}

function updateHUDForLevel(level, index) {
  refs.levelNumber.textContent = String(index + 1).padStart(2, '0');
  refs.levelTag.textContent = level.tag;
  refs.targetBadge.innerHTML = `<i></i>${level.targetBadge}`;
  refs.missionTitle.textContent = level.title;
  refs.missionObjective.textContent = level.objective;
  refs.missionHint.textContent = level.hint;
  refs.meterLabel.textContent = level.meterLabel;
  refs.consoleTitle.textContent = level.consoleTitle;
  refs.codeFile.textContent = level.file;
  refs.meterFoot.textContent = level.meterFoot;
  refs.meterValue.textContent = '0%';
  refs.meterFill.style.width = '0%';
  refs.meter.setAttribute('aria-valuenow', '0');
  refs.meter.classList.remove('is-complete');
  game.lastProgress = -1;
  game.lastFoot = '';
  refs.missionCard.classList.remove('is-switching');
  void refs.missionCard.offsetWidth;
  refs.missionCard.classList.add('is-switching');
  refs.missionExtra.innerHTML = '';
  refs.levelExtra.innerHTML = level.extra ? level.extra(game.values) : '';
  syncExtraPlacement();
}

function applyValuesAndRefresh() {
  const level = LEVELS[game.index];
  if (!level || !game.runtime) return;
  level.apply(game.runtime, game.values);
  syncControlPanel();
  refreshCode();
  refreshExtraUI();
  const result = level.check(game.runtime, game.values);
  setProgress(result.progress, result.foot);
}

function loadLevel(index, options = {}) {
  clearLevel();
  if (document.body.classList.contains('code-open')) closeCodePanel(false);
  const level = LEVELS[index];
  if (!level || !world) return;

  game.index = index;
  game.phase = 'playing';
  document.body.dataset.level = level.id;
  game.controlMap = {};
  game.values = {};
  level.controls.forEach((control) => {
    game.values[control.key] = control.value;
  });

  const runtime = level.build(levelRoot, game.values);
  runtime.level = level;
  runtime.okTime = 0;
  runtime.okSince = 0;
  runtime.uiTimer = 0;
  runtime.solved = false;
  game.runtime = runtime;

  updateHUDForLevel(level, index);
  buildControlPanel(level);
  level.apply(runtime, game.values);
  refreshCode();
  refreshExtraUI();
  renderProgress(index);
  setProgress(0, level.meterFoot, true);
  world.setStageMood(level.id === 'light' ? 'light' : level.id === 'orbit' ? 'orbit' : 'default');
  world.controls.autoRotate = false;

  const position = new THREE.Vector3(...level.camera.position);
  const target = new THREE.Vector3(...level.camera.target);
  if (isTouchLandscape()) {
    if (window.innerWidth < 760) {
      position.sub(target).multiplyScalar(1.18).add(target);
    } else {
      position.sub(target).multiplyScalar(0.9).add(target);
    }
  } else if (window.innerWidth <= 820 && level.mobileCamera) {
    position.set(...level.mobileCamera.position);
    target.set(...level.mobileCamera.target);
    position.sub(target).multiplyScalar(1.2).add(target);
  } else if (window.innerWidth <= 820) {
    position.sub(target).multiplyScalar(1.3).add(target);
  } else if (window.innerWidth <= 1100) {
    position.sub(target).multiplyScalar(1.45).add(target);
  } else if (window.innerWidth <= 1300) {
    position.sub(target).multiplyScalar(1.25).add(target);
  }
  flyCamera(position, target, options.instant ? 0 : 1.15);
  syncControlsEnabled();
}

function clearLevel() {
  if (game.runtime && game.runtime.root) {
    disposeObject(game.runtime.root);
  }
  game.runtime = null;
  if (levelRoot) {
    [...levelRoot.children].forEach((child) => disposeObject(child));
  }
  GHOST_FILL.opacity = 0.075;
  GHOST_LINE.opacity = 0.6;
}

function flyCamera(position, target, duration = 1.15) {
  if (!world) return;
  if (duration <= 0) {
    world.camera.position.copy(position);
    world.controls.target.copy(target);
    world.camera.lookAt(target);
    world.controls.update();
    camTween = null;
    syncControlsEnabled();
    return;
  }
  camTween = {
    fromPosition: world.camera.position.clone(),
    toPosition: position.clone(),
    fromTarget: world.controls.target.clone(),
    toTarget: target.clone(),
    startedAt: performance.now(),
    duration,
  };
  world.controls.enabled = false;
  world.controls.autoRotate = false;
}

function updateCamera(dt) {
  if (!world) return;
  if (camTween) {
    const t = clamp((performance.now() - camTween.startedAt) / (camTween.duration * 1000), 0, 1);
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    world.camera.position.lerpVectors(camTween.fromPosition, camTween.toPosition, eased);
    world.controls.target.lerpVectors(camTween.fromTarget, camTween.toTarget, eased);
    world.camera.lookAt(world.controls.target);
    if (t >= 1) {
      camTween = null;
      world.controls.update();
      syncControlsEnabled();
    }
    return;
  }
  if (world.controls.enabled) world.controls.update();
}

function evaluateCurrentLevel(dt) {
  const level = LEVELS[game.index];
  const runtime = game.runtime;
  if (!level || !runtime) return;
  const result = level.check(runtime, game.values);
  setProgress(result.progress, result.foot);
  runtime.uiTimer = (runtime.uiTimer || 0) - dt;
  if (runtime.uiTimer <= 0 && level.syncUI) {
    level.syncUI(runtime, game.values);
    runtime.uiTimer = 0.1;
  }
  if (result.ok) {
    if (!runtime.okSince) runtime.okSince = performance.now();
    if (performance.now() - runtime.okSince >= (level.hold ?? 0.18) * 1000) {
      completeLevel();
    }
  } else {
    runtime.okSince = 0;
    runtime.okTime = 0;
  }
}

function completeLevel() {
  if (game.phase !== 'playing' || !game.runtime) return;
  const level = LEVELS[game.index];
  const runtime = game.runtime;
  runtime.solved = true;
  game.phase = 'complete';
  game.flash = 1;
  world.controls.enabled = false;
  hideToast();

  level.onSuccess?.(runtime, game.values);
  Object.assign(game.values, level.successValues);
  level.apply(runtime, game.values);
  syncControlPanel();
  refreshCode();
  level.syncUI?.(runtime, game.values);
  setProgress(1, '展品已修復', true);
  game.restored.add(game.index);
  reportPlatformScore();

  audio.success();
  haptic([18, 35, 24]);
  spawnBurst(runtime, level);
  syncControlsEnabled();

  window.clearTimeout(game.completeTimer);
  game.completeTimer = window.setTimeout(() => showComplete(level), 1050);
}

function showComplete(level) {
  if (game.phase !== 'complete') return;
  refs.completeEyebrow.textContent = `EXHIBIT ${String(game.index + 1).padStart(2, '0')} / RESTORED`;
  refs.completeTitle.textContent = level.title;
  refs.completeSummary.textContent = level.successText;
  refs.lessonTitle.textContent = level.lesson.title;
  refs.lessonBody.textContent = level.lesson.body;
  refs.lessonCode.innerHTML = highlight(level.lesson.code);
  refs.lessonPoints.innerHTML = level.lesson.points.map((point) => `<li>${point}</li>`).join('');
  refs.nextLevelBtn.querySelector('span').textContent =
    game.index === LEVELS.length - 1 ? '啟動天文台' : '下一關';
  refs.nextHint.textContent = level.nextHint;
  refs.completeOverlay.hidden = false;
  syncControlsEnabled();
  refs.nextLevelBtn.focus({ preventScroll: true });
}

function goToNextLevel() {
  if (game.phase !== 'complete') return;
  refs.completeOverlay.hidden = true;
  audio.swoosh();
  if (game.index === LEVELS.length - 1) {
    showFinale();
  } else {
    loadLevel(game.index + 1);
  }
}

function showFinale() {
  game.phase = 'finale';
  hideToast();
  clearLevel();
  world.hideFinale();
  world.showFinale();
  world.setStageMood('finale');
  world.controls.autoRotate = false;
  document.body.classList.remove('is-playing');
  document.body.classList.add('is-finale');
  refs.completeOverlay.hidden = true;
  refs.finaleOverlay.hidden = true;
  refs.finaleBar.hidden = true;
  refs.finaleTime.textContent = formatTime((Date.now() - game.startedAt) / 1000);

  const mobileFinale = !isTouchDevice && window.innerWidth <= 820;
  flyCamera(
    mobileFinale ? new THREE.Vector3(1.2, 6.4, 17.5) : new THREE.Vector3(0, 5.25, 14.5),
    mobileFinale ? new THREE.Vector3(1.2, 2.2, 0) : new THREE.Vector3(0, 2.2, 0),
    1.35,
  );
  audio.finale();

  window.clearTimeout(game.finaleTimer);
  game.finaleTimer = window.setTimeout(() => {
    if (game.phase !== 'finale') return;
    refs.finaleOverlay.hidden = false;
    syncControlsEnabled();
    refs.exploreBtn.focus({ preventScroll: true });
  }, 1050);
}

function exploreFinale() {
  if (game.phase !== 'finale') return;
  refs.finaleOverlay.hidden = true;
  refs.finaleBar.hidden = false;
  syncControlsEnabled();
  toast('自由環視 · 拖曳旋轉，滾輪縮放');
  audio.click();
}

function restartGame() {
  if (!world) return;
  hideToast();
  window.clearTimeout(game.completeTimer);
  window.clearTimeout(game.finaleTimer);
  refs.completeOverlay.hidden = true;
  refs.finaleOverlay.hidden = true;
  refs.finaleBar.hidden = true;
  refs.notebookModal.hidden = true;
  document.body.classList.remove('is-finale', 'code-open');
  document.body.classList.add('is-playing');
  world.hideFinale();
  world.hideIntro();
  world.setStageMood('default');
  world.controls.autoRotate = false;
  clearEffects();
  game.phase = 'playing';
  game.startedAt = Date.now();
  game.flash = 0;
  world.renderer.toneMappingExposure = 1.06;
  loadLevel(0);
  toast('工坊已重置 · 從第一件展品開始');
  audio.swoosh();
}

function spawnBurst(runtime, level) {
  if (!world) return;
  runtime.root.updateMatrixWorld(true);
  let target = runtime.pearl || runtime.probe || runtime.orbit || runtime.compass || runtime.crystal;
  if (level.id === 'rotation') target = runtime.compass;
  if (level.id === 'scale') target = runtime.crystal;
  if (level.id === 'light') target = runtime.pearl;
  if (level.id === 'position') target = runtime.orbit;
  if (level.id === 'orbit') target = runtime.probe;
  if (!target) return;
  const worldPosition = new THREE.Vector3();
  target.getWorldPosition(worldPosition);
  const count = reducedMotion.matches ? 48 : 130;
  const positions = new Float32Array(count * 3);
  const velocities = [];
  for (let i = 0; i < count; i += 1) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const speed = 0.6 + Math.random() * 2.2;
    velocities.push(
      new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.cos(phi) * speed + 0.7,
        Math.sin(phi) * Math.sin(theta) * speed,
      ),
    );
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const color = level.id === 'orbit' ? 0x8effc6 : level.id === 'light' ? 0xffb7d8 : 0x8ffcff;
  const material = new THREE.PointsMaterial({
    color,
    size: 0.085,
    map: glowTexture,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  points.position.copy(worldPosition);
  points.frustumCulled = false;
  world.scene.add(points);

  const ringMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.2, 64), ringMaterial);
  ring.position.copy(worldPosition);
  ring.rotation.x = -Math.PI / 2;
  world.scene.add(ring);

  effects.push({
    points,
    positions,
    velocities,
    material,
    ring,
    ringMaterial,
    life: 0,
    maxLife: 1.5,
  });
}

const effects = [];

function updateEffects(dt) {
  for (let i = effects.length - 1; i >= 0; i -= 1) {
    const effect = effects[i];
    effect.life += dt;
    const progress = effect.life / effect.maxLife;
    const positions = effect.positions;
    for (let p = 0; p < effect.velocities.length; p += 1) {
      const velocity = effect.velocities[p];
      velocity.y -= 1.35 * dt;
      positions[p * 3] += velocity.x * dt;
      positions[p * 3 + 1] += velocity.y * dt;
      positions[p * 3 + 2] += velocity.z * dt;
    }
    effect.points.geometry.attributes.position.needsUpdate = true;
    effect.material.opacity = Math.max(0, 0.95 * (1 - progress));
    effect.ring.scale.setScalar(1 + progress * 9);
    effect.ringMaterial.opacity = Math.max(0, 0.7 * (1 - progress));
    if (progress >= 1) {
      disposeObject(effect.points);
      disposeObject(effect.ring);
      effects.splice(i, 1);
    }
  }
}

function clearEffects() {
  effects.forEach((effect) => {
    disposeObject(effect.points);
    disposeObject(effect.ring);
  });
  effects.length = 0;
}

function toast(message, duration = 2800, elevated = false) {
  if (!refs.toast) return;
  window.clearTimeout(game.toastTimer);
  refs.toast.textContent = message;
  refs.toast.classList.toggle('is-elevated', elevated);
  refs.toast.classList.add('is-visible');
  game.toastTimer = window.setTimeout(() => {
    refs.toast.classList.remove('is-visible');
  }, duration);
}

function hideToast() {
  window.clearTimeout(game.toastTimer);
  if (refs.toast) {
    refs.toast.classList.remove('is-visible');
    refs.toast.classList.remove('is-elevated');
  }
}

function syncControlsEnabled() {
  if (!world) return;
  const overlayOpen =
    !refs.introOverlay.hidden ||
    !refs.completeOverlay.hidden ||
    !refs.finaleOverlay.hidden ||
    !refs.notebookModal.hidden ||
    !refs.iosChoice.hidden ||
    document.body.classList.contains('code-open');
  const canControl =
    !camTween &&
    !overlayOpen &&
    !isPortraitTouch() &&
    (game.phase === 'playing' || game.phase === 'finale');
  world.controls.enabled = canControl;
  world.controls.autoRotate =
    game.phase === 'finale' &&
    canControl &&
    refs.finaleBar.hidden === false;
}

function openNotebook() {
  if (!refs.notebookModal.hidden) return;
  game.lastFocused = document.activeElement;
  refs.notebookModal.hidden = false;
  document.body.classList.add('modal-open');
  syncControlsEnabled();
  refs.closeNotebook.focus({ preventScroll: true });
  audio.click();
}

function closeNotebook() {
  if (refs.notebookModal.hidden) return;
  refs.notebookModal.hidden = true;
  document.body.classList.remove('modal-open');
  syncControlsEnabled();
  if (game.lastFocused && typeof game.lastFocused.focus === 'function') {
    game.lastFocused.focus({ preventScroll: true });
  }
  audio.click();
}

function openCodePanel() {
  document.body.classList.add('code-open');
  refs.codeToggle.setAttribute('aria-expanded', 'true');
  syncControlsEnabled();
  refs.closeCode.focus({ preventScroll: true });
}

function closeCodePanel(restoreFocus = true) {
  document.body.classList.remove('code-open');
  refs.codeToggle.setAttribute('aria-expanded', 'false');
  syncControlsEnabled();
  if (restoreFocus) refs.codeToggle.focus({ preventScroll: true });
}

function toggleSound() {
  audio.setEnabled(!audio.enabled);
  setSoundUI();
  saveSoundPreference();
}

async function copyCode() {
  const text = game.currentCode;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
    } catch (copyError) {
      // Ignore copy failures.
    }
    textarea.remove();
  }
  const label = refs.copyCode.querySelector('span');
  const previous = label.textContent;
  label.textContent = '已複製';
  toast('即時程式碼已複製到剪貼簿');
  audio.tick(760, 0.012);
  window.setTimeout(() => {
    label.textContent = previous;
  }, 1600);
}

function resetLevel() {
  if (game.phase !== 'playing' || !game.runtime) return;
  const level = LEVELS[game.index];
  level.controls.forEach((control) => {
    game.values[control.key] = control.value;
  });
  game.runtime.okTime = 0;
  game.runtime.okSince = 0;
  level.apply(game.runtime, game.values);
  syncControlPanel();
  refreshCode();
  refreshExtraUI();
  const result = level.check(game.runtime, game.values);
  setProgress(result.progress, result.foot, true);
  audio.reset();
  toast('本關數值已重設');
}

function startGame() {
  if (game.phase !== 'intro' || !world || isPortraitTouch()) return;
  audio.init();
  if (audio.enabled) audio.start();
  haptic(12);
  refs.introOverlay.classList.add('is-leaving');
  refs.introOverlay.hidden = false;
  document.body.classList.add('is-playing');
  game.phase = 'playing';
  game.startedAt = Date.now();
  world.hideIntro();
  world.hideFinale();
  loadLevel(0);
  window.setTimeout(() => {
    refs.introOverlay.hidden = true;
    refs.introOverlay.classList.remove('is-leaving');
    syncControlsEnabled();
  }, 380);
}

function handleSliderInput(event) {
  const input = event.target.closest('input[type="range"]');
  if (!input || !refs.sliders.contains(input)) return;
  if (game.phase !== 'playing' || !game.runtime || game.runtime.solved) return;
  const key = input.dataset.key;
  const control = game.controlMap[key];
  if (!control) return;
  game.values[key] = clamp(Number(input.value), control.min, control.max);
  applyValuesAndRefresh();
}

function handleNudge(event) {
  const button = event.target.closest('.nudge');
  if (!button) return;
  if (game.phase !== 'playing' || !game.runtime || game.runtime.solved) return;
  const key = button.dataset.key;
  const control = game.controlMap[key];
  if (!control) return;
  const step = Number(control.step);
  const raw = game.values[key] + Number(button.dataset.dir) * step;
  const snapped = control.min + Math.round((raw - control.min) / step) * step;
  game.values[key] = clamp(Number(snapped.toFixed(4)), control.min, control.max);
  applyValuesAndRefresh();
  audio.tick(540 + (game.values[key] - control.min) * 4, 0.008);
  haptic(6);
}

function bindEvents() {
  refs.startBtn.addEventListener('click', handleStartRequest);
  refs.introNotebookBtn.addEventListener('click', openNotebook);
  refs.notebookBtn.addEventListener('click', openNotebook);
  refs.finaleNotebookBtn.addEventListener('click', openNotebook);
  refs.finaleNotebookBtn2.addEventListener('click', openNotebook);
  refs.closeNotebook.addEventListener('click', closeNotebook);
  refs.notebookModal.addEventListener('click', (event) => {
    if (event.target === refs.notebookModal) closeNotebook();
  });
  refs.choiceInstall.addEventListener('click', showIosInstallSteps);
  refs.choiceBrowser.addEventListener('click', chooseIosBrowser);
  refs.choiceBrowserFromSteps.addEventListener('click', chooseIosBrowser);
  refs.choiceStepsBack.addEventListener('click', () => {
    refs.choiceSteps.hidden = true;
    refs.choiceOptions.hidden = false;
    refs.iosChoice.querySelector('.ios-choice-card')?.classList.remove('is-steps');
    refs.choiceInstall.focus({ preventScroll: true });
    audio.click();
  });
  refs.choiceClose.addEventListener('click', () => closeIosChoice());
  refs.iosChoice.addEventListener('click', (event) => {
    if (event.target === refs.iosChoice) closeIosChoice();
  });
  refs.soundBtn.addEventListener('click', toggleSound);
  refs.sliders.addEventListener('input', handleSliderInput);
  refs.sliders.addEventListener('click', handleNudge);
  refs.resetLevel.addEventListener('click', resetLevel);
  refs.copyCode.addEventListener('click', copyCode);
  refs.codeToggle.addEventListener('click', () => {
    if (document.body.classList.contains('code-open')) closeCodePanel();
    else openCodePanel();
  });
  refs.closeCode.addEventListener('click', closeCodePanel);
  refs.codeBackdrop.addEventListener('click', () => closeCodePanel());
  refs.fullscreenBtn.addEventListener('click', toggleFullscreen);
  refs.installBtn.addEventListener('click', installApp);
  refs.installIntroBtn.addEventListener('click', installApp);
  refs.nextLevelBtn.addEventListener('click', goToNextLevel);
  refs.exploreBtn.addEventListener('click', exploreFinale);
  refs.restartBtn.addEventListener('click', restartGame);
  refs.finaleRestart.addEventListener('click', restartGame);

  document.addEventListener('fullscreenchange', () => {
    syncFullscreenButton();
    updateViewportMode();
  });
  document.addEventListener('webkitfullscreenchange', () => {
    syncFullscreenButton();
    updateViewportMode();
  });

  window.addEventListener('resize', updateViewportMode);
  window.addEventListener('orientationchange', () => {
    window.setTimeout(updateViewportMode, 220);
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateViewportMode);
  }

  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!refs.iosChoice.hidden) {
      closeIosChoice();
      return;
    }
    if (!refs.notebookModal.hidden) {
      closeNotebook();
      return;
    }
    if (document.body.classList.contains('code-open')) {
      closeCodePanel();
    }
  });
}

function debugGoToLevel(index) {
  const targetIndex = clamp(Number(index) || 0, 0, LEVELS.length - 1);
  if (!world) return;
  refs.introOverlay.hidden = true;
  refs.completeOverlay.hidden = true;
  refs.finaleOverlay.hidden = true;
  refs.finaleBar.hidden = true;
  refs.notebookModal.hidden = true;
  document.body.classList.remove('is-finale');
  document.body.classList.add('is-playing');
  world.hideFinale();
  world.hideIntro();
  world.controls.autoRotate = false;
  if (!game.startedAt) game.startedAt = Date.now();
  game.phase = 'playing';
  loadLevel(targetIndex);
  game.phase = 'playing';
}

function debugSetValues(patch) {
  if (!game.runtime) return;
  Object.assign(game.values, patch);
  applyValuesAndRefresh();
}

function debugWin() {
  if (game.phase === 'playing') completeLevel();
}

function installDebugAPI() {
  window.__STARFORGE__ = {
    goToLevel: debugGoToLevel,
    setValues: debugSetValues,
    win: debugWin,
    scene: world.scene,
    camera: world.camera,
    getState: () => ({
      phase: game.phase,
      index: game.index,
      values: { ...game.values },
      progress: game.lastProgress,
      restored: [...game.restored],
      completeOpen: !refs.completeOverlay.hidden,
      finaleOpen: !refs.finaleOverlay.hidden,
    }),
    levels: LEVELS.map((level) => ({
      id: level.id,
      controls: level.controls,
      successValues: level.successValues,
    })),
  };
}

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  clockTime.elapsed += dt;
  const time = clockTime.elapsed;

  if (world) {
    world.animateAmbient(dt, time);
    if (game.runtime && (game.phase === 'playing' || game.phase === 'complete')) {
      const level = LEVELS[game.index];
      level.tick?.(game.runtime, dt, time, game.values);
      if (game.phase === 'playing') evaluateCurrentLevel(dt);
    }
    updateCamera(dt);
    updateEffects(dt);
    if (game.flash > 0) {
      game.flash = Math.max(0, game.flash - dt * 2.4);
      world.renderer.toneMappingExposure = 1.06 + game.flash * 0.5;
    }
    world.render();
  }

  if (!game.bootHidden && refs.boot) {
    game.bootHidden = true;
    requestAnimationFrame(() => {
      refs.boot.classList.add('is-hidden');
      window.setTimeout(() => refs.boot?.remove(), 750);
      if (refs.startBtn) refs.startBtn.focus({ preventScroll: true });
    });
  }
}

function init() {
  renderProgress(-1);
  setSoundUI();
  bindEvents();
  setupPWA();
  updateViewportMode();
  syncFullscreenButton();

  if (!world) return;
  levelRoot = new THREE.Group();
  world.scene.add(levelRoot);
  world.controls.enabled = false;
  world.renderer.setAnimationLoop(animate);
  installDebugAPI();
}

init();
