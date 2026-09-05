import * as THREE from 'three';
import { beam, box, mergeStatic } from './geometry';
import { random, type Materials } from './materials';

export const roadCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-17, 0, 155), new THREE.Vector3(-15, 0, 105),
  new THREE.Vector3(-23, 0, 65), new THREE.Vector3(-29, 0, 20),
  new THREE.Vector3(-37, 0, -38), new THREE.Vector3(-43, 0, -94),
  new THREE.Vector3(-56, 0, -165), new THREE.Vector3(-67, 0, -245),
]);

export function coast(z: number) {
  return 23 + Math.sin(z * .012) * 15 + Math.exp(-z * z / 520) * 15 - Math.exp(-((z - 65) ** 2) / 1800) * 9;
}

export function groundHeight(x: number, z: number) {
  const distance = coast(z) - x;
  const hillside = THREE.MathUtils.smoothstep(-z, 140, 350) * (13 * Math.exp(-((x + 85) ** 2) / 14500) + 4 * Math.sin(x * .017) ** 2);
  const inland = 3.6 + Math.max(-x - 30, 0) * .024 + Math.sin(z * .022) * .25 + hillside;
  if (distance < 0) return -.55;
  return THREE.MathUtils.lerp(-.48, inland, THREE.MathUtils.smoothstep(distance, 0, 16));
}

export function createTerrain(materials: Materials) {
  const nx = 76, nz = 140;
  const positions: number[] = [], colors: number[] = [], uvs: number[] = [], indices: number[] = [];
  const sand = new THREE.Color('#c9bc95');
  const grass = new THREE.Color('#7d8860');
  const rand = random(47);
  for (let j = 0; j <= nz; j++) {
    const z = -360 + (j / nz) * 740;
    for (let i = 0; i <= nx; i++) {
      const x = THREE.MathUtils.lerp(-330, coast(z) + 2, i / nx);
      const d = coast(z) - x;
      let y = groundHeight(x, z);
      if (d > 22) y += Math.sin(x * .18) * Math.sin(z * .14) * .13;
      positions.push(x, y, z);
      const color = sand.clone().lerp(grass, THREE.MathUtils.smoothstep(d, 9, 20));
      color.multiplyScalar(.91 + rand() * .15);
      colors.push(color.r, color.g, color.b);
      uvs.push(i / nx, j / nz);
      if (i < nx && j < nz) {
        const a = j * (nx + 1) + i;
        indices.push(a, a + nx + 1, a + 1, a + 1, a + nx + 1, a + nx + 2);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, materials.ground);
  mesh.receiveShadow = true;
  return mesh;
}

function ribbon(curve: THREE.CatmullRomCurve3, width: number, material: THREE.Material, lift = .03) {
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  const length = curve.getLength();
  for (let i = 0; i <= 180; i++) {
    const p = curve.getPointAt(i / 180), t = curve.getTangentAt(i / 180);
    const side = new THREE.Vector3(-t.z, 0, t.x).normalize();
    for (const sign of [-1, 1]) {
      const edge = p.clone().addScaledVector(side, width * sign / 2);
      positions.push(edge.x, groundHeight(edge.x, edge.z) + lift, edge.z);
      uvs.push(sign > 0 ? width / 4 : 0, i / 180 * length / 4);
    }
    if (i < 180) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  mesh.receiveShadow = true;
  return mesh;
}

export function createRoads(materials: Materials) {
  const group = new THREE.Group();
  group.add(ribbon(roadCurve, 11.5, materials.paving));
  group.add(ribbon(roadCurve, 7.6, materials.road, .065));
  const crossRoad = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-180, 0, -52), new THREE.Vector3(-95, 0, -56),
    new THREE.Vector3(-43, 0, -61), new THREE.Vector3(-9, 0, -62), new THREE.Vector3(3, 0, -72),
  ]);
  group.add(ribbon(crossRoad, 8.2, materials.paving, .08));
  group.add(ribbon(crossRoad, 5.8, materials.road, .10));
  const castlePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-26, 0, 28), new THREE.Vector3(-14, 0, 24),
    new THREE.Vector3(-2, 0, 21), new THREE.Vector3(7, 0, 14),
  ]);
  group.add(ribbon(castlePath, 4.2, materials.paving, .08));
  const promenade = new THREE.CatmullRomCurve3(Array.from({ length: 25 }, (_, i) => {
    const z = -170 + i * 15;
    return new THREE.Vector3(coast(z) - 12.5, 0, z);
  }));
  group.add(ribbon(promenade, 2.6, materials.paving, .08));
  const curb = new THREE.Group();
  for (let i = 0; i < 185; i++) {
    const p = roadCurve.getPointAt(i / 185), t = roadCurve.getTangentAt(i / 185);
    const side = new THREE.Vector3(-t.z, 0, t.x).normalize();
    for (const s of [-1, 1]) {
      const a = p.clone().addScaledVector(side, s * 4.0);
      box(curb, materials.trim, [a.x, groundHeight(a.x, a.z) + .15, a.z], [.23, .21, 1.9], Math.atan2(t.x, t.z));
    }
  }
  group.add(mergeStatic(curb));
  return group;
}

