/**
 * Deterministic placement of trees, rocks, bushes, flowers and grass.
 * Shared by rendering, physics and the map painter so they always match.
 */
import { MEADOW } from './layout'
import { inField, pathDist, terrainHeight, waterDist } from './terrain'

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type TreeKind = 'cherry' | 'green' | 'lavender'
export interface TreeSpot { x: number; z: number; y: number; s: number; rot: number; kind: TreeKind; collide: boolean }
export interface PropSpot { x: number; z: number; y: number; s: number; rot: number; tint: number }

/** Spots that must stay clear of trees, rocks and bushes. */
const KEEP_CLEAR: { x: number; z: number; r: number }[] = [
  { ...MEADOW.spawn, r: 4.5 },
  { ...MEADOW.notePost, r: 3.5 },
  { x: MEADOW.plaza.x, z: MEADOW.plaza.z, r: 7 },
  { ...MEADOW.circle, r: 10 },
  { x: MEADOW.cottage.x, z: MEADOW.cottage.z, r: 7 },
  { ...MEADOW.arch, r: 6 },
  { ...MEADOW.npcs.mimi, r: 3 },
  { ...MEADOW.npcs.biscuit, r: 3.5 },
  { ...MEADOW.npcs.pip, r: 3 },
  { x: MEADOW.bench.x, z: MEADOW.bench.z, r: 2.5 },
  { ...MEADOW.picnic, r: 3.5 },
  { ...MEADOW.swingTree, r: 6 },
  { ...MEADOW.keepsakes.paperStar, r: 2.5 },
  { x: -40, z: -28, r: 5.5 },
  { x: 32, z: -1, r: 4 },
  { x: 0, z: 8, r: 6.5 },
  ...MEADOW.lamps.map((l) => ({ ...l, r: 1.5 })),
  { ...MEADOW.signpost, r: 2 },
]

function clearOf(x: number, z: number, extra: number) {
  for (const k of KEEP_CLEAR) if (Math.hypot(x - k.x, z - k.z) < k.r + extra) return false
  return true
}

function placeable(x: number, z: number, margin: number) {
  return pathDist(x, z) > MEADOW.pathHalfWidth + margin && waterDist(x, z) > 1.2 + margin && clearOf(x, z, margin)
}

let cache: ReturnType<typeof build> | null = null
export function meadowScatter() {
  if (!cache) cache = build()
  return cache
}

