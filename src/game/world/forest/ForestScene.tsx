/** Whispering Moon Forest — region 3 (twilight, glowing, gentle). */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { FOREST as F } from './layout'
import { forestColor, forestHeight, forestPhysics, forestScatter, forestTerrain, FOREST_PALETTE } from './world'
import { GroundMesh, WaterSurface } from '../common/Ground'
import { Vegetation } from '../common/Vegetation'
import { Lamp } from '../common/Building'
import { Coins } from '../common/Coins'
import { Keepsake } from '../common/Keepsake'
import { ExitGate, FragmentCeremony, Halo, QuestTarget, StarSocket } from '../common/questKit'
import { GEO, lampMaterial, toon } from '../materials'
import { Npc } from '../../characters/Npc'
import { runtime } from '../../state/runtime'
import { game, useGame } from '../../state/store'
import { dispatch, questState } from '../../systems/quests'
import { say } from '../../systems/dialogue'
import { audio } from '../../systems/audio'
import { tatan } from '../../characters/Companion'
import { DIALOGUE } from '../../data/story'
import { regionRT } from '../regions'
import { WATER_LEVEL } from '../meadow/terrain'

const H = (p: { x: number; z: number }) => forestHeight(p.x, p.z)

function HollowTree() {
  const t = F.hollowTree
  const y = H(t)
  return (
    <group position={[t.x, y, t.z]}>
      <mesh geometry={GEO.cylinder} material={toon('#8a6f8f')} scale={[1.8, 6, 1.8]} position={[0, 3, 0]} castShadow />
      <mesh geometry={GEO.sphere} material={toon('#3f3556')} scale={[0.6, 0.9, 0.2]} position={[0, 1.3, 1.72]} />
      <mesh geometry={GEO.sphere} material={toon('#8e7cc9', '#6f5fb0', 0.15)} scale={[3.6, 2.6, 3.6]} position={[0, 7.2, 0]} castShadow />
      <mesh geometry={GEO.sphere} material={toon('#9c8ad6', '#6f5fb0', 0.15)} scale={[2.6, 2, 2.6]} position={[1.6, 8.6, 0.6]} castShadow />
      {/* perch stump for Professor Hoot */}
      <mesh geometry={GEO.cylinder} material={toon('#a98a72')} scale={[0.6, 0.9, 0.6]} position={[3.6, 0.45, 4.2]} castShadow />
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} geometry={GEO.sphere} material={lampMaterial('#ffe6f6', '#ff9fd0')} scale={0.14} position={[Math.cos(i * 1.3) * 2.2, 4.2 + (i % 2) * 0.6, Math.sin(i * 1.3) * 2.2]} />
      ))}
    </group>
  )
}

/** Stardust trail: glowing sparkles to follow, one after another. */
function StardustTrail() {
  const progress = useGame((s) => (s.quests.q_f_trail?.state === 'in_progress' && s.quests.q_f_trail.step === 0 ? s.quests.q_f_trail.progress : -1))
  const pts = F.pawTrail
  return (
    <group>
      {pts.map((p, i) => (
        <QuestTarget key={i} id={`paw:${i}`} quest="q_f_trail" step="follow" event="reach:paw" x={p.x} z={p.z} y={H(p) + 0.6} label="" mode="touch" radius={2.2} enabled={i === progress} glow="#fff1b8" bob={0.15}>
          <mesh geometry={GEO.ico} material={toon('#fff6c8', '#ffe58a', 1.2)} scale={0.25} />
          <Sparkles count={18} scale={[1.6, 1.4, 1.6]} size={4} speed={0.6} color="#fff1b8" />
        </QuestTarget>
      ))}
      {progress >= 0 && progress < pts.length && <SparkleLine from={progress === 0 ? F.npcs.clover : pts[progress - 1]} to={pts[progress]} />}
    </group>
  )
}

