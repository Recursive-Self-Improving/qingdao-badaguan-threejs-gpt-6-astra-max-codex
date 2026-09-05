import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { makeMaterials, type Materials } from './materials';
import { coast, createForest, createGardens, createGroundLeaves, createRocks, createRoads, createTerrain, groundHeight } from './landscape';
import { createArchitecture, type Collider } from './architecture';
import { createLivingDetails, createSea, createSky } from './atmosphere';

export const places = [
  {
    id: 'huashi', name: '花石樓', en: 'HUASHI VILLA', category: '石築古堡 · 海畔光影', tag: '百年建築',
    description: '花崗岩砌成的圓塔，靜靜望向黃海。沿著石階拾級而上，把紅瓦、綠樹與海岸一併收入眼底。',
    detail: '花石樓位於黃海路的臨海岬角。圓形塔樓、多角形樓體、拱窗與雉堞式女兒牆，共同構成它獨特的古堡輪廓。石牆上攀附的藤蔓，也讓建築隨季節變換顏色。',
    position: [7, 21, 2], camera: [52, 26, 69], target: [-8, 7, -23], walk: [-6, 5.4, 29], look: [6, 10, 2],
  },
  {
    id: 'avenue', name: '梧桐小徑', en: 'SHANHAIGUAN ROAD', category: '山海關路 · 斑駁樹影', tag: '林蔭漫步',
    description: '陽光穿過法國梧桐的枝葉，落在安靜的小路上。放慢腳步，聽落葉與海風輕輕說話。',
    detail: '八大關的行道樹讓每條路都有自己的性格。山海關路以法國梧桐形成濃蔭，居庸關路則以秋日金黃的銀杏著稱。樹蔭、院牆與隱約可見的別墅，是這裡最日常的風景。',
    position: [-30, 12, 43], camera: [-20, 7.3, 91], target: [-36, 6.1, -24], walk: [-24, 5.5, 63], look: [-34, 5.6, -5],
  },
  {
    id: 'beach', name: '第二海水浴場', en: 'NO. 2 BATHING BEACH', category: '細沙海岸 · 聽風觀海', tag: '海岸風景',
    description: '從樹影間走向海邊，看細浪漫過沙岸。遠處的帆影，讓一個午後變得悠長。',
    detail: '第二海水浴場緊鄰八大關南側，花石樓坐落在沙灘一端的岬角。舒展的沙岸、臨海的礁石與身後的林木，讓街區的幽靜自然地延伸到海邊。',
    position: [30, 2, 86], camera: [57, 14, 119], target: [12, 3, 40], walk: [24, 3.4, 90], look: [70, 2, 46],
  },
  {
    id: 'princess', name: '公主樓', en: 'PRINCESS VILLA', category: '居庸關路 · 童話庭院', tag: '花園別墅',
    description: '綠色牆面與紅色尖頂藏在庭院深處。一座小樓，收藏了八大關的浪漫想像。',
    detail: '公主樓位於居庸關路，以尖塔、不規則斜屋頂與精巧的庭院著稱。藍綠色的牆面藏在花木之間，與周邊風格各異的別墅共同構成八大關的建築風景。',
    position: [-58, 22, -86], camera: [-38, 13, -62], target: [-58, 10, -86], walk: [-53, 5.8, -68], look: [-58, 10, -86],
  },
] as const;

export type PlaceId = typeof places[number]['id'];
export type ViewMode = 'overview' | 'walk';

interface EngineOptions {
  onFrame: (position: THREE.Vector3, direction: THREE.Vector3, projected: { id: string; x: number; y: number; visible: boolean }[]) => void;
  onMode: (mode: ViewMode) => void;
  onTour: (active: boolean, index?: number) => void;
  onReady: () => void;
}

