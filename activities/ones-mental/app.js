const Q_STEPS = [5, 10, 15, 20, 50]
const SUBJECTS = ['小勇', '小華', '阿強', '美美', '玲玲', '大大', '芳芳', '小傑', '阿龍', '欣欣']
const SUB_ACTIONS = ['吃掉了', '送給了朋友', '弄壞了', '用掉了', '不見了']
const ADD_ACTIONS = ['又拿到', '又買了', '又找到', '媽媽又給了', '又獲得']
const ITEMS = [
  { item: '蘋果', unit: '顆', emoji: '🍎' },
  { item: '餅乾', unit: '片', emoji: '🍪' },
  { item: '糖果', unit: '顆', emoji: '🍬' },
  { item: '玩具車', unit: '台', emoji: '🚗' },
]
const STICKERS = ['🐶', '🐱', '🐰', '🦊', '🐼', '🦄', '🌸', '🍕', '🎈']

const params = new URLSearchParams(location.search)
const op = params.get('op') === 'add' ? 'add' : 'sub'
const isAdd = op === 'add'

const state = {
  questions: [],
  index: 0,
  stars: 0,
  stickers: [],
  acted: 0,
  organized: false,
  visualsHidden: false,
  soundOn: true,
  voice: null,
  audio: null,
}

const $ = (id) => document.getElementById(id)

function applyModeChrome() {
  document.getElementById('app').dataset.op = op
  document.title = isAdd ? '個位數加法心算訓練器' : '個位數減法心算訓練器'
  $('title').textContent = isAdd ? '加法心算練習器' : '減法心算練習器'
  $('subtitle').textContent = isAdd ? '特教視覺化加法學習輔具' : '特教視覺化減法學習輔具'
  $('mascot').textContent = isAdd ? '🦊' : '🐰'
  $('welcome-icon').textContent = isAdd ? '➕' : '🧩'
  $('welcome-title').textContent = isAdd ? '歡迎來到加法心算訓練器！' : '歡迎來到減法心算訓練器！'
  $('welcome-lead').textContent = isAdd
    ? '看圖點一點 · 加上算一算 · 輕鬆學加法'
    : '看圖點一點 · 扣掉算一算 · 輕鬆學減法'
  $('range-hint').textContent = isAdd
    ? '系統自動確保合計不超過 10'
    : '系統自動確保不會減出負數'
  $('label-a').textContent = isAdd ? '原本有的（加數一）' : '原本有的（被減數）'
  $('label-b').textContent = isAdd ? '後來加上的（加數二）' : '要拿走的（減數）'
  $('visual-tip').textContent = isAdd
    ? '提示：點擊虛線空位，把後來加上的物品放進來喔！'
    : '提示：點擊物品打叉叉（扣掉它）喔！'
  $('math-lead').textContent = isAdd ? '算一算，一共有多少呢？' : '算一算，剩下多少呢？'
  $('f-op').textContent = isAdd ? '＋' : '−'
}

function alertMsg(message) {
  $('alert-msg').textContent = message
  $('modal-alert').hidden = false
}

function tone(type) {
  if (!state.soundOn) return
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return
  if (!state.audio) state.audio = new Ctx()
  const ctx = state.audio
  if (ctx.state === 'suspended') void ctx.resume()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  if (type === 'ok') {
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(440, ctx.currentTime)
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
  } else if (type === 'bad') {
    osc.type = 'square'
    osc.frequency.setValueAtTime(260, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.25)
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.25)
    osc.start()
    osc.stop(ctx.currentTime + 0.25)
  } else {
    osc.type = 'triangle'
    const f = type === 'down' ? 320 : 420
    osc.frequency.setValueAtTime(f, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(type === 'down' ? 180 : 560, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08)
    osc.start()
    osc.stop(ctx.currentTime + 0.08)
  }
}

