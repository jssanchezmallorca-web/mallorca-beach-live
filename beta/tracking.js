(function(){
  const cfg=window.BEACH_CAM_FIREBASE||{};
  const state={ready:false,app:null,auth:null,db:null,uid:null,lastSent:0,lastLat:null,lastLng:null,watch:null,sending:false};
  const PENDING='bc-location-pending';
  function configured(){return !!(cfg.enabled&&cfg.firebaseConfig&&cfg.firebaseConfig.apiKey&&cfg.firebaseConfig.databaseURL)}
  function cookie(name){const m=document.cookie.match(new RegExp('(?:^|; )'+name.replace(/([.$?*|{}()\[\]\\\/\+^])/g,'\\$1')+'=([^;]*)'));return m?decodeURIComponent(m[1]):''}
  function saveJoin(v){if(!v)return;localStorage.setItem('bc-family-join',v);document.cookie=`bc-family-join=${encodeURIComponent(v)}; Max-Age=31536000; Path=/; SameSite=Lax; Secure`}
  function joinKey(){const q=new URLSearchParams(location.search).get('join');if(q){saveJoin(q);try{history.replaceState({},'',location.pathname+location.hash)}catch{}}return q||localStorage.getItem('bc-family-join')||cookie('bc-family-join')||''}
  function platform(){const u=navigator.userAgent||'';if(/iPhone/i.test(u))return'iPhone';if(/iPad/i.test(u))return'iPad';if(/Android/i.test(u))return'Android';if(/Windows/i.test(u))return'Windows';if(/Macintosh|Mac OS/i.test(u))return'Mac';return'Dispositivo'}
  function automaticLabel(){return `${platform()} ${String(state.uid||'').slice(-4).toUpperCase()}`.trim()}
  function normalize(coords){return{lat:Number(coords.latitude),lng:Number(coords.longitude),accuracy:Number(coords.accuracy||0),heading:Number.isFinite(coords.heading)?Number(coords.heading):null,speed:Number.isFinite(coords.speed)?Number(coords.speed):null,capturedAt:Date.now()}}
  function savePending(p){try{localStorage.setItem(PENDING,JSON.stringify(p))}catch{}}
  function pending(){try{return JSON.parse(localStorage.getItem(PENDING)||'null')}catch{return null}}
  function clearPending(){try{localStorage.removeItem(PENDING)}catch{}}
  async function init(){if(state.ready||!configured())return state.ready;const key=joinKey();if(!key)return false;try{state.app=firebase.apps.find(a=>a.name==='tracker')||firebase.initializeApp(cfg.firebaseConfig,'tracker');state.auth=state.app.auth();state.db=state.app.database();await state.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);if(!state.auth.currentUser)await state.auth.signInAnonymously();state.uid=state.auth.currentUser.uid;state.ready=true;const ref=state.db.ref(`locations/${state.uid}`);ref.onDisconnect().update({online:false,lastDisconnect:firebase.database.ServerValue.TIMESTAMP});return true}catch(e){console.warn('BEACH CAM tracking init error',e);return false}}
  function movedEnough(lat,lng){if(state.lastLat==null)return true;const dx=(lat-state.lastLat)*111000,dy=(lng-state.lastLng)*85000;return Math.hypot(dx,dy)>=15}
  async function sendPoint(p){if(state.sending)return false;state.sending=true;try{if(!await init())return false;await state.db.ref(`locations/${state.uid}`).update({label:automaticLabel(),familyKey:joinKey(),lat:p.lat,lng:p.lng,accuracy:p.accuracy,heading:p.heading,speed:p.speed,online:true,capturedAt:p.capturedAt,updatedAt:firebase.database.ServerValue.TIMESTAMP});state.lastSent=Date.now();state.lastLat=p.lat;state.lastLng=p.lng;clearPending();return true}catch(e){console.warn('BEACH CAM tracking update error',e);return false}finally{state.sending=false}}
  async function updateLocation(coords){if(!configured()||!coords||!joinKey())return false;const p=normalize(coords);savePending(p);const now=Date.now();if(now-state.lastSent<12000&&!movedEnough(p.lat,p.lng))return true;if(!navigator.onLine)return false;return sendPoint(p)}
  async function flushPending(){if(!configured()||!joinKey()||!navigator.onLine)return false;const p=pending();return p?sendPoint(p):true}
  function start(){if(!configured()||state.watch!=null||!navigator.geolocation||!localStorage.getItem('bc-location-intro')||!joinKey())return false;state.watch=navigator.geolocation.watchPosition(p=>updateLocation(p.coords),e=>console.warn('BEACH CAM family GPS',e),{enableHighAccuracy:true,maximumAge:30000,timeout:15000});flushPending();return true}
  const timer=setInterval(()=>{if(start())clearInterval(timer)},1500);
  window.addEventListener('pageshow',()=>{start();flushPending()});
  window.addEventListener('online',flushPending);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')flushPending()});
  window.BeachCamTracking={configured,init,updateLocation,start,joinKey,flushPending};
})();
