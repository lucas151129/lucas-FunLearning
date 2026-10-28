import * as THREE from 'three';
import {
  GHOST_FILL,
  GHOST_LINE,
  addEdges,
  clamp,
  createBeam,
  degToRad,
  displayMixColor,
  labelSprite,
  makeCircleLine,
  makeGhost,
  makeGlowSprite,
  setCircleRadius,
  shortestAngle,
} from './utils.js';

const AXIS_COLORS = {
  x: 0xff6b6b,
  y: 0x63f5a6,
  z: 0x6f9dff,
};

const AMBER = new THREE.Color(0xffb45c);
const GREEN = new THREE.Color(0x63f5a6);

function buildStarCore() {
  const group = new THREE.Group();

  const shell = new THREE.Mesh(
    new THREE.BoxGeometry(1.02, 1.02, 1.02),
    new THREE.MeshPhysicalMaterial({
      color: 0x8a5722,
      metalness: 0.82,
      roughness: 0.19,
      transparent: true,
      opacity: 0.46,
      depthWrite: false,
      envMapIntensity: 1.35,
    }),
  );
  shell.castShadow = true;
  group.add(shell);
  addEdges(shell, 0xffd38d, 0.9);

  const inner = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.5, 0),
    new THREE.MeshStandardMaterial({
      color: 0xffc46b,
      emissive: 0xff5c12,
      emissiveIntensity: 2.8,
      metalness: 0.2,
      roughness: 0.24,
      flatShading: true,
    }),
  );
  inner.castShadow = true;
  group.add(inner);

  const innerWire = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.62, 0),
    new THREE.MeshBasicMaterial({
      color: 0xffe2a8,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  group.add(innerWire);

  const glow = makeGlowSprite(0xff9b46, 2.4, 0.45);
  glow.material.depthTest = false;
  glow.renderOrder = 2;
  group.add(glow);

  const light = new THREE.PointLight(0xff8d42, 7, 4, 2);
  group.add(light);

  group.userData = { shell, inner, innerWire, glow };
  return group;
}

function buildCompass() {
  const group = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({
    color: 0xb17a35,
    metalness: 0.88,
    roughness: 0.24,
    envMapIntensity: 1.3,
  });
  const darkGold = new THREE.MeshStandardMaterial({
    color: 0x5d3d18,
    metalness: 0.8,
    roughness: 0.34,
  });

  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.052, 12, 88), gold);
  outerRing.rotation.x = Math.PI / 2;
  outerRing.castShadow = true;
  group.add(outerRing);

  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.024, 10, 72), darkGold);
  innerRing.rotation.x = Math.PI / 2;
  innerRing.position.y = 0.025;
  innerRing.castShadow = true;
  group.add(innerRing);

  const pointer = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.06, 0.13), gold);
  pointer.position.set(0.54, 0.09, 0);
  pointer.castShadow = true;
  group.add(pointer);

  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.83, 0.012, 0.026),
    new THREE.MeshBasicMaterial({
      color: 0xffd58b,
      transparent: true,
      opacity: 0.9,
      toneMapped: false,
    }),
  );
  blade.position.set(0.5, 0.125, 0);
  group.add(blade);

  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.105, 0.3, 4), gold);
  tip.rotation.z = -Math.PI / 2;
  tip.rotation.y = Math.PI / 4;
  tip.position.set(1.29, 0.09, 0);
  tip.castShadow = true;
  group.add(tip);

  const hub = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.18, 0),
    new THREE.MeshStandardMaterial({
      color: 0xffd48c,
      emissive: 0xff8a22,
      emissiveIntensity: 1.9,
      metalness: 0.45,
      roughness: 0.22,
      flatShading: true,
    }),
  );
  hub.castShadow = true;
  group.add(hub);

  const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.52, 8), darkGold);
  spindle.position.y = 0.26;
  spindle.castShadow = true;
  group.add(spindle);

  const spindleGem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.07, 0),
    new THREE.MeshStandardMaterial({
      color: 0x5ff3ff,
      emissive: 0x2eefff,
      emissiveIntensity: 2.4,
      roughness: 0.25,
    }),
  );
  spindleGem.position.y = 0.55;
  group.add(spindleGem);

  const gemColors = [0xffd58b, 0x5ff3ff, 0xb58cff, 0x63f5a6];
  gemColors.forEach((color, index) => {
    const angle = (index / gemColors.length) * Math.PI * 2;
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.085, 0),
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.65,
        metalness: 0.3,
        roughness: 0.25,
      }),
    );
    gem.position.set(Math.cos(angle) * 1.18, 0.08, Math.sin(angle) * 1.18);
    gem.rotation.y = angle;
    gem.castShadow = true;
    group.add(gem);
  });

  const halo = makeGlowSprite(0xffb45c, 1.05, 0.38);
  halo.position.y = 0.08;
  halo.material.depthTest = false;
  halo.renderOrder = 2;
  group.add(halo);

  group.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  group.userData = { outerRing, hub, spindleGem };
  return group;
}

function buildCrystal(ghost = false) {
  const geometry = new THREE.IcosahedronGeometry(0.8, 0);
  let mesh;
  if (ghost) {
    mesh = new THREE.Mesh(geometry, GHOST_FILL);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 24), GHOST_LINE);
    mesh.add(edges);
    mesh.renderOrder = 4;
  } else {
    mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshPhysicalMaterial({
        color: 0x48e2c8,
        metalness: 0.3,
        roughness: 0.12,
        emissive: 0x083f3b,
        emissiveIntensity: 1.1,
        flatShading: true,
        envMapIntensity: 1.4,
      }),
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    addEdges(mesh, 0x8affef, 0.55, 20);

    const glow = makeGlowSprite(0x67ffe4, 2.6, 0.34);
    glow.material.depthTest = false;
    glow.renderOrder = 2;
    mesh.add(glow);

    const light = new THREE.PointLight(0x47f0d2, 6, 3.6, 2);
    mesh.add(light);
  }
  return mesh;
}

