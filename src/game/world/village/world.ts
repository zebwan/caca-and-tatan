/** Cuddleberry Village: terrain, colours, vegetation, physics and map. */
import * as THREE from 'three'
import { VILLAGE as V } from './layout'
import { makePathDist, makeTerrain, rollingBase } from '../common/terrainKit'
import { makeScatter } from '../common/scatterKit'
import { paintRegionMap } from '../common/mapKit'
import { valueNoise } from '../meadow/terrain'
import type { PhysicsWorld, Solid, Surface } from '../../systems/physics'
import type { Scatter, VegetationPalette } from '../common/Vegetation'
import { localToWorld } from '../common/geom'

const houseR = (h: { w: number; d: number }) => Math.max(h.w, h.d) * 0.62 + 2.2

export const villageTerrain = makeTerrain({
  base: rollingBase(2.1, 0.55),
  hills: [
    { x: 34, z: 31, amp: 1.2, sigma: 5 },
    { x: 30, z: -38, amp: 2.6, sigma: 7 },
    { x: -40, z: 38, amp: 1.8, sigma: 6 },
  ],
  flats: [
    { x: 0, z: 0, r: 14 },
    ...V.houses.map((h) => ({ x: h.x, z: h.z, r: houseR(h) })),
    { x: V.hedge.center.x, z: V.hedge.center.z, r: 10 },
    { x: 8.7, z: -27.8, r: 5 },
    { ...V.cart, r: 3.5 },
    { ...V.windmill, r: 6 },
    { x: V.gates.south.x, z: V.gates.south.z - 2, r: 6 },
    { x: V.gates.west.x + 2, z: 0, r: 6 },
    { x: V.gates.east.x - 2, z: 0, r: 6 },
  ],
  ponds: [{ ...V.pond }],
  bowlStart: V.bowlStart,
})
export const villageHeight = villageTerrain.heightAt
export const villagePathDist = makePathDist(V.paths as unknown as { x: number; z: number }[][], [V.plaza], V.pathHalfWidth)

const GRASS_A = new THREE.Color('#bde29a'), GRASS_B = new THREE.Color('#a9d68a'), GRASS_C = new THREE.Color('#cbe8a6')
const COBBLE = new THREE.Color('#f3dfcd'), COBBLE_D = new THREE.Color('#e7cdb9'), PLAZA = new THREE.Color('#f6e2d6')
const SAND = new THREE.Color('#f3e2c4'), BED = new THREE.Color('#b9c9b8'), FAR = new THREE.Color('#b8d79c')

export function villageColor(x: number, z: number, h: number, col: THREE.Color) {
  const n = valueNoise(x * 0.18, z * 0.18), n2 = valueNoise(x * 0.04 + 9, z * 0.04)
  col.copy(GRASS_A).lerp(GRASS_B, n * 0.7).lerp(GRASS_C, n2 * 0.5)
  const r = Math.hypot(x, z)
  if (r > V.playRadius) col.lerp(FAR, Math.min(0.6, (r - V.playRadius) / 30))
  const w = villageTerrain.waterDist(x, z)
  if (w < 1.6) col.lerp(SAND, 1 - Math.max(0, w) / 1.6)
  if (h < 0.3) col.copy(SAND).lerp(BED, Math.min(1, (0.25 - h) * 2))
  const pd = villagePathDist(x, z)
  if (pd < V.pathHalfWidth + 0.35) {
    const t = Math.max(0, Math.min(1, 1 - (pd - V.pathHalfWidth + 0.4) / 0.75))
    // little cobbles
    const cob = Math.sin(x * 2.6) * Math.sin(z * 2.6) > 0.35 ? COBBLE_D : COBBLE
    col.lerp(cob, t)
  }
  const pr = Math.hypot(x - V.plaza.x, z - V.plaza.z)
  if (pr < V.plaza.r + 0.4) {
    const ring = Math.sin(pr * 2.2) > 0.6 ? COBBLE_D : PLAZA
    col.lerp(ring, Math.min(1, (V.plaza.r + 0.4 - pr) * 1.5))
  }
}

