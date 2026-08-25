#!/usr/bin/env python3
import json
import re
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAMERAS_JS = ROOT / "cameras.js"
STATUS_JSON = ROOT / "camera-status.json"
TIMEOUT = 18
UA = "Mozilla/5.0 (compatible; BEACH-CAM-Health/1.0; +https://github.com/jssanchezmallorca-web/mallorca-beach-live)"

SPECIAL_PROBES = {
    "sa-rapita-club": {
        "url": "https://www.webcamgalore.es/webcam/Espana/Sa-Rapita-Mallorca/37360.html",
        "offline_markers": ["actualmente fuera de línea", "currently offline", "webcam is currently offline"]
    }
}


def load_cameras():
    text = CAMERAS_JS.read_text(encoding="utf-8")
    payload = text.split("const CAMERAS=", 1)[1].split("].map(", 1)[0] + "]"
    rows = json.loads(payload)
    cams = []
    for a in rows:
        cams.append({
            "key": a[0], "name": a[1], "region": a[2], "provider": a[3],
            "mode": a[4], "param": a[5], "url": a[6]
        })
    return cams


def request(url, limit=700_000):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        code = getattr(r, "status", 200)
        ctype = (r.headers.get("Content-Type") or "").lower()
        body = r.read(limit)
        return code, ctype, body


def check_camera(cam):
    key, mode = cam["key"], cam["mode"]
    try:
        if key in SPECIAL_PROBES:
            probe = SPECIAL_PROBES[key]
            code, ctype, body = request(probe["url"])
            if code >= 400:
                return False, f"HTTP {code}"
            text = body.decode("utf-8", "ignore").lower()
            if any(m.lower() in text for m in probe.get("offline_markers", [])):
                return False, "La fuente pública indica que la webcam está fuera de línea"
            return True, "Fuente de webcam accesible"

        if mode == "ipcam":
            url = f"https://g0.ipcamlive.com/player/snapshot.php?alias={urllib.parse.quote(str(cam['param']))}"
            code, ctype, body = request(url, 1_200_000)
            if code >= 400:
                return False, f"HTTP {code}"
            if "image" in ctype and len(body) > 1500:
                return True, "Snapshot IPCamLive disponible"
            return False, "IPCamLive no devolvió una imagen válida"

        if mode == "mjpeg":
            code, ctype, body = request(cam["url"], 220_000)
            if code >= 400:
                return False, f"HTTP {code}"
            if "image" in ctype or len(body) > 5000:
                return True, "Flujo/imagen accesible"
            return None, "Respuesta accesible pero no concluyente"

        if mode == "youtube":
            url = cam["url"]
            code, ctype, body = request(url, 1_000_000)
            if code >= 400:
                return False, f"HTTP {code}"
            text = body.decode("utf-8", "ignore").lower()
            hard_offline = [
                "video unavailable", "this video is unavailable",
                '"playabilitystatus":{"status":"error"',
                '"playabilitystatus":{"status":"unplayable"'
            ]
            if any(x in text for x in hard_offline):
                return False, "YouTube indica vídeo no disponible"
            live_markers = [
                '"islivenow":true', '"islivecontent":true',
                '"islive":true', 'islivebroadcast'
            ]
            if any(x in text for x in live_markers):
                return True, "YouTube Live detectado"
            # Reachable video but live state could not be proven without YouTube Data API.
            return None, "Vídeo accesible; estado LIVE no concluyente"

        # External provider: mark online only when its webcam/source page is reachable.
        code, ctype, body = request(cam["url"], 500_000)
        if code >= 400:
            return False, f"HTTP {code}"
        text = body.decode("utf-8", "ignore").lower()
        offline_markers = ["webcam is offline", "camera is offline", "actualmente fuera de línea"]
        if any(x in text for x in offline_markers):
            return False, "La página indica cámara offline"
        return True, "Página de la cámara accesible"

    except urllib.error.HTTPError as e:
        return False, f"HTTP {e.code}"
    except (urllib.error.URLError, TimeoutError) as e:
        return False, f"Error de conexión: {getattr(e, 'reason', e)}"
    except Exception as e:
        return None, f"Comprobación no concluyente: {type(e).__name__}"


def main():
    cameras = load_cameras()
    if STATUS_JSON.exists():
        state = json.loads(STATUS_JSON.read_text(encoding="utf-8"))
    else:
        state = {"cameras": {}}
    entries = state.setdefault("cameras", {})
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    for cam in cameras:
        prev = entries.get(cam["key"], {})
        result, reason = check_camera(cam)
        failures = int(prev.get("failures", 0) or 0)
        old_status = prev.get("status", "unknown")

        if result is True:
            status = "online"
            failures = 0
        elif result is False:
            failures += 1
            status = "offline" if failures >= 2 else (old_status if old_status in ("online", "offline") else "unknown")
        else:
            status = old_status if old_status in ("online", "offline") else "unknown"

        entries[cam["key"]] = {
            "status": status,
            "failures": failures,
            "lastChecked": now,
            "reason": reason
        }
        if cam["key"] in SPECIAL_PROBES:
            entries[cam["key"]]["source"] = SPECIAL_PROBES[cam["key"]]["url"]

    # Keep historical entries for cameras no longer in the catalogue, but mark them unknown.
    current = {c["key"] for c in cameras}
    for key, entry in list(entries.items()):
        if key not in current:
            entry["status"] = "unknown"
            entry["reason"] = "Ya no está en el catálogo activo; se conserva el historial"

    state["updatedAt"] = now
    state["intervalHours"] = 48
    state["policy"] = "Cameras are never hidden. Two consecutive confirmed failures mark a camera offline; a successful check restores online."
    STATUS_JSON.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
