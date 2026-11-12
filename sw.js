// Reperibilità – service worker · V05.20
// A ogni rilascio cambiare VERSIONE (basta modificare anche un solo carattere del file perché i dispositivi rilevino l'aggiornamento).
const VERSIONE='V05.20';
const CACHE='reperibilita-'+VERSIONE, CACHE_LIB='reperibilita-librerie', CACHE_MOD='reperibilita-modelli';
const CORE=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png'];
const LIB=['https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'];
const FONT_CSS=['https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,500;6..72,600&family=Public+Sans:wght@400;500;600&family=Caveat:wght@500&display=swap'];

self.addEventListener('install',e=>e.waitUntil((async()=>{
  const c=await caches.open(CACHE);
  await c.addAll(CORE.map(u=>new Request(u,{cache:'reload'})));
  const l=await caches.open(CACHE_LIB);
  for(const u of LIB){try{const r=await fetch(u,{mode:'cors'});if(r.ok)await l.put(u,r);}catch(_){}}
  for(const u of FONT_CSS){try{const r=await fetch(u);if(!r.ok)continue;await l.put(u,r.clone());
    const t=await r.text();
    await Promise.all([...t.matchAll(/url\((https:[^)]+)\)/g)].map(m=>fetch(m[1]).then(x=>x.ok&&l.put(m[1],x)).catch(()=>{})));}catch(_){}}
})()));

self.addEventListener('message',e=>{if(e.data==='SKIP_WAITING')self.skipWaiting();});

self.addEventListener('activate',e=>e.waitUntil((async()=>{
  const tieni=[CACHE,CACHE_LIB,CACHE_MOD];
  for(const k of await caches.keys())if(k.startsWith('reperibilita-')&&!tieni.includes(k))await caches.delete(k);
  await clients.claim();
})()));

self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin===location.origin){
    // programma, icone e documenti: prima la rete (così gli aggiornamenti si vedono subito), poi la copia salvata
    e.respondWith((async()=>{
      try{
        const n=await fetch(r);
        if(n.ok){const c=await caches.open(u.pathname.includes('/modelli/')?CACHE_MOD:CACHE);c.put(r,n.clone());}
        return n;
      }catch(err){
        const m=await caches.match(r,{ignoreSearch:true});
        if(m)return m;
        if(r.mode==='navigate'){const p=await caches.match('index.html')||await caches.match('./');if(p)return p;}
        throw err;
      }
    })());
    return;
  }
  // librerie e caratteri esterni: prima la copia salvata, poi la rete
  e.respondWith(caches.match(r).then(m=>m||fetch(r).then(n=>{
    if(n.ok||n.type==='opaque'){const cl=n.clone();caches.open(CACHE_LIB).then(c=>c.put(r,cl));}
    return n;})));
});
