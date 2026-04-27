import { readFileSync, readdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const SCRIPTS_DIR = './scripts'

const STRONG = {
  focus_desk: [
    'scroll', 'tel ', 'tél', 'téléphone', 'telephone', 'app ', 'apps',
    'instagram', 'tiktok', 'insta ', 'distraction', 'notif',
    'deep work', 'écran', 'ecran', 'livre', 'lire ', 'lis ',
    'bureau', 'productivit', 'méditation', 'mediter', 'médite',
    'home screen', 'mode avion', 'home-screen',
    'tu scrolles', 'tu scroll', 'écran d\'accueil',
  ],
  nature_outdoor: [
    'soleil', 'dehors', 'à pied', 'a pied',
    'lumière du jour', 'lumiere du jour', 'extérieur', 'exterieur',
    'balade', 'parc', 'rythme circadien', 'circadien',
    'la marche', 'marche 10', 'marches dehors', 'marche le',
  ],
}

const COFFEE_DOUCHE_TRIGGERS = ['café', 'cafe ', 'douche']

const SKIP = new Set([
  '01-prise-muscle.json#2',
  '11-doubler-masse.json#3',
  '18-secher-sans-faim.json#1',
  '49-doubler-force-6mois.json#2',
  '52-bras-explosés.json#1',
  '55-bonne-posture.json#2',
  '55-bonne-posture.json#5',
  '70-mental-fort.json#1',
  '73-arreter-distraction.json#2',
  '79-progresser-bench.json#1',
  '85-routine-quotidienne.json#5',
])

function normalize(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}
function hasKw(text, list) {
  const t = ' ' + normalize(text) + ' '
  return list.some(kw => t.includes(normalize(kw)))
}

const files = readdirSync(SCRIPTS_DIR).filter(f => f.endsWith('.json')).sort()
let totalApplied = 0

for (const file of files) {
  const path = join(SCRIPTS_DIR, file)
  const data = JSON.parse(readFileSync(path, 'utf-8'))
  const slides = data.slides || []
  let modified = false
  slides.forEach((slide, i) => {
    if (slide.imagePath) return
    if (!slide.imageTheme) return
    if (i === 0) return
    if (SKIP.has(`${file}#${i}`)) return
    const text = slide.lines.map(l => l.text).join(' ')
    let suggested = null
    if (hasKw(text, STRONG.nature_outdoor)) suggested = 'nature_outdoor'
    else if (hasKw(text, STRONG.focus_desk)) suggested = 'focus_desk'
    else if (hasKw(text, COFFEE_DOUCHE_TRIGGERS) && slide.imageTheme === 'gym') {
      suggested = 'focus_desk'
    }
    if (!suggested || suggested === slide.imageTheme) return
    console.log(`${file}#${i}: ${slide.imageTheme} → ${suggested}`)
    slide.imageTheme = suggested
    modified = true
    totalApplied++
  })
  if (modified) writeFileSync(path, JSON.stringify(data, null, 2) + '\n')
}

console.log(`\n✅ ${totalApplied} corrections appliquées`)
