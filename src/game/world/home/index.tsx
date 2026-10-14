/**
 * Lilac Cottage, inside — the cats' home. A dollhouse-style room (no ceiling,
 * so the camera can look in from above) with furniture slots to decorate.
 */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { RegionRuntime } from '../regionTypes'
import type { PhysicsWorld, Solid } from '../../systems/physics'
import { GEO, lampMaterial, toon } from '../materials'
import { useGame, game } from '../../state/store'
import { interactions } from '../../systems/interactions'
import { openMenu } from '../../systems/input'
import { runtime } from '../../state/runtime'
import { HOME_SLOTS, type HomeSlot } from '../../data/shop'
import { paintRegionMap } from '../common/mapKit'
import { Halo } from '../common/questKit'
import { say } from '../../systems/dialogue'

const W = 9, D = 7, WALL_H = 3.1
const FLOOR_Y = 0.06

type V3 = [number, number, number]
const SLOT_SPOTS: Record<HomeSlot, { x: number; z: number; yaw?: number }> = {
  floor: { x: -2.5, z: 4.5 },
  wall: { x: 2.5, z: -6.2 },
  bed: { x: -6, z: -4.7 },
  sofa: { x: 4.8, z: -5.2 },
  table: { x: 4.8, z: -1.4 },
  rug: { x: 0, z: 0.6 },
  lamp: { x: -8.1, z: 1.2 },
  plant: { x: 8.1, z: 5.6 },
  art: { x: -1.6, z: -6.6 },
  window: { x: 4.8, z: -6.6 },
  shelf: { x: -8.5, z: -1.6, yaw: Math.PI / 2 },
  play: { x: 6.9, z: 3.4 },
}
const MIRROR = { x: 8.6, z: -2.2 }

function homeHeight(x: number, z: number) {
  return Math.abs(x) < W && Math.abs(z) < D ? FLOOR_Y : 0
}

let physicsCache: PhysicsWorld | null = null
function homePhysics(): PhysicsWorld {
  if (physicsCache) return physicsCache
  const solids: Solid[] = [
    { kind: 'box', x: 0, z: -D - 0.15, hw: W + 0.3, hd: 0.3, top: WALL_H },
    { kind: 'box', x: -W - 0.15, z: 0, hw: 0.3, hd: D + 0.3, top: WALL_H },
    { kind: 'box', x: W + 0.15, z: 0, hw: 0.3, hd: D + 0.3, top: WALL_H },
    { kind: 'box', x: -5.6, z: D + 0.15, hw: 3.6, hd: 0.3, top: WALL_H },
    { kind: 'box', x: 5.6, z: D + 0.15, hw: 3.6, hd: 0.3, top: WALL_H },
    { kind: 'box', x: 0, z: D + 0.9, hw: 2.2, hd: 0.3, top: 1 },
    { kind: 'box', x: SLOT_SPOTS.bed.x, z: SLOT_SPOTS.bed.z, hw: 1.6, hd: 1.3, top: 0.6, walkable: true },
    { kind: 'box', x: SLOT_SPOTS.sofa.x, z: SLOT_SPOTS.sofa.z, hw: 1.5, hd: 0.6, top: Infinity },
    { kind: 'circle', x: SLOT_SPOTS.table.x, z: SLOT_SPOTS.table.z, r: 0.75, top: Infinity },
    { kind: 'box', x: SLOT_SPOTS.shelf.x, z: SLOT_SPOTS.shelf.z, hw: 0.35, hd: 1.0, top: Infinity },
    { kind: 'circle', x: MIRROR.x, z: MIRROR.z, r: 0.4, top: Infinity },
  ]
  physicsCache = { terrain: homeHeight, water: () => false, solids, surfaces: [], center: { x: 0, z: 0 }, radius: 11.5 }
  return physicsCache
}

const FLOORS: Record<string, string> = { floorWood: '#e6c39f', floorPink: '#ffd6e3', floorLavender: '#e3d8fb' }
const WALLS: Record<string, { base: string; dot?: string; stripe?: string }> = {
  wallCream: { base: '#fff4ea' },
  wallHearts: { base: '#ffe9f1', dot: '#f7a8c6' },
  wallStars: { base: '#e9ecff', dot: '#ffe58a' },
  wallMint: { base: '#eefaf3', stripe: '#c9efdb' },
}