function rand(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function generateQuestions(count, aMin, aMax, bMin, bMax, unique) {
  const combos = []
  for (let a = aMin; a <= aMax; a++) {
    for (let b = bMin; b <= bMax; b++) {
      if (isAdd) {
        if (a + b <= 10 && b > 0) combos.push({ a, b })
      } else if (a >= b && b > 0) {
        combos.push({ a, b })
      }
    }
  }
  combos.sort(() => Math.random() - 0.5)
  const target = unique ? Math.min(count, combos.length) : count
  const out = []
  let i = 0
  while (out.length < target && combos.length) {
    const combo = unique ? combos[i++] : combos[Math.floor(Math.random() * combos.length)]
    if (!combo) break
    const item = rand(ITEMS)
    out.push({
      ...combo,
      subject: rand(SUBJECTS),
      action: rand(isAdd ? ADD_ACTIONS : SUB_ACTIONS),
      ...item,
      answer: isAdd ? combo.a + combo.b : combo.a - combo.b,
    })
  }
  return out
}

function storyText(q) {
  return isAdd
    ? `${q.subject}有 ${q.a} ${q.unit}${q.item}，${q.action} ${q.b} ${q.unit}，現在一共有幾${q.unit}？`
    : `${q.subject}有 ${q.a} ${q.unit}${q.item}，${q.action} ${q.b} ${q.unit}，現在剩下幾${q.unit}？`
}

function syncRangePair(minEl, maxEl, minLabel, maxLabel) {
  const sync = (fromMin) => {
    let min = Number(minEl.value)
    let max = Number(maxEl.value)
    if (fromMin && min > max) {
      max = min
      maxEl.value = String(max)
    }
    if (!fromMin && max < min) {
      min = max
      minEl.value = String(min)
    }
    minLabel.textContent = String(min)
    maxLabel.textContent = String(max)
  }
  minEl.addEventListener('input', () => sync(true))
  maxEl.addEventListener('input', () => sync(false))
  sync(true)
}

function updateInstruction() {
  const q = state.questions[state.index]
  const left = q.b - state.acted
  const badge = $('instruction-badge')
  if (left > 0) {
    badge.textContent = isAdd ? `請點擊加上 ${left} 個` : `請點擊拿走 ${left} 個`
    badge.className = 'badge'
  } else if (!isAdd && !state.organized) {
    badge.textContent = '扣除完成！可按「重新整理圖卡」'
    badge.className = 'badge done'
  } else {
    badge.textContent = isAdd ? '加好了！請數數看一共幾個？' : '整理好囉！請數數看剩下幾個？'
    badge.className = 'badge ready'
  }
  $('btn-reorder').hidden = isAdd || state.acted < q.b || state.organized
}

function renderItems() {
  const q = state.questions[state.index]
  const grid = $('item-grid')
  grid.innerHTML = ''
  state.acted = 0
  state.organized = false

  if (isAdd) {
    for (let i = 0; i < q.a; i++) {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'item added'
      el.innerHTML = `<span class="emoji">${q.emoji}</span>`
      el.disabled = true
      grid.append(el)
    }
    for (let i = 0; i < q.b; i++) {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'item ghost'
      el.dataset.slot = '1'
      el.innerHTML = `<span class="emoji">＋</span>`
      el.addEventListener('click', () => {
        if (el.classList.contains('added')) {
          el.classList.remove('added')
          el.classList.add('ghost')
          el.innerHTML = `<span class="emoji">＋</span>`
          state.acted = Math.max(0, state.acted - 1)
          tone('up')
        } else if (state.acted < q.b) {
          el.classList.remove('ghost')
          el.classList.add('added')
          el.innerHTML = `<span class="emoji">${q.emoji}</span>`
          state.acted += 1
          tone('up')
        }
        updateInstruction()
      })
      grid.append(el)
    }
  } else {
    for (let i = 0; i < q.a; i++) {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'item'
      el.innerHTML = `
        <span class="emoji">${q.emoji}</span>
        <span class="x">✕</span>
        <span class="ord"></span>
      `
      el.addEventListener('click', () => {
        if (!el.classList.contains('taken')) {
          if (state.acted >= q.b) {
            updateInstruction()
            return
          }
          el.classList.add('taken')
          state.acted += 1
          el.querySelector('.ord').textContent = String(state.acted)
          tone('down')
        } else {
          el.classList.remove('taken')
          state.acted -= 1
          state.organized = false
          renumberTaken()
          tone('up')
        }
        updateInstruction()
      })
      grid.append(el)
    }
  }
  updateInstruction()
}

function renumberTaken() {
  let n = 1
  for (const el of $('item-grid').querySelectorAll('.item.taken')) {
    el.querySelector('.ord').textContent = String(n++)
  }
}

function reorderCards() {
  const grid = $('item-grid')
  const cards = [...grid.children]
  const kept = cards.filter((c) => !c.classList.contains('taken'))
  const taken = cards.filter((c) => c.classList.contains('taken'))
  grid.innerHTML = ''
  ;[...kept, ...taken].forEach((c) => grid.append(c))
  state.organized = true
  updateInstruction()
}

function renderKeypad(answer) {
  const pad = $('keypad')
  pad.innerHTML = ''
  for (let n = 0; n <= 10; n++) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.textContent = String(n)
    btn.addEventListener('click', () => {
      const q = state.questions[state.index]
      if (state.acted < q.b) {
        alertMsg(isAdd ? '請先在畫面上點擊空位，把要加上的數量放進來喔！' : '請先在畫面上點擊圖案，把該拿走的數量扣掉喔！')
        return
      }
      checkAnswer(n, answer)
    })
    pad.append(btn)
  }
}

