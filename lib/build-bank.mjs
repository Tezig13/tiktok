// Bank builder — convertit des entrées compactes en configs JSON complètes pour scripts/.
// Usage : node lib/build-bank.mjs

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'scripts')
mkdirSync(OUT, { recursive: true })

// --- Auto-styling par rôle de slide ---
function styleFor(role, templateId) {
  if (templateId === 'sec-ete') {
    if (role === 'hook') return { yStart: 220, mainSize: 56, subSize: 50 }
    if (role === 'scrollups') return { yStart: 180, mainSize: 60, subSize: 38 }
    return { yStart: 260, mainSize: 52, subSize: 36 }
  }
  if (templateId === 'punchlines') {
    if (role === 'hook') return { yStart: 240, mainSize: 50, subSize: 50 }
    if (role === 'scrollups') return { yStart: 180, mainSize: 56, subSize: 38 }
    return { yStart: 280, mainSize: 50, subSize: 50 }
  }
  // 5-a-eviter / voici-les-conseils / comment-sans
  if (role === 'hook') return { yStart: 1100, mainSize: 64, subSize: 54 }
  if (role === 'scrollups') return { yStart: 180, mainSize: 64, subSize: 38 }
  return { yStart: 880, mainSize: 50, subSize: 42 }
}

function buildSlide(slide, role, templateId) {
  const { yStart, mainSize, subSize } = styleFor(role, templateId)
  const isPunchline = templateId === 'punchlines'
  const isHook = role === 'hook'

  let imagePath, imageTheme, overlay
  if (slide.app) {
    imagePath = './app_screenshots/scrollups.jpg'
    overlay = 0
  } else {
    imageTheme = slide.theme || 'gym'
    if (slide.overlay !== undefined) overlay = slide.overlay
    else if (role === 'cta') overlay = 0.55
    else if (role === 'point' && (slide.theme === 'nourriture' || slide.theme === 'gym')) overlay = 0.35
  }

  let y = yStart
  const lines = []
  for (let i = 0; i < slide.text.length; i++) {
    const text = slide.text[i]
    const isFirst = i === 0
    const size = isFirst ? mainSize : subSize
    const weight = isFirst || isHook || isPunchline ? 'bold' : 'normal'
    lines.push({ text, size, weight, y })
    y += Math.round(size * 1.4)
  }

  return {
    ...(imagePath ? { imagePath } : {}),
    ...(imageTheme ? { imageTheme } : {}),
    ...(overlay !== undefined ? { overlay } : {}),
    lines,
  }
}

function buildConfig(entry) {
  const N = entry.slides.length
  const slides = entry.slides.map((s, i) => {
    const isHook = i === 0
    const isLast = i === N - 1
    const isScrollups = !!s.app
    let role
    if (isScrollups) role = 'scrollups'
    else if (isHook) role = 'hook'
    else if (isLast) role = 'cta'
    else role = 'point'
    return buildSlide(s, role, entry.template)
  })
  return {
    _meta: {
      title: entry.title,
      template_id: entry.template,
      tags: entry.tags || [],
    },
    defaults: { fontFamily: 'Montserrat, sans-serif', color: '#ffffff', align: 'center' },
    slides,
  }
}

// =====================================================================
// LA BANQUE — 40+ entries
// Format compact : { id, title, template, tags, slides: [{ theme, app, overlay, text:[...] }] }
// =====================================================================

