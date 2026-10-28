/* Classic bootstrap for same-origin iframe hosts. */
window.__RIPPLE_TANK_BOOT__ = true;
import('./main.js').catch(function (error) {
  console.error('ripple-tank boot failed', error);
});
