// State
const state = {
  templates: [],
  scripts: [],
  banks: {},        // { 'pinterest_images/gym': [path1, path2, ...], ... }
  currentConfig: null,
  currentSourceLabel: null,
  lastGenerated: null,
  pickerOpen: null, // slideIdx of opened picker, or null
}

const $ = sel => document.querySelector(sel)

// --- Toast ---
function toast(msg, type = 'info', ms = 2800) {
  const t = $('#toast')
  t.textContent = msg
  t.className = `toast ${type}`
  t.classList.remove('hidden')
  clearTimeout(toast._t)
  toast._t = setTimeout(() => t.classList.add('hidden'), ms)
}

// --- API ---
async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

// --- Library loading ---
async function loadLibrary() {
  const [templates, scripts, banks] = await Promise.all([
    api('/api/templates'),
    api('/api/scripts'),
    api('/api/banks'),
  ])
  state.templates = templates
  state.scripts = scripts
  state.banks = banks

  const sel = $('#source-select')
  sel.innerHTML = ''

  if (scripts.length) {
    const og = document.createElement('optgroup')
    og.label = '📚 Scripts pré-rédigés (clic = remplit tout)'
    for (const s of scripts) {
      const opt = document.createElement('option')
      opt.value = `script:${s.id}`
      opt.textContent = s.title
      og.appendChild(opt)
    }
    sel.appendChild(og)
  }

  if (templates.length) {
    const og = document.createElement('optgroup')
    og.label = '📝 Templates vides (à écrire toi-même)'
    for (const t of templates) {
      const opt = document.createElement('option')
      opt.value = `template:${t.id}`
      opt.textContent = `${t.id} (vierge)`
      og.appendChild(opt)
    }
    sel.appendChild(og)
  }

  sel.addEventListener('change', () => loadSource(sel.value))
  if (sel.options.length) loadSource(sel.value)
}

async function loadSource(value) {
  const [type, id] = value.split(':')
  if (type === 'script') {
    const data = await api(`/api/scripts/${id}`)
    state.currentConfig = JSON.parse(JSON.stringify({ defaults: data.defaults, slides: data.slides }))
    state.currentSourceLabel = data._meta?.title || id
    if (!$('#post-name').value || $('#post-name').dataset.auto === '1') {
      $('#post-name').value = id
      $('#post-name').dataset.auto = '1'
    }
  } else if (type === 'template') {
    const tpl = state.templates.find(t => t.id === id)
    if (!tpl) return
    state.currentConfig = JSON.parse(JSON.stringify({ defaults: tpl.defaults, slides: tpl.slides }))
    state.currentSourceLabel = `${id} (template vide)`
  }
  state.pickerOpen = null
  resolveAllAutoImages() // ← lock les images auto pour que preview = output
  renderForm()
}

// Résout chaque slide en mode auto (imageTheme) en piochant une image aléatoire
// et en l'écrivant comme imagePath, pour que la preview corresponde EXACTEMENT
// à ce qui sera généré.
function resolveAutoImage(slide) {
  if (slide.imageTheme && !slide.imagePath) {
    const themeKey = findThemeKey(slide.imageTheme)
    const images = themeKey ? state.banks[themeKey] : []
    if (images.length > 0) {
      const pick = images[Math.floor(Math.random() * images.length)]
      slide.imagePath = '.' + pick
    }
  }
}

function resolveAllAutoImages() {
  if (!state.currentConfig) return
  for (const slide of state.currentConfig.slides) {
    resolveAutoImage(slide)
  }
}

// Re-pioche les images auto (slides marquées avec imageTheme)
function rerollAutoImages() {
  if (!state.currentConfig) return
  for (const slide of state.currentConfig.slides) {
    if (slide.imageTheme) {
      const themeKey = findThemeKey(slide.imageTheme)
      const images = themeKey ? state.banks[themeKey] : []
      if (images.length > 0) {
        const pick = images[Math.floor(Math.random() * images.length)]
        slide.imagePath = '.' + pick
      }
    }
  }
  renderForm()
}