export function createForest(materials: Materials, compact = false) {
  const rand = random(393);
  const trees: { x: number; z: number; size: number; pine: boolean; gold: boolean }[] = [];
  for (let i = 0; i < 48; i++) {
    const t = .035 + i / 48 * .88;
    const p = roadCurve.getPointAt(t), tangent = roadCurve.getTangentAt(t);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    for (const sign of [-1, 1]) {
      const position = p.clone().addScaledVector(normal, sign * (7.6 + rand() * 1.9));
      if (position.x > -20 && position.z > 14 && position.z < 42) continue;
      trees.push({ x: position.x, z: position.z + rand() * 2, size: .85 + rand() * .45, pine: false, gold: false });
    }
  }
  // Each street keeps its characteristic planting: plane trees near the sea, ginkgo inland.
  for (let x = -140; x < -40; x += 9) {
    trees.push({ x, z: -48, size: .9 + rand() * .28, pine: false, gold: true });
    trees.push({ x, z: -65, size: .95 + rand() * .25, pine: false, gold: true });
  }
  for (let i = 0; i < 170; i++) {
    const x = -180 + rand() * 195, z = -290 + rand() * 440;
    if (x > coast(z) - 18) continue;
    if (Math.abs(x + 32 + z * -.08) < 15) continue;
    if (Math.abs(z + 56) < 12) continue;
    const plots = [[7, 2, 20], [-61, 12, 18], [-58, -86, 17], [-93, -23, 17], [-73, 83, 18], [-15, -104, 15], [-100, -118, 18], [-56, -165, 16]];
    if (plots.some(([bx, bz, radius]) => Math.hypot(x - bx, z - bz) < radius)) continue;
    trees.push({ x, z, size: .68 + rand() * .72, pine: rand() > .61, gold: false });
  }
  // Evergreen silhouettes frame the castle without hiding its round tower.
  trees.push({ x: 19, z: -15, size: 1.05, pine: true, gold: false });
  trees.push({ x: -8, z: -12, size: 1.17, pine: true, gold: false });
  trees.push({ x: -1, z: -42, size: 1.15, pine: true, gold: false });
  trees.push({ x: 10, z: 40, size: 1.3, pine: true, gold: false });
  for (let i = 0; i < 28; i++) trees.push({ x: -150 + rand() * 150, z: -342 + rand() * 65, size: .8 + rand() * .45, pine: rand() > .55, gold: false });
  // Leave the entrance to the princess villa open, with trees framing its approach.
  const approach = new THREE.Vector2(-20, -24);
  for (let i = trees.length - 1; i >= 0; i--) {
    const delta = new THREE.Vector2(trees[i].x + 38, trees[i].z + 62);
    const t = THREE.MathUtils.clamp(delta.dot(approach) / approach.lengthSq(), 0, 1);
    if (delta.sub(approach.clone().multiplyScalar(t)).length() < 6.7) trees.splice(i, 1);
  }
  const group = new THREE.Group();
  const branchChunks = new Map<string, THREE.Group>();
  const perTree = 44;
  const foliageGeometry = new THREE.PlaneGeometry(1, 1);
  const foliage = new THREE.InstancedMesh(foliageGeometry, materials.leaves, trees.filter(t => !t.pine && !t.gold).length * perTree);
  const ginkgo = new THREE.InstancedMesh(foliageGeometry, materials.ginkgo, trees.filter(t => t.gold).length * perTree);
  const needles = new THREE.InstancedMesh(foliageGeometry, materials.needles, trees.filter(t => t.pine).length * perTree);
  for (const mesh of [foliage, ginkgo, needles]) { mesh.castShadow = true; mesh.receiveShadow = false; }
  const dummy = new THREE.Object3D();
  const palette = ['#b39740', '#c5ad51', '#a17a35', '#bea75f', '#89924b', '#aa7937', '#c8b264'];
  const foliageIndices = new Map([[foliage, 0], [ginkgo, 0], [needles, 0]]);
  const shadows = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), materials.shadow, trees.length);
  let shadowIndex = 0;
  for (const tree of trees) {
    const chunkKey = `${Math.floor(tree.x / 65)},${Math.floor(tree.z / 75)}`;
    if (!branchChunks.has(chunkKey)) branchChunks.set(chunkKey, new THREE.Group());
    const branches = branchChunks.get(chunkKey)!;
    const treeMaterial = tree.pine || tree.gold ? materials.pineBark : materials.bark;
    const treeFoliage = tree.pine ? needles : tree.gold ? ginkgo : foliage;
    const y = groundHeight(tree.x, tree.z), s = tree.size;
    const height = (tree.pine ? 9.8 : 8.5) * s;
    const base = new THREE.Vector3(tree.x, y, tree.z);
    const crown = new THREE.Vector3(tree.x + (rand() - .5) * .9, y + height, tree.z + (rand() - .5));
    beam(branches, treeMaterial, base, crown.clone().add(new THREE.Vector3(0, -height * .20, 0)), .23 * s);
    for (let j = 0; j < (compact ? 4 : 7); j++) {
      const angle = j * 2.39 + rand() * .8;
      const root = base.clone().add(new THREE.Vector3(0, height * (.34 + rand() * .32), 0));
      const tip = crown.clone().add(new THREE.Vector3(Math.cos(angle) * 3.4 * s, (rand() - .7) * 3.4 * s, Math.sin(angle) * 3.4 * s));
      const middle = root.clone().lerp(tip, .58).add(new THREE.Vector3(0, .4, 0));
      beam(branches, treeMaterial, root, middle, .13 * s);
      beam(branches, treeMaterial, middle, tip, .055 * s);
    }
    for (let j = 0; j < perTree; j++) {
      const azimuth = rand() * Math.PI * 2;
      const elevation = Math.acos(2 * rand() - 1);
      const radius = Math.cbrt(rand());
      const width = (tree.pine ? 4.3 : tree.gold ? 3.15 : 4.1) * s;
      const vertical = (tree.pine ? 2.6 : tree.gold ? 4.2 : 3.6) * s;
      dummy.position.set(crown.x + Math.cos(azimuth) * Math.sin(elevation) * radius * width,
        crown.y + Math.cos(elevation) * radius * vertical,
        crown.z + Math.sin(azimuth) * Math.sin(elevation) * radius * width);
      dummy.rotation.set(rand() * Math.PI, rand() * Math.PI * 2, rand() * Math.PI);
      const leafSize = (1.6 + rand() * 1.55) * s;
      dummy.scale.set(leafSize * (tree.pine ? 1.45 : 1), leafSize * (tree.pine ? .74 : 1), 1);
      dummy.updateMatrix();
      const index = foliageIndices.get(treeFoliage)!;
      treeFoliage.setMatrixAt(index, dummy.matrix);
      const color = new THREE.Color(tree.pine ? ['#405b3c', '#536642', '#66734a'][Math.floor(rand() * 3)] : tree.gold ? ['#b9a044', '#c7ac40', '#d0b452'][Math.floor(rand() * 3)] : palette[Math.floor(rand() * palette.length)]);
      color.multiplyScalar(.84 + rand() * .25);
      treeFoliage.setColorAt(index, color);
      foliageIndices.set(treeFoliage, index + 1);
    }
    dummy.rotation.set(-Math.PI / 2, 0, 0);
    dummy.position.set(tree.x, y + .035, tree.z);
    dummy.scale.set(9 * s, 9 * s, 1);
    dummy.updateMatrix();
    shadows.setMatrixAt(shadowIndex++, dummy.matrix);
  }
  for (const mesh of [foliage, ginkgo, needles]) { mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor!.needsUpdate = true; }
  group.add(foliage, ginkgo, needles, shadows, ...[...branchChunks.values()].map(mergeStatic));
  return { group, foliage, trees };
}

