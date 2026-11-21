var C='bsu-v27';
var ASET=['./','./index.html','./manifest.json'];

self.addEventListener('install',function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(C).then(function(k){
    return Promise.all(ASET.map(function(u){
      return k.add(new Request(u,{cache:'reload'})).catch(function(){});
    }));
  }));
});

self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(k){
    return Promise.all(k.map(function(x){if(x!==C)return caches.delete(x)}));
  }).then(function(){return self.clients.claim()}));
});

self.addEventListener('message',function(e){
  if(e.data==='lewat')self.skipWaiting();
});

self.addEventListener('fetch',function(e){
  var r=e.request,u;
  try{u=new URL(r.url)}catch(x){return}

  /* Apps Script (POST lintas origin) — serahkan ke peramban */
  if(r.method==='POST'){
    e.respondWith(fetch(r).catch(function(){
      return new Response('',{status:200,headers:{'Content-Type':'text/plain'}});
    }));
    return;
  }
  if(r.method!=='GET')return;
  if(u.origin!==location.origin)return;

  /* navigasi: jaringan dulu, cache sebagai cadangan */
  if(r.mode==='navigate'){
    e.respondWith(
      fetch(r).then(function(res){
        if(res&&res.status===200){
          var c=res.clone();
          caches.open(C).then(function(x){x.put(r,c)}).catch(function(){});
        }
        return res;
      }).catch(function(){
        return caches.match(r).then(function(m){
          return m||caches.match('./index.html')||caches.match('./');
        });
      })
    );
    return;
  }

  /* aset: cache dulu, perbarui di latar */
  e.respondWith(caches.match(r).then(function(m){
    var jaring=fetch(r).then(function(res){
      if(res&&res.status===200){
        var c=res.clone();
        caches.open(C).then(function(x){x.put(r,c)}).catch(function(){});
      }
      return res;
    }).catch(function(){return m});
    return m||jaring;
  }));
});