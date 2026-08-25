(function(){
  function escLocal(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function findBeach(key){try{return BEACHES.find(b=>b.key===key)}catch{return null}}
  function findCameras(b){if(!b)return[];try{return (b.cameraKeys||[]).map(k=>CAMERAS.find(c=>c.key===k)).filter(Boolean)}catch{return[]}}
  function buildNode(c){
    if(c.mode==='youtube'||c.mode==='ipcam'){
      const f=document.createElement('iframe');
      f.src=c.mode==='youtube'?`https://www.youtube-nocookie.com/embed/${c.video}?autoplay=1&playsinline=1&rel=0`:`https://g0.ipcamlive.com/player/player.php?alias=${c.alias}&autoplay=1`;
      f.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen=true;
      return f;
    }
    if(c.mode==='mjpeg'){const i=document.createElement('img');i.src=c.url;return i;}
    const d=document.createElement('div');d.className='external';
    d.innerHTML=`<h2>${escLocal(c.name)}</h2><p>Este proveedor debe abrirse en su página original.</p><a class="btn primary" target="_blank" rel="noopener" href="${escLocal(c.url)}">Abrir directo ↗</a>`;
    return d;
  }
  function openOne(c){
    if(!c)return;
    const modal=document.getElementById('viewerModal'),viewer=document.getElementById('viewer'),title=document.getElementById('viewerTitle'),original=document.getElementById('original');
    if(!modal||!viewer)return;
    if(title)title.textContent=c.name||'Cámara';
    if(original)original.href=c.url||'#';
    viewer.innerHTML='';viewer.appendChild(buildNode(c));
    modal.classList.add('open');modal.style.display='flex';modal.style.zIndex='99999';
  }
  function openBeach(key){
    const b=findBeach(key),cams=findCameras(b);
    if(!b)return;
    if(cams.length===1){openOne(cams[0]);return;}
    const sheet=document.getElementById('cameraSheet'),title=document.getElementById('sheetTitle'),list=document.getElementById('sheetList');
    if(!sheet||!list)return;
    if(title)title.textContent=`${b.name} · cámaras`;
    list.innerHTML='';
    if(!cams.length){list.innerHTML='<div class="camera-btn"><span>No hay cámaras asociadas.</span></div>';}
    else cams.forEach(c=>{const x=document.createElement('button');x.className='camera-btn';x.innerHTML=`<span><strong>${escLocal(c.name)}</strong><br><small>${escLocal(c.provider)}</small></span><span>Ver ▶</span>`;x.addEventListener('click',()=>{sheet.classList.remove('open');sheet.style.display='none';openOne(c)});list.appendChild(x)});
    sheet.classList.add('open');sheet.style.display='flex';sheet.style.zIndex='99998';
  }
  window.BeachCamOpenBeachCameras=openBeach;
  window.openBeachCameras=function(keyOrBeach){openBeach(typeof keyOrBeach==='string'?keyOrBeach:keyOrBeach?.key)};
  document.addEventListener('click',function(ev){
    const btn=ev.target.closest('button');if(!btn)return;
    const raw=btn.getAttribute('onclick')||'';
    const m=raw.match(/openBeachCameras\(['\"]([^'\"]+)['\"]\)/);
    if(!m)return;
    ev.preventDefault();ev.stopImmediatePropagation();openBeach(m[1]);
  },true);
})();
