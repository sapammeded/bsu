var C = 'bsu-d8';
var LEWAT = ['script.google.com', 'ipwho.is', 'nominatim', 'googleapis.com', 'jsdelivr.net', 'gstatic.com'];
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== C; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var u = e.request.url;
  for (var i = 0; i < LEWAT.length; i++) if (u.indexOf(LEWAT[i]) > -1) return;
  e.respondWith(fetch(e.request).then(function (r) {
    if (!r || r.status !== 200) return r;
    var c = r.clone();
    caches.open(C).then(function (k) { k.put(e.request, c); });
    return r;
  }).catch(function () { return caches.match(e.request); }));
});