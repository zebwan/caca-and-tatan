/**
 * Analytic terrain for the meadow. Every system (mesh, physics, camera,
 * minimap) samples the same functions, so they always agree.
 */
import { MEADOW } from './layout'
import type { Vec2 } from '../../data/types'

export const WATER_LEVEL = 0.25
const BANK = 0.8

// ── small math helpers ───────────────────────────────────────────────────────
export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export function smoothstep(e0: number, e1: number, x: number) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1)
  return t * t * (3 - 2 * t)
}

function hash(x: number, z: number) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453
  return s - Math.floor(s)
}
export function valueNoise(x: number, z: number) {
  const ix = Math.floor(x), iz = Math.floor(z)
  const fx = x - ix, fz = z - iz
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz)
  const a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1)
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uz)
}

export function segDist(px: number, pz: number, a: Vec2, b: Vec2) {
  const dx = b.x - a.x, dz = b.z - a.z
  const t = clamp(((px - a.x) * dx + (pz - a.z) * dz) / (dx * dx + dz * dz), 0, 1)
  const qx = a.x + dx * t - px, qz = a.z + dz * t - pz
  return Math.sqrt(qx * qx + qz * qz)
}
export function polyDist(px: number, pz: number, pts: readonly Vec2[]) {
  let d = Infinity
  for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, segDist(px, pz, pts[i], pts[i + 1]))
  return d
}

// ── queries ──────────────────────────────────────────────────────────────────
export function pathDist(x: number, z: number) {
  let d = Infinity
  for (const p of MEADOW.paths) d = Math.min(d, polyDist(x, z, p))
  const pl = MEADOW.plaza
  d = Math.min(d, Math.hypot(x - pl.x, z - pl.z) - pl.r + MEADOW.pathHalfWidth)
  return d
}

/** Signed distance to open water edge (negative = inside water). */
export function waterDist(x: number, z: number) {
  const ds = polyDist(x, z, MEADOW.stream) - MEADOW.streamHalfWidth
  const p = MEADOW.pond
  const dp = Math.hypot(x - p.x, z - p.z) - p.r
  let d = Math.min(ds, dp)
  const is = MEADOW.island
  const di = Math.hypot(x - is.x, z - is.z) - is.r
  if (di < 0) d = Math.max(d, -di)
  return d
}

function gauss(x: number, z: number, cx: number, cz: number, sigma: number) {
  const dx = x - cx, dz = z - cz
  return Math.exp(-(dx * dx + dz * dz) / (2 * sigma * sigma))
}

export function baseHeight(x: number, z: number) {
  let h =
    1.4 +
    0.7 * Math.sin(x * 0.055 + 0.7) * Math.cos(z * 0.048 - 0.3) +
    0.42 * Math.sin(x * 0.11 - z * 0.083 + 1.9) +
    0.5 * (valueNoise(x * 0.07, z * 0.07) - 0.5)
  const hl = MEADOW.hill
  h += hl.amp * gauss(x, z, hl.x, hl.z, hl.sigma)
  h += 1.3 * gauss(x, z, 9, 45, 6)
  h += 1.9 * gauss(x, z, -43, -31, 6.5)
  h += 1.1 * gauss(x, z, -12, -30, 7)
  const r = Math.hypot(x, z)
  if (r > MEADOW.bowlStart) {
    const t = smoothstep(MEADOW.bowlStart, 80, r)
    h += 16 * t * t + 3.5 * t * valueNoise(x * 0.05 + 7, z * 0.05)
  }
  return Math.max(h, 0.95)
}

const FLATS: { x: number; z: number; r: number; h: number }[] = []
function flats() {
  if (FLATS.length) return FLATS
  const add = (x: number, z: number, r: number) => FLATS.push({ x, z, r, h: baseHeight(x, z) })
  add(MEADOW.plaza.x, MEADOW.plaza.z, 7)
  add(MEADOW.circle.x, MEADOW.circle.z, 10.5)
  add(MEADOW.cottage.x, MEADOW.cottage.z, 7.5)
  add(MEADOW.arch.x, MEADOW.arch.z, 5.5)
  add(MEADOW.notePost.x, MEADOW.notePost.z + 1.5, 5)
  return FLATS
}

export function terrainHeight(x: number, z: number) {
  let h = baseHeight(x, z)
  for (const f of flats()) {
    const d = Math.hypot(x - f.x, z - f.z)
    if (d < f.r) h = lerp(h, f.h, 1 - smoothstep(f.r * 0.55, f.r, d))
  }
  const w = waterDist(x, z)
  if (w < 4.2) {
    h = lerp(h, BANK, 1 - smoothstep(1.0, 4.2, w))
    if (w < 1.0) {
      const isPond = Math.hypot(x - MEADOW.pond.x, z - MEADOW.pond.z) < MEADOW.pond.r + 1.5
      h = lerp(h, isPond ? -1.0 : -0.65, smoothstep(1.0, -1.4, w))
    }
  }
  return h
}

/** Terrain is below the water surface here (ignores platforms). */
export function isWater(x: number, z: number) {
  return terrainHeight(x, z) < WATER_LEVEL - 0.02
}

export function inField(x: number, z: number) {
  const f = MEADOW.fieldCenter
  return Math.hypot(x - f.x, z - f.z) < MEADOW.fieldRadius
}
