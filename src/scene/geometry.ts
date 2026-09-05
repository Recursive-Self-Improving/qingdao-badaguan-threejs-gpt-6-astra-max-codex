import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 7);

export function box(parent: THREE.Object3D, material: THREE.Material, position: number[], scale: number[], ry = 0) {
  const mesh = new THREE.Mesh(boxGeometry, material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.scale.set(scale[0], scale[1], scale[2]);
  mesh.rotation.y = ry;
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function cylinder(parent: THREE.Object3D, material: THREE.Material, position: number[], radius: number, height: number, segments = 24, topRadius = radius) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(topRadius, radius, height, segments), material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function beam(parent: THREE.Object3D, material: THREE.Material, a: THREE.Vector3, b: THREE.Vector3, radius: number) {
  const slender = radius < .08;
  const mesh = new THREE.Mesh(slender ? boxGeometry : cylinderGeometry, material);
  mesh.position.copy(a).add(b).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  const width = slender ? radius * 1.7 : radius;
  mesh.scale.set(width, a.distanceTo(b), width);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

export function roof(parent: THREE.Object3D, material: THREE.Material, x: number, y: number, z: number, width: number, depth: number, height: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(0, height);
  shape.lineTo(width / 2, 0);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  const uv = geometry.getAttribute('uv');
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 7, uv.getY(i) / 7);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z - depth / 2);
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function archShape(width: number, height: number) {
  const r = width / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-r, 0);
  shape.lineTo(r, 0);
  shape.lineTo(r, height - r);
  shape.absarc(0, height - r, r, 0, Math.PI, false);
  shape.lineTo(-r, 0);
  return shape;
}

export function archWindow(parent: THREE.Object3D, materials: {glass: THREE.Material; frame: THREE.Material; trim: THREE.Material}, x: number, y: number, z: number, width: number, height: number, rotation = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotation;
  const border = new THREE.Mesh(new THREE.ExtrudeGeometry(archShape(width + .26, height + .16), { depth: .13, bevelEnabled: false, curveSegments: 12 }), materials.trim);
  group.add(border);
  const glass = new THREE.Mesh(new THREE.ShapeGeometry(archShape(width, height), 14), materials.glass);
  glass.position.set(0, .07, .145);
  group.add(glass);
  box(group, materials.frame, [-width / 2, (height - width / 2) / 2 + .07, .17], [.065, height - width / 2, .07]);
  box(group, materials.frame, [width / 2, (height - width / 2) / 2 + .07, .17], [.065, height - width / 2, .07]);
  box(group, materials.frame, [0, height / 2, .17], [.055, height - .08, .07]);
  box(group, materials.frame, [0, height * .42, .17], [width, .055, .07]);
  box(group, materials.frame, [0, height - width / 2 + .06, .17], [width, .055, .07]);
  box(group, materials.trim, [0, -.03, .15], [width + .38, .14, .40]);
  const curve = new THREE.EllipseCurve(0, height - width / 2 + .07, width / 2, width / 2, 0, Math.PI);
  const frame = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curve.getPoints(16).map(p => new THREE.Vector3(p.x, p.y, .17))), 16, .037, 5, false), materials.frame);
  group.add(frame);
  parent.add(group);
  return group;
}

/** Merge static meshes by material, keeping buildings detailed without thousands of draw calls. */
export function mergeStatic(root: THREE.Group) {
  root.updateMatrixWorld(true);
  const batches = new Map<THREE.Material, { geometries: THREE.BufferGeometry[]; shadow: boolean }>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh) || Array.isArray(object.material) || object instanceof THREE.InstancedMesh) return;
    const material = object.material as THREE.Material;
    let batch = batches.get(material);
    if (!batch) { batch = { geometries: [], shadow: false }; batches.set(material, batch); }
    const geo = object.geometry.clone().applyMatrix4(object.matrixWorld);
    geo.deleteAttribute('tangent');
    const clean = geo.index ? geo.toNonIndexed() : geo;
    batch.geometries.push(clean);
    batch.shadow ||= object.castShadow;
  });
  const merged = new THREE.Group();
  for (const [material, batch] of batches) {
    const geometry = mergeGeometries(batch.geometries, false);
    for (const geo of batch.geometries) geo.dispose();
    if (!geometry) continue;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = batch.shadow;
    mesh.receiveShadow = true;
    merged.add(mesh);
  }
  return merged;
}
