import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

# Registro local de estado. Nunca elimina cámaras: solo marca estado.
STATUS_FILE = Path('camera-status.json')

KNOWN_OFFLINE = {
    'sa-rapita-nautic': {
        'name': 'Club Nàutic Sa Ràpita',
        'status': 'offline'
    }
}


def check(url):
    try:
        req = Request(url, headers={'User-Agent': 'BEACH-CAM-monitor/1.0'})
        with urlopen(req, timeout=12) as r:
            return r.status < 400
    except Exception:
        return False


result = {
    'updatedAt': datetime.now(timezone.utc).isoformat(),
    'cameras': KNOWN_OFFLINE.copy()
}

# Se prepara la estructura para conectar con cameras.js sin borrar entradas.
if STATUS_FILE.exists():
    try:
        old = json.loads(STATUS_FILE.read_text())
        result['cameras'].update(old.get('cameras', {}))
    except Exception:
        pass

STATUS_FILE.write_text(json.dumps(result, ensure_ascii=False, indent=2))
print('Camera status updated')
