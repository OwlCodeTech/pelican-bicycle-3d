import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

import { createBicycle } from './bicycle.js';
import { createPelican } from './pelican.js';
import { createCoastalWorld } from './world.js';
import { CoastalAudioEngine } from './audio.js';

// === Curated Coastal Lighting & Atmosphere Presets ===
const MOODS = {
  golden: {
    name: '黄金落日',
    skyTop: new THREE.Color('#27678c'),
    skyMid: new THREE.Color('#f09d5e'),
    skyHorizon: new THREE.Color('#ffda9e'),
    sunColor: new THREE.Color('#ffdfb0'),
    sunDir: new THREE.Vector3(-0.55, 0.24, -0.80).normalize(),
    sunIntensity: 2.8,
    hemiSky: new THREE.Color('#ffdcb5'),
    hemiGround: new THREE.Color('#2c5e68'),
    hemiIntensity: 1.05,
    fogColor: new THREE.Color('#f6c493'),
    deepWater: new THREE.Color('#0c4c6e'),
    shallowWater: new THREE.Color('#19959e'),
    cloudColor: new THREE.Color('#fff2dc'),
    moteColor: new THREE.Color('#ffe2a0'),
    bloomStrength: 0.28,
    exposure: 1.08,
    nightMix: 0.0
  },
  noon: {
    name: '晴朗正午',
    skyTop: new THREE.Color('#0284c7'),
    skyMid: new THREE.Color('#67c8f5'),
    skyHorizon: new THREE.Color('#d9f4ff'),
    sunColor: new THREE.Color('#fffef2'),
    sunDir: new THREE.Vector3(-0.32, 0.78, -0.54).normalize(),
    sunIntensity: 3.1,
    hemiSky: new THREE.Color('#e0f7ff'),
    hemiGround: new THREE.Color('#1e7a8c'),
    hemiIntensity: 1.25,
    fogColor: new THREE.Color('#bfe9fa'),
    deepWater: new THREE.Color('#0369a1'),
    shallowWater: new THREE.Color('#14b8a6'),
    cloudColor: new THREE.Color('#ffffff'),
    moteColor: new THREE.Color('#e0f2fe'),
    bloomStrength: 0.16,
    exposure: 1.04,
    nightMix: 0.0
  },
  sunset: {
    name: '瑰丽晚霞',
    skyTop: new THREE.Color('#2d1b4e'),
    skyMid: new THREE.Color('#c84b6b'),
    skyHorizon: new THREE.Color('#ff9a62'),
    sunColor: new THREE.Color('#ff9166'),
    sunDir: new THREE.Vector3(-0.62, 0.10, -0.78).normalize(),
    sunIntensity: 2.35,
    hemiSky: new THREE.Color('#f7968a'),
    hemiGround: new THREE.Color('#2a2346'),
    hemiIntensity: 0.9,
    fogColor: new THREE.Color('#d47575'),
    deepWater: new THREE.Color('#1e1e48'),
    shallowWater: new THREE.Color('#4f477a'),
    cloudColor: new THREE.Color('#ffb39e'),
    moteColor: new THREE.Color('#fda4af'),
    bloomStrength: 0.42,
    exposure: 1.02,
    nightMix: 0.35
  },
  night: {
    name: '星夜灯塔',
    skyTop: new THREE.Color('#050a18'),
    skyMid: new THREE.Color('#0f1d38'),
    skyHorizon: new THREE.Color('#1e3254'),
    sunColor: new THREE.Color('#9ec5ff'),
    sunDir: new THREE.Vector3(-0.45, 0.42, -0.78).normalize(),
    sunIntensity: 0.85,
    hemiSky: new THREE.Color('#4b6ba8'),
    hemiGround: new THREE.Color('#0c1729'),
    hemiIntensity: 0.65,
    fogColor: new THREE.Color('#14233d'),
    deepWater: new THREE.Color('#051226'),
    shallowWater: new THREE.Color('#0d3152'),
    cloudColor: new THREE.Color('#2b3e5e'),
    moteColor: new THREE.Color('#bae6fd'),
    bloomStrength: 0.62,
    exposure: 1.05,
    nightMix: 1.0
  }
};

