/* Traditional / Simplified Chinese support for 動量碰撞模擬器.
   All source copy is Traditional Chinese. The runtime converter keeps one
   source string per text node so switching back to Traditional is lossless. */

const LANG_KEY = 'momentum:lang';
const HANT = 'zh-Hant';
const HANS = 'zh-Hans';

/* Generated from the game's own text with OpenCC, plus common UI terms. */
const CHAR_MAP = {
  "並": "并",
  "來": "来",
  "係": "系",
  "個": "个",
  "價": "价",
  "內": "内",
  "兩": "两",
  "則": "则",
  "動": "动",
  "問": "问",
  "啟": "启",
  "單": "单",
  "塊": "块",
  "學": "学",
  "實": "实",
  "寫": "写",
  "對": "对",
  "導": "导",
  "庫": "库",
  "張": "张",
  "彈": "弹",
  "後": "后",
  "復": "复",
  "恆": "恒",
  "應": "应",
  "戲": "戏",
  "換": "换",
  "損": "损",
  "擊": "击",
  "據": "据",
  "擬": "拟",
  "數": "数",
  "於": "于",
  "時": "时",
  "會": "会",
  "條": "条",
  "極": "极",
  "樣": "样",
  "機": "机",
  "檢": "检",
  "氣": "气",
  "沒": "没",
  "況": "况",
  "測": "测",
  "準": "准",
  "瀏": "浏",
  "為": "为",
  "熱": "热",
  "牆": "墙",
  "現": "现",
  "畫": "画",
  "當": "当",
  "發": "发",
  "確": "确",
  "終": "终",
  "組": "组",
  "結": "结",
  "給": "给",
  "統": "统",
  "維": "维",
  "練": "练",
  "總": "总",
  "繩": "绳",
  "繼": "继",
  "續": "续",
  "義": "义",
  "習": "习",
  "聲": "声",
  "與": "与",
  "號": "号",
  "衝": "冲",
  "補": "补",
  "裡": "里",
  "覽": "览",
  "觀": "观",
  "計": "计",
  "訓": "训",
  "記": "记",
  "設": "设",
  "試": "试",
  "認": "认",
  "說": "说",
  "調": "调",
  "請": "请",
  "證": "证",
  "變": "变",
  "負": "负",
  "質": "质",
  "車": "车",
  "輸": "输",
  "轉": "转",
  "這": "这",
  "遊": "游",
  "運": "运",
  "遠": "远",
  "選": "选",
  "釋": "释",
  "錯": "错",
  "閉": "闭",
  "開": "开",
  "間": "间",
  "關": "关",
  "離": "离",
  "靜": "静",
  "須": "须",
  "預": "预",
  "題": "题",
  "額": "额",
  "顯": "显",
  "驗": "验",
  "驟": "骤",
  "體": "体",
  "點": "点",
  "簡": "简",
  "語": "语",
  "麼": "么",
  "甚": "什",
  "著": "着",
  "讓": "让",
  "從": "从",
  "還": "还",
  "僅": "仅",
  "較": "较",
  "覺": "觉",
  "種": "种",
  "線": "线",
  "圖": "图",
  "標": "标",
  "鍵": "键",
  "讀": "读",
  "書": "书",
  "軟": "软",
  "資": "资",
  "網": "网",
  "頁": "页",
  "連": "连",
  "載": "载",
  "級": "级",
  "產": "产",
  "際": "际",
  "專": "专",
  "業": "业",
  "範": "范",
  "圍": "围",
  "論": "论",
  "詞": "词",
  "彙": "汇",
  "類": "类",
  "別": "别",
  "隱": "隐",
  "桿": "杆",
  "幾": "几",
  "頭": "头",
  "髮": "发",
  "慣": "惯",
  "減": "减",
  "臺": "台",
  "週": "周",
  "邊": "边",
  "繁": "繁",
  "黏": "粘",
  "們": "们",
  "誤": "误",
  "嗎": "吗"
};

const PHRASES = [
  [
    "黏在一起",
    "粘在一起"
  ],
  [
    "台車",
    "小车"
  ],
  [
    "重設",
    "重置"
  ],
  [
    "甚麼",
    "什么"
  ],
  [
    "為什麼",
    "为什么"
  ],
  [
    "哪裡",
    "哪里"
  ],
  [
    "裡面",
    "里面"
  ],
  [
    "接著",
    "接着"
  ],
  [
    "瞭解",
    "了解"
  ],
  [
    "透過",
    "通过"
  ],
  [
    "資訊",
    "信息"
  ],
  [
    "網路",
    "网络"
  ],
  [
    "軟體",
    "软件"
  ],
  [
    "品質",
    "品质"
  ],
  [
    "影片",
    "视频"
  ],
  [
    "載入",
    "加载"
  ],
  [
    "預設",
    "默认"
  ],
  [
    "支援",
    "支持"
  ],
  [
    "設定",
    "设置"
  ],
  [
    "公尺",
    "米"
  ],
  [
    "公分",
    "厘米"
  ],
  [
    "公克",
    "克"
  ],
  [
    "完全非彈性",
    "完全非弹性"
  ]
];