function buildPedestal(radius = 1.3, height = 0.44) {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: 0x081722,
    metalness: 0.78,
    roughness: 0.28,
    envMapIntensity: 0.9,
  });
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 1.09, height, 64),
    material,
  );
  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 1.03, radius * 1.03, 0.035, 64),
    new THREE.MeshStandardMaterial({
      color: 0x102638,
      metalness: 0.6,
      roughness: 0.32,
    }),
  );
  cap.position.y = height + 0.012;
  cap.receiveShadow = true;
  group.add(cap);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 1.02, 0.01, 6, 96),
    new THREE.MeshBasicMaterial({
      color: 0x5ff3ff,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = height + 0.035;
  group.add(ring);
  return group;
}

function buildAxisGizmo() {
  const group = new THREE.Group();
  const axisMaterial = (color) =>
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
      toneMapped: false,
    });

  const specs = [
    {
      key: 'x',
      color: AXIS_COLORS.x,
      cylinder: [3.2, new THREE.Vector3(1.6, 0.12, 0), new THREE.Euler(0, 0, Math.PI / 2)],
      cone: [new THREE.Vector3(3.36, 0.12, 0), new THREE.Euler(0, 0, -Math.PI / 2)],
      label: [3.72, 0.12, 0],
    },
    {
      key: 'y',
      color: AXIS_COLORS.y,
      cylinder: [3.2, new THREE.Vector3(0, 1.72, 0), new THREE.Euler(0, 0, 0)],
      cone: [new THREE.Vector3(0, 3.48, 0), new THREE.Euler(0, 0, 0)],
      label: [0, 3.82, 0],
    },
    {
      key: 'z',
      color: AXIS_COLORS.z,
      cylinder: [3.2, new THREE.Vector3(0, 0.12, 1.6), new THREE.Euler(Math.PI / 2, 0, 0)],
      cone: [new THREE.Vector3(0, 0.12, 3.36), new THREE.Euler(Math.PI / 2, 0, 0)],
      label: [0, 0.12, 3.72],
    },
  ];

  specs.forEach((spec) => {
    const material = axisMaterial(spec.color);
    const [length, position, rotation] = spec.cylinder;
    const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, length, 8), material);
    cylinder.position.copy(position);
    cylinder.rotation.copy(rotation);
    group.add(cylinder);

    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.24, 10), material);
    cone.position.copy(spec.cone[0]);
    cone.rotation.copy(spec.cone[1]);
    group.add(cone);

    const label = labelSprite(spec.key.toUpperCase(), `#${spec.color.toString(16).padStart(6, '0')}`, 0.5);
    label.position.set(...spec.label);
    group.add(label);
  });

  const origin = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xeafcff, toneMapped: false }),
  );
  origin.position.y = 0.12;
  group.add(origin);

  return group;
}

function makeMarkerRing(radius, color, opacity = 0.5) {
  const mesh = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.92, radius, 56),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.09;
  return mesh;
}

/* ------------------------------------------------------------------ */
/* Level 01 — position                                                */
/* ------------------------------------------------------------------ */

function buildPositionLevel(parent, values) {
  const root = new THREE.Group();
  parent.add(root);

  const target = new THREE.Vector3(2.0, 1.6, -1.7);
  const orbit = buildStarCore();
  orbit.position.set(values.x, values.y, values.z);
  root.add(orbit);

  const ghost = new THREE.Mesh(new THREE.BoxGeometry(1.02, 1.02, 1.02), GHOST_FILL);
  ghost.position.copy(target);
  ghost.renderOrder = 4;
  const ghostEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 1.02, 1.02), 20),
    GHOST_LINE,
  );
  ghost.add(ghostEdges);
  root.add(ghost);

  const ghostHalo = makeGlowSprite(0x5ff3ff, 2.8, 0.22);
  ghostHalo.position.copy(target);
  root.add(ghostHalo);

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.55, target.y, 28, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x5ff3ff,
      transparent: true,
      opacity: 0.045,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  beam.position.set(target.x, target.y / 2, target.z);
  root.add(beam);

  const targetRing = makeMarkerRing(0.66, 0x5ff3ff, 0.55);
  targetRing.position.set(target.x, 0.09, target.z);
  root.add(targetRing);

  const objectRing = makeMarkerRing(0.5, 0xffb45c, 0.42);
  root.add(objectRing);

  const guideGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(values.x, 0.09, values.z),
    new THREE.Vector3(values.x, values.y, values.z),
  ]);
  const guide = new THREE.Line(
    guideGeometry,
    new THREE.LineDashedMaterial({
      color: 0xffb45c,
      transparent: true,
      opacity: 0.34,
      dashSize: 0.1,
      gapSize: 0.11,
      depthWrite: false,
    }),
  );
  guide.computeLineDistances();
  root.add(guide);

  const axisGizmo = buildAxisGizmo();
  root.add(axisGizmo);

  const maxDistance = new THREE.Vector3(values.x, values.y, values.z).distanceTo(target);
  const runtime = {
    root,
    orbit,
    ghost,
    ghostHalo,
    beam,
    targetRing,
    objectRing,
    guide,
    target,
    maxDistance,
    axisGizmo,
  };

  applyPositionLevel(runtime, values);
  return runtime;
}

function applyPositionLevel(runtime, values) {
  runtime.orbit.position.set(values.x, values.y, values.z);
  runtime.objectRing.position.x = values.x;
  runtime.objectRing.position.z = values.z;
  runtime.guide.geometry.setFromPoints([
    new THREE.Vector3(values.x, 0.09, values.z),
    new THREE.Vector3(values.x, values.y, values.z),
  ]);
  runtime.guide.computeLineDistances();
  const distance = new THREE.Vector3(values.x, values.y, values.z).distanceTo(runtime.target);
  runtime.ghostHalo.material.opacity = 0.18 + (1 - clamp(distance / runtime.maxDistance, 0, 1)) * 0.2;
  runtime.beam.material.opacity = 0.035 + (1 - clamp(distance / runtime.maxDistance, 0, 1)) * 0.035;
}

function checkPositionLevel(runtime, values) {
  const distance = new THREE.Vector3(values.x, values.y, values.z).distanceTo(runtime.target);
  const progress = clamp(1 - distance / runtime.maxDistance, 0, 1);
  return {
    progress,
    ok: distance <= 0.13,
    foot: distance <= 0.13 ? '泊位已鎖定' : `距泊位 ${distance.toFixed(2)} 單位`,
  };
}

