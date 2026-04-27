import { GoogleGenAI } from '@google/genai'
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'fs'
import { join, basename } from 'path'

const API_KEY = process.env.GEMINI_API_KEY
if (!API_KEY) {
  console.error('❌ GEMINI_API_KEY manquant. Lance avec: node --env-file=.env tag-images.js')
  process.exit(1)
}

const MODELS = (process.env.GEMINI_MODELS || 'gemini-2.5-flash-lite,gemini-2.0-flash-lite,gemini-2.5-flash,gemini-2.0-flash').split(',').map(s => s.trim()).filter(Boolean)
const ai = new GoogleGenAI({ apiKey: API_KEY })
const exhausted = new Set()
let modelIdx = 0
function currentModel() { return MODELS[modelIdx] }
function rotateModel() {
  exhausted.add(MODELS[modelIdx])
  for (let i = 0; i < MODELS.length; i++) {
    const next = (modelIdx + 1 + i) % MODELS.length
    if (!exhausted.has(MODELS[next])) {
      modelIdx = next
      console.log(`   ↻ rotation → ${MODELS[modelIdx]}`)
      return true
    }
  }
  return false
}

const ROOTS = [
  './pinterest_images',
  './avatars',
]
const EXTRA_FOLDERS = [
  './pertepoids',
  './pursport1',
  './pursport2',
  './routinematinal',
  './parfait',
  './exemple1',
  './exemple2',
  './exemple3',
]

const PROMPT = `Tu classifies une image pour un slideshow TikTok francophone (fitness, nutrition, lifestyle, motivation).
Donne 4 à 7 tags en français, minuscules, sans accents, séparés par des virgules.
Couvre ces axes quand pertinents :
- sujet (homme, femme, repas, plat, objet, texte, citation)
- contexte (salle, cuisine, exterieur, chambre, plage, miroir)
- theme (musculation, cardio, healthy, dessert, motivation, luxe, avant-apres, sommeil, routine, mental)
- detail (dos, jambes, abdos, salade, viande, protein, cafe, nature)
Ne mets QUE les tags, séparés par des virgules. Pas de phrase, pas de tirets, pas de numéros.
Exemple correct: homme, salle, musculation, dos, motivation
Exemple correct: repas, healthy, salade, cuisine, proteine`

const IMAGE_RE = /\.(jpe?g|png|webp)$/i
const MIME = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
}

function listImageFolders() {
  const folders = new Set(EXTRA_FOLDERS.filter(existsSync))
  for (const root of ROOTS) {
    if (!existsSync(root)) continue
    for (const entry of readdirSync(root)) {
      const full = join(root, entry)
      if (statSync(full).isDirectory()) folders.add(full)
    }
  }
  return [...folders]
}

function loadManifest(folder) {
  const path = join(folder, 'manifest.json')
  if (!existsSync(path)) return { path, data: {} }
  try {
    return { path, data: JSON.parse(readFileSync(path, 'utf-8')) }
  } catch {
    console.warn(`⚠  manifest.json corrompu dans ${folder}, on repart à zéro`)
    return { path, data: {} }
  }
}

function saveManifest(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n')
}

async function tagImage(filePath) {
  const ext = filePath.split('.').pop().toLowerCase()
  const mimeType = MIME[ext]
  const base64 = readFileSync(filePath).toString('base64')

  const response = await ai.models.generateContent({
    model: currentModel(),
    contents: [{
      parts: [
        { inlineData: { data: base64, mimeType } },
        { text: PROMPT },
      ],
    }],
  })

  const text = (response.text || '').trim()
  const tags = text
    .split(/[,\n]/)
    .map(t => t.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''))
    .filter(t => t && t.length < 30 && !/^[-•*\d.]/.test(t))
  return [...new Set(tags)].slice(0, 8)
}

async function processFolder(folder) {
  const files = readdirSync(folder).filter(f => IMAGE_RE.test(f))
  if (files.length === 0) return

  const { path: manifestPath, data } = loadManifest(folder)
  const todo = files.filter(f => !data[f] || !Array.isArray(data[f]) || data[f].length === 0)

  if (todo.length === 0) {
    console.log(`✓ ${folder} — déjà tagué (${files.length} images)`)
    return
  }

  console.log(`→ ${folder} — ${todo.length}/${files.length} à tagger (modèle: ${currentModel()})`)
  let done = 0
  for (const file of todo) {
    const full = join(folder, file)
    let attempts = 0
    while (attempts < MODELS.length + 1) {
      try {
        const tags = await tagImage(full)
        data[file] = tags
        done++
        console.log(`   ${file}  →  ${tags.join(', ')}`)
        saveManifest(manifestPath, data)
        await new Promise(r => setTimeout(r, 5000))
        break
      } catch (err) {
        const msg = err.message || ''
        const isQuota = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')
        const is503 = msg.includes('503') || msg.includes('UNAVAILABLE')
        if (isQuota) {
          console.error(`   ⚠ ${currentModel()} quota épuisé`)
          if (!rotateModel()) {
            console.error(`   ❌ tous les modèles épuisés, arrêt`)
            return
          }
          attempts++
          continue
        }
        if (is503) {
          console.error(`   ⏳ ${file}: 503, retry dans 10s`)
          await new Promise(r => setTimeout(r, 10000))
          attempts++
          continue
        }
        console.error(`   ✗ ${file}: ${msg.slice(0, 120)}`)
        break
      }
    }
  }
  console.log(`✓ ${folder} — ${done} nouvelles images taggées`)
}

const folders = listImageFolders()
console.log(`📂 ${folders.length} dossiers à scanner\n`)
for (const folder of folders) {
  await processFolder(folder)
}
console.log('\n🎉 Tagging terminé. Manifests écrits dans chaque dossier.')
