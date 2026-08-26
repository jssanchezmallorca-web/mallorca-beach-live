(function(){
  // Convierte la capa satélite de CAMPER en una vista híbrida: foto aérea + calles/carreteras + nombres.
  // Se aplica antes de que el mapa CAMPER se cree por primera vez.
  try{
    if(window.L?.tileLayer && !window.__BC_HYBRID_MAP_PATCHED__){
      window.__BC_HYBRID_MAP_PATCHED__=true;
      const originalTileLayer=L.tileLayer;
      const originalFactory=originalTileLayer.bind(L);
      function patchedTileLayer(url,options){
        if(String(url||'').includes('/World_Imagery/MapServer/tile/')){
          const imagery=originalFactory(url,Object.assign({},options,{maxZoom:20,zIndex:1}));
          const roads=originalFactory('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',{
            maxZoom:20,
            zIndex:20,
            attribution:'© Esri'
          });
          const labels=originalFactory('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{
            maxZoom:20,
            zIndex:30,
            attribution:'© Esri'
          });
          const hybrid=L.layerGroup([imagery,roads,labels]);
          hybrid._bcHybrid=true;
          return hybrid;
        }
        return originalFactory(url,options);
      }
      Object.assign(patchedTileLayer,originalTileLayer);
      L.tileLayer=patchedTileLayer;
    }
  }catch(e){console.warn('BEACH CAM CAMPER hybrid map',e)}

  const APPROVED='bc-location-approved';
  let coreStarted=false,camperStarted=false;
  function approved(){return localStorage.getItem(APPROVED)==='1'}
  async function permissionGranted(){
    if(!approved()||!navigator.geolocation)return false;
    try{
      if(navigator.permissions?.query){
        const p=await navigator.permissions.query({name:'geolocation'});
        if(p.state==='denied')return false;
        if(p.state==='granted')return true;
      }
    }catch{}
    return true;
  }
  async function startCore(){
    if(coreStarted||!await permissionGranted())return;
    coreStarted=true;
    document.getElementById('locateTop')?.click();
  }
  async function startCamper(){
    if(camperStarted||!await permissionGranted())return;
    camperStarted=true;
    setTimeout(()=>document.getElementById('camperGps')?.click(),90);
  }
  document.querySelector('.tab[data-view="near"]')?.addEventListener('click',()=>startCore());
  document.querySelector('.tab[data-view="map"]')?.addEventListener('click',()=>startCore());
  document.querySelector('.tab[data-view="camper"]')?.addEventListener('click',()=>{startCore();startCamper()});
  document.getElementById('allowLocation')?.addEventListener('click',()=>{coreStarted=true});
  window.addEventListener('pageshow',()=>setTimeout(startCore,250));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')startCore()});
})();
