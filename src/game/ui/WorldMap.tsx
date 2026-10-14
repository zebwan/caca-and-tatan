/**
 * The magical world map. Purrland's five regions sit on parchment; locked ones
 * are clouded over and the final destination stays hidden. The meadow shows
 * the real top-down map with fog of war, Caca, the objective and a dotted
 * trail toward it. Newly revealed regions play a reveal animation.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { game, useGame } from '../state/store'
import { runtime } from '../state/runtime'
import { REGIONS } from '../data/items'
import { completedLocations, currentObjective } from '../systems/quests'
import { MAP_EXTENT } from '../systems/exploration'
import { closeMenu } from '../systems/input'
import { audio } from '../systems/audio'
import { drawPlayerArrow, drawStar, useFoggedMap } from './Minimap'
import { HeartIcon, StarIcon } from './icons'

const REGION_COLORS: Record<string, string> = {
  village: 'radial-gradient(circle at 40% 35%, #ffe6ef, #f7b6cc 75%)',
  forest: 'radial-gradient(circle at 40% 35%, #e6ddff, #b9a6e8 75%)',
  bay: 'radial-gradient(circle at 40% 35%, #e3f6ff, #9fd6ee 75%)',
  garden: 'radial-gradient(circle at 40% 35%, #fff4d6, #ffc2dc 75%)',
}

function MeadowCanvas({ size }: { size: number }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const getMap = useFoggedMap()
  useEffect(() => {
    let raf = 0
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      const c = canvas.current
      if (!c) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const px = Math.round(size * dpr)
      if (c.width !== px) c.width = c.height = px
      const ctx = c.getContext('2d')!
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.drawImage(getMap(), 0, 0, size, size)
      const k = size / (MAP_EXTENT * 2)
      const S = (x: number, z: number) => ({ x: (x + MAP_EXTENT) * k, y: (z + MAP_EXTENT) * k })
      const s = game.get()
      for (const loc of completedLocations(s.quests)) {
        const p = S(loc.x, loc.z)
        drawStar(ctx, p.x, p.y, 9, '#f7d774')
      }
      const P = runtime.player.pos
      const pp = S(P.x, P.z)
      const o = runtime.objective
      if (o) {
        const op = S(o.x, o.z)
        ctx.setLineDash([3, 7])
        ctx.lineDashOffset = -now / 60
        ctx.lineCap = 'round'
        ctx.lineWidth = 3.5
        ctx.strokeStyle = 'rgba(242, 122, 166, 0.85)'
        ctx.beginPath()
        ctx.moveTo(pp.x, pp.y)
        ctx.lineTo(op.x, op.y)
        ctx.stroke()
        ctx.setLineDash([])
        drawStar(ctx, op.x, op.y, 12 + Math.sin(now / 260) * 1.5, '#f27aa6')
      }
      drawPlayerArrow(ctx, pp.x, pp.y, -runtime.player.yaw + Math.PI, 10)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [size, getMap])
  return <canvas ref={canvas} style={{ width: size, height: size }} />
}

export function WorldMap() {
  const s = useGame()
  const wrap = useRef<HTMLDivElement>(null)
  const w = useWidth(wrap)
  const objective = currentObjective(s.quests)
  const reveal = useMemo(() => s.pendingReveal, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (reveal) {
      audio.sfx('reveal')
      const t = setTimeout(() => game.set({ pendingReveal: null }), 1800)
      return () => clearTimeout(t)
    }
  }, [reveal])

  const meadow = REGIONS[0]
  const meadowSize = (meadow.map.r * 2 * w) / 100
  const village = REGIONS.find((r) => r.id === 'village')!
  const villageOpen = s.regions.includes('village')

  return (
    <div className="scrim" onClick={(e) => e.target === e.currentTarget && closeMenu()}>
      <div className="worldmap panel">
        <header>
          <h2>Map of Purrland</h2>
          <div className="row">
            <span className="counter" style={{ boxShadow: 'none' }}>
              <StarIcon /> {s.fragments} / 3
            </span>
            <span className="counter" style={{ boxShadow: 'none' }}>
              <HeartIcon /> {s.keepsakes.length} / 3
            </span>
            <button className="btn small soft" onClick={closeMenu}>
              Close <span className="key">M</span>
            </button>
          </div>
        </header>
        <div className="mapcanvas" ref={wrap}>
          <svg viewBox="0 0 100 62.5" preserveAspectRatio="none">
            {/* trail from the meadow toward the next region once it is revealed */}
            {villageOpen && (
              <path
                d={`M ${meadow.map.x + 9} ${meadow.map.y * 0.625 - 6} Q ${(meadow.map.x + village.map.x) / 2 + 8} ${((meadow.map.y + village.map.y) / 2) * 0.625} ${village.map.x - 4} ${village.map.y * 0.625 + 3}`}
                fill="none"
                stroke="#f27aa6"
                strokeWidth="0.7"
                strokeDasharray="1.2 1.6"
                strokeLinecap="round"
              />
            )}
          </svg>
          {REGIONS.slice(1).map((r) => {
            const open = s.regions.includes(r.id)
            const size = (r.map.r * 2 * w) / 100
            return (
              <div
                key={r.id}
                className={`region ${open ? '' : 'locked'} ${reveal === r.id ? 'revealing' : ''}`}
                style={{ left: `${r.map.x}%`, top: `${r.map.y}%`, width: size, height: size }}
              >
                <div className="blob" style={open ? { background: REGION_COLORS[r.id] } : undefined} />
                {open && r.id === 'village' && <VillageArt />}
                <div className={`label ${r.id === 'forest' || r.id === 'garden' ? 'top' : ''}`}>
                  {r.id === 'garden' && !open ? '???' : r.name}
                  <small>{open ? r.tagline : r.id === 'garden' ? 'Somewhere far away' : 'Not yet revealed'}</small>
                </div>
              </div>
            )
          })}
          <div className="meadow-map" style={{ left: `${meadow.map.x}%`, top: `${meadow.map.y}%`, width: meadowSize, height: meadowSize }}>
            {w > 0 && <MeadowCanvas size={meadowSize} />}
          </div>
        </div>
        <div className="mapfoot">
          <span>
            {objective ? (
              <>
                Next: <span className="now">{objective.text}</span>
              </>
            ) : (
              'The meadow is complete.'
            )}
          </span>
          <span>Pink Blossom Meadow</span>
        </div>
      </div>
    </div>
  )
}

function useWidth(ref: React.RefObject<HTMLDivElement | null>) {
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    setW(el.clientWidth)
    return () => ro.disconnect()
  }, [ref])
  return w
}

function VillageArt() {
  const house = (x: number, y: number, s: number, roof: string) => (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-8" y="-2" width="16" height="12" rx="1.5" fill="#fff6ec" />
      <path d="M-11 -1 L0 -11 L11 -1 Z" fill={roof} />
      <rect x="-2.2" y="3" width="4.4" height="7" rx="1" fill="#e2a98f" />
    </g>
  )
  return (
    <svg className="art" viewBox="0 0 100 100" aria-hidden>
      {house(30, 52, 1.5, '#f27aa6')}
      {house(66, 46, 1.8, '#e98aa9')}
      {house(50, 72, 1.3, '#f7a8c6')}
      <circle cx="80" cy="74" r="7" fill="#a6d48a" />
      <circle cx="18" cy="74" r="6" fill="#a6d48a" />
    </svg>
  )
}
