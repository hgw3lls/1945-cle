/* Offline-first SW for kiosk (Leaflet tiles) */
const VERSION='v1.3';const APP=`app-${VERSION}`,TILES=`tiles-${VERSION}`,RUNTIME=`rt-${VERSION}`;
const PRECACHE=['/','/offline.html'];
const isHTML=r=>r.destination==='document'||r.headers?.get('accept')?.includes('text/html');
const isTile=u=>/tile\.openstreetmap\.org\/\d+\/\d+\/\d+\.png/.test(u);
async function trim(n,m=300){const c=await caches.open(n),k=await c.keys();if(k.length<=m)return;for(let i=0;i<k.length-m;i++)await c.delete(k[i]);}
self.addEventListener('install',e=>{e.waitUntil(caches.open(APP).then(c=>c.addAll(PRECACHE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ns=>Promise.all(ns.map(n=>{if(![APP,TILES,RUNTIME].includes(n))return caches.delete(n);}))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url),same=u.origin===self.location.origin,tile=isTile(u.href);
 if(isHTML(r)){e.respondWith((async()=>{try{const f=await fetch(r);(await caches.open(APP)).put(r,f.clone());return f}catch(e){const c=await caches.open(APP);return await c.match(r)||await c.match('/offline.html')||new Response('Offline',{status:503});}})());return;}
 if(tile){e.respondWith((async()=>{const c=await caches.open(TILES),hit=await c.match(r),net=fetch(r).then(res=>{if(res&&res.status===200)c.put(r,res.clone()),trim(TILES,800).catch(()=>{});return res;}).catch(()=>null);return hit||net||new Response(null,{status:504});})());return;}
 if(same){e.respondWith((async()=>{const c=await caches.open(RUNTIME),hit=await c.match(r);if(hit)return hit;try{const f=await fetch(r);if(f&&f.status===200)c.put(r,f.clone()),trim(RUNTIME,200).catch(()=>{});return f}catch(e){return hit||new Response(null,{status:504});}})());}
});