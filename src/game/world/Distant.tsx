/**
 * Distant scenery hinting at the other regions: Cuddleberry Village rooftops
 * to the north, the lavender Whispering Moon Forest to the west, a lighthouse
 * over Bubblegum Bay to the east, and faint floating islands high in the sky.
 */
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GEO, toon } from './materials'
import { mulberry32 } from './meadow/scatter'
import { runtime } from '../state/runtime'

export function Hill({ p, s, c }: { p: [number, number, number]; s: [number, number, number]; c: string }) {
  return <mesh geometry={GEO.sphereLo} material={toon(c)} position={p} scale={s} />
}

function House({ p, yaw, wall, roof, s = 1 }: { p: [number, number, number]; yaw: number; wall: string; roof: string; s?: number }) {
  const roofGeo = useMemo(() => {
    const g = new THREE.ConeGeometry(1, 1, 4)
    g.rotateY(Math.PI / 4)
    return g
  }, [])
  return (
    <group position={p} rotation={[0, yaw, 0]} scale={s}>
      <mesh geometry={GEO.box} material={toon(wall)} scale={[4, 3.4, 4]} position={[0, 1.7, 0]} />
      <mesh geometry={roofGeo} material={toon(roof)} scale={[3.6, 3, 3.6]} position={[0, 4.9, 0]} />
      <mesh geometry={GEO.box} material={toon('#fff5d8', '#ffe2a8', 0.5)} scale={[0.8, 0.9, 0.1]} position={[0, 1.9, 2.02]} />
    </group>
  )
}

export function DistantTrees({ center, count, spread, colors, seed, scale }: { center: [number, number, number]; count: number; spread: [number, number]; colors: string[]; seed: number; scale: number }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(1, 10, 8)
    g.scale(1, 1.25, 1)
    g.translate(0, 1.2, 0)
    return g
  }, [])
  const mat = useMemo(() => toon('#ffffff'), [])
  useLayoutEffect(() => {
    const rnd = mulberry32(seed)
    const o = new THREE.Object3D()
    const c = new THREE.Color()
    for (let i = 0; i < count; i++) {
      o.position.set(center[0] + (rnd() - 0.5) * spread[0], center[1] + rnd() * 3, center[2] + (rnd() - 0.5) * spread[1])
      o.scale.setScalar(scale * (0.7 + rnd() * 0.7))
      o.updateMatrix()
      ref.current!.setMatrixAt(i, o.matrix)
      ref.current!.setColorAt(i, c.set(colors[i % colors.length]))
    }
    ref.current!.instanceMatrix.needsUpdate = true
    ref.current!.instanceColor!.needsUpdate = true
    ref.current!.computeBoundingSphere()
  }, [center, count, spread, colors, seed, scale])
  return <instancedMesh ref={ref} args={[geo, mat, count]} />
}

export function Distant() {
  const islands = useRef<THREE.Group>(null)
  useFrame(() => {
    const t = runtime.time
    if (islands.current) islands.current.position.y = 64 + Math.sin(t * 0.3) * 1.2
  })
  const forestCols = useMemo(() => ['#b9a6e8', '#a993de', '#c8b8f0', '#9f8fd6'], [])
  const villageCols = useMemo(() => ['#9fd08a', '#b0da94', '#f6bcd2'], [])
  const houses: { p: [number, number, number]; yaw: number; wall: string; roof: string; s: number }[] = [
    { p: [-10, 21, -132], yaw: 0.3, wall: '#fff3e4', roof: '#f392b4', s: 1.3 },
    { p: [6, 22, -138], yaw: -0.2, wall: '#ffe9d6', roof: '#e98aa9', s: 1.2 },
    { p: [20, 20.5, -128], yaw: 0.5, wall: '#fff3e4', roof: '#f7a8c6', s: 1.1 },
    { p: [-24, 19.5, -122], yaw: -0.4, wall: '#fbeee6', roof: '#f392b4', s: 1.0 },
    { p: [32, 19, -140], yaw: 0.1, wall: '#ffe9d6', roof: '#db7d9f', s: 1.25 },
    { p: [-2, 23, -152], yaw: 0, wall: '#fff3e4', roof: '#f392b4', s: 1.5 },
  ]
  return (
    <group>
      {/* Cuddleberry Village (north) */}
      <Hill p={[0, -8, -140]} s={[80, 29, 40]} c="#bfe0a0" />
      <Hill p={[-55, -10, -125]} s={[45, 26, 30]} c="#b3d996" />
      <Hill p={[55, -12, -130]} s={[50, 27, 34]} c="#b8dc9b" />
      {houses.map((h, i) => (
        <House key={i} {...h} />
      ))}
      {/* windmill */}
      <group position={[-36, 15, -138]}>
        <mesh geometry={GEO.cylinder} material={toon('#fff3e4')} scale={[2, 10, 2.6]} position={[0, 5, 0]} />
        <mesh geometry={GEO.cone} material={toon('#f392b4')} scale={[3, 3, 3]} position={[0, 11.5, 0]} />
        <Windmill />
      </group>
      <DistantTrees center={[0, 17, -128]} count={26} spread={[110, 30]} colors={villageCols} seed={11} scale={2.4} />

      {/* Whispering Moon Forest (west) */}
      <Hill p={[-150, -6, -20]} s={[40, 26, 90]} c="#c9bfe6" />
      <DistantTrees center={[-140, 17, -20]} count={60} spread={[40, 140]} colors={forestCols} seed={21} scale={4.2} />

      {/* Bubblegum Bay (east): a striped lighthouse above the sea */}
      <mesh position={[260, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[300, 600]} />
        <meshLambertMaterial color="#a9dff0" />
      </mesh>
      <Hill p={[140, -8, 40]} s={[26, 26, 26]} c="#f3e2c4" />
      <group position={[142, 16, 40]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} geometry={GEO.cylinder} material={toon(i % 2 ? '#f392b4' : '#ffffff')} scale={[2.2 - i * 0.25, 4, 2.2 - i * 0.25]} position={[0, 2 + i * 4, 0]} />
        ))}
        <mesh geometry={GEO.sphere} material={toon('#fff5d8', '#ffe2a8', 1)} scale={1.6} position={[0, 17.5, 0]} />
        <mesh geometry={GEO.cone} material={toon('#f392b4')} scale={[2.2, 2, 2.2]} position={[0, 19.8, 0]} />
      </group>

      {/* Floating islands high to the north — the Starlight Garden waits there */}
      <group ref={islands} position={[24, 64, -175]}>
        <FloatingIsland p={[0, 0, 0]} s={12} tree />
        <FloatingIsland p={[-26, -6, 14]} s={5.5} />
        <FloatingIsland p={[22, 5, 16]} s={4.5} />
        <FloatingIsland p={[-12, 10, -10]} s={3.2} />
      </group>
    </group>
  )
}

