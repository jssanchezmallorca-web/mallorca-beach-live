(function(){
  const health=window.BEACH_CAM_HEALTH?.cameras||{};
  function stateFor(c){return health[c.key]?.status||'unknown'}
  function label(s){return s==='online'?['🟢 ONLINE','online']:s==='offline'?['🔴 OFFLINE','offline']:['🟠 SIN CONFIRMAR','unknown']}
  function decorateGrid(){
    document.querySelectorAll('#grid .card').forEach(card=>{
      const name=card.querySelector('.name')?.textContent?.trim();
      const c=CAMERAS.find(x=>x.name===name);if(!c)return;
      const [txt,cls]=label(stateFor(c));
      const badge=card.querySelector('.badge.live');if(badge){badge.textContent=txt;badge.dataset.health=cls;badge.style.background=cls==='offline'?'#7d1824':cls==='online'?'#126b43':'#8a5a00'}
      const last=card.querySelector('.meta span:last-child');if(last)last.textContent=txt.replace(/^..\s*/, '');
    });
  }
  function decorateSheet(){
    document.querySelectorAll('#sheetList .camera-btn').forEach(btn=>{
      const strong=btn.querySelector('strong');if(!strong)return;
      const c=CAMERAS.find(x=>x.name===strong.textContent.trim());if(!c)return;
      const [txt]=label(stateFor(c));
      let small=btn.querySelector('small');if(small&&!small.textContent.includes('ONLINE')&&!small.textContent.includes('OFFLINE')&&!small.textContent.includes('CONFIRMAR')) small.textContent += ` · ${txt}`;
    });
  }
  const obs=new MutationObserver(()=>{decorateGrid();decorateSheet()});
  const grid=document.querySelector('#grid'),sheet=document.querySelector('#sheetList');
  if(grid)obs.observe(grid,{childList:true,subtree:true});
  if(sheet)obs.observe(sheet,{childList:true,subtree:true});
  decorateGrid();decorateSheet();
})();
