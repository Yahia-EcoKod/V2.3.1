// Вопросы: загрузка из data/questions.json, выбор заданий для одной игры, подготовка к показу.
import { QUESTIONS_URL } from './config.js';

export async function loadQuestions() {
  const res = await fetch(QUESTIONS_URL);
  if (!res.ok) throw new Error('Не найден ' + QUESTIONS_URL);
  const data = await res.json();
  if (!data.questions || !data.questions.length) throw new Error('В файле нет вопросов');
  return data.questions;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Выбор заданий: берём по кругу из каждой категории, чтобы они перемешивались поровну.
// Это правило можно поменять здесь, остальная игра не затронется.
export function pickQuestions(all, section, count) {
  const pool = all.filter((q) => q.grades.includes(section) && q.correctIndex !== null);
  const byCategory = new Map();
  for (const q of shuffle(pool)) {
    if (!byCategory.has(q.category)) byCategory.set(q.category, []);
    byCategory.get(q.category).push(q);
  }
  const lists = shuffle([...byCategory.values()]);
  const picked = [];
  while (picked.length < count && lists.some((l) => l.length)) {
    for (const l of lists) {
      if (picked.length >= count) break;
      if (l.length) picked.push(l.pop());
    }
  }
  return shuffle(picked);   // в игре одно и то же задание не повторяется
}

// Готовим вопрос к показу: перемешиваем ответы и раскладываем по трём дорожкам.
// slots[i] — ответ на дорожке i (0 — левая) или null, если дорожка закрыта барьером.
export function prepareQuestion(q) {
  const order = shuffle(q.options.map((o, i) => ({ o, ok: i === q.correctIndex })));
  const closed = order.length === 2 ? Math.floor(Math.random() * 3) : -1;
  const slots = [null, null, null];
  let k = 0, correctLane = -1;
  for (let lane = 0; lane < 3; lane++) {
    if (lane === closed || k >= order.length) continue;
    const item = order[k++];
    slots[lane] = item.o;
    if (item.ok) correctLane = lane;
  }
  return { id: q.id, text: q.text, image: q.image, slots, correctLane };
}

// Какие картинки нужны для вопроса (чтобы загрузить заранее)
export function imagesOf(pq) {
  const list = pq.image ? [pq.image] : [];
  for (const o of pq.slots) if (o && o.type === 'image') list.push(o.value);
  return list;
}
