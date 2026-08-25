/* Service Worker: macht den Bot offline lauffaehig.

   Der Bot rechnet ohnehin lokal - ohne Netz fehlten bisher nur die
   Dateien selbst. Nach dem ersten Aufruf liegen sie im Cache.

   Strategie: erst Netz, bei Fehlschlag Cache. So bekommt man
   Aktualisierungen mit, bleibt aber offline benutzbar. */

const CACHE = 'momentum-bot-v1';
const DATEIEN = [
  './start.html',
  './bot.html',
  './bot-core.js',
  './journal.html',
  './index.html',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', ev => {
  ev.waitUntil(
    caches.open(CACHE)
      // addAll bricht ab, wenn eine Datei fehlt - einzeln ist robuster
      .then(c => Promise.allSettled(DATEIEN.map(d => c.add(d))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys()
      .then(namen => Promise.all(
        namen.filter(n => n !== CACHE).map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', ev => {
  if (ev.request.method !== 'GET') return;
  // Schriften und Fremdinhalte nicht abfangen
  if (!ev.request.url.startsWith(self.location.origin)) return;

  ev.respondWith(
    fetch(ev.request)
      .then(antwort => {
        if (antwort && antwort.ok) {
          const kopie = antwort.clone();
          caches.open(CACHE).then(c => c.put(ev.request, kopie));
        }
        return antwort;
      })
      .catch(() => caches.match(ev.request).then(t => t || caches.match('./start.html')))
  );
});
