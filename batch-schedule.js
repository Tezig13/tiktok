import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'

const SCHEDULE_PATH = process.argv[2] || './schedule.json'

function checkEnv() {
  const errors = []
  if (!process.env.POSTIZ_API_KEY) {
    errors.push('POSTIZ_API_KEY manquante. Récupère-la sur app.postiz.com → Settings → API Keys, puis :\n  export POSTIZ_API_KEY=ta_clé_ici')
  }
  if (!process.env.TIKTOK_INTEGRATION_ID) {
    errors.push('TIKTOK_INTEGRATION_ID manquante. Récupère-la avec "postiz integrations:list", puis :\n  export TIKTOK_INTEGRATION_ID=ton_id_ici')
  }
  if (errors.length) {
    console.error('❌ Variables d\'environnement manquantes :\n')
    errors.forEach(e => console.error('  • ' + e + '\n'))
    process.exit(1)
  }
}

function checkPostizInstalled() {
  try {
    execSync('postiz --version', { stdio: 'pipe' })
  } catch {
    console.error('❌ Postiz CLI non installée. Installe-la avec :')
    console.error('   npm install -g postiz\n')
    process.exit(1)
  }
}

function shellEscape(s) {
  return String(s).replace(/(["\\$`])/g, '\\$1')
}

async function main() {
  if (!existsSync(SCHEDULE_PATH)) {
    console.error(`❌ ${SCHEDULE_PATH} introuvable.`)
    console.error('   Crée-le en t\'inspirant de schedule.example.json')
    process.exit(1)
  }

  checkPostizInstalled()
  checkEnv()

  const schedule = JSON.parse(readFileSync(SCHEDULE_PATH, 'utf-8'))
  const integrationId = process.env.TIKTOK_INTEGRATION_ID

  console.log(`→ Schedule : ${SCHEDULE_PATH}`)
  console.log(`→ ${schedule.length} post(s) à programmer\n`)

  let ok = 0, fail = 0
  for (const [i, post] of schedule.entries()) {
    const tag = `[${i + 1}/${schedule.length}]`
    console.log(`${tag} ${post.slides.length} slides • ${post.scheduledAt}`)

    try {
      // Upload chaque slide, récupère le path hébergé Postiz
      const mediaFlags = post.slides.map(slide => {
        if (!existsSync(slide)) throw new Error(`Slide introuvable : ${slide}`)
        const result = JSON.parse(execSync(`postiz upload "${slide}"`).toString())
        return `-m "${result.path}"`
      }).join(' ')

      // Settings pour push vers drafts TikTok (mode Notify — tu postes manuellement depuis le tel)
      const settings = JSON.stringify({
        privacy_level: 'SELF_ONLY',
        content_posting_method: 'UPLOAD',
      })

      const cmd = [
        'postiz posts:create',
        `-c "${shellEscape(post.caption)}"`,
        mediaFlags,
        `-s "${post.scheduledAt}"`,
        `-p tiktok`,
        `--settings '${settings}'`,
        `-i "${integrationId}"`,
      ].join(' ')

      execSync(cmd, { stdio: 'inherit' })
      console.log(`${tag} ✓ OK`)
      ok++
    } catch (err) {
      console.error(`${tag} ✗ ${err.message}`)
      fail++
    }
  }

  console.log(`\n✅ ${ok} scheduled, ${fail} failed`)
  if (fail === 0) {
    console.log('\n📱 À la date prévue, tu recevras une notif Postiz.')
    console.log('   Ouvre TikTok → draft en attente → tap Post.')
  }
}

main().catch(err => {
  console.error('❌ Erreur fatale :', err.message)
  process.exit(1)
})