// --- Image picker helpers ---
function getThemeFromSlide(slide) {
  if (slide.imageTheme) return slide.imageTheme
  if (slide.imagePath) {
    // ./pinterest_images/gym/xxx.jpg → gym
    // ./app_screenshots/scrollups.jpg → app_screenshots
    const parts = slide.imagePath.split('/').filter(Boolean)
    if (parts.length >= 2) return parts[parts.length - 2]
  }
  return null
}

function getCurrentImageSrc(slide) {
  if (slide.imagePath) {
    return slide.imagePath.replace(/^\.\//, '/')
  }
  // imageTheme — pas d'image fixe, on retourne null
  return null
}

function getAvailableThemes() {
  // Tous les themes des banks + app_screenshots
  return Object.keys(state.banks).filter(k => state.banks[k].length > 0)
}

function getImagesForTheme(themeKey) {
  return state.banks[themeKey] || []
}

function findThemeKey(themeId) {
  // themeId = 'gym' → cherche 'pinterest_images/gym' ou 'avatars/gym' ou 'app_screenshots'
  const candidates = [
    `pinterest_images/${themeId}`,
    `avatars/${themeId}`,
    themeId,
  ]
  for (const c of candidates) {
    if (state.banks[c]) return c
  }
  return null
}

// --- Image picker actions ---
function togglePicker(slideIdx) {
  state.pickerOpen = state.pickerOpen === slideIdx ? null : slideIdx
  renderForm()
}

function setImagePath(slideIdx, path) {
  const slide = state.currentConfig.slides[slideIdx]
  delete slide.imageTheme
  // path arrive sous forme '/pinterest_images/gym/xxx.jpg', on le garde tel quel pour le serveur
  slide.imagePath = '.' + path
  state.pickerOpen = null
  renderForm()
}

function setImageTheme(slideIdx, themeKey) {
  const slide = state.currentConfig.slides[slideIdx]
  // themeKey = 'pinterest_images/gym' → on extrait 'gym'
  const parts = themeKey.split('/')
  slide.imageTheme = parts[parts.length - 1]
  // Re-pioche une image random du thème (preview = output)
  const images = state.banks[themeKey] || []
  if (images.length > 0) {
    slide.imagePath = '.' + images[Math.floor(Math.random() * images.length)]
  } else {
    delete slide.imagePath
  }
  renderForm()
}

function changeTheme(slideIdx, newThemeKey) {
  // L'user change le thème dans le dropdown du picker — on switch en mode auto sur ce thème
  setImageTheme(slideIdx, newThemeKey)
}

// --- Render form ---
function renderForm() {
  const cfg = state.currentConfig
  const container = $('#slides-container')
  container.innerHTML = ''
  if (!cfg) return

  cfg.slides.forEach((slide, slideIdx) => {
    const card = document.createElement('div')
    card.className = 'slide-card'

    const isScrollUpsSlide = slide.imagePath && slide.imagePath.includes('scrollups')
    const currentTheme = getThemeFromSlide(slide)
    const isAuto = !!slide.imageTheme
    const currentSrc = getCurrentImageSrc(slide)
    const isPickerOpen = state.pickerOpen === slideIdx

    const themes = getAvailableThemes()
    const themeKeyForPicker = isAuto ? findThemeKey(slide.imageTheme) : findThemeKey(currentTheme) || themes[0]

    // Determine bg image for the interactive preview
    let bgSrc = null
    if (slide.imagePath) {
      bgSrc = slide.imagePath.replace(/^\.\//, '/')
    } else if (slide.imageTheme) {
      const key = findThemeKey(slide.imageTheme)
      if (key && state.banks[key]?.length > 0) bgSrc = state.banks[key][0]
    }

    card.innerHTML = `
      <div class="slide-card-head">
        <div class="slide-meta-block">
          <span class="slide-num">Slide ${slideIdx + 1}</span>
          ${isAuto
            ? `<span class="slide-meta">🎲 auto: ${slide.imageTheme}</span>`
            : `<span class="slide-meta">📌 ${slide.imagePath?.split('/').pop() || '?'}</span>`}
        </div>
        <div class="slide-actions">
          ${isScrollUpsSlide ? '<span class="scrollups-tag">ScrollUps</span>' : ''}
          <button class="picker-toggle" data-slide="${slideIdx}">
            ${isPickerOpen ? '▲ Fermer' : '🖼️ Changer image'}
          </button>
        </div>
      </div>

      ${isPickerOpen ? `
        <div class="img-picker">
          <div class="img-picker-head">
            <label>
              <span>Thème :</span>
              <select class="theme-switcher" data-slide="${slideIdx}">
                ${themes.map(t => `<option value="${t}" ${t === themeKeyForPicker ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </label>
            <button class="auto-pick-btn" data-slide="${slideIdx}" data-theme="${themeKeyForPicker}">
              🎲 Auto-pick
            </button>
          </div>
          <div class="thumb-grid">
            ${getImagesForTheme(themeKeyForPicker).map(p => `
              <img src="${p}" data-slide="${slideIdx}" data-path="${p}"
                class="thumb ${slide.imagePath === '.' + p ? 'selected' : ''}"
                title="${p.split('/').pop()}">
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="slide-card-body">
        ${bgSrc ? `
          <div class="slide-preview-interactive" data-slide="${slideIdx}">
            <img class="bg" src="${bgSrc}" alt="" draggable="false">
            ${slide.lines.map((line, lineIdx) => {
              const topPct = (line.y / 1920) * 100
              const fontPx = Math.max(8, Math.round(line.size / 1080 * 280))
              return `
                <div class="overlay-line"
                     data-slide="${slideIdx}"
                     data-line="${lineIdx}"
                     style="top: ${topPct}%; font-size: ${fontPx}px; font-weight: ${line.weight === 'bold' ? '700' : '400'};"
                     title="Glisser pour repositionner">
                  ${escapeHtml(line.text)}
                </div>
              `
            }).join('')}
            <div class="preview-hint">↕ glisse les textes pour les positionner</div>
          </div>
        ` : '<div class="slide-preview-empty">Pas d\'image — choisis un thème ou une image dans le picker</div>'}

        <div class="lines-list" data-slide="${slideIdx}"></div>
      </div>
    `

    const linesList = card.querySelector('.lines-list')
    slide.lines.forEach((line, lineIdx) => {
      const row = document.createElement('div')
      row.className = 'line-row'
      row.innerHTML = `
        <div class="line-num">${lineIdx + 1}</div>
        <textarea data-slide="${slideIdx}" data-line="${lineIdx}" rows="1">${escapeHtml(line.text)}</textarea>
        <div class="y-controls">
          <button class="y-btn" data-slide="${slideIdx}" data-line="${lineIdx}" data-delta="-20" title="Monter">↑</button>
          <input type="number" class="y-input" data-slide="${slideIdx}" data-line="${lineIdx}" value="${line.y}" step="10" min="0" max="1920" title="Position verticale (0-1920)">
          <button class="y-btn" data-slide="${slideIdx}" data-line="${lineIdx}" data-delta="20" title="Descendre">↓</button>
        </div>
      `
      const ta = row.querySelector('textarea')
      ta.addEventListener('input', () => autoResize(ta))
      setTimeout(() => autoResize(ta), 0)
      linesList.appendChild(row)
    })

    container.appendChild(card)
  })

  // Wire up y controls (buttons + input)
  document.querySelectorAll('.y-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const slideIdx = parseInt(btn.dataset.slide)
      const lineIdx = parseInt(btn.dataset.line)
      const delta = parseInt(btn.dataset.delta)
      adjustY(slideIdx, lineIdx, delta)
      syncOverlayPosition(slideIdx, lineIdx)
    })
  })
  document.querySelectorAll('.y-input').forEach(input => {
    input.addEventListener('change', () => {
      const slideIdx = parseInt(input.dataset.slide)
      const lineIdx = parseInt(input.dataset.line)
      const newY = parseInt(input.value)
      if (!isNaN(newY)) {
        state.currentConfig.slides[slideIdx].lines[lineIdx].y = newY
        syncOverlayPosition(slideIdx, lineIdx)
      }
    })
  })

  // Wire up draggable text overlays on the preview
  document.querySelectorAll('.overlay-line').forEach(el => {
    el.addEventListener('mousedown', startDrag)
    el.addEventListener('touchstart', startDrag, { passive: false })
  })

  // Wire up picker buttons
  document.querySelectorAll('.picker-toggle').forEach(btn => {
    btn.addEventListener('click', () => togglePicker(parseInt(btn.dataset.slide)))
  })
  document.querySelectorAll('.theme-switcher').forEach(sel => {
    sel.addEventListener('change', () => changeTheme(parseInt(sel.dataset.slide), sel.value))
  })
  document.querySelectorAll('.auto-pick-btn').forEach(btn => {
    btn.addEventListener('click', () => setImageTheme(parseInt(btn.dataset.slide), btn.dataset.theme))
  })
  document.querySelectorAll('.thumb').forEach(img => {
    img.addEventListener('click', () => setImagePath(parseInt(img.dataset.slide), img.dataset.path))
  })
}

function autoResize(el) {
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

function adjustY(slideIdx, lineIdx, delta) {
  const line = state.currentConfig.slides[slideIdx].lines[lineIdx]
  line.y = Math.max(0, Math.min(1920, line.y + delta))
  // Met à jour l'input correspondant sans redraw complet
  const input = document.querySelector(`.y-input[data-slide="${slideIdx}"][data-line="${lineIdx}"]`)
  if (input) input.value = line.y
}

function syncOverlayPosition(slideIdx, lineIdx) {
  const line = state.currentConfig.slides[slideIdx].lines[lineIdx]
  const overlay = document.querySelector(`.overlay-line[data-slide="${slideIdx}"][data-line="${lineIdx}"]`)
  if (overlay) overlay.style.top = `${(line.y / 1920) * 100}%`
}

// --- Drag-and-drop pour repositionner les textes ---
function startDrag(e) {
  e.preventDefault()
  const el = e.currentTarget
  const slideIdx = parseInt(el.dataset.slide)
  const lineIdx = parseInt(el.dataset.line)
  const container = el.closest('.slide-preview-interactive')
  if (!container) return
  const isTouch = e.type === 'touchstart'
  const startY = isTouch ? e.touches[0].clientY : e.clientY
  const startLineY = state.currentConfig.slides[slideIdx].lines[lineIdx].y
  const containerHeight = container.clientHeight
  const scale = 1920 / containerHeight

  el.classList.add('dragging')

  function onMove(ev) {
    if (ev.cancelable) ev.preventDefault()
    const cy = isTouch ? ev.touches[0].clientY : ev.clientY
    const dy = cy - startY
    const realDy = dy * scale
    const newY = Math.max(0, Math.min(1920, Math.round(startLineY + realDy)))
    state.currentConfig.slides[slideIdx].lines[lineIdx].y = newY
    el.style.top = `${(newY / 1920) * 100}%`
    const input = document.querySelector(`.y-input[data-slide="${slideIdx}"][data-line="${lineIdx}"]`)
    if (input) input.value = newY
  }

  function onEnd() {
    el.classList.remove('dragging')
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onEnd)
    document.removeEventListener('touchmove', onMove)
    document.removeEventListener('touchend', onEnd)
  }

  document.addEventListener(isTouch ? 'touchmove' : 'mousemove', onMove, { passive: false })
  document.addEventListener(isTouch ? 'touchend' : 'mouseup', onEnd)
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// --- Build config from form ---
function buildConfig() {
  const cfg = state.currentConfig
  if (!cfg) throw new Error('Aucun script sélectionné')
  return {
    defaults: cfg.defaults,
    slides: cfg.slides.map((slide, slideIdx) => {
      const newSlide = { ...slide }
      newSlide.lines = slide.lines.map((line, lineIdx) => {
        const ta = document.querySelector(`textarea[data-slide="${slideIdx}"][data-line="${lineIdx}"]`)
        return { ...line, text: ta ? ta.value : line.text }
      })
      return newSlide
    }),
  }
}

// --- Generate ---
async function generate() {
  const name = $('#post-name').value.trim() || `post-${Date.now()}`
  const config = buildConfig()

  const status = $('#output-status')
  status.textContent = '⏳ Génération en cours...'
  status.className = 'loading'
  $('#output-grid').innerHTML = ''
  $('#output-actions').classList.add('hidden')
  $('#generate-btn').disabled = true

  try {
    const result = await api('/api/generate', { method: 'POST', body: { name, config } })
    state.lastGenerated = result
    renderOutput(result)
    status.textContent = `✓ ${result.slides.length} slides générés dans output/${result.name}/`
    status.className = 'success'
    $('#reroll-btn').disabled = false
    $('#output-actions').classList.remove('hidden')
    $('#output-path').textContent = `output/${result.name}/`
    toast('Slideshow généré ✓', 'success')
    loadHistory()
  } catch (err) {
    status.textContent = `❌ ${err.message}`
    status.className = 'error'
    toast(err.message, 'error', 4000)
  } finally {
    $('#generate-btn').disabled = false
  }
}

function renderOutput(result) {
  const grid = $('#output-grid')
  grid.innerHTML = ''
  for (const src of result.slides) {
    const img = document.createElement('img')
    img.src = src + '?t=' + Date.now()
    img.alt = src
    img.addEventListener('click', () => window.open(src, '_blank'))
    grid.appendChild(img)
  }
}

// --- History ---
async function loadHistory() {
  const list = await api('/api/output')
  const container = $('#history-list')
  container.innerHTML = ''
  if (!list.length) {
    container.innerHTML = '<p class="muted">Aucun slideshow généré pour le moment.</p>'
    return
  }
  for (const item of list.slice(0, 10)) {
    const row = document.createElement('div')
    row.className = 'history-row'
    const thumbs = item.slides.slice(0, 6).map(s => `<img src="${s}?t=${item.mtime}" alt="">`).join('')
    row.innerHTML = `
      <div class="history-thumbs">${thumbs}</div>
      <div class="history-name">${item.name}</div>
      <button data-name="${item.name}" class="open-btn secondary">📂 Ouvrir</button>
    `
    row.querySelector('.open-btn').addEventListener('click', () => openFolder(item.name))
    container.appendChild(row)
  }
}

async function openFolder(name) {
  try {
    await api('/api/open', { method: 'POST', body: { name } })
  } catch (err) {
    toast(err.message, 'error')
  }
}

// --- Init ---
window.addEventListener('DOMContentLoaded', async () => {
  $('#generate-btn').addEventListener('click', generate)
  $('#reroll-btn').addEventListener('click', () => {
    rerollAutoImages()
    generate()
  })
  $('#open-folder-btn').addEventListener('click', () => {
    if (state.lastGenerated) openFolder(state.lastGenerated.name)
  })
  $('#post-name').addEventListener('input', () => {
    $('#post-name').dataset.auto = ''
  })

  try {
    await loadLibrary()
    await loadHistory()
  } catch (err) {
    toast('Erreur chargement: ' + err.message, 'error', 5000)
  }
})
