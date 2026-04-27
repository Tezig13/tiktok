#!/bin/bash
# Crée un nouveau slideshow à partir d'un template.
#
# Usage :
#   ./new-slideshow.sh <template> [nom-fichier.json]
#
# Templates disponibles : 5-a-eviter, voici-les-conseils, comment-sans
#
# Exemples :
#   ./new-slideshow.sh 5-a-eviter                    # → crée slides-config.json
#   ./new-slideshow.sh voici-les-conseils mon-post   # → crée mon-post.json

set -e
cd "$(dirname "$0")"

if [ -z "$1" ]; then
  echo "Usage : ./new-slideshow.sh <template> [nom-fichier]"
  echo ""
  echo "Templates disponibles :"
  ls templates/ | sed 's/\.json$//' | sed 's/^/  - /'
  exit 1
fi

TEMPLATE="$1"
OUTPUT="${2:-slides-config}"
OUTPUT="${OUTPUT%.json}.json"

SRC="templates/$TEMPLATE.json"
if [ ! -f "$SRC" ]; then
  echo "❌ Template introuvable : $SRC"
  echo "Disponibles : $(ls templates/ | sed 's/\.json$//' | tr '\n' ' ')"
  exit 1
fi

if [ -f "$OUTPUT" ]; then
  read -p "⚠  $OUTPUT existe déjà. Écraser ? [y/N] " ans
  if [ "$ans" != "y" ] && [ "$ans" != "Y" ]; then
    echo "Annulé."
    exit 0
  fi
fi

cp "$SRC" "$OUTPUT"
echo "✅ $OUTPUT créé à partir de $SRC"
echo ""
echo "Prochaine étape :"
echo "  1. Ouvre $OUTPUT dans ton éditeur"
echo "  2. Remplace tous les [BRACKETS] par tes textes"
echo "  3. Lance : node generate-slides.js $OUTPUT"