export function createRocks(materials: Materials) {
  const rand = random(197);
  const geometry = new THREE.IcosahedronGeometry(1, 1);
  const points = geometry.getAttribute('position');
  for (let i = 0; i < points.count; i++) {
    // Coincident vertices must share displacement so the rock stays watertight.
    const m = 1 + Math.sin(points.getX(i) * 7.4 + points.getY(i) * 11 + points.getZ(i) * 5.8) * .14;
    points.setXYZ(i, points.getX(i) * m, points.getY(i) * m, points.getZ(i) * m);
  }
  geometry.computeVertexNormals();
  const mesh = new THREE.InstancedMesh(geometry, materials.rock, 220);
  mesh.castShadow = mesh.receiveShadow = true;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 220; i++) {
    let z = -150 + rand() * 380;
    if (z > 38 && z < 145 && rand() > .10) z = rand() > .5 ? -100 + rand() * 127 : 150 + rand() * 80;
    const isCastle = Math.abs(z) < 27;
    const x = coast(z) + (rand() - .35) * (isCastle ? 17 : 7);
    const s = (isCastle ? 1.8 : .8) + rand() * (isCastle ? 2.6 : 1.4);
    dummy.position.set(x, groundHeight(x, z) - .35, z);
    dummy.scale.set(s * 1.4, s * .66, s);
    dummy.rotation.set(rand() * .6, rand() * 6, rand() * .4);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, new THREE.Color('#d4cec0').multiplyScalar(.80 + rand() * .23));
  }
  return mesh;
}

