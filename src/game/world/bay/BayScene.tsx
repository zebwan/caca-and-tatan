/** Bubblegum Bay — region 4: pink sand, a pier, a little boat and a lighthouse. */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { BAY as B } from './layout'
import { bayColor, bayFloats, bayHeight, bayPhysics, bayScatter, BAY_PALETTE } from './world'
import { GroundMesh, WaterSurface } from '../common/Ground'
import { Vegetation } from '../common/Vegetation'
import { Building, Lamp } from '../common/Building'
import { Coins } from '../common/Coins'
import { Keepsake } from '../common/Keepsake'
import { CarryOnBack, ExitGate, FragmentCeremony, Halo, MovingPlatforms, QuestTarget, StarSocket } from '../common/questKit'
import { GEO, lampMaterial, toon } from '../materials'
import { Npc } from '../../characters/Npc'
import { MiniCat } from '../../characters/MiniCat'
import { tatan } from '../../characters/Companion'
import { runtime } from '../../state/runtime'
import { game, useGame } from '../../state/store'
import { interactions } from '../../systems/interactions'
import { questState } from '../../systems/quests'
import { say } from '../../systems/dialogue'
import { audio } from '../../systems/audio'
import { travelTo } from '../../flow'
import { isBuilt, regionRT } from '../regions'

const H = (p: { x: number; z: number }) => bayHeight(p.x, p.z)

function Huts() {
  return (
    <>
      {B.huts.map((h) => (
        <Building key={h.id} x={h.x} z={h.z} y={H(h)} yaw={h.yaw} w={h.w} d={h.d} wall={h.wall} roof={h.roof} chimney={false} awning={h.id === 'shelly' ? '#7fd0d8' : undefined} height={2.3} />
      ))}
    </>
  )
}

function Pier() {
  const p = B.pier
  const n = 30
  return (
    <group>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} geometry={GEO.box} material={toon(i % 2 ? '#e2b48c' : '#d9a982')} scale={[(p.hw * 2) / n - 0.05, 0.14, p.hd * 2]} position={[p.x - p.hw + ((i + 0.5) * p.hw * 2) / n, p.deck - 0.07, p.z]} castShadow receiveShadow />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <group key={i}>
          {[-1, 1].map((sz) => (
            <mesh key={sz} geometry={GEO.cylinder} material={toon('#b98a66')} scale={[0.12, 3, 0.12]} position={[p.x - p.hw + 1 + i * 2.9, p.deck - 1.2, p.z + sz * (p.hd + 0.05)]} />
          ))}
        </group>
      ))}
      {[-1, 1].map((sz) => (
        <mesh key={sz} geometry={GEO.box} material={toon('#c99a72')} scale={[p.hw * 2 - 2, 0.1, 0.1]} position={[p.x + 1, p.deck + 0.8, p.z + sz * (p.hd + 0.1)]} />
      ))}
      {/* crates at the end of the pier */}
      <mesh geometry={GEO.box} material={toon('#dcae86')} scale={[0.9, 0.7, 0.9]} position={[40.2, p.deck + 0.35, 6.6]} castShadow />
      <mesh geometry={GEO.box} material={toon('#d3a37b')} scale={[0.7, 0.5, 0.7]} position={[40.3, p.deck + 0.95, 6.6]} castShadow />
    </group>
  )
}

function BoatModel() {
  return (
    <group>
      <mesh geometry={GEO.sphere} material={toon('#ffffff')} scale={[0.95, 0.42, 1.8]} position={[0, 0.2, 0]} castShadow />
      <mesh geometry={GEO.sphere} material={toon('#f7a8c6')} scale={[0.97, 0.12, 1.82]} position={[0, 0.32, 0]} />
      <mesh geometry={GEO.box} material={toon('#d9a982')} scale={[1.4, 0.08, 0.3]} position={[0, 0.5, -0.5]} />
      <mesh geometry={GEO.box} material={toon('#d9a982')} scale={[1.4, 0.08, 0.3]} position={[0, 0.5, 0.6]} />
      <mesh geometry={GEO.cylinder} material={toon('#c99a72')} scale={[0.05, 2.2, 0.05]} position={[0, 1.4, 0.1]} />
      <mesh geometry={GEO.cone} material={toon('#fff6ec')} scale={[0.02, 1.5, 0.9]} position={[0, 1.5, 0.5]} rotation={[0, 0, 0]} />
    </group>
  )
}