function useWallTexture(id: string) {
  return useMemo(() => {
    const w = WALLS[id] ?? WALLS.wallCream
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const ctx = c.getContext('2d')!
    ctx.fillStyle = w.base
    ctx.fillRect(0, 0, 128, 128)
    if (w.stripe) {
      ctx.fillStyle = w.stripe
      for (let i = 0; i < 4; i++) ctx.fillRect(i * 32, 0, 14, 128)
    }
    if (w.dot) {
      ctx.fillStyle = w.dot
      ctx.font = '22px sans-serif'
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) ctx.fillText(id === 'wallStars' ? '★' : '♥', i * 32 + (j % 2) * 16 + 4, j * 32 + 24)
    }
    const t = new THREE.CanvasTexture(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(5, 1.4)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [id])
}

function Room() {
  const home = useGame((s) => s.home)
  const wallTex = useWallTexture(home.wall ?? 'wallCream')
  const floor = FLOORS[home.floor ?? 'floorWood'] ?? FLOORS.floorWood
  const wallMat = useMemo(() => new THREE.MeshLambertMaterial({ map: wallTex }), [wallTex])
  const walls: { p: V3; s: V3 }[] = [
    { p: [0, WALL_H / 2, -D - 0.15], s: [W * 2 + 0.6, WALL_H, 0.3] },
    { p: [-W - 0.15, WALL_H / 2, 0], s: [0.3, WALL_H, D * 2 + 0.6] },
    { p: [W + 0.15, WALL_H / 2, 0], s: [0.3, WALL_H, D * 2 + 0.6] },
    { p: [-5.6, WALL_H / 2, D + 0.15], s: [7.2, WALL_H * 0.45, 0.3] },
    { p: [5.6, WALL_H / 2, D + 0.15], s: [7.2, WALL_H * 0.45, 0.3] },
  ]
  return (
    <group>
      {/* garden outside */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[90, 90]} />
        <meshLambertMaterial color="#bfe19a" />
      </mesh>
      {Array.from({ length: 22 }, (_, i) => {
        const a = (i / 22) * Math.PI * 2
        const r = 17 + (i % 3) * 3
        return <mesh key={i} geometry={GEO.sphere} material={toon(i % 3 ? '#a6d48a' : '#f8c0d4')} scale={[2, 1.6, 2]} position={[Math.cos(a) * r, 1.2, Math.sin(a) * r]} castShadow />
      })}
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, 0]} receiveShadow>
        <planeGeometry args={[W * 2, D * 2]} />
        <meshLambertMaterial color={floor} />
      </mesh>
      {home.floor === 'floorWood' &&
        Array.from({ length: 9 }, (_, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y + 0.003, -D + 0.8 + i * 1.55]}>
            <planeGeometry args={[W * 2, 0.04]} />
            <meshBasicMaterial color="#d3a87f" />
          </mesh>
        ))}
      {walls.map((w, i) => (
        <mesh key={i} position={w.p} scale={w.s} material={wallMat} castShadow receiveShadow>
          <boxGeometry />
        </mesh>
      ))}
      {/* door frame */}
      <mesh geometry={GEO.box} material={toon('#b9a5ee')} scale={[2.4, 0.2, 0.4]} position={[0, WALL_H * 0.45, D + 0.15]} />
      {/* mirror for outfits */}
      <group position={[MIRROR.x, 0, MIRROR.z]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh geometry={GEO.box} material={toon('#f7a8c6')} scale={[1.0, 2.0, 0.12]} position={[0, 1.1, 0]} castShadow />
        <mesh geometry={GEO.box} material={toon('#dff2ff', '#cfe8fb', 0.4)} scale={[0.8, 1.7, 0.13]} position={[0, 1.1, 0.01]} />
      </group>
    </group>
  )
}

