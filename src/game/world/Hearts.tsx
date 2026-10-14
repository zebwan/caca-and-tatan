/** Little pink hearts that float up (cuddles, nuzzles, the reunion). */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { bus } from '../systems/bus'
import { runtime } from '../state/runtime'

const MAX = 40

export function Hearts() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const pool = useMemo(() => Array.from({ length: MAX }, () => ({ t: 99, x: 0, y: 0, z: 0, vx: 0, vz: 0, s: 1 })), [])
  const next = useRef(0)
  const geo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(0, -0.1)
    s.bezierCurveTo(-0.16, 0, -0.1, 0.13, 0, 0.06)
    s.bezierCurveTo(0.1, 0.13, 0.16, 0, 0, -0.1)
    return new THREE.ShapeGeometry(s)
  }, [])
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ff7fae', transparent: true, depthWrite: false, side: THREE.DoubleSide }), [])
  const tmp = useMemo(() => new THREE.Object3D(), [])
  const col = useMemo(() => new THREE.Color(), [])
  useEffect(
    () =>
      bus.on((e) => {
        if (e.type !== 'hearts') return
        for (let i = 0; i < e.n; i++) {
          const h = pool[next.current++ % MAX]
          h.t = -i * 0.12
          h.x = e.x + (Math.random() - 0.5) * 0.5
          h.y = e.y
          h.z = e.z + (Math.random() - 0.5) * 0.5
          h.vx = (Math.random() - 0.5) * 0.4
          h.vz = (Math.random() - 0.5) * 0.4
          h.s = 0.8 + Math.random() * 0.7
        }
      }),
    [pool],
  )
  useFrame(({ camera }, dt) => {
    const m = ref.current
    if (!m) return
    pool.forEach((h, i) => {
      h.t += dt
      const life = Math.max(0, h.t)
      const a = h.t < 0 || life > 1.6 ? 0 : life < 0.2 ? life / 0.2 : 1 - (life - 0.2) / 1.4
      tmp.position.set(h.x + h.vx * life + Math.sin(life * 5 + i) * 0.08, h.y + life * 0.9, h.z + h.vz * life)
      tmp.quaternion.copy(camera.quaternion)
      tmp.scale.setScalar(a > 0 ? h.s * (0.7 + life * 0.4) : 0.0001)
      tmp.updateMatrix()
      m.setMatrixAt(i, tmp.matrix)
      m.setColorAt(i, col.setRGB(1, 0.5 + 0.3 * Math.sin(i), 0.7).multiplyScalar(Math.max(0, a)))
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    void runtime
  })
  return <instancedMesh ref={ref} args={[geo, mat, MAX]} frustumCulled={false} renderOrder={5} />
}

/** Big leaf umbrella over Caca (and Tatan, when he's close) while it rains. */
export function LeafUmbrella() {
  const ref = useRef<THREE.Group>(null)
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(1, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2.6)
    g.scale(1.1, 0.35, 0.8)
    return g
  }, [])
  useFrame(() => {
    const g = ref.current
    if (!g) return
    const e = runtime.env
    const P = runtime.player.pos
    const C = runtime.companion
    const share = C.active && Math.hypot(C.pos.x - P.x, C.pos.z - P.z) < 2.2
    const cx = share ? (P.x + C.pos.x) / 2 : P.x
    const cz = share ? (P.z + C.pos.z) / 2 : P.z
    g.visible = e.rain > 0.25
    g.position.set(cx, Math.max(P.y, share ? C.pos.y : P.y) + 1.75 + Math.sin(runtime.time * 2) * 0.03, cz)
    g.scale.setScalar((share ? 1.25 : 0.85) * Math.min(1, e.rain * 1.5))
  })
  return (
    <group ref={ref} visible={false}>
      <mesh geometry={geo} castShadow>
        <meshToonMaterial color="#8fcf7a" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 1.2, 6]} />
        <meshToonMaterial color="#6fae5e" />
      </mesh>
    </group>
  )
}