function Windmill() {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * 0.4
  })
  return (
    <group ref={ref} position={[0, 9, 2.8]}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} geometry={GEO.box} material={toon('#fff8ef')} scale={[1.2, 7, 0.2]} position={[Math.sin((i * Math.PI) / 2) * 3.5, Math.cos((i * Math.PI) / 2) * 3.5, 0]} rotation={[0, 0, (-i * Math.PI) / 2]} />
      ))}
    </group>
  )
}

const skyMats = {
  rock: new THREE.MeshToonMaterial({ color: '#d9c8f0', fog: false }),
  rockDark: new THREE.MeshToonMaterial({ color: '#c3aee6', fog: false }),
  grass: new THREE.MeshToonMaterial({ color: '#c8e8ab', fog: false }),
  trunk: new THREE.MeshToonMaterial({ color: '#c49a86', fog: false }),
  blossom: new THREE.MeshToonMaterial({ color: '#ffc6dc', emissive: '#ff9cc4', emissiveIntensity: 0.25, fog: false }),
  glow: new THREE.MeshToonMaterial({ color: '#ffd1e3', emissive: '#ff8fbd', emissiveIntensity: 0.7, fog: false }),
}
const rockGeo = new THREE.ConeGeometry(1, 1, 7)

export function FloatingIsland({ p, s, tree }: { p: [number, number, number]; s: number; tree?: boolean }) {
  const glow = useRef<THREE.Mesh>(null)
  useFrame(() => {
    if (glow.current) skyMats.glow.emissiveIntensity = 0.6 + Math.sin(runtime.time * 1.4) * 0.2
  })
  return (
    <group position={p} scale={s}>
      <mesh geometry={rockGeo} material={skyMats.rock} scale={[1, 1.3, 1]} position={[0, -0.65, 0]} rotation={[Math.PI, 0, 0]} />
      <mesh geometry={rockGeo} material={skyMats.rockDark} scale={[0.5, 0.8, 0.5]} position={[0.25, -1.4, 0.1]} rotation={[Math.PI, 0.5, 0]} />
      <mesh geometry={GEO.sphereLo} material={skyMats.grass} scale={[1.02, 0.18, 1.02]} position={[0, 0, 0]} />
      {tree ? (
        <group>
          <mesh geometry={GEO.cylinder} material={skyMats.trunk} scale={[0.07, 0.6, 0.07]} position={[0, 0.4, 0]} />
          <mesh ref={glow} geometry={GEO.sphereLo} material={skyMats.glow} scale={[0.32, 0.28, 0.32]} position={[-0.16, 0.85, 0]} />
          <mesh geometry={GEO.sphereLo} material={skyMats.glow} scale={[0.32, 0.28, 0.32]} position={[0.16, 0.85, 0]} />
          <mesh geometry={GEO.cone} material={skyMats.glow} scale={[0.45, 0.42, 0.3]} position={[0, 0.62, 0]} rotation={[Math.PI, 0, 0]} />
          {[-0.6, 0.55, 0.2].map((x, i) => (
            <mesh key={i} geometry={GEO.sphereLo} material={skyMats.blossom} scale={0.16} position={[x, 0.22, i === 2 ? 0.6 : -0.3]} />
          ))}
        </group>
      ) : (
        <mesh geometry={GEO.sphereLo} material={skyMats.blossom} scale={[0.35, 0.3, 0.35]} position={[0.1, 0.38, 0]} />
      )}
    </group>
  )
}

/** The floating Starlight Garden islands, visible far to the north from every region. */
export function SkyIslands({ x = 24, y = 64, z = -175 }: { x?: number; y?: number; z?: number }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (ref.current) ref.current.position.y = y + Math.sin(runtime.time * 0.3) * 1.2
  })
  return (
    <group ref={ref} position={[x, y, z]}>
      <FloatingIsland p={[0, 0, 0]} s={12} tree />
      <FloatingIsland p={[-26, -6, 14]} s={5.5} />
      <FloatingIsland p={[22, 5, 16]} s={4.5} />
      <FloatingIsland p={[-12, 10, -10]} s={3.2} />
    </group>
  )
}