export class Landscape {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(47, 1, .15, 2500);
  readonly controls: OrbitControls;
  mode: ViewMode = 'overview';
  selected: PlaceId = 'huashi';
  tour = false;
  private options: EngineOptions;
  private host: HTMLElement;
  private materials: Materials;
  private sun = new THREE.DirectionalLight('#ffe0ad', 3.4);
  private hemisphere = new THREE.HemisphereLight('#d1dce1', '#716d43', 2.05);
  private sky = createSky();
  private sea = createSea();
  private living = createLivingDetails();
  private colliders: Collider[] = [];
  private keys = new Set<string>();
  private clock = new THREE.Clock();
  private elapsed = 0;
  private moving = new THREE.Vector3();
  private direction = new THREE.Vector3();
  private yaw = 0;
  private pitch = 0;
  private dragging = false;
  private pointer = { x: 0, y: 0 };
  private tween: { from: THREE.Vector3; to: THREE.Vector3; fromTarget: THREE.Vector3; target: THREE.Vector3; start: number; duration: number } | null = null;
  private tourTime = 0;
  private tourIndex = 0;
  private time = 16.5;
  private targetTime = 16.5;
  private mist = .35;
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private wind = { value: 0 };
  private frame = 0;
  private observer: ResizeObserver;
  private lampGlow: THREE.MeshStandardMaterial;
  private animationId = 0;
  private disposed = false;
  private frameWindow = 0;
  private sampleFrames = 0;
  private softwareRendering = false;