// === Splash Screen Progress ===
const splashEl = document.getElementById('splash');
const splashProg = document.getElementById('splash-progress');
const splashStatus = document.getElementById('splash-status');
const btnEnter = document.getElementById('btn-enter');

function setProgress(pct, text) {
  if (splashProg) splashProg.style.width = `${pct}%`;
  if (splashStatus && text) splashStatus.textContent = text;
}

setProgress(30, '初始化 WebGL 渲染管线与 PBR 环境反射...');

// === Renderer & Scene Setup ===
const container = document.getElementById('canvas-root');
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: true // Enables crisp instant 3D Postcard Snapshot!
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = MOODS.golden.exposure;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(MOODS.golden.fogColor.getHex(), 35, 195);

// Procedural PBR IBL Environment for realistic chrome, brass, clearcoat teal frame & glass!
const pmremGen = new THREE.PMREMGenerator(renderer);
const envTex = pmremGen.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environment = envTex;
scene.environmentIntensity = 0.68;

// Camera & OrbitControls
const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 400);
camera.position.set(3.4, 2.05, 2.55);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 1.1;
controls.maxDistance = 14;
controls.maxPolarAngle = Math.PI * 0.495;
controls.target.set(0, 1.15, 0);

// === Post-Processing Composer (Bloom + Output ToneMapping) ===
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  MOODS.golden.bloomStrength,
  0.45,
  0.78
);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

// === Lighting Rig ===
const hemiLight = new THREE.HemisphereLight(MOODS.golden.hemiSky, MOODS.golden.hemiGround, MOODS.golden.hemiIntensity);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(MOODS.golden.sunColor, MOODS.golden.sunIntensity);
sunLight.position.copy(MOODS.golden.sunDir).multiplyScalar(28);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.near = 2;
sunLight.shadow.camera.far = 75;
sunLight.shadow.camera.left = -9;
sunLight.shadow.camera.right = 9;
sunLight.shadow.camera.top = 9;
sunLight.shadow.camera.bottom = -9;
sunLight.shadow.bias = -0.0005;
scene.add(sunLight);

// Subtle warm rim fill light to keep pelican feathers sculptural from every angle
const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.42);
rimLight.position.set(10, 8, 12);
scene.add(rimLight);

setProgress(62, '装配海沫绿复古自行车、2-Bone IK 鹈鹕与 GLSL 海岸...');

// === Build 3D World, Bicycle & Articulated Pelican ===
const world = createCoastalWorld(scene);
const bicycle = createBicycle();
const pelican = createPelican();
bicycle.bikeBody.add(pelican.group);
scene.add(bicycle.root);

// Procedural Web Audio Engine
const audio = new CoastalAudioEngine();

setProgress(100, '准备就绪 — 欢迎来到鹈鹕海岸骑行俱乐部！');
if (btnEnter) btnEnter.classList.remove('hidden');

// Auto-dismiss splash after a short moment (or immediately on click) so visitors see the live 3D scene swiftly!
let splashDismissed = false;
function dismissSplash(enableAudio = false) {
  if (splashDismissed) return;
  splashDismissed = true;
  if (splashEl) splashEl.classList.add('fade-out');
  if (enableAudio && !audio.enabled) {
    toggleSound(true);
  }
}
if (btnEnter) btnEnter.addEventListener('click', () => dismissSplash(true));
setTimeout(() => dismissSplash(false), 1800);

// === Interactive State ===
let targetMoodKey = 'golden';
const activeMood = {
  skyTop: MOODS.golden.skyTop.clone(),
  skyMid: MOODS.golden.skyMid.clone(),
  skyHorizon: MOODS.golden.skyHorizon.clone(),
  sunColor: MOODS.golden.sunColor.clone(),
  sunDir: MOODS.golden.sunDir.clone(),
  sunIntensity: MOODS.golden.sunIntensity,
  hemiSky: MOODS.golden.hemiSky.clone(),
  hemiGround: MOODS.golden.hemiGround.clone(),
  hemiIntensity: MOODS.golden.hemiIntensity,
  fogColor: MOODS.golden.fogColor.clone(),
  deepWater: MOODS.golden.deepWater.clone(),
  shallowWater: MOODS.golden.shallowWater.clone(),
  cloudColor: MOODS.golden.cloudColor.clone(),
  moteColor: MOODS.golden.moteColor.clone(),
  bloomStrength: MOODS.golden.bloomStrength,
  exposure: MOODS.golden.exposure,
  nightMix: MOODS.golden.nightMix
};

