(function(){
  const defaults=window.BEACH_CAM_TEXTS||{};
  let remote={},legacy='';
  window.BEACH_CAM_EFFECTIVE_TEXTS={...defaults};
  function apply(){
    const merged={...defaults,...remote};
    if(legacy&&typeof legacy==='string')merged.locationNotice=legacy.trim();
    window.BEACH_CAM_EFFECTIVE_TEXTS=merged;
    document.querySelectorAll('[data-bc-text]').forEach(el=>{
      const key=el.dataset.bcText,text=merged[key];
      if(typeof text==='string'&&text.trim())el.textContent=text.trim();
    });
    window.dispatchEvent(new CustomEvent('beachcamtexts',{detail:merged}));
  }
  apply();
  const cfg=window.BEACH_CAM_FIREBASE||{};
  if(!cfg.enabled||!cfg.firebaseConfig?.apiKey||!cfg.firebaseConfig?.databaseURL||!window.firebase)return;
  try{
    const app=firebase.apps.find(a=>a.name==='publicText')||firebase.initializeApp(cfg.firebaseConfig,'publicText');
    const db=app.database();
    db.ref('publicConfig/texts').on('value',snap=>{const v=snap.val();remote=v&&typeof v==='object'?v:{};apply()});
    db.ref('publicConfig/locationNotice').on('value',snap=>{legacy=typeof snap.val()==='string'?snap.val():'';apply()});
  }catch(e){console.warn('BEACH CAM public text config',e)}
})();
