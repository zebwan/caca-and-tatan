/** The Starlight Garden: floating islands, bridges, drifting platforms, physics and map. */
import * as THREE from 'three'
import { GARDEN as G } from './layout'
import { paintRegionMap } from '../common/mapKit'
import { valueNoise } from '../meadow/terrain'
import type { PhysicsWorld, Solid, Surface } from '../../systems/physics'
import { game } from '../../state/store'

const VOID = -60

/** Island tops are gently domed discs; everything else is open sky. */
export function gardenHeight(x: number, z: number) {
  let h = VOID
  for (const isl of G.islands) {
    const d = Math.hypot(x - isl.x, z - isl.z)
    if (d > isl.r + 0.6) continue
    const top = isl.h + 0.35 * (1 - Math.min(1, (d / isl.r) ** 2)) + (valueNoise(x * 0.4, z * 0.4) - 0.5) * 0.12
    const v = d <= isl.r ? top : top - (d - isl.r) * 40
    h = Math.max(h, v)
  }
  return h
}

export const litWishes = () => G.pedestals.filter((_, i) => game.get().collected.includes(`wish:${i}`)).length

/** A straight walkable bridge between two points, sloping from y0 to y1. */
function bridgeSurface(from: { x: number; z: number }, to: { x: number; z: number }, y0: number, y1: number, hw: number, enabled?: () => boolean): Surface {
  const len = Math.hypot(to.x - from.x, to.z - from.z)
  const yaw = Math.atan2(to.x - from.x, to.z - from.z)
  return {
    kind: 'box',
    x: (from.x + to.x) / 2,
    z: (from.z + to.z) / 2,
    hw,
    hd: len / 2,
    yaw,
    height: (_lx, lz) => y0 + ((lz + len / 2) / len) * (y1 - y0),
    enabled,
  }
}

export const LIGHT_SEGMENTS = 4
export function lightSegment(i: number) {
  const b = G.lightBridge
  const k0 = i / LIGHT_SEGMENTS, k1 = (i + 1) / LIGHT_SEGMENTS
  const from = { x: b.from.x + (b.to.x - b.from.x) * k0, z: b.from.z + (b.to.z - b.from.z) * k0 }
  const to = { x: b.from.x + (b.to.x - b.from.x) * k1, z: b.from.z + (b.to.z - b.from.z) * k1 }
  return { from, to, y0: b.y0 + (b.y1 - b.y0) * k0, y1: b.y0 + (b.y1 - b.y0) * k1 }
}

export type GardenPlatform = Surface & { home: { x: number; z: number }; move: (typeof G.platforms)[number]['move']; top: number }
export const gardenPlatforms: GardenPlatform[] = G.platforms.map((p) => ({
  kind: 'circle', x: p.x, z: p.z, r: p.r, home: { x: p.x, z: p.z }, move: p.move, top: p.top, height: () => p.top,
}))

let physicsCache: PhysicsWorld | null = null
export function gardenPhysics(): PhysicsWorld {
  if (physicsCache) return physicsCache
  const surfaces: Surface[] = [...gardenPlatforms]
  for (const b of G.bridges) surfaces.push(bridgeSurface(b.from, b.to, b.y0, b.y1, 1.3))
  for (let i = 0; i < LIGHT_SEGMENTS; i++) {
    const s = lightSegment(i)
    surfaces.push(bridgeSurface(s.from, s.to, s.y0, s.y1, G.lightBridge.hw, () => litWishes() > i))
  }
  const solids: Solid[] = [
    { kind: 'circle', ...G.heartTree, r: 1.7, top: Infinity },
    ...G.pedestals.map((p) => ({ kind: 'circle' as const, x: p.x, z: p.z, r: 0.6, top: Infinity })),
    { kind: 'circle', ...G.stairsTop, r: 0.9, top: Infinity },
  ]
  physicsCache = { terrain: gardenHeight, water: () => false, solids, surfaces, center: { x: 0, z: 8 }, radius: 52 }
  return physicsCache
}

const GRASS = new THREE.Color('#c6e8b0'), PINK = new THREE.Color('#ffd6e8'), SKY = new THREE.Color('#d8cff0')
let mapCache: HTMLCanvasElement | null = null
export function gardenMapImage() {
  if (mapCache) return mapCache
  mapCache = paintRegionMap({
    heightAt: (x, z) => Math.max(0, gardenHeight(x, z)),
    colorAt: (x, z, _h, col) => {
      const h = gardenHeight(x, z)
      if (h < 0) col.copy(SKY)
      else col.copy(GRASS).lerp(PINK, valueNoise(x * 0.3, z * 0.3) * 0.5)
    },
    playRadius: 70,
    lift: 0,
    overlays: (m) => {
      for (const b of G.bridges) m.line([b.from, b.to], '#ffd6e8', 2.4)
      m.line([G.lightBridge.from, G.lightBridge.to], '#fff1b880', 2.6)
      for (const p of G.platforms) m.circle(p.x, p.z, p.r, '#efe6ff', '#c9b8f5')
      for (const p of G.pedestals) m.circle(p.x, p.z, 0.9, p.color, '#ffffff', 2)
      m.circle(G.heartTree.x, G.heartTree.z, 4.5, '#ffc2dc', '#f27aa6', 2)
    },
  })
  return mapCache
}
