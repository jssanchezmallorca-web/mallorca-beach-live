const VERSION='beach-cam-beta-v33';
const STATIC=['./','./index.html','./install.html','./style.css?v=31','./app.js?v=33','./beaches.js?v=18','./manifest.webmanifest?v=24','../beachcam-icon.svg?v=24','./firebase-config.js?v=1','./texts.js?v=3','./config-text.js?v=2','./runtime-notices.js?v=1','./tracking.js?v=5','./master.html','./master.js?v=4','./master-extra-texts.js?v=1',"../update-bridge.js?v=33",'../mallorca-header-icon.svg?v=24'];
const LIVE_DATA=new Set(['/mallorca-beach-live/cameras.js','/mallorca-beach-live/camera-health.js']);
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(STATIC)));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==VERSION)await caches.delete(k);await self.clients.claim()})()));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const u=new URL(e.request.url);if(u.origin!==location.origin)return;
 e.respondWith((async()=>{
  try{
   const req=LIVE_DATA.has(u.pathname)?new Request(e.request,{cache:'no-store'}):e.request;
   const r=await fetch(req,{cache:'no-store'});
   const c=await caches.open(VERSION);c.put(e.request,r.clone());return r;
  }catch{return(await caches.match(e.request))||Response.error()}
 })())
});