/** The Captain's boat: rides between the pier and the sandbar. */
function Boat() {
  const ref = useRef<THREE.Group>(null)
  const st = useRef({ at: 'pier' as 'pier' | 'sandbar', ride: null as null | { t: number; dir: 1 | -1 } })
  const path = B.boatPath
  const along = (k: number) => {
    const seg = Math.min(path.length - 2, Math.floor(k * (path.length - 1)))
    const lk = k * (path.length - 1) - seg
    const a = path[seg], b = path[seg + 1]
    return { x: a.x + (b.x - a.x) * lk, z: a.z + (b.z - a.z) * lk, yaw: Math.atan2(b.x - a.x, b.z - a.z) }
  }
  useEffect(
    () =>
      interactions.register({
        id: 'boat',
        get position() {
          const g = ref.current
          return g ? new THREE.Vector3(g.position.x, 1, g.position.z) : new THREE.Vector3(B.boat.x, 1, B.boat.z)
        },
        radius: 3.6,
        label: () => (st.current.at === 'pier' ? 'Hop in the boat' : 'Sail back to the pier'),
        enabled: () => !st.current.ride,
        onInteract: () => {
          const qs = questState('q_b_bottle')
          if (qs !== 'in_progress' && qs !== 'completed') return say('boat_locked')
          if (game.get().flags.tatanJoined) tatan.say(game.get().flags.boatOnce ? '*rows happily*' : 'I’ll row! You just enjoy the view.', 2.5)
          game.setFlag('boatOnce')
          st.current.ride = { t: 0, dir: st.current.at === 'pier' ? 1 : -1 }
          runtime.player.frozen = true
          tatan.scripted = true
          audio.sfx('splash')
        },
      }),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  )
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const g = ref.current
    if (!g) return
    const s = st.current
    const t = runtime.time
    let k = s.at === 'pier' ? 0 : 1
    if (s.ride) {
      s.ride.t += dt / 6
      const p = Math.min(1, s.ride.t)
      const e = p * p * (3 - 2 * p)
      k = s.ride.dir === 1 ? e : 1 - e
    }
    const pos = along(k)
    g.position.set(pos.x, 0.18 + Math.sin(t * 1.4) * 0.06, pos.z)
    g.rotation.set(Math.sin(t * 1.1) * 0.04, pos.yaw + (s.ride?.dir === -1 ? Math.PI : 0), Math.sin(t * 1.3) * 0.05)
    if (s.ride) {
      const P = runtime.player
      const fw = { x: Math.sin(g.rotation.y), z: Math.cos(g.rotation.y) }
      P.pos.set(g.position.x + fw.x * 0.5, g.position.y + 0.45, g.position.z + fw.z * 0.5)
      P.yaw = g.rotation.y
      P.vel.set(0, 0, 0)
      runtime.companion.pos.set(g.position.x - fw.x * 0.6, g.position.y + 0.45, g.position.z - fw.z * 0.6)
      runtime.companion.yaw = g.rotation.y
      if (s.ride.t >= 1) {
        s.at = s.ride.dir === 1 ? 'sandbar' : 'pier'
        s.ride = null
        const land = s.at === 'sandbar' ? B.boatLanding : { x: 40.6, z: 6 }
        const y = s.at === 'sandbar' ? H(land) : B.pier.deck
        P.pos.set(land.x, y, land.z)
        P.lastSafe.copy(P.pos)
        runtime.companion.pos.set(land.x + 0.9, y, land.z + 0.6)
        P.frozen = false
        tatan.scripted = false
      }
    }
  })
  return (
    <group ref={ref}>
      <BoatModel />
    </group>
  )
}

function Floats() {
  return (
    <MovingPlatforms surfaces={bayFloats}>
      {(i) => (
        <group>
          <mesh geometry={GEO.cylinder} material={toon(i % 2 ? '#ffd6e6' : '#efe6dc')} scale={[1, 0.5, 1]} position={[0, -0.25, 0]} castShadow receiveShadow />
          <mesh geometry={GEO.cylinder} material={toon('#bfe3a5')} scale={[0.7, 0.04, 0.7]} position={[0, 0.01, 0]} />
        </group>
      )}
    </MovingPlatforms>
  )
}

