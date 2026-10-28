import * as THREE from 'three';

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const degToRad = THREE.MathUtils.degToRad;

export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function shortestAngle(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const TOKEN_RE = /(\/\/[^\n]*)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|(\b(?:const|let|new|function|return|true|false|Math|THREE|if|else)\b)|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_$][\w$]*\b)(?=\s*\()|(\.\w+)/g;

export function highlight(code) {
  let output = '';
  let last = 0;
  code.replace(TOKEN_RE, (match, comment, string, keyword, number, fn, prop, offset) => {
    output += escapeHtml(code.slice(last, offset));
    const cls = comment
      ? 'tok-com'
      : string
        ? 'tok-str'
        : keyword
          ? 'tok-key'
          : number
            ? 'tok-num'
            : fn
              ? 'tok-fn'
              : 'tok-prop';
    output += `<span class="${cls}">${escapeHtml(match)}</span>`;
    last = offset + match.length;
    return match;
  });
  output += escapeHtml(code.slice(last));
  return output;
}

export function makeGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.16, 'rgba(255,255,255,0.92)');
  gradient.addColorStop(0.45, 'rgba(255,255,255,0.24)');
  gradient.addColorStop(0.72, 'rgba(255,255,255,0.05)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

export const glowTexture = makeGlowTexture();

export const GHOST_FILL = new THREE.MeshBasicMaterial({
  color: 0x62f4ff,
  transparent: true,
  opacity: 0.075,
  depthWrite: false,
  side: THREE.DoubleSide,
  blending: THREE.AdditiveBlending,
});

export const GHOST_LINE = new THREE.LineBasicMaterial({
  color: 0xa5fbff,
  transparent: true,
  opacity: 0.6,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

export const SHARED_MATERIALS = new Set([GHOST_FILL, GHOST_LINE]);

export function addEdges(mesh, color = 0x9ffaff, opacity = 0.55, threshold = 25) {
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry, threshold),
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  edges.renderOrder = 3;
  mesh.add(edges);
  return edges;
}

export function makeGlowSprite(color, scale = 1, opacity = 0.65) {
  const material = new THREE.SpriteMaterial({
    map: glowTexture,
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(scale, scale, 1);
  return sprite;
}

export function makeGhost(source) {
  const ghost = source.clone(true);
  ghost.traverse((object) => {
    if (object.isMesh) {
      object.material = GHOST_FILL;
      object.castShadow = false;
      object.receiveShadow = false;
      object.renderOrder = 4;
      if (object.geometry && object.geometry.attributes.position) {
        const vertexCount = object.geometry.attributes.position.count;
        if (vertexCount <= 700) {
          const edges = new THREE.LineSegments(
            new THREE.EdgesGeometry(object.geometry, 28),
            GHOST_LINE,
          );
          edges.renderOrder = 5;
          object.add(edges);
        }
      }
    } else if (object.isSprite || object.isLight) {
      object.visible = false;
    }
  });
  return ghost;
}

export function makeCirclePoints(radius, segments = 160) {
  const points = [];
  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
  }
  return points;
}

export function makeCircleLine(radius, color, opacity = 0.5, dashed = false) {
  const geometry = new THREE.BufferGeometry().setFromPoints(makeCirclePoints(radius));
  const material = dashed
    ? new THREE.LineDashedMaterial({
        color,
        transparent: true,
        opacity,
        dashSize: 0.13,
        gapSize: 0.11,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    : new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
  const line = new THREE.Line(geometry, material);
  if (dashed) line.computeLineDistances();
  return line;
}

export function setCircleRadius(line, radius) {
  const positions = line.geometry.attributes.position;
  const count = positions.count;
  for (let i = 0; i < count; i += 1) {
    const angle = (i / (count - 1)) * Math.PI * 2;
    positions.setXYZ(i, Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
  }
  positions.needsUpdate = true;
  line.geometry.computeBoundingSphere();
}

export function labelSprite(text, color = '#8ffcff', scale = 0.5) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 128, 128);
  ctx.font = '700 76px "Segoe UI", "Microsoft JhengHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color;
  ctx.shadowBlur = 22;
  ctx.fillStyle = color;
  ctx.fillText(text, 64, 70);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  sprite.scale.set(scale, scale, 1);
  sprite.renderOrder = 20;
  return sprite;
}

export function createBeam(start, end, color, opacity = 0.05, radius = 0.06) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(radius * 0.3, radius, length, 10, 1, true);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

export function seededRandom(seed = 2026) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function disposeObject(object) {
  if (!object) return;
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (!child.material) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      if (!material || SHARED_MATERIALS.has(material)) return;
      if (material.map && material.map !== glowTexture) material.map.dispose();
      material.dispose();
    });
  });
  object.removeFromParent();
}

export function formatTime(seconds) {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = String(safe % 60).padStart(2, '0');
  return `${minutes}:${rest}`;
}

export class SoundEngine {
  constructor() {
    this.context = null;
    this.master = null;
    this.enabled = true;
  }

  init() {
    if (this.context) {
      if (this.context.state === 'suspended') this.context.resume();
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    try {
      this.context = new AudioCtx();
      this.master = this.context.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.context.destination);
    } catch (error) {
      this.context = null;
      this.master = null;
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled) {
      this.init();
      this.tick(880, 0.12);
    }
  }

  tone(frequency, duration = 0.12, options = {}) {
    if (!this.enabled || !this.context || !this.master) return;
    const { type = 'sine', volume = 0.035, delay = 0, endFrequency = null } = options;
    const now = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.04);
  }

  tick(frequency = 660, volume = 0.014) {
    this.tone(frequency, 0.06, { type: 'triangle', volume });
  }

  click() {
    this.tone(520, 0.05, { type: 'triangle', volume: 0.012, endFrequency: 610 });
  }

  reset() {
    this.tone(420, 0.09, { type: 'triangle', volume: 0.015, endFrequency: 260 });
  }

  start() {
    this.init();
    [330, 440, 554.37, 659.25].forEach((frequency, index) => {
      this.tone(frequency, 0.5, {
        type: 'sine',
        volume: 0.022,
        delay: index * 0.075,
      });
    });
  }

  success() {
    this.init();
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
      this.tone(frequency, 0.85, {
        type: index === 3 ? 'triangle' : 'sine',
        volume: 0.032,
        delay: index * 0.09,
      });
    });
    this.tone(130.81, 1.15, { type: 'sine', volume: 0.026 });
  }

  finale() {
    this.init();
    [261.63, 329.63, 392, 523.25, 659.25, 783.99].forEach((frequency, index) => {
      this.tone(frequency, 1.35, {
        type: 'sine',
        volume: 0.026,
        delay: index * 0.12,
      });
    });
  }

  swoosh() {
    this.tone(260, 0.42, {
      type: 'sine',
      volume: 0.018,
      endFrequency: 440,
    });
  }
}

export function displayMixColor(values) {
  const channels = [
    values.r * 1.0 + values.g * 0.16 + values.b * 0.2,
    values.r * 0.16 + values.g * 1.0 + values.b * 0.35,
    values.r * 0.12 + values.g * 0.3 + values.b * 1.0,
  ];
  const encoded = channels.map((value) => {
    const normalized = clamp(value / 2.8, 0, 1);
    return Math.round(255 * Math.pow(normalized, 1 / 2.2));
  });
  return {
    rgb: encoded,
    css: `rgb(${encoded[0]}, ${encoded[1]}, ${encoded[2]})`,
    hex: `#${encoded.map((value) => value.toString(16).padStart(2, '0')).join('')}`,
  };
}