function SparkleLine({ from, to }: { from: { x: number; z: number }; to: { x: number; z: number } }) {
  const n = Math.max(3, Math.round(Math.hypot(to.x - from.x, to.z - from.z) / 1.6))
  const refs = useRef<(THREE.Mesh | null)[]>([])
  useFrame(() => {
    refs.current.forEach((m, i) => {
      if (m) m.scale.setScalar(0.07 + Math.max(0, Math.sin(runtime.time * 4 - i * 0.6)) * 0.08)
    })
  })
  return (
    <group>
      {Array.from({ length: n }, (_, i) => {
        const k = (i + 0.5) / n
        const x = from.x + (to.x - from.x) * k, z = from.z + (to.z - from.z) * k
        return <mesh key={i} ref={(el) => void (refs.current[i] = el)} geometry={GEO.sphere} material={lampMaterial('#fff6c8', '#ffe58a')} position={[x, H({ x, z }) + 0.25, z]} />
      })}
    </group>
  )
}

function WishLantern() {
  const p = F.photo
  const y = H(p)
  return (
    <group>
      <QuestTarget
        id="forestphoto" quest="q_f_trail" step="photo" event="collect:forestphoto" x={p.x} z={p.z} y={y + 0.9} label="Open the wish-lantern" dialogue="photo_pickup" glow="#ffd6ea"
        idle={<group position={[p.x, y + 0.9, p.z]}><mesh geometry={GEO.sphere} material={toon('#ffd6e6', '#ffb3cf', 0.3)} scale={[0.35, 0.45, 0.35]} /></group>}
        done={<group position={[p.x, y + 0.9, p.z]}><mesh geometry={GEO.sphere} material={lampMaterial('#ffd6e6', '#ffb3cf')} scale={[0.35, 0.45, 0.35]} /></group>}
      >
        <mesh geometry={GEO.sphere} material={toon('#ffd6e6', '#ff9fc4', 1.0)} scale={[0.35, 0.45, 0.35]} />
      </QuestTarget>
      <mesh geometry={GEO.cylinder} material={toon('#a98a72')} scale={[0.05, 0.9, 0.05]} position={[p.x, y + 0.45, p.z]} />
      <Sparkles count={20} scale={[8, 3, 8]} position={[F.clearing.x, y + 1.5, F.clearing.z]} size={3} speed={0.3} color="#ffd6ea" />
    </group>
  )
}

function MushroomGrove() {
  const cluster = (lit: boolean) => (
    <group>
      {[[0, 0, 1], [0.5, 0.3, 0.7], [-0.4, 0.4, 0.6]].map(([x, z, s], i) => (
        <group key={i} position={[x, 0, z]} scale={s * 1.6}>
          <mesh geometry={GEO.cylinder} material={toon('#f4ead8')} scale={[0.12, 0.4, 0.12]} position={[0, 0.2, 0]} />
          <mesh geometry={GEO.sphere} material={lit ? lampMaterial('#ff9fd0', '#ff7fbf') : toon('#a08aa8')} scale={[0.32, 0.2, 0.32]} position={[0, 0.42, 0]} />
        </group>
      ))}
      {lit && <Halo color="#ffb3dd" r={1.3} opacity={0.15} />}
    </group>
  )
  return (
    <group>
      {F.mushrooms.map((m, i) => (
        <QuestTarget
          key={i} id={`mushroom:${i}`} quest="q_f_mushrooms" step="light" event="light:mushroom" x={m.x} z={m.z} y={H(m)} label="Boop the sleepy mushroom" dialogue="mushroom_boop" glow={null}
          idle={<group position={[m.x, H(m), m.z]}>{cluster(false)}</group>}
          done={<group position={[m.x, H(m), m.z]}>{cluster(true)}</group>}
        >
          {cluster(false)}
          <Sparkles count={10} scale={[2, 1.5, 2]} position={[0, 1, 0]} size={3} speed={0.4} color="#ffd6f0" />
        </QuestTarget>
      ))}
    </group>
  )
}

