/* Sentence Surgery · 句子急診室
   A 15-case grammar clinic. Local-only, no dependencies.

   Pedagogical stance: formal written English is the target. Where usage
   varies by register, the note says so instead of pretending there is one
   universal law. */

(() => {
  "use strict";

  const GAME_ID = "sentence-surgery";
  const PROGRESS_KEY = "english-demo:sentence-surgery:progress-v2";
  const MAX_CASE = 100;

  const CHAPTERS = [
    {
      id: "vitals",
      roman: "I",
      title: "Vital Signs",
      cn: "生命體徵",
      subtitle: "Agreement · tense",
      objective: "Make subjects and verbs agree, and keep the tense steady.",
      icon: "pulse",
      cases: ["morning-routine", "barking-dogs", "three-apples", "every-student", "open-door"],
    },
    {
      id: "structure",
      roman: "II",
      title: "Structural Repair",
      cn: "句子結構",
      subtitle: "Fragments · run-ons · balance",
      objective: "Repair fragments, comma splices, double connectors and unbalanced lists.",
      icon: "structure",
      cases: ["blackout", "the-storm", "rainy-day", "weekend-plans", "tired-runner"],
    },
    {
      id: "precision",
      roman: "III",
      title: "Precision Ward",
      cn: "精準用語",
      subtitle: "Clauses · modifiers · register",
      objective: "Control relative clauses, modifiers, formal register, possessives and prepositions.",
      icon: "precision",
      cases: ["overdue-book", "rainy-walk", "tai-po-friend", "childrens-books", "good-at-maths"],
    },
  ];

  const CASES = [
    {
      id: "morning-routine",
      chapter: 0,
      no: 1,
      title: "The Morning Routine",
      cn: "早晨例行",
      context: "School corridor · 07:45",
      concept: "Subject–verb agreement",
      conceptCn: "主謂一致",
      icon: "agreement",
      tokens: ["She", "go", "to", "school", "every", "day", "."],
      errorIndex: 1,
      fix: { kind: "replace", text: "goes" },
      postOp: 'go → goes',
      hint: "The subject is “she” — one person. Check the verb straight after it.",
      diagnosisWhy: "“go” cannot follow the third-person singular subject “she” in the simple present.",
      treatments: [
        { label: "goes", correct: true },
        { label: "went", why: "“went” is past tense. The sentence describes a daily habit, so keep the simple present." },
        { label: "going", why: "“going” cannot be the only verb here; you would need “is going”, which changes the construction." },
      ],
      note: "Third-person singular subjects — he, she, it, one person — add -s in the simple present. “She goes to school every day.” Without the -s, the verb does not agree with its subject.",
      rule: "he / she / it + verb-s",
    },
    {
      id: "barking-dogs",
      chapter: 0,
      no: 2,
      title: "The Barking Dogs",
      cn: "吠叫的狗",
      context: "Back garden · 18:10",
      concept: "Plural agreement",
      conceptCn: "複數一致",
      icon: "agreement",
      tokens: ["The", "dogs", "is", "barking", "loudly", "."],
      errorIndex: 2,
      fix: { kind: "replace", text: "are" },
      postOp: "is → are",
      hint: "“The dogs” is more than one dog. Check the be-verb that follows it.",
      diagnosisWhy: "“is” is singular, but “the dogs” is plural.",
      treatments: [
        { label: "are", correct: true },
        { label: "was", why: "“was” is singular and past. “The dogs” is plural, and the barking is happening now." },
        { label: "be", why: "“be” is the base form. A present-tense plural subject needs “are”." },
      ],
      note: "A plural subject takes a plural be-verb. “The dogs” means “they”, so the present-tense verb is “are”: “The dogs are barking loudly.”",
      rule: "plural subject + are",
    },
    {
      id: "three-apples",
      chapter: 0,
      no: 3,
      title: "Three Apples",
      cn: "三個蘋果",
      context: "Kitchen · 16:20",
      concept: "Present perfect",
      conceptCn: "現在完成式",
      icon: "tense",
      tokens: ["I", "have", "ate", "three", "apples", "."],
      errorIndex: 2,
      fix: { kind: "replace", text: "eaten" },
      postOp: "ate → eaten",
      hint: "Look at the verb after “have”. The present perfect has a strict shape.",
      diagnosisWhy: "“ate” is the simple past; after “have” the sentence needs a past participle.",
      treatments: [
        { label: "eaten", correct: true },
        { label: "eat", why: "“eat” is the base form. After “have” you need the past participle, not the base verb." },
        { label: "eating", why: "“eating” is the -ing form. The present perfect is have + past participle." },
      ],
      note: "The present perfect is have / has + past participle. The past participle of “eat” is “eaten”, so: “I have eaten three apples.” The simple past “ate” never follows “have”.",
      rule: "have / has + past participle",
    },
    {
      id: "every-student",
      chapter: 0,
      no: 4,
      title: "Every Student",
      cn: "每一位學生",
      context: "Classroom · 09:05",
      concept: "Indefinite pronoun agreement",
      conceptCn: "不定代名詞一致",
      icon: "agreement",
      tokens: ["Each", "of", "the", "students", "have", "a", "laptop", "."],
      errorIndex: 4,
      fix: { kind: "replace", text: "has" },
      postOp: "have → has",
      hint: "The head of the subject is “each”, not “students”. Is “each” singular or plural?",
      diagnosisWhy: "The head of the subject is “each”, which is singular; “of the students” is a prepositional phrase.",
      treatments: [
        { label: "has", correct: true },
        { label: "are", why: "“are” is plural and cannot be the main verb with “each”; the verb is “has”, meaning “owns”." },
        { label: "having", why: "“having” is a participle, not a finite verb for this subject." },
      ],
      note: "“Each” is singular. The phrase “of the students” tells you who is included, but it does not make the head plural. “Each of the students has a laptop.”",
      rule: "each + singular verb",
    },
    {
      id: "open-door",
      chapter: 0,
      no: 5,
      title: "The Open Door",
      cn: "打開的門",
      context: "Hallway · 22:40",
      concept: "Tense consistency",
      conceptCn: "時態一致",
      icon: "tense",
      tokens: ["She", "opened", "the", "door", "and", "walks", "inside", "."],
      errorIndex: 5,
      fix: { kind: "replace", text: "walked" },
      postOp: "walks → walked",
      hint: "The first verb is “opened”. The two actions happen in the same past scene.",
      diagnosisWhy: "“opened” is past, but “walks” is present; the two coordinated actions should share the same time frame.",
      treatments: [
        { label: "walked", correct: true },
        { label: "walks", why: "“walks” is present. It clashes with the past “opened” in the same sequence." },
        { label: "walking", why: "“walking” is not a finite verb here; “and” is joining two past actions." },
      ],
      note: "When two actions are joined in one past sequence, keep the tense consistent: “She opened the door and walked inside.” A shift to “walks” makes the timeline jump.",
      rule: "keep the tense consistent",
    },
    {
      id: "blackout",
      chapter: 1,
      no: 1,
      title: "Blackout",
      cn: "停電",
      context: "Stairwell · 21:15",
      concept: "Sentence fragment",
      conceptCn: "句子碎片",
      icon: "fragment",
      tokens: ["Because", "the", "lights", "went", "out", "."],
      errorIndex: 0,
      fix: { kind: "remove", index: 0 },
      postOp: 'removed "Because"',
      diagnosePrompt: "Tap the word that turns a main clause into a fragment.",
      hint: "“Because” makes the clause depend on something else. Is there a main clause?",
      diagnosisWhy: "“Because” creates a dependent clause, but the sentence has no main clause to complete it.",
      treatments: [
        { label: 'remove "Because"', correct: true },
        { label: 'change "Because" to "Although"', why: "“Although” is also a subordinator, so the clause would still be a fragment." },
        { label: 'remove "out"', why: "“out” completes the phrasal verb “went out”; removing it does not add a main clause." },
      ],
      note: "A dependent clause beginning with “because” needs a main clause. Removing “because” gives a complete sentence: “The lights went out.” Adding a main clause would also work: “Because the lights went out, we used a torch.”",
      rule: "dependent clause needs a main clause",
    },
    {
      id: "the-storm",
      chapter: 1,
      no: 2,
      title: "The Storm",
      cn: "暴風雨",
      context: "Weather station · 17:30",
      concept: "Comma splice",
      conceptCn: "逗號拼接",
      icon: "comma",
      tokens: ["The", "storm", "arrived", ",", "we", "closed", "the", "windows", "."],
      errorIndex: 3,
      fix: { kind: "replace", text: ";" },
      postOp: '"," → ";"',
      diagnosePrompt: "Tap the punctuation that is not strong enough to hold two clauses together.",
      hint: "Two independent clauses are joined by only a comma. What punctuation is strong enough?",
      diagnosisWhy: "A comma alone cannot join two independent clauses; that is a comma splice.",
      treatments: [
        { label: "semicolon ( ; )", correct: true },
        { label: "colon ( : )", why: "A colon usually introduces an explanation or list; this pair is a sequence of events, so a semicolon is the neutral fix." },
        { label: "keep the comma", why: "A comma alone between two independent clauses is a comma splice." },
      ],
      note: "A semicolon can join two closely related independent clauses: “The storm arrived; we closed the windows.” A full stop or a coordinator such as “and” would also work. A comma alone is not enough.",
      rule: "comma splice: use ; or a full stop",
    },
    {
      id: "rainy-day",
      chapter: 1,
      no: 3,
      title: "Rainy Day",
      cn: "雨天",
      context: "Bus stop · 08:20",
      concept: "Double connector",
      conceptCn: "雙重連接詞",
      icon: "connector",
      tokens: ["Because", "it", "was", "raining", ",", "so", "we", "stayed", "inside", "."],
      errorIndex: 5,
      fix: { kind: "remove", index: 5 },
      postOp: 'removed "so"',
      diagnosePrompt: "Tap the connector that is doing the same job as another connector.",
      hint: "“Because” already shows the cause. What does “so” add?",
      diagnosisWhy: "“Because” already marks the cause; “so” adds a second cause connector in the same sentence.",
      treatments: [
        { label: 'remove "so"', correct: true },
        { label: 'remove "Because"', why: "That would also be grammatical, but the task is to keep both the cause and the result. Removing “so” does that." },
        { label: 'change "was" to "is"', why: "The tense is not the problem; the double connector is." },
      ],
      note: "In formal written English, choose one connector: “Because it was raining, we stayed inside.” Or: “It was raining, so we stayed inside.” Keeping both “because” and “so” is redundant. You may hear it in informal speech, but exams expect one.",
      rule: "because … so … = one connector too many",
      register: "Register note: the double connector is common in casual speech. This game targets formal written English.",
    },
    {
      id: "weekend-plans",
      chapter: 1,
      no: 4,
      title: "Weekend Plans",
      cn: "週末計劃",
      context: "Café · 15:45",
      concept: "Parallel structure",
      conceptCn: "平行結構",
      icon: "parallel",
      tokens: ["She", "likes", "swimming", ",", "hiking", ",", "and", "to paint", "."],
      errorIndex: 7,
      fix: { kind: "replace", text: "painting" },
      postOp: 'to paint → painting',
      diagnosePrompt: "Tap the item that does not match the form of the other items in the list.",
      hint: "“Swimming” and “hiking” are -ing forms. What about the last item?",
      diagnosisWhy: "“swimming” and “hiking” are -ing forms; “to paint” breaks the parallel pattern.",
      treatments: [
        { label: "painting", correct: true },
        { label: "paint", why: "“paint” is the base form and still does not match “swimming” and “hiking”." },
        { label: "to painting", why: "“to painting” mixes the infinitive marker with an -ing form; it is not parallel." },
      ],
      note: "Items in a list should share the same grammatical form. “She likes swimming, hiking and painting.” Keep all three as -ing forms.",
      rule: "parallel items share the same form",
    },
    {
      id: "tired-runner",
      chapter: 1,
      no: 5,
      title: "The Tired Runner",
      cn: "疲倦的跑手",
      context: "Track · 18:55",
      concept: "Double contrast connector",
      conceptCn: "雙重轉折連接詞",
      icon: "connector",
      tokens: ["Although", "she", "was", "tired", ",", "but", "she", "finished", "the", "race", "."],
      errorIndex: 5,
      fix: { kind: "remove", index: 5 },
      postOp: 'removed "but"',
      diagnosePrompt: "Tap the connector that repeats the contrast already signalled at the start.",
      hint: "“Although” already introduces the contrast. What is “but” doing?",
      diagnosisWhy: "“Although” already marks the contrast; “but” repeats it.",
      treatments: [
        { label: 'remove "but"', correct: true },
        { label: 'remove "Although"', why: "That would also be grammatical, but the task is to keep the contrast. Removing “but” does that." },
        { label: 'change "Although" to "Because"', why: "That changes the logic from contrast to cause, not just the connector." },
      ],
      note: "Choose one contrast connector: “Although she was tired, she finished the race.” Or: “She was tired, but she finished the race.” “Although … but …” repeats the same contrast.",
      rule: "although … but … = one contrast connector",
      register: "Register note: “although … but …” is common in casual speech. This game targets formal written English.",
    },
    {
      id: "overdue-book",
      chapter: 2,
      no: 1,
      title: "The Overdue Book",
      cn: "逾期圖書",
      context: "Library · 16:05",
      concept: "Relative pronoun",
      conceptCn: "關係代名詞",
      icon: "relative",
      tokens: ["The", "book", "who", "I", "borrowed", "was", "overdue", "."],
      errorIndex: 2,
      fix: { kind: "replace", text: "which" },
      postOp: "who → which",
      hint: "A book is a thing, not a person. Which relative pronoun do we use for things?",
      diagnosisWhy: "“who” refers to people; a book needs “which” or “that” in this defining relative clause.",
      treatments: [
        { label: "which", correct: true },
        { label: "whom", why: "“whom” is an object pronoun for people, not for a book." },
        { label: "whose", why: "“whose” shows possession; the sentence is not about the book owning something." },
      ],
      note: "Use “who” for people and “which” or “that” for things: “The book which I borrowed was overdue.” In a defining clause, “that” is also possible.",
      rule: "people → who; things → which / that",
    },
    {
      id: "rainy-walk",
      chapter: 2,
      no: 2,
      title: "The Rainy Walk",
      cn: "雨中上學",
      context: "School gate · 08:05",
      concept: "Dangling modifier",
      conceptCn: "懸空修飾語",
      icon: "modifier",
      tokens: ["Walking", "to", "school", ",", "the", "rain", "soaked", "my", "shoes", "."],
      errorIndex: 0,
      fix: { kind: "replace", text: "As I was walking" },
      postOp: "Walking → As I was walking",
      diagnosePrompt: "Tap the word that leaves the opening modifier without the right subject.",
      hint: "Who was walking to school? The rain, or the speaker?",
      diagnosisWhy: "The opening modifier “Walking to school” describes the speaker, but the main subject is “the rain”.",
      treatments: [
        { label: "As I was walking", correct: true },
        { label: "Walked", why: "“Walked to school, the rain…” still attaches the walking to the rain." },
        { label: "To walk", why: "“To walk to school, the rain…” still leaves the modifier dangling." },
      ],
      note: "A modifier at the start of a sentence should describe the subject that follows. “Walking to school, the rain soaked my shoes” says the rain was walking. Repair it with a clear subject: “As I was walking to school, the rain soaked my shoes.”",
      rule: "modifier must describe the right subject",
    },
    {
      id: "tai-po-friend",
      chapter: 2,
      no: 3,
      title: "Tai Po Friend",
      cn: "大埔的朋友",
      context: "Clinic · 11:30",
      concept: "Redundant subject",
      conceptCn: "主語重複",
      icon: "register",
      tokens: ["My", "friend", ",", "who", "lives", "in", "Tai Po", ",", "he", "is", "a", "doctor", "."],
      errorIndex: 8,
      fix: { kind: "remove", index: 8 },
      postOp: 'removed "he"',
      diagnosePrompt: "Tap the word that repeats the subject in this formal written sentence.",
      hint: "The subject is already “my friend”. Is there a second subject?",
      diagnosisWhy: "“he” repeats the subject “my friend” after the relative clause.",
      treatments: [
        { label: 'remove "he"', correct: true },
        { label: 'change "who" to "which"', why: "“who” is correct for a person; “which” is for things. The repeated subject is the real issue." },
        { label: 'change "is" to "are"', why: "“My friend” is singular, so “is” is correct. This is not a plural-agreement case." },
      ],
      note: "In formal written English, one subject is enough: “My friend, who lives in Tai Po, is a doctor.” The extra “he” repeats the subject. In casual speech, left dislocation (“My friend, he is…”) can occur, but it is not the target register here.",
      rule: "formal writing: one subject per clause",
      register: "Register note: left dislocation is normal in informal speech. This case targets formal written English.",
    },
    {
      id: "childrens-books",
      chapter: 2,
      no: 4,
      title: "Children's Books",
      cn: "兒童圖書",
      context: "Bookshop · 14:10",
      concept: "Possessive apostrophe",
      conceptCn: "所有格撇號",
      icon: "apostrophe",
      tokens: ["The", "childrens", "books", "are", "new", "."],
      errorIndex: 1,
      fix: { kind: "replace", text: "children's" },
      postOp: "childrens → children's",
      hint: "“Children” is already plural. Where does the possessive apostrophe go?",
      diagnosisWhy: "“children” is an irregular plural; the possessive is “children’s”, with the apostrophe before the -s.",
      treatments: [
        { label: "children's", correct: true },
        { label: "childrens'", why: "“children” is not a regular plural ending in -s; the possessive is “children’s”." },
        { label: "children", why: "Without the apostrophe, “children books” is not the possessive form needed here." },
      ],
      note: "“Children” is already plural. Add ’s to make the possessive: “the children’s books” = the books belonging to the children.",
      rule: "irregular plural + 's",
    },
    {
      id: "good-at-maths",
      chapter: 2,
      no: 5,
      title: "Good at Maths",
      cn: "擅長數學",
      context: "Staffroom · 10:40",
      concept: "Preposition",
      conceptCn: "介詞搭配",
      icon: "preposition",
      tokens: ["He", "is", "good", "in", "mathematics", "."],
      errorIndex: 3,
      fix: { kind: "replace", text: "at" },
      postOp: "in → at",
      hint: "Which preposition follows “good” when it means “skilled”?",
      diagnosisWhy: "The standard collocation is “good at” a skill or subject, not “good in”.",
      treatments: [
        { label: "at", correct: true },
        { label: "on", why: "“good on” can describe a topic or performance in some varieties, but the standard school collocation for a skill is “good at”." },
        { label: "for", why: "“good for” means beneficial, not skilled." },
      ],
      note: "Use “good at” for a skill or school subject: “He is good at mathematics.” Some speakers use “good in” when talking about performance in a subject, but “good at” is the standard school collocation here. “Good for” means beneficial.",
      rule: "good at + skill",
    },
  ];

  const CASE_BY_ID = Object.fromEntries(CASES.map((item) => [item.id, item]));
  const ED = window.EnglishDemo || {};
  const esc = typeof ED.escapeHtml === "function"
    ? ED.escapeHtml
    : (value) => String(value).replace(/[&<>"']/g, (ch) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
      }[ch]));
  const shuffle = typeof ED.shuffle === "function"
    ? ED.shuffle
    : (list) => list.slice().sort(() => Math.random() - 0.5);
  const reduceMotion = typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function icon(name, className = "") {
    return `<svg class="icon${className ? " " + className : ""}" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
  }

  function loadProgress() {
    try {
      const raw = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "null");
      if (!raw || typeof raw !== "object") throw new Error("empty");
      const progress = {
        unlocked: Math.min(3, Math.max(1, Number(raw.unlocked) || 1)),
        cases: {},
      };
      if (raw.cases && typeof raw.cases === "object") {
        Object.keys(raw.cases).forEach((id) => {
          if (!CASE_BY_ID[id]) return;
          const row = raw.cases[id];
          const score = Math.max(0, Math.min(MAX_CASE, Math.round(Number(row && row.score) || 0)));
          if (score > 0) progress.cases[id] = { score, stars: starsFor(score) };
        });
      }
      return progress;
    } catch (err) {
      return { unlocked: 1, cases: {} };
    }
  }

  const progress = loadProgress();
  const state = {
    screen: "map",
    chapterIndex: 0,
    caseIndex: 0,
    caseId: null,
    phase: "diagnose",
    diagWrong: 0,
    treatWrong: 0,
    roundDiag: 0,
    roundTreat: 0,
    caseScore: 0,
    triedTokens: new Set(),
    triedTreatments: new Set(),
    treatOrder: [0, 1, 2],
    busy: false,
    recorded: false,
  };

  const els = {
    mapScreen: document.getElementById("mapScreen"),
    playScreen: document.getElementById("playScreen"),
    resultScreen: document.getElementById("resultScreen"),
    topProgress: document.getElementById("topProgress"),
    statCases: document.getElementById("statCases"),
    statStars: document.getElementById("statStars"),
    statBest: document.getElementById("statBest"),
    continueBtn: document.getElementById("continueBtn"),
    howBtn: document.getElementById("howBtn"),
    resetBtn: document.getElementById("resetBtn"),
    chapterList: document.getElementById("chapterList"),
    mapBackBtn: document.getElementById("mapBackBtn"),
    playKicker: document.getElementById("playKicker"),
    liveScore: document.getElementById("liveScore"),
    liveCase: document.getElementById("liveCase"),
    caseIcon: document.getElementById("caseIcon"),
    caseTitle: document.getElementById("caseTitle"),
    caseMeta: document.getElementById("caseMeta"),
    caseConcept: document.getElementById("caseConcept"),
    monitor: document.getElementById("monitor"),
    monitorStatus: document.getElementById("monitorStatus"),
    bpm: document.getElementById("bpm"),
    stabilityBar: document.getElementById("stabilityBar"),
    stabilityFill: document.getElementById("stabilityFill"),
    stabilityPct: document.getElementById("stabilityPct"),
    instruction: document.getElementById("instruction"),
    chartTag: document.getElementById("chartTag"),
    sentenceCaption: document.getElementById("sentenceCaption"),
    sentence: document.getElementById("sentence"),
    stageFoot: document.getElementById("stageFoot"),
    feedback: document.getElementById("feedback"),
    sideWard: document.getElementById("sideWard"),
    sideConcept: document.getElementById("sideConcept"),
    sideTarget: document.getElementById("sideTarget"),
    sideRule: document.getElementById("sideRule"),
    resultKicker: document.getElementById("resultKicker"),
    resultMark: document.getElementById("resultMark"),
    resultTitle: document.getElementById("resultTitle"),
    resultCopy: document.getElementById("resultCopy"),
    resultScore: document.getElementById("resultScore"),
    resultMax: document.getElementById("resultMax"),
    resultStars: document.getElementById("resultStars"),
    resultLog: document.getElementById("resultLog"),
    resultActions: document.getElementById("resultActions"),
    howModal: document.getElementById("howModal"),
    howClose: document.getElementById("howClose"),
    howDone: document.getElementById("howDone"),
    toast: document.getElementById("toast"),
  };

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function starsFor(score) {
    if (score >= 100) return 3;
    if (score >= 75) return 2;
    if (score >= 40) return 1;
    return 0;
  }

  function casesOf(chapterIndex) {
    return CHAPTERS[chapterIndex].cases.map((id) => CASE_BY_ID[id]);
  }

  function currentCase() {
    return CASE_BY_ID[state.caseId] || CASES[0];
  }

  function currentChapter() {
    return CHAPTERS[state.chapterIndex];
  }

  function caseDone(id) {
    return Boolean(progress.cases[id] && progress.cases[id].score > 0);
  }

  function chapterStats(index) {
    const list = casesOf(index);
    const done = list.filter((item) => caseDone(item.id)).length;
    const stars = list.reduce((sum, item) => sum + ((progress.cases[item.id] || {}).stars || 0), 0);
    const points = list.reduce((sum, item) => sum + ((progress.cases[item.id] || {}).score || 0), 0);
    return { done, stars, points, total: list.length };
  }

  function chapterComplete(index) {
    return chapterStats(index).done === CHAPTERS[index].cases.length;
  }

  function allComplete() {
    return CASES.every((item) => caseDone(item.id));
  }

  function totalBest() {
    return CASES.reduce((sum, item) => sum + ((progress.cases[item.id] || {}).score || 0), 0);
  }

  function totalStars() {
    return CASES.reduce((sum, item) => sum + ((progress.cases[item.id] || {}).stars || 0), 0);
  }

  function completedCount() {
    return CASES.filter((item) => caseDone(item.id)).length;
  }

  function recomputeUnlocked() {
    let unlocked = 1;
    for (let i = 1; i < CHAPTERS.length; i += 1) {
      if (chapterComplete(i - 1)) unlocked = i + 1;
    }
    progress.unlocked = Math.max(progress.unlocked || 1, unlocked);
    progress.unlocked = Math.min(3, progress.unlocked);
  }

  function saveProgress() {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch (err) {
      /* storage can be unavailable in privacy mode */
    }
  }

  function saveBest() {
    try {
      if (typeof ED.saveBest === "function") ED.saveBest(GAME_ID, totalBest());
    } catch (err) {
      /* noop */
    }
  }

  function updateTop() {
    els.topProgress.innerHTML = `${completedCount()} <span>/ 15 cases</span>`;
  }

  function setFeedback(kind, html) {
    els.feedback.className = "feedback" + (kind ? " is-" + kind : "");
    els.feedback.innerHTML = html;
  }

  function toast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => els.toast.classList.remove("show"), 2200);
  }

  function showScreen(name) {
    state.screen = name;
    els.mapScreen.hidden = name !== "map";
    els.playScreen.hidden = name !== "play";
    els.resultScreen.hidden = name !== "result";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }

  /* ---------- map ---------- */

  function nextUncompleted() {
    for (let chapterIndex = 0; chapterIndex < CHAPTERS.length; chapterIndex += 1) {
      if (chapterIndex + 1 > progress.unlocked) break;
      for (const item of casesOf(chapterIndex)) {
        if (!caseDone(item.id)) return item;
      }
    }
    return null;
  }

  function renderMap() {
    updateTop();
    const done = completedCount();
    els.statCases.textContent = String(done);
    els.statStars.textContent = String(totalStars());
    els.statBest.textContent = String(totalBest());

    if (allComplete()) {
      els.continueBtn.textContent = "View course record";
    } else {
      const next = nextUncompleted();
      els.continueBtn.textContent = done === 0
        ? "Start first case"
        : next ? `Continue: ${next.title}` : "Continue";
    }

    els.chapterList.innerHTML = CHAPTERS.map((chapter, index) => {
      const stats = chapterStats(index);
      const locked = index + 1 > progress.unlocked;
      const nodes = casesOf(index).map((item, caseIndex) => {
        const row = progress.cases[item.id] || null;
        const stars = row ? row.stars : 0;
        return `<button class="case-node${row ? " is-done" : ""}" type="button"
          data-case="${esc(item.id)}" ${locked ? "disabled" : ""}
          aria-label="Ward ${chapter.roman}, case ${caseIndex + 1}: ${esc(item.title)}${row ? ", best " + row.score + " points" : ""}">
          <span class="node-icon">${icon(item.icon)}</span>
          <span class="node-copy"><b>${pad(caseIndex + 1)}</b><span class="node-stars" aria-hidden="true">${[0, 1, 2].map((n) => icon("star", n < stars ? "on" : "")).join("")}</span></span>
        </button>`;
      }).join("");

      return `<article class="chapter${locked ? " is-locked" : ""}">
        <div class="chapter-icon" aria-hidden="true">${icon(chapter.icon)}</div>
        <div class="chapter-copy">
          <span class="chapter-kicker">WARD ${chapter.roman} · ${esc(chapter.subtitle)}</span>
          <h3>${esc(chapter.title)} <span>${esc(chapter.cn)}</span></h3>
          <p>${esc(chapter.objective)}</p>
          <div class="case-nodes" role="group" aria-label="Ward ${chapter.roman} cases">${nodes}</div>
        </div>
        <div class="chapter-actions">
          <div class="chapter-progress"><b>${stats.done}/${stats.total}</b>cases closed</div>
          <button class="btn ${stats.done === stats.total ? "ghost" : "mint"}" type="button" data-chapter="${index}" ${locked ? "disabled" : ""}>
            ${stats.done === stats.total ? "Review ward" : stats.done ? "Continue" : "Enter ward"}
          </button>
        </div>
        ${locked ? `<div class="chapter-lock" aria-hidden="true"></div><span class="chapter-lock-note">${icon("lock")} Close Ward ${CHAPTERS[index - 1].roman} first</span>` : ""}
      </article>`;
    }).join("");
  }

  function showMap() {
    renderMap();
    showScreen("map");
  }

  function openChapter(index) {
    if (index + 1 > progress.unlocked) {
      toast(`Close Ward ${CHAPTERS[index - 1].roman} first.`);
      return;
    }
    const list = casesOf(index);
    const next = list.find((item) => !caseDone(item.id)) || list[0];
    startCase(next.id);
  }

  function startCase(caseId) {
    const item = CASE_BY_ID[caseId];
    if (!item) return;
    if (item.chapter + 1 > progress.unlocked) {
      toast("That ward is still locked.");
      return;
    }
    state.chapterIndex = item.chapter;
    state.caseIndex = item.no - 1;
    state.caseId = item.id;
    state.phase = "diagnose";
    state.diagWrong = 0;
    state.treatWrong = 0;
    state.roundDiag = 0;
    state.roundTreat = 0;
    state.caseScore = 0;
    state.triedTokens = new Set();
    state.triedTreatments = new Set();
    state.treatOrder = shuffle([0, 1, 2]);
    state.busy = false;
    state.recorded = false;

    renderPlay();
    showScreen("play");
    window.requestAnimationFrame(() => {
      const first = els.sentence.querySelector("button.token");
      if (first) first.focus({ preventScroll: true });
    });
  }

  /* ---------- play ---------- */

  function setPhaseChip(label, phase) {
    els.chartTag.textContent = label;
    els.chartTag.dataset.phase = phase;
  }

  function setStability(value) {
    const pct = Math.max(0, Math.min(100, Math.round(value)));
    const label = pct >= 100 ? "STABLE" : pct >= 50 ? "STABILISING" : "UNSTABLE";
    const monitorState = pct >= 100 ? "stable" : pct >= 50 ? "stabilising" : "critical";
    els.stabilityFill.style.width = pct + "%";
    els.stabilityBar.setAttribute("aria-valuenow", String(pct));
    els.stabilityBar.setAttribute("aria-valuetext", pct + " percent, " + label.toLowerCase());
    els.stabilityPct.textContent = pct + "%";
    els.bpm.textContent = Math.round(46 + pct * 0.4) + " BPM";
    els.monitorStatus.textContent = label;
    els.monitor.dataset.state = monitorState;
  }

  function alarmMonitor() {
    els.monitor.classList.remove("is-alarm");
    void els.monitor.offsetWidth;
    els.monitor.classList.add("is-alarm");
    window.setTimeout(() => els.monitor.classList.remove("is-alarm"), 480);
  }

  function healMonitor() {
    els.monitor.classList.remove("is-healed");
    void els.monitor.offsetWidth;
    els.monitor.classList.add("is-healed");
    window.setTimeout(() => els.monitor.classList.remove("is-healed"), 650);
  }

  function renderPlay() {
    const item = currentCase();
    const chapter = currentChapter();
    els.playKicker.textContent = `WARD ${chapter.roman} · CASE ${pad(item.no)}`;
    els.liveScore.textContent = "0";
    els.liveCase.textContent = `${item.no} / ${chapter.cases.length}`;
    els.caseIcon.innerHTML = icon(item.icon);
    els.caseTitle.textContent = item.title;
    els.caseMeta.innerHTML = `${esc(item.context)} · <span>${esc(item.concept)}</span>`;
    els.caseConcept.textContent = `${item.concept} · ${item.conceptCn}`;
    els.monitor.dataset.state = "critical";
    els.monitorStatus.textContent = "UNSTABLE";
    els.instruction.innerHTML = `${esc(item.diagnosePrompt || "Tap the one token that is unwell.")}<span class="instruction-cn">找出令句子生病的唯一詞語。</span>`;
    els.chartTag.textContent = "PRE-OP";
    els.sentenceCaption.textContent = "X-RAY · TAP ONE TOKEN";
    els.stageFoot.innerHTML = "";
    els.feedback.className = "feedback";
    els.feedback.textContent = "Patient is unstable. Diagnose the sentence to begin.";
    els.sideWard.textContent = `${chapter.roman} · ${chapter.title}`;
    els.sideConcept.textContent = `${item.concept} · ${item.conceptCn}`;
    els.sideTarget.textContent = item.errorIndex === 0 ? "The opening token" : "One token";
    els.sideRule.textContent = item.rule;
    setStability(18);
    renderSentence(true);
    updateTop();
  }

  function isPunctuation(text) {
    return /^[.,!?;:'"—]+$/.test(text);
  }

  function renderSentence(interactive) {
    const item = currentCase();
    const showFix = !interactive && state.phase === "note";
    const fixIndex = item.fix.index == null ? item.errorIndex : item.fix.index;
    els.sentence.innerHTML = "";

    item.tokens.forEach((text, index) => {
      if (showFix && item.fix.kind === "remove" && item.fix.index === index) {
        const suture = document.createElement("span");
        suture.className = "suture";
        suture.textContent = "✚";
        suture.setAttribute("role", "img");
        suture.setAttribute("aria-label", "Removed token: " + text);
        els.sentence.append(suture);
        return;
      }

      const node = document.createElement(interactive ? "button" : "span");
      let shown = text;
      if (interactive) {
        node.type = "button";
        node.className = "token";
        node.setAttribute("aria-label", "Diagnose token " + (index + 1) + ": " + text);
        if (state.triedTokens.has(index)) node.classList.add("is-tried");
        node.addEventListener("click", () => diagnose(index, node));
      } else {
        node.className = "token token-static";
        if (showFix && item.fix.kind === "replace" && fixIndex === index) {
          shown = item.fix.text;
          node.classList.add("is-fixed");
        } else if (!showFix && state.phase === "treat" && index === item.errorIndex) {
          node.classList.add("is-diagnosed");
        }
      }
      if (isPunctuation(text)) node.classList.add("punct");
      node.textContent = shown;
      els.sentence.append(node);
    });

    if (showFix && item.fix.kind === "remove" && item.fix.index === 0) {
      const first = els.sentence.querySelector(".token");
      if (first && /^[a-z]/.test(first.textContent)) {
        first.textContent = first.textContent.charAt(0).toUpperCase() + first.textContent.slice(1);
      }
    }
    els.sentence.setAttribute("aria-label", "Patient sentence: " + item.tokens.join(" "));
  }

  function diagPoints() {
    if (state.diagWrong === 0) return 40;
    if (state.diagWrong === 1) return 25;
    return 10;
  }

  function treatPoints() {
    if (state.treatWrong === 0) return 60;
    if (state.treatWrong === 1) return 35;
    return 15;
  }

  function diagnose(index, node) {
    if (state.phase !== "diagnose" || state.busy) return;
    const item = currentCase();

    if (index !== item.errorIndex) {
      state.diagWrong += 1;
      state.triedTokens.add(index);
      state.busy = true;
      node.classList.add("is-shaking");
      alarmMonitor();
      setFeedback("bad", `<b>Healthy token.</b> ${esc(item.hint)} <span class="pts">retry · ${diagPoints()} pts remain</span>`);
      window.setTimeout(() => {
        node.classList.remove("is-shaking");
        state.busy = false;
      }, 380);
      return;
    }

    state.roundDiag = diagPoints();
    state.caseScore += state.roundDiag;
    state.phase = "treat";
    els.liveScore.textContent = String(state.caseScore);
    els.chartTag.textContent = "DIAGNOSED";
    els.chartTag.dataset.phase = "treat";
    els.sentenceCaption.textContent = "PATIENT DIAGNOSED · CHOOSE TREATMENT";
    els.instruction.innerHTML = `Diagnosis locked. Choose the treatment that repairs the sentence without changing its meaning.<span class="instruction-cn">選擇能保留原意的最佳治療。</span>`;
    setStability(58);
    healMonitor();
    setFeedback("good", `<b>Diagnosis confirmed.</b> ${esc(item.diagnosisWhy)} <span class="pts">+${state.roundDiag}</span>`);
    renderSentence(false);
    renderTreatments();
    window.requestAnimationFrame(() => {
      const first = els.stageFoot.querySelector(".treat-btn:not([aria-disabled='true'])");
      if (first) first.focus({ preventScroll: true });
    });
  }

  function renderTreatments() {
    const item = currentCase();
    els.stageFoot.innerHTML = "";
    const block = document.createElement("div");
    block.className = "treat-block";
    block.innerHTML = `<div class="treat-head"><span>TREATMENT · ${esc(item.treatPrompt || "PICK THE REPAIR")}</span><span>FIRST TRY +60</span></div>`;
    const grid = document.createElement("div");
    grid.className = "treat-grid";
    state.treatOrder.forEach((caseIndex) => {
      const treatment = item.treatments[caseIndex];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost treat-btn";
      btn.textContent = treatment.label;
      btn.dataset.treatment = String(caseIndex);
      if (state.triedTreatments.has(caseIndex)) {
        btn.setAttribute("aria-disabled", "true");
        btn.title = "Already ruled out";
      }
      btn.addEventListener("click", () => treat(caseIndex, btn));
      grid.append(btn);
    });
    block.append(grid);
    els.stageFoot.append(block);
  }

  function treat(caseIndex, btn) {
    if (state.phase !== "treat" || state.busy) return;
    if (state.triedTreatments.has(caseIndex)) return;

    const item = currentCase();
    const treatment = item.treatments[caseIndex];

    if (!treatment.correct) {
      state.treatWrong += 1;
      state.triedTreatments.add(caseIndex);
      state.busy = true;
      btn.setAttribute("aria-disabled", "true");
      btn.title = "Already ruled out";
      alarmMonitor();
      setFeedback("bad", `<b>Treatment rejected.</b> ${esc(treatment.why)} <span class="pts">retry · ${treatPoints()} pts remain</span>`);
      window.setTimeout(() => {
        state.busy = false;
        const next = els.stageFoot.querySelector(".treat-btn:not([aria-disabled='true'])");
        if (next) next.focus({ preventScroll: true });
      }, 380);
      return;
    }

    state.roundTreat = treatPoints();
    state.caseScore += state.roundTreat;
    state.phase = "note";
    els.liveScore.textContent = String(state.caseScore);
    setStability(100);
    healMonitor();
    els.chartTag.textContent = "POST-OP";
    els.chartTag.dataset.phase = "note";
    els.sentenceCaption.textContent = "POST-OP · " + item.postOp;
    els.instruction.innerHTML = "Patient stable. Read the doctor's note, then close the case.<span class=\"instruction-cn\">病人穩定。閱讀診斷筆記，然後結案。</span>";
    renderSentence(false);
    recordCase();
    renderNote();
    setFeedback("good", `<b>Surgery complete.</b> ${esc(item.postOp)} — ${state.roundDiag} + ${state.roundTreat} = <b>${state.caseScore}</b> points for this case.`);
  }

  function noteStars(stars) {
    return `<span class="note-stars" aria-label="${stars} out of 3 stars">${[0, 1, 2].map((n) => icon("star", n < stars ? "on" : "")).join("")}</span>`;
  }

  function renderNote() {
    const item = currentCase();
    const stars = starsFor(state.caseScore);
    const next = nextUncompleted();
    const last = !next;
    const wardDone = chapterComplete(item.chapter);
    const nextWard = currentCase().chapter + 1;
    const wardLabel = wardDone && !last
      ? `WARD ${CHAPTERS[nextWard].roman} UNLOCKED`
      : "";
    els.stageFoot.innerHTML = "";
    const note = document.createElement("div");
    note.className = "note-block";
    note.innerHTML = `<div class="note-head"><span>DOCTOR'S NOTE · 診斷紀錄</span><span class="note-badge">CASE ${pad(item.no)} · ${stars}/3 ★</span></div>
      <h3 class="note-title">${esc(item.concept)} <span class="note-cn">${esc(item.conceptCn)}</span></h3>
      ${wardLabel ? `<p class="note-ward">${wardLabel}</p>` : ""}
      <p class="note-body">${esc(item.note)}</p>
      ${item.register ? `<p class="note-register">${esc(item.register)}</p>` : ""}
      <span class="note-rule">RULE · ${esc(item.rule)}</span>
      <div class="note-foot">
        <span class="round-points">DIAGNOSIS +${state.roundDiag} · TREATMENT +${state.roundTreat} · CASE ${state.caseScore}/100 ${noteStars(stars)}</span>
        <button class="btn mint" id="nextBtn" type="button">${last ? "Course record →" : wardDone ? "Next ward →" : "Next case →"}</button>
      </div>`;
    els.stageFoot.append(note);
    const nextBtn = document.getElementById("nextBtn");
    if (nextBtn) nextBtn.addEventListener("click", nextCase);
    window.requestAnimationFrame(() => {
      if (nextBtn) nextBtn.focus({ preventScroll: true });
      note.scrollIntoView({
        block: "nearest",
        behavior: reduceMotion ? "auto" : "smooth",
      });
    });
  }

  function recordCase() {
    if (state.recorded) return;
    state.recorded = true;
    const item = currentCase();
    const previous = progress.cases[item.id];
    if (!previous || state.caseScore > previous.score) {
      progress.cases[item.id] = { score: state.caseScore, stars: starsFor(state.caseScore) };
    }
    recomputeUnlocked();
    saveProgress();
    saveBest();
    updateTop();
  }

  function nextCase() {
    const next = nextUncompleted();
    if (next) {
      startCase(next.id);
      return;
    }
    showCourse();
  }

  /* ---------- course record ---------- */

  function showCourse() {
    updateTop();
    const total = totalBest();
    const stars = totalStars();
    els.resultKicker.textContent = "COURSE COMPLETE";
    els.resultMark.innerHTML = icon("check");
    els.resultTitle.textContent = "Ward closed.";
    els.resultCopy.textContent = "You closed all fifteen cases. The notes stay here so you can review any grammar point again.";
    els.resultScore.textContent = String(total);
    els.resultMax.textContent = "/ 1500";
    els.resultStars.innerHTML = `<span class="cert-star">${icon("star")} ${stars} / 45 stars</span>`;
    els.resultLog.innerHTML = CHAPTERS.map((chapter, index) => {
      const stats = chapterStats(index);
      return `<div class="result-row"><span>Ward ${chapter.roman} · ${esc(chapter.title)}</span><b>${stats.points} / 500</b></div>`;
    }).join("");
    els.resultActions.innerHTML = `
      <button class="btn primary" type="button" data-course-map>Ward map</button>
      <a class="btn ghost" href="../index.html">Back to Arcade</a>`;
    if (typeof ED.report === "function") ED.report(total);
    showScreen("result");
  }

  /* ---------- reset ---------- */

  function resetProgress() {
    if (!window.confirm("Reset all 15 case scores and stars on this device?")) return;
    try {
      localStorage.removeItem(PROGRESS_KEY);
      localStorage.removeItem("english-demo:sentence-surgery");
    } catch (err) {
      /* noop */
    }
    Object.keys(progress.cases).forEach((id) => delete progress.cases[id]);
    progress.unlocked = 1;
    saveProgress();
    updateTop();
    renderMap();
    toast("Progress reset.");
  }

  /* ---------- events ---------- */

  els.continueBtn.addEventListener("click", () => {
    if (allComplete()) {
      showCourse();
      return;
    }
    const next = nextUncompleted() || CASES[0];
    startCase(next.id);
  });
  els.howBtn.addEventListener("click", () => {
    els.howModal.hidden = false;
    els.howClose.focus({ preventScroll: true });
  });
  els.howClose.addEventListener("click", () => { els.howModal.hidden = true; });
  els.howDone.addEventListener("click", () => { els.howModal.hidden = true; });
  els.howModal.addEventListener("click", (event) => {
    if (event.target === els.howModal) els.howModal.hidden = true;
  });
  els.resetBtn.addEventListener("click", resetProgress);
  els.mapBackBtn.addEventListener("click", showMap);
  document.querySelectorAll("[data-go-map]").forEach((node) => {
    node.addEventListener("click", (event) => {
      event.preventDefault();
      showMap();
    });
  });
  els.chapterList.addEventListener("click", (event) => {
    const node = event.target.closest("[data-case]");
    if (node && !node.disabled) {
      startCase(node.dataset.case);
      return;
    }
    const chapter = event.target.closest("[data-chapter]");
    if (chapter && !chapter.disabled) openChapter(Number(chapter.dataset.chapter));
  });
  els.resultActions.addEventListener("click", (event) => {
    if (event.target.closest("[data-course-map]")) showMap();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.howModal.hidden) els.howModal.hidden = true;
  });

  /* ---------- boot ---------- */

  showMap();

  window.__SURGERY__ = {
    get state() { return { ...state, triedTokens: undefined, triedTreatments: undefined }; },
    get progress() { return JSON.parse(JSON.stringify(progress)); },
    cases: CASES,
    chapters: CHAPTERS,
    startCase,
    showMap,
    resetProgress,
  };
})();
