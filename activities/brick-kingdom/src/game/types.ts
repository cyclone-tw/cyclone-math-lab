export type PlaceIndex = 0 | 1 | 2 | 3

export interface LevelDef {
  id: number
  name: string
  desc: string
  emoji: string
  gradient: string
  accent: string
}

export interface Problem {
  a: number
  b: number
  aDigits: [number, number, number, number]
  bDigits: [number, number, number, number]
  answerDigits: [number, number, number, number]
  borrowCount: number
  chainBorrow: boolean
}

export interface BorrowStep {
  from: PlaceIndex
  to: PlaceIndex
}

export type Screen = 'home' | 'play' | 'clear'

export type FeedbackKind = 'idle' | 'correct' | 'wrong' | 'hint'