/** The heart constellation: step from star stone to neighbouring star stone all the way round. */
function Constellation() {
  const stars = F.stars
  const n = stars.length
  const active = useGame((s) => s.quests.q_f_stars?.state === 'in_progress')
  const solved = useGame((s) => s.quests.q_f_stars?.state === 'completed')
  const [chain, setChain] = useState<number[]>([])
  const st = useRef({ on: -1, mistakes: 0, chain: [] as number[], flash: 0 })
  const mats = useMemo(() => stars.map(() => new THREE.MeshToonMaterial({ color: '#fff1b8', emissive: '#ffd36e', emissiveIntensity: 0.1 })), [stars])
  const adjacent = (a: number, b: number) => (a - b + n) % n === 1 || (b - a + n) % n === 1

  useFrame((_, dt) => {
    const s = st.current
    const P = runtime.player.pos
    let on = -1
    stars.forEach((p, i) => {
      if (Math.hypot(P.x - p.x, P.z - p.z) < 1.0) on = i
    })
    if (on !== s.on) {
      s.on = on
      if (on >= 0 && active && !game.inputBlocked()) {
        const c = s.chain
        if (c.length === 0) c.push(on)
        else if (c.includes(on)) {
          /* already lit — no penalty */
        } else if (adjacent(c[c.length - 1], on) || (c.length > 1 && adjacent(c[0], on))) {
          if (adjacent(c[c.length - 1], on)) c.push(on)
          else c.unshift(on)
        } else {
          c.length = 0
          s.mistakes++
          s.flash = 0.6
          audio.sfx('wrong')
          if (s.mistakes === 1) say('constellation_wrong')
          else tatan.say('Try the stone right next to the last bright one!', 3)
        }
        if (c.length) audio.sfx('tile', c.length % 4)
        setChain([...c])
        if (c.length === n) {
          audio.sfx('reveal')
          dispatch('solve:constellation')
        }
      }
    }
    s.flash = Math.max(0, s.flash - dt)
    const t = runtime.time
    mats.forEach((m, i) => {
      let e = active ? 0.25 : solved ? 1.2 : 0.08
      if (s.chain.includes(i)) e = 1.3
      if (s.flash > 0) e = 0.2 + Math.sin(s.flash * 30) * 0.2
      // hint: after two misses, the valid next stones pulse
      if (active && s.mistakes >= 2 && s.chain.length && !s.chain.includes(i) && (adjacent(i, s.chain[s.chain.length - 1]) || adjacent(i, s.chain[0]))) e += 0.4 + Math.sin(t * 5) * 0.3
      m.emissiveIntensity = e
    })
  })

  const edge = (a: number, b: number, lit: boolean, key: string) => {
    const A = stars[a], B = stars[b]
    const len = Math.hypot(B.x - A.x, B.z - A.z)
    const y = (H(A) + H(B)) / 2 + 0.35
    return (
      <group key={key} position={[(A.x + B.x) / 2, y, (A.z + B.z) / 2]} rotation={[0, Math.atan2(B.x - A.x, B.z - A.z), 0]}>
        <mesh geometry={GEO.cylinder} material={lit ? lampMaterial('#fff6c8', '#ffe58a') : toon('#d9d2ff', '#b9a5ee', 0.4)} scale={[lit ? 0.07 : 0.025, len, lit ? 0.07 : 0.025]} rotation={[Math.PI / 2, 0, 0]} />
      </group>
    )
  }
  const litEdges = new Set<string>()
  for (let i = 0; i < chain.length - 1; i++) litEdges.add([chain[i], chain[i + 1]].sort().join('-'))
  if (solved) for (let i = 0; i < n; i++) litEdges.add([i, (i + 1) % n].sort().join('-'))
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[F.moonClearing.x, H(F.moonClearing) + 0.03, F.moonClearing.z]}>
        <ringGeometry args={[F.clearingRadius - 0.6, F.clearingRadius - 0.2, 48]} />
        <meshBasicMaterial color="#e6dcff" transparent opacity={0.6} />
      </mesh>
      {stars.map((p, i) => (
        <group key={i} position={[p.x, H(p), p.z]}>
          <mesh geometry={GEO.cylinder} material={toon('#d9d2ea')} scale={[0.95, 0.22, 0.95]} position={[0, 0.11, 0]} receiveShadow />
          <mesh geometry={new THREE.OctahedronGeometry(0.3)} material={mats[i]} position={[0, 0.65, 0]} />
        </group>
      ))}
      {stars.map((_, i) => {
        const j = (i + 1) % n
        const key = [i, j].sort().join('-')
        return (active || solved) ? edge(i, j, litEdges.has(key), key) : null
      })}
      {solved && <Sparkles count={60} scale={[14, 6, 14]} position={[F.moonClearing.x, H(F.moonClearing) + 4, F.moonClearing.z]} size={5} speed={0.3} color="#fff1b8" />}
    </group>
  )
}