let cameraMode = 'cinematic';
let baseSpeedKmh = 18;
let currentSpeedKmh = 18;
let distanceKm = 0;
let fishCaught = 0;

let steerInput = 0; // -1 (left) .. +1 (right)
let sliderSteer = 0;
let bikeX = 0;
let bikeRoll = 0;

let turboHeld = false;
let wheelieTimer = 0;
let wheeliePitch = 0;

const keys = { left: false, right: false, up: false, down: false };

// === Toast Helper ===
const toastEl = document.getElementById('toast');
let toastTimeout = null;
function showToast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toastEl.classList.remove('show'), 2100);
}

// === Actions ===
function doRingBell() {
  bicycle.triggerBell();
  pelican.triggerSquawk();
  world.startleSeagulls();
  audio.ringBell();
  showToast('🔔 叮铃铃！海鸥被清脆的车铃惊起飞翔');
}

function doTossFish() {
  const launched = world.launchFish(bikeX);
  if (launched) {
    audio.playSplash();
    showToast('🐟 一条银色飞鱼跃出浪花，鹈鹕正张大喉囊准备接住！');
  }
}

function doWheelie() {
  wheelieTimer = 1.65;
  audio.playWingFlap();
  pelican.triggerSquawk();
  showToast('🪽 帅气翘头展翅！感受海风托起羽翼');
}

function toggleSound(forceOn) {
  const next = typeof forceOn === 'boolean' ? forceOn : !audio.enabled;
  audio.setEnabled(next);
  const btn = document.getElementById('btn-sound');
  const w1 = document.getElementById('sound-wave-1');
  const w2 = document.getElementById('sound-wave-2');
  if (btn) {
    btn.classList.toggle('active', next);
    btn.setAttribute('aria-pressed', String(next));
  }
  if (w1) w1.setAttribute('opacity', next ? '1' : '0.3');
  if (w2) w2.setAttribute('opacity', next ? '1' : '0.3');
  if (next) showToast('🔊 已开启程序化海岸浪声与骑行音效');
}

function toggleMusic() {
  const next = !audio.musicEnabled;
  audio.setMusicEnabled(next);
  if (next && audio.enabled) {
    const btnS = document.getElementById('btn-sound');
    if (btnS) btnS.classList.add('active');
    const w1 = document.getElementById('sound-wave-1');
    const w2 = document.getElementById('sound-wave-2');
    if (w1) w1.setAttribute('opacity', '1');
    if (w2) w2.setAttribute('opacity', '1');
  }
  const btn = document.getElementById('btn-music');
  if (btn) {
    btn.classList.toggle('active', next);
    btn.setAttribute('aria-pressed', String(next));
  }
  showToast(next ? '🎵 已开启程序化日光海岸马林巴旋律' : '🎵 已暂停背景旋律');
}

// === Postcard Snapshot Generator ===
const modalEl = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalImg = document.getElementById('modal-img');
const modalDownload = document.getElementById('modal-download');

function openModal(title, src, filename) {
  modalTitle.textContent = title;
  modalImg.src = src;
  modalDownload.href = src;
  modalDownload.download = filename;
  modalEl.classList.remove('hidden');
}

function closeModal() {
  modalEl.classList.add('hidden');
}

