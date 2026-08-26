(function(){
  const cfg=window.BEACH_CAM_FIREBASE||{};
  const state={ready:false,app:null,auth:null,db:null,uid:null,lastSent:0,lastLat:null,lastLng:null,watch:null,sending:false,deviceLabel:''};
  const PENDING='bc-location-pending',APPROVED='bc-location-approved';
  function configured(){return !!(cfg.enabled&&cfg.firebaseConfig&&cfg.firebaseConfig.apiKey&&cfg.firebaseConfig.databaseURL)}
  function approved(){return localStorage.getItem(APPROVED)==='1'}
  function cookie(name){const m=document.cookie.match(new RegExp('(?:^|; )'+name.replace(/([.$?*|{}()\[\]\\\/\+^])/g,'\\$1')+'=([^;]*)'));return m?decodeURIComponent(m[1]):''}
  function saveJoin(v){if(!v)return;localStorage.setItem('bc-family-join',v);document.cookie=`bc-family-join=${encodeURIComponent(v)}; Max-Age=31536000; Path=/; SameSite=Lax; Secure`}
  function joinKey(){const q=new URLSearchParams(location.search).get('join');if(q){saveJoin(q);try{history.replaceState({},'',location.pathname+location.hash)}catch{}}return q||localStorage.getItem('bc-family-join')||cookie('bc-family-join')||''}
  function clean(v){return String(v||'').trim().replace(/\s+/g,' ').slice(0,48)}
  function prettyModel(raw){const m=clean(raw);if(!m)return'';const x=m.toUpperCase();const samsung={
    'SM-S911B':'Galaxy S23','SM-S911U':'Galaxy S23','SM-S911U1':'Galaxy S23','SM-S911N':'Galaxy S23',
    'SM-S916B':'Galaxy S23+','SM-S916U':'Galaxy S23+','SM-S916U1':'Galaxy S23+','SM-S916N':'Galaxy S23+',
    'SM-S918B':'Galaxy S23 Ultra','SM-S918U':'Galaxy S23 Ultra','SM-S918U1':'Galaxy S23 Ultra','SM-S918N':'Galaxy S23 Ultra',
    'SM-S921B':'Galaxy S24','SM-S921U':'Galaxy S24','SM-S921U1':'Galaxy S24',
    'SM-S926B':'Galaxy S24+','SM-S926U':'Galaxy S24+','SM-S926U1':'Galaxy S24+',
    'SM-S928B':'Galaxy S24 Ultra','SM-S928U':'Galaxy S24 Ultra','SM-S928U1':'Galaxy S24 Ultra',
    'SM-S931B':'Galaxy S25','SM-S931U':'Galaxy S25','SM-S931U1':'Galaxy S25',
    'SM-S936B':'Galaxy S25+','SM-S936U':'Galaxy S25+','SM-S936U1':'Galaxy S25+',
    'SM-S938B':'Galaxy S25 Ultra','SM-S938U':'Galaxy S25 Ultra','SM-S938U1':'Galaxy S25 Ultra'
  };
  if(samsung[x])return samsung[x];
  if(/^SM-[A-Z0-9-]+$/.test(x))return`Samsung ${x}`;
  return m;
  }
  function uaBase(){const u=navigator.userAgent||'';const sm=(u.match(/\bSM-[A-Z0-9-]+\b/i)||[])[0];if(sm)return prettyModel(sm);const px=(u.match(/\bPixel\s+[A-Za-z0-9 ProFold]+/i)||[])[0];if(px)return clean(px);if(/iPhone/i.test(u))return'iPhone';if(/iPad/i.test(u))return'iPad';if(/Android/i.test(u))return'Android';if(/Windows/i.test(u))return'PC Windows';if(/Macintosh|Mac OS/i.test(u))return'Mac';return'Dispositivo'}
  function suffix(){return String(state.uid||'').slice(-4).toUpperCase()||'----'}
  async function detectDeviceLabel(){let base=uaBase();try{if(navigator.userAgentData?.getHighEntropyValues){const d=await navigator.userAgentData.getHighEntropyValues(['model','platform']);if(d?.model)base=prettyModel(d.model)||base;else if(base==='Dispositivo'&&d?.platform)base=clean(d.platform)}}catch{}state.deviceLabel=`${base} · ${suffix()}`;return state.deviceLabel}
  function automaticLabel(){return state.deviceLabel||`${uaBase()} · ${suffix()}`}
  function normalize(coords){return{lat:Number(coords.latitude),lng:Number(coords.longitude),accuracy:Number(coords.accuracy||0),heading:Number.isFinite(coords.heading)?Number(coords.heading):null,speed:Number.isFinite(coords.speed)?Number(coords.speed):null,capturedAt:Date.now()}}
  function savePending(p){try{localStorage.setItem(PENDING,JSON.stringify(p))}catch{}}
  function pending(){try{return JSON.parse(localStorage.getItem(PENDING)||'null')}catch{return null}}
  function clearPending(){try{localStorage.removeItem(PENDING)}catch{}}
  async function init(){if(state.ready||!configured())return state.ready;const key=joinKey();if(!key||!approved())return false;try{state.app=firebase.apps.find(a=>a.name==='tracker')||firebase.initializeApp(cfg.firebaseConfig,'tracker');state.auth=state.app.auth();state.db=state.app.database();await state.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);if(!state.auth.currentUser)await state.auth.signInAnonymously();state.uid=state.auth.currentUser.uid;await detectDeviceLabel();state.ready=true;const ref=state.db.ref(`locations/${state.uid}`);ref.onDisconnect().update({online:false,lastDisconnect:firebase.database.ServerValue.TIMESTAMP});return true}catch(e){console.warn('BEACH CAM CAMPER tracking init error',e);return false}}
  function movedEnough(lat,lng){if(state.lastLat==null)return true;const dx=(lat-state.lastLat)*111000,dy=(lng-state.lastLng)*85000;return Math.hypot(dx,dy)>=15}
  async function sendPoint(p){if(state.sending)return false;state.sending=true;try{if(!await init())return false;await state.db.ref(`locations/${state.uid}`).update({label:automaticLabel(),familyKey:joinKey(),lat:p.lat,lng:p.lng,accuracy:p.accuracy,heading:p.heading,speed:p.speed,online:true,capturedAt:p.capturedAt,updatedAt:firebase.database.ServerValue.TIMESTAMP});state.lastSent=Date.now();state.lastLat=p.lat;state.lastLng=p.lng;clearPending();return true}catch(e){console.warn('BEACH CAM CAMPER tracking update error',e);return false}finally{state.sending=false}}
  async function updateLocation(coords){if(!configured()||!coords||!joinKey()||!approved())return false;const p=normalize(coords);savePending(p);const now=Date.now();if(now-state.lastSent<12000&&!movedEnough(p.lat,p.lng))return true;if(!navigator.onLine)return false;return sendPoint(p)}
  async function flushPending(){if(!configured()||!joinKey()||!approved()||!navigator.onLine)return false;const p=pending();return p?sendPoint(p):true}
  function start(){if(!configured()||state.watch!=null||!navigator.geolocation||!approved()||!joinKey())return false;state.watch=navigator.geolocation.watchPosition(p=>updateLocation(p.coords),e=>console.warn('BEACH CAM CAMPER family GPS',e),{enableHighAccuracy:true,maximumAge:30000,timeout:15000});flushPending();return true}
  function grant(){localStorage.setItem(APPROVED,'1');setTimeout(start,0)}
  function defer(){localStorage.removeItem(APPROVED)}
  ['allowLocation','locateTop','locateMap','locateNear','camperGps'].forEach(id=>document.getElementById(id)?.addEventListener('click',grant));
  document.getElementById('later')?.addEventListener('click',defer);
  const timer=setInterval(()=>{if(start())clearInterval(timer)},1500);
  window.addEventListener('pageshow',()=>{start();flushPending()});
  window.addEventListener('online',flushPending);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')flushPending()});
  window.BeachCamTracking={configured,init,updateLocation,start,joinKey,flushPending,approved,deviceLabel:()=>automaticLabel()};
})();
