/**
 * Reusable quest-object building blocks for every region:
 * collectible/interactive targets, carried companions, moving platforms,
 * exit gates and the "place the fragments" chapter ceremony.
 */
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { runtime } from '../../state/runtime'
import { game, useGame } from '../../state/store'
import { interactions } from '../../systems/interactions'
import { dispatch, questState, questStepId, revealRegion } from '../../systems/quests'
import { say } from '../../systems/dialogue'
import { audio } from '../../systems/audio'
import { bus } from '../../systems/bus'
import { saveGame } from '../../state/save'
import { contains, type Surface } from '../../systems/physics'
import { buildCat, disposeRig, setRigOpacity, VARIANTS } from '../../characters/catBuilder'
import { CatAnimator } from '../../characters/catAnimation'
import { starGeo } from '../../characters/Npc'
import { GEO, toon } from '../materials'
import { exitOpen } from '../../systems/route'
import type { ExitDef } from '../regionTypes'
import type { RegionId } from '../../data/types'
import { travelTo } from '../../flow'
import { isBuilt } from '../regions'

export function markCollected(id: string) {
  const s = game.get()
  if (!s.collected.includes(id)) game.set({ collected: [...s.collected, id] })
}
export const isCollected = (id: string) => game.get().collected.includes(id)
export const stepActive = (quest: string, step: string) => questState(quest) === 'in_progress' && questStepId(quest) === step

/** A soft glowing halo sphere. */
export function Halo({ color = '#fff0c8', r = 0.45, opacity = 0.2 }: { color?: string; r?: number; opacity?: number }) {
  return (
    <mesh geometry={GEO.sphere} scale={r}>
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  )
}

/**
 * One target of a "do this N times" quest step (berries, letters, shells…).
 * Active while its step is in progress and it hasn't been done yet.
 */
export function QuestTarget({
  id, quest, step, event, x, z, y, label, mode = 'interact', radius = 2.3, dialogue, children, idle, done, bob = 0, glow = '#fff0c8', onDone, enabled = true,
}: {
  id: string
  quest: string
  step: string
  event: string
  x: number
  z: number
  y: number
  label: string
  mode?: 'interact' | 'touch'
  radius?: number
  dialogue?: string
  children?: ReactNode
  /** What it looks like before/after its step is active (e.g. a plain bush). */
  idle?: ReactNode
  done?: ReactNode
  bob?: number
  glow?: string | null
  onDone?: () => void
  /** Extra condition (e.g. ordered trails): when false the target shows as idle. */
  enabled?: boolean
}) {
  const have = useGame((s) => s.collected.includes(id))
  const active = useGame((s) => s.quests[quest]?.state === 'in_progress' && questStepIdFrom(s.quests, quest) === step) && enabled
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled
  const ref = useRef<THREE.Group>(null)

  const complete = () => {
    if (isCollected(id)) return
    markCollected(id)
    bus.emit({ type: 'collect', item: id })
    audio.sfx('chime')
    dispatch(event)
    onDone?.()
    saveGame()
  }

  useEffect(() => {
    if (mode !== 'interact') return
    return interactions.register({
      id: `target:${id}`,
      position: new THREE.Vector3(x, y + 0.8, z),
      radius,
      label: () => label,
      enabled: () => !isCollected(id) && stepActive(quest, step) && enabledRef.current,
      onInteract: () => (dialogue ? say(dialogue, complete) : complete()),
    })
  }, [id, x, y, z, radius, label, mode, quest, step, dialogue]) // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(() => {
    if (ref.current && bob) ref.current.position.y = y + Math.sin(runtime.time * 2 + x) * bob
    if (mode !== 'touch' || !active || isCollected(id) || game.inputBlocked()) return
    const P = runtime.player.pos
    if (Math.hypot(P.x - x, P.z - z) < radius && Math.abs(P.y + 0.5 - y) < 2.5) complete()
  })

  if (have) return <>{done ?? null}</>
  if (!active) return <>{idle ?? null}</>
  return (
    <group ref={ref} position={[x, y, z]}>
      {children}
      {glow && <Halo color={glow} r={0.7} opacity={0.18} />}
    </group>
  )
}
function questStepIdFrom(quests: Record<string, { state: string; step: number }>, quest: string) {
  void quests
  return questStepId(quest)
}

