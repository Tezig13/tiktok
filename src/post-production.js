import sharp from 'sharp'
import { mkdirSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'

const W = 1080
const H = 1920

function makeNoiseBuffer(w, h, alpha) {
  const buf = Buffer.allocUnsafe(w * h * 4)
  for (let i = 0; i < w * h; i++) {
    const v = (Math.random() * 256) | 0
    buf[i * 4]     = v
    buf[i * 4 + 1] = v
    buf[i * 4 + 2] = v
    buf[i * 4 + 3] = alpha
  }
  return buf
}

export async function postProduce(slidesDir, opts = {}) {
  const grain    = opts.grain    ?? 0.025
  const quality  = opts.quality  ?? 82
  const outDir   = opts.outDir   ?? join(slidesDir, 'final')

  if (!existsSync(slidesDir)) throw new Error(`Dossier introuvable : ${slidesDir}`)
  mkdirSync(outDir, { recursive: true })

  const files = readdirSync(slidesDir)
    .filter(f => /\.png$/i.test(f))
    .sort()

  if (files.length === 0) {
    console.warn(`⚠  Aucun PNG dans ${slidesDir}`)
    return { outDir, count: 0 }
  }

  const noiseAlpha = Math.max(1, Math.round(grain * 255))

  for (const file of files) {
    const inPath  = join(slidesDir, file)
    const outName = file.replace(/\.png$/i, '.jpg')
    const outPath = join(outDir, outName)

    const noiseRaw = makeNoiseBuffer(W, H, noiseAlpha)

    await sharp(inPath)
      .resize(W, H, { fit: 'cover' })
      .composite([{
        input: noiseRaw,
        raw: { width: W, height: H, channels: 4 },
        blend: 'over',
      }])
      .jpeg({ quality, mozjpeg: true, chromaSubsampling: '4:2:0' })
      .toFile(outPath)
  }

  console.log(`✓ Post-prod → ${outDir}/ (${files.length} fichiers, grain ${(grain * 100).toFixed(1)}%, JPEG q${quality})`)
  return { outDir, count: files.length }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = process.argv[2]
  if (!dir) {
    console.error('Usage : node post-production.js <dossier-slideshow> [grain] [quality]')
    process.exit(1)
  }
  const grain   = process.argv[3] ? parseFloat(process.argv[3]) : undefined
  const quality = process.argv[4] ? parseInt(process.argv[4], 10) : undefined
  postProduce(dir, { grain, quality }).catch(err => {
    console.error('❌ Post-prod :', err.message)
    process.exit(1)
  })
}
