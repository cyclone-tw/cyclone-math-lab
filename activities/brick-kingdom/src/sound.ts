let ctx: AudioContext | null = null
const MUTE_KEY = 'brick-kingdom-muted'

export function loadMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

export function saveMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
  } catch {
    /* ignore */
  }
}

function audio() {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      ctx = new Ctor()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, delay: number, dur: number, type: OscillatorType, gain = 0.18) {
  const ac = audio()
  if (!ac || loadMuted()) return
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ac.currentTime + delay)
  g.gain.setValueAtTime(0, ac.currentTime + delay)
  g.gain.linearRampToValueAtTime(gain, ac.currentTime + delay + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + delay + dur)
  osc.connect(g).connect(ac.destination)
  osc.start(ac.currentTime + delay)
  osc.stop(ac.currentTime + delay + dur + 0.05)
}

export const sfx = {
  tap() {
    tone(660, 0, 0.08, 'triangle', 0.1)
  },
  correct() {
    tone(523.25, 0, 0.15, 'triangle')
    tone(659.25, 0.1, 0.15, 'triangle')
    tone(783.99, 0.2, 0.25, 'triangle')
  },
  wrong() {
    tone(220, 0, 0.2, 'sawtooth', 0.08)
    tone(180, 0.15, 0.25, 'sawtooth', 0.08)
  },
  borrow() {
    tone(880, 0, 0.06, 'square', 0.06)
    tone(1174, 0.06, 0.08, 'square', 0.06)
    tone(1568, 0.12, 0.12, 'square', 0.06)
  },
  win() {
    ;[523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5].forEach((f, i) =>
      tone(f, i * 0.11, 0.22, 'triangle', 0.16),
    )
  },
}
