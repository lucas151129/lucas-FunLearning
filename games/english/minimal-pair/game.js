/* Minimal Pair Arcade — local listening demo.
   No dependencies, no network, no autoplay. */
(function () {
  "use strict";

  const GAME_ID = "minimal-pair";
  const TOTAL_ROUNDS = 5;

  const PAIRS = [
    {
      a: { word: "ship", ipa: "/ʃɪp/", vowel: "short /ɪ/", meaning: "船" },
      b: { word: "sheep", ipa: "/ʃiːp/", vowel: "long /iː/", meaning: "羊" },
      tip: {
        en: "ship /ɪ/ is short and relaxed; sheep /iː/ is long and tense.",
        zh: "ship 的 /ɪ/ 短而鬆；sheep 的 /iː/ 要拉長，嘴角向兩邊拉。",
      },
      side: "Listen for length, not loudness: /ɪ/ is a quick blip, /iː/ a long glide.",
    },
    {
      a: { word: "thin", ipa: "/θɪn/", vowel: "teeth /θ/", meaning: "瘦的" },
      b: { word: "sin", ipa: "/sɪn/", vowel: "hiss /s/", meaning: "罪" },
      tip: {
        en: "thin /θ/: tongue lightly between the teeth. sin /s/: tongue behind the teeth.",
        zh: "thin 的 /θ/ 舌尖輕放在齒間送氣；sin 的 /s/ 舌尖留在齒後。",
      },
      side: "A finger at the lips: /θ/ feels soft and spread; /s/ is a sharp hiss.",
    },
    {
      a: { word: "full", ipa: "/fʊl/", vowel: "short /ʊ/", meaning: "滿的" },
      b: { word: "fool", ipa: "/fuːl/", vowel: "long /uː/", meaning: "傻瓜" },
      tip: {
        en: "full /ʊ/ is short with looser lips; fool /uː/ is long with tight round lips.",
        zh: "full 的 /ʊ/ 短、嘴唇略鬆；fool 的 /uː/ 長、嘴唇收圓。",
      },
      side: "Both vowels are rounded — hold the sound longer for fool.",
    },
    {
      a: { word: "live", ipa: "/lɪv/", vowel: "short /ɪ/", meaning: "居住" },
      b: { word: "leave", ipa: "/liːv/", vowel: "long /iː/", meaning: "離開" },
      tip: {
        en: "live /ɪ/ is short; leave /iː/ is long. Keep the final /v/ buzzing.",
        zh: "live 的 /ɪ/ 短；leave 的 /iː/ 長。兩字結尾 /v/ 都要震動聲帶。",
      },
      side: "Here live is the verb (to live somewhere), not the adjective for a live show.",
    },
    {
      a: { word: "bad", ipa: "/bæd/", vowel: "open /æ/", meaning: "壞的" },
      b: { word: "bed", ipa: "/bed/", vowel: "mid /e/", meaning: "床" },
      tip: {
        en: "bad /æ/ opens the jaw wide; bed /e/ keeps the mouth narrower.",
        zh: "bad 的 /æ/ 下巴放低、嘴巴張大；bed 的 /e/ 口型較窄。",
      },
      side: "Say both slowly in a mirror: /æ/ drops the jaw, /e/ sits higher.",
    },
  ];

  const synth = window.speechSynthesis || null;
  const Utterance = window.SpeechSynthesisUtterance;
  const canSpeak = Boolean(synth && typeof Utterance === "function" && typeof synth.speak === "function");

  const el = {
    hudRound: document.getElementById("hudRound"),
    hudScore: document.getElementById("hudScore"),
    hudBest: document.getElementById("hudBest"),
    stage: document.getElementById("stage"),
    stagePanel: document.getElementById("stagePanel"),
    roundLabel: document.getElementById("roundLabel"),
    roundMax: document.getElementById("roundMax"),
    progressTrack: document.getElementById("progressTrack"),
    progressBar: document.getElementById("progressBar"),
    playBtn: document.getElementById("playBtn"),
    playLabel: document.getElementById("playLabel"),
    playSub: document.getElementById("playSub"),
    playNote: document.getElementById("playNote"),
    scopeLabel: document.getElementById("scopeLabel"),
    wave: document.getElementById("wave"),
    audioError: document.getElementById("audioError"),
    fallbackBtn: document.getElementById("fallbackBtn"),
    lanes: Array.prototype.slice.call(document.querySelectorAll(".lane")),
    feedback: document.getElementById("feedback"),
    nextBtn: document.getElementById("nextBtn"),
    tipCard: document.getElementById("tipCard"),
    tipCopy: document.getElementById("tipCopy"),
    resultScreen: document.getElementById("resultScreen"),
    finalScore: document.getElementById("finalScore"),
    finalLine: document.getElementById("finalLine"),
    roundChips: document.getElementById("roundChips"),
    pairReview: document.getElementById("pairReview"),
    bestLine: document.getElementById("bestLine"),
    bestValue: document.getElementById("bestValue"),
    bestNote: document.getElementById("bestNote"),
    replayBtn: document.getElementById("replayBtn"),
    srStatus: document.getElementById("srStatus"),
    sidePair: document.getElementById("tipsTitle"),
    sideIpa: document.getElementById("sideIpa"),
    sideTip: document.getElementById("sideTip"),
    sideFoot: document.getElementById("sideFoot"),
  };

  const state = {
    round: 0,
    score: 0,
    points: 0,
    plays: 0,
    attempts: 0,
    answered: false,
    finished: false,
    practice: false,
    targetLane: 0,
    wrongLane: -1,
    lanes: [],
    results: [],
    speechOK: canSpeak,
    speaking: false,
    audioStarted: false,
  };

  let bestBefore = 0;
  let voices = [];
  let speechToken = 0;
  let watchdog = 0;
  let didStart = false;
  let currentUtterance = null;

  /* ---------- small helpers ---------- */

  function currentPair() { return PAIRS[state.round]; }
  function currentWord() { return state.lanes[state.targetLane]; }

  function readBest() {
    try {
      if (window.EnglishDemo) return Number(window.EnglishDemo.best(GAME_ID)) || 0;
    } catch (err) { /* storage blocked */ }
    try {
      return Number(localStorage.getItem("english-demo:" + GAME_ID)) || 0;
    } catch (err) {
      return 0;
    }
  }

  function setFeedback(text, tone) {
    el.feedback.className = "feedback" + (tone ? " is-" + tone : "");
    el.feedback.textContent = text;
  }

  function pulsePlay() {
    el.playBtn.classList.remove("is-pulse");
    void el.playBtn.offsetWidth;
    el.playBtn.classList.add("is-pulse");
  }

  function clearWatchdog() {
    if (watchdog) {
      window.clearTimeout(watchdog);
      watchdog = 0;
    }
  }

  /* ---------- render ---------- */

  function renderHud() {
    el.hudRound.textContent = (state.round + 1) + "/" + TOTAL_ROUNDS;
    el.hudScore.textContent = String(state.score);
    el.hudBest.textContent = String(Math.max(bestBefore, state.score));
  }

  function renderRoundMeta() {
    el.roundLabel.textContent = "ROUND " + (state.round + 1) + " / " + TOTAL_ROUNDS;
    if (state.answered) {
      el.roundMax.textContent = state.practice ? "PRACTICE" : "+" + state.points + " PTS";
    } else if (state.attempts > 0) {
      el.roundMax.textContent = "MAX 40";
    } else if (!state.speechOK) {
      el.roundMax.textContent = "PRACTICE";
    } else {
      el.roundMax.textContent = "MAX " + (state.plays > 1 ? 70 : 100);
    }
    const done = state.round + (state.answered ? 1 : 0);
    el.progressBar.style.width = ((done / TOTAL_ROUNDS) * 100) + "%";
    el.progressTrack.setAttribute("aria-valuenow", String(done));
  }

  function renderLanes() {
    el.lanes.forEach(function (btn, i) {
      const word = state.lanes[i];
      const wordEl = btn.querySelector(".lane-word");
      const ipaEl = btn.querySelector(".lane-ipa");
      const badge = btn.querySelector(".lane-badge");
      const foot = btn.querySelector(".lane-foot");
      wordEl.textContent = word.word;
      ipaEl.textContent = word.ipa;
      if (badge) badge.textContent = "";
      if (foot) foot.textContent = "TAP IF YOU HEARD THIS";
      btn.classList.remove("is-correct", "is-wrong", "is-dim");
      btn.removeAttribute("aria-disabled");
      if (badge) badge.removeAttribute("aria-hidden");
      btn.setAttribute("aria-label",
        "Lane " + (i + 1) + ": " + word.word + ", " + word.ipa + ". Tap if this is the word you heard.");
    });
  }

  function renderSide(pair) {
    el.sidePair.textContent = pair.a.word + " / " + pair.b.word;
    el.sideIpa.textContent = "";
    [pair.a, pair.b].forEach(function (word, i) {
      const row = document.createElement("div");
      row.className = "ipa-row " + (i === 0 ? "a" : "b");

      const wordEl = document.createElement("span");
      wordEl.className = "ipa-word";
      wordEl.textContent = word.word;

      const sym = document.createElement("span");
      sym.className = "ipa-sym";
      sym.textContent = word.ipa;

      const tag = document.createElement("span");
      tag.className = "ipa-tag";
      tag.textContent = word.vowel;

      row.appendChild(wordEl);
      row.appendChild(sym);
      row.appendChild(tag);
      el.sideIpa.appendChild(row);
    });
    el.sideTip.textContent = pair.side;
    el.sideFoot.textContent = state.speechOK
      ? "VOICE · en-US · RATE 0.8"
      : "VOICE · UNAVAILABLE ON THIS BROWSER";
  }

  function noteText() {
    if (state.answered) {
      return state.practice
        ? "Practice round — no points for this one."
        : "Round locked. Press Next when you are ready.";
    }
    if (state.attempts > 0) return "One retry left. A correct retry scores 40.";
    if (state.plays === 0) return "Press Play, listen once, then tap the lane. First-try answer = 100.";
    if (state.plays === 1) return "Tap a lane, or replay once — the round is then worth 70.";
    return "Replay used — this round is worth 70.";
  }

  function renderConsole() {
    const supported = state.speechOK;
    el.playBtn.disabled = !supported || state.answered || state.finished;
    el.playBtn.classList.toggle("is-off", !supported);

    if (supported) el.playNote.textContent = noteText();

    if (!supported) {
      el.playLabel.textContent = "Audio unavailable";
      el.playSub.textContent = "practice mode below";
    } else if (state.answered) {
      el.playLabel.textContent = "Round complete";
      el.playSub.textContent = "next when ready";
    } else if (state.speaking) {
      el.playLabel.textContent = "Playing…";
      el.playSub.textContent = "listen…";
    } else if (state.plays > 0) {
      el.playLabel.textContent = "Play again";
      el.playSub.textContent = state.attempts > 0 ? "replay · max 40" : "replay · max 70";
    } else {
      el.playLabel.textContent = "Play word";
      el.playSub.textContent = "tap to hear · en-US";
    }

    el.playNote.hidden = !supported;
    el.audioError.hidden = supported;
    el.fallbackBtn.disabled = state.answered;
    el.scopeLabel.textContent = !supported
      ? "AUDIO OFF"
      : state.speaking
        ? "PLAYING"
        : state.answered
          ? "LOCKED"
          : state.plays > 1
            ? "REPLAY"
            : "READY";
  }

  function setSpeaking(on) {
    state.speaking = on;
    el.stagePanel.classList.toggle("is-speaking", on);
    renderConsole();
  }

  /* ---------- speech ---------- */

  function refreshVoices() {
    if (!synth) return;
    try {
      voices = synth.getVoices() || [];
    } catch (err) {
      voices = [];
    }
  }

  function pickVoice() {
    if (!voices.length) return null;
    const us = voices.find(function (v) { return /^en[-_]US/i.test(v.lang || ""); });
    if (us) return us;
    const anyEnglish = voices.find(function (v) { return /^en/i.test(v.lang || ""); });
    return anyEnglish || null;
  }

  function stopSpeech() {
    speechToken += 1;
    clearWatchdog();
    if (synth) {
      try { synth.cancel(); } catch (err) { /* ignore */ }
    }
    currentUtterance = null;
    didStart = false;
    setSpeaking(false);
  }

  function markAudioUnavailable() {
    if (!state.speechOK) return;
    state.speechOK = false;
    state.speaking = false;
    el.stagePanel.classList.remove("is-speaking");
    clearWatchdog();
    speechToken += 1;
    if (synth) {
      try { synth.cancel(); } catch (err) { /* ignore */ }
    }
    currentUtterance = null;
    if (!state.answered) {
      setFeedback("Audio is off — use the practice button above. This round scores 0.", "bad");
    }
    renderConsole();
    renderSide(currentPair());
  }

  function playWord() {
    if (state.finished || state.answered || !state.speechOK) return;

    stopSpeech();
    state.plays += 1;
    renderConsole();
    renderRoundMeta();

    const word = currentWord();
    refreshVoices();

    try {
      if (synth.speaking || synth.pending) synth.cancel();
    } catch (err) { /* ignore */ }

    const token = ++speechToken;
    const utter = new Utterance(word.word);
    utter.lang = "en-US";
    utter.rate = 0.8;
    utter.pitch = 1;
    utter.volume = 1;
    const voice = pickVoice();
    if (voice) utter.voice = voice;

    didStart = false;
    currentUtterance = utter;

    utter.onstart = function () {
      if (token !== speechToken) return;
      didStart = true;
      state.audioStarted = true;
      clearWatchdog();
      setSpeaking(true);
      if (!state.answered) {
        setFeedback("Playing the word. Tap the lane when you have heard it.", "");
      }
    };

    utter.onend = function () {
      if (token !== speechToken) return;
      didStart = true;
      state.audioStarted = true;
      clearWatchdog();
      setSpeaking(false);
      if (!state.answered) {
        setFeedback("Heard it? Tap the lane that matches.", "");
      }
    };

    utter.onerror = function (event) {
      if (token !== speechToken) return;
      didStart = true;
      clearWatchdog();
      setSpeaking(false);
      const reason = event && event.error;
      if (reason === "interrupted" || reason === "canceled") return;
      markAudioUnavailable();
    };

    try {
      synth.speak(utter);
    } catch (err) {
      markAudioUnavailable();
      return;
    }

    setFeedback("Listening for the word…", "");

    watchdog = window.setTimeout(function () {
      if (token !== speechToken || didStart || state.answered) return;
      if (state.audioStarted) {
        setFeedback("Audio did not start. Tap Play word again.", "");
        renderConsole();
      } else {
        markAudioUnavailable();
      }
    }, 2400);
  }

  /* ---------- game flow ---------- */

  function startGame(fromReplay) {
    stopSpeech();
    bestBefore = readBest();
    state.round = 0;
    state.score = 0;
    state.points = 0;
    state.plays = 0;
    state.attempts = 0;
    state.answered = false;
    state.finished = false;
    state.practice = false;
    state.wrongLane = -1;
    state.audioStarted = false;
    state.speaking = false;
    el.stage.hidden = false;
    el.resultScreen.hidden = true;
    el.roundChips.textContent = "";
    el.srStatus.textContent = "";
    renderHud();
    startRound();
    if (fromReplay) {
      el.playBtn.focus({ preventScroll: true });
    }
  }

  function startRound() {
    stopSpeech();
    const pair = currentPair();

    state.plays = 0;
    state.attempts = 0;
    state.answered = false;
    state.practice = false;
    state.points = 0;
    state.wrongLane = -1;
    state.audioStarted = false;
    state.targetLane = Math.random() < 0.5 ? 0 : 1;
    state.lanes = Math.random() < 0.5 ? [pair.a, pair.b] : [pair.b, pair.a];

    renderLanes();
    renderSide(pair);
    renderRoundMeta();
    renderConsole();
    renderHud();
    el.tipCard.hidden = true;
    el.tipCard.style.removeProperty("--tip-accent");
    el.nextBtn.disabled = true;
    el.nextBtn.textContent = "Next →";
    el.srStatus.textContent = "";
    el.playBtn.classList.remove("is-pulse");

    if (state.speechOK) {
      setFeedback("Round " + (state.round + 1) + ": press Play word, then tap the lane you heard.", "");
    } else {
      setFeedback("Audio is off — use the practice button above. This round scores 0.", "bad");
    }
  }

  function markWrongLane(index) {
    const btn = el.lanes[index];
    if (!btn) return;
    const word = state.lanes[index];
    const badge = btn.querySelector(".lane-badge");
    const foot = btn.querySelector(".lane-foot");
    btn.classList.add("is-wrong");
    if (badge) badge.textContent = "✗";
    if (foot) foot.textContent = "YOUR PICK";
    btn.setAttribute("aria-label",
      "Lane " + (index + 1) + ": " + word.word + ", " + word.ipa + ". Wrong choice; one retry remains.");
  }

  function markLanesOnAnswer() {
    el.lanes.forEach(function (btn, i) {
      const word = state.lanes[i];
      const badge = btn.querySelector(".lane-badge");
      const foot = btn.querySelector(".lane-foot");
      btn.setAttribute("aria-disabled", "true");
      btn.classList.remove("is-speaking");
      if (i === state.targetLane) {
        btn.classList.add("is-correct");
        if (badge) badge.textContent = "✓";
        if (foot) foot.textContent = "CORRECT";
        btn.setAttribute("aria-label",
          "Lane " + (i + 1) + ": " + word.word + ", " + word.ipa + ". Correct answer.");
      } else if (i === state.wrongLane) {
        btn.classList.add("is-wrong");
        if (badge) badge.textContent = "✗";
        if (foot) foot.textContent = "YOUR PICK";
        btn.setAttribute("aria-label",
          "Lane " + (i + 1) + ": " + word.word + ", " + word.ipa + ". That was your choice.");
      } else {
        btn.classList.add("is-dim");
        if (foot) foot.textContent = "NOT THIS ONE";
        btn.setAttribute("aria-label",
          "Lane " + (i + 1) + ": " + word.word + ", " + word.ipa + ". Not the answer.");
      }
    });
  }

  function renderAnswer(mode) {
    const word = currentWord();
    const pair = currentPair();
    let tone = "good";
    let message;

    if (mode === "practice") {
      tone = "practice";
      message = "Practice mode — the word was “" + word.word + "” " + word.ipa + ". 0 points this round.";
    } else if (mode === "wrong") {
      tone = "bad";
      message = "Not quite — the word was “" + word.word + "” " + word.ipa + ". 0 points this round.";
    } else if (state.attempts === 0) {
      message = state.plays <= 1
        ? "Correct — 100 points! “" + word.word + "” " + word.ipa + " on the first listen."
        : "Correct — 70 points. “" + word.word + "” " + word.ipa + "; one replay used.";
    } else {
      message = "Correct on the retry — 40 points. “" + word.word + "” " + word.ipa + ".";
    }

    setFeedback(message, tone);

    el.tipCard.hidden = false;
    el.tipCard.style.setProperty("--tip-accent", state.targetLane === 0 ? "var(--neon-a)" : "var(--neon-b)");
    el.tipCopy.textContent = "";
    const en = document.createElement("span");
    en.className = "tip-en";
    en.textContent = pair.tip.en;
    const zh = document.createElement("span");
    zh.className = "tip-zh";
    zh.textContent = pair.tip.zh;
    el.tipCopy.appendChild(en);
    el.tipCopy.appendChild(zh);

    el.srStatus.textContent = "Tip: " + pair.tip.en;
    el.nextBtn.disabled = false;
    el.nextBtn.textContent = state.round + 1 >= TOTAL_ROUNDS ? "See results →" : "Next →";
  }

  function finishRound(mode, viaKeyboard) {
    if (state.answered || state.finished) return;

    let points = 0;
    if (mode === "correct") {
      if (state.attempts === 0) points = state.plays <= 1 ? 100 : 70;
      else points = 40;
    }

    state.answered = true;
    state.practice = mode === "practice";
    state.points = points;
    state.score += points;
    state.results[state.round] = {
      points: points,
      mode: mode,
      plays: state.plays,
      attempts: state.attempts,
    };

    stopSpeech();
    markLanesOnAnswer();
    renderAnswer(mode);
    renderHud();
    renderRoundMeta();
    renderConsole();

    if (viaKeyboard) {
      el.nextBtn.focus({ preventScroll: true });
    }
  }

  function enterPractice(viaKeyboard) {
    if (state.finished || state.answered) return;
    finishRound("practice", viaKeyboard);
  }

  function chooseLane(index, viaKeyboard) {
    if (state.finished || state.answered) return;
    if (!el.lanes[index]) return;

    if (!state.speechOK) {
      setFeedback("Audio is unavailable — use the practice button above.", "bad");
      el.fallbackBtn.focus({ preventScroll: true });
      return;
    }
    if (state.plays === 0) {
      setFeedback("Press Play word first — then tap the lane you heard.", "");
      pulsePlay();
      return;
    }
    if (!state.audioStarted) {
      setFeedback("The word has not played yet. Tap Play word again.", "");
      pulsePlay();
      return;
    }

    if (index === state.targetLane) {
      finishRound("correct", viaKeyboard);
      return;
    }

    state.attempts += 1;
    state.wrongLane = index;

    if (state.attempts === 1) {
      markWrongLane(index);
      setFeedback(
        "Not that one. One retry left; listen again, then tap a lane.",
        "bad"
      );
      renderRoundMeta();
      renderConsole();
      pulsePlay();
      return;
    }

    finishRound("wrong", viaKeyboard);
  }

  function goNext(viaKeyboard) {
    if (!state.answered || state.finished) return;
    if (state.round + 1 >= TOTAL_ROUNDS) {
      endGame();
      return;
    }
    state.round += 1;
    startRound();
    if (viaKeyboard) {
      el.playBtn.focus({ preventScroll: true });
    }
  }

  function praiseFor(score, practiceCount) {
    if (score === 500) return "Every vowel length landed. Perfect session.";
    if (score >= 400) return "Sharp ears — nearly a clean sweep.";
    if (score >= 250) return "Solid listening. Replay the pairs that bit back.";
    if (score > 0) return "Keep tuning; vowel length is the boss.";
    if (practiceCount === TOTAL_ROUNDS) return "Practice complete — turn the sound on to score.";
    return "No points this time. Replay and listen once more.";
  }

  function endGame() {
    if (state.finished) return;
    state.finished = true;
    stopSpeech();

    const score = state.score;
    let isNew = false;
    try {
      if (window.EnglishDemo) isNew = Boolean(window.EnglishDemo.saveBest(GAME_ID, score));
    } catch (err) { /* storage blocked */ }
    try {
      if (window.EnglishDemo) window.EnglishDemo.report(score);
    } catch (err) { /* standalone */ }

    const best = Math.max(readBest(), score);
    const counts = { perfect: 0, replay: 0, retry: 0, miss: 0, practice: 0 };

    state.results.forEach(function (result) {
      if (!result) return;
      if (result.mode === "practice") counts.practice += 1;
      else if (result.points === 100) counts.perfect += 1;
      else if (result.points === 70) counts.replay += 1;
      else if (result.points === 40) counts.retry += 1;
      else counts.miss += 1;
    });

    const parts = [];
    if (counts.perfect) parts.push(counts.perfect + " first-try");
    if (counts.replay) parts.push(counts.replay + " after replay");
    if (counts.retry) parts.push(counts.retry + " on retry");
    if (counts.miss) parts.push(counts.miss + " missed");
    if (counts.practice) parts.push(counts.practice + " practice");
    const summary = parts.join(" · ");

    el.finalScore.textContent = String(score);
    const outOf = document.createElement("span");
    outOf.textContent = "/500";
    el.finalScore.appendChild(outOf);
    el.finalLine.textContent = (summary ? summary + ". " : "") + praiseFor(score, counts.practice);
    el.bestValue.textContent = String(best);
    el.bestLine.classList.toggle("is-new", isNew);
    if (isNew) {
      el.bestNote.textContent = "new record · saved here";
    } else if (best > 0) {
      el.bestNote.textContent = "saved on this device";
    } else {
      el.bestNote.textContent = "no best yet";
    }

    el.roundChips.textContent = "";
    state.results.forEach(function (result, i) {
      if (!result) return;
      const chip = document.createElement("span");
      let cls = "miss";
      let label = String(result.points);
      if (result.mode === "practice") {
        cls = "practice";
        label = "P";
      } else if (result.points === 100) {
        cls = "perfect";
      } else if (result.points === 70) {
        cls = "replay";
      } else if (result.points === 40) {
        cls = "retry";
      }
      chip.className = "round-chip " + cls;
      const roundName = document.createElement("span");
      roundName.textContent = "R" + (i + 1);
      const value = document.createElement("b");
      value.textContent = label;
      chip.appendChild(roundName);
      chip.appendChild(value);
      chip.setAttribute("aria-label", "Round " + (i + 1) + ": " + (result.mode === "practice" ? "practice, 0" : result.points) + " points");
      el.roundChips.appendChild(chip);
    });

    el.pairReview.innerHTML = "";
    const reviewHead = document.createElement("div");
    reviewHead.className = "pair-review-head";
    reviewHead.innerHTML = "<span>PAIR REVIEW · 聽音回顧</span><small>one contrast at a time</small>";
    el.pairReview.appendChild(reviewHead);
    PAIRS.forEach(function (pair, i) {
      const result = state.results[i];
      const status = !result ? "MISSED" : result.mode === "practice" ? "PRACTICE" : result.points === 100 ? "CLEAN" : "REVIEW";
      const row = document.createElement("div");
      row.className = "pair-review-row" + (status === "MISSED" || status === "REVIEW" ? " is-weak" : "");
      row.innerHTML =
        '<div class="pair-review-words"><b>' + pair.a.word + '</b><span>' + pair.a.ipa +
        '</span><i>↔</i><b>' + pair.b.word + '</b><span>' + pair.b.ipa + "</span></div>" +
        '<p>' + pair.side + "</p>" +
        '<span class="pair-review-status">' + status + "</span>";
      row.setAttribute("aria-label", "Round " + (i + 1) + ": " + pair.a.word + " versus " + pair.b.word + ". " + status + ". " + pair.side);
      el.pairReview.appendChild(row);
    });

    el.hudRound.textContent = TOTAL_ROUNDS + "/" + TOTAL_ROUNDS;
    el.hudScore.textContent = String(score);
    el.hudBest.textContent = String(best);
    el.stage.hidden = true;
    el.resultScreen.hidden = false;
    el.srStatus.textContent = "Results: " + score + " out of 500. Best " + best + ".";
    el.replayBtn.focus({ preventScroll: true });
  }

  /* ---------- events ---------- */

  el.playBtn.addEventListener("click", playWord);
  el.fallbackBtn.addEventListener("click", function (event) {
    enterPractice(event.detail === 0);
  });
  el.lanes.forEach(function (btn) {
    btn.addEventListener("click", function (event) {
      chooseLane(Number(btn.dataset.lane), event.detail === 0);
    });
  });
  el.nextBtn.addEventListener("click", function (event) {
    goNext(event.detail === 0);
  });
  el.replayBtn.addEventListener("click", function () {
    startGame(true);
  });

  document.addEventListener("keydown", function (event) {
    if (state.finished) return;
    if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
    const tag = (event.target && event.target.tagName ? event.target.tagName : "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return;

    if (event.key === "1" || event.key === "2") {
      event.preventDefault();
      chooseLane(Number(event.key) - 1, true);
      return;
    }
    if (event.key === "p" || event.key === "P") {
      event.preventDefault();
      if (!el.playBtn.disabled) playWord();
      return;
    }
    if (event.key === "Enter" && state.answered && !el.nextBtn.disabled) {
      const target = event.target;
      const isAction = target === el.nextBtn || target === el.replayBtn ||
        (target && typeof target.closest === "function" && target.closest("a"));
      if (!isAction) {
        event.preventDefault();
        goNext(true);
      }
    }
  });

  window.addEventListener("pagehide", function () {
    stopSpeech();
  });

  /* ---------- boot ---------- */

  (function buildWave() {
    for (let i = 0; i < 12; i += 1) {
      const bar = document.createElement("span");
      el.wave.appendChild(bar);
    }
  })();

  if (synth) {
    refreshVoices();
    if (typeof synth.addEventListener === "function") {
      synth.addEventListener("voiceschanged", refreshVoices);
    } else {
      synth.onvoiceschanged = refreshVoices;
    }
  }

  bestBefore = readBest();
  startGame(false);
})();
