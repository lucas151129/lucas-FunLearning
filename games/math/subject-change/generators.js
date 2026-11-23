/* =============================================================
 * generators.js — 題目產生器（解方程 & 主項變換）
 * 依賴 window.MathCore（math.js）
 * 每個產生器回傳 { subject, L, R }，L/R 已 normalize。
 * ============================================================= */
(function (global) {
  'use strict';
  const M = (typeof module !== 'undefined' && module.exports) ? require('./math.js') : global.MathCore;

  function ri(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function nonzero(min, max) { let v = 0; while (v === 0) v = ri(min, max); return v; }
  function signOf() { return Math.random() < 0.5 ? 1 : -1; }

  const n = M.num;
  const v = M.varNode;
  function cv(c, name) { return c === 1 ? v(name) : M.mul(n(c), v(name)); }
  function norm(node) { return M.normalize(node); }

  function retry(build, tries) {
    tries = tries || 60;
    for (let i = 0; i < tries; i++) {
      const r = build();
      if (r) return r;
    }
    return build(); // 最後一次直接回傳
  }

  /* ============ 解方程（一元一次，變數 x） ============ */

  // 簡單：ax + s·b = c  （s=±1）
  function solveSimple() {
    return retry(() => {
      const a = ri(1, 4);
      const k = nonzero(-9, 9);
      const b = nonzero(1, 9);
      const s = signOf();
      const c = a * k + s * b;
      if (c === 0 || Math.abs(c) > 30) return null;
      const L = norm(M.add(cv(a, 'x'), s === 1 ? n(b) : M.neg(n(b))));
      const R = n(c);
      return { subject: 'x', L, R };
    });
  }

  // 中等：ax + b = cx + d （x 在兩邊）
  function solveBothSides() {
    return retry(() => {
      const a = ri(1, 5);
      let c = ri(1, 5);
      if (c === a) c = (c % 5) + 1;
      const k = nonzero(-9, 9);
      const b = nonzero(-9, 9);
      const d = (a - c) * k + b;
      if (d === 0 || Math.abs(d) > 40) return null;
      const L = norm(M.add(cv(a, 'x'), n(b)));
      const R = norm(M.add(cv(c, 'x'), n(d)));
      return { subject: 'x', L, R };
    });
  }

  // 中等：a(x + s·b) = c
  function solveBracket() {
    return retry(() => {
      const a = ri(2, 5);
      const b = nonzero(1, 8);
      const s = signOf();
      const k = nonzero(-8, 8);
      const c = a * (k + s * b);
      if (c === 0 || Math.abs(c) > 40) return null;
      const L = norm(M.mul(n(a), M.paren(M.add(v('x'), s === 1 ? n(b) : M.neg(n(b))))));
      const R = n(c);
      return { subject: 'x', L, R };
    });
  }

  // 中等：a(x + s·b) = c·x + d
  function solveBracketBoth() {
    return retry(() => {
      const a = ri(2, 4);
      const b = nonzero(1, 8);
      const s = signOf();
      let c = ri(1, 4);
      if (c === a) c = (c % 4) + 1;
      const k = nonzero(-8, 8);
      const d = (a - c) * k - a * s * b;
      if (d === 0 || Math.abs(d) > 40) return null;
      const L = norm(M.mul(n(a), M.paren(M.add(v('x'), s === 1 ? n(b) : M.neg(n(b))))));
      const R = norm(M.add(cv(c, 'x'), n(d)));
      return { subject: 'x', L, R };
    });
  }

  // 中等：分數 (x + s·b)/a = c
  function solveFractionSimple() {
    return retry(() => {
      const a = ri(2, 6);
      const b = nonzero(1, 9);
      const s = signOf();
      const k = nonzero(-8, 8);
      const c = (k + s * b) / a;
      if (!Number.isInteger(c) || c === 0 || Math.abs(c) > 9) return null;
      const L = norm(M.div(M.add(v('x'), s === 1 ? n(b) : M.neg(n(b))), n(a)));
      const R = n(c);
      return { subject: 'x', L, R };
    });
  }

  // 困難：分數 (a·x + b)/c = d
  function solveFractionCoef() {
    return retry(() => {
      const a = ri(1, 3);
      const c = ri(2, 5);
      const d = nonzero(-6, 6);
      const k = nonzero(-8, 8);
      const b = c * d - a * k;
      if (b === 0 || Math.abs(b) > 20) return null;
      const L = norm(M.div(M.add(cv(a, 'x'), n(b)), n(c)));
      const R = n(d);
      return { subject: 'x', L, R };
    });
  }

  // 困難：ax = b（分數答案）
  function solveFractionAnswer() {
    return retry(() => {
      const q = ri(2, 4);
      const m = ri(1, 3);
      const p = nonzero(1, q * 2 - 1); // 1..(2q-1)，避免太大
      const a = q * m;
      const b = m * p;
      if (b === 0) return null;
      // 確保答案 p/q 已約分且非整數
      const g = (function gcd(x, y) { while (y) { const t = x % y; x = y; y = t; } return x; })(p, q);
      if (g !== 1) return null;
      const L = norm(cv(a, 'x'));
      const R = n(b);
      return { subject: 'x', L, R };
    });
  }

  const SOLVE_TIERS = {
    1: [solveSimple],
    2: [solveBothSides, solveBracket, solveFractionSimple],
    3: [solveFractionCoef, solveFractionAnswer, solveBracketBoth, solveBothSides]
  };

  function genSolve(difficulty) {
    const tier = SOLVE_TIERS[difficulty] || SOLVE_TIERS[2];
    const fn = pick(tier);
    return fn();
  }

  /* ============ 主項變換 ============ */

  // 簡單：y = a·x + s·b（以 x 為主項）
  function subjLinear() {
    const a = ri(2, 6);
    const b = nonzero(1, 9);
    const s = signOf();
    return {
      subject: 'x',
      L: v('y'),
      R: norm(M.add(cv(a, 'x'), s === 1 ? n(b) : M.neg(n(b))))
    };
  }

  // 簡單（物理）：V = I·R
  function subjVIR() {
    const target = pick(['I', 'R']);
    return { subject: target, L: v('V'), R: norm(M.mul(v('I'), v('R'))) };
  }
  // 簡單（物理）：F = m·a
  function subjFma() {
    const target = pick(['m', 'a']);
    return { subject: target, L: v('F'), R: norm(M.mul(v('m'), v('a'))) };
  }
  // 簡單（物理）：s = v·t
  function subjSvt() {
    const target = pick(['v', 't']);
    return { subject: target, L: v('s'), R: norm(M.mul(v('v'), v('t'))) };
  }

  // 中等：y = a(x + s·b)
  function subjBracket() {
    const a = ri(2, 4);
    const b = nonzero(1, 6);
    const s = signOf();
    return {
      subject: 'x',
      L: v('y'),
      R: norm(M.mul(n(a), M.paren(M.add(v('x'), s === 1 ? n(b) : M.neg(n(b))))))
    };
  }
  // 中等：y = (x + s·b)/a
  function subjFraction() {
    const a = ri(2, 5);
    const b = nonzero(1, 9);
    const s = signOf();
    return {
      subject: 'x',
      L: v('y'),
      R: norm(M.div(M.add(v('x'), s === 1 ? n(b) : M.neg(n(b))), n(a)))
    };
  }
  // 中等（物理）：v = u + a·t
  function subjVuat() {
    const target = pick(['u', 'a', 't']);
    return { subject: target, L: v('v'), R: norm(M.add(v('u'), M.mul(v('a'), v('t')))) };
  }
  // 中等（物理）：P = 2(l + w)
  function subjP2lw() {
    const target = pick(['l', 'w']);
    return { subject: target, L: v('P'), R: norm(M.mul(n(2), M.paren(M.add(v('l'), v('w'))))) };
  }

  // 困難：y = (a·x + b)/c
  function subjFractionCoef() {
    const a = ri(2, 4);
    const b = nonzero(1, 9);
    const s = signOf();
    const c = ri(2, 5);
    return {
      subject: 'x',
      L: v('y'),
      R: norm(M.div(M.add(cv(a, 'x'), s === 1 ? n(b) : M.neg(n(b))), n(c)))
    };
  }
  // 困難（物理）：a = (v - u)/t
  function subjAvut() {
    const target = pick(['v', 'u', 't']);
    return { subject: target, L: v('a'), R: norm(M.div(M.sub(v('v'), v('u')), v('t'))) };
  }
  // 困難（物理）：A = b·h/2
  function subjAbh() {
    const target = pick(['b', 'h']);
    return { subject: target, L: v('A'), R: norm(M.div(M.mul(v('b'), v('h')), n(2))) };
  }

  const SUBJ_TIERS = {
    1: [subjLinear, subjVIR, subjFma, subjSvt],
    2: [subjBracket, subjFraction, subjVuat, subjP2lw],
    3: [subjFractionCoef, subjAvut, subjAbh, subjBracket]
  };

  function genSubject(difficulty) {
    const tier = SUBJ_TIERS[difficulty] || SUBJ_TIERS[2];
    const fn = pick(tier);
    return fn();
  }

  const api = { genSolve, genSubject, SOLVE_TIERS, SUBJ_TIERS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.Generators = api;
})(typeof window !== 'undefined' ? window : globalThis);
