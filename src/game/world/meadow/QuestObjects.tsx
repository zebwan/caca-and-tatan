/**
 * Stateful quest objects in the meadow: Tatan's note, the teddy on the swing,
 * starlight butterflies, keepsakes, the Heartbeat Puzzle and the Starlight Arch.
 */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { MEADOW, type TileSymbol } from './layout'
import { terrainHeight } from './terrain'
import { GEO, toon } from '../materials'
import { runtime } from '../../state/runtime'
import { game, useGame } from '../../state/store'
import { interactions } from '../../systems/interactions'
import { collectKeepsake, dispatch, questState, questStepId, revealRegion } from '../../systems/quests'
import { say } from '../../systems/dialogue'
import { audio } from '../../systems/audio'
import { bus } from '../../systems/bus'
import { saveGame } from '../../state/save'
import { KEEPSAKES } from '../../data/items'
import { starGeo } from '../../characters/Npc'
import { buildCat, disposeRig, setRigOpacity, VARIANTS } from '../../characters/catBuilder'
import { CatAnimator } from '../../characters/catAnimation'

const H = (p: { x: number; z: number }) => terrainHeight(p.x, p.z)

function useCollected(id: string) {
  return useGame((s) => s.collected.includes(id))
}
function markCollected(id: string) {
  const s = game.get()
  if (!s.collected.includes(id)) game.set({ collected: [...s.collected, id] })
}

// ─────────────────────────────────────────────────────────────────────────────
// Tatan's note on its little post
// ─────────────────────────────────────────────────────────────────────────────
function NotePost() {
  const p = MEADOW.notePost
  const y = H(p)
  const read = useGame((s) => s.quests.q_note?.state === 'completed')
  const env = useRef<THREE.Group>(null)
  useEffect(
    () =>
      interactions.register({
        id: 'note_start',
        position: new THREE.Vector3(p.x, y + 1.2, p.z),
        radius: 2.4,
        label: () => "Read Tatan's note",
        enabled: () => questState('q_note') === 'in_progress',
        onInteract: () => {
          audio.sfx('note')
          dispatch('read:note_start')
        },
      }),
    [p.x, p.z, y],
  )
  useFrame(() => {
    if (env.current) {
      env.current.position.y = 1.32 + Math.sin(runtime.time * 2) * 0.06
      env.current.rotation.y = Math.sin(runtime.time * 0.9) * 0.3
    }
  })
  return (
    <group position={[p.x, y, p.z]}>
      <mesh geometry={GEO.cylinder} material={toon('#c99a72')} scale={[0.09, 1.1, 0.09]} position={[0, 0.55, 0]} castShadow />
      <mesh geometry={GEO.box} material={toon('#dcae86')} scale={[0.5, 0.38, 0.06]} position={[0, 1.0, 0.08]} castShadow />
      <mesh geometry={GEO.sphere} material={toon('#f27aa6')} scale={0.06} position={[0, 1.05, 0.12]} />
      {!read && (
        <group ref={env} position={[0, 1.32, 0.12]}>
          <mesh geometry={GEO.box} material={toon('#fff8ef', '#ffe6ef', 0.6)} scale={[0.36, 0.24, 0.03]} />
          <mesh geometry={GEO.cone} material={toon('#ffe9f0')} scale={[0.26, 0.14, 0.02]} position={[0, 0.05, 0.02]} rotation={[0, 0, Math.PI]} />
          <mesh geometry={GEO.sphere} material={toon('#f27aa6', '#f27aa6', 0.5)} scale={0.045} position={[0, 0.0, 0.03]} />
          <mesh geometry={GEO.sphere} scale={0.5}>
            <meshBasicMaterial color="#ffd3e4" transparent opacity={0.22} depthWrite={false} />
          </mesh>
        </group>
      )}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Mr. Buttons the teddy, the swing, and carrying him back to Mimi
// ─────────────────────────────────────────────────────────────────────────────
export function Teddy({ scale = 1 }: { scale?: number }) {
  const fur = toon('#e6b48f')
  const light = toon('#f6dcc4')
  return (
    <group scale={scale}>
      <mesh geometry={GEO.sphere} material={fur} scale={[0.17, 0.18, 0.15]} position={[0, 0.17, 0]} castShadow />
      <mesh geometry={GEO.sphere} material={light} scale={[0.1, 0.11, 0.06]} position={[0, 0.16, 0.11]} />
      <mesh geometry={GEO.sphere} material={fur} scale={0.14} position={[0, 0.42, 0]} castShadow />
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <mesh geometry={GEO.sphere} material={fur} scale={0.055} position={[sx * 0.1, 0.54, -0.01]} />
          <mesh geometry={GEO.sphere} material={fur} scale={[0.05, 0.08, 0.05]} position={[sx * 0.17, 0.2, 0.04]} rotation={[0, 0, sx * 0.6]} />
          <mesh geometry={GEO.sphere} material={fur} scale={[0.06, 0.05, 0.08]} position={[sx * 0.09, 0.03, 0.06]} />
          <mesh geometry={GEO.sphere} material={toon('#3a2a3f')} scale={0.018} position={[sx * 0.05, 0.45, 0.125]} />
        </group>
      ))}
      <mesh geometry={GEO.sphere} material={light} scale={[0.06, 0.045, 0.04]} position={[0, 0.39, 0.12]} />
      <mesh geometry={GEO.sphere} material={toon('#f27aa6')} scale={[0.028, 0.02, 0.02]} position={[0, 0.405, 0.155]} />
      <mesh geometry={new THREE.TorusGeometry(0.06, 0.02, 6, 12)} material={toon('#9cc3ea')} position={[0, 0.3, 0.06]} rotation={[1.3, 0, 0]} />
    </group>
  )
}

