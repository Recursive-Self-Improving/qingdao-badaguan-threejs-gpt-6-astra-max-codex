import * as THREE from 'three';
import { archWindow, beam, box, cylinder, mergeStatic, roof } from './geometry';
import { groundHeight, roadCurve } from './landscape';
import { random, type Materials } from './materials';

export interface Collider { x: number; z: number; radius: number }

function rail(parent: THREE.Object3D, m: Materials, a: THREE.Vector3, b: THREE.Vector3, height = 1.1) {
  const length = a.distanceTo(b);
  beam(parent, m.iron, a.clone().add(new THREE.Vector3(0, height, 0)), b.clone().add(new THREE.Vector3(0, height, 0)), .045);
  beam(parent, m.iron, a.clone().add(new THREE.Vector3(0, .3, 0)), b.clone().add(new THREE.Vector3(0, .3, 0)), .025);
  for (let i = 0; i <= Math.ceil(length / .37); i++) {
    const p = a.clone().lerp(b, i / Math.ceil(length / .37));
    beam(parent, m.iron, p, p.clone().add(new THREE.Vector3(0, height + .08, 0)), .025);
  }
}

function window(parent: THREE.Object3D, m: Materials, x: number, y: number, z: number, rotation = 0, shutters = false, w = 1.12, h = 1.85) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotation;
  box(group, m.trim, [0, 0, 0], [w + .25, h + .25, .18]);
  box(group, m.glass, [0, 0, .1], [w, h, .045]);
  box(group, m.frame, [0, 0, .145], [.055, h, .04]);
  box(group, m.frame, [0, .15, .145], [w, .065, .04]);
  box(group, m.frame, [0, -h * .31, .145], [w, .04, .04]);
  box(group, m.frame, [0, -h / 2 - .1, .11], [w + .43, .15, .48]);
  if (shutters) {
    for (const s of [-1, 1]) {
      box(group, m.wood, [s * (w / 2 + .34), 0, .09], [.48, h + .12, .10]);
      for (let j = 0; j < 8; j++) box(group, m.slate, [s * (w / 2 + .34), -h / 2 + .15 + j * .21, .15], [.39, .065, .07]);
    }
  }
  parent.add(group);
}

