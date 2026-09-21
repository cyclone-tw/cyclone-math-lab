import { useState } from 'react'
import { HomeScreen } from './components/HomeScreen'
import { PlayScreen } from './components/PlayScreen'
import { ResultScreen } from './components/ResultScreen'
import { loadBestStars, saveBestStars, type QuestionResult } from './game/logic'
import { loadMuted, saveMuted } from './sound'
import './App.css'

type Screen = 'home' | 'play' | 'result'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [levelId, setLevelId] = useState(1)
  const [playKey, setPlayKey] = useState(0)
  const [best, setBest] = useState(loadBestStars)
  const [muted, setMuted] = useState(loadMuted)
  const [results, setResults] = useState<QuestionResult[]>([])
  const [score, setScore] = useState(0)

  function start(id: number) {
    setLevelId(id)
    setPlayKey((n) => n + 1)
    setScreen('play')
  }

  return (
    <>
      {screen === 'home' && <HomeScreen best={best} onStart={start} />}
      {screen === 'play' && (
        <PlayScreen
          key={playKey}
          levelId={levelId}
          muted={muted}
          onToggleMute={() => {
            setMuted((value) => {
              saveMuted(!value)
              return !value
            })
          }}
          onQuit={() => setScreen('home')}
          onFinish={(nextResults, nextScore) => {
            const stars = nextResults.reduce((sum, item) => sum + item.stars, 0)
            setBest((prev) => saveBestStars(levelId, stars, prev))
            setResults(nextResults)
            setScore(nextScore)
            setScreen('result')
          }}
        />
      )}
      {screen === 'result' && (
        <ResultScreen
          levelId={levelId}
          results={results}
          score={score}
          onReplay={() => start(levelId)}
          onNext={() => start(levelId + 1)}
          onHome={() => setScreen('home')}
        />
      )}
    </>
  )
}
