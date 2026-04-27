import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas'
import { writeFileSync, mkdirSync, readFileSync, existsSync, readdirSync } from 'fs'
import { join, dirname } from 'path'

const CONFIG_PATH = process.argv[2] || './slides-config.json'
const OUTPUT_DIR = process.argv[3] || './output'
const W = 1080
const H = 1920

const FONTS = [
  { path: './fonts/Montserrat-Regular.ttf', family: 'Montserrat', weight: 'normal' },
  { path: './fonts/Montserrat-SemiBold.ttf', family: 'Montserrat', weight: '600' },
  { path: './fonts/Montserrat-Bold.ttf', family: 'Montserrat', weight: 'bold' },
]
for (const f of FONTS) {
  if (existsSync(f.path)) {
    GlobalFonts.registerFromPath(f.path, f.family)
  }
}

const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'))
const slides = Array.isArray(config) ? config : config.slides
const defaults = Array.isArray(config) ? {} : (config.defaults || {})

const usedImages = new Set()
const manifestCache = new Map()
function loadManifest(folder) {
  if (manifestCache.has(folder)) return manifestCache.get(folder)
  const path = join(folder, 'manifest.json')
  let data = {}
  if (existsSync(path)) {
    try { data = JSON.parse(readFileSync(path, 'utf-8')) } catch {}
  }
  manifestCache.set(folder, data)
  return data
}

function pickRandomFromTheme(themeName, wantedTags = []) {
  const candidates = [
    `./pinterest_images/${themeName}`,
    `./avatars/${themeName}`,
  ]
  for (const folder of candidates) {
    if (!existsSync(folder)) continue
    const files = readdirSync(folder)
      .filter(f => /\.(jpe?g|png|webp)$/i.test(f))
      .map(f => join(folder, f))
    let available = files.filter(f => !usedImages.has(f))
    if (available.length === 0) available = files
    if (available.length === 0) continue

    if (wantedTags.length > 0) {
      const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      const manifest = loadManifest(folder)
      const wanted = wantedTags.map(norm)
      const scored = available.map(f => {
        const tags = (manifest[f.split('/').pop()] || []).map(norm)
        const score = tags.filter(t => wanted.includes(t)).length
        return { f, score }
      })
      const maxScore = Math.max(...scored.map(s => s.score))
      if (maxScore > 0) {
        available = scored.filter(s => s.score === maxScore).map(s => s.f)
      }
    }

    const pick = available[Math.floor(Math.random() * available.length)]
    usedImages.add(pick)
    return pick
  }
  return null
}

for (const slide of slides) {
  if (!slide.imagePath && slide.imageTheme) {
    const picked = pickRandomFromTheme(slide.imageTheme, slide.imageTags || [])
    if (picked) {
      slide.imagePath = picked
    } else {
      console.warn(`⚠  Theme "${slide.imageTheme}" introuvable ou vide`)
    }
  } else if (slide.imagePath) {
    usedImages.add(slide.imagePath)
  }
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

async function generateSlide(slide, index) {
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = slide.bgColor || '#000000'
  ctx.fillRect(0, 0, W, H)

  if (slide.imagePath && existsSync(slide.imagePath)) {
    const img = await loadImage(slide.imagePath)
    const scale = Math.max(W / img.width, H / img.height)
    const drawW = img.width * scale
    const drawH = img.height * scale
    ctx.drawImage(img, (W - drawW) / 2, (H - drawH) / 2, drawW, drawH)
  } else if (slide.imagePath) {
    console.warn(`⚠  Image introuvable: ${slide.imagePath}`)
  }

  const overlayOpacity = slide.overlay ?? defaults.overlay ?? 0
  if (overlayOpacity > 0) {
    ctx.fillStyle = `rgba(0,0,0,${overlayOpacity})`
    ctx.fillRect(0, 0, W, H)
  }

  const fontFamily = defaults.fontFamily || 'Montserrat, sans-serif'
  const padding = 80
  const maxTextWidth = W - padding * 2

  for (const line of slide.lines) {
    const size = line.size || 72
    const weight = line.weight || 'bold'
    const color = line.color || defaults.color || '#ffffff'
    const align = line.align || defaults.align || 'center'
    const y = line.y

    ctx.font = `${weight} ${size}px ${fontFamily}`
    ctx.fillStyle = color
    ctx.textAlign = align
    ctx.textBaseline = 'middle'

    const wrapped = wrapText(ctx, line.text, line.maxWidth || maxTextWidth)
    const lineHeight = size * (line.lineHeight || 1.2)
    const totalHeight = wrapped.length * lineHeight

    if (line.box) {
      const boxPadH = line.boxPaddingH ?? 24
      const boxPadV = line.boxPaddingV ?? 16
      const boxRadius = line.boxRadius ?? 12
      const boxColor = line.boxColor || 'rgba(255,255,255,0.95)'

      wrapped.forEach((l, i) => {
        const textW = ctx.measureText(l).width
        const textY = y + i * lineHeight
        const x = align === 'center' ? W / 2 : (align === 'right' ? W - padding : padding)
        const boxX = align === 'center' ? x - textW / 2 - boxPadH
          : align === 'right' ? x - textW - boxPadH
            : x - boxPadH
        const boxY = textY - size / 2 - boxPadV
        const boxW = textW + boxPadH * 2
        const boxH = size + boxPadV * 2
        ctx.fillStyle = boxColor
        drawRoundedRect(ctx, boxX, boxY, boxW, boxH, boxRadius)
        ctx.fill()
      })
    }

    ctx.fillStyle = color
    if (line.shadow !== false) {
      ctx.shadowColor = line.shadowColor || 'rgba(0,0,0,0.85)'
      ctx.shadowBlur = line.shadowBlur ?? 14
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = line.shadowOffsetY ?? 4
    } else {
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
    }

    if (line.stroke) {
      ctx.strokeStyle = line.strokeColor || '#000000'
      ctx.lineWidth = line.strokeWidth || 8
      ctx.lineJoin = 'round'
      wrapped.forEach((l, i) => ctx.strokeText(l, W / 2, y + i * lineHeight))
    }

    wrapped.forEach((l, i) => ctx.fillText(l, align === 'center' ? W / 2 : (align === 'right' ? W - padding : padding), y + i * lineHeight))

    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
  }

  mkdirSync(OUTPUT_DIR, { recursive: true })
  const prefix = slide.prefix || ''
  const fileName = `${prefix}slide_${String(index + 1).padStart(2, '0')}.png`
  const outPath = join(OUTPUT_DIR, fileName)
  writeFileSync(outPath, canvas.toBuffer('image/png'))
  console.log(`✓ ${outPath}`)
}

async function main() {
  console.log(`→ Config: ${CONFIG_PATH}`)
  console.log(`→ Output: ${OUTPUT_DIR}`)
  console.log(`→ ${slides.length} slide(s) à générer\n`)

  for (let i = 0; i < slides.length; i++) {
    await generateSlide(slides[i], i)
  }
  console.log(`\n✅ Terminé → ${OUTPUT_DIR}/`)
}

main().catch(err => {
  console.error('❌ Erreur:', err.message)
  process.exit(1)
})
