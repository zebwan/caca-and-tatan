/** A friendly NPC: shape-built character, idle animation, faces Caca, talkable via the data rules. */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { buildCat, disposeRig, VARIANTS } from './catBuilder'
import { CatAnimator } from './catAnimation'
import { runtime } from '../state/runtime'
import { game, useGame } from '../state/store'
import { interactions } from '../systems/interactions'
import { talkTo } from '../systems/dialogue'
import { NPCS } from '../data/npcs'
import { QUEST_BY_ID } from '../data/quests'
import { dampAngle } from './Player'
import { GEO, toon } from '../world/materials'

interface Props {
  id: keyof typeof NPCS
  variant: keyof typeof VARIANTS
  x: number
  z: number
  y: number
  yaw: number
  /** Quest this NPC hands out; shows a floating star while it is available. */
  offers?: string
  /** Optional side quests get a lavender marker instead of pink. */
  optional?: boolean
  children?: React.ReactNode
}

export function Npc({ id, variant, x, z, y, yaw, offers, optional, children }: Props) {
  const rig = useMemo(() => buildCat(VARIANTS[variant]), [variant])
  const anim = useMemo(() => new CatAnimator(), [])
  const marker = useRef<THREE.Group>(null)
  const state = useRef({ yaw, talkT: 0 })
  const pos = useMemo(() => new THREE.Vector3(x, y, z), [x, y, z])
  const offerState = useGame((s) => (offers ? s.quests[offers]?.state : undefined))
  const offerStep = useGame((s) => (offers ? s.quests[offers]?.step : undefined))
  const npc = NPCS[id]

  useEffect(() => () => disposeRig(rig), [rig])
  useEffect(
    () =>
      interactions.register({
        id: `npc:${id}`,
        position: new THREE.Vector3(x, y + 0.8, z),
        radius: 2.6,
        label: () => `Talk to ${npc.name}`,
        enabled: () => true,
        onInteract: () => {
          state.current.talkT = 0
          talkTo(id)
        },
      }),
    [id, x, y, z, npc.name],
  )

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const P = runtime.player
    const dx = P.pos.x - x, dz = P.pos.z - z
    const d = Math.hypot(dx, dz)
    const s = state.current
    const talking = game.get().queue[0]?.kind === 'dialogue' && d < 4
    if (talking) s.talkT += dt
    const targetYaw = d < 7 ? Math.atan2(dx, dz) : yaw
    s.yaw = dampAngle(s.yaw, targetYaw, 3, dt)
    rig.root.position.copy(pos)
    rig.root.rotation.y = s.yaw
    anim.update(rig, {
      dt,
      t: runtime.time + x,
      gait: 0,
      grounded: true,
      vy: 0,
      idleTime: 0,
      mood: talking && s.talkT < 0.5 ? 'happy' : 'none',
      moodTime: s.talkT,
      lookYaw: null,
      lookPitch: d < 4 ? -0.1 : 0,
      talking,
      allowRest: false,
    })
    if (marker.current) {
      marker.current.position.y = y + 2.1 * VARIANTS[variant].scale + 0.5 + Math.sin(runtime.time * 2.5) * 0.1
      marker.current.rotation.y += dt * 1.5
    }
  })

  const showMarker =
    offerState === 'available' ||
    (!!offers && offerState === 'in_progress' && offerStep !== undefined && QUEST_BY_ID[offers].steps[offerStep]?.event === npc.event)
  return (
    <group>
      <primitive object={rig.root} />
      {showMarker && (
        <group ref={marker} position={[x, y + 2, z]}>
          <StarShape color={optional ? '#b9a5ee' : '#f27aa6'} />
        </group>
      )}
      {children}
    </group>
  )
}

const starGeo = (() => {
  const s = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2
    const r = i % 2 === 0 ? 0.32 : 0.14
    const px = Math.cos(a) * r, py = Math.sin(a) * r
    if (i === 0) s.moveTo(px, py)
    else s.lineTo(px, py)
  }
  s.closePath()
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 })
  g.center()
  return g
})()

export function StarShape({ color, scale = 1, glow = 0.8 }: { color: string; scale?: number; glow?: number }) {
  return (
    <group scale={scale}>
      <mesh geometry={starGeo} material={toon(color, color, glow)} />
      <mesh geometry={GEO.sphere} scale={0.42}>
        <meshBasicMaterial color={color} transparent opacity={0.18} depthWrite={false} />
      </mesh>
    </group>
  )
}
export { starGeo }
