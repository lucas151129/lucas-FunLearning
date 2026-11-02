(() => {
  "use strict";

  const CROPS = [
    {
      id: "lettuce",
      name: "Lettuce",
      cn: "生菜",
      icon: "🥬",
      accent: "#6f9f55",
      soft: "#e4efd7",
      focus: "LIGHT · WATER · MINERALS",
      blurb: "A leafy crop that shows stress quickly.",
      readings: { light: "low", water: "dry", soil: "poor", temp: "cool" },
      sensors: ["light", "water", "soil"],
      stages: [
        {
          tag: "SPROUT",
          title: "Reach for the light",
          observation: "The seedlings have long, thin stems and small pale leaves. They are leaning towards the window.",
          prompt: "What should you change first?",
          options: [
            { text: "Move the tray into full sunlight", correct: true, effects: { light: "ok" }, feedback: "Correct. The seedlings were etiolated: with too little light they grow tall and spindly instead of making strong leaves.", note: "Too little light causes etiolation — stems stretch and leaves stay small." },
            { text: "Cover the tray with shade cloth", correct: false, effects: { light: "low" }, feedback: "That makes the limiting factor worse. Less light means less photosynthesis, so the stems will stretch even more.", note: "Shade is useful for scorching, not for a light-starved seedling." },
            { text: "Add a large dose of fertiliser", correct: false, effects: { soil: "rich" }, feedback: "Fertiliser supplies minerals, not light. A large dose can also raise the salt concentration and damage young roots.", note: "Fertiliser is not plant food; it supplies mineral ions." },
          ],
          note: "Light was the limiting factor at this stage.",
        },
        {
          tag: "WATER",
          title: "The dry crust",
          observation: "The surface compost has pulled away from the pot and feels dry. At midday the leaves droop, then recover overnight.",
          prompt: "How should you water the lettuce?",
          options: [
            { text: "Water thoroughly until it drains from the pot", correct: true, effects: { water: "ok" }, feedback: "Correct. A thorough watering reaches the root zone; free drainage stops the roots sitting in water.", note: "Water carries minerals and keeps cells turgid." },
            { text: "Spray a little water every hour", correct: false, effects: { water: "dry" }, feedback: "Small surface sprays encourage shallow roots and never reach the deeper roots. The plant is still short of water.", note: "Light spraying is not the same as watering the root zone." },
            { text: "Stop watering completely", correct: false, effects: { water: "dry" }, feedback: "The plant is already wilting. Without water it cannot keep its cells turgid or carry minerals.", note: "Wilting is a sign of lost turgor, not a reason to withhold water." },
          ],
          note: "Water was the limiting factor at this stage.",
        },
        {
          tag: "MINERALS",
          title: "Yellow older leaves",
          observation: "The oldest leaves are turning yellow while the new centre leaves remain green. Growth has slowed.",
          prompt: "What is the best response?",
          options: [
            { text: "Add well-rotted compost and feed lightly", correct: true, effects: { soil: "ok" }, feedback: "Correct. Older leaves yellowing first is consistent with a mobile mineral such as nitrogen being moved to new growth. Compost adds nutrients slowly and improves the soil.", note: "Minerals such as nitrogen and magnesium are needed for chlorophyll and proteins." },
            { text: "Add a very large dose of soluble fertiliser", correct: false, effects: { soil: "rich" }, feedback: "More is not better. Excess fertiliser can burn roots and make the soil too salty; it does not undo the deficiency safely.", note: "Over-fertilising can cause salt stress and root damage." },
            { text: "Only add water", correct: false, effects: { soil: "poor" }, feedback: "Water is not a mineral supplement. The yellowing pattern suggests a nutrient shortage, not a lack of water.", note: "Water and minerals are separate needs." },
          ],
          note: "A mineral shortage was limiting growth; fertiliser is not 'food'.",
        },
        {
          tag: "HARVEST",
          title: "A firm head",
          observation: "The lettuce head feels firm when you squeeze it. The outer leaves are still green and crisp.",
          prompt: "When should you harvest?",
          options: [
            { text: "Harvest now", correct: true, effects: {}, feedback: "Correct. The head is mature and still tender. Leaving it longer risks bolting in warm weather, which makes the leaves bitter.", note: "Harvest at the intended eating stage, before bolting." },
            { text: "Wait another two weeks", correct: false, effects: {}, feedback: "The lettuce may bolt and turn bitter. A firm head is already at the eating stage.", note: "Delayed harvest is not automatically a bigger harvest." },
            { text: "Pick only the centre leaves", correct: false, effects: {}, feedback: "That damages the head and does not give a clean harvest. For a headed lettuce, cut the whole head at the base.", note: "Harvest method should match the crop." },
          ],
          note: "Harvest timing is a decision too: ripeness and quality matter.",
        },
      ],
    },
    {
      id: "tomato",
      name: "Tomato",
      cn: "番茄",
      icon: "🍅",
      accent: "#d56852",
      soft: "#f8e0d8",
      focus: "LIGHT · WATER · POLLINATION",
      blurb: "A fruiting crop with a hidden pollination step.",
      readings: { light: "low", water: "dry", soil: "ok", temp: "ok", pollination: "none" },
      sensors: ["light", "water", "pollination"],
      stages: [
        {
          tag: "SPROUT",
          title: "A leggy seedling",
          observation: "The tomato seedling has wide gaps between its leaves and a thin, stretched stem.",
          prompt: "What does the seedling need?",
          options: [
            { text: "Move it to full sun or a strong grow light", correct: true, effects: { light: "ok" }, feedback: "Correct. The plant is stretching for light. Tomatoes need strong light to grow compact and stocky.", note: "Light intensity affects stem length and leaf development." },
            { text: "Put it in a darker corner", correct: false, effects: { light: "low" }, feedback: "That increases the problem. A darker spot makes the plant stretch further towards any light.", note: "Etiolation gets worse in shade." },
            { text: "Water it more often", correct: false, effects: { water: "wet" }, feedback: "Water does not replace light. Overwatering can also waterlog the roots and make the plant wilt.", note: "More water cannot fix a light shortage." },
          ],
          note: "Light was limiting; a stocky tomato needs strong light.",
        },
        {
          tag: "WATER",
          title: "Wet soil, wilting leaves",
          observation: "The soil is soggy and the leaves are wilting. When you lift the pot, water runs out and the roots smell stale.",
          prompt: "What is the best action?",
          options: [
            { text: "Stop watering, improve drainage and airflow", correct: true, effects: { water: "ok" }, feedback: "Correct. Roots need oxygen. Waterlogged soil fills the air spaces, so the roots cannot respire properly and the plant wilts.", note: "Overwatering can look like underwatering: both cause wilting." },
            { text: "Water again to revive the leaves", correct: false, effects: { water: "wet" }, feedback: "Adding more water worsens the waterlogging. The roots need air, not more water.", note: "Wilting is not always a sign of dry soil." },
            { text: "Add more fertiliser", correct: false, effects: { soil: "rich" }, feedback: "Fertiliser will not restore oxygen in waterlogged soil and may add more salt stress.", note: "Diagnose the cause before adding anything." },
          ],
          note: "Root respiration needs air spaces in the soil.",
        },
        {
          tag: "FLOWER",
          title: "Flowers, no fruit",
          observation: "The plant has many yellow flowers, but the flower stalks are turning yellow and no small tomatoes are forming.",
          prompt: "What is missing?",
          options: [
            { text: "Tap the flower stems gently or introduce bumblebees", correct: true, effects: { pollination: "good" }, feedback: "Correct. Tomato flowers are self-pollinating, but the pollen still needs shaking loose. A gentle tap or a bee can do that.", note: "Pollination is the transfer of pollen; without it, flowers do not set fruit." },
            { text: "Add more nitrogen fertiliser", correct: false, effects: { soil: "rich" }, feedback: "Too much nitrogen pushes leafy growth and can reduce flowering and fruit set. The flowers need pollination, not more nitrogen.", note: "Excess nitrogen can mean leaves instead of fruit." },
            { text: "Remove all the flowers", correct: false, effects: { pollination: "none" }, feedback: "Removing flowers removes the fruit. The plant needs those flowers pollinated.", note: "Flowers are the reproductive structures that become fruit." },
          ],
          note: "Pollination was the limiting factor at flowering.",
        },
        {
          tag: "HARVEST",
          title: "Colour and firmness",
          observation: "Most of the tomato has turned red, but the shoulders are still green. It feels firm, not hard.",
          prompt: "When should you pick it?",
          options: [
            { text: "Wait until the whole fruit colours and gives slightly", correct: true, effects: {}, feedback: "Correct. A tomato can ripen off the vine, but flavour and colour are best when it is fully coloured and slightly soft.", note: "Ripeness is a stage of development, not just size." },
            { text: "Pick it now while the shoulders are green", correct: false, effects: {}, feedback: "It will ripen further off the vine, but it is not at its best yet. The green shoulder shows uneven ripening.", note: "Colour is a useful ripeness cue." },
            { text: "Leave it until it is very soft", correct: false, effects: {}, feedback: "Overripe fruit collapses and spoils quickly. Slight give is enough.", note: "Harvest quality depends on timing." },
          ],
          note: "Harvest at full colour but before over-ripeness.",
        },
      ],
    },
    {
      id: "radish",
      name: "Radish",
      cn: "蘿蔔",
      icon: "🌿",
      accent: "#a86952",
      soft: "#f3e1d8",
      focus: "SOIL · WATER · SPACING",
      blurb: "A root crop that punishes compact soil and crowding.",
      readings: { light: "ok", water: "dry", soil: "poor", temp: "cool" },
      sensors: ["soil", "water", "light"],
      stages: [
        {
          tag: "ROOT",
          title: "A hard start",
          observation: "The radish roots are short and forked. The soil surface is hard and compacted.",
          prompt: "What should you change?",
          options: [
            { text: "Loosen the soil and mix in compost", correct: true, effects: { soil: "ok" }, feedback: "Correct. Radish roots need loose, airy soil to swell straight. Compost improves structure and holds moisture.", note: "Root crops need space and oxygen in the soil." },
            { text: "Press the soil down firmly", correct: false, effects: { soil: "poor" }, feedback: "Compaction makes roots fork and stay small. Roots cannot push through hard soil.", note: "Compacted soil limits root growth." },
            { text: "Add more water only", correct: false, effects: { water: "wet" }, feedback: "Water will not loosen compacted soil. The roots need physical space and air.", note: "Water does not fix soil structure." },
          ],
          note: "Soil structure was the limiting factor.",
        },
        {
          tag: "WATER",
          title: "Dry and cracked",
          observation: "The soil is dry to a finger's depth and the radish leaves are dull. There has been no rain for several days.",
          prompt: "How should you water?",
          options: [
            { text: "Water deeply, then let the top layer dry slightly", correct: true, effects: { water: "ok" }, feedback: "Correct. Deep watering encourages deeper roots. Letting the surface dry a little reduces fungal problems.", note: "Deep, less frequent watering builds a deeper root system." },
            { text: "Give a small spray every day", correct: false, effects: { water: "dry" }, feedback: "A daily surface spray keeps only the top wet. The root zone stays dry.", note: "Wet surface does not mean wet root zone." },
            { text: "Wait for the plant to wilt", correct: false, effects: { water: "dry" }, feedback: "Wilting is already stress; yield is lost before visible wilting.", note: "Do not wait for severe symptoms." },
          ],
          note: "Water was limiting; deep watering is more effective than surface spraying.",
        },
        {
          tag: "SPACING",
          title: "Too many seedlings",
          observation: "The seedlings are crowded together. Their leaves overlap and the roots are staying thin.",
          prompt: "What is the best action?",
          options: [
            { text: "Thin the seedlings and leave enough space", correct: true, effects: { soil: "ok" }, feedback: "Correct. Each plant needs light, water and minerals. Crowding causes competition and small roots.", note: "Thinning reduces competition between plants." },
            { text: "Leave them all — more plants must mean more crop", correct: false, effects: { soil: "poor" }, feedback: "More plants in the same space means fewer resources each. The roots stay small.", note: "Plant density affects resource competition." },
            { text: "Add more fertiliser without thinning", correct: false, effects: { soil: "rich" }, feedback: "Fertiliser cannot create more light or space. Crowding remains the limiting factor.", note: "Adding a resource does not remove competition for space and light." },
          ],
          note: "Spacing was the limiting factor; thinning is an agricultural decision.",
        },
        {
          tag: "HARVEST",
          title: "Shoulder above soil",
          observation: "The top of a radish is visible above the soil and is about 3 cm across. It feels firm.",
          prompt: "What should you do?",
          options: [
            { text: "Harvest now", correct: true, effects: {}, feedback: "Correct. Radishes are best young and crisp. Leaving them longer makes them woody or split.", note: "Harvest root crops before they become over-mature." },
            { text: "Wait until it flowers", correct: false, effects: {}, feedback: "Flowering signals the plant is putting energy into reproduction; the root becomes woody.", note: "Bolting changes root quality." },
            { text: "Pick the leaves only", correct: false, effects: {}, feedback: "The crop is the root, not just the leaves. Cutting leaves removes the plant's food factories.", note: "The harvestable part must match the crop." },
          ],
          note: "Harvest timing preserves eating quality.",
        },
      ],
    },
    {
      id: "beans",
      name: "Beans",
      cn: "豆",
      icon: "🫛",
      accent: "#5d8e61",
      soft: "#e3eedb",
      focus: "NITROGEN · WATER · LIGHT",
      blurb: "A legume that can work with nitrogen-fixing bacteria.",
      readings: { light: "ok", water: "dry", soil: "poor", temp: "ok", pollination: "good" },
      sensors: ["soil", "water", "light"],
      stages: [
        {
          tag: "NITROGEN",
          title: "Pale leaves, poor soil",
          observation: "The bean leaves are pale and growth is slow. Last season this bed grew lettuce, and the soil is low in nitrogen.",
          prompt: "What is the smartest treatment?",
          options: [
            { text: "Inoculate with rhizobium or rotate with a legume", correct: true, effects: { soil: "ok" }, feedback: "Correct. Rhizobium bacteria in root nodules convert atmospheric nitrogen into a form the plant can use. Beans can partner with them.", note: "Legumes can obtain nitrogen through rhizobium symbiosis." },
            { text: "Apply a very large amount of nitrogen fertiliser", correct: false, effects: { soil: "rich" }, feedback: "Beans can fix their own nitrogen. Excess nitrogen encourages leaves and can reduce pod production.", note: "More nitrogen is not always better for a legume." },
            { text: "Do nothing; the soil will recover by itself", correct: false, effects: { soil: "poor" }, feedback: "The plants are already showing a shortage. Without a nitrogen source or rhizobium, growth stays limited.", note: "Identify and address the limiting nutrient." },
          ],
          note: "Rhizobium fixes nitrogen; a legume does not need heavy nitrogen fertiliser.",
        },
        {
          tag: "WATER",
          title: "Dry soil",
          observation: "The soil is dry below the surface and the bean leaves are curling at the edges.",
          prompt: "How should you water?",
          options: [
            { text: "Water deeply at the base", correct: true, effects: { water: "ok" }, feedback: "Correct. Water the root zone, not the leaves. Deep watering supports flowering and pod fill.", note: "Watering at the base also reduces leaf disease." },
            { text: "Spray the leaves every hour", correct: false, effects: { water: "dry" }, feedback: "Leaf spraying does not reach the roots and can encourage fungal disease.", note: "Wet leaves are not the same as watered roots." },
            { text: "Stop watering until the flowers appear", correct: false, effects: { water: "dry" }, feedback: "The plant is already stressed. Water is needed before and during flowering.", note: "Stress before flowering reduces yield." },
          ],
          note: "Water was limiting; apply it to the root zone.",
        },
        {
          tag: "LIGHT",
          title: "Leaves but few flowers",
          observation: "The bean plants are tall and leafy, but there are few flowers and some buds have dropped. A tall hedge is shading the bed.",
          prompt: "What is the best action?",
          options: [
            { text: "Open the site to full sun", correct: true, effects: { light: "ok" }, feedback: "Correct. Beans need strong light for flowering and pod production. The hedge is shading the bed.", note: "Light is needed for photosynthesis and for good flower development." },
            { text: "Add nitrogen fertiliser", correct: false, effects: { soil: "rich" }, feedback: "Extra nitrogen can push even more leaf growth and fewer flowers. Light, not nitrogen, is the missing resource.", note: "Do not treat every problem with fertiliser." },
            { text: "Water more often", correct: false, effects: { water: "wet" }, feedback: "The soil is not dry. Extra water can waterlog the roots and does not replace light.", note: "Match the treatment to the limiting factor." },
          ],
          note: "Light was limiting flowering; shade reduced yield.",
        },
        {
          tag: "HARVEST",
          title: "Green pods",
          observation: "The pods are full and still green. The seeds inside are soft and have not hardened.",
          prompt: "When should you harvest?",
          options: [
            { text: "Pick the green pods now", correct: true, effects: {}, feedback: "Correct. For green beans, harvest when pods are full but before the seeds harden and the pods turn yellow.", note: "Harvest stage depends on whether you want green pods or dry beans." },
            { text: "Wait until the pods are dry and yellow", correct: false, effects: {}, feedback: "That is the stage for dry beans, not tender green beans. The pods become fibrous.", note: "The same crop can be harvested at different stages for different products." },
            { text: "Pick only the leaves", correct: false, effects: {}, feedback: "The pods are the harvest. Removing leaves also reduces photosynthesis.", note: "Harvest the part of the plant that is the crop." },
          ],
          note: "Harvest timing depends on the product: green pods or dry beans.",
        },
      ],
    },
    {
      id: "strawberry",
      name: "Strawberry",
      cn: "草莓",
      icon: "🍓",
      accent: "#c95655",
      soft: "#f7dfdc",
      focus: "HUMIDITY · WATER · POLLINATION",
      blurb: "A delicate fruit crop where airflow and pollinators matter.",
      readings: { light: "ok", water: "wet", soil: "ok", temp: "warm", pollination: "none" },
      sensors: ["temp", "water", "pollination"],
      stages: [
        {
          tag: "HUMIDITY",
          title: "Grey mould",
          observation: "The greenhouse is warm and humid. Some leaves have soft grey patches and the air feels still.",
          prompt: "What should you change?",
          options: [
            { text: "Open vents, improve airflow and lower humidity", correct: true, effects: { temp: "ok" }, feedback: "Correct. Grey mould thrives in still, humid air. Ventilation dries the leaf surface and reduces disease pressure.", note: "Fungal diseases spread more easily in warm, humid, still air." },
            { text: "Spray more water over the leaves", correct: false, effects: { water: "wet" }, feedback: "More leaf wetness helps the fungus spread. Water the roots, not the foliage.", note: "Wet leaves increase fungal risk." },
            { text: "Close the greenhouse to keep it warm", correct: false, effects: { temp: "warm" }, feedback: "Closing it traps humid air and makes the disease worse.", note: "Still, humid air favours mould." },
          ],
          note: "Humidity and airflow were limiting; ventilation is a physical control, not a chemical one.",
        },
        {
          tag: "WATER",
          title: "Water on the leaves",
          observation: "The soil is moist but water droplets sit on the leaves after watering. Some leaf edges are browning.",
          prompt: "How should you water next time?",
          options: [
            { text: "Water the root zone and keep the leaves dry", correct: true, effects: { water: "ok" }, feedback: "Correct. Strawberries are prone to fruit and leaf rots. Drip or base watering keeps the canopy dry.", note: "Water the roots, not the leaves, to reduce disease." },
            { text: "Spray the leaves to cool the plant", correct: false, effects: { water: "wet" }, feedback: "Leaf spraying keeps the canopy wet and favours fungal disease. It also does not water the roots deeply.", note: "Cooling the leaves is not the same as watering." },
            { text: "Stop watering entirely", correct: false, effects: { water: "dry" }, feedback: "The plant still needs water; stopping completely causes drought stress.", note: "Avoid both extremes." },
          ],
          note: "Water delivery method affects disease risk, not just water amount.",
        },
        {
          tag: "POLLINATION",
          title: "Flowers but few berries",
          observation: "The plants are flowering, but many flowers drop and the few berries are small and misshapen.",
          prompt: "What is the best action?",
          options: [
            { text: "Introduce bees or gently brush the flowers", correct: true, effects: { pollination: "good" }, feedback: "Correct. Strawberries need pollen transfer for complete fruit development. Bees are efficient pollinators; a soft brush can help in a closed greenhouse.", note: "Incomplete pollination produces misshapen fruit." },
            { text: "Spray pesticide on the flowers", correct: false, effects: { pollination: "none" }, feedback: "Pesticides can kill pollinators and make the problem worse. The flowers need pollination, not poison.", note: "Broad-spectrum pesticides can harm beneficial insects." },
            { text: "Add more nitrogen fertiliser", correct: false, effects: { soil: "rich" }, feedback: "Nitrogen does not replace pollination. Excess nitrogen can also push leaves rather than fruit.", note: "Fertiliser is not a pollinator." },
          ],
          note: "Pollination was limiting fruit set.",
        },
        {
          tag: "HARVEST",
          title: "Red, but white at the tip",
          observation: "The berry is red and fragrant, but the tip is still white and the fruit is firm.",
          prompt: "When should you pick it?",
          options: [
            { text: "Wait until the tip colours too, then pick", correct: true, effects: {}, feedback: "Correct. A strawberry with a white tip is not fully ripe; flavour and colour develop last at the tip.", note: "Ripeness develops unevenly; colour is a useful indicator." },
            { text: "Pick it now", correct: false, effects: {}, feedback: "It will be firm and acidic. The white tip shows it is not fully ripe.", note: "Size is not the same as ripeness." },
            { text: "Leave it until it is soft and bruised", correct: false, effects: {}, feedback: "Overripe berries spoil quickly and attract mould. Pick at full colour, still firm.", note: "Harvest at the right stage for quality." },
          ],
          note: "Harvest when colour reaches the tip and the fruit is still firm.",
        },
      ],
    },
  ];

  const SENSOR_META = {
    light: { label: "LIGHT", cn: "光照", values: { low: ["LOW", "is-low"], ok: ["GOOD", "is-ok"], high: ["TOO HIGH", "is-high"] } },
    water: { label: "WATER", cn: "水分", values: { dry: ["DRY", "is-low"], ok: ["GOOD", "is-ok"], wet: ["TOO WET", "is-high"] } },
    soil: { label: "MINERALS", cn: "礦物質", values: { poor: ["LOW", "is-low"], ok: ["GOOD", "is-ok"], rich: ["EXCESS", "is-high"] } },
    temp: { label: "AIR", cn: "溫度／通風", values: { cool: ["COOL", "is-low"], ok: ["GOOD", "is-ok"], warm: ["HUMID", "is-high"] } },
    pollination: { label: "POLLEN", cn: "授粉", values: { none: ["LOW", "is-low"], good: ["GOOD", "is-ok"] } },
  };

  const state = {
    cropIndex: 0,
    stageIndex: 0,
    total: 0,
    cropScore: 0,
    attempts: 0,
    solved: false,
    readings: {},
    health: 100,
    notes: [],
    stageResults: [],
    results: [],
  };

  const el = {
    startScreen: document.getElementById("startScreen"),
    playScreen: document.getElementById("playScreen"),
    harvestScreen: document.getElementById("harvestScreen"),
    resultScreen: document.getElementById("resultScreen"),
    cropPreview: document.getElementById("cropPreview"),
    seasonLabel: document.getElementById("seasonLabel"),
    cropTitle: document.getElementById("cropTitle"),
    cropCn: document.getElementById("cropCn"),
    hudDay: document.getElementById("hudDay"),
    hudScore: document.getElementById("hudScore"),
    dayValue: document.getElementById("dayValue"),
    cropValue: document.getElementById("cropValue"),
    scoreValue: document.getElementById("scoreValue"),
    bench: document.getElementById("bench"),
    stageTag: document.getElementById("stageTag"),
    healthTag: document.getElementById("healthTag"),
    plantArt: document.getElementById("plantArt"),
    sensorRow: document.getElementById("sensorRow"),
    observation: document.getElementById("observation"),
    dayMark: document.getElementById("dayMark"),
    stageTitle: document.getElementById("stageTitle"),
    stagePrompt: document.getElementById("stagePrompt"),
    options: document.getElementById("options"),
    feedback: document.getElementById("feedback"),
    pointsNote: document.getElementById("pointsNote"),
    nextBtn: document.getElementById("nextBtn"),
    notes: document.getElementById("notes"),
    noteCount: document.getElementById("noteCount"),
    harvestMark: document.getElementById("harvestMark"),
    harvestTitle: document.getElementById("harvestTitle"),
    harvestCopy: document.getElementById("harvestCopy"),
    harvestScore: document.getElementById("harvestScore"),
    harvestStars: document.getElementById("harvestStars"),
    harvestLog: document.getElementById("harvestLog"),
    nextCropBtn: document.getElementById("nextCropBtn"),
    resultCopy: document.getElementById("resultCopy"),
    finalScore: document.getElementById("finalScore"),
    finalStars: document.getElementById("finalStars"),
    resultLog: document.getElementById("resultLog"),
    bestValue: document.getElementById("bestValue"),
    replayBtn: document.getElementById("replayBtn"),
    startBtn: document.getElementById("startBtn"),
    howBtn: document.getElementById("howBtn"),
    howModal: document.getElementById("howModal"),
    howClose: document.getElementById("howClose"),
    howDone: document.getElementById("howDone"),
    toast: document.getElementById("toast"),
  };

  const esc = (value) => String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const currentCrop = () => CROPS[state.cropIndex];
  const currentStage = () => currentCrop().stages[state.stageIndex];

  function showScreen(name) {
    ["start", "play", "harvest", "result"].forEach((key) => {
      const node = el[key + "Screen"];
      node.classList.toggle("active", key === name);
      node.hidden = key !== name;
    });
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function starsFor(score) {
    return score >= 100 ? 3 : score >= 75 ? 2 : score >= 50 ? 1 : 0;
  }

  function starMarkup(n) {
    return [0, 1, 2].map((i) => `<span class="${i < n ? "on" : ""}">★</span>`).join("");
  }

  function setFeedback(kind, html) {
    el.feedback.className = "feedback" + (kind ? " is-" + kind : "");
    el.feedback.innerHTML = html;
  }

  function toast(message) {
    el.toast.textContent = message;
    el.toast.classList.add("show");
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => el.toast.classList.remove("show"), 1800);
  }

  function renderCropPreview() {
    el.cropPreview.innerHTML = CROPS.map((crop) => `
      <article class="crop-preview-card" style="--accent:${crop.accent};--accent-soft:${crop.soft}">
        <span class="crop-icon">${crop.icon}</span>
        <b>${crop.name}</b><small>${crop.cn}</small>
        <span>${crop.focus}</span>
      </article>`).join("");
  }

  function renderBench() {
    el.bench.innerHTML = CROPS.map((crop, i) => `
      <span class="bench-bed ${i === state.cropIndex ? "is-current" : ""} ${i < state.cropIndex ? "is-done" : ""}">
        <i></i>${crop.icon} ${crop.cn}
      </span>`).join("");
  }

  function renderHud() {
    const day = state.stageIndex + 1;
    el.hudDay.textContent = `${day}/4`;
    el.hudScore.textContent = String(state.total + state.cropScore);
    el.dayValue.textContent = `${day} / 4`;
    el.cropValue.textContent = `${state.cropIndex + 1} / 5`;
    el.scoreValue.textContent = String(state.total + state.cropScore);
    if (el.bench) renderBench();
  }

  function startGame() {
    state.cropIndex = 0;
    state.total = 0;
    state.results = [];
    startCrop();
  }

  function startCrop() {
    const crop = currentCrop();
    state.stageIndex = 0;
    state.cropScore = 0;
    state.attempts = 0;
    state.solved = false;
    state.health = 100;
    state.notes = [];
    state.stageResults = [];
    state.tried = new Set();
    state.readings = { ...crop.readings };
    el.seasonLabel.textContent = `SEASON · BED ${state.cropIndex + 1} OF 5`;
    el.cropTitle.textContent = crop.name;
    el.cropCn.textContent = `${crop.cn} · ${crop.focus}`;
    renderHud();
    renderStage();
    showScreen("play");
  }

  function renderStage() {
    const crop = currentCrop();
    const stage = currentStage();
    state.attempts = 0;
    state.solved = false;
    el.stageTag.textContent = `DAY ${state.stageIndex + 1} · ${stage.tag}`;
    el.healthTag.textContent = state.health < 55 ? "STRESSED" : "HEALTHY";
    el.healthTag.classList.toggle("is-stressed", state.health < 55);
    el.dayMark.textContent = String(state.stageIndex + 1).padStart(2, "0");
    el.stageTitle.textContent = stage.title;
    el.stagePrompt.textContent = stage.prompt;
    el.observation.textContent = stage.observation;
    el.nextBtn.hidden = true;
    el.nextBtn.textContent = state.stageIndex === 3 ? "Harvest →" : "Next day →";
    el.pointsNote.textContent = "First try: 25 points";
    setFeedback("", "Read the observation and the sensors. Choose one action.");
    el.plantArt.innerHTML = plantArt(crop, state.stageIndex, state.health);
    renderSensors();
    renderOptions();
    renderNotes();
    renderHud();
  }

  function renderSensors() {
    const crop = currentCrop();
    el.sensorRow.innerHTML = crop.sensors.map((key) => {
      const meta = SENSOR_META[key];
      const value = state.readings[key] || "ok";
      const detail = meta.values[value] || ["—", ""];
      return `<div class="sensor"><span>${meta.cn} · ${meta.label}</span><b class="${detail[1]}">${detail[0]}</b></div>`;
    }).join("");
  }

  function renderOptions() {
    const stage = currentStage();
    el.options.innerHTML = "";
    stage.options.forEach((option, i) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "option";
      button.dataset.option = String(i);
      button.innerHTML = `<span class="opt-mark">${String.fromCharCode(65 + i)}</span><span>${esc(option.text)}</span>`;
      if (state.solved && option.correct) button.classList.add("is-correct");
      if (state.solved) button.disabled = true;
      if (state.tried && state.tried.has(i) && !option.correct) {
        button.classList.add("is-wrong");
        button.disabled = true;
      }
      button.addEventListener("click", () => chooseOption(i, button));
      el.options.append(button);
    });
    if (state.tried && state.solved) {
      const correctButton = el.options.querySelector(".option[data-option='" + stage.options.findIndex((o) => o.correct) + "']");
      if (correctButton) correctButton.classList.add("is-correct");
    }
  }

  function chooseOption(index, button) {
    if (state.solved) return;
    const stage = currentStage();
    const option = stage.options[index];
    if (!option) return;
    if (!state.tried) state.tried = new Set();
    if (option.correct) {
      const points = state.attempts === 0 ? 25 : state.attempts === 1 ? 12 : 0;
      state.cropScore += points;
      state.health = Math.min(100, state.health + (state.attempts === 0 ? 7 : 2));
      Object.entries(option.effects || {}).forEach(([key, value]) => { state.readings[key] = value; });
      state.solved = true;
      state.stageResults.push({ title: stage.title, points, note: stage.note });
      state.notes.push(stage.note);
      renderOptions();
      renderSensors();
      el.plantArt.innerHTML = plantArt(currentCrop(), state.stageIndex, state.health);
      el.healthTag.textContent = state.health < 55 ? "STRESSED" : "HEALTHY";
      el.healthTag.classList.toggle("is-stressed", state.health < 55);
      setFeedback("good", `<b>+${points} points.</b> ${esc(option.feedback)}`);
      el.pointsNote.textContent = points ? `${points} points this stage` : "No points this stage";
      el.nextBtn.hidden = false;
      renderNotes();
      renderHud();
      return;
    }

    state.attempts += 1;
    state.health = Math.max(20, state.health - 6);
    state.tried.add(index);
    button.classList.add("is-wrong");
    button.disabled = true;
    el.plantArt.innerHTML = plantArt(currentCrop(), state.stageIndex, state.health);
    el.healthTag.textContent = state.health < 55 ? "STRESSED" : "HEALTHY";
    el.healthTag.classList.toggle("is-stressed", state.health < 55);
    setFeedback("bad", `<b>Not the limiting factor.</b> ${esc(option.feedback)}`);
    if (state.attempts >= 2) {
      el.pointsNote.textContent = "No points this stage — choose the best remaining action.";
    } else {
      el.pointsNote.textContent = "Retry: 12 points available";
    }
    renderHud();
  }

  function renderNotes() {
    el.noteCount.textContent = `${state.notes.length} note${state.notes.length === 1 ? "" : "s"}`;
    if (!state.notes.length) {
      el.notes.innerHTML = '<li class="empty-note">Your observations will appear here.</li>';
      return;
    }
    el.notes.innerHTML = state.notes.map((note) => `<li>${esc(note)}</li>`).join("");
  }

  function nextStage() {
    if (!state.solved) return;
    state.tried = new Set();
    if (state.stageIndex < 3) {
      state.stageIndex += 1;
      renderStage();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const cropScore = state.cropScore;
    state.total += cropScore;
    state.cropScore = 0;
    const stars = starsFor(cropScore);
    state.results.push({ name: currentCrop().name, cn: currentCrop().cn, score: cropScore, stars });
    el.harvestMark.textContent = currentCrop().icon;
    el.harvestTitle.textContent = `${currentCrop().name} harvest.`;
    el.harvestCopy.textContent = stars === 3
      ? "A clean crop: you identified the limiting factor at every stage and adjusted the environment."
      : stars === 2
        ? "A good crop. One or two decisions missed the limiting factor, but the plant recovered."
        : stars === 1
          ? "An edible crop, but the plant spent energy coping with the wrong conditions. Read the notes before the next bed."
          : "A weak crop. The environment was rarely matched to the plant's needs; review the notebook and try again.";
    el.harvestScore.textContent = String(cropScore);
    el.harvestStars.innerHTML = starMarkup(stars);
    el.harvestStars.setAttribute("aria-label", `${stars} out of 3 stars`);
    el.harvestLog.innerHTML = state.stageResults.map((row) => `<div class="harvest-row"><span>${esc(row.title)}</span><b>+${row.points}</b></div>`).join("");
    el.nextCropBtn.textContent = state.cropIndex === CROPS.length - 1 ? "See season report →" : "Next crop →";
    showScreen("harvest");
    renderHud();
    if (state.cropIndex === CROPS.length - 1) {
      el.nextCropBtn.focus({ preventScroll: true });
    }
  }

  function nextCrop() {
    if (state.cropIndex >= CROPS.length - 1) {
      showFinal();
      return;
    }
    state.cropIndex += 1;
    startCrop();
  }

  function showFinal() {
    const total = state.total;
    const stars = total >= 450 ? 3 : total >= 350 ? 2 : total >= 200 ? 1 : 0;
    el.finalScore.textContent = String(total);
    el.finalStars.innerHTML = starMarkup(stars);
    el.finalStars.setAttribute("aria-label", `${stars} out of 3 stars`);
    el.resultCopy.textContent = stars === 3
      ? "Five strong harvests. You read the crops instead of guessing, and matched each treatment to the limiting factor."
      : stars === 2
        ? "A healthy season. A few decisions missed the cause, but the greenhouse recovered."
        : stars === 1
          ? "The greenhouse produced a crop, but several stages were stressed. The notebook has the evidence for a better season."
          : "The season was difficult. Use the notebook to review each limiting factor, then grow again.";
    el.resultLog.innerHTML = state.results.map((row) => `<div class="result-row"><span>${esc(row.name)} · ${esc(row.cn)}</span><b>${row.score} / 100</b></div>`).join("");
    try {
      const previous = Number(localStorage.getItem("leaf-lab-best") || 0);
      if (total > previous) localStorage.setItem("leaf-lab-best", String(total));
      el.bestValue.textContent = String(Math.max(previous, total));
    } catch (err) { el.bestValue.textContent = String(total); }
    try {
      if (window.parent && window.parent !== window) window.parent.postMessage({ type: "game-score", score: total }, location.origin);
    } catch (err) { /* standalone */ }
    showScreen("result");
    el.replayBtn.focus({ preventScroll: true });
  }

  function plantArt(crop, stage, health) {
    const stressed = health < 55;
    const leaf = stressed ? "#c6c27a" : "#b9d88b";
    const leafDark = "#2f664a";
    const pot = `<path class="pot" d="M82 208h76l-9 27H91z"/><path class="soil" d="M79 202h82v10H79z"/>`;
    const sprout = `<path class="seed" d="M120 202c0-7 4-11 0-15-4 4 0 8 0 15z"/>`;
    let plant = "";
    if (crop.id === "lettuce") {
      const size = [10, 23, 36, 44][stage];
      const leaves = [];
      for (let i = 0; i < 7; i += 1) {
        const angle = -76 + i * 25;
        leaves.push(`<ellipse class="leaf" cx="120" cy="${188 - i % 3 * 8}" rx="${size}" ry="${size * .55}" transform="rotate(${angle} 120 188)"/>`);
      }
      plant = leaves.join("") + (stage === 3 ? '<ellipse class="leaf" cx="120" cy="164" rx="23" ry="17"/>' : "");
    } else if (crop.id === "tomato" || crop.id === "beans") {
      const h = [20, 48, 78, 98][stage];
      plant = `<path class="stem" d="M120 202V${202 - h}"/>`;
      for (let i = 0; i < 5; i += 1) {
        const y = 190 - i * 18;
        plant += `<path class="leaf" d="M120 ${y}c-18 0-28-8-31-20 18 0 29 8 31 20zM120 ${y + 8}c18 0 28-8 31-20-18 0-29 8-31 20z"/>`;
      }
      if (crop.id === "tomato" && stage >= 2) {
        if (stage === 2) plant += '<circle class="flower" cx="94" cy="152" r="7"/><circle class="flower" cx="146" cy="163" r="7"/>';
        else plant += '<circle class="fruit" cx="94" cy="146" r="10"/><circle class="fruit" cx="148" cy="158" r="9"/><circle class="fruit" cx="118" cy="132" r="8"/>';
      }
      if (crop.id === "beans" && stage === 3) {
        plant += '<path class="fruit" d="M93 148c-15 0-19 8-17 14 13 2 19-5 17-14zM148 157c15 0 19 8 17 14-13 2-19-5-17-14z"/>';
      }
    } else if (crop.id === "radish") {
      const h = [10, 38, 67, 85][stage];
      plant = `<path class="stem" d="M120 202V${202 - h}"/>`;
      for (let i = 0; i < 4; i += 1) {
        const y = 186 - i * 19;
        plant += `<path class="leaf" d="M120 ${y}c-18 0-29-7-31-19 18 0 29 7 31 19zM120 ${y + 7}c18 0 29-7 31-19-18 0-29 7-31 19z"/>`;
      }
      if (stage === 3) plant += '<ellipse class="fruit" cx="120" cy="196" rx="18" ry="12"/>';
    } else if (crop.id === "strawberry") {
      plant = '<path class="stem" d="M120 202V171"/>';
      plant += '<path class="leaf" d="M120 186c-23 0-35-9-37-23 21 0 34 9 37 23zM120 181c23 0 35-9 37-23-21 0-34 9-37 23z"/>';
      if (stage >= 2) plant += '<circle class="flower" cx="93" cy="165" r="7"/><circle class="flower" cx="147" cy="169" r="7"/>';
      if (stage === 3) plant += '<path class="fruit" d="M86 180c-8 0-11 9-5 15 5 5 10 0 12-6 2 6 7 11 12 6 6-6 3-15-5-15z"/>';
    }
    return `<svg viewBox="20 100 200 140" role="img" aria-label="${esc(crop.name)} at stage ${stage + 1}">
      <ellipse cx="120" cy="238" rx="74" ry="8" fill="rgba(32,54,45,.10)"/>
      ${plant}${pot}
      <path d="M70 228h100" fill="none" stroke="rgba(32,54,45,.22)" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  }

  // Events
  el.startBtn.addEventListener("click", startGame);
  el.howBtn.addEventListener("click", () => { el.howModal.hidden = false; el.howClose.focus(); });
  el.howClose.addEventListener("click", () => { el.howModal.hidden = true; });
  el.howDone.addEventListener("click", () => { el.howModal.hidden = true; });
  el.howModal.addEventListener("click", (event) => { if (event.target === el.howModal) el.howModal.hidden = true; });
  el.nextBtn.addEventListener("click", nextStage);
  el.nextCropBtn.addEventListener("click", nextCrop);
  el.replayBtn.addEventListener("click", startGame);
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !el.howModal.hidden) el.howModal.hidden = true; });

  renderCropPreview();
  window.__LEAF_LAB__ = {
    crops: CROPS,
    get state() { return { cropIndex: state.cropIndex, stageIndex: state.stageIndex, total: state.total, cropScore: state.cropScore, solved: state.solved, health: state.health, notes: state.notes.slice(), results: state.results.slice() }; },
    start: startGame,
  };
})();