export const VILLAGE_PALETTE: VegetationPalette = {
  grassBase: '#9acd7f',
  grassTip: '#e0f4bb',
  grassTints: ['#ffffff', '#fff6ec', '#f6fbe8'],
  flowerColors: ['#ffb68a', '#ffffff', '#f7a8c6', '#fff2b8', '#ffd6e6', '#c9e7ff'],
  bushColors: ['#a2d28a', '#96c97f', '#b0da94', '#f7c6d6'],
  rockColors: ['#ece2d6', '#e3dbd0'],
  capColors: ['#f7a8c6', '#ffc8a8'],
  capGlow: 0.2,
  stem: '#86bf6c',
}

let scatterCache: Scatter | null = null
export function villageScatter() {
  if (scatterCache) return scatterCache
  const keep = [
    { x: 0, z: 0, r: 12 },
    ...V.houses.map((h) => ({ x: h.x, z: h.z, r: houseR(h) })),
    { x: V.hedge.center.x, z: V.hedge.center.z, r: 9 },
    { ...V.windmill, r: 5 },
    { x: V.pond.x, z: V.pond.z, r: V.pond.r + 2 },
    { x: 8.7, z: -27.8, r: 4 },
    { ...V.cart, r: 3 },
    ...V.bales.map((b) => ({ ...b, r: 2.2 })),
    ...V.berryBushes.map((b) => ({ ...b, r: 2 })),
    ...Object.values(V.npcs).map((n) => ({ ...n, r: 2.5 })),
    ...V.lamps.map((l) => ({ ...l, r: 1.5 })),
    ...Object.values(V.gates).map((g) => ({ ...g, r: 5 })),
    ...Object.values(V.mailboxes).map((m) => ({ ...m, r: 1.5 })),
    { ...V.npcs.tom, r: 3 },
  ]
  scatterCache = makeScatter({
    seed: 4242,
    heightAt: villageHeight,
    waterDist: villageTerrain.waterDist,
    pathDist: villagePathDist,
    pathHalfWidth: V.pathHalfWidth,
    keepClear: keep,
    features: [
      { x: -6, z: -28, s: 1.3, kind: 'cherry' },
      { x: 20, z: -22, s: 1.2, kind: 'fruit' },
      { x: -22, z: 22, s: 1.25, kind: 'cherry', rot: 1 },
      { x: 24, z: 46, s: 1.2, kind: 'cherry' },
      { x: -8, z: 46, s: 1.15, kind: 'fruit' },
    ],
    trees: { count: 30, spacing: 6.5, rMax: 50, kind: (_x, _z, r) => (r() < 0.45 ? 'fruit' : r() < 0.7 ? 'cherry' : 'green') },
    outer: { count: 170, rMin: 57, rMax: 82, kind: (_x, _z, r) => (r() < 0.4 ? 'green' : r() < 0.7 ? 'fruit' : 'cherry'), skip: (x, z) => (Math.abs(z) < 7 && Math.abs(x) > 50) || (Math.abs(x) < 7 && z > 50) },
    rocks: 14,
    bushes: 36,
    flowers: { sprinkle: 600, clumps: [{ x: -16, z: 42, r: 5, count: 140 }, { x: 22, z: 30, r: 6, count: 120 }, { x: -30, z: 4, r: 4, count: 60 }] },
    grass: 11000,
    mushroomChance: 0.25,
  })
  return scatterCache
}

