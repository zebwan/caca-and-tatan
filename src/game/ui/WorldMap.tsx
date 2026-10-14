/**
 * The magical world map. Purrland's regions sit on parchment; locked ones
 * are clouded over and the final destination stays hidden until revealed.
 * Pick a region to see its real map (fog of war, Caca, the objective) and
 * travel there once it's been visited.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { game, useGame } from '../state/store'
import { runtime } from '../state/runtime'
import { REGIONS, KEEPSAKES } from '../data/items'
import { TOTAL_FRAGMENTS } from '../data/quests'
import { completedLocations, currentObjective, objectivePoint } from '../systems/quests'
import { MAP_EXTENT } from '../systems/exploration'
import { closeMenu } from '../systems/input'
import { audio } from '../systems/audio'
import { isBuilt, regionRT } from '../world/regions'
import { travelTo } from '../flow'
import { drawPlayerArrow, drawStar, foggedMap } from './Minimap'
import { HeartIcon, PawIcon, StarIcon } from './icons'
import type { RegionId } from '../data/types'

const REGION_COLORS: Record<string, string> = {
  meadow: 'radial-gradient(circle at 40% 35%, #f2fbe6, #b9e09c 75%)',
  village: 'radial-gradient(circle at 40% 35%, #ffe6ef, #f7b6cc 75%)',
  forest: 'radial-gradient(circle at 40% 35%, #e6ddff, #a998e0 75%)',
  bay: 'radial-gradient(circle at 40% 35%, #e3f6ff, #9fd6ee 75%)',
  garden: 'radial-gradient(circle at 40% 35%, #fff4d6, #ffc2dc 75%)',
}
const LINKS: [RegionId, RegionId][] = [
  ['meadow', 'village'],
  ['village', 'forest'],
  ['village', 'bay'],
  ['bay', 'garden'],
]

function RegionDetailCanvas({ id, size }: { id: RegionId; size: number }) {
  const canvas = useRef<HTMLCanvasElement>(null)
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
      ctx.drawImage(foggedMap(id), 0, 0, size, size)
      const k = size / (MAP_EXTENT * 2)
      const S = (x: number, z: number) => ({ x: (x + MAP_EXTENT) * k, y: (z + MAP_EXTENT) * k })
      const s = game.get()
      for (const loc of completedLocations(s.quests, id)) {
        const p = S(loc.x, loc.z)
        drawStar(ctx, p.x, p.y, 8, '#f7d774')
      }
      const here = s.region === id
      const o = currentObjective(s.quests)
      const P = runtime.player.pos
      let op: { x: number; y: number } | null = null
      if (here && runtime.objective) op = S(runtime.objective.x, runtime.objective.z)
      else if (o && o.region === id) {
        const pt = objectivePoint(o, s.collected, o.location)
        op = S(pt.x, pt.z)
      }
      if (here && op) {
        const pp = S(P.x, P.z)
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
      }
      if (op) drawStar(ctx, op.x, op.y, 11 + Math.sin(now / 260) * 1.5, '#f27aa6')
      if (here) {
        const pp = S(P.x, P.z)
        drawPlayerArrow(ctx, pp.x, pp.y, -runtime.player.yaw + Math.PI, 10)
      }
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [id, size])
  return <canvas ref={canvas} style={{ width: size, height: size }} />
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

export function WorldMap() {
  const s = useGame()
  const wrap = useRef<HTMLDivElement>(null)
  const detail = useRef<HTMLDivElement>(null)
  const w = useWidth(wrap)
  const dw = useWidth(detail)
  const [sel, setSel] = useState<RegionId>(s.region)
  const objective = currentObjective(s.quests)
  const reveal = useMemo(() => s.pendingReveal, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (reveal) {
      audio.sfx('reveal')
      const t = setTimeout(() => game.set({ pendingReveal: null }), 1800)
      return () => clearTimeout(t)
    }
  }, [reveal])

  const open = (id: RegionId) => s.regions.includes(id)
  const visited = (id: RegionId) => !!s.flags[`visited:${id}`] || id === 'meadow'
  const selDef = REGIONS.find((r) => r.id === sel)!
  const canTravel = open(sel) && visited(sel) && isBuilt(sel) && sel !== s.region && !s.cutscene && s.queue.length === 0
  const H = (y: number) => y * 0.625

  return (
    <div className="scrim" onClick={(e) => e.target === e.currentTarget && closeMenu()}>
      <div className="worldmap panel">
        <header>
          <h2>Map of Purrland</h2>
          <div className="row">
            <span className="counter flat" title="Starlight fragments">
              <StarIcon /> {s.fragments} / {TOTAL_FRAGMENTS}
            </span>
            <span className="counter flat" title="Keepsakes">
              <HeartIcon /> {s.keepsakes.length} / {Object.keys(KEEPSAKES).length}
            </span>
            <span className="counter flat" title="Pawprints">
              <PawIcon /> {s.pawprints}
            </span>
            <button className="btn small soft" onClick={closeMenu}>
              Close <span className="key">M</span>
            </button>
          </div>
        </header>
        <div className="mapbody">
          <div className="mapcanvas" ref={wrap}>
            <svg viewBox="0 0 100 62.5" preserveAspectRatio="none">
              {LINKS.filter(([a, b]) => open(a) && open(b)).map(([a, b]) => {
                const A = REGIONS.find((r) => r.id === a)!.map, B = REGIONS.find((r) => r.id === b)!.map
                return (
                  <path
                    key={a + b}
                    d={`M ${A.x} ${H(A.y)} Q ${(A.x + B.x) / 2 + 6} ${H((A.y + B.y) / 2) - 4} ${B.x} ${H(B.y)}`}
                    fill="none"
                    stroke="#f27aa6"
                    strokeWidth="0.6"
                    strokeDasharray="1.2 1.6"
                    strokeLinecap="round"
                  />
                )
              })}
            </svg>
            {REGIONS.map((r) => {
              const isOpen = open(r.id)
              const size = (r.map.r * 2 * w) / 100
              const here = s.region === r.id
              const hasObjective = objective?.region === r.id
              const hidden = r.id === 'garden' && !isOpen
              return (
                <button
                  key={r.id}
                  className={`region ${isOpen ? '' : 'locked'} ${reveal === r.id ? 'revealing' : ''} ${sel === r.id ? 'sel' : ''}`}
                  style={{ left: `${r.map.x}%`, top: `${r.map.y}%`, width: size, height: size }}
                  onClick={() => {
                    setSel(r.id)
                    audio.sfx('click')
                  }}
                >
                  <div className="blob" style={isOpen ? { background: REGION_COLORS[r.id] } : undefined} />
                  {here && <span className="here-dot" title="You are here" />}
                  {hasObjective && (
                    <span className="obj-star">
                      <StarIcon size={22} color="#f27aa6" />
                    </span>
                  )}
                  <div className={`label ${r.id === 'forest' ? 'top' : ''}`}>
                    {hidden ? '???' : r.name}
                    <small>{isOpen ? (here ? 'You are here' : r.tagline) : hidden ? 'Somewhere far away' : 'Not yet revealed'}</small>
                  </div>
                </button>
              )
            })}
          </div>
          <div className="mapdetail" ref={detail}>
            <h3>{sel === 'garden' && !open(sel) ? '???' : selDef.name}</h3>
            {open(sel) && visited(sel) && isBuilt(sel) ? (
              <div className="detail-map">{dw > 0 && <RegionDetailCanvas id={sel} size={Math.min(dw, 300)} />}</div>
            ) : (
              <p className="muted">
                {!open(sel) ? 'Clouds still cover this part of the map.' : !isBuilt(sel) ? 'This chapter is still being written.' : 'You haven’t been here yet.'}
              </p>
            )}
            <p className="muted">
              {objective ? (
                <>
                  Next: <span className="now">{objective.text}</span>
                  {objective.region !== s.region && runtime.objectiveVia ? ` (head toward ${runtime.objectiveVia})` : ''}
                </>
              ) : (
                'Purrland is shining. Explore together!'
              )}
            </p>
            {canTravel && (
              <button
                className="btn small"
                onClick={() => {
                  closeMenu()
                  travelTo(sel, regionRT(sel).defaultEntry)
                }}
              >
                Travel to {selDef.name}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
