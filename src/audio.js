// Звук: короткие звуки (через Web Audio, мгновенно) и музыка (обычный аудио-элемент, он не грузит память).
// Телефоны разрешают звук только после касания: «будим» его на экране «Нажми, чтобы начать» (unlockAudio).
import { SFX_FILES, MUSIC_FILES, MUSIC_VOLUME, SFX_VOLUME } from './config.js';

let ctx = null;            // звуковой «движок» браузера
let master = null;         // общий регулятор громкости звуков
const buffers = {};        // готовые звуки: имя -> данные
const KEY = 'ecolog_music_on';

// Чтобы звук был слышен на iPhone даже при выключенном «беззвучном» переключателе (новые версии iOS)
try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* не страшно */ }

function getCtx() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = SFX_VOLUME;
    master.connect(ctx.destination);
  } catch (e) { ctx = null; }
  return ctx;
}

export function unlockAudio() {
  const c = getCtx();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

// ---------- Короткие звуки ----------
function decode(c, data) {
  return new Promise((resolve, reject) => c.decodeAudioData(data, resolve, reject));
}

// Загружает все звуки заранее. Если какого-то файла нет, игра всё равно работает (просто без этого звука).
export async function loadSounds(onProgress) {
  const c = getCtx();
  const names = Object.keys(SFX_FILES);
  let done = 0;
  await Promise.all(names.map(async (name) => {
    try {
      if (!c) return;
      const res = await fetch(`assets/audio/sfx/${SFX_FILES[name]}.mp3`);
      if (!res.ok) throw new Error(res.status);
      buffers[name] = await decode(c, await res.arrayBuffer());
    } catch (e) {
      console.warn('Звук не загрузился:', SFX_FILES[name], e);
    }
    done++;
    if (onProgress) onProgress(done / names.length);
  }));
}

export function playSfx(name) {
  const c = ctx;
  const buf = buffers[name];
  if (!c || !buf) return;
  if (c.state === 'suspended') c.resume().catch(() => {});
  const src = c.createBufferSource();
  src.buffer = buf;
  src.connect(master);
  src.start(0);
}

// ---------- Музыка ----------
const music = new Audio();
music.loop = true;
music.preload = 'auto';
music.volume = MUSIC_VOLUME;

let wanted = null;   // какая музыка должна играть: 'menu', 'game' или null
let on = true;       // включена ли музыка кнопкой
try { on = localStorage.getItem(KEY) !== '0'; } catch (e) { /* без запоминания тоже можно */ }

function startWanted() {
  if (!wanted || !on) return;
  const src = `assets/audio/music/${MUSIC_FILES[wanted]}.mp3`;
  if (!music.src.endsWith(src)) music.src = src;
  if (music.paused) music.play().catch(() => {});
}

export function playMusic(name) {     // 'menu' или 'game'
  wanted = name;
  startWanted();
}
export function stopMusic() {
  wanted = null;
  music.pause();
}
export function isMusicOn() { return on; }
export function setMusicOn(value) {
  on = !!value;
  try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { /* не страшно */ }
  if (on) startWanted(); else music.pause();
}

// Если игру свернули или переключились на другую вкладку, музыка замолкает
document.addEventListener('visibilitychange', () => {
  if (document.hidden) music.pause(); else startWanted();
});

// Звук нажатия для любой кнопки в игре
document.addEventListener('pointerdown', (e) => {
  if (e.target.closest && e.target.closest('button')) playSfx('click');
});
