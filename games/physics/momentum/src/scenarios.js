export const SCENARIOS = {
  'perfectly-inelastic': {
    id: 'perfectly-inelastic',
    label: '完全非彈性',
    short: '黏在一起',
    kicker: 'PERFECTLY INELASTIC',
    accent: '#ff9b6a',
    preset: { m1: 2, m2: 3, u1: 4, u2: -2, e: 0, energy: 100 },
    description: '兩車碰撞後黏在一起，以同一個最終速度移動。',
    formula: 'm₁u₁ + m₂u₂ = (m₁ + m₂)v',
    concept:
      '動量仍然守恆，但動能不會守恆。完全非彈性碰撞是所有碰撞中動能損失最大的情況。',
    examTip:
      '文字題看到「黏在一起 / stick together / move with a common velocity」，就要用共同速度 v，並且只列一條動量守恆式。',
    prediction: {
      question: '碰撞後，兩車的運動是？',
      options: ['黏在一起，以共同速度移動', '各自反彈，速度不變', '一車停下，另一車繼續'],
      correct: 0,
      explanation: '完全非彈性碰撞的定義就是碰後共用速度；動量守恆，但部分動能轉為熱、聲和形變。',
    },
  },
  inelastic: {
    id: 'inelastic',
    label: '非彈性',
    short: '分開但能量損失',
    kicker: 'INELASTIC',
    accent: '#ffc56d',
    preset: { m1: 2, m2: 3, u1: 4, u2: -2, e: 0.55, energy: 100 },
    description: '兩車碰撞後分開，但部分動能轉為熱、聲和形變。',
    formula: 'm₁u₁ + m₂u₂ = m₁v₁ + m₂v₂',
    concept:
      '動量守恆，但動能不守恆。碰撞後兩車速度不同；e 介於 0 與 1 之間，e = 0 是完全非彈性，e = 1 是彈性。',
    examTip:
      '非彈性題通常會給你碰撞後其中一車的速度，再用動量守恆求另一車；若問能量損失，要另外計 KE，不要以為動量少了。',
    prediction: {
      question: '碰撞後，哪一句一定正確？',
      options: ['兩車分開，總動量仍守恆', '兩車一定黏在一起', '動能一定守恆'],
      correct: 0,
      explanation: '非彈性碰撞只保證動量守恆；動能會有一部分轉換成其他形式。',
    },
  },
  elastic: {
    id: 'elastic',
    label: '彈性',
    short: '動量與動能都守恆',
    kicker: 'ELASTIC',
    accent: '#5ff3ff',
    preset: { m1: 2, m2: 3, u1: 4, u2: -2, e: 1, energy: 100 },
    description: '碰撞後兩車分開，動量與動能都守恆。',
    formula: 'm₁u₁ + m₂u₂ = m₁v₁ + m₂v₂  ·  ½m₁u₁² + ½m₂u₂² = ½m₁v₁² + ½m₂v₂²',
    concept:
      '彈性碰撞同時守恆動量與動能。等質量時，兩車會交換速度；一般情況可用「分離速度 = 接近速度」快速檢查。',
    examTip:
      '彈性題通常要列兩條式：動量守恆 + 動能守恆（或相對速度反向）。不要只列動量就當成答案。',
    prediction: {
      question: '彈性碰撞中，哪一組量一定守恆？',
      options: ['動量與動能', '只有動量', '只有動能'],
      correct: 0,
      explanation: '彈性碰撞的定義就是沒有動能損失，因此動量與動能都守恆。',
    },
  },
  explosion: {
    id: 'explosion',
    label: '爆炸',
    short: '靜止分裂',
    kicker: 'EXPLOSION',
    accent: '#ff7bad',
    preset: { m1: 2, m2: 3, u1: 0, u2: 0, e: 0, energy: 100 },
    description: '靜止物體分裂成兩塊，碎片向相反方向運動。',
    formula: '0 = m₁v₁ + m₂v₂  ·  E = ½m₁v₁² + ½m₂v₂²',
    concept:
      '爆炸前總動量為零，爆炸後總動量仍為零；但化學能／彈性能轉成動能，所以總動能增加。',
    examTip:
      '爆炸題先寫「爆炸前總動量 = 0」，再令兩塊動量大小相等、方向相反；如果問能量，才是用 KE 公式。',
    prediction: {
      question: '爆炸後，兩塊碎片的總動能會怎樣？',
      options: ['增加，來自化學能／彈性能', '保持不變', '變為零'],
      correct: 0,
      explanation: '爆炸前總動量為零，爆炸後仍為零；但化學能／彈性能轉為動能，所以總動能增加。',
    },
  },
};

export const SCENARIO_ORDER = ['perfectly-inelastic', 'inelastic', 'elastic', 'explosion'];

export function scenarioFor(id) {
  return SCENARIOS[id] || SCENARIOS['perfectly-inelastic'];
}

export function defaultInputs(id) {
  return { ...scenarioFor(id).preset };
}
