var C='zgch-f23';
self.addEventListener('install',function(){self.skipWaiting()});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(k){
    return Promise.all(k.map(function(x){if(x!==C)return caches.delete(x)}))
  }).then(function(){return self.clients.claim()}));
});
self.addEventListener('fetch',function(e){
  var u=e.request.url;
  if(e.request.method!=='GET')return;
  if(u.indexOf('script.google.com')>-1)return;
  if(u.indexOf('api.ipify.org')>-1)return;
  var hal=e.request.mode==='navigate'||/\.html?(\?|$)/.test(u)||/\/$/.test(u);
  if(hal){
    e.respondWith(fetch(e.request,{cache:'reload'}).then(function(x){
      try{caches.open(C).then(function(c){c.put(e.request,x.clone())})}catch(z){}
      return x;
    }).catch(function(){return caches.match(e.request).then(function(r){
      return r||caches.match('./')})}));
    return;
  }
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