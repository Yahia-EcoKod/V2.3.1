// Экран 5. Игра: бег по дороге, семена, ограждения, дыры, ворота с заданиями, сердца и очки.
// Этап 5: красное/зелёное окно, растущий лес, серый мир при ошибке, экран конца игры.
// Этап 6: медаль и радость героя на победе, герой стоит спокойно на поражении.
import * as THREE from 'three';
import { makeScreenRoot } from '../ui.js';
import { setCameraMode } from '../cameraRig.js';
import { state } from '../state.js';
import {
  LANES, SPEED_START, SPEED_MAX, SPEED_GROWTH, LIVES, INVULN_TIME, SEED_POINTS,
  QUESTIONS_TO_WIN, GATE_EVERY_ROWS, CORRECT_POINTS, IMAGES_DIR,
  FEEDBACK_TIME, JOY_HOP_HEIGHT, JOY_HOP_SPEED,
} from '../config.js';
import { createTrack } from '../obstacles.js';
import { createGates } from '../gates.js';
import { pickQuestions, prepareQuestion, imagesOf } from '../questions.js';
import { preloadImages } from '../images.js';
import { createMedal } from '../medal.js';
import { playSfx, playMusic, stopMusic } from '../audio.js';

const HEART_PATH = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';
const heart = `<svg class="heart" viewBox="0 0 24 24" style="width:clamp(22px,6.4vw,28px);height:auto;margin:0 1px;"><path d="${HEART_PATH}" fill="#e53935"/></svg>`;
const SEED_ICON = '<svg viewBox="0 0 24 24" style="width:1.1em;height:1.1em"><ellipse cx="12" cy="12" rx="6.5" ry="9" fill="#f2b632" stroke="#b07a00" stroke-width="1.5"/></svg>';
const CHECK_ICON = '<svg viewBox="0 0 24 24" style="width:1.15em;height:1.15em"><circle cx="12" cy="12" r="10" fill="#7bd36a"/><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#1f4d2e" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
// Компактная «таблетка» для панели сверху
const PILL = 'display:flex;align-items:center;gap:6px;padding:4px 12px;border-radius:999px;background:rgba(20,60,35,.6);box-shadow:0 2px 6px rgba(0,0,0,.3);color:#fff;font-weight:800;font-size:clamp(16px,4.6vw,22px);line-height:1;';

// Цвета колонок. Зелёный и красный только для результата ответа, обычная рамка белая, выбранная жёлто-оранжевая.
const COL_BG = 'rgba(255,251,232,.95)';
const COL_BORDER = '#ffffff';
const COL_SELECTED = '#f2b632';
const COL_GOOD = ['#8fdc7a', '#2e9e44'];   // фон, рамка
const COL_BAD = ['#ff8a80', '#d32f2f'];

// Колонка с ответом внизу экрана (левая колонка = левая дорожка и т. д.)
const COL_STYLE = `position:relative;flex:1;min-width:0;min-height:84px;display:flex;align-items:center;justify-content:center;box-sizing:border-box;padding:6px;border-radius:16px;background:${COL_BG};border:4px solid ${COL_BORDER};box-shadow:0 3px 8px rgba(0,0,0,.35);font-weight:800;color:#24323f;font-size:clamp(15px,4.4vw,24px);line-height:1.1;text-align:center;overflow-wrap:anywhere;hyphens:auto;`;

// Значок в углу колонки: галочка или крестик
const BADGE_GOOD = '<svg viewBox="0 0 24 24" style="width:30px;height:30px;display:block"><circle cx="12" cy="12" r="11" fill="#2e9e44" stroke="#fff" stroke-width="1.5"/><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const BADGE_BAD = '<svg viewBox="0 0 24 24" style="width:30px;height:30px;display:block"><circle cx="12" cy="12" r="11" fill="#d32f2f" stroke="#fff" stroke-width="1.5"/><path d="M8 8l8 8M16 8l-8 8" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/></svg>';