function Furniture() {
  const home = useGame((s) => s.home)
  const S = SLOT_SPOTS
  const item = (slot: HomeSlot) => home[slot]
  return (
    <group>
      {/* bed */}
      <group position={[S.bed.x, FLOOR_Y, S.bed.z]}>
        {item('bed') === 'bedCloud' ? (
          <>
            {[-0.8, 0, 0.8].map((x) => (
              <mesh key={x} geometry={GEO.sphere} material={toon('#ffffff')} scale={[1.0, 0.45, 1.1]} position={[x, 0.4, 0]} castShadow />
            ))}
            <mesh geometry={GEO.sphere} material={toon('#d6e8ff')} scale={[0.6, 0.25, 0.4]} position={[0, 0.75, -0.7]} />
          </>
        ) : item('bed') === 'bedHeart' ? (
          <>
            <mesh geometry={GEO.box} material={toon('#f27aa6')} scale={[3, 0.5, 2.4]} position={[0, 0.25, 0]} castShadow />
            <mesh geometry={GEO.box} material={toon('#ffd6e6')} scale={[2.8, 0.25, 2.2]} position={[0, 0.6, 0]} />
            {[-0.45, 0.45].map((x) => (
              <mesh key={x} geometry={GEO.sphere} material={toon('#f27aa6')} scale={[0.7, 0.8, 0.2]} position={[x * 1.3, 1.3, -1.15]} />
            ))}
          </>
        ) : (
          <>
            <mesh geometry={GEO.cylinder} material={toon('#d5a57f')} scale={[1.6, 0.5, 1.25]} position={[0, 0.25, 0]} castShadow />
            <mesh geometry={GEO.cylinder} material={toon('#ffe3ee')} scale={[1.4, 0.2, 1.05]} position={[0, 0.5, 0]} />
            {[-0.5, 0.5].map((x) => (
              <mesh key={x} geometry={GEO.sphere} material={toon(x < 0 ? '#ffffff' : '#d6e8ff')} scale={[0.45, 0.2, 0.3]} position={[x, 0.68, -0.6]} />
            ))}
          </>
        )}
      </group>
      {/* rug */}
      {item('rug') && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[S.rug.x, FLOOR_Y + 0.01, S.rug.z]}>
          {item('rug') === 'rugHeart' ? <shapeGeometry args={[heartShape(2)]} /> : <circleGeometry args={[2.1, 32]} />}
          <meshLambertMaterial color={item('rug') === 'rugRainbow' ? '#ffd1a8' : item('rug') === 'rugHeart' ? '#f7a8c6' : '#cdb8f5'} />
        </mesh>
      )}
      {item('rug') === 'rugRainbow' &&
        ['#f7a8c6', '#fff1b8', '#a8e0c4', '#9cc3ea'].map((c, i) => (
          <mesh key={c} rotation={[-Math.PI / 2, 0, 0]} position={[S.rug.x, FLOOR_Y + 0.012 + i * 0.001, S.rug.z]}>
            <ringGeometry args={[1.7 - i * 0.4, 1.95 - i * 0.4, 32]} />
            <meshLambertMaterial color={c} />
          </mesh>
        ))}
      {/* seating */}
      {item('sofa') === 'sofaPink' && (
        <group position={[S.sofa.x, FLOOR_Y, S.sofa.z]}>
          <mesh geometry={GEO.box} material={toon('#f392b4')} scale={[3, 0.6, 1.1]} position={[0, 0.3, 0]} castShadow />
          <mesh geometry={GEO.box} material={toon('#f392b4')} scale={[3, 0.9, 0.3]} position={[0, 0.75, -0.45]} castShadow />
          {[-1.4, 1.4].map((x) => (
            <mesh key={x} geometry={GEO.box} material={toon('#e07ca2')} scale={[0.3, 0.8, 1.1]} position={[x, 0.45, 0]} />
          ))}
        </group>
      )}
      {item('sofa') === 'sofaBeans' &&
        [-0.8, 0.8].map((x, i) => (
          <mesh key={x} geometry={GEO.sphere} material={toon(i ? '#9cc3ea' : '#f7a8c6')} scale={[0.75, 0.5, 0.75]} position={[S.sofa.x + x, 0.45, S.sofa.z]} castShadow />
        ))}
      {/* table */}
      {item('table') && (
        <group position={[S.table.x, FLOOR_Y, S.table.z]}>
          <mesh geometry={GEO.cylinder} material={toon('#f6ede4')} scale={[0.75, 0.06, 0.75]} position={[0, 0.7, 0]} castShadow />
          <mesh geometry={GEO.cylinder} material={toon('#d5a57f')} scale={[0.08, 0.7, 0.08]} position={[0, 0.35, 0]} />
          {item('table') === 'tableRound' ? (
            <>
              <mesh geometry={GEO.cylinder} material={toon('#ffd6e6')} scale={[0.3, 0.22, 0.3]} position={[0, 0.85, 0]} />
              <mesh geometry={GEO.sphere} material={toon('#f27aa6')} scale={0.07} position={[0, 1.0, 0]} />
            </>
          ) : (
            [-0.25, 0.25].map((x) => <mesh key={x} geometry={GEO.cylinder} material={toon('#ffffff')} scale={[0.09, 0.1, 0.09]} position={[x, 0.79, 0]} />)
          )}
        </group>
      )}
      {/* lamp */}
      {item('lamp') && (
        <group position={[S.lamp.x, FLOOR_Y, S.lamp.z]}>
          <mesh geometry={GEO.cylinder} material={toon('#fff4e6')} scale={[0.1, 1.2, 0.1]} position={[0, 0.6, 0]} />
          {item('lamp') === 'lampStar' ? (
            <mesh geometry={GEO.ico} material={lampMaterial('#fff1b8', '#ffd36e')} scale={0.4} position={[0, 1.45, 0]} />
          ) : (
            <mesh geometry={GEO.sphere} material={lampMaterial('#ffc2dc', '#ff9fc4')} scale={[0.55, 0.35, 0.55]} position={[0, 1.4, 0]} />
          )}
        </group>
      )}
      {/* plants */}
      {item('plant') &&
        [S.plant, { x: -S.plant.x, z: S.plant.z }].map((p, i) => (
          <group key={i} position={[p.x, FLOOR_Y, p.z]}>
            <mesh geometry={GEO.cylinder} material={toon('#e2a98f')} scale={[0.35, 0.5, 0.35]} position={[0, 0.25, 0]} castShadow />
            {item('plant') === 'plantFlowers' ? (
              [0, 1, 2, 3].map((k) => <mesh key={k} geometry={GEO.sphere} material={toon(['#f7a8c6', '#ffffff', '#ffc59e', '#cdb8f5'][k])} scale={0.17} position={[Math.cos(k * 1.6) * 0.2, 0.75, Math.sin(k * 1.6) * 0.2]} />)
            ) : (
              <mesh geometry={GEO.sphere} material={toon('#8fc477')} scale={[0.5, 0.6, 0.5]} position={[0, 0.85, 0]} />
            )}
          </group>
        ))}
      {/* wall art */}
      {item('art') === 'artFrame' && (
        <group position={[S.art.x, 1.8, S.art.z]}>
          <mesh geometry={GEO.box} material={toon('#d5a57f')} scale={[1.6, 1.1, 0.08]} />
          <mesh geometry={GEO.box} material={toon('#ffe9f1')} scale={[1.4, 0.9, 0.09]} />
          <mesh geometry={GEO.sphere} material={toon('#fff4ea')} scale={[0.2, 0.22, 0.05]} position={[-0.25, -0.1, 0.05]} />
          <mesh geometry={GEO.sphere} material={toon('#c9cfdf')} scale={[0.22, 0.24, 0.05]} position={[0.25, -0.1, 0.05]} />
          <mesh geometry={GEO.sphere} material={toon('#f27aa6')} scale={[0.07, 0.07, 0.04]} position={[0, 0.25, 0.06]} />
        </group>
      )}
      {item('art') === 'artHeart' &&
        Array.from({ length: 7 }, (_, i) => (
          <mesh key={i} geometry={GEO.sphere} material={toon(i % 2 ? '#f7a8c6' : '#ffffff')} scale={[0.14, 0.14, 0.05]} position={[S.art.x - 1.8 + i * 0.6, 2.3 - Math.sin((i / 6) * Math.PI) * 0.35, S.art.z]} />
        ))}
      {/* window */}
      <group position={[S.window.x, 1.75, S.window.z]}>
        <mesh geometry={GEO.box} material={toon('#ffffff')} scale={[1.8, 1.3, 0.1]} />
        <mesh geometry={GEO.box} material={lampMaterial('#d8ecff', '#ffe6b0')} scale={[1.6, 1.1, 0.11]} />
        {item('window') === 'windowLights' ? (
          Array.from({ length: 9 }, (_, i) => <mesh key={i} geometry={GEO.sphere} material={lampMaterial('#fff1b8', '#ffd36e')} scale={0.06} position={[-1 + i * 0.25, 0.75 - Math.sin((i / 8) * Math.PI) * 0.15, 0.1]} />)
        ) : (
          [-1, 1].map((sx) => (
            <mesh key={sx} geometry={GEO.box} material={toon(item('window') === 'windowPink' ? '#f7a8c6' : '#fff6ec')} scale={[0.4, 1.4, 0.06]} position={[sx * 0.95, 0, 0.1]} />
          ))
        )}
      </group>
      {/* shelf */}
      {item('shelf') && (
        <group position={[S.shelf.x, FLOOR_Y, S.shelf.z]} rotation={[0, S.shelf.yaw ?? 0, 0]}>
          <mesh geometry={GEO.box} material={toon('#d5a57f')} scale={[2, 2.2, 0.6]} position={[0, 1.1, 0]} castShadow />
          {[0.6, 1.3, 1.95].map((y) =>
            [-0.6, -0.3, 0, 0.35, 0.65].map((x, k) => (
              <mesh key={`${x}${y}`} geometry={GEO.box} material={toon(['#f7a8c6', '#9cc3ea', '#fff1b8', '#cdb8f5', '#a8e0c4'][k])} scale={[0.18, 0.42, 0.4]} position={[x, y, 0.08]} />
            )),
          )}
        </group>
      )}
      {/* play corner */}
      {item('play') === 'playTree' && (
        <group position={[S.play.x, FLOOR_Y, S.play.z]}>
          <mesh geometry={GEO.cylinder} material={toon('#f3dca6')} scale={[0.2, 2.4, 0.2]} position={[0, 1.2, 0]} castShadow />
          {[0.8, 1.7, 2.5].map((y, i) => (
            <mesh key={y} geometry={GEO.cylinder} material={toon(i % 2 ? '#cdb8f5' : '#f7a8c6')} scale={[0.6, 0.12, 0.6]} position={[0, y, 0]} castShadow />
          ))}
        </group>
      )}
      {item('play') === 'playYarn' && (
        <group position={[S.play.x, FLOOR_Y, S.play.z]}>
          <mesh geometry={GEO.cylinder} material={toon('#d5a57f')} scale={[0.6, 0.35, 0.6]} position={[0, 0.18, 0]} />
          {['#f7a8c6', '#9cc3ea', '#fff1b8'].map((c, i) => (
            <mesh key={c} geometry={GEO.sphere} material={toon(c)} scale={0.22} position={[Math.cos(i * 2) * 0.25, 0.45, Math.sin(i * 2) * 0.25]} />
          ))}
        </group>
      )}
    </group>
  )
}