function build() {
  const rnd = mulberry32(20261014)
  const trees: TreeSpot[] = []

  const feature = (x: number, z: number, s: number, kind: TreeKind, rot = 0) =>
    trees.push({ x, z, y: terrainHeight(x, z), s, rot, kind, collide: true })
  feature(MEADOW.wakeTree.x, MEADOW.wakeTree.z, 1.55, 'cherry', 0.4)
  feature(MEADOW.swingTree.x, MEADOW.swingTree.z, 1.45, 'cherry', Math.PI)
  feature(-33.5, -5.5, 1.2, 'green', 1.2)
  feature(-6.2, -31.5, 1.25, 'cherry', 2.1)
  feature(6.4, -36.5, 1.2, 'cherry', 0.7)
  feature(-4.6, -49.5, 1.15, 'lavender', 0.3)
  feature(4.8, -49.8, 1.15, 'lavender', 2.4)
  feature(-24.5, 24.5, 1.3, 'cherry', 0.9)

  // inner meadow trees
  let tries = 0
  while (trees.length < 66 && tries++ < 3000) {
    const a = rnd() * Math.PI * 2
    const r = 8 + Math.sqrt(rnd()) * 42
    const x = Math.cos(a) * r, z = Math.sin(a) * r
    if (!placeable(x, z, 2.2) || inField(x, z)) continue
    if (trees.some((t) => Math.hypot(t.x - x, t.z - z) < 6.2)) continue
    const kind: TreeKind = x < -26 && rnd() < 0.6 ? 'lavender' : rnd() < 0.55 ? 'cherry' : 'green'
    trees.push({ x, z, y: terrainHeight(x, z), s: 0.85 + rnd() * 0.45, rot: rnd() * 6.28, kind, collide: true })
  }

  // outer ring beyond the walkable edge (no collision needed)
  for (let i = 0; i < 190; i++) {
    const a = rnd() * Math.PI * 2
    const r = 58 + rnd() * 26
    const x = Math.cos(a) * r, z = Math.sin(a) * r
    if (waterDist(x, z) < 3) continue
    // keep the view through the arch open
    if (Math.abs(x) < 7 && z < -50) continue
    const kind: TreeKind = x < -20 ? (rnd() < 0.7 ? 'lavender' : 'green') : rnd() < 0.45 ? 'cherry' : 'green'
    trees.push({ x, z, y: terrainHeight(x, z) - 0.2, s: 1.1 + rnd() * 0.7, rot: rnd() * 6.28, kind, collide: false })
  }

  const rocks: PropSpot[] = []
  tries = 0
  while (rocks.length < 26 && tries++ < 2000) {
    const a = rnd() * Math.PI * 2
    const r = 6 + Math.sqrt(rnd()) * 47
    const x = Math.cos(a) * r, z = Math.sin(a) * r
    if (!placeable(x, z, 1.2)) continue
    if (trees.some((t) => Math.hypot(t.x - x, t.z - z) < 2.5)) continue
    rocks.push({ x, z, y: terrainHeight(x, z), s: 0.35 + rnd() * 0.55, rot: rnd() * 6.28, tint: rnd() })
  }

  const bushes: PropSpot[] = []
  tries = 0
  while (bushes.length < 44 && tries++ < 3000) {
    const a = rnd() * Math.PI * 2
    const r = 6 + Math.sqrt(rnd()) * 47
    const x = Math.cos(a) * r, z = Math.sin(a) * r
    if (!placeable(x, z, 1.4) || inField(x, z)) continue
    if (trees.some((t) => Math.hypot(t.x - x, t.z - z) < 2.4)) continue
    if (rocks.some((t) => Math.hypot(t.x - x, t.z - z) < 2)) continue
    bushes.push({ x, z, y: terrainHeight(x, z), s: 0.6 + rnd() * 0.5, rot: rnd() * 6.28, tint: rnd() })
  }

  const flowers: PropSpot[] = []
  // the flower field is dense, the rest of the meadow is sprinkled
  for (let i = 0; i < 1100; i++) {
    const a = rnd() * Math.PI * 2
    const r = Math.sqrt(rnd()) * MEADOW.fieldRadius
    const x = MEADOW.fieldCenter.x + Math.cos(a) * r
    const z = MEADOW.fieldCenter.z + Math.sin(a) * r
    if (pathDist(x, z) < 1.5 || waterDist(x, z) < 0.8) continue
    flowers.push({ x, z, y: terrainHeight(x, z), s: 0.8 + rnd() * 0.5, rot: rnd() * 6.28, tint: rnd() })
  }
  for (let i = 0; i < 1500; i++) {
    const a = rnd() * Math.PI * 2
    const r = Math.sqrt(rnd()) * 54
    const x = Math.cos(a) * r, z = Math.sin(a) * r
    if (pathDist(x, z) < 1.6 || waterDist(x, z) < 0.6) continue
    if (Math.hypot(x - MEADOW.circle.x, z - MEADOW.circle.z) < 8.4) continue
    if (Math.hypot(x - MEADOW.cottage.x, z - MEADOW.cottage.z) < 4.2) continue
    // clumps: skip most flowers where low-frequency noise is low
    if (Math.sin(x * 0.21) * Math.cos(z * 0.17) + rnd() * 0.9 < 0.35) continue
    flowers.push({ x, z, y: terrainHeight(x, z), s: 0.7 + rnd() * 0.5, rot: rnd() * 6.28, tint: rnd() })
  }

  const grass: PropSpot[] = []
  for (let i = 0; i < 26000 && grass.length < 15000; i++) {
    const a = rnd() * Math.PI * 2
    const r = Math.sqrt(rnd()) * 62
    const x = Math.cos(a) * r, z = Math.sin(a) * r
    const pd = pathDist(x, z)
    if (pd < 1.05 + rnd() * 0.5 || waterDist(x, z) < 0.35) continue
    if (Math.hypot(x - MEADOW.circle.x, z - MEADOW.circle.z) < MEADOW.circleRadius + 0.3) continue
    if (Math.hypot(x - MEADOW.cottage.x, z - MEADOW.cottage.z) < 3.6) continue
    grass.push({ x, z, y: terrainHeight(x, z), s: 0.6 + rnd() * 0.7 * (pd < 2.5 ? 0.6 : 1), rot: rnd() * 6.28, tint: rnd() })
  }

  const mushrooms: PropSpot[] = []
  for (const t of trees) {
    if (!t.collide || rnd() < 0.55) continue
    const a = rnd() * 6.28
    const x = t.x + Math.cos(a) * 1.6, z = t.z + Math.sin(a) * 1.6
    if (!placeable(x, z, 0.2)) continue
    mushrooms.push({ x, z, y: terrainHeight(x, z), s: 0.6 + rnd() * 0.5, rot: rnd() * 6.28, tint: rnd() })
  }

  return { trees, rocks, bushes, flowers, grass, mushrooms }
}
