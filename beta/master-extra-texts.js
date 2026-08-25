(function(){
  const LABELS={
    locationTitle:'Título del aviso de ubicación',
    backgroundNotice:'Explicación de ubicación en segundo plano',
    allowLocation:'Botón para permitir ubicación',
    later:'Botón para dejarlo para más tarde',
    gpsUnsupported:'Error: dispositivo sin geolocalización',
    gpsDenied:'Error: permiso de ubicación denegado',
    gpsUnavailable:'Error: no se pudo obtener ubicación',
    nearGpsTitle:'CERCA: título cuando falta GPS',
    nearGpsText:'CERCA: explicación cuando falta GPS',
    installIntro:'Instalación: texto introductorio',
    installButton:'Instalación: botón principal',
    openApp:'Instalación: botón abrir app',
    installWait:'Android: espera del instalador',
    installReady:'Android: instalación disponible',
    installFallback:'Android: ayuda si no aparece instalar',
    iosInstallTitle:'iPhone/iPad: título de instalación',
    iosInstallStep1:'iPhone/iPad: paso 1',
    iosInstallStep2:'iPhone/iPad: paso 2',
    iosInstallStep3:'iPhone/iPad: paso 3',
    alreadyInstalled:'Mensaje cuando BEACH CAM ya está instalada'
  };
  const defaults=window.BEACH_CAM_TEXTS||{};
  const container=document.getElementById('extraTextEditors');
  const save=document.getElementById('saveAllTexts');
  const restore=document.getElementById('restoreAllTexts');
  const status=document.getElementById('allTextsMsg');
  if(!container||!save||!restore||!window.firebase)return;
  function field(key,label,value){
    const wrap=document.createElement('div');wrap.style.marginBottom='12px';
    const lab=document.createElement('label');lab.className='sub';lab.textContent=label;
    const ta=document.createElement('textarea');ta.className='master-textarea';ta.dataset.textKey=key;ta.maxLength=700;ta.value=value||'';
    wrap.append(lab,ta);return wrap;
  }
  async function ready(user){
    const cfg=window.BEACH_CAM_FIREBASE||{};
    if(!user||String(user.email||'').toLowerCase()!==String(cfg.masterEmail||'').toLowerCase())return;
    const ref=firebase.database().ref('publicConfig/texts');
    const snap=await ref.once('value'),remote=snap.val()||{};
    container.innerHTML='';
    Object.entries(LABELS).forEach(([key,label])=>container.appendChild(field(key,label,typeof remote[key]==='string'?remote[key]:defaults[key]||'')));
    save.onclick=async()=>{
      const payload={};let bad=false;
      container.querySelectorAll('[data-text-key]').forEach(el=>{const v=el.value.trim();if(!v)bad=true;payload[el.dataset.textKey]=v});
      if(bad){status.textContent='No dejes avisos vacíos. Si no quieres mostrar uno, usa una frase breve.';status.className='status err';return}
      await ref.set(payload);status.textContent='Avisos guardados. El enlace familiar y el QR no cambian.';status.className='status ok';
    };
    restore.onclick=()=>{container.querySelectorAll('[data-text-key]').forEach(el=>el.value=defaults[el.dataset.textKey]||'');status.textContent='Textos base cargados. Pulsa Guardar todos para aplicarlos.';status.className='status'};
  }
  firebase.auth().onAuthStateChanged(u=>ready(u).catch(e=>{status.textContent=e.message||'No se han podido cargar los avisos.';status.className='status err'}));
})();
