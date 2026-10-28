export const MISSIONS = [
  {
    id: 'seal',
    title: '密封大作戰',
    subtitle: '空氣會從縫隙跑掉',
    concept: '把膠樽密封，空氣才會集中從出氣口衝出去；漏氣時，力量會從旁邊逃走。',
    target: 6,
    standard: { container: 's', nozzle: 'mid', pull: 0.9 },
    trials: [
      { key: 'leak', label: '未密封', note: '氣球膜沒有貼好', settings: { sealed: false } },
      { key: 'sealed', label: '密封', note: '所有縫隙都貼好', settings: { sealed: true } },
    ],
    prediction: {
      question: '哪一種空氣炮會吹熄較多蠟燭？',
      options: ['未密封', '密封'],
      correct: 1,
      explanation: '密封後，空氣不會從旁邊漏走，會集中從前方出氣口推出去。',
    },
    conclusion: {
      question: '公平測試的結果告訴我們甚麼？',
      options: [
        '漏氣的空氣炮更有力',
        '密封後，空氣集中，吹熄更多蠟燭',
        '密封與否沒有影響',
      ],
      correct: 1,
    },
  },
  {
    id: 'bottle',
    title: '大樽還是小樽？',
    subtitle: '更多空氣，更大的力量',
    concept: '在拉力、出氣口和密封程度相同時，較大的膠樽能裝較多空氣，推出較大的氣流。',
    target: 7,
    standard: { nozzle: 'mid', pull: 0.9, sealed: true },
    trials: [
      { key: 's', label: '500 mL 小膠樽', note: '空氣較少', settings: { container: 's' } },
      { key: 'l', label: '1.5 L 大膠樽', note: '空氣較多', settings: { container: 'l' } },
    ],
    prediction: {
      question: '哪一個膠樽會吹熄較多蠟燭？',
      options: ['小膠樽', '大膠樽'],
      correct: 1,
      explanation: '大膠樽裝的空氣較多，其他條件相同時，推出的氣流也較大。',
    },
    conclusion: {
      question: '這是一個公平測試，因為我們只改變了甚麼？',
      options: ['膠樽大小', '拉力', '出氣口大小'],
      correct: 0,
    },
  },
  {
    id: 'nozzle',
    title: '出氣口的秘密',
    subtitle: '集中與分散的取捨',
    concept: '出氣口太小，空氣集中但量少；太大，空氣多但散開。大約 6 厘米的「剛剛好」最能推動遠處蠟燭。',
    target: 7,
    standard: { container: 'l', pull: 0.9, sealed: true },
    trials: [
      { key: 'small', label: '細出氣口', note: '集中，但空氣量少', settings: { nozzle: 'small' } },
      { key: 'mid', label: '剛剛好（約 6 厘米）', note: '集中又有足夠空氣', settings: { nozzle: 'mid' } },
      { key: 'big', label: '大出氣口', note: '空氣多，但容易散開', settings: { nozzle: 'big' } },
    ],
    prediction: {
      question: '哪一種出氣口最有效？',
      options: ['細出氣口', '剛剛好', '大出氣口'],
      correct: 1,
      explanation: '「剛剛好」把空氣集中成一個有力的氣圈；太大會散開，太小則空氣量不足。',
    },
    conclusion: {
      question: '為甚麼太大的出氣口反而較弱？',
      options: [
        '空氣被分散，氣流變弱',
        '大出氣口完全沒有空氣',
        '大出氣口會把蠟燭吹得更遠',
      ],
      correct: 0,
    },
  },
  {
    id: 'pull',
    title: '拉得越用力？',
    subtitle: '力越大，空氣走得越快',
    concept: '在同一個膠樽和出氣口下，把氣球膜拉得越用力，空氣被推得越快，氣流也越有力。',
    target: 7,
    standard: { container: 'l', nozzle: 'mid', sealed: true },
    trials: [
      { key: 'soft', label: '輕輕拉', note: '力度 30%', settings: { pull: 0.3 } },
      { key: 'hard', label: '用力拉', note: '力度 90%', settings: { pull: 0.9 } },
    ],
    prediction: {
      question: '哪一次會吹熄較多蠟燭？',
      options: ['輕輕拉', '用力拉'],
      correct: 1,
      explanation: '用力拉會讓氣球膜快速回彈，把空氣推得更快，氣流更有力。',
    },
    conclusion: {
      question: '為甚麼要控制其他條件不變？',
      options: [
        '這樣才知道結果是由拉力改變造成',
        '這樣比較好玩',
        '這樣空氣會消失',
      ],
      correct: 0,
    },
  },
  {
    id: 'challenge',
    title: '側風挑戰',
    subtitle: '對準被風吹高的氣圈',
    concept: '空氣炮不是只有「大力」就好。風會把氣圈推高，所以要向下瞄準，讓氣圈回到蠟燭的位置。',
    target: 7,
    standard: { container: 'box', nozzle: 'mid', pull: 0.9, sealed: true },
    wind: 1,
    attempts: 2,
    prediction: {
      question: '風從下方把氣圈推高，蠟燭那邊的氣圈會怎樣？',
      options: ['偏上', '偏下', '完全不變'],
      correct: 0,
      explanation: '風把氣圈向上推，所以氣圈會偏上；要把瞄準往下調，讓它回到蠟燭中間。',
    },
  },
];

export function missionAt(index) {
  return MISSIONS[Math.max(0, Math.min(MISSIONS.length - 1, index))];
}
