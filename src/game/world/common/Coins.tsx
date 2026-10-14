/** Hidden Pawprint coins: little pink paw tokens tucked around each region. */
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { runtime } from '../../state/runtime'
import { game, useGame } from '../../state/store'
import { overWater, resolveSolids, type PhysicsWorld } from '../../systems/physics'
import { mulberry32 } from '../meadow/scatter'
import { addPawprints } from '../../systems/quests'
import { audio } from '../../systems/audio'
import { PAWPRINTS } from '../../data/shop'
import { saveGame } from '../../state/save'

export function coinSpots(world: PhysicsWorld, count: number, seed: number, extra: { x: number; z: number; y?: number }[] = []) {
  const rnd = mulberry32(seed)
  const out: { x: number; z: number; y: number }[] = extra.map((e) => ({ x: e.x, z: e.z, y: e.y ?? world.terrain(e.x, e.z) }))
  let tries = 0
  while (out.length < count + extra.length && tries++ < 4000) {
    const a = rnd() * Math.PI * 2, r = 8 + Math.sqrt(rnd()) * (world.radius - 12)
    const x = Math.cos(a) * r, z = Math.sin(a) * r
    if (overWater(world, x, z)) continue
    const fixed = resolveSolids(world, x, z, world.terrain(x, z), 0.6)
    if (Math.hypot(fixed.x - x, fixed.z - z) > 0.01) continue
    if (out.some((o) => Math.hypot(o.x - x, o.z - z) < 7)) continue
    out.push({ x, z, y: world.terrain(x, z) })
  }
  return out
}

const coinGeo = (() => {
  const parts: THREE.BufferGeometry[] = []
  const pad = new THREE.CylinderGeometry(0.17, 0.17, 0.06, 16)
  parts.push(pad)
  for (const [x, z] of [[-0.13, 0.17], [-0.045, 0.22], [0.045, 0.22], [0.13, 0.17]]) {
    const t = new THREE.CylinderGeometry(0.06, 0.06, 0.06, 10)
    t.translate(x, 0, z)
    parts.push(t)
  }
  const g = mergeGeometries(parts)!
  g.rotateX(Math.PI / 2)
  g.translate(0, -0.04, 0)
  return g
})()
const coinMat = new THREE.MeshToonMaterial({ color: '#ff9fc4', emissive: '#ff7fae', emissiveIntensity: 0.45 })

export function Coins({ region, world, count, seed, extra }: { region: string; world: PhysicsWorld; count: number; seed: number; extra?: { x: number; z: number; y?: number }[] }) {
  const spots = useMemo(() => coinSpots(world, count, seed, extra), [world, count, seed, extra])
  const collected = useGame((s) => s.collected)
  const refs = useRef<(THREE.Group | null)[]>([])
  useFrame(() => {
    const P = runtime.player.pos
    const t = runtime.time
    spots.forEach((c, i) => {
      const g = refs.current[i]
      if (!g) return
      g.rotation.y = t * 2 + i
      g.position.y = c.y + 0.7 + Math.sin(t * 2.5 + i) * 0.08
      if (Math.hypot(P.x - c.x, P.z - c.z) < 1.1 && Math.abs(P.y + 0.6 - (c.y + 0.7)) < 1.6) {
        const id = `coin:${region}:${i}`
        if (!game.get().collected.includes(id)) {
          game.set({ collected: [...game.get().collected, id] })
          addPawprints(PAWPRINTS.coin, 'coin')
          audio.sfx('sparkle')
          audio.sfx('blip')
          saveGame()
        }
      }
    })
  })
  return (
    <group>
      {spots.map((c, i) =>
        collected.includes(`coin:${region}:${i}`) ? null : (
          <group key={i} ref={(el) => void (refs.current[i] = el)} position={[c.x, c.y + 0.7, c.z]}>
            <mesh geometry={coinGeo} material={coinMat} />
          </group>
        ),
      )}
    </group>
  )
}
