import type { BorrowStep, PlaceIndex, Problem } from './types'

export function toDigits(n: number): [number, number, number, number] {
  return [
    n % 10,
    Math.floor(n / 10) % 10,
    Math.floor(n / 100) % 10,
    Math.floor(n / 1000) % 10,
  ]
}

function analyzeBorrows(a: number, b: number) {
  const aDigits = toDigits(a)
  const bDigits = toDigits(b)
  let borrowed = 0
  let borrowCount = 0
  let chain = false

  for (let h = 0; h < 4; h++) {
    if (aDigits[h] - borrowed < bDigits[h]) {
      borrowCount++
      if (h + 1 < 4 && aDigits[h + 1] === 0) chain = true
      borrowed = 1
    } else {
      borrowed = 0
    }
  }

  return { borrowCount, chain }
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function makeProblem(a: number, b: number): Problem {
  const { borrowCount, chain } = analyzeBorrows(a, b)
  return {
    a,
    b,
    aDigits: toDigits(a),
    bDigits: toDigits(b),
    answerDigits: toDigits(a - b),
    borrowCount,
    chainBorrow: chain,
  }
}

/** Reproduce original level filters from math-sub.gh.miniasp.com logic. */
export function generateProblem(levelId: number): Problem {
  for (let i = 0; i < 5000; i++) {
    const a = randInt(1200, 9999)
    const b =
      Math.random() < 0.75
        ? randInt(1000, a - 1)
        : randInt(100, Math.min(999, a - 1))
    if (b >= a) continue
    const problem = makeProblem(a, b)

    switch (levelId) {
      case 1:
        if (problem.borrowCount === 0 && b >= 1000) return problem
        break
      case 2:
        if (problem.borrowCount === 1 && !problem.chainBorrow) return problem
        break
      case 3:
        if (problem.borrowCount >= 2 && !problem.chainBorrow) return problem
        break
      case 4:
        if (problem.chainBorrow) return problem
        break
      case 5:
        if (problem.borrowCount >= 1) return problem
        break
      default:
        return problem
    }
  }

  return makeProblem(5432, 1234)
}

/** Walk the subtraction and list each borrow from higher place → lower place. */
export function listBorrowSteps(problem: Problem): BorrowStep[] {
  const steps: BorrowStep[] = []
  const d = [...problem.aDigits]

  for (let place = 0; place < 4; place++) {
    if (d[place] >= problem.bDigits[place]) {
      d[place] -= problem.bDigits[place]
      continue
    }

    let donor = place + 1
    while (donor < 4 && d[donor] === 0) donor++
    if (donor >= 4) break

    for (let p = donor; p > place; p--) {
      d[p] -= 1
      d[p - 1] += 10
      steps.push({ from: p as PlaceIndex, to: (p - 1) as PlaceIndex })
    }
    d[place] -= problem.bDigits[place]
  }

  return steps
}

export function starsForMistakes(mistakes: number): number {
  if (mistakes === 0) return 3
  if (mistakes <= 2) return 2
  return 1
}
