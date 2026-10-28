/* Classic bootstrap for same-origin iframe hosts.
 * A parser-inserted module script can be skipped by some hosts; a classic
 * external script plus dynamic import is more reliable. */
window.__CONVEX_LENS_BOOT__ = true;
import('./main.js').catch(function (error) {
  console.error('convex-lens boot failed', error);
});