/** Moon Altar: two cats on two moon plates wake it, then the fragments are placed. */
function MoonAltar() {
  const a = F.altar
  const y = H(a)
  const plates = F.moonPlates
  const step = useGame((s) => (s.quests.q_f_gate?.state === 'in_progress' ? s.quests.q_f_gate.step : -1))
  const plateMats = useMemo(() => plates.map(() => new THREE.MeshToonMaterial({ color: '#e6e8ff', emissive: '#b9c6ff', emissiveIntensity: 0.1 })), [plates])
  const st = useRef({ asked: false })
  useEffect(() => {
    if (step !== 0) runtime.companion.assist = null
    return () => {
      runtime.companion.assist = null
    }
  }, [step])
  useFrame(() => {
    const P = runtime.player.pos
    const C = runtime.companion
    const onP = plates.map((p) => Math.hypot(P.x - p.x, P.z - p.z) < 1.1)
    const onT = plates.map((p) => C.active && Math.hypot(C.pos.x - p.x, C.pos.z - p.z) < 1.1)
    plateMats.forEach((m, i) => (m.emissiveIntensity = onP[i] || onT[i] || questState('q_f_gate') === 'completed' || step === 1 ? 1.1 : 0.12))
    if (step !== 0 || game.inputBlocked()) return
    const pi = onP.indexOf(true)
    if (pi >= 0) {
      const other = plates[1 - pi]
      C.assist = { x: other.x, z: other.z }
      if (!st.current.asked) {
        st.current.asked = true
        tatan.say(DIALOGUE.moonplate_help[0].text, 3)
      }
      if (onT[1 - pi]) {
        C.assist = null
        audio.sfx('reveal')
        dispatch('press:moonplates')
      }
    }
  })
  const socket = (i: number): THREE.Vector3Tuple => [a.x + (i - 1) * 0.6, y + 1.5 + (i === 1 ? 0.15 : 0), a.z + 0.75]
  return (
    <group>
      {plates.map((p, i) => (
        <mesh key={i} geometry={GEO.cylinder} material={plateMats[i]} scale={[1.0, 0.12, 1.0]} position={[p.x, H(p) + 0.06, p.z]} receiveShadow />
      ))}
      <FragmentCeremony
        quest="q_f_gate" step="place" event="activate:altar" anchor={a} y={y}
        holes={[0, 1, 2].map(socket)}
        standAt={{ x: a.x - 0.4, z: a.z + 3.6, yaw: Math.PI }}
        camA={[a.x + 6, y + 3, a.z + 7]} camB={[a.x - 3, y + 2.2, a.z + 6.5]} camC={[a.x + 2, y + 14, a.z + 22]}
        dialogues={{ locked: 'altar_plates', ready: 'altar_ready', after: 'altar_after' }}
        reveal="bay" vision={false} visionAt={{ x: a.x, z: a.z - 1.5, yaw: 0 }}
      >
        {(lit) => (
          <group>
            <mesh geometry={GEO.cylinder} material={toon('#f2efff')} scale={[1.2, 1.1, 1.0]} position={[a.x, y + 0.55, a.z]} castShadow />
            <mesh geometry={GEO.box} material={toon('#e6e1fb')} scale={[2.4, 0.25, 1.4]} position={[a.x, y + 1.2, a.z]} castShadow />
            <mesh geometry={GEO.sphere} material={toon('#fff6e0', '#e6e8ff', 0.3 + lit * 1.2)} scale={0.5} position={[a.x, y + 2.3, a.z - 0.3]} />
            {[0, 1, 2].map((i) => (
              <StarSocket key={i} position={socket(i)} lit={lit > 0.3 + i * 0.15} scale={0.4} />
            ))}
            {lit > 0.5 && <Sparkles count={40} scale={[4, 4, 4]} position={[a.x, y + 2.5, a.z]} size={5} speed={0.4} color="#e6e8ff" />}
          </group>
        )}
      </FragmentCeremony>
    </group>
  )
}

