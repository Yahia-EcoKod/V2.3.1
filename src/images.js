// Картинки вопросов: загружаем заранее, чтобы в игре ничего не мигало.
import { IMAGES_DIR } from './config.js';

const promises = new Map();   // путь -> обещание загрузки
const loaded = new Map();     // путь -> готовая картинка

function loadImage(path) {
  if (promises.has(path)) return promises.get(path);
  const p = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { loaded.set(path, img); resolve(img); };
    img.onerror = () => { console.warn('Нет картинки', path); resolve(null); };
    img.src = IMAGES_DIR + path;
  });
  promises.set(path, p);
  return p;
}

export function preloadImages(paths) {
  return Promise.all([...new Set(paths)].map(loadImage));
}

// Готовая картинка или null (если ещё не загрузилась или файла нет)
export function getImage(path) {
  return loaded.get(path) || null;
}