let physicsCache: PhysicsWorld | null = null
export function villagePhysics(): PhysicsWorld {
  if (physicsCache) return physicsCache
  const sc = villageScatter()
  const solids: Solid[] = []
  const surfaces: Surface[] = []
  for (const t of sc.trees) if (t.collide) solids.push({ kind: 'circle', x: t.x, z: t.z, r: 0.42 * t.s, top: Infinity })
  for (const r of sc.rocks) solids.push({ kind: 'circle', x: r.x, z: r.z, r: 0.85 * r.s, top: r.y + 0.62 * r.s, walkable: true })
  for (const b of sc.bushes) solids.push({ kind: 'circle', x: b.x, z: b.z, r: 0.78 * b.s, top: Infinity })
  for (const h of V.houses) solids.push({ kind: 'box', x: h.x, z: h.z, hw: h.w / 2 + 0.25, hd: h.d / 2 + 0.25, yaw: h.yaw, top: 9 })
  solids.push({ kind: 'circle', ...V.fountain, r: 2.7, top: Infinity })
  for (const s of V.stalls) solids.push({ kind: 'box', x: s.x, z: s.z, hw: 1.3, hd: 0.7, yaw: s.yaw, top: Infinity })
  solids.push({ kind: 'circle', ...V.windmill, r: 2.4, top: 9 })
  for (const w of V.hedge.walls) solids.push({ kind: 'box', ...w, top: Infinity })
  solids.push({ kind: 'box', ...V.hedge.bench, hw: 1.0, hd: 0.35, top: Infinity })
  solids.push({ kind: 'box', x: V.cart.x, z: V.cart.z, hw: 1.1, hd: 0.8, yaw: V.cart.yaw, top: Infinity })
  for (const c of V.crates) solids.push({ kind: 'circle', x: c.x, z: c.z, r: c.r, top: villageHeight(c.x, c.z) + c.rise, walkable: true })
  for (const b of V.bales) solids.push({ kind: 'circle', x: b.x, z: b.z, r: b.r, top: villageHeight(b.x, b.z) + b.rise, walkable: true })
  for (const l of V.lamps) solids.push({ kind: 'circle', ...l, r: 0.2, top: Infinity })
  for (const n of Object.values(V.npcs)) solids.push({ kind: 'circle', ...n, r: 0.45, top: Infinity })
  for (const b of V.berryBushes) solids.push({ kind: 'circle', ...b, r: 0.85, top: Infinity })
  for (const m of Object.values(V.mailboxes)) solids.push({ kind: 'circle', ...m, r: 0.25, top: Infinity })
  for (const g of Object.values(V.gates)) {
    for (const sx of [-2.2, 2.2]) {
      const p = localToWorld(g, sx, 0)
      solids.push({ kind: 'circle', ...p, r: 0.35, top: Infinity })
    }
  }
  const d = V.dock
  surfaces.push({ kind: 'box', x: d.x, z: d.z, hw: d.hw, hd: d.hd, height: () => 0.82 })
  physicsCache = {
    terrain: villageHeight,
    water: villageTerrain.isWater,
    solids,
    surfaces,
    center: { x: 0, z: 0 },
    radius: V.playRadius,
  }
  return physicsCache
}

let mapCache: HTMLCanvasElement | null = null
export function villageMapImage() {
  if (mapCache) return mapCache
  mapCache = paintRegionMap({
    heightAt: villageHeight,
    colorAt: villageColor,
    playRadius: V.playRadius,
    scatter: villageScatter(),
    overlays: (m) => {
      for (const h of V.houses) m.rect(h.x, h.z, h.w / 2, h.d / 2, h.yaw, h.roof, '#ffffffaa')
      m.circle(V.fountain.x, V.fountain.z, 2.6, '#bfe9f2', '#9cc3ea', 2)
      m.circle(V.windmill.x, V.windmill.z, 2.4, '#fff3e4', '#e3b39f', 1.5)
      for (const w of V.hedge.walls) m.rect(w.x, w.z, w.hw, w.hd, 0, '#8fc477')
      for (const s of V.stalls) m.rect(s.x, s.z, 1.3, 0.7, s.yaw, s.color)
      m.rect(V.dock.x, V.dock.z, V.dock.hw, V.dock.hd, 0, '#d3a37b')
    },
  })
  return mapCache
}