function heartShape(r: number) {
  const s = new THREE.Shape()
  s.moveTo(0, -r)
  s.bezierCurveTo(-r * 1.5, 0, -r, r * 1.2, 0, r * 0.55)
  s.bezierCurveTo(r, r * 1.2, r * 1.5, 0, 0, -r)
  return s
}

/** Sparkly spots you can decorate, plus the mirror and the bed. */
function DecorSpots() {
  const refs = useRef<(THREE.Group | null)[]>([])
  useEffect(() => {
    const offs = HOME_SLOTS.map((slot) => {
      const p = SLOT_SPOTS[slot.id]
      return interactions.register({
        id: `decor:${slot.id}`,
        position: new THREE.Vector3(p.x, 0.8, p.z),
        radius: slot.id === 'floor' || slot.id === 'wall' ? 1.6 : 2.2,
        label: () => `Decorate: ${slot.name}`,
        enabled: () => true,
        onInteract: () => openMenu('decorate', slot.id),
      })
    })
    offs.push(
      interactions.register({
        id: 'mirror',
        position: new THREE.Vector3(MIRROR.x, 1, MIRROR.z),
        radius: 2.2,
        label: () => 'Change outfits',
        enabled: () => true,
        onInteract: () => openMenu('pause', 'wardrobe'),
      }),
      interactions.register({
        id: 'door-out',
        position: new THREE.Vector3(0, 1, D - 0.4),
        radius: 2.4,
        label: () => 'Go outside',
        enabled: () => true,
        onInteract: () => import('../../flow').then((f) => f.travelTo('village', 'lilac')),
      }),
      interactions.register({
        id: 'nap',
        position: new THREE.Vector3(SLOT_SPOTS.bed.x, 0.6, SLOT_SPOTS.bed.z + 1.4),
        radius: 2.0,
        label: () => 'Curl up for a nap',
        enabled: () => true,
        onInteract: () => {
          const P = runtime.player
          P.pos.set(SLOT_SPOTS.bed.x, 0.6, SLOT_SPOTS.bed.z)
          P.idleTime = 26
          if (game.get().flags.tatanJoined) runtime.companion.pos.set(SLOT_SPOTS.bed.x + 0.9, 0.6, SLOT_SPOTS.bed.z)
          say('home_nap')
        },
      }),
    )
    return () => offs.forEach((o) => o())
  }, [])
  useFrame(() => {
    refs.current.forEach((g, i) => {
      if (g) g.position.y = 0.25 + Math.sin(runtime.time * 2 + i) * 0.05
    })
  })
  return (
    <group>
      {HOME_SLOTS.map((slot, i) => {
        const p = SLOT_SPOTS[slot.id]
        return (
          <group key={slot.id} ref={(el) => void (refs.current[i] = el)} position={[p.x, 0.25, p.z]}>
            <Halo color="#fff0c8" r={0.18} opacity={0.5} />
          </group>
        )
      })}
    </group>
  )
}