function checkAnswer(selected, answer) {
  const box = $('f-result')
  if (selected === answer) {
    box.textContent = String(selected)
    box.classList.add('ok')
    tone('ok')
    state.stars += 1
    $('star-count').textContent = String(state.stars)
    const sticker = rand(STICKERS)
    state.stickers.push(sticker)
    $('sticker-count').textContent = String(state.stickers.length)
    $('new-sticker').textContent = sticker
    window.setTimeout(() => {
      $('modal-success').hidden = false
    }, 280)
  } else {
    tone('bad')
    box.textContent = '？'
    box.classList.remove('ok')
    $('btn-hint').classList.add('warn')
    window.setTimeout(() => $('btn-hint').classList.remove('warn'), 1200)
  }
}

function loadQuestion(index) {
  state.index = index
  const q = state.questions[index]
  $('progress').textContent = `第 ${index + 1} / ${state.questions.length} 題`
  $('story-emoji').textContent = q.emoji
  $('story-text').textContent = storyText(q)
  $('visual-label').textContent = isAdd
    ? `原本 ${q.a} 個，要再加上 ${q.b} 個`
    : `原本有的 (${q.a})`
  $('f-a').textContent = String(q.a)
  $('f-b').textContent = String(q.b)
  $('f-result').textContent = '？'
  $('f-result').classList.remove('ok')
  $('unit-question').textContent = isAdd
    ? `現在一共有幾${q.unit}？`
    : `現在剩下幾${q.unit}？`
  renderItems()
  renderKeypad(q.answer)
  if (state.visualsHidden) {
    state.visualsHidden = false
    toggleVisuals()
  }
}

function startGame() {
  const count = Q_STEPS[Number($('q-count').value)]
  const questions = generateQuestions(
    count,
    Number($('a-min').value),
    Number($('a-max').value),
    Number($('b-min').value),
    Number($('b-max').value),
    $('unique').checked,
  )
  if (!questions.length) {
    alertMsg(
      isAdd
        ? '目前設定無法產生題目，請調整數字範圍，讓兩數相加不超過 10。'
        : '目前設定無法產生題目，請確保「原本有的數量」大於或等於「要拿走的數量」。',
    )
    return
  }
  state.questions = questions
  state.index = 0
  state.stars = 0
  state.stickers = []
  $('star-count').textContent = '0'
  $('sticker-count').textContent = '0'
  $('screen-home').hidden = true
  $('screen-game').hidden = false
  $('btn-home').hidden = false
  loadQuestion(0)
}

function readStory() {
  if (!('speechSynthesis' in window)) return
  const q = state.questions[state.index]
  if (!q) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(storyText(q))
  utter.lang = 'zh-TW'
  utter.rate = 0.9
  if (state.voice) utter.voice = state.voice
  window.speechSynthesis.speak(utter)
}

function populateVoices() {
  if (!('speechSynthesis' in window)) return
  const select = $('voice-select')
  const voices = window.speechSynthesis.getVoices()
  select.innerHTML = ''
  let preferred = null
  for (const voice of voices) {
    const opt = document.createElement('option')
    opt.value = voice.name
    opt.textContent = `${voice.name} (${voice.lang})`
    select.append(opt)
    if (!preferred && voice.lang.includes('zh-TW')) preferred = voice
  }
  if (preferred) {
    state.voice = preferred
    select.value = preferred.name
  }
}

function toggleVisuals() {
  state.visualsHidden = !state.visualsHidden
  $('visual-area').hidden = state.visualsHidden
  $('btn-toggle-visuals').textContent = state.visualsHidden ? '👁 顯示圖卡' : '👁 隱藏圖卡'
}

