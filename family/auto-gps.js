(function(){
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
