(function(){
  let STATUS={};
  const palette={online:'#168c52',offline:'#c92f3f',unknown:'#c97916'};
  const labels={online:'🟢 ONLINE',offline:'🔴 OFFLINE',unknown:'🟠 SIN CONFIRMAR'};

  function currentStatus(key){
    const x=STATUS[key]||{};
    const status=['online','offline'].includes(x.status)?x.status:'unknown';
    return {...x,status};
  }

  function patchGrid(){
    if(typeof CAMERAS==='undefined')return;
    document.querySelectorAll('#grid .card').forEach(card=>{
      const name=card.querySelector('.name')?.textContent?.trim();
      const cam=CAMERAS.find(c=>c.name===name);
      if(!cam)return;
      const st=currentStatus(cam.key);
      const badge=card.querySelector('.badge.live');
      if(badge){
        badge.textContent=labels[st.status];
        badge.style.background=palette[st.status];
        badge.title=st.reason||'';
      }
      const meta=card.querySelector('.meta span:last-child');
      if(meta){
        meta.textContent=st.status==='online'?'✓ online':st.status==='offline'?'● offline':'? sin confirmar';
        meta.title=st.reason||'';
      }
      card.dataset.cameraStatus=st.status;
    });
  }

  function patchSheet(){
    if(typeof CAMERAS==='undefined')return;
    document.querySelectorAll('#sheetList .camera-btn').forEach(btn=>{
      const strong=btn.querySelector('strong');
      if(!strong)return;
      const cam=CAMERAS.find(c=>c.name===strong.textContent.trim());
      if(!cam)return;
      const st=currentStatus(cam.key);
      let state=btn.querySelector('.health-state');
      if(!state){
        state=document.createElement('small');
        state.className='health-state';
        state.style.display='block';
        state.style.marginTop='3px';
        strong.parentElement.appendChild(state);
      }
      state.textContent=labels[st.status];
      state.style.color=palette[st.status];
      state.title=st.reason||'';
    });
  }

  async function load(){
    try{
      const r=await fetch(`../camera-status.json?t=${Date.now()}`,{cache:'no-store'});
      if(!r.ok)throw new Error(`HTTP ${r.status}`);
      const j=await r.json();
      STATUS=j.cameras||{};
      window.BeachCamCameraHealth={updatedAt:j.updatedAt||null,status:STATUS};
    }catch(e){
      console.warn('BEACH CAM camera health',e);
    }
    patchGrid();patchSheet();
  }

  const grid=document.getElementById('grid');
  const sheet=document.getElementById('sheetList');
  if(grid)new MutationObserver(()=>queueMicrotask(patchGrid)).observe(grid,{childList:true,subtree:true});
  if(sheet)new MutationObserver(()=>queueMicrotask(patchSheet)).observe(sheet,{childList:true,subtree:true});
  load();
})();
