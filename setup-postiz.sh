#!/bin/bash
# Setup Postiz pour Scrollups TikTok — à lancer UNE SEULE fois.
#
# Cette commande :
#   1. Installe la CLI Postiz (npm install -g postiz)
#   2. Rappelle les étapes manuelles (compte + OAuth TikTok + API key)
#
# Usage : ./setup-postiz.sh

set -e
cd "$(dirname "$0")"

echo "═══════════════════════════════════════════"
echo "  SETUP POSTIZ — Scrollups TikTok Pipeline"
echo "═══════════════════════════════════════════"
echo ""

# 1. Install CLI
if command -v postiz > /dev/null 2>&1; then
  echo "✓ Postiz CLI déjà installée ($(postiz --version 2>&1 | head -1))"
else
  echo "→ Installation de Postiz CLI..."
  npm install -g postiz
  echo "✓ Postiz installée"
fi

echo ""
echo "═══════════════════════════════════════════"
echo "  ÉTAPES MANUELLES À FAIRE DANS TON NAVIGATEUR"
echo "═══════════════════════════════════════════"
echo ""
echo "1. Crée un compte gratuit : https://app.postiz.com"
echo ""
echo "2. Settings → API Keys → génère une clé API"
echo "   Copie-la. Tu vas l'exporter comme variable d'environnement."
echo ""
echo "3. Integrations → Add Channel → TikTok"
echo "   Login avec ton compte TikTok (OAuth)."
echo ""
echo "4. Récupère ton Integration ID :"
echo "   export POSTIZ_API_KEY=ta_clé_ici"
echo "   postiz integrations:list"
echo "   → copie l'ID de la ligne TikTok"
echo ""
echo "5. Ajoute les 2 variables à ton ~/.zshrc (permanent) :"
echo "   echo 'export POSTIZ_API_KEY=ta_clé' >> ~/.zshrc"
echo "   echo 'export TIKTOK_INTEGRATION_ID=ton_id' >> ~/.zshrc"
echo "   source ~/.zshrc"
echo ""
echo "6. Test : postiz integrations:list"
echo "   → doit afficher TikTok avec ton ID"
echo ""
echo "✅ Une fois ces 6 étapes faites, tu peux lancer :"
echo "   node batch-schedule.js schedule.json"
echo ""
