import './style.css';
import { createIcons, ArrowRight, ArrowUpRight, AudioLines, BookOpen, Camera, Check, ChevronDown, ChevronRight, Compass, Download, Expand, Footprints, Headphones, HelpCircle, Image as ImageIcon, Leaf, Map, MapPin, Maximize2, Mouse, MousePointer2, Navigation, Pause, Play, RotateCcw, Settings2, Sun, Sunrise, Sunset, Volume2, VolumeX, Waves, Wind, X } from 'lucide';
import { Landscape, places, type PlaceId } from './scene/engine';
import { Soundscape } from './audio';

const icons = { ArrowRight, ArrowUpRight, AudioLines, BookOpen, Camera, Check, ChevronDown, ChevronRight, Compass, Download, Expand, Footprints, Headphones, HelpCircle, Image: ImageIcon, Leaf, Map, MapPin, Maximize2, Mouse, MousePointer2, Navigation, Pause, Play, RotateCcw, Settings2, Sun, Sunrise, Sunset, Volume2, VolumeX, Waves, Wind, X };
const icon = (name: string, className = '') => `<i data-lucide="${name}" class="${className}" aria-hidden="true"></i>`;
const refreshIcons = () => createIcons({ icons, attrs: { 'stroke-width': 1.6 } });
const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const logo = `<svg class="brand-mark" viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M8 30V17h6v-6h5v6h7V9h6v8h8v13M5 35c6-5 12-5 18 0s12 5 20 0M5 41c6-5 12-5 18 0s12 5 20 0"/><path d="M21 29v-6a4 4 0 0 1 8 0v6"/></svg>`;

