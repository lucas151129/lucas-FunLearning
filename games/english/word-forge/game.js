/* Word Forge · 字根鍛造廠
   Morphology demo: build each word from prefix / root / suffix tiles.
   Data lives here; every round renders into the same DOM (no reloads). */
(() => {
  "use strict";

  const GAME_ID = "word-forge";
  const MAX_ROUNDS = 10;
  const ATTEMPT_SCORES = [100, 60, 30];

  const ROUNDS = [
    {
      word: "unbreakable",
      definition: "cannot be broken",
      parts: [
        { text: "un", role: "prefix", gloss: "not", hint: "a prefix that means “not”" },
        { text: "break", role: "root", gloss: "to crack", hint: "a root that means “to break”" },
        { text: "able", role: "suffix", gloss: "can be done", hint: "a suffix that means “can be done”" },
      ],
      distractors: [
        { text: "re", role: "prefix", gloss: "again" },
        { text: "tele", role: "prefix", gloss: "far" },
        { text: "view", role: "root", gloss: "to see" },
        { text: "ful", role: "suffix", gloss: "full of" },
        { text: "ment", role: "suffix", gloss: "action/result" },
      ],
      confusions: {
        unviewable: "That spells “unviewable” — un- (not) + view (to see) + -able (can be) means “cannot be viewed”. The clue needs the root for “break”.",
      },
      note: "un- (not) + break (to crack) + -able (can be done) = “cannot be broken”. The suffix -able turns a verb into an adjective: break → breakable. Then un- flips the meaning.",
      tip: "The clue says “cannot”. Find a prefix that flips the meaning.",
    },
    {
      word: "preview",
      definition: "to see something before others",
      parts: [
        { text: "pre", role: "prefix", gloss: "before", hint: "a prefix that means “before”" },
        { text: "view", role: "root", gloss: "to see", hint: "a root that means “to see”" },
      ],
      distractors: [
        { text: "re", role: "prefix", gloss: "again" },
        { text: "tele", role: "prefix", gloss: "far" },
        { text: "dis", role: "prefix", gloss: "not/apart" },
        { text: "port", role: "root", gloss: "to carry" },
        { text: "ful", role: "suffix", gloss: "full of" },
      ],
      confusions: {
        review: "That spells “review” — re- means “again”, so review is “to look again”. Slot 1 needs the prefix that means “before”.",
      },
      note: "pre- (before) + view (to see) = to see something before others. Compare review: re- (again) + view = to look at something again. One prefix changes the whole idea.",
      tip: "Two prefixes here mean “again” and “before”. Pick the one the clue asks for.",
    },
    {
      word: "biography",
      definition: "a written life story",
      parts: [
        { text: "bio", role: "prefix", gloss: "life", hint: "a prefix that means “life”" },
        { text: "graph", role: "root", gloss: "to write", hint: "a root that means “write or draw”" },
        { text: "y", role: "suffix", gloss: "noun", hint: "a suffix that turns the word into a noun" },
      ],
      distractors: [
        { text: "tele", role: "prefix", gloss: "far" },
        { text: "phon", role: "root", gloss: "sound" },
        { text: "logy", role: "suffix", gloss: "study of" },
        { text: "pre", role: "prefix", gloss: "before" },
        { text: "un", role: "prefix", gloss: "not" },
        { text: "ful", role: "suffix", gloss: "full of" },
      ],
      confusions: {
        telegraphy: "That spells “telegraphy” — tele- means “far”, so it is writing sent across a distance. The clue needs the prefix for “life”.",
        biophony: "That spells “biophony” — phon means “sound”, so it is about the sounds of life, not a written life story. Slot 2 needs the root for “write”.",
      },
      note: "bio- (life) + graph (write or draw) + -y (noun ending) = a written life story. Compare biology: bio + logy (the study of) = the study of life.",
      tip: "Three pieces this time. Start with the one that means “life”.",
    },
    {
      word: "transport",
      definition: "to carry something across",
      parts: [
        { text: "trans", role: "prefix", gloss: "across", hint: "a prefix that means “across”" },
        { text: "port", role: "root", gloss: "to carry", hint: "a root that means “to carry”" },
      ],
      distractors: [
        { text: "ex", role: "prefix", gloss: "out" },
        { text: "sub", role: "prefix", gloss: "under" },
        { text: "pre", role: "prefix", gloss: "before" },
        { text: "tele", role: "prefix", gloss: "far" },
        { text: "form", role: "root", gloss: "shape" },
        { text: "able", role: "suffix", gloss: "can be" },
      ],
      confusions: {
        export: "That spells “export” — ex- means “out”, so export is “to carry out”. The clue needs the prefix for “across”.",
        transform: "That spells “transform” — trans- is right, but form means “shape”, so it means “to change shape”. The clue needs the root for “carry”.",
      },
      note: "trans- (across) + port (to carry) = to carry something across. Port also hides in airport and portable — a place or a way of carrying.",
      tip: "The prefixes here show direction: across, out, under, before. Match the clue.",
    },
    {
      word: "careless",
      definition: "without care",
      parts: [
        { text: "care", role: "root", gloss: "attention", hint: "a root that means “care”" },
        { text: "less", role: "suffix", gloss: "without", hint: "a suffix that means “without”" },
      ],
      distractors: [
        { text: "ful", role: "suffix", gloss: "full of" },
        { text: "ness", role: "suffix", gloss: "state" },
        { text: "un", role: "prefix", gloss: "not" },
        { text: "re", role: "prefix", gloss: "again" },
        { text: "ment", role: "suffix", gloss: "action/result" },
      ],
      confusions: {
        careful: "That spells “careful” — -ful means “full of”, so careful is “full of care”. The clue needs the opposite: the suffix for “without”.",
      },
      note: "care (attention or worry) + -less (without) = without care. Careful is the opposite: -ful means “full of”, so careful is “full of care”.",
      tip: "The clue says “without”. Find the suffix that can carry that meaning.",
    },
    {
      word: "rewrite",
      definition: "to write something again",
      parts: [
        { text: "re", role: "prefix", gloss: "again", hint: "a prefix that means “again”" },
        { text: "write", role: "root", gloss: "to put words on paper", hint: "a root that means “write”" },
      ],
      distractors: [
        { text: "pre", role: "prefix", gloss: "before" },
        { text: "un", role: "prefix", gloss: "not" },
        { text: "mis", role: "prefix", gloss: "wrongly" },
        { text: "read", role: "root", gloss: "to look at words" },
        { text: "able", role: "suffix", gloss: "can be" },
        { text: "ing", role: "suffix", gloss: "-ing form" },
      ],
      confusions: {
        prewrite: "That spells “prewrite” — pre- means “before”, not “again”. The clue needs the prefix for doing something a second time.",
        miswrite: "That spells “miswrite” — mis- means “wrongly”. The clue asks for “again”, not “wrongly”.",
      },
      note: "re- (again) + write (to put words on paper) = to write something again. The same re- appears in rebuild and replay: do it again.",
      tip: "The clue says “again”. Find the prefix that repeats an action.",
    },
    {
      word: "geology",
      definition: "the study of the earth",
      parts: [
        { text: "geo", role: "root", gloss: "earth", hint: "a root that means “earth”" },
        { text: "logy", role: "suffix", gloss: "study of", hint: "a suffix that means “the study of”" },
      ],
      distractors: [
        { text: "bio", role: "root", gloss: "life" },
        { text: "graph", role: "root", gloss: "write" },
        { text: "phon", role: "root", gloss: "sound" },
        { text: "ist", role: "suffix", gloss: "person who" },
        { text: "meter", role: "suffix", gloss: "measure" },
        { text: "un", role: "prefix", gloss: "not" },
      ],
      confusions: {
        biology: "That spells “biology” — bio- means “life”, so it is the study of life. The clue asks for the study of the earth.",
        geography: "That spells “geography” — geo- is right, but graph means “write or draw”. Geography is about describing the earth; the clue asks for the study of it.",
      },
      note: "geo- (earth) + -logy (the study of) = the study of the earth. Compare biology (life) and psychology (the mind): the suffix names the field.",
      tip: "The clue says “study of the earth”. Find the root for “earth”.",
    },
    {
      word: "bicycle",
      definition: "a vehicle with two wheels",
      parts: [
        { text: "bi", role: "prefix", gloss: "two", hint: "a prefix that means “two”" },
        { text: "cycle", role: "root", gloss: "wheel or circle", hint: "a root that means “wheel”" },
      ],
      distractors: [
        { text: "tri", role: "prefix", gloss: "three" },
        { text: "uni", role: "prefix", gloss: "one" },
        { text: "motor", role: "root", gloss: "engine" },
        { text: "ist", role: "suffix", gloss: "person who" },
        { text: "ing", role: "suffix", gloss: "-ing form" },
        { text: "re", role: "prefix", gloss: "again" },
      ],
      confusions: {
        tricycle: "That spells “tricycle” — tri- means “three”. The clue needs the prefix for “two”.",
        unicycle: "That spells “unicycle” — uni- means “one”. The clue needs two wheels.",
      },
      note: "bi- (two) + cycle (wheel) = a two-wheeled vehicle. The same bi- appears in bilingual (two languages) and bimonthly (every two months).",
      tip: "The clue gives the number of wheels. Match the number prefix.",
    },
    {
      word: "microscope",
      definition: "an instrument for looking at very small things",
      parts: [
        { text: "micro", role: "prefix", gloss: "very small", hint: "a prefix that means “very small”" },
        { text: "scope", role: "root", gloss: "to look at", hint: "a root that means “look at”" },
      ],
      distractors: [
        { text: "tele", role: "prefix", gloss: "far" },
        { text: "macro", role: "prefix", gloss: "large" },
        { text: "phon", role: "root", gloss: "sound" },
        { text: "graph", role: "root", gloss: "write" },
        { text: "ist", role: "suffix", gloss: "person who" },
        { text: "ing", role: "suffix", gloss: "-ing form" },
      ],
      confusions: {
        telescope: "That spells “telescope” — tele- means “far”, so it is for looking at distant things. The clue needs “very small”.",
        microphone: "That spells “microphone” — micro- is right, but phon means “sound”. The clue asks for an instrument for looking.",
      },
      note: "micro- (very small) + -scope (to look at) = an instrument for looking at very small things. Tele- (far) + scope gives telescope: an instrument for looking far.",
      tip: "The clue says “very small” and “looking”. Match both halves.",
    },
    {
      word: "international",
      definition: "between nations",
      parts: [
        { text: "inter", role: "prefix", gloss: "between", hint: "a prefix that means “between”" },
        { text: "nation", role: "root", gloss: "country", hint: "a root that means “nation”" },
        { text: "al", role: "suffix", gloss: "relating to", hint: "a suffix that means “relating to”" },
      ],
      distractors: [
        { text: "intra", role: "prefix", gloss: "within" },
        { text: "trans", role: "prefix", gloss: "across" },
        { text: "national", role: "root", gloss: "of a nation" },
        { text: "ism", role: "suffix", gloss: "belief/system" },
        { text: "ist", role: "suffix", gloss: "person who" },
        { text: "ly", role: "suffix", gloss: "in that way" },
      ],
      confusions: {
        intranational: "That spells “intranational” — intra- means “within”, so it is within one nation. The clue needs “between” nations.",
        transnational: "That spells “transnational” — trans- means “across”. Inter- is the more precise prefix for “between”.",
      },
      note: "inter- (between) + nation (country) + -al (relating to) = between nations. Compare intranational: intra- means “within” one nation.",
      tip: "Three pieces: between + nation + relating to.",
    },
  ];

  const ROLE_NAME = { prefix: "prefix", root: "root", suffix: "suffix" };

  const state = {
    roundIndex: 0,
    score: 0,
    attempts: 0,
    phase: "playing",
    slots: [],
    pool: [],
    results: [],
    best: 0,
  };

  const el = {};
  let sparkTimer = 0;
  let bumpTimer = 0;

  /* -------------------------------------------------------------- helpers */

  function safeBest() {
    try {
      if (window.EnglishDemo && typeof window.EnglishDemo.best === "function") {
        return Number(window.EnglishDemo.best(GAME_ID)) || 0;
      }
    } catch (err) {
      /* storage blocked */
    }
    return 0;
  }

  function saveBestSafe(score) {
    try {
      if (window.EnglishDemo && typeof window.EnglishDemo.saveBest === "function") {
        return Boolean(window.EnglishDemo.saveBest("word-forge", score));
      }
    } catch (err) {
      /* storage blocked */
    }
    return false;
  }

  function reportSafe(score) {
    try {
      if (window.EnglishDemo && typeof window.EnglishDemo.report === "function") {
        window.EnglishDemo.report(score);
      }
    } catch (err) {
      /* standalone demo */
    }
  }

  function shuffle(list) {
    if (window.EnglishDemo && typeof window.EnglishDemo.shuffle === "function") {
      return window.EnglishDemo.shuffle(list);
    }
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function currentRound() {
    return ROUNDS[state.roundIndex];
  }

  function displayPart(part) {
    if (part.role === "prefix") return part.text + "-";
    if (part.role === "suffix") return "-" + part.text;
    return part.text;
  }

  function breakdownText(round) {
    return round.parts.map(displayPart).join(" + ");
  }

  function makeNode(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function setFeedback(message, tone) {
    el.feedback.textContent = message;
    el.feedback.classList.toggle("is-good", tone === "good");
    el.feedback.classList.toggle("is-bad", tone === "bad");
  }

  /* ---------------------------------------------------------------- cache */

  function cacheElements() {
    el.roundValue = document.getElementById("roundValue");
    el.scoreValue = document.getElementById("scoreValue");
    el.scoreChip = document.getElementById("scoreChip");
    el.roundLabel = document.getElementById("roundLabel");
    el.partsLabel = document.getElementById("partsLabel");
    el.progressBar = document.getElementById("progressBar");
    el.progressTrack = document.getElementById("progressTrack");
    el.definition = document.getElementById("definition");
    el.clueParts = document.getElementById("clueParts");
    el.instruction = document.getElementById("instruction");
    el.slots = document.getElementById("slots");
    el.forgeStage = document.getElementById("forgeStage");
    el.stageStamp = document.getElementById("stageStamp");
    el.forgedWord = document.getElementById("forgedWord");
    el.forgedCount = document.getElementById("forgedCount");
    el.pool = document.getElementById("pool");
    el.poolMeta = document.getElementById("poolMeta");
    el.tryNote = document.getElementById("tryNote");
    el.checkBtn = document.getElementById("checkBtn");
    el.nextBtn = document.getElementById("nextBtn");
    el.feedback = document.getElementById("feedback");
    el.noteCard = document.getElementById("noteCard");
    el.noteBreakdown = document.getElementById("noteBreakdown");
    el.noteCopy = document.getElementById("noteCopy");
    el.sideTip = document.getElementById("sideTip");
    el.playLayout = document.getElementById("playLayout");
    el.resultScreen = document.getElementById("resultScreen");
    el.resultScore = document.getElementById("resultScore");
    el.resultSub = document.getElementById("resultSub");
    el.resultBest = document.getElementById("resultBest");
    el.resultBadge = document.getElementById("resultBadge");
    el.resultRecap = document.getElementById("resultRecap");
    el.replayBtn = document.getElementById("replayBtn");
  }

  /* --------------------------------------------------------------- render */

  function startGame() {
    state.roundIndex = 0;
    state.score = 0;
    state.attempts = 0;
    state.phase = "playing";
    state.results = [];
    state.best = safeBest();
    el.resultScreen.hidden = true;
    el.playLayout.hidden = false;
    el.resultBadge.hidden = true;
    el.resultRecap.replaceChildren();
    window.scrollTo({ top: 0, behavior: "auto" });
    renderRound(false);
  }

  function renderRound(focusFirst) {
    const round = currentRound();

    if (sparkTimer) {
      window.clearTimeout(sparkTimer);
      sparkTimer = 0;
    }
    el.forgeStage.classList.remove("is-struck");
    el.stageStamp.hidden = true;
    el.stageStamp.className = "stage-stamp";

    state.attempts = 0;
    state.phase = "playing";
    state.slots = new Array(round.parts.length).fill(null);
    state.pool = shuffle(round.parts.concat(round.distractors)).map((piece, index) => ({
      ...piece,
      pid: index,
    }));

    el.roundLabel.textContent = `ROUND ${state.roundIndex + 1} / ${MAX_ROUNDS}`;
    el.partsLabel.textContent = `${round.parts.length} PART${round.parts.length === 1 ? "" : "S"}`;
    el.clueParts.textContent = `${round.parts.length} PIECES`;
    el.definition.textContent = round.definition;
    el.instruction.textContent = `Build the word from ${round.parts.length} pieces: ${round.parts
      .map((part) => part.role)
      .join(" → ")}.`;
    el.sideTip.textContent = round.tip;
    el.pool.setAttribute("aria-label", `${state.pool.length} word-part tiles`);

    buildSlots(round);
    buildPool(round);
    el.pool.hidden = false;
    el.poolMeta.hidden = false;
    el.noteCard.hidden = true;
    el.noteBreakdown.replaceChildren();
    el.noteCopy.textContent = "";
    el.checkBtn.hidden = false;
    el.nextBtn.hidden = true;
    el.nextBtn.textContent = "Next Word →";

    syncTop();
    syncBoard();
    setFeedback(`Round ${state.roundIndex + 1} of ${MAX_ROUNDS}. Load the slots, then check your forging.`, "");

    if (focusFirst) {
      window.requestAnimationFrame(focusFirstTile);
    }
  }

  function buildSlots(round) {
    el.slots.replaceChildren();
    round.parts.forEach((part, index) => {
      const button = makeNode("button", "slot is-empty");
      button.type = "button";
      button.dataset.slot = String(index);
      button.dataset.role = part.role;
      button.append(makeNode("span", "slot-text", "?"));
      button.append(makeNode("span", "slot-role", part.role.toUpperCase()));
      el.slots.append(button);
    });
  }

  function buildPool(round) {
    el.pool.replaceChildren();
    state.pool.forEach((tile) => {
      const button = makeNode("button", "tile");
      button.type = "button";
      button.dataset.pid = String(tile.pid);
      button.dataset.role = tile.role;
      button.append(makeNode("span", "tile-word", tile.text));
      button.append(makeNode("span", "tile-role", tile.role.toUpperCase()));
      button.addEventListener("click", () => onTile(tile));
      el.pool.append(button);
    });
  }

  function syncTop() {
    el.roundValue.textContent = `${Math.min(state.roundIndex + 1, MAX_ROUNDS)}/${MAX_ROUNDS}`;
    el.scoreValue.textContent = String(state.score);

    const shown = state.phase === "results"
      ? MAX_ROUNDS
      : Math.min(state.roundIndex + 1, MAX_ROUNDS);
    el.progressBar.style.width = `${(shown / MAX_ROUNDS) * 100}%`;
    el.progressTrack.setAttribute("aria-valuenow", String(shown));
  }

  function syncBoard() {
    const round = currentRound();
    syncSlots(round);
    syncPool();
    syncForged();
    syncTryNote();

    const done = state.phase === "solved" || state.phase === "revealed";
    el.checkBtn.hidden = done;
    el.nextBtn.hidden = !done;
    if (done) {
      el.nextBtn.textContent = state.roundIndex === MAX_ROUNDS - 1 ? "See results →" : "Next Word →";
    }
  }

  function syncSlots(round) {
    Array.from(el.slots.children).forEach((button, index) => {
      const piece = state.slots[index];
      const need = round.parts[index];
      const locked = state.phase === "solved" || state.phase === "revealed";

      button.classList.toggle("is-empty", !piece);
      button.classList.toggle("is-filled", Boolean(piece));
      button.classList.toggle("is-locked", Boolean(piece) && state.phase === "solved");
      button.classList.toggle("is-answer", Boolean(piece) && state.phase === "revealed");
      button.dataset.role = piece ? piece.role : need.role;
      button.querySelector(".slot-text").textContent = piece ? piece.text : "?";
      button.querySelector(".slot-role").textContent = (piece ? piece.role : need.role).toUpperCase();
      button.tabIndex = piece && !locked ? 0 : -1;
      button.setAttribute("aria-disabled", locked ? "true" : "false");
      button.setAttribute(
        "aria-label",
        piece
          ? `Slot ${index + 1}: ${piece.text}. ${locked ? "Locked." : "Activate to remove this piece."}`
          : `Slot ${index + 1}: ${ROLE_NAME[need.role]}, empty.`,
      );
    });
  }

  function syncPool() {
    Array.from(el.pool.children).forEach((button, index) => {
      const tile = state.pool[index];
      const used = state.slots.includes(tile);
      button.classList.toggle("is-used", used);
      button.setAttribute("aria-pressed", used ? "true" : "false");
      button.setAttribute(
        "aria-label",
        used
          ? `${ROLE_NAME[tile.role]} ${tile.text}, on the anvil. Activate to pull it back.`
          : `${ROLE_NAME[tile.role]} ${tile.text}, meaning ${tile.gloss}. Activate to load it.`,
      );
    });
  }

  function syncForged() {
    const placed = state.slots.filter(Boolean);
    const forged = placed.map((piece) => piece.text).join("");
    el.forgedWord.textContent = forged || "—";
    el.forgedWord.classList.toggle("is-empty", !forged);
    el.forgedCount.textContent = `${placed.length} / ${state.slots.length}`;
  }

  function syncTryNote() {
    if (state.phase === "solved") {
      const result = state.results[state.roundIndex];
      el.tryNote.textContent = `FORGED · +${result ? result.points : 0} PTS`;
    } else if (state.phase === "revealed") {
      el.tryNote.textContent = "ANSWER REVEALED · 0 PTS";
    } else {
      const points = ATTEMPT_SCORES[state.attempts] ?? 0;
      el.tryNote.textContent = `TRY ${Math.min(state.attempts + 1, 3)} / 3 · ${points} PTS`;
    }
  }

  /* ----------------------------------------------------------- interaction */

  function onTile(tile) {
    if (state.phase !== "playing") return;

    const usedIndex = state.slots.indexOf(tile);
    if (usedIndex !== -1) {
      removePiece(usedIndex);
      return;
    }

    const emptyIndex = state.slots.indexOf(null);
    if (emptyIndex === -1) {
      setFeedback("The anvil is full — pull a piece back before adding another.", "");
      return;
    }

    state.slots[emptyIndex] = tile;
    syncBoard();

    if (state.slots.every(Boolean)) {
      setFeedback("All pieces loaded. Check the meaning of each part, then hit “Check word”.", "");
    } else {
      setFeedback(`Loaded “${tile.text}”. Fill the next slot, or tap a loaded piece to pull it back.`, "");
    }
  }

  function onSlot(index) {
    if (state.phase !== "playing") return;
    if (!state.slots[index]) {
      setFeedback(`Slot ${index + 1} is empty — tap a tile below to load it.`, "");
      return;
    }
    removePiece(index);
  }

  function removePiece(index) {
    const piece = state.slots[index];
    if (!piece) return;
    state.slots[index] = null;
    syncBoard();
    setFeedback(`Pulled “${piece.text}” off the anvil.`, "");
  }

  function checkAnswer() {
    if (state.phase !== "playing") return;
    const round = currentRound();

    const emptyIndex = state.slots.indexOf(null);
    if (emptyIndex !== -1) {
      setFeedback(`Slot ${emptyIndex + 1} is empty — it needs ${round.parts[emptyIndex].hint}.`, "bad");
      return;
    }

    state.attempts += 1;

    const correct = round.parts.every((part, index) => state.slots[index].text === part.text);
    if (correct) {
      solveRound(round);
      return;
    }

    if (state.attempts >= 3) {
      revealRound(round);
      return;
    }

    setFeedback(explainWrong(round, state.slots.slice()), "bad");
    syncTryNote();
  }

  function explainWrong(round, placed) {
    const forged = placed.map((piece) => piece.text).join("");
    const confusion = ringConfusion(round, forged);
    if (confusion) return confusion;

    const rightParts = round.parts.map((part) => part.text).sort().join("|");
    const triedParts = placed.map((piece) => piece.text).sort().join("|");
    if (rightParts === triedParts) {
      return "Those are the right pieces, but the order is off — a prefix comes first, then the root, then the suffix.";
    }

    for (let index = 0; index < round.parts.length; index += 1) {
      const need = round.parts[index];
      const got = placed[index];
      if (!got) return `Slot ${index + 1} is empty — it needs ${need.hint}.`;
      if (got.role !== need.role) {
        return `Slot ${index + 1} needs ${need.hint}, but “${got.text}” is a ${ROLE_NAME[got.role]}. Pull it out and try again.`;
      }
      if (got.text !== need.text) {
        const gloss = got.gloss ? ` “${got.text}” means “${got.gloss}”.` : "";
        return `Slot ${index + 1} is off — it needs ${need.hint}.${gloss}`;
      }
    }

    return "Not quite — check each part against the clue and try again.";
  }

  function ringConfusion(round, forged) {
    if (!round.confusions || !forged) return "";
    return round.confusions[forged] || "";
  }

  function solveRound(round) {
    const points = ATTEMPT_SCORES[state.attempts - 1] ?? 0;
    state.score += points;
    state.phase = "solved";
    state.results[state.roundIndex] = { word: round.word, points };

    syncBoard();
    syncTop();
    bumpScore();
    strikeStage();
    showNote(round);
    showStamp(state.attempts === 1 ? "CLEAN FORGE" : "FORGED", "good");
    setFeedback(
      `Forged! “${round.word}” = ${breakdownText(round)}. ${state.attempts === 1 ? "First try" : "Attempt " + state.attempts}: +${points} points.`,
      "good",
    );
    window.requestAnimationFrame(() => el.nextBtn.focus({ preventScroll: true }));
  }

  function revealRound(round) {
    state.phase = "revealed";
    state.results[state.roundIndex] = { word: round.word, points: 0 };
    state.slots = round.parts.map((part) => state.pool.find((tile) => tile.text === part.text) || part);

    syncBoard();
    syncTop();
    showNote(round);
    showStamp("ANSWER", "bad");
    setFeedback(
      `Out of tries. The answer is “${round.word}” — ${breakdownText(round)}. +0 this round.`,
      "bad",
    );
    window.requestAnimationFrame(() => el.nextBtn.focus({ preventScroll: true }));
  }

  function showNote(round) {
    el.pool.hidden = true;
    el.poolMeta.hidden = true;
    el.noteBreakdown.replaceChildren();

    round.parts.forEach((part, index) => {
      if (index > 0) el.noteBreakdown.append(makeNode("span", "note-plus", "+"));
      const chip = makeNode("span", "note-part");
      chip.dataset.role = part.role;
      chip.append(makeNode("b", "", displayPart(part)));
      chip.append(makeNode("i", "", `(${part.gloss})`));
      el.noteBreakdown.append(chip);
    });

    const result = makeNode("span", "note-result");
    result.append(makeNode("span", "note-equals", "="));
    result.append(makeNode("span", "note-word", round.word));
    el.noteBreakdown.append(result);
    el.noteCopy.textContent = round.note;
    el.noteCard.hidden = false;
  }

  function showStamp(text, tone) {
    el.stageStamp.textContent = text;
    el.stageStamp.className = `stage-stamp is-${tone}`;
    el.stageStamp.hidden = false;
  }

  function strikeStage() {
    el.forgeStage.classList.remove("is-struck");
    void el.forgeStage.offsetWidth;
    el.forgeStage.classList.add("is-struck");
    if (sparkTimer) window.clearTimeout(sparkTimer);
    sparkTimer = window.setTimeout(() => {
      el.forgeStage.classList.remove("is-struck");
      sparkTimer = 0;
    }, 700);
  }

  function bumpScore() {
    el.scoreChip.classList.remove("is-bump");
    void el.scoreChip.offsetWidth;
    el.scoreChip.classList.add("is-bump");
    if (bumpTimer) window.clearTimeout(bumpTimer);
    bumpTimer = window.setTimeout(() => {
      el.scoreChip.classList.remove("is-bump");
      bumpTimer = 0;
    }, 420);
  }

  function nextWord() {
    if (state.phase !== "solved" && state.phase !== "revealed") return;
    if (state.roundIndex >= MAX_ROUNDS - 1) {
      showResults();
      return;
    }
    state.phase = "transition";
    state.roundIndex += 1;
    renderRound(true);
  }

  function focusFirstTile() {
    const first = el.pool.querySelector(".tile");
    if (first) first.focus({ preventScroll: true });
  }

  /* --------------------------------------------------------------- results */

  function ratingFor(score) {
    if (score === 1000) return "Master smith: ten clean strikes, not a scrap wasted.";
    if (score >= 800) return "Journeyman smith: the forge answered nearly every strike.";
    if (score >= 500) return "Apprentice smith: you know your prefixes from your suffixes.";
    if (score >= 200) return "The fire is warm. Replay and aim for cleaner strikes.";
    return "Cold iron, warm fire. Every smith starts here.";
  }

  function showResults() {
    if (state.phase === "results") return;

    const score = state.score;
    const previous = safeBest();
    const improved = saveBestSafe(score);
    state.best = Math.max(previous, score);
    state.phase = "results";

    reportSafe(score);

    el.playLayout.hidden = true;
    el.resultScreen.hidden = false;
    el.resultScore.textContent = String(score);
    el.resultSub.textContent = ratingFor(score);
    el.resultBest.textContent = String(state.best);
    el.resultBadge.hidden = !improved;
    renderRecap();

    el.roundValue.textContent = `${MAX_ROUNDS}/${MAX_ROUNDS}`;
    el.scoreValue.textContent = String(score);
    el.progressBar.style.width = "100%";
    el.progressTrack.setAttribute("aria-valuenow", String(MAX_ROUNDS));

    window.scrollTo({ top: 0, behavior: "auto" });
    window.requestAnimationFrame(() => el.resultScreen.focus({ preventScroll: true }));
  }

  function renderRecap() {
    el.resultRecap.replaceChildren();
    state.results.forEach((result) => {
      if (!result) return;
      const item = makeNode("li");
      item.append(makeNode("span", "recap-word", result.word));
      const points = makeNode("span", "recap-pts", `+${result.points}`);
      points.dataset.band = String(result.points);
      item.append(points);
      el.resultRecap.append(item);
    });
  }

  function replay() {
    startGame();
    const main = document.querySelector(".forge-main");
    if (main) {
      window.requestAnimationFrame(() => main.focus({ preventScroll: true }));
    }
  }

  /* ------------------------------------------------------------------ init */

  function bindEvents() {
    el.checkBtn.addEventListener("click", checkAnswer);
    el.nextBtn.addEventListener("click", nextWord);
    el.replayBtn.addEventListener("click", replay);

    el.slots.addEventListener("click", (event) => {
      const button = event.target.closest(".slot");
      if (!button) return;
      onSlot(Number(button.dataset.slot));
    });
  }

  function init() {
    cacheElements();
    bindEvents();
    startGame();
  }

  init();

  window.__FORGE__ = {
    rounds: ROUNDS,
    get state() { return { ...state }; },
  };
})();