function huashi(m: Materials) {
  const group = new THREE.Group();
  group.position.set(7, groundHeight(7, 2), 2);
  group.rotation.y = -.15;
  // The cylindrical, crenellated tower and polygonal bay are the villa's defining forms.
  cylinder(group, m.stone, [-4, 7.3, 0], 3.75, 14.6, 48);
  cylinder(group, m.stone, [3.4, 5.7, -.9], 4.65, 11.4, 8);
  box(group, m.stone, [.1, 4.8, -2.6], [8, 9.6, 7.3]);
  box(group, m.stone, [6.1, 3.7, -4.4], [5, 7.4, 7]);
  box(group, m.trim, [6.1, 7.4, -4.4], [5.45, .32, 7.45]);
  for (const h of [.4, 4.65, 8.7, 12.3, 14.45]) {
    cylinder(group, m.trim, [-4, h, 0], h === 14.45 ? 4.05 : 3.91, .23, 48);
  }
  cylinder(group, m.slate, [-4, 14.65, 0], 3.75, .10, 48);
  cylinder(group, m.stone, [-4, 15.05, 0], 3.96, .65, 48);
  cylinder(group, m.slate, [-4, 15.4, 0], 3.54, .06, 48);
  for (let i = 0; i < 15; i++) {
    const theta = i / 15 * Math.PI * 2;
    box(group, m.trim, [-4 + Math.sin(theta) * 3.78, 15.61, Math.cos(theta) * 3.78], [1.04, .58, .43], theta);
  }
  for (let floor = 0; floor < 3; floor++) {
    for (let j = 0; j < 9; j++) {
      const a = j / 9 * Math.PI * 2 + .10;
      archWindow(group, m, -4 + Math.sin(a) * 3.77, 1.05 + floor * 4.02, Math.cos(a) * 3.77, 1.15, 2.38, a);
    }
  }
  for (let j = 0; j < 10; j++) {
    const a = j / 10 * Math.PI * 2 + .10;
    archWindow(group, { ...m, frame: m.trim, glass: m.wood }, -4 + Math.sin(a) * 3.79, 12.75, Math.cos(a) * 3.79, .91, 1.1, a);
  }
  for (const h of [.3, 4, 7.65, 11.25]) cylinder(group, m.trim, [3.4, h, -.9], 4.78, .22, 8);
  cylinder(group, m.trim, [3.4, 11.62, -.9], 4.7, .5, 8);
  cylinder(group, m.slate, [3.4, 11.89, -.9], 4.35, .06, 8);
  for (let floor = 0; floor < 3; floor++) {
    for (let j = 0; j < 8; j++) {
      const a = j / 8 * Math.PI * 2 + Math.PI / 8;
      archWindow(group, m, 3.4 + Math.sin(a) * 4.32, .8 + floor * 3.7, -.9 + Math.cos(a) * 4.32, 1.25, 2.42, a);
    }
  }
  // The small metal spire sits behind the stone parapet.
  cylinder(group, m.stone, [.35, 12.6, -4.5], 1.7, 5.0, 8);
  cylinder(group, m.slate, [.35, 16.7, -4.5], 2.08, 4, 8, .025);
  cylinder(group, m.iron, [.35, 19.05, -4.5], .055, 1.1, 8);
  archWindow(group, m, .35, 12.6, -2.9, .75, 1.55);
  box(group, m.stone, [-.3, 2.0, 3.1], [3.1, 4, 3]);
  archWindow(group, { ...m, glass: m.wood }, -.3, .25, 4.65, 1.9, 3.6);
  // Entrance portico, stone columns and the broad garden steps.
  for (const x of [-1.65, 1.55]) {
    cylinder(group, m.trim, [x, 2.0, 6.65], .24, 3.65, 20, .2);
    cylinder(group, m.trim, [x, .48, 6.65], .36, .45, 16);
    cylinder(group, m.trim, [x, 3.77, 6.65], .36, .29, 16);
    box(group, m.trim, [x, 3.99, 6.65], [.76, .23, .76]);
  }
  box(group, m.trim, [-.05, 4.24, 5.55], [4.85, .40, 3.6]);
  box(group, m.trim, [-.05, 4.65, 6.9], [4.4, .64, .20]);
  for (let i = 0; i < 8; i++) box(group, m.iron, [-1.74 + i * .49, 4.68, 7.03], [.12, .38, .06]);
  for (let i = 0; i < 10; i++) {
    box(group, m.trim, [-.05, -.75 + i * .115, 11.7 - i * .43], [5.0, .16, .64]);
  }
  for (const x of [-3.1, 3.1]) {
    box(group, m.stone, [x, -.13, 11.6], [.9, 1.25, .9]);
    cylinder(group, m.trim, [x, .63, 11.6], .54, .19, 20);
    cylinder(group, m.trim, [x, 1.06, 11.6], .30, .72, 20, .64);
    cylinder(group, m.trim, [x, 1.47, 11.6], .7, .18, 24);
  }
  for (let i = 0; i < 3; i++) {
    window(group, m, 8.67, 1.6 + i * 2.4, -3.3, Math.PI / 2, false);
    window(group, m, 6.1, 1.6 + i * 2.4, -7.94, Math.PI, false);
  }
  return group;
}

