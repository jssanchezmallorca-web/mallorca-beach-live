(function(){
  const nativeAlert=window.alert.bind(window);
  const fallbackMap={
    'Este dispositivo no admite geolocalización.':'gpsUnsupported',
    'Permiso de ubicación denegado.':'gpsDenied',
    'No se ha podido obtener tu ubicación.':'gpsUnavailable'
  };
  window.alert=function(message){
    const key=fallbackMap[String(message||'')];
    if(!key)return nativeAlert(message);
    const t=(window.BEACH_CAM_EFFECTIVE_TEXTS&&window.BEACH_CAM_EFFECTIVE_TEXTS[key])||(window.BEACH_CAM_TEXTS&&window.BEACH_CAM_TEXTS[key])||message;
    return nativeAlert(t);
  };
})();
