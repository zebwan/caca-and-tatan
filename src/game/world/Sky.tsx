import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { runtime } from '../state/runtime'
import { mulberry32 } from './meadow/scatter'

export const FOG_COLOR = '#f7dfe7'
export const SUN_DIR = new THREE.Vector3(-0.45, 0.62, 0.38).normalize()

/** Gradient sky dome, soft sun glow and drifting puffy clouds. */
export function Sky() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uTop: { value: new THREE.Color('#8fc2ef') },
          uMid: { value: new THREE.Color('#c8e0f6') },
          uHorizon: { value: new THREE.Color('#fbdde6') },
          uSun: { value: SUN_DIR },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_Position = p.xyww;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uHorizon; uniform vec3 uSun;
          varying vec3 vDir;
          void main() {
            float h = vDir.y;
            vec3 col = mix(uHorizon, uMid, smoothstep(-0.02, 0.22, h));
            col = mix(col, uTop, smoothstep(0.2, 0.75, h));
            float s = max(dot(normalize(vDir), uSun), 0.0);
            col += vec3(1.0, 0.86, 0.72) * pow(s, 18.0) * 0.35 + vec3(1.0, 0.95, 0.85) * pow(s, 400.0) * 0.8;
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      }),
    [],
  )
  const sky = useRef<THREE.Mesh>(null)
  const camera = useThree((s) => s.camera)
  useFrame(() => {
    if (sky.current) sky.current.position.copy(camera.position)
  })

  return (
    <>
      <mesh ref={sky} material={mat} renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[480, 32, 16]} />
      </mesh>
      <Clouds />
    </>
  )
}

function Clouds() {
  const { geo, mat, matrices } = useMemo(() => {
    const rnd = mulberry32(7)
    const parts: THREE.BufferGeometry[] = []
    const blobs: [number, number, number, number][] = [
      [0, 0, 0, 7],
      [6.5, -1, 1, 5.2],
      [-6.5, -1.2, 0.5, 5.5],
      [2.5, 3, -0.5, 5],
      [-2.8, 2.2, 1.5, 4.2],
      [10.5, -2.2, 0, 3.4],
      [-10.5, -2.4, 0, 3.4],
    ]
    for (const [x, y, z, r] of blobs) {
      const s = new THREE.SphereGeometry(r, 14, 10)
      s.translate(x, y, z)
      parts.push(s)
    }
    const g = mergeGeometries(parts)!
    g.scale(1, 0.62, 0.8)
    const m = new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: '#fbe7ee', emissiveIntensity: 0.55, fog: false })
    const list: THREE.Matrix4[] = []
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + rnd() * 0.3
      const r = 170 + rnd() * 120
      const o = new THREE.Object3D()
      o.position.set(Math.cos(a) * r, 55 + rnd() * 45, Math.sin(a) * r)
      o.rotation.y = rnd() * 6.28
      o.scale.setScalar(1 + rnd() * 1.1)
      o.updateMatrix()
      list.push(o.matrix.clone())
    }
    return { geo: g, mat: m, matrices: list }
  }, [])
  const ref = useRef<THREE.InstancedMesh>(null)
  useEffect(() => {
    if (!ref.current) return
    matrices.forEach((m, i) => ref.current!.setMatrixAt(i, m))
    ref.current.instanceMatrix.needsUpdate = true
  }, [matrices])
  useFrame(() => {
    if (ref.current) ref.current.rotation.y = runtime.time * 0.004
  })
  return <instancedMesh ref={ref} args={[geo, mat, matrices.length]} frustumCulled={false} />
}

/** Sun + sky fill. The shadow camera follows Caca so shadows stay crisp near her. */
export function Lights() {
  const sun = useRef<THREE.DirectionalLight>(null)
  const target = useMemo(() => new THREE.Object3D(), [])
  useFrame(() => {
    const l = sun.current
    if (!l) return
    const p = runtime.player.pos
    l.position.set(p.x + SUN_DIR.x * 40, p.y + SUN_DIR.y * 40, p.z + SUN_DIR.z * 40)
    target.position.copy(p)
    target.updateMatrixWorld()
  })
  return (
    <>
      <hemisphereLight args={['#fff1f5', '#b9d7a0', 1.35]} />
      <ambientLight intensity={0.25} color="#fde8ef" />
      <primitive object={target} />
      <directionalLight
        ref={sun}
        target={target}
        color="#fff3e2"
        intensity={1.9}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={26}
        shadow-camera-bottom={-26}
        shadow-camera-near={1}
        shadow-camera-far={100}
      />
    </>
  )
}
