import { useEffect, useMemo, useRef, useState } from 'react'
import { LEVELS } from '../game/levels'
import {
  FAIL_LINES,
  PLACE_COLORS,
  PLACE_LABELS,
  PLACE_SHORT,
  QUESTIONS_PER_LEVEL,
  SUCCESS_LINES,
  VISUAL_PLACES,
  blockCounts,
  canBorrow,
  emptyColumns,
  newProblem,
  pick,
  starsForMistakes,
  valueAfterBorrow,
  type ColumnState,
  type QuestionResult,
} from '../game/logic'
import type { Problem } from '../game/types'
import { sfx } from '../sound'
import { BlockWorld } from './BlockWorld'

const OWL = { happy: '🦉', think: '🤔', sad: '😅', party: '🥳' } as const
type Mood = keyof typeof OWL
type Focus = 'all' | 0 | 1 | 2 | 3

interface PlayScreenProps {
  levelId: number
  muted: boolean
  onToggleMute: () => void
  onQuit: () => void
  onFinish: (results: QuestionResult[], score: number) => void
}

export function PlayScreen({ levelId, muted, onToggleMute, onQuit, onFinish }: PlayScreenProps) {
  const level = LEVELS.find((item) => item.id === levelId)!
  const [qIndex, setQIndex] = useState(0)
  const [problem, setProblem] = useState<Problem>(() => newProblem(levelId))
  const [cols, setCols] = useState<ColumnState[]>(emptyColumns)
  const [current, setCurrent] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [streak, setStreak] = useState(0)
  const [score, setScore] = useState(0)
  const [results, setResults] = useState<QuestionResult[]>([])
  const [message, setMessage] = useState('我們從個位開始算！看看個位的積木夠不夠減？')
  const [mood, setMood] = useState<Mood>('happy')
  const [shakeCol, setShakeCol] = useState<number | null>(null)
  const [focus, setFocus] = useState<Focus>('all')
  const [done, setDone] = useState(false)
  const [help, setHelp] = useState(false)
  const [confetti, setConfetti] = useState(false)
  const advanceTimer = useRef<number | null>(null)
  const handlers = useRef({ onDigit: (_n: number) => {}, help: false })

  useEffect(() => {
    const timer = window.setTimeout(() => setFocus(0), 1400)
    return () => window.clearTimeout(timer)
  }, [problem])

  useEffect(() => {
    return () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current)
    }
  }, [])

  const counts = useMemo(() => blockCounts(problem, cols), [problem, cols])
  const borrowable = (place: number) =>
    !done && current <= 3 && canBorrow(place, problem.aDigits, problem.bDigits, cols, current)

  function shake(place: number) {
    setShakeCol(place)
    window.setTimeout(() => setShakeCol(null), 450)
  }

  function finishQuestion(lastPoints: number) {
    setDone(true)
    setFocus('all')
    setMood('party')
    setConfetti(true)
    sfx.win()
    const stars = starsForMistakes(mistakes)
    const bonus = stars * 20
    const nextScore = score + lastPoints + bonus
    setScore(nextScore)
    setMessage(
      `${pick(SUCCESS_LINES)} ${problem.a} − ${problem.b} = ${problem.a - problem.b}！獲得 ${'⭐'.repeat(stars)}`,
    )
    const nextResults = [...results, { problem, stars, mistakes }]
    setResults(nextResults)
    advanceTimer.current = window.setTimeout(() => {
      setConfetti(false)
      if (qIndex + 1 >= QUESTIONS_PER_LEVEL) {
        onFinish(nextResults, nextScore)
        return
      }
      setQIndex((n) => n + 1)
      setProblem(newProblem(levelId))
      setCols(emptyColumns())
      setCurrent(0)
      setMistakes(0)
      setStreak(0)
      setDone(false)
      setMood('happy')
      setFocus('all')
      setMessage('新的題目來了！一樣從個位開始，看看夠不夠減？')
    }, 3200)
  }

  function borrow(place: number) {
    if (!borrowable(place)) return
    const donor = place + 1
    if (valueAfterBorrow(problem.aDigits[donor]!, cols[donor]!) === 0) {
      sfx.wrong()
      setMood('think')
      setFocus(donor as Focus)
      setMessage(
        `${PLACE_LABELS[donor]}是 0，一個積木都沒有，沒辦法借！要先請${PLACE_LABELS[donor]}向${PLACE_LABELS[donor + 1]}借 1。`,
      )
      return
    }
    sfx.borrow()
    const next = cols.map((col) => ({ ...col }))
    next[donor]!.lent += 1
    next[place]!.got += 1
    setCols(next)
    setFocus(place as Focus)
    setMood('happy')
    const now = valueAfterBorrow(problem.aDigits[place]!, next[place]!)
    setMessage(
      `${PLACE_LABELS[donor]}借 1 給${PLACE_LABELS[place]}：1 個「${PLACE_SHORT[donor]}」拆成 10 個「${PLACE_SHORT[place]}」！${PLACE_LABELS[place]}現在有 ${now} 個。` +
        (place === current
          ? `算算看 ${now} − ${problem.bDigits[place]} 是多少？`
          : `接著繼續幫${PLACE_LABELS[place - 1]}借位吧！`),
    )
  }

  function onDigit(digit: number) {
    if (done || current > 3) return
    sfx.tap()
    const available = valueAfterBorrow(problem.aDigits[current]!, cols[current]!)
    const sub = problem.bDigits[current]!
    if (available < sub) {
      sfx.wrong()
      shake(current)
      setMood('think')
      setMessage(
        `${PLACE_LABELS[current]}只有 ${available} 個，比 ${sub} 小，不夠減！先按「← 借 1」向${PLACE_LABELS[current + 1]}借吧。`,
      )
      return
    }
    const answer = available - sub
    if (digit === answer) {
      sfx.correct()
      const next = cols.map((col) => ({ ...col }))
      next[current]!.answer = digit
      setCols(next)
      const points = streak === 0 ? 10 : 5
      setScore((s) => s + points)
      setStreak(0)
      if (current === 3) {
        setCurrent(4)
        window.setTimeout(() => finishQuestion(points), 300)
        return
      }
      const nextPlace = current + 1
      setCurrent(nextPlace)
      setFocus(nextPlace as Focus)
      setMood('happy')
      const nextAvailable = valueAfterBorrow(problem.aDigits[nextPlace]!, next[nextPlace]!)
      const nextSub = problem.bDigits[nextPlace]!
      setMessage(
        `${PLACE_LABELS[current]}答對了！${available} − ${sub} = ${answer}。` +
          (nextAvailable < nextSub
            ? `接著看${PLACE_LABELS[nextPlace]}：${nextAvailable} 比 ${nextSub} 小，不夠減喔，需要借位！`
            : `接著看${PLACE_LABELS[nextPlace]}：${nextAvailable} − ${nextSub} 是多少？`),
      )
      return
    }
    sfx.wrong()
    shake(current)
    setMistakes((n) => n + 1)
    const nextStreak = streak + 1
    setStreak(nextStreak)
    setMood('sad')
    setMessage(
      nextStreak >= 3
        ? `${pick(FAIL_LINES)} 提示：${PLACE_LABELS[current]}有 ${available} 個積木，拿走 ${sub} 個，剩下 ${answer} 個。按看看 ${answer}！`
        : `${pick(FAIL_LINES)} 看 3D 積木：${PLACE_LABELS[current]}有 ${available} 個，要拿走 ${sub} 個，還剩幾個呢？`,
    )
  }

  const hintDigit =
    streak >= 3 && current <= 3
      ? valueAfterBorrow(problem.aDigits[current]!, cols[current]!) - problem.bDigits[current]!
      : null

  handlers.current = { onDigit, help }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (handlers.current.help) {
        if (event.key === 'Escape') setHelp(false)
        return
      }
      if (event.key.length === 1 && event.key >= '0' && event.key <= '9') {
        event.preventDefault()
        handlers.current.onDigit(Number(event.key))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const activeValue = current <= 3 ? valueAfterBorrow(problem.aDigits[current]!, cols[current]!) : 0

  return (
    <div className="play-shell">
      {confetti && <Confetti />}
      <header className="play-header">
        <button type="button" className="pill" onClick={onQuit}>
          ← 回主選單
        </button>
        <div className="play-header-right">
          <span className="level-pill" style={{ backgroundImage: level.gradient }}>
            {level.emoji} {level.name}
          </span>
          <div className="progress-pill">
            {Array.from({ length: QUESTIONS_PER_LEVEL }, (_, i) => (
              <span
                key={i}
                className={`dot ${i < results.length ? 'done' : i === qIndex ? 'now' : ''}`}
              />
            ))}
            <span>
              第 {qIndex + 1}/{QUESTIONS_PER_LEVEL} 題
            </span>
          </div>
          <span className="score-pill" aria-label={`目前分數 ${score} 分`}>
            🏆 {score}
          </span>
          <button type="button" className="pill icon" onClick={onToggleMute} aria-pressed={muted}>
            {muted ? '🔇' : '🔊'}
          </button>
          <button type="button" className="pill icon help" onClick={() => setHelp(true)} aria-label="玩法說明">
            ？
          </button>
        </div>
      </header>

      <main className="play-main">
        <div className="scene-column">
          <div className="view-switch">
            <button type="button" className={focus === 'all' ? 'on' : ''} onClick={() => setFocus('all')}>
              🔭 全景
            </button>
            {VISUAL_PLACES.map((place) => (
              <button
                key={place}
                type="button"
                className={focus === place ? 'on' : ''}
                style={{ background: PLACE_COLORS[place] }}
                onClick={() => setFocus(place)}
              >
                {PLACE_SHORT[place]}位
              </button>
            ))}
          </div>
          <BlockWorld
            counts={counts}
            activePlace={current <= 3 ? current : null}
            focus={focus}
            equation={
              current <= 3 && !done ? `${PLACE_LABELS[current]}  ${activeValue} − ${problem.bDigits[current]} = ?` : null
            }
          />
        </div>

        <div className="panel-column">
          <div className={`owl mood-${mood}`}>
            <div className="owl-face" aria-hidden>
              {OWL[mood]}
            </div>
            <div className="owl-bubble" role="status">
              <span className="owl-name">貓頭鷹博士：</span>
              {message}
            </div>
          </div>

          <Worksheet
            problem={problem}
            cols={cols}
            current={current}
            shakeCol={shakeCol}
            borrowable={borrowable}
            onBorrow={borrow}
          />

          <div className="keypad-card">
            <div className="keypad-head">
              <span>{current <= 3 ? `請填${PLACE_LABELS[current]}的答案` : '全部完成！'}</span>
              {mistakes > 0 && <span className="miss">錯誤 {mistakes} 次</span>}
            </div>
            <div className="keypad" role="group" aria-label="答案數字鍵盤，也可以用實體鍵盤的數字鍵作答">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={done || current > 3}
                  className={hintDigit === n ? 'hint' : ''}
                  onClick={() => onDigit(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {help && (
        <div className="modal-back" onClick={() => setHelp(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="help-title">借位小秘訣 💡</h2>
            <ul>
              <li>
                1️⃣ 從<b>個位</b>開始，往左一位一位算。
              </li>
              <li>
                2️⃣ 上面的數字比下面小 → <b className="rose">不夠減</b>，要向左邊借 1。
              </li>
              <li>3️⃣ 借 1 之後：左邊少 1，自己多 10（1 個十 = 10 個一）。</li>
              <li>
                4️⃣ 如果左邊是 <b>0</b>，它自己也要先向更左邊借！
              </li>
              <li>5️⃣ 3D 積木會即時顯示每一位還有幾個，數一數就知道答案。</li>
            </ul>
            <button type="button" className="modal-ok" onClick={() => setHelp(false)}>
              我知道了！
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Worksheet({
  problem,
  cols,
  current,
  shakeCol,
  borrowable,
  onBorrow,
}: {
  problem: Problem
  cols: ColumnState[]
  current: number
  shakeCol: number | null
  borrowable: (place: number) => boolean
  onBorrow: (place: number) => void
}) {
  return (
    <div className="sheet">
      <div className="sheet-grid">
        <div />
        {VISUAL_PLACES.map((place) => (
          <div key={place} className="place-tag" style={{ background: PLACE_COLORS[place] }}>
            {PLACE_SHORT[place]}位
          </div>
        ))}

        <div />
        {VISUAL_PLACES.map((place) => {
          const col = cols[place]!
          const showBorrow = place < 3 && borrowable(place)
          return (
            <div key={place} className="borrow-cell">
              {showBorrow && (
                <button type="button" className="borrow-btn" onClick={() => onBorrow(place)}>
                  ← 借 1
                </button>
              )}
              {col.lent > 0 && (
                <span className="lent-num">{valueAfterBorrow(problem.aDigits[place]!, col)}</span>
              )}
            </div>
          )
        })}

        <div />
        {VISUAL_PLACES.map((place) => {
          const col = cols[place]!
          return (
            <div key={place} className={`top-digit ${current === place ? 'hot' : ''}`}>
              {col.got > 0 && <span className="got-one">1</span>}
              <span className={col.lent > 0 ? 'struck' : ''}>{problem.aDigits[place]}</span>
              {col.got > 0 && (
                <span className="got-badge">= {valueAfterBorrow(problem.aDigits[place]!, col)}</span>
              )}
            </div>
          )
        })}

        <div className="minus">−</div>
        {VISUAL_PLACES.map((place) => (
          <div key={place} className="bot-digit">
            {place === 3 && problem.b < 1000 ? '' : problem.bDigits[place]}
          </div>
        ))}

        <div className="rule" />

        <div />
        {VISUAL_PLACES.map((place) => {
          const col = cols[place]!
          const active = place === current
          return (
            <div
              key={place}
              className={`ans ${col.answer !== null ? 'ok' : active ? 'ask' : 'wait'} ${
                shakeCol === place ? 'shake' : ''
              }`}
            >
              {col.answer !== null ? col.answer : active ? '?' : ''}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Confetti() {
  const bits = useMemo(
    () =>
      Array.from({ length: 70 }, (_, id) => ({
        id,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 1.8 + Math.random() * 1.4,
        color: ['#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#facc15'][id % 6],
        size: 6 + Math.random() * 8,
        round: Math.random() > 0.5,
      })),
    [],
  )
  return (
    <div className="confetti" aria-hidden>
      {bits.map((bit) => (
        <span
          key={bit.id}
          style={{
            left: `${bit.left}%`,
            width: bit.size,
            height: bit.round ? bit.size : bit.size * 0.5,
            background: bit.color,
            borderRadius: bit.round ? '50%' : 2,
            animationDelay: `${bit.delay}s`,
            animationDuration: `${bit.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
