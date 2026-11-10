var C='zgch-f20';
self.addEventListener('install',function(){self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim())});
self.addEventListener('fetch',function(e){
  var u=e.request.url;
  if(e.request.method!=='GET')return;
  if(u.indexOf('script.google.com')>-1)return;
  if(u.indexOf('api.ipify.org')>-1)return;
  e.respondWith(caches.open(C).then(function(c){
    return c.match(e.request).then(function(r){
      var f=fetch(e.request).then(function(x){
        try{c.put(e.request,x.clone())}catch(z){}
        return x;
      }).catch(function(){return r});
      return r||f;
    });
  }));
});