function KittenRescue() {
  const k = B.kitten
  const carrying = useGame((s) => s.quests.q_b_kitten?.state === 'in_progress' && s.collected.includes('pebble'))
  const home = useGame((s) => s.quests.q_b_kitten?.state === 'completed')
  return (
    <group>
      <QuestTarget
        id="pebble" quest="q_b_kitten" step="reach" event="collect:pebble" x={k.x} z={k.z} y={H(k)} label="Hop on, Pebble!" dialogue="pebble_pickup" radius={2.6}
        idle={home ? null : <group position={[k.x, H(k), k.z]}><MiniCat variant="pebble" heightAt={bayHeight} /></group>}
        done={home ? <MiniCat variant="pebble" heightAt={bayHeight} wander={{ x: B.npcs.captain.x - 2.4, z: B.npcs.captain.z + 1.4, i: 0, r: 1.2 }} /> : null}
      >
        <MiniCat variant="pebble" heightAt={bayHeight} />
      </QuestTarget>
      <CarryOnBack when={carrying} height={0.8}>
        <group scale={0.8}>
          <MiniCat variant="pebble" heightAt={() => 0} noLook />
        </group>
      </CarryOnBack>
    </group>
  )
}

function Shells() {
  const cols = ['#ffd6e6', '#bfe9f2', '#fff1c8', '#e3d4ff', '#ffc9b0', '#ffffff']
  return (
    <group>
      {B.shells.map((s, i) => (
        <QuestTarget key={i} id={`shell:${i}`} quest="q_b_shells" step="collect" event="collect:shell" x={s.x} z={s.z} y={H(s) + 0.15} label="Pick up the seashell" glow="#ffe6f2" bob={0.04}>
          <mesh geometry={GEO.cone} material={toon(cols[i], cols[i], 0.4)} scale={[0.22, 0.28, 0.14]} rotation={[-Math.PI / 2.5, 0, 0]} />
        </QuestTarget>
      ))}
      {B.digSpots.map((s, i) => (
        <QuestTarget key={i} id={`dig:${i}`} quest="q_b_treasure" step="dig" event="dig:sand" x={s.x} z={s.z} y={H(s)} label="Dig here" dialogue="dig_found" glow={null}>
          <mesh geometry={GEO.sphere} material={toon('#ffd9e2')} scale={[0.6, 0.18, 0.6]} />
          <Sparkles count={12} scale={[1.2, 0.8, 1.2]} position={[0, 0.3, 0]} size={4} speed={0.6} color="#fff6c8" />
        </QuestTarget>
      ))}
      <QuestTarget id="bottle" quest="q_b_bottle" step="fetch" event="collect:bottle" x={B.bottle.x} z={B.bottle.z} y={H(B.bottle) + 0.2} label="Pick up the bottle" dialogue="bottle_pickup" glow="#bfe9f2">
        <group rotation={[0, 0.6, Math.PI / 2.2]}>
          <mesh geometry={GEO.cylinder} material={toon('#bfe9f2', '#9fdcff', 0.4)} scale={[0.12, 0.42, 0.12]} />
          <mesh geometry={GEO.cylinder} material={toon('#c99a72')} scale={[0.06, 0.1, 0.06]} position={[0, 0.26, 0]} />
          <mesh geometry={GEO.cylinder} material={toon('#fffaf3')} scale={[0.07, 0.3, 0.07]} />
        </group>
      </QuestTarget>
    </group>
  )
}

function Lighthouse() {
  const L = B.lighthouse
  const y = H(L)
  const done = useGame((s) => s.quests.q_b_gate?.state === 'completed')
  const beam = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (beam.current) beam.current.rotation.y += dt * 0.6
  })
  const door = B.lighthouseDoor
  const socket = (i: number): THREE.Vector3Tuple => [door.x + (i - 1) * 0.55, H(door) + 2.55 + (i === 1 ? 0.15 : 0), door.z + 0.35]
  return (
    <group>
      <group position={[L.x, y, L.z]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} geometry={GEO.cylinder} material={toon(i % 2 ? '#f392b4' : '#ffffff')} scale={[2.2 - i * 0.18, 2.4, 2.2 - i * 0.18]} position={[0, 1.2 + i * 2.4, 0]} castShadow receiveShadow />
        ))}
        <mesh geometry={GEO.cylinder} material={toon('#fff6ec')} scale={[1.8, 0.25, 1.8]} position={[0, 12.1, 0]} />
        <mesh geometry={GEO.sphere} material={done ? lampMaterial('#fff6c8', '#ffe58a') : toon('#e9e4f2')} scale={1.2} position={[0, 13.2, 0]} />
        <mesh geometry={GEO.cone} material={toon('#f392b4')} scale={[1.7, 1.4, 1.7]} position={[0, 14.8, 0]} castShadow />
        {done && (
          <group ref={beam} position={[0, 13.2, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]} position={[9, 0, 0]}>
              <coneGeometry args={[2.4, 18, 16, 1, true]} />
              <meshBasicMaterial color="#fff6c8" transparent opacity={0.22} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
          </group>
        )}
      </group>
      <FragmentCeremony
        quest="q_b_gate" event="activate:lighthouse" anchor={door} y={H(door)}
        holes={[0, 1, 2].map(socket)}
        standAt={{ x: door.x, z: door.z + 3.2, yaw: Math.PI }}
        camA={[door.x + 7, H(door) + 3.5, door.z + 7]} camB={[door.x - 5, H(door) + 6, door.z + 9]} camC={[door.x + 18, H(door) + 18, door.z + 24]}
        lookY={4}
        dialogues={{ locked: 'lighthouse_locked', ready: 'lighthouse_ready', after: 'lighthouse_after' }}
        reveal="garden" vision={false} visionAt={{ x: door.x, z: door.z, yaw: 0 }}
      >
        {(lit) => (
          <group>
            <mesh geometry={GEO.box} material={toon('#d69a86')} scale={[1.3, 2.1, 0.2]} position={[door.x, H(door) + 1.05, door.z]} />
            {[0, 1, 2].map((i) => (
              <StarSocket key={i} position={socket(i)} lit={lit > 0.3 + i * 0.15} scale={0.38} />
            ))}
          </group>
        )}
      </FragmentCeremony>
      <StarlightStairs />
    </group>
  )
}

