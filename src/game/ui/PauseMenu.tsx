import { useState } from 'react'
import { game, useGame, type Settings } from '../state/store'
import { saveGame, saveSettings } from '../state/save'
import { closeMenu } from '../systems/input'
import { audio } from '../systems/audio'
import { showNote } from '../systems/quests'
import { NOTES } from '../data/story'
import { ACCESSORIES, KEEPSAKES } from '../data/items'
import { newGame, quitToTitle, returnToSafeSpot } from '../flow'
import { GiftIcon, HeartIcon, StarIcon } from './icons'

type Tab = 'journal' | 'wardrobe' | 'settings'

export function updateSettings(patch: Partial<Settings>) {
  const settings = { ...game.get().settings, ...patch }
  game.set({ settings })
  saveSettings(settings)
  audio.apply(settings)
}

function Journal() {
  const notes = useGame((s) => s.notes)
  const keepsakes = useGame((s) => s.keepsakes)
  return (
    <>
      <h3>Tatan’s notes</h3>
      <div className="list">
        {notes.length === 0 && <div className="muted">No notes yet.</div>}
        {notes.map((id) => (
          <div
            key={id}
            className="item clickable"
            onClick={() => {
              closeMenu()
              showNote(id)
            }}
          >
            <StarIcon />
            <div className="grow">
              <div className="name">{NOTES[id]?.title}</div>
              <div className="sub">Read again</div>
            </div>
          </div>
        ))}
      </div>
      <h3 style={{ marginTop: 22 }}>Keepsakes</h3>
      <div className="list">
        {Object.values(KEEPSAKES).map((k) => {
          const have = keepsakes.includes(k.id)
          return (
            <div
              key={k.id}
              className={`item ${have ? 'clickable' : 'locked'}`}
              onClick={() => {
                if (!have) return
                closeMenu()
                game.present({ kind: 'keepsake', id: k.id })
              }}
            >
              <HeartIcon color={have ? '#f27aa6' : '#cdbfc7'} />
              <div className="grow">
                <div className="name">{have ? k.name : 'Not found yet'}</div>
                <div className="sub">{have ? 'Look again' : 'Hidden somewhere in the meadow'}</div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

function Wardrobe() {
  const unlocked = useGame((s) => s.accessories)
  const equipped = useGame((s) => s.equipped)
  const toggle = (id: string, slot: 'head' | 'face') => {
    const cur = game.get().equipped
    game.set({ equipped: { ...cur, [slot]: cur[slot] === id ? null : id } })
    audio.sfx('click')
    saveGame()
  }
  return (
    <>
      <h3>Wardrobe</h3>
      <div className="list">
        {ACCESSORIES.map((a) => {
          const have = unlocked.includes(a.id)
          const always = a.id === 'pinkBow'
          const slot = a.slot === 'face' ? 'face' : 'head'
          const on = always || equipped[slot] === a.id
          return (
            <div key={a.id} className={`item ${have ? '' : 'locked'}`}>
              <GiftIcon color={have ? '#f27aa6' : '#cdbfc7'} />
              <div className="grow">
                <div className="name">{a.name}</div>
                <div className="sub">{have ? a.description : a.hint}</div>
              </div>
              {have && !always && (a.slot === 'head' || a.slot === 'face') && (
                <button className={`btn small ${on ? '' : 'soft'}`} onClick={() => toggle(a.id, slot)}>
                  {on ? 'Wearing' : 'Wear'}
                </button>
              )}
              {always && <span className="muted">Always on</span>}
            </div>
          )
        })}
      </div>
    </>
  )
}

function Slider({ label, value, onChange, min = 0, max = 1, step = 0.05, fmt }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; fmt?: (v: number) => string }) {
  return (
    <label className="slider">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <span className="muted">{fmt ? fmt(value) : Math.round(value * 100)}</span>
    </label>
  )
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="toggle">
      <span>{label}</span>
      <button className={`switch ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => onChange(!on)} />
    </div>
  )
}

export function SettingsPanel() {
  const st = useGame((s) => s.settings)
  return (
    <>
      <h3>Sound</h3>
      <Toggle label="Sound on" on={!st.muted} onChange={(v) => updateSettings({ muted: !v })} />
      <Slider label="Master volume" value={st.master} onChange={(v) => updateSettings({ master: v })} />
      <Slider label="Music" value={st.music} onChange={(v) => updateSettings({ music: v })} />
      <Slider label="Sound effects" value={st.sfx} onChange={(v) => updateSettings({ sfx: v })} />
      <h3 style={{ marginTop: 18 }}>Camera</h3>
      <Slider label="Look sensitivity" value={st.sensitivity} min={0.3} max={2} step={0.1} onChange={(v) => updateSettings({ sensitivity: v })} fmt={(v) => v.toFixed(1)} />
      <Toggle label="Invert up/down" on={st.invertY} onChange={(v) => updateSettings({ invertY: v })} />
      <p className="muted" style={{ marginTop: 16 }}>
        Controls: WASD or arrows to move · mouse to look · Space to jump · Shift to run · E to interact · M for the map · Esc to pause. Scroll to zoom the camera.
      </p>
    </>
  )
}

export function PauseMenu() {
  const [tab, setTab] = useState<Tab>('journal')
  const [confirm, setConfirm] = useState<null | 'new'>(null)
  return (
    <div className="scrim" onClick={(e) => e.target === e.currentTarget && closeMenu()}>
      <div className="pause panel">
        <nav>
          <h2>Paused</h2>
          <button className="tab" onClick={closeMenu}>
            Resume
          </button>
          {(['journal', 'wardrobe', 'settings'] as Tab[]).map((t) => (
            <button key={t} className={`tab ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>
              {t === 'journal' ? 'Journal' : t === 'wardrobe' ? 'Wardrobe' : 'Settings'}
            </button>
          ))}
          <div className="spacer" />
          <button className="tab" onClick={returnToSafeSpot} title="Use this if Caca is ever stuck">
            Back to the cherry tree
          </button>
          <button className="tab" onClick={quitToTitle}>
            Save &amp; title screen
          </button>
          <button className="tab" onClick={() => setConfirm('new')}>
            New adventure
          </button>
        </nav>
        <div className="content">
          {tab === 'journal' && <Journal />}
          {tab === 'wardrobe' && <Wardrobe />}
          {tab === 'settings' && <SettingsPanel />}
        </div>
      </div>
      {confirm && (
        <div className="scrim">
          <div className="confirm panel">
            <h3>Start a new adventure?</h3>
            <p>This erases the current journey: quests, keepsakes and notes.</p>
            <div className="row">
              <button className="btn soft" onClick={() => setConfirm(null)}>
                Keep playing
              </button>
              <button
                className="btn"
                onClick={() => {
                  setConfirm(null)
                  newGame()
                }}
              >
                Start over
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