export function createGardens(materials: Materials) {
  const rand = random(946);
  const group = new THREE.Group();
  const shrubPositions = [[17, 7], [16, -8], [-5, -11], [-8, 8], [-17, 17], [-9, 36], [9, 38], [18, 49], [-47, 17], [-50, 5], [-52, -69], [-68, -72], [-16, 78], [-11, 105], [-44, 63], [-67, 94], [-89, 2], [-50, -23], [-16, -23], [-59, -51], [-53, 122], [-74, 136]];
  const foliage = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), materials.leaves, shrubPositions.length * 36);
  const dummy = new THREE.Object3D();
  let index = 0;
  for (const [x, z] of shrubPositions) {
    const size = .9 + rand() * .65;
    for (let i = 0; i < 36; i++) {
      dummy.position.set(x + (rand() - .5) * 3.4 * size, groundHeight(x, z) + .4 + rand() * 1.2 * size, z + (rand() - .5) * 2.5 * size);
      dummy.rotation.set(rand() * 3, rand() * 6, rand() * 3);
      dummy.scale.setScalar(1.05 * size);
      dummy.updateMatrix();
      foliage.setMatrixAt(index, dummy.matrix);
      foliage.setColorAt(index++, new THREE.Color(['#4b6440', '#647345', '#767d45', '#8c8950'][Math.floor(rand() * 4)]));
    }
  }
  foliage.castShadow = true;
  group.add(foliage);
  const grassPositions: number[] = [];
  for (let i = 0; i < 5; i++) {
    const a = rand() * Math.PI * 2, x = (rand() - .5) * .20, z = (rand() - .5) * .20, h = .15 + rand() * .32;
    const w = .018 + rand() * .016;
    grassPositions.push(x - Math.cos(a) * w, 0, z - Math.sin(a) * w, x + Math.cos(a) * w, 0, z + Math.sin(a) * w, x + Math.cos(a) * .15, h, z + Math.sin(a) * .15);
  }
  const grassGeometry = new THREE.BufferGeometry();
  grassGeometry.setAttribute('position', new THREE.Float32BufferAttribute(grassPositions, 3));
  grassGeometry.computeVertexNormals();
  const grassMaterial = new THREE.MeshLambertMaterial({ color: '#929767', side: THREE.DoubleSide });
  const grasses = new THREE.InstancedMesh(grassGeometry, grassMaterial, 1800);
  const roadPoints = roadCurve.getPoints(120);
  let grassIndex = 0;
  for (let attempts = 0; attempts < 7000 && grassIndex < 1800; attempts++) {
    const x = -112 + rand() * 137, z = -122 + rand() * 282;
    if (x > coast(z) - 16 || Math.hypot(x - 7, z - 2) < 17 || Math.abs(z + 58) < 6) continue;
    if (roadPoints.some(p => Math.hypot(p.x - x, p.z - z) < 6.0)) continue;
    dummy.position.set(x, groundHeight(x, z), z);
    dummy.rotation.set(0, rand() * 6.2, 0);
    dummy.scale.setScalar(.65 + rand() * .7);
    dummy.updateMatrix();
    grasses.setMatrixAt(grassIndex, dummy.matrix);
    grasses.setColorAt(grassIndex++, new THREE.Color(['#c4bd85', '#9da978', '#9e9a68'][Math.floor(rand() * 3)]));
  }
  grasses.count = grassIndex;
  grasses.receiveShadow = true;
  group.add(grasses);
  return group;
}

export function createGroundLeaves(materials: Materials) {
  const rand = random(345);
  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), materials.leaves, 650);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 650; i++) {
    const p = roadCurve.getPointAt(rand());
    const x = p.x + (rand() - .5) * 17, z = p.z + (rand() - .5) * 6;
    dummy.position.set(x, groundHeight(x, z) + .14, z);
    dummy.rotation.set(-Math.PI / 2, 0, rand() * 6.2);
    const s = .22 + rand() * .7;
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, new THREE.Color(['#ab773b', '#b39e46', '#906435'][Math.floor(rand() * 3)]));
  }
  return mesh;
}