function exportWord(list) {
  const questions = list?.length
    ? list
    : generateQuestions(10, 2, 10, 1, 9, true)
  if (!questions.length) {
    alertMsg('無題目可匯出。')
    return
  }
  const title = isAdd ? '加法小天地 ‧ 數學學習單' : '減法小天地 ‧ 數學學習單'
  const tip = isAdd
    ? '請把「後來加上的」物品也畫進來，再數數看一共有幾個。'
    : '畫面上已經把「被拿走的」物品打叉，請數數看還剩下幾個。'
  let rows = ''
  questions.forEach((q, idx) => {
    let cells = ''
    const total = isAdd ? q.a + q.b : q.a
    for (let i = 1; i <= total; i++) {
      const crossed = !isAdd && i > q.a - q.b
      const added = isAdd && i > q.a
      cells += `<td style="width:42px;height:42px;text-align:center;border:1px solid ${
        crossed ? '#fca5a5' : added ? '#86efac' : '#93c5fd'
      };background:${crossed ? '#fee2e2' : added ? '#ecfdf5' : '#fff'};">${
        crossed ? '✕' : ''
      }${q.emoji}</td>`
      if (i % 5 === 0) cells += '</tr><tr>'
    }
    const opMark = isAdd ? '＋' : '－'
    const ask = isAdd ? `一共有幾${q.unit}` : `剩下幾${q.unit}`
    rows += `<tr><td style="padding:10px 0;"><div style="border:2px solid #a5b4fc;border-radius:12px;padding:10px;background:#eef2ff;">
      <div style="font-weight:bold;margin-bottom:8px;">${idx + 1}. ${storyText(q)}</div>
      <table><tr>${cells}</tr></table>
      <div style="margin-top:8px;font-size:16pt;font-weight:bold;">${q.a} ${opMark} ${q.b} ＝ （　　）　答：${ask}</div>
    </div></td></tr>`
  })
  const html = `<html><head><meta charset="utf-8"><title>${title}</title></head><body>
    <h1 style="text-align:center;color:#4f46e5;">${title}</h1>
    <p style="text-align:center;">班級：________ 姓名：____________</p>
    <p style="background:#dbeafe;padding:8px;border-radius:8px;">💡 ${tip}</p>
    <table width="100%">${rows}</table>
  </body></html>`
  const blob = new Blob(['\ufeff' + html], { type: 'application/msword' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${isAdd ? '加法' : '減法'}心算學習單(${questions.length}題).doc`
  a.click()
  URL.revokeObjectURL(url)
}

function wire() {
  applyModeChrome()
  syncRangePair($('a-min'), $('a-max'), $('a-min-v'), $('a-max-v'))
  syncRangePair($('b-min'), $('b-max'), $('b-min-v'), $('b-max-v'))

  $('q-count').addEventListener('input', () => {
    $('q-count-label').textContent = `${Q_STEPS[Number($('q-count').value)]} 題`
  })

  $('btn-start').addEventListener('click', startGame)
  $('btn-home').addEventListener('click', () => {
    $('screen-game').hidden = true
    $('screen-home').hidden = false
    $('btn-home').hidden = true
  })
  $('btn-export-home').addEventListener('click', () => exportWord())
  $('btn-export-game').addEventListener('click', () => exportWord(state.questions))
  $('btn-read').addEventListener('click', readStory)
  $('btn-toggle-visuals').addEventListener('click', toggleVisuals)
  $('btn-reorder').addEventListener('click', reorderCards)
  $('btn-next').addEventListener('click', () => {
    if (state.index < state.questions.length - 1) loadQuestion(state.index + 1)
    else $('btn-home').click()
  })
  $('btn-modal-next').addEventListener('click', () => {
    $('modal-success').hidden = true
    $('btn-next').click()
  })
  $('btn-close-alert').addEventListener('click', () => {
    $('modal-alert').hidden = true
  })
  $('btn-hint').addEventListener('click', () => {
    const q = state.questions[state.index]
    if (state.acted < q.b) {
      if (isAdd) {
        const slot = $('item-grid').querySelector('.item.ghost')
        slot?.click()
      } else {
        const card = [...$('item-grid').querySelectorAll('.item:not(.taken)')].at(-1)
        card?.click()
      }
    } else {
      alertMsg(isAdd ? '你已經加好正確數量囉！數一數一共幾個，再點下方數字。' : '你已經扣掉正確數量囉！數一數剩下幾個，再點下方數字。')
    }
  })
  $('btn-settings').addEventListener('click', () => {
    populateVoices()
    $('modal-settings').hidden = false
  })
  $('btn-close-settings').addEventListener('click', () => {
    $('modal-settings').hidden = true
  })
  $('btn-save-settings').addEventListener('click', () => {
    if ('speechSynthesis' in window) {
      state.voice = window.speechSynthesis.getVoices().find((v) => v.name === $('voice-select').value) || state.voice
    }
    $('modal-settings').hidden = true
  })
  $('btn-sound').addEventListener('click', () => {
    state.soundOn = !state.soundOn
    $('btn-sound').textContent = state.soundOn ? '已開啟' : '已關閉'
    $('btn-sound').classList.toggle('on', state.soundOn)
  })
  $('btn-stickers').addEventListener('click', () => {
    const grid = $('sticker-grid')
    grid.innerHTML = ''
    if (!state.stickers.length) {
      grid.innerHTML = '<p style="grid-column:1/-1;color:#94a3b8;font-weight:800;">答對題目就能獲得貼紙喔！</p>'
    } else {
      state.stickers.forEach((s) => {
        const d = document.createElement('div')
        d.textContent = s
        grid.append(d)
      })
    }
    $('modal-stickers').hidden = false
  })
  $('btn-close-stickers').addEventListener('click', () => {
    $('modal-stickers').hidden = true
  })

  if ('speechSynthesis' in window) {
    populateVoices()
    window.speechSynthesis.onvoiceschanged = populateVoices
  }
}

wire()