/** After the lighthouse shines, a staircase of starlight rises toward the garden. */
function StarlightStairs() {
  const open = useGame((s) => s.quests.q_b_gate?.state === 'completed')
  const base = B.stairsBase
  const by = H(base)
  const refs = useRef<(THREE.Mesh | null)[]>([])
  useEffect(
    () =>
      interactions.register({
        id: 'stairs',
        position: new THREE.Vector3(base.x, by + 1, base.z),
        radius: 3.2,
        label: () => (open ? 'Climb the starlight stairs' : 'Look at the cliff'),
        enabled: () => true,
        onInteract: () => {
          if (questState('q_b_gate') !== 'completed') return say('stairs_locked')
          if (!isBuilt('garden')) return say('chapter_coming')
          travelTo('garden', 'stairs')
        },
      }),
    [base.x, base.z, by, open],
  )
  useFrame(() => {
    refs.current.forEach((m, i) => {
      if (m) (m.material as THREE.MeshBasicMaterial).opacity = 0.45 + Math.sin(runtime.time * 3 - i * 0.4) * 0.25
    })
  })
  if (!open) return null
  return (
    <group>
      {Array.from({ length: 26 }, (_, i) => (
        <mesh key={i} ref={(el) => void (refs.current[i] = el)} position={[base.x + i * 0.9, by + 0.3 + i * 0.85, base.z - i * 1.4]} rotation={[0, -0.6, 0]}>
          <boxGeometry args={[2.4, 0.18, 1.1]} />
          <meshBasicMaterial color="#fff1b8" transparent opacity={0.6} depthWrite={false} />
        </mesh>
      ))}
      <Sparkles count={80} scale={[20, 24, 30]} position={[base.x + 11, by + 12, base.z - 18]} size={5} speed={0.4} color="#fff6c8" />
      <group position={[base.x, by + 1.2, base.z]}>
        <Halo color="#fff1b8" r={1.2} opacity={0.2} />
      </group>
    </group>
  )
}

function RockArch() {
  return (
    <group>
      {B.rockArch.map((r, i) => {
        const base = H(r)
        const top = base + r.rise
        return (
          <group key={i} position={[r.x, 0, r.z]}>
            <mesh geometry={GEO.cylinder} material={toon('#f3e3e6')} scale={[r.r, top - base + 1.2, r.r * 0.95]} position={[0, (top + base - 1.2) / 2, 0]} castShadow receiveShadow />
            <mesh geometry={GEO.cylinder} material={toon('#ffd6e0')} scale={[r.r * 0.85, 0.06, r.r * 0.85]} position={[0, top + 0.01, 0]} />
          </group>
        )
      })}
    </group>
  )
}

