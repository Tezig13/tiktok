#!/usr/bin/env python3
"""
Pinterest batch downloader — Scrollups TikTok pipeline.

Usage:
    python3 pinterest-downloader.py <theme> <urls.txt>

Exemples:
    python3 pinterest-downloader.py gym urls_gym.txt
    python3 pinterest-downloader.py club urls_club.txt
    python3 pinterest-downloader.py chambre urls_chambre.txt

Format urls.txt — une URL par ligne, lignes vides et # ignorées:
    https://i.pinimg.com/originals/ab/cd/ef/hash1.jpg
    https://i.pinimg.com/originals/12/34/56/hash2.jpg
    # commentaire, sera ignoré

Les images sont enregistrées dans pinterest_images/<theme>/.
Les fichiers déjà présents sont skippés automatiquement.
"""
from __future__ import annotations

import sys
import time
import hashlib
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
}

BASE_FOLDER = Path("pinterest_images")
REQUEST_DELAY = 0.3  # seconds, soyons polis avec Pinterest


def sanitize_url(url: str) -> str:
    return url.strip().split("?")[0]


def ext_from_url(url: str, content_type: str | None = None) -> str:
    lower = url.lower()
    for cand in (".jpg", ".jpeg", ".png", ".webp"):
        if lower.endswith(cand):
            return ".jpg" if cand == ".jpeg" else cand
    if content_type:
        ct = content_type.lower()
        if "jpeg" in ct or "jpg" in ct:
            return ".jpg"
        if "png" in ct:
            return ".png"
        if "webp" in ct:
            return ".webp"
    return ".jpg"


def filename_from_url(url: str) -> str:
    parts = url.rstrip("/").split("/")
    last = parts[-1].split("?")[0]
    name = last.rsplit(".", 1)[0]
    if not name:
        name = hashlib.md5(url.encode()).hexdigest()[:12]
    return name


def download_one(url: str, folder: Path) -> tuple[Path | None, str]:
    url = sanitize_url(url)
    if not url:
        return None, "empty"
    name = filename_from_url(url)
    ext = ext_from_url(url)
    out = folder / f"{name}{ext}"
    if out.exists():
        return out, "already"

    req = Request(url, headers=HEADERS)
    try:
        with urlopen(req, timeout=25) as r:
            ct = r.headers.get("Content-Type", "")
            ext = ext_from_url(url, ct)
            out = folder / f"{name}{ext}"
            if out.exists():
                return out, "already"
            with open(out, "wb") as f:
                while True:
                    chunk = r.read(8192)
                    if not chunk:
                        break
                    f.write(chunk)
            return out, "downloaded"
    except HTTPError as e:
        return None, f"HTTP {e.code}"
    except URLError as e:
        return None, f"URL error: {e.reason}"
    except Exception as e:
        return None, f"error: {e}"


def read_urls(path: Path) -> list[str]:
    lines = path.read_text(encoding="utf-8").splitlines()
    urls = []
    for line in lines:
        s = line.strip()
        if not s or s.startswith("#"):
            continue
        urls.append(s)
    return urls


def main() -> int:
    if len(sys.argv) < 3:
        print(__doc__)
        return 1

    theme = sys.argv[1].strip().lower()
    urls_file = Path(sys.argv[2])
    if not urls_file.exists():
        print(f"❌ Fichier introuvable: {urls_file}")
        return 1

    folder = BASE_FOLDER / theme
    folder.mkdir(parents=True, exist_ok=True)

    urls = read_urls(urls_file)
    if not urls:
        print(f"⚠  Aucune URL à télécharger dans {urls_file}")
        return 0

    print(f"→ Thème:  {theme}")
    print(f"→ Output: {folder}/")
    print(f"→ URLs:   {len(urls)}")
    print()

    counts = {"downloaded": 0, "already": 0, "failed": 0}
    for i, url in enumerate(urls, start=1):
        out, status = download_one(url, folder)
        tag = f"[{i:>3}/{len(urls)}]"
        if status == "downloaded":
            counts["downloaded"] += 1
            print(f"{tag} ✓ {out.name}")
        elif status == "already":
            counts["already"] += 1
            print(f"{tag} = {out.name}  (déjà présent)")
        else:
            counts["failed"] += 1
            short = url if len(url) <= 70 else url[:67] + "..."
            print(f"{tag} ✗ {short}  — {status}")
        time.sleep(REQUEST_DELAY)

    print()
    print(
        f"✅ Fini — {counts['downloaded']} téléchargées, "
        f"{counts['already']} déjà présentes, "
        f"{counts['failed']} échouées → {folder}/"
    )
    return 0 if counts["failed"] == 0 else 2


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n⚠  Interrompu par l'utilisateur.")
        sys.exit(130)
