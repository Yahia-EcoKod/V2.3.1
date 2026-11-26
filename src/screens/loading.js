// Экран 1. Заставка и загрузка: логотип, который покачивается, полоска и проценты.
import { makeScreenRoot } from '../ui.js';

export function createLoadingScreen() {
  const s = makeScreenRoot(`
    <img class="logoImg" src="assets/logo/logo-round.png" alt="Экотоп">
    <h1 class="logo">Юный Эколог</h1>
    <p class="big" id="loadText">Загрузка… 0%</p>
    <div class="bar"><div class="barFill" id="barFill"></div></div>
  `, 'solid sky');
  s.show();

  return {
    setProgress(p) {
      const pct = Math.round(Math.min(1, p) * 100);
      s.$('#barFill').style.width = pct + '%';
      s.$('#loadText').textContent = 'Загрузка… ' + pct + '%';
    },
    showError(text) {
      s.root.classList.remove('sky');
      s.root.classList.add('error');
      s.root.innerHTML = `<h1 class="logo">Ой, не загрузилось</h1><p class="big">${text}</p>`;
    },
    hide() { s.hide(); },
  };
}
