/**
 * Tatan as Caca's companion: follows her everywhere, sits close when she
 * stops, nuzzles, scouts toward the objective, cuddles on request, says the
 * odd line, and catches up (or pops back beside her) if he gets left behind.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { applyOutfit, buildCat, disposeRig, VARIANTS } from './catBuilder'
import { CatAnimator } from './catAnimation'
import { lookKey } from './look'
import { dampAngle } from './Player'
import { runtime } from '../state/runtime'
import { game, useGame } from '../state/store'
import { groundAt, overWater, resolveSolids } from '../systems/physics'
import { input } from '../systems/input'
import { audio } from '../systems/audio'
import { bus } from '../systems/bus'
import { TATAN_ARRIVE, TATAN_LINES } from '../data/companion'

const pick = (a: readonly string[]) => a[Math.floor(Math.random() * a.length)]
const damp = (c: number, t: number, r: number, dt: number) => c + (t - c) * (1 - Math.exp(-r * dt))

/** Things other systems can ask Tatan to do. */
export const tatan = {
  say(text: string, seconds = 3.2) {
    tatanState.bubble = text
    tatanState.bubbleUntil = runtime.time + seconds
  },
  cuddle() {
    tatanState.cuddleAt = runtime.time
  },
  /** Scripted control (cutscenes). */
  scripted: false,
}
const tatanState = { bubble: '', bubbleUntil: 0, cuddleAt: -10 }

export function Companion() {
  const joined = useGame((s) => !!s.flags.tatanJoined)
  const phase = useGame((s) => s.phase)
  const region = useGame((s) => s.region)
  if (!joined || phase === 'create') return null
  return <TatanFollower key={region} />
}