function SwingAndTeddy() {
  const tree = MEADOW.swingTree
  const seat = MEADOW.teddy
  const ground = H(seat)
  const branchY = H(tree) + 3.35
  const swing = useRef<THREE.Group>(null)
  const collected = useCollected('teddy')
  const qs = useGame((s) => s.quests.q_teddy)
  const ropeLen = branchY - (ground + 0.7)

  useEffect(
    () =>
      interactions.register({
        id: 'teddy',
        position: new THREE.Vector3(seat.x, ground + 0.8, seat.z),
        radius: 2.4,
        label: () => (questStepId('q_teddy') === 'find' && questState('q_teddy') === 'in_progress' ? 'Pick up Mr. Buttons' : 'Look at the teddy'),
        enabled: () => !game.get().collected.includes('teddy'),
        onInteract: () => {
          if (questState('q_teddy') === 'in_progress' && questStepId('q_teddy') === 'find') {
            say('teddy_found', () => {
              markCollected('teddy')
              bus.emit({ type: 'collect', item: 'teddy' })
              audio.sfx('chime')
              dispatch('collect:teddy')
            })
          } else say('teddy_early')
        },
      }),
    [seat.x, seat.z, ground],
  )

  useFrame(() => {
    if (swing.current) swing.current.rotation.x = Math.sin(runtime.time * 1.3) * 0.08
  })

  const branchLen = Math.hypot(seat.x - tree.x, seat.z - tree.z) + 0.4
  const branchYaw = Math.atan2(seat.x - tree.x, seat.z - tree.z)
  return (
    <group>
      {/* sturdy branch out from the trunk */}
      <group position={[(tree.x + seat.x) / 2, branchY, (tree.z + seat.z) / 2]} rotation={[0, branchYaw, 0]}>
        <mesh geometry={GEO.cylinder} material={toon('#b58a72')} scale={[0.13, branchLen, 0.13]} rotation={[Math.PI / 2, 0, 0]} castShadow />
      </group>
      <group ref={swing} position={[seat.x, branchY, seat.z]} rotation={[0, branchYaw + Math.PI / 2, 0]}>
        {[-0.45, 0.45].map((x) => (
          <mesh key={x} geometry={GEO.cylinder} material={toon('#f3e3c4')} scale={[0.025, ropeLen, 0.025]} position={[x, -ropeLen / 2, 0]} />
        ))}
        <mesh geometry={GEO.box} material={toon('#f392b4')} scale={[1.1, 0.08, 0.42]} position={[0, -ropeLen, 0]} castShadow />
        {!collected && (
          <group position={[0, -ropeLen + 0.04, 0]} rotation={[0, Math.PI / 2, 0]}>
            <Teddy />
          </group>
        )}
      </group>
      {qs && <TeddyCarry />}
    </group>
  )
}