/** A companion riding on Caca's back while `when` is true (teddy, kitten…). */
export function CarryOnBack({ when, children, height = 0.78 }: { when: boolean; children: ReactNode; height?: number }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    const g = ref.current
    if (!g) return
    const P = runtime.player
    const back = -0.32
    g.position.set(P.pos.x + Math.sin(P.yaw) * back, P.pos.y + height + Math.abs(Math.sin(runtime.time * 8)) * 0.02 * Math.min(1, P.gait), P.pos.z + Math.cos(P.yaw) * back)
    g.rotation.y = P.yaw
  })
  if (!when) return null
  return <group ref={ref}>{children}</group>
}

/** Moves platform surfaces and carries Caca along when she stands on one. */
export function MovingPlatforms({ surfaces, children }: { surfaces: (Surface & { home: { x: number; z: number }; move: { axis: 'x' | 'z'; amp: number; speed: number } | null; top: number })[]; children: (i: number) => ReactNode }) {
  const refs = useRef<(THREE.Group | null)[]>([])
  useFrame(() => {
    const t = runtime.time
    const P = runtime.player
    surfaces.forEach((s, i) => {
      const bobY = Math.sin(t * 1.3 + i) * 0.04
      if (s.move) {
        const off = Math.sin(t * s.move.speed + i * 1.7) * s.move.amp
        const nx = s.move.axis === 'x' ? s.home.x + off : s.home.x
        const nz = s.move.axis === 'z' ? s.home.z + off : s.home.z
        const dx = nx - s.x, dz = nz - s.z
        if (P.grounded && contains(s, P.pos.x, P.pos.z, 0.08) && Math.abs(P.pos.y - s.top) < 0.15 && !game.get().cutscene) {
          P.pos.x += dx
          P.pos.z += dz
        }
        s.x = nx
        s.z = nz
      }
      const g = refs.current[i]
      if (g) g.position.set(s.x, s.top + bobY, s.z)
    })
  })
  return (
    <group>
      {surfaces.map((s, i) => (
        <group key={i} ref={(el) => void (refs.current[i] = el)} position={[s.x, s.top, s.z]}>
          {children(i)}
        </group>
      ))}
    </group>
  )
}

