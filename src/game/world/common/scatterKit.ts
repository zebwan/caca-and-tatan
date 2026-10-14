/** Deterministic, region-configurable placement of trees, rocks, bushes, flowers, grass and mushrooms. */
import { mulberry32 } from '../meadow/scatter'
import type { Scatter, TreeSpot, PropSpot } from './Vegetation'
import type { TreeKind } from './treeKinds'

export interface ScatterConfig {
  seed: number
  heightAt: (x: number, z: number) => number
  waterDist: (x: number, z: number) => number
  pathDist: (x: number, z: number) => number
  pathHalfWidth?: number
  keepClear: { x: number; z: number; r: number }[]
  /** Extra "no vegetation here" test (buildings, plazas…). */
  blocked?: (x: number, z: number) => boolean
  features?: { x: number; z: number; s: number; kind: TreeKind; rot?: number }[]
  trees: { count: number; spacing: number; rMax: number; kind: (x: number, z: number, r: () => number) => TreeKind; scale?: [number, number] }
  outer: { count: number; rMin: number; rMax: number; kind: (x: number, z: number, r: () => number) => TreeKind; skip?: (x: number, z: number) => boolean }
  rocks: number
  bushes: number
  flowers: { sprinkle: number; clumps?: { x: number; z: number; r: number; count: number }[] }
  grass: number
  grassRadius?: number
  mushroomChance?: number
}

export function makeScatter(c: ScatterConfig): Scatter {
  const rnd = mulberry32(c.seed)
  const phw = c.pathHalfWidth ?? 1.25
  const clear = (x: number, z: number, extra: number) => {
    for (const k of c.keepClear) if (Math.hypot(x - k.x, z - k.z) < k.r + extra) return false
    return !(c.blocked && c.blocked(x, z))
  }
  const placeable = (x: number, z: number, margin: number) =>
    c.pathDist(x, z) > phw + margin && c.waterDist(x, z) > 1.2 + margin && clear(x, z, margin)

  const trees: TreeSpot[] = []
  for (const f of c.features ?? []) trees.push({ x: f.x, z: f.z, y: c.heightAt(f.x, f.z), s: f.s, rot: f.rot ?? 0, kind: f.kind, collide: true })
  const [smin, smax] = c.trees.scale ?? [0.85, 1.3]
  let tries = 0
  const target = trees.length + c.trees.count
  while (trees.length < target && tries++ < 5000) {
    const a = rnd() * Math.PI * 2
    const r = 6 + Math.sqrt(rnd()) * (c.trees.rMax - 6)
    const x = Math.cos(a) * r, z = Math.sin(a) * r
    if (!placeable(x, z, 2.2)) continue
    if (trees.some((t) => Math.hypot(t.x - x, t.z - z) < c.trees.spacing)) continue
    trees.push({ x, z, y: c.heightAt(x, z), s: smin + rnd() * (smax - smin), rot: rnd() * 6.28, kind: c.trees.kind(x, z, rnd), collide: true })
  }
  for (let i = 0; i < c.outer.count; i++) {
    const a = rnd() * Math.PI * 2
    const r = c.outer.rMin + rnd() * (c.outer.rMax - c.outer.rMin)
    const x = Math.cos(a) * r, z = Math.sin(a) * r
    if (c.waterDist(x, z) < 3) continue
    if (c.outer.skip?.(x, z)) continue
    trees.push({ x, z, y: c.heightAt(x, z) - 0.2, s: 1.1 + rnd() * 0.7, rot: rnd() * 6.28, kind: c.outer.kind(x, z, rnd), collide: false })
  }

  const scatterProps = (count: number, margin: number, rMax: number, avoidTrees: number, sMin: number, sMax: number) => {
    const out: PropSpot[] = []
    let t = 0
    while (out.length < count && t++ < count * 80) {
      const a = rnd() * Math.PI * 2
      const r = 6 + Math.sqrt(rnd()) * (rMax - 6)
      const x = Math.cos(a) * r, z = Math.sin(a) * r
      if (!placeable(x, z, margin)) continue
      if (trees.some((tr) => Math.hypot(tr.x - x, tr.z - z) < avoidTrees)) continue
      if (out.some((o) => Math.hypot(o.x - x, o.z - z) < 1.8)) continue
      out.push({ x, z, y: c.heightAt(x, z), s: sMin + rnd() * (sMax - sMin), rot: rnd() * 6.28, tint: rnd() })
    }
    return out
  }
  const rocks = scatterProps(c.rocks, 1.2, 50, 2.5, 0.35, 0.9)
  const bushes = scatterProps(c.bushes, 1.4, 50, 2.4, 0.6, 1.1).filter((b) => !rocks.some((r) => Math.hypot(r.x - b.x, r.z - b.z) < 2))

  const flowers: PropSpot[] = []
  for (const cl of c.flowers.clumps ?? []) {
    for (let i = 0; i < cl.count; i++) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * cl.r
      const x = cl.x + Math.cos(a) * r, z = cl.z + Math.sin(a) * r
      if (c.pathDist(x, z) < 1.5 || c.waterDist(x, z) < 0.8 || !clear(x, z, -1)) continue
      flowers.push({ x, z, y: c.heightAt(x, z), s: 0.8 + rnd() * 0.5, rot: rnd() * 6.28, tint: rnd() })
    }
  }
  for (let i = 0; i < c.flowers.sprinkle * 2.5; i++) {
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 54
    const x = Math.cos(a) * r, z = Math.sin(a) * r
    if (c.pathDist(x, z) < 1.6 || c.waterDist(x, z) < 0.6 || !clear(x, z, -1.5)) continue
    if (Math.sin(x * 0.21) * Math.cos(z * 0.17) + rnd() * 0.9 < 0.35) continue
    flowers.push({ x, z, y: c.heightAt(x, z), s: 0.7 + rnd() * 0.5, rot: rnd() * 6.28, tint: rnd() })
  }

  const grass: PropSpot[] = []
  const gr = c.grassRadius ?? 62
  for (let i = 0; i < c.grass * 1.8 && grass.length < c.grass; i++) {
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * gr
    const x = Math.cos(a) * r, z = Math.sin(a) * r
    const pd = c.pathDist(x, z)
    if (pd < phw - 0.2 + rnd() * 0.5 || c.waterDist(x, z) < 0.35) continue
    if (c.blocked && c.blocked(x, z)) continue
    grass.push({ x, z, y: c.heightAt(x, z), s: 0.6 + rnd() * 0.7 * (pd < 2.5 ? 0.6 : 1), rot: rnd() * 6.28, tint: rnd() })
  }

  const mushrooms: PropSpot[] = []
  const mc = c.mushroomChance ?? 0.45
  for (const t of trees) {
    if (!t.collide || rnd() > mc) continue
    const a = rnd() * 6.28
    const x = t.x + Math.cos(a) * 1.6, z = t.z + Math.sin(a) * 1.6
    if (!placeable(x, z, 0.2)) continue
    mushrooms.push({ x, z, y: c.heightAt(x, z), s: 0.6 + rnd() * 0.5, rot: rnd() * 6.28, tint: rnd() })
  }

  return { trees, rocks, bushes, flowers, grass, mushrooms }
}
