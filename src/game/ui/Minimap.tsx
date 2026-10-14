/**
 * Circular minimap drawn from the real top-down map of the region.
 * Rotates with the camera, centred on Caca, fog of war from exploration,
 * active objective as a pink star (clamped to the rim when far away),
 * completed objectives as small gold stars.
 */
import { memo, useEffect, useMemo, useRef } from 'react'
import { runtime } from '../state/runtime'
import { game } from '../state/store'
import { exploration, MAP_EXTENT } from '../systems/exploration'
import { completedLocations } from '../systems/quests'
import { CURRENT_REGION, REGION_RUNTIME } from '../world/regions'

export function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, stroke = '#fff') {
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2
    const rr = i % 2 === 0 ? r : r * 0.45
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
  }
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  ctx.lineWidth = Math.max(1.5, r * 0.22)
  ctx.strokeStyle = stroke
  ctx.stroke()
}

export function drawPlayerArrow(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, size: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.beginPath()
  ctx.moveTo(0, -size)
  ctx.lineTo(size * 0.72, size * 0.75)
  ctx.lineTo(0, size * 0.35)
  ctx.lineTo(-size * 0.72, size * 0.75)
  ctx.closePath()
  ctx.fillStyle = '#f27aa6'
  ctx.fill()
  ctx.lineWidth = 2.5
  ctx.strokeStyle = '#fff'
  ctx.stroke()
  ctx.restore()
}

/** Map image with fog applied, rebuilt only when exploration changes. */
export function useFoggedMap() {
  const ref = useRef<{ canvas: HTMLCanvasElement; version: number } | null>(null)
  return useMemo(() => () => {
    const region = REGION_RUNTIME[CURRENT_REGION]!
    const base = region.mapImage()
    if (!ref.current) {
      const c = document.createElement('canvas')
      c.width = base.width
      c.height = base.height
      ref.current = { canvas: c, version: -1 }
    }
    const r = ref.current
    if (r.version !== exploration.version) {
      const ctx = r.canvas.getContext('2d')!
      ctx.globalCompositeOperation = 'source-over'
      ctx.drawImage(base, 0, 0)
      // parchment fog where unexplored
      const fog = document.createElement('canvas')
      fog.width = fog.height = 128
      const f = fog.getContext('2d')!
      f.fillStyle = '#f3e6d3'
      f.fillRect(0, 0, 128, 128)
      f.globalCompositeOperation = 'destination-in'
      f.drawImage(exploration.mask, 0, 0)
      ctx.imageSmoothingEnabled = true
      ctx.globalAlpha = 0.93
      ctx.drawImage(fog, 0, 0, r.canvas.width, r.canvas.height)
      ctx.globalAlpha = 1
      r.version = exploration.version
    }
    return r.canvas
  }, [])
}

export const Minimap = memo(function Minimap() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const getMap = useFoggedMap()

  useEffect(() => {
    let raf = 0
    let last = 0
    let pulseVersion = game.get().mapVersion
    let pulseStart = -10
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      if (now - last < 40) return
      last = now
      const c = canvas.current
      if (!c) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const size = c.clientWidth
      if (c.width !== Math.round(size * dpr)) {
        c.width = c.height = Math.round(size * dpr)
      }
      const ctx = c.getContext('2d')!
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const R = size / 2
      const view = 28 // world units from centre to rim
      const k = R / view
      const P = runtime.player.pos
      const yaw = runtime.camera.yaw
      const s = game.get()
      if (s.mapVersion !== pulseVersion) {
        pulseVersion = s.mapVersion
        pulseStart = now
      }

      ctx.clearRect(0, 0, size, size)
      ctx.save()
      ctx.beginPath()
      ctx.arc(R, R, R, 0, Math.PI * 2)
      ctx.clip()
      ctx.fillStyle = '#efe3cf'
      ctx.fillRect(0, 0, size, size)

      ctx.save()
      ctx.translate(R, R)
      ctx.rotate(yaw)
      ctx.translate(-P.x * k, -P.z * k)
      ctx.drawImage(getMap(), -MAP_EXTENT * k, -MAP_EXTENT * k, MAP_EXTENT * 2 * k, MAP_EXTENT * 2 * k)
      ctx.restore()

      // world → minimap screen
      const toScreen = (x: number, z: number) => {
        const dx = (x - P.x) * k, dz = (z - P.z) * k
        const c0 = Math.cos(yaw), s0 = Math.sin(yaw)
        return { x: R + dx * c0 - dz * s0, y: R + dx * s0 + dz * c0 }
      }

      const region = REGION_RUNTIME[CURRENT_REGION]!
      for (const l of region.landmarks) {
        if (l.kind !== 'npc') continue
        const p = toScreen(l.x, l.z)
        ctx.beginPath()
        ctx.arc(p.x, p.y, 3.6, 0, Math.PI * 2)
        ctx.fillStyle = '#fff8f2'
        ctx.fill()
        ctx.lineWidth = 1.5
        ctx.strokeStyle = '#b48aa0'
        ctx.stroke()
      }
      for (const loc of completedLocations(s.quests)) {
        const p = toScreen(loc.x, loc.z)
        drawStar(ctx, p.x, p.y, 6, '#f7d774')
      }

      // objective
      const o = runtime.objective
      if (o) {
        let p = toScreen(o.x, o.z)
        const dx = p.x - R, dy = p.y - R
        const d = Math.hypot(dx, dy)
        const rim = R - 13
        const far = d > rim
        if (far) p = { x: R + (dx / d) * rim, y: R + (dy / d) * rim }
        const pulse = 1 + Math.sin(now / 260) * 0.12
        drawStar(ctx, p.x, p.y, (far ? 8 : 10) * pulse, '#f27aa6')
      }

      // player
      const facing = runtime.player.yaw
      const fx = Math.sin(facing), fz = Math.cos(facing)
      const sx = fx * Math.cos(yaw) - fz * Math.sin(yaw)
      const sy = fx * Math.sin(yaw) + fz * Math.cos(yaw)
      drawPlayerArrow(ctx, R, R, Math.atan2(sx, -sy), 9)

      // map-updated pulse ring
      const pt = (now - pulseStart) / 1200
      if (pt >= 0 && pt < 1) {
        ctx.beginPath()
        ctx.arc(R, R, R * (0.2 + pt * 0.85), 0, Math.PI * 2)
        ctx.lineWidth = 6 * (1 - pt)
        ctx.strokeStyle = `rgba(242, 122, 166, ${1 - pt})`
        ctx.stroke()
      }
      ctx.restore()

      // north marker on the rim
      const nx = R + Math.sin(yaw) * (R - 11), ny = R - Math.cos(yaw) * (R - 11)
      ctx.beginPath()
      ctx.arc(nx, ny, 9, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.fillStyle = '#b48aa0'
      ctx.font = '600 11px Fredoka, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('N', nx, ny + 0.5)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [getMap])

  return <canvas ref={canvas} className="minimap" aria-label="Minimap" />
})