function HomeScene() {
  return (
    <group>
      <Room />
      <Furniture />
      <DecorSpots />
      <pointLight position={[0, 2.6, 0]} intensity={1.2} distance={22} color="#ffe6d0" />
    </group>
  )
}

function NoDistant() {
  return null
}

let mapCache: HTMLCanvasElement | null = null
function homeMap() {
  if (mapCache) return mapCache
  const floor = new THREE.Color('#f3dcc4'), out = new THREE.Color('#cfe6b6')
  mapCache = paintRegionMap({
    heightAt: homeHeight,
    colorAt: (x, z, _h, col) => col.copy(Math.abs(x) < W && Math.abs(z) < D ? floor : out),
    playRadius: 60,
    lift: 0,
    overlays: (m) => {
      m.rect(0, -D - 0.15, W + 0.3, 0.3, 0, '#b9a5ee')
      m.rect(-W - 0.15, 0, 0.3, D + 0.3, 0, '#b9a5ee')
      m.rect(W + 0.15, 0, 0.3, D + 0.3, 0, '#b9a5ee')
      m.rect(-5.6, D + 0.15, 3.6, 0.3, 0, '#b9a5ee')
      m.rect(5.6, D + 0.15, 3.6, 0.3, 0, '#b9a5ee')
      m.rect(SLOT_SPOTS.bed.x, SLOT_SPOTS.bed.z, 1.6, 1.3, 0, '#ffd6e6', '#f27aa6')
    },
  })
  return mapCache
}

export const homeRegion: RegionRuntime = {
  id: 'home',
  name: 'Lilac Cottage',
  Scene: HomeScene,
  Distant: NoDistant,
  physics: homePhysics,
  heightAt: homeHeight,
  entries: { door: { x: 0, z: 5.2, yaw: Math.PI } },
  defaultEntry: 'door',
  exits: [{ id: 'door', x: 0, z: D - 0.4, to: 'village', entry: 'lilac', label: 'Cuddleberry Village', style: 'custom' }],
  mapImage: homeMap,
  landmarks: [],
  atmosphere: {
    sky: ['#f6d9e7', '#fbe6ee', '#fff1f0'],
    fog: '#fbe9ef',
    fogNear: 40,
    fogFar: 120,
    sunColor: '#fff0dc',
    sunIntensity: 1.4,
    sunDir: [-0.35, 0.85, 0.3],
    hemiSky: '#fff4f6',
    hemiGround: '#e8d3c2',
    hemiIntensity: 1.5,
    ambient: '#ffeaf0',
    ambientIntensity: 0.4,
    clouds: true,
  },
  music: 'village',
  ambience: 'village',
}
