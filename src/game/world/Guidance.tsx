/**
 * Objective guidance: keeps runtime.objective in sync with the quest state,
 * shows a floating star beacon over the objective, and lays a trail of
 * glowing paw prints toward it when Caca wanders far away.
 */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { runtime } from '../state/runtime'
import { game, useGame } from '../state/store'
import { currentObjective } from '../systems/quests'
import { starGeo } from '../characters/Npc'
import { toon } from './materials'

export function Guidance({ heightAt }: { heightAt: (x: number, z: number) => number }) {
  const quests = useGame((s) => s.quests)
  useEffect(() => {
    const o = currentObjective(quests)
    runtime.objective = o ? new THREE.Vector3(o.location.x, heightAt(o.location.x, o.location.z), o.location.z) : null
  }, [quests, heightAt])
  return (
    <>
      <Beacon />
      <PawTrail heightAt={heightAt} />
    </>
  )
}

function Beacon() {
  const g = useRef<THREE.Group>(null)
  const pillar = useRef<THREE.Mesh>(null)
  const pillarMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uAlpha: { value: 0.5 } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform float uTime; uniform float uAlpha; varying vec2 vUv;
          void main(){
            float edge = pow(sin(vUv.x * 3.14159), 2.0);
            float fade = (1.0 - vUv.y) * smoothstep(0.0, 0.06, vUv.y);
            float shimmer = 0.75 + 0.25 * sin(vUv.y * 40.0 - uTime * 3.0);
            gl_FragColor = vec4(vec3(1.0, 0.62, 0.8) * edge * fade * shimmer * uAlpha, 1.0);
          }`,
      }),
    [],
  )
  useFrame((_, dt) => {
    const o = runtime.objective
    const gr = g.current
    if (!gr) return
    const s = game.get()
    gr.visible = !!o && s.phase === 'playing' && !runtime.cutscene.active
    if (!o) return
    const P = runtime.player
    const d = Math.hypot(P.pos.x - o.x, P.pos.z - o.z)
    const t = runtime.time
    gr.position.set(o.x, o.y + 3.4 + Math.sin(t * 2) * 0.18, o.z)
    gr.rotation.y = t * 1.2
    const sc = d < 5 ? 0.6 : 1
    gr.scale.setScalar(THREE.MathUtils.lerp(gr.scale.x || 1, sc, Math.min(1, dt * 4)))
    pillarMat.uniforms.uTime.value = t
    pillarMat.uniforms.uAlpha.value = THREE.MathUtils.clamp((d - 6) / 14, 0, 0.55)
    if (pillar.current) pillar.current.visible = d > 6
  })
  return (
    <group ref={g}>
      <mesh geometry={starGeo} material={toon('#ff8fbd', '#ff8fbd', 0.9)} scale={1.25} />
      <mesh scale={0.75}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshBasicMaterial color="#ffc2dc" transparent opacity={0.2} depthWrite={false} />
      </mesh>
      <mesh ref={pillar} material={pillarMat} position={[0, 12, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 30, 16, 1, true]} />
      </mesh>
    </group>
  )
}

const PRINTS = 12

function PawTrail({ heightAt }: { heightAt: (x: number, z: number) => number }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const st = useRef({ timer: 2, t: -10, pts: [] as { x: number; z: number; y: number; yaw: number }[] })
  const geo = useMemo(() => {
    const parts: THREE.BufferGeometry[] = []
    const pad = new THREE.CircleGeometry(0.13, 14)
    pad.scale(1, 0.9, 1)
    parts.push(pad)
    ;[-0.12, -0.04, 0.04, 0.12].forEach((x, i) => {
      const toe = new THREE.CircleGeometry(0.05, 10)
      toe.translate(x, 0.15 + (i === 1 || i === 2 ? 0.04 : 0), 0)
      parts.push(toe)
    })
    const g = mergeGeometries(parts)!
    g.rotateX(-Math.PI / 2)
    return g
  }, [])
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), [])
  const tmp = useMemo(() => new THREE.Object3D(), [])
  const col = useMemo(() => new THREE.Color(), [])

  useEffect(() => {
    const m = ref.current!
    for (let i = 0; i < PRINTS; i++) m.setColorAt(i, col.setRGB(0, 0, 0))
    m.instanceColor!.needsUpdate = true
  }, [col])

  useFrame((_, dt) => {
    const m = ref.current
    if (!m) return
    const s = st.current
    const o = runtime.objective
    const P = runtime.player
    const blocked = game.inputBlocked() || runtime.cutscene.active
    s.timer -= dt
    if (o && !blocked && s.timer <= 0) {
      const d = Math.hypot(o.x - P.pos.x, o.z - P.pos.z)
      s.timer = 5
      if (d > 15) {
        const dx = (o.x - P.pos.x) / d, dz = (o.z - P.pos.z) / d
        const yaw = Math.atan2(dx, dz)
        s.pts = []
        for (let i = 0; i < PRINTS; i++) {
          const along = 2.2 + i * 0.85
          const side = (i % 2 ? 1 : -1) * 0.18
          const x = P.pos.x + dx * along + dz * side
          const z = P.pos.z + dz * along - dx * side
          s.pts.push({ x, z, y: heightAt(x, z) + 0.04, yaw })
        }
        s.t = 0
      }
    }
    s.t += dt
    for (let i = 0; i < PRINTS; i++) {
      const p = s.pts[i]
      if (!p) continue
      const appear = i * 0.12
      const life = s.t - appear
      const a = life < 0 ? 0 : life < 0.3 ? life / 0.3 : Math.max(0, 1 - (life - 1.6) / 1.2)
      tmp.position.set(p.x, p.y, p.z)
      tmp.rotation.set(0, p.yaw + Math.PI, 0)
      tmp.updateMatrix()
      m.setMatrixAt(i, tmp.matrix)
      m.setColorAt(i, col.setRGB(1, 0.55, 0.78).multiplyScalar(a * 0.9))
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })

  return <instancedMesh ref={ref} args={[geo, mat, PRINTS]} frustumCulled={false} renderOrder={2} />
}
