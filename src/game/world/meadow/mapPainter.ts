/**
 * Paints a top-down illustrated map of the meadow from the real terrain and
 * layout data, so the minimap and world map always match the 3D world.
 */
import { MEADOW } from './layout'
import { meadowScatter } from './scatter'
import { inField, pathDist, terrainHeight, valueNoise, WATER_LEVEL } from './terrain'
import { MAP_EXTENT } from '../../systems/exploration'

const N = 512
let painted: HTMLCanvasElement | null = null

const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t)

export function worldToMap(x: number, z: number, size = N) {
  return { x: ((x + MAP_EXTENT) / (2 * MAP_EXTENT)) * size, y: ((z + MAP_EXTENT) / (2 * MAP_EXTENT)) * size }
}

export function meadowMapImage(): HTMLCanvasElement {
  if (painted) return painted
  const c = document.createElement('canvas')
  c.width = c.height = N
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(N, N)
  const grassLo = hex('#bfe0a0'), grassHi = hex('#a3cd88'), grassDark = hex('#93c07c')
  const water = hex('#a6d8f2'), deep = hex('#8cc6ea'), shore = hex('#dff2fb')
  const path = hex('#f7e8cb'), pathEdge = hex('#eed9b2'), field = hex('#f4c2d4')
  const outside = hex('#c9d9b4')
  const step = (2 * MAP_EXTENT) / N

  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const x = -MAP_EXTENT + (i + 0.5) * step
      const z = -MAP_EXTENT + (j + 0.5) * step
      const h = terrainHeight(x, z)
      let col: number[]
      if (h < WATER_LEVEL) {
        col = mix(shore, h < -0.3 ? deep : water, Math.min(1, (WATER_LEVEL - h) * 3.5))
      } else {
        const hx = terrainHeight(x + step, z) - h
        const hz = terrainHeight(x, z + step) - h
        const shade = Math.max(-0.18, Math.min(0.18, (-hx - hz) * 1.4))
        const n = valueNoise(x * 0.3, z * 0.3)
        col = mix(grassLo, grassHi, Math.min(1, Math.max(0, (h - 0.8) / 4)))
        col = mix(col, grassDark, n * 0.35)
        if (inField(x, z) && valueNoise(x * 2.1, z * 2.1) > 0.55) col = mix(col, field, 0.75)
        const pd = pathDist(x, z)
        if (pd < MEADOW.pathHalfWidth) col = mix(path, pathEdge, Math.max(0, pd / MEADOW.pathHalfWidth - 0.6) * 2)
        if (Math.hypot(x, z) > MEADOW.playRadius + 1) col = mix(col, outside, 0.55)
        col = col.map((v) => v * (1 + shade))
      }
      const k = (j * N + i) * 4
      img.data[k] = col[0]
      img.data[k + 1] = col[1]
      img.data[k + 2] = col[2]
      img.data[k + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)

  const P = (x: number, z: number) => worldToMap(x, z)
  const U = N / (2 * MAP_EXTENT) // pixels per world unit
  const circle = (x: number, z: number, r: number, fill: string, stroke?: string, lw = 1.2) => {
    const p = P(x, z)
    ctx.beginPath()
    ctx.arc(p.x, p.y, r * U, 0, Math.PI * 2)
    ctx.fillStyle = fill
    ctx.fill()
    if (stroke) {
      ctx.strokeStyle = stroke
      ctx.lineWidth = lw
      ctx.stroke()
    }
  }

  // plaza + heart garden
  circle(MEADOW.plaza.x, MEADOW.plaza.z, MEADOW.plaza.r, '#f7e8cb')
  circle(MEADOW.circle.x, MEADOW.circle.z, MEADOW.circleRadius, '#efe4d6', '#d9c9b8', 1.5)
  for (const t of MEADOW.tiles) circle(t.x, t.z, MEADOW.tileRadius, t.color, '#ffffffaa')
  circle(MEADOW.circle.x, MEADOW.circle.z, 0.8, '#ffd6e6', '#e58fb0')

  // bridge, stones, lily pads
  {
    const b = MEADOW.bridge
    const p = P(b.x - b.hw, b.z - b.hd)
    ctx.fillStyle = '#c99a72'
    ctx.strokeStyle = '#a77a55'
    ctx.lineWidth = 1.2
    ctx.fillRect(p.x, p.y, b.hw * 2 * U, b.hd * 2 * U)
    ctx.strokeRect(p.x, p.y, b.hw * 2 * U, b.hd * 2 * U)
  }
  for (const s of MEADOW.stones) circle(s.x, s.z, s.r, '#e6ddd3', '#b9ab9c')
  for (const s of MEADOW.lilyPads) circle(s.x, s.z, s.r, '#9fd38c', '#78b067')

  // cottage
  {
    const c0 = MEADOW.cottage
    const p = P(c0.x, c0.z)
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(-c0.yaw)
    ctx.fillStyle = '#f39bb9'
    ctx.strokeStyle = '#d97a9b'
    ctx.lineWidth = 1.5
    ctx.fillRect(-c0.hw * U, -c0.hd * U, c0.hw * 2 * U, c0.hd * 2 * U)
    ctx.strokeRect(-c0.hw * U, -c0.hd * U, c0.hw * 2 * U, c0.hd * 2 * U)
    ctx.beginPath()
    ctx.moveTo(0, -c0.hd * U)
    ctx.lineTo(0, c0.hd * U)
    ctx.stroke()
    ctx.restore()
  }

  const { trees, rocks, bushes } = meadowScatter()
  for (const r of rocks) circle(r.x, r.z, 0.8 * r.s, '#d8d2cc', '#b7aea6')
  for (const s of MEADOW.rockSteps) circle(s.x, s.z, s.r, '#d3ccc4', '#a99f95', 1.4)
  for (const b of bushes) circle(b.x, b.z, 0.85 * b.s, '#9ccc86', '#7fb06c')
  const treeCol: Record<string, [string, string]> = {
    cherry: ['#f7bdd2', '#e597b4'],
    green: ['#9fd08a', '#7db36c'],
    lavender: ['#cdbdf0', '#a995d9'],
  }
  for (const t of trees) {
    if (Math.hypot(t.x, t.z) > MAP_EXTENT + 4) continue
    const [f, s] = treeCol[t.kind]
    circle(t.x, t.z, 1.7 * t.s, f, s, 1.4)
  }

  // arch
  {
    const a = P(MEADOW.arch.x, MEADOW.arch.z)
    ctx.strokeStyle = '#e58fb0'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(a.x - 2.4 * U, a.y)
    ctx.lineTo(a.x + 2.4 * U, a.y)
    ctx.stroke()
  }

  painted = c
  return c
}