function villa(m: Materials, x: number, z: number, kind: number, angle: number) {
  const group = new THREE.Group();
  group.position.set(x, groundHeight(x, z), z);
  group.rotation.y = angle;
  const w = kind === 1 ? 10 : 12, d = 9, h = 6.5;
  const wall = kind === 1 ? m.mint : kind === 2 ? m.cream : m.plaster;
  box(group, m.stone, [0, .4, 0], [w + .5, .8, d + .5]);
  box(group, wall, [0, h / 2 + .7, 0], [w, h, d]);
  box(group, m.frame, [0, h + .7, 0], [w + .5, .25, d + .45]);
  roof(group, m.roof, 0, h + .82, 0, w + 1.05, d + 1, 3.8);
  for (let floor = 0; floor < 2; floor++) {
    for (let i = 0; i < 3; i++) {
      window(group, m, -w / 2 + 2 + i * (w - 4) / 2, 2.1 + floor * 3.05, d / 2 + .015, 0, kind !== 1);
      window(group, m, -w / 2 + 2 + i * (w - 4) / 2, 2.1 + floor * 3.05, -d / 2 - .015, Math.PI);
    }
    for (let j = 0; j < 2; j++) {
      window(group, m, w / 2 + .01, 2.1 + floor * 3.05, -2 + j * 4, Math.PI / 2);
      window(group, m, -w / 2 - .01, 2.1 + floor * 3.05, -2 + j * 4, -Math.PI / 2);
    }
  }
  window(group, m, 0, h + 2, d / 2 + .03, 0, false, 1.05, 1.25);
  box(group, m.stone, [w * .29, h + 3.6, -2.5], [1, 2.8, 1]);
  box(group, m.trim, [w * .29, h + 5, -2.5], [1.2, .23, 1.18]);
  const doorX = kind === 1 ? 1 : 0;
  archWindow(group, { ...m, glass: m.wood }, doorX, .68, d / 2 + .10, 1.34, 2.55);
  box(group, m.trim, [doorX, .72, 5.4], [4, .2, 2]);
  for (let i = 0; i < 4; i++) box(group, m.trim, [doorX, .1 + i * .16, 6.9 - i * .38], [3.3, .17, .55]);
  if (kind === 1) {
    box(group, wall, [-4.0, 5.0, 2.5], [3.7, 10, 3.7]);
    box(group, m.frame, [-4.0, 10, 2.5], [4.0, .3, 4.0]);
    const spire = cylinder(group, m.roof, [-4.0, 13.3, 2.5], 3.1, 6.4, 4, 0);
    spire.rotation.y = Math.PI / 4;
    cylinder(group, m.iron, [-4, 16.83, 2.5], .055, 1.0, 8);
    archWindow(group, m, -4, 7.6, 4.38, .85, 1.6);
    window(group, m, -4, 5.3, 4.39, 0, false, 1, 1.8);
    box(group, wall, [4, 2.05, 5.1], [3.8, 4.1, 2.3]);
    roof(group, m.roof, 4, 4.15, 5.1, 4.3, 2.8, 2.1);
  } else {
    box(group, m.trim, [0, 3.9, 5.45], [5.0, .26, 2.2]);
    for (const cx of [-2.2, 2.2]) cylinder(group, m.frame, [cx, 2.2, 6.1], .13, 3.3, 12);
    rail(group, m, new THREE.Vector3(-2.4, 4.05, 6.45), new THREE.Vector3(2.4, 4.05, 6.45), .9);
  }
  for (const sign of [-1, 1]) {
    box(group, m.stone, [sign * (w / 2 + 3), .48, 2], [.50, .95, 20]);
    rail(group, m, new THREE.Vector3(sign * (w / 2 + 3), 1, -8), new THREE.Vector3(sign * (w / 2 + 3), 1, 12), .75);
    box(group, m.stone, [sign * (w / 4 + 2.4), .48, 12], [w / 2 + 1.3, .95, .5]);
  }
  return group;
}

function bench(m: Materials, x: number, z: number, angle: number) {
  const group = new THREE.Group();
  group.position.set(x, groundHeight(x, z) + .09, z);
  group.rotation.y = angle;
  for (let i = 0; i < 4; i++) box(group, m.wood, [0, .62, -.24 + i * .16], [2.1, .095, .12]);
  for (let i = 0; i < 3; i++) box(group, m.wood, [0, .92 + i * .17, -.36], [2.1, .12, .09]);
  for (const side of [-.76, .76]) {
    box(group, m.iron, [side, .32, -.23], [.1, .65, .1]);
    box(group, m.iron, [side, .32, .23], [.1, .65, .1]);
    box(group, m.iron, [side, .93, -.39], [.08, .93, .08]);
  }
  return group;
}

