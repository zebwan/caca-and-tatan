/** Bubblegum Bay: terrain (beach + sea), colours, vegetation, physics and map. */
import * as THREE from 'three'
import { BAY as B, shoreX } from './layout'
import { makePathDist, makeTerrain, rollingBase } from '../common/terrainKit'
import { makeScatter } from '../common/scatterKit'
import { paintRegionMap } from '../common/mapKit'
import { smoothstep, valueNoise, WATER_LEVEL } from '../meadow/terrain'
import type { PhysicsWorld, Solid, Surface } from '../../systems/physics'
import type { Scatter, VegetationPalette } from '../common/Vegetation'

/** Signed distance to the sea: positive on land, negative at sea (islands are land). */
function seaDist(x: number, z: number) {
  let d = shoreX(z) - x
  for (const isl of [B.islet, B.sandbar]) d = Math.max(d, isl.r - Math.hypot(x - isl.x, z - isl.z))
  return d
}

export const bayTerrain = makeTerrain({
  base: rollingBase(6.3, 0.6),
  hills: [{ ...B.headland }, { x: -36, z: 34, amp: 2.4, sigma: 7 }, { x: -30, z: -30, amp: 2, sigma: 8 }],
  flats: [
    { x: 2, z: -41.5, r: 6 },
    ...B.huts.map((h) => ({ x: h.x, z: h.z, r: 5 })),
    { x: B.gates.west.x + 3, z: 0, r: 6 },
    { ...B.npcs.marina, r: 3 },
  ],
  sea: seaDist,
  bowlStart: B.bowlStart,
  bowlMask: (x) => 1 - smoothstep(-5, 25, x),
})
export const bayHeight = bayTerrain.heightAt
export const bayPathDist = makePathDist(B.paths as unknown as { x: number; z: number }[][], [], B.pathHalfWidth)

const GRASS_A = new THREE.Color('#bfe39c'), GRASS_B = new THREE.Color('#a9d88a'), SAND = new THREE.Color('#ffe1e6'), SAND_B = new THREE.Color('#f9d2dc')
const WET = new THREE.Color('#f2c2cf'), BED = new THREE.Color('#9fd6e0'), PATH = new THREE.Color('#f6e7d2'), FAR = new THREE.Color('#c9dfb0')

export function bayColor(x: number, z: number, h: number, col: THREE.Color) {
  const n = valueNoise(x * 0.2, z * 0.2)
  col.copy(GRASS_A).lerp(GRASS_B, n * 0.7)
  const s = seaDist(x, z)
  // pink sand along the shore and on the islands
  const sand = 1 - smoothstep(4, 10, s)
  col.lerp(SAND_B.clone().lerp(SAND, n), sand)
  if (s < 1.5) col.lerp(WET, (1.5 - Math.max(0, s)) / 1.5 * 0.6)
  if (h < WATER_LEVEL + 0.05) col.copy(WET).lerp(BED, Math.min(1, (WATER_LEVEL - h) * 1.2))
  const r = Math.hypot(x, z)
  if (r > B.playRadius && x < 20) col.lerp(FAR, Math.min(0.6, (r - B.playRadius) / 30))
  const pd = bayPathDist(x, z)
  if (pd < B.pathHalfWidth + 0.35) col.lerp(PATH, Math.max(0, Math.min(1, 1 - (pd - B.pathHalfWidth + 0.4) / 0.75)))
}

export const BAY_PALETTE: VegetationPalette = {
  grassBase: '#9dcf82',
  grassTip: '#e6f6c4',
  grassTints: ['#ffffff', '#fff6ec'],
  flowerColors: ['#ffffff', '#ffd6e6', '#fff2b8', '#bfe9f2', '#ffc59e'],
  bushColors: ['#a2d28a', '#b0da94', '#9fd8bf'],
  rockColors: ['#f3e3e6', '#e9dccf', '#ffe9ef'],
  capColors: ['#ffc8a8'],
  capGlow: 0.2,
  stem: '#86bf6c',
}

let scatterCache: Scatter | null = null
export function bayScatter() {
  if (scatterCache) return scatterCache
  const sc = makeScatter({
    seed: 5150,
    heightAt: bayHeight,
    waterDist: bayTerrain.waterDist,
    pathDist: bayPathDist,
    pathHalfWidth: B.pathHalfWidth,
    keepClear: [
      ...B.huts.map((h) => ({ x: h.x, z: h.z, r: 5 })),
      { x: 2, z: -41.5, r: 6.5 },
      { ...B.stairsBase, r: 4 },
      ...B.shells.map((s) => ({ ...s, r: 1.6 })),
      ...B.digSpots.map((s) => ({ ...s, r: 2 })),
      ...B.rockArch.map((r) => ({ ...r, r: r.r + 1.5 })),
      ...Object.values(B.npcs).map((n) => ({ ...n, r: 2.5 })),
      ...B.lamps.map((l) => ({ ...l, r: 1.5 })),
      { x: B.gates.west.x, z: 0, r: 6 },
      { x: B.pier.x - B.pier.hw, z: B.pier.z, r: 4 },
    ],
    blocked: (x, z) => seaDist(x, z) < 3,
    trees: { count: 30, spacing: 6.5, rMax: 50, kind: (x, _z, r) => (x > 4 || r() < 0.5 ? 'palm' : r() < 0.6 ? 'cherry' : 'green') },
    outer: { count: 120, rMin: 57, rMax: 82, kind: (_x, _z, r) => (r() < 0.6 ? 'palm' : 'green'), skip: (x, z) => x > 15 || (Math.abs(z) < 7 && x < -50) },
    rocks: 20,
    bushes: 22,
    flowers: { sprinkle: 300 },
    grass: 7000,
    mushroomChance: 0.05,
  })
  // island palms
  sc.trees.push({ x: B.islet.x - 1.2, z: B.islet.z - 1.6, y: bayHeight(B.islet.x - 1.2, B.islet.z - 1.6), s: 0.9, rot: 1, kind: 'palm', collide: true })
  sc.trees.push({ x: B.sandbar.x + 1.6, z: B.sandbar.z + 1.2, y: bayHeight(B.sandbar.x + 1.6, B.sandbar.z + 1.2), s: 1.0, rot: 2, kind: 'palm', collide: true })
  scatterCache = sc
  return sc
}

