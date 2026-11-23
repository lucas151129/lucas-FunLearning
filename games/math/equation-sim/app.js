/* =============================================================
 * app.js — 代數解題教室（解方程模擬器 & 主項變換練習）
 * 依賴 window.MathCore（math.js）、window.Generators（generators.js）
 * ============================================================= */
(function () {
  'use strict';
  const M = window.MathCore;
  const G = window.Generators;
  const SVG_NS = 'http://www.w3.org/2000/svg';

  /* ---------------- 狀態 ---------------- */
  const ROUND_TOTAL = 10;    // 一輪 10 題；解完一輪才回報分數給平台
  // 上架拆成兩張遊戲卡：每張卡只跑自己那一個模式，開場直接進練習
  const FORCED_MODULE = 'solve';

  const state = {
    screen: 'home',          // 'home' | 'module'
    module: null,            // 'solve' | 'subject'
    difficulty: 2,           // 1 | 2 | 3
    eq: null,                // { L, R }（規範節點）
    initialEq: null,         // 題目初始狀態（用於重設）
    subject: 'x',
    history: [],
    steps: [],               // 每一步的 {L, R} 快照（含初始）
    solved: null,            // solve: {value:Rat} | subject: {expr:node}
    score: 0,
    roundDone: false
  };

  /* ---------------- DOM 小工具 ---------------- */
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function textSpan(t) { return el('span', 'm-txt', t); }
  function varSpan(name) { return el('span', 'm-var', name); }
  function opSpan(op, lead) {
    const s = el('span', 'm-op', op);
    if (lead) s.classList.add('m-op-lead');
    return s;
  }
  function minusSpan() { return el('span', 'm-minus', '-'); }

  function fracEl(numEl, denEl) {
    const f = el('span', 'frac');
    const n = el('span', 'frac-num'); n.appendChild(numEl);
    const d = el('span', 'frac-den'); d.appendChild(denEl);
    f.appendChild(n); f.appendChild(d);
    return f;
  }
  function parenGroup(inner) {
    // 用像素字體的字元畫括號：與內容同字體，比例自然、免量高度
    const g = el('span', 'paren-group');
    g.appendChild(el('span', 'paren-glyph', '('));
    g.appendChild(inner);
    g.appendChild(el('span', 'paren-glyph', ')'));
    return g;
  }

  /* ---------------- 數學渲染 ---------------- */
  function renderNum(v) {
    const wrap = el('span', 'm-num');
    if (v.n < 0) wrap.appendChild(minusSpan());
    const a = M.ratAbs(v);
    if (a.d === 1) wrap.appendChild(textSpan(String(a.n)));
    else wrap.appendChild(fracEl(renderNum({ n: a.n, d: 1 }), renderNum({ n: a.d, d: 1 })));
    return wrap;
  }
  function renderCoefForDisplay(coef) {
    const w = el('span', 'm-coef');
    if (coef.n < 0) w.appendChild(minusSpan());
    const a = M.ratAbs(coef);
    if (!M.ratIsOne(a)) w.appendChild(textSpan(String(a.n)));
    return w;
  }
  function renderProd(node) {
    const wrap = el('span', 'm-prod');
    if (!M.ratIsOne(node.coef)) wrap.appendChild(renderCoefForDisplay(node.coef));
    for (const f of node.factors) wrap.appendChild(renderNode(f));
    return wrap;
  }
  function renderSum(node) {
    const wrap = el('span', 'm-sum');
    node.terms.forEach((t, i) => {
      if (i === 0) {
        if (t.sign === -1) wrap.appendChild(opSpan('-', true));
      } else {
        wrap.appendChild(opSpan(t.sign === -1 ? '-' : '+'));
      }
      wrap.appendChild(renderNode(t.node));
    });
    return wrap;
  }
  function renderNode(node) {
    switch (node.type) {
      case 'num': return renderNum(node.v);
      case 'var': return varSpan(node.name);
      case 'prod': return renderProd(node);
      case 'sum': return renderSum(node);
      case 'frac': return fracEl(renderNode(node.num), renderNode(node.den));
      case 'paren': return parenGroup(renderNode(node.a));
      default: return textSpan('?');
    }
  }

  function makeDragWrap(unit, contentEl) {
    const w = el('span', 'drag-unit');
    w.appendChild(contentEl);
    w.__unit = unit;
    return w;
  }
  function renderSolveSide(node) {
    if (node.type === 'sum') {
      const wrap = el('span', 'm-sum');
      const units = M.draggables(node);
      node.terms.forEach((t, i) => {
        if (i === 0) {
          if (t.sign === -1) wrap.appendChild(opSpan('-', true));
        } else {
          wrap.appendChild(opSpan(t.sign === -1 ? '-' : '+'));
        }
        wrap.appendChild(makeDragWrap(units[i], renderNode(t.node)));
      });
      return wrap;
    }
    if (node.type === 'prod') {
      const wrap = el('span', 'm-prod');
      if (!M.ratIsOne(node.coef)) {
        wrap.appendChild(makeDragWrap({ kind: 'factor', coef: node.coef }, renderCoefForDisplay(node.coef)));
      }
      node.factors.forEach((f, i) => {
        wrap.appendChild(makeDragWrap({ kind: 'factor', node: f, fidx: i }, renderNode(f)));
      });
      return wrap;
    }
    if (node.type === 'frac') {
      const numEl = renderNode(node.num);
      const denEl = makeDragWrap({ kind: 'denominator', node: node.den }, renderNode(node.den));
      return fracEl(numEl, denEl);
    }
    return renderNode(node);
  }

  function sizeAllParens() { /* 括號改為字元繪製，不需量測 */ }

  /* ---------------- 像素圖示 ---------------- */
  const ICON_PALETTE = {
    X: '#5b21b6', // 深紫（外框）
    L: '#ede9fe', // 螢幕淺色
    B: '#a78bfa', // 按鍵紫
    A: '#7c3aed'  // 主題紫
  };
  const ICONS = {
    calc: [
      '............',
      '.XXXXXXXXXX.',
      '.XLLLLLLLLX.',
      '.XLLLLLLLLX.',
      '.XLLLLLLLLX.',
      '.XXXXXXXXXX.',
      '.XBBXBBXBBX.',
      '.XBBXBBXBBX.',
      '.XBBXBBXBBX.',
      '.XXXXXXXXXX.',
      '.XBBXBBXBBX.',
      '.XBBXBBXBBX.',
      '.XBBXBBXBBX.',
      '.XXXXXXXXXX.'
    ],
    swap: [
      '............',
      '.....AA.....',
      '....AAAA....',
      '...AAAAAA...',
      '..AAAAAAAA..',
      '..AAAAAAAA..',
      '...AAAAAA...',
      '....AAAA....',
      '.....AA.....',
      '............'
    ]
  };
  function pixelIcon(rows, scale) {
    scale = scale || 3;
    const h = rows.length;
    const w = rows[0].length;
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('width', w * scale);
    svg.setAttribute('height', h * scale);
    svg.setAttribute('shape-rendering', 'crispEdges');
    svg.style.display = 'block';
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const c = ICON_PALETTE[rows[y][x]];
        if (!c) continue;
        const r = document.createElementNS(SVG_NS, 'rect');
        r.setAttribute('x', x); r.setAttribute('y', y);
        r.setAttribute('width', 1); r.setAttribute('height', 1);
        r.setAttribute('fill', c);
        svg.appendChild(r);
      }
    }
    return svg;
  }
  function renderIcons() {
    document.querySelectorAll('.card-icon[data-icon]').forEach((host) => {
      const map = ICONS[host.dataset.icon];
      if (map) host.appendChild(pixelIcon(map, 4));
    });
  }

  /* ---------------- 渲染 ---------------- */
  const $ = (id) => document.getElementById(id);

  function renderEquation() {
    const eq = $('eq');
    eq.innerHTML = '';
    const l = el('span', 'side'); l.dataset.side = 'L';
    l.appendChild(renderSolveSide(state.eq.L));
    const r = el('span', 'side'); r.dataset.side = 'R';
    r.appendChild(renderSolveSide(state.eq.R));
    eq.appendChild(l);
    eq.appendChild(el('span', 'eq-sign', '='));
    eq.appendChild(r);
  }

  function renderSteps() {
    const box = $('steps');
    if (!box) return;
    box.innerHTML = '';
    state.steps.forEach((s, i) => {
      const row = el('div', 'step' + (i === state.steps.length - 1 ? ' current' : ''));
      row.appendChild(el('span', 'step-num', i === 0 ? '起' : String(i)));
      const eqMini = el('span', 'step-eq');
      eqMini.appendChild(renderNode(s.L));
      eqMini.appendChild(el('span', 'eq-sign', '='));
      eqMini.appendChild(renderNode(s.R));
      row.appendChild(eqMini);
      box.appendChild(row);
    });
  }

  function renderPrompt() {
    const p = $('prompt');
    p.innerHTML = '';
    if (state.module === 'solve') {
      p.appendChild(textSpan('解方程：求出 '));
      p.appendChild(varSpan('x'));
      p.appendChild(textSpan(' 的值'));
    } else {
      p.appendChild(textSpan('以 '));
      p.appendChild(varSpan(state.subject));
      p.appendChild(textSpan(' 為主項'));
    }
  }

  function renderBanner() {
    const b = $('banner');
    if (state.solved) {
      b.classList.remove('hidden');
      b.innerHTML = '';
      b.appendChild(textSpan('🎉 答對了！  '));
      const be = el('span', 'banner-eq');
      be.appendChild(varSpan(state.subject));
      be.appendChild(el('span', 'eq-sign', '='));
      if (state.module === 'solve') be.appendChild(renderNum(state.solved.value));
      else be.appendChild(renderNode(state.solved.expr));
      b.appendChild(be);
    } else {
      b.classList.add('hidden');
      b.innerHTML = '';
    }
  }

  function renderScreen() {
    $('home').classList.toggle('hidden', state.screen !== 'home');
    $('module').classList.toggle('hidden', state.screen !== 'module');
    if (state.screen === 'module') {
      $('module-title').textContent = state.module === 'solve' ? '解方程模擬器' : '主項變換練習';
      $('score').textContent = '✓ ' + state.score + '/' + ROUND_TOTAL;
      renderPrompt();
      renderEquation();
      renderSteps();
      renderBanner();
      renderDifficulty();
      renderRoundDone();
      $('btn-undo').disabled = state.history.length === 0;
      sizeAllParens();
    }
    syncFullscreenUI();
  }

  // 一輪結束的結算卡
  function renderRoundDone() {
    const box = $('round-done');
    if (!box) return;
    box.classList.toggle('hidden', !state.roundDone);
    if (!state.roundDone) return;
    const s = $('rd-score');
    const t = $('rd-total');
    if (s) s.textContent = String(state.score);
    if (t) t.textContent = String(ROUND_TOTAL);
  }

  function renderDifficulty() {
    document.querySelectorAll('#difficulty button').forEach((b) => {
      b.classList.toggle('active', Number(b.dataset.diff) === state.difficulty);
    });
  }

  /* ---------------- 提示 ---------------- */
  let statusTimer = null;
  function setStatus(msg, kind) {
    const s = $('status-text');
    s.innerHTML = '';
    s.appendChild(el('span', kind || '', msg));
  }
  function flash(msg, isErr) {
    setStatus(msg, isErr ? 'err' : 'ok');
    if (statusTimer) clearTimeout(statusTimer);
    statusTimer = setTimeout(() => setStatus(defaultHint()), 2400);
  }
  function defaultHint() {
    return state.module === 'solve'
      ? '把可以移動的項拖到等號另一邊，求出 x。'
      : '把可以移動的項拖到等號另一邊，讓 ' + state.subject + ' 單獨在一邊。';
  }
  function showDefaultStatus() { setStatus(defaultHint()); }

  /* ---------------- 出題 ---------------- */
  function newProblem() {
    clearGhosts();
    let gen;
    if (state.module === 'solve') gen = G.genSolve(state.difficulty);
    else gen = G.genSubject(state.difficulty);
    state.subject = gen.subject;
    state.eq = { L: gen.L, R: gen.R };
    state.initialEq = { L: gen.L, R: gen.R };
    state.history = [];
    state.steps = [{ L: gen.L, R: gen.R }];
    state.solved = null;
    renderScreen();
    showDefaultStatus();
  }

  /* ---------------- 流程 ---------------- */
  function startModule(module) {
    state.module = module;
    state.screen = 'module';
    startRound();
  }

  /* ---- 一輪 10 題：玩完才把分數交給平台 ---- */
  function startRound() {
    state.roundDone = false;
    state.score = 0;
    newProblem();
  }
  function finishRound() {
    state.roundDone = true;
    reportScore(state.score);
  }
  // 平台的 iframe 用 postMessage 收分；不在平台裡就自然略過
  function reportScore(score) {
    try {
      if (!window.parent || window.parent === window) return;
      const origin = location.origin === 'null' ? '*' : location.origin;
      window.parent.postMessage({ type: 'game-score', score: score }, origin);
    } catch (err) { /* 忽略 */ }
  }
  function goHome() {
    clearGhosts();
    state.screen = 'home';
    if (isImmersive()) exitImmersive();
    renderScreen();
  }
  function undo() {
    if (committing) return;
    if (state.history.length === 0) { flash('沒有可以退回的步驟了。', true); return; }
    state.eq = state.history.pop();
    state.steps.pop();
    state.solved = checkSolved();
    renderScreen();
  }
  function resetProblem() {
    clearGhosts();
    if (!state.initialEq) return;
    state.eq = { L: state.initialEq.L, R: state.initialEq.R };
    state.history = [];
    state.steps = [{ L: state.initialEq.L, R: state.initialEq.R }];
    state.solved = null;
    renderScreen();
    showDefaultStatus();
  }
  function setDifficulty(d) {
    state.difficulty = d;
    newProblem();
  }

  function checkSolved() {
    if (state.module === 'solve') return M.solvedNumber(state.eq, 'x');
    return M.isolated(state.eq, state.subject);
  }

  /* ---------------- 拖動 ---------------- */
  let drag = null;
  let committing = false; // 這一步正在播「消失／落地」動畫，先不接受新的拖動

  function buildChipContent(unit, flipped) {
    const w = el('span', 'chip-content');
    if (unit.kind === 'term') {
      const negative = (unit.sign === -1) !== flipped;
      w.appendChild(opSpan(negative ? '-' : '+'));
      w.appendChild(renderNode(unit.node));
    } else if (unit.kind === 'factor') {
      w.appendChild(opSpan(flipped ? '÷' : '×'));
      w.appendChild(unit.coef !== undefined ? renderNum(unit.coef) : renderNode(unit.node));
    } else { // denominator
      w.appendChild(opSpan(flipped ? '×' : '÷'));
      w.appendChild(renderNode(unit.node));
    }
    return w;
  }

  function onPointerDown(e) {
    if (state.screen !== 'module') return;
    if (state.roundDone) return;
    if (committing) return;
    if (e.button !== undefined && e.button !== 0) return;
    const t = e.target;
    const du = t.closest ? t.closest('.drag-unit') : null;
    if (du) {
      const sideEl = du.closest('.side');
      startDrag(e, du.__unit, sideEl.dataset.side, du);
    } else {
      const leaf = t.closest ? t.closest('.m-num,.m-var,.m-coef,.m-op,.m-prod,.m-sum,.frac,.paren-group,.paren-inner') : null;
      if (leaf) shake(leaf);
    }
  }

  function startDrag(e, unit, fromSide, sourceEl) {
    e.preventDefault();
    const chip = el('div', 'chip');
    // 积木比公式大一点，拿在手上像一块砖
    const eqEl = $('eq');
    const eqFont = eqEl ? parseFloat(getComputedStyle(eqEl).fontSize) : 48;
    chip.style.fontSize = Math.round((eqFont || 48) * 1.32) + 'px';
    chip.appendChild(buildChipContent(unit, false));
    document.body.appendChild(chip);
    drag = { unit, fromSide, chip, sourceEl, crossed: false, op: signOf(sourceEl) };
    positionChip(chip, e.clientX, e.clientY);
    sourceEl.classList.add('drag-source');
    // 加減號屬於這一項，跟著一起淡
    if (drag.op) drag.op.classList.add('op-dim');
    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', onDragUp, { once: true });
    window.addEventListener('pointercancel', onDragCancel, { once: true });
  }
  function positionChip(chip, x, y) {
    // 积木浮在手指上方，避免被手指遮住；贴边时自动收进可视区
    const w = chip.offsetWidth || 80;
    const h = chip.offsetHeight || 80;
    const vw = window.innerWidth || 1024;
    const vh = window.innerHeight || 768;
    let tx = x + 16;
    let ty = y - h - 16;
    if (ty < 8) ty = y + 26;
    if (ty + h > vh - 8) ty = vh - h - 8;
    if (tx + w > vw - 8) tx = vw - w - 8;
    if (tx < 8) tx = 8;
    chip.style.transform = 'translate(' + tx + 'px,' + ty + 'px) rotate(-3deg)';
  }
  function onDragMove(e) {
    if (!drag) return;
    positionChip(drag.chip, e.clientX, e.clientY);
    const eqSign = document.querySelector('#eq .eq-sign');
    if (!eqSign) return;
    const rect = eqSign.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const crossed = drag.fromSide === 'L' ? e.clientX > cx : e.clientX < cx;
    if (crossed !== drag.crossed) {
      drag.crossed = crossed;
      drag.chip.classList.toggle('crossed', crossed);
      drag.chip.innerHTML = '';
      const content = buildChipContent(drag.unit, crossed);
      drag.chip.appendChild(content);
      content.classList.add('flip');
    }
  }
  function onDragUp() {
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', onDragUp);
    window.removeEventListener('pointercancel', onDragCancel);
    if (!drag) return;
    const d = drag; drag = null;
    if (d.crossed) commitMove(d);
    else cancelDrag(d);
  }
  function onDragCancel() {
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', onDragUp);
    if (drag) { cancelDrag(drag); drag = null; }
  }
  function cancelDrag(d) {
    d.sourceEl.classList.remove('drag-source');
    if (d.op) d.op.classList.remove('op-dim');
    d.chip.style.opacity = '0';
    setTimeout(() => d.chip.remove(), 160);
  }
  /* ---------------- 離場／落點動畫 ---------------- */
  // 計算 AST 裡有幾層括號，用來判斷這一步會不會把括號拆掉
  function countParens(node) {
    if (!node) return 0;
    switch (node.type) {
      case 'paren': return 1 + countParens(node.a);
      case 'prod': return node.factors.reduce((s, f) => s + countParens(f), 0);
      case 'sum': return node.terms.reduce((s, t) => s + countParens(t.node), 0);
      case 'frac': return countParens(node.num) + countParens(node.den);
      default: return 0;
    }
  }

  // 把要消失的那一塊複製成「殘影」，在原位置縮小飘走
  function ghostFrom(srcEl) {
    const r = srcEl.getBoundingClientRect();
    const cs = getComputedStyle($('eq'));
    const g = document.createElement('div');
    g.className = 'ghost';
    g.style.left = r.left + 'px';
    g.style.top = r.top + 'px';
    g.style.fontFamily = cs.fontFamily;
    g.style.fontSize = cs.fontSize;
    g.style.lineHeight = cs.lineHeight;
    g.style.letterSpacing = cs.letterSpacing;
    g.innerHTML = srcEl.outerHTML;
    const inner = g.firstElementChild;
    if (inner) {
      inner.classList.remove('drag-source');
      inner.style.visibility = '';
    }
    document.body.appendChild(g);
    // 殘影自己收工（重繪之後仍讓它把動畫播完）
    g.addEventListener('animationend', () => g.remove(), { once: true });
    setTimeout(() => g.remove(), 600);
    return g;
  }

  function clearGhosts() {
    document.querySelectorAll('.ghost').forEach((g) => g.remove());
  }

  // 一項的正負號是「屬於這一項的」，記在它前面的 .m-op 上
  function signOf(el) {
    const prev = el.previousElementSibling;
    return prev && prev.classList.contains('m-op') ? prev : null;
  }

  // 重繪之前，先演一次「什麼東西不見了」
  function playLeaving(d, next) {
    const srcEl = document.querySelector('#eq .side[data-side="' + d.fromSide + '"]');
    const srcNode = d.fromSide === 'L' ? state.eq.L : state.eq.R;
    const nextSrc = d.fromSide === 'L' ? next.L : next.R;
    if (!srcEl) return;

    // 1) 被移走的那一塊：殘影縮小、往上飘、淡出
    if (d.sourceEl) {
      ghostFrom(d.sourceEl);
      d.sourceEl.classList.remove('drag-source');
      d.sourceEl.style.visibility = 'hidden';
      // 它前面的加減號也一起走，否則會留下一個孤零零的「-」
      const op = signOf(d.sourceEl);
      if (op) {
        op.classList.remove('op-dim');
        op.classList.add('op-leaving');
      }
    }

    // 2) 括號被拆掉：左右括號各自往外散開再淡出
    if (countParens(nextSrc) < countParens(srcNode)) {
      const groups = Array.prototype.slice.call(srcEl.querySelectorAll('.paren-group'));
      const outer = groups.filter((g) => !(g.parentElement && g.parentElement.closest('.paren-group')));
      (outer.length ? outer : groups).forEach((g) => g.classList.add('paren-leaving'));
    }

    // 3) 分數被拆掉：分數線與分母一起淡出
    if (srcNode.type === 'frac' && nextSrc.type !== 'frac') {
      const f = srcEl.querySelector('.frac');
      if (f) f.classList.add('frac-leaving');
    }
  }

  // 撞擊點爆一圈光環
  function spawnBurst(x, y) {
    const wrap = document.createElement('div');
    wrap.className = 'burst-wrap';
    wrap.style.left = x + 'px';
    wrap.style.top = y + 'px';
    wrap.innerHTML = '<span class="ring"></span><span class="ring r2"></span><span class="dot"></span>';
    document.body.appendChild(wrap);
    setTimeout(() => wrap.remove(), 900);
  }

  /* 一整個步驟＝一場小化學反應：
   *   積木飛向對面 → 對面那一邊升起來接 → 撞上（光環／擠壓）
   *   → 算出結果重繪 → 新的結果從高處「落回」等式位置
   */
  const LIFT_AT = 300;      // 對面開始升起的時間（讓「見到你飛來才升起來」）
  const LIFT_PX = 28;       // 升起的幅度（要和 CSS .side.lift 的 translateY 一致）
  const FLY_MS = 500;       // 積木飛到對面的時間
  const IMPACT_HOLD = 200;  // 撞上後停一下，讓學生看清楚
  const REACTION_MS = FLY_MS + IMPACT_HOLD;

  // 撞擊點：對面那一邊「最可能吸收這次變化」的那一塊（優先數字），沒有就用整邊中心
  function impactCenter(dstEl) {
    if (!dstEl) return null;
    const units = Array.prototype.slice.call(dstEl.querySelectorAll('.drag-unit'));
    const numeric = units.filter((u) => /^\d/.test(u.textContent.trim()));
    const el = numeric[0] || dstEl;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function commitMove(d) {
    const toSide = d.fromSide === 'L' ? 'R' : 'L';
    const dstEl = document.querySelector('#eq .side[data-side="' + toSide + '"]');
    const eqSign = document.querySelector('#eq .eq-sign');

    // 先算出結果：重繪之前就要知道哪一塊會消失
    let next;
    try {
      next = M.applyMove(state.eq, d.fromSide, d.unit);
    } catch (err) {
      d.chip.remove();
      flash('這一步無法計算。', true);
      return;
    }

    // 撞擊點＝對面那一塊「升起來之後」的上方（不要完全蓋住它，才看得到兩個撞在一起）
    const hit = impactCenter(dstEl);
    const signPos = eqSign ? eqSign.getBoundingClientRect() : null;
    const cw = d.chip.offsetWidth || 80;
    const ch = d.chip.offsetHeight || 80;
    // 積木飛到時會縮到 0.7，擺位要用「縮完之後」的尺寸算，否則會頂出畫布
    const CHIP_SCALE = 0.7;
    const cwv = cw * CHIP_SCALE;
    const chv = ch * CHIP_SCALE;
    let tx = 0;
    let ty = 0;
    let bx = 0;
    let by = 0;
    if (hit) {
      // 從上方斜斜壓下來，不要橫著掃過等號
      tx = hit.x - cwv * 0.12;
      ty = hit.y - LIFT_PX - chv * 0.62;
      bx = hit.x - cwv * 0.02;
      by = hit.y - LIFT_PX - chv * 0.18;
    } else if (signPos) {
      tx = signPos.left + signPos.width / 2 - cw / 2;
      ty = signPos.top + signPos.height / 2 - ch / 2;
      bx = tx + cw / 2;
      by = ty + ch / 2;
    }

    committing = true;
    playLeaving(d, next);

    // 1) 積木飛過去，一邊飛一邊縮
    d.chip.style.transition = 'transform ' + FLY_MS + 'ms cubic-bezier(.45, 0, .35, 1), opacity .12s ease';
    d.chip.style.transform = 'translate(' + (tx - cw / 2) + 'px,' + (ty - ch / 2) + 'px) scale(' + CHIP_SCALE + ') rotate(0deg)';

    // 2) 對面那一邊升起來準備接
    setTimeout(() => {
      if (!dstEl) return;
      void dstEl.offsetWidth;
      dstEl.classList.add('lift');
    }, LIFT_AT);

    // 3) 撞上
    setTimeout(() => {
      d.chip.style.opacity = '0';
      if (dstEl) {
        dstEl.classList.remove('lift');
        dstEl.classList.add('clash');
      }
      spawnBurst(bx, by);
    }, FLY_MS);

    // 4) 算出結果 → 重繪 → 新的結果落回位置
    setTimeout(() => {
      d.chip.remove();
      state.history.push({ L: state.eq.L, R: state.eq.R });
      state.eq = next;
      state.steps.push({ L: next.L, R: next.R });
      const wasSolved = state.solved;
      state.solved = checkSolved();
      if (!wasSolved && state.solved) {
        state.score += 1;
        if (state.score >= ROUND_TOTAL) finishRound();
      }
      renderScreen();

      const landed = document.querySelector('#eq .side[data-side="' + toSide + '"]');
      if (landed) {
        landed.classList.add('drop');
        setTimeout(() => landed.classList.remove('drop'), 480);
      }
      const apart = document.querySelector('#eq .side[data-side="' + d.fromSide + '"]');
      if (apart) {
        apart.classList.add('appear');
        setTimeout(() => apart.classList.remove('appear'), 380);
      }
      committing = false;
    }, REACTION_MS);
  }
  function shake(leaf) {
    leaf.classList.remove('shake');
    void leaf.offsetWidth;
    leaf.classList.add('shake');
    setTimeout(() => leaf.classList.remove('shake'), 420);
    flash('此項現在無法拖動（它還不是最外層的項）。', true);
  }

  /* ---------------- 全屏（專注）模式 ---------------- */
  const root = document.documentElement;
  function isImmersive() { return root.classList.contains('immersive'); }
  // 平台（天天游戲）會在同一份文件加上 .dsh-embed
  function isEmbedded() { return root.classList.contains('dsh-embed'); }

  function syncFullscreenUI() {
    const on = isImmersive();
    const fs = $('btn-fs');
    if (fs) {
      fs.textContent = on ? '退出' : '全屏';
      fs.setAttribute('aria-label', on ? '退出全屏' : '全屏模式');
      fs.setAttribute('title', on ? '退出全屏' : '全屏模式');
      fs.classList.toggle('active', on);
    }
    const st = $('btn-steps');
    if (st) st.classList.toggle('hidden', !(on || isEmbedded()));
  }

  function exitImmersive() {
    root.classList.remove('immersive', 'steps-open');
    syncFullscreenUI();
    try {
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen();
    } catch (err) { /* 忽略 */ }
  }

  function toggleFullscreen() {
    if (isImmersive()) { exitImmersive(); return; }
    root.classList.add('immersive');
    syncFullscreenUI();
    flash('全屏模式：再按右上角按鈕或 Esc 可退出。');
    // iPad Safari 不支援元素全屏，失敗就沿用 CSS 全屏
    try {
      const req = root.requestFullscreen || root.webkitRequestFullscreen;
      if (req) {
        const p = req.call(root, { navigationUI: 'hide' });
        if (p && p.catch) p.catch(() => {});
      }
    } catch (err) { /* 沿用 CSS 全屏 */ }
  }

  function toggleSteps() {
    root.classList.toggle('steps-open');
  }
  function closeSteps() {
    root.classList.remove('steps-open');
  }

  /* ---------------- 事件綁定 ---------------- */
  function bind() {
    document.querySelectorAll('.card').forEach((c) => {
      c.addEventListener('click', () => startModule(c.dataset.module));
    });
    $('btn-back').addEventListener('click', goHome);
    $('btn-undo').addEventListener('click', undo);
    $('btn-reset').addEventListener('click', resetProblem);
    $('btn-next').addEventListener('click', newProblem);
    const again = $('btn-again');
    if (again) again.addEventListener('click', startRound);
    $('btn-fs').addEventListener('click', toggleFullscreen);
    $('btn-steps').addEventListener('click', toggleSteps);
    const stepsClose = $('btn-steps-close');
    if (stepsClose) stepsClose.addEventListener('click', closeSteps);
    const backdrop = $('drawer-backdrop');
    if (backdrop) backdrop.addEventListener('click', closeSteps);
    document.querySelectorAll('#difficulty button').forEach((b) => {
      b.addEventListener('click', () => setDifficulty(Number(b.dataset.diff)));
    });
    $('eq').addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isImmersive()) exitImmersive();
    });
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement && isImmersive()) exitImmersive();
    });
  }

  /* ---------------- 背景裝飾 ---------------- */
  function decorBackground() {
    const host = document.getElementById('bg-decor');
    if (!host) return;
    const symbols = ['+', '-', '×', '÷', '=', 'x', '(', ')', '·'];
    for (let i = 0; i < 16; i++) {
      const s = el('span', 'fl');
      s.textContent = symbols[i % symbols.length];
      s.style.left = (2 + Math.random() * 94) + '%';
      s.style.top = (2 + Math.random() * 90) + '%';
      s.style.fontSize = (18 + Math.random() * 44) + 'px';
      s.style.animationDuration = (9 + Math.random() * 11) + 's';
      s.style.animationDelay = (Math.random() * -14) + 's';
      s.style.opacity = (0.05 + Math.random() * 0.07).toFixed(3);
      host.appendChild(s);
    }
  }

  /* ---------------- 啟動 ---------------- */
  decorBackground();
  renderIcons();
  bind();
  if (FORCED_MODULE) {
    // 單一模式的遊戲卡：不顯示首頁，也不給「返回」
    document.body.classList.add('solo');
    startModule(FORCED_MODULE);
  } else {
    renderScreen();
  }
})();
