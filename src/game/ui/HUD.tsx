import { useEffect, useRef, useState } from 'react'
import { game, useGame } from '../state/store'
import { runtime } from '../state/runtime'
import { currentObjective } from '../systems/quests'
import { input, openMenu } from '../systems/input'
import { Minimap } from './Minimap'
import { ArrowIcon, HeartIcon, MapIcon, PauseIcon, PawIcon, StarIcon, ToastIcon } from './icons'
import { TOTAL_FRAGMENTS } from '../data/quests'
import { TouchControls } from './TouchControls'

function Objective() {
  const quests = useGame((s) => s.quests)
  const o = currentObjective(quests)
  const arrow = useRef<HTMLDivElement>(null)
  const dist = useRef<HTMLSpanElement>(null)

  // direction + distance update outside React state
  useEffect(() => {
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const ob = runtime.objective
      if (!ob) return
      const P = runtime.player.pos
      const dx = ob.x - P.x, dz = ob.z - P.z
      const yaw = runtime.camera.yaw
      // rotate into camera space (camera forward = up)
      const sx = dx * Math.cos(yaw) - dz * Math.sin(yaw)
      const sy = dx * Math.sin(yaw) + dz * Math.cos(yaw)
      const ang = Math.atan2(sx, -sy)
      const svg = arrow.current?.firstElementChild as HTMLElement | null
      if (svg) svg.style.transform = `rotate(${ang}rad)`
      if (dist.current) {
        const d = Math.hypot(dx, dz)
        const via = runtime.objectiveVia
        dist.current.textContent = via ? `Head to ${via} · ${Math.round(d)} m` : d < 4 ? 'right here' : `${Math.round(d)} m away`
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  if (!o) return null
  return (
    <div className="objective panel" key={o.questId + o.text}>
      <div className="arrow" ref={arrow}>
        <ArrowIcon />
      </div>
      <div>
        <div className="q">{o.title}</div>
        <div className="t">{o.text}</div>
        <div className="meta">
          {o.progress && (
            <span className="pill">
              {o.progress.n}/{o.progress.total} {o.progress.label}
            </span>
          )}
          <span ref={dist} />
        </div>
      </div>
    </div>
  )
}

function Counter({ value, title, children }: { value: number; title: string; children: React.ReactNode }) {
  const [bump, setBump] = useState(false)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setBump(true)
    const t = setTimeout(() => setBump(false), 600)
    return () => clearTimeout(t)
  }, [value])
  return (
    <div className={`counter ${bump ? 'bump' : ''}`} title={title}>
      {children}
    </div>
  )
}

function Fragments() {
  const n = useGame((s) => s.fragments)
  const paws = useGame((s) => s.pawprints)
  return (
    <div className="counters">
      <Counter value={n} title="Starlight fragments">
        <StarIcon size={22} />
        <span>
          {n} / {TOTAL_FRAGMENTS}
        </span>
      </Counter>
      <Counter value={paws} title="Pawprints">
        <PawIcon size={20} />
        <span>{paws}</span>
      </Counter>
    </div>
  )
}

function Prompt() {
  const prompt = useGame((s) => s.prompt)
  if (!prompt) return null
  return (
    <button
      className="prompt"
      onClick={() => {
        input.interact = true
      }}
    >
      <span className="key">{input.isTouch ? 'Tap' : 'E'}</span>
      {prompt}
    </button>
  )
}

export function Toasts() {
  const toasts = useGame((s) => s.toasts)
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <ToastIcon icon={t.icon} />
          {t.text}
        </div>
      ))}
    </div>
  )
}

export function HUD() {
  const hint = useGame((s) => s.hint)
  const blocked = useGame((s) => s.queue.length > 0)
  const cutscene = useGame((s) => s.cutscene)
  const joined = useGame((s) => !!s.flags.tatanJoined)
  if (cutscene) return null
  return (
    <>
      {!blocked && <Objective />}
      <div className="hud-right">
        <Minimap />
        <Fragments />
        <div className="minimap-buttons">
          <button className="icon-btn" title="World map (M)" onClick={() => !game.inputBlocked() && openMenu('map')}>
            <MapIcon />
          </button>
          <button className="icon-btn" title="Pause (Esc)" onClick={() => !game.inputBlocked() && openMenu('pause')}>
            <PauseIcon />
          </button>
          {joined && (
            <button className="icon-btn" title="Cuddle Tatan (C)" onClick={() => (input.cuddle = true)}>
              <HeartIcon size={22} />
            </button>
          )}
        </div>
      </div>
      {!blocked && <Prompt />}
      {hint && !blocked && <div className="hint">{hint}</div>}
      {input.isTouch && !blocked && <TouchControls />}
    </>
  )
}
