// Quizly — service worker minimal : l'appli s'ouvre même sans réseau.
// Les données (questions, profil) sont gérées par le cache Firestore, pas ici.
const CACHE = 'quizly-shell-v1';

self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/', '/manifest.json']).catch(() => {}))); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return; // Firebase, polices Google… : réseau normal
  if (req.mode === 'navigate') {
    // Pages : réseau d'abord (toujours la dernière version), sinon la page en cache
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(ca => ca.put('/', c)); return r; }).catch(() => caches.match('/')));
    return;
  }
  // Fichiers compilés (noms à empreinte) : cache d'abord
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok) { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(req, c)); }
    return r;
  })));
});
