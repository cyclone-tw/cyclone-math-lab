const title = document.querySelector('#title')
const intro = document.querySelector('#intro')
const grid = document.querySelector('#grid')

const catalog = await fetch('./catalog.json').then((res) => {
  if (!res.ok) throw new Error('catalog')
  return res.json()
})

title.textContent = catalog.title || '數學練習室'
intro.textContent = catalog.intro || ''

const activities = Array.isArray(catalog.activities) ? catalog.activities : []
if (activities.length === 0) {
  grid.innerHTML = '<p class="empty">還沒有練習。</p>'
} else {
  for (const item of activities) {
    const card = document.createElement('a')
    card.className = 'card'
    card.href = item.href

    const img = document.createElement('img')
    img.className = 'thumb'
    img.src = item.thumb
    img.alt = ''
    card.append(img)

    const body = document.createElement('div')
    body.className = 'body'

    const tags = document.createElement('div')
    tags.className = 'tags'
    for (const tag of item.tags || []) {
      const chip = document.createElement('span')
      chip.className = 'tag'
      chip.textContent = tag
      tags.append(chip)
    }

    const heading = document.createElement('h2')
    heading.textContent = item.title

    const audience = document.createElement('span')
    audience.className = 'audience'
    audience.textContent = `適合 ${item.audience}`

    const learns = document.createElement('p')
    learns.className = 'learns'
    learns.textContent = `學習：${item.learns}`

    const summary = document.createElement('p')
    summary.className = 'summary'
    summary.textContent = item.summary

    const open = document.createElement('span')
    open.className = 'open'
    open.textContent = '開始練習 →'

    body.append(tags, heading, audience, learns, summary, open)
    card.append(body)
    grid.append(card)
  }
}
