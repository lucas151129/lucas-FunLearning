/* A deliberately small, inspectable air-cannon model for a Grade 2 game.
 *
 * The air pulse is treated as one expanding ring. More air (bottle volume),
 * a stronger pull and a sealed body increase the pulse. The nozzle changes
 * the trade-off between concentration and spread. Each candle is put out only
 * when the ring reaches its height with enough strength.
 */

export const WORLD = { width: 900, height: 560 };
export const NOZZLE = { x: 275, y: 315 };
export const CANDLE_X = [650, 730];
export const CANDLE_Y = [240, 290, 340, 390];
export const DISTANCE = 1;

export const CONTAINERS = {
  s: { id: 's', label: '小膠樽', radius: 1, power: 0.78, color: '#dff6ff' },
  l: { id: 'l', label: '大膠樽', radius: 1, power: 1, color: '#d8f4ff' },
  box: { id: 'box', label: '紙箱炮', radius: 1.08, power: 1.08, color: '#e2b57a' },
};

export const NOZZLES = {
  small: { id: 'small', label: '細出氣口', radius: 40, efficiency: 1, color: '#ffb21c' },
  mid: { id: 'mid', label: '剛剛好', radius: 80, efficiency: 1, color: '#0c8f86' },
  big: { id: 'big', label: '大出氣口', radius: 140, efficiency: 0.55, color: '#ff7a3c' },
};

export const SEAL_FACTOR = 0.25;
export const CANDLE_COUNT = CANDLE_X.length * CANDLE_Y.length;

export function candles() {
  const list = [];
  CANDLE_X.forEach((x) => {
    CANDLE_Y.forEach((y) => {
      list.push({ x, y });
    });
  });
  return list;
}

export function simulate({ container, nozzle, pull, sealed = true, aim = 0, wind = 0 }) {
  const box = CONTAINERS[container] || CONTAINERS.s;
  const hole = NOZZLES[nozzle] || NOZZLES.mid;
  const safePull = Math.max(0.2, Math.min(1, Number(pull) || 0.8));
  const pullFactor = 0.3 + 0.7 * safePull;
  const sealFactor = sealed ? 1 : SEAL_FACTOR;
  const efficiency = Math.min(1.15, pullFactor * box.power * hole.efficiency * sealFactor);
  const radius = hole.radius * box.radius;
  const centerY = NOZZLE.y + aim * 80 - wind * 35;

  const list = candles().map((candle, index) => {
    const near = Math.abs(candle.y - centerY) <= radius;
    return { ...candle, index, near, distance: Math.abs(candle.y - centerY) };
  });

  const reachable = list.filter((candle) => candle.near);
  const count = Math.min(reachable.length, Math.round(reachable.length * Math.min(1, efficiency)));
  const extinguished = reachable
    .slice()
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count)
    .map((candle) => candle.index);

  return {
    count,
    extinguished,
    centerY,
    radius,
    efficiency,
    sealed: !!sealed,
    container: box.id,
    nozzle: hole.id,
    pull: safePull,
    aim,
    wind,
    output: {
      label: box.label,
      nozzle: hole.label,
      pull: Math.round(safePull * 100),
    },
  };
}

export function bestOf(results) {
  return results.reduce((best, item) => Math.max(best, item?.count || 0), 0);
}

export function scoreMission({ predictionCorrect, testedAll, conclusionCorrect, best, target }) {
  return {
    prediction: predictionCorrect ? 20 : 0,
    tests: testedAll ? 20 : 0,
    conclusion: conclusionCorrect ? 40 : 0,
    performance: best >= target ? 20 : 0,
  };
}
