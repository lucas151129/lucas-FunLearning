/* =============================================================
 * math.js — 代數運算核心（純邏輯，無 DOM，支援多變數）
 *
 * 有理數 Rat = { n:int, d:int>0 }，已約分。
 *
 * 原始 AST（generator 輸出 / 內部建構）：
 *   num {v:Rat}   var {name}   neg {a}   add {a,b}   sub {a,b}
 *   mul {a,b}     div {a,b}    paren {a}
 *
 * 規範 AST（normalize 輸出）：
 *   num {v:Rat}   var {name}   prod {coef:Rat, factors:[node]}
 *   sum {terms:[{sign:1|-1, node}]}   frac {num, den}   paren {a}
 * ============================================================= */
(function (global) {
  'use strict';

  /* ---------------- 有理數 ---------------- */
  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { const t = a % b; a = b; b = t; }
    return a || 1;
  }
  function mkRat(n, d) {
    if (d === undefined) d = 1;
    if (d === 0) throw new Error('除數不能為零');
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d);
    return { n: n / g, d: d / g };
  }
  const ratZero = { n: 0, d: 1 };
  const ratOne = { n: 1, d: 1 };
  function ratAdd(a, b) { return mkRat(a.n * b.d + b.n * a.d, a.d * b.d); }
  function ratSub(a, b) { return mkRat(a.n * b.d - b.n * a.d, a.d * b.d); }
  function ratMul(a, b) { return mkRat(a.n * b.n, a.d * b.d); }
  function ratDiv(a, b) { if (b.n === 0) throw new Error('除數不能為零'); return mkRat(a.n * b.d, a.d * b.n); }
  function ratNeg(a) { return { n: -a.n, d: a.d }; }
  function ratAbs(a) { return { n: Math.abs(a.n), d: a.d }; }
  function ratIsZero(a) { return a.n === 0; }
  function ratIsOne(a) { return a.n === 1 && a.d === 1; }
  function ratIsInt(a) { return a.d === 1; }
  function ratToStr(a) { return a.d === 1 ? String(a.n) : a.n + '/' + a.d; }

  /* ---------------- 建構子（原始 AST） ---------------- */
  const num = (n) => ({ type: 'num', v: mkRat(n) });
  const varNode = (name) => ({ type: 'var', name });
  const neg = (a) => ({ type: 'neg', a });
  const add = (a, b) => ({ type: 'add', a, b });
  const sub = (a, b) => ({ type: 'sub', a, b });
  const mul = (a, b) => ({ type: 'mul', a, b });
  const div = (a, b) => ({ type: 'div', a, b });
  const paren = (a) => ({ type: 'paren', a });

  /* ---------------- normalize ---------------- */
  function normalize(node) {
    switch (node.type) {
      case 'num': return { type: 'num', v: node.v };
      case 'var': return { type: 'var', name: node.name };
      case 'neg': return negate(normalize(node.a));
      case 'add': return addN(normalize(node.a), normalize(node.b));
      case 'sub': return addN(normalize(node.a), negate(normalize(node.b)));
      case 'mul': return prodN(normalize(node.a), normalize(node.b));
      case 'div': return fracN(normalize(node.a), normalize(node.b));
      case 'paren': return { type: 'paren', a: normalize(node.a) };
      case 'sum': case 'prod': case 'frac': return node;
      default: return node;
    }
  }

  // 對「已規範」節點取負
  function negate(node) {
    switch (node.type) {
      case 'num': return { type: 'num', v: ratNeg(node.v) };
      case 'var': return { type: 'prod', coef: mkRat(-1), factors: [{ type: 'var', name: node.name }] };
      case 'prod': return { type: 'prod', coef: ratNeg(node.coef), factors: node.factors };
      case 'sum': return { type: 'sum', terms: node.terms.map(t => ({ sign: -t.sign, node: t.node })) };
      case 'frac': return { type: 'frac', num: negate(node.num), den: node.den };
      case 'paren': return { type: 'paren', a: negate(node.a) };
      default: return { type: 'neg', a: node };
    }
  }

  function addN(a, b) {
    const terms = [];
    collectTerms(a, 1, terms);
    collectTerms(b, 1, terms);
    return buildSum(terms);
  }
  function collectTerms(node, sign, terms) {
    if (node.type === 'sum') {
      for (const t of node.terms) collectTerms(t.node, sign * t.sign, terms);
      return;
    }
    if (node.type === 'paren') {
      collectTerms(node.a, sign, terms);
      return;
    }
    if (node.type === 'prod') {
      if (node.coef.n < 0) {
        terms.push({ sign: -sign, node: { type: 'prod', coef: ratAbs(node.coef), factors: node.factors } });
      } else {
        terms.push({ sign: sign, node: node });
      }
      return;
    }
    terms.push({ sign: sign, node: node });
  }

  // 若 node 是「係數 × 單一變數」，回傳 {name, coef}（帶號）；否則 null
  function linearInfo(node) {
    if (node.type === 'var') return { name: node.name, coef: ratOne };
    if (node.type === 'prod' && node.factors.length === 1 && node.factors[0].type === 'var') {
      return { name: node.factors[0].name, coef: node.coef };
    }
    if (node.type === 'frac' && node.den.type === 'num') {
      const inner = linearInfo(node.num);
      if (inner !== null) return { name: inner.name, coef: ratDiv(inner.coef, node.den.v) };
    }
    return null;
  }

  // 由係數 c（帶號，非零）建出「c × name」
  function varTerm(name, c) {
    if (ratIsInt(c)) {
      if (ratIsOne(c)) return { type: 'var', name };
      return { type: 'prod', coef: c, factors: [{ type: 'var', name }] };
    }
    const numPart = (c.n === 1)
      ? { type: 'var', name }
      : { type: 'prod', coef: mkRat(c.n), factors: [{ type: 'var', name }] };
    return { type: 'frac', num: numPart, den: { type: 'num', v: mkRat(c.d) } };
  }

  function buildSum(terms) {
    let constVal = ratZero;
    const varCoefs = new Map(); // name -> Rat
    const others = [];
    for (const t of terms) {
      const s = mkRat(t.sign);
      if (t.node.type === 'num') {
        constVal = ratAdd(constVal, ratMul(s, t.node.v));
      } else {
        const li = linearInfo(t.node);
        if (li !== null) {
          const cur = varCoefs.get(li.name) || ratZero;
          varCoefs.set(li.name, ratAdd(cur, ratMul(s, li.coef)));
        } else {
          others.push(t);
        }
      }
    }
    const result = [];
    for (const [name, coef] of varCoefs) {
      if (!ratIsZero(coef)) result.push({ sign: coef.n < 0 ? -1 : 1, node: varTerm(name, ratAbs(coef)) });
    }
    if (!ratIsZero(constVal)) result.push({ sign: constVal.n < 0 ? -1 : 1, node: { type: 'num', v: ratAbs(constVal) } });
    for (const o of others) result.push(o);

    if (result.length === 0) return { type: 'num', v: ratZero };
    if (result.length === 1) {
      return result[0].sign === 1 ? result[0].node : negate(result[0].node);
    }
    return { type: 'sum', terms: result };
  }

  function prodN(a, b) {
    const factors = [];
    let coef = ratOne;
    (function collect(x) {
      if (x.type === 'prod') { coef = ratMul(coef, x.coef); for (const f of x.factors) factors.push(f); }
      else if (x.type === 'num') { coef = ratMul(coef, x.v); }
      else factors.push(x);
    })(a);
    (function collect(x) {
      if (x.type === 'prod') { coef = ratMul(coef, x.coef); for (const f of x.factors) factors.push(f); }
      else if (x.type === 'num') { coef = ratMul(coef, x.v); }
      else factors.push(x);
    })(b);
    return buildProduct(coef, factors);
  }

  function buildProduct(coef, factors) {
    if (ratIsZero(coef)) return { type: 'num', v: ratZero };
    if (!ratIsInt(coef)) {
      return { type: 'frac', num: buildProduct(mkRat(coef.n), factors), den: { type: 'num', v: mkRat(coef.d) } };
    }
    const fs = factors;
    if (fs.length === 0) return { type: 'num', v: coef };
    if (fs.length === 1) return ratIsOne(coef) ? fs[0] : { type: 'prod', coef: coef, factors: fs };
    return { type: 'prod', coef: coef, factors: fs };
  }

  function fracN(a, b) {
    if (b.type === 'num' && b.v.n === 0) throw new Error('除數不能為零');
    // 分母為負 → 負號搬到分子
    if (b.type === 'num' && b.v.n < 0) {
      return fracN(negate(a), { type: 'num', v: ratAbs(b.v) });
    }
    if (a.type === 'num' && b.type === 'num') return { type: 'num', v: ratDiv(a.v, b.v) };
    if (a.type === 'prod' && b.type === 'num') {
      const q = ratDiv(a.coef, b.v);
      if (ratIsInt(q)) return buildProduct(q, a.factors);
    }
    return { type: 'frac', num: a, den: b };
  }

  // 頂層多餘括號拆掉（只有「整個式子被括住」時才拆）
  function unwrapTop(node) {
    while (node.type === 'paren') node = node.a;
    return node;
  }

  /* ---------------- 變數與判定 ---------------- */
  function hasVar(node, name) {
    switch (node.type) {
      case 'var': return node.name === name;
      case 'num': return false;
      case 'prod': return node.factors.some(f => hasVar(f, name));
      case 'sum': return node.terms.some(t => hasVar(t.node, name));
      case 'frac': return hasVar(node.num, name) || hasVar(node.den, name);
      case 'paren': return hasVar(node.a, name);
      default: return false;
    }
  }
  function isConstant(node) { return node.type === 'num'; }

  // 解方程：name = 常數
  function solvedNumber(eq, name) {
    if (eq.L.type === 'var' && eq.L.name === name && isConstant(eq.R)) return { value: eq.R.v };
    if (eq.R.type === 'var' && eq.R.name === name && isConstant(eq.L)) return { value: eq.L.v };
    return null;
  }
  // 主項變換：name 已單獨在一邊，另一邊不含 name
  function isolated(eq, name) {
    if (eq.L.type === 'var' && eq.L.name === name && !hasVar(eq.R, name)) return { expr: eq.R };
    if (eq.R.type === 'var' && eq.R.name === name && !hasVar(eq.L, name)) return { expr: eq.L };
    return null;
  }

  /* ---------------- 可拖動單元 ---------------- */
  function draggables(node) {
    if (node.type === 'sum') {
      return node.terms.map((t, i) => ({ kind: 'term', sign: t.sign, idx: i, node: t.node }));
    }
    if (node.type === 'prod') {
      const list = [];
      if (!ratIsOne(node.coef)) list.push({ kind: 'factor', coef: node.coef });
      node.factors.forEach((f, i) => list.push({ kind: 'factor', node: f, fidx: i }));
      return list;
    }
    if (node.type === 'frac') {
      return [{ kind: 'denominator', node: node.den }];
    }
    return [];
  }

  /* ---------------- 套用一次拖動 ---------------- */
  function applyMove(eq, fromSide, unit) {
    const isL = fromSide === 'L';
    const src = isL ? eq.L : eq.R;
    const dst = isL ? eq.R : eq.L;

    let srcAfter, dstAfter;
    if (unit.kind === 'term') {
      srcAfter = buildSum(src.terms.filter((_, i) => i !== unit.idx));
      dstAfter = addN(dst, unit.sign === -1 ? unit.node : negate(unit.node));
    } else if (unit.kind === 'factor') {
      if (unit.coef !== undefined) {
        srcAfter = buildProduct(ratOne, src.factors);
        dstAfter = fracN(dst, { type: 'num', v: unit.coef });
      } else {
        srcAfter = buildProduct(src.coef, src.factors.filter((_, i) => i !== unit.fidx));
        dstAfter = fracN(dst, unit.node);
      }
    } else if (unit.kind === 'denominator') {
      srcAfter = unwrapTop(src.num);
      dstAfter = prodN(dst, unit.node);
    } else {
      throw new Error('未知的拖動單元');
    }

    srcAfter = unwrapTop(normalize(srcAfter));
    dstAfter = unwrapTop(normalize(dstAfter));
    return isL ? { L: srcAfter, R: dstAfter } : { L: dstAfter, R: srcAfter };
  }

  /* ---------------- 供測試／除錯用的線性字串 ---------------- */
  function toStr(node) {
    switch (node.type) {
      case 'num': return ratToStr(node.v);
      case 'var': return node.name;
      case 'prod': return prodStr(node);
      case 'sum': return sumStr(node);
      case 'frac': return '(' + toStr(node.num) + ')/(' + toStr(node.den) + ')';
      case 'paren': return '(' + toStr(node.a) + ')';
      default: return '?';
    }
  }
  function prodStr(node) {
    let s = '';
    if (!ratIsOne(node.coef)) {
      if (node.coef.n === -1 && node.coef.d === 1 && node.factors.length >= 1) s = '-';
      else s = ratToStr(node.coef);
    }
    const fs = node.factors.map(f => {
      if (f.type === 'var') return f.name;
      if (f.type === 'sum' || f.type === 'frac' || f.type === 'prod') return '(' + toStr(f) + ')';
      return toStr(f);
    });
    return s + fs.join('·');
  }
  function sumStr(node) {
    let s = '';
    node.terms.forEach((t, i) => {
      const ts = toStr(t.node);
      if (i === 0) s += (t.sign === -1 ? '-' : '') + ts;
      else s += (t.sign === -1 ? ' - ' : ' + ') + ts;
    });
    return s;
  }

  const api = {
    mkRat, ratZero, ratOne, ratAdd, ratSub, ratMul, ratDiv, ratNeg, ratAbs,
    ratIsZero, ratIsOne, ratIsInt, ratToStr,
    num, varNode, neg, add, sub, mul, div, paren,
    normalize, negate, unwrapTop, linearInfo, varTerm,
    hasVar, isConstant, solvedNumber, isolated,
    draggables, applyMove, toStr
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.MathCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
