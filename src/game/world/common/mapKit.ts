/**
 * Paints a top-down illustrated map for any region from its real terrain
 * colours, plus overlays (trees, buildings…), so maps always match the world.
 */
import * as THREE from 'three'
import { MAP_EXTENT } from '../../systems/exploration'
import type { Scatter } from './Vegetation'
import type { TreeKind } from './treeKinds'

export const MAP_N = 512
export const MAP_U = MAP_N / (2 * MAP_EXTENT)

export function mapPoint(x: number, z: number) {
  return { x: ((x + MAP_EXTENT) / (2 * MAP_EXTENT)) * MAP_N, y: ((z + MAP_EXTENT) / (2 * MAP_EXTENT)) * MAP_N }
}

export interface MapDraw {
  ctx: CanvasRenderingContext2D
  circle: (x: number, z: number, r: number, fill: string, stroke?: string, lw?: number) => void
  rect: (x: number, z: number, hw: number, hd: number, yaw: number, fill: string, stroke?: string) => void
  line: (pts: { x: number; z: number }[], color: string, width: number) => void
}

const TREE_MAP: Record<TreeKind, [string, string]> = {
  cherry: ['#f7bdd2', '#e597b4'],
  green: ['#9fd08a', '#7db36c'],
  lavender: ['#cdbdf0', '#a995d9'],
  fruit: ['#a6d48a', '#82b56e'],
  moon: ['#9886d0', '#76669f'],
  mushroom: ['#f59bc4', '#d777a2'],
  palm: ['#9fd88f', '#7eb86e'],
  star: ['#fff0f6', '#e8c2d6'],
}

export function paintRegionMap(opts: {
  heightAt: (x: number, z: number) => number
  colorAt: (x: number, z: number, h: number, out: THREE.Color) => void
  playRadius: number
  outside?: string
  scatter?: Scatter
  overlays?: (d: MapDraw) => void
  /** Brighten/flatten the 3D colours so the map reads clearly. */
  lift?: number
}) {
  const c = document.createElement('canvas')
  c.width = c.height = MAP_N
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(MAP_N, MAP_N)
  const step = (2 * MAP_EXTENT) / MAP_N
  const col = new THREE.Color()
  const out = new THREE.Color(opts.outside ?? '#e9dfcf')
  const lift = opts.lift ?? 0.12
  for (let j = 0; j < MAP_N; j++) {
    for (let i = 0; i < MAP_N; i++) {
      const x = -MAP_EXTENT + (i + 0.5) * step
      const z = -MAP_EXTENT + (j + 0.5) * step
      const h = opts.heightAt(x, z)
      opts.colorAt(x, z, h, col)
      col.lerp(new THREE.Color(1, 1, 1), lift)
      const hx = opts.heightAt(x + step, z) - h
      const hz = opts.heightAt(x, z + step) - h
      const shade = Math.max(-0.16, Math.min(0.16, (-hx - hz) * 1.3))
      if (Math.hypot(x, z) > opts.playRadius + 1) col.lerp(out, 0.45)
      const k = (j * MAP_N + i) * 4
      // colours are linear; convert to sRGB for the canvas
      const s = col.clone().convertLinearToSRGB()
      img.data[k] = Math.min(255, s.r * 255 * (1 + shade))
      img.data[k + 1] = Math.min(255, s.g * 255 * (1 + shade))
      img.data[k + 2] = Math.min(255, s.b * 255 * (1 + shade))
      img.data[k + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)

  const draw: MapDraw = {
    ctx,
    circle: (x, z, r, fill, stroke, lw = 1.2) => {
      const p = mapPoint(x, z)
      ctx.beginPath()
      ctx.arc(p.x, p.y, Math.max(1, r * MAP_U), 0, Math.PI * 2)
      ctx.fillStyle = fill
      ctx.fill()
      if (stroke) {
        ctx.strokeStyle = stroke
        ctx.lineWidth = lw
        ctx.stroke()
      }
    },
    rect: (x, z, hw, hd, yaw, fill, stroke) => {
      const p = mapPoint(x, z)
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(-yaw)
      ctx.fillStyle = fill
      ctx.fillRect(-hw * MAP_U, -hd * MAP_U, hw * 2 * MAP_U, hd * 2 * MAP_U)
      if (stroke) {
        ctx.strokeStyle = stroke
        ctx.lineWidth = 1.5
        ctx.strokeRect(-hw * MAP_U, -hd * MAP_U, hw * 2 * MAP_U, hd * 2 * MAP_U)
      }
      ctx.restore()
    },
    line: (pts, color, width) => {
      ctx.beginPath()
      pts.forEach((pt, i) => {
        const p = mapPoint(pt.x, pt.z)
        if (i === 0) ctx.moveTo(p.x, p.y)
        else ctx.lineTo(p.x, p.y)
      })
      ctx.strokeStyle = color
      ctx.lineWidth = width * MAP_U
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
    },
  }

  if (opts.scatter) {
    for (const r of opts.scatter.rocks) draw.circle(r.x, r.z, 0.8 * r.s, '#d8d2cc', '#b7aea6')
    for (const b of opts.scatter.bushes) draw.circle(b.x, b.z, 0.85 * b.s, '#9ccc86', '#7fb06c')
  }
  opts.overlays?.(draw)
  if (opts.scatter) {
    for (const t of opts.scatter.trees) {
      if (Math.hypot(t.x, t.z) > MAP_EXTENT + 4) continue
      const [f, s] = TREE_MAP[t.kind]
      draw.circle(t.x, t.z, 1.6 * t.s, f, s, 1.4)
    }
  }
  return c
}
