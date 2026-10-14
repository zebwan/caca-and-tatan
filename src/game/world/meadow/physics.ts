import type { PhysicsWorld, Solid, Surface } from '../../systems/physics'
import { MEADOW } from './layout'
import { meadowScatter } from './scatter'
import { isWater, terrainHeight, WATER_LEVEL } from './terrain'

let world: PhysicsWorld | null = null

export function meadowPhysics(): PhysicsWorld {
  if (world) return world
  const { trees, rocks, bushes } = meadowScatter()
  const solids: Solid[] = []
  const surfaces: Surface[] = []

  for (const t of trees) if (t.collide) solids.push({ kind: 'circle', x: t.x, z: t.z, r: 0.42 * t.s, top: Infinity })
  for (const r of rocks) solids.push({ kind: 'circle', x: r.x, z: r.z, r: 0.85 * r.s, top: r.y + 0.62 * r.s, walkable: true })
  for (const b of bushes) solids.push({ kind: 'circle', x: b.x, z: b.z, r: 0.78 * b.s, top: Infinity })

  const c = MEADOW.cottage
  solids.push({ kind: 'box', x: c.x, z: c.z, hw: c.hw, hd: c.hd, yaw: c.yaw, top: 9 })
  // chimney stump / water barrel next to the cottage
  solids.push({ kind: 'circle', x: c.x + 3.9, z: c.z - 2.2, r: 0.5, top: Infinity })
  const b = MEADOW.bench
  solids.push({ kind: 'box', x: b.x, z: b.z, hw: 1.0, hd: 0.35, yaw: b.yaw, top: Infinity })
  solids.push({ kind: 'circle', ...MEADOW.notePost, r: 0.22, top: Infinity })
  solids.push({ kind: 'circle', ...MEADOW.circle, r: 0.6, top: Infinity }) // lantern
  for (const sx of [-2.35, 2.35]) solids.push({ kind: 'circle', x: MEADOW.arch.x + sx, z: MEADOW.arch.z, r: 0.55, top: Infinity })
  for (const n of Object.values(MEADOW.npcs)) solids.push({ kind: 'circle', ...n, r: 0.45, top: Infinity })
  solids.push({ kind: 'circle', x: MEADOW.picnic.x + 0.9, z: MEADOW.picnic.z - 0.3, r: 0.4, top: Infinity }) // basket
  solids.push({ kind: 'circle', ...MEADOW.keepsakes.paperStar, r: 0.55, top: terrainHeight(MEADOW.keepsakes.paperStar.x, MEADOW.keepsakes.paperStar.z) + 0.55, walkable: true })

  solids.push({ kind: 'circle', ...MEADOW.signpost, r: 0.25, top: Infinity })
  for (const l of MEADOW.lamps) solids.push({ kind: 'circle', ...l, r: 0.2, top: Infinity })
  for (const st of MEADOW.standingStones) solids.push({ kind: 'circle', ...st, r: 0.5, top: Infinity })

  for (const s of MEADOW.rockSteps) {
    solids.push({ kind: 'circle', x: s.x, z: s.z, r: s.r, top: terrainHeight(s.x, s.z) + s.rise, walkable: true })
  }

  // bridge deck + rails
  const br = MEADOW.bridge
  const endY = Math.max(terrainHeight(br.x, br.z + br.hd), terrainHeight(br.x, br.z - br.hd), 0.8)
  surfaces.push({
    kind: 'box', x: br.x, z: br.z, hw: br.hw, hd: br.hd,
    height: (_lx, lz) => endY + br.rise * Math.cos((lz / br.hd) * (Math.PI / 2)),
  })
  for (const sx of [-1, 1]) {
    solids.push({ kind: 'box', x: br.x + sx * (br.hw + 0.12), z: br.z, hw: 0.12, hd: br.hd - 0.6, top: Infinity })
  }
  for (const p of MEADOW.lilyPads) surfaces.push({ kind: 'circle', ...p, height: () => WATER_LEVEL + 0.07 })
  for (const p of MEADOW.stones) surfaces.push({ kind: 'circle', ...p, height: () => 0.62 })

  world = {
    terrain: terrainHeight,
    water: isWater,
    solids,
    surfaces,
    center: { x: 0, z: 0 },
    radius: MEADOW.playRadius,
  }
  return world
}

export function bridgeDeckY(lz: number) {
  const br = MEADOW.bridge
  const endY = Math.max(terrainHeight(br.x, br.z + br.hd), terrainHeight(br.x, br.z - br.hd), 0.8)
  return endY + br.rise * Math.cos((lz / br.hd) * (Math.PI / 2))
}