function takePhotoPostcard() {
  // Render a fresh frame then composite a vintage coastal postcard stamp!
  composer.render();
  const srcCanvas = renderer.domElement;
  const out = document.createElement('canvas');
  out.width = srcCanvas.width;
  out.height = srcCanvas.height;
  const ctx = out.getContext('2d');
  ctx.drawImage(srcCanvas, 0, 0);

  // Subtle postcard frame & coastal club stamp
  const pad = Math.round(Math.min(out.width, out.height) * 0.025);
  ctx.strokeStyle = 'rgba(255, 248, 232, 0.78)';
  ctx.lineWidth = Math.max(4, pad * 0.35);
  ctx.strokeRect(pad, pad, out.width - pad * 2, out.height - pad * 2);

  const fontSize = Math.max(16, Math.round(out.height * 0.026));
  ctx.font = `700 ${fontSize}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255, 250, 238, 0.92)';
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = 10;
  ctx.fillText(
    `PELICAN CYCLE CLUB 3D  •  ${MOODS[targetMoodKey].name}  •  ${currentSpeedKmh.toFixed(1)} KM/H`,
    pad * 2,
    out.height - pad * 2
  );

  const dataUrl = out.toDataURL('image/png');
  openModal('3D 海岸骑行明信片', dataUrl, `pelican-cycle-club-${targetMoodKey}.png`);
  showToast('📸 已生成高清 3D 海岸明信片！');
}

// === UI Event Bindings ===
document.getElementById('act-bell')?.addEventListener('click', doRingBell);
document.getElementById('act-fish')?.addEventListener('click', doTossFish);
document.getElementById('act-wheelie')?.addEventListener('click', doWheelie);

const turboBtn = document.getElementById('act-turbo');
if (turboBtn) {
  const startTurbo = () => { turboHeld = true; turboBtn.classList.add('pressed'); };
  const stopTurbo = () => { turboHeld = false; turboBtn.classList.remove('pressed'); };
  turboBtn.addEventListener('pointerdown', startTurbo);
  window.addEventListener('pointerup', stopTurbo);
  turboBtn.addEventListener('pointerleave', stopTurbo);
}

document.getElementById('btn-sound')?.addEventListener('click', () => toggleSound());
document.getElementById('btn-music')?.addEventListener('click', toggleMusic);
document.getElementById('btn-photo')?.addEventListener('click', takePhotoPostcard);

const dockEl = document.getElementById('control-dock');
const togglePanelBtn = document.getElementById('btn-panel-toggle');
togglePanelBtn?.addEventListener('click', () => {
  const collapsed = dockEl.classList.toggle('collapsed');
  togglePanelBtn.classList.toggle('active', !collapsed);
});

document.getElementById('btn-poster-modal')?.addEventListener('click', () => {
  openModal('PELICAN CYCLE CLUB · AI 定制复古海岸海报', './poster.jpg', 'pelican-cycle-club-poster.jpg');
});
document.getElementById('modal-close')?.addEventListener('click', closeModal);
document.getElementById('modal-close-2')?.addEventListener('click', closeModal);
document.getElementById('modal-backdrop')?.addEventListener('click', closeModal);

// Camera mode chips
document.querySelectorAll('#camera-chips .chip').forEach((btn) => {
  btn.addEventListener('click', () => {
    cameraMode = btn.dataset.cam;
    document.querySelectorAll('#camera-chips .chip').forEach((b) => b.classList.toggle('active', b === btn));
    if (cameraMode === 'orbit') {
      showToast('🎥 自由轨道视角：拖拽旋转，滚轮缩放');
    }
  });
});

// Switch automatically to orbit mode if user manually drags the 3D canvas!
renderer.domElement.addEventListener('pointerdown', () => {
  if (cameraMode !== 'orbit') {
    cameraMode = 'orbit';
    document.querySelectorAll('#camera-chips .chip').forEach((b) => {
      b.classList.toggle('active', b.dataset.cam === 'orbit');
    });
  }
});

// Mood chips
const moodNameEl = document.getElementById('mood-name');
document.querySelectorAll('#mood-chips .mood-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    targetMoodKey = btn.dataset.mood;
    document.querySelectorAll('#mood-chips .mood-btn').forEach((b) => b.classList.toggle('active', b === btn));
    if (moodNameEl) moodNameEl.textContent = MOODS[targetMoodKey].name;
    showToast(`🌅 切换海岸天色：${MOODS[targetMoodKey].name}`);
  });
});

// Speed & Steer sliders
const speedSlider = document.getElementById('speed-slider');
const speedSliderVal = document.getElementById('speed-slider-val');
speedSlider?.addEventListener('input', (e) => {
  baseSpeedKmh = Number(e.target.value);
  if (speedSliderVal) speedSliderVal.textContent = `${baseSpeedKmh} km/h`;
});

const steerSlider = document.getElementById('steer-slider');
steerSlider?.addEventListener('input', (e) => {
  sliderSteer = Number(e.target.value) / 100;
});

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
  if (e.repeat && ['KeyB', 'KeyF', 'KeyE', 'KeyP', 'KeyM'].includes(e.code)) return;
  switch (e.code) {
    case 'KeyA': case 'ArrowLeft': keys.left = true; break;
    case 'KeyD': case 'ArrowRight': keys.right = true; break;
    case 'KeyW': case 'ArrowUp': keys.up = true; break;
    case 'KeyS': case 'ArrowDown': keys.down = true; break;
    case 'Space':
      e.preventDefault();
      turboHeld = true;
      turboBtn?.classList.add('pressed');
      break;
    case 'KeyB': doRingBell(); break;
    case 'KeyF': doTossFish(); break;
    case 'KeyE': doWheelie(); break;
    case 'KeyP': takePhotoPostcard(); break;
    case 'KeyM': toggleSound(); break;
    case 'Escape': closeModal(); break;
  }
});

window.addEventListener('keyup', (e) => {
  switch (e.code) {
    case 'KeyA': case 'ArrowLeft': keys.left = false; break;
    case 'KeyD': case 'ArrowRight': keys.right = false; break;
    case 'KeyW': case 'ArrowUp': keys.up = false; break;
    case 'KeyS': case 'ArrowDown': keys.down = false; break;
    case 'Space':
      turboHeld = false;
      turboBtn?.classList.remove('pressed');
      break;
  }
});

// Telemetry HUD DOM refs
const statSpeedEl = document.getElementById('stat-speed');
const statRpmEl = document.getElementById('stat-rpm');
const statDistEl = document.getElementById('stat-dist');
const statFishEl = document.getElementById('stat-fish');

// === Smooth Mood Interpolation ===
function updateAtmosphere(dt) {
  const m = MOODS[targetMoodKey];
  const k = Math.min(1, dt * 2.4);

  activeMood.skyTop.lerp(m.skyTop, k);
  activeMood.skyMid.lerp(m.skyMid, k);
  activeMood.skyHorizon.lerp(m.skyHorizon, k);
  activeMood.sunColor.lerp(m.sunColor, k);
  activeMood.sunDir.lerp(m.sunDir, k).normalize();
  activeMood.sunIntensity = THREE.MathUtils.lerp(activeMood.sunIntensity, m.sunIntensity, k);
  activeMood.hemiSky.lerp(m.hemiSky, k);
  activeMood.hemiGround.lerp(m.hemiGround, k);
  activeMood.hemiIntensity = THREE.MathUtils.lerp(activeMood.hemiIntensity, m.hemiIntensity, k);
  activeMood.fogColor.lerp(m.fogColor, k);
  activeMood.deepWater.lerp(m.deepWater, k);
  activeMood.shallowWater.lerp(m.shallowWater, k);
  activeMood.cloudColor.lerp(m.cloudColor, k);
  activeMood.moteColor.lerp(m.moteColor, k);
  activeMood.bloomStrength = THREE.MathUtils.lerp(activeMood.bloomStrength, m.bloomStrength, k);
  activeMood.exposure = THREE.MathUtils.lerp(activeMood.exposure, m.exposure, k);
  activeMood.nightMix = THREE.MathUtils.lerp(activeMood.nightMix, m.nightMix, k);

  // Apply to Sky Dome
  world.sky.uniforms.uTopColor.value.copy(activeMood.skyTop);
  world.sky.uniforms.uMidColor.value.copy(activeMood.skyMid);
  world.sky.uniforms.uHorizonColor.value.copy(activeMood.skyHorizon);
  world.sky.uniforms.uSunDir.value.copy(activeMood.sunDir);
  world.sky.uniforms.uSunColor.value.copy(activeMood.sunColor);
  world.sky.uniforms.uNightMix.value = activeMood.nightMix;

  // Apply to Ocean Water
  world.ocean.uniforms.uDeepColor.value.copy(activeMood.deepWater);
  world.ocean.uniforms.uShallowColor.value.copy(activeMood.shallowWater);
  world.ocean.uniforms.uSkyColor.value.copy(activeMood.skyHorizon);
  world.ocean.uniforms.uSunColor.value.copy(activeMood.sunColor);
  world.ocean.uniforms.uSunDir.value.copy(activeMood.sunDir);
  world.ocean.uniforms.uFogColor.value.copy(activeMood.fogColor);

  // Apply to Lights, Fog, Clouds & Postprocessing
  sunLight.color.copy(activeMood.sunColor);
  sunLight.intensity = activeMood.sunIntensity;
  sunLight.position.copy(activeMood.sunDir).multiplyScalar(28);
  hemiLight.color.copy(activeMood.hemiSky);
  hemiLight.groundColor.copy(activeMood.hemiGround);
  hemiLight.intensity = activeMood.hemiIntensity;
  scene.fog.color.copy(activeMood.fogColor);
  world.cloudMat.color.copy(activeMood.cloudColor);
  world.moteMat.color.copy(activeMood.moteColor);
  bloomPass.strength = activeMood.bloomStrength;
  renderer.toneMappingExposure = activeMood.exposure;
}

// === Camera Director ===
const desiredCamPos = new THREE.Vector3();
const desiredCamTarget = new THREE.Vector3();

function updateCamera(dt, time) {
  // Smooth turbo FOV punch
  const targetFov = turboHeld ? 55 : 46;
  if (Math.abs(camera.fov - targetFov) > 0.05) {
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, Math.min(1, dt * 6));
    camera.updateProjectionMatrix();
  }

  if (cameraMode === 'orbit') {
    controls.target.x = THREE.MathUtils.lerp(controls.target.x, bikeX, Math.min(1, dt * 5));
    controls.update();
    return;
  }

  if (cameraMode === 'cinematic') {
    const sweep = Math.sin(time * 0.24) * 0.85;
    const angle = 0.72 + sweep;
    const r = 3.95 + Math.cos(time * 0.19) * 0.45;
    desiredCamPos.set(
      bikeX + Math.sin(angle) * r,
      1.72 + Math.sin(time * 0.35) * 0.28,
      Math.cos(angle) * r - 0.1
    );
    desiredCamTarget.set(bikeX, 1.15, -0.2);
  } else if (cameraMode === 'side') {
    desiredCamPos.set(bikeX + 3.45, 1.48, 0.35);
    desiredCamTarget.set(bikeX, 1.02, -0.05);
  } else if (cameraMode === 'pedal') {
    desiredCamPos.set(bikeX + 1.52, 0.62, 0.48);
    desiredCamTarget.set(bikeX, 0.46, 0.14);
  } else if (cameraMode === 'pov') {
    desiredCamPos.set(bikeX, 2.02, 0.32);
    desiredCamTarget.set(bikeX + steerInput * 0.75, 1.45, -5.5);
  }

  const k = Math.min(1, dt * 4.5);
  camera.position.lerp(desiredCamPos, k);
  controls.target.lerp(desiredCamTarget, k);
  camera.lookAt(controls.target);
}

// === Main Animation Loop ===
const clock = new THREE.Clock();
const mouthWorldPos = new THREE.Vector3();
let hudAccum = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;

  // 1. Speed & Keyboard Acceleration
  if (keys.up) {
    baseSpeedKmh = Math.min(42, baseSpeedKmh + 16 * dt);
    if (speedSlider) speedSlider.value = String(Math.round(baseSpeedKmh));
    if (speedSliderVal) speedSliderVal.textContent = `${Math.round(baseSpeedKmh)} km/h`;
  }
  if (keys.down) {
    baseSpeedKmh = Math.max(0, baseSpeedKmh - 20 * dt);
    if (speedSlider) speedSlider.value = String(Math.round(baseSpeedKmh));
    if (speedSliderVal) speedSliderVal.textContent = `${Math.round(baseSpeedKmh)} km/h`;
  }

  const targetKmh = turboHeld ? Math.max(baseSpeedKmh + 18, 38) : baseSpeedKmh;
  currentSpeedKmh = THREE.MathUtils.lerp(currentSpeedKmh, targetKmh, Math.min(1, dt * 4.5));
  const speedMps = currentSpeedKmh / 3.6;
  distanceKm += (speedMps * dt) / 1000;

  // 2. Steering & Realistic Banking Lean across Pier Width
  const keySteer = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  const desiredSteer = keySteer !== 0 ? keySteer : sliderSteer;
  steerInput = THREE.MathUtils.lerp(steerInput, desiredSteer, Math.min(1, dt * 6));

  // Lateral movement across boardwalk (clamped safely inside guardrails!)
  const lateralVel = steerInput * Math.min(1, speedMps / 3.0) * 2.4;
  bikeX = THREE.MathUtils.clamp(bikeX + lateralVel * dt, -1.75, 1.75);
  // Subtle natural counter-lean when banking into a turn
  const edgeDamp = Math.abs(bikeX) > 1.68 ? 0.25 : 1.0;
  const targetRoll = -steerInput * 0.14 * edgeDamp * Math.min(1, speedMps / 4.0);
  bikeRoll = THREE.MathUtils.lerp(bikeRoll, targetRoll, Math.min(1, dt * 7));

  bicycle.root.position.x = bikeX;
  bicycle.root.rotation.z = bikeRoll;
  // Subtle yaw angle while carving across the pier
  bicycle.root.rotation.y = -steerInput * 0.08 * edgeDamp;

  // 3. Wheelie Spring Curve
  if (wheelieTimer > 0) {
    wheelieTimer = Math.max(0, wheelieTimer - dt);
  }
  const targetWheelie = wheelieTimer > 0
    ? Math.sin((wheelieTimer / 1.65) * Math.PI) * 0.34
    : (turboHeld ? 0.07 : 0);
  wheeliePitch = THREE.MathUtils.lerp(wheeliePitch, targetWheelie, Math.min(1, dt * 7));

  // 4. Update Atmosphere & Lighting Mood
  updateAtmosphere(dt);

  // 5. Update Bicycle Mechanics (Wheels, Chain, Pedals, Headlamp, Bell)
  const handlebarSteer = -steerInput * 0.26;
  bicycle.update(dt, speedMps, handlebarSteer, wheeliePitch, activeMood.nightMix, camera.position);

  // 6. Update Coastal World & Leaping Fish
  pelican.getMouthWorldPosition(mouthWorldPos);
  const fishTarget = world.update(
    dt,
    time,
    speedMps,
    activeMood.nightMix,
    turboHeld,
    mouthWorldPos,
    () => {
      fishCaught += 1;
      pelican.triggerGulp();
      audio.playGulp();
      if (statFishEl) statFishEl.textContent = String(fishCaught);
      showToast(`😋 精准接住！鹈鹕一口吞下飞鱼（已捕获 ${fishCaught} 条）`);
    }
  );

  // 7. Update Articulated Pelican (Exact 2-Bone IK Legs + Wings + Scarf + Beak)
  pelican.setFishTarget(fishTarget);
  pelican.update(
    dt,
    time,
    bicycle.getCrankAngle(),
    speedMps,
    bicycle.getPedalPositions(),
    bicycle.getGripPositions(),
    handlebarSteer,
    turboHeld,
    wheeliePitch / 0.34
  );

  // 8. Update Audio Soundscape
  audio.updateRide(currentSpeedKmh, bicycle.getCrankAngle(), turboHeld);

  // 9. Update Camera & Render Post-Processed Scene
  updateCamera(dt, time);
  composer.render();

  // 10. Update Telemetry HUD at ~10 Hz
  hudAccum += dt;
  if (hudAccum >= 0.1) {
    hudAccum = 0;
    const crankRpm = Math.round(((speedMps / bicycle.WHEEL_RADIUS) / 1.95) * (60 / (Math.PI * 2)));
    if (statSpeedEl) statSpeedEl.textContent = currentSpeedKmh.toFixed(1);
    if (statRpmEl) statRpmEl.textContent = String(crankRpm);
    if (statDistEl) statDistEl.textContent = distanceKm.toFixed(2);
  }
}

animate();

// === Responsive Resize ===
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
});
