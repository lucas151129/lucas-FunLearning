import { fmt, signed, solveCollision, solveExplosion } from './physics.js';

export const EXAM_TYPES = [
  { id: 'perfectly-inelastic', label: '完全非彈性' },
  { id: 'inelastic', label: '非彈性' },
  { id: 'elastic', label: '彈性' },
  { id: 'explosion', label: '爆炸' },
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function velocityText(value) {
  if (Math.abs(value) < 0.0001) return '靜止';
  return `${fmt(Math.abs(value), 1)} m/s ${value > 0 ? '向右' : '向左'}`;
}

function makeCollisionFields(v1, v2) {
  return [
    { id: 'v1', label: 'A 碰撞後速度 v₁', unit: 'm/s', answer: v1 },
    { id: 'v2', label: 'B 碰撞後速度 v₂', unit: 'm/s', answer: v2 },
  ];
}

function perfectlyInelasticQuestion() {
  let m1;
  let m2;
  let u1;
  let u2;
  let result;
  let guard = 0;

  do {
    m1 = randInt(2, 5);
    m2 = randInt(1, 4);
    u1 = randInt(4, 8);
    u2 = randInt(-3, 3);
    result = solveCollision({ m1, m2, u1, u2, e: 0 });
    guard += 1;
  } while (Math.abs(result.v1) < 0.35 && guard < 30);

  return {
    type: 'perfectly-inelastic',
    title: '完全非彈性碰撞',
    prompt:
      `質量 ${m1} kg 的台車 A 以 ${velocityText(u1)} 移動，` +
      `與質量 ${m2} kg 的台車 B（${velocityText(u2)}）發生完全非彈性碰撞。\n` +
      '碰撞後兩車黏在一起。取向右為正，求共同速度 v，以及碰撞損失的總動能。',
    fields: [
      { id: 'v', label: '共同速度 v', unit: 'm/s', answer: result.v1 },
      { id: 'loss', label: '動能損失', unit: 'J', answer: result.keLoss },
    ],
    steps: [
      '取向右為正。完全非彈性碰撞中，兩車碰後共用速度 v。',
      `動量守恆：(${m1})(${u1}) + (${m2})(${u2}) = (${m1} + ${m2})v`,
      `碰撞前總動量 = ${fmt(result.pBefore)} kg m/s，所以 v = ${fmt(result.pBefore)} ÷ ${m1 + m2} = ${fmt(result.v1)} m/s。`,
      `碰撞前動能 = ${fmt(result.keBefore)} J；碰撞後動能 = ${fmt(result.keAfter)} J；損失 = ${fmt(result.keLoss)} J。`,
    ],
    tip: '完全非彈性只保證動量守恆；不要用動能守恆求 v。',
  };
}

function inelasticQuestion() {
  let m1;
  let m2;
  let u1;
  let u2;
  let result;
  let guard = 0;

  do {
    m1 = randInt(2, 5);
    m2 = randInt(1, 4);
    u1 = randInt(4, 8);
    u2 = randInt(-2, 2);
    result = solveCollision({ m1, m2, u1, u2, e: 0.5 });
    guard += 1;
  } while (Math.abs(result.v1) < 0.25 && guard < 30);

  return {
    type: 'inelastic',
    title: '非彈性碰撞',
    prompt:
      `質量 ${m1} kg 的台車 A 以 ${velocityText(u1)} 移動，` +
      `與質量 ${m2} kg 的台車 B（${velocityText(u2)}）碰撞。\n` +
      `碰撞後 A 的速度為 ${signed(result.v1)} m/s（向右為正），兩車分開。\n` +
      '求 B 碰撞後的速度 v₂，以及碰撞損失的總動能。',
    fields: [
      { id: 'v2', label: 'B 碰撞後速度 v₂', unit: 'm/s', answer: result.v2 },
      { id: 'loss', label: '動能損失', unit: 'J', answer: result.keLoss },
    ],
    steps: [
      '取向右為正。兩車碰撞時間極短，外力可忽略，總動量守恆。',
      `動量守恆：(${m1})(${u1}) + (${m2})(${u2}) = (${m1})(${fmt(result.v1)}) + (${m2})v₂`,
      `v₂ = [${fmt(result.pBefore)} − (${m1})(${fmt(result.v1)})] ÷ ${m2} = ${fmt(result.v2)} m/s。`,
      `碰撞前動能 = ${fmt(result.keBefore)} J；碰撞後動能 = ${fmt(result.keAfter)} J；損失 = ${fmt(result.keLoss)} J。`,
    ],
    tip: '非彈性碰撞中動量守恆，但動能不守恆；先求速度，再另外計能量。',
  };
}

function elasticQuestion() {
  let m1;
  let m2;
  let u1;
  let u2;
  let result;
  let guard = 0;

  do {
    m1 = randInt(1, 4);
    m2 = randInt(1, 4);
    u1 = randInt(4, 8);
    u2 = randInt(-2, 2);
    result = solveCollision({ m1, m2, u1, u2, e: 1 });
    guard += 1;
  } while ((m1 === m2 || Math.abs(result.v1 - result.v2) < 0.2) && guard < 30);

  return {
    type: 'elastic',
    title: '彈性碰撞',
    prompt:
      `質量 ${m1} kg 的台車 A 以 ${velocityText(u1)} 移動，` +
      `與質量 ${m2} kg 的台車 B（${velocityText(u2)}）發生彈性碰撞。\n` +
      '取向右為正，求碰撞後 A 和 B 的速度 v₁、v₂。',
    fields: makeCollisionFields(result.v1, result.v2),
    steps: [
      '取向右為正。彈性碰撞同時守恆動量與動能。',
      `動量：(${m1})(${u1}) + (${m2})(${u2}) = (${m1})v₁ + (${m2})v₂`,
      `動能：½(${m1})(${u1})² + ½(${m2})(${u2})² = ½(${m1})v₁² + ½(${m2})v₂²`,
      `等價的分離速度條件：v₂ − v₁ = −(u₂ − u₁) = ${fmt(-(u2 - u1))} m/s。`,
      `解得 v₁ = ${fmt(result.v1)} m/s，v₂ = ${fmt(result.v2)} m/s；碰前後動能同為 ${fmt(result.keBefore)} J。`,
    ],
    tip: '彈性碰撞要兩條式；只列動量守恆會少一個條件。',
  };
}

function explosionQuestion() {
  let m1;
  let m2;
  let energy;
  let result;
  let guard = 0;

  do {
    m1 = randInt(2, 5);
    m2 = randInt(1, 4);
    energy = randInt(40, 160);
    result = solveExplosion({ m1, m2, energy });
    guard += 1;
  } while (Math.abs(result.v1) < 1 && guard < 30);

  const speedA = Math.abs(result.v1);
  const speedB = Math.abs(result.v2);

  return {
    type: 'explosion',
    title: '爆炸與動量守恆',
    prompt:
      `一個原本靜止的物體分裂成兩塊：A 的質量為 ${m1} kg，B 的質量為 ${m2} kg。\n` +
      `爆炸後 A 向左以 ${fmt(speedA, 1)} m/s 運動。取向右為正。\n` +
      '求 B 的速度 v₂，以及爆炸釋放的總動能。',
    fields: [
      { id: 'v2', label: 'B 的速度 v₂（向右為正）', unit: 'm/s', answer: result.v2 },
      { id: 'energy', label: '爆炸釋放的總動能', unit: 'J', answer: result.energyReleased },
    ],
    steps: [
      '爆炸前靜止，總動量 = 0；沒有外力，爆炸後總動量仍為 0。',
      `動量：0 = (${m1})(${signed(result.v1)}) + (${m2})v₂`,
      `v₂ = −(${m1})(${fmt(result.v1)}) ÷ ${m2} = ${fmt(result.v2)} m/s（向右）。`,
      `總動能 = ½(${m1})(${fmt(Math.abs(result.v1))})² + ½(${m2})(${fmt(speedB)})² = ${fmt(result.keAfter)} J。`,
    ],
    tip: '爆炸前後總動量都為零，但總動能增加；能量來自化學能／彈性能。',
  };
}

export function generateQuestion(type) {
  switch (type) {
    case 'inelastic':
      return inelasticQuestion();
    case 'elastic':
      return elasticQuestion();
    case 'explosion':
      return explosionQuestion();
    case 'perfectly-inelastic':
    default:
      return perfectlyInelasticQuestion();
  }
}

export function checkAnswers(question, values) {
  const results = question.fields.map((field, index) => {
    const raw = values[index];
    const parsed = Number(String(raw ?? '').replace(',', '.'));
    const tolerance = Math.max(0.09, Math.abs(field.answer) * 0.025);
    const correct =
      Number.isFinite(parsed) && Math.abs(parsed - field.answer) <= tolerance;
    const reversed =
      Number.isFinite(parsed) &&
      Math.abs(parsed + field.answer) <= tolerance &&
      Math.abs(field.answer) > 0.001;

    return {
      ...field,
      parsed,
      correct,
      reversed,
      tolerance,
      blank: String(raw ?? '').trim() === '',
    };
  });

  return {
    correct: results.every((result) => result.correct),
    results,
  };
}

export { velocityText };
