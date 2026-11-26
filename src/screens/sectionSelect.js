// Экран 4. Выбор раздела: вывеска, три карточки по классам и кнопка «Главная».
// Фон: лесная сцена главного меню без героя, размытая (класс blurred у холста), сверху лучи света и светлячки.
import { makeScreenRoot } from '../ui.js';
import { setCameraMode } from '../cameraRig.js';
import { state } from '../state.js';
import { SECTIONS } from '../config.js';
import { playMusic } from '../audio.js';

const canvas = document.getElementById('game');

// Общая фигура: листик (смотрит вправо от точки 0,0), им украшены карточки
const DEFS = `
  <svg class="defs" width="0" height="0" aria-hidden="true"><defs>
    <path id="leaf" d="M0 0 C8-15 30-15 40 0 C30 15 8 15 0 0Z M3 0 H34"/>
  </defs></svg>`;

// Деревянная вывеска на двух верёвках
const SIGN = `
  <svg viewBox="0 0 340 130" aria-hidden="true">
    <defs>
      <linearGradient id="board" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#63AE58"/><stop offset="1" stop-color="#357A3E"/></linearGradient>
      <pattern id="rope" width="12" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-20)"><rect width="12" height="9" fill="#9C6B3A"/><rect width="12" height="4" fill="#C9985F"/></pattern>
    </defs>
    <rect x="62" y="-300" width="14" height="326" rx="4" fill="url(#rope)" stroke="#5B3A1A" stroke-width="2"/>
    <rect x="264" y="-300" width="14" height="326" rx="4" fill="url(#rope)" stroke="#5B3A1A" stroke-width="2"/>
    <rect x="6" y="14" width="328" height="108" rx="26" fill="url(#board)" stroke="#24562E" stroke-width="5"/>
    <rect x="9" y="52" width="322" height="36" fill="#000" opacity=".07"/>
    <rect x="12" y="19" width="316" height="13" rx="6.5" fill="#fff" opacity=".22"/>
    <path d="M9 52 H331 M9 88 H331" stroke="#24562E" stroke-width="3" opacity=".6"/>
    <path d="M9 55 H331 M9 91 H331" stroke="#A9DB9C" stroke-width="2" opacity=".35"/>
    <path d="M30 40 q50-7 100 0 M190 40 q45 5 100 -2 M24 72 q60-6 110 1 M170 70 q60 6 130 -2 M40 106 q70-6 120 0 M210 108 q50-5 90 0" stroke="#24562E" stroke-width="2" fill="none" opacity=".35"/>
    <path d="M60 46 q40-4 80 0 M150 78 q50 4 90 -1" stroke="#CFF0B0" stroke-width="1.6" fill="none" opacity=".3"/>
    <ellipse cx="250" cy="70" rx="9" ry="5" fill="#24562E" opacity=".35"/><ellipse cx="250" cy="70" rx="4.5" ry="2.5" fill="#24562E" opacity=".4"/>
    <ellipse cx="96" cy="106" rx="7" ry="4" fill="#24562E" opacity=".3"/>
    <circle cx="69" cy="24" r="9" fill="#8B5E34" stroke="#5B3A1A" stroke-width="2"/><circle cx="66" cy="21" r="3" fill="#C9985F" opacity=".7"/>
    <circle cx="271" cy="24" r="9" fill="#8B5E34" stroke="#5B3A1A" stroke-width="2"/><circle cx="268" cy="21" r="3" fill="#C9985F" opacity=".7"/>
  </svg>`;

// Украшения карточек: золотые листики, листья-узор, золотой лавр
const leaf = (x, y, r, k = 1) => `<use href="#leaf" transform="translate(${x} ${y}) rotate(${r}) scale(${k})"/>`;
const gold = 'fill="#F7C148" stroke="#C98A1B" stroke-width="1.6"';
const DECOR = [
  `<svg class="deco tr" viewBox="0 0 80 56"><g ${gold}>${leaf(14, 6, 40, .8)}${leaf(40, 2, 12, .85)}</g></svg>
   <svg class="deco bl" viewBox="0 0 80 56"><g ${gold}>${leaf(66, 50, 220, .8)}${leaf(40, 54, 192, .85)}</g></svg>`,
  `<svg class="deco tr" viewBox="0 0 120 70"><g fill="none" stroke="#fff" stroke-width="2" opacity=".28">${leaf(112, 8, 150, 1.5)}${leaf(80, 4, 170, 1.1)}${leaf(100, 40, 130, 1)}</g></svg>
   <svg class="deco bl" viewBox="0 0 120 70"><g fill="none" stroke="#fff" stroke-width="2" opacity=".28">${leaf(8, 62, -30, 1.5)}${leaf(40, 66, -10, 1.1)}${leaf(20, 30, -50, 1)}</g></svg>`,
  `<svg class="deco tr" viewBox="0 0 90 60"><g ${gold}>${leaf(84, 10, 160, .9)}${leaf(72, 26, 130, .9)}${leaf(52, 4, 185, .8)}</g></svg>
   <svg class="deco bl" viewBox="0 0 90 60"><g ${gold}>${leaf(6, 50, -20, .9)}${leaf(18, 34, -50, .9)}${leaf(38, 56, 5, .8)}</g></svg>`,
];

export function createSectionSelectScreen(ctx) {
  const cards = SECTIONS.map((sec, i) => `
    <button class="card" data-id="${sec.id}">
      ${DECOR[i]}
      <span class="cardTitle">${sec.title}</span>
      <span class="cardName">${sec.name}</span>
    </button>`).join('');
  const s = makeScreenRoot(`
    ${DEFS}
    <div class="sign">${SIGN}<h2>Выбери<br>свой класс</h2></div>
    <div class="cards">${cards}</div>
    <button class="btn main small" id="home"><span class="ic ic-house"></span>Главная</button>
  `, 'overlay fx');

  s.root.querySelectorAll('.card').forEach((el) => {
    el.addEventListener('click', () => {
      state.section = el.dataset.id;
      ctx.goTo('game');
    });
  });
  s.$('#home').addEventListener('click', () => ctx.goTo('hero'));

  return {
    enter() {
      ctx.menuStage.show();
      setCameraMode(ctx.camera, 'menu');
      playMusic('menu');
      canvas.classList.add('blurred');
      s.show();
    },
    exit() { canvas.classList.remove('blurred'); ctx.menuStage.hide(); s.hide(); },
    update() {},
  };
}
