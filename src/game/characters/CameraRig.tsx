/**
 * Third-person follow camera: behind and slightly above Caca, mouse orbit,
 * smoothed motion, terrain/building avoidance, gentle auto-align while
 * walking, plus a cutscene/attract override.
 */
import { useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { runtime } from '../state/runtime'
import { game } from '../state/store'
import { input } from '../systems/input'
import { cameraBlock } from '../systems/physics'
import { dampAngle } from './Player'

const damp = (cur: number, target: number, rate: number, dt: number) => cur + (target - cur) * (1 - Math.exp(-rate * dt))

export function CameraRig() {
  const camera = useThree((s) => s.camera)
  const st = useMemo(
    () => ({
      target: new THREE.Vector3(),
      look: new THREE.Vector3(),
      pos: new THREE.Vector3(0, 30, 60),
      dist: 6.6,
      init: false,
      attractA: 0,
    }),
    [],
  )

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const P = runtime.player
    const C = runtime.camera
    const W = runtime.world
    const s = game.get()
    const settings = s.settings

    // look input (consumed every frame so nothing accumulates behind menus)
    const dx = input.lookDX, dy = input.lookDY
    input.lookDX = input.lookDY = 0
    const canLook = s.phase === 'playing' && !s.menu && !runtime.cutscene.active
    if (canLook && (dx || dy)) {
      const k = settings.sensitivity
      C.targetYaw -= dx * 0.0023 * k
      C.targetPitch += dy * 0.0019 * k * (settings.invertY ? -1 : 1)
      C.targetPitch = Math.max(-0.08, Math.min(1.1, C.targetPitch))
      C.lastLook = runtime.time
    }

    // gentle auto-align behind Caca while she walks and the mouse is idle
    if (canLook && runtime.time - C.lastLook > 2.5 && P.gait > 0.3 && !s.queue.length) {
      const behind = P.yaw + Math.PI
      let d = behind - C.targetYaw
      d = Math.atan2(Math.sin(d), Math.cos(d))
      if (Math.abs(d) < 1.9) C.targetYaw += d * Math.min(1, dt * 0.45 * Math.min(P.gait, 1.5))
    }

    C.yaw = dampAngle(C.yaw, C.targetYaw, 12, dt)
    C.pitch = damp(C.pitch, C.targetPitch, 12, dt)
    C.dist = damp(C.dist, C.targetDist, 6, dt)

    // ── cutscene / title attract ──
    if (s.phase === 'title') {
      st.attractA += dt * 0.035
      const a = st.attractA
      st.pos.set(Math.sin(a) * 44, 17 + Math.sin(a * 0.7) * 3, Math.cos(a) * 44)
      camera.position.copy(st.pos)
      st.look.set(0, 3, 0)
      camera.lookAt(st.look)
      st.init = false
      return
    }
    if (runtime.cutscene.active) {
      const rate = runtime.cutscene.ease <= 0 ? 1000 : 1 / runtime.cutscene.ease
      st.pos.x = damp(st.pos.x, runtime.cutscene.pos.x, rate * 2.2, dt)
      st.pos.y = damp(st.pos.y, runtime.cutscene.pos.y, rate * 2.2, dt)
      st.pos.z = damp(st.pos.z, runtime.cutscene.pos.z, rate * 2.2, dt)
      st.look.x = damp(st.look.x, runtime.cutscene.look.x, rate * 2.6, dt)
      st.look.y = damp(st.look.y, runtime.cutscene.look.y, rate * 2.6, dt)
      st.look.z = damp(st.look.z, runtime.cutscene.look.z, rate * 2.6, dt)
      camera.position.copy(st.pos)
      camera.lookAt(st.look)
      st.init = true
      return
    }

    // ── follow ──
    const ty = P.pos.y + 1.0
    if (!st.init) {
      st.target.set(P.pos.x, ty, P.pos.z)
      st.dist = C.dist
    }
    st.target.x = damp(st.target.x, P.pos.x, 14, dt)
    st.target.z = damp(st.target.z, P.pos.z, 14, dt)
    st.target.y = damp(st.target.y, ty, P.grounded ? 9 : 3.5, dt)

    const cp = Math.cos(C.pitch), sp = Math.sin(C.pitch)
    const ox = Math.sin(C.yaw) * cp, oy = sp, oz = Math.cos(C.yaw) * cp
    let want = C.dist
    if (W) {
      const f = cameraBlock(W, st.target.x, st.target.y, st.target.z, st.target.x + ox * C.dist, st.target.y + oy * C.dist + 0.3, st.target.z + oz * C.dist)
      want = Math.max(1.6, C.dist * f)
    }
    st.dist = want < st.dist ? damp(st.dist, want, 20, dt) : damp(st.dist, want, 3, dt)
    st.pos.set(st.target.x + ox * st.dist, st.target.y + oy * st.dist + 0.3, st.target.z + oz * st.dist)
    if (W) st.pos.y = Math.max(st.pos.y, W.terrain(st.pos.x, st.pos.z) + 0.45)
    if (!st.init) {
      st.look.copy(st.target)
      st.init = true
    }
    st.look.set(st.target.x, st.target.y + 0.25, st.target.z)
    camera.position.copy(st.pos)
    camera.lookAt(st.look)
  })

  return null
}