function TatanFollower() {
  const look = useGame((s) => s.looks.tatan)
  const outfit = useGame((s) => s.equippedTatan)
  const key = lookKey(look)
  const rig = useMemo(() => buildCat(VARIANTS.tatan, look), [key]) // eslint-disable-line react-hooks/exhaustive-deps
  const anim = useMemo(() => new CatAnimator(), [])
  const [bubble, setBubble] = useState('')
  const st = useRef({
    vel: new THREE.Vector3(),
    stuckT: 0,
    lastPos: new THREE.Vector3(),
    gait: 0,
    idle: 0,
    nextChat: 8 + Math.random() * 10,
    scoutUntil: 0,
    scoutTarget: new THREE.Vector3(),
    nextScout: 25,
    lastObjDist: Infinity,
    nuzzleT: 0,
    mood: 'none' as 'none' | 'happy' | 'hug',
    moodT: 0,
    visY: 0,
    lastRain: 0,
    lastRainbow: 0,
    shownBubble: '',
    lastHearts: 0,
  })

  useEffect(() => () => disposeRig(rig), [rig])
  useEffect(() => applyOutfit(rig, outfit), [rig, outfit])
  useEffect(() => {
    runtime.companion.active = true
    const line = TATAN_ARRIVE[game.get().region]
    if (line && game.get().flags[`tatanArrived:${game.get().region}`] !== true) {
      game.setFlag(`tatanArrived:${game.get().region}`)
      setTimeout(() => tatan.say(line, 3.5), 1500)
    }
    const off = bus.on((e) => {
      if (e.type === 'questCompleted') {
        st.current.mood = 'happy'
        st.current.moodT = 0
      }
    })
    return () => {
      runtime.companion.active = false
      off()
    }
  }, [])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const s = st.current
    const C = runtime.companion
    const P = runtime.player
    const W = runtime.world
    if (!W) return
    const t = runtime.time
    const gs = game.get()
    const frozen = runtime.cutscene.active || tatan.scripted || gs.phase !== 'playing'

    // cuddle request (C key or HUD button)
    if (input.cuddle) {
      input.cuddle = false
      if (!game.inputBlocked()) tatan.cuddle()
    }
    const cuddling = t - tatanState.cuddleAt < 2.4
    if (cuddling && t - tatanState.cuddleAt < 0.05) {
      tatan.say(pick(TATAN_LINES.cuddle), 2.4)
      audio.sfx('meow', 520)
      P.mood = 'hug'
      P.moodTime = 0
      setTimeout(() => {
        if (runtime.player.mood === 'hug') runtime.player.mood = 'none'
      }, 2300)
    }

    // ── choose where to stand ──
    const fwdX = Math.sin(P.yaw), fwdZ = Math.cos(P.yaw)
    const rightX = Math.cos(P.yaw), rightZ = -Math.sin(P.yaw)
    const playerIdle = P.idleTime
    const target = new THREE.Vector3()
    let wantFace: number | null = null
    let mode: 'follow' | 'beside' | 'cuddle' | 'scout' = 'follow'
    if (cuddling) {
      mode = 'cuddle'
      target.set(P.pos.x + fwdX * 0.85, P.pos.y, P.pos.z + fwdZ * 0.85)
      wantFace = P.yaw + Math.PI
      // Caca turns to face him
    } else if (t < s.scoutUntil) {
      mode = 'scout'
      target.copy(s.scoutTarget)
    } else if (playerIdle > 1.6 && P.grounded) {
      mode = 'beside'
      target.set(P.pos.x + rightX * 0.95 - fwdX * 0.1, P.pos.y, P.pos.z + rightZ * 0.95 - fwdZ * 0.1)
      wantFace = Math.atan2(P.pos.x - target.x, P.pos.z - target.z) * 0.35 + P.yaw * 0.65
    } else {
      target.set(P.pos.x - fwdX * 1.7 + rightX * 0.55, P.pos.y, P.pos.z - fwdZ * 1.7 + rightZ * 0.55)
    }

    // ── scouting: if she seems lost, run ahead toward the objective ──
    const o = runtime.objective
    if (o && !frozen && mode === 'follow') {
      const od = Math.hypot(o.x - P.pos.x, o.z - P.pos.z)
      if (od < s.lastObjDist - 3) {
        s.lastObjDist = od
        s.nextScout = Math.max(s.nextScout, t + 20)
      }
      if (t > s.nextScout && od > 12 && P.gait < 0.2) {
        const k = Math.min(7, od - 3) / od
        s.scoutTarget.set(P.pos.x + (o.x - P.pos.x) * k, 0, P.pos.z + (o.z - P.pos.z) * k)
        if (!overWater(W, s.scoutTarget.x, s.scoutTarget.z)) {
          s.scoutUntil = t + 4.5
          tatan.say(pick(TATAN_LINES.scout), 3)
        }
        s.nextScout = t + 35
        s.lastObjDist = od
      }
    }

    // ── move ──
    const dx = target.x - C.pos.x, dz = target.z - C.pos.z
    const d = Math.hypot(dx, dz)
    const distToP = Math.hypot(P.pos.x - C.pos.x, P.pos.z - C.pos.z)
    let speed = 0
    if (!frozen) {
      if (mode === 'cuddle' || mode === 'beside') speed = d > 0.15 ? Math.min(3.2, d * 3) : 0
      else if (mode === 'scout') speed = d > 0.4 ? 7.5 : 0
      else speed = d > 5 ? 8.8 : d > 0.6 ? Math.min(5, 2 + d * 1.2) : 0
    }
    const vx = d > 0.01 ? (dx / d) * speed : 0
    const vz = d > 0.01 ? (dz / d) * speed : 0
    s.vel.x = damp(s.vel.x, vx, 10, dt)
    s.vel.z = damp(s.vel.z, vz, 10, dt)
    let nx = C.pos.x + s.vel.x * dt, nz = C.pos.z + s.vel.z * dt
    if (overWater(W, nx, nz)) {
      nx = C.pos.x
      nz = C.pos.z
    }
    const r = resolveSolids(W, nx, nz, C.pos.y, 0.45)
    C.pos.x = r.x
    C.pos.z = r.z
    const g = groundAt(W, C.pos.x, C.pos.z, C.pos.y + 0.3)
    C.pos.y = g

    // catch up: too far, stuck, or stranded below/above her
    s.stuckT = speed > 1 && C.pos.distanceTo(s.lastPos) < 0.6 * dt * speed * 0.3 ? s.stuckT + dt : Math.max(0, s.stuckT - dt)
    s.lastPos.copy(C.pos)
    const tooFar = distToP > 15 || Math.abs(P.pos.y - C.pos.y) > 2.6 && distToP > 3 && P.grounded
    if (!frozen && (tooFar || s.stuckT > 1.2) && mode !== 'scout') {
      for (const ang of [Math.PI, Math.PI * 0.75, Math.PI * 1.25, Math.PI / 2, -Math.PI / 2]) {
        const tx = P.pos.x + Math.sin(P.yaw + ang) * 1.5, tz = P.pos.z + Math.cos(P.yaw + ang) * 1.5
        if (overWater(W, tx, tz)) continue
        const rr = resolveSolids(W, tx, tz, P.pos.y, 0.45)
        if (Math.hypot(rr.x - tx, rr.z - tz) > 0.3) continue
        C.pos.set(rr.x, groundAt(W, rr.x, rr.z, P.pos.y + 0.3), rr.z)
        s.vel.set(0, 0, 0)
        s.visY = C.pos.y
        if (Math.random() < 0.5) tatan.say(pick(TATAN_LINES.catchUp), 1.6)
        break
      }
      s.stuckT = 0
    }
    if (mode === 'scout' && s.stuckT > 1.5) s.scoutUntil = 0

    // face movement, or face Caca when beside her
    const hs = Math.hypot(s.vel.x, s.vel.z)
    if (hs > 0.4) C.yaw = dampAngle(C.yaw, Math.atan2(s.vel.x, s.vel.z), 10, dt)
    else if (wantFace !== null) C.yaw = dampAngle(C.yaw, wantFace, 6, dt)
    else if (mode === 'scout') C.yaw = dampAngle(C.yaw, Math.atan2(P.pos.x - C.pos.x, P.pos.z - C.pos.z), 5, dt)
    if (mode === 'cuddle') P.yaw = dampAngle(P.yaw, Math.atan2(C.pos.x - P.pos.x, C.pos.z - P.pos.z), 8, dt)

    // ── personality ──
    s.idle = mode === 'beside' && hs < 0.3 ? s.idle + dt : 0
    const e = runtime.env
    if (!frozen && !game.inputBlocked()) {
      if (e.rain > 0.5 && s.lastRain < 0.5) tatan.say(pick(TATAN_LINES.rain))
      if (e.rainbow > 0.5 && s.lastRainbow < 0.5) tatan.say(pick(TATAN_LINES.rainbow))
      s.nextChat -= dt
      if (s.nextChat <= 0) {
        s.nextChat = 18 + Math.random() * 22
        if (s.idle > 3) tatan.say(pick(e.night > 0.6 ? TATAN_LINES.sleepy : TATAN_LINES.clingy))
        else if (e.night > 0.6 && Math.random() < 0.3) tatan.say(pick(TATAN_LINES.night))
      }
      // nuzzle + hearts every so often while sitting together
      if (s.idle > 4 && t - s.lastHearts > 7) {
        s.lastHearts = t
        s.nuzzleT = 1.2
        bus.emit({ type: 'hearts', x: (C.pos.x + P.pos.x) / 2, y: C.pos.y + 1.3, z: (C.pos.z + P.pos.z) / 2, n: 3 })
      }
    }
    s.lastRain = e.rain
    s.lastRainbow = e.rainbow
    if (cuddling && t - s.lastHearts > 0.8) {
      s.lastHearts = t
      bus.emit({ type: 'hearts', x: (C.pos.x + P.pos.x) / 2, y: C.pos.y + 1.4, z: (C.pos.z + P.pos.z) / 2, n: 4 })
    }
    s.nuzzleT = Math.max(0, s.nuzzleT - dt)
    if (s.mood !== 'none') {
      s.moodT += dt
      if (s.moodT > 1.4) s.mood = 'none'
    }

    // ── visuals ──
    s.visY = Math.abs(s.visY - C.pos.y) > 1.2 ? C.pos.y : damp(s.visY, C.pos.y, 18, dt)
    rig.root.position.set(C.pos.x, s.visY, C.pos.z)
    rig.root.rotation.y = C.yaw
    s.gait = hs < 0.15 ? 0 : hs / 4.6
    const sleepy = e.night > 0.6
    const lookYaw = mode === 'beside' || mode === 'scout' ? Math.atan2(P.pos.x - C.pos.x, P.pos.z - C.pos.z) - C.yaw : null
    anim.update(rig, {
      dt,
      t,
      gait: s.gait,
      grounded: true,
      vy: 0,
      idleTime: mode === 'beside' ? s.idle * (sleepy ? 4 : 1) : 0,
      mood: cuddling ? 'hug' : s.mood,
      moodTime: cuddling ? t - tatanState.cuddleAt : s.moodT,
      lookYaw: lookYaw === null ? null : Math.atan2(Math.sin(lookYaw), Math.cos(lookYaw)),
      lookPitch: s.nuzzleT > 0 ? 0.25 : 0,
      allowRest: mode === 'beside' && !cuddling,
    })

    // speech bubble (React state only when the text changes)
    const text = t < tatanState.bubbleUntil ? tatanState.bubble : ''
    if (text !== s.shownBubble) {
      s.shownBubble = text
      setBubble(text)
    }
  })

  return (
    <group>
      <primitive object={rig.root} />
      <group position={[0, 0, 0]}>
        <BubbleAnchor rig={rig} text={bubble} />
      </group>
    </group>
  )
}

function BubbleAnchor({ rig, text }: { rig: { root: THREE.Group }; text: string }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (ref.current) ref.current.position.set(rig.root.position.x, rig.root.position.y + 2.05, rig.root.position.z)
  })
  return (
    <group ref={ref}>
      {text && (
        <Html center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className="bubble">{text}</div>
        </Html>
      )}
    </group>
  )
}
