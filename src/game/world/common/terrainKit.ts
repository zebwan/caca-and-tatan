/**
 * Generic analytic terrain for a 170×170 region "bowl": rolling base, hills,
 * flattened plazas, streams, ponds (with optional islands), an optional sea,
 * and rising edges that frame the play area.
 */
import type { Vec2 } from '../../data/types'
import { lerp, polyDist, smoothstep, valueNoise } from '../meadow/terrain'

export interface TerrainConfig {
  base: (x: number, z: number) => number
  hills?: { x: number; z: number; amp: number; sigma: number }[]
  flats?: { x: number; z: number; r: number }[]
  streams?: { pts: Vec2[]; halfWidth: number }[]
  ponds?: { x: number; z: number; r: number; island?: { x: number; z: number; r: number } }[]
  /** Signed distance to the sea shore, negative out at sea. */
  sea?: (x: number, z: number) => number
  bowlStart: number
  /** Where the bowl does not rise (e.g. toward the sea). */
  bowlMask?: (x: number, z: number) => number
  waterLevel?: number
  minHeight?: number
}

export interface Terrain {
  heightAt: (x: number, z: number) => number
  waterDist: (x: number, z: number) => number
  isWater: (x: number, z: number) => boolean
  waterLevel: number
}

function gauss(x: number, z: number, cx: number, cz: number, sigma: number) {
  const dx = x - cx, dz = z - cz
  return Math.exp(-(dx * dx + dz * dz) / (2 * sigma * sigma))
}

export function makeTerrain(cfg: TerrainConfig): Terrain {
  const WL = cfg.waterLevel ?? 0.25
  const minH = cfg.minHeight ?? 0.95

  const raw = (x: number, z: number) => {
    let h = cfg.base(x, z)
    for (const hl of cfg.hills ?? []) h += hl.amp * gauss(x, z, hl.x, hl.z, hl.sigma)
    const r = Math.hypot(x, z)
    if (r > cfg.bowlStart) {
      const t = smoothstep(cfg.bowlStart, 80, r)
      const m = cfg.bowlMask ? cfg.bowlMask(x, z) : 1
      h += (16 * t * t + 3.5 * t * valueNoise(x * 0.05 + 7, z * 0.05)) * m
    }
    return Math.max(h, minH)
  }
  const flats = (cfg.flats ?? []).map((f) => ({ ...f, h: raw(f.x, f.z) }))

  const waterDist = (x: number, z: number) => {
    let d = Infinity
    for (const s of cfg.streams ?? []) d = Math.min(d, polyDist(x, z, s.pts) - s.halfWidth)
    for (const p of cfg.ponds ?? []) {
      let dp = Math.hypot(x - p.x, z - p.z) - p.r
      if (p.island) {
        const di = Math.hypot(x - p.island.x, z - p.island.z) - p.island.r
        if (di < 0) dp = Math.max(dp, -di)
      }
      d = Math.min(d, dp)
    }
    if (cfg.sea) d = Math.min(d, cfg.sea(x, z))
    return d
  }

  const heightAt = (x: number, z: number) => {
    let h = raw(x, z)
    for (const f of flats) {
      const d = Math.hypot(x - f.x, z - f.z)
      if (d < f.r) h = lerp(h, f.h, 1 - smoothstep(f.r * 0.55, f.r, d))
    }
    if (cfg.sea) {
      const s = cfg.sea(x, z)
      if (s < 10) {
        // beach slopes gently down into the sea
        h = lerp(h, 0.62 + Math.max(0, s) * 0.06, 1 - smoothstep(2, 10, s))
        if (s < 0.6) h = lerp(h, -2.6, smoothstep(0.6, -6, s))
      }
    }
    let w = Infinity
    for (const st of cfg.streams ?? []) w = Math.min(w, polyDist(x, z, st.pts) - st.halfWidth)
    let pondW = Infinity
    for (const p of cfg.ponds ?? []) {
      let dp = Math.hypot(x - p.x, z - p.z) - p.r
      if (p.island) {
        const di = Math.hypot(x - p.island.x, z - p.island.z) - p.island.r
        if (di < 0) dp = Math.max(dp, -di)
      }
      pondW = Math.min(pondW, dp)
    }
    const ww = Math.min(w, pondW)
    if (ww < 4.2) {
      h = lerp(h, 0.8, 1 - smoothstep(1.0, 4.2, ww))
      if (ww < 1.0) h = lerp(h, pondW <= w ? -1.0 : -0.65, smoothstep(1.0, -1.4, ww))
    }
    return h
  }

  return {
    heightAt,
    waterDist,
    isWater: (x, z) => heightAt(x, z) < WL - 0.02,
    waterLevel: WL,
  }
}

/** Distance to a set of polylines (paths) plus round plazas. */
export function makePathDist(paths: Vec2[][], plazas: { x: number; z: number; r: number }[] = [], halfWidth = 1.25) {
  return (x: number, z: number) => {
    let d = Infinity
    for (const p of paths) d = Math.min(d, polyDist(x, z, p))
    for (const pl of plazas) d = Math.min(d, Math.hypot(x - pl.x, z - pl.z) - pl.r + halfWidth)
    return d
  }
}

export function rollingBase(seed: number, amp = 1) {
  return (x: number, z: number) =>
    1.4 +
    amp *
      (0.7 * Math.sin(x * 0.055 + seed) * Math.cos(z * 0.048 - seed * 0.7) +
        0.42 * Math.sin(x * 0.11 - z * 0.083 + seed * 1.3) +
        0.5 * (valueNoise(x * 0.07 + seed * 3, z * 0.07) - 0.5))
}