const textRecords = new WeakMap();
const attrRecords = new WeakMap();
let lang = detectLanguage();
let observer = null;
let applying = false;
let scheduled = false;
let titleSource = '';
let descriptionSource = '';
let appleTitleSource = '';

function normalize(value) {
  return value === HANS ? HANS : HANT;
}

function readSavedLanguage() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    return saved === HANS || saved === HANT ? saved : null;
  } catch (error) {
    return null;
  }
}

function detectLanguage() {
  try {
    const param = new URLSearchParams(window.location.search).get('lang');
    if (param === 'hans' || param === HANS) return HANS;
    if (param === 'hant' || param === HANT) return HANT;

    const saved = readSavedLanguage();
    if (saved) return saved;

    try {
      if (window.parent !== window && window.parent.I18n) {
        const parentLang = window.parent.I18n.lang;
        if (parentLang === HANS || parentLang === HANT) return parentLang;
      }
    } catch (error) {
      // Cross-origin host; use the game's own preference.
    }

    const nav = (navigator.languages && navigator.languages[0]) || navigator.language || '';
    return /^zh-(CN|SG|Hans)/i.test(nav) ? HANS : HANT;
  } catch (error) {
    return HANT;
  }
}

export function toHans(value) {
  let text = String(value ?? '');
  for (const [from, to] of PHRASES) {
    text = text.split(from).join(to);
  }
  return text.replace(/[㐀-䶿一-鿿]/g, (char) => CHAR_MAP[char] || char);
}

function recordText(node) {
  let record = textRecords.get(node);
  const current = node.nodeValue;
  if (!record) {
    record = { source: current, applied: current };
    textRecords.set(node, record);
  } else if (current !== record.applied) {
    record.source = current;
    record.applied = current;
  }
  return record;
}

function applyTextNode(node) {
  const record = recordText(node);
  const next = lang === HANS ? toHans(record.source) : record.source;
  if (node.nodeValue !== next) node.nodeValue = next;
  record.applied = next;
}

function recordAttribute(element, attribute) {
  let records = attrRecords.get(element);
  if (!records) {
    records = {};
    attrRecords.set(element, records);
  }
  let record = records[attribute];
  const current = element.getAttribute(attribute);
  if (current == null) return null;
  if (!record) {
    record = { source: current, applied: current };
    records[attribute] = record;
  } else if (current !== record.applied) {
    record.source = current;
    record.applied = current;
  }
  return record;
}

function applyAttribute(element, attribute) {
  const record = recordAttribute(element, attribute);
  if (!record) return;
  const next = lang === HANS ? toHans(record.source) : record.source;
  if (element.getAttribute(attribute) !== next) element.setAttribute(attribute, next);
  record.applied = next;
}

export function localizeDom(root = document.body) {
  if (!root || applying) return;
  applying = true;
  try {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || parent.closest('script,style,noscript')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    while (walker.nextNode()) applyTextNode(walker.currentNode);

    root.querySelectorAll('[aria-label],[title],[placeholder],[alt]').forEach((element) => {
      for (const attribute of ['aria-label', 'title', 'placeholder', 'alt']) {
        if (element.hasAttribute(attribute)) applyAttribute(element, attribute);
      }
    });
  } finally {
    applying = false;
  }
}

function updateDocument() {
  document.documentElement.lang = lang;
  document.title = lang === HANS ? toHans(titleSource) : titleSource;

  const description = document.querySelector('meta[name="description"]');
  if (description && descriptionSource) {
    description.setAttribute('content', lang === HANS ? toHans(descriptionSource) : descriptionSource);
  }

  const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (appleTitle && appleTitleSource) {
    appleTitle.setAttribute('content', lang === HANS ? toHans(appleTitleSource) : appleTitleSource);
  }
}

function updateButtons() {
  document.querySelectorAll('[data-lang]').forEach((button) => {
    const active = button.dataset.lang === lang;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function scheduleLocalize() {
  if (lang !== HANS || applying || scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    localizeDom();
  });
}

export function setLanguage(value, options = {}) {
  lang = normalize(value);
  if (options.persist !== false) {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch (error) {
      // Private mode may block storage.
    }
  }
  updateDocument();
  updateButtons();
  localizeDom();
  window.dispatchEvent(new CustomEvent('momentum:language', { detail: { lang } }));
}

export function getLanguage() {
  return lang;
}

export function initLanguage() {
  titleSource = document.title;
  descriptionSource = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
  appleTitleSource = document.querySelector('meta[name="apple-mobile-web-app-title"]')?.getAttribute('content') || '';

  document.documentElement.lang = lang;
  updateDocument();
  updateButtons();
  localizeDom();

  document.querySelectorAll('[data-lang]').forEach((button) => {
    button.addEventListener('click', () => setLanguage(button.dataset.lang));
  });

  if (observer) observer.disconnect();
  observer = new MutationObserver(scheduleLocalize);
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['aria-label', 'title', 'placeholder', 'alt'],
  });

  return lang;
}
