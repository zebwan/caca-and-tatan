import { useState } from 'react'
import { game, useGame, type Settings } from '../state/store'
import { saveSettings } from '../state/save'
import { closeMenu } from '../systems/input'
import { audio } from '../systems/audio'
import { ACCESSORIES } from '../data/items'
import { ALL_CLOTHES, type ClothingItem } from '../data/shop'
import { wear } from './Shop'
import { SaveCodePanel } from './SaveCode'
import { MemoryBook } from './MemoryBook'
import { newGame, quitToTitle, returnToSafeSpot } from '../flow'
import { GiftIcon } from './icons'

type Tab = 'journal' | 'wardrobe' | 'settings'

export function updateSettings(patch: Partial<Settings>) {
  const settings = { ...game.get().settings, ...patch }
  game.set({ settings })
  saveSettings(settings)
  audio.apply(settings)
}

function Wardrobe() {
  const joined = useGame((st) => !!st.flags.tatanJoined)
  const [who, setWho] = useState<'caca' | 'tatan'>('caca')
  const accessories = useGame((st) => st.accessories)
  const owned = useGame((st) => st.owned)
  const outfit = useGame((st) => (who === 'caca' ? st.equipped : st.equippedTatan))
  const have = ALL_CLOTHES.filter((c) => accessories.includes(c.id) || owned.includes(c.id))
  const locked = ACCESSORIES.filter((a) => !accessories.includes(a.id))
  const slots: { id: ClothingItem['slot']; name: string }[] = [
    { id: 'bow', name: 'Bow' },
    { id: 'head', name: 'Head' },
    { id: 'face', name: 'Face' },
    { id: 'neck', name: 'Neck' },
    { id: 'back', name: 'Back' },
  ]
  return (
    <>
      <h3>Wardrobe</h3>
      <div className="row" style={{ justifyContent: 'flex-start', marginBottom: 12 }}>
        <button className={`chip ${who === 'caca' ? 'on' : ''}`} onClick={() => setWho('caca')}>
          Caca
        </button>
        {joined && (
          <button className={`chip ${who === 'tatan' ? 'on' : ''}`} onClick={() => setWho('tatan')}>
            Tatan
          </button>
        )}
        <button className="btn small soft" onClick={() => game.set({ menu: 'style', menuArg: who })}>
          Change {who === 'caca' ? 'Caca' : 'Tatan'}’s look
        </button>
      </div>
      {slots.map((sl) => {
        const items = have.filter((c) => c.slot === sl.id)
        if (!items.length) return null
        const current = sl.id === 'bow' ? outfit.bow : outfit[sl.id]
        return (
          <div key={sl.id} className="wardrobe-slot">
            <div className="muted">{sl.name}</div>
            <div className="chips">
              {sl.id !== 'bow' || who === 'tatan' ? (
                <button className={`chip ${!current || current === 'none' ? 'on' : ''}`} onClick={() => wear(who, null, sl.id)}>
                  Nothing
                </button>
              ) : null}
              {items.map((c) => (
                <button key={c.id} className={`chip ${current === c.id ? 'on' : ''}`} onClick={() => wear(who, c, sl.id)}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )
      })}
      {locked.length > 0 && (
        <>
          <h3 style={{ marginTop: 18 }}>Still to find</h3>
          <div className="list">
            {locked.map((a) => (
              <div key={a.id} className="item locked">
                <GiftIcon color="#cdbfc7" />
                <div className="grow">
                  <div className="name">{a.name}</div>
                  <div className="sub">{a.hint}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <p className="muted" style={{ marginTop: 14 }}>
        More clothes are sold at Ribbon &amp; Bell in Cuddleberry Village.
      </p>
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
      <h3 style={{ marginTop: 18 }}>World</h3>
      <Toggle label="Day and night follow my clock" on={st.clock === 'real'} onChange={(v) => updateSettings({ clock: v ? 'real' : 'day' })} />
      <Toggle label="Gentle weather" on={st.weather} onChange={(v) => updateSettings({ weather: v })} />
      <h3 style={{ marginTop: 18 }}>Comfort</h3>
      <div className="toggle">
        <span>Text size</span>
        <div className="chips">
          {([1, 1.15, 1.3] as const).map((v, i) => (
            <button key={v} className={`chip ${st.textSize === v ? 'on' : ''}`} onClick={() => updateSettings({ textSize: v })}>
              {['Normal', 'Bigger', 'Biggest'][i]}
            </button>
          ))}
        </div>
      </div>
      <Toggle label="Always show the paw-print trail" on={st.alwaysTrail} onChange={(v) => updateSettings({ alwaysTrail: v })} />
      <Toggle label="Shift toggles running (instead of holding)" on={st.runMode === 'toggle'} onChange={(v) => updateSettings({ runMode: v ? 'toggle' : 'hold' })} />
      <h3 style={{ marginTop: 18 }}>Move to another device</h3>
      <SaveCodePanel />
      <p className="muted" style={{ marginTop: 16 }}>
        Controls: WASD or arrows to move · mouse to look · Space to jump · Shift to run · E to interact · C to cuddle Tatan · M for the map · Esc to pause. Scroll to zoom the camera.
      </p>
    </>
  )
}

export function PauseMenu() {
  const arg = useGame((st) => st.menuArg)
  const [tab, setTab] = useState<Tab>(arg === 'wardrobe' ? 'wardrobe' : arg === 'settings' ? 'settings' : 'journal')
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
              {t === 'journal' ? 'Memory Book' : t === 'wardrobe' ? 'Wardrobe' : 'Settings'}
            </button>
          ))}
          <div className="spacer" />
          <button className="tab" onClick={returnToSafeSpot} title="Use this if Caca is ever stuck">
            Back to the entrance
          </button>
          <button className="tab" onClick={quitToTitle}>
            Save &amp; title screen
          </button>
          <button className="tab" onClick={() => setConfirm('new')}>
            New adventure
          </button>
        </nav>
        <div className="content">
          {tab === 'journal' && <MemoryBook />}
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
