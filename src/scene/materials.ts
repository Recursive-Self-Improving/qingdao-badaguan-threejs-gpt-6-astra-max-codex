import * as THREE from 'three';

export function random(seed = 7123) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = random();

function texture(size: number, paint: (ctx: CanvasRenderingContext2D, size: number) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  paint(canvas.getContext('2d')!, size);
  const result = new THREE.CanvasTexture(canvas);
  result.colorSpace = THREE.SRGBColorSpace;
  result.wrapS = result.wrapT = THREE.RepeatWrapping;
  result.anisotropy = 8;
  return result;
}

function noise(ctx: CanvasRenderingContext2D, size: number, count: number, amount: number) {
  for (let i = 0; i < count; i++) {
    const v = rand() > .5 ? 255 : 0;
    ctx.fillStyle = `rgba(${v},${v},${v},${rand() * amount})`;
    const r = .5 + rand() * 2;
    ctx.fillRect(rand() * size, rand() * size, r, r);
  }
}

export function makeMaterials(softwareRendering = false) {
  const surface = (parameters: THREE.MeshStandardMaterialParameters) => {
    if (!softwareRendering) return new THREE.MeshStandardMaterial(parameters);
    return new THREE.MeshLambertMaterial({
      color: parameters.color ?? 0xffffff,
      map: parameters.map ?? null,
      side: parameters.side ?? THREE.FrontSide,
      alphaTest: parameters.alphaTest ?? 0,
      vertexColors: parameters.vertexColors ?? false,
      emissive: parameters.emissive ?? 0x000000,
      emissiveIntensity: parameters.emissiveIntensity ?? 1,
    });
  };
  const stoneMap = texture(1024, (ctx, size) => {
    ctx.fillStyle = '#777263';
    ctx.fillRect(0, 0, size, size);
    const row = size / 12;
    for (let y = -1; y < 13; y++) {
      let x = y % 2 ? -70 : -5;
      while (x < size) {
        const w = 85 + rand() * 75;
        const v = 53 + rand() * 16;
        ctx.fillStyle = `hsl(${33 + rand() * 10} 13% ${v}%)`;
        ctx.beginPath();
        ctx.moveTo(x + 3, y * row + 4);
        ctx.lineTo(x + w - 5, y * row + 2);
        ctx.lineTo(x + w - 2, (y + 1) * row - 6);
        ctx.lineTo(x + 5, (y + 1) * row - 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(248,240,218,.18)';
        ctx.lineWidth = 3;
        ctx.stroke();
        for (let j = 0; j < 12; j++) {
          ctx.fillStyle = `rgba(39,33,25,${rand() * .10})`;
          ctx.beginPath();
          ctx.ellipse(x + rand() * w, y * row + rand() * row, rand() * 25, rand() * 12, rand() * 3, 0, Math.PI * 2);
          ctx.fill();
        }
        x += w;
      }
    }
    noise(ctx, size, 100000, .16);
  });
  stoneMap.repeat.set(1.8, 1.8);

  const roofMap = texture(512, (ctx, size) => {
    ctx.fillStyle = '#633d2b';
    ctx.fillRect(0, 0, size, size);
    for (let y = 0; y < 16; y++) {
      for (let x = -1; x < 13; x++) {
        const xx = x * 44 + (y % 2) * 22;
        const yy = y * 32;
        const grad = ctx.createLinearGradient(xx, yy, xx + 42, yy + 2);
        const light = 34 + rand() * 13;
        grad.addColorStop(0, `hsl(18 39% ${light - 9}%)`);
        grad.addColorStop(.4, `hsl(19 45% ${light + 9}%)`);
        grad.addColorStop(1, `hsl(15 39% ${light}%)`);
        ctx.fillStyle = grad;
        ctx.fillRect(xx + 1, yy + 1, 41, 30);
        ctx.fillStyle = 'rgba(245,190,137,.25)';
        ctx.fillRect(xx + 3, yy + 29, 38, 1);
      }
    }
    noise(ctx, size, 18000, .16);
  });
  roofMap.repeat.set(2, 2);

  const pavingMap = texture(512, (ctx, size) => {
    ctx.fillStyle = '#a49d89';
    ctx.fillRect(0, 0, size, size);
    for (let y = 0; y < 12; y++) {
      for (let x = -1; x < 9; x++) {
        const light = 60 + rand() * 13;
        ctx.fillStyle = `hsl(37 12% ${light}%)`;
        ctx.fillRect(x * 65 + (y % 2) * 32 + 2, y * 43 + 2, 62, 40);
      }
    }
    noise(ctx, size, 35000, .12);
  });
  pavingMap.repeat.set(1, 1);

  const groundMap = texture(512, (ctx, size) => {
    ctx.fillStyle = '#c3c4ac';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 48000; i++) {
      ctx.fillStyle = `rgba(${rand() > .5 ? '248,244,214' : '45,59,34'},${rand() * .24})`;
      ctx.fillRect(rand() * size, rand() * size, 1 + rand() * 4, 1 + rand() * 3);
    }
  });
  groundMap.repeat.set(80, 100);

  const barkMap = texture(256, (ctx, size) => {
    ctx.fillStyle = '#827d66';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 350; i++) {
      ctx.fillStyle = ['#9f9c83', '#bbb7a1', '#625f4f', '#d0c9ad'][Math.floor(rand() * 4)];
      ctx.beginPath();
      ctx.ellipse(rand() * size, rand() * size, 3 + rand() * 16, 3 + rand() * 33, rand(), 0, Math.PI * 2);
      ctx.fill();
    }
    noise(ctx, size, 14000, .12);
  });
  barkMap.repeat.set(2, 3);

  const rockMap = texture(512, (ctx, size) => {
    ctx.fillStyle = '#a19b89';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 1400; i++) {
      const x = rand() * size, y = rand() * size, r = 2 + rand() * 30;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, rand() > .45 ? 'rgba(62,58,47,.13)' : 'rgba(236,225,193,.18)');
      grad.addColorStop(1, 'rgba(140,133,111,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    noise(ctx, size, 78000, .24);
  });

  const leafMap = texture(256, (ctx, size) => {
    ctx.clearRect(0, 0, size, size);
    for (let i = 0; i < 62; i++) {
      const x = 28 + rand() * 200, y = 25 + rand() * 203;
      const radius = 8 + rand() * 16;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rand() * Math.PI * 2);
      const c = 150 + Math.floor(rand() * 100);
      ctx.fillStyle = `rgb(${c},${c},${c})`;
      ctx.beginPath();
      ctx.moveTo(0, radius);
      ctx.lineTo(-radius * .32, radius * .27);
      ctx.lineTo(-radius, radius * .12);
      ctx.lineTo(-radius * .62, -radius * .32);
      ctx.lineTo(-radius * .78, -radius * .72);
      ctx.lineTo(-radius * .24, -radius * .62);
      ctx.lineTo(0, -radius * 1.15);
      ctx.lineTo(radius * .27, -radius * .60);
      ctx.lineTo(radius * .80, -radius * .74);
      ctx.lineTo(radius * .65, -radius * .23);
      ctx.lineTo(radius, radius * .15);
      ctx.lineTo(radius * .3, radius * .35);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(70,65,46,.24)';
      ctx.lineWidth = .7;
      ctx.beginPath();
      ctx.moveTo(0, radius);
      ctx.lineTo(0, -radius * .83);
      ctx.moveTo(0, 0);
      ctx.lineTo(-radius * .6, -radius * .4);
      ctx.moveTo(0, 0);
      ctx.lineTo(radius * .6, -radius * .4);
      ctx.stroke();
      ctx.restore();
    }
  });

  const shadowMap = texture(64, (ctx, size) => {
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(32,35,23,.45)');
    grad.addColorStop(.4, 'rgba(32,35,23,.20)');
    grad.addColorStop(1, 'rgba(32,35,23,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  });

  const ginkgoMap = texture(256, (ctx, size) => {
    ctx.clearRect(0, 0, size, size);
    for (let i = 0; i < 58; i++) {
      ctx.save();
      ctx.translate(24 + rand() * 208, 24 + rand() * 208);
      ctx.rotate(rand() * Math.PI * 2);
      const r = 9 + rand() * 13, light = 155 + Math.floor(rand() * 95);
      ctx.fillStyle = `rgb(${light},${light},${light})`;
      ctx.beginPath();
      ctx.moveTo(0, r * .85);
      ctx.lineTo(-r, -r * .4);
      ctx.quadraticCurveTo(-r * .85, -r, -r * .13, -r * .8);
      ctx.lineTo(0, -r * .58);
      ctx.lineTo(r * .13, -r * .8);
      ctx.quadraticCurveTo(r * .85, -r, r, -r * .4);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(65,62,35,.18)'; ctx.lineWidth = .65;
      for (let j = -2; j <= 2; j++) {
        ctx.beginPath(); ctx.moveTo(0, r * .8); ctx.lineTo(j * r * .3, -r * .6); ctx.stroke();
      }
      ctx.restore();
    }
  });
  const needleMap = texture(256, (ctx, size) => {
    ctx.clearRect(0, 0, size, size);
    for (let i = 0; i < 125; i++) {
      ctx.save();
      ctx.translate(20 + rand() * 216, 20 + rand() * 216);
      ctx.rotate(rand() * Math.PI * 2);
      const light = 140 + Math.floor(rand() * 110);
      ctx.strokeStyle = `rgb(${light},${light},${light})`;
      ctx.lineWidth = 1.5;
      for (let j = -3; j <= 3; j++) {
        ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(j * 4, -8 - rand() * 9); ctx.stroke();
      }
      ctx.restore();
    }
  });
  if (softwareRendering) {
    for (const map of [stoneMap, roofMap, pavingMap, groundMap, barkMap, rockMap, leafMap, ginkgoMap, needleMap]) map.anisotropy = 1;
  }

  return {
    stone: surface({ map: stoneMap, roughness: .96, bumpMap: stoneMap, bumpScale: .15 }),
    rock: surface({ map: rockMap, roughness: .96, bumpMap: rockMap, bumpScale: .12 }),
    trim: surface({ color: '#a8a08d', roughness: .88, map: stoneMap, bumpMap: stoneMap, bumpScale: .055 }),
    plaster: surface({ color: '#e7d9b6', roughness: .94 }),
    mint: surface({ color: '#9caf9f', roughness: .95 }),
    cream: surface({ color: '#e3d8c2', roughness: .95 }),
    roof: surface({ map: roofMap, roughness: .87, bumpMap: roofMap, bumpScale: .09 }),
    slate: surface({ color: '#465451', roughness: .8, metalness: .18 }),
    glass: surface({ color: '#435d5a', metalness: .36, roughness: .23 }),
    frame: surface({ color: '#d2d3c2', roughness: .72 }),
    wood: surface({ color: '#4e4436', roughness: .9 }),
    iron: surface({ color: '#333e35', roughness: .6, metalness: .4 }),
    paving: surface({ map: pavingMap, roughness: .94, bumpMap: pavingMap, bumpScale: .035 }),
    road: surface({ color: '#827f70', roughness: 1, map: groundMap }),
    ground: surface({ map: groundMap, vertexColors: true, roughness: 1 }),
    bark: surface({ map: barkMap, roughness: 1, bumpMap: barkMap, bumpScale: .05 }),
    pineBark: surface({ map: barkMap, color: '#88745c', roughness: 1 }),
    leaves: surface({ map: leafMap, alphaTest: .45, side: THREE.DoubleSide, roughness: .85, emissive: '#6c5b25', emissiveIntensity: .08 }),
    ginkgo: surface({ map: ginkgoMap, alphaTest: .45, side: THREE.DoubleSide, roughness: .85, emissive: '#6c5b25', emissiveIntensity: .08 }),
    needles: surface({ map: needleMap, alphaTest: .4, side: THREE.DoubleSide, roughness: .85, emissive: '#374321', emissiveIntensity: .08 }),
    shadow: new THREE.MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }),
  };
}

export type Materials = ReturnType<typeof makeMaterials>;