function IceCreamCart() {
  const m = B.npcs.marina
  const y = H(m)
  return (
    <group position={[m.x - 1.2, y, m.z]}>
      <mesh geometry={GEO.box} material={toon('#fff0f6')} scale={[1.2, 0.9, 1.8]} position={[0, 0.65, 0]} castShadow />
      {[-0.6, 0.6].map((z) => (
        <mesh key={z} geometry={GEO.cylinder} material={toon('#f392b4')} scale={[0.25, 0.08, 0.25]} position={[0.62, 0.25, z]} rotation={[0, 0, Math.PI / 2]} />
      ))}
      <mesh geometry={GEO.cylinder} material={toon('#c99a72')} scale={[0.04, 2.2, 0.04]} position={[0, 2, 0]} />
      <mesh geometry={GEO.cone} material={toon('#7fd0d8')} scale={[1.6, 0.6, 1.6]} position={[0, 3.2, 0]} castShadow />
      {['#ffd6e6', '#fff6ec', '#c9e7ff'].map((c, i) => (
        <mesh key={c} geometry={GEO.sphere} material={toon(c)} scale={0.16} position={[0.2, 1.18, -0.5 + i * 0.5]} />
      ))}
    </group>
  )
}

function Seagulls() {
  const refs = useRef<(THREE.Group | null)[]>([])
  useFrame(() => {
    const t = runtime.time
    refs.current.forEach((g, i) => {
      if (!g) return
      const a = t * (0.15 + i * 0.03) + i * 2
      g.position.set(30 + Math.cos(a) * (14 + i * 3), 12 + i * 1.5 + Math.sin(t + i) * 0.6, Math.sin(a) * (16 + i * 2))
      g.rotation.y = -a
      const w = Math.sin(t * 6 + i) * 0.4
      g.children[1].rotation.z = w
      g.children[2].rotation.z = -w
    })
  })
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <group key={i} ref={(el) => void (refs.current[i] = el)}>
          <mesh geometry={GEO.sphere} material={toon('#ffffff')} scale={[0.2, 0.18, 0.4]} />
          <mesh geometry={GEO.box} material={toon('#ffffff')} scale={[0.9, 0.04, 0.3]} position={[0.45, 0, 0]} />
          <mesh geometry={GEO.box} material={toon('#ffffff')} scale={[0.9, 0.04, 0.3]} position={[-0.45, 0, 0]} />
        </group>
      ))}
    </group>
  )
}

function BayNpcs() {
  const n = B.npcs
  return (
    <>
      <Npc id="shelly" variant="shelly" x={n.shelly.x} z={n.shelly.z} y={H(n.shelly)} yaw={1.4} offers={['q_b_shells', 'q_b_treasure']} />
      <Npc id="captain" variant="captain" x={n.captain.x} z={n.captain.z} y={H(n.captain)} yaw={-1.2} offers={['q_b_kitten', 'q_b_bottle']} />
      <Npc id="sunny" variant="sunny" x={n.sunny.x} z={n.sunny.z} y={H(n.sunny)} yaw={1.6} />
      <Npc id="marina" variant="marina" x={n.marina.x} z={n.marina.z} y={H(n.marina)} yaw={1.2} />
    </>
  )
}

export function Bay() {
  const world = useMemo(() => bayPhysics(), [])
  const exits = regionRT('bay').exits.filter((e) => e.style !== 'custom')
  return (
    <group>
      <GroundMesh heightAt={bayHeight} colorAt={bayColor} />
      <WaterSurface heightAt={bayHeight} level={0.25} shallow="#b5ecf0" deep="#6cc7dd" extend={240} />
      <Vegetation scatter={bayScatter()} palette={BAY_PALETTE} />
      <Huts />
      <Pier />
      <Boat />
      <Floats />
      <KittenRescue />
      <Shells />
      <Lighthouse />
      <RockArch />
      <IceCreamCart />
      <Seagulls />
      {B.lamps.map((l, i) => (
        <Lamp key={i} x={l.x} z={l.z} y={l.x > 18 ? B.pier.deck : H(l)} />
      ))}
      <BayNpcs />
      <Keepsake id="starfish" x={B.keepsakes.starfish.x} z={B.keepsakes.starfish.z} y={H(B.rockArch[2]) + B.rockArch[2].rise} />
      <Keepsake id="postcard" x={B.keepsakes.postcard.x} z={B.keepsakes.postcard.z} y={B.pier.deck} />
      <Keepsake id="seaglass" x={B.keepsakes.seaglass.x} z={B.keepsakes.seaglass.z} y={H(B.keepsakes.seaglass)} />
      <Coins region="bay" world={world} count={12} seed={808} extra={[{ x: 34.4, z: -17.2 }, { x: 44, z: 29.4 }]} />
      {exits.map((e) => (
        <ExitGate key={e.id} exit={e} y={H(e)} color="#7fd0d8" />
      ))}
    </group>
  )
}
