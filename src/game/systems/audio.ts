/**
 * Procedural audio: a gentle generative music-box lullaby, ambient wind,
 * birds and water, and small synthesized sound effects. No audio files.
 * The AudioContext is created on the first user gesture (autoplay rules).
 */
import type { Settings } from '../state/store'

export type ThemeId = 'meadow' | 'village' | 'forest' | 'bay' | 'garden' | 'reunion'
export type AmbienceId = 'meadow' | 'village' | 'forest' | 'bay' | 'garden'

interface Theme {
  bpm: number
  chords: number[][]
  scale: number[]
  lead: 'box' | 'pluck' | 'bell'
  density: number
  pad: OscillatorType
  padGain: number
  bass: number
  strum?: boolean
  arp?: boolean
}

const THEMES: Record<ThemeId, Theme> = {
  meadow: { bpm: 74, chords: [[53, 57, 60, 64], [57, 60, 64, 67], [58, 62, 65, 69], [60, 64, 67, 69]], scale: [77, 79, 81, 84, 86, 89, 91, 93], lead: 'box', density: 0.55, pad: 'triangle', padGain: 0.022, bass: 0.06 },
  village: { bpm: 92, chords: [[48, 55, 60, 64], [43, 50, 55, 59], [45, 52, 57, 60], [41, 48, 53, 57]], scale: [72, 74, 76, 79, 81, 84, 86, 88], lead: 'pluck', density: 0.62, pad: 'triangle', padGain: 0.016, bass: 0.055, strum: true },
  forest: { bpm: 58, chords: [[45, 52, 55, 60], [41, 48, 52, 57], [48, 55, 59, 64], [43, 50, 55, 59]], scale: [69, 72, 74, 76, 79, 81, 84], lead: 'bell', density: 0.3, pad: 'sine', padGain: 0.03, bass: 0.05 },
  bay: { bpm: 100, chords: [[50, 57, 62, 66], [47, 54, 59, 62], [43, 50, 55, 59], [45, 52, 57, 61]], scale: [74, 76, 78, 81, 83, 86, 88, 90], lead: 'pluck', density: 0.7, pad: 'triangle', padGain: 0.014, bass: 0.055, strum: true },
  garden: { bpm: 62, chords: [[41, 48, 53, 57], [40, 47, 52, 55], [38, 45, 50, 53], [46, 53, 57, 62]], scale: [77, 79, 81, 84, 86, 89], lead: 'bell', density: 0.35, pad: 'sine', padGain: 0.03, bass: 0.045, arp: true },
  reunion: { bpm: 66, chords: [[41, 48, 53, 57], [40, 48, 52, 55], [38, 45, 50, 53], [46, 50, 53, 58]], scale: [77, 81, 84, 86, 89, 93], lead: 'box', density: 0.5, pad: 'triangle', padGain: 0.034, bass: 0.06, arp: true },
}

export type Sfx =
  | 'click' | 'map' | 'blip' | 'step' | 'jump' | 'land' | 'chime' | 'fragment' | 'quest'
  | 'note' | 'splash' | 'tile' | 'wrong' | 'meow' | 'sparkle' | 'reveal' | 'whoosh' | 'start'

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12)

class AudioEngine {
  ctx: AudioContext | null = null
  private master!: GainNode
  private musicBus!: GainNode
  private sfxBus!: GainNode
  private ambBus!: GainNode
  private reverb!: ConvolverNode
  private reverbSend!: GainNode
  private noiseBuf!: AudioBuffer
  private waterGain: GainNode | null = null
  private settings: Settings | null = null
  private musicOn = false
  private nextBarTime = 0
  private bar = 0
  private motif: (number | null)[][] = []
  private timer: number | null = null

