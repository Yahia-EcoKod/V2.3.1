// Главное меню: 3D-герой на полянке. Стрелки и клавиши меняют героя, палец вращает его,
// касание включает «номер» (анимацию), «Играть» ведёт к выбору раздела.
import { makeScreenRoot } from '../ui.js';
import { setCameraMode } from '../cameraRig.js';
import { state } from '../state.js';
import { HEROES, SHOW_FIRST_DELAY, SHOW_EVERY, MENU_SPIN_SPEED, MENU_SPIN_BACK_DELAY, MENU_SWITCH_TIME } from '../config.js';
import { playMusic, isMusicOn, setMusicOn } from '../audio.js';

const SLIDE_DIST = 3.2;   // с какого расстояния по бокам герои выезжают и куда уезжают
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

export function createMainMenuScreen(ctx) {
  const dots = HEROES.map(() => '<span class="dot"></span>').join('');
  const s = makeScreenRoot(`
    <button class="arrow sound" id="music" aria-label="Звук"><span class="ic"></span></button>
    <button class="arrow side left" id="prev" aria-label="Предыдущий герой"><span class="ic ic-caret-left"></span></button>
    <button class="arrow side right" id="next" aria-label="Следующий герой"><span class="ic ic-caret-right"></span></button>
    <div class="spacer"></div>
    <div class="heroName" id="heroName"></div>
    <div class="dots">${dots}</div>
    <button class="btn play" id="play">Играть</button>
  `, 'overlay');

  let current = null;    // герой, который сейчас стоит на сцене
  let leaving = null;    // герой, который уходит со сцены при смене
  let slide = 1;         // 0..1: как далеко зашла смена героя
  let slideDir = 1;      // 1: новый герой приезжает справа, -1: слева
  let spin = 0;          // поворот героя в радианах (0 = лицом к игроку)
  let spinIdle = 0;      // сколько секунд прошло с последнего движения пальцем
  let dragging = false;  // тянут ли героя пальцем прямо сейчас
  let showTimer = 0;     // через сколько секунд герой покажет следующий «номер»
  let showIdx = 0;       // какой «номер» из списка героя играем

  // Герой показывает следующую анимацию из своего списка (HEROES[...].show в config.js)
  function playNext() {
    if (!current) return;
    const list = HEROES[state.heroIndex].show || [];
    if (!list.length) return;
    current.playOnce(list[showIdx % list.length], 0.2);
    showIdx++;
    showTimer = SHOW_EVERY;
  }

  function show(index, dir) {
    if (leaving) ctx.scene.remove(leaving.root);   // прошлая смена ещё не закончилась
    leaving = current;
    state.heroIndex = index;
    current = ctx.heroes[index];
    current.setPose('idle');
    ctx.scene.add(current.root);
    slide = leaving ? 0 : 1;
    slideDir = dir;
    spin = 0;
    spinIdle = 0;
    showTimer = SHOW_FIRST_DELAY;
    showIdx = Math.floor(Math.random() * 3);   // каждый раз начинаем с разного «номера»
    s.$('#heroName').textContent = current.name;
    s.root.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('on', i === index));
  }
  function change(d) {
    const n = ctx.heroes.length;
    show((state.heroIndex + d + n) % n, d);
  }

  s.$('#prev').addEventListener('click', () => change(-1));
  s.$('#next').addEventListener('click', () => change(1));
  s.$('#play').addEventListener('click', () => ctx.goTo('section'));
  const soundIcon = s.$('#music .ic');
  const showSoundIcon = () => { soundIcon.className = 'ic ' + (isMusicOn() ? 'ic-speaker-high' : 'ic-speaker-slash'); };
  s.$('#music').addEventListener('click', () => { setMusicOn(!isMusicOn()); showSoundIcon(); });
  showSoundIcon();

  return {
    enter() {
      ctx.menuStage.show();
      setCameraMode(ctx.camera, 'menu');
      playMusic('menu');
      show(state.heroIndex, 1);
      s.show();
      ctx.input.setHandlers({
        drag: (dx) => { dragging = true; spin += dx * MENU_SPIN_SPEED; spinIdle = 0; },
        dragEnd: () => { dragging = false; },
        tap: () => playNext(),         // касание: герой показывает новый «номер»
        key: (dir) => change(dir),
      });
    },
    exit() {
      ctx.input.clear();
      if (current) ctx.scene.remove(current.root);
      if (leaving) ctx.scene.remove(leaving.root);
      current = leaving = null;
      dragging = false;
      ctx.menuStage.hide();
      s.hide();
    },
    update(dt) {
      if (!current) return;
      current.mixer.update(dt);
      showTimer -= dt;
      if (showTimer <= 0) playNext();

      // Смена героя: старый уезжает в сторону, новый приезжает с другой
      if (slide < 1) slide = Math.min(1, slide + dt / MENU_SWITCH_TIME);
      const k = easeOut(slide);
      current.root.position.x = slideDir * SLIDE_DIST * (1 - k);
      if (leaving) {
        leaving.mixer.update(dt);
        leaving.root.position.x = -slideDir * SLIDE_DIST * k;
        if (slide >= 1) { ctx.scene.remove(leaving.root); leaving = null; }
      }

      // Вращение: после паузы герой плавно возвращается лицом к игроку по кратчайшему пути
      if (!dragging) {
        spinIdle += dt;
        if (spinIdle > MENU_SPIN_BACK_DELAY && spin !== 0) {
          const wrapped = Math.atan2(Math.sin(spin), Math.cos(spin));
          spin = Math.abs(wrapped) < 0.002 ? 0 : wrapped * Math.exp(-4 * dt);
        }
      }
      current.root.rotation.y = spin;
    },
  };
}
