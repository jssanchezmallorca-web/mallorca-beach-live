(function(){
  const cfg=window.BEACH_CAM_FIREBASE||{};
  const target=document.getElementById('locationNotice');
  if(!target||!cfg.enabled||!cfg.firebaseConfig?.apiKey||!cfg.firebaseConfig?.databaseURL||!window.firebase)return;
  try{
    const app=firebase.apps.find(a=>a.name==='publicText')||firebase.initializeApp(cfg.firebaseConfig,'publicText');
    app.database().ref('publicConfig/locationNotice').on('value',snap=>{
      const text=snap.val();
      if(typeof text==='string'&&text.trim())target.textContent=text.trim();
    });
  }catch(e){console.warn('BEACH CAM public text config',e)}
})();