  constructor(host: HTMLElement, options: EngineOptions) {
    this.host = host;
    this.options = options;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    const gl = this.renderer.getContext();
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    this.softwareRendering = !!info && /swiftshader|llvmpipe|software/i.test(gl.getParameter(info.UNMASKED_RENDERER_WEBGL));
    this.materials = makeMaterials(this.softwareRendering);
    this.renderer.setPixelRatio(this.softwareRendering ? .85 : Math.min(devicePixelRatio, innerWidth < 700 ? 1.4 : 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = this.softwareRendering ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.domElement.setAttribute('aria-label', '八大關互動三維景觀。拖曳旋轉，W A S D 或方向鍵移動，Q E 升降，R 返回起點。');
    this.renderer.domElement.tabIndex = 0;
    this.renderer.domElement.id = 'landscape-canvas';
    host.prepend(this.renderer.domElement);
    this.camera.position.fromArray(places[0].camera);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.fromArray(places[0].target);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = .065;
    this.controls.rotateSpeed = .4;
    this.controls.panSpeed = .7;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 230;
    this.controls.maxPolarAngle = Math.PI * .48;
    this.controls.minPolarAngle = .12;
    this.controls.addEventListener('start', () => { this.stopTour(); this.tween = null; });
    this.scene.fog = new THREE.Fog('#c9d0bc', 140, 430);
    this.scene.add(this.sky.mesh, this.sea.mesh, this.hemisphere);
    this.sun.position.set(-65, 85, 55);
    this.sun.target.position.set(-27, 0, -30);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, { left: -115, right: 115, top: 120, bottom: -120, near: 1, far: 310 });
    this.sun.shadow.normalBias = .065;
    this.sun.shadow.bias = -.0002;
    this.sun.shadow.radius = 2.5;
    this.scene.add(this.sun, this.sun.target);
    for (const material of [this.materials.leaves, this.materials.ginkgo, this.materials.needles]) material.onBeforeCompile = shader => {
      shader.uniforms.uWindTime = this.wind;
      shader.vertexShader = 'uniform float uWindTime;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
        #include <begin_vertex>
        #ifdef USE_INSTANCING
          vec4 base = modelMatrix * instanceMatrix * vec4(0., 0., 0., 1.);
          transformed.x += sin(uWindTime * .7 + base.x * .14 + base.z * .09) * .045 * (position.y + .5);
        #endif
      `);
    };
    const architecture = createArchitecture(this.materials);
    this.colliders = architecture.colliders;
    this.lampGlow = architecture.lampGlow;
    const forest = createForest(this.materials, this.softwareRendering);
    this.scene.add(createTerrain(this.materials), createRoads(this.materials), architecture.group, forest.group, createRocks(this.materials), createGardens(this.materials), createGroundLeaves(this.materials), this.living.group);
    this.applyLight();
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    this.resize();
    this.bindInput();
    this.animate();
    this.renderer.domElement.dataset.ready = 'true';
    requestAnimationFrame(options.onReady);
  }

  private resize() {
    const w = this.host.clientWidth, h = this.host.clientHeight;
    if (!w || !h) return;
    if (this.softwareRendering) this.renderer.setPixelRatio(w < 650 ? Math.min(devicePixelRatio, 1) : .85);
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (document.querySelector('dialog[open]') || (event.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(event.target.tagName))) return;
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyQ', 'KeyE', 'ShiftLeft', 'ShiftRight'].includes(event.code)) {
      event.preventDefault();
      this.keys.add(event.code);
      this.stopTour(); this.tween = null;
    }
    if (event.code === 'KeyR') this.reset();
    if (event.code === 'Escape' && this.tour) this.stopTour();
  };
  private onKeyUp = (event: KeyboardEvent) => this.keys.delete(event.code);
  private onBlur = () => { this.keys.clear(); this.dragging = false; };
  private onPointerDown = (event: PointerEvent) => {
    if (this.mode !== 'walk' || event.button !== 0) return;
    this.dragging = true;
    this.pointer = { x: event.clientX, y: event.clientY };
    this.renderer.domElement.setPointerCapture(event.pointerId);
  };
  private onPointerMove = (event: PointerEvent) => {
    if (this.mode !== 'walk') return;
    const locked = document.pointerLockElement === this.renderer.domElement;
    if (!this.dragging && !locked) return;
    const dx = locked ? event.movementX : event.clientX - this.pointer.x;
    const dy = locked ? event.movementY : event.clientY - this.pointer.y;
    this.pointer = { x: event.clientX, y: event.clientY };
    this.yaw -= dx * .003;
    this.pitch = THREE.MathUtils.clamp(this.pitch - dy * .003, -1.25, 1.25);
    this.tween = null;
    this.updateLook();
  };
  private onPointerUp = () => { this.dragging = false; };
  private onWheel = (event: WheelEvent) => {
    if (this.mode !== 'walk' || document.querySelector('dialog[open]')) return;
    event.preventDefault();
    this.camera.getWorldDirection(this.direction);
    this.direction.y = 0;
    this.camera.position.addScaledVector(this.direction.normalize(), Math.sign(event.deltaY) * -1.5);
    this.constrain();
  };

  private bindInput() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointercancel', this.onPointerUp);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
  }

  setMoveKey(key: string, down: boolean) {
    if (down) { this.keys.add(key); this.tween = null; this.stopTour(); }
    else this.keys.delete(key);
  }

  private updateLook() {
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }

  private syncLook() {
    this.camera.rotation.order = 'YXZ';
    this.yaw = this.camera.rotation.y;
    this.pitch = this.camera.rotation.x;
  }

  private constrain() {
    const pos = this.camera.position;
    pos.x = THREE.MathUtils.clamp(pos.x, -195, 190);
    pos.z = THREE.MathUtils.clamp(pos.z, -260, 205);
    if (this.mode === 'walk') {
      pos.x = Math.min(pos.x, coast(pos.z) - 3);
      for (const item of this.colliders) {
        const dx = pos.x - item.x, dz = pos.z - item.z, distance = Math.hypot(dx, dz);
        if (distance < item.radius + .7) {
          const theta = distance < .001 ? 0 : Math.atan2(dz, dx);
          pos.x = item.x + Math.cos(theta) * (item.radius + .7);
          pos.z = item.z + Math.sin(theta) * (item.radius + .7);
        }
      }
      pos.y = groundHeight(pos.x, pos.z) + 1.75;
    } else pos.y = THREE.MathUtils.clamp(pos.y, Math.max(groundHeight(pos.x, pos.z) + 1.4, 1.4), 150);
  }

  private updateMovement(dt: number) {
    if (!this.keys.size || document.querySelector('dialog[open]')) return;
    this.camera.getWorldDirection(this.direction);
    this.direction.y = 0;
    this.direction.normalize();
    const right = new THREE.Vector3().crossVectors(this.direction, this.camera.up).normalize();
    this.moving.set(0, 0, 0);
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) this.moving.add(this.direction);
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) this.moving.sub(this.direction);
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) this.moving.add(right);
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) this.moving.sub(right);
    if (this.mode === 'overview') {
      if (this.keys.has('KeyQ')) this.moving.y -= 1;
      if (this.keys.has('KeyE')) this.moving.y += 1;
    }
    const speed = (this.mode === 'walk' ? 5.0 : 17) * (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? 2.3 : 1);
    this.moving.normalize().multiplyScalar(dt * speed);
    this.camera.position.add(this.moving);
    if (this.mode === 'overview') this.controls.target.add(this.moving);
    this.constrain();
  }

  goTo(id: PlaceId, immediate = false) {
    this.selected = id;
    const place = places.find(p => p.id === id)!;
    const to = new THREE.Vector3().fromArray(this.mode === 'walk' ? place.walk : place.camera);
    const target = new THREE.Vector3().fromArray(this.mode === 'walk' ? place.look : place.target);
    const fromTarget = this.mode === 'walk' ? this.camera.position.clone().add(this.camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(25)) : this.controls.target.clone();
    this.tween = { from: this.camera.position.clone(), to, fromTarget, target, start: this.elapsed, duration: immediate || this.reducedMotion ? .01 : 2.1 };
  }

  setMode(mode: ViewMode) {
    this.stopTour();
    this.keys.clear();
    this.mode = mode;
    this.controls.enabled = mode === 'overview';
    this.options.onMode(mode);
    this.goTo(this.selected);
  }

  reset() {
    this.stopTour();
    if (this.mode === 'walk') this.setMode('overview');
    else this.goTo(this.selected);
  }

  toggleTour() {
    if (this.tour) { this.stopTour(); return; }
    if (this.mode === 'walk') this.setMode('overview');
    this.tour = true;
    this.tourIndex = Math.max(0, places.findIndex(p => p.id === this.selected));
    this.tourTime = this.elapsed;
    this.goTo(places[this.tourIndex].id);
    this.options.onTour(true, this.tourIndex);
  }

  stopTour() {
    if (!this.tour) return;
    this.tour = false;
    this.options.onTour(false);
  }

  setTime(value: number) { this.targetTime = value; }
  setMist(value: number) { this.mist = value; this.applyLight(); }
  setLeaves(visible: boolean) { this.living.leaves.visible = visible; }

  private applyLight() {
    const golden = THREE.MathUtils.smoothstep(this.time, 13, 18.5);
    const morning = 1 - THREE.MathUtils.smoothstep(this.time, 8, 11);
    const warmth = Math.max(golden, morning * .5);
    const evening = THREE.MathUtils.smoothstep(this.time, 17.2, 19);
    this.sun.color.set('#fff4d9').lerp(new THREE.Color('#ffd194'), warmth);
    this.sun.intensity = 3.4 - evening * 1.65;
    this.hemisphere.intensity = 2.0 - evening * .64;
    const angle = THREE.MathUtils.mapLinear(this.time, 8, 19, .35, 2.5);
    this.sun.position.set(-75, 35 + Math.sin(angle) * 62, 80 - golden * 25);
    this.sky.uniforms.warmth.value = warmth;
    this.sky.uniforms.zenith.value.set('#70a9c5').lerp(new THREE.Color('#929eab'), evening);
    this.sky.uniforms.horizon.value.set('#d2ded7').lerp(new THREE.Color('#ecd0ad'), warmth);
    this.sky.uniforms.sunDirection.value.copy(this.sun.position).sub(this.sun.target.position).normalize();
    this.sea.uniforms.sunDirection.value.copy(this.sky.uniforms.sunDirection.value);
    this.sea.uniforms.warmth.value = warmth;
    const fog = this.scene.fog as THREE.Fog;
    fog.color.set('#c5d3c8').lerp(new THREE.Color('#d9c9ad'), warmth * .7);
    fog.near = 170 - this.mist * 95;
    fog.far = 560 - this.mist * 280;
    this.sea.uniforms.fogColor.value.copy(fog.color);
    this.sea.uniforms.fogNear.value = fog.near + 60;
    this.sea.uniforms.fogFar.value = fog.far + 160;
    this.lampGlow.emissiveIntensity = .5 + evening * 2;
    this.renderer.shadowMap.needsUpdate = true;
  }

  private animate = () => {
    if (this.disposed) return;
    this.animationId = requestAnimationFrame(this.animate);
    const realDelta = this.clock.getDelta();
    const dt = Math.min(realDelta, .10);
    if (document.hidden) return;
    this.elapsed += realDelta;
    this.frame++;
    // Camera transitions use wall time; low frame rates must never prolong a journey.
    // Keep interface text crisp while scaling only the 3D canvas on slower devices.
    if (this.frame > 8) {
      this.frameWindow += realDelta;
      this.sampleFrames++;
      if (this.sampleFrames >= 12) {
        const fps = this.sampleFrames / this.frameWindow;
        const ratio = this.renderer.getPixelRatio();
        const minimum = this.host.clientWidth < 650 ? 1 : .85;
        if (fps < 22 && ratio > minimum) this.renderer.setPixelRatio(Math.max(minimum, ratio - .20));
        this.frameWindow = 0;
        this.sampleFrames = 0;
      }
    }
    if (Math.abs(this.targetTime - this.time) > .008) {
      this.time = THREE.MathUtils.lerp(this.time, this.targetTime, 1 - Math.exp(-dt * 4));
      this.applyLight();
    }
    if (this.tween) {
      const raw = Math.min(1, (this.elapsed - this.tween.start) / this.tween.duration);
      const t = raw * raw * (3 - 2 * raw);
      this.camera.position.lerpVectors(this.tween.from, this.tween.to, t);
      const target = new THREE.Vector3().lerpVectors(this.tween.fromTarget, this.tween.target, t);
      if (this.mode === 'overview') this.controls.target.copy(target);
      else { this.camera.lookAt(target); this.syncLook(); }
      if (raw === 1) { this.tween = null; if (this.mode === 'walk') this.constrain(); }
    }
    if (this.tour) {
      if (this.elapsed - this.tourTime > 12) {
        this.tourIndex = (this.tourIndex + 1) % places.length;
        this.tourTime = this.elapsed;
        this.goTo(places[this.tourIndex].id);
        this.options.onTour(true, this.tourIndex);
      } else if (!this.tween && !this.reducedMotion) {
        const offset = this.camera.position.clone().sub(this.controls.target);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), dt * .013);
        this.camera.position.copy(this.controls.target).add(offset);
      }
    }
    this.updateMovement(dt);
    if (this.mode === 'overview') this.controls.update();
    const animationTime = this.reducedMotion ? 0 : this.elapsed;
    this.wind.value = animationTime;
    this.sky.uniforms.time.value = animationTime;
    this.sea.uniforms.time.value = animationTime;
    this.living.update(animationTime, !this.reducedMotion);
    this.renderer.render(this.scene, this.camera);
    if (this.frame % 3 === 0) {
      this.renderer.domElement.dataset.drawCalls = String(this.renderer.info.render.calls);
      this.renderer.domElement.dataset.triangles = String(this.renderer.info.render.triangles);
      const forward = this.camera.getWorldDirection(new THREE.Vector3());
      const projected = places.map(place => {
        const world = new THREE.Vector3().fromArray(place.position);
        const distance = world.distanceTo(this.camera.position);
        const facing = world.clone().sub(this.camera.position).dot(forward) > 0;
        world.project(this.camera);
        return { id: place.id, x: (world.x * .5 + .5) * this.host.clientWidth, y: (-world.y * .5 + .5) * this.host.clientHeight, visible: facing && world.z < 1 && distance < 200 && Math.abs(world.x) < .92 && Math.abs(world.y) < .78 };
      });
      this.options.onFrame(this.camera.position, forward, projected);
    }
  };

  capture() {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/jpeg', .94);
  }

  thumbnail(id: PlaceId) {
    const place = places.find(p => p.id === id)!;
    const camera = new THREE.PerspectiveCamera(45, 1.5, .2, 2000);
    if (id === 'huashi') {
      camera.position.set(34, 17, 42);
      camera.lookAt(7, 10, 2);
    } else {
      camera.position.fromArray(place.camera);
      camera.lookAt(new THREE.Vector3().fromArray(id === 'avenue' ? [-34, 7, -10] : place.target));
    }
    const target = new THREE.WebGLRenderTarget(240, 160);
    target.texture.colorSpace = THREE.SRGBColorSpace;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.scene, camera);
    const pixels = new Uint8Array(240 * 160 * 4);
    this.renderer.readRenderTargetPixels(target, 0, 0, 240, 160, pixels);
    this.renderer.setRenderTarget(null);
    target.dispose();
    const canvas = document.createElement('canvas');
    canvas.width = 240; canvas.height = 160;
    const ctx = canvas.getContext('2d')!;
    const data = ctx.createImageData(240, 160);
    for (let y = 0; y < 160; y++) data.data.set(pixels.subarray((159 - y) * 240 * 4, (160 - y) * 240 * 4), y * 240 * 4);
    ctx.putImageData(data, 0, 0);
    return canvas.toDataURL('image/jpeg', .88);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.animationId);
    this.observer.disconnect(); this.controls.dispose();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.scene.traverse(object => {
      if (object instanceof THREE.Mesh) object.geometry.dispose();
    });
    for (const material of Object.values(this.materials)) material.dispose();
    this.renderer.dispose();
  }
}