/** A gate / signpost that travels to another region (locked until its quest is done). */
export function ExitGate({ exit, y, color = '#f7a8c6' }: { exit: ExitDef; y: number; color?: string }) {
  const open = useGame((s) => exitOpen(exit, s.quests))
  const glow = useRef<THREE.Mesh>(null)
  useEffect(
    () =>
      interactions.register({
        id: `exit:${exit.id}`,
        position: new THREE.Vector3(exit.x, y + 1.2, exit.z),
        radius: 3.4,
        label: () => (exitOpen(exit, game.get().quests) ? `Go to ${exit.label}` : `Look at the path to ${exit.label}`),
        enabled: () => true,
        onInteract: () => {
          if (!exitOpen(exit, game.get().quests)) return exit.locked ? say(exit.locked) : undefined
          if (!isBuilt(exit.to)) return say('chapter_coming')
          travelTo(exit.to, exit.entry)
        },
      }),
    [exit, y],
  )
  useFrame(() => {
    if (glow.current) (glow.current.material as THREE.MeshBasicMaterial).opacity = open ? 0.25 + Math.sin(runtime.time * 2) * 0.08 : 0.05
  })
  const yaw = exit.yaw ?? 0
  const wood = toon('#c99a72')
  return (
    <group position={[exit.x, y, exit.z]} rotation={[0, yaw, 0]}>
      {exit.style === 'gate' ? (
        <>
          {[-2.2, 2.2].map((x) => (
            <group key={x} position={[x, 0, 0]}>
              <mesh geometry={GEO.cylinder} material={wood} scale={[0.22, 3.4, 0.22]} position={[0, 1.7, 0]} castShadow />
              <mesh geometry={GEO.sphere} material={toon(color)} scale={0.28} position={[0, 3.5, 0]} />
            </group>
          ))}
          <mesh geometry={GEO.box} material={wood} scale={[5, 0.3, 0.3]} position={[0, 3.25, 0]} castShadow />
          <mesh geometry={GEO.box} material={toon('#fff6ec')} scale={[2.4, 0.6, 0.12]} position={[0, 2.6, 0.1]} />
          {Array.from({ length: 9 }, (_, i) => (
            <mesh key={i} geometry={GEO.sphere} material={toon(['#f7a8c6', '#ffffff', '#ffc59e'][i % 3])} scale={0.13} position={[-2 + i * 0.5, 3.45, 0.18]} />
          ))}
        </>
      ) : (
        <>
          <mesh geometry={GEO.cylinder} material={wood} scale={[0.1, 2.2, 0.1]} position={[0, 1.1, 0]} castShadow />
          <mesh geometry={GEO.box} material={toon(color)} scale={[1.4, 0.4, 0.1]} position={[0, 1.8, 0]} />
        </>
      )}
      <mesh ref={glow} position={[0, 1.6, 0]}>
        <planeGeometry args={[4.2, 3.2]} />
        <meshBasicMaterial color="#ffe6f2" transparent opacity={0.05} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

/**
 * The chapter-ending ceremony shared by every region: Caca places three
 * fragments into a shrine, a vision of Tatan appears, the camera pulls back,
 * then the quest completes and the next region is revealed on the map.
 */
export function FragmentCeremony({
  quest, event, anchor, y, holes, standAt, camA, camB, camC, lookY = 2, dialogues, reveal, children, visionAt, onFinish, vision = true, step,
}: {
  quest: string
  event: string
  anchor: { x: number; z: number }
  y: number
  /** Socket positions (world) the fragments fly into. */
  holes: THREE.Vector3Tuple[]
  standAt: { x: number; z: number; yaw: number }
  camA: THREE.Vector3Tuple
  camB: THREE.Vector3Tuple
  camC: THREE.Vector3Tuple
  lookY?: number
  dialogues: { locked: string; ready: string; after: string }
  reveal?: RegionId
  visionAt: { x: number; z: number; yaw: number }
  children: (lit: number) => ReactNode
  onFinish?: () => void
  /** Show a ghostly vision of Tatan (only while he is still lost). */
  vision?: boolean
  /** Only this step of the quest can start the ceremony. */
  step?: string
}) {
  const done = useGame((s) => s.quests[quest]?.state === 'completed')
  const seq = useRef<{ t: number } | null>(null)
  const flyers = useRef<(THREE.Group | null)[]>([])
  const litRef = useRef(done ? 1 : 0)
  const shrine = useRef<THREE.Group>(null)
  const tatan = useMemo(() => buildCat(VARIANTS.tatan), [])
  const anim = useMemo(() => new CatAnimator(), [])
  const litGroup = useRef<{ setLit?: (v: number) => void }>({})
  useEffect(() => () => disposeRig(tatan), [tatan])
  useEffect(() => {
    tatan.root.visible = false
    setRigOpacity(tatan, 0)
  }, [tatan])

  useEffect(
    () =>
      interactions.register({
        id: `shrine:${quest}`,
        position: new THREE.Vector3(anchor.x, y + 1.3, anchor.z),
        radius: 3.8,
        label: () => (questState(quest) === 'in_progress' ? 'Place the starlight fragments' : 'Look closer'),
        enabled: () => !seq.current,
        onInteract: () => {
          const qs = questState(quest)
          if (qs === 'completed') return say(dialogues.after)
          if (qs !== 'in_progress' || (step && questStepId(quest) !== step)) return say(dialogues.locked)
          say(dialogues.ready, () => {
            seq.current = { t: 0 }
            const P = runtime.player
            P.frozen = true
            P.pos.set(standAt.x, runtime.world!.terrain(standAt.x, standAt.z), standAt.z)
            P.vel.set(0, 0, 0)
            P.yaw = standAt.yaw
            // Tatan stands beside Caca for the moment
            runtime.companion.pos.set(standAt.x + Math.cos(standAt.yaw) * 1.1, P.pos.y, standAt.z - Math.sin(standAt.yaw) * 1.1)
            runtime.companion.yaw = standAt.yaw
            runtime.cutscene.active = true
            game.set({ cutscene: true })
            runtime.cutscene.ease = 1.0
            runtime.cutscene.pos.set(...camA)
            runtime.cutscene.look.set(anchor.x, y + lookY, anchor.z)
            audio.sfx('whoosh')
          })
        },
      }),
    [quest, anchor.x, anchor.z, y], // eslint-disable-line react-hooks/exhaustive-deps
  )

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const s = seq.current
    const t = runtime.time
    const target = done ? 1 : s ? Math.max(0, Math.min(1, (s.t - 2.8) / 1.2)) : 0
    litRef.current = target
    litGroup.current.setLit?.(target)
    if (!s) return
    const prev = s.t
    s.t += dt
    const P = runtime.player
    flyers.current.forEach((g, i) => {
      if (!g) return
      const start = 0.6 + i * 0.25
      const k = Math.max(0, Math.min(1, (s.t - start) / 1.1))
      g.visible = s.t > start && k < 1
      const from = new THREE.Vector3(P.pos.x, P.pos.y + 1.0, P.pos.z)
      const to = new THREE.Vector3(...holes[i])
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
    const vis = !vision ? 0 : s.t < 3.6 ? 0 : s.t < 4.6 ? s.t - 3.6 : s.t < 8.0 ? 1 : Math.max(0, 1 - (s.t - 8.0))
    tatan.root.visible = vis > 0.01
    setRigOpacity(tatan, vis * 0.75)
    tatan.root.position.set(visionAt.x, runtime.world!.terrain(visionAt.x, visionAt.z) + 0.05, visionAt.z)
    tatan.root.rotation.y = visionAt.yaw
    anim.update(tatan, { dt, t, gait: 0, grounded: true, vy: 0, idleTime: 0, mood: s.t > 4.4 && s.t < 6.4 ? 'happy' : 'none', moodTime: s.t - 4.4, lookYaw: null, lookPitch: 0.1, allowRest: false })
    if (prev < 4.4 && s.t >= 4.4) audio.sfx('meow', 470)
    if (prev < 5.0 && s.t >= 5.0) {
      P.mood = 'celebrate'
      P.moodTime = 0
      audio.sfx('meow', 720)
    }
    if (prev < 4.0 && s.t >= 4.0) runtime.cutscene.pos.set(...camB)
    if (prev < 8.2 && s.t >= 8.2) {
      runtime.cutscene.ease = 2.2
      runtime.cutscene.pos.set(...camC)
    }
    if (s.t > 11.2) {
      seq.current = null
      tatan.root.visible = false
      runtime.cutscene.active = false
      game.set({ cutscene: false })
      P.frozen = false
      runtime.camera.targetYaw = runtime.camera.yaw = P.yaw + Math.PI
      if (reveal) revealRegion(reveal)
      dispatch(event)
      onFinish?.()
      setTimeout(() => game.present({ kind: 'chapterEnd' }), 1700)
      saveGame()
    }
  })

  return (
    <group>
      <group ref={shrine}>
        <LitGroup bind={litGroup.current} initial={done ? 1 : 0}>
          {children}
        </LitGroup>
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

/** Re-renders its children only when the lit level crosses thresholds (cheap). */
import { useState } from 'react'
function LitGroup({ bind, initial, children }: { bind: { setLit?: (v: number) => void }; initial: number; children: (lit: number) => ReactNode }) {
  const [lit, setLit] = useState(initial)
  bind.setLit = (v) => {
    const q = Math.round(v * 10) / 10
    if (q !== lit) setLit(q)
  }
  return <>{children(lit)}</>
}

/** Plain star socket, dark until lit. */
export function StarSocket({ position, lit, scale = 0.55 }: { position: THREE.Vector3Tuple; lit: boolean; scale?: number }) {
  return <mesh geometry={starGeo} material={lit ? toon('#fff1b8', '#ffd36e', 1.1) : toon('#7d6a86')} position={position} scale={scale} />
}
