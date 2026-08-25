#!/usr/bin/env python3
import json,re,urllib.request,urllib.error
from datetime import datetime,timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
HEALTH=ROOT/'camera-health.js'
UA='Mozilla/5.0 BEACH-CAM-health-check/1.0'
TIMEOUT=15

def cameras():
    text=(ROOT/'cameras.js').read_text(encoding='utf-8')
    rx=re.compile(r'\["([^"]+)","([^"]+)","([^"]+)","([^"]+)","([^"]+)","([^"]*)","([^"]*)"\]')
    out=[dict(key=a[0],name=a[1],region=a[2],provider=a[3],mode=a[4],param=a[5],url=a[6]) for a in rx.findall(text)]
    extra=(ROOT/'beta/extra-cameras.js')
    if extra.exists():
        t=extra.read_text(encoding='utf-8')
        for block in re.findall(r'CAMERAS\.push\(\{(.*?)\}\);',t,re.S):
            def f(k):
                m=re.search(rf"{k}:'([^']*)'",block)
                return m.group(1) if m else ''
            out.append({k:f(k) for k in ['key','name','region','provider','mode','param','url']})
    return [c for c in out if c.get('key')]

def load_health():
    if not HEALTH.exists(): return {'updatedAt':None,'cameras':{}}
    t=HEALTH.read_text(encoding='utf-8')
    m=re.search(r'window\.BEACH_CAM_HEALTH\s*=\s*(\{.*\})\s*;',t,re.S)
    if not m:return {'updatedAt':None,'cameras':{}}
    try:return json.loads(m.group(1))
    except:return {'updatedAt':None,'cameras':{}}

def get(url,limit=700000):
    req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':'*/*'})
    with urllib.request.urlopen(req,timeout=TIMEOUT) as r:
        return r.status,(r.headers.get('Content-Type') or '').lower(),r.read(limit)

def probe(c):
    try:
        mode=c['mode']
        if mode=='youtube':
            vid=c['param']; status,ct,data=get('https://www.youtube.com/watch?v='+vid)
            s=data.decode('utf-8','ignore')
            if status!=200:return 'unknown',f'YouTube HTTP {status}; no concluyente'
            if '"isLiveNow":true' in s or '"isLive":true' in s:return 'online','YouTube live detectado'
            if 'LIVE_STREAM_OFFLINE' in s or ('"isLiveContent":true' in s and '"isLiveNow":false' in s):return 'offline','YouTube indica directo sin emisión'
            return 'unknown','YouTube accesible; estado del directo no confirmable'
        if mode=='ipcam':
            alias=c['param']; status,ct,data=get(f'https://g0.ipcamlive.com/player/snapshot.php?alias={alias}',200000)
            return ('online','Snapshot IPCam válido') if status==200 and 'image' in ct and len(data)>1000 else ('fail','Snapshot IPCam inválido')
        if mode=='mjpeg':
            status,ct,data=get(c['url'],120000)
            return ('online','MJPEG responde') if status==200 and (('image' in ct) or ('multipart' in ct)) and len(data)>1000 else ('fail','MJPEG no responde como imagen')
        status,ct,data=get(c['url'])
        if status!=200:return 'fail',f'HTTP {status}'
        s=data.decode('utf-8','ignore').lower()
        offline_terms=['actualmente fuera de línea','currently offline','webcam is offline','camera is offline','webcam offline']
        if any(x in s for x in offline_terms):return 'offline','La página indica que la webcam está offline'
        return 'unknown','Página accesible; vídeo no verificable automáticamente'
    except Exception as e:
        if c.get('mode')=='youtube':return 'unknown',f'YouTube no concluyente: {type(e).__name__}'
        return 'fail',f'{type(e).__name__}: {str(e)[:100]}'

def main():
    old=load_health(); prev=old.get('cameras',{}); now=datetime.now(timezone.utc).isoformat(timespec='seconds')
    result={}
    for c in cameras():
        p=prev.get(c['key'],{}); verdict,note=probe(c)
        failures=int(p.get('failures',0) or 0)
        if verdict=='online':
            status='online';failures=0
        elif verdict in ('offline','fail'):
            failures+=1
            status='offline' if failures>=2 else p.get('status','unknown')
        else:
            failures=0
            status='offline' if p.get('status')=='offline' else 'unknown'
        result[c['key']]={'status':status,'failures':failures,'checkedAt':now,'note':note}
        print(f"{c['key']}: {status} ({verdict}) - {note}")
    payload={'updatedAt':now,'cameras':result}
    HEALTH.write_text('// Generado automáticamente por .github/workflows/check-cameras.yml\n// Ninguna cámara se elimina por estar offline.\nwindow.BEACH_CAM_HEALTH = '+json.dumps(payload,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')

if __name__=='__main__':main()
