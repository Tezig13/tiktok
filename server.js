import express from 'express'
import { spawn } from 'child_process'
import {
  writeFileSync, readdirSync, readFileSync, existsSync, mkdirSync, statSync,
} from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json({ limit: '10mb' }))
app.use(express.static(join(__dirname, 'public')))
app.use('/output', express.static(join(__dirname, 'output')))
app.use('/pinterest_images', express.static(join(__dirname, 'pinterest_images')))
app.use('/avatars', express.static(join(__dirname, 'avatars')))
app.use('/app_screenshots', express.static(join(__dirname, 'app_screenshots')))
app.use('/fonts', express.static(join(__dirname, 'fonts')))

// --- API : list templates ---
app.get('/api/templates', (req, res) => {
  try {
    const files = readdirSync(join(__dirname, 'templates')).filter(f => f.endsWith('.json'))
    const templates = files.map(f => {
      const data = JSON.parse(readFileSync(join(__dirname, 'templates', f), 'utf-8'))
      return {
        id: f.replace(/\.json$/, ''),
        meta: data._meta || {},
        slides: data.slides,
        defaults: data.defaults,
      }
    })
    res.json(templates)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// --- API : list pre-written scripts ---
app.get('/api/scripts', (req, res) => {
  try {
    const dir = join(__dirname, 'scripts')
    if (!existsSync(dir)) return res.json([])
    const files = readdirSync(dir).filter(f => f.endsWith('.json')).sort()
    const scripts = files.map(f => {
      const data = JSON.parse(readFileSync(join(dir, f), 'utf-8'))
      return {
        id: f.replace(/\.json$/, ''),
        title: data._meta?.title || f.replace(/\.json$/, ''),
        template_id: data._meta?.template_id || null,
        tags: data._meta?.tags || [],
      }
    })
    res.json(scripts)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// --- API : load a single script (full config) ---
app.get('/api/scripts/:id', (req, res) => {
  try {
    const safeId = String(req.params.id).replace(/[^a-z0-9-_]+/gi, '_')
    const filePath = join(__dirname, 'scripts', `${safeId}.json`)
    if (!existsSync(filePath)) return res.status(404).json({ error: 'script introuvable' })
    const data = JSON.parse(readFileSync(filePath, 'utf-8'))
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// --- API : list image banks ---
app.get('/api/banks', (req, res) => {
  const banks = {}
  for (const base of ['pinterest_images', 'avatars']) {
    const baseDir = join(__dirname, base)
    if (!existsSync(baseDir)) continue
    for (const dirent of readdirSync(baseDir, { withFileTypes: true })) {
      if (!dirent.isDirectory()) continue
      const themeFolder = join(baseDir, dirent.name)
      const files = readdirSync(themeFolder)
        .filter(f => /\.(jpe?g|png|webp)$/i.test(f))
        .map(f => `/${base}/${dirent.name}/${f}`)
      banks[`${base}/${dirent.name}`] = files
    }
  }
  res.json(banks)
})

function listFinalSlides(folder, name) {
  const finalDir = join(folder, 'final')
  if (!existsSync(finalDir)) return []
  return readdirSync(finalDir)
    .filter(f => /\.jpe?g$/i.test(f))
    .sort()
    .map(f => `/output/${name}/final/${f}`)
}

// --- API : list past slideshows ---
app.get('/api/output', (req, res) => {
  const dir = join(__dirname, 'output')
  if (!existsSync(dir)) return res.json([])
  const slideshows = readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => {
      const folder = join(dir, d.name)
      const slides = readdirSync(folder)
        .filter(f => /\.png$/i.test(f))
        .sort()
        .map(f => `/output/${d.name}/${f}`)
      const finalSlides = listFinalSlides(folder, d.name)
      const mtime = statSync(folder).mtimeMs
      return { name: d.name, slides, finalSlides, mtime }
    })
    .sort((a, b) => b.mtime - a.mtime)
  res.json(slideshows)
})

// --- API : generate slideshow ---
app.post('/api/generate', (req, res) => {
  const { name, config } = req.body || {}
  if (!name || !config || !Array.isArray(config.slides)) {
    return res.status(400).json({ error: 'name + config.slides requis' })
  }
  const safeName = String(name).toLowerCase().replace(/[^a-z0-9-_]+/g, '_').slice(0, 60) || `post_${Date.now()}`
  const configsDir = join(__dirname, 'configs')
  const outputDir = join(__dirname, 'output', safeName)
  if (!existsSync(configsDir)) mkdirSync(configsDir, { recursive: true })
  const configPath = join(configsDir, `${safeName}.json`)
  writeFileSync(configPath, JSON.stringify(config, null, 2))

  const proc = spawn('node', ['generate-slides.js', configPath, outputDir], {
    cwd: __dirname,
  })
  let stdout = '', stderr = ''
  proc.stdout.on('data', d => { stdout += d })
  proc.stderr.on('data', d => { stderr += d })
  proc.on('close', code => {
    if (code !== 0) {
      return res.status(500).json({ error: 'génération échouée', stdout, stderr })
    }
    const slides = readdirSync(outputDir)
      .filter(f => /\.png$/i.test(f))
      .sort()
      .map(f => `/output/${safeName}/${f}`)
    const finalSlides = listFinalSlides(outputDir, safeName)
    res.json({ name: safeName, slides, finalSlides, configPath: `configs/${safeName}.json` })
  })
})

// --- Open output folder in Finder ---
app.post('/api/open', (req, res) => {
  const { name } = req.body || {}
  if (!name) return res.status(400).json({ error: 'name requis' })
  const safeName = String(name).replace(/[^a-z0-9-_]+/gi, '_')
  const target = join(__dirname, 'output', safeName)
  if (!existsSync(target)) return res.status(404).json({ error: 'dossier introuvable' })
  spawn('open', [target])
  res.json({ ok: true })
})

app.listen(PORT, () => {
  console.log('')
  console.log('╔═══════════════════════════════════════╗')
  console.log('║  Scrollups Generator — UI Web         ║')
  console.log('╠═══════════════════════════════════════╣')
  console.log(`║  http://localhost:${PORT}                  ║`)
  console.log('║  Ctrl+C pour arrêter                  ║')
  console.log('╚═══════════════════════════════════════╝')
  console.log('')
})
