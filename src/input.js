// Управление: свайп, перетаскивание, касание половины экрана, стрелки и A/D.
// Экран сам решает, что делать: ему достаточно передать функции в setHandlers().
//   swipe(dir)  — dir = -1 (влево) или 1 (вправо)
//   drag(dx)    — палец тянут по экрану: на сколько пикселей сдвинулся (если задан, свайпа нет)
//   dragEnd()   — палец отпустили после перетаскивания
//   tap(side)   — side = -1 (левая половина) или 1 (правая)
//   key(dir)    — стрелки и A/D
const SWIPE_MIN = 24; // сколько пикселей пальцу пройти, чтобы это считалось свайпом или перетаскиванием

export function createInput(canvas) {
  let h = {};
  let startX = 0, startY = 0, lastX = 0, swiped = false, down = false;

  canvas.addEventListener('pointerdown', (e) => {
    down = true; swiped = false; startX = lastX = e.clientX; startY = e.clientY;
    canvas.setPointerCapture(e.pointerId);   // следим за пальцем, даже если он ушёл за край окна
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    if (h.drag) {
      if (swiped) { h.drag(e.clientX - lastX); lastX = e.clientX; }
      else if (Math.hypot(dx, dy) > SWIPE_MIN) { swiped = true; lastX = e.clientX; }
      return;
    }
    if (swiped) return;
    if (Math.abs(dx) > SWIPE_MIN && Math.abs(dx) > Math.abs(dy)) {
      swiped = true;
      if (h.swipe) h.swipe(dx > 0 ? 1 : -1);
    }
  });
  const end = (e) => {
    if (!down) return;
    down = false;
    if (swiped && h.dragEnd) h.dragEnd();
    if (!swiped && e.type === 'pointerup') {
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (Math.abs(dx) < SWIPE_MIN && Math.abs(dy) < SWIPE_MIN && h.tap) {
        const r = canvas.getBoundingClientRect();
        h.tap(e.clientX < r.left + r.width / 2 ? -1 : 1);
      }
    }
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  window.addEventListener('keydown', (e) => {
    let dir = 0;
    if (e.key === 'ArrowLeft' || e.code === 'KeyA') dir = -1;
    else if (e.key === 'ArrowRight' || e.code === 'KeyD') dir = 1;
    if (!dir) return;
    e.preventDefault();
    if (h.key) h.key(dir);
  });

  // Запрет прокрутки и увеличения во время игры (особенно для iPhone)
  const stop = (e) => e.preventDefault();
  document.addEventListener('touchmove', stop, { passive: false });
  document.addEventListener('gesturestart', stop);
  document.addEventListener('gesturechange', stop);
  document.addEventListener('dblclick', stop);
  document.addEventListener('contextmenu', stop);

  return {
    setHandlers(handlers) { h = handlers || {}; },
    clear() { h = {}; },
  };
}
