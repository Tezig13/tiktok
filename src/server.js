import express from 'express'
import { spawn } from 'child_process'
import {
  writeFileSync, readdirSync, readFileSync, existsSync, mkdirSync, statSync,
} from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const SRC_DIR = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = join(SRC_DIR, '..')
const CONTENT_DIR = join(ROOT_DIR, 'content')
const SCRIPTS_DIR = join(CONTENT_DIR, 'scripts')
const TEMPLATES_DIR = join(CONTENT_DIR, 'templates')
const CONFIGS_DIR = join(CONTENT_DIR, 'configs')
const OUTPUT_DIR = join(ROOT_DIR, 'output')

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json({ limit: '10mb' }))
app.use(express.static(join(ROOT_DIR, 'public')))
app.use('/output', express.static(OUTPUT_DIR))
app.use('/pinterest_images', express.static(join(ROOT_DIR, 'pinterest_images')))
app.use('/avatars', express.static(join(ROOT_DIR, 'avatars')))
app.use('/app_screenshots', express.static(join(ROOT_DIR, 'app_screenshots')))
app.use('/fonts', express.static(join(ROOT_DIR, 'fonts')))

// --- API : list templates ---
app.get('/api/templates', (req, res) => {
  try {
    const files = readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.json')).sort()
    const templates = files.map(f => {
      const data = JSON.parse(readFileSync(join(TEMPLATES_DIR, f), 'utf-8'))
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
    if (!existsSync(SCRIPTS_DIR)) return res.json([])
    const files = readdirSync(SCRIPTS_DIR).filter(f => f.endsWith('.json')).sort()
    const scripts = files.map(f => {
      const data = JSON.parse(readFileSync(join(SCRIPTS_DIR, f), 'utf-8'))
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
    const filePath = join(SCRIPTS_DIR, `${safeId}.json`)
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
    const baseDir = join(ROOT_DIR, base)
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
  const dir = OUTPUT_DIR
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
  const outputDir = join(OUTPUT_DIR, safeName)
  if (!existsSync(CONFIGS_DIR)) mkdirSync(CONFIGS_DIR, { recursive: true })
  const configPath = join(CONFIGS_DIR, `${safeName}.json`)
  writeFileSync(configPath, JSON.stringify(config, null, 2))

  const proc = spawn('node', ['src/generate-slides.js', configPath, outputDir], {
    cwd: ROOT_DIR,
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
    res.json({ name: safeName, slides, finalSlides, configPath: `content/configs/${safeName}.json` })
  })
})

// --- Open output folder in Finder ---
app.post('/api/open', (req, res) => {
  const { name } = req.body || {}
  if (!name) return res.status(400).json({ error: 'name requis' })
  const safeName = String(name).replace(/[^a-z0-9-_]+/gi, '_')
  const target = join(OUTPUT_DIR, safeName)
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
