# ScrollUps · TikTok Slideshow Pipeline

Pipeline complet pour générer des slideshows TikTok au format viral francophone, avec une banque fraîche de **40 scripts pré-rédigés** et **5 templates** reconstruits à partir des exemples performants du dossier `exemple*`.

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

1. **Choisis un script** dans le dropdown (40 scripts pré-rédigés disponibles) ou un template vide
2. **Édite les textes** dans les champs (chaque slide est éditable)
3. **Choisis tes images** (auto-pick aléatoire ou pick manuel via le picker)
4. **Glisse les textes directement sur l'aperçu** pour les repositionner verticalement
5. **Clique "⚡ Générer"** → 6-8 PNGs prêts à publier sur TikTok

### CLI (mode avancé)

Génération directe depuis un fichier de config :

```bash
node src/generate-slides.js content/scripts/01-meconnaissable-ete.json output/mon-test
```

Création d'un nouveau slideshow depuis un template :

```bash
./new-slideshow.sh ete-transformation mon-post-lundi
# édite mon-post-lundi.json
node src/generate-slides.js mon-post-lundi.json output/lundi
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
├── src/
│   ├── server.js              # Serveur Express pour l'UI web
│   ├── generate-slides.js     # Moteur de génération Canvas
│   ├── post-production.js     # Export JPEG + grain
│   └── build-bank.mjs         # Nettoie et régénère la banque texte
├── batch-schedule.js          # Scheduler Postiz (optionnel)
├── pinterest-downloader.py    # Téléchargeur Pinterest stdlib-only
│
├── content/
│   ├── scripts/               # 40 scripts pré-rédigés
│   ├── templates/             # 5 templates vides
│   └── configs/               # Configs générées depuis l'UI
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
| `ete-transformation` | "comment devenir X cet été si tu commences maintenant" | 6 | exemple3 |
| `verite-qui-pique` | Phrases déclaratives, sans liste numérotée | 6 | exemple2 |
| `arrete-de-faire` | "arrête de faire ça si tu veux X" | 6 | exemple1/3 |
| `routine-90j` | Routine simple à répéter 90 jours | 6 | exemple3 |
| `liste-punchy` | Liste courte, directe, facile à lire | 6 | exemple1 |

---

## 🛠 Personnalisation

### Ajouter un nouveau script à la banque

Édite `src/build-bank.mjs`, ajoute une entrée dans `topics` ou `extraHooks`, puis :
```bash
node src/build-bank.mjs
```

### Remplir tes banques d'images

1. Pinterest → trouve une image → clic droit → copier l'adresse
2. Colle dans `urls_<theme>.txt` (un par ligne, `#` ignoré)
3. `python3 pinterest-downloader.py <theme> urls_<theme>.txt`

### Personnaliser le rendu visuel

`src/generate-slides.js` accepte par slide :
- `imagePath` ou `imageTheme` (auto-pick)
- `overlay` (0-1, opacité noire)
- `lines[]` avec `text`, `size`, `weight`, `y`, `align`, `box`, `stroke`, `shadow`

Voir n'importe quel fichier dans `content/scripts/` pour exemples.

---

## 📦 Stack

- **Backend** : Node.js + Express
- **Génération images** : `@napi-rs/canvas` (Skia natif), Sharp
- **Frontend** : HTML/CSS/JS vanilla, sans framework
- **Téléchargeur** : Python 3 stdlib (urllib)
- **Scheduling** : Postiz CLI (optionnel)

---

## 📝 Licence

Code MIT. Les scripts pré-rédigés sont libres d'utilisation pour ScrollUps et tout autre app similaire.

---

## 🙏 Inspirations

Format inspiré du playbook *"TikTok slideshow automation with Claude"* (2026), adapté au contexte francophone et au positionnement ScrollUps (anti-phone-addiction via friction physique).
