#!/bin/bash
# Lance le downloader sur TOUS les thèmes d'un coup.
# Seuls les fichiers urls_*.txt qui contiennent au moins une URL seront traités.

set -e
cd "$(dirname "$0")"

for f in urls_*.txt; do
  # extrait le nom du thème : urls_phone_addiction.txt -> phone_addiction
  theme="${f#urls_}"
  theme="${theme%.txt}"

  # skip si aucune URL (que des commentaires/vide)
  if ! grep -vE '^\s*(#|$)' "$f" > /dev/null 2>&1; then
    echo "⏭  $theme : aucune URL, skip"
    continue
  fi

  echo ""
  echo "════════════════════════════════════════"
  echo "  DOWNLOAD → $theme"
  echo "════════════════════════════════════════"
  python3 pinterest-downloader.py "$theme" "$f"
done

echo ""
echo "✅ Tous les thèmes traités."
