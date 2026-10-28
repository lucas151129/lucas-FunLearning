/* Pet care, daily quests, shop and the learning reward rules.
 *
 * Design rule: XP rewards learning quality and improvement; coins reward
 * first clears, quests and care. Repeating the same game on the same day is
 * practice, not a reward faucet.
 */
const PetCare = (() => {
  const KEY = "pixel-pet-care-v2";
  const VERSION = 2;
  const MAX_REWARDED_GAMES = 3;

  const SHOP_CATS = ["food", "toy", "home", "look"];

  const ITEMS = [
    {
      id: "fish", cat: "food", kind: "food", name: "小魚乾", icon: "🐟",
      desc: "寵物最愛的日常小食。", price: 15, fullness: 18, mood: 3,
    },
    {
      id: "cake", cat: "food", kind: "food", name: "奶油蛋糕", icon: "🍰",
      desc: "偶爾一件，牠會開心一整天。", price: 30, fullness: 30, mood: 7,
    },
    {
      id: "yarn", cat: "toy", kind: "toy", name: "毛線球", icon: "🧶",
      desc: "滾來滾去，心情和好奇一起上升。", price: 60, mood: 14, curiosity: 5,
    },
    {
      id: "frisbee", cat: "toy", kind: "toy", name: "飛盤", icon: "🥏",
      desc: "跑一跑，精神好一點。", price: 90, mood: 18, curiosity: 8,
    },
    {
      id: "starwall", cat: "home", kind: "home", name: "星空牆紙", icon: "🌌",
      desc: "把房間變成小小的天文台。", price: 120,
    },
    {
      id: "rug", cat: "home", kind: "home", name: "暖色地毯", icon: "🟧",
      desc: "一塊舒服的地毯，房間立刻不一樣。", price: 80,
    },
    {
      id: "scarf", cat: "look", kind: "look", name: "薄荷圍巾", icon: "🧣",
      desc: "牠的日常外出造型。", price: 100,
    },
    {
      id: "hat", cat: "look", kind: "look", name: "偵探帽", icon: "🎩",
      desc: "今天要一起找出答案。", price: 140,
    },
  ];

  const ITEM_BY_ID = Object.fromEntries(ITEMS.map((item) => [item.id, item]));

  function todayKey(date = new Date()) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return date.getFullYear() + "-" + month + "-" + day;
  }

  function yesterdayKey() {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return todayKey(date);
  }

  function clamp(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, value));
  }

  function readLocal() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
      return raw && typeof raw === "object" ? raw : {};
    } catch (err) {
      return {};
    }
  }

  function writeLocal(userId, care) {
    if (!userId) return;
    const all = readLocal();
    all[userId] = care;
    localStorage.setItem(KEY, JSON.stringify(all));
  }

  function localFor(userId) {
    const row = readLocal()[userId];
    return row && typeof row === "object" ? row : null;
  }

  function questFor(day, subject) {
    return {
      day,
      subject: {
        id: "subject",
        subject,
        progress: 0,
        target: 1,
        claimed: false,
        coins: 25,
        item: "fish",
      },
      explore: {
        id: "explore",
        progress: 0,
        target: 1,
        claimed: false,
        coins: 20,
        item: null,
      },
      care: {
        id: "care",
        progress: 0,
        target: 1,
        claimed: false,
        coins: 10,
        item: null,
      },
    };
  }

  function categoryStats() {
    const scores = (Store.myScores && Store.myScores()) || [];
    const byGame = new Map(scores.map((row) => [row.gameId, row]));
    return CATEGORIES.map((cat, index) => {
      const games = GAMES.filter((game) => game.category === cat.id);
      const played = games.filter((game) => byGame.has(game.id));
      const total = played.reduce((sum, game) => sum + (byGame.get(game.id)?.points || 0), 0);
      return {
        id: cat.id,
        name: cat.name,
        index,
        games: games.length,
        played: played.length,
        average: played.length ? total / played.length : 0,
      };
    });
  }

  function weakestSubject() {
    const stats = categoryStats();
    const unplayed = stats.filter((row) => row.played === 0);
    if (unplayed.length) {
      /* Rotate the first suggestion by date so every subject gets a turn. */
      const seed = Number(todayKey().replace(/-/g, "")) || 0;
      return unplayed[seed % unplayed.length].id;
    }
    return [...stats].sort((a, b) => a.average - b.average || a.played - b.played)[0].id;
  }

  function freshCare() {
    const day = todayKey();
    const subject = weakestSubject();
    return {
      v: VERSION,
      day,
      name: "",
      fullness: 72,
      mood: 68,
      curiosity: 55,
      bond: 0,
      inventory: { fish: 1 },
      owned: {},
      equipped: { home: null, look: null, toy: null },
      rewardedGames: [],
      quests: questFor(day, subject),
      request: { subject },
      streak: 0,
      lastStudyDay: "",
      lastPetAt: 0,
      totalStudy: 0,
      updatedAt: Date.now(),
    };
  }

  function normalize(care) {
    const base = freshCare();
    const next = care && typeof care === "object" ? care : {};
    const day = todayKey();
    const merged = {
      ...base,
      ...next,
      v: VERSION,
      day: next.day || day,
      inventory: { ...base.inventory, ...(next.inventory || {}) },
      owned: { ...(next.owned || {}) },
      equipped: { ...base.equipped, ...(next.equipped || {}) },
      rewardedGames: Array.isArray(next.rewardedGames) ? next.rewardedGames.slice(0, 12) : [],
      quests: next.quests && typeof next.quests === "object" ? next.quests : null,
      request: next.request && next.request.subject ? next.request : null,
    };
    merged.fullness = clamp(Number(merged.fullness) || 0);
    merged.mood = clamp(Number(merged.mood) || 0);
    merged.curiosity = clamp(Number(merged.curiosity) || 0);
    merged.bond = Math.max(0, Math.round(Number(merged.bond) || 0));
    merged.streak = Math.max(0, Math.round(Number(merged.streak) || 0));
    merged.totalStudy = Math.max(0, Math.round(Number(merged.totalStudy) || 0));
    merged.lastPetAt = Number(merged.lastPetAt) || 0;
    merged.updatedAt = Number(merged.updatedAt) || 0;
    return merged;
  }

  function ensureDaily(care) {
    const today = todayKey();
    if (care.day === today && care.quests) return false;
    const firstDay = !care.day;
    if (!firstDay) {
      care.fullness = clamp(care.fullness - 16, 12, 100);
      care.mood = clamp(care.mood - 12 - (care.fullness < 30 ? 5 : 0), 12, 100);
      care.curiosity = clamp(care.curiosity - 8, 12, 100);
      if (care.lastStudyDay && care.lastStudyDay !== yesterdayKey() && care.lastStudyDay !== today) {
        care.streak = 0;
      }
    }
    care.day = today;
    care.rewardedGames = [];
    const subject = weakestSubject();
    care.quests = questFor(today, subject);
    care.request = { subject };
    return true;
  }

  function persist(care) {
    const user = Store.current();
    if (!user) return;
    care.updatedAt = Date.now();
    writeLocal(user.id, care);
    if (Store.setCare) {
      Promise.resolve(Store.setCare(care)).catch(() => {});
    }
  }

  function ensure() {
    const user = Store.current();
    if (!user) return null;
    const core = Store.petView();
    if (!core || core.needsChoice) return null;
    const cloud = core.care && typeof core.care === "object" ? normalize(core.care) : null;
    const local = localFor(user.id);
    const localCare = local ? normalize(local) : null;
    let care = cloud;
    if (!care || (localCare && localCare.updatedAt > care.updatedAt)) care = localCare;
    if (!care) care = freshCare();
    const changed = ensureDaily(care);
    if (changed || (!cloud && !localCare) || (cloud && localCare && localCare.updatedAt > (cloud.updatedAt || 0))) {
      persist(care);
    }
    return care;
  }

  function stageOf(core) {
    return core || Store.petView();
  }

  function displayName(core, care) {
    if (care && care.name) return care.name;
    return I18n.t("pet.species." + core.species);
  }

  function requestText(care) {
    const subject = categoryById(care.request?.subject || care.quests?.subject?.subject);
    return subject ? I18n.tf("pet.request", { subject: subject.name }) : "";
  }

  function reaction(care) {
    if (care.fullness < 28) return I18n.t("pet.react.hungry");
    if (care.mood < 28) return I18n.t("pet.react.low");
    if (care.curiosity > 82) return I18n.t("pet.react.curious");
    if (care.streak >= 3) return I18n.t("pet.react.streak");
    return I18n.t("pet.react.ok");
  }

  function view() {
    const care = ensure();
    if (!care) return null;
    const core = Store.petView();
    if (!core) return null;
    const stage = stageOf(core);
    return {
      ...care,
      core: stage,
      species: stage.species,
      stage: stage.stage,
      xp: stage.xp,
      next: stage.next,
      into: stage.into,
      coins: stage.coins || 0,
      displayName: displayName(stage, care),
      requestText: requestText(care),
      reaction: reaction(care),
      items: ITEMS,
      questList: care.quests ? Object.values(care.quests).filter((item) => item && item.id) : [],
    };
  }

  function questSubjectName(quest) {
    const category = quest && quest.subject ? categoryById(quest.subject) : null;
    return category ? category.name : "";
  }

  function completeSubjectQuest(care, game) {
    const quest = care.quests && care.quests.subject;
    if (!quest || quest.claimed || quest.progress >= quest.target) return;
    if (quest.subject !== game.category) return;
    quest.progress = 1;
  }

  async function recordGame({ game, raw, max, previousBest, newSubject, priorQualifiedToday = 0 }) {
    const care = ensure();
    if (!care) return { ok: false, reason: "nopet" };
    const safeMax = Math.max(1, Number(max) || 1);
    const value = Math.max(0, Math.min(safeMax, Math.round(Number(raw) || 0)));
    const pct = value / safeMax;
    const today = todayKey();
    const sameToday = (stamp) => {
      const date = new Date(stamp);
      return date.getFullYear() + "-"
        + String(date.getMonth() + 1).padStart(2, "0") + "-"
        + String(date.getDate()).padStart(2, "0") === today;
    };
    const alreadyQualifiedToday = Boolean(previousBest
      && Number(previousBest.points) >= 60
      && sameToday(previousBest.at));

    if (pct < 0.6) {
      return {
        ok: true, practice: true, reason: "low", pct,
        xp: 0, coins: 0, pet: Store.petView(), care,
      };
    }
    if (alreadyQualifiedToday || care.rewardedGames.includes(game.id)) {
      return {
        ok: true, practice: true, reason: "repeat", pct,
        xp: 0, coins: 0, pet: Store.petView(), care,
      };
    }
    if (care.rewardedGames.length >= MAX_REWARDED_GAMES
      || Number(priorQualifiedToday) >= MAX_REWARDED_GAMES) {
      return {
        ok: true, practice: true, reason: "daily", pct,
        xp: 0, coins: 0, pet: Store.petView(), care,
      };
    }

    const previousRaw = previousBest ? Number(previousBest.raw) : null;
    const first = previousRaw == null || previousRaw / safeMax < 0.6;
    const improved = !first && previousRaw != null && value > previousRaw;
    const baseXp = pct >= 0.95 ? 20 : pct >= 0.8 ? 15 : 10;
    const firstXp = first ? 10 : 0;
    const improveXp = improved ? 5 : 0;
    const subjectXp = newSubject ? 10 : 0;
    const xp = baseXp + firstXp + improveXp + subjectXp;
    const coinBase = 10;
    const coinFirst = first ? 10 : 0;
    const coinImprove = improved ? 5 : 0;
    const coinSubject = newSubject ? 10 : 0;
    const coins = coinBase + coinFirst + coinImprove + coinSubject;

    const before = Store.petView();
    const saved = await Store.addXpCoins({ xp, coins });
    if (!saved || !saved.ok) return { ok: false, reason: "save" };
    const after = Store.petView();

    care.rewardedGames.push(game.id);
    care.totalStudy += 1;
    care.mood = clamp(care.mood + 2);
    care.curiosity = clamp(care.curiosity + (newSubject ? 7 : 1));
    care.bond = Math.max(0, care.bond + 1);
    if (care.lastStudyDay !== today) {
      care.streak = care.lastStudyDay === yesterdayKey() ? care.streak + 1 : 1;
      care.lastStudyDay = today;
    }
    completeSubjectQuest(care, game);
    if (first && care.quests && care.quests.explore) care.quests.explore.progress = 1;
    persist(care);

    return {
      ok: true,
      practice: false,
      pct,
      xp,
      coins,
      breakdown: [
        { key: "base", value: baseXp },
        { key: "first", value: firstXp },
        { key: "improve", value: improveXp },
        { key: "subject", value: subjectXp },
      ],
      first,
      improved,
      newSubject,
      pet: after,
      care,
      evolved: after.stage > before.stage,
      quests: care.quests,
    };
  }

  async function buy(id) {
    const item = ITEM_BY_ID[id];
    const care = ensure();
    if (!item || !care) return { ok: false, reason: "item" };
    if (item.kind !== "food" && care.owned[id]) return { ok: false, reason: "owned" };
    const pet = Store.petView();
    if (!pet || (pet.coins || 0) < item.price) return { ok: false, reason: "coins" };
    const paid = await Store.spendCoins(item.price);
    if (!paid || !paid.ok) return { ok: false, reason: "coins" };
    if (item.kind === "food") {
      care.inventory[id] = (care.inventory[id] || 0) + 1;
    } else {
      care.owned[id] = true;
    }
    persist(care);
    return { ok: true, item, care, coins: Store.petView().coins };
  }

  async function feed(id) {
    const care = ensure();
    const item = ITEM_BY_ID[id];
    if (!care || !item || item.kind !== "food") return { ok: false, reason: "item" };
    if ((care.inventory[id] || 0) <= 0) return { ok: false, reason: "empty" };
    care.inventory[id] -= 1;
    care.fullness = clamp(care.fullness + item.fullness);
    care.mood = clamp(care.mood + item.mood);
    care.bond = Math.max(0, care.bond + 1);
    if (care.quests && care.quests.care) care.quests.care.progress = 1;
    persist(care);
    return { ok: true, item, care };
  }

  async function play() {
    const care = ensure();
    if (!care) return { ok: false, reason: "nopet" };
    const toyId = care.equipped.toy || Object.keys(care.owned).find((id) => ITEM_BY_ID[id]?.kind === "toy");
    const toy = toyId ? ITEM_BY_ID[toyId] : null;
    care.mood = clamp(care.mood + (toy ? toy.mood : 5));
    care.curiosity = clamp(care.curiosity + (toy ? toy.curiosity : 2));
    care.bond = Math.max(0, care.bond + 2);
    persist(care);
    return { ok: true, toy: toy || null, care };
  }

  async function pet() {
    const care = ensure();
    if (!care) return { ok: false, reason: "nopet" };
    const now = Date.now();
    if (now - (care.lastPetAt || 0) < 12000) return { ok: false, reason: "cooldown" };
    care.lastPetAt = now;
    care.mood = clamp(care.mood + 3);
    care.bond = Math.max(0, care.bond + 1);
    persist(care);
    return { ok: true, care };
  }

  async function equip(id) {
    const item = ITEM_BY_ID[id];
    const care = ensure();
    if (!item || !care || !care.owned[id] || item.kind === "food") return { ok: false, reason: "item" };
    care.equipped[item.kind] = id;
    persist(care);
    return { ok: true, item, care };
  }

  async function rename(name) {
    const care = ensure();
    const clean = String(name || "").trim().slice(0, 12);
    if (!care || !clean) return { ok: false, reason: "name" };
    care.name = clean;
    persist(care);
    return { ok: true, name: clean };
  }

  async function claim(id) {
    const care = ensure();
    const quest = care && care.quests ? care.quests[id] : null;
    if (!care || !quest || quest.claimed || quest.progress < quest.target) {
      return { ok: false, reason: "quest" };
    }
    quest.claimed = true;
    const pet = await Store.addXpCoins({ xp: 0, coins: quest.coins || 0 });
    if (!pet || !pet.ok) {
      quest.claimed = false;
      return { ok: false, reason: "save" };
    }
    if (quest.item && ITEM_BY_ID[quest.item]) {
      const item = ITEM_BY_ID[quest.item];
      if (item.kind === "food") care.inventory[quest.item] = (care.inventory[quest.item] || 0) + 1;
      else care.owned[quest.item] = true;
    }
    persist(care);
    return { ok: true, quest, care, coins: Store.petView().coins };
  }

  function itemState(id) {
    const care = ensure();
    const item = ITEM_BY_ID[id];
    if (!care || !item) return { owned: false, equipped: false, count: 0 };
    return {
      owned: Boolean(care.owned[id]),
      equipped: care.equipped[item.kind] === id,
      count: care.inventory[id] || 0,
      item,
    };
  }

  function careButtons() {
    const care = ensure();
    if (!care) return [];
    const foods = Object.keys(care.inventory).filter((id) => (care.inventory[id] || 0) > 0 && ITEM_BY_ID[id]?.kind === "food");
    return foods.map((id) => ({ id, count: care.inventory[id], item: ITEM_BY_ID[id] }));
  }

  function resetLocal() {
    const user = Store.current();
    if (!user) return;
    const all = readLocal();
    delete all[user.id];
    localStorage.setItem(KEY, JSON.stringify(all));
  }

  return {
    ITEMS,
    SHOP_CATS,
    MAX_REWARDED_GAMES,
    ensure,
    view,
    recordGame,
    buy,
    feed,
    play,
    pet,
    equip,
    rename,
    claim,
    itemState,
    careButtons,
    questSubjectName,
    requestText,
    categoryStats,
    reaction,
    resetLocal,
  };
})();
