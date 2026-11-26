// Юный Эколог — точка входа. Здесь собирается сцена и переключаются экраны.
// Каждый экран лежит в своём файле в папке screens.
import * as THREE from 'three';
import { SKY_HORIZON, MAX_FRAME_ASPECT } from './config.js';
import { applyCamera } from './cameraRig.js';
import { createInput } from './input.js';
import { createWorld } from './world.js';
import { createMenuStage } from './menuStage.js';
import { createSky } from './sky.js';
import { createMood } from './mood.js';
import { createForest } from './forest.js';
import { loadHeroes } from './heroes.js';
import { loadSounds } from './audio.js';
import { loadQuestions } from './questions.js';
import { createLoadingScreen } from './screens/loading.js';
import { createTapScreen } from './screens/tap.js';
import { createMainMenuScreen } from './screens/mainMenu.js';
import { createSectionSelectScreen } from './screens/sectionSelect.js';
import { createGameScreen } from './screens/game.js';

const params = new URLSearchParams(location.search);
const SHOW_DEBUG = params.get('debug') === '1'; // счётчик FPS виден только по ссылке с ?debug=1

const frame = document.getElementById('frame');
const canvas = document.getElementById('game');
const debugEl = document.getElementById('debug');
if (!SHOW_DEBUG) debugEl.style.display = 'none';

// ---------- Сцена ----------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75)); // ограничение разрешения
renderer.shadowMap.enabled = false;                                    // настоящих теней нет

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(SKY_HORIZON, 28, 90);   // вдали всё растворяется в цвет горизонта
const sky = createSky(scene);
const hemi = new THREE.HemisphereLight(0xe3f4ff, 0x9bd37a, 1.5);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0cf, 1.5);
sun.position.set(-4, 10, 6);
scene.add(sun);

const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 120);

// Игровое окно: на телефоне занимает весь экран, на широком экране — узкая колонка по центру
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  const fw = Math.min(w, Math.round(h * MAX_FRAME_ASPECT));
  frame.style.width = fw + 'px';
  frame.style.height = h + 'px';
  renderer.setSize(fw, h, false);
  camera.aspect = fw / h;
  applyCamera(camera);
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 200));
resize();

// ---------- Общие части для экранов ----------
const ctx = {
  scene, camera,
  world: createWorld(scene),
  menuStage: createMenuStage(scene),
  mood: createMood(scene, { hemi, sun }, sky),   // серый мир при ошибке
  forest: createForest(scene),              // растущий лес
  input: createInput(canvas),
  heroes: [],
  questions: [],
  goTo: (name) => goTo(name),
};

const loading = createLoadingScreen();
const screens = {};
let active = null;

function goTo(name) {
  if (active) active.exit();
  active = screens[name];
  active.enter();
}

// ---------- Главный цикл ----------
const clock = new THREE.Clock();
let fpsTime = 0, fpsFrames = 0;

function frameLoop() {
  requestAnimationFrame(frameLoop);
  const dt = Math.min(clock.getDelta(), 0.1); // защита от «скачка» после паузы
  if (active && active.update) active.update(dt);
  renderer.render(scene, camera);

  if (SHOW_DEBUG) {
    fpsTime += dt; fpsFrames++;
    if (fpsTime >= 0.5) {
      debugEl.textContent = `FPS ${Math.round(fpsFrames / fpsTime)}`;
      fpsTime = 0; fpsFrames = 0;
    }
  }
}

// ---------- Запуск ----------
async function start() {
  if (location.protocol === 'file:') {
    loading.showError('Откройте игру по ссылке (из интернета), а не двойным щелчком по файлу.');
    return;
  }
  try {
    ctx.heroes = await loadHeroes((p) => loading.setProgress(p * 0.85));   // 85% полоски: модели героев
    await loadSounds((p) => loading.setProgress(0.85 + p * 0.15));        // 15%: короткие звуки
  } catch (err) {
    console.error(err);
    loading.showError('Проверьте интернет и обновите страницу.');
    return;
  }
  try {
    ctx.questions = await loadQuestions();
  } catch (err) {
    console.error(err);
    loading.showError('Не удалось прочитать вопросы (data/questions.json).');
    return;
  }
  screens.tap = createTapScreen(ctx);
  screens.hero = createMainMenuScreen(ctx);   // ключ 'hero' = главное меню (так его вызывают tap.js и game.js)
  screens.section = createSectionSelectScreen(ctx);
  screens.game = createGameScreen(ctx);

  loading.hide();
  clock.getDelta();
  frameLoop();
  goTo('tap');
}
start();
