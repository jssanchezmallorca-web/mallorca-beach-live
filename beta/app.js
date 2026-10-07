const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const S={view:'cams',region:'Todas',q:'',favOnly:false,pos:null,map:null,userMarker:null,markers:{},selected:null,watch:null,install:null,lastRoutePos:null,lastRouteAt:0,nearRouted:null,nearBusy:false};
const F=new Set(JSON.parse(localStorage.getItem('bc-favs')||'[]'));
const REG=['Todas','Norte','Llevant','Ponent','Palma','Migjorn'];
const WC={};
const VISIONA_FRAMES={
 'calasantvicenc':'VIC-CAM1','estrenc':'EMQ-CAM2','desmarques':'EMQ-CAM1','estanys':'EMQ-CAM3',
 'badia-alcudia-mola':'MLA-CAM1','badia-pollenca-mola':'MLA-CAM2','cala-llamp':'ANX-CAM2',
 'cala-romantica-visiona':'CRM-CAM1','cales-mallorca':'ECL-CAM2','badia-campos-sarapita':'SRF-CAM1',
 'canyamel-visiona':'CML-CAM1','calamillor-calabona-visiona':'SRV-CAM2'
};
const LIVE_EMBEDS={
 'sonserra':'https://rtsp.me/embed/b378874i/',
 'calasantanyi':'https://webtvfc.feratel.com/webtv/?design=v5&cam=15115&lg=es&pg=DA7D2F22-8600-464D-9D4F-CDB04014A6C5',
 'cala-bona-hotel':'https://rtsp.me/embed/5tYtr3zD/'
};
let PREVIEW_OBSERVER=null;
const PREVIEW_TIMERS=new WeakMap();
function clearMini(el){
 const t=PREVIEW_TIMERS.get(el);if(t){clearInterval(t);PREVIEW_TIMERS.delete(el)}
 const f=el.querySelector('iframe');if(f)f.src='about:blank';
 el.dataset.loaded='';
}
function loadMini(el,c){
 if(el.dataset.loaded==='1')return;el.dataset.loaded='1';el.innerHTML='';
 let n;
 if(c.mode==='youtube'){
  n=document.createElement('iframe');
  n.src=`https://www.youtube-nocookie.com/embed/${c.video}?autoplay=1&mute=1&controls=0&playsinline=1&rel=0&modestbranding=1`;
  n.allow='autoplay; encrypted-media; picture-in-picture';n.tabIndex=-1;
 }else if(c.mode==='ipcam'){
  n=document.createElement('iframe');
  n.src=`https://g0.ipcamlive.com/player/player.php?alias=${c.alias}&autoplay=1&mute=1`;
  n.allow='autoplay';n.tabIndex=-1;
 }else if(c.mode==='mjpeg'){
  n=document.createElement('img');n.src=c.url;n.alt=c.name;
 }else if(VISIONA_FRAMES[c.key]){
  n=document.createElement('img');n.alt=c.name;
  const refresh=()=>{n.src=`https://visiona.conectabalear.com/preview/${VISIONA_FRAMES[c.key]}/?t=${Date.now()}`};
  refresh();PREVIEW_TIMERS.set(el,setInterval(refresh,4000));
 }else if(LIVE_EMBEDS[c.key]){
  n=document.createElement('iframe');n.src=LIVE_EMBEDS[c.key];n.allow='autoplay; encrypted-media; picture-in-picture';n.tabIndex=-1;
 }else{
  const t=thumb(c);
  if(t){n=document.createElement('img');n.src=t;n.alt=c.name}
  else{n=document.createElement('div');n.className='ph';n.innerHTML='🌊<br>'+esc(c.name)}
 }
 if(n)n.classList.add('mini-media');el.appendChild(n);
}
function makeMini(c){const d=document.createElement('div');d.className='live-mini';d.__cam=c;return d}
function observeMinis(root){
 if(PREVIEW_OBSERVER)PREVIEW_OBSERVER.disconnect();
 PREVIEW_OBSERVER=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)loadMini(e.target,e.target.__cam);else clearMini(e.target)}),{rootMargin:'180px 0px'});
 root.querySelectorAll('.live-mini').forEach(x=>PREVIEW_OBSERVER.observe(x));
}
function liveNode(c){
 if(c.mode==='youtube'||c.mode==='ipcam'){
  const f=document.createElement('iframe');
  f.src=c.mode==='youtube'?`https://www.youtube-nocookie.com/embed/${c.video}?autoplay=1&playsinline=1&rel=0`:`https://g0.ipcamlive.com/player/player.php?alias=${c.alias}&autoplay=1`;
  f.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';f.allowFullscreen=true;return f
 }
 if(c.mode==='mjpeg'){const i=document.createElement('img');i.src=c.url;return i}
 if(VISIONA_FRAMES[c.key]){
  const box=document.createElement('div');box.className='visiona-live';
  const i=document.createElement('img');i.alt=c.name;box.appendChild(i);
  const refresh=()=>{i.src=`https://visiona.conectabalear.com/preview/${VISIONA_FRAMES[c.key]}/?t=${Date.now()}`};
  refresh();box._timer=setInterval(refresh,2500);return box
 }
 if(LIVE_EMBEDS[c.key]){const f=document.createElement('iframe');f.src=LIVE_EMBEDS[c.key];f.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';f.allowFullscreen=true;return f}
 const d=document.createElement('div');d.className='external';d.innerHTML=`<h2>${esc(c.name)}</h2><p>Este proveedor no permite incrustar su directo dentro de otra web. Usa “Original” para verlo en directo.</p>`;return d
}
function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function save(){localStorage.setItem('bc-favs',JSON.stringify([...F]))}
function thumb(c){if(c.mode==='youtube')return`https://i.ytimg.com/vi/${c.video}/hqdefault.jpg`;if(c.mode==='ipcam')return`https://g0.ipcamlive.com/player/snapshot.php?alias=${c.alias}&t=${Math.floor(Date.now()/300000)}`;return''}
function cams(){let q=S.q.toLowerCase().trim();return CAMERAS.filter(c=>(S.region==='Todas'||c.region===S.region)&&(!S.favOnly||F.has(c.key))&&(!q||`${c.name} ${c.region} ${c.provider}`.toLowerCase().includes(q)))}
function drawFilters(){let e=$('#filters');e.innerHTML='';REG.forEach(r=>{let b=document.createElement('button');b.className='chip'+(S.region===r&&!S.favOnly?' on':'');b.textContent=r;b.onclick=()=>{S.region=r;S.favOnly=false;drawFilters();drawCams()};e.appendChild(b)});let f=document.createElement('button');f.className='chip'+(S.favOnly?' on':'');f.textContent='★ Favoritas';f.onclick=()=>{S.favOnly=!S.favOnly;drawFilters();drawCams()};e.appendChild(f)}
function camHealth(c){return window.BEACH_CAM_HEALTH?.cameras?.[c.key]?.status||'unknown'}
function camHealthLabel(c){const s=camHealth(c);return s==='online'?['online','🟢 ONLINE']:s==='offline'?['offline','🔴 OFFLINE']:['unknown','⚪ SIN CONFIRMAR']}
function drawCams(){let list=cams(),g=$('#grid');$('#count').textContent=`${list.length} / ${CAMERAS.length}`;g.innerHTML='';list.forEach(c=>{let card=document.createElement('article');card.className='card';let v=document.createElement('div');v.className='visual';v.appendChild(makeMini(c));let hs=camHealthLabel(c);v.insertAdjacentHTML('beforeend',`<span class="badge live ${hs[0]}">${hs[1]}</span><span class="badge prov">${esc(c.provider)}</span>`);let p=document.createElement('button');p.className='play';p.setAttribute('aria-label','Abrir '+c.name+' a pantalla completa');p.onclick=()=>openCam(c);v.appendChild(p);let f=document.createElement('button');f.className='fav'+(F.has(c.key)?' on':'');f.textContent=F.has(c.key)?'★':'☆';f.onclick=e=>{e.stopPropagation();F.has(c.key)?F.delete(c.key):F.add(c.key);save();drawCams()};v.appendChild(f);let info=document.createElement('div');info.className='info';info.innerHTML=`<div class="name">${esc(c.name)}</div><div class="meta"><span>${esc(c.region)}</span><span>${camHealthLabel(c)[1]}</span></div>`;card.append(v,info);g.appendChild(card)});observeMinis(g)}
function camNode(c){return liveNode(c)}
function openCam(c){if(!c)return;if(!$('#viewerModal').classList.contains('open'))history.pushState({beachCam:'viewer'},'');$('#viewerTitle').textContent=c.name;$('#original').href=c.url;let v=$('#viewer');v.innerHTML='';v.appendChild(camNode(c));let m=$('#viewerModal');m.classList.add('open');m.style.display='flex'}
function closeCam(){let m=$('#viewerModal');m.classList.remove('open');m.style.display='';let v=$('#viewer');v.querySelectorAll('.visiona-live').forEach(x=>{if(x._timer)clearInterval(x._timer)});v.innerHTML=''}
function beach(k){return BEACHES.find(b=>b.key===k)}
function beachCams(b){return b?(b.cameraKeys||[]).map(k=>CAMERAS.find(c=>c.key===k)).filter(Boolean):[]}
function showBeachCameras(b){let list=beachCams(b);if(!b)return;if(!list.length){$('#sheetTitle').textContent=`${b.name||'Playa'} · cámaras`;$('#sheetList').innerHTML='<div class="camera-btn"><span>No hay cámaras asociadas.</span></div>';let s=$('#cameraSheet');s.classList.add('open');s.style.display='flex';return}if(list.length===1){openCam(list[0]);return}$('#sheetTitle').textContent=`${b.name} · cámaras`;let e=$('#sheetList');e.innerHTML='';list.forEach(c=>{let x=document.createElement('button');x.className='camera-btn';x.innerHTML=`<span><strong>${esc(c.name)}</strong><br><small>${esc(c.provider)}</small></span><span>Ver ▶</span>`;x.onclick=()=>{let s=$('#cameraSheet');s.classList.remove('open');s.style.display='';openCam(c)};e.appendChild(x)});let s=$('#cameraSheet');s.classList.add('open');s.style.display='flex'}
window.openBeachCameras=keyOrBeach=>{const b=typeof keyOrBeach==='string'?beach(keyOrBeach):keyOrBeach;if(b)showBeachCameras(b)};
function openPrimaryCamera(b){const c=beachCams(b)[0];if(c)openCam(c);else showBeachCameras(b)}
function maps(b){return`https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}&travelmode=driving`}
function dist(a,b,c,d){const R=6371,r=x=>x*Math.PI/180,x=r(c-a),y=r(d-b),q=Math.sin(x/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(y/2)**2;return 2*R*Math.asin(Math.sqrt(q))}
function nearest(){if(!S.pos)return[];return BEACHES.map(b=>({...b,distance:dist(S.pos.lat,S.pos.lng,b.lat,b.lng)})).sort((a,b)=>a.distance-b.distance)}
function dif(a,b){return((a-b+540)%360)-180}
function toward(speed,from,seaBearing){return Math.max(0,speed*Math.cos(dif(from,seaBearing)*Math.PI/180))}
function label(c){if(c===0)return['☀️','Soleado'];if(c===1)return['🌤️','Mayormente soleado'];if(c===2)return['⛅','Parcialmente nublado'];if(c===3)return['☁️','Nublado'];if([45,48].includes(c))return['🌫️','Niebla'];if([51,53,55,56,57].includes(c))return['🌦️','Llovizna'];if([61,63,65,66,67,80,81,82].includes(c))return['🌧️','Lluvia'];if([71,73,75,77,85,86].includes(c))return['🌨️','Nieve'];if([95,96,99].includes(c))return['⛈️','Tormenta'];return['🌤️','Variable']}
async function weather(b){let old=WC[b.key];if(old&&Date.now()-old.t<1200000)return old.d;let w=`https://api.open-meteo.com/v1/forecast?latitude=${b.lat}&longitude=${b.lng}&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m&timezone=Europe%2FMadrid`;let m=`https://marine-api.open-meteo.com/v1/marine?latitude=${b.lat}&longitude=${b.lng}&hourly=wave_height,sea_surface_temperature&forecast_days=1&timezone=Europe%2FMadrid&cell_selection=sea`;let [wr,mr]=await Promise.allSettled([fetch(w),fetch(m)]),cur={},wave=null,waterTemp=null;if(wr.status==='fulfilled'&&wr.value.ok){let j=await wr.value.json();cur=j.current||{}}if(mr.status==='fulfilled'&&mr.value.ok){let j=await mr.value.json();if(j.hourly?.time?.length){let now=Date.now(),best=0,delta=Infinity;j.hourly.time.forEach((x,i)=>{let d=Math.abs(new Date(x).getTime()-now);if(d<delta){delta=d;best=i}});wave=j.hourly.wave_height?.[best]??null;waterTemp=j.hourly.sea_surface_temperature?.[best]??null}}let [icon,text]=label(cur.weather_code);let d={icon,text,temp:cur.temperature_2m,onshore:toward(cur.wind_speed_10m||0,cur.wind_direction_10m||0,b.shoreBearing),wave,waterTemp};WC[b.key]={t:Date.now(),d};return d}
function cardHTML(b,w,distance){let temp=w.temp==null?'—':`${Math.round(w.temp)} °C`,wave=w.wave==null?'—':`${Number(w.wave).toFixed(1)} m`,water=w.waterTemp==null?'—':`${Number(w.waterTemp).toFixed(1)} °C`;return`${distance!=null?`<div class="distance">${distance.toFixed(1)} km</div>`:''}<div class="metric">${w.icon} <strong>${esc(w.text)}</strong> · ${temp}</div><div class="metric">💨 Hacia la playa: <strong>${Math.round(w.onshore||0)} km/h</strong></div><div class="metric">🌊 Olas: <strong>${wave}</strong></div><div class="metric">🌡️ Agua: <strong>${water}</strong></div><div class="actions"><button class="btn primary beach-cams-btn" data-beach="${esc(b.key)}">📹 Ver cámaras</button><a class="btn" target="_blank" rel="noopener" href="${maps(b)}">📍 Ir con Google Maps</a></div>`}
async function fillPanel(b,e,distance,title=true){e.innerHTML=`${title?`<h2>${esc(b.name)}</h2>`:''}<p>Cargando datos…</p>`;try{let w=await weather(b);e.innerHTML=`${title?`<h2>${esc(b.name)}</h2>`:''}${cardHTML(b,w,distance)}`}catch{e.innerHTML=`${title?`<h2>${esc(b.name)}</h2>`:''}<p>No se han podido cargar los datos meteorológicos.</p><div class="actions"><button class="btn primary beach-cams-btn" data-beach="${esc(b.key)}">📹 Ver cámaras</button><a class="btn" target="_blank" rel="noopener" href="${maps(b)}">📍 Ir con Google Maps</a></div>`}}
function initMap(){if(S.map)return;S.map=L.map('leafletMap').setView([39.65,2.95],9);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap'}).addTo(S.map);BEACHES.forEach(b=>{let m=L.marker([b.lat,b.lng],{title:b.name}).addTo(S.map).bindTooltip(`${b.name} · tocar para ver cámara`);m.on('click',()=>{S.selected=b;let d=S.pos?dist(S.pos.lat,S.pos.lng,b.lat,b.lng):null;fillPanel(b,$('#selected'),d);openPrimaryCamera(b)});S.markers[b.key]=m})}
function selectBeach(b){S.selected=b;S.map?.setView([b.lat,b.lng],13);let d=S.pos?dist(S.pos.lat,S.pos.lng,b.lat,b.lng):null;fillPanel(b,$('#selected'),d)}
async function drawNearest(){let e=$('#nearest');if(!S.pos){e.innerHTML='<h2>Playa más cercana</h2><p>Activa el GPS para calcularla.</p>';return}let n=nearest()[0];e.innerHTML=`<h2>Playa más cercana: ${esc(n.name)}</h2><p>Cargando…</p>`;try{let w=await weather(n);e.innerHTML=`<h2>Playa más cercana: ${esc(n.name)}</h2>${cardHTML(n,w,n.distance)}`}catch{e.innerHTML=`<h2>Playa más cercana: ${esc(n.name)}</h2><div class="distance">${n.distance.toFixed(1)} km</div>`}}
async function drivingTimes(list){if(!S.pos||!list.length)return list;const chosen=list,coords=[[S.pos.lng,S.pos.lat],...chosen.map(b=>[b.lng,b.lat])].map(x=>x.join(',')).join(';');try{const r=await fetch('https://router.project-osrm.org/table/v1/driving/'+coords+'?sources=0&annotations=duration',{cache:'no-store'});if(!r.ok)throw Error();const j=await r.json(),d=j.durations?.[0]||[];return chosen.map((b,i)=>({...b,driveMinutes:d[i+1]==null?null:Math.max(1,Math.round(d[i+1]/60))})).sort((a,b)=>(a.driveMinutes??1e9)-(b.driveMinutes??1e9))}catch{return chosen.map(b=>({...b,driveMinutes:null}))}}
async function renderNear(routed){let e=$('#nearList'),frag=document.createDocumentFragment();for(const b of routed){let c=document.createElement('article');c.className='near-card';try{let w=await weather(b);c.innerHTML=`<h3>${esc(b.name)}</h3><div class="distance">🚗 ${b.driveMinutes==null?'Tiempo no disponible':b.driveMinutes+' min'}</div>${cardHTML(b,w,null)}`}catch{c.innerHTML=`<h3>${esc(b.name)}</h3><div class="distance">🚗 ${b.driveMinutes==null?'Tiempo no disponible':b.driveMinutes+' min'}</div><div class="actions"><button class="btn primary beach-cams-btn" data-beach="${esc(b.key)}">📹 Ver cámaras</button><a class="btn" target="_blank" rel="noopener" href="${maps(b)}">📍 Ir con Google Maps</a></div>`}frag.appendChild(c)}e.replaceChildren(frag)}
function routeRefreshDue(){if(!S.pos||!S.lastRoutePos)return true;return Date.now()-S.lastRouteAt>=120000||dist(S.lastRoutePos.lat,S.lastRoutePos.lng,S.pos.lat,S.pos.lng)>=1}
async function drawNear(){let e=$('#nearList');if(!S.pos){if(!S.nearRouted)e.innerHTML='<div class="near-card"><h3>Activa el GPS</h3><p>Necesito tu ubicación para calcular el tiempo en coche.</p></div>';return}if(S.nearRouted&&!e.children.length)renderNear(S.nearRouted);if(!routeRefreshDue()||S.nearBusy)return;S.nearBusy=true;const routePos={lat:S.pos.lat,lng:S.pos.lng};try{let routed=await drivingTimes(nearest());S.nearRouted=routed;S.lastRoutePos=routePos;S.lastRouteAt=Date.now();if(S.view==='near')await renderNear(routed)}finally{S.nearBusy=false}}
function setPos(lat,lng){S.pos={lat,lng};if(S.map){if(!S.userMarker)S.userMarker=L.circleMarker([lat,lng],{radius:8,color:'#50d5ff',fillColor:'#50d5ff',fillOpacity:1}).addTo(S.map).bindTooltip('Tu posición');else S.userMarker.setLatLng([lat,lng])}drawNearest();if(S.view==='near')drawNear();if(S.selected)selectBeach(S.selected)}
function locate(){localStorage.setItem('bc-location-intro','1');if(!navigator.geolocation)return alert('Este dispositivo no admite geolocalización.');if(S.watch!=null)navigator.geolocation.clearWatch(S.watch);S.watch=navigator.geolocation.watchPosition(p=>{setPos(p.coords.latitude,p.coords.longitude);if(S.map&&!S.centered){S.map.setView([p.coords.latitude,p.coords.longitude],12);S.centered=true}},e=>alert(e.code===1?'Permiso de ubicación denegado.':'No se ha podido obtener tu ubicación.'),{enableHighAccuracy:true,maximumAge:60000,timeout:12000})}
function view(v){S.view=v;$$('.tab').forEach(x=>x.classList.toggle('on',x.dataset.view===v));$$('.view').forEach(x=>x.classList.toggle('on',x.id===v));if(v==='map'){initMap();setTimeout(()=>S.map.invalidateSize(),50);drawNearest()}if(v==='near')drawNear()}
document.addEventListener('click',e=>{const b=e.target.closest('.beach-cams-btn');if(!b)return;e.preventDefault();e.stopPropagation();window.openBeachCameras(b.dataset.beach)});
$$('.tab').forEach(x=>x.onclick=()=>view(x.dataset.view));$('#search').oninput=e=>{S.q=e.target.value;drawCams()};$('#closeViewer').onclick=()=>{if(history.state?.beachCam==='viewer')history.back();else closeCam()};window.addEventListener('popstate',()=>{if($('#viewerModal').classList.contains('open'))closeCam()});$('#closeSheet').onclick=()=>{let s=$('#cameraSheet');s.classList.remove('open');s.style.display=''};$('#locateTop').onclick=locate;$('#locateMap').onclick=locate;$('#locateNear').onclick=locate;$('#mallorca').onclick=()=>{initMap();S.map.setView([39.65,2.95],9)};$('#allowLocation').onclick=()=>{locate();$('#onboarding').classList.remove('show')};$('#later').onclick=()=>{localStorage.setItem('bc-location-intro','1');$('#onboarding').classList.remove('show')};window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();S.install=e;$('#installBtn').hidden=false});$('#installBtn').onclick=async()=>{if(S.install){S.install.prompt();await S.install.userChoice;S.install=null;$('#installBtn').hidden=true}};if('serviceWorker'in navigator){
 let reloading=false;
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading)return;reloading=true;location.reload()});
 navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(r=>{
  r.update();
  const refresh=()=>r.update().catch(()=>{});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh()});
  window.addEventListener('pageshow',refresh);
  setInterval(refresh,30*60*1000);
 }).catch(()=>{});
}if(!localStorage.getItem('bc-location-intro'))$('#onboarding').classList.add('show');drawFilters();drawCams();drawNearest();
