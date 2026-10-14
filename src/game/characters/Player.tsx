import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { applyOutfit, buildCat, disposeRig, VARIANTS } from './catBuilder'
import { lookKey } from './look'
import { CatAnimator } from './catAnimation'
import { runtime } from '../state/runtime'
import { game, useGame } from '../state/store'
import { input, moveVector } from '../systems/input'
import { groundAt, nearestPlatform, overWater, resolveSolids } from '../systems/physics'
import { audio } from '../systems/audio'
import { bus } from '../systems/bus'
import { exploration } from '../systems/exploration'
import { WATER_LEVEL, waterDist } from '../world/meadow/terrain'

const WALK = 4.6
const RUN = 8.2
const JUMP = 9.6
const GRAVITY = 26
const COYOTE = 0.13
const JUMP_BUFFER = 0.16

const damp = (cur: number, target: number, rate: number, dt: number) => cur + (target - cur) * (1 - Math.exp(-rate * dt))
export function dampAngle(cur: number, target: number, rate: number, dt: number) {
  let d = target - cur
  d = Math.atan2(Math.sin(d), Math.cos(d))
  return cur + d * (1 - Math.exp(-rate * dt))
}

export function Player() {
  const look = useGame((s) => s.looks.caca)
  const lk = lookKey(look)
  const rig = useMemo(() => buildCat(VARIANTS.caca, look), [lk]) // eslint-disable-line react-hooks/exhaustive-deps
  const anim = useMemo(() => new CatAnimator(), [])
  const st = useRef({ coyote: 0, safeTimer: 0, stepCooldown: 0, visY: 0, exploreTimer: 0, waterTimer: 0, splashCooldown: 0 })
  const equipped = useGame((s) => s.equipped)

  useEffect(() => () => disposeRig(rig), [rig])
  useEffect(() => applyOutfit(rig, equipped), [equipped, rig])

  useEffect(
    () =>
      bus.on((e) => {
        const P = runtime.player
        if (e.type === 'collect' || e.type === 'keepsake') {
          P.mood = 'happy'
          P.moodTime = 0
          audio.sfx('meow', 760)
        }
        if (e.type === 'questCompleted' && e.id !== 'q_note') {
          P.mood = 'celebrate'
          P.moodTime = 0
        }
      }),
    [],
  )

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const P = runtime.player
    const W = runtime.world
    const s = st.current
    if (!W) return
    const phase = game.get().phase
    const blocked = game.inputBlocked() || P.frozen || runtime.cutscene.active

    // ── movement intent (camera-relative) ──
    const mv = blocked ? { x: 0, z: 0, run: false } : moveVector()
    const cy = runtime.camera.yaw
    const fx = -Math.sin(cy), fz = -Math.cos(cy)
    const rx = Math.cos(cy), rz = -Math.sin(cy)
    const wx = fx * mv.z + rx * mv.x
    const wz = fz * mv.z + rz * mv.x
    const mag = Math.min(1, Math.hypot(mv.x, mv.z))
    const speed = (mv.run ? RUN : WALK) * mag
    const len = Math.hypot(wx, wz) || 1
    const accel = P.grounded ? 14 : 8
    P.vel.x = damp(P.vel.x, (wx / len) * speed, accel, dt)
    P.vel.z = damp(P.vel.z, (wz / len) * speed, accel, dt)
    if (mag > 0.08) P.yaw = dampAngle(P.yaw, Math.atan2(wx, wz), 11, dt)

    // ── jump with coyote time + input buffer ──
    s.coyote = P.grounded ? COYOTE : s.coyote - dt
    if (!blocked && runtime.time - input.jumpAt < JUMP_BUFFER && s.coyote > 0) {
      P.vel.y = JUMP
      P.grounded = false
      // a jump always carries Caca forward in the direction she's pushing
      if (mag > 0.1) {
        const sp = Math.max(Math.hypot(P.vel.x, P.vel.z), WALK * mag)
        P.vel.x = (wx / len) * sp
        P.vel.z = (wz / len) * sp
      }
      s.coyote = 0
      input.jumpAt = -1
      audio.sfx('jump')
      game.setFlag('jumped')
    }
    if (blocked) input.jumpAt = -1

    // ── horizontal integration, water edges, obstacles ──
    const ox = P.pos.x, oz = P.pos.z
    let nx = P.pos.x + P.vel.x * dt
    let nz = P.pos.z + P.vel.z * dt
    // Water edges stop Caca while walking, but keep her run-up so she can jump across
    if (P.grounded && overWater(W, nx, nz)) {
      if (!overWater(W, nx, P.pos.z)) nz = P.pos.z
      else if (!overWater(W, P.pos.x, nz)) nx = P.pos.x
      else {
        nx = P.pos.x
        nz = P.pos.z
      }
    }
    const r = resolveSolids(W, nx, nz, P.pos.y)
    P.pos.x = r.x
    P.pos.z = r.z

    // ── vertical ──
    const prevY = P.pos.y
    if (!P.grounded) P.vel.y -= GRAVITY * dt
    P.pos.y += P.vel.y * dt
    const g = groundAt(W, P.pos.x, P.pos.z, Math.max(prevY, P.pos.y))
    const wasGrounded = P.grounded
    if (P.pos.y <= g) {
      if (!wasGrounded && P.vel.y < -4) audio.sfx('land')
      P.pos.y = g
      P.vel.y = 0
      P.grounded = true
    } else if (wasGrounded && P.vel.y <= 0 && P.pos.y - g < 0.6) {
      P.pos.y = g
      P.vel.y = 0
    } else {
      P.grounded = false
    }

    // ── landing assist: falling toward water next to a stepping stone? drift onto it ──
    if (!P.grounded && P.vel.y < 0 && (overWater(W, P.pos.x, P.pos.z) || groundAt(W, P.pos.x, P.pos.z, P.pos.y) < P.pos.y - 4)) {
      const near = nearestPlatform(W, P.pos.x, P.pos.z, 1.6)
      if (near && near.top <= P.pos.y + 0.2) {
        const k = Math.min(1, dt * 9)
        P.pos.x += (near.x - P.pos.x) * k
        P.pos.z += (near.z - P.pos.z) * k
        P.vel.x *= 1 - k * 0.6
        P.vel.z *= 1 - k * 0.6
      }
    }

    // ── gentle safety nets: water landing, falling out of the world ──
    s.splashCooldown -= dt
    if (P.pos.y < WATER_LEVEL - 0.12 && overWater(W, P.pos.x, P.pos.z)) {
      if (s.splashCooldown <= 0) {
        audio.sfx('splash')
        bus.emit({ type: 'splash' })
        s.splashCooldown = 0.8
      }
      P.pos.copy(P.lastSafe)
      P.vel.set(0, 0, 0)
      P.grounded = true
    }
    if (P.pos.y < -20) {
      P.pos.copy(P.lastSafe)
      P.vel.set(0, 0, 0)
      game.toast('Whoops! A friendly breeze carried you back.', 'heart')
    }
    s.safeTimer -= dt
    if (s.safeTimer <= 0 && P.grounded && !overWater(W, P.pos.x, P.pos.z) && waterDist(P.pos.x, P.pos.z) > 1.2) {
      P.lastSafe.copy(P.pos)
      s.safeTimer = 0.35
    }

    // ── bookkeeping ──
    // animate from how far she actually moved (not the wished-for speed at a water edge)
    const hs = P.grounded ? Math.hypot(P.pos.x - ox, P.pos.z - oz) / Math.max(dt, 1e-4) : Math.hypot(P.vel.x, P.vel.z)
    P.gait = hs < 0.3 ? 0 : hs / WALK
    if (mag > 0.05 || !P.grounded || blocked) P.idleTime = 0
    else P.idleTime += dt
    if (P.mood !== 'none') {
      P.moodTime += dt
      const dur = P.mood === 'happy' ? 0.9 : P.mood === 'celebrate' ? 1.9 : Infinity
      if (P.moodTime > dur) P.mood = 'none'
    }
    s.exploreTimer -= dt
    if (s.exploreTimer <= 0 && phase === 'playing') {
      exploration.reveal(P.pos.x, P.pos.z, 17)
      s.exploreTimer = 0.25
    }
    s.waterTimer -= dt
    if (s.waterTimer <= 0) {
      audio.setWater(Math.max(0, 1 - Math.max(0, waterDist(P.pos.x, P.pos.z)) / 9))
      s.waterTimer = 0.5
    }

    // ── visuals ──
    s.visY = Math.abs(s.visY - P.pos.y) > 1.2 ? P.pos.y : damp(s.visY, P.pos.y, P.grounded ? 22 : 60, dt)
    rig.root.position.set(P.pos.x, s.visY, P.pos.z)
    rig.root.rotation.y = P.yaw

    let lookYaw: number | null = null
    let lookPitch = 0
    if (P.look) {
      const dx = P.look.x - P.pos.x, dz = P.look.z - P.pos.z
      let a = Math.atan2(dx, dz) - P.yaw
      a = Math.atan2(Math.sin(a), Math.cos(a))
      if (Math.abs(a) < 1.9) lookYaw = a
      lookPitch = Math.max(-0.4, Math.min(0.3, -(P.look.y - P.pos.y - 0.9) / Math.max(1, Math.hypot(dx, dz))))
    }
    const footstep = anim.update(rig, {
      dt,
      t: runtime.time,
      gait: P.gait,
      grounded: P.grounded,
      vy: P.vel.y,
      idleTime: P.idleTime,
      mood: P.mood,
      moodTime: P.moodTime,
      lookYaw,
      lookPitch,
      forceSleep: P.sleepingIntro,
      allowRest: phase === 'playing',
    })
    s.stepCooldown -= dt
    if (footstep && P.grounded && s.stepCooldown <= 0) {
      audio.sfx('step')
      s.stepCooldown = 0.16
    }
  })

  return <primitive object={rig.root} />
}

