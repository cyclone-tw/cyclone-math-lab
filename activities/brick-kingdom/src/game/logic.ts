import type { Problem } from './types'
import { generateProblem } from './generateProblem'

export type ColumnState = {
  lent: number
  got: number
  answer: number | null
}

export type QuestionResult = {
  problem: Problem
  stars: number
  mistakes: number
}

export const QUESTIONS_PER_LEVEL = 5
export const PLACE_SHORT = ['個', '十', '百', '千'] as const
export const PLACE_LABELS = ['個位', '十位', '百位', '千位'] as const
export const PLACE_COLORS = ['#facc15', '#4ade80', '#60a5fa', '#c084fc'] as const
export const VISUAL_PLACES = [3, 2, 1, 0] as const

export const SUCCESS_LINES = [
  '太棒了！你真是減法小天才！',
  '答對了！積木都聽你的話！',
  '好厲害！繼續保持！',
  '完美！貓頭鷹博士為你鼓掌！👏',
  '耶！又解開一題！',
]

export const FAIL_LINES = [
  '沒關係，再想一想！',
  '差一點點，再試一次！',
  '別急，看看 3D 積木提示！',
  '加油！你一定可以的！',
]

export function emptyColumns(): ColumnState[] {
  return Array.from({ length: 4 }, () => ({ lent: 0, got: 0, answer: null }))
}

export function valueAfterBorrow(digit: number, col: ColumnState) {
  return digit - col.lent + col.got * 10
}

/** Same gate as the original: current place if short, or a 0 that blocks a chain borrow. */
export function canBorrow(
  place: number,
  aDigits: number[],
  bDigits: number[],
  cols: ColumnState[],
  current: number,
): boolean {
  if (place < current || place > 3) return false
  const available = valueAfterBorrow(aDigits[place]!, cols[place]!)
  if (place === current) return available < bDigits[place]!
  return available === 0 && canBorrow(place - 1, aDigits, bDigits, cols, current)
}

export function starsForMistakes(mistakes: number) {
  if (mistakes === 0) return 3
  if (mistakes <= 2) return 2
  return 1
}

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!
}

export function newProblem(levelId: number) {
  return generateProblem(levelId)
}

export function blockCounts(problem: Problem, cols: ColumnState[]) {
  return [0, 1, 2, 3].map((place) => {
    const available = valueAfterBorrow(problem.aDigits[place]!, cols[place]!)
    return cols[place]!.answer !== null
      ? available - problem.bDigits[place]!
      : available
  })
}

const BEST_KEY = 'brick-kingdom-best'

export function loadBestStars(): Record<number, number> {
  try {
    const raw = JSON.parse(localStorage.getItem(BEST_KEY) || '{}') as Record<string, unknown>
    const out: Record<number, number> = {}
    for (const [key, value] of Object.entries(raw)) {
      const id = Number(key)
      if (!Number.isInteger(id) || id < 1 || id > 5 || typeof value !== 'number') continue
      out[id] = Math.min(15, Math.max(0, Math.round(value)))
    }
    return out
  } catch {
    return {}
  }
}

export function saveBestStars(levelId: number, stars: number, prev: Record<number, number>) {
  const next = { ...prev, [levelId]: Math.max(prev[levelId] ?? 0, stars) }
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify(next))
  } catch {
    /* ignore quota */
  }
  return next
}
