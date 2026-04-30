// Rebuilds a fresh script/template bank from the winning example patterns.
// Usage: node src/build-bank.mjs

import { rmSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CONTENT = join(ROOT, 'content')
const SCRIPTS = join(CONTENT, 'scripts')
const TEMPLATES = join(CONTENT, 'templates')
const CONFIGS = join(CONTENT, 'configs')

const defaults = {
  fontFamily: 'Montserrat, sans-serif',
  color: '#ffffff',
  align: 'center',
}

function cleanDir(dir) {
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
}

function line(text, size, y, weight = 'bold') {
  return { text, size, weight, y, stroke: true, strokeWidth: 7, shadowBlur: 10 }
}

function slide({ theme = 'gym', imagePath, overlay = 0.08, lines }) {
  return {
    ...(imagePath ? { imagePath } : { imageTheme: theme }),
    overlay,
    lines,
  }
}

function hookBottom(text) {
  return slide({
    theme: 'hook_viral_homme',
    overlay: 0.05,
    lines: text.map((t, i) => line(t, i === text.length - 1 ? 64 : 58, 1085 + i * 76)),
  })
}

function hookTop(text) {
  return slide({
    theme: 'hook_viral_homme',
    overlay: 0.06,
    lines: text.map((t, i) => line(t, 56, 360 + i * 72)),
  })
}

function point(theme, title, body, index, y = 455) {
  return slide({
    theme,
    overlay: theme === 'nourriture' ? 0.18 : 0.12,
    lines: [
      line(`${index}. ${title}`, 52, y),
      ...body.map((t, i) => line(t, 38, y + 150 + i * 58, 'bold')),
    ],
  })
}

function punch(theme, text, y = 420) {
  return slide({
    theme,
    overlay: 0.12,
    lines: text.map((t, i) => line(t, 54, y + i * 72)),
  })
}

function appSlide(text) {
  return slide({
    imagePath: './app_screenshots/scrollups.jpg',
    overlay: 0,
    lines: text.map((t, i) => line(t, i === 0 ? 58 : 36, 170 + i * 62)),
  })
}

function scrollupsCta(context = 'default') {
  const variants = {
    default: ['4. ScrollUps', 'l’app bloque tes réseaux', 'jusqu’à ton effort du jour'],
    template: ['4. ScrollUps', 'bloque tes réseaux', 'tant que l’action n’est pas faite'],
    transformation: ['4. ScrollUps', 'tes réseaux restent bloqués', 'jusqu’à tes pompes du jour'],
    muscle: ['5. ScrollUps', 'tes réseaux se débloquent', 'après ton effort muscu'],
    sec: ['4. ScrollUps', 'bloque TikTok et Insta', 'jusqu’à ton sport du jour'],
    nutrition: ['4. ScrollUps', 'moins de scroll impulsif', 'plus d’actions qui comptent'],
    routine: ['4. ScrollUps', 'tu fais l’effort d’abord', 'les réseaux après'],
    focus: ['4. ScrollUps', 'bloque les réseaux', 'tant que tu n’as pas bougé'],
    discipline: ['4. ScrollUps', 'plus de débat mental', 'sport fait = réseaux ouverts'],
    sommeil: ['4. ScrollUps', 'réseaux bloqués', 'tant que l’effort n’est pas fait'],
    reprise: ['4. ScrollUps', 'même 5 minutes comptent', 'avant de rouvrir tes réseaux'],
    cardio: ['4. ScrollUps', 'marche ou cardio d’abord', 'réseaux ensuite'],
    mental: ['4. ScrollUps', 'tu gagnes ta case sport', 'avant de scroller'],
  }
  return appSlide(variants[context] || variants.default)
}

function config(title, templateId, tags, slides) {
  return { _meta: { title, template_id: templateId, tags }, defaults, slides }
}

const templates = {
  'ete-transformation': config('Template - été transformation', 'ete-transformation', ['template'], [
    hookBottom(['si tu commences maintenant', 'tu peux obtenir', '[RÉSULTAT] cet été']),
    point('nourriture', '[action simple]', ['[bénéfice direct]', '[phrase qui claque]'], 1),
    point('gym', '[action entraînement]', ['[détail court]', '[pas de blabla]'], 2),
    point('nature_outdoor', '[action quotidienne]', ['[objectif chiffré]', '[facile à tenir]'], 3),
    scrollupsCta('template'),
    punch('gym', ['dans 90 jours', 'tu remercieras ton toi', 'd’aujourd’hui']),
  ]),
  'verite-qui-pique': config('Template - vérité qui pique', 'verite-qui-pique', ['template'], [
    hookTop(['tu verras de vrais progrès', 'quand tu auras compris ça']),
    punch('gym', ['[vérité brutale courte]']),
    punch('nourriture', ['[vérité nutrition courte]']),
    punch('gym', ['[vérité discipline courte]']),
    scrollupsCta('discipline'),
    punch('hook_viral_homme', ['arrête de chercher un hack', 'construis ton système']),
  ]),
  'arrete-de-faire': config('Template - arrête de faire ça', 'arrete-de-faire', ['template'], [
    hookBottom(['arrête de faire ça', 'si tu veux vraiment', '[RÉSULTAT]']),
    point('gym', '[erreur 1]', ['[correction simple]'], 1),
    point('nourriture', '[erreur 2]', ['[correction simple]'], 2),
    point('gym', '[erreur 3]', ['[correction simple]'], 3),
    scrollupsCta('template'),
    punch('hook_viral_homme', ['le problème, ce n’est pas ton potentiel', 'c’est ton système']),
  ]),
  'routine-90j': config('Template - routine 90 jours', 'routine-90j', ['template'], [
    hookBottom(['fais ça 90 jours', 'et ton corps changera']),
    point('gym', '[routine matin]', ['[durée]', '[objectif]'], 1),
    point('nourriture', '[repas pilier]', ['[règle simple]', '[à répéter]'], 2),
    point('nature_outdoor', '[habitude basse friction]', ['[chiffre]', '[tous les jours]'], 3),
    scrollupsCta('routine'),
    punch('gym', ['simple', 'pas facile', 'mais ça marche']),
  ]),
  'liste-punchy': config('Template - liste punchy', 'liste-punchy', ['template'], [
    hookTop(['5 trucs que tu dois', 'comprendre maintenant']),
    point('gym', '[point 1]', ['[explication courte]'], 1, 380),
    point('nourriture', '[point 2]', ['[explication courte]'], 2, 380),
    point('gym', '[point 3]', ['[explication courte]'], 3, 380),
    point('nature_outdoor', '[point 4]', ['[explication courte]'], 4, 380),
    scrollupsCta('discipline'),
  ]),
}

const topics = [
  ['01-meconnaissable-ete', 'Devenir méconnaissable cet été', 'ete-transformation', ['ete', 'transformation'],
    hookBottom(['si tu commences maintenant', 'tu peux être méconnaissable', 'cet été']),
    point('nourriture', 'protéines à chaque repas', ['tu gardes ton muscle', 'pendant que tu sèches'], 1),
    point('gym', '3 séances lourdes', ['pas besoin de vivre à la salle', 'besoin de ne pas skip'], 2),
    point('nature_outdoor', '10k pas par jour', ['c’est discret', 'mais ça change tout'], 3),
    scrollupsCta('transformation'),
    punch('gym', ['dans 90 jours', 'tu seras content', 'd’avoir commencé maintenant'])],
  ['02-vrais-progres', 'Tu verras de vrais progrès', 'verite-qui-pique', ['muscle', 'discipline'],
    hookTop(['tu verras de vrais progrès', 'quand tu auras compris ça']),
    punch('gym', ['tu n’as pas besoin', 'd’un nouveau programme']),
    punch('nourriture', ['tu as besoin', 'de manger pareil', 'assez longtemps']),
    punch('gym', ['une séance moyenne faite', 'bat une séance parfaite skippée']),
    scrollupsCta('discipline'),
    punch('hook_viral_homme', ['la discipline,', 'c’est ton environnement', 'pas ton humeur'])],
  ['03-arrete-scroll-matin', 'Arrêter le scroll du matin', 'arrete-de-faire', ['focus', 'routine'],
    hookBottom(['arrête de scroller', 'dès le réveil si tu veux', 'changer ton corps']),
    point('gym', 'tu casses ton énergie', ['commence par 20 pompes', 'pas par 20 vidéos'], 1),
    point('nourriture', 'tu rates ton petit-déj', ['prépare la veille', 'protéines en premier'], 2),
    point('nature_outdoor', 'tu perds ta clarté', ['10 min dehors', 'avant les notifications'], 3),
    scrollupsCta('focus'),
    punch('hook_viral_homme', ['contrôle ton matin', 'ou ton tel le fera'])],
  ['04-sec-sans-faim', 'Sécher sans avoir faim', 'routine-90j', ['sec', 'nutrition'],
    hookBottom(['tu peux sécher', 'sans avoir faim', 'toute la journée']),
    point('nourriture', 'volume alimentaire', ['légumes, soupes, fruits', 'ton estomac doit être plein'], 1),
    point('nourriture', '40g de protéines au petit-déj', ['moins de cravings', 'jusqu’à midi'], 2),
    point('nature_outdoor', 'marche après les repas', ['10 minutes', 'glycémie plus stable'], 3),
    scrollupsCta('sec'),
    punch('nourriture', ['la faim se gère', 'avant qu’elle arrive'])],
  ['05-prise-muscle-simple', 'Prise de muscle simple', 'liste-punchy', ['muscle'],
    hookTop(['si tu veux prendre du muscle', 'garde ça simple']),
    point('gym', 'progressive overload', ['une rep de plus', 'ou un kilo de plus'], 1, 380),
    point('nourriture', 'surplus léger', ['pas besoin de devenir gras', '+250 cal suffit'], 2, 380),
    point('gym', 'même programme 12 semaines', ['arrête de changer', 'avant de progresser'], 3, 380),
    point('nourriture', 'sommeil avant suppléments', ['8h bat tous les boosters'], 4, 380),
    scrollupsCta('muscle')],
  ['06-discipline-pas-motivation', 'Discipline, pas motivation', 'verite-qui-pique', ['discipline'],
    hookTop(['la motivation est morte', 'construis ça à la place']),
    punch('gym', ['prépare tes affaires', 'quand tu es lucide']),
    punch('nourriture', ['prépare ton repas', 'avant d’avoir faim']),
    punch('gym', ['baisse le minimum', 'mais fais-le tous les jours']),
    scrollupsCta('discipline'),
    punch('hook_viral_homme', ['la discipline,', 'c’est une friction bien placée'])],
  ['07-abdos-realistes', 'Abdos réalistes', 'arrete-de-faire', ['abdos', 'sec'],
    hookBottom(['arrête de faire 100 crunchs', 'si tu veux voir tes abdos']),
    point('nourriture', 'déficit calorique', ['les abdos sortent', 'quand le gras descend'], 1),
    point('gym', 'garde la muscu', ['sinon tu deviens juste plat'], 2),
    point('nature_outdoor', 'marche tous les jours', ['c’est le cardio', 'que tu peux tenir'], 3),
    scrollupsCta('sec'),
    punch('hook_viral_homme', ['les abdos,', 'c’est une routine', 'pas un exercice magique'])],
  ['08-corps-dans-90j', 'Corps dans 90 jours', 'routine-90j', ['transformation'],
    hookBottom(['fais ça 90 jours', 'et les gens vont demander', 'ce que tu as changé']),
    point('gym', 'full body 3 fois', ['mêmes jours', 'même heure'], 1),
    point('nourriture', 'assiette répétable', ['protéines, féculent, légumes', 'aucune décision inutile'], 2),
    point('nature_outdoor', '30 min de marche', ['podcast ou silence', 'mais tous les jours'], 3),
    scrollupsCta('routine'),
    punch('gym', ['la transformation', 'vient des jours ordinaires'])],
  ['09-erreurs-debutant', 'Erreurs débutant muscu', 'arrete-de-faire', ['debutant', 'muscle'],
    hookBottom(['3 erreurs de débutant', 'qui ralentissent', 'ton physique']),
    point('gym', 'ego lifting', ['si la forme est moche', 'la série est ratée'], 1),
    point('nourriture', 'pas assez manger', ['tu veux du muscle', 'mais tu manges comme en sèche'], 2),
    point('gym', 'zéro suivi', ['note tes charges', 'ou tu tournes en rond'], 3),
    scrollupsCta('muscle'),
    punch('hook_viral_homme', ['débutant,', 'tu gagnes vite', 'si tu restes simple'])],
  ['10-summer-cut', 'Summer cut', 'ete-transformation', ['ete', 'sec'],
    hookBottom(['avant juillet', 'tu peux être plus sec', 'sans te détruire']),
    point('nourriture', 'boissons zéro calories', ['alcool et soda', 'te sabotent vite'], 1),
    point('gym', 'charges lourdes', ['ton corps garde', 'ce qu’il utilise'], 2),
    point('nature_outdoor', 'pas quotidiens', ['augmente avant', 'de couper plus bas'], 3),
    scrollupsCta('sec'),
    punch('gym', ['ne cherche pas l’extrême', 'cherche le tenable'])],
]

const extraScripts = [
  {
    id: '11-plus-d-energie',
    title: 'Plus d’énergie',
    tags: ['energie'],
    cta: 'routine',
    hook: ['si tu es vidé à 15h', 'ce n’est pas normal'],
    points: [
      ['nature_outdoor', '10 min dehors le matin', ['lumière dans les yeux', 'cerveau réveillé']],
      ['nourriture', 'protéines au premier repas', ['moins de crash', 'moins d’envies sucrées']],
      ['gym', '20 min de mouvement', ['pas besoin d’être héroïque', 'juste de transpirer un peu']],
    ],
    final: ['ton énergie revient', 'quand tes journées arrêtent', 'de commencer par le scroll'],
  },
  {
    id: '12-physique-large',
    title: 'Physique plus large',
    tags: ['dos'],
    cta: 'muscle',
    hook: ['tu veux paraître plus large ?', 'travaille ça en priorité'],
    points: [
      ['gym', 'tractions ou tirage vertical', ['c’est la base du V', 'pas négociable']],
      ['gym', 'rowing lourd', ['épaisseur du dos', 'posture plus solide']],
      ['nourriture', 'protéines régulières', ['sinon tu récupères mal', 'et tu stagnes']],
    ],
    final: ['un dos large', 'change tout ton physique', 'même habillé'],
  },
  {
    id: '13-stop-excuses',
    title: 'Arrêter tes excuses',
    tags: ['discipline'],
    cta: 'discipline',
    hook: ['tu n’as pas trop peu de temps', 'tu as trop peu de friction'],
    points: [
      ['gym', 'minimum ridicule', ['5 minutes comptent', 'zéro minute ne compte pas']],
      ['nourriture', 'repas prêt avant la faim', ['tu décides mieux', 'quand tu n’es pas affamé']],
      ['nature_outdoor', 'marche sans négocier', ['même les mauvais jours', 'surtout les mauvais jours']],
    ],
    final: ['les excuses disparaissent', 'quand l’action devient', 'plus simple que le skip'],
  },
  {
    id: '14-reprendre-sport',
    title: 'Reprendre le sport',
    tags: ['reprise'],
    cta: 'reprise',
    hook: ['si tu reprends le sport', 'ne fais surtout pas ça'],
    points: [
      ['gym', 'ne repars pas trop fort', ['courbatures énormes', 'motivation morte']],
      ['gym', '3 séances courtes', ['tu reconstruis l’identité', 'avant le physique']],
      ['nature_outdoor', 'marche quotidienne', ['ça remet le corps en route', 'sans te cramer']],
    ],
    final: ['la reprise réussie', 'c’est celle que tu peux', 'refaire la semaine prochaine'],
  },
  {
    id: '15-matin-productif',
    title: 'Matin productif',
    tags: ['routine'],
    cta: 'routine',
    hook: ['ton matin décide', 'du reste de ta journée'],
    points: [
      ['nature_outdoor', 'lumière avant écran', ['ton cerveau comprend', 'que la journée commence']],
      ['nourriture', 'petit-déj solide', ['protéines', 'pas juste du sucre']],
      ['gym', 'effort rapide', ['pompes, marche, mobilité', 'mais quelque chose']],
    ],
    final: ['tu ne gagnes pas ta journée', 'à midi', 'tu la gagnes au réveil'],
  },
  {
    id: '16-perdre-gras',
    title: 'Perdre du gras',
    tags: ['sec'],
    cta: 'sec',
    hook: ['tu ne perds pas de gras', 'parce que tu compliques tout'],
    points: [
      ['nourriture', 'déficit léger', ['pas une punition', 'juste un léger manque']],
      ['nature_outdoor', 'pas après chaque repas', ['digestion meilleure', 'calories brûlées sans y penser']],
      ['gym', 'muscu lourde', ['ton corps garde', 'ce qu’il utilise']],
    ],
    final: ['la sèche qui marche', 'est rarement spectaculaire', 'elle est répétable'],
  },
  {
    id: '17-gagner-confiance',
    title: 'Gagner confiance',
    tags: ['mental'],
    cta: 'mental',
    hook: ['la confiance ne tombe pas du ciel', 'elle se prouve'],
    points: [
      ['gym', 'tiens une promesse physique', ['même petite', 'mais tous les jours']],
      ['nourriture', 'mange comme quelqu’un de sérieux', ['pas parfait', 'juste cohérent']],
      ['nature_outdoor', 'arrête de te comparer', ['compare tes semaines', 'pas ton corps aux autres']],
    ],
    final: ['la confiance arrive', 'quand tu te vois', 'tenir parole'],
  },
  {
    id: '18-tenir-une-habitude',
    title: 'Tenir une habitude',
    tags: ['habitude'],
    cta: 'routine',
    hook: ['si tu lâches toujours au bout de 10 jours', 'lis ça'],
    points: [
      ['gym', 'version 5 minutes', ['elle sauve les mauvais jours', 'et garde la chaîne vivante']],
      ['nature_outdoor', 'même heure', ['moins de décision', 'plus d’automatisme']],
      ['nourriture', 'récompense après action', ['pas avant', 'sinon ton cerveau gagne']],
    ],
    final: ['une habitude solide', 'ne dépend pas', 'd’une bonne journée'],
  },
  {
    id: '19-sommeil-propre',
    title: 'Sommeil propre',
    tags: ['sommeil'],
    cta: 'sommeil',
    hook: ['tu veux progresser ?', 'commence par dormir mieux'],
    points: [
      ['nourriture', 'café avant 14h', ['sinon tu paies la facture', 'le soir']],
      ['nature_outdoor', 'marche le jour', ['corps fatigué', 'cerveau plus calme']],
      ['gym', 'tel loin du lit', ['pas de scroll', 'pas de négociation']],
    ],
    final: ['ton corps change', 'pendant que tu dors', 'pas pendant que tu scrolles'],
  },
  {
    id: '20-mental-fort',
    title: 'Mental plus fort',
    tags: ['mental'],
    cta: 'mental',
    hook: ['un mental fort', 'ça se construit dans le banal'],
    points: [
      ['gym', 'effort quotidien', ['court ou long', 'mais réel']],
      ['nature_outdoor', 'inconfort volontaire', ['marche froide, côte, pluie', 'un peu dur chaque jour']],
      ['nourriture', 'moins de dopamine facile', ['moins de sucre', 'moins de scroll']],
    ],
    final: ['tu deviens solide', 'quand tu arrêtes', 'de tout rendre confortable'],
  },
  {
    id: '21-pecs',
    title: 'Pecs plus visibles',
    tags: ['pectoraux'],
    cta: 'muscle',
    hook: ['tes pecs ne ressortent pas ?', 'voilà pourquoi'],
    points: [
      ['gym', 'développé contrôlé', ['descente lente', 'amplitude propre']],
      ['gym', 'progression notée', ['si tu ne notes rien', 'tu devines']],
      ['nourriture', 'surplus propre', ['assez pour construire', 'pas assez pour t’alourdir']],
    ],
    final: ['les pecs visibles', 'c’est de la tension', 'répétée longtemps'],
  },
  {
    id: '22-bras',
    title: 'Bras plus gros',
    tags: ['bras'],
    cta: 'muscle',
    hook: ['si tes bras ne grossissent pas', 'arrête de faire au hasard'],
    points: [
      ['gym', 'tractions + dips', ['base lourde', 'avant les détails']],
      ['gym', 'curls propres', ['pas d’élan', 'pas d’ego']],
      ['nourriture', 'mange assez', ['des bras plus gros', 'ont besoin de matière']],
    ],
    final: ['les bras répondent', 'quand le volume monte', 'sans tricher'],
  },
  {
    id: '23-jambes',
    title: 'Jambes solides',
    tags: ['jambes'],
    cta: 'muscle',
    hook: ['tu veux un vrai physique ?', 'arrête de cacher tes jambes'],
    points: [
      ['gym', 'squat ou presse', ['lourd mais propre', 'chaque semaine']],
      ['gym', 'fentes', ['ça brûle', 'donc ça marche']],
      ['nature_outdoor', 'pas quotidiens', ['récupération active', 'meilleure endurance']],
    ],
    final: ['des jambes solides', 'se voient dans ta posture', 'pas seulement en short'],
  },
  {
    id: '24-cardio',
    title: 'Cardio qui monte',
    tags: ['cardio'],
    cta: 'cardio',
    hook: ['tu es essoufflé trop vite ?', 'fais ça 3 semaines'],
    points: [
      ['nature_outdoor', 'zone 2', ['tu dois pouvoir parler', 'mais pas chanter']],
      ['gym', 'intervalles courts', ['une fois par semaine', 'pas tous les jours']],
      ['nourriture', 'hydratation simple', ['eau + sel si besoin', 'pas de boisson magique']],
    ],
    final: ['le cardio monte', 'quand tu arrêtes', 'de le traiter en punition'],
  },
  {
    id: '25-vie-moins-floue',
    title: 'Vie moins floue',
    tags: ['focus'],
    cta: 'focus',
    hook: ['si ta vie part dans tous les sens', 'commence ici'],
    points: [
      ['nature_outdoor', 'matin sans scroll', ['tu récupères ton attention', 'avant de la vendre']],
      ['gym', 'sport avant dopamine', ['effort d’abord', 'récompense après']],
      ['nourriture', 'objectifs écrits', ['3 lignes', 'pas un roman']],
    ],
    final: ['ta vie devient claire', 'quand tes journées', 'ont un ordre'],
  },
  {
    id: '26-dos-en-v',
    title: 'Dos en V',
    tags: ['dos'],
    cta: 'muscle',
    hook: ['le dos en V', 'vient de ces 3 détails'],
    points: [
      ['gym', 'tirage vertical', ['coude vers la hanche', 'pas juste tirer avec les bras']],
      ['gym', 'rowing lourd', ['épaisseur', 'posture', 'densité']],
      ['nourriture', 'taille plus sèche', ['le V ressort', 'quand le gras descend']],
    ],
    final: ['large en haut', 'sec au milieu', 'c’est ça le V'],
  },
  {
    id: '27-epaules',
    title: 'Épaules rondes',
    tags: ['epaules'],
    cta: 'muscle',
    hook: ['des épaules rondes', 'changent tout ton haut du corps'],
    points: [
      ['gym', 'développé militaire', ['force de base', 'progression lente']],
      ['gym', 'élévations latérales', ['léger, propre', 'beaucoup de contrôle']],
      ['nourriture', 'récupération', ['les épaules prennent cher', 'dors vraiment']],
    ],
    final: ['les épaules', 'donnent la carrure', 'même sans être énorme'],
  },
  {
    id: '28-zero-skip',
    title: 'Zéro skip pendant 30 jours',
    tags: ['discipline'],
    cta: 'discipline',
    hook: ['30 jours sans skip', 'ça commence comme ça'],
    points: [
      ['gym', 'séance minimum', ['10 pompes comptent', 'si ça sauve la chaîne']],
      ['nature_outdoor', 'alarme fixe', ['même heure', 'moins de débat']],
      ['nourriture', 'prépare le contexte', ['tenue visible', 'eau prête']],
    ],
    final: ['zéro skip', 'ce n’est pas du courage', 'c’est un système'],
  },
  {
    id: '29-manger-propre',
    title: 'Manger propre sans craquer',
    tags: ['nutrition'],
    cta: 'nutrition',
    hook: ['manger propre', 'ne doit pas te rendre triste'],
    points: [
      ['nourriture', 'repas répétables', ['2 ou 3 bases', 'que tu aimes vraiment']],
      ['nourriture', 'snack protéiné', ['prévu avant la faim', 'sinon tu improvises mal']],
      ['nature_outdoor', 'courses simples', ['moins de choix', 'moins de craquage']],
    ],
    final: ['tu tiens mieux', 'quand ton plan ressemble', 'à ta vraie vie'],
  },
  {
    id: '30-finir-journee-fier',
    title: 'Finir tes journées fier',
    tags: ['mental'],
    cta: 'mental',
    hook: ['tu veux finir ta journée fier ?', 'gagne ces 3 cases'],
    points: [
      ['gym', '1 effort physique', ['court mais réel', 'transpire un peu']],
      ['nourriture', '1 repas solide', ['protéines', 'pas n’importe quoi']],
      ['nature_outdoor', '1 distraction en moins', ['moins de scroll', 'plus de contrôle']],
    ],
    final: ['une bonne journée', 'n’a pas besoin d’être parfaite', 'elle doit être gagnée'],
  },
  {
    id: '31-physique-plage',
    title: 'Physique de plage',
    tags: ['ete'],
    cta: 'sec',
    hook: ['si tu veux être mieux cet été', 'ne pars pas dans tous les sens'],
    points: [
      ['gym', 'haut du corps 3x', ['dos, pecs, épaules', 'simple et visible']],
      ['nourriture', 'déficit léger', ['tu sèches', 'sans devenir invivable']],
      ['nature_outdoor', 'marche quotidienne', ['ça fait la différence', 'sans casser la récup']],
    ],
    final: ['le physique de plage', 'c’est surtout', 'moins de gras + plus de carrure'],
  },
  {
    id: '32-plus-de-force',
    title: 'Plus de force',
    tags: ['force'],
    cta: 'muscle',
    hook: ['tu veux devenir plus fort ?', 'arrête de t’épuiser pour rien'],
    points: [
      ['gym', 'séries courtes', ['3 à 6 reps', 'qualité maximale']],
      ['gym', 'repos long', ['2 à 4 minutes', 'pas 30 secondes']],
      ['nourriture', 'charges notées', ['la force progresse', 'quand tu suis vraiment']],
    ],
    final: ['être fort', 'c’est répéter du propre', 'avec patience'],
  },
  {
    id: '33-routine-soir',
    title: 'Routine du soir propre',
    tags: ['sommeil'],
    cta: 'sommeil',
    hook: ['ta soirée sabote ton lendemain', 'si tu fais ça'],
    points: [
      ['nature_outdoor', 'lumière basse', ['ton corps comprend', 'que ça ralentit']],
      ['gym', 'téléphone loin', ['le lit n’est pas', 'un deuxième TikTok']],
      ['nourriture', 'heure fixe', ['pas parfait', 'mais régulier']],
    ],
    final: ['un bon matin', 'commence souvent', 'la veille au soir'],
  },
  {
    id: '34-moins-de-sucre',
    title: 'Moins de sucre',
    tags: ['nutrition'],
    cta: 'nutrition',
    hook: ['si tu as envie de sucre H24', 'corrige ça avant'],
    points: [
      ['nourriture', 'petit-déj salé', ['moins de pic', 'moins de crash']],
      ['nourriture', 'fruits entiers', ['tu gardes le plaisir', 'avec plus de satiété']],
      ['nature_outdoor', 'boissons zéro', ['arrête de boire', 'tes calories faciles']],
    ],
    final: ['le sucre baisse', 'quand ton énergie', 'arrête de faire les montagnes russes'],
  },
  {
    id: '35-rester-constant',
    title: 'Rester constant',
    tags: ['habitude'],
    cta: 'discipline',
    hook: ['la constance', 'bat ton meilleur jour isolé'],
    points: [
      ['gym', 'objectif minuscule', ['trop petit pour échouer', 'assez grand pour compter']],
      ['nourriture', 'preuve quotidienne', ['coche la case', 'même mal']],
      ['nature_outdoor', 'pas deux jours off', ['un jour raté arrive', 'deux jours créent une pente']],
    ],
    final: ['tu ne perces pas', 'avec une grosse journée', 'mais avec 100 petites'],
  },
  {
    id: '36-sortir-du-canape',
    title: 'Sortir du canapé',
    tags: ['reprise'],
    cta: 'reprise',
    hook: ['si tu n’arrives pas à bouger', 'ne vise pas une séance'],
    points: [
      ['gym', '5 minutes seulement', ['le but', 'c’est de démarrer']],
      ['nature_outdoor', 'chaussures prêtes', ['moins de friction', 'moins d’excuses']],
      ['nourriture', 'récompense après', ['pas avant', 'sinon tu restes assis']],
    ],
    final: ['l’élan revient', 'après le premier geste', 'pas avant'],
  },
  {
    id: '37-avant-apres',
    title: 'Vrai avant-après',
    tags: ['transformation'],
    cta: 'transformation',
    hook: ['tu veux un vrai avant-après ?', 'fais simple et longtemps'],
    points: [
      ['gym', 'photos chaque semaine', ['même lumière', 'même angle']],
      ['nourriture', 'plan simple', ['répétable', 'pas spectaculaire']],
      ['nature_outdoor', '90 jours sans négocier', ['le résultat arrive', 'après l’ennui']],
    ],
    final: ['les transformations visibles', 'viennent de routines', 'que personne ne voit'],
  },
  {
    id: '38-anti-procrastination',
    title: 'Anti-procrastination',
    tags: ['focus'],
    cta: 'focus',
    hook: ['tu procrastines parce que', 'le début est trop gros'],
    points: [
      ['gym', 'timer 10 minutes', ['pas plus', 'juste commencer']],
      ['nature_outdoor', 'tel bloqué', ['sinon ton cerveau', 'choisit le facile']],
      ['nourriture', 'première action physique', ['bouge avant de réfléchir', 'l’élan suit']],
    ],
    final: ['l’action vient rarement', 'après la motivation', 'c’est l’inverse'],
  },
  {
    id: '39-corps-athletique',
    title: 'Corps athlétique',
    tags: ['athletique'],
    cta: 'cardio',
    hook: ['un corps athlétique', 'ce n’est pas juste être sec'],
    points: [
      ['gym', 'muscu + pas', ['force visible', 'condition réelle']],
      ['nourriture', 'protéines + sommeil', ['tu construis', 'et tu récupères']],
      ['nature_outdoor', 'cardio dosé', ['assez pour performer', 'pas assez pour te cramer']],
    ],
    final: ['athlétique', 'c’est avoir l’air en forme', 'et l’être vraiment'],
  },
  {
    id: '40-devenir-le-type',
    title: 'Devenir le type qui agit',
    tags: ['identity'],
    cta: 'discipline',
    hook: ['deviens le type', 'qui agit avant de parler'],
    points: [
      ['gym', 'promesse tenue', ['une action', 'chaque jour']],
      ['nature_outdoor', 'effort visible', ['tu dois sentir', 'que tu as bougé']],
      ['nourriture', 'dopamine méritée', ['récompense après', 'jamais avant']],
    ],
    final: ['à force d’agir', 'tu n’as plus besoin', 'de te convaincre'],
  },
]

for (const item of extraScripts) {
  topics.push([
    item.id,
    item.title,
    'ete-transformation',
    item.tags,
    hookTop(item.hook),
    ...item.points.map(([theme, title, body], i) => point(theme, title, body, i + 1)),
    scrollupsCta(item.cta),
    punch('hook_viral_homme', item.final),
  ])
}

cleanDir(SCRIPTS)
cleanDir(TEMPLATES)
cleanDir(CONFIGS)

for (const [id, tpl] of Object.entries(templates)) {
  writeFileSync(join(TEMPLATES, `${id}.json`), JSON.stringify(tpl, null, 2))
}

for (const [id, title, templateId, tags, ...slides] of topics) {
  writeFileSync(join(SCRIPTS, `${id}.json`), JSON.stringify(config(title, templateId, tags, slides), null, 2))
}

rmSync(join(ROOT, 'slides-config.json'), { force: true })
rmSync(join(ROOT, 'test-config.json'), { force: true })
rmSync(join(ROOT, 'hooks-library.json'), { force: true })

console.log(`Templates: ${Object.keys(templates).length}`)
console.log(`Scripts: ${topics.length}`)
console.log('Old config/text bank files removed.')
