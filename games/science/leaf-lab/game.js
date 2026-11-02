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

  const ZH = {
    lettuce: {
      focus: "光照 · 水分 · 礦物質",
      blurb: "葉菜類，最快把壓力寫在葉片上。",
      stages: [
        {
          tag: "發芽", title: "向光伸展",
          observation: "幼苗的莖又長又細，葉片細小偏淡，整株向窗戶傾斜。",
          prompt: "你應該先改變哪一項？",
          note: "這個階段限制生長的是光照。",
          options: [
            { text: "把苗盤移到全日照位置", feedback: "正確。幼苗已經徒長：光線不足時，植物會把莖拉長去追光，葉片卻長不壯。" },
            { text: "用遮光布蓋住苗盤", feedback: "這會令限制因子更嚴重。光更少，光合作用更弱，幼苗只會繼續徒長。" },
            { text: "一次加大量肥料", feedback: "肥料提供礦物質，不是光。大量施肥更會提高鹽分，傷害幼根。" },
          ],
        },
        {
          tag: "水分", title: "乾裂的表土",
          observation: "表土乾裂、和盆邊分離；中午葉片下垂，過夜後又恢復。",
          prompt: "你會怎樣澆水？",
          note: "這個階段限制生長的是水分。",
          options: [
            { text: "澆透水，直到盆底排水", feedback: "正確。一次澆透才能到達根區；多餘水分從盆底排出，根部不會長時間浸水。" },
            { text: "每小時只噴少量水", feedback: "表面噴水只會令根變淺，深層根系仍然缺水。" },
            { text: "完全停止澆水", feedback: "植株已經萎蔫；沒有水，細胞無法維持膨壓，也無法運送礦物質。" },
          ],
        },
        {
          tag: "礦物質", title: "老葉變黃",
          observation: "最老的外葉先變黃，中央新葉仍然翠綠，生長速度變慢。",
          prompt: "最好的處理是甚麼？",
          note: "礦物質不足限制了生長；肥料不是食物。",
          options: [
            { text: "加入腐熟堆肥，薄肥勤施", feedback: "正確。老葉先黃、新葉仍綠，符合氮等可移動礦物質被送往新葉的情況；堆肥可緩慢補充養分。" },
            { text: "一次加入大量水溶性肥料", feedback: "更多不等於更好。過量肥料會提高泥土鹽分，燒傷根部。" },
            { text: "只加水", feedback: "水不是礦物質補充劑；這個黃化模式比較像養分不足。" },
          ],
        },
        {
          tag: "收成", title: "結實的葉球",
          observation: "用手輕按葉球，感覺結實；外葉仍然翠綠爽脆。",
          prompt: "何時收成？",
          note: "收成時機也是決定：成熟度和品質同樣重要。",
          options: [
            { text: "現在收成", feedback: "正確。葉球已成熟而仍然嫩；再等下去，天氣一熱就可能抽苔，葉片變苦。" },
            { text: "再等兩星期", feedback: "葉球可能抽苔變苦；結實的葉球已經到了食用階段。" },
            { text: "只摘中央葉片", feedback: "這樣會破壞葉球，也不是乾淨的收成方式；結球生菜應在基部整棵切下。" },
          ],
        },
      ],
    },
    tomato: {
      focus: "光照 · 水分 · 授粉",
      blurb: "結果類作物，藏著一個授粉步驟。",
      stages: [
        {
          tag: "發芽", title: "徒長的幼苗",
          observation: "番茄幼苗的節間拉長，莖又細又長，葉片之間距離很大。",
          prompt: "幼苗需要甚麼？",
          note: "光照是限制因子；番茄需要強光才長得矮壯。",
          options: [
            { text: "移到全日照位置或強植物燈下", feedback: "正確。幼苗正在追光；番茄需要強光，植株才會緊湊、莖部粗壯。" },
            { text: "放在更暗的角落", feedback: "光更少，幼苗會繼續拉長去找光，問題只會惡化。" },
            { text: "多澆水", feedback: "水不能取代光；澆得太多更可能令根部缺氧，葉片反而萎蔫。" },
          ],
        },
        {
          tag: "水分", title: "濕泥與萎蔫的葉",
          observation: "泥土濕透，葉片卻萎蔫；提起花盆有水流出，根部有霉味。",
          prompt: "最好的做法是？",
          note: "根部呼吸需要泥土中的空氣。",
          options: [
            { text: "停止澆水，改善排水與通風", feedback: "正確。根部需要氧氣；泥土積水會填滿空氣空隙，根無法呼吸，植株便會萎蔫。" },
            { text: "再澆水讓葉片恢復", feedback: "這會令積水更嚴重；葉片萎蔫不一定代表缺水。" },
            { text: "加更多肥料", feedback: "肥料不能恢復泥土中的氧氣，還可能增加鹽分壓力。" },
          ],
        },
        {
          tag: "開花", title: "有花無果",
          observation: "植株開了許多黃花，但花柄變黃，沒有小番茄形成。",
          prompt: "缺少了甚麼？",
          note: "授粉是花粉的轉移；沒有授粉，花不會結果。",
          options: [
            { text: "輕彈花梗，或放熊蜂入溫室", feedback: "正確。番茄花可自花授粉，但花粉仍需要震動才會落下；輕彈或熊蜂都能做到。" },
            { text: "加更多氮肥", feedback: "過量氮肥會推動長葉，反而減少開花和結果；花需要的是授粉。" },
            { text: "把所有花摘掉", feedback: "摘掉花就沒有果；那些花正是會發育成果實的構造。" },
          ],
        },
        {
          tag: "收成", title: "顏色與硬度",
          observation: "大部分果實已轉紅，但肩部仍青；按下去有彈性，不算硬。",
          prompt: "何時採摘？",
          note: "成熟度不只靠大小，顏色和硬度也是線索。",
          options: [
            { text: "等整顆轉色、略軟才採", feedback: "正確。番茄在藤上成熟時風味和顏色最好；整顆轉色、稍軟便是適合採收的時候。" },
            { text: "現在採青肩果", feedback: "它可以在離株後繼續熟，但未到最佳狀態；青肩表示成熟不均。" },
            { text: "等到非常軟", feedback: "過熟的番茄容易塌陷和腐壞；略有彈性就足夠。" },
          ],
        },
      ],
    },
    radish: {
      focus: "泥土 · 水分 · 間距",
      blurb: "根菜類，最怕板結泥土與過密。",
      stages: [
        {
          tag: "根部", title: "硬土開局",
          observation: "蘿蔔的根短而分叉，泥土表面硬實。",
          prompt: "你應該改變甚麼？",
          note: "根部需要疏鬆、含空氣的泥土。",
          options: [
            { text: "鬆土並混入堆肥", feedback: "正確。蘿蔔的根要向下肥大，需要疏鬆、透氣的泥土；堆肥可改善結構。" },
            { text: "把泥土壓實", feedback: "板結的泥土會令根分叉、長不大；根無法推開硬土。" },
            { text: "只加更多水", feedback: "水不能鬆開板結的泥土；根仍然沒有足夠空間和空氣。" },
          ],
        },
        {
          tag: "水分", title: "乾裂的泥土",
          observation: "泥土乾至指節深，葉片暗淡；已經幾日沒有下雨。",
          prompt: "你會怎樣澆水？",
          note: "深層澆水比表面噴水有效。",
          options: [
            { text: "一次澆透，之後讓表層稍乾", feedback: "正確。深層澆水可鼓勵根向下生長；表層稍乾可減少真菌問題。" },
            { text: "每天只噴少量水", feedback: "表面噴水只會濕潤表層，根區仍然缺水。" },
            { text: "等植株萎蔫才澆水", feedback: "萎蔫已經代表受壓；產量在明顯萎蔫前已經受損。" },
          ],
        },
        {
          tag: "間距", title: "幼苗太密",
          observation: "幼苗擠在一起，葉片互相遮蓋，根部仍然很細。",
          prompt: "最好的做法是？",
          note: "間苗可減少植株之間的競爭。",
          options: [
            { text: "間苗，保留足夠距離", feedback: "正確。每株植物都需要光、水和礦物質；太密會令根部長不大。" },
            { text: "全部保留，植物越多越好", feedback: "同一空間的資源有限，植株越多，每株分到的越少。" },
            { text: "只加肥料，不間苗", feedback: "肥料不能創造更多光和空間；擁擠仍然是限制因子。" },
          ],
        },
        {
          tag: "收成", title: "根肩露出土面",
          observation: "蘿蔔頂部露出土面，直徑約三厘米，摸起來結實。",
          prompt: "你會怎樣做？",
          note: "根菜要在過熟前收成。",
          options: [
            { text: "現在收成", feedback: "正確。蘿蔔趁嫩採收最爽脆；再等下去可能木質化或裂開。" },
            { text: "等它開花", feedback: "開花代表植株把能量轉向繁殖，根部會變木質化。" },
            { text: "只摘葉", feedback: "可收成的是根部，不是只有葉；摘葉會減少植株製造養分的能力。" },
          ],
        },
      ],
    },
    beans: {
      focus: "氮素 · 水分 · 光照",
      blurb: "豆科作物，可以與固氮細菌合作。",
      stages: [
        {
          tag: "氮素", title: "淡葉與貧瘠泥土",
          observation: "豆葉偏淡，生長慢；上一造是生菜，泥土缺氮。",
          prompt: "最聰明的處理是？",
          note: "根瘤菌可把空氣中的氮轉為植物可用形式。",
          options: [
            { text: "接種根瘤菌，或與豆科輪作", feedback: "正確。根瘤菌會在根瘤內把空氣中的氮轉成植物可用的形式；豆科可以靠這個合作取得氮。" },
            { text: "大量施氮肥", feedback: "豆科可以自行固氮；過量氮肥會推動長葉，反而減少結莢。" },
            { text: "不處理，泥土會自己恢復", feedback: "植株已經出現缺氮；沒有根瘤菌或氮源，生長會繼續受限制。" },
          ],
        },
        {
          tag: "水分", title: "乾旱的泥土",
          observation: "表土乾，豆葉邊緣捲曲。",
          prompt: "你會怎樣澆水？",
          note: "澆在根區，不要只噴葉。",
          options: [
            { text: "在基部澆透", feedback: "正確。水要進入根區，而不是只濕葉面；深層澆水有助開花和結莢。" },
            { text: "每小時噴葉", feedback: "葉面噴水到不了根部，還可能增加真菌病害。" },
            { text: "等開花才澆水", feedback: "植株已經受壓；開花前和開花期間都需要水分。" },
          ],
        },
        {
          tag: "光照", title: "葉多花少",
          observation: "豆株高而多葉，但花少，部分花蕾脫落；高籬笆遮住田。",
          prompt: "最好的做法是？",
          note: "光照不足會減少開花和結莢。",
          options: [
            { text: "移到全日照，或拉開遮陰", feedback: "正確。豆類需要強光進行光合作用，也需要足夠光線支持開花和結莢。" },
            { text: "加氮肥", feedback: "額外氮肥可能令植株長更多葉、開更少花；現在缺的是光。" },
            { text: "多澆水", feedback: "泥土不乾；多水不會取代光，還可能令根部缺氧。" },
          ],
        },
        {
          tag: "收成", title: "青綠豆莢",
          observation: "豆莢飽滿，仍然青綠；裡面的豆粒柔軟，未變硬。",
          prompt: "何時採收？",
          note: "收成階段取決於你要青豆莢還是乾豆。",
          options: [
            { text: "現在採青豆莢", feedback: "正確。青豆莢要在豆粒變硬、莢變黃之前採；這時最嫩。" },
            { text: "等豆莢變黃乾", feedback: "那是收乾豆的階段；青豆莢會變得纖維化。" },
            { text: "只摘葉", feedback: "豆莢才是收成；摘葉也會減少光合作用。" },
          ],
        },
      ],
    },
    strawberry: {
      focus: "濕度 · 水分 · 授粉",
      blurb: "嬌嫩的果類作物，通風與授粉同樣重要。",
      stages: [
        {
          tag: "濕度", title: "灰霉",
          observation: "溫室悶熱潮濕，部分葉片出現灰白色霉斑，空氣停滯。",
          prompt: "你應該改變甚麼？",
          note: "真菌在悶熱、潮濕、無風的環境最易傳播。",
          options: [
            { text: "開窗通風，降低濕度", feedback: "正確。灰霉喜歡停滯而潮濕的空氣；通風可吹乾葉面，減少病害壓力。" },
            { text: "向葉面噴更多水", feedback: "葉面更濕會幫助真菌擴散；應澆根部，不是噴葉。" },
            { text: "關窗保溫", feedback: "關窗會困住濕氣，令病害更嚴重。" },
          ],
        },
        {
          tag: "水分", title: "葉面積水",
          observation: "泥土濕潤，但澆水後葉片仍積著水珠，葉緣開始變褐。",
          prompt: "下次怎樣澆水？",
          note: "澆根不澆葉，可減少病害。",
          options: [
            { text: "澆根區，保持葉片乾爽", feedback: "正確。草莓容易感染葉斑和果腐；滴灌或基部澆水可保持葉冠乾爽。" },
            { text: "噴濕葉片降溫", feedback: "葉面長期濕潤會有利真菌；這不是深層澆水。" },
            { text: "完全停止澆水", feedback: "植株仍需要水；完全斷水會造成乾旱壓力。" },
          ],
        },
        {
          tag: "授粉", title: "有花少果",
          observation: "植株開花，但很多花掉落；結出的果細小、畸形。",
          prompt: "最好的做法是？",
          note: "授粉不完全會令果實畸形。",
          options: [
            { text: "放蜜蜂，或輕輕刷花", feedback: "正確。草莓需要花粉轉移才能完整結果；蜜蜂是高效授粉者，封閉溫室可用軟刷協助。" },
            { text: "向花噴農藥", feedback: "農藥可能殺死授粉昆蟲，令問題更嚴重；花需要的是授粉，不是毒藥。" },
            { text: "加更多氮肥", feedback: "氮肥不能取代授粉；過量氮還可能令植株長葉多於結果。" },
          ],
        },
        {
          tag: "收成", title: "紅果白尖",
          observation: "果實鮮紅、香氣濃，但尖端仍然白色，摸起來結實。",
          prompt: "何時採摘？",
          note: "成熟度由顏色和硬度判斷，不是大小。",
          options: [
            { text: "等尖端也轉紅才採", feedback: "正確。白尖表示果實未完全成熟；顏色和風味會最後在尖端發展。" },
            { text: "現在採", feedback: "果實會偏硬、偏酸；白尖顯示它未完全成熟。" },
            { text: "等它變軟爛", feedback: "過熟草莓容易腐壞和發霉；應在全面轉紅、仍然結實時採。" },
          ],
        },
      ],
    },
  };

  for (const crop of CROPS) {
    const zh = ZH[crop.id];
    if (!zh) continue;
    crop.focusZh = zh.focus;
    crop.blurbZh = zh.blurb;
    if (crop.id === "beans") crop.cn = "豆類";
    crop.stages.forEach((stage, i) => {
      const z = zh.stages[i];
      if (!z) return;
      stage.tagZh = z.tag;
      stage.titleZh = z.title;
      stage.observationZh = z.observation;
      stage.promptZh = z.prompt;
      stage.noteZh = z.note;
      stage.options.forEach((option, j) => {
        const o = z.options[j];
        if (!o) return;
        option.textZh = o.text;
        option.feedbackZh = o.feedback;
      });
    });
  }

  const UI = {
    en: {
      "nav.science": "Science",
      "brand.sub": "GREENHOUSE 05 · PLANT SCIENCE",
      "start.eyebrow": "GREENHOUSE 05 · INQUIRY & NURTURE",
      "start.title": "Grow the<br><em>evidence.</em>",
      "start.lead": "Five crops. Four decisions each. Read the plant, adjust one thing, and see what the greenhouse gives back.",
      "start.leadSub": "No real-time waiting: every decision moves the greenhouse clock forward one day.",
      "start.cta": "Start the season →",
      "start.how": "How it works",
      "start.crops": "crops",
      "start.stages": "stages each",
      "start.points": "points",
      "start.beds": "THE FIVE BEDS",
      "start.meet": "Meet the crops",
      "start.bedsCopy": "Every crop has a different limiting factor. The same “more” will not work twice.",
      "hud.day": "DAY",
      "hud.score": "SCORE",
      "play.day": "DAY",
      "play.bed": "BED",
      "play.score": "SCORE",
      "play.observation": "FIELD OBSERVATION",
      "play.decision": "ONE DECISION",
      "play.health": "HEALTHY",
      "play.stressed": "STRESSED",
      "play.first": "First try: 25 points",
      "play.next": "Next day →",
      "play.harvest": "Harvest →",
      "play.retry": "Retry: 12 points available",
      "play.noPoints": "No points this stage — choose the best remaining action.",
      "play.stagePoints": "{n} points this stage",
      "play.zeroPoints": "No points this stage",
      "play.defaultFeedback": "Read the observation and the sensors. Choose one action.",
      "play.note": "{n} note",
      "play.notes": "{n} notes",
      "play.notebook": "SCIENTIST'S NOTEBOOK",
      "play.notebookTitle": "What the crop is telling you",
      "play.noNotes": "Your observations will appear here.",
      "feedback.good": "+{n} points.",
      "feedback.bad": "Not the limiting factor.",
      "harvest.eyebrow": "CROP REPORT · ONE SEASON",
      "harvest.title": "{crop} harvest.",
      "harvest.of": "/ 100 for this crop",
      "harvest.next": "Next crop →",
      "harvest.report": "See season report →",
      "result.eyebrow": "SEASON COMPLETE · FIVE CROPS",
      "result.title": "The greenhouse is alive.",
      "result.of": "/ 500",
      "result.replay": "Grow another season",
      "result.back": "Back to Science",
      "result.best": "Best on this device:",
      "how.eyebrow": "HOW IT WORKS",
      "how.title": "One change at a time.",
      "how.step1": "<b>Read.</b> Look at the plant, the observation and the sensors.",
      "how.step2": "<b>Choose.</b> Pick the action that addresses the limiting factor, not just “more”.",
      "how.step3": "<b>Record.</b> The notebook explains what happened. Four decisions make one harvest.",
      "how.note": "No real-time waiting in this classroom build: the greenhouse clock advances when you make a decision.",
      "how.back": "Back to the greenhouse",
    },
    zh: {
      "nav.science": "科學",
      "brand.sub": "葉綠工坊 · 植物科學",
      "start.eyebrow": "溫室 05 · 探究與養成",
      "start.title": "種出<br><em>證據。</em>",
      "start.lead": "五種作物，四個決定。讀植物給你的線索，每次只調整一件事，再看溫室怎樣回應。",
      "start.leadSub": "不用等真實時間：每做一個決定，溫室時鐘就行一日。",
      "start.cta": "開始這一季 →",
      "start.how": "怎樣玩",
      "start.crops": "種作物",
      "start.stages": "個階段",
      "start.points": "分",
      "start.beds": "五塊田",
      "start.meet": "認識五種作物",
      "start.bedsCopy": "每種作物的限制因子都不同；同一招「加多一點」不會次次有效。",
      "hud.day": "日",
      "hud.score": "分",
      "play.day": "日",
      "play.bed": "田",
      "play.score": "分",
      "play.observation": "田間觀察",
      "play.decision": "一個決定",
      "play.health": "健康",
      "play.stressed": "受壓",
      "play.first": "首次答對：25 分",
      "play.next": "下一日 →",
      "play.harvest": "收成 →",
      "play.retry": "再試：仍有 12 分",
      "play.noPoints": "本階段沒有分數 — 選出最好的行動。",
      "play.stagePoints": "本階段 {n} 分",
      "play.zeroPoints": "本階段 0 分",
      "play.defaultFeedback": "先讀觀察和感測讀數，再選一個行動。",
      "play.note": "{n} 則筆記",
      "play.notes": "{n} 則筆記",
      "play.notebook": "科學家筆記",
      "play.notebookTitle": "作物正在告訴你甚麼",
      "play.noNotes": "你的觀察會記錄在這裡。",
      "feedback.good": "+{n} 分。",
      "feedback.bad": "這不是限制因子。",
      "harvest.eyebrow": "作物報告 · 一季",
      "harvest.title": "{crop}收成了。",
      "harvest.of": "/ 100（本作物）",
      "harvest.next": "下一種作物 →",
      "harvest.report": "查看季度報告 →",
      "result.eyebrow": "季度完成 · 五種作物",
      "result.title": "溫室活起來了。",
      "result.of": "/ 500",
      "result.replay": "再種一季",
      "result.back": "返回科學",
      "result.best": "本裝置最佳：",
      "how.eyebrow": "怎樣玩",
      "how.title": "每次只改一件事。",
      "how.step1": "<b>觀察。</b> 看植物、田間觀察和感測讀數。",
      "how.step2": "<b>選擇。</b> 選一個針對限制因子的行動，而不是盲目「加多一點」。",
      "how.step3": "<b>記錄。</b> 筆記會解釋發生甚麼事；四個決定合成一次收成。",
      "how.note": "這個課堂版本不用等真實時間：每做一個決定，溫室時鐘就行一日。",
      "how.back": "返回溫室",
    },
  };

  const SENSOR_META = {
    light: { label: "LIGHT", cn: "光照", values: { low: ["LOW", "is-low"], ok: ["GOOD", "is-ok"], high: ["TOO HIGH", "is-high"] }, zhValues: { low: ["偏低", "is-low"], ok: ["充足", "is-ok"], high: ["過強", "is-high"] } },
    water: { label: "WATER", cn: "水分", values: { dry: ["DRY", "is-low"], ok: ["GOOD", "is-ok"], wet: ["TOO WET", "is-high"] }, zhValues: { dry: ["偏乾", "is-low"], ok: ["適中", "is-ok"], wet: ["過濕", "is-high"] } },
    soil: { label: "MINERALS", cn: "礦物質", values: { poor: ["LOW", "is-low"], ok: ["GOOD", "is-ok"], rich: ["EXCESS", "is-high"] }, zhValues: { poor: ["不足", "is-low"], ok: ["適中", "is-ok"], rich: ["過量", "is-high"] } },
    temp: { label: "AIR", cn: "溫度／通風", values: { cool: ["COOL", "is-low"], ok: ["GOOD", "is-ok"], warm: ["HUMID", "is-high"] }, zhValues: { cool: ["偏低", "is-low"], ok: ["適中", "is-ok"], warm: ["悶熱", "is-high"] } },
    pollination: { label: "POLLEN", cn: "授粉", values: { none: ["LOW", "is-low"], good: ["GOOD", "is-ok"] }, zhValues: { none: ["不足", "is-low"], good: ["良好", "is-ok"] } },
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
    lastFeedback: null,
    lastPoints: 0,
    tried: new Set(),
    lastHarvest: null,
  };

  let lang = (() => {
    try { return localStorage.getItem("leaf-lab-lang") === "en" ? "en" : "zh"; } catch (err) { return "zh"; }
  })();

  function t(key, vars = {}) {
    const dict = UI[lang] || UI.en;
    let value = dict[key] ?? UI.en[key] ?? key;
    Object.entries(vars).forEach(([name, replacement]) => {
      value = value.replaceAll(`{${name}}`, String(replacement));
    });
    return value;
  }

  function tx(en, zh) {
    return lang === "zh" ? zh : en;
  }

  function stageText(stage, field) {
    return lang === "zh" ? (stage[field + "Zh"] ?? stage[field]) : stage[field];
  }

  function optionText(option) {
    return lang === "zh" ? (option.textZh ?? option.text) : option.text;
  }

  function optionFeedback(option) {
    return lang === "zh" ? (option.feedbackZh ?? option.feedback) : option.feedback;
  }

  function noteText(note) {
    if (typeof note === "string") return note;
    return lang === "zh" ? (note.zh ?? note.en) : note.en;
  }

  function cropName(crop) { return lang === "zh" ? crop.cn : crop.name; }
  function cropFocus(crop) { return lang === "zh" ? (crop.focusZh ?? crop.focus) : crop.focus; }
  function cropBlurb(crop) { return lang === "zh" ? (crop.blurbZh ?? crop.blurb) : crop.blurb; }

  function setLanguage(next) {
    lang = next === "en" ? "en" : "zh";
    try { localStorage.setItem("leaf-lab-lang", lang); } catch (err) { /* private mode */ }
    applyLanguage();
  }

  function applyLanguage() {
    document.documentElement.lang = lang === "zh" ? "zh-Hant" : "en";
    document.title = lang === "zh" ? "Leaf Lab · 葉綠工坊" : "Leaf Lab · Plant Science";
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-html]").forEach((node) => {
      node.innerHTML = t(node.dataset.i18nHtml);
    });
    document.querySelectorAll("[data-lang-toggle]").forEach((button) => {
      button.textContent = lang === "zh" ? "EN" : "繁中";
      button.setAttribute("aria-label", lang === "zh" ? "Switch to English" : "切換成繁體中文");
    });
    renderCropPreview();
    if (!el.playScreen.hidden) renderStage(true);
    if (!el.harvestScreen.hidden) renderHarvestSummary();
    if (!el.resultScreen.hidden) renderResultSummary();
  }

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
    el.cropPreview.innerHTML = CROPS.map((crop) => {
      const primary = lang === "zh" ? crop.cn : crop.name;
      const secondary = lang === "zh" ? crop.name : crop.cn;
      return `
      <article class="crop-preview-card" style="--accent:${crop.accent};--accent-soft:${crop.soft}">
        <span class="crop-icon">${crop.icon}</span>
        <b>${primary}</b><small>${secondary}</small>
        <span>${cropFocus(crop)}</span>
      </article>`;
    }).join("");
  }

  function renderBench() {
    el.bench.innerHTML = CROPS.map((crop, i) => `
      <span class="bench-bed ${i === state.cropIndex ? "is-current" : ""} ${i < state.cropIndex ? "is-done" : ""}">
        <i></i>${crop.icon} ${cropName(crop)}
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
    state.lastHarvest = null;
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
    state.lastFeedback = null;
    state.lastPoints = 0;
    state.readings = { ...crop.readings };
    el.seasonLabel.textContent = lang === "zh"
      ? `季度 · 第 ${state.cropIndex + 1} 塊田，共 5 塊`
      : `SEASON · BED ${state.cropIndex + 1} OF 5`;
    el.cropTitle.textContent = cropName(crop);
    el.cropCn.textContent = lang === "zh"
      ? `${crop.name} · ${cropFocus(crop)}`
      : `${crop.cn} · ${cropFocus(crop)}`;
    renderHud();
    renderStage(false);
    showScreen("play");
  }

  function renderStage(preserve = false) {
    const crop = currentCrop();
    const stage = currentStage();
    if (!preserve) {
      state.attempts = 0;
      state.solved = false;
      state.tried = new Set();
      state.lastFeedback = null;
      state.lastPoints = 0;
    }
    el.seasonLabel.textContent = lang === "zh"
      ? `季度 · 第 ${state.cropIndex + 1} 塊田，共 5 塊`
      : `SEASON · BED ${state.cropIndex + 1} OF 5`;
    el.cropTitle.textContent = cropName(crop);
    el.cropCn.textContent = lang === "zh"
      ? `${crop.name} · ${cropFocus(crop)}`
      : `${crop.cn} · ${cropFocus(crop)}`;
    el.stageTag.textContent = lang === "zh"
      ? `第 ${state.stageIndex + 1} 日 · ${stageText(stage, "tag")}`
      : `DAY ${state.stageIndex + 1} · ${stageText(stage, "tag")}`;
    el.healthTag.textContent = state.health < 55 ? t("play.stressed") : t("play.health");
    el.healthTag.classList.toggle("is-stressed", state.health < 55);
    el.dayMark.textContent = String(state.stageIndex + 1).padStart(2, "0");
    el.stageTitle.textContent = stageText(stage, "title");
    el.stagePrompt.textContent = stageText(stage, "prompt");
    el.observation.textContent = stageText(stage, "observation");
    el.nextBtn.textContent = state.stageIndex === 3 ? t("play.harvest") : t("play.next");
    el.nextBtn.hidden = !state.solved;
    el.pointsNote.textContent = pointsNoteText();
    if (state.lastFeedback) renderFeedback();
    else setFeedback("", t("play.defaultFeedback"));
    renderPlant();
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
      const detail = (lang === "zh" ? meta.zhValues : meta.values)[value] || ["—", ""];
      const label = lang === "zh" ? meta.cn : meta.label;
      return `<div class="sensor"><span>${label}</span><b class="${detail[1]}">${detail[0]}</b></div>`;
    }).join("");
  }

  function renderOptions() {
    const stage = currentStage();
    const correctIndex = stage.options.findIndex((o) => o.correct);
    el.options.innerHTML = "";
    stage.options.forEach((option, i) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "option";
      button.dataset.option = String(i);
      button.innerHTML = `<span class="opt-mark">${String.fromCharCode(65 + i)}</span><span>${esc(optionText(option))}</span>`;
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
      const correctButton = el.options.querySelector(".option[data-option='" + correctIndex + "']");
      if (correctButton) correctButton.classList.add("is-correct");
    }
  }

  function pointsNoteText() {
    if (state.solved) {
      return state.lastPoints ? t("play.stagePoints", { n: state.lastPoints }) : t("play.zeroPoints");
    }
    if (state.attempts >= 2) return t("play.noPoints");
    if (state.attempts === 1) return t("play.retry");
    return t("play.first");
  }

  function renderFeedback() {
    const feedback = state.lastFeedback;
    if (!feedback) {
      setFeedback("", t("play.defaultFeedback"));
      return;
    }
    const option = currentStage().options[feedback.optionIndex];
    const detail = option ? esc(optionFeedback(option)) : "";
    if (feedback.kind === "good") {
      setFeedback("good", `<b>${t("feedback.good", { n: feedback.points })}</b> ${detail}`);
    } else {
      setFeedback("bad", `<b>${t("feedback.bad")}</b> ${detail}`);
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
      state.lastPoints = points;
      state.health = Math.min(100, state.health + (state.attempts === 0 ? 7 : 2));
      Object.entries(option.effects || {}).forEach(([key, value]) => { state.readings[key] = value; });
      state.solved = true;
      state.lastFeedback = { kind: "good", optionIndex: index, points };
      state.stageResults.push({ titleEn: stage.title, titleZh: stage.titleZh, points });
      state.notes.push({ en: stage.note, zh: stage.noteZh });
      renderOptions();
      renderSensors();
      renderPlant();
      el.healthTag.textContent = state.health < 55 ? t("play.stressed") : t("play.health");
      el.healthTag.classList.toggle("is-stressed", state.health < 55);
      renderFeedback();
      el.pointsNote.textContent = pointsNoteText();
      el.nextBtn.textContent = state.stageIndex === 3 ? t("play.harvest") : t("play.next");
      el.nextBtn.hidden = false;
      renderNotes();
      renderHud();
      return;
    }

    state.attempts += 1;
    state.health = Math.max(20, state.health - 6);
    state.tried.add(index);
    state.lastFeedback = { kind: "bad", optionIndex: index };
    button.classList.add("is-wrong");
    button.disabled = true;
    renderPlant();
    el.healthTag.textContent = state.health < 55 ? t("play.stressed") : t("play.health");
    el.healthTag.classList.toggle("is-stressed", state.health < 55);
    renderFeedback();
    el.pointsNote.textContent = pointsNoteText();
    renderHud();
  }

  function renderNotes() {
    el.noteCount.textContent = t(state.notes.length === 1 ? "play.note" : "play.notes", { n: state.notes.length });
    if (!state.notes.length) {
      el.notes.innerHTML = `<li class="empty-note">${esc(t("play.noNotes"))}</li>`;
      return;
    }
    el.notes.innerHTML = state.notes.map((note) => `<li>${esc(noteText(note))}</li>`).join("");
  }

  function nextStage() {
    if (!state.solved) return;
    state.tried = new Set();
    if (state.stageIndex < 3) {
      state.stageIndex += 1;
      renderStage(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const crop = currentCrop();
    const cropScore = state.cropScore;
    state.total += cropScore;
    state.cropScore = 0;
    const stars = starsFor(cropScore);
    state.results.push({ name: crop.name, cn: crop.cn, score: cropScore, stars });
    state.lastHarvest = { cropId: crop.id, score: cropScore, stars };
    renderHarvestSummary();
    showScreen("harvest");
    renderHud();
    if (state.cropIndex === CROPS.length - 1) {
      el.nextCropBtn.focus({ preventScroll: true });
    }
  }

  function harvestCopy(stars) {
    const copies = {
      en: {
        3: "A clean crop: you identified the limiting factor at every stage and adjusted the environment.",
        2: "A good crop. One or two decisions missed the limiting factor, but the plant recovered.",
        1: "An edible crop, but the plant spent energy coping with the wrong conditions. Read the notes before the next bed.",
        0: "A weak crop. The environment was rarely matched to the plant's needs; review the notebook and try again.",
      },
      zh: {
        3: "一次乾淨的收成：每個階段都找出限制因子，並把環境調整到植物需要的位置。",
        2: "不錯的收成。有一兩個決定捉錯了限制因子，但植物總算恢復過來。",
        1: "仍然有收成，但植物花了很多能量去應付不合適的環境。下一塊田之前，先讀筆記。",
        0: "這次收成很弱。環境很少配合植物的需要；重看筆記，再試一次。",
      },
    };
    return copies[lang][stars];
  }

  function renderHarvestSummary() {
    const harvest = state.lastHarvest;
    if (!harvest) return;
    const crop = CROPS.find((item) => item.id === harvest.cropId) || currentCrop();
    el.harvestMark.textContent = crop.icon;
    el.harvestTitle.textContent = t("harvest.title", { crop: cropName(crop) });
    el.harvestCopy.textContent = harvestCopy(harvest.stars);
    el.harvestScore.textContent = String(harvest.score);
    el.harvestStars.innerHTML = starMarkup(harvest.stars);
    el.harvestStars.setAttribute("aria-label", `${harvest.stars} / 3`);
    el.harvestLog.innerHTML = state.stageResults.map((row) => `
      <div class="harvest-row"><span>${esc(lang === "zh" ? (row.titleZh ?? row.titleEn) : row.titleEn)}</span><b>+${row.points}</b></div>
    `).join("");
    el.nextCropBtn.textContent = state.cropIndex === CROPS.length - 1 ? t("harvest.report") : t("harvest.next");
  }

  function nextCrop() {
    if (state.cropIndex >= CROPS.length - 1) {
      showFinal();
      return;
    }
    state.cropIndex += 1;
    startCrop();
  }

  function resultCopy(stars) {
    const copies = {
      en: {
        3: "Five strong harvests. You read the crops instead of guessing, and matched each treatment to the limiting factor.",
        2: "A healthy season. A few decisions missed the cause, but the greenhouse recovered.",
        1: "The greenhouse produced a crop, but several stages were stressed. The notebook has the evidence for a better season.",
        0: "The season was difficult. Use the notebook to review each limiting factor, then grow again.",
      },
      zh: {
        3: "五次結實的收成。你不是靠猜，而是讀懂作物，並把每次處理對準限制因子。",
        2: "健康的一季。有幾個決定捉錯了原因，但溫室整體恢復得不錯。",
        1: "溫室仍然有收成，但有幾個階段受壓。筆記裡有證據，下一次可以種得更好。",
        0: "這一季很困難。用筆記重看每個限制因子，然後再種一次。",
      },
    };
    return copies[lang][stars];
  }

  function renderResultSummary() {
    const total = state.total;
    const stars = total >= 450 ? 3 : total >= 350 ? 2 : total >= 200 ? 1 : 0;
    el.finalScore.textContent = String(total);
    el.finalStars.innerHTML = starMarkup(stars);
    el.finalStars.setAttribute("aria-label", `${stars} / 3`);
    el.resultCopy.textContent = resultCopy(stars);
    el.resultLog.innerHTML = state.results.map((row) => {
      const label = lang === "zh" ? `${row.cn} · ${row.name}` : `${row.name} · ${row.cn}`;
      return `<div class="result-row"><span>${esc(label)}</span><b>${row.score} / 100</b></div>`;
    }).join("");
    try {
      const previous = Number(localStorage.getItem("leaf-lab-best") || 0);
      if (total > previous) localStorage.setItem("leaf-lab-best", String(total));
      el.bestValue.textContent = String(Math.max(previous, total));
    } catch (err) { el.bestValue.textContent = String(total); }
  }

  function showFinal() {
    const total = state.total;
    renderResultSummary();
    try {
      if (window.parent && window.parent !== window) window.parent.postMessage({ type: "game-score", score: total }, location.origin);
    } catch (err) { /* standalone */ }
    showScreen("result");
    el.replayBtn.focus({ preventScroll: true });
  }

  function renderPlant() {
    const crop = currentCrop();
    const stage = state.stageIndex + 1;
    const stressed = state.health < 55 ? " is-stressed" : "";
    const alt = lang === "zh" ? `${crop.cn}，第 ${stage} 個生長階段` : `${crop.name} at growth stage ${stage}`;
    el.plantArt.innerHTML = `<img src="../../../assets/games/leaf-lab/${crop.id}-${stage}.png" alt="${esc(alt)}" class="plant-sprite${stressed}">`;
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
  document.querySelectorAll("[data-lang-toggle]").forEach((button) => {
    button.addEventListener("click", () => setLanguage(lang === "zh" ? "en" : "zh"));
  });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !el.howModal.hidden) el.howModal.hidden = true; });

  applyLanguage();
  window.__LEAF_LAB__ = {
    crops: CROPS,
    get state() { return { cropIndex: state.cropIndex, stageIndex: state.stageIndex, total: state.total, cropScore: state.cropScore, solved: state.solved, health: state.health, notes: state.notes.slice(), results: state.results.slice() }; },
    start: startGame,
  };
})();
