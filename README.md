# ScrollUps · TikTok Slideshow Pipeline

Pipeline complet pour générer des slideshows TikTok au format viral francophone (style "5 choses à éviter", testimonial, punchlines), avec une banque de **99 scripts pré-rédigés** dédiés à la promotion de l'app **ScrollUps** (app iOS qui débloque ton téléphone si t'as fait du sport).

Génération de slides 1080×1920 via Node.js Canvas, sourcing d'images Pinterest, interface web pour édition visuelle et drag-and-drop des textes, scheduler optionnel via Postiz.

---

## 🚀 Quickstart

```bash
git clone https://github.com/Tezig13/tiktok.git
cd tiktok
npm install
npm run web
```

Ouvre http://localhost:3000 dans ton navigateur.

---

## 📋 Prérequis

- **Node.js 18+** (testé sur Node 25)
- **Python 3.9+** (pour le téléchargeur Pinterest)
- **macOS / Linux** (Windows non testé)

Optionnel :
- Police **Montserrat** (TTF) dans `fonts/` — à télécharger via le setup automatique :
  ```bash
  curl -sL -o fonts/Montserrat-Bold.ttf https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-Bold.ttf
  curl -sL -o fonts/Montserrat-Regular.ttf https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-Regular.ttf
  curl -sL -o fonts/Montserrat-SemiBold.ttf https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-SemiBold.ttf
  ```
  Sans Montserrat, les accents français (é, à, è, É, où…) s'affichent en carrés.

---

## ⚡ Usage

### Interface web (recommandé)

```bash
npm run web
```

Puis http://localhost:3000 :

1. **Choisis un script** dans le dropdown (99 scripts pré-rédigés disponibles) ou un template vide
2. **Édite les textes** dans les champs (chaque slide est éditable)
3. **Choisis tes images** (auto-pick aléatoire ou pick manuel via le picker)
4. **Drag les textes directement sur l'aperçu** pour les repositionner verticalement
5. **Clique "⚡ Générer"** → 6-8 PNGs prêts à uploader sur TikTok

### CLI (mode avancé)

Génération directe depuis un fichier de config :

```bash
node generate-slides.js scripts/01-prise-muscle.json output/mon-test
```

Création d'un nouveau slideshow depuis un template :

```bash
./new-slideshow.sh 5-a-eviter mon-post-lundi
# édite mon-post-lundi.json
node generate-slides.js mon-post-lundi.json output/lundi
```

### Téléchargeur Pinterest

```bash
# Crée un fichier urls_<theme>.txt avec une URL par ligne
python3 pinterest-downloader.py gym urls_gym.txt
# → images dans pinterest_images/gym/
```

### Scheduling avec Postiz (optionnel)

```bash
./setup-postiz.sh                          # installe la CLI
# Suis les étapes manuelles affichées (compte + OAuth TikTok + API key)
node batch-schedule.js schedule.json       # programme tes posts
```

Alternative recommandée : **TikTok Studio Web** (https://studio.tiktok.com) propose un scheduler natif gratuit, suffisant pour 5-7 posts/semaine.

---

## 📁 Structure

```
tiktok/
├── server.js                  # Serveur Express pour l'UI web
├── generate-slides.js         # Moteur de génération Canvas
├── batch-schedule.js          # Scheduler Postiz (optionnel)
├── pinterest-downloader.py    # Téléchargeur Pinterest stdlib-only
│
├── scripts/                   # 99 scripts pré-rédigés (banque)
├── templates/                 # 5 templates vides (5-a-eviter, sec-ete, etc.)
├── lib/build-bank.mjs         # Générateur de la banque
│
├── public/                    # Frontend statique
│   ├── index.html
│   ├── app.js                 # Logique UI : picker, drag-and-drop, génération
│   └── style.css
│
├── pinterest_images/          # Banque d'images par thème (à remplir)
│   ├── hook_viral_homme/
│   ├── gym/
│   └── nourriture/
├── avatars/                   # Tes avatars IA générés
├── app_screenshots/           # Screenshots de l'app ScrollUps
│
├── hooks-library.json         # Hooks validés + templates + structure
├── pinterest-themes.json      # Queries Pinterest par thème
│
├── new-slideshow.sh           # Helper : duplique un template
├── download-all.sh            # Lance le downloader sur tous les urls_*.txt
├── setup-postiz.sh            # Setup initial Postiz
│
└── output/                    # PNGs générés
```

---

## 🎨 Templates disponibles

| Template | Format | Slides | Inspiré de |
|----------|--------|--------|------------|
| `5-a-eviter` | "5 choses à ÉVITER si tu veux X" | 6 | pursport1 (27k vues) |
| `voici-les-conseils` | "voici les conseils d'un gars qui X" | 6 | pertepoids (143k vues) |
| `comment-sans` | "Comment X sans Y" | 6 | tips alcool (50k vues) |
| `sec-ete` | "Comment être sec pour cet été" + 7 tips | 8 | exemple1 |
| `punchlines` | Phrases déclaratives, sans liste numérotée | 7 | exemple2 |

---

## 🛠 Personnalisation

### Ajouter un nouveau script à la banque

Édite `lib/build-bank.mjs`, ajoute une entrée dans `ENTRIES`, puis :
```bash
node lib/build-bank.mjs
```

### Remplir tes banques d'images

1. Pinterest → trouve une image → clic droit → copier l'adresse
2. Colle dans `urls_<theme>.txt` (un par ligne, `#` ignoré)
3. `python3 pinterest-downloader.py <theme> urls_<theme>.txt`

### Personnaliser le rendu visuel

`generate-slides.js` accepte par slide :
- `imagePath` ou `imageTheme` (auto-pick)
- `overlay` (0-1, opacité noire)
- `lines[]` avec `text`, `size`, `weight`, `y`, `align`, `box`, `stroke`, `shadow`

Voir n'importe quel fichier dans `scripts/` pour exemples.

---

## 📦 Stack

- **Backend** : Node.js + Express
- **Génération images** : `@napi-rs/canvas` (Skia natif), Sharp
- **Frontend** : HTML/CSS/JS vanilla, zero framework
- **Téléchargeur** : Python 3 stdlib (urllib)
- **Scheduling** : Postiz CLI (optionnel)

---

## 📝 Licence

Code MIT. Les scripts pré-rédigés sont libres d'utilisation pour ScrollUps et tout autre app similaire.

---

## 🙏 Inspirations

Format inspiré du playbook *"TikTok slideshow automation with Claude"* (2026), adapté au contexte francophone et au positionnement ScrollUps (anti-phone-addiction via friction physique).