function GiantMushrooms() {
  return (
    <group>
      {F.giantMushrooms.map((g, i) => {
        const base = H(g)
        const top = base + g.rise
        return (
          <group key={i} position={[g.x, 0, g.z]}>
            <mesh geometry={GEO.cylinder} material={toon('#f4ead8')} scale={[g.r * 0.35, top - base, g.r * 0.35]} position={[0, (top + base) / 2 - 0.1, 0]} castShadow />
            <mesh geometry={GEO.cylinder} material={toon(['#f59bc4', '#9fd8e8', '#c5a9f2'][i], ['#f59bc4', '#9fd8e8', '#c5a9f2'][i], 0.4)} scale={[g.r, 0.3, g.r]} position={[0, top - 0.15, 0]} castShadow receiveShadow />
            {[0, 1, 2, 3].map((k) => (
              <mesh key={k} geometry={GEO.sphere} material={toon('#ffffff')} scale={[0.16, 0.05, 0.16]} position={[Math.cos(k * 1.6) * g.r * 0.6, top + 0.02, Math.sin(k * 1.6) * g.r * 0.6]} />
            ))}
          </group>
        )
      })}
    </group>
  )
}

function PondAndLog() {
  const p = F.pond
  const log = F.hollowLog
  const pad = useMemo(() => new THREE.CircleGeometry(1, 20, 0.4, Math.PI * 2 - 0.5), [])
  return (
    <group>
      {F.lilyPads.map((l, i) => (
        <group key={i} position={[l.x, WATER_LEVEL + 0.06, l.z]} rotation={[-Math.PI / 2, 0, i * 1.7]}>
          <mesh geometry={pad} material={toon('#8fcf9a', '#7fe6c0', 0.25)} scale={l.r} />
        </group>
      ))}
      <Sparkles count={24} scale={[10, 2, 10]} position={[p.x, 1.2, p.z]} size={3} speed={0.25} color="#bfe9ff" />
      <group position={[log.x, H(log), log.z]} rotation={[0, log.yaw, 0]}>
        <mesh geometry={GEO.cylinder} material={toon('#a98a72')} scale={[0.75, 3.8, 0.75]} position={[0, 0.7, 0]} rotation={[0, 0, Math.PI / 2]} castShadow />
        <mesh geometry={GEO.circle} material={toon('#3f3556')} scale={0.55} position={[1.92, 0.7, 0]} rotation={[0, Math.PI / 2, 0]} />
        <mesh geometry={GEO.sphere} material={toon('#9cc4a6')} scale={[1.2, 0.2, 0.6]} position={[0, 1.38, 0]} />
      </group>
    </group>
  )
}

