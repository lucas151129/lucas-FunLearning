/* Tiny local-demo helpers. No dependencies, no network. */
window.EnglishDemo = (() => {
  const params = new URLSearchParams(location.search);

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function bestKey(gameId) {
    return "english-demo:" + gameId;
  }

  function best(gameId) {
    return Number(localStorage.getItem(bestKey(gameId)) || 0);
  }

  function saveBest(gameId, score) {
    const previous = best(gameId);
    if (score > previous) {
      localStorage.setItem(bestKey(gameId), String(score));
      return true;
    }
    return false;
  }

  function report(score) {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: "game-score", score }, location.origin);
      }
    } catch (err) {
      /* standalone demo */
    }
  }

  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.textContent = String(value);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[char]));
  }

  return { params, clamp, best, saveBest, report, shuffle, setText, escapeHtml };
})();
