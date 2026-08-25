(function(){
  const defaults=window.BEACH_CAM_TEXTS||{};
  window.BEACH_CAM_EFFECTIVE_TEXTS={...defaults};
  function apply(texts){
    window.BEACH_CAM_EFFECTIVE_TEXTS={...defaults,...(texts||{})};
    document.querySelectorAll('[data-bc-text]').forEach(el=>{
      const key=el.dataset.bcText,text=window.BEACH_CAM_EFFECTIVE_TEXTS[key];
      if(typeof text==='string'&&text.trim())el.textContent=text.trim();
    });
    window.dispatchEvent(new CustomEvent('beachcamtexts',{detail:window.BEACH_CAM_EFFECTIVE_TEXTS}));
  }
  apply({});
  const cfg=window.BEACH_CAM_FIREBASE||{};
  if(!cfg.enabled||!cfg.firebaseConfig?.apiKey||!cfg.firebaseConfig?.databaseURL||!window.firebase)return;
  try{
    const app=firebase.apps.find(a=>a.name==='publicText')||firebase.initializeApp(cfg.firebaseConfig,'publicText');
    app.database().ref('publicConfig/texts').on('value',snap=>{
      const value=snap.val();
      apply(value&&typeof value==='object'?value:{});
    });
  }catch(e){console.warn('BEACH CAM public text config',e)}
})();