function mapSvg(large = false) {
  return `<svg class="landscape-map ${large ? 'large-map' : ''}" viewBox="0 0 240 176" role="img" aria-label="八大關虛擬景觀示意圖">
    <defs><pattern id="map-grid-${large}" width="13" height="13" patternUnits="userSpaceOnUse"><path d="M13 0H0V13" fill="none" stroke="#afbeb0" stroke-width=".25" opacity=".35"/></pattern></defs>
    <rect width="240" height="176" fill="#dbe6e3"/>
    <path d="M0 0H160Q153 24 168 53T188 86Q208 99 191 115T183 142L197 176H0Z" fill="#eef0e5"/>
    <rect width="240" height="176" fill="url(#map-grid-${large})"/>
    <g fill="#d4deca" opacity=".8"><path d="M16 18h65v32H16zM17 74h63v28H17zM26 126h68v36H26zM117 5h33v37h-33zM110 111h52v48h-52zM135 55h29v20h-29z"/></g>
    <g fill="none" stroke="#fffefa" stroke-width="6"><path d="M100-5l10 37 9 42 8 49 15 57M-5 59l100-7 73-6M0 113l117-9 54-7"/></g>
    <g fill="none" stroke="#c5c8b4" stroke-width=".65"><path d="M100-5l10 37 9 42 8 49 15 57M-5 59l100-7 73-6M0 113l117-9 54-7"/></g>
    <path d="M165 2q-5 23 9 47t19 38q18 14 1 29t-3 54" fill="none" stroke="#bfc9b5" stroke-width="1.1" stroke-dasharray="2 2"/>
    <g fill="#bfbaa3"><path d="M141 81l13-2 5 10-14 4zM94 58l10-2 3 9-12 3zM74 82l14-2 3 11-13 2zM136 23l10-2 3 11-11 2zM72 27l16-1 2 12-16 1zM83 130l13-3 3 11-14 3z"/></g>
    <text x="32" y="49" fill="#8a9487" font-size="6.5" letter-spacing="2" transform="rotate(-4 32 49)">居庸關路</text>
    <text x="112" y="151" fill="#8a9487" font-size="6" transform="rotate(-79 112 151)">山海關路</text>
    <text x="207" y="128" fill="#87a6a0" font-size="7" letter-spacing="4" writing-mode="tb">黃海</text>
    ${places.map((p, i) => `<g class="map-dot" data-map-place="${p.id}" role="button" tabindex="0" aria-label="前往${p.name}" transform="translate(${(p.position[0] + 180) / 280 * 240},${(p.position[2] + 240) / 450 * 176})"><circle r="${large ? 6 : 4.2}" fill="${i === 0 ? '#355c4e' : '#a08f68'}" stroke="#fffdf6" stroke-width="1.8"/>${large ? `<text x="10" y="3" font-size="8" fill="#354d40">${p.name}</text>` : ''}</g>`).join('')}
    <g data-player><circle r="8" fill="#376c5a" opacity=".12"/><path d="M0-5L3.7 4 0 2.4-3.7 4z" fill="#355d4c" stroke="#fff" stroke-width="1"/></g>
    <g transform="translate(224 17)" fill="#657a6d"><text x="0" y="-5" text-anchor="middle" font-size="7">N</text><path d="M0 0l2.3 6L0 4.5-2.3 6z"/></g>
  </svg>`;
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <header class="site-header">
    <a class="brand" href="#" aria-label="山海漫遊，返回八大關起點">${logo}<div><strong>山海漫遊</strong><span>A SLOW JOURNEY</span></div></a>
    <nav class="main-nav" aria-label="主選單">
      <button class="nav-link active" id="explore-nav">探索八大關<span class="nav-dot"></span></button>
      <button class="nav-link" id="journal-nav">漫遊手記</button>
      <button class="nav-link" id="about-nav">關於此地${icon('arrow-up-right')}</button>
    </nav>
    <div class="header-actions"><button class="weather-button" id="atmosphere-button" aria-label="調整場景氛圍">${icon('sun')}<span>秋日 · 晴</span></button><span class="header-divider"></span><button class="sound-button" id="sound-button" aria-label="開啟自然環境音" aria-pressed="false">${icon('volume-x')}<span>聽見自然</span></button></div>
  </header>

  <main class="experience">
    <aside class="sidebar" aria-label="八大關旅遊導覽">
      <div class="destination-intro"><div class="eyebrow"><span class="tiny-line"></span>山海之間，自在漫行</div><h1>青島<span>八大關</span><sup>®</sup></h1><div class="destination-english">BADAGUAN, QINGDAO</div><p class="intro-copy">紅瓦掩映，梧桐成蔭。<br>循著海風，走進一段慢時光。</p><div class="location-meta">${icon('map-pin')}<span>中國 · 山東 · 青島</span><span class="small-dot"></span><span>36°03′ N</span></div></div>
      <div class="places-heading"><h2>沿途風景</h2><span>04 個停留點</span></div>
      <div class="place-list">${places.map((p, i) => `<button class="place-card ${i === 0 ? 'selected' : ''}" data-place="${p.id}" aria-pressed="${i === 0}"><div class="place-thumbnail thumbnail-${p.id}"><img alt="${p.name}的虛擬景觀" data-thumbnail="${p.id}"/><span>0${i + 1}</span></div><div class="place-card-copy"><strong>${p.name}</strong><span>${p.category}</span></div>${icon('arrow-up-right', 'place-arrow')}</button>`).join('')}</div>
      <div class="sidebar-bottom"><div class="journey-note">${icon('leaf')}<span>不趕路，感受路。</span><span class="note-line"></span></div><button class="primary-button" id="walk-button">${icon('footprints')}<span>開始漫遊</span>${icon('arrow-right')}</button><button class="tour-button" id="tour-button">${icon('play')}<span>跟隨鏡頭，慢遊八大關</span><span class="tour-duration">約 1 分鐘</span></button></div>
    </aside>

    <section class="viewport" aria-label="互動虛擬景觀">
      <div id="scene" class="scene"></div>
      <div class="scene-grain" aria-hidden="true"></div>
      <div class="scene-topbar"><div class="view-status">${icon('compass')}<span id="view-mode-label">自由探索</span><span class="live-dot"></span></div><button class="time-button" id="time-button" aria-expanded="false">${icon('sunset')}<span id="time-display">16:30</span><span class="time-divider"></span><span id="time-caption">黃昏微光</span>${icon('chevron-down')}</button></div>
      <div class="time-popover" id="time-popover" hidden><div class="popover-title"><span>讓光線，隨心情流動</span>${icon('sun')}</div><div class="time-presets"><button data-time="8.5">${icon('sunrise')}晨光</button><button data-time="13">${icon('sun')}午後</button><button data-time="16.5" class="active">${icon('sunset')}黃昏</button></div><input id="time-slider" type="range" min="8" max="19" step="0.1" value="16.5" aria-label="場景時間"/><div class="range-labels"><span>08:00</span><span>19:00</span></div><p>光影為藝術模擬，與實際天氣無關。</p></div>
      <div class="scene-caption"><span class="scene-caption-line"></span><p>一城山海，<br><em>一刻悠然。</em></p><span class="scene-caption-en">A LITTLE CLOSER TO NATURE.</span></div>
      <div class="hotspot-container">${places.map((p, i) => `<button class="scene-hotspot ${i === 0 ? 'current' : ''}" data-hotspot="${p.id}" aria-label="了解${p.name}" style="visibility:hidden"><span class="hotspot-circle">${i === 0 ? icon('map-pin') : `0${i + 1}`}</span><span class="hotspot-label">${p.name}${icon('arrow-up-right')}</span></button>`).join('')}</div>
      <div class="scene-tools"><button class="compass-control" id="compass-button" aria-label="重置視角"><span>N</span><svg id="compass-needle" width="26" height="26" viewBox="0 0 26 26"><path d="M13 2L8 16l5-3z" fill="#456654"/><path d="M13 24l5-14-5 3z" fill="#b8b7a3"/></svg></button><div class="tool-stack"><button id="capture-button" aria-label="拍攝明信片" data-tooltip="拍攝明信片 · P">${icon('camera')}</button><button id="map-button" aria-label="顯示或隱藏地圖" aria-pressed="true" data-tooltip="漫遊地圖 · M">${icon('map')}</button><span class="tool-divider"></span><button id="fullscreen-button" aria-label="切換全螢幕" data-tooltip="全螢幕">${icon('maximize-2')}</button><button id="reset-button" aria-label="返回目前景點的初始視角" data-tooltip="重置視角 · R">${icon('rotate-ccw')}</button><button id="help-button" aria-label="查看操作說明" data-tooltip="操作指南 · ?">${icon('help-circle')}</button></div></div>
      <div class="scene-bottom"><div class="current-place"><span class="place-index" id="place-index">01<span>/ 04</span></span><div><span class="current-place-eyebrow">此刻，停留在</span><button id="place-detail-button"><span id="current-place-name">花石樓</span>${icon('arrow-up-right')}</button></div></div><div class="control-hint"><span><kbd>W</kbd><span class="key-row"><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span></span><span>移動</span><span class="hint-divider"></span>${icon('mouse')}<span>拖曳環顧</span><button id="lock-button" aria-label="鎖定滑鼠視角" hidden>${icon('mouse-pointer-2')}</button></div></div>
      <div class="minimap" id="minimap"><button class="minimap-header" id="expand-map-button"><span>${icon('navigation')}漫遊地圖</span>${icon('expand')}</button>${mapSvg()}<span class="map-footnote">山海相連，步履不停 <span>景觀示意</span></span></div>
      <div class="mobile-movement" aria-label="觸控移動"><button data-move="KeyW" aria-label="向前移動">${icon('navigation')}</button><div><button data-move="KeyA" aria-label="向左移動">${icon('arrow-right')}</button><button data-move="KeyS" aria-label="向後移動">${icon('arrow-right')}</button><button data-move="KeyD" aria-label="向右移動">${icon('arrow-right')}</button></div></div>
      <button class="mobile-places-toggle" id="mobile-places-toggle">${icon('map-pin')}<span>沿途風景</span>${icon('chevron-down')}</button>
      <div class="loading-screen" id="loading-screen"><div class="loading-emblem">${logo}</div><span>風景正在慢慢展開</span><div class="loading-track"><span></span></div><small>下一站，山海之間。</small></div>
    </section>
  </main>
  <footer class="site-footer"><span>讓身體停下，讓心去旅行。</span><span class="footer-center">${icon('wind')}一場關於山海的慢旅行</span><span><span class="footer-dot"></span>秋日印象<span class="footer-slash">/</span>QINGDAO, CHINA</span></footer>
  <dialog id="dialog" class="dialog"><button class="dialog-close" id="dialog-close" aria-label="關閉視窗">${icon('x')}</button><div id="dialog-content"></div></dialog>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
`;

refreshIcons();

let engine: Landscape | null = null;
let selected: PlaceId = 'huashi';
let toastTimer: ReturnType<typeof setTimeout>;
const sound = new Soundscape();
const dialog = $<HTMLDialogElement>('#dialog');
let previousFocus: HTMLElement | null = null;

function toast(message: string) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3500);
}

function showDialog(content: string, className = '') {
  document.exitPointerLock?.();
  previousFocus = document.activeElement as HTMLElement;
  $('#dialog-content').innerHTML = content;
  dialog.className = `dialog ${className}`;
  if (!dialog.open) dialog.showModal();
  refreshIcons();
}

function closeDialog() { dialog.close(); previousFocus?.focus({ preventScroll: true }); }
$('#dialog-close').addEventListener('click', closeDialog);
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(); } });

function selectPlace(id: PlaceId, navigate = true) {
  selected = id;
  document.body.dataset.destination = id;
  const place = places.find(p => p.id === id)!;
  const index = places.findIndex(p => p.id === id);
  document.querySelectorAll<HTMLElement>('[data-place]').forEach(el => {
    el.classList.toggle('selected', el.dataset.place === id);
    el.setAttribute('aria-pressed', String(el.dataset.place === id));
  });
  document.querySelectorAll<HTMLElement>('[data-hotspot]').forEach(el => el.classList.toggle('current', el.dataset.hotspot === id));
  $('#current-place-name').textContent = place.name;
  $('#place-index').innerHTML = `0${index + 1}<span>/ 04</span>`;
  if (navigate) { engine?.stopTour(); engine?.goTo(id); }
  document.body.classList.remove('places-open');
}

document.querySelectorAll<HTMLElement>('[data-place]').forEach(el => el.addEventListener('click', () => selectPlace(el.dataset.place as PlaceId)));
document.querySelectorAll<HTMLElement>('[data-hotspot]').forEach(el => el.addEventListener('click', () => { const id = el.dataset.hotspot as PlaceId; if (id === selected) openJournal(id); else selectPlace(id); }));
document.addEventListener('click', event => {
  const target = (event.target as Element).closest<HTMLElement>('[data-map-place]');
  if (target) { selectPlace(target.dataset.mapPlace as PlaceId); if (dialog.open) closeDialog(); }
});
document.addEventListener('keydown', event => {
  const target = (event.target as Element).closest<HTMLElement>('[data-map-place]');
  if (target && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); target.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
});

$('#walk-button').addEventListener('click', () => {
  if (!engine) return;
  engine.setMode(engine.mode === 'walk' ? 'overview' : 'walk');
  document.body.classList.remove('places-open');
  if (engine.mode === 'walk') toast('已踏上小徑 · W A S D 移動，拖曳滑鼠環顧');
});
$('#tour-button').addEventListener('click', () => engine?.toggleTour());
$('#reset-button').addEventListener('click', () => { engine?.reset(); toast('回到這一站的初始視角'); });
$('#compass-button').addEventListener('click', () => engine?.reset());
$('#explore-nav').addEventListener('click', () => { if (dialog.open) closeDialog(); engine?.reset(); });
$('.brand').addEventListener('click', event => { event.preventDefault(); selectPlace('huashi'); engine?.reset(); });
$('#mobile-places-toggle').addEventListener('click', () => document.body.classList.toggle('places-open'));
$('#lock-button').addEventListener('click', async () => {
  try { await engine?.renderer.domElement.requestPointerLock(); toast('視角已鎖定 · 按 Esc 釋放滑鼠'); }
  catch { toast('目前環境無法鎖定滑鼠，仍可拖曳環顧四周'); }
});
for (const button of document.querySelectorAll<HTMLElement>('[data-move]')) {
  button.addEventListener('pointerdown', event => { event.preventDefault(); button.setPointerCapture(event.pointerId); engine?.setMoveKey(button.dataset.move!, true); });
  for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(eventName, () => engine?.setMoveKey(button.dataset.move!, false));
}

$('#sound-button').addEventListener('click', async () => {
  try {
    const enabled = await sound.toggle();
    $('#sound-button').innerHTML = `${icon(enabled ? 'audio-lines' : 'volume-x')}<span>${enabled ? '自然之聲' : '聽見自然'}</span>`;
    $('#sound-button').setAttribute('aria-pressed', String(enabled));
    $('#sound-button').setAttribute('aria-label', enabled ? '關閉自然環境音' : '開啟自然環境音');
    refreshIcons();
    toast(enabled ? '海浪與鳥鳴，陪你慢慢走' : '已關閉環境音');
  } catch { toast('音訊暫時無法開啟，請檢查瀏覽器的音訊權限'); }
});

function setTime(value: number) {
  engine?.setTime(value);
  const hours = Math.floor(value), minutes = Math.round((value - hours) * 60);
  $('#time-display').textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  $('#time-caption').textContent = value < 11 ? '清晨薄光' : value < 15 ? '午後暖陽' : value < 18 ? '黃昏微光' : '日落時分';
  $<HTMLInputElement>('#time-slider').value = String(value);
  document.querySelectorAll<HTMLElement>('[data-time]').forEach(el => el.classList.toggle('active', Number(el.dataset.time) === value));
}
$('#time-button').addEventListener('click', () => {
  $('#time-popover').hidden = !$('#time-popover').hidden;
  $('#time-button').setAttribute('aria-expanded', String(!$('#time-popover').hidden));
});
$<HTMLInputElement>('#time-slider').addEventListener('input', event => setTime(Number((event.target as HTMLInputElement).value)));
document.querySelectorAll<HTMLElement>('[data-time]').forEach(el => el.addEventListener('click', () => setTime(Number(el.dataset.time))));
document.addEventListener('pointerdown', event => {
  if (!(event.target as Element).closest('#time-button, #time-popover')) { $('#time-popover').hidden = true; $('#time-button').setAttribute('aria-expanded', 'false'); }
});

let mistValue = .35;
let leavesEnabled = true;
$('#atmosphere-button').addEventListener('click', () => {
  showDialog(`<span class="dialog-eyebrow">MAKE YOURSELF AT HOME</span><h2>今天，想要怎樣的風景？</h2><p class="dialog-intro">調一點海霧，留一點風聲。讓這段旅程更像你。</p><div class="setting-row"><div>${icon('wind')}<span>海霧濃度<small>朦朧遠山，柔和海天</small></span></div><input type="range" min="0" max="1" step=".05" value="${mistValue}" id="mist-slider" aria-label="海霧濃度"/></div><div class="setting-row"><div>${icon('leaf')}<span>風吹落葉<small>讓秋天在身邊輕輕流動</small></span></div><button id="leaves-toggle" class="switch ${leavesEnabled ? 'on' : ''}" role="switch" aria-checked="${leavesEnabled}" aria-label="風吹落葉"><span></span></button></div><div class="setting-row"><div>${icon('headphones')}<span>自然音量<small>${sound.enabled ? '海浪與遠處的鳥鳴' : '點選頁首「聽見自然」開啟'}</small></span></div><input type="range" min="0" max="1" step=".05" value="${sound.volume}" id="volume-slider" aria-label="自然音量"/></div><p class="dialog-footnote">這裡的時間與天氣，由你決定。</p>`, 'settings-dialog');
  $('#mist-slider').addEventListener('input', event => { mistValue = Number((event.target as HTMLInputElement).value); engine?.setMist(mistValue); });
  $('#volume-slider').addEventListener('input', event => sound.setVolume(Number((event.target as HTMLInputElement).value)));
  $('#leaves-toggle').addEventListener('click', event => {
    leavesEnabled = !leavesEnabled;
    engine?.setLeaves(leavesEnabled);
    (event.currentTarget as HTMLElement).classList.toggle('on', leavesEnabled);
    (event.currentTarget as HTMLElement).setAttribute('aria-checked', String(leavesEnabled));
  });
});

function toggleMap() {
  const map = $('#minimap');
  map.hidden = !map.hidden;
  $('#map-button').setAttribute('aria-pressed', String(!map.hidden));
}
$('#map-button').addEventListener('click', toggleMap);
$('#expand-map-button').addEventListener('click', () => {
  showDialog(`<span class="dialog-eyebrow">FIND YOUR OWN WAY</span><h2>每條小路，都通向風景。</h2><p class="dialog-intro">選一處喜歡的地方，從那裡開始。</p><div class="expanded-map">${mapSvg(true)}</div><div class="map-place-list">${places.map((p, i) => `<button data-map-place="${p.id}"><span>0${i + 1}</span>${p.name}${icon('arrow-up-right')}</button>`).join('')}</div><p class="dialog-footnote">虛擬景觀示意圖，空間與距離經過藝術化編排。</p>`, 'map-dialog');
});

$('#fullscreen-button').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await $('#app').requestFullscreen();
  } catch { toast('目前環境不支援全螢幕，可使用瀏覽器的全螢幕功能'); }
});
document.addEventListener('fullscreenchange', () => $('#fullscreen-button').setAttribute('aria-label', document.fullscreenElement ? '退出全螢幕' : '切換全螢幕'));

function openHelp() {
  showDialog(`<span class="dialog-eyebrow">A LITTLE GUIDE TO WANDERING</span><h2>自在一點，慢慢探索。</h2><p class="dialog-intro">用你習慣的方式，在山海之間漫遊。</p><div class="help-grid"><div><span class="help-key">${icon('mouse')}</span><strong>拖曳滑鼠</strong><p>自由視角旋轉觀景<br>步行模式環顧四周</p></div><div><span class="help-key keys-inline"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span><strong>前後左右移動</strong><p>也可以使用方向鍵<br>按住 Shift 加速</p></div><div><span class="help-key">${icon('mouse-pointer-2')}</span><strong>滾輪與升降</strong><p>滾輪拉近或拉遠<br>自由視角 Q 下降、E 上升</p></div><div><span class="help-key keys-inline"><kbd>R</kbd><kbd>P</kbd><kbd>M</kbd></span><strong>隨手快捷鍵</strong><p>R 重置 · P 拍攝<br>M 地圖 · Esc 關閉視窗</p></div></div><div class="help-note">${icon('footprints')}<span>點選「開始漫遊」切換到步行視角。觸控裝置可拖曳環顧，使用畫面方向鍵移動。</span></div>`, 'help-dialog');
}
$('#help-button').addEventListener('click', openHelp);

type Postcard = { id: string; name: string; image: string; date: string };
let postcards: Postcard[] = [];
try {
  const parsed = JSON.parse(localStorage.getItem('badaguan-postcards') || '[]');
  if (Array.isArray(parsed)) postcards = parsed.filter(p => p && typeof p.id === 'string' && typeof p.date === 'string' && typeof p.name === 'string' && typeof p.image === 'string' && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(p.image)).slice(0, 6);
} catch { /* Browser storage is optional. */ }

function escapeHtml(text: string) { return text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!)); }

function openJournal(placeId: PlaceId = selected, tab: 'notes' | 'cards' = 'notes') {
  const place = places.find(p => p.id === placeId)!;
  showDialog(`<span class="dialog-eyebrow">NOTES FROM A SLOW JOURNEY</span><h2>把風景，寫進記憶裡。</h2><div class="journal-tabs"><button id="notes-tab" class="${tab === 'notes' ? 'active' : ''}">${icon('book-open')}沿途手記</button><button id="cards-tab" class="${tab === 'cards' ? 'active' : ''}">${icon('image')}我的明信片<span>${postcards.length.toString().padStart(2, '0')}</span></button></div>${tab === 'notes' ? `<div class="journal-place-tabs">${places.map(p => `<button data-note="${p.id}" class="${p.id === placeId ? 'active' : ''}">${p.name}</button>`).join('')}</div><div class="journal-photo"><img src="${document.querySelector<HTMLImageElement>(`[data-thumbnail="${placeId}"]`)?.src || ''}" alt="${place.name}虛擬景觀"/><span>${place.en}</span></div><div class="journal-heading"><h3>${place.name}</h3><span>${place.tag}</span></div><p class="journal-description">${place.description}</p><p class="journal-detail">${place.detail}</p><button class="text-button" id="visit-place">去這裡走走 ${icon('arrow-right')}</button>` : postcards.length ? `<div class="postcard-gallery">${postcards.map(p => `<button class="saved-postcard" data-card-id="${escapeHtml(p.id)}"><img src="${p.image}" alt="${escapeHtml(p.name)}明信片"/><span>${escapeHtml(p.name)}<small>${escapeHtml(p.date)}</small></span></button>`).join('')}</div><p class="dialog-footnote">明信片保存在這台裝置的瀏覽器中，最多收藏 6 張。</p>` : `<div class="empty-cards">${icon('camera')}<h3>有些風景，值得留下。</h3><p>點選畫面右側的相機，<br>寄一張八大關的明信片給自己。</p><button class="primary-button" id="first-postcard">拍下此刻 ${icon('arrow-right')}</button></div>`}`, 'journal-dialog');
  $('#notes-tab').addEventListener('click', () => openJournal(placeId, 'notes'));
  $('#cards-tab').addEventListener('click', () => openJournal(placeId, 'cards'));
  document.querySelectorAll<HTMLElement>('[data-note]').forEach(el => el.addEventListener('click', () => openJournal(el.dataset.note as PlaceId)));
  document.querySelector('#visit-place')?.addEventListener('click', () => { closeDialog(); selectPlace(placeId); });
  document.querySelector('#first-postcard')?.addEventListener('click', () => { closeDialog(); capturePostcard(); });
  document.querySelectorAll<HTMLElement>('[data-card-id]').forEach(el => el.addEventListener('click', () => showPostcard(postcards.find(p => p.id === el.dataset.cardId)!, true)));
}
$('#journal-nav').addEventListener('click', () => openJournal());
$('#place-detail-button').addEventListener('click', () => openJournal());

$('#about-nav').addEventListener('click', () => showDialog(`<span class="dialog-eyebrow">A PLACE BETWEEN TREES & SEA</span><h2>紅瓦綠樹，碧海藍天。</h2><p class="about-lead">八大關的美，藏在不經意的轉角。</p><p class="journal-detail">青島八大關位於太平角與匯泉角之間，以關隘命名的街道、各具風格的近代別墅，以及不同樹種構成的林蔭路聞名。建築、庭院與海岸在這裡相互依偎，形成安靜而舒展的街區氣質。</p><div class="about-features"><span>${icon('leaf')}一關一樹</span><span>${icon('map-pin')}萬國建築</span><span>${icon('waves')}山海相依</span></div><p class="journal-detail">這是一幅可以走進去的八大關秋日印象。建築輪廓、材料、植被與海岸特徵參考實景；道路距離、建築尺度與地形為方便漫遊而重新編排，並非一比一測繪復原。海浪與鳥鳴為合成的環境音。</p><div class="source-links"><span>認識真實的八大關</span><a href="https://www.qingdao.gov.cn/yfqd/qdwl/cjfw/wyqtsjd/202009/t20200910_521991.shtml" target="_blank" rel="noopener noreferrer">青島政務網 · 八大關風景區 ${icon('arrow-up-right')}</a><a href="https://www.qdcfjt.com/index.php/building/detail/69.html" target="_blank" rel="noopener noreferrer">青島城市發展集團 · 花石樓 ${icon('arrow-up-right')}</a><a href="https://www.dailyqd.com/channelzt/2020-09/02/content_521220.htm" target="_blank" rel="noopener noreferrer">青島日報 · 八大關的城市肌理 ${icon('arrow-up-right')}</a></div><p class="dialog-footnote">願這一段虛擬漫遊，成為下一次真實出發的起點。</p>`, 'about-dialog'));

let capturing = false;
async function capturePostcard() {
  if (!engine || capturing) return;
  capturing = true;
  try {
    const image = new window.Image();
    image.src = engine.capture();
    await image.decode();
    const canvas = document.createElement('canvas');
    const width = Math.min(1600, image.naturalWidth);
    const height = Math.round(width * image.naturalHeight / image.naturalWidth);
    canvas.width = width + 64; canvas.height = height + 148;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#f6f4e9'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 32, 32, width, height);
    const place = places.find(p => p.id === selected)!;
    ctx.fillStyle = '#355446';
    ctx.font = '28px "Journey Serif", serif';
    ctx.fillText(`青島八大關 · ${place.name}`, 36, height + 84);
    ctx.fillStyle = '#8c8c78'; ctx.font = '11px sans-serif';
    ctx.fillText('A SLOW JOURNEY  /  A MOMENT TO KEEP', 37, height + 111);
    ctx.textAlign = 'right'; ctx.fillText($('#time-display').textContent! + '  ·  AUTUMN IN QINGDAO', width + 28, height + 108);
    const postcard = { id: Date.now().toString(36), name: place.name, image: canvas.toDataURL('image/jpeg', .88), date: new Date().toLocaleDateString('zh-TW') };
    showPostcard(postcard);
  } catch { toast('暫時無法拍攝，請稍後再試'); }
  finally { capturing = false; }
}

function showPostcard(postcard: Postcard, saved = false) {
  showDialog(`<span class="dialog-eyebrow">A MOMENT TO KEEP</span><h2>把這一刻，帶回去。</h2><div class="postcard-preview"><img src="${postcard.image}" alt="青島八大關 · ${escapeHtml(postcard.name)}明信片"/></div><div class="postcard-actions"><button class="secondary-button" id="save-postcard" ${saved ? 'disabled' : ''}>${icon(saved ? 'check' : 'image')}<span>${saved ? '已收藏' : '收藏到手記'}</span></button><button class="primary-button" id="download-postcard">${icon('download')}下載明信片</button></div><p class="dialog-footnote">一張明信片，留住山海間的片刻。</p>`, 'postcard-dialog');
  $('#download-postcard').addEventListener('click', () => {
    const link = document.createElement('a'); link.href = postcard.image; link.download = `青島八大關-${postcard.name}-${postcard.id}.jpg`; link.click(); toast('明信片已準備下載');
  });
  $('#save-postcard').addEventListener('click', () => {
    const next = [postcard, ...postcards.filter(p => p.id !== postcard.id)].slice(0, 6);
    try { localStorage.setItem('badaguan-postcards', JSON.stringify(next)); postcards = next; toast('已收藏到「漫遊手記」'); }
    catch { postcards = next; toast('已暫存於本次旅程；建議下載以永久保留'); }
    $<HTMLButtonElement>('#save-postcard').disabled = true;
    $('#save-postcard').innerHTML = `${icon('check')}<span>已收藏</span>`;
    refreshIcons();
  });
}
$('#capture-button').addEventListener('click', capturePostcard);

document.addEventListener('keydown', event => {
  if (dialog.open || (event.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(event.target.tagName))) return;
  if (event.code === 'KeyP') { event.preventDefault(); capturePostcard(); }
  if (event.code === 'KeyM') toggleMap();
  if (event.key === '?') openHelp();
});

requestAnimationFrame(() => setTimeout(() => {
  try {
    engine = new Landscape($('#scene'), {
      onReady: () => {
        $('#loading-screen').classList.add('loaded');
        let i = 0;
        function nextThumbnail() {
          if (i >= places.length || !engine) return;
          const place = places[i++];
          const image = document.querySelector<HTMLImageElement>(`[data-thumbnail="${place.id}"]`)!;
          image.src = engine.thumbnail(place.id);
          image.classList.add('ready');
          requestAnimationFrame(nextThumbnail);
        }
        requestAnimationFrame(nextThumbnail);
      },
      onMode: mode => {
        $('#view-mode-label').textContent = mode === 'walk' ? '步行漫遊' : '自由探索';
        $('#walk-button').innerHTML = `${icon(mode === 'walk' ? 'compass' : 'footprints')}<span>${mode === 'walk' ? '返回自由視角' : '開始漫遊'}</span>${icon('arrow-right')}`;
        $('#lock-button').hidden = mode !== 'walk';
        document.body.classList.toggle('walking', mode === 'walk');
        refreshIcons();
      },
      onTour: (active, index) => {
        $('#tour-button').innerHTML = `${icon(active ? 'pause' : 'play')}<span>${active ? '暫停，停在這一刻' : '跟隨鏡頭，慢遊八大關'}</span><span class="tour-duration">${active ? '導覽中' : '約 1 分鐘'}</span>`;
        $('#tour-button').classList.toggle('tour-active', active);
        $('#view-mode-label').textContent = active ? '慢遊導覽中' : engine?.mode === 'walk' ? '步行漫遊' : '自由探索';
        if (active && index !== undefined) selectPlace(places[index].id, false);
        refreshIcons();
      },
      onFrame: (position, direction, projected) => {
        for (const p of projected) {
          const element = document.querySelector<HTMLElement>(`[data-hotspot="${p.id}"]`)!;
          element.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -100%)`;
          element.style.visibility = p.visible ? 'visible' : 'hidden';
        }
        const angle = Math.atan2(direction.x, -direction.z) * 180 / Math.PI;
        $('#compass-needle').style.transform = `rotate(${-angle}deg)`;
        document.querySelectorAll('[data-player]').forEach(el => el.setAttribute('transform', `translate(${Math.max(6, Math.min(234, (position.x + 180) / 280 * 240))},${Math.max(7, Math.min(169, (position.z + 240) / 450 * 176))}) rotate(${angle})`));
      },
    });
  } catch (error) {
    console.error('Landscape initialization failed:', error);
    $('#loading-screen').innerHTML = `${icon('compass')}<h2>風景暫時無法展開</h2><p>請使用支援 WebGL 2 的瀏覽器，<br>並確認已開啟硬體加速。</p><button class="primary-button" id="retry-scene">重新載入 ${icon('rotate-ccw')}</button>`;
    $('#retry-scene').addEventListener('click', () => location.reload());
    refreshIcons();
  }
}, 60));
