/* Service worker de Mis Finanzas: instalación, pantalla sin conexión y avisos push. */
importScripts('config.js');
var CACHE = 'mf-' + self.MF_VERSION;
var ARCHIVOS = ['./', './index.html', './config.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './favicon-32.png', './apple-touch-icon.png'];

self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARCHIVOS); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
// Solo los archivos propios de la carcasa; los datos (Google) siempre van en línea y nunca se guardan aquí
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (u.origin !== self.location.origin || e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(function (r) { var c = r.clone(); caches.open(CACHE).then(function (k) { k.put(e.request, c); }); return r; })
    .catch(function () { return caches.match(e.request, { ignoreSearch: true }).then(function (r) { return r || caches.match('./index.html'); }); }));
});

// --- Identificador de este teléfono (lo guarda la página al activar los avisos) ---
function idb() { return new Promise(function (ok, ko) { var r = indexedDB.open('misfinanzas', 1); r.onupgradeneeded = function () { r.result.createObjectStore('kv'); }; r.onsuccess = function () { ok(r.result); }; r.onerror = ko; }); }
function leerSid() { return idb().then(function (db) { return new Promise(function (ok) { var q = db.transaction('kv').objectStore('kv').get('sid'); q.onsuccess = function () { ok(q.result || ''); }; q.onerror = function () { ok(''); }; }); }).catch(function () { return ''; }); }

// El push llega vacío: el texto se pide a la planilla con el identificador de este teléfono
self.addEventListener('push', function (e) {
  e.waitUntil(leerSid().then(function (sid) {
    if (!sid) return [];
    return fetch(self.MF_EXEC + '?api=push&sid=' + encodeURIComponent(sid), { cache: 'no-store' }).then(function (r) { return r.json(); }).catch(function () { return []; });
  }).then(function (lista) {
    if (!lista || !lista.length) lista = [{ titulo: 'Mis Finanzas', cuerpo: 'Entró un movimiento nuevo.' }];
    return Promise.all(lista.map(function (m) {
      return self.registration.showNotification(m.titulo || 'Mis Finanzas', {
        body: m.cuerpo || '', tag: m.tag || 'mf', icon: 'icon-192.png', badge: 'favicon-32.png', lang: 'es-CL', data: { p: m.p || 'bandeja' }
      });
    }));
  }));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var p = (e.notification.data && e.notification.data.p) || 'bandeja';
  var destino = new URL('./?p=' + encodeURIComponent(p), self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
    for (var i = 0; i < cs.length; i++) { if (cs[i].url.indexOf(self.registration.scope) === 0) { cs[i].postMessage({ mf: 'ir', p: p }); return cs[i].focus(); } }
    return self.clients.openWindow(destino);
  }));
});
