// Простой «рабочий» файл для установки игры как приложения.
// Пока он только пропускает запросы как обычно. Полную работу без интернета добавим на этапе 8.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request));
});