export function createGameScreen(ctx) {
  const s = makeScreenRoot(`
    <div style="position:absolute;top:max(8px,env(safe-area-inset-top));left:10px;right:10px;display:flex;justify-content:space-between;align-items:center;pointer-events:none;">
      <div style="display:flex;gap:6px;">
        <div style="${PILL}">${SEED_ICON}<span id="score">0</span></div>
        <div style="${PILL}">${CHECK_ICON}<span id="progress">0/${QUESTIONS_TO_WIN}</span></div>
      </div>
      <div style="${PILL}padding:3px 8px;gap:0;">${heart.repeat(LIVES)}</div>
    </div>
    <div id="qbox" style="position:absolute;top:calc(max(8px,env(safe-area-inset-top)) + 46px);left:10px;right:10px;display:none;flex-direction:column;align-items:center;gap:6px;pointer-events:none;">
      <div id="qtext" style="font-size:clamp(17px,5vw,25px);font-weight:800;color:#fff;text-align:center;line-height:1.15;background:rgba(31,107,63,.85);padding:6px 12px;border-radius:16px;box-shadow:0 3px 8px rgba(0,0,0,.35);"></div>
      <img id="qimg" alt="" style="display:none;height:clamp(64px,13vh,110px);max-width:50%;object-fit:contain;border-radius:12px;border:3px solid #fff;background:#fffbe8;box-shadow:0 3px 8px rgba(0,0,0,.35);">
    </div>
    <div id="wait" style="position:absolute;top:42%;left:0;right:0;text-align:center;font-size:clamp(22px,6vw,30px);font-weight:800;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,.5);display:none;">Загрузка заданий…</div>
    <div id="cols" style="position:absolute;left:8px;right:8px;bottom:calc(env(safe-area-inset-bottom,0px) + 86px);display:none;gap:8px;pointer-events:none;">
      <div data-col style="${COL_STYLE}"></div>
      <div data-col style="${COL_STYLE}"></div>
      <div data-col style="${COL_STYLE}"></div>
    </div>
    <div class="spacer"></div>
    <p class="hint" id="hint">Свайп влево/вправо<br>или касание левой/правой половины</p>
    <div class="row"><button class="btn secondary small" id="home">Главная</button></div>
  `, 'overlay');
  const colEls = [...s.root.querySelectorAll('[data-col]')];

  // Экран конца игры (победа или поражение): герой стоит лицом к игроку, вокруг растёт лес,
  // внизу карточка с итогом и две кнопки.
  const over = makeScreenRoot(`
    <div style="width:min(92%,400px);box-sizing:border-box;margin-bottom:calc(env(safe-area-inset-bottom,0px) + 18px);padding:16px 18px 18px;border-radius:26px;background:linear-gradient(#3f9e4a,#1f6b3f);box-shadow:0 8px 24px rgba(0,0,0,.45);display:flex;flex-direction:column;align-items:center;gap:8px;">
      <h2 class="title" id="overTitle" style="margin:0;text-align:center;font-size:clamp(22px,6.4vw,30px);line-height:1.1;"></h2>
      <p class="big" id="overText" style="margin:0 0 6px;text-align:center;font-size:clamp(15px,4.2vw,19px);line-height:1.3;"></p>
      <div style="display:flex;gap:10px;width:100%;">
        <button class="btn" id="again" style="flex:1;min-width:0;padding:0 8px;font-size:clamp(18px,5.4vw,26px);">Ещё раз</button>
        <button class="btn secondary" id="home2" style="flex:1;min-width:0;padding:0 8px;font-size:clamp(18px,5.4vw,26px);">Главная</button>
      </div>
    </div>
  `, 'overlay');
  over.root.style.background = 'transparent';   // сцена с героем и лесом остаётся видна
  over.root.style.justifyContent = 'flex-end';
  over.root.style.alignItems = 'center';
  over.root.style.pointerEvents = 'auto';

  const track = createTrack(ctx.scene);
  const gates = createGates(ctx.scene);
  const medal = createMedal();
  let hero = null;
  let laneIndex = 1, heroX = 0, speed = SPEED_START, hintTimer = 0;
  let lives = LIVES, score = 0, invuln = 0, finished = false;
  let freeze = 0;       // пока больше нуля, герой играет Hit_B или Death_B, а мир стоит
  // задания
  let queue = [], gatesSpawned = 0, rowsSinceGate = 0, answered = 0, correctCount = 0;
  let shownGate = null, waiting = false, runToken = 0;
  // этап 5
  let feedback = 0;     // сколько ещё секунд показывать красное/зелёное внизу
  let ending = null;    // {won, t}: игра уже решена, ждём паузу перед экраном конца
  // этап 6
  let endWon = false, endTime = 0;   // победа ли на экране конца и сколько секунд он уже показан

  function renderHud() {
    s.$('#score').textContent = score;
    s.$('#progress').textContent = answered + '/' + (queue.length || QUESTIONS_TO_WIN);
    s.root.querySelectorAll('.heart path').forEach((p, i) => {
      p.setAttribute('fill', i < lives ? '#e53935' : '#9e9e9e');   // потерянное сердце серое
    });
  }

  // Подсветка колонки той дорожки, на которой стоит герой
  function markLane() {
    if (feedback > 0) return;   // пока показан результат, рамки не трогаем
    colEls.forEach((el, i) => { el.style.borderColor = i === laneIndex ? COL_SELECTED : COL_BORDER; });
  }

  function showGateUi(q) {
    s.$('#qtext').textContent = q.text;
    const qi = s.$('#qimg');
    if (q.image) { qi.src = IMAGES_DIR + q.image; qi.style.display = 'block'; }
    else { qi.removeAttribute('src'); qi.style.display = 'none'; }
    colEls.forEach((el, i) => {
      const opt = q.slots[i];
      el.replaceChildren();
      el.style.background = COL_BG;
      el.style.opacity = opt ? '1' : '.55';
      if (!opt) {
        el.textContent = '🚧';
      } else if (opt.type === 'image') {
        const im = document.createElement('img');
        im.src = IMAGES_DIR + opt.value; im.alt = '';
        im.style.cssText = 'max-width:100%;max-height:clamp(70px,15vh,120px);object-fit:contain;border-radius:8px;';
        el.appendChild(im);
      } else {
        el.textContent = opt.value;
      }
    });
    s.$('#qbox').style.display = 'flex';
    s.$('#cols').style.display = 'flex';
    s.$('#hint').style.opacity = '0';
    markLane();
  }
  // После ответа: правильная колонка зеленеет, выбранная неверная краснеет (и значки галочка / крестик)
  function showFeedbackUi(q, lane) {
    if (!shownGate || shownGate.q !== q) showGateUi(q);
    shownGate = null;
    feedback = FEEDBACK_TIME;
    colEls.forEach((el, i) => {
      const mode = i === q.correctLane ? 'good' : (i === lane ? 'bad' : null);
      if (!mode) { el.style.opacity = '.45'; el.style.borderColor = COL_BORDER; return; }
      const [bg, border] = mode === 'good' ? COL_GOOD : COL_BAD;
      el.style.background = bg; el.style.borderColor = border; el.style.opacity = '1';
      const badge = document.createElement('span');
      badge.style.cssText = 'position:absolute;top:-12px;right:-8px;';
      badge.innerHTML = mode === 'good' ? BADGE_GOOD : BADGE_BAD;
      el.appendChild(badge);
    });
  }
  function hideGateUi() {
    s.$('#qbox').style.display = 'none';
    s.$('#cols').style.display = 'none';
  }

  // Игра решена (победа или конец сердец). Ещё немного бежим, чтобы ребёнок увидел результат последнего ответа.
  function scheduleEnd(won, delay) {
    if (ending || finished) return;
    ending = { won, t: delay };
  }

  // Показываем экран конца: герой лицом к игроку, лес вырастает вокруг него
  function endRun(won) {
    finished = true; ending = null; feedback = 0; freeze = 0;
    stopMusic(); playSfx(won ? 'victory' : 'gameOver');   // музыка замолкает, играет звук победы или проигрыша
    hideGateUi(); shownGate = null;
    gates.clear(); track.clear();
    ctx.mood.reset();
    ctx.world.hide();
    ctx.menuStage.show();
    setCameraMode(ctx.camera, 'menu');
    hero.root.visible = true;
    hero.root.position.set(0, 0, 0);
    hero.root.rotation.set(0, 0, 0);          // лицом к игроку
    hero.root.scale.setScalar(1);
    hero.mixer.timeScale = 1;
    endWon = won; endTime = 0;
    if (won) {
      hero.setPose(hero.hasJoyClip ? 'joy' : 'idle');   // радость: прыжки (если анимации нет, герой подпрыгивает, см. update)
      medal.attach(hero.root, hero.chest);                // медаль на груди
    } else {
      hero.setPose('idle');                              // поражение: спокойная поза ожидания
    }
    ctx.forest.showAtEnd(correctCount);
    over.$('#overTitle').textContent = won ? 'Ты — Юный эколог!' : 'Сердца закончились';
    over.$('#overText').innerHTML = won
      ? `Ты вырастил лес: ${correctCount} из ${queue.length}<br>Очки: ${score}`
      : `Верных ответов: ${correctCount} из ${queue.length}<br>Очки: ${score}`;
    s.$('#home').parentElement.style.display = 'none';
    s.$('#hint').style.display = 'none';
    over.show();
  }

  // force: неверный ответ отнимает сердце всегда, даже во время мерцания после ошибки
  function loseHeart(force = false) {
    if (finished || ending) return;
    if (!force && invuln > 0) return;
    lives--;
    playSfx(force ? 'wrong' : 'collision');   // неверный ответ или удар/дыра
    renderHud();
    if (lives <= 0) {
      // Сердца закончились: герой играет Death_B, мир стоит, потом экран конца
      invuln = 0; hero.root.visible = true;
      const len = hero.death() ? hero.clipLength('Death_B') : 0;
      freeze = 999;                                         // мир стоит до экрана конца
      scheduleEnd(false, Math.max(len + 0.3, force ? FEEDBACK_TIME : 0.5));
    } else if (force) {
      invuln = INVULN_TIME;                                 // неверный ответ: только мерцание, без анимации
    } else if (hero.hitB()) {
      freeze = hero.clipLength('Hit_B');                    // удар или дыра: Hit_B, герой и мир стоят, мерцания нет
    }
  }

  async function startRun() {
    const token = ++runToken;
    playMusic('game');
    waiting = true; ending = null; feedback = 0; freeze = 0;
    over.hide(); hideGateUi(); shownGate = null;
    s.$('#home').parentElement.style.display = '';
    s.$('#hint').style.display = '';
    gates.clear(); track.clear();
    hero.root.visible = false;
    medal.detach(); endWon = false;
    ctx.world.hide();
    ctx.menuStage.hide();
    ctx.mood.reset();
    ctx.forest.reset();
    setCameraMode(ctx.camera, 'game');
    const wait = s.$('#wait');
    wait.textContent = 'Загрузка заданий…';
    wait.style.display = 'block';

    queue = pickQuestions(ctx.questions, state.section, QUESTIONS_TO_WIN).map(prepareQuestion);
    if (!queue.length) { wait.textContent = 'Для этого раздела пока нет заданий'; return; }
    await preloadImages(queue.flatMap(imagesOf));
    if (token !== runToken) return;          // игрок уже ушёл с экрана
    wait.style.display = 'none';

    lives = LIVES; score = 0; invuln = 0; answered = 0; correctCount = 0;
    gatesSpawned = 0; rowsSinceGate = 0;
    laneIndex = 1; heroX = 0; speed = SPEED_START; hintTimer = 0;
    hero.root.visible = true;
    hero.root.position.set(0, 0, 0);
    hero.root.scale.setScalar(1);
    hero.root.rotation.set(0, Math.PI, 0);   // спиной к камере
    hero.mixer.timeScale = 1;
    hero.setPose('run');
    ctx.world.show();
    track.reset();
    s.$('#hint').style.opacity = '1';
    renderHud();
    finished = false;
    waiting = false;
  }

  function moveLane(dir) {
    if (finished || waiting || freeze > 0) return;
    laneIndex = THREE.MathUtils.clamp(laneIndex + dir, 0, 2);
    s.$('#hint').style.opacity = '0';
    markLane();
  }

  s.$('#home').addEventListener('click', () => ctx.goTo('hero'));
  over.$('#home2').addEventListener('click', () => ctx.goTo('hero'));
  over.$('#again').addEventListener('click', () => startRun());

  const events = {
    onSeed() { if (ending) return; score += SEED_POINTS; playSfx('seed'); renderHud(); },
    onHit() { loseHeart(); },
    // дорога спрашивает, пора ли ставить ворота
    wantGate() { return !ending && gatesSpawned < queue.length && rowsSinceGate >= GATE_EVERY_ROWS; },
    spawnGate(z) { gates.spawn(queue[gatesSpawned++], z); rowsSinceGate = 0; },
    onRow() { rowsSinceGate++; },
    // герой пробежал ворота по дорожке lane
    onGate(q, lane) {
      if (ending || finished) return;
      const ok = lane === q.correctLane;   // на закрытой дорожке correctLane не совпадёт: считается ошибкой
      answered++;
      gates.reveal(q, lane);               // окна в мире: правильное зеленеет, выбранное неверное краснеет
      showFeedbackUi(q, lane);             // то же внизу экрана
      if (ok) {
        correctCount++; score += CORRECT_POINTS;
        playSfx('correct');
        ctx.forest.plant();                // вырастает дерево
      } else {
        ctx.mood.sadden();                 // мир сереет и потом возвращает цвет
        loseHeart(true);                   // сердце теряется, герой мерцает
      }
      renderHud();
      if (!ending && answered >= queue.length) scheduleEnd(true, FEEDBACK_TIME);
    },
  };

  return {
    enter() {
      setCameraMode(ctx.camera, 'game');
      hero = ctx.heroes[state.heroIndex];
      ctx.scene.add(hero.root);
      s.show();
      ctx.input.setHandlers({
        swipe: (dir) => moveLane(dir),
        tap: (side) => moveLane(side),
        key: (dir) => moveLane(dir),
      });
      startRun();
    },
    exit() {
      runToken++; waiting = false;
      ctx.input.clear();
      ending = null; feedback = 0; freeze = 0;
      medal.detach();
      track.clear();
      gates.clear();
      hideGateUi();
      ctx.mood.reset();
      ctx.forest.hide();
      ctx.menuStage.hide();
      if (hero) { ctx.scene.remove(hero.root); hero.root.visible = true; hero.root.position.y = 0; hero.mixer.timeScale = 1; }
      ctx.world.hide();
      over.hide();
      s.hide();
    },
    update(dt) {
      if (waiting) return;
      ctx.forest.update(dt, (finished || freeze > 0) ? 0 : speed);
      if (finished) {                                    // экран конца: лес растёт, герой стоит или радуется
        hero.mixer.update(dt);
        if (endWon) {
          endTime += dt;
          if (!hero.hasJoyClip) hero.root.position.y = Math.abs(Math.sin(endTime * JOY_HOP_SPEED)) * JOY_HOP_HEIGHT;
          medal.update(dt);
        }
        return;
      }

      // Пауза: герой доигрывает Hit_B или Death_B, дорога, ворота и лес стоят
      if (freeze > 0) {
        freeze -= dt;
        ctx.mood.update(dt);
        if (feedback > 0) { feedback -= dt; if (feedback <= 0) { feedback = 0; hideGateUi(); } }
        hero.mixer.timeScale = 1;
        hero.mixer.update(dt);
        if (ending) { ending.t -= dt; if (ending.t <= 0) endRun(ending.won); }
        return;
      }

      hintTimer += dt;
      if (hintTimer > 8) s.$('#hint').style.opacity = '0';

      ctx.mood.update(dt);
      speed = Math.min(SPEED_MAX, speed + SPEED_GROWTH * dt);
      ctx.world.update(dt, speed);

      // Плавный переход между дорожками
      const diff = LANES[laneIndex] - heroX;
      heroX += diff * Math.min(1, 12 * dt);
      hero.root.position.x = heroX;
      hero.root.rotation.y = Math.PI - diff * 0.25;
      hero.root.rotation.z = -diff * 0.06;

      track.update(dt, speed, heroX, events);
      if (finished) return;
      gates.update(dt, speed, heroX, events);
      if (finished) return;

      // Вопрос и ответы на экране: для ближайших ворот. После ответа несколько секунд показываем результат.
      if (feedback > 0) {
        feedback -= dt;
        if (feedback <= 0) { feedback = 0; hideGateUi(); }
      } else {
        const g = gates.next();
        if (g !== shownGate) {
          shownGate = g;
          if (g) showGateUi(g.q); else hideGateUi();
        }
      }

      // Мерцание после неверного ответа
      if (invuln > 0) {
        invuln -= dt;
        hero.root.visible = invuln <= 0 ? true : Math.floor(invuln / 0.08) % 2 === 0;
      }

      hero.mixer.timeScale = speed / 10;
      hero.mixer.update(dt);

      // Пауза перед экраном конца закончилась
      if (ending) {
        ending.t -= dt;
        if (ending.t <= 0) endRun(ending.won);
      }
    },
  };
}
