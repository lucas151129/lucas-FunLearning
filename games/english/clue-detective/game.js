/* Clue Detective — local-only reading inference game.
   Phase 1: choose the meaning. Phase 2: tap the exact evidence line. */

(() => {
  "use strict";

  const GAME_ID = "clue-detective";
  const MAX_SCORE = 1000;
  const CASE_COUNT = 10;

  const CASES = [
    {
      no: "01",
      id: "derelict",
      title: "The Derelict Light",
      titleCn: "廢棄燈塔",
      scene: "HARBOUR POINT · 06:40",
      target: "derelict",
      targetLine: 2,
      gloss: "falling apart and abandoned",
      sentences: [
        "The lighthouse stood alone at the end of the point, far from the village lights.",
        "Sailors on the night boats called it the derelict light.",
        "Every window in the tower was broken, and the front door hung from a single rusted hinge.",
        "My partner had never been inside, so she brought a torch and a notebook.",
        "We signed the log at the gate and started up the path.",
      ],
      evidence: 2,
      options: [
        {
          text: "Newly painted and busy",
          correct: false,
          why: "Nothing in the file suggests fresh paint or visitors. The tower is far from the village, and its windows are broken.",
        },
        {
          text: "Falling apart and abandoned",
          correct: true,
          why: "Broken windows and a door hanging from one hinge are the marks of a building left to decay.",
        },
        {
          text: "Tall and easy to see",
          correct: false,
          why: "The tower may be tall, but 'derelict' describes its condition, not its height.",
        },
        {
          text: "Hidden under the water",
          correct: false,
          why: "The lighthouse is standing on the point. The word describes the building, not something submerged.",
        },
      ],
      meaningExplain:
        "Derelict means abandoned and falling apart. Line 3 shows the decay directly: broken windows and a door hanging from one hinge.",
      evidencePrompt: "Tap the line that proves the lighthouse is falling apart.",
      hints: [
        "Line 1 tells us where the lighthouse is. It says nothing about its condition.",
        "Line 2 uses the word, but a label is not proof. Find the line that shows decay.",
        "",
        "Line 4 is about the partner's torch and notebook. It does not describe the building.",
        "Line 5 is about signing a log and setting off. There are no condition clues here.",
      ],
      evidenceExplain:
        "Line 3 is the evidence: broken windows and a door hanging from one hinge show that the lighthouse has been left to fall apart.",
      solved:
        "The word fits the picture. A building with broken windows and a door hanging from one hinge is derelict: abandoned and falling apart.",
      verdict: "The light has been dark for years.",
    },
    {
      no: "02",
      id: "reticent",
      title: "The Quiet Witness",
      titleCn: "沉默的證人",
      scene: "MEETING ROOM · 10:15",
      target: "reticent",
      targetLine: 5,
      gloss: "reserved and not talkative",
      sentences: [
        "At the meeting, the manager asked the room for ideas about the new schedule.",
        "Mia answered only when someone asked her a direct question, and she offered no opinions of her own.",
        "She had arrived early, chosen a seat by the window, and opened her notebook.",
        "The meeting lasted forty minutes and covered every item on the agenda.",
        "Later, the manager described her as reticent — not as a criticism, but as an observation.",
      ],
      evidence: 1,
      options: [
        {
          text: "Angry about the schedule",
          correct: false,
          why: "The file never shows anger. Mia answers questions and offers no opinions; that is a manner, not a mood.",
        },
        {
          text: "Reserved and not talkative",
          correct: true,
          why: "She speaks only when directly asked and gives no opinions. That is the behaviour of someone who is reticent.",
        },
        {
          text: "Very well prepared",
          correct: false,
          why: "Her notebook suggests preparation, but 'reticent' describes how little she says, not how ready she is.",
        },
        {
          text: "New to the company",
          correct: false,
          why: "Nothing says she is new. The manager's word is about her quiet manner, not her experience.",
        },
      ],
      meaningExplain:
        "Reticent means reserved and not talkative. Line 2 shows the behaviour: she answers only direct questions and offers no opinions.",
      evidencePrompt: "Tap the line that shows why the manager called Mia reticent.",
      hints: [
        "Line 1 only shows that a question was asked. It does not show how Mia responded.",
        "",
        "Line 3 shows her arriving early and opening a notebook. That is preparation, not a clue about how much she speaks.",
        "Line 4 describes the length and agenda of the meeting, not Mia's behaviour.",
        "Line 5 uses the word. The proof must show what she actually did.",
      ],
      evidenceExplain:
        "Line 2 is the evidence: answering only when asked and offering no opinions is exactly what reticent looks like.",
      solved:
        "Mia was not rude or unprepared. She was reticent: reserved, and slow to offer her own views.",
      verdict: "Quiet is not the same as empty.",
    },
    {
      no: "03",
      id: "treacherous",
      title: "The Ridge Trail",
      titleCn: "危險山徑",
      scene: "RIDGE PATH · 07:20",
      target: "treacherous",
      targetLine: 5,
      gloss: "dangerous and unsafe",
      sentences: [
        "We set out for the ridge the morning after the storm.",
        "At first the trail looked normal, quiet and washed clean by rain.",
        "Last summer I had run up this same slope without thinking about my feet.",
        "Past the second bend, the path was covered with loose rocks and deep puddles that hid the ground beneath.",
        "My uncle studied the scree and said the trail was treacherous, so we turned back.",
      ],
      evidence: 3,
      options: [
        {
          text: "Longer than expected",
          correct: false,
          why: "The file mentions a ridge and a climb, but it never compares distances.",
        },
        {
          text: "Dangerous and unsafe",
          correct: true,
          why: "Loose rocks and deep puddles that hide the ground make every step risky. That is what treacherous means.",
        },
        {
          text: "Muddy but easy",
          correct: false,
          why: "Mud is present, but 'easy' is the opposite of the warning in the file. Hidden ground and loose rocks are hazards.",
        },
        {
          text: "Strangely quiet",
          correct: false,
          why: "The trail is quiet at first, but the word describes the danger, not the silence.",
        },
      ],
      meaningExplain:
        "Treacherous means dangerous and unsafe. Line 4 shows why: loose rocks and deep puddles hide the ground beneath.",
      evidencePrompt: "Tap the line that proves the trail is dangerous.",
      hints: [
        "Line 1 tells us when the walk began. It does not describe the path.",
        "Line 2 is the trail before the bad section. 'Washed clean' is not a warning.",
        "Line 3 describes an easier trip last summer. That contrast does not prove this trail is dangerous now.",
        "",
        "Line 5 uses the word and gives the decision. Find the details that caused it.",
      ],
      evidenceExplain:
        "Line 4 is the evidence: loose rocks and deep puddles that hide the ground are exactly what makes a path treacherous.",
      solved:
        "The trail was not just muddy. It was treacherous: loose, hidden, and dangerous enough to turn back.",
      verdict: "A safe walk is not always the same as a short one.",
    },
    {
      no: "04",
      id: "succinct",
      title: "The Three-Sentence Explanation",
      titleCn: "三句話解釋",
      scene: "TICKET OFFICE · 09:05",
      target: "succinct",
      targetLine: 4,
      gloss: "brief and clear",
      sentences: [
        "On my first day, the trainer asked me to explain the new ticket system to a visitor.",
        "I had prepared a long talk with diagrams, sub-clauses, and a page of abbreviations.",
        "The visitor looked tired and had already asked two other staff members for help.",
        "The trainer smiled and called my explanation succinct.",
        "It used three sentences, no jargon, and every point was clear.",
      ],
      evidence: 4,
      options: [
        {
          text: "Too long and detailed",
          correct: false,
          why: "The long version was the plan she did not use. The explanation she actually gave was three sentences.",
        },
        {
          text: "Brief and clear",
          correct: true,
          why: "Three sentences, no jargon, every point clear: that is a succinct explanation.",
        },
        {
          text: "Confusing but polite",
          correct: false,
          why: "The visitor understood it well enough to buy a ticket without asking again. Nothing suggests confusion.",
        },
        {
          text: "Spoken too quietly",
          correct: false,
          why: "The file describes the words and their clarity, not the volume of her voice.",
        },
      ],
      meaningExplain:
        "Succinct means brief and clear. Line 5 shows all three markers: three sentences, no jargon, every point clear.",
      evidencePrompt: "Tap the line that shows the explanation was brief and clear.",
      hints: [
        "Line 1 only sets up the task. It does not judge the explanation.",
        "Line 2 describes the long, jargon-heavy plan she did not use. It is the opposite of succinct.",
        "Line 3 tells us how the visitor felt before the explanation. It does not show how she explained.",
        "Line 4 uses the word. The proof comes in the next sentence.",
        "",
      ],
      evidenceExplain:
        "Line 5 is the evidence: three sentences, no jargon, and every point clear. That is succinct in action.",
      solved:
        "A succinct explanation is not a rushed one. It is short, clean, and complete enough to be understood at once.",
      verdict: "Three good sentences beat thirty crowded ones.",
    },
    {
      no: "05",
      id: "jubilant",
      title: "The Final Whistle",
      titleCn: "終場哨聲",
      scene: "NORTH STAND · 21:47",
      target: "jubilant",
      targetLine: 5,
      gloss: "full of joy",
      sentences: [
        "The final whistle blew, and the scoreboard froze at two to one.",
        "For a second the stadium was silent, as if no one believed it.",
        "Then the crowd threw their hats into the air and hugged strangers in the next row.",
        "A steward opened a gate, and the players shook hands in the middle of the pitch.",
        "My sister, who never shouts, said the crowd was jubilant.",
      ],
      evidence: 2,
      options: [
        {
          text: "Deeply disappointed",
          correct: false,
          why: "Nothing in the scene suggests a loss. The crowd's reaction after the whistle is pure celebration.",
        },
        {
          text: "Full of joy",
          correct: true,
          why: "Throwing hats and hugging strangers is a public explosion of joy. That is what jubilant means.",
        },
        {
          text: "Confused about the score",
          correct: false,
          why: "The silence lasts a second; then the crowd celebrates. There is no confusion about the result.",
        },
        {
          text: "Too tired to celebrate",
          correct: false,
          why: "Hats in the air and hugs between strangers are the opposite of tiredness.",
        },
      ],
      meaningExplain:
        "Jubilant means full of joy. Line 3 shows it: hats thrown in the air and strangers hugging.",
      evidencePrompt: "Tap the line that proves the crowd was joyful.",
      hints: [
        "Line 1 gives the score and the whistle. The result alone does not show how the crowd felt.",
        "Line 2 is the silent second before the reaction — surprise, not joy.",
        "",
        "Line 4 describes a steward and the players shaking hands. It does not show the crowd's joy.",
        "Line 5 uses the word. Find the action that shows the feeling.",
      ],
      evidenceExplain:
        "Line 3 is the evidence: throwing hats and hugging strangers is joy made visible.",
      solved:
        "The crowd was jubilant: not merely pleased, but openly, physically full of joy.",
      verdict: "Joy is loudest when strangers hug.",
    },
    {
      no: "06",
      id: "meticulous",
      title: "The Restorer",
      titleCn: "修復師",
      scene: "MUSEUM WORKSHOP · 10:20",
      target: "meticulous",
      targetLine: 5,
      gloss: "very careful about detail",
      sentences: [
        "The restorer worked alone in the museum workshop.",
        "She photographed every crack, labelled each fragment, and checked the glue twice before touching the vase.",
        "A radio played in the corner, but she did not look up.",
        "By noon, the broken handle was still in three separate pieces.",
        "The curator said the restorer was meticulous.",
      ],
      evidence: 1,
      options: [
        {
          text: "Careless with the pieces",
          correct: false,
          why: "The restorer photographs, labels and double-checks. Those are the habits of care, not carelessness.",
        },
        {
          text: "Very careful about detail",
          correct: true,
          why: "Photographing every crack and checking the glue twice is meticulous work: careful attention to small details.",
        },
        {
          text: "Impatient to finish",
          correct: false,
          why: "She leaves the handle in pieces at noon; she is not rushing to finish.",
        },
        {
          text: "New to the museum",
          correct: false,
          why: "The file does not tell us how long she has worked there. It shows how she works.",
        },
      ],
      meaningExplain:
        "Meticulous means very careful about small details. The restorer's routine — photograph, label, check twice — is the meaning in action.",
      evidencePrompt: "Tap the line that proves the restorer was meticulous.",
      hints: [
        "Line 1 gives her workplace. It does not describe her method.",
        "",
        "Line 3 says she ignores the radio. That shows concentration, but not yet the care with details.",
        "Line 4 says the work is slow. Careful work can be slow, but this line alone does not prove the meaning.",
        "Line 5 uses the word. Find the line that shows the care.",
      ],
      evidenceExplain:
        "Line 2 is the evidence: photographing every crack, labelling each fragment and checking the glue twice are all acts of meticulous care.",
      solved:
        "Meticulous is not just 'slow' or 'quiet'. It is careful, precise attention to small details — exactly what line 2 shows.",
      verdict: "Care lives in the small checks.",
    },
    {
      no: "07",
      id: "conspicuous",
      title: "The Orange Van",
      titleCn: "橙色貨車",
      scene: "LIBRARY STREET · 14:05",
      target: "conspicuous",
      targetLine: 1,
      gloss: "easy to notice",
      sentences: [
        "The van was conspicuous in the quiet street.",
        "A grey car and two bicycles were parked neatly by the kerb.",
        "The van was bright orange, across two spaces, with its engine running outside the library.",
        "A librarian glanced out and wrote down the number.",
        "By the time the driver returned, a traffic officer was waiting.",
      ],
      evidence: 2,
      options: [
        {
          text: "Easy to notice",
          correct: true,
          why: "Bright orange, badly parked and running its engine: the van draws the eye. That is conspicuous.",
        },
        {
          text: "Hidden from view",
          correct: false,
          why: "The librarian sees it from inside the library and a traffic officer finds it. It is not hidden.",
        },
        {
          text: "Very old",
          correct: false,
          why: "The file says nothing about the van's age. It describes how much attention it attracts.",
        },
        {
          text: "Parked legally",
          correct: false,
          why: "It is across two spaces and a traffic officer is waiting. The file is not suggesting legal parking.",
        },
      ],
      meaningExplain:
        "Conspicuous means easily seen or noticed. The van's colour, position and running engine make it impossible to miss.",
      evidencePrompt: "Tap the line that proves the van was easy to notice.",
      hints: [
        "Line 1 uses the word. A label is not proof; find the details that make it stand out.",
        "Line 2 describes the ordinary cars and bicycles. They are the quiet background.",
        "",
        "Line 4 shows someone noticing, but it does not show why the van stood out.",
        "Line 5 shows the consequence. Find the visual details first.",
      ],
      evidenceExplain:
        "Line 3 is the evidence: bright orange, across two spaces, engine running. The van is conspicuous because it is visually impossible to ignore.",
      solved:
        "Conspicuous describes something that attracts attention. The file shows the reasons — colour, position, noise — rather than just telling us.",
      verdict: "Some things refuse to blend in.",
    },
    {
      no: "08",
      id: "reluctant",
      title: "The Last Train",
      titleCn: "末班車",
      scene: "PARTY · 23:10",
      target: "reluctant",
      targetLine: 1,
      gloss: "unwilling or hesitant",
      sentences: [
        "Mia was reluctant to leave the party.",
        "She had arrived early and spent the evening by the window.",
        "She kept checking her phone, hovering by the door, and asking whether the last train had been delayed.",
        "Her coat was on, but she had not said goodbye.",
        "When the host offered her a lift, she finally smiled.",
      ],
      evidence: 2,
      options: [
        {
          text: "Eager to go home",
          correct: false,
          why: "She is already by the door, but she keeps delaying. Eager departure would look very different.",
        },
        {
          text: "Unwilling or hesitant to leave",
          correct: true,
          why: "Checking the time, hovering by the door and not saying goodbye are all signs of reluctance.",
        },
        {
          text: "Angry with the host",
          correct: false,
          why: "There is no conflict with the host. She smiles when offered a lift.",
        },
        {
          text: "Too tired to speak",
          correct: false,
          why: "She is asking about the train. The file shows hesitation, not exhaustion.",
        },
      ],
      meaningExplain:
        "Reluctant means unwilling or hesitant. Mia is physically ready to leave, but her behaviour keeps delaying the goodbye.",
      evidencePrompt: "Tap the line that proves Mia was reluctant to leave.",
      hints: [
        "Line 1 uses the word. Find the behaviour that shows it.",
        "Line 2 says she arrived early. That shows she wanted to be there, but not the hesitation about leaving.",
        "",
        "Line 4 gives us a coat and no goodbye. It supports the idea, but line 3 is more direct.",
        "Line 5 shows the evening ending well. It does not prove the earlier reluctance.",
      ],
      evidenceExplain:
        "Line 3 is the evidence: checking her phone, hovering by the door and asking about the train are all ways of delaying departure.",
      solved:
        "Reluctance is not the same as being unable to leave. Mia can leave; she keeps finding reasons not to.",
      verdict: "The body often says what the goodbye cannot.",
    },
    {
      no: "09",
      id: "hazard",
      title: "The Loose Cable",
      titleCn: "鬆脫的電線",
      scene: "SCHOOL CORRIDOR · 08:40",
      target: "hazard",
      targetLine: 2,
      gloss: "a source of danger",
      sentences: [
        "A loose cable lay across the corridor.",
        "It was a hazard: anyone carrying a box could trip, and the lights were too dim to see it.",
        "A yellow sign stood at the far end, facing the wrong way.",
        "The caretaker stepped over the cable twice without noticing.",
        "By the end of the day, it had been taped to the wall.",
      ],
      evidence: 0,
      options: [
        {
          text: "A source of danger",
          correct: true,
          why: "A cable that can trip someone in dim light is a hazard: a possible source of harm.",
        },
        {
          text: "A useful tool",
          correct: false,
          why: "The cable is not being used for a task here. It is an obstacle in a walkway.",
        },
        {
          text: "A decorative object",
          correct: false,
          why: "The sign is yellow, but the cable is not decoration. The line explains the risk of tripping.",
        },
        {
          text: "A safe path",
          correct: false,
          why: "The line says people could trip. That is the opposite of safe.",
        },
      ],
      meaningExplain:
        "A hazard is a possible source of danger. The loose cable creates a tripping risk, especially in poor light.",
      evidencePrompt: "Tap the line that shows why the cable was a hazard.",
      hints: [
        "",
        "Line 2 defines the risk in action: tripping, dim light, people carrying boxes.",
        "Line 3 shows a warning sign in the wrong place. It adds to the danger, but line 2 explains the hazard itself.",
        "Line 4 shows someone not noticing. That confirms the risk but is not the definition.",
        "Line 5 shows the fix. The hazard existed before the tape.",
      ],
      evidenceExplain:
        "Line 1 is the evidence: a loose cable across a walkway is a tripping hazard. The following line explains the risk, but line 1 already shows the source of danger.",
      solved:
        "A hazard is not necessarily an accident. It is a condition that makes harm possible — here, a cable where people walk.",
      verdict: "Danger often looks ordinary.",
    },
    {
      no: "10",
      id: "exhausted",
      title: "After the Night Shift",
      titleCn: "夜班之後",
      scene: "HOSPITAL · 07:15",
      target: "exhausted",
      targetLine: 1,
      gloss: "extremely tired",
      sentences: [
        "After the night shift, Dr Lee was exhausted.",
        "The corridor had emptied and the waiting room was dark.",
        "She could barely finish her sentence before falling asleep in the staff-room chair.",
        "A nurse covered her with a blanket and turned off the light.",
        "An hour later, she was still there.",
      ],
      evidence: 2,
      options: [
        {
          text: "Extremely tired",
          correct: true,
          why: "Falling asleep mid-sentence in a chair is more than ordinary tiredness. That is exhausted.",
        },
        {
          text: "Wide awake",
          correct: false,
          why: "She falls asleep in the staff room. The scene shows the opposite.",
        },
        {
          text: "Angry about the shift",
          correct: false,
          why: "There is no anger in the scene. The nurse's quiet care suggests concern, not conflict.",
        },
        {
          text: "Hungry after work",
          correct: false,
          why: "The file never mentions food. It focuses on her inability to stay awake.",
        },
      ],
      meaningExplain:
        "Exhausted means extremely tired. Dr Lee cannot finish a sentence before falling asleep, which is far beyond a normal end-of-day tiredness.",
      evidencePrompt: "Tap the line that proves Dr Lee was exhausted.",
      hints: [
        "Line 1 uses the word. Find the physical detail that shows it.",
        "Line 2 sets the quiet scene. A dark waiting room does not prove exhaustion by itself.",
        "",
        "Line 4 shows someone caring for her. It supports the scene, but line 3 is the direct proof.",
        "Line 5 shows she stayed asleep. It confirms the state but comes after the proof.",
      ],
      evidenceExplain:
        "Line 3 is the evidence: she can barely finish a sentence before falling asleep. That is the physical signature of exhaustion.",
      solved:
        "Exhausted is stronger than tired. The scene shows someone whose body has run out of energy, not someone simply ready for bed.",
      verdict: "The body keeps the true record.",
    },
  ];

  const demo = window.EnglishDemo;

  const els = {
    stage: document.getElementById("game-stage"),
    feedback: document.getElementById("feedback"),
    hudCase: document.getElementById("hud-case"),
    hudScore: document.getElementById("hud-score"),
    fileLabel: document.getElementById("file-label"),
    progress: document.getElementById("progress"),
    progressFill: document.getElementById("progress-fill"),
    chipMeaning: document.getElementById("chip-meaning"),
    chipEvidence: document.getElementById("chip-evidence"),
    notebookTip: document.getElementById("notebook-tip"),
  };

  const state = {
    caseIndex: 0,
    phase: "meaning",
    score: 0,
    casePoints: 0,
    meaningPoints: 0,
    evidencePoints: 0,
    meaningDone: false,
    evidenceDone: false,
    meaningTry: 0,
    evidenceTry: 0,
    options: [],
    wrongOptions: [],
    wrongLines: [],
    feedback: { tone: "", html: "" },
    results: [],
    best: 0,
    newBest: false,
    caseLogged: false,
  };

  /* ---------- Helpers ---------- */

  function esc(value) {
    return demo.escapeHtml(value);
  }

  function currentCase() {
    return CASES[state.caseIndex];
  }

  function targetMarkup(sentence, target) {
    const safe = esc(sentence);
    const safeTarget = esc(target);
    return safe.replace(
      new RegExp("\\b(" + safeTarget + ")\\b", "gi"),
      '<mark class="target-word">$1</mark>'
    );
  }

  function focusSoon(selector, preventScroll) {
    requestAnimationFrame(() => {
      const element = document.querySelector(selector);
      if (element) element.focus({ preventScroll: Boolean(preventScroll) });
    });
  }

  function rankFor(score) {
    if (score >= 900) return { title: "Chief Inspector", cn: "總督察" };
    if (score >= 700) return { title: "Senior Detective", cn: "高級偵探" };
    if (score >= 400) return { title: "Field Detective", cn: "外勤偵探" };
    return { title: "Rookie", cn: "見習偵探" };
  }

  function isShortLandscape() {
    return window.matchMedia("(max-height: 500px) and (min-width: 700px)").matches;
  }

  /* ---------- Render: case file ---------- */

  function renderCaseFile(c) {
    const reading = state.phase === "meaning";
    const tapping = state.phase === "evidence";
    const solved = state.phase === "solved";

    const items = c.sentences.map((sentence, index) => {
      const isEvidence = solved && index === c.evidence;
      const isWrong = state.wrongLines.includes(index);
      const classes = ["clue-line"];
      if (reading) classes.push("is-reading");
      if (tapping) classes.push("is-tappable");
      if (isWrong) classes.push("is-wrong");
      if (isEvidence) classes.push("is-evidence");

      const disabled = (solved || isWrong) ? " disabled" : "";
      const mark = isEvidence ? "EVIDENCE" : isWrong ? "✕" : "";
      const stateLabel = isEvidence
        ? " Marked as evidence."
        : isWrong
          ? " Already marked as not evidence."
          : "";
      const ariaLabel = "Line " + (index + 1) + ": " + sentence + "." + stateLabel;

      return (
        '<li class="clue-item">' +
          '<button type="button" class="' + classes.join(" ") + '"' +
          ' data-action="line" data-index="' + index + '"' +
          ' aria-label="' + esc(ariaLabel) + '"' + disabled + ">" +
            '<span class="line-no" aria-hidden="true">' + (index + 1) + "</span>" +
            '<span class="line-text">' + targetMarkup(sentence, c.target) + "</span>" +
            (mark
              ? '<span class="line-mark" aria-hidden="true">' + mark + "</span>"
              : "") +
          "</button>" +
        "</li>"
      );
    }).join("");

    const stamp = solved
      ? '<span class="stamp is-closed" aria-hidden="true">CASE CLOSED</span>'
      : '<span class="stamp" aria-hidden="true">CONFIDENTIAL</span>';

    return (
      '<section class="case-card" lang="en" aria-labelledby="case-title">' +
        '<header class="case-head">' +
          "<div>" +
            '<span class="case-kicker">CASE ' + c.no + " · EVIDENCE FILE</span>" +
            '<h2 class="case-title focus-target" id="case-title" tabindex="-1">' +
              esc(c.title) +
              '<span class="title-cn" lang="zh-Hant">' + esc(c.titleCn) + "</span>" +
            "</h2>" +
            '<span class="case-scene">' + esc(c.scene) + "</span>" +
          "</div>" +
          stamp +
        "</header>" +
        '<ol class="case-lines" aria-label="Numbered evidence lines">' + items + "</ol>" +
      "</section>"
    );
  }

  /* ---------- Render: phase 1 ---------- */

  function renderMeaning(c) {
    const done = state.meaningDone;
    const options = state.options.map((option, index) => {
      const isWrong = state.wrongOptions.includes(index);
      const isCorrect = done && option.correct;
      const classes = ["option"];
      if (isWrong) classes.push("is-wrong");
      if (isCorrect) classes.push("is-correct");
      if (done && !isWrong && !isCorrect) classes.push("is-dim");

      const disabled = (done || isWrong) ? " disabled" : "";
      const mark = isCorrect ? "✓" : isWrong ? "✕" : "";
      const stateLabel = isCorrect
        ? " Correct answer."
        : isWrong
          ? " Not correct."
          : "";
      const ariaLabel = "Option " + option.key + ": " + option.text + "." + stateLabel;

      return (
        '<button type="button" class="' + classes.join(" ") + '"' +
        ' data-action="option" data-index="' + index + '"' +
        ' aria-label="' + esc(ariaLabel) + '"' + disabled + ">" +
          '<span class="opt-key" aria-hidden="true">' + option.key + "</span>" +
          '<span class="opt-text">' + esc(option.text) + "</span>" +
          (mark
            ? '<span class="opt-mark" aria-hidden="true">' + mark + "</span>"
            : "") +
        "</button>"
      );
    }).join("");

    const note = done
      ? "Meaning locked. Continue when you are ready to hunt for evidence."
      : "Choose one option. One retry is allowed: a correct retry is worth 20, not 40.";

    return (
      '<div class="meaning-block" lang="en">' +
        '<h3 class="meaning-q focus-target" id="meaning-q" tabindex="-1">' +
          '<span class="q-tag">PHASE 1</span>' +
          "What does <mark class=\"target-word\">" + esc(c.target) + "</mark>" +
          " most likely mean in line " + c.targetLine + "?" +
        "</h3>" +
        '<p class="meaning-note">' + note + "</p>" +
        '<div class="options" role="group" aria-labelledby="meaning-q">' + options + "</div>" +
        (done
          ? '<div class="phase-actions">' +
              '<button type="button" class="btn" id="continue-btn" data-action="continue">' +
                'Now find the evidence <span aria-hidden="true">→</span>' +
              "</button>" +
            "</div>"
          : "") +
      "</div>"
    );
  }

  /* ---------- Render: phase 2 + solved ---------- */

  function factStrip(c, points) {
    return (
      '<div class="fact-strip" role="note" lang="en" aria-label="Locked meaning: ' +
        esc(c.target) + " means " + esc(c.gloss) + '">' +
        '<span class="fact-tag">LOCKED FACT</span>' +
        '<span class="fact-word">' + esc(c.target) + "</span>" +
        '<span aria-hidden="true">=</span>' +
        "<span>" + esc(c.gloss) + "</span>" +
        '<span class="fact-points">+' + points + " PTS</span>" +
      "</div>"
    );
  }

  function renderEvidence(c) {
    return (
      factStrip(c, state.meaningPoints) +
      '<div class="evidence-block" lang="en">' +
        '<h3 class="evidence-prompt focus-target" id="evidence-prompt" tabindex="-1">' +
          '<span class="q-tag">PHASE 2</span>' + esc(c.evidencePrompt) +
        "</h3>" +
        '<p class="evidence-sub">Tap one numbered line above. A wrong line gives you a specific hint; one retry is worth 30 points.</p>' +
      "</div>"
    );
  }

  function renderSolved(c) {
    const nextLabel = state.caseIndex === CASE_COUNT - 1 ? "Final report" : "Next case";
    return (
      factStrip(c, state.meaningPoints) +
      '<section class="solved-panel" lang="en" aria-labelledby="solved-title">' +
        '<div class="solved-top">' +
          '<span class="solved-stamp">CASE CLOSED</span>' +
          '<span class="solved-file">FILE ' + c.no + "</span>" +
        "</div>" +
        '<h3 class="solved-title focus-target" id="solved-title" tabindex="-1">Case solved.</h3>' +
        '<p class="solved-copy">' + esc(c.solved) + "</p>" +
        '<p class="verdict">' + esc(c.verdict) + "</p>" +
        '<div class="score-line" aria-label="Points for this case">' +
          '<span class="score-pill">MEANING +' + state.meaningPoints + "</span>" +
          '<span class="score-pill">EVIDENCE +' + state.evidencePoints + "</span>" +
          '<span class="score-pill is-total">CASE ' + state.casePoints + " / 100</span>" +
        "</div>" +
        '<div class="phase-actions">' +
          '<button type="button" class="btn mint" id="next-btn" data-action="next">' +
            nextLabel + ' <span aria-hidden="true">→</span>' +
          "</button>" +
        "</div>" +
      "</section>"
    );
  }

  /* ---------- Render: result ---------- */

  function renderResult() {
    const rank = rankFor(state.score);
    const perfect = state.results.filter((result) => result.points === 100).length;
    const bestNote = state.newBest
      ? "A new local record."
      : state.score === state.best
        ? "You matched the local record."
        : "The local record stands.";

    const log = state.results.map((result) => (
      "<li>" +
        '<span class="log-title"><b>FILE ' + result.no + "</b>" + esc(result.title) + "</span>" +
        '<span class="log-points">' + result.points + " / 100</span>" +
      "</li>"
    )).join("");

    return (
      '<section class="result-screen" aria-labelledby="end-title">' +
        '<p class="result-eyebrow">TEN FILES · FINAL REPORT</p>' +
        '<h1 class="focus-target" id="end-title" tabindex="-1">Case Closed<span class="dot">.</span></h1>' +
        '<p class="result-sub">You closed every file. Here is the record.</p>' +
        '<div class="result-score" aria-label="Final score ' + state.score + ' out of ' + MAX_SCORE + '">' +
          state.score + "<small>/" + MAX_SCORE + "</small>" +
        "</div>" +
        '<div class="result-meta">' +
          '<span class="rank-badge">' + esc(rank.title) + " · " + esc(rank.cn) + "</span>" +
          (state.newBest ? '<span class="new-best">NEW BEST</span>' : "") +
        "</div>" +
        '<p class="result-best">BEST ON THIS DEVICE · <b>' + state.best + " / " + MAX_SCORE + "</b> · " + bestNote + "</p>" +
        '<p class="result-sub2">' + perfect + (perfect === 1 ? " perfect case" : " perfect cases") +
          " · " + state.results.length + " / " + CASE_COUNT + " files closed</p>" +
        '<ul class="case-log" aria-label="Case by case scores">' + log + "</ul>" +
        '<div class="result-actions">' +
          '<button type="button" class="btn" id="replay-btn" data-action="replay">Replay all ten cases</button>' +
          '<a class="btn ghost" href="../index.html">Back to Arcade</a>' +
        "</div>" +
      "</section>"
    );
  }

  /* ---------- HUD + chrome ---------- */

  function updateHud() {
    const shownCase = state.phase === "end" ? CASE_COUNT : state.caseIndex + 1;
    els.hudCase.textContent = shownCase + "/" + CASE_COUNT;
    els.hudScore.textContent = String(state.score);
    els.fileLabel.textContent = state.phase === "end"
      ? "ALL FILES CLOSED"
      : "FILE " + currentCase().no + " / " + String(CASE_COUNT).padStart(2, "0");
  }

  function updatePhaseChips() {
    const meaningActive = state.phase === "meaning" && !state.meaningDone;
    const evidenceActive = state.phase === "evidence";

    els.chipMeaning.classList.toggle("is-active", meaningActive);
    els.chipMeaning.classList.toggle("is-done", state.meaningDone);

    els.chipEvidence.classList.toggle("is-active", evidenceActive);
    els.chipEvidence.classList.toggle("is-done", state.evidenceDone);
    els.chipEvidence.classList.toggle(
      "is-locked",
      state.phase === "meaning" && !state.meaningDone
    );

    if (meaningActive) els.chipMeaning.setAttribute("aria-current", "step");
    else els.chipMeaning.removeAttribute("aria-current");

    if (evidenceActive) els.chipEvidence.setAttribute("aria-current", "step");
    else els.chipEvidence.removeAttribute("aria-current");
  }

  function updateProgress() {
    let percent;
    if (state.phase === "end") {
      percent = 100;
    } else {
      const caseFraction = (state.meaningDone ? 0.5 : 0) + (state.evidenceDone ? 0.5 : 0);
      percent = ((state.caseIndex + caseFraction) / CASE_COUNT) * 100;
    }
    els.progressFill.style.width = percent + "%";
    els.progress.setAttribute("aria-valuenow", String(Math.round(percent)));
  }

  function renderFeedback() {
    els.feedback.hidden = false;
    els.feedback.className = "feedback" + (state.feedback.tone ? " " + state.feedback.tone : "");
    els.feedback.innerHTML = state.feedback.html;
  }

  function updateNotebook() {
    const leads = {
      meaning: "<b>Lead:</b> Read the numbered lines, then test each meaning against the scene.",
      evidence: "<b>Lead:</b> The word is not the proof. Find the line that shows the meaning in action.",
      solved: "<b>Lead:</b> The highlighted line is the evidence. That is how inference is built.",
      end: "<b>Lead:</b> Ten files closed. Replay to chase a higher score.",
    };
    els.notebookTip.innerHTML = leads[state.phase] || leads.meaning;
  }

  /* ---------- Render root ---------- */

  function render() {
    updateHud();
    updatePhaseChips();
    updateProgress();
    els.stage.dataset.phase = state.phase;

    if (state.phase === "end") {
      els.stage.innerHTML = renderResult();
      els.feedback.hidden = true;
      updateNotebook();
      return;
    }

    const c = currentCase();
    let html = renderCaseFile(c);
    if (state.phase === "meaning") html += renderMeaning(c);
    else if (state.phase === "evidence") html += renderEvidence(c);
    else html += renderSolved(c);

    els.stage.innerHTML = html;
    renderFeedback();
    updateNotebook();
  }

  /* ---------- Flow ---------- */

  function loadCase(index, options) {
    const settings = options || {};
    const c = CASES[index];

    state.caseIndex = index;
    state.phase = "meaning";
    state.casePoints = 0;
    state.meaningPoints = 0;
    state.evidencePoints = 0;
    state.meaningDone = false;
    state.evidenceDone = false;
    state.meaningTry = 0;
    state.evidenceTry = 0;
    state.wrongOptions = [];
    state.wrongLines = [];
    state.caseLogged = false;
    state.options = demo.shuffle(c.options).map((option, position) => ({
      ...option,
      key: "ABCD"[position],
    }));
    state.feedback = {
      tone: "",
      html: "Read the file, then choose what <mark class=\"target-word\">" +
        esc(c.target) + "</mark> means. First try: <b>40 points</b>.",
    };

    render();
    if (settings.focusCase !== false) focusSoon("#case-title");
  }

  function startGame(options) {
    const settings = options || {};
    state.score = 0;
    state.results = [];
    state.best = demo.best(GAME_ID);
    state.newBest = false;
    loadCase(0, { focusCase: settings.initial ? false : true });
  }

  function chooseOption(index) {
    if (state.phase !== "meaning" || state.meaningDone) return;
    const c = currentCase();
    const option = state.options[index];
    if (!option || state.wrongOptions.includes(index)) return;

    state.meaningTry += 1;

    if (option.correct) {
      const points = state.meaningTry === 1 ? 40 : 20;
      state.meaningPoints = points;
      state.score += points;
      state.casePoints += points;
      state.meaningDone = true;
      state.feedback = {
        tone: "is-good",
        html: "<b>Meaning locked.</b> " + esc(option.why) + " +" + points + " points.",
      };
      render();
      focusSoon("#continue-btn");
      return;
    }

    state.wrongOptions.push(index);

    if (state.meaningTry === 1) {
      state.feedback = {
        tone: "is-bad",
        html: "<b>Not quite.</b> " + esc(option.why) +
          " One retry left — worth 20 points instead of 40.",
      };
      render();
      focusSoon(".option:not(:disabled)");
      return;
    }

    state.meaningDone = true;
    state.meaningPoints = 0;
    state.feedback = {
      tone: "is-bad",
      html: "<b>Not quite.</b> " + esc(option.why) +
        " The answer is “" + esc(c.gloss) + "”. " + esc(c.meaningExplain) +
        " No points this phase.",
    };
    render();
    focusSoon("#continue-btn");
  }

  function continueToEvidence() {
    if (state.phase !== "meaning" || !state.meaningDone) return;
    const c = currentCase();
    state.phase = "evidence";
    state.feedback = {
      tone: "",
      html: "<b>Evidence phase.</b> Tap the one line that proves <mark class=\"target-word\">" +
        esc(c.target) + "</mark> means “" + esc(c.gloss) + "”.",
    };
    render();
    focusSoon(".clue-line.is-tappable");
  }

  function finishCase(feedback) {
    const c = currentCase();
    state.phase = "solved";
    state.evidenceDone = true;

    if (!state.caseLogged) {
      state.results.push({
        no: c.no,
        title: c.title,
        points: state.casePoints,
      });
      state.caseLogged = true;
    }

    state.feedback = feedback || {
      tone: "is-good",
      html: "<b>Case solved.</b> +" + state.casePoints + " points. The evidence is highlighted above.",
    };

    render();
    focusSoon("#solved-title", isShortLandscape());
  }

  function chooseLine(index) {
    if (state.phase === "meaning") {
      state.feedback = state.meaningDone
        ? {
            tone: "",
            html: "<b>Meaning locked.</b> Choose “Now find the evidence” to start the evidence phase.",
          }
        : {
            tone: "",
            html: "<b>Reading mode.</b> Choose the meaning first; then these same lines become your evidence board.",
          };
      renderFeedback();
      return;
    }

    if (state.phase !== "evidence") return;
    if (state.wrongLines.includes(index)) return;

    const c = currentCase();
    state.evidenceTry += 1;

    if (index === c.evidence) {
      const points = state.evidenceTry === 1 ? 60 : 30;
      state.evidencePoints = points;
      state.score += points;
      state.casePoints += points;
      finishCase({
        tone: "is-good",
        html: "<b>Evidence found.</b> Line " + (index + 1) + " is the one. +" + points + " points.",
      });
      return;
    }

    state.wrongLines.push(index);
    const hint = c.hints[index] || "That line does not show the meaning in action.";

    if (state.evidenceTry === 1) {
      state.feedback = {
        tone: "is-bad",
        html: "<b>Not evidence.</b> " + esc(hint) +
          " One retry left — worth 30 points.",
      };
      render();
      focusSoon(".clue-line.is-tappable:not(:disabled)");
      return;
    }

    state.evidencePoints = 0;
    finishCase({
      tone: "is-bad",
      html: "<b>Not evidence.</b> " + esc(hint) +
        " The evidence was line " + (c.evidence + 1) + ". No points this phase.",
    });
  }

  function nextCase() {
    if (state.phase !== "solved") return;
    if (state.caseIndex >= CASE_COUNT - 1) {
      endGame();
      return;
    }
    loadCase(state.caseIndex + 1);
  }

  function endGame() {
    state.phase = "end";
    state.best = demo.best(GAME_ID);
    state.newBest = demo.saveBest(GAME_ID, state.score);
    state.best = demo.best(GAME_ID);
    demo.report(state.score);
    render();
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    focusSoon("#end-title", true);
  }

  function replay() {
    startGame();
  }

  /* ---------- Events ---------- */

  els.stage.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target ? target.closest("button[data-action]") : null;
    if (!button || button.disabled) return;

    const index = Number(button.dataset.index);
    switch (button.dataset.action) {
      case "line":
        chooseLine(index);
        break;
      case "option":
        chooseOption(index);
        break;
      case "continue":
        continueToEvidence();
        break;
      case "next":
        nextCase();
        break;
      case "replay":
        replay();
        break;
      default:
        break;
    }
  });

  /* ---------- Start ---------- */

  startGame({ initial: true });
})();