export type FloatSurface = Surface & { home: { x: number; z: number }; move: (typeof B.floats)[number]['move']; top: number }
export const bayFloats: FloatSurface[] = B.floats.map((f) => ({
  kind: 'circle',
  x: f.x,
  z: f.z,
  r: f.r,
  home: { x: f.x, z: f.z },
  move: f.move,
  top: f.top,
  height: () => f.top,
}))

let physicsCache: PhysicsWorld | null = null
export function bayPhysics(): PhysicsWorld {
  if (physicsCache) return physicsCache
  const sc = bayScatter()
  const solids: Solid[] = []
  const surfaces: Surface[] = [...bayFloats]
  for (const t of sc.trees) if (t.collide) solids.push({ kind: 'circle', x: t.x, z: t.z, r: 0.35 * t.s, top: Infinity })
  for (const r of sc.rocks) solids.push({ kind: 'circle', x: r.x, z: r.z, r: 0.85 * r.s, top: r.y + 0.62 * r.s, walkable: true })
  for (const b of sc.bushes) solids.push({ kind: 'circle', x: b.x, z: b.z, r: 0.78 * b.s, top: Infinity })
  for (const h of B.huts) solids.push({ kind: 'box', x: h.x, z: h.z, hw: h.w / 2 + 0.2, hd: h.d / 2 + 0.2, yaw: h.yaw, top: 9 })
  solids.push({ kind: 'circle', ...B.lighthouse, r: 2.4, top: Infinity })
  for (const r of B.rockArch) solids.push({ kind: 'circle', x: r.x, z: r.z, r: r.r, top: bayHeight(r.x, r.z) + r.rise, walkable: true })
  for (const l of B.lamps) solids.push({ kind: 'circle', ...l, r: 0.2, top: Infinity })
  for (const n of Object.values(B.npcs)) solids.push({ kind: 'circle', ...n, r: 0.45, top: Infinity })
  solids.push({ kind: 'box', x: B.npcs.marina.x - 1.2, z: B.npcs.marina.z, hw: 0.7, hd: 1.0, top: Infinity })
  const p = B.pier
  surfaces.push({ kind: 'box', x: p.x, z: p.z, hw: p.hw, hd: p.hd, height: () => p.deck })
  for (const sz of [-1, 1]) solids.push({ kind: 'box', x: p.x + 1, z: p.z + sz * (p.hd + 0.1), hw: p.hw - 1, hd: 0.1, top: Infinity })
  solids.push({ kind: 'box', x: p.x + p.hw + 0.05, z: p.z - 0.4, hw: 0.1, hd: 0.9, top: Infinity })
  for (const sx of [-2.2, 2.2]) solids.push({ kind: 'circle', x: B.gates.west.x, z: sx, r: 0.35, top: Infinity })
  physicsCache = { terrain: bayHeight, water: bayTerrain.isWater, solids, surfaces, center: { x: 0, z: 0 }, radius: B.playRadius }
  return physicsCache
}

let mapCache: HTMLCanvasElement | null = null
export function bayMapImage() {
  if (mapCache) return mapCache
  mapCache = paintRegionMap({
    heightAt: bayHeight,
    colorAt: bayColor,
    playRadius: B.playRadius,
    scatter: bayScatter(),
    outside: '#e8f3f7',
    overlays: (m) => {
      for (const h of B.huts) m.rect(h.x, h.z, h.w / 2, h.d / 2, h.yaw, h.roof, '#ffffffaa')
      m.rect(B.pier.x, B.pier.z, B.pier.hw, B.pier.hd, 0, '#d3a37b', '#b98a66')
      m.circle(B.lighthouse.x, B.lighthouse.z, 2.4, '#ffffff', '#f27aa6', 3)
      for (const f of B.floats) m.circle(f.x, f.z, f.r, '#e6ddd3', '#b9ab9c')
      for (const r of B.rockArch) m.circle(r.x, r.z, r.r, '#efe2dc', '#c9b5ad')
    },
  })
  return mapCache
}