function tickPositionLevel(runtime, dt, time) {
  runtime.orbit.rotation.y = Math.sin(time * 0.55) * 0.12;
  runtime.orbit.userData.inner.rotation.y += dt * 0.8;
  runtime.orbit.userData.innerWire.rotation.y -= dt * 0.5;
  runtime.targetRing.rotation.z += dt * 0.25;
  runtime.ghost.position.y = runtime.target.y + Math.sin(time * 1.6) * 0.018;
  runtime.ghostHalo.position.y = runtime.ghost.position.y;
  GHOST_FILL.opacity = 0.065 + Math.sin(time * 2.1) * 0.012;
  GHOST_LINE.opacity = 0.52 + Math.sin(time * 2.1) * 0.08;
}

const positionCode = (values) => `const core = new THREE.Mesh(cubeGeometry, coreMaterial);

core.position.set(
  ${values.x.toFixed(2)}, ${values.y.toFixed(2)}, ${values.z.toFixed(2)}
);`;

const positionExtra = () => `
  <div class="extra-box">
    <div class="extra-title"><span>RIGHT-HANDED AXES</span><b>右手座標系</b></div>
    <div class="axis-mini">
      <span><i style="--c:#ff6b6b"></i>X <em>右</em></span>
      <span><i style="--c:#63f5a6"></i>Y <em>上</em></span>
      <span><i style="--c:#6f9dff"></i>Z <em>前</em></span>
    </div>
  </div>`;

/* ------------------------------------------------------------------ */
/* Level 02 — rotation                                                */
/* ------------------------------------------------------------------ */

