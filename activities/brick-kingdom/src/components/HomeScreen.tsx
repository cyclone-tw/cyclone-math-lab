import { LEVELS } from '../game/levels'

const LEGEND = [
  { place: 3, name: '千', shape: '大立方體', icon: '🧊', eq: '1 千 = 10 百', color: '#c084fc' },
  { place: 2, name: '百', shape: '平板', icon: '🟦', eq: '1 百 = 10 十', color: '#60a5fa' },
  { place: 1, name: '十', shape: '長條', icon: '📏', eq: '1 十 = 10 個', color: '#4ade80' },
  { place: 0, name: '個', shape: '小方塊', icon: '🎲', eq: '最小的積木', color: '#facc15' },
]

interface HomeScreenProps {
  best: Record<number, number>
  onStart: (levelId: number) => void
}

export function HomeScreen({ best, onStart }: HomeScreenProps) {
  return (
    <main className="home">
      <div className="home-hero">
        <div className="hero-icons">
          <span>🧱</span>
          <span>🦉</span>
          <span>🏰</span>
        </div>
        <h1>積木王國：4 位數減法大冒險</h1>
        <p>用 3D 積木看懂「借位」，一起打敗減法大魔王！</p>
      </div>

      <div className="legend">
        {LEGEND.map((item) => (
          <div key={item.place} className="legend-card">
            <div className="legend-icon" style={{ background: item.color }}>
              {item.icon}
            </div>
            <div>
              <div className="legend-name">
                {item.name}位 · {item.shape}
              </div>
              <div className="legend-eq">{item.eq}</div>
            </div>
          </div>
        ))}
      </div>

      <h2>選擇關卡 🗺️</h2>
      <div className="level-grid">
        {LEVELS.map((level) => {
          const stars = best[level.id] ?? 0
          return (
            <button
              key={level.id}
              type="button"
              className="level-card"
              style={{ backgroundImage: level.gradient }}
              onClick={() => onStart(level.id)}
            >
              <span className="level-watermark">{level.emoji}</span>
              <span className="level-kicker">第 {level.id} 關</span>
              <strong>
                {level.emoji} {level.name}
              </strong>
              <span className="level-desc">{level.desc}</span>
              <span className="stars">
                {[0, 1, 2].map((i) => (
                  <span key={i} className={stars > i * 5 ? '' : 'dim'}>
                    ⭐
                  </span>
                ))}
                <em>最佳 {stars}/15 星</em>
              </span>
            </button>
          )
        })}
        <section className="how">
          <h2>怎麼玩？📖</h2>
          <ol>
            <li>
              <b>1</b>
              <span>
                從<b>個位</b>開始算，按數字鍵盤填答案（電腦上也可以直接按鍵盤的 0～9）。
              </span>
            </li>
            <li>
              <b>2</b>
              <span>
                不夠減時，按「<b>← 借 1</b>」，看 3D 積木怎麼拆成 10 個！
              </span>
            </li>
            <li>
              <b>3</b>
              <span>用滑鼠或手指拖曳可以旋轉 3D 場景，滾輪可以放大縮小。</span>
            </li>
          </ol>
        </section>
      </div>
      <p className="footer-note">自製復刻練習版，操作對齊公開的積木借位遊戲。</p>
    </main>
  )
}
