import type { LevelDef } from './types'

export const PLACE_SHORT = ['個', '十', '百', '千'] as const
export const PLACE_LABELS = ['個位', '十位', '百位', '千位'] as const

export const LEVELS: LevelDef[] = [
  {
    id: 1,
    name: '暖身村',
    desc: '不用借位，先熟悉直式',
    emoji: '🌱',
    gradient: 'linear-gradient(135deg, #34d399, #22c55e)',
    accent: '#059669',
  },
  {
    id: 2,
    name: '借位森林',
    desc: '只需要借位一次',
    emoji: '🌳',
    gradient: 'linear-gradient(135deg, #38bdf8, #3b82f6)',
    accent: '#0284c7',
  },
  {
    id: 3,
    name: '連借山谷',
    desc: '需要借位兩次以上',
    emoji: '⛰️',
    gradient: 'linear-gradient(135deg, #fbbf24, #f97316)',
    accent: '#d97706',
  },
  {
    id: 4,
    name: '跨零城堡',
    desc: '遇到 0 要連續借位',
    emoji: '🏰',
    gradient: 'linear-gradient(135deg, #e879f9, #a855f7)',
    accent: '#c026d3',
  },
  {
    id: 5,
    name: '混合競技場',
    desc: '什麼題型都會出現',
    emoji: '🏟️',
    gradient: 'linear-gradient(135deg, #fb7185, #ef4444)',
    accent: '#e11d48',
  },
]

export const QUESTIONS_PER_LEVEL = 5

export const PLACE_COLORS = ['#f59e0b', '#22c55e', '#3b82f6', '#a855f7'] as const
