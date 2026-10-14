/** Whispering Moon Forest: terrain, colours, vegetation, physics and map. */
import * as THREE from 'three'
import { FOREST as F } from './layout'
import { makePathDist, makeTerrain, rollingBase } from '../common/terrainKit'
import { makeScatter } from '../common/scatterKit'
import { paintRegionMap } from '../common/mapKit'
import { valueNoise } from '../meadow/terrain'
import type { PhysicsWorld, Solid, Surface } from '../../systems/physics'
import type { Scatter, VegetationPalette } from '../common/Vegetation'
import { WATER_LEVEL } from '../meadow/terrain'

export const forestTerrain = makeTerrain({
  base: rollingBase(4.2, 1.15),
  hills: [
    { x: 34.5, z: -24, amp: 1.2, sigma: 6 },
    { x: -38, z: 34, amp: 3.2, sigma: 7 },
    { x: 40, z: 30, amp: 2.8, sigma: 8 },
  ],
  flats: [
    { ...F.moonClearing, r: 13 },
    { ...F.hollowTree, r: 6 },
    { ...F.clearing, r: 7 },
    { ...F.altar, r: 8 },
    { x: -20, z: -24, r: 12 },
    { ...F.npcs.clover, r: 4 },
    { x: F.gates.east.x - 3, z: F.gates.east.z, r: 6 },
  ],
  ponds: [{ ...F.pond }],
  bowlStart: F.bowlStart,
})
export const forestHeight = forestTerrain.heightAt
export const forestPathDist = makePathDist(F.paths as unknown as { x: number; z: number }[][], [{ ...F.moonClearing, r: 2.5 }], F.pathHalfWidth)

const MOSS_A = new THREE.Color('#93bca4'), MOSS_B = new THREE.Color('#7fae99'), MOSS_C = new THREE.Color('#a9c9b4'), LAV = new THREE.Color('#a99bd0')
const PATH = new THREE.Color('#ddd0ec'), PATH_D = new THREE.Color('#cbbce0'), CLEAR = new THREE.Color('#c9c3e6')
const SAND = new THREE.Color('#d9d2e8'), BED = new THREE.Color('#7f8fb5'), FAR = new THREE.Color('#8c86b8')

export function forestColor(x: number, z: number, h: number, col: THREE.Color) {
  const n = valueNoise(x * 0.2, z * 0.2), n2 = valueNoise(x * 0.05 + 3, z * 0.05)
  col.copy(MOSS_A).lerp(MOSS_B, n * 0.8).lerp(MOSS_C, n2 * 0.4)
  col.lerp(LAV, Math.max(0, valueNoise(x * 0.09 + 11, z * 0.09) - 0.55) * 1.2)
  const r = Math.hypot(x, z)
  if (r > F.playRadius) col.lerp(FAR, Math.min(0.6, (r - F.playRadius) / 30))
  const w = forestTerrain.waterDist(x, z)
  if (w < 1.4) col.lerp(SAND, 1 - Math.max(0, w) / 1.4)
  if (h < WATER_LEVEL + 0.05) col.copy(SAND).lerp(BED, Math.min(1, (WATER_LEVEL - h) * 2))
  const dc = Math.hypot(x - F.moonClearing.x, z - F.moonClearing.z)
  if (dc < F.clearingRadius) col.lerp(CLEAR, Math.min(1, (F.clearingRadius - dc) * 0.6) * 0.8)
  const pd = forestPathDist(x, z)
  if (pd < F.pathHalfWidth + 0.35) {
    const t = Math.max(0, Math.min(1, 1 - (pd - F.pathHalfWidth + 0.4) / 0.75))
    col.lerp(n > 0.55 ? PATH_D : PATH, t)
  }
}

export const FOREST_PALETTE: VegetationPalette = {
  grassBase: '#6f9d88',
  grassTip: '#b9e0cf',
  grassTints: ['#ffffff', '#efeaff', '#e9fbf3'],
  flowerColors: ['#cdb8f5', '#9fd8e8', '#ffd6f0', '#ffffff', '#b9a5ee'],
  bushColors: ['#7fae99', '#8fbfa6', '#a598d4', '#7a9fc4'],
  rockColors: ['#cfcbe6', '#bdb8dc'],
  capColors: ['#7fe6e0', '#ff9fd0', '#c9a8ff', '#fff1a8'],
  capGlow: 1.1,
  stem: '#6fa58a',
}

