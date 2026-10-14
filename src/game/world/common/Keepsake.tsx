/** Floating memory keepsakes (optional collectibles) — one model per keepsake id. */
import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GEO, toon } from '../materials'
import { starGeo } from '../../characters/Npc'
import { runtime } from '../../state/runtime'
import { game, useGame } from '../../state/store'
import { interactions } from '../../systems/interactions'
import { collectKeepsake } from '../../systems/quests'
import { audio } from '../../systems/audio'
import { KEEPSAKES } from '../../data/items'

export function KeepsakeModel({ id }: { id: string }) {
  if (id === 'photo')
    return (
      <group>
        <mesh geometry={GEO.box} material={toon('#ffffff', '#ffffff', 0.3)} scale={[0.42, 0.5, 0.03]} />
        <mesh geometry={GEO.box} material={toon('#f7b6cc', '#f7b6cc', 0.3)} scale={[0.34, 0.32, 0.035]} position={[0, 0.05, 0]} />
        <mesh geometry={GEO.sphere} material={toon('#fff4ea')} scale={[0.05, 0.05, 0.02]} position={[-0.06, 0.05, 0.02]} />
        <mesh geometry={GEO.sphere} material={toon('#c9cfdf')} scale={[0.055, 0.055, 0.02]} position={[0.07, 0.05, 0.02]} />
      </group>
    )
  if (id === 'pressedFlower')
    return (
      <group rotation={[0.3, 0, 0]}>
        <mesh geometry={GEO.box} material={toon('#bfe0a8')} scale={[0.4, 0.5, 0.02]} />
        {Array.from({ length: 5 }, (_, k) => (
          <mesh key={k} geometry={GEO.sphere} material={toon('#f7a8c6', '#f7a8c6', 0.4)} scale={[0.07, 0.04, 0.012]} position={[Math.cos(k * 1.26) * 0.08, 0.06 + Math.sin(k * 1.26) * 0.08, 0.02]} rotation={[0, 0, k * 1.26]} />
        ))}
        <mesh geometry={GEO.sphere} material={toon('#f7d774')} scale={[0.035, 0.035, 0.015]} position={[0, 0.06, 0.025]} />
      </group>
    )
  if (id === 'mittens')
    return (
      <group>
        <mesh geometry={GEO.sphere} material={toon('#f7a8c6')} scale={[0.12, 0.16, 0.07]} position={[-0.09, 0, 0]} rotation={[0, 0, 0.2]} />
        <mesh geometry={GEO.sphere} material={toon('#9cc3ea')} scale={[0.12, 0.16, 0.07]} position={[0.09, 0, 0]} rotation={[0, 0, -0.2]} />
        <mesh geometry={GEO.box} material={toon('#ffffff')} scale={[0.36, 0.05, 0.08]} position={[0, -0.14, 0]} />
      </group>
    )
  if (id === 'teacups')
    return (
      <group>
        {[-0.1, 0.1].map((x, i) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh geometry={GEO.cylinder} material={toon(i ? '#cdb8f5' : '#ffc59e')} scale={[0.08, 0.12, 0.08]} />
            <mesh geometry={GEO.cylinder} material={toon('#ffffff')} scale={[0.11, 0.015, 0.11]} position={[0, -0.065, 0]} />
          </group>
        ))}
      </group>
    )
  if (id === 'ticket' || id === 'postcard')
    return (
      <group rotation={[0.2, 0, 0.15]}>
        <mesh geometry={GEO.box} material={toon(id === 'ticket' ? '#ffd9bf' : '#ffffff', '#fff3e6', 0.3)} scale={[0.46, 0.26, 0.02]} />
        <mesh geometry={GEO.box} material={toon(id === 'ticket' ? '#f27aa6' : '#9cc3ea')} scale={[0.12, 0.2, 0.025]} position={[0.14, 0, 0]} />
      </group>
    )
  if (id === 'lantern')
    return (
      <group>
        <mesh geometry={GEO.sphere} material={toon('#ffd6e6', '#ffb3cf', 0.8)} scale={[0.16, 0.2, 0.16]} />
        <mesh geometry={GEO.cylinder} material={toon('#c99a72')} scale={[0.1, 0.03, 0.1]} position={[0, 0.2, 0]} />
      </group>
    )
  if (id === 'songbook')
    return (
      <group rotation={[0.3, 0.4, 0]}>
        <mesh geometry={GEO.box} material={toon('#b9a5ee')} scale={[0.32, 0.4, 0.06]} />
        <mesh geometry={GEO.box} material={toon('#fffaf3')} scale={[0.28, 0.36, 0.065]} position={[0.02, 0, 0]} />
      </group>
    )
  if (id === 'moonstone' || id === 'seaglass')
    return <mesh geometry={GEO.ico} material={toon(id === 'moonstone' ? '#e6e8ff' : '#ffc4dc', id === 'moonstone' ? '#c9cfff' : '#ff9fc4', 0.7)} scale={[0.16, 0.12, 0.14]} />
  if (id === 'starfish')
    return <mesh geometry={starGeo} material={toon('#ffb68a', '#ff9f7a', 0.3)} scale={0.8} rotation={[Math.PI / 2.4, 0, 0]} />
  return <mesh geometry={starGeo} material={toon('#fff2d6', '#ffe6b0', 0.5)} scale={0.9} />
}

export function Keepsake({ id, x, z, y }: { id: string; x: number; z: number; y: number }) {
  const have = useGame((s) => s.keepsakes.includes(id))
  const ref = useRef<THREE.Group>(null)
  useEffect(
    () =>
      interactions.register({
        id: `keepsake:${id}`,
        position: new THREE.Vector3(x, y + 0.8, z),
        radius: 2.0,
        label: () => `Pick up ${KEEPSAKES[id].name.toLowerCase()}`,
        enabled: () => !game.get().keepsakes.includes(id),
        onInteract: () => {
          audio.sfx('sparkle')
          collectKeepsake(id)
        },
      }),
    [id, x, y, z],
  )
  useFrame(() => {
    if (!ref.current) return
    ref.current.position.y = y + 0.75 + Math.sin(runtime.time * 1.8 + x) * 0.08
    ref.current.rotation.y = runtime.time * 0.8
  })
  if (have) return null
  return (
    <group ref={ref} position={[x, y + 0.75, z]}>
      <KeepsakeModel id={id} />
      <mesh geometry={GEO.sphere} scale={0.42}>
        <meshBasicMaterial color="#fff0c8" transparent opacity={0.18} depthWrite={false} />
      </mesh>
    </group>
  )
}

