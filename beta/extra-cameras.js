(function(){
  if(typeof CAMERAS!=='undefined'&&!CAMERAS.some(c=>c.key==='sa-rapita-club')){
    CAMERAS.push({
      key:'sa-rapita-club',
      name:'Sa Ràpita · Club Nàutic / Arenal',
      region:'Migjorn',
      provider:'Club Nàutic Sa Ràpita · WorldCam',
      mode:'external',
      param:'https://es.worldcam.eu/webcams/europe/spain/29036-mayorca-sa-rapita-arenal-de-sa-rapita',
      url:'https://es.worldcam.eu/webcams/europe/spain/29036-mayorca-sa-rapita-arenal-de-sa-rapita',
      verified:'25/08/2026'
    });
  }
  if(typeof BEACHES!=='undefined'&&!BEACHES.some(b=>b.key==='sa-rapita')){
    BEACHES.push({
      key:'sa-rapita',
      name:'Sa Ràpita · Club Nàutic',
      region:'Migjorn',
      lat:39.363333,
      lng:2.954722,
      shoreBearing:180,
      cameraKeys:['sa-rapita-club']
    });
  }
})();
