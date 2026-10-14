import { useEffect, useState } from 'react'
import { game, useGame } from '../state/store'
import { hasSave } from '../state/save'
import { continueGame, finishIntro, newGame } from '../flow'
import { audio } from '../systems/audio'
import { setAdvanceHandler } from '../systems/input'
import { DEDICATION, INTRO_CARDS } from '../data/story'
import { HeartIcon, SoundIcon } from './icons'
import { updateSettings } from './PauseMenu'
import { SaveCodePanel } from './SaveCode'

export function SoundToggle() {
  const muted = useGame((s) => s.settings.muted)
  return (
    <button
      className="icon-btn"
      title={muted ? 'Turn sound on' : 'Mute'}
      onClick={() => {
        audio.init()
        audio.startMusic()
        updateSettings({ muted: !muted })
      }}
    >
      <SoundIcon on={!muted} />
    </button>
  )
}

export function TitleScreen() {
  const [saved] = useState(hasSave)
  const [confirm, setConfirm] = useState(false)
  const [importing, setImporting] = useState(false)
  return (
    <div className="title-screen fade-in">
      <div className="corner">
        <SoundToggle />
      </div>
      <div className="logo">
        <h1>
          Caca <span className="amp">&amp;</span> Tatan
        </h1>
        <p>A cozy adventure about finding your way back to each other</p>
      </div>
      <div className="title-actions">
        {saved && (
          <button className="btn" onClick={continueGame}>
            Continue adventure
          </button>
        )}
        <button className={`btn ${saved ? 'soft' : ''}`} onClick={() => (saved ? setConfirm(true) : newGame())}>
          <HeartIcon size={18} color={saved ? '#f27aa6' : '#fff'} /> {saved ? 'New adventure' : 'Start adventure'}
        </button>
        {DEDICATION && <div className="dedication">{DEDICATION}</div>}
        <button className="btn ghost" onClick={() => setImporting(true)}>
          Have a save code?
        </button>
      </div>
      {importing && (
        <div className="scrim" onClick={(e) => e.target === e.currentTarget && setImporting(false)}>
          <div className="confirm panel" style={{ maxWidth: 460, textAlign: 'left' }}>
            <h3>Continue from another device</h3>
            <SaveCodePanel allowExport={false} />
            <div className="row" style={{ marginTop: 10, justifyContent: 'flex-end' }}>
              <button className="btn soft small" onClick={() => setImporting(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="title-foot">
        <span>WASD · move</span>
        <span>Mouse · look</span>
        <span>Space · jump</span>
        <span>E · interact</span>
        <span>M · map</span>
      </div>
      {confirm && (
        <div className="scrim">
          <div className="confirm panel">
            <h3>Start a new adventure?</h3>
            <p>Your saved journey will be replaced.</p>
            <div className="row">
              <button className="btn soft" onClick={() => setConfirm(false)}>
                Go back
              </button>
              <button className="btn" onClick={newGame}>
                Start over
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function IntroCards() {
  const step = useGame((s) => s.introStep)
  const next = () => {
    audio.sfx('click')
    if (step + 1 >= INTRO_CARDS.length) finishIntro()
    else game.set({ introStep: step + 1 })
  }
  useEffect(() => {
    setAdvanceHandler(next)
    const t = setTimeout(next, 9000)
    return () => {
      clearTimeout(t)
      setAdvanceHandler(null)
    }
  })
  return (
    <div className="intro" onClick={next}>
      <button
        className="btn ghost skip"
        onClick={(e) => {
          e.stopPropagation()
          finishIntro()
        }}
      >
        Skip
      </button>
      <div className="intro-card panel" key={step}>
        {INTRO_CARDS[step]}
        <div className="next">
          <span className="dots">
            {INTRO_CARDS.map((_, i) => (
              <i key={i} className={i === step ? 'on' : ''} />
            ))}
          </span>
          <span className="key">E</span>
        </div>
      </div>
    </div>
  )
}