export function createArchitecture(m: Materials) {
  const group = new THREE.Group();
  const buildings = new THREE.Group();
  buildings.add(mergeStatic(huashi(m)));
  const plots = [
    [-61, 12, 0, .4], [-58, -86, 1, .08], [-93, -23, 2, .32],
    [-73, 83, 2, -.2], [-15, -104, 0, -.24], [-100, -118, 0, .25],
    [-97, -188, 2, -.2], [-56, -165, 0, .2], [-140, 24, 0, .32],
    [-135, -73, 2, .1], [-130, 115, 2, -.15], [-23, -208, 0, .14],
  ];
  const colliders: Collider[] = [{ x: 5, z: 0, radius: 11 }];
  for (const [x, z, kind, angle] of plots) {
    buildings.add(mergeStatic(villa(m, x, z, kind, angle)));
    colliders.push({ x, z, radius: 9 });
  }
  const castleY = groundHeight(7, 2);
  cylinder(group, m.stone, [7, castleY - .48, 2], 15.4, .9, 48);
  cylinder(group, m.paving, [7, castleY + .018, 2], 15.4, .13, 48);
  // A coastal railing and stone posts follow the garden's edge.
  for (let i = 0; i < 16; i++) {
    const a = -.9 + i / 16 * Math.PI * 1.1, b = -.9 + (i + 1) / 16 * Math.PI * 1.1;
    const p = new THREE.Vector3(7 + Math.cos(a) * 15.0, castleY + .2, 2 + Math.sin(a) * 15.0);
    const q = new THREE.Vector3(7 + Math.cos(b) * 15.0, castleY + .2, 2 + Math.sin(b) * 15.0);
    rail(group, m, p, q, 1.05);
    box(group, m.stone, [p.x, p.y + .45, p.z], [.32, .95, .32]);
  }
  for (const [x, z, a] of [[-15, 44, 1.4], [-38, 9, -1.5], [-22, -39, 1.55], [17, 45, -1.4], [20, 92, -1.4], [-22, 99, 1.55]]) {
    group.add(bench(m, x, z, a));
  }
  // Quiet, slender street lamps; the fixtures glow as the afternoon fades.
  const lampGlow = new THREE.MeshStandardMaterial({ color: '#fff0ca', emissive: '#ffd89a', emissiveIntensity: .8, roughness: .3 });
  for (let i = 0; i < 12; i++) {
    const t = .12 + i * .066;
    const roadPoint = roadCurve.getPointAt(t), direction = roadCurve.getTangentAt(t);
    const x = roadPoint.x - direction.z * 6.1;
    const z = roadPoint.z + direction.x * 6.1;
    const y = groundHeight(x, z);
    cylinder(group, m.iron, [x, y + 2.1, z], .066, 4.2, 10);
    cylinder(group, m.iron, [x, y + .35, z], .14, .65, 10);
    box(group, m.iron, [x, y + 4.15, z], [.54, .12, .54]);
    box(group, lampGlow, [x, y + 4.43, z], [.30, .48, .30]);
    const cap = cylinder(group, m.iron, [x, y + 4.78, z], .44, .24, 4, 0);
    cap.rotation.y = Math.PI / 4;
    for (const dx of [-.19, .19]) for (const dz of [-.19, .19]) box(group, m.iron, [x + dx, y + 4.43, z + dz], [.035, .55, .035]);
  }
  const staticGroup = mergeStatic(group);
  staticGroup.add(buildings);
  // Red climbing ivy appears on the polygonal wing, as on the actual villa.
  const rand = random(726);
  const ivy = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), m.leaves, 190);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 190; i++) {
    const theta = .45 + rand() * 1.35;
    const y = 2 + rand() * 10;
    const point = new THREE.Vector3(3.4 + Math.sin(theta) * 4.72, y, -.9 + Math.cos(theta) * 4.72);
    point.applyAxisAngle(new THREE.Vector3(0, 1, 0), -.15).add(new THREE.Vector3(7, castleY, 2));
    dummy.position.copy(point);
    dummy.rotation.set(0, theta - .15, rand() * 3);
    dummy.scale.setScalar(.35 + rand() * .7);
    dummy.updateMatrix();
    ivy.setMatrixAt(i, dummy.matrix);
    ivy.setColorAt(i, new THREE.Color(['#853d28', '#a66332', '#795a32', '#86502d'][Math.floor(rand() * 4)]));
  }
  staticGroup.add(ivy);
  return { group: staticGroup, colliders, lampGlow };
}