/** Mr. Buttons rides on Caca's back until he is home. */
function TeddyCarry() {
  const ref = useRef<THREE.Group>(null)
  const carrying = useGame((s) => s.quests.q_teddy?.state === 'in_progress' && s.collected.includes('teddy'))
  useFrame(() => {
    const g = ref.current
    if (!g) return
    const P = runtime.player
    const back = -0.32
    g.position.set(P.pos.x + Math.sin(P.yaw) * back, P.pos.y + 0.78 + Math.abs(Math.sin(runtime.time * 8)) * 0.02 * Math.min(1, P.gait), P.pos.z + Math.cos(P.yaw) * back)
    g.rotation.y = P.yaw
  })
  if (!carrying) return null
  return (
    <group ref={ref}>
      <Teddy scale={0.7} />
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Butterflies (5 glowing quest butterflies + ambient ones)
// ─────────────────────────────────────────────────────────────────────────────
const wingGeo = (() => {
  const g = new THREE.CircleGeometry(1, 14)
  g.scale(0.16, 0.12, 1)
  g.translate(0.15, 0.03, 0)
  return g
})()
const wingGeo2 = (() => {
  const g = new THREE.CircleGeometry(1, 12)
  g.scale(0.11, 0.08, 1)
  g.translate(0.1, -0.08, 0)
  return g
})()

function ButterflyMesh({ color, glow }: { color: string; glow?: boolean }) {
  const wing = useMemo(
    () => new THREE.MeshToonMaterial({ color, side: THREE.DoubleSide, emissive: glow ? color : '#000000', emissiveIntensity: glow ? 0.9 : 0 }),
    [color, glow],
  )
  return (
    <group>
      <mesh geometry={GEO.sphere} material={toon('#6d5560')} scale={[0.025, 0.025, 0.11]} />
      {[-1, 1].map((sx) => (
        <group key={sx} name={sx < 0 ? 'wl' : 'wr'} scale={[sx, 1, 1]}>
          <mesh geometry={wingGeo} material={wing} rotation={[-Math.PI / 2, 0, 0]} />
          <mesh geometry={wingGeo2} material={wing} rotation={[-Math.PI / 2, 0, 0]} />
        </group>
      ))}
      {glow && (
        <mesh geometry={GEO.sphere} scale={0.45}>
          <meshBasicMaterial color={color} transparent opacity={0.22} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

function flap(g: THREE.Object3D, t: number, speed = 14) {
  const a = Math.sin(t * speed) * 0.9 + 0.2
  const wl = g.getObjectByName('wl'), wr = g.getObjectByName('wr')
  if (wl) wl.rotation.z = -a
  if (wr) wr.rotation.z = -a
}

function QuestButterflies() {
  const active = useGame((s) => s.quests.q_butterflies?.state === 'in_progress')
  const collected = useGame((s) => s.collected)
  const refs = useRef<(THREE.Group | null)[]>([])
  const anim = useRef<{ t: number; from: THREE.Vector3 }[]>([])
  const homes = MEADOW.butterflies
  const colors = ['#ffd36e', '#ff9fc6', '#c8b4ff', '#9fe0ff', '#ffb98a']

  useFrame((_, dt) => {
    const P = runtime.player
    homes.forEach((h, i) => {
      const g = refs.current[i]
      if (!g) return
      const id = `butterfly:${i}`
      const a = anim.current[i]
      const t = runtime.time
      if (a) {
        // spiral into Caca
        a.t += dt / 0.7
        const k = Math.min(1, a.t)
        const target = new THREE.Vector3(P.pos.x, P.pos.y + 0.9, P.pos.z)
        g.position.lerpVectors(a.from, target, k * k)
        g.position.y += Math.sin(k * Math.PI) * 0.8
        g.scale.setScalar(1 - k * 0.8)
        g.rotation.y += dt * 12
        if (k >= 1) g.visible = false
        flap(g, t, 26)
        return
      }
      if (game.get().collected.includes(id)) {
        g.visible = false
        return
      }
      const ang = t * (0.45 + i * 0.05) + i * 1.7
      const x = h.x + Math.cos(ang) * 1.4
      const z = h.z + Math.sin(ang * 1.3) * 1.1
      const y = terrainHeight(x, z) + 1.15 + Math.sin(t * 1.7 + i) * 0.25
      g.position.set(x, y, z)
      g.rotation.y = -ang + Math.PI / 2
      g.visible = true
      flap(g, t + i)
      if (!game.inputBlocked() && Math.hypot(P.pos.x - x, P.pos.z - z) < 1.6 && Math.abs(P.pos.y + 0.6 - y) < 2.4) {
        anim.current[i] = { t: 0, from: g.position.clone() }
        markCollected(id)
        bus.emit({ type: 'collect', item: 'butterfly' })
        audio.sfx('chime')
        audio.sfx('sparkle')
        dispatch('collect:butterfly')
      }
    })
  })

  if (!active && !homes.some((_, i) => anim.current[i])) return null
  return (
    <group>
      {homes.map((_, i) =>
        collected.includes(`butterfly:${i}`) && !anim.current[i] ? null : (
          <group key={i} ref={(el) => void (refs.current[i] = el)}>
            <group scale={1.6}>
              <ButterflyMesh color={colors[i]} glow />
            </group>
          </group>
        ),
      )}
    </group>
  )
}

function AmbientButterflies() {
  const refs = useRef<(THREE.Group | null)[]>([])
  const spots = useMemo(() => {
    const out: { x: number; z: number; c: string; s: number }[] = []
    const cols = ['#ffffff', '#ffd1e3', '#fff1b8', '#d9cbff', '#bfe6ff']
    const anchors = [MEADOW.fieldCenter, { x: -2, z: 26 }, { x: -12, z: -20 }, { x: 14, z: -4 }, { x: -20, z: 10 }, { x: 22, z: 34 }]
    anchors.forEach((a, k) => {
      for (let i = 0; i < 3; i++) out.push({ x: a.x + (i - 1) * 2.5, z: a.z + ((k + i) % 3) - 1, c: cols[(k + i) % cols.length], s: 0.4 + k * 0.13 + i * 0.07 })
    })
    return out
  }, [])
  useFrame(() => {
    const t = runtime.time
    spots.forEach((s, i) => {
      const g = refs.current[i]
      if (!g) return
      const a = t * s.s + i
      const x = s.x + Math.sin(a) * 3 + Math.sin(a * 2.3) * 0.8
      const z = s.z + Math.cos(a * 0.8) * 3
      g.position.set(x, terrainHeight(x, z) + 0.8 + Math.sin(t * 2 + i) * 0.35, z)
      g.rotation.y = Math.atan2(Math.cos(a) * 3, -Math.sin(a * 0.8) * 2.4)
      flap(g, t + i * 0.7, 16)
    })
  })
  return (
    <group>
      {spots.map((s, i) => (
        <group key={i} ref={(el) => void (refs.current[i] = el)}>
          <ButterflyMesh color={s.c} />
        </group>
      ))}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Keepsakes (optional, hidden)
// ─────────────────────────────────────────────────────────────────────────────
function KeepsakeModel({ id }: { id: string }) {
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
  return <mesh geometry={starGeo} material={toon('#fff2d6', '#ffe6b0', 0.5)} scale={0.9} />
}

function Keepsake({ id, x, z, y }: { id: string; x: number; z: number; y: number }) {
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

function Keepsakes() {
  const k = MEADOW.keepsakes
  const rock = MEADOW.rockSteps[2]
  const stump = k.paperStar
  const stumpY = H(stump)
  return (
    <group>
      <Keepsake id="photo" x={k.photo.x} z={k.photo.z} y={H(rock) + rock.rise} />
      <Keepsake id="pressedFlower" x={k.pressedFlower.x} z={k.pressedFlower.z} y={H(k.pressedFlower)} />
      {/* hollow stump behind the cottage */}
      <group position={[stump.x, stumpY, stump.z]}>
        <mesh geometry={GEO.cylinder} material={toon('#c49a7c')} scale={[0.55, 0.55, 0.55]} position={[0, 0.27, 0]} castShadow />
        <mesh geometry={GEO.cylinder} material={toon('#e8cfb4')} scale={[0.45, 0.02, 0.45]} position={[0, 0.555, 0]} />
        <mesh geometry={GEO.sphere} material={toon('#a8d08d')} scale={[0.22, 0.1, 0.2]} position={[0.35, 0.5, 0.15]} />
      </group>
      <Keepsake id="paperStar" x={stump.x} z={stump.z} y={stumpY + 0.45} />
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Heartbeat Puzzle
// ─────────────────────────────────────────────────────────────────────────────
function symbolGeo(sym: TileSymbol) {
  const s = new THREE.Shape()
  if (sym === 'heart') {
    s.moveTo(0, -0.42)
    s.bezierCurveTo(-0.6, 0.0, -0.4, 0.5, 0, 0.22)
    s.bezierCurveTo(0.4, 0.5, 0.6, 0.0, 0, -0.42)
  } else if (sym === 'star') {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2
      const r = i % 2 === 0 ? 0.45 : 0.2
      if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r)
      else s.lineTo(Math.cos(a) * r, Math.sin(a) * r)
    }
  } else if (sym === 'moon') {
    s.absarc(0, 0, 0.42, Math.PI * 0.3, Math.PI * 1.7, false)
    s.absarc(0.2, 0, 0.32, Math.PI * 1.55, Math.PI * 0.45, true)
  } else {
    for (let i = 0; i <= 60; i++) {
      const a = (i / 60) * Math.PI * 2
      const r = 0.22 + 0.2 * Math.abs(Math.cos(a * 2.5))
      if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r)
      else s.lineTo(Math.cos(a) * r, Math.sin(a) * r)
    }
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: false })
  g.rotateX(-Math.PI / 2)
  return g
}

function HeartPuzzle() {
  const tiles = MEADOW.tiles
  const center = MEADOW.circle
  const cy = H(center)
  const solved = useGame((s) => s.quests.q_heartbeat?.state === 'completed')
  const mats = useMemo(
    () => tiles.map((t) => new THREE.MeshToonMaterial({ color: t.color, emissive: t.color, emissiveIntensity: 0.05 })),
    [tiles],
  )
  const geos = useMemo(() => tiles.map((t) => symbolGeo(t.id)), [tiles])
  const lantern = useMemo(() => new THREE.MeshToonMaterial({ color: '#ffd6e6', emissive: '#f77fae', emissiveIntensity: 0.3 }), [])
  const pulse = useRef<THREE.Mesh>(null)
  const st = useRef({
    mode: 'idle' as 'idle' | 'demo' | 'solved',
    demoT: 0,
    input: 0,
    mistakes: 0,
    flash: [0, 0, 0, 0],
    lit: [false, false, false, false],
    wrongT: 0,
    onTile: -1,
    solvedT: 0,
  })

  const order = MEADOW.heartbeat.map((sym) => tiles.findIndex((t) => t.id === sym))

  useEffect(
    () =>
      interactions.register({
        id: 'lantern',
        position: new THREE.Vector3(center.x, cy + 1.2, center.z),
        radius: 2.6,
        label: () => (questState('q_heartbeat') === 'in_progress' ? 'Watch the heartbeat' : 'Look at the lantern'),
        enabled: () => st.current.mode !== 'demo',
        onInteract: () => {
          const qs = questState('q_heartbeat')
          if (qs === 'completed') return say('lantern_solved')
          if (qs !== 'in_progress') return say('lantern_locked')
          const s = st.current
          s.mode = 'demo'
          s.demoT = 0
          s.input = 0
          s.lit = [false, false, false, false]
          game.setFlag('watchedHeartbeat')
          // overhead view of the stones while the lantern plays
          runtime.cutscene.active = true
          runtime.cutscene.ease = 0.8
          runtime.cutscene.pos.set(center.x + 1.5, cy + 11, center.z + 9.5)
          runtime.cutscene.look.set(center.x, cy, center.z - 0.5)
          game.set({ cutscene: true })
        },
      }),
    [center.x, center.z, cy],
  )

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const s = st.current
    const P = runtime.player
    const active = questState('q_heartbeat') === 'in_progress'
    if (solved) s.mode = 'solved'

    // demo: the lantern plays the heartbeat on the stones
    if (s.mode === 'demo') {
      const prev = s.demoT
      s.demoT += dt
      order.forEach((ti, k) => {
        const at = 0.7 + k * 0.95
        if (prev < at && s.demoT >= at) {
          s.flash[ti] = 0.75
          audio.sfx('tile', ti)
        }
      })
      if (pulse.current) {
        const k = Math.floor((s.demoT - 0.25) / 0.95)
        const local = ((s.demoT - 0.25) % 0.95) / 0.45
        if (k >= 0 && k < order.length && local <= 1) {
          const tt = tiles[order[k]]
          pulse.current.visible = true
          pulse.current.position.set(center.x + (tt.x - center.x) * local, cy + 1.3 - local * 1.0 + Math.sin(local * Math.PI) * 0.6, center.z + (tt.z - center.z) * local)
        } else pulse.current.visible = false
      }
      if (s.demoT > 0.7 + order.length * 0.95 + 0.3) {
        s.mode = 'idle'
        runtime.cutscene.active = false
        game.set({ cutscene: false })
        if (pulse.current) pulse.current.visible = false
      }
    }

    // stepping on stones
    let on = -1
    tiles.forEach((t, i) => {
      if (Math.hypot(P.pos.x - t.x, P.pos.z - t.z) < MEADOW.tileRadius - 0.1 && P.grounded) on = i
    })
    if (on !== s.onTile) {
      s.onTile = on
      if (on >= 0 && active && s.mode === 'idle') {
        if (order[s.input] === on) {
          s.lit[on] = true
          s.flash[on] = 0.5
          audio.sfx('tile', on)
          s.input++
          if (s.input >= order.length) {
            s.mode = 'solved'
            s.solvedT = 0
            audio.sfx('reveal')
            dispatch('solve:heartbeat')
          }
        } else if (!s.lit[on]) {
          s.input = 0
          s.lit = [false, false, false, false]
          s.wrongT = 0.6
          s.mistakes++
          audio.sfx('wrong')
          if (s.mistakes === 1) say('puzzle_wrong')
        }
      } else if (on >= 0 && !active && !solved) {
        audio.sfx('tile', on)
        s.flash[on] = 0.3
      }
    }

    // visuals
    const beat = (Math.max(0, Math.sin(runtime.time * 5.2)) ** 8 + Math.max(0, Math.sin(runtime.time * 5.2 - 0.9)) ** 8 * 0.6)
    s.solvedT += dt
    tiles.forEach((_, i) => {
      s.flash[i] = Math.max(0, s.flash[i] - dt)
      let e = active ? 0.12 : 0.04
      if (s.lit[i]) e = 0.7
      e += s.flash[i] * 1.6
      if (s.wrongT > 0) e = 0.2 + Math.sin(s.wrongT * 30) * 0.15
      if (s.mode === 'solved') e = 0.65 + beat * 0.5
      // gentle hint after two misses: the next stone breathes
      if (active && s.mode === 'idle' && s.mistakes >= 2 && order[s.input] === i) e += 0.25 + Math.sin(runtime.time * 4) * 0.2
      mats[i].emissiveIntensity = e
      if (s.wrongT > 0) mats[i].emissive.set('#b9a5ee')
      else mats[i].emissive.set(tiles[i].color)
    })
    s.wrongT = Math.max(0, s.wrongT - dt)
    lantern.emissiveIntensity = (active || s.mode === 'solved' ? 0.35 : 0.15) + beat * (active || s.mode === 'solved' ? 0.9 : 0.25)
  })

  return (
    <group>
      {tiles.map((t, i) => {
        const y = H(t)
        return (
          <group key={t.id} position={[t.x, y, t.z]}>
            <mesh geometry={GEO.cylinder} material={mats[i]} scale={[MEADOW.tileRadius, 0.16, MEADOW.tileRadius]} position={[0, 0.03, 0]} receiveShadow />
            <mesh geometry={GEO.cylinder} material={toon('#efe6dc')} scale={[MEADOW.tileRadius + 0.12, 0.1, MEADOW.tileRadius + 0.12]} position={[0, -0.01, 0]} receiveShadow />
            <mesh geometry={geos[i]} material={toon('#ffffff', '#ffffff', 0.4)} position={[0, 0.12, 0]} scale={1.3} />
          </group>
        )
      })}
      {/* the lantern */}
      <group position={[center.x, cy, center.z]}>
        <mesh geometry={GEO.cylinder} material={toon('#e9e0d6')} scale={[0.45, 0.9, 0.45]} position={[0, 0.45, 0]} castShadow />
        <mesh geometry={GEO.cylinder} material={toon('#d9cfc3')} scale={[0.6, 0.12, 0.6]} position={[0, 0.06, 0]} />
        <mesh geometry={GEO.sphere} material={lantern} scale={[0.36, 0.42, 0.36]} position={[0, 1.3, 0]} />
        <mesh geometry={GEO.cone} material={toon('#f392b4')} scale={[0.42, 0.3, 0.42]} position={[0, 1.85, 0]} castShadow />
        <mesh geometry={symbolGeo('heart')} material={toon('#f27aa6', '#f27aa6', 0.6)} position={[0, 2.25, 0]} rotation={[Math.PI / 2, 0, 0]} scale={0.5} />
      </group>
      <mesh ref={pulse} geometry={GEO.sphere} scale={0.18} visible={false}>
        <meshBasicMaterial color="#ff9fc6" />
      </mesh>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Starlight Arch + chapter-ending moment
// ─────────────────────────────────────────────────────────────────────────────
function StarlightArch() {
  const a = MEADOW.arch
  const y = H(a)
  const done = useGame((s) => s.quests.q_arch?.state === 'completed')
  const glow = useMemo(() => new THREE.MeshToonMaterial({ color: '#fff0f5', emissive: '#ff9fc6', emissiveIntensity: 0.05 }), [])
  const starMats = useMemo(() => [0, 1, 2].map(() => new THREE.MeshToonMaterial({ color: '#7d6a86', emissive: '#ffd36e', emissiveIntensity: 0 })), [])
  const flyers = useRef<(THREE.Group | null)[]>([])
  const portal = useRef<THREE.Mesh>(null)
  const seq = useRef<{ t: number } | null>(null)
  const tatan = useMemo(() => buildCat(VARIANTS.tatan), [])
  const tatanAnim = useMemo(() => new CatAnimator(), [])
  const archTorus = useMemo(() => new THREE.TorusGeometry(2.35, 0.3, 10, 32, Math.PI), [])
  const holes = [-0.55, 0, 0.55].map((dx, i) => ({ x: dx, y: 2.35 + 0.32 + (i === 1 ? 0.12 : 0) }))

  useEffect(() => () => disposeRig(tatan), [tatan])
  useEffect(() => {
    tatan.root.visible = false
    setRigOpacity(tatan, 0)
  }, [tatan])

  useEffect(
    () =>
      interactions.register({
        id: 'arch',
        position: new THREE.Vector3(a.x, y + 1.5, a.z + 0.5),
        radius: 3.6,
        label: () => (questState('q_arch') === 'in_progress' ? 'Place the starlight fragments' : 'Look at the arch'),
        enabled: () => !seq.current,
        onInteract: () => {
          const qs = questState('q_arch')
          if (qs === 'completed') return say('arch_after')
          if (qs !== 'in_progress') return say('arch_locked')
          say('arch_ready', () => {
            seq.current = { t: 0 }
            const P = runtime.player
            P.frozen = true
            P.pos.set(a.x, terrainHeight(a.x, a.z + 4.2), a.z + 4.2)
            P.vel.set(0, 0, 0)
            P.yaw = Math.PI
            runtime.cutscene.active = true
            game.set({ cutscene: true })
            runtime.cutscene.ease = 1.0
            runtime.cutscene.pos.set(a.x + 6.8, y + 2.8, a.z + 10.5)
            runtime.cutscene.look.set(a.x, y + 2.0, a.z)
            audio.sfx('whoosh')
          })
        },
      }),
    [a.x, a.z, y],
  )

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const s = seq.current
    const t = runtime.time
    const lit = done || (s && s.t > 3.0)
    glow.emissiveIntensity = lit ? 0.55 + Math.sin(t * 2) * 0.1 : 0.05
    starMats.forEach((m, i) => {
      const on = done || (s && s.t > 1.9 + i * 0.25)
      m.emissiveIntensity = on ? 1.1 : 0
      m.color.set(on ? '#fff1b8' : '#7d6a86')
    })
    if (portal.current) {
      const mat = portal.current.material as THREE.MeshBasicMaterial
      const target = lit ? 0.32 + Math.sin(t * 1.5) * 0.06 : 0
      mat.opacity += (target - mat.opacity) * Math.min(1, dt * 2)
      portal.current.visible = mat.opacity > 0.01
    }

    if (!s) return
    const prev = s.t
    s.t += dt
    const P = runtime.player
    // fragments fly from Caca to the arch
    flyers.current.forEach((g, i) => {
      if (!g) return
      const start = 0.6 + i * 0.25
      const k = Math.max(0, Math.min(1, (s.t - start) / 1.1))
      g.visible = s.t > start && k < 1
      const from = new THREE.Vector3(P.pos.x, P.pos.y + 1.0, P.pos.z)
      const to = new THREE.Vector3(a.x + holes[i].x, y + holes[i].y, a.z + 0.25)
      g.position.lerpVectors(from, to, k)
      g.position.y += Math.sin(k * Math.PI) * 1.4
      g.rotation.y = t * 6
    })
    if (prev < 0.6 && s.t >= 0.6) audio.sfx('fragment')
    if (prev < 3.0 && s.t >= 3.0) {
      audio.sfx('reveal')
      P.mood = 'happy'
      P.moodTime = 0
    }
    // a vision of Tatan in the arch
    const vis = s.t < 3.6 ? 0 : s.t < 4.6 ? (s.t - 3.6) : s.t < 8.0 ? 1 : Math.max(0, 1 - (s.t - 8.0))
    tatan.root.visible = vis > 0.01
    setRigOpacity(tatan, vis * 0.75)
    tatan.root.position.set(a.x, y + 0.05, a.z - 0.6)
    tatan.root.rotation.y = 0
    tatanAnim.update(tatan, { dt, t, gait: 0, grounded: true, vy: 0, idleTime: 0, mood: s.t > 4.4 && s.t < 6.4 ? 'happy' : 'none', moodTime: s.t - 4.4, lookYaw: null, lookPitch: 0.1, allowRest: false })
    if (prev < 4.4 && s.t >= 4.4) audio.sfx('meow', 470)
    if (prev < 5.0 && s.t >= 5.0) {
      P.mood = 'celebrate'
      P.moodTime = 0
      audio.sfx('meow', 720)
    }
    if (prev < 4.0 && s.t >= 4.0) {
      runtime.cutscene.pos.set(a.x - 2.8, y + 2.2, a.z + 9.4)
      runtime.cutscene.look.set(a.x, y + 1.2, a.z)
    }
    if (prev < 8.2 && s.t >= 8.2) {
      runtime.cutscene.ease = 2.2
      runtime.cutscene.pos.set(a.x + 4, y + 16, a.z + 26)
      runtime.cutscene.look.set(a.x, y + 1, a.z - 8)
    }
    if (s.t > 11.2) {
      seq.current = null
      tatan.root.visible = false
      runtime.cutscene.active = false
      game.set({ cutscene: false })
      P.frozen = false
      runtime.camera.targetYaw = runtime.camera.yaw = 0
      revealRegion('village')
      game.setFlag('chapter1')
      dispatch('activate:arch')
      setTimeout(() => game.present({ kind: 'chapterEnd' }), 1700)
      saveGame()
    }
  })

  const stone = toon('#f6ede4')
  return (
    <group>
      <group position={[a.x, y, a.z]}>
        {[-2.35, 2.35].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh geometry={GEO.cylinder} material={stone} scale={[0.5, 0.4, 0.5]} position={[0, 0.2, 0]} castShadow />
            <mesh geometry={GEO.cylinder} material={stone} scale={[0.38, 2.4, 0.38]} position={[0, 1.4, 0]} castShadow />
            <mesh geometry={GEO.cylinder} material={stone} scale={[0.48, 0.2, 0.48]} position={[0, 2.6, 0]} castShadow />
          </group>
        ))}
        <mesh geometry={archTorus} material={glow} position={[0, 2.35, 0]} castShadow />
        {/* flower garland along the arch */}
        {Array.from({ length: 13 }, (_, i) => {
          const ang = (i / 12) * Math.PI
          const col = ['#f7a8c6', '#ffffff', '#ffc59e', '#dcc8ff'][i % 4]
          return <mesh key={i} geometry={GEO.sphere} material={toon(col, col, 0.15)} scale={0.17} position={[Math.cos(ang) * 2.35, 2.35 + Math.sin(ang) * 2.35, 0.26]} />
        })}
        {holes.map((h, i) => (
          <mesh key={i} geometry={starGeo} material={starMats[i]} position={[h.x, h.y, 0.2]} scale={0.55} />
        ))}
        <mesh ref={portal} position={[0, 2.0, 0]} visible={false}>
          <circleGeometry args={[2.05, 32]} />
          <meshBasicMaterial color="#ffd6ea" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {[0, 1, 2].map((i) => (
        <group key={i} ref={(el) => void (flyers.current[i] = el)} visible={false}>
          <mesh geometry={starGeo} material={toon('#ffe58a', '#ffd36e', 1)} scale={0.7} />
        </group>
      ))}
      <primitive object={tatan.root} />
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export function MeadowQuestObjects() {
  return (
    <group>
      <NotePost />
      <SwingAndTeddy />
      <QuestButterflies />
      <AmbientButterflies />
      <Keepsakes />
      <HeartPuzzle />
      <StarlightArch />
    </group>
  )
}
