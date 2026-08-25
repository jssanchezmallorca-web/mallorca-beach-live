(function(){
  function showBeachCamerasSafe(b){
    if(!b)return;
    const list=beachCams(b);
    if(!list.length){
      $('#sheetTitle').textContent=`${b.name||'Playa'} · cámaras`;
      $('#sheetList').innerHTML='<div class="camera-btn"><span>No hay cámaras asociadas.</span></div>';
      $('#cameraSheet').classList.add('open');
      return;
    }
    if(list.length===1){openCam(list[0]);return;}
    $('#sheetTitle').textContent=`${b.name} · cámaras`;
    const e=$('#sheetList');
    e.innerHTML='';
    list.forEach(c=>{
      const x=document.createElement('button');
      x.className='camera-btn';
      x.innerHTML=`<span><strong>${esc(c.name)}</strong><br><small>${esc(c.provider)}</small></span><span>Ver ▶</span>`;
      x.onclick=()=>{$('#cameraSheet').classList.remove('open');openCam(c)};
      e.appendChild(x);
    });
    $('#cameraSheet').classList.add('open');
  }
  window.openBeachCameras=function(keyOrBeach){
    const b=typeof keyOrBeach==='string'?beach(keyOrBeach):keyOrBeach;
    showBeachCamerasSafe(b);
  };
})();