function ForestQuestExtras() {
  return (
    <group>
      <QuestTarget id="lens" quest="q_f_lens" step="find" event="collect:lens" x={F.lens.x} z={F.lens.z} y={H(F.lens) + 0.3} label="Pick up the lens" dialogue="lens_pickup">
        <mesh geometry={GEO.cylinder} material={toon('#d6f0ff', '#bfe9ff', 0.6)} scale={[0.16, 0.04, 0.16]} rotation={[Math.PI / 2, 0, 0]} />
      </QuestTarget>
      {F.fireflies.map((f, i) => (
        <QuestTarget key={i} id={`firefly:${i}`} quest="q_f_fireflies" step="catch" event="collect:firefly" x={f.x} z={f.z} y={H(f) + 1.1} label="" mode="touch" radius={1.5} bob={0.3} glow="#fff1a8">
          <mesh geometry={GEO.sphere} material={lampMaterial('#fff6c8', '#ffe58a')} scale={0.12} />
        </QuestTarget>
      ))}
    </group>
  )
}

function ForestNpcs() {
  const n = F.npcs
  return (
    <>
      <Npc id="hoot" variant="hoot" x={n.hoot.x} z={n.hoot.z} y={H(n.hoot) + 0.9} yaw={0.4} offers={["q_f_mushrooms", "q_f_stars"]} />
      <Npc id="clover" variant="clover" x={n.clover.x} z={n.clover.z} y={H(n.clover)} yaw={-1.2} offers={["q_f_trail", "q_f_fireflies"]} />
      <Npc id="luna" variant="luna" x={n.luna.x} z={n.luna.z} y={H(n.luna)} yaw={-0.5} offers="q_f_lens" optional>
        <group position={[n.luna.x + 1, H(n.luna), n.luna.z - 0.4]}>
          {[-0.3, 0, 0.3].map((x, i) => (
            <mesh key={i} geometry={GEO.cylinder} material={toon('#b98a66')} scale={[0.03, 1.1, 0.03]} position={[x * 0.8, 0.5, i === 1 ? 0.3 : -0.1]} rotation={[i === 1 ? -0.3 : 0.2, 0, x]} />
          ))}
          <mesh geometry={GEO.cylinder} material={toon('#9cc3ea')} scale={[0.12, 0.8, 0.12]} position={[0, 1.15, 0]} rotation={[0.9, 0, 0]} />
        </group>
      </Npc>
      <Npc id="sprout" variant="sprout" x={n.sprout.x} z={n.sprout.z} y={H(n.sprout)} yaw={0.8} />
    </>
  )
}

export function Forest() {
  const world = useMemo(() => forestPhysics(), [])
  const exits = regionRT('forest').exits
  return (
    <group>
      <GroundMesh heightAt={forestHeight} colorAt={forestColor} />
      <WaterSurface heightAt={forestHeight} level={forestTerrain.waterLevel} shallow="#9fd0e8" deep="#6d8fd0" glow={0.6} />
      <Vegetation scatter={forestScatter()} palette={FOREST_PALETTE} />
      <HollowTree />
      <GiantMushrooms />
      <PondAndLog />
      {F.lamps.map((l, i) => (
        <Lamp key={i} x={l.x} z={l.z} y={H(l)} />
      ))}
      <StardustTrail />
      <WishLantern />
      <MushroomGrove />
      <Constellation />
      <MoonAltar />
      <ForestQuestExtras />
      <ForestNpcs />
      <Keepsake id="lantern" x={F.keepsakes.lantern.x} z={F.keepsakes.lantern.z} y={H(F.giantMushrooms[2]) + F.giantMushrooms[2].rise} />
      <Keepsake id="songbook" x={F.keepsakes.songbook.x + 1.2} z={F.keepsakes.songbook.z + 1.4} y={H(F.keepsakes.songbook)} />
      <Keepsake id="moonstone" x={F.keepsakes.moonstone.x} z={F.keepsakes.moonstone.z} y={H(F.keepsakes.moonstone)} />
      <Coins region="forest" world={world} count={13} seed={133} extra={[{ x: 34.4, z: -23.6, y: H(F.giantMushrooms[1]) + F.giantMushrooms[1].rise }]} />
      {exits.map((e) => (
        <ExitGate key={e.id} exit={e} y={H(e)} color="#cdb8f5" />
      ))}
    </group>
  )
}
