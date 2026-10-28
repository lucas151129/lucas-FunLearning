/* Classic bootstrap.
 *
 * Some same-origin iframe hosts do not execute a parser-inserted module
 * script (and may ignore an inline script as well). A classic external
 * bootstrap is used to start the module graph with a dynamic import.
 */
window.__AIR_CANNON_BOOT__ = true;
import('./main.js').catch(function (error) {
  console.error('air-cannon boot failed', error);
});