let scatterCache: Scatter | null = null
export function forestScatter() {
  if (scatterCache) return scatterCache
  scatterCache = makeScatter({
    seed: 909,
    heightAt: forestHeight,
    waterDist: forestTerrain.waterDist,
    pathDist: forestPathDist,
    pathHalfWidth: F.pathHalfWidth,
    keepClear: [
      { ...F.moonClearing, r: F.clearingRadius + 1 },
      { ...F.hollowTree, r: 4.5 },
      { ...F.clearing, r: 6 },
      { ...F.altar, r: 7 },
      ...F.mushrooms.map((m) => ({ ...m, r: 2.6 })),
      ...F.pawTrail.map((p) => ({ ...p, r: 2.4 })),
      ...F.giantMushrooms.map((m) => ({ ...m, r: m.r + 1.5 })),
      { ...F.hollowLog, r: 3.5 },
      ...Object.values(F.npcs).map((n) => ({ ...n, r: 2.5 })),
      ...F.fireflies.map((f) => ({ ...f, r: 1.5 })),
      ...F.lamps.map((l) => ({ ...l, r: 1.5 })),
      { x: F.gates.east.x, z: F.gates.east.z, r: 6 },
      { ...F.lens, r: 2 },
      ...F.moonPlates.map((p) => ({ ...p, r: 2.2 })),
    ],
    features: [
      { x: 10, z: -24, s: 1.4, kind: 'moon' },
      { x: -13, z: 6, s: 1.3, kind: 'mushroom' },
      { x: 30, z: 18, s: 1.35, kind: 'mushroom' },
      { x: -30, z: 10, s: 1.2, kind: 'mushroom' },
    ],
    trees: { count: 62, spacing: 5.4, rMax: 51, kind: (_x, _z, r) => (r() < 0.55 ? 'moon' : r() < 0.78 ? 'lavender' : 'mushroom'), scale: [0.9, 1.45] },
    outer: { count: 230, rMin: 56, rMax: 84, kind: (_x, _z, r) => (r() < 0.7 ? 'moon' : 'lavender'), skip: (x, z) => Math.abs(z - 4) < 6 && x > 50 },
    rocks: 18,
    bushes: 40,
    flowers: { sprinkle: 500, clumps: [{ ...F.moonClearing, r: 9, count: 120 }, { ...F.clearing, r: 5, count: 80 }] },
    grass: 10000,
    mushroomChance: 0.85,
  })
  return scatterCache
}

let physicsCache: PhysicsWorld | null = null
export function forestPhysics(): PhysicsWorld {
  if (physicsCache) return physicsCache
  const sc = forestScatter()
  const solids: Solid[] = []
  const surfaces: Surface[] = []
  for (const t of sc.trees) if (t.collide) solids.push({ kind: 'circle', x: t.x, z: t.z, r: (t.kind === 'mushroom' ? 0.5 : 0.42) * t.s, top: Infinity })
  for (const r of sc.rocks) solids.push({ kind: 'circle', x: r.x, z: r.z, r: 0.85 * r.s, top: r.y + 0.62 * r.s, walkable: true })
  for (const b of sc.bushes) solids.push({ kind: 'circle', x: b.x, z: b.z, r: 0.78 * b.s, top: Infinity })
  solids.push({ kind: 'circle', ...F.hollowTree, r: 1.8, top: Infinity })
  solids.push({ kind: 'circle', ...F.altar, r: 1.2, top: Infinity })
  for (const s of F.stars) solids.push({ kind: 'circle', ...s, r: 0.9, top: forestHeight(s.x, s.z) + 0.22, walkable: true })
  for (const g of F.giantMushrooms) solids.push({ kind: 'circle', x: g.x, z: g.z, r: g.r, top: forestHeight(g.x, g.z) + g.rise, walkable: true })
  const log = F.hollowLog
  solids.push({ kind: 'box', x: log.x, z: log.z, hw: 1.9, hd: 0.7, yaw: log.yaw, top: Infinity })
  for (const l of F.lamps) solids.push({ kind: 'circle', ...l, r: 0.2, top: Infinity })
  for (const n of Object.values(F.npcs)) solids.push({ kind: 'circle', ...n, r: 0.45, top: Infinity })
  for (const p of F.lilyPads) surfaces.push({ kind: 'circle', ...p, height: () => WATER_LEVEL + 0.07 })
  for (const sx of [-2.2, 2.2]) solids.push({ kind: 'circle', x: F.gates.east.x, z: F.gates.east.z + sx, r: 0.35, top: Infinity })
  physicsCache = { terrain: forestHeight, water: forestTerrain.isWater, solids, surfaces, center: { x: 0, z: 0 }, radius: F.playRadius }
  return physicsCache
}

let mapCache: HTMLCanvasElement | null = null
export function forestMapImage() {
  if (mapCache) return mapCache
  mapCache = paintRegionMap({
    heightAt: forestHeight,
    colorAt: forestColor,
    playRadius: F.playRadius,
    outside: '#d9d2ea',
    scatter: forestScatter(),
    lift: 0.22,
    overlays: (m) => {
      m.circle(F.moonClearing.x, F.moonClearing.z, F.clearingRadius, '#e3dcf7', '#c9bde9', 1.5)
      const pts = [...F.stars, F.stars[0]]
      m.line(pts, '#fff1b8', 0.35)
      for (const s of F.stars) m.circle(s.x, s.z, 0.8, '#fff1b8', '#e8c86a')
      m.circle(F.altar.x, F.altar.z, 1.5, '#f2efff', '#b9a5ee', 2)
      m.circle(F.hollowTree.x, F.hollowTree.z, 2.2, '#8a6f8f', '#6f5a73')
      for (const g of F.giantMushrooms) m.circle(g.x, g.z, g.r, '#f59bc4', '#d777a2')
      m.rect(F.hollowLog.x, F.hollowLog.z, 1.9, 0.7, F.hollowLog.yaw, '#a98a72')
    },
  })
  return mapCache
}
