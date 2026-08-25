(function(){
  const baseWeather=window.weather;
  const baseCardHTML=window.cardHTML;
  const cache=new Map();

  async function seaTemperature(b){
    const old=cache.get(b.key);
    if(old&&Date.now()-old.t<1200000)return old.v;
    let value=null;
    try{
      const url=`https://marine-api.open-meteo.com/v1/marine?latitude=${b.lat}&longitude=${b.lng}&hourly=sea_surface_temperature&forecast_days=1&timezone=Europe%2FMadrid&cell_selection=sea`;
      const r=await fetch(url);
      if(r.ok){
        const j=await r.json();
        const times=j.hourly?.time||[],vals=j.hourly?.sea_surface_temperature||[];
        if(times.length&&vals.length){
          const now=Date.now();let best=0,delta=Infinity;
          times.forEach((x,i)=>{const d=Math.abs(new Date(x).getTime()-now);if(d<delta){delta=d;best=i}});
          const n=Number(vals[best]);if(Number.isFinite(n))value=n;
        }
      }
    }catch(e){console.warn('BEACH CAM sea temperature',e)}
    cache.set(b.key,{t:Date.now(),v:value});
    return value;
  }

  window.weather=async function(b){
    const d=await baseWeather(b);
    const waterTemp=await seaTemperature(b);
    return Object.assign({},d,{waterTemp});
  };

  window.cardHTML=function(b,w,distance){
    let html=baseCardHTML(b,w,distance);
    const water=w&&Number.isFinite(Number(w.waterTemp))?`${Number(w.waterTemp).toFixed(1)} °C`:'—';
    const metric=`<div class="metric">🌡️ Agua: <strong>${water}</strong></div>`;
    return html.replace('<div class="actions">',metric+'<div class="actions">');
  };
})();
