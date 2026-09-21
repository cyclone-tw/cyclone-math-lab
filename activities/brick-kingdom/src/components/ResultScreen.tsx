import { LEVELS } from '../game/levels'
import type { QuestionResult } from '../game/logic'

interface ResultScreenProps {
  levelId: number
  results: QuestionResult[]
  score: number
  onReplay: () => void
  onNext: () => void
  onHome: () => void
}

export function ResultScreen({ levelId, results, score, onReplay, onNext, onHome }: ResultScreenProps) {
  const stars = results.reduce((sum, item) => sum + item.stars, 0)
  const max = results.length * 3
  const ratio = max === 0 ? 0 : stars / max
  const title = ratio === 1 ? '完美通關！減法大師！' : ratio >= 0.7 ? '太棒了！你越來越厲害！' : '完成挑戰！再練習會更好！'
  const icon = ratio === 1 ? '🏆' : ratio >= 0.7 ? '🎉' : '💪'
  const level = LEVELS.find((item) => item.id === levelId)!
  const next = LEVELS.find((item) => item.id === levelId + 1)

  return (
    <main className="result">
      <div className="result-card">
        <div className="result-icon">{icon}</div>
        <h1>{title}</h1>
        <p>
          {level.emoji} {level.name} · 完成 {results.length} 題
        </p>
        <div className="result-stats">
          <div>
            <span>獲得星星</span>
            <strong>
              ⭐ {stars}/{max}
            </strong>
          </div>
          <div>
            <span>總分</span>
            <strong>🏆 {score}</strong>
          </div>
        </div>
        <div className="result-list">
          {results.map((item, index) => (
            <div key={index}>
              <span>
                {index + 1}. {item.problem.a} − {item.problem.b} = {item.problem.a - item.problem.b}
              </span>
              <span>
                {'⭐'.repeat(item.stars)}
                {item.mistakes > 0 ? `　錯 ${item.mistakes}` : ''}
              </span>
            </div>
          ))}
        </div>
        <div className="result-actions">
          <button type="button" onClick={onReplay}>
            再玩一次
          </button>
          {next && (
            <button type="button" className="next" style={{ backgroundImage: next.gradient }} onClick={onNext}>
              {next.emoji} 挑戰下一關
            </button>
          )}
          <button type="button" className="home" onClick={onHome}>
            🏠 回主選單
          </button>
        </div>
      </div>
    </main>
  )
}