const ENTRIES = [

  // ════════ PRISE DE MUSCLE ════════

  { id: '10-progresser-stagner', title: 'Pourquoi t\'as pas progressé en 1 an', template: '5-a-eviter', tags: ['muscle','plateau'], slides: [
    { theme: 'hook_viral_homme', text: ['5 erreurs qui','t\'empêchent de progresser','en salle.'] },
    { theme: 'hook_viral_homme', text: ['1. tu fais que des séries longues','l\'hypertrophie c\'est 6-12 reps.','pas 20.'] },
    { theme: 'nourriture', text: ['2. tu manges pas assez','pas de surplus = pas de muscle.','vise +300 cal/jour.'] },
    { theme: 'gym', text: ['3. tu changes de programme','toutes les 2 semaines.','tes muscles n\'ont pas le temps.'] },
    { app: true, text: ['4. utilise ScrollUps','tes pompes du jour avant','d\'ouvrir Insta.','tu skipperas plus.'] },
    { theme: 'gym', text: ['5. tu te compares aux autres','compare-toi à toi-même','d\'il y a 3 mois.'] },
  ]},

  { id: '11-doubler-masse', title: 'Voici comment j\'ai doublé ma masse musculaire en 1 an', template: 'voici-les-conseils', tags: ['muscle','transformation'], slides: [
    { theme: 'hook_viral_homme', text: ['voici comment j\'ai','doublé ma masse','en 1 an.'] },
    { theme: 'hook_viral_homme', text: ['1. j\'ai arrêté les programmes','de magazine.','un programme stable, 4 mois minimum.'] },
    { theme: 'nourriture', text: ['2. j\'ai compté chaque calorie','chaque jour.','pas une semaine. chaque jour.'] },
    { theme: 'gym', text: ['3. j\'ai mis 90% de mon focus','sur 4 mouvements :','squat, deadlift, bench, row.'] },
    { app: true, text: ['4. j\'utilise ScrollUps','le tel s\'ouvre QUE si','j\'ai fait ma séance du jour.','12 mois zéro skip.'] },
    { theme: 'gym', text: ['5. j\'ai accepté que c\'était lent','5kg en 6 mois c\'est normal.','la patience > tout le reste.'] },
  ]},

  { id: '12-prise-muscle-debutant', title: 'Prise de muscle débutant — 5 erreurs', template: '5-a-eviter', tags: ['muscle','débutant'], slides: [
    { theme: 'hook_viral_homme', text: ['5 choses à ÉVITER','quand tu débutes','la musculation.'] },
    { theme: 'hook_viral_homme', text: ['1. ne fais pas du split 5x/sem','full body 3x/sem','progresse 2x plus vite.'] },
    { theme: 'nourriture', text: ['2. ne néglige pas les protéines','1.6g/kg de poids de corps.','non négociable.'] },
    { theme: 'gym', text: ['3. ne soulève pas trop lourd','technique avant tout.','blessure = 6 mois perdus.'] },
    { app: true, text: ['4. utilise ScrollUps','impossible de skip','quand ton scroll dépend','de ton entraînement.'] },
    { theme: 'gym', text: ['5. ne change pas tout','toutes les semaines.','laisse 8-12 semaines.'] },
  ]},

  { id: '13-ectomorphe', title: 'Prise de muscle ectomorphe — 5 trucs', template: '5-a-eviter', tags: ['muscle','ectomorphe'], slides: [
    { theme: 'hook_viral_homme', text: ['5 choses à savoir','si t\'es ectomorphe','et tu veux du muscle.'] },
    { theme: 'hook_viral_homme', text: ['1. tu manges PAS assez','tu crois que si.','tu manges pas assez.'] },
    { theme: 'nourriture', text: ['2. mange toutes les 3h','5 à 6 repas par jour.','les ectos brûlent tout vite.'] },
    { theme: 'gym', text: ['3. compound lifts only','squat, deadlift, bench, OHP.','isolation après 1 an.'] },
    { app: true, text: ['4. utilise ScrollUps','la régularité fait 80%','du résultat. zéro skip.','c\'est ton cheat code.'] },
    { theme: 'gym', text: ['5. dors 8h','les ectos récup mal.','sommeil = ta seule limite.'] },
  ]},

  { id: '14-pris-5kg-3mois', title: 'Voici comment j\'ai pris 5kg de muscle en 3 mois', template: 'voici-les-conseils', tags: ['muscle','transformation'], slides: [
    { theme: 'hook_viral_homme', text: ['voici comment j\'ai pris','5kg de muscle','en 3 mois.'] },
    { theme: 'nourriture', text: ['1. j\'ai mangé 3500 cal/jour','même les jours sans entraînement.','la prise de masse c\'est 24/7.'] },
    { theme: 'gym', text: ['2. progressive overload','+1kg ou +1 rep','chaque semaine.'] },
    { theme: 'gym', text: ['3. 4 séances/semaine','full body 2x + push/pull 2x.','jamais 5+.'] },
    { app: true, text: ['4. j\'utilise ScrollUps','j\'ai zéro skippé en 90 jours.','le tel m\'oblige à m\'entraîner.','game changer.'] },
    { theme: 'gym', text: ['5. j\'ai dormi 9h','prise de muscle = récupération.','le muscle pousse la nuit.'] },
  ]},

  // ════════ SEC / ABDOS / ÉTÉ ════════

  { id: '15-sec-cet-ete', title: 'Comment être bien sec pour cet été', template: 'sec-ete', tags: ['sec','été','abdos'], slides: [
    { theme: 'hook_viral_homme', text: ['Comment être bien sec','pour cet été'] },
    { theme: 'nourriture', text: ['1. arrête l\'alcool et les sodas','c\'est archi calorique','et tu vas rappeler ton ex.'] },
    { theme: 'nourriture', text: ['2. tiens un déficit calorique','c\'est obligatoire','pour perdre du gras.'] },
    { theme: 'nourriture', text: ['3. mange tes protéines','sinon tu perds aussi','du muscle.'] },
    { app: true, text: ['4. utilise ScrollUps','tes pompes avant ton scroll.','c\'est ton seul vrai cheat code.'] },
    { theme: 'gym', text: ['5. soulève lourd','vise 6 reps.','garde ton muscle pendant la sèche.'] },
    { theme: 'nature_outdoor', text: ['6. marche le plus possible','10k pas/jour minimum.','c\'est gratuit, c\'est efficace.'] },
    { theme: 'gym', text: ['7. dors 8h par nuit','mauvais sommeil =','stockage de gras.'] },
  ]},

  { id: '16-abdos-60-jours', title: 'Comment voir tes abdos en 60 jours — 5 erreurs', template: '5-a-eviter', tags: ['abdos','sèche'], slides: [
    { theme: 'hook_viral_homme', text: ['5 erreurs qui te','cachent tes abdos','depuis 1 an.'] },
    { theme: 'nourriture', text: ['1. tu fais 100 crunches/jour','les abdos c\'est 90% nutrition.','arrête les crunches.'] },
    { theme: 'nourriture', text: ['2. tu manges propre mais trop','clean food = food.','le déficit reste obligatoire.'] },
    { theme: 'gym', text: ['3. tu fais que du cardio','tu perds du muscle aussi.','soulève lourd EN MÊME TEMPS.'] },
    { app: true, text: ['4. utilise ScrollUps','la régularité bat l\'intensité.','60 jours zéro skip','> 30 jours intensifs.'] },
    { theme: 'hook_viral_homme', text: ['5. tu lâches à 5kg du but','les abdos apparaissent','dans les derniers 3kg.'] },
  ]},

  { id: '17-secher-sans-perdre-muscle', title: 'Comment sécher sans perdre ton muscle', template: 'comment-sans', tags: ['sec','muscle'], slides: [
    { theme: 'hook_viral_homme', text: ['Comment sécher','sans perdre ton muscle','(durement gagné).'] },
    { theme: 'nourriture', text: ['1. déficit modéré','-300 à -500 cal max.','plus = catastrophe musculaire.'] },
    { theme: 'nourriture', text: ['2. protéines élevées','2g/kg en sèche.','non négociable.'] },
    { theme: 'gym', text: ['3. continue à soulever lourd','garde tes charges.','la sèche c\'est nutrition pas gym.'] },
    { app: true, text: ['4. utilise ScrollUps','en sèche tu perds','la motivation à J21.','le tel décide pour toi.'] },
    { theme: 'gym', text: ['5. cardio raisonné','3-4x/sem max.','pas tous les jours.'] },
  ]},

  { id: '18-secher-sans-faim', title: 'Comment sécher sans crever de faim', template: 'comment-sans', tags: ['sec','nutrition'], slides: [
    { theme: 'hook_viral_homme', text: ['Comment sécher','sans crever de faim','(et tenir 3 mois).'] },
    { theme: 'nourriture', text: ['1. mange des aliments volumineux','légumes, soupes, fruits.','remplis ton estomac.'] },
    { theme: 'nourriture', text: ['2. protéines à chaque repas','30g+ par repas.','la satiété ultime.'] },
    { theme: 'nourriture', text: ['3. bois 3L d\'eau','la soif te fait croire que t\'as faim.','toujours.'] },
    { app: true, text: ['4. utilise ScrollUps','en sèche le scroll = craquer.','bloque le tel,','tu mangeras moins.'] },
    { theme: 'gym', text: ['5. dors 8h','peu de sommeil = leptine basse','= faim toute la journée.'] },
  ]},

  { id: '19-secher-erreurs', title: '5 erreurs en sèche qui ruinent ton muscle', template: '5-a-eviter', tags: ['sec','muscle'], slides: [
    { theme: 'hook_viral_homme', text: ['5 erreurs en sèche','qui ruinent','ton muscle.'] },
    { theme: 'nourriture', text: ['1. déficit trop agressif','-1000 cal = -muscle direct.','reste à -300/-500.'] },
    { theme: 'nourriture', text: ['2. protéines trop basses','2g/kg minimum en sèche.','plus le déficit augmente.'] },
    { theme: 'gym', text: ['3. tu fais que du cardio','soulève lourd 3-4x/sem.','signal au corps : garde le muscle.'] },
    { app: true, text: ['4. utilise ScrollUps','la régularité fait 80%.','en sèche tu vas vouloir skip.','impossible avec ScrollUps.'] },
    { theme: 'gym', text: ['5. tu coupes les glucides à 0','besoin de glycogène','pour les séances lourdes.'] },
  ]},

  // ════════ DISCIPLINE / SYSTÈME ════════

  { id: '20-discipline-de-fer', title: 'Voici comment j\'ai construit une discipline de fer en 1 an', template: 'voici-les-conseils', tags: ['discipline','transformation'], slides: [
    { theme: 'hook_viral_homme', text: ['voici comment j\'ai','construit une discipline','de fer en 1 an.'] },
    { theme: 'hook_viral_homme', text: ['1. j\'ai arrêté de me fier','à ma motivation','elle ment 99% du temps.'] },
    { theme: 'gym', text: ['2. j\'ai construit des systèmes','tenue prête, alarme,','process automatiques.'] },
    { theme: 'nourriture', text: ['3. j\'ai rendu l\'effort','ridiculement petit.','3 pompes minimum par jour.'] },
    { app: true, text: ['4. j\'utilise ScrollUps','c\'est le plus gros levier.','mon tel décide pour moi','quand je suis flou.'] },
    { theme: 'gym', text: ['5. j\'ai accepté les jours nazes','30% des jours sont mauvais.','tu tiens quand même.'] },
  ]},

  { id: '21-jamais-skip', title: 'Comment ne plus jamais skip une séance', template: 'comment-sans', tags: ['discipline','consistance'], slides: [
    { theme: 'hook_viral_homme', text: ['Comment ne plus jamais','skip une séance','(même en hiver).'] },
    { theme: 'gym', text: ['1. réduis l\'effort minimum','3 min de pompes maison.','ça compte comme une séance.'] },
    { theme: 'gym', text: ['2. décide la veille','quand, où, quoi.','zéro choix le matin.'] },
    { theme: 'gym', text: ['3. supprime les excuses','tenue posée à côté du lit.','pas une seule friction.'] },
    { app: true, text: ['4. utilise ScrollUps','impossible d\'ouvrir Insta','sans avoir bougé.','game over pour le skip.'] },
    { theme: 'gym', text: ['5. accepte les versions B','5 min > 0 min.','tous les jours.'] },
  ]},

  { id: '22-piliers-discipline', title: '5 piliers d\'une discipline qui dure', template: '5-a-eviter', tags: ['discipline','système'], slides: [
    { theme: 'hook_viral_homme', text: ['5 piliers d\'une','discipline qui tient','vraiment 1 an.'] },
    { theme: 'gym', text: ['1. décide pas, automatise','le matin tu dois pas réfléchir.','tout est prêt la veille.'] },
    { theme: 'nourriture', text: ['2. rends l\'inaction','plus chiante que l\'action.','friction sur les distractions.'] },
    { theme: 'gym', text: ['3. mesure chaque jour','case cochée = victoire.','30 cases = transformation.'] },
    { app: true, text: ['4. utilise ScrollUps','le 5ème pilier physique :','un système qui décide','quand tu doutes.'] },
    { theme: 'gym', text: ['5. accepte la médiocrité','30% des jours sont nazes.','tu tiens quand même.'] },
  ]},

  { id: '23-routine-1-an', title: 'Comment construire une routine que tu tiens 1 an', template: 'comment-sans', tags: ['routine','habitude'], slides: [
    { theme: 'hook_viral_homme', text: ['Comment construire','une routine','que tu tiens 1 an.'] },
    { theme: 'gym', text: ['1. commence ridiculement petit','3 pompes par jour.','trop petit pour échouer.'] },
    { theme: 'gym', text: ['2. ancre-la à un déclencheur','après le café, avant la douche.','le cerveau associe.'] },
    { theme: 'gym', text: ['3. trace chaque jour','case cochée = dopamine.','la chaîne devient sacrée.'] },
    { app: true, text: ['4. utilise ScrollUps','le scroll devient ta récompense','après ton minimum.','imbattable.'] },
    { theme: 'gym', text: ['5. progresse de 1%','jamais de bond.','toujours micro.'] },
  ]},

  // ════════ REPRISE / DÉBUTANT ════════

  { id: '24-erreurs-debutant', title: '5 erreurs des débutants qui les font abandonner', template: '5-a-eviter', tags: ['débutant','reprise'], slides: [
    { theme: 'hook_viral_homme', text: ['5 erreurs qui font','abandonner','les débutants.'] },
    { theme: 'gym', text: ['1. tu vises 5x/semaine d\'office','tu craques en 14 jours.','commence par 3.'] },
    { theme: 'gym', text: ['2. tu copies un programme avancé','5 splits, 90 min.','tu débutes, 45 min suffisent.'] },
    { theme: 'nourriture', text: ['3. tu changes ton alim aussi','double effort = double abandon.','sport d\'abord.'] },
    { app: true, text: ['4. utilise ScrollUps','le premier mois est critique.','le tel doit te FORCER','à bouger.'] },
    { theme: 'gym', text: ['5. tu compares J1 au J365','d\'un autre.','compare-toi à toi-même hier.'] },
  ]},

  { id: '25-canape-au-sport', title: 'Comment passer du canapé au sport quotidien', template: 'comment-sans', tags: ['débutant','reprise'], slides: [
    { theme: 'hook_viral_homme', text: ['Comment passer','du canapé au sport','tous les jours.'] },
    { theme: 'gym', text: ['1. commence par 3 min','3 pompes ou 30 sec planche.','c\'est tout.'] },
    { theme: 'gym', text: ['2. fais-le 3 jours d\'affilée','la première chaîne casse','le pattern de fainéant.'] },
    { theme: 'gym', text: ['3. ne rate jamais 2 jours d\'affilée','la règle d\'or','de la consistance.'] },
    { app: true, text: ['4. utilise ScrollUps','c\'est ton garde-fou','les jours où ton cerveau','dit non.'] },
    { theme: 'gym', text: ['5. progresse en plaisir, pas en intensité','si tu kiffes, tu reviens.','si tu souffres, tu fuis.'] },
  ]},

  { id: '26-reprise-2ans', title: 'Voici comment je me suis remis au sport après 2 ans', template: 'voici-les-conseils', tags: ['reprise','testimonial'], slides: [
    { theme: 'hook_viral_homme', text: ['voici comment je me suis','remis au sport','après 2 ans d\'arrêt.'] },
    { theme: 'gym', text: ['1. j\'ai commencé par 5 pompes','juste 5. au sol. dans le salon.','pas la salle. pas un programme.'] },
    { theme: 'nourriture', text: ['2. j\'ai pas touché à mon alim','la première semaine.','trop de changements = abandon.'] },
    { theme: 'gym', text: ['3. j\'ai pas regardé Instagram fitness','comparaison = poison','quand tu débutes.'] },
    { app: true, text: ['4. j\'ai installé ScrollUps','mon tel débloque les apps','que si j\'ai fait ma session.','zéro skip.'] },
    { theme: 'gym', text: ['5. j\'ai arrêté de viser','le bon corps.','j\'ai visé la régularité.'] },
  ]},

  // ════════ ROUTINE MATIN / SOMMEIL ════════

  { id: '27-erreurs-matin', title: '5 erreurs du matin qui ruinent ta journée', template: '5-a-eviter', tags: ['matin','routine'], slides: [
    { theme: 'hook_viral_homme', text: ['5 erreurs du matin','qui ruinent','ta journée.'] },
    { theme: 'hook_viral_homme', text: ['1. tu scroll au réveil','30 min de scroll =','dopamine cramée pour 8h.'] },
    { theme: 'nourriture', text: ['2. tu bois ton café à jeun','cortisol élevé.','ajoute eau + sel d\'abord.'] },
    { theme: 'gym', text: ['3. tu fais zéro mouvement','même 5 min.','le corps s\'éveille par le mouvement.'] },
    { app: true, text: ['4. utilise ScrollUps','tes pompes avant ton tel.','tu changes le matin','et toute la journée.'] },
    { theme: 'gym', text: ['5. tu prends pas de lumière','soleil 10 min dehors.','reset ton rythme circadien.'] },
  ]},

  { id: '28-routine-matin-changement', title: 'Voici la routine matin qui a tout changé pour moi', template: 'voici-les-conseils', tags: ['matin','testimonial'], slides: [
    { theme: 'hook_viral_homme', text: ['voici la routine matin','qui a tout changé','pour moi.'] },
    { theme: 'gym', text: ['1. eau + sel avant tout','500ml d\'eau + pincée de sel.','tu te réhydrate de la nuit.'] },
    { theme: 'gym', text: ['2. 10 pompes au sol','direct.','le corps s\'allume.'] },
    { theme: 'nature_outdoor', text: ['3. soleil 10 min','même fenêtre ouverte.','reset circadien.'] },
    { app: true, text: ['4. j\'utilise ScrollUps','mon tel s\'ouvre QUE','après ma routine.','plus aucun matin perdu.'] },
    { theme: 'gym', text: ['5. petit déj 30g protéines','œufs ou yaourt grec.','focus + énergie pour 5h.'] },
  ]},

  { id: '29-mieux-dormir', title: 'Comment mieux dormir en 7 jours', template: 'comment-sans', tags: ['sommeil','récup'], slides: [
    { theme: 'hook_viral_homme', text: ['Comment mieux dormir','en 7 jours','(sans rien acheter).'] },
    { theme: 'nourriture', text: ['1. pas de caféine après 14h','la demi-vie c\'est 6h.','ton sommeil est saboté.'] },
    { theme: 'gym', text: ['2. lumière forte le matin','5 min dehors max midi.','synchronise ton horloge.'] },
    { theme: 'gym', text: ['3. tel hors de la chambre','vraiment.','la tentation au réveil disparaît.'] },
    { app: true, text: ['4. utilise ScrollUps','tu scroll plus avant de dormir.','endormissement -30 min.','testé.'] },
    { theme: 'gym', text: ['5. heure fixe au coucher','même weekend.','le corps adore la routine.'] },
  ]},

  // ════════ MOTIVATION / SCROLL ════════

  { id: '30-arreter-scroller-6h', title: 'Voici comment j\'ai arrêté de scroller 6h par jour', template: 'voici-les-conseils', tags: ['scroll','phone','testimonial'], slides: [
    { theme: 'hook_viral_homme', text: ['voici comment j\'ai','arrêté de scroller','6h par jour.'] },
    { theme: 'hook_viral_homme', text: ['1. j\'ai accepté que je suis accro','déni = pas de solution.','la conscience c\'est l\'étape 1.'] },
    { theme: 'gym', text: ['2. j\'ai retiré l\'app du home screen','un swipe de plus = 70% en moins.','la friction c\'est tout.'] },
    { theme: 'gym', text: ['3. j\'ai remplacé, pas supprimé','un livre dans ma poche.','quand j\'avais l\'envie.'] },
    { app: true, text: ['4. j\'utilise ScrollUps','le truc qui a vraiment marché.','tel = pompes d\'abord.','récupéré 4h/jour.'] },
    { theme: 'gym', text: ['5. j\'ai arrêté de me battre','contre moi-même.','j\'ai installé un système qui décide.'] },
  ]},

  { id: '31-recupere-3h', title: 'Voici comment j\'ai récupéré 3h par jour', template: 'voici-les-conseils', tags: ['scroll','time','testimonial'], slides: [
    { theme: 'hook_viral_homme', text: ['voici comment j\'ai','récupéré 3h','par jour.'] },
    { theme: 'hook_viral_homme', text: ['1. j\'ai checké mon screen time','5h47/jour.','le shock m\'a réveillé.'] },
    { theme: 'gym', text: ['2. j\'ai bloqué les apps','de 22h à 9h.','déjà -2h récupérées.'] },
    { theme: 'nature_outdoor', text: ['3. j\'ai mis le tel en N&B','le cerveau perd l\'envie.','-30%.'] },
    { app: true, text: ['4. j\'utilise ScrollUps','le vrai changement.','le tel = pompes obligatoires.','J+30 = -3h/jour.'] },
    { theme: 'gym', text: ['5. j\'ai investi','les 3h dans le sport.','transformation 6 mois.'] },
  ]},

  { id: '32-controle-tel', title: '5 trucs pour reprendre le contrôle de ton tel', template: '5-a-eviter', tags: ['scroll','phone'], slides: [
    { theme: 'hook_viral_homme', text: ['5 trucs pour reprendre','le contrôle','de ton téléphone.'] },
    { theme: 'gym', text: ['1. enlève les apps du home screen','recherche obligatoire =','-50% d\'ouvertures.'] },
    { theme: 'gym', text: ['2. notifications OFF','sauf appels et SMS.','le silence c\'est la liberté.'] },
    { theme: 'gym', text: ['3. tel en niveaux de gris','le cerveau perd l\'attrait.','test 24h pour voir.'] },
    { app: true, text: ['4. utilise ScrollUps','le seul truc qui force','vraiment ta main.','sport d\'abord.'] },
    { theme: 'gym', text: ['5. range le tel hors de vue','out of sight = out of mind.','vraiment.'] },
  ]},

  { id: '33-30min-reveil-scroll', title: 'Comment ne plus scroller 30 min au réveil', template: 'comment-sans', tags: ['scroll','matin'], slides: [
    { theme: 'hook_viral_homme', text: ['Comment ne plus scroller','30 min au réveil','(et changer ta journée).'] },
    { theme: 'gym', text: ['1. tel hors de la chambre','vraiment. dans le salon.','tu te lèves pour le couper.'] },
    { theme: 'gym', text: ['2. réveil mécanique à côté','old school.','3€ chez Amazon.'] },
    { theme: 'gym', text: ['3. premier geste = pompes','5 pompes, c\'est tout.','le corps s\'allume.'] },
    { app: true, text: ['4. utilise ScrollUps','le tel s\'ouvre QUE','après 5 pompes.','le matin est sauvé.'] },
    { theme: 'gym', text: ['5. lumière + eau','volets ouverts, eau froide.','dopamine naturelle.'] },
  ]},

  { id: '34-scroll-vs-muscle', title: 'Comment échanger ton scroll contre du muscle', template: 'comment-sans', tags: ['scroll','muscle'], slides: [
    { theme: 'hook_viral_homme', text: ['Comment échanger','ton scroll','contre du muscle.'] },
    { theme: 'hook_viral_homme', text: ['1. compte tes heures de scroll','en moyenne 3h47/jour.','soit 1380h/an.'] },
    { theme: 'gym', text: ['2. transforme 30 min','en pompes.','3% de ton scroll.'] },
    { theme: 'gym', text: ['3. en 90 jours = 90 séances','transformation visible.','au prix de 0€.'] },
    { app: true, text: ['4. utilise ScrollUps','rend l\'échange automatique.','sport d\'abord.','scroll après.'] },
    { theme: 'gym', text: ['5. après 6 mois','tu te demandes comment','tu pouvais perdre 4h/jour.'] },
  ]},

  // ════════ MINDSET / MOTIVATION ════════

  { id: '35-erreurs-motivation', title: '5 erreurs qui détruisent ta motivation', template: '5-a-eviter', tags: ['motivation','mindset'], slides: [
    { theme: 'hook_viral_homme', text: ['5 erreurs qui détruisent','ta motivation','(et tu fais les 5).'] },
    { theme: 'hook_viral_homme', text: ['1. tu attends d\'être motivé','la motivation vient APRÈS','le mouvement.'] },
    { theme: 'gym', text: ['2. tu te fixes un objectif','de 3 mois.','impossible à voir.'] },
    { theme: 'gym', text: ['3. tu suis 50 comptes fitness','comparaison = épuisement.','suis 5 max.'] },
    { app: true, text: ['4. utilise ScrollUps','la motivation est inutile','si t\'as un système.','le tel décide pour toi.'] },
    { theme: 'gym', text: ['5. tu cherches le secret','y en a pas.','juste de la régularité.'] },
  ]},

  { id: '36-verite-motivation', title: 'La vérité sur la motivation', template: 'punchlines', tags: ['motivation','mindset'], slides: [
    { theme: 'hook_viral_homme', text: ['Tu verras des vrais progrès','quand tu auras compris ça.'] },
    { theme: 'gym', text: ['la motivation c\'est de la chance.','pas un carburant.'] },
    { theme: 'gym', text: ['les gens disciplinés','ne sont pas plus motivés que toi.'] },
    { theme: 'nourriture', text: ['ils ont des systèmes','que toi t\'as pas.'] },
    { theme: 'gym', text: ['un système > 100 articles','sur la motivation.'] },
    { app: true, text: ['ScrollUps c\'est juste','un système qui marche.'] },
    { theme: 'gym', text: ['arrête de chercher la flamme.','installe le carburant.'] },
  ]},

  { id: '37-passer-action', title: 'Comment passer à l\'action sans réfléchir', template: 'comment-sans', tags: ['action','mindset'], slides: [
    { theme: 'hook_viral_homme', text: ['Comment passer à l\'action','sans réfléchir','(la règle des 5 secondes).'] },
    { theme: 'gym', text: ['1. compte 5-4-3-2-1','et bouge.','avant que ton cerveau négocie.'] },
    { theme: 'gym', text: ['2. minimum ridicule','3 pompes. c\'est tout.','impossible de refuser.'] },
    { theme: 'gym', text: ['3. décide la veille','pas le matin.','le matin t\'es ton pire ennemi.'] },
    { app: true, text: ['4. utilise ScrollUps','si t\'as pas la flamme,','le tel décide pour toi.','imbattable.'] },
    { theme: 'gym', text: ['5. accepte l\'imperfection','5 pompes pourries','> 50 parfaites jamais faites.'] },
  ]},

  { id: '38-procrastiner-fini', title: 'Voici comment j\'ai arrêté de procrastiner après 3 ans', template: 'voici-les-conseils', tags: ['procrastination','testimonial'], slides: [
    { theme: 'hook_viral_homme', text: ['voici comment j\'ai','arrêté de procrastiner','après 3 ans.'] },
    { theme: 'hook_viral_homme', text: ['1. j\'ai arrêté de chercher','la motivation.','elle vient JAMAIS avant l\'action.'] },
    { theme: 'gym', text: ['2. j\'ai cassé l\'effort à 2 minutes','sport : 2 min jumping jacks.','boulot : 2 min de truc moche.'] },
    { theme: 'gym', text: ['3. j\'ai supprimé les choix','tenue prête, café prêt.','zéro décision = zéro résistance.'] },
    { app: true, text: ['4. j\'utilise ScrollUps','mon tel s\'ouvre QUE','si j\'ai fait mon minimum.','impossible de procrastiner.'] },
    { theme: 'gym', text: ['5. j\'ai arrêté d\'attendre','le bon moment.','le bon moment c\'est jamais.'] },
  ]},

  // ════════ HABITUDES / CONSISTANCE ════════

  { id: '39-tenir-habitude', title: 'Comment tenir une habitude sans motivation', template: 'comment-sans', tags: ['habitude','consistance'], slides: [
    { theme: 'hook_viral_homme', text: ['Comment tenir','une habitude','sans motivation.'] },
    { theme: 'gym', text: ['1. rends-la ridiculement petite','1 pompe. 1 page. 1 minute.','trop petit pour échouer.'] },
    { theme: 'gym', text: ['2. lie-la à un déclencheur fixe','après le café = pompes.','le cerveau associe automatique.'] },
    { theme: 'gym', text: ['3. mesure-la chaque jour','case cochée = victoire.','30 cases = transformation.'] },
    { app: true, text: ['4. utilise ScrollUps','ton scroll devient ta récompense','après ton minimum quotidien.','système > volonté.'] },
    { theme: 'gym', text: ['5. accepte les jours moyens','30% des jours sont nazes.','tu tiens quand même = tu gagnes.'] },
  ]},

  { id: '40-tenu-365-pompes', title: 'Voici comment j\'ai tenu 365 jours de pompes', template: 'voici-les-conseils', tags: ['habitude','testimonial'], slides: [
    { theme: 'hook_viral_homme', text: ['voici comment j\'ai tenu','365 jours','de pompes d\'affilée.'] },
    { theme: 'gym', text: ['1. j\'ai commencé par 1 pompe','le J1.','vraiment 1.'] },
    { theme: 'gym', text: ['2. règle absolue : jamais 2 jours skipped','si t\'as oublié J5,','J6 c\'est sacré.'] },
    { theme: 'gym', text: ['3. minimum les jours nazes','3 pompes même malade.','ça compte.'] },
    { app: true, text: ['4. j\'utilise ScrollUps','c\'est mon assurance.','les jours où ma volonté lâche,','le tel insiste.'] },
    { theme: 'gym', text: ['5. j\'ai tracé chaque jour','calendrier mural avec X.','la chaîne devient sacrée.'] },
  ]},

  { id: '41-empiler-habitudes', title: 'Comment empiler tes habitudes pour les rendre faciles', template: 'comment-sans', tags: ['habitude','système'], slides: [
    { theme: 'hook_viral_homme', text: ['Comment empiler','tes habitudes','(habit stacking).'] },
    { theme: 'gym', text: ['1. identifie une habitude existante','café du matin, douche, brossage.','chaque jour, fixe.'] },
    { theme: 'gym', text: ['2. accroche la nouvelle','APRÈS la fixe.','après le café = 10 pompes.'] },
    { theme: 'gym', text: ['3. commence à 30 secondes','très petit au début.','tu ajustes après 30 jours.'] },
    { app: true, text: ['4. utilise ScrollUps','empile : avant Insta = pompes.','le cerveau associe.','automatique en 21 jours.'] },
    { theme: 'gym', text: ['5. ne change qu\'une habitude','à la fois.','30 jours par habitude.'] },
  ]},

  // ════════ FITNESS SPÉCIFIQUE ════════

  { id: '42-progresser-pompes', title: 'Comment progresser en pompes (5 étapes)', template: '5-a-eviter', tags: ['pompes','progression'], slides: [
    { theme: 'hook_viral_homme', text: ['5 étapes pour progresser','en pompes','(de 0 à 50).'] },
    { theme: 'gym', text: ['1. commence sur les genoux','pas une honte.','technique avant volume.'] },
    { theme: 'gym', text: ['2. fais 5 séries de max','tous les jours.','pas un programme. juste max.'] },
    { theme: 'gym', text: ['3. négatives lentes','5 sec à descendre.','c\'est là que ça pousse.'] },
    { app: true, text: ['4. utilise ScrollUps','la régularité fait 80%.','5 pompes/jour x 90 jours','> 50 pompes une fois.'] },
    { theme: 'gym', text: ['5. ajoute du tempo','pause en bas.','rep parfaite x 30 jours.'] },
  ]},

  { id: '43-0-a-50-pompes', title: 'Voici comment je suis passé de 0 à 50 pompes', template: 'voici-les-conseils', tags: ['pompes','transformation'], slides: [
    { theme: 'hook_viral_homme', text: ['voici comment je suis','passé de 0 à 50 pompes','en 90 jours.'] },
    { theme: 'gym', text: ['1. j\'ai commencé sur les genoux','3 séries de 5.','c\'était dur. très.'] },
    { theme: 'gym', text: ['2. j\'ai progressé en négatives','5 sec à la descente.','clé absolue.'] },
    { theme: 'gym', text: ['3. j\'ai fait pompes EVERY DAMN DAY','jamais de jour off.','même 5.'] },
    { app: true, text: ['4. j\'ai utilisé ScrollUps','mon tel m\'a forcé','les jours où je voulais skip.','45 jours sans rater.'] },
    { theme: 'gym', text: ['5. à J60 j\'étais à 30','à J90 à 50.','la régularité fait tout.'] },
  ]},

  { id: '44-deficit-sans-craquer', title: 'Comment tenir un déficit calorique sans craquer', template: 'comment-sans', tags: ['nutrition','sec'], slides: [
    { theme: 'hook_viral_homme', text: ['Comment tenir un','déficit calorique','sans craquer.'] },
    { theme: 'nourriture', text: ['1. déficit modéré','-300/-500 cal.','pas plus.'] },
    { theme: 'nourriture', text: ['2. protéines élevées','2g/kg en sèche.','la satiété ultime.'] },
    { theme: 'nourriture', text: ['3. mange des aliments volumineux','légumes, soupes.','volume bas en cal.'] },
    { app: true, text: ['4. utilise ScrollUps','les craquages viennent','souvent du scroll boring.','bloque le tel = bloque les craquages.'] },
    { theme: 'nourriture', text: ['5. autorise 1 cheat meal','par semaine.','évite l\'effet rebond.'] },
  ]},

  { id: '45-proteines-2g', title: 'Comment manger 2g/kg de protéines sans souffrir', template: 'comment-sans', tags: ['nutrition','protéines'], slides: [
    { theme: 'hook_viral_homme', text: ['Comment manger 2g/kg','de protéines','sans souffrir.'] },
    { theme: 'nourriture', text: ['1. 30g par repas','5 repas = 150g facile.','sur 80kg : c\'est 1.9g/kg.'] },
    { theme: 'nourriture', text: ['2. petit déj 3 œufs','15g de prot direct.','avant que tu réfléchisses.'] },
    { theme: 'nourriture', text: ['3. yaourt grec en collation','15-20g par pot.','pratique, pas cher.'] },
    { app: true, text: ['4. utilise ScrollUps','la nutrition c\'est régularité','ScrollUps t\'oblige à','tenir tes habitudes.'] },
    { theme: 'nourriture', text: ['5. shaker de secours','les jours pressés.','30g en 2 min.'] },
  ]},

  // ════════ PUNCHLINES / VÉRITÉS ════════

  { id: '46-vrais-progres', title: 'Tu verras des vrais progrès quand tu auras compris ça', template: 'punchlines', tags: ['mindset','vérité'], slides: [
    { theme: 'hook_viral_homme', text: ['Tu verras des vrais progrès','quand tu auras compris ça.'] },
    { theme: 'gym', text: ['6 reps > 12 reps','quand tu cherches le muscle.'] },
    { theme: 'nourriture', text: ['les abdos c\'est avec un déficit calorique.','c\'est pas en faisant des crunches.'] },
    { theme: 'gym', text: ['du cardio après ta séance,','ça fait la diff.'] },
    { theme: 'nourriture', text: ['les bonnes graisses','sont indispensables.'] },
    { app: true, text: ['ScrollUps fait','ce que ta volonté ne peut pas.'] },
    { theme: 'gym', text: ['le sommeil c\'est la BASE.','8h par nuit minimum.'] },
  ]},

  { id: '47-personne-te-dit', title: '5 vérités sur la prise de masse que personne te dit', template: 'punchlines', tags: ['muscle','vérité'], slides: [
    { theme: 'hook_viral_homme', text: ['5 vérités sur la prise de masse','que personne te dit.'] },
    { theme: 'nourriture', text: ['si tu manges pas plus,','tu prends pas de muscle.'] },
    { theme: 'gym', text: ['l\'hypertrophie c\'est 6-12 reps,','pas 20.'] },
    { theme: 'gym', text: ['90% du résultat','vient des compound lifts.'] },
    { theme: 'nourriture', text: ['les supplements','ne valent pas un bon dîner.'] },
    { app: true, text: ['la régularité','bat l\'intensité 10x sur 10.'] },
    { theme: 'gym', text: ['la patience','c\'est ton meilleur exo.'] },
  ]},

  { id: '48-discipline-pas-volonte', title: 'La discipline c\'est pas la volonté', template: 'punchlines', tags: ['discipline','mindset'], slides: [
    { theme: 'hook_viral_homme', text: ['La discipline c\'est pas la volonté.','et voici pourquoi.'] },
    { theme: 'gym', text: ['la volonté est limitée.','elle se vide chaque jour.'] },
    { theme: 'gym', text: ['les gens disciplinés','utilisent zéro volonté.'] },
    { theme: 'nourriture', text: ['ils ont des systèmes','qui décident pour eux.'] },
    { theme: 'gym', text: ['leur tenue est prête,','leur calendrier est figé.'] },
    { app: true, text: ['ScrollUps c\'est exactement ça.','un système qui décide pour toi.'] },
    { theme: 'gym', text: ['arrête de te battre.','installe les rails.'] },
  ]},

  // ════════ CHALLENGES / TEMPS ════════

  { id: '49-doubler-force-6mois', title: 'Comment doubler ta force en 6 mois', template: '5-a-eviter', tags: ['force','progression'], slides: [
    { theme: 'hook_viral_homme', text: ['5 trucs pour doubler','ta force','en 6 mois.'] },
    { theme: 'gym', text: ['1. progressive overload','+1kg ou +1 rep par semaine.','non négociable.'] },
    { theme: 'gym', text: ['2. focus 4 mouvements','squat, deadlift, bench, OHP.','rien d\'autre.'] },
    { theme: 'nourriture', text: ['3. surplus calorique','+300 cal/jour.','la force c\'est aussi nutrition.'] },
    { app: true, text: ['4. utilise ScrollUps','la régularité fait tout.','3 séances/sem 6 mois','> 5 séances 1 mois.'] },
    { theme: 'gym', text: ['5. dors 8h','la récup c\'est 50% du game.','jamais moins.'] },
  ]},

  { id: '50-30-jours-transformation', title: 'Voici ce qui se passe quand tu fais 30 jours de sport', template: 'voici-les-conseils', tags: ['challenge','30-days'], slides: [
    { theme: 'hook_viral_homme', text: ['voici ce qui se passe','quand tu fais 30 jours','de sport sans skip.'] },
    { theme: 'gym', text: ['1. semaine 1 : douleurs','partout. tu veux abandonner.','tiens.'] },
    { theme: 'gym', text: ['2. semaine 2 : énergie','le sommeil s\'améliore.','le matin tu kiffes.'] },
    { theme: 'hook_viral_homme', text: ['3. semaine 3 : addiction','tu skip plus.','tu cherches comment intensifier.'] },
    { app: true, text: ['4. j\'utilise ScrollUps','c\'est ce qui m\'a permis','de tenir 30 jours.','sans cette appli, j\'aurais skippé.'] },
    { theme: 'gym', text: ['5. semaine 4 : transformation','visuelle ET mentale.','tu ne reviens jamais en arrière.'] },
  ]},

  // ════════ PHYSIQUE SPÉCIFIQUE — Body parts ════════

  { id: '51-dos-large', title: 'Comment avoir un dos large — 5 erreurs', template: '5-a-eviter', tags: ['dos','muscle'], slides: [
    { theme: 'hook_viral_homme', text: ['5 erreurs qui','t\'empêchent d\'avoir','un dos large.'] },
    { theme: 'gym', text: ['1. tu fais que des tractions','pull-ups + rowing.','les deux ou rien.'] },
    { theme: 'gym', text: ['2. tu tires avec les bras','contracte les omoplates.','le dos d\'abord.'] },
    { theme: 'nourriture', text: ['3. tu manges pas assez','un dos large = volume.','+300 cal minimum.'] },
    { app: true, text: ['4. utilise ScrollUps','le dos pousse en 12-18 mois.','la régularité fait tout.','zéro skip.'] },
    { theme: 'gym', text: ['5. tu fais 3x10','passe à 5x6 lourd.','la masse vient des séries lourdes.'] },
  ]},

  { id: '52-bras-explosés', title: 'Comment avoir des bras explosés', template: 'comment-sans', tags: ['bras','muscle'], slides: [
    { theme: 'hook_viral_homme', text: ['Comment avoir des bras','explosés','en 6 mois.'] },
    { theme: 'gym', text: ['1. les triceps font 60% du bras','focus dessus,','pas que sur les biceps.'] },
    { theme: 'gym', text: ['2. close-grip bench + dips','les rois des triceps.','non négociable.'] },
    { theme: 'gym', text: ['3. curl marteau + curl barre','varie les angles.','les biceps ont 2 chefs.'] },
    { app: true, text: ['4. utilise ScrollUps','les bras = volume hebdo élevé.','tu peux pas skip une semaine.','le tel garde le rythme.'] },
    { theme: 'gym', text: ['5. mange 2g protéines/kg','les bras sont petits.','besoin de surplus.'] },
  ]},

  { id: '53-pectoraux-developpes', title: 'Comment développer tes pectoraux', template: '5-a-eviter', tags: ['pectoraux','muscle'], slides: [
    { theme: 'hook_viral_homme', text: ['5 erreurs qui ruinent','le développement','de tes pectoraux.'] },
    { theme: 'gym', text: ['1. tu fais que du bench plat','incliné + decline aussi.','pour le haut et le bas.'] },
    { theme: 'gym', text: ['2. tu rebondis la barre','contrôle la descente.','3 secondes minimum.'] },
    { theme: 'gym', text: ['3. tu négliges les écartés','full stretch en bas.','la croissance vient de là.'] },
    { app: true, text: ['4. utilise ScrollUps','les pecs poussent vite','si t\'es régulier.','le tel = ton garant de régularité.'] },
    { theme: 'gym', text: ['5. tu charges trop','technique > poids.','retiens ton ego à la salle.'] },
  ]},

  { id: '54-jambes-fortes', title: '5 raisons de ne plus skip les jambes', template: '5-a-eviter', tags: ['jambes','muscle'], slides: [
    { theme: 'hook_viral_homme', text: ['5 raisons','d\'arrêter de skip','les jambes.'] },
    { theme: 'gym', text: ['1. 60% de ta testo','vient des squats.','plus de testo = plus de gains partout.'] },
    { theme: 'gym', text: ['2. masse globale','les jambes = 45% du corps.','tu skip, tu rates 45%.'] },
    { theme: 'nourriture', text: ['3. brûle plus de cal','en sèche c\'est ton meilleur ami.','pas en cardio. en squats.'] },
    { app: true, text: ['4. utilise ScrollUps','les jambes sont les + sautées.','le tel oblige.','plus jamais.'] },
    { theme: 'gym', text: ['5. proportions','un dos large + bras fins =','t\'as l\'air ridicule.'] },
  ]},

  { id: '55-bonne-posture', title: 'Comment fix ta posture en 30 jours', template: 'comment-sans', tags: ['posture','santé'], slides: [
    { theme: 'hook_viral_homme', text: ['Comment fix ta posture','en 30 jours','(et avoir l\'air confiant).'] },
    { theme: 'gym', text: ['1. travaille tes rhomboïdes','rowing serré.','tire les omoplates.'] },
    { theme: 'gym', text: ['2. ouvre tes pectoraux','écartés porte de douche.','30 sec, 3x/jour.'] },
    { theme: 'gym', text: ['3. core fort','planches 3 min/jour.','la posture vient du core.'] },
    { app: true, text: ['4. utilise ScrollUps','la posture se travaille','tous les jours.','le tel garantit la routine.'] },
    { theme: 'gym', text: ['5. tel à hauteur des yeux','pas penché vers le bas.','évite le tech neck.'] },
  ]},

  { id: '56-progresser-deadlift', title: 'Comment progresser en deadlift en 30 jours', template: '5-a-eviter', tags: ['deadlift','force'], slides: [
    { theme: 'hook_viral_homme', text: ['5 erreurs qui te','bloquent en deadlift','depuis 6 mois.'] },
    { theme: 'gym', text: ['1. tu fais 3 séries de 8','passe à 5 séries de 3.','le deadlift c\'est lourd.'] },
    { theme: 'gym', text: ['2. tu tires avec le dos','pousse avec les jambes d\'abord.','le dos verrouille.'] },
    { theme: 'gym', text: ['3. tu fais pas de prise inversée','sur les séries lourdes.','grip = ta limite #1.'] },
    { app: true, text: ['4. utilise ScrollUps','le deadlift demande la régularité.','zéro skip.','sinon tu redescends.'] },
    { theme: 'gym', text: ['5. tu fais pas de pauses','60-90 sec entre séries lourdes.','3 min minimum.'] },
  ]},

  { id: '57-tractions-0-a-10', title: 'Comment passer de 0 à 10 tractions', template: 'voici-les-conseils', tags: ['tractions','force','progression'], slides: [
    { theme: 'hook_viral_homme', text: ['voici comment je suis','passé de 0 à 10','tractions strictes.'] },
    { theme: 'gym', text: ['1. j\'ai commencé par les négatives','saut au sommet, descente lente.','5 sec, 5 reps.'] },
    { theme: 'gym', text: ['2. j\'ai fait des dead hangs','suspendre 30 sec,','puis 60. la prise.'] },
    { theme: 'gym', text: ['3. j\'ai mis un élastique','pour assistance.','retire-le progressivement.'] },
    { app: true, text: ['4. j\'utilise ScrollUps','j\'ai grimpé tous les jours','aux barres.','impossible de skip.'] },
    { theme: 'gym', text: ['5. j\'ai persisté 90 jours','J1: 0 tractions.','J90: 10 strictes.'] },
  ]},

  { id: '58-cardio-progresser', title: '5 erreurs en cardio qui te bloquent', template: '5-a-eviter', tags: ['cardio','endurance'], slides: [
    { theme: 'hook_viral_homme', text: ['5 erreurs en cardio','qui te bloquent','depuis le début.'] },
    { theme: 'gym', text: ['1. tu cours toujours pareil','varie : zone 2 + sprints.','le corps s\'adapte sinon.'] },
    { theme: 'gym', text: ['2. tu fais 80% en intensité','80% facile, 20% dur.','règle d\'or des coureurs.'] },
    { theme: 'nature_outdoor', text: ['3. tu cours sans plan','semaine 1: 3x20min.','progression linéaire.'] },
    { app: true, text: ['4. utilise ScrollUps','le cardio = régularité.','3x/sem 3 mois','> 6x/sem 1 mois.'] },
    { theme: 'gym', text: ['5. tu négliges la récup','jour off + sommeil.','la progression = repos.'] },
  ]},

  // ════════ NUTRITION SPÉCIFIQUE ════════

  { id: '59-petit-dej-parfait', title: 'Le petit-déj parfait pour la prise de muscle', template: 'sec-ete', tags: ['nutrition','petit-dej'], slides: [
    { theme: 'hook_viral_homme', text: ['Le petit-déj parfait','pour prendre du muscle'] },
    { theme: 'nourriture', text: ['1. 30-40g de protéines','3 œufs + yaourt grec.','non négociable.'] },
    { theme: 'nourriture', text: ['2. glucides lents','flocons d\'avoine, pain complet.','énergie qui dure.'] },
    { theme: 'nourriture', text: ['3. fruits frais','banane ou baies.','vitamines + glucides.'] },
    { app: true, text: ['4. utilise ScrollUps','tel = pompes du matin','AVANT le petit-déj.','double win.'] },
    { theme: 'nourriture', text: ['5. eau + électrolytes','hydratation post-nuit.','pincée de sel.'] },
    { theme: 'nourriture', text: ['6. café après','pas avant les électrolytes.','cortisol stable.'] },
    { theme: 'nourriture', text: ['7. mange dans les 30 min','après le réveil.','pic de croissance.'] },
  ]},

  { id: '60-collations-saines', title: '5 collations qui boostent ton muscle', template: '5-a-eviter', tags: ['nutrition','snack'], slides: [
    { theme: 'hook_viral_homme', text: ['5 collations','qui boostent','ton muscle.'] },
    { theme: 'nourriture', text: ['1. yaourt grec + miel','15g protéines.','prêt en 10 sec.'] },
    { theme: 'nourriture', text: ['2. fromage blanc + amandes','20g protéines.','satiété ultime.'] },
    { theme: 'nourriture', text: ['3. shaker whey + banane','en post-training.','30g rapide.'] },
    { app: true, text: ['4. utilise ScrollUps','les collations = régularité.','zéro skip dans la journée.','le tel rappelle.'] },
    { theme: 'nourriture', text: ['5. œufs durs préparés','3 œufs = 18g protéines.','meal prep dimanche.'] },
  ]},

  { id: '61-eau-3l-jour', title: 'Comment boire 3L d\'eau par jour sans souffrir', template: 'comment-sans', tags: ['eau','hydratation'], slides: [
    { theme: 'hook_viral_homme', text: ['Comment boire 3L d\'eau','par jour','sans souffrir.'] },
    { theme: 'gym', text: ['1. gourde 1L visible','sur ton bureau.','out of sight = oubli.'] },
    { theme: 'gym', text: ['2. 500ml au réveil','direct.','réhydrate la nuit.'] },
    { theme: 'nourriture', text: ['3. 500ml avant chaque repas','déjà 1.5L acquis.','3 repas = facile.'] },
    { app: true, text: ['4. utilise ScrollUps','la régularité hydrique','c\'est tous les jours.','zéro oubli avec le tel.'] },
    { theme: 'gym', text: ['5. ajoute saveur naturelle','citron, concombre.','tu kiffes plus.'] },
  ]},

  { id: '62-sucre-arreter', title: 'Comment arrêter le sucre en 14 jours', template: 'comment-sans', tags: ['sucre','sec'], slides: [
    { theme: 'hook_viral_homme', text: ['Comment arrêter le sucre','en 14 jours','(sans craquer).'] },
    { theme: 'nourriture', text: ['1. vide ton placard','tu manges pas','ce qui n\'est pas là.'] },
    { theme: 'nourriture', text: ['2. mange plus de protéines','30g par repas.','tue la faim de sucre.'] },
    { theme: 'nourriture', text: ['3. fruits comme dessert','banane, pomme.','satisfait sans craquer.'] },
    { app: true, text: ['4. utilise ScrollUps','le scroll = craquage.','tel bloqué = sucre bloqué.','testé.'] },
    { theme: 'gym', text: ['5. dors 8h','peu de sommeil = envie de sucre.','sciencitfique.'] },
  ]},

  { id: '63-meal-prep', title: 'Meal prep — 5 erreurs des débutants', template: '5-a-eviter', tags: ['meal-prep','nutrition'], slides: [
    { theme: 'hook_viral_homme', text: ['5 erreurs en meal prep','qui te font','abandonner.'] },
    { theme: 'nourriture', text: ['1. tu prep 7 jours d\'un coup','3-4 jours max.','sinon goût dégueu jour 6.'] },
    { theme: 'nourriture', text: ['2. tu fais que du poulet riz','varie 3 sources prot.','tu tiens 1 mois sinon 1 sem.'] },
    { theme: 'nourriture', text: ['3. tu prep que les déjeuners','prep aussi les snacks.','le combo qui craque.'] },
    { app: true, text: ['4. utilise ScrollUps','meal prep = régularité.','dimanche soir,','zéro excuse.'] },
    { theme: 'nourriture', text: ['5. tu sous-estimes les portions','double les protéines.','calcule pas au feeling.'] },
  ]},

  // ════════ ÉNERGIE / FATIGUE ════════

  { id: '64-energie-toute-journee', title: 'Comment avoir de l\'énergie toute la journée', template: '5-a-eviter', tags: ['énergie','vitalité'], slides: [
    { theme: 'hook_viral_homme', text: ['5 hacks pour avoir','de l\'énergie','toute la journée.'] },
    { theme: 'gym', text: ['1. soleil dans les 30 min','après le réveil.','5 min dehors.'] },
    { theme: 'nourriture', text: ['2. protéines avant glucides','évite le crash de 11h.','règle d\'or.'] },
    { theme: 'gym', text: ['3. bouge toutes les heures','même 2 min.','le sang circule.'] },
    { app: true, text: ['4. utilise ScrollUps','le scroll = pompage d\'énergie.','le tel bloqué = énergie sauvée.','testé.'] },
    { theme: 'gym', text: ['5. dors à heure fixe','même weekend.','ton corps adore la routine.'] },
  ]},

  { id: '65-fatigue-toujours', title: 'Pourquoi t\'es toujours fatigué (5 vraies raisons)', template: '5-a-eviter', tags: ['fatigue','sommeil','énergie'], slides: [
    { theme: 'hook_viral_homme', text: ['Pourquoi t\'es toujours','fatigué','(les 5 vraies raisons).'] },
    { theme: 'gym', text: ['1. tu scroll au lit','la lumière bleue détruit','ton mélatonine.'] },
    { theme: 'gym', text: ['2. tu manges pas assez','déficit chronique = burnout.','calcule tes besoins.'] },
    { theme: 'nourriture', text: ['3. trop de café','la caféine masque la fatigue.','elle revient x2.'] },
    { app: true, text: ['4. utilise ScrollUps','arrête de scroller','30 min avant dormir.','sommeil profond +40%.'] },
    { theme: 'gym', text: ['5. zéro mouvement','rester assis 10h = fatigue.','marche 10 min toutes les 2h.'] },
  ]},

  { id: '66-bouger-flemme', title: 'Comment bouger quand t\'as la flemme', template: 'comment-sans', tags: ['motivation','flemme'], slides: [
    { theme: 'hook_viral_homme', text: ['Comment bouger','quand t\'as','aucune envie.'] },
    { theme: 'gym', text: ['1. règle des 5 secondes','5-4-3-2-1, BOUGE.','avant que ton cerveau négocie.'] },
    { theme: 'gym', text: ['2. fais juste 5 min','un seuil ridicule.','une fois lancé, t\'enchaînes.'] },
    { theme: 'gym', text: ['3. mets ton préféré morceau','le son change tout.','3 min plus tard t\'es chaud.'] },
    { app: true, text: ['4. utilise ScrollUps','la flemme = ton ennemi #1.','le tel décide pour toi.','game over.'] },
    { theme: 'gym', text: ['5. accepte la version B','5 pompes au sol > 0.','toujours.'] },
  ]},

  // ════════ MINDSET / IDENTITÉ ════════

  { id: '67-confiance-en-soi', title: 'Comment construire une vraie confiance en toi', template: '5-a-eviter', tags: ['confiance','mindset'], slides: [
    { theme: 'hook_viral_homme', text: ['5 trucs qui construisent','une vraie confiance en soi.'] },
    { theme: 'gym', text: ['1. tiens tes promesses','envers toi-même.','la confiance = preuve.'] },
    { theme: 'gym', text: ['2. fais des trucs durs','volontairement.','le mental se forge dans la difficulté.'] },
    { theme: 'gym', text: ['3. arrête de chercher','la validation des autres.','viens chercher la tienne d\'abord.'] },
    { app: true, text: ['4. utilise ScrollUps','tenir un engagement quotidien','=  confiance massive.','jour après jour.'] },
    { theme: 'gym', text: ['5. progresse sur ton physique','le miroir te le dira.','fastest confidence boost.'] },
  ]},

  { id: '68-arreter-excuses', title: '5 excuses qui te bloquent depuis 5 ans', template: '5-a-eviter', tags: ['excuses','mindset'], slides: [
    { theme: 'hook_viral_homme', text: ['5 excuses qui te','bloquent depuis','5 ans.'] },
    { theme: 'hook_viral_homme', text: ['1. j\'ai pas le temps','t\'as 5h de scroll/jour.','tu mens.'] },
    { theme: 'gym', text: ['2. j\'ai pas l\'énergie','le sport CRÉE l\'énergie.','tu confonds.'] },
    { theme: 'gym', text: ['3. je commencerai lundi','y a jamais eu','un seul lundi.'] },
    { app: true, text: ['4. utilise ScrollUps','les excuses meurent','quand le tel décide','à ta place.'] },
    { theme: 'gym', text: ['5. c\'est trop tard','tu peux changer ton corps','en 90 jours. à 50 ans aussi.'] },
  ]},

  { id: '69-comparaison-tueur', title: 'Comment arrêter de te comparer aux autres', template: 'comment-sans', tags: ['comparaison','mindset'], slides: [
    { theme: 'hook_viral_homme', text: ['Comment arrêter','de te comparer','aux autres au sport.'] },
    { theme: 'hook_viral_homme', text: ['1. tu compares ton J1','à leur J1825.','jeu perdu d\'avance.'] },
    { theme: 'gym', text: ['2. unfollow les comptes toxiques','ceux qui te font sentir mal.','sans culpabiliser.'] },
    { theme: 'gym', text: ['3. compare-toi à toi','d\'il y a 3 mois.','la seule comparaison saine.'] },
    { app: true, text: ['4. utilise ScrollUps','moins de scroll','= moins de comparaison.','double bénéfice.'] },
    { theme: 'gym', text: ['5. progresse en silence','poste après 6 mois.','le résultat parle pour toi.'] },
  ]},

  { id: '70-mental-fort', title: 'Comment construire un mental de fer', template: 'voici-les-conseils', tags: ['mental','discipline'], slides: [
    { theme: 'hook_viral_homme', text: ['voici comment j\'ai','construit un mental de fer','(en 1 an).'] },
    { theme: 'gym', text: ['1. j\'ai fait des trucs durs','volontairement.','douche froide tous les jours.'] },
    { theme: 'gym', text: ['2. j\'ai tenu mes promesses','même les petites.','3 pompes/jour pendant 365 jours.'] },
    { theme: 'gym', text: ['3. j\'ai accepté l\'inconfort','sans le fuir.','le mental se construit là.'] },
    { app: true, text: ['4. j\'ai installé ScrollUps','tenir un engagement','tous les jours.','game changer mental.'] },
    { theme: 'gym', text: ['5. j\'ai arrêté de me plaindre','intérieurement et à voix haute.','victim mode = mental faible.'] },
  ]},

  // ════════ PRODUCTIVITÉ / FOCUS ════════

  { id: '71-productif-sport', title: 'Comment être plus productif grâce au sport', template: 'voici-les-conseils', tags: ['productivité','sport'], slides: [
    { theme: 'hook_viral_homme', text: ['voici comment le sport','m\'a rendu','3x plus productif.'] },
    { theme: 'gym', text: ['1. j\'ai du sport le matin','pompes + 5 min cardio.','le cerveau s\'allume.'] },
    { theme: 'gym', text: ['2. j\'ai eu plus d\'énergie','toute la journée.','plus de procrastination.'] },
    { theme: 'gym', text: ['3. j\'ai mieux dormi','sommeil profond +40%.','récup mentale optimale.'] },
    { app: true, text: ['4. j\'utilise ScrollUps','je perds plus d\'heures','sur Insta.','heures réinvesties dans le boulot.'] },
    { theme: 'gym', text: ['5. j\'ai gagné en confiance','tenir une routine difficile','rend tout le reste facile.'] },
  ]},

  { id: '72-focus-deep-work', title: 'Comment faire 4h de deep work par jour', template: 'comment-sans', tags: ['focus','productivité'], slides: [
    { theme: 'hook_viral_homme', text: ['Comment faire 4h','de deep work','tous les jours.'] },
    { theme: 'focus_desk', text: ['1. travaille avant de scroller','cerveau frais = focus max.','1ère heure = la meilleure.'] },
    { theme: 'focus_desk', text: ['2. blocs de 90 min','25 min trop courts.','90 min = état de flow.'] },
    { theme: 'focus_desk', text: ['3. tel hors de la pièce','vraiment.','dans une autre pièce.'] },
    { app: true, text: ['4. utilise ScrollUps','le tel bloqué pendant le deep work.','impossible de craquer.','focus garanti.'] },
    { theme: 'focus_desk', text: ['5. casque + musique sans paroles','déconnexion totale.','3h passent en 1h.'] },
  ]},

  { id: '73-arreter-distraction', title: '5 trucs pour arrêter de te distraire', template: '5-a-eviter', tags: ['distraction','focus'], slides: [
    { theme: 'hook_viral_homme', text: ['5 trucs pour arrêter','de te distraire','toutes les 5 min.'] },
    { theme: 'gym', text: ['1. désactive toutes les notifs','sauf appels et SMS.','le silence c\'est l\'or.'] },
    { theme: 'gym', text: ['2. mode avion 2h','quand tu bosses.','option nucléaire mais ça marche.'] },
    { theme: 'gym', text: ['3. blocks Instagram/TikTok','aux heures de boulot.','règle dans les paramètres.'] },
    { app: true, text: ['4. utilise ScrollUps','la distraction principale','c\'est le scroll.','traité à la racine.'] },
    { theme: 'gym', text: ['5. café + concentration','évite le multitâche.','une chose à la fois.'] },
  ]},

  // ════════ CHALLENGES TIME-BOUND ════════

  { id: '74-7-jours-changement', title: 'Voici ce qui change en 7 jours de discipline', template: 'voici-les-conseils', tags: ['challenge','7-days'], slides: [
    { theme: 'hook_viral_homme', text: ['voici ce qui change','en seulement 7 jours','de discipline.'] },
    { theme: 'gym', text: ['1. ton sommeil s\'améliore','dès la 3ème nuit.','tu kiffes le matin.'] },
    { theme: 'gym', text: ['2. ton énergie remonte','pic dès J5.','tu fais plus, mieux.'] },
    { theme: 'gym', text: ['3. ton mental change','tu te sens fier.','la fierté = drogue saine.'] },
    { app: true, text: ['4. j\'ai utilisé ScrollUps','dès J1.','tenu 7 jours sans skip.','la base de tout.'] },
    { theme: 'gym', text: ['5. tu veux pas redevenir','la version d\'avant.','7 jours suffisent.'] },
  ]},

  { id: '75-100-jours-discipline', title: 'Voici ce que j\'ai appris en 100 jours de discipline', template: 'voici-les-conseils', tags: ['challenge','100-days','testimonial'], slides: [
    { theme: 'hook_viral_homme', text: ['voici ce que j\'ai appris','en 100 jours','de discipline absolue.'] },
    { theme: 'gym', text: ['1. la motivation est inutile','elle n\'a duré que 4 jours.','le système m\'a tenu 100.'] },
    { theme: 'gym', text: ['2. les jours nazes','sont les plus importants.','tenir là = jeu changé.'] },
    { theme: 'gym', text: ['3. les résultats arrivent','semaine 4-6.','avant : tu sèmes.'] },
    { app: true, text: ['4. ScrollUps a tenu','quand ma volonté lâchait.','clé absolue.','sans, j\'aurais skippé.'] },
    { theme: 'gym', text: ['5. tu deviens quelqu\'un d\'autre','j\'me reconnais plus','dans la version d\'avant.'] },
  ]},

  { id: '76-30-jours-no-skip', title: '30 jours sans skip — ce qui se passe', template: 'punchlines', tags: ['challenge','30-days'], slides: [
    { theme: 'hook_viral_homme', text: ['30 jours de sport','sans skip.','voici ce qui se passe.'] },
    { theme: 'gym', text: ['semaine 1 : douleurs partout.'] },
    { theme: 'gym', text: ['semaine 2 : énergie insolente.'] },
    { theme: 'hook_viral_homme', text: ['semaine 3 : addiction au mouvement.'] },
    { theme: 'gym', text: ['semaine 4 : transformation visible.'] },
    { app: true, text: ['ScrollUps a permis','les 30 jours sans excuse.'] },
    { theme: 'gym', text: ['tu reviens jamais en arrière.'] },
  ]},

  { id: '77-90-jours-abdos', title: 'Comment voir tes abdos en 90 jours', template: '5-a-eviter', tags: ['abdos','90-days'], slides: [
    { theme: 'hook_viral_homme', text: ['5 étapes pour voir','tes abdos','en 90 jours.'] },
    { theme: 'nourriture', text: ['1. déficit calorique','-300/-500/jour.','non négociable.'] },
    { theme: 'nourriture', text: ['2. 2g protéines/kg','garde le muscle.','indispensable en sèche.'] },
    { theme: 'gym', text: ['3. soulève lourd','signal au corps : garde le muscle.','3-4x/semaine.'] },
    { app: true, text: ['4. utilise ScrollUps','90 jours sans craquer.','le scroll = craquage.','tel bloqué = sec.'] },
    { theme: 'gym', text: ['5. patience','les abdos visibles','arrivent dans les derniers 3kg.'] },
  ]},

  // ════════ SPÉCIFIQUE / DIVERS ════════

  { id: '78-supplements-eviter', title: '5 suppléments à éviter (waste of money)', template: '5-a-eviter', tags: ['supplements','nutrition'], slides: [
    { theme: 'hook_viral_homme', text: ['5 suppléments à ÉVITER','pour économiser','ton argent.'] },
    { theme: 'nourriture', text: ['1. les multi-vitamines','si tu manges varié.','100% inutile.'] },
    { theme: 'nourriture', text: ['2. les BCAA','si tu manges des protéines.','déjà dedans.'] },
    { theme: 'nourriture', text: ['3. les fat burners','aucune étude solide.','poubelle.'] },
    { app: true, text: ['4. utilise ScrollUps','pas un supplément.','mais 100x plus efficace.','et c\'est gratuit.'] },
    { theme: 'nourriture', text: ['5. les pre-workouts','caféine + sucre.','un café normal suffit.'] },
  ]},

  { id: '79-progresser-bench', title: 'Comment progresser en bench press', template: 'comment-sans', tags: ['bench','force'], slides: [
    { theme: 'hook_viral_homme', text: ['Comment progresser','en bench press','rapidement.'] },
    { theme: 'gym', text: ['1. focus sur 5x5','plus que 3x10.','la force vient des séries lourdes.'] },
    { theme: 'gym', text: ['2. travaille les triceps','close-grip + dips.','60% du push.'] },
    { theme: 'gym', text: ['3. pause à la poitrine','1 seconde minimum.','élimine le rebond.'] },
    { app: true, text: ['4. utilise ScrollUps','bench = régularité.','3x/sem 6 mois.','le tel garde le rythme.'] },
    { theme: 'gym', text: ['5. mange en surplus','+300 cal/jour.','la force c\'est aussi la nutrition.'] },
  ]},

  { id: '80-vie-meilleure-90j', title: 'Voici comment ma vie a changé en 90 jours', template: 'voici-les-conseils', tags: ['transformation','lifestyle'], slides: [
    { theme: 'hook_viral_homme', text: ['voici comment ma vie','a changé en 90 jours','de discipline.'] },
    { theme: 'gym', text: ['1. mon corps','12kg de muscle.','reconnaissance immédiate.'] },
    { theme: 'gym', text: ['2. mon énergie','3x plus de productivité.','je fais en 6h ce que je faisais en 12.'] },
    { theme: 'gym', text: ['3. mon mental','la confiance.','je négo plus avec moi-même.'] },
    { app: true, text: ['4. j\'utilise ScrollUps','c\'est l\'élément qui a','tout déclenché.','un système qui décide.'] },
    { theme: 'gym', text: ['5. mon entourage','les gens me regardent différemment.','le respect change tout.'] },
  ]},

  { id: '81-changer-vie-petits-pas', title: 'Comment changer ta vie en petits pas', template: 'comment-sans', tags: ['transformation','habitude'], slides: [
    { theme: 'hook_viral_homme', text: ['Comment changer','ta vie','(en petits pas).'] },
    { theme: 'gym', text: ['1. une seule habitude','par mois.','pas 5 d\'un coup.'] },
    { theme: 'gym', text: ['2. ridiculement petit','3 pompes/jour, pas 50.','trop petit pour échouer.'] },
    { theme: 'gym', text: ['3. progresse de 1%','par jour.','365 jours = +37x.'] },
    { app: true, text: ['4. utilise ScrollUps','le seul système','qui dure 365 jours.','sans volonté.'] },
    { theme: 'gym', text: ['5. mesure tout','case cochée = victoire.','la chaîne devient sacrée.'] },
  ]},

  { id: '82-priorites-reussir', title: '5 priorités pour réussir ta transformation', template: '5-a-eviter', tags: ['priorité','transformation'], slides: [
    { theme: 'hook_viral_homme', text: ['5 priorités','pour réussir','ta transformation.'] },
    { theme: 'gym', text: ['1. sommeil > tout','8h par nuit.','sans ça : zéro résultat.'] },
    { theme: 'nourriture', text: ['2. protéines élevées','2g/kg.','le bloc de construction.'] },
    { theme: 'gym', text: ['3. progression hebdo','+1kg ou +1 rep.','ou ça stagne.'] },
    { app: true, text: ['4. utilise ScrollUps','la priorité ABSOLUE.','la régularité fait 80%.','sans ça : abandon.'] },
    { theme: 'gym', text: ['5. patience','12 mois minimum.','les transformations se voient à 90j.'] },
  ]},

  { id: '83-3-piliers-physique', title: '3 piliers d\'un physique aesthétique', template: 'punchlines', tags: ['physique','vérité'], slides: [
    { theme: 'hook_viral_homme', text: ['3 piliers d\'un physique','aesthétique','(que personne respecte).'] },
    { theme: 'gym', text: ['progressive overload','obligatoire.'] },
    { theme: 'nourriture', text: ['surplus calorique modéré','+300, pas +1000.'] },
    { theme: 'gym', text: ['sommeil 8h','non négociable.'] },
    { app: true, text: ['ScrollUps','garde tout ça aligné.'] },
    { theme: 'gym', text: ['12 mois.','minimum.'] },
  ]},

  { id: '84-personne-discipliné', title: 'Tu deviens quelqu\'un de discipliné en 1 an', template: 'voici-les-conseils', tags: ['discipline','transformation'], slides: [
    { theme: 'hook_viral_homme', text: ['voici comment je suis','devenu quelqu\'un','de discipliné.'] },
    { theme: 'gym', text: ['1. j\'ai arrêté de me dire','demain.','aujourd\'hui ou jamais.'] },
    { theme: 'gym', text: ['2. j\'ai construit une routine','non négociable.','7j/7.'] },
    { theme: 'gym', text: ['3. j\'ai accepté l\'inconfort','comme un partenaire.','pas un ennemi.'] },
    { app: true, text: ['4. j\'ai installé ScrollUps','la dernière brique.','sans cette appli','j\'aurais cassé la chaîne.'] },
    { theme: 'gym', text: ['5. j\'ai arrêté','de me chercher des excuses.','c\'est devenu impossible.'] },
  ]},

  { id: '85-routine-quotidienne', title: 'La routine quotidienne d\'un mec discipliné', template: 'sec-ete', tags: ['routine','discipline'], slides: [
    { theme: 'hook_viral_homme', text: ['La routine quotidienne','d\'un mec discipliné'] },
    { theme: 'gym', text: ['1. 6h : réveil','sans snooze.','direct levé.'] },
    { theme: 'gym', text: ['2. 6h05 : eau + soleil','500ml + 5 min dehors.','reset circadien.'] },
    { theme: 'gym', text: ['3. 6h15 : pompes','minimum 20.','le corps s\'allume.'] },
    { app: true, text: ['4. ScrollUps : tel après','jamais avant les pompes.','règle absolue.'] },
    { theme: 'nourriture', text: ['5. 7h : petit-déj 30g protéines','œufs ou yaourt grec.','focus pour 5h.'] },
    { theme: 'focus_desk', text: ['6. 8h-12h : deep work','les meilleures heures.','protégées du scroll.'] },
    { theme: 'gym', text: ['7. 22h : sommeil','non négociable.','la discipline du soir.'] },
  ]},

  { id: '86-3-questions', title: '3 questions à te poser tous les matins', template: 'punchlines', tags: ['mindset','matin'], slides: [
    { theme: 'hook_viral_homme', text: ['3 questions à te poser','tous les matins.'] },
    { theme: 'gym', text: ['1. qu\'est-ce que je fais','de difficile aujourd\'hui ?'] },
    { theme: 'gym', text: ['2. comment je me lève','avant 7h demain ?'] },
    { theme: 'nourriture', text: ['3. ai-je tenu','mes promesses hier ?'] },
    { app: true, text: ['ScrollUps répond aux 3.','un seul outil.'] },
    { theme: 'gym', text: ['les disciplinés se posent','ces questions tous les jours.'] },
  ]},

  { id: '87-erreurs-2024', title: '5 erreurs que tu fais encore en 2026', template: '5-a-eviter', tags: ['mindset','erreurs'], slides: [
    { theme: 'hook_viral_homme', text: ['5 erreurs que tu fais','encore en 2026','(et qui te coûtent cher).'] },
    { theme: 'hook_viral_homme', text: ['1. tu attends la motivation','elle vient JAMAIS','avant l\'action.'] },
    { theme: 'gym', text: ['2. tu te fixes des objectifs','sans système.','résultat : 0.'] },
    { theme: 'gym', text: ['3. tu commences trop fort','tu craques en 2 semaines.','vise 1% / jour.'] },
    { app: true, text: ['4. tu n\'utilises pas ScrollUps','c\'est 2026.','le système qui décide','pour toi.'] },
    { theme: 'gym', text: ['5. tu te dis "demain"','ça fait 5 ans.','aujourd\'hui ou rien.'] },
  ]},

  { id: '88-ce-quil-faut', title: 'Ce qu\'il faut vraiment pour transformer ton corps', template: 'punchlines', tags: ['transformation','vérité'], slides: [
    { theme: 'hook_viral_homme', text: ['Ce qu\'il faut vraiment','pour transformer ton corps.'] },
    { theme: 'gym', text: ['pas de la motivation.','des systèmes.'] },
    { theme: 'nourriture', text: ['pas de régime extrême.','un déficit modéré.'] },
    { theme: 'gym', text: ['pas 5h/jour.','45 min régulières.'] },
    { app: true, text: ['ScrollUps','remplace ta volonté.'] },
    { theme: 'gym', text: ['12 mois de constance.','rien d\'autre.'] },
  ]},

  { id: '89-temps-pas-excuse', title: 'Tu as le temps. La preuve', template: 'punchlines', tags: ['excuses','temps'], slides: [
    { theme: 'hook_viral_homme', text: ['Tu as le temps.','la preuve.'] },
    { theme: 'gym', text: ['tu scrolles 5h47/jour.','en moyenne.'] },
    { theme: 'gym', text: ['ça fait 99 jours/an','volés à ta vie.'] },
    { theme: 'nourriture', text: ['10 min de pompes','c\'est 0.4% de ta journée.'] },
    { app: true, text: ['ScrollUps','transforme ce temps.'] },
    { theme: 'gym', text: ['arrête de mentir.','t\'as le temps.'] },
  ]},

  { id: '90-quand-commencer', title: 'Quand commencer ? La réponse honnête', template: 'punchlines', tags: ['mindset','action'], slides: [
    { theme: 'hook_viral_homme', text: ['Quand commencer ?','la réponse honnête.'] },
    { theme: 'gym', text: ['pas lundi.','pas le 1er du mois.'] },
    { theme: 'gym', text: ['pas après les vacances.','pas après la fête.'] },
    { theme: 'nourriture', text: ['MAINTENANT.','là, en lisant ça.'] },
    { app: true, text: ['ScrollUps installé en 2 min.','15 pompes en 90 sec.'] },
    { theme: 'gym', text: ['les disciplinés','commencent à des moments cons.'] },
  ]},

  { id: '91-resultats-3-semaines', title: 'Voici les résultats après 3 semaines', template: 'voici-les-conseils', tags: ['résultats','progression'], slides: [
    { theme: 'hook_viral_homme', text: ['voici mes résultats','après 3 semaines','de discipline.'] },
    { theme: 'gym', text: ['1. -2.5kg de gras','sans suivre de régime.','juste du sport quotidien.'] },
    { theme: 'gym', text: ['2. +5cm aux bras','la prise de masse débute','dès la semaine 2.'] },
    { theme: 'hook_viral_homme', text: ['3. mon visage','plus défini.','signe de baisse de gras.'] },
    { app: true, text: ['4. j\'utilise ScrollUps','21 jours sans rater.','impossible avant.','game changer.'] },
    { theme: 'gym', text: ['5. mon mental','la confiance d\'avoir tenu.','c\'est ce qui me pousse maintenant.'] },
  ]},

  { id: '92-3-mois-vs-3-ans', title: '3 mois de discipline vs 3 ans à essayer', template: 'punchlines', tags: ['discipline','vérité'], slides: [
    { theme: 'hook_viral_homme', text: ['3 mois de discipline','battent 3 ans à essayer.'] },
    { theme: 'gym', text: ['quand t\'es discipliné,','3 mois suffisent.'] },
    { theme: 'gym', text: ['quand t\'essaies,','3 ans donnent rien.'] },
    { theme: 'nourriture', text: ['la différence ?','un système qui tient.'] },
    { app: true, text: ['ScrollUps fait','la différence.'] },
    { theme: 'gym', text: ['arrête d\'essayer.','installe.'] },
  ]},

  { id: '93-sport-vs-régime', title: 'Sport ou régime — qui gagne ?', template: 'punchlines', tags: ['nutrition','sport'], slides: [
    { theme: 'hook_viral_homme', text: ['Sport ou régime ?','la vraie réponse.'] },
    { theme: 'nourriture', text: ['perdre du gras','c\'est 80% nutrition.'] },
    { theme: 'gym', text: ['prendre du muscle','c\'est 50/50.'] },
    { theme: 'gym', text: ['sans sport,','la perte = muscle aussi.'] },
    { app: true, text: ['ScrollUps','garde les deux alignés.'] },
    { theme: 'gym', text: ['les deux.','toujours.'] },
  ]},

  { id: '94-arreter-binge-eating', title: 'Comment arrêter de craquer le soir', template: 'comment-sans', tags: ['nutrition','craquage'], slides: [
    { theme: 'hook_viral_homme', text: ['Comment arrêter','de craquer le soir','(devant Netflix).'] },
    { theme: 'nourriture', text: ['1. mange assez le jour','craquages = déficit le jour.','vise 80% des cal avant 18h.'] },
    { theme: 'nourriture', text: ['2. protéines au dîner','30g+ = satiété.','le corps arrête de demander.'] },
    { theme: 'gym', text: ['3. brossage de dents tôt','21h.','frein psychologique massif.'] },
    { app: true, text: ['4. utilise ScrollUps','Netflix + scroll = craquage.','tel bloqué le soir.','game over.'] },
    { theme: 'gym', text: ['5. couche-toi','tu mangeras pas','si tu dors.'] },
  ]},

  { id: '95-corps-rêve', title: 'Comment construire le corps dont tu rêves', template: 'sec-ete', tags: ['transformation','physique'], slides: [
    { theme: 'hook_viral_homme', text: ['Comment construire','le corps dont tu rêves'] },
    { theme: 'gym', text: ['1. choisis 1 photo référence','pas 10.','un seul objectif visuel.'] },
    { theme: 'gym', text: ['2. backward planning','part du résultat.','décompose étape par étape.'] },
    { theme: 'nourriture', text: ['3. 3-4 séances/semaine','pas 6.','récup obligatoire.'] },
    { app: true, text: ['4. utilise ScrollUps','le rêve s\'écrit','jour après jour.','pas en 3 mois.'] },
    { theme: 'nourriture', text: ['5. tracke tes calories','sans ça :','tu navigues à l\'aveugle.'] },
    { theme: 'gym', text: ['6. progresse en force','+1kg ou +1 rep.','chaque semaine.'] },
    { theme: 'gym', text: ['7. patience absolue','12 mois minimum.','les pros mettent 5 ans.'] },
  ]},

  { id: '96-sommeil-base', title: 'Le sommeil c\'est la BASE', template: 'punchlines', tags: ['sommeil','récup'], slides: [
    { theme: 'hook_viral_homme', text: ['Le sommeil c\'est la BASE.','et personne le respecte.'] },
    { theme: 'gym', text: ['8h par nuit minimum.','non négociable.'] },
    { theme: 'gym', text: ['mauvais sommeil','= stockage de gras.'] },
    { theme: 'nourriture', text: ['+ envie de sucre','+ baisse de testo.'] },
    { app: true, text: ['ScrollUps','protège ton sommeil.'] },
    { theme: 'gym', text: ['couche-toi à 22h.','sans débat.'] },
  ]},

  { id: '97-marche-magic', title: 'Pourquoi marcher 10k pas/jour change tout', template: 'voici-les-conseils', tags: ['marche','cardio'], slides: [
    { theme: 'hook_viral_homme', text: ['voici pourquoi marcher','10k pas/jour','change ta vie.'] },
    { theme: 'nature_outdoor', text: ['1. brûle 400-600 cal','sans effort perçu.','le meilleur fat burner.'] },
    { theme: 'nature_outdoor', text: ['2. récupération active','décongestionne les muscles.','meilleur que le repos total.'] },
    { theme: 'gym', text: ['3. mental clair','la marche = méditation.','idées qui débloquent.'] },
    { app: true, text: ['4. j\'utilise ScrollUps','je marche au lieu','de scroller.','double bénéfice.'] },
    { theme: 'nature_outdoor', text: ['5. zéro coût','zéro équipement.','la magie.'] },
  ]},

  { id: '98-dont-give-up', title: 'À l\'instant où tu veux abandonner...', template: 'punchlines', tags: ['mindset','motivation'], slides: [
    { theme: 'hook_viral_homme', text: ['À l\'instant','où tu veux abandonner.'] },
    { theme: 'gym', text: ['c\'est exactement le moment','où ça commence à payer.'] },
    { theme: 'gym', text: ['les gens qui ont réussi','ont voulu abandonner.'] },
    { theme: 'nourriture', text: ['ils ont tenu','un jour de plus.'] },
    { app: true, text: ['ScrollUps tient','quand toi tu lâches.'] },
    { theme: 'gym', text: ['un jour de plus.','toujours.'] },
  ]},

  { id: '99-discipline-equals-liberty', title: 'La discipline = la liberté', template: 'punchlines', tags: ['discipline','mindset'], slides: [
    { theme: 'hook_viral_homme', text: ['La discipline','c\'est la liberté.'] },
    { theme: 'gym', text: ['les indisciplinés','sont esclaves de leur humeur.'] },
    { theme: 'gym', text: ['les disciplinés','sont libres de leurs choix.'] },
    { theme: 'nourriture', text: ['la discipline','c\'est un cadeau à toi-même.'] },
    { app: true, text: ['ScrollUps','t\'offre cette liberté.'] },
    { theme: 'gym', text: ['pas une contrainte.','un cheat code.'] },
  ]},

  { id: '100-tu-vas-loin', title: 'Tu vas plus loin que tu crois', template: 'punchlines', tags: ['mindset','motivation'], slides: [
    { theme: 'hook_viral_homme', text: ['Tu vas plus loin','que tu crois.'] },
    { theme: 'gym', text: ['tu peux faire 10x plus','que ce que tu penses.'] },
    { theme: 'gym', text: ['ton cerveau dit stop','à 40% de tes capacités.'] },
    { theme: 'nourriture', text: ['les 60% restants','sont mentaux.'] },
    { app: true, text: ['ScrollUps','débloque les 60% cachés.'] },
    { theme: 'gym', text: ['pousse plus loin.','chaque jour.'] },
  ]},

]

// =====================================================================
// BUILD
// =====================================================================

let written = 0
for (const entry of ENTRIES) {
  const config = buildConfig(entry)
  const path = join(OUT, `${entry.id}.json`)
  writeFileSync(path, JSON.stringify(config, null, 2))
  written++
}

console.log(`✅ ${written} scripts générés dans scripts/`)