  /** Call from a user gesture. Safe to call repeatedly. */
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume()
      return
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    const ctx = new AC()
    this.ctx = ctx
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -14
    comp.ratio.value = 3
    this.master = ctx.createGain()
    this.master.connect(comp).connect(ctx.destination)
    this.reverb = ctx.createConvolver()
    this.reverb.buffer = this.impulse(2.6)
    this.reverbSend = ctx.createGain()
    this.reverbSend.gain.value = 0.55
    this.reverbSend.connect(this.reverb).connect(this.master)
    this.musicBus = ctx.createGain()
    this.sfxBus = ctx.createGain()
    this.ambBus = ctx.createGain()
    for (const b of [this.musicBus, this.sfxBus, this.ambBus]) b.connect(this.master)
    this.musicBus.connect(this.reverbSend)
    this.noiseBuf = this.makeNoise(2)
    if (this.settings) this.apply(this.settings)
    this.startAmbient()
  }

  apply(s: Settings) {
    this.settings = s
    if (!this.ctx) return
    const t = this.ctx.currentTime
    this.master.gain.setTargetAtTime(s.muted ? 0 : s.master, t, 0.05)
    this.musicBus.gain.setTargetAtTime(s.music * 0.55, t, 0.05)
    this.sfxBus.gain.setTargetAtTime(s.sfx, t, 0.05)
    this.ambBus.gain.setTargetAtTime(s.sfx * 0.7, t, 0.05)
  }

  private impulse(seconds: number) {
    const ctx = this.ctx!
    const len = Math.floor(ctx.sampleRate * seconds)
    const buf = ctx.createBuffer(2, len, ctx.sampleRate)
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch)
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2)
    }
    return buf
  }
  private makeNoise(seconds: number) {
    const ctx = this.ctx!
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    return buf
  }

  // ── primitives ──────────────────────────────────────────────────────────────
  private tone(
    freq: number, at: number, dur: number,
    opts: { type?: OscillatorType; gain?: number; attack?: number; glide?: number; dest?: AudioNode; wet?: number; pan?: number } = {},
  ) {
    const ctx = this.ctx!
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = opts.type ?? 'sine'
    o.frequency.setValueAtTime(freq, at)
    if (opts.glide) o.frequency.exponentialRampToValueAtTime(opts.glide, at + dur * 0.9)
    const peak = opts.gain ?? 0.1
    const a = opts.attack ?? 0.006
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(peak, at + a)
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
    let out: AudioNode = g
    if (opts.pan !== undefined && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner()
      p.pan.value = opts.pan
      g.connect(p)
      out = p
    }
    o.connect(g)
    out.connect(opts.dest ?? this.sfxBus)
    if (opts.wet) {
      const w = ctx.createGain()
      w.gain.value = opts.wet
      out.connect(w).connect(this.reverbSend)
    }
    o.start(at)
    o.stop(at + dur + 0.05)
  }

  private noise(at: number, dur: number, opts: { type?: BiquadFilterType; freq?: number; to?: number; q?: number; gain?: number; dest?: AudioNode }) {
    const ctx = this.ctx!
    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuf
    const f = ctx.createBiquadFilter()
    f.type = opts.type ?? 'lowpass'
    f.frequency.setValueAtTime(opts.freq ?? 800, at)
    if (opts.to) f.frequency.exponentialRampToValueAtTime(opts.to, at + dur)
    f.Q.value = opts.q ?? 0.8
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(opts.gain ?? 0.05, at + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
    src.connect(f).connect(g).connect(opts.dest ?? this.sfxBus)
    src.start(at, Math.random() * 1.5)
    src.stop(at + dur + 0.05)
  }

  private bell(freq: number, at: number, dur: number, gain: number, wet = 0.35) {
    this.tone(freq, at, dur, { gain, wet })
    this.tone(freq * 2.01, at, dur * 0.5, { gain: gain * 0.25, wet })
    this.tone(freq * 3.98, at, dur * 0.25, { gain: gain * 0.08, wet })
  }

  // ── sound effects ───────────────────────────────────────────────────────────
  sfx(name: Sfx, arg = 0) {
    const ctx = this.ctx
    if (!ctx || ctx.state !== 'running') return
    const t = ctx.currentTime + 0.01
    switch (name) {
      case 'click':
        this.tone(880, t, 0.06, { gain: 0.05 })
        break
      case 'blip':
        this.tone(560 + Math.random() * 260, t, 0.05, { gain: 0.022, type: 'triangle' })
        break
      case 'step':
        this.noise(t, 0.07, { type: 'lowpass', freq: 420 + Math.random() * 260, gain: 0.05 + Math.random() * 0.02 })
        break
      case 'jump':
        this.tone(360, t, 0.16, { glide: 760, gain: 0.05, type: 'triangle' })
        break
      case 'land':
        this.tone(150, t, 0.14, { glide: 70, gain: 0.08 })
        this.noise(t, 0.08, { freq: 300, gain: 0.05 })
        break
      case 'chime':
        ;[84, 88, 91].forEach((n, i) => this.bell(midi(n), t + i * 0.07, 0.9, 0.05))
        break
      case 'sparkle':
        for (let i = 0; i < 6; i++) this.tone(2200 + Math.random() * 2200, t + i * 0.045, 0.18, { gain: 0.012, wet: 0.6 })
        break
      case 'fragment':
        ;[77, 81, 84, 89, 93, 96].forEach((n, i) => this.bell(midi(n), t + i * 0.09, 1.6, 0.05, 0.6))
        this.tone(midi(65), t, 2.2, { gain: 0.05, attack: 0.4, type: 'triangle', wet: 0.6 })
        break
      case 'quest':
        ;[72, 76, 79].forEach((n, i) => this.bell(midi(n), t + i * 0.11, 1.2, 0.06))
        ;[77, 81, 84].forEach((n) => this.bell(midi(n), t + 0.45, 1.8, 0.045))
        this.tone(midi(53), t + 0.45, 1.6, { gain: 0.07, attack: 0.05, type: 'triangle' })
        break
      case 'note':
        this.noise(t, 0.12, { type: 'bandpass', freq: 3200, q: 1.2, gain: 0.04 })
        this.noise(t + 0.13, 0.1, { type: 'bandpass', freq: 2600, q: 1.2, gain: 0.03 })
        this.bell(midi(88), t + 0.15, 1.2, 0.03)
        break
      case 'splash':
        this.noise(t, 0.45, { type: 'bandpass', freq: 2200, to: 500, q: 0.9, gain: 0.12 })
        for (let i = 0; i < 4; i++) this.tone(500 + Math.random() * 500, t + 0.1 + i * 0.06, 0.06, { glide: 1200, gain: 0.02 })
        break
      case 'tile': {
        const notes = [72, 76, 79, 81]
        this.bell(midi(notes[arg % 4]), t, 1.3, 0.07, 0.5)
        break
      }
      case 'wrong':
        this.tone(midi(64), t, 0.22, { gain: 0.05, type: 'triangle' })
        this.tone(midi(60), t + 0.18, 0.32, { gain: 0.05, type: 'triangle' })
        break
      case 'meow': {
        const ctx2 = this.ctx!
        const o = ctx2.createOscillator()
        o.type = 'sawtooth'
        const base = arg || 620
        o.frequency.setValueAtTime(base, t)
        o.frequency.linearRampToValueAtTime(base * 1.45, t + 0.14)
        o.frequency.linearRampToValueAtTime(base * 0.9, t + 0.42)
        const f = ctx2.createBiquadFilter()
        f.type = 'bandpass'
        f.frequency.setValueAtTime(1100, t)
        f.frequency.linearRampToValueAtTime(1700, t + 0.15)
        f.frequency.linearRampToValueAtTime(900, t + 0.42)
        f.Q.value = 3
        const g = ctx2.createGain()
        g.gain.setValueAtTime(0.0001, t)
        g.gain.exponentialRampToValueAtTime(0.09, t + 0.05)
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.46)
        o.connect(f).connect(g).connect(this.sfxBus)
        o.start(t)
        o.stop(t + 0.5)
        break
      }
      case 'reveal':
        ;[65, 69, 72, 74, 77, 81, 84, 86, 89].forEach((n, i) => this.bell(midi(n), t + i * 0.08, 1.4, 0.03, 0.6))
        break
      case 'whoosh':
      case 'map':
        this.noise(t, 0.35, { type: 'bandpass', freq: 400, to: 2200, q: 0.7, gain: 0.05 })
        break
      case 'start':
        ;[72, 77, 81, 84].forEach((n, i) => this.bell(midi(n), t + i * 0.1, 1.5, 0.05, 0.5))
        break
    }
  }

  // ── ambience ────────────────────────────────────────────────────────────────
  private windGain: GainNode | null = null
  private waveGain: GainNode | null = null
  private ambience: AmbienceId = 'meadow'

  private loopNoise(type: BiquadFilterType, freq: number, q = 0.7) {
    const ctx = this.ctx!
    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuf
    src.loop = true
    const f = ctx.createBiquadFilter()
    f.type = type
    f.frequency.value = freq
    f.Q.value = q
    const g = ctx.createGain()
    g.gain.value = 0
    src.connect(f).connect(g).connect(this.ambBus)
    src.start()
    return g
  }

  private startAmbient() {
    const ctx = this.ctx!
    this.windGain = this.loopNoise('lowpass', 420)
    this.waterGain = this.loopNoise('bandpass', 1500)
    this.waveGain = this.loopNoise('lowpass', 650)
    this.rainGain = this.loopNoise('highpass', 2600, 0.5)
    // slow swell on the waves
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.11
    const lg = ctx.createGain()
    lg.gain.value = 0
    lfo.connect(lg).connect(this.waveGain.gain)
    lfo.start()
    this.waveLfo = lg
    this.setAmbience(this.ambience)
    const tick = () => {
      if (this.ctx && this.ctx.state === 'running') this.ambientEvent()
      window.setTimeout(tick, 1800 + Math.random() * 4200)
    }
    tick()
  }
  private waveLfo: GainNode | null = null
  private rainGain: GainNode | null = null

  /** 0..1 rain loudness. */
  setRain(v: number) {
    if (!this.ctx || !this.rainGain) return
    this.rainGain.gain.setTargetAtTime(v * 0.035, this.ctx.currentTime, 0.8)
  }

  setAmbience(id: AmbienceId) {
    this.ambience = id
    if (!this.ctx || !this.windGain || !this.waveGain || !this.waveLfo) return
    const t = this.ctx.currentTime
    const wind = { meadow: 0.022, village: 0.014, forest: 0.012, bay: 0.016, garden: 0.03 }[id]
    this.windGain.gain.setTargetAtTime(wind, t, 1)
    this.waveGain.gain.setTargetAtTime(id === 'bay' ? 0.05 : 0, t, 1)
    this.waveLfo.gain.setTargetAtTime(id === 'bay' ? 0.035 : 0, t, 1)
  }

  private ambientEvent() {
    const t = this.ctx!.currentTime + 0.05
    const pan = Math.random() * 1.6 - 0.8
    const id = this.ambience
    if (id === 'meadow' || id === 'village' || (id === 'bay' && Math.random() < 0.3)) {
      const base = 2300 + Math.random() * 1400
      const n = 2 + Math.floor(Math.random() * 3)
      for (let i = 0; i < n; i++) this.tone(base, t + i * 0.11, 0.08, { glide: base * 1.35, gain: 0.012, dest: this.ambBus, pan })
    }
    if (id === 'bay' && Math.random() < 0.6) {
      for (let i = 0; i < 2; i++) this.tone(1250, t + i * 0.32, 0.26, { glide: 880, gain: 0.012, type: 'triangle', dest: this.ambBus, pan })
    }
    if (id === 'forest') {
      for (let k = 0; k < 3; k++) {
        const ct = t + k * 0.6 + Math.random() * 0.2
        for (let i = 0; i < 3; i++) this.tone(4300 + Math.random() * 300, ct + i * 0.05, 0.03, { gain: 0.006, dest: this.ambBus, pan: Math.random() * 1.6 - 0.8 })
      }
      if (Math.random() < 0.25) {
        this.tone(392, t + 0.4, 0.35, { glide: 370, gain: 0.03, dest: this.ambBus, pan, wet: 0.5 })
        this.tone(392, t + 0.9, 0.5, { glide: 360, gain: 0.025, dest: this.ambBus, pan, wet: 0.5 })
      }
    }
    if (id === 'garden') {
      const notes = [84, 86, 89, 91, 93, 96]
      for (let i = 0; i < 2; i++) this.tone(midi(notes[Math.floor(Math.random() * notes.length)]), t + i * 0.18, 1.6, { gain: 0.012, dest: this.ambBus, pan, wet: 0.8 })
    }
  }

  /** 0..1 how close Caca is to running water. */
  setWater(v: number) {
    if (!this.ctx || !this.waterGain) return
    this.waterGain.gain.setTargetAtTime(v * 0.045, this.ctx.currentTime, 0.4)
  }

  // ── music ───────────────────────────────────────────────────────────────────
  private theme: ThemeId = 'meadow'
  private pendingTheme: ThemeId | null = null

  setTheme(id: ThemeId) {
    if (id === this.theme && !this.pendingTheme) return
    this.pendingTheme = id
  }

  startMusic() {
    if (!this.ctx || this.musicOn) return
    this.musicOn = true
    this.nextBarTime = this.ctx.currentTime + 0.3
    this.bar = 0
    this.timer = window.setInterval(() => this.schedule(), 120)
  }

  stopMusic() {
    this.musicOn = false
    if (this.timer) window.clearInterval(this.timer)
    this.timer = null
  }

  private schedule() {
    const ctx = this.ctx
    if (!ctx || !this.musicOn) return
    while (this.nextBarTime < ctx.currentTime + 0.6) {
      if (this.pendingTheme && this.bar % 2 === 0) {
        this.theme = this.pendingTheme
        this.pendingTheme = null
        this.bar = 0
      }
      const th = THEMES[this.theme]
      const beat = 60 / th.bpm
      this.playBar(th, this.bar, this.nextBarTime, beat)
      this.nextBarTime += beat * 4
      this.bar++
    }
  }

  private playBar(th: Theme, bar: number, t: number, beat: number) {
    const ci = bar % th.chords.length
    const chord = th.chords[ci]
    const bus = this.musicBus
    for (const n of chord.slice(0, 3)) this.tone(midi(n), t, beat * 4.4, { type: th.pad, gain: th.padGain, attack: 0.9, dest: bus })
    this.tone(midi(chord[0] - 12), t, beat * 1.8, { gain: th.bass, attack: 0.03, dest: bus })
    this.tone(midi(chord[0] - 12), t + beat * 2, beat * 1.8, { gain: th.bass * 0.7, attack: 0.03, dest: bus })
    if (th.strum) {
      for (const b of [0, 2]) chord.forEach((n, i) => this.tone(midi(n + 12), t + b * beat + i * 0.028, 0.5, { type: 'triangle', gain: 0.016, dest: bus }))
    }
    if (th.arp) {
      for (let i = 0; i < 8; i++) this.tone(midi(chord[(i % 3) + 1] + 12), t + i * (beat / 2), 1.2, { gain: 0.012, dest: bus, wet: 0.4 })
    }
    if (bar % 8 === 0 || !this.motif.length) this.motif = this.writeMotif(th)
    const line = this.motif[ci % this.motif.length]
    const variation = bar % 8 >= 4
    line.forEach((n, i) => {
      if (n === null) return
      const note = variation && i === line.length - 1 ? n + (Math.random() < 0.5 ? 2 : -3) : n
      const at = t + i * (beat / 2)
      if (th.lead === 'pluck') {
        this.tone(midi(note), at, 0.55, { type: 'triangle', gain: 0.04, dest: bus })
        this.tone(midi(note) * 2, at, 0.2, { gain: 0.008, dest: bus })
      } else if (th.lead === 'bell') {
        this.tone(midi(note), at, 2.2, { gain: 0.03, dest: bus, wet: 0.5 })
        this.tone(midi(note) * 2.01, at, 1.0, { gain: 0.008, dest: bus, wet: 0.5 })
      } else {
        this.tone(midi(note), at, 1.4, { gain: 0.035, dest: bus })
        this.tone(midi(note) * 2, at, 0.5, { gain: 0.008, dest: bus })
      }
    })
  }

  private writeMotif(th: Theme) {
    const scale = th.scale
    const out: (number | null)[][] = []
    let idx = Math.floor(scale.length / 2)
    for (let b = 0; b < th.chords.length; b++) {
      const tones = th.chords[b].map((n) => {
        let m = n
        while (m < scale[0] - 1) m += 12
        return m
      })
      const bar: (number | null)[] = []
      for (let s = 0; s < 8; s++) {
        const strong = s % 4 === 0
        if (!strong && Math.random() > th.density) {
          bar.push(null)
          continue
        }
        if (strong) bar.push(tones[Math.floor(Math.random() * tones.length)])
        else {
          idx = Math.max(0, Math.min(scale.length - 1, idx + Math.floor(Math.random() * 3) - 1))
          bar.push(scale[idx])
        }
      }
      out.push(bar)
    }
    return out
  }
}

export const audio = new AudioEngine()