function buildRotationLevel(parent, values) {
  const root = new THREE.Group();
  parent.add(root);

  const compass = buildCompass();
  compass.position.set(0, 1.92, 0);
  compass.rotation.set(degToRad(values.x), degToRad(values.y), 0);
  root.add(compass);

  const ghost = makeGhost(compass);
  ghost.position.copy(compass.position);
  ghost.rotation.set(degToRad(35), degToRad(70), 0);
  root.add(ghost);

  const ghostOuterGuide = makeCircleLine(1.18, 0x9ffcff, 0.38, true);
  ghostOuterGuide.position.y = 0.08;
  ghost.add(ghostOuterGuide);

  const ghostPointerGuide = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.11, 0),
      new THREE.Vector3(1.52, 0.11, 0),
    ]),
    new THREE.LineDashedMaterial({
      color: 0x9ffcff,
      transparent: true,
      opacity: 0.55,
      dashSize: 0.08,
      gapSize: 0.06,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  ghostPointerGuide.computeLineDistances();
  ghost.add(ghostPointerGuide);

  const scanner = makeCircleLine(1.9, 0x5ff3ff, 0.3, true);
  scanner.position.y = 0.09;
  root.add(scanner);

  const scannerFill = new THREE.Mesh(
    new THREE.RingGeometry(1.55, 1.92, 96),
    new THREE.MeshBasicMaterial({
      color: 0x5ff3ff,
      transparent: true,
      opacity: 0.035,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
  );
  scannerFill.rotation.x = -Math.PI / 2;
  scannerFill.position.y = 0.085;
  root.add(scannerFill);

  const targetPulse = makeMarkerRing(1.25, 0xffb45c, 0.22);
  root.add(targetPulse);

  const runtime = { root, compass, ghost, scanner, scanFill: scannerFill, targetPulse };
  applyRotationLevel(runtime, values);
  return runtime;
}

function applyRotationLevel(runtime, values) {
  runtime.compass.rotation.x = degToRad(values.x);
  runtime.compass.rotation.y = degToRad(values.y);
}

function checkRotationLevel(runtime, values) {
  const dx = Math.abs(((values.x - 35 + 540) % 360) - 180);
  const dy = Math.abs(((values.y - 70 + 540) % 360) - 180);
  const progress = clamp(1 - (dx + dy) / 105, 0, 1);
  return {
    progress,
    ok: dx <= 6 && dy <= 6,
    foot: dx <= 6 && dy <= 6 ? '掃描姿態吻合' : `X 誤差 ${dx.toFixed(0)}° · Y 誤差 ${dy.toFixed(0)}°`,
  };
}

function tickRotationLevel(runtime, dt, time) {
  runtime.scanner.rotation.y += dt * 0.08;
  runtime.targetPulse.rotation.z -= dt * 0.2;
  runtime.ghost.position.y = 1.92 + Math.sin(time * 1.4) * 0.022;
  runtime.compass.userData.hub.rotation.y += dt * 0.35;
  runtime.compass.userData.hub.rotation.x += dt * 0.2;
  runtime.compass.userData.spindleGem.rotation.y += dt * 0.7;
  GHOST_FILL.opacity = 0.065 + Math.sin(time * 2.1) * 0.012;
  GHOST_LINE.opacity = 0.52 + Math.sin(time * 2.1) * 0.08;
}

const rotationCode = (values) => `compass.rotation.x = THREE.MathUtils.degToRad(${Math.round(values.x)});
compass.rotation.y = THREE.MathUtils.degToRad(${Math.round(values.y)});`;

const rotationExtra = (values) => `
  <div class="extra-box">
    <div class="extra-title"><span>ANGLE UNITS</span><b>角度 → 弧度</b></div>
    <div class="dim-list">
      <div class="dim-row"><span>目前 X</span><b id="rotX">${degToRad(values.x).toFixed(2)} rad</b></div>
      <div class="dim-row"><span>目前 Y</span><b id="rotY">${degToRad(values.y).toFixed(2)} rad</b></div>
      <div class="dim-row"><span>360°</span><b>2π ≈ 6.283 rad</b></div>
    </div>
  </div>`;

function syncRotationUI(runtime, values) {
  const x = document.getElementById('rotX');
  const y = document.getElementById('rotY');
  if (x) x.textContent = `${degToRad(values.x).toFixed(2)} rad`;
  if (y) y.textContent = `${degToRad(values.y).toFixed(2)} rad`;
}

/* ------------------------------------------------------------------ */
/* Level 03 — scale                                                   */
/* ------------------------------------------------------------------ */

function buildScaleLevel(parent, values) {
  const root = new THREE.Group();
  parent.add(root);

  const crystal = buildCrystal(false);
  crystal.position.set(0, 1.9, 0);
  crystal.scale.set(values.x, values.y, values.z);
  root.add(crystal);

  const ghost = buildCrystal(true);
  ghost.position.copy(crystal.position);
  ghost.scale.set(1.5, 2.0, 1.0);
  root.add(ghost);

  const scanner = makeCircleLine(2.25, 0x5ff3ff, 0.26, true);
  scanner.position.y = 0.09;
  root.add(scanner);

  const scannerFill = new THREE.Mesh(
    new THREE.RingGeometry(1.9, 2.25, 96),
    new THREE.MeshBasicMaterial({
      color: 0x5ff3ff,
      transparent: true,
      opacity: 0.03,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
  );
  scannerFill.rotation.x = -Math.PI / 2;
  scannerFill.position.y = 0.085;
  root.add(scannerFill);

  const baseBox = new THREE.Box3().setFromObject(ghost);
  const baseSize = baseBox.getSize(new THREE.Vector3()).divide(new THREE.Vector3(1.5, 2.0, 1.0));

  const runtime = {
    root,
    crystal,
    ghost,
    scanner,
    scanFill: scannerFill,
    baseSize,
    targetScale: new THREE.Vector3(1.5, 2.0, 1.0),
  };
  applyScaleLevel(runtime, values);
  return runtime;
}

function applyScaleLevel(runtime, values) {
  runtime.crystal.scale.set(values.x, values.y, values.z);
}

function checkScaleLevel(runtime, values) {
  const dx = Math.abs(values.x - 1.5);
  const dy = Math.abs(values.y - 2.0);
  const dz = Math.abs(values.z - 1.0);
  const startError = 0.8 + 1.3 + 0.3;
  const progress = clamp(1 - (dx + dy + dz) / startError, 0, 1);
  return {
    progress,
    ok: dx <= 0.075 && dy <= 0.075 && dz <= 0.075,
    foot: dx <= 0.075 && dy <= 0.075 && dz <= 0.075
      ? '掃描輪廓吻合'
      : `比例誤差 ${(dx + dy + dz).toFixed(2)}`,
  };
}

function tickScaleLevel(runtime, dt, time) {
  runtime.crystal.rotation.y += dt * 0.14;
  runtime.ghost.rotation.y = runtime.crystal.rotation.y;
  runtime.scanner.rotation.y -= dt * 0.1;
  runtime.ghost.position.y = 1.9 + Math.sin(time * 1.2) * 0.02;
  GHOST_FILL.opacity = 0.06 + Math.sin(time * 2.1) * 0.012;
  GHOST_LINE.opacity = 0.48 + Math.sin(time * 2.1) * 0.08;
}

const scaleCode = (values) => `crystal.scale.set(
  ${values.x.toFixed(2)}, ${values.y.toFixed(2)}, ${values.z.toFixed(2)}
);`;

const scaleExtra = (values) => {
  const x = (values.x * 1.51).toFixed(2);
  const y = (values.y * 1.51).toFixed(2);
  const z = (values.z * 1.51).toFixed(2);
  return `
    <div class="extra-box">
      <div class="extra-title"><span>OUTPUT DIMENSIONS</span><b>目前尺寸</b></div>
      <div class="dim-list">
        <div class="dim-row"><span>寬度 X</span><b id="dimX">${x} m</b></div>
        <div class="dim-row"><span>高度 Y</span><b id="dimY">${y} m</b></div>
        <div class="dim-row"><span>深度 Z</span><b id="dimZ">${z} m</b></div>
      </div>
    </div>`;
};

function syncScaleUI(runtime, values) {
  const x = document.getElementById('dimX');
  const y = document.getElementById('dimY');
  const z = document.getElementById('dimZ');
  if (x) x.textContent = `${(values.x * 1.51).toFixed(2)} m`;
  if (y) y.textContent = `${(values.y * 1.51).toFixed(2)} m`;
  if (z) z.textContent = `${(values.z * 1.51).toFixed(2)} m`;
}

/* ------------------------------------------------------------------ */
/* Level 04 — light                                                   */
/* ------------------------------------------------------------------ */

const LIGHT_TARGET = { r: 1.75, g: 0.6, b: 1.15 };
const LIGHT_START = { r: 0.85, g: 1.25, b: 0.75 };
const targetMix = displayMixColor(LIGHT_TARGET);

function buildLightLevel(parent, values) {
  const root = new THREE.Group();
  parent.add(root);

  const pedestal = buildPedestal(1.32, 0.44);
  root.add(pedestal);

  const pearl = new THREE.Mesh(
    new THREE.SphereGeometry(0.72, 64, 48),
    new THREE.MeshPhysicalMaterial({
      color: 0xf7fbff,
      metalness: 0.08,
      roughness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.09,
      envMapIntensity: 1.25,
    }),
  );
  pearl.position.y = 1.28;
  pearl.castShadow = true;
  pearl.receiveShadow = true;
  root.add(pearl);

  const pearlRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.86, 0.009, 6, 96),
    new THREE.MeshBasicMaterial({
      color: 0x5ff3ff,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  pearlRing.rotation.x = Math.PI / 2;
  pearlRing.position.y = 0.48;
  root.add(pearlRing);

  const specs = [
    {
      key: 'r',
      label: '紅光',
      color: 0xff5346,
      position: new THREE.Vector3(-4.0, 4.6, -2.6),
    },
    {
      key: 'g',
      label: '綠光',
      color: 0x54f59a,
      position: new THREE.Vector3(3.6, 4.0, 2.4),
    },
    {
      key: 'b',
      label: '藍光',
      color: 0x5b8cff,
      position: new THREE.Vector3(0.2, 5.4, -4.2),
    },
  ];

  const lights = [];
  specs.forEach((spec) => {
    const light = new THREE.DirectionalLight(spec.color, 0.8);
    light.position.copy(spec.position);
    light.target.position.copy(pearl.position);
    root.add(light);
    root.add(light.target);

    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 24, 18),
      new THREE.MeshStandardMaterial({
        color: spec.color,
        emissive: spec.color,
        emissiveIntensity: 2.4,
        metalness: 0.2,
        roughness: 0.2,
      }),
    );
    orb.position.copy(spec.position);
    root.add(orb);

    const halo = makeGlowSprite(spec.color, 0.95, 0.38);
    halo.position.copy(spec.position);
    root.add(halo);

    const beam = createBeam(spec.position, pearl.position.clone(), spec.color, 0.022, 0.055);
    root.add(beam);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.26, 0.01, 5, 32),
      new THREE.MeshBasicMaterial({
        color: spec.color,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    ring.position.copy(spec.position);
    ring.rotation.x = Math.PI / 2.8;
    root.add(ring);

    lights.push({ ...spec, light, orb, halo, beam, ring });
  });

  const floorRing = makeMarkerRing(2.0, 0xffb45c, 0.18);
  root.add(floorRing);

  const runtime = {
    root,
    pearl,
    pearlRing,
    lights,
    floorRing,
    target: LIGHT_TARGET,
    startError:
      (Math.abs(LIGHT_START.r - LIGHT_TARGET.r) +
        Math.abs(LIGHT_START.g - LIGHT_TARGET.g) +
        Math.abs(LIGHT_START.b - LIGHT_TARGET.b)) /
      3,
  };

  applyLightLevel(runtime, values);
  return runtime;
}

function applyLightLevel(runtime, values) {
  runtime.lights.forEach((entry) => {
    const intensity = values[entry.key];
    entry.light.intensity = intensity;
    entry.orb.material.emissiveIntensity = 0.4 + intensity * 1.15;
    entry.halo.material.opacity = 0.1 + intensity * 0.18;
    entry.halo.scale.setScalar(0.78 + intensity * 0.17);
    entry.beam.material.opacity = 0.008 + intensity * 0.014;
    entry.ring.material.opacity = 0.18 + intensity * 0.12;
  });
}

function checkLightLevel(runtime, values) {
  const diffs = [
    Math.abs(values.r - LIGHT_TARGET.r),
    Math.abs(values.g - LIGHT_TARGET.g),
    Math.abs(values.b - LIGHT_TARGET.b),
  ];
  const average = (diffs[0] + diffs[1] + diffs[2]) / 3;
  const progress = clamp(1 - average / runtime.startError, 0, 1);
  const ok = Math.max(...diffs) <= 0.16 && average <= 0.105;
  return {
    progress,
    ok,
    foot: ok ? '色彩頻譜吻合' : `平均色差 ${average.toFixed(2)}`,
  };
}

function tickLightLevel(runtime, dt, time) {
  runtime.pearlRing.rotation.z += dt * 0.18;
  runtime.floorRing.rotation.z -= dt * 0.08;
  runtime.pearl.rotation.y = time * 0.06;
  runtime.lights.forEach((entry, index) => {
    entry.ring.rotation.z += dt * (0.15 + index * 0.03);
  });
}

const lightCode = (values) => `redLight.intensity = ${values.r.toFixed(2)};
greenLight.intensity = ${values.g.toFixed(2)};
blueLight.intensity = ${values.b.toFixed(2)};`;

const lightExtra = () => `
  <div class="extra-box">
    <div class="extra-title"><span>ADDITIVE COLOR</span><b>三光混合</b></div>
    <div class="color-compare">
      <div>
        <div class="swatch-label"><span>目前混合</span></div>
        <div class="swatch" id="mixCurrent"></div>
        <span class="swatch-hex" id="mixCurrentHex"></span>
      </div>
      <div>
        <div class="swatch-label"><span>目標</span><b>極光洋紅</b></div>
        <div class="swatch" id="mixTarget" style="background:${targetMix.css}"></div>
        <span class="swatch-hex">${targetMix.hex}</span>
      </div>
    </div>
  </div>`;

function syncLightUI(runtime, values) {
  const mix = displayMixColor(values);
  const current = document.getElementById('mixCurrent');
  const currentHex = document.getElementById('mixCurrentHex');
  if (current) current.style.background = mix.css;
  if (currentHex) currentHex.textContent = mix.hex.toUpperCase();
}

/* ------------------------------------------------------------------ */
/* Level 05 — animation                                               */
/* ------------------------------------------------------------------ */

const ORBIT_TARGET = { radius: 2.9, tilt: 24, speed: 0.55 };

function buildOrbitLevel(parent, values) {
  const root = new THREE.Group();
  parent.add(root);

  const center = new THREE.Vector3(0, 1.9, 0);
  const sun = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.82, 2),
    new THREE.MeshStandardMaterial({
      color: 0xffb15f,
      emissive: 0xff5e16,
      emissiveIntensity: 2.7,
      metalness: 0.2,
      roughness: 0.3,
      flatShading: true,
    }),
  );
  sun.position.copy(center);
  root.add(sun);

  const sunWire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.0, 1),
    new THREE.MeshBasicMaterial({
      color: 0xffd28a,
      wireframe: true,
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  sunWire.position.copy(center);
  root.add(sunWire);

  const glow = makeGlowSprite(0xff9b46, 3.4, 0.46);
  glow.position.copy(center);
  root.add(glow);

  const sunLight = new THREE.PointLight(0xff8d42, 36, 22, 2);
  sunLight.position.copy(center);
  root.add(sunLight);

  const corona = new THREE.Mesh(
    new THREE.TorusGeometry(1.18, 0.012, 6, 160),
    new THREE.MeshBasicMaterial({
      color: 0xffc46f,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  corona.position.copy(center);
  corona.rotation.x = Math.PI / 2.2;
  root.add(corona);

  const ghostOrbit = new THREE.Group();
  ghostOrbit.position.copy(center);
  ghostOrbit.rotation.z = degToRad(ORBIT_TARGET.tilt);
  root.add(ghostOrbit);

  const ghostRing = makeCircleLine(ORBIT_TARGET.radius, 0x5ff3ff, 0.44, true);
  ghostOrbit.add(ghostRing);

  const ghostProbe = new THREE.Group();
  const ghostCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), GHOST_FILL);
  const ghostEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.16, 0), 20),
    GHOST_LINE,
  );
  ghostCore.add(ghostEdges);
  ghostProbe.add(ghostCore);
  const ghostHalo = makeGlowSprite(0x5ff3ff, 0.95, 0.5);
  ghostProbe.add(ghostHalo);
  ghostOrbit.add(ghostProbe);

  const playerOrbit = new THREE.Group();
  playerOrbit.position.copy(center);
  playerOrbit.rotation.z = degToRad(values.tilt);
  root.add(playerOrbit);

  const playerRing = makeCircleLine(values.radius, 0xffb45c, 0.64);
  playerOrbit.add(playerRing);

  const trailPositions = new Float32Array(72 * 3);
  const trailColors = new Float32Array(72 * 3);
  for (let i = 0; i < 72; i += 1) {
    const strength = Math.pow(1 - i / 71, 2);
    trailColors[i * 3] = AMBER.r * strength;
    trailColors[i * 3 + 1] = AMBER.g * strength;
    trailColors[i * 3 + 2] = AMBER.b * strength;
  }
  const trailGeometry = new THREE.BufferGeometry();
  trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
  trailGeometry.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));
  const trailMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const trail = new THREE.Line(trailGeometry, trailMaterial);
  playerOrbit.add(trail);

  const probe = new THREE.Group();
  const probeCore = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.17, 0),
    new THREE.MeshStandardMaterial({
      color: 0xffd28a,
      emissive: 0xff7b24,
      emissiveIntensity: 2.8,
      metalness: 0.4,
      roughness: 0.18,
      flatShading: true,
    }),
  );
  probeCore.castShadow = true;
  probe.add(probeCore);
  const probeHalo = makeGlowSprite(0xffb45c, 1.1, 0.55);
  probe.add(probeHalo);
  const probeLight = new THREE.PointLight(0xffa14d, 7, 5, 2);
  probe.add(probeLight);
  playerOrbit.add(probe);

  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.006, 4, 96),
    new THREE.MeshBasicMaterial({
      color: 0xffb45c,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  innerRing.position.copy(center);
  innerRing.rotation.x = Math.PI / 2;
  root.add(innerRing);

  const runtime = {
    root,
    center,
    sun,
    sunWire,
    sunLight,
    corona,
    ghostOrbit,
    ghostProbe,
    ghostHalo,
    ghostRing,
    playerOrbit,
    playerRing,
    probe,
    probeCore,
    probeHalo,
    probeLight,
    trail,
    trailPositions,
    trailMaterial,
    innerRing,
    targetAngle: 0,
    playerAngle: 0,
    time: 0,
    quality: 0,
    solved: false,
  };

  applyOrbitLevel(runtime, values);
  updateOrbitPositions(runtime, values, 0);
  return runtime;
}

function applyOrbitLevel(runtime, values) {
  runtime.playerOrbit.rotation.z = degToRad(values.tilt);
  setCircleRadius(runtime.playerRing, values.radius);
}

function checkOrbitLevel(runtime, values) {
  const dr = Math.abs(values.radius - ORBIT_TARGET.radius);
  const dt = Math.abs(values.tilt - ORBIT_TARGET.tilt);
  const ds = Math.abs(values.speed - ORBIT_TARGET.speed);
  const progress = clamp(
    1 - (dr / 1.0 + dt / 24 + ds / 0.65) / 3,
    0,
    1,
  );
  runtime.quality = progress;
  const ok = dr <= 0.07 && dt <= 2 && ds <= 0.025;
  return {
    progress,
    ok,
    foot: ok ? '軌道參數吻合，等待相位鎖定…' : '調整三項參數，讓光點重合',
  };
}

function updateTrail(runtime, values, angle) {
  const positions = runtime.trailPositions;
  const radius = values.radius;
  const arc = 1.1;
  for (let i = 0; i < 72; i += 1) {
    const a = angle - arc * (i / 71);
    positions[i * 3] = Math.cos(a) * radius;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = Math.sin(a) * radius;
  }
  runtime.trail.geometry.attributes.position.needsUpdate = true;
  runtime.trail.geometry.computeBoundingSphere();
}

function updateOrbitPositions(runtime, values, dt) {
  const ghostAngle = runtime.targetAngle;
  runtime.ghostProbe.position.set(
    Math.cos(ghostAngle) * ORBIT_TARGET.radius,
    0,
    Math.sin(ghostAngle) * ORBIT_TARGET.radius,
  );
  runtime.probe.position.set(
    Math.cos(runtime.playerAngle) * values.radius,
    0,
    Math.sin(runtime.playerAngle) * values.radius,
  );
  updateTrail(runtime, values, runtime.playerAngle);
  runtime.probe.rotation.y += dt * 1.8;
  runtime.probe.rotation.x += dt * 0.7;
  runtime.ghostProbe.rotation.y -= dt * 0.8;

  runtime.ghostHalo.material.opacity = 0.34 + Math.sin(runtime.time * 2.2) * 0.1;
  runtime.ghostHalo.scale.setScalar(0.95 + Math.sin(runtime.time * 2.2) * 0.08);
  runtime.probeHalo.material.opacity = 0.4 + Math.sin(runtime.time * 2.6) * 0.1;
  runtime.probeLight.intensity = 6 + Math.sin(runtime.time * 2.6) * 1.6;
}

function tickOrbitLevel(runtime, dt, time, values) {
  runtime.time += dt;
  runtime.targetAngle += dt * ORBIT_TARGET.speed;
  if (runtime.solved) {
    const delta = shortestAngle(runtime.targetAngle, runtime.playerAngle);
    runtime.playerAngle += delta * (1 - Math.exp(-dt * 7));
  } else {
    runtime.playerAngle += dt * values.speed;
  }

  const quality = runtime.quality || 0;
  runtime.playerRing.material.color.copy(AMBER).lerp(GREEN, quality);
  runtime.trailMaterial.opacity = 0.16 + quality * 0.52;
  runtime.probeHalo.material.color.copy(AMBER).lerp(GREEN, quality);

  runtime.sun.rotation.y += dt * 0.15;
  runtime.sunWire.rotation.y -= dt * 0.1;
  runtime.sunWire.rotation.x += dt * 0.04;
  runtime.corona.rotation.z += dt * 0.12;
  runtime.innerRing.rotation.z -= dt * 0.06;
  runtime.ghostRing.material.opacity = 0.24 + Math.sin(runtime.time * 1.7) * 0.08;

  updateOrbitPositions(runtime, values, dt);
}

const orbitCode = (values) => `const t = clock.getElapsedTime();
const a = t * ${values.speed.toFixed(2)};

probe.position.x = Math.cos(a) * ${values.radius.toFixed(2)};
probe.position.z = Math.sin(a) * ${values.radius.toFixed(2)};
orbit.rotation.z = THREE.MathUtils.degToRad(${values.tilt});`;

const orbitExtra = (values) => `
  <div class="extra-box">
    <div class="extra-title"><span>ORBITAL TELEMETRY</span><b>即時遙測</b></div>
    <div class="orbit-readout">
      <div class="orbit-cell"><span>軌道半徑</span><b id="orbitRadius">${values.radius.toFixed(2)}</b></div>
      <div class="orbit-cell"><span>軌道傾角</span><b id="orbitTilt">${Math.round(values.tilt)}°</b></div>
      <div class="orbit-cell"><span>角速度</span><b id="orbitSpeed">${values.speed.toFixed(2)} <em>rad/s</em></b></div>
      <div class="orbit-cell"><span>相位差</span><b id="orbitPhase">0°</b></div>
    </div>
  </div>`;

function syncOrbitUI(runtime, values) {
  const radius = document.getElementById('orbitRadius');
  const tilt = document.getElementById('orbitTilt');
  const speed = document.getElementById('orbitSpeed');
  const phase = document.getElementById('orbitPhase');
  if (radius) radius.textContent = values.radius.toFixed(2);
  if (tilt) tilt.textContent = `${Math.round(values.tilt)}°`;
  if (speed) speed.innerHTML = `${values.speed.toFixed(2)} <em>rad/s</em>`;
  if (phase) {
    const difference = Math.abs(shortestAngle(runtime.targetAngle, runtime.playerAngle));
    phase.textContent = `${Math.round((difference * 180) / Math.PI)}°`;
    phase.style.color = difference < 0.1 ? 'var(--green)' : '';
  }
}

/* ------------------------------------------------------------------ */
/* Level definitions                                                  */
/* ------------------------------------------------------------------ */

export const LEVELS = [
  {
    id: 'position',
    short: '座標',
    tag: '座標',
    file: 'level-01.js',
    title: '星核歸位',
    objective: '星核偏離了泊位。調整 X、Y、Z 三個軸，讓它與青色全息座標完全重疊。',
    hint: 'Three.js 使用右手座標系：+X 向右、+Y 向上、+Z 朝向鏡頭。拖曳畫面可從不同角度檢查。',
    targetBadge: '全息泊位',
    consoleTitle: '位置控制',
    meterLabel: '泊位對準',
    meterFoot: '調整 X / Y / Z',
    hold: 0.18,
    controls: [
      { key: 'x', label: 'X 軸 · 左右', min: -4, max: 4, step: 0.1, value: -2.2, color: '#ff6b6b', decimals: 1 },
      { key: 'y', label: 'Y 軸 · 上下', min: 0.2, max: 3.2, step: 0.1, value: 0.7, color: '#63f5a6', decimals: 1 },
      { key: 'z', label: 'Z 軸 · 前後', min: -4, max: 4, step: 0.1, value: 1.8, color: '#6f9dff', decimals: 1 },
    ],
    camera: { position: [7.6, 5.8, 9.4], target: [0.2, 1.25, 0] },
    mobileCamera: { position: [6.8, 6.4, 12.6], target: [-0.1, 1.3, 0] },
    build: buildPositionLevel,
    apply: applyPositionLevel,
    check: checkPositionLevel,
    tick: tickPositionLevel,
    code: positionCode,
    extra: positionExtra,
    successValues: { x: 2.0, y: 1.6, z: -1.7 },
    successText: '星核準確落入泊位，冷卻系統重新運轉。你剛剛用三個數字，決定了一個物件在空間中的位置。',
    lesson: {
      title: 'position 決定物件在哪裡',
      body: '每個 Object3D 都有 position。它是一個 Vector3，分別儲存 x、y、z 三個座標；改動它，物件就會在場景中移動。',
      code: 'core.position.set(2.0, 1.6, -1.7);',
      points: [
        '座標原點是 (0, 0, 0)。',
        'Y 軸向上，X / Z 構成水平面。',
        'position 是相對於父物件的局部座標。',
      ],
    },
    nextHint: '下一關 · 星盤定向',
  },
  {
    id: 'rotation',
    short: '旋轉',
    tag: '旋轉',
    file: 'level-02.js',
    title: '星盤定向',
    objective: '古代星盤的指向錯了。轉動 X 與 Y 軸，讓金色指針與青色掃描影像重合。',
    hint: 'Three.js 的旋轉單位是弧度。程式碼用 THREE.MathUtils.degToRad() 把角度換算成弧度。',
    targetBadge: '掃描姿態',
    consoleTitle: '姿態控制',
    meterLabel: '姿態吻合',
    meterFoot: '調整 X / Y 旋轉',
    hold: 0.18,
    controls: [
      { key: 'x', label: 'X 軸 · 俯仰', min: 0, max: 360, step: 5, value: 0, color: '#ff6b6b', decimals: 0, unit: '°' },
      { key: 'y', label: 'Y 軸 · 偏航', min: 0, max: 360, step: 5, value: 0, color: '#63f5a6', decimals: 0, unit: '°' },
    ],
    camera: { position: [7.2, 5.2, 8.8], target: [0, 1.65, 0] },
    build: buildRotationLevel,
    apply: applyRotationLevel,
    check: checkRotationLevel,
    tick: tickRotationLevel,
    code: rotationCode,
    extra: rotationExtra,
    syncUI: syncRotationUI,
    successValues: { x: 35, y: 70 },
    successText: '星盤的指針與掃描姿態完全重合，導航陣列重新上線。你剛剛用三個旋轉分量描述了物件的朝向。',
    lesson: {
      title: 'rotation 改變物件朝向',
      body: 'rotation 是 Euler 角，依序儲存 x、y、z 三個軸的旋轉量，單位是弧度。三個值一起決定物件在空間中的姿態。',
      code: "compass.rotation.x = THREE.MathUtils.degToRad(35);\ncompass.rotation.y = THREE.MathUtils.degToRad(70);",
      points: [
        '360° = 2π 弧度。',
        'Euler 旋轉有順序，Three.js 預設是 XYZ。',
        '複雜旋轉通常使用 quaternion（四元數）避免萬向鎖。',
      ],
    },
    nextHint: '下一關 · 水晶校準',
  },
  {
    id: 'scale',
    short: '縮放',
    tag: '縮放',
    file: 'level-03.js',
    title: '水晶校準',
    objective: '能量水晶的尺寸不對。調整三個軸的縮放倍率，讓它填滿青色掃描輪廓。',
    hint: 'scale 是「倍率」不是「尺寸」。原始幾何有多大，乘上 scale 才是最後大小。',
    targetBadge: '掃描輪廓',
    consoleTitle: '比例控制',
    meterLabel: '輪廓吻合',
    meterFoot: '調整 X / Y / Z 比例',
    hold: 0.18,
    controls: [
      { key: 'x', label: 'X 軸 · 寬度', min: 0.4, max: 2.2, step: 0.05, value: 0.7, color: '#ff6b6b', decimals: 2 },
      { key: 'y', label: 'Y 軸 · 高度', min: 0.4, max: 2.2, step: 0.05, value: 0.7, color: '#63f5a6', decimals: 2 },
      { key: 'z', label: 'Z 軸 · 深度', min: 0.4, max: 2.2, step: 0.05, value: 0.7, color: '#6f9dff', decimals: 2 },
    ],
    camera: { position: [7.0, 5.0, 8.8], target: [0, 1.7, 0] },
    build: buildScaleLevel,
    apply: applyScaleLevel,
    check: checkScaleLevel,
    tick: tickScaleLevel,
    code: scaleCode,
    extra: scaleExtra,
    syncUI: syncScaleUI,
    successValues: { x: 1.5, y: 2.0, z: 1.0 },
    successText: '水晶的輪廓與掃描完全吻合，能量開始穩定輸出。你剛剛證明了 scale 是相對倍率，而不是絕對尺寸。',
    lesson: {
      title: 'scale 是相對倍率',
      body: 'scale 也是一個 Vector3。將它設為 (2, 1, 1)，物件會在 X 方向變成兩倍長；原始幾何本身不會被修改。',
      code: 'crystal.scale.set(1.5, 2.0, 1.0);',
      points: [
        '1 代表原始大小。',
        '非等比縮放可以塑造完全不同的輪廓。',
        '縮放會影響子物件，也會影響光照法線。',
      ],
    },
    nextHint: '下一關 · 三光調和',
  },
  {
    id: 'light',
    short: '燈光',
    tag: '燈光',
    file: 'level-04.js',
    title: '三光調和',
    objective: '展品失去顏色。調整紅、綠、藍三盞燈的強度，重現掃描到的「極光洋紅」。',
    hint: '色光會相加：紅光 + 藍光會偏洋紅，綠色只是點綴。先抓比例，再微調亮度。',
    targetBadge: '目標色 · 極光洋紅',
    consoleTitle: '光源控制',
    meterLabel: '色彩吻合',
    meterFoot: '調整三盞燈的 intensity',
    hold: 0.2,
    controls: [
      { key: 'r', label: '紅光 · Red', min: 0, max: 2, step: 0.05, value: LIGHT_START.r, color: '#ff5d5d', decimals: 2 },
      { key: 'g', label: '綠光 · Green', min: 0, max: 2, step: 0.05, value: LIGHT_START.g, color: '#54f59a', decimals: 2 },
      { key: 'b', label: '藍光 · Blue', min: 0, max: 2, step: 0.05, value: LIGHT_START.b, color: '#5b8cff', decimals: 2 },
    ],
    camera: { position: [6.6, 4.9, 8.4], target: [0, 1.35, 0] },
    build: buildLightLevel,
    apply: applyLightLevel,
    check: checkLightLevel,
    tick: tickLightLevel,
    code: lightCode,
    extra: lightExtra,
    syncUI: syncLightUI,
    successValues: { ...LIGHT_TARGET },
    successText: '三盞燈的貢獻疊加成目標色，展品重新煥發光彩。你剛剛用 intensity 調配了光的比例。',
    lesson: {
      title: '光線讓材質被看見',
      body: 'Three.js 的燈光有顏色與 intensity。多盞燈照在同一個表面上時，貢獻會相加；調整強度就能改變整體色溫與明暗。',
      code: 'redLight.intensity = 1.75;\ngreenLight.intensity = 0.60;\nblueLight.intensity = 1.15;',
      points: [
        'DirectionalLight 模擬遠處的平行光。',
        '顏色與強度共同決定表面色彩。',
        '沒有光，StandardMaterial 就幾乎看不見。',
      ],
    },
    nextHint: '下一關 · 軌道同步',
  },
  {
    id: 'orbit',
    short: '動畫',
    tag: '動畫',
    file: 'level-05.js',
    title: '軌道同步',
    objective: '探測器偏離了軌道。調整半徑、傾角與角速度，讓它與幻影衛星沿著同一條軌道運行。',
    hint: '動畫不是「讓物件動一下」，而是每一幀根據時間重新計算位置。注視兩個光點，讓它們不再分開。',
    targetBadge: '幻影軌道',
    consoleTitle: '軌道控制',
    meterLabel: '軌道同步',
    meterFoot: '調整半徑 / 傾角 / 角速度',
    hold: 1.0,
    controls: [
      { key: 'radius', label: '軌道半徑', min: 1.2, max: 3.8, step: 0.05, value: 1.9, color: '#5ff3ff', decimals: 2 },
      { key: 'tilt', label: '軌道傾角', min: 0, max: 45, step: 1, value: 0, color: '#b58cff', decimals: 0, unit: '°' },
      { key: 'speed', label: '角速度', min: 0.2, max: 1.4, step: 0.01, value: 1.2, color: '#ffb45c', decimals: 2, unit: 'rad/s' },
    ],
    camera: { position: [8.8, 7.2, 10.8], target: [0, 1.6, 0] },
    build: buildOrbitLevel,
    apply: applyOrbitLevel,
    check: checkOrbitLevel,
    tick: tickOrbitLevel,
    code: orbitCode,
    extra: orbitExtra,
    syncUI: syncOrbitUI,
    onSuccess(runtime) {
      runtime.solved = true;
    },
    successValues: { ...ORBIT_TARGET },
    successText: '探測器鎖定幻影軌道，兩個光點終於重合。你剛剛用時間、cos 與 sin，讓一個物件持續運動。',
    lesson: {
      title: '用時間驅動每一幀',
      body: 'requestAnimationFrame 每秒呼叫畫面更新。用經過的時間計算角度，再把 cos / sin 乘上軌道半徑，就能得到穩定、不受幀率影響的公轉。',
      code: 'const t = clock.getElapsedTime();\nconst a = t * 0.55;\nprobe.position.x = Math.cos(a) * 2.9;\nprobe.position.z = Math.sin(a) * 2.9;',
      points: [
        'getDelta() 適合位移，getElapsedTime() 適合週期運動。',
        'cos / sin 讓物件沿圓形軌道移動。',
        '用群組旋轉可以傾斜整個軌道平面。',
      ],
    },
    nextHint: '見證天文台重啟',
  },
];

export { ORBIT_TARGET, LIGHT_TARGET };
