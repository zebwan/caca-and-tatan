import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { buildCat, disposeRig, VARIANTS, type VariantId } from './catBuilder'
import { CatAnimator } from './catAnimation'
import { runtime } from '../state/runtime'
import { dampAngle } from './Player'

/** A small animated NPC cat used for kittens. */
export function MiniCat({ variant, yaw = 0, wander, heightAt, noLook }: { variant: VariantId; yaw?: number; wander?: { x: number; z: number; i: number; r?: number }; heightAt: (x: number, z: number) => number; noLook?: boolean }) {
  const rig = useMemo(() => buildCat(VARIANTS[variant]), [variant])
  const anim = useMemo(() => new CatAnimator(), [])
  const st = useRef({ yaw })
  useEffect(() => () => disposeRig(rig), [rig])
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    let gait = 0
    if (wander) {
      const t = runtime.time * 0.5 + wander.i * 2
      const R = wander.r ?? 1.4
      const x = wander.x + Math.cos(t) * R, z = wander.z + Math.sin(t * 1.3) * R * 0.7
      const nx = wander.x + Math.cos(t + 0.05) * R, nz = wander.z + Math.sin((t + 0.05) * 1.3) * R * 0.7
      rig.root.position.set(x, heightAt(x, z), z)
      st.current.yaw = dampAngle(st.current.yaw, Math.atan2(nx - x, nz - z), 8, dt)
      gait = 0.8
    } else if (!noLook) {
      const P = runtime.player.pos
      const g = rig.root.getWorldPosition(new THREE.Vector3())
      if (Math.hypot(P.x - g.x, P.z - g.z) < 6) st.current.yaw = dampAngle(st.current.yaw, Math.atan2(P.x - g.x, P.z - g.z), 4, dt)
    }
    rig.root.rotation.y = st.current.yaw
    anim.update(rig, { dt, t: runtime.time + (wander?.i ?? 0), gait, grounded: true, vy: 0, idleTime: 0, mood: 'none', moodTime: 0, lookYaw: null, allowRest: false })
  })
  return <primitive object={rig.root} />
}
