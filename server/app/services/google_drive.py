import httpx
import re
import os
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path

from app.core.config import settings

# In-memory Cache
cache = {
    "certs": None,
    "last_updated": 0,
    "folder_id": None
}

CACHE_TTL = 30  # 30 seconds for near real-time folder updates

# In-memory Thumbnail Cache: file_id -> (bytes, content_type)
thumbnail_cache: Dict[str, Tuple[bytes, str]] = {}

SETTINGS_FILE = Path(__file__).parent.parent / "drive_settings.json"

def get_drive_settings() -> Dict[str, Any]:
    if SETTINGS_FILE.exists():
        try:
            with open(SETTINGS_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    # Fallback to env
    return {
        "folder_url": settings.GOOGLE_DRIVE_FOLDER_URL or os.getenv("GOOGLE_DRIVE_FOLDER_URL", ""),
        "api_key": settings.GOOGLE_DRIVE_API_KEY or os.getenv("GOOGLE_DRIVE_API_KEY", "")
    }

def save_drive_settings(folder_url: str, api_key: Optional[str] = None) -> Dict[str, Any]:
    current = get_drive_settings()
    data = {
        "folder_url": folder_url.strip(),
        "api_key": api_key.strip() if api_key is not None else current.get("api_key", ""),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    try:
        with open(SETTINGS_FILE, "w") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error saving drive settings: {e}")
    # Invalidate cache
    invalidate_drive_cache()
    return data

def extract_folder_id(url_or_id: str) -> Optional[str]:
    if not url_or_id:
        return None
    raw = url_or_id.strip()
    # Check folders/...
    m = re.search(r"folders/([a-zA-Z0-9_-]+)", raw)
    if m:
        return m.group(1)
    # Check id=...
    m = re.search(r"[?&]id=([a-zA-Z0-9_-]+)", raw)
    if m:
        return m.group(1)
    # Check raw folder ID
    if re.match(r"^[a-zA-Z0-9_-]{15,}$", raw):
        return raw
    return None

def parse_certificate_filename(filename: str) -> Dict[str, Any]:
    # Strip extension
    ext = ""
    base = filename
    if "." in filename:
        parts = filename.rsplit(".", 1)
        base = parts[0]
        ext = parts[1].lower()

    # Pattern 1: [Year] - [Issuer] - [Title]
    m3 = re.match(r"^(\d{4})\s*[-_–]\s*([^-–_]+)\s*[-_–]\s*(.+)$", base)
    if m3:
        return {
            "date": m3.group(1).strip(),
            "issuer": m3.group(2).strip(),
            "title": m3.group(3).strip(),
            "file_type": "pdf" if ext == "pdf" else "image"
        }

    # Pattern 2: [Issuer] - [Title]
    m2 = re.match(r"^([^-–_]+)\s*[-_–]\s*(.+)$", base)
    if m2:
        first = m2.group(1).strip()
        second = m2.group(2).strip()
        if re.match(r"^\d{4}$", first):
            return {
                "date": first,
                "issuer": "Certificate",
                "title": second,
                "file_type": "pdf" if ext == "pdf" else "image"
            }
        return {
            "date": None,
            "issuer": first,
            "title": second,
            "file_type": "pdf" if ext == "pdf" else "image"
        }

    # Fallback: clean words
    clean_title = re.sub(r"[-_]+", " ", base).strip().title()
    return {
        "date": None,
        "issuer": "Certification",
        "title": clean_title or "Certificate",
        "file_type": "pdf" if ext == "pdf" else "image"
    }

def generate_placeholder_svg(title: str = "Certificate") -> bytes:
    clean_title = (title[:32] + "...") if len(title) > 32 else title
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#f1f5f9"/>
  <rect x="8" y="8" width="384" height="224" fill="none" stroke="#000000" stroke-width="2" stroke-dasharray="6 3"/>
  <circle cx="200" cy="95" r="32" fill="#0f172a"/>
  <polygon points="200,75 204,87 216,87 207,94 210,106 200,99 190,106 193,94 184,87 196,87" fill="#fbbf24"/>
  <text x="200" y="155" font-family="system-ui, sans-serif" font-weight="900" font-size="15" fill="#0f172a" text-anchor="middle" letter-spacing="1">CERTIFICATE PREVIEW</text>
  <text x="200" y="180" font-family="monospace" font-size="11" fill="#64748b" text-anchor="middle">{clean_title}</text>
</svg>"""
    return svg.encode("utf-8")

async def fetch_drive_thumbnail(file_id: str) -> Tuple[bytes, str]:
    """
    Fetches Google Drive thumbnail or returns vector SVG fallback.
    Caches in memory to eliminate repeated network calls.
    """
    if file_id in thumbnail_cache:
        return thumbnail_cache[file_id]

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
    }

    candidate_urls = [
        f"https://lh3.googleusercontent.com/d/{file_id}=w800",
        f"https://drive.google.com/thumbnail?id={file_id}&sz=w800",
        f"https://drive.google.com/uc?export=view&id={file_id}"
    ]

    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        for url in candidate_urls:
            try:
                res = await client.get(url, headers=headers)
                ct = res.headers.get("content-type", "")
                if res.status_code == 200 and ("image" in ct or len(res.content) > 1000):
                    media_type = ct if "image" in ct else "image/jpeg"
                    thumbnail_cache[file_id] = (res.content, media_type)
                    return res.content, media_type
            except Exception:
                continue

    # Fallback to generated SVG
    placeholder = (generate_placeholder_svg(), "image/svg+xml")
    thumbnail_cache[file_id] = placeholder
    return placeholder

async def fetch_via_google_api(folder_id: str, api_key: str) -> Optional[List[Dict[str, Any]]]:
    url = "https://www.googleapis.com/drive/v3/files"
    params = {
        "q": f"'{folder_id}' in parents and trashed = false",
        "fields": "files(id, name, mimeType, createdTime, thumbnailLink, webViewLink)",
        "pageSize": 100,
        "key": api_key,
        "orderBy": "name"
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(url, params=params)
            if res.status_code == 200:
                data = res.json()
                files = data.get("files", [])
                results = []
                for f in files:
                    file_id = f.get("id")
                    file_name = f.get("name", "Certificate")
                    meta = parse_certificate_filename(file_name)
                    results.append({
                        "id": f"drive-{file_id}",
                        "title": meta["title"],
                        "issuer": meta["issuer"],
                        "date": meta["date"],
                        "file_name": file_name,
                        "file_id": file_id,
                        "file_type": meta["file_type"],
                        "file_url": f"https://drive.google.com/file/d/{file_id}/view?usp=sharing",
                        "thumbnail_url": f"/api/certificates/drive-thumbnail/{file_id}",
                        "direct_thumbnail_url": f"https://lh3.googleusercontent.com/d/{file_id}=w800",
                        "source": "google_drive",
                        "is_drive": True
                    })
                return results
    except Exception as e:
        print(f"Error in Google Drive API: {e}")
    return None

async def fetch_via_public_embedded_view(folder_id: str) -> Optional[List[Dict[str, Any]]]:
    """
    Zero-config parser: Fetches the public Google Drive embedded folder view
    which contains file links and names for any publicly shared folder.
    """
    url = f"https://drive.google.com/embeddedfolderview?id={folder_id}#grid"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml"
    }
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            res = await client.get(url, headers=headers)
            if res.status_code == 200:
                html = res.text

                entries = {}

                # Pattern 1: /file/d/{id}/view or /file/d/{id}/edit
                matches = re.findall(r'href="https://drive\.google\.com/file/d/([a-zA-Z0-9_-]+)/view[^"]*"[^>]*>([^<]+)</a>', html)
                for file_id, name in matches:
                    name_clean = name.strip()
                    if name_clean and file_id not in entries:
                        entries[file_id] = name_clean

                # Pattern 2: JSON data blocks or aria-label attributes
                if not entries:
                    aria_matches = re.findall(r'href="[^"]*drive\.google\.com/file/d/([a-zA-Z0-9_-]+)[^"]*"[^>]*aria-label="([^"]+)"', html)
                    for file_id, name in aria_matches:
                        if file_id not in entries:
                            entries[file_id] = name.strip()

                # Pattern 3: data-target or raw file links
                if not entries:
                    raw_ids = set(re.findall(r'/file/d/([a-zA-Z0-9_-]{25,})/', html))
                    for idx, fid in enumerate(raw_ids):
                        entries[fid] = f"Certificate Document {idx + 1}"

                if entries:
                    results = []
                    for file_id, file_name in entries.items():
                        meta = parse_certificate_filename(file_name)
                        results.append({
                            "id": f"drive-{file_id}",
                            "title": meta["title"],
                            "issuer": meta["issuer"],
                            "date": meta["date"],
                            "file_name": file_name,
                            "file_id": file_id,
                            "file_type": meta["file_type"],
                            "file_url": f"https://drive.google.com/file/d/{file_id}/view?usp=sharing",
                            "thumbnail_url": f"/api/certificates/drive-thumbnail/{file_id}",
                            "direct_thumbnail_url": f"https://lh3.googleusercontent.com/d/{file_id}=w800",
                            "source": "google_drive",
                            "is_drive": True
                        })
                    return results
    except Exception as e:
        print(f"Error fetching embedded folder view: {e}")
    return None

async def get_google_drive_certificates(force_refresh: bool = False) -> List[Dict[str, Any]]:
    current_time = datetime.now(timezone.utc).timestamp()
    settings_data = get_drive_settings()
    folder_url = settings_data.get("folder_url", "")
    api_key = settings_data.get("api_key", "")

    folder_id = extract_folder_id(folder_url)
    if not folder_id:
        return []

    if not force_refresh and cache["certs"] is not None and cache["folder_id"] == folder_id:
        if (current_time - cache["last_updated"]) < CACHE_TTL:
            return cache["certs"]

    # 1. Try Google API if key is available
    if api_key:
        api_certs = await fetch_via_google_api(folder_id, api_key)
        if api_certs:
            cache["certs"] = api_certs
            cache["last_updated"] = current_time
            cache["folder_id"] = folder_id
            return api_certs

    # 2. Try Public Embedded View Scraper
    public_certs = await fetch_via_public_embedded_view(folder_id)
    if public_certs:
        cache["certs"] = public_certs
        cache["last_updated"] = current_time
        cache["folder_id"] = folder_id
        return public_certs

    return []

def invalidate_drive_cache():
    cache["certs"] = None
    cache["last_updated"] = 0
    cache["folder_id"] = None
    thumbnail_cache.clear()
