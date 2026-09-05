import * as THREE from 'three';
import { coast, groundHeight } from './landscape';
import { random } from './materials';

const noiseGLSL = `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0., a = .5;
    for (int i = 0; i < 3; i++) { v += a * noise(p); p = p * 2.02 + vec2(12.4, 3.7); a *= .5; }
    return v;
  }
`;

export function createSky() {
  const uniforms = {
    time: { value: 0 }, warmth: { value: .65 },
    zenith: { value: new THREE.Color('#89aeba') },
    horizon: { value: new THREE.Color('#e9d9ba') },
    sunDirection: { value: new THREE.Vector3(-.7, .58, .4).normalize() },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: `varying vec3 vDirection; void main() { vDirection = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `
      varying vec3 vDirection;
      uniform vec3 zenith, horizon, sunDirection;
      uniform float time, warmth;
      ${noiseGLSL}
      void main() {
        vec3 dir = normalize(vDirection);
        float h = max(dir.y, 0.);
        vec3 color = mix(horizon, zenith, clamp(pow(h * 2.4, .50), 0., 1.));
        vec2 p = dir.xz / (max(dir.y, .025) + .2);
        float cloud = fbm(p * 3. + vec2(time * .0012, 0.));
        cloud = smoothstep(.48, .77, cloud) * smoothstep(.025, .22, h) * (1. - smoothstep(.65, .95, h));
        color = mix(color, vec3(.95, .923, .84), cloud * .64);
        float sun = max(dot(dir, sunDirection), 0.);
        color += vec3(1., .66, .26) * pow(sun, 28.) * .18 * warmth;
        color += vec3(1., .80, .48) * pow(sun, 1600.) * 3.;
        gl_FragColor = vec4(color, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1800, 32, 20), material);
  mesh.renderOrder = -2;
  return { mesh, uniforms };
}

export function createSea() {
  const uniforms = {
    time: { value: 0 }, warmth: { value: .6 },
    sunDirection: { value: new THREE.Vector3(-.7, .58, .4).normalize() },
    fogColor: { value: new THREE.Color('#d6d8c7') },
    fogNear: { value: 150 }, fogFar: { value: 600 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      uniform float time;
      varying vec3 vWorld;
      void main() {
        vec3 p = position;
        p.z += sin(p.x * .21 + time * .55) * .07 + sin(p.y * .32 + time * .8) * .045;
        vec4 world = modelMatrix * vec4(p, 1.);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      varying vec3 vWorld;
      uniform vec3 sunDirection, fogColor;
      uniform float time, warmth, fogNear, fogFar;
      ${noiseGLSL}
      float surface(vec2 p) {
        return sin(p.x * 1.9 + p.y * .32 + time * 1.0) * .13
          + sin(p.y * 2.7 - time * .83 + sin(p.x * .26)) * .085
          + noise(p * 2.8 + time * .15) * .20;
      }
      void main() {
        vec2 p = vWorld.xz;
        float a = surface(p), b = surface(p + vec2(.08, 0.)), c = surface(p + vec2(0., .08));
        vec3 normal = normalize(vec3((a-b) * 2.8, 1., (a-c) * 2.8));
        vec3 viewDir = normalize(cameraPosition - vWorld);
        float fresnel = pow(1. - max(dot(normal, viewDir), 0.), 3.);
        float coastX = 23. + sin(p.y * .012) * 15. + exp(-p.y*p.y / 520.) * 15. - exp(-pow(p.y-65., 2.) / 1800.) * 9.;
        float offshore = max(p.x - coastX, 0.);
        vec3 shallow = vec3(.065, .195, .170);
        vec3 deep = vec3(.025, .100, .135);
        vec3 base = mix(shallow, deep, smoothstep(0., 80., offshore));
        base += (fbm(p * .07 + vec2(time * .02)) - .45) * .055;
        vec3 reflection = mix(vec3(.28,.40,.44), vec3(.44,.44,.34), warmth * .4);
        vec3 color = mix(base, reflection, fresnel * .80);
        vec3 halfDirection = normalize(sunDirection + viewDir);
        float spec = pow(max(dot(normal, halfDirection), 0.), 260.);
        color += vec3(1., .80, .47) * spec * 1.6;
        float ripples = pow(max(0., sin(p.y * 2.5 + p.x * .6 + noise(p * .6) * 5. - time * .65)), 12.);
        color += ripples * .023;
        float shoreWave = sin(offshore * 1.8 - time * .7 + noise(p * .24) * 2.);
        float foam = smoothstep(.83, 1., shoreWave) * (1. - smoothstep(.2, 5.8, offshore));
        foam *= .35 + noise(p * 4.) * .65;
        color = mix(color, vec3(.79,.83,.74), foam * .62);
        float distanceToCamera = length(cameraPosition - vWorld);
        color = mix(color, fogColor, smoothstep(fogNear, fogFar, distanceToCamera));
        gl_FragColor = vec4(color, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3600, 3600, 40, 40), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(600, -.11, -150);
  mesh.renderOrder = -1;
  return { mesh, uniforms };
}

export function createLivingDetails() {
  const rand = random(851);
  const group = new THREE.Group();
  const birdMaterial = new THREE.MeshStandardMaterial({ color: '#e0e1d6', side: THREE.DoubleSide, roughness: .9 });
  const birdWing = new THREE.BufferGeometry();
  birdWing.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, .6, .07, -.13, 1.1, -.1, -.33, .6, .07, -.13, .37, 0, .16, 0, 0, 0], 3));
  birdWing.computeVertexNormals();
  const birds: { group: THREE.Group; wings: THREE.Mesh[]; phase: number }[] = [];
  for (let i = 0; i < 8; i++) {
    const bird = new THREE.Group();
    const wings = [new THREE.Mesh(birdWing, birdMaterial), new THREE.Mesh(birdWing, birdMaterial)];
    wings[1].scale.x = -1;
    bird.add(...wings);
    const phase = rand() * Math.PI * 2;
    bird.position.set(60 + i * 8, 21 + rand() * 14, -48 + rand() * 140);
    group.add(bird);
    birds.push({ group: bird, wings, phase });
  }
  const shape = new THREE.Shape();
  shape.moveTo(0, -.12); shape.lineTo(-.12, 0); shape.lineTo(-.07, .12); shape.lineTo(0, .17); shape.lineTo(.11, .07); shape.lineTo(.12, -.04); shape.closePath();
  const leafMaterial = new THREE.MeshStandardMaterial({ color: '#b99242', side: THREE.DoubleSide, roughness: 1 });
  const leaves = new THREE.InstancedMesh(new THREE.ShapeGeometry(shape), leafMaterial, 58);
  const leafData = Array.from({ length: 58 }, () => ({ x: -41 + rand() * 26, y: rand() * 16, z: -100 + rand() * 210, phase: rand() * 6.28, speed: .35 + rand() * .4 }));
  const dummy = new THREE.Object3D();
  group.add(leaves);
  // A few tiny sailboats give the open Yellow Sea a sense of scale.
  const boatMaterial = new THREE.MeshStandardMaterial({ color: '#e0ded0', side: THREE.DoubleSide, roughness: .85 });
  for (let i = 0; i < 3; i++) {
    const sail = new THREE.Shape();
    sail.moveTo(0, 0); sail.lineTo(0, 4); sail.lineTo(2.1, .2); sail.closePath();
    const boat = new THREE.Mesh(new THREE.ShapeGeometry(sail), boatMaterial);
    boat.position.set(160 + i * 95, .2, -120 - i * 115);
    boat.rotation.y = -.3 + i;
    group.add(boat);
  }
  return {
    group, leaves,
    update(time: number, animate = true) {
      for (let i = 0; i < birds.length; i++) {
        const bird = birds[i], t = time * .052 + bird.phase;
        bird.group.position.set(70 + Math.cos(t) * (35 + i * 5), 25 + Math.sin(t * 2) * 3 + i * 1.8, -40 + Math.sin(t) * 65);
        bird.group.rotation.y = -t;
        const flap = animate ? Math.sin(time * 3.3 + bird.phase) * .28 : .12;
        bird.wings[0].rotation.z = flap;
        bird.wings[1].rotation.z = -flap;
      }
      for (let i = 0; i < leafData.length; i++) {
        const leaf = leafData[i];
        const x = leaf.x + Math.sin(time * .35 + leaf.phase) * 2;
        const z = leaf.z + Math.sin(time * .19 + leaf.phase) * 3;
        const y = groundHeight(x, z) + ((leaf.y - time * leaf.speed) % 16 + 16) % 16;
        dummy.position.set(Math.min(x, coast(z) - 5), y, z);
        dummy.rotation.set(time * .6 + leaf.phase, time * .43, Math.sin(time + leaf.phase));
        dummy.updateMatrix();
        leaves.setMatrixAt(i, dummy.matrix);
      }
      leaves.instanceMatrix.needsUpdate = true;
    },
  };
}
