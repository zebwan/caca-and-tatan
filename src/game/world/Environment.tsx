/**
 * Sky, sun/moon, fog, stars, clouds and lighting for the current region,
 * blended every frame with the real-clock time of day and the weather.
 */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { runtime } from '../state/runtime'
import { game } from '../state/store'
import { mulberry32 } from './meadow/scatter'
import type { Atmosphere } from './regionTypes'
import { lampMaterials } from './materials'

const EVENING: Atmosphere = {
  sky: ['#8f86d0', '#f1a9c0', '#ffc995'],
  fog: '#f0c3c8',
  fogNear: 60,
  fogFar: 230,
  sunColor: '#ffc89a',
  sunIntensity: 1.35,
  sunDir: [-0.8, 0.28, 0.3],
  hemiSky: '#ffd9e0',
  hemiGround: '#a3b48f',
  hemiIntensity: 1.05,
  ambient: '#ffd7d0',
  ambientIntensity: 0.25,
}
const NIGHT: Atmosphere = {
  sky: ['#20265a', '#363b82', '#6b64aa'],
  fog: '#55578f',
  fogNear: 50,
  fogFar: 210,
  sunColor: '#bccaff',
  sunIntensity: 0.6,
  sunDir: [0.3, 0.75, -0.45],
  hemiSky: '#8a93d6',
  hemiGround: '#3f4a5e',
  hemiIntensity: 0.85,
  ambient: '#7f86c9',
  ambientIntensity: 0.4,
}
const RAIN_SKY = ['#a9aec9', '#c3c5d8', '#d9d6e3'].map((c) => new THREE.Color(c))

const C = () => new THREE.Color()
/** Reused colour slots for the blended palette. */
const out = {
  sky: [C(), C(), C()],
  fog: C(),
  sun: C(),
  hemiSky: C(),
  hemiGround: C(),
  ambient: C(),
  sunDir: new THREE.Vector3(),
  sunIntensity: 1,
  hemiIntensity: 1,
  ambientIntensity: 0.25,
  fogNear: 70,
  fogFar: 260,
  stars: 0,
}
const tmpA = C(), tmpB = C()
function mixC(target: THREE.Color, a: string, b: string, c: string, ev: number, ni: number) {
  target.set(a)
  tmpA.set(b)
  tmpB.set(c)
  target.lerp(tmpA, ev).lerp(tmpB, ni)
}

/** Resolve the region palette for the current time of day and weather. */
function blend(base: Atmosphere) {
  const e = runtime.env
  const ni = e.night * (base.stars !== undefined && base.stars > 0.5 ? 0.6 : 1)
  const ev = e.evening * (1 - ni)
  for (let i = 0; i < 3; i++) {
    mixC(out.sky[i], base.sky[i], EVENING.sky[i], NIGHT.sky[i], ev, ni)
    out.sky[i].lerp(RAIN_SKY[i], e.rain * 0.55)
  }
  mixC(out.fog, base.fog, EVENING.fog, NIGHT.fog, ev, ni)
  out.fog.lerp(RAIN_SKY[2], e.rain * 0.5)
  mixC(out.sun, base.sunColor, EVENING.sunColor, NIGHT.sunColor, ev, ni)
  mixC(out.hemiSky, base.hemiSky, EVENING.hemiSky, NIGHT.hemiSky, ev, ni)
  mixC(out.hemiGround, base.hemiGround, EVENING.hemiGround, NIGHT.hemiGround, ev, ni)
  mixC(out.ambient, base.ambient, EVENING.ambient, NIGHT.ambient, ev, ni)
  const L = (a: number, b: number, c: number) => (a + (b - a) * ev) * (1 - ni) + c * ni
  out.sunIntensity = L(base.sunIntensity, EVENING.sunIntensity, NIGHT.sunIntensity) * (1 - e.rain * 0.45)
  out.hemiIntensity = L(base.hemiIntensity, EVENING.hemiIntensity, NIGHT.hemiIntensity)
  out.ambientIntensity = L(base.ambientIntensity, EVENING.ambientIntensity, NIGHT.ambientIntensity) + e.rain * 0.1
  out.fogNear = L(base.fogNear, EVENING.fogNear, NIGHT.fogNear) * (1 - e.rain * 0.3)
  out.fogFar = L(base.fogFar, EVENING.fogFar, NIGHT.fogFar) * (1 - e.rain * 0.3)
  const d = new THREE.Vector3(...base.sunDir).lerp(new THREE.Vector3(...EVENING.sunDir), ev).lerp(new THREE.Vector3(...NIGHT.sunDir), ni).normalize()
  out.sunDir.copy(d)
  out.stars = Math.max(base.stars ?? 0, ni) * (1 - e.rain)
}

/** Real-clock time of day + gentle weather cycle → runtime.env (smoothed). */
export function EnvClock() {
  const st = useRef({ next: 40, rainTarget: 0, petalTarget: 0, rainbowTarget: 0 })
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1)
    const e = runtime.env
    const s = game.get()
    const d = new Date()
    const hour = s.settings.clock === 'real' ? d.getHours() + d.getMinutes() / 60 : 13
    e.hour = hour
    // evening 17–20, night 20–5.5, dawn fade 5.5–7
    const ev = hour < 17 ? 0 : hour < 18.5 ? (hour - 17) / 1.5 : hour < 20 ? 1 : hour < 21 ? 1 - (hour - 20) : 0
    const ni = hour >= 20 ? Math.min(1, (hour - 20) / 1.2) : hour < 5.5 ? 1 : hour < 7 ? 1 - (hour - 5.5) / 1.5 : 0
    e.evening += (ev - e.evening) * Math.min(1, dt * 0.5)
    e.night += (ni - e.night) * Math.min(1, dt * 0.5)

    // weather: mostly clear, sometimes petal showers, occasionally light rain then a rainbow
    const w = st.current
    const allow = s.settings.weather && s.phase === 'playing' && s.region !== 'garden'
    w.next -= dt
    if (w.next <= 0) {
      if (!allow) {
        e.weather = 'clear'
        w.next = 30
      } else if (e.weather === 'rain') {
        e.weather = 'rainbow'
        w.next = 45
      } else {
        const r = Math.random()
        e.weather = r < 0.55 ? 'clear' : r < 0.82 ? 'petals' : 'rain'
        w.next = e.weather === 'clear' ? 150 + Math.random() * 120 : e.weather === 'rain' ? 70 + Math.random() * 30 : 80
      }
    }
    if (!allow && e.weather !== 'clear') e.weather = 'clear'
    const k = Math.min(1, dt * 0.35)
    e.rain += ((e.weather === 'rain' ? 1 : 0) - e.rain) * k
    e.petals += ((e.weather === 'petals' ? 1 : 0) - e.petals) * k
    e.rainbow += ((e.weather === 'rainbow' && e.night < 0.5 ? 1 : 0) - e.rainbow) * k * 0.6

    // lanterns glow brighter in the evening and at night
    const glow = 0.35 + Math.max(e.evening, e.night) * 1.4 + e.rain * 0.4
    for (const m of lampMaterials) m.emissiveIntensity = glow
  })
  return null
}

export function Environment({ atmosphere }: { atmosphere: Atmosphere }) {
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const sun = useRef<THREE.DirectionalLight>(null)
  const hemi = useRef<THREE.HemisphereLight>(null)
  const amb = useRef<THREE.AmbientLight>(null)
  const sky = useRef<THREE.Mesh>(null)
  const target = useMemo(() => new THREE.Object3D(), [])
  const skyMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uTop: { value: new THREE.Color() },
          uMid: { value: new THREE.Color() },
          uHorizon: { value: new THREE.Color() },
          uSun: { value: new THREE.Vector3(0, 1, 0) },
          uStars: { value: 0 },
          uTime: { value: 0 },
          uRainbow: { value: 0 },
          uSunGlow: { value: 1 },
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
          uniform float uStars; uniform float uTime; uniform float uRainbow; uniform float uSunGlow;
          varying vec3 vDir;
          float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
          void main() {
            vec3 d = normalize(vDir);
            float h = d.y;
            vec3 col = mix(uHorizon, uMid, smoothstep(-0.02, 0.22, h));
            col = mix(col, uTop, smoothstep(0.2, 0.75, h));
            float s = max(dot(d, normalize(uSun)), 0.0);
            col += vec3(1.0, 0.86, 0.72) * pow(s, 18.0) * 0.35 * uSunGlow + vec3(1.0, 0.95, 0.85) * pow(s, 400.0) * 0.8;
            // stars
            if (uStars > 0.01 && h > 0.05) {
              vec3 cell = floor(d * 140.0);
              float r = hash(cell);
              float tw = 0.6 + 0.4 * sin(uTime * (1.0 + r * 3.0) + r * 40.0);
              float star = step(0.985, r) * tw * smoothstep(0.05, 0.3, h);
              col += vec3(1.0, 0.95, 1.0) * star * uStars;
            }
            // rainbow: a soft arc opposite the sun
            if (uRainbow > 0.01) {
              vec3 anti = normalize(vec3(-uSun.x, 0.0, -uSun.z));
              float ang = acos(clamp(dot(d, anti), -1.0, 1.0));
              float band = (ang - 0.62) / 0.08;
              if (band > 0.0 && band < 1.0 && h > -0.02) {
                vec3 rb = 0.5 + 0.5 * cos(6.2831 * (band * 0.8 + vec3(0.0, 0.33, 0.67)));
                col = mix(col, rb, 0.35 * uRainbow * sin(band * 3.14159) * smoothstep(-0.02, 0.1, h));
              }
            }
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      }),
    [],
  )

  useEffect(() => {
    scene.fog = new THREE.Fog(atmosphere.fog, atmosphere.fogNear, atmosphere.fogFar)
    scene.background = new THREE.Color(atmosphere.fog)
  }, [scene, atmosphere])

  useFrame(() => {
    blend(atmosphere)
    const u = skyMat.uniforms
    u.uTop.value.copy(out.sky[0])
    u.uMid.value.copy(out.sky[1])
    u.uHorizon.value.copy(out.sky[2])
    u.uSun.value.copy(out.sunDir)
    u.uStars.value = out.stars
    u.uTime.value = runtime.time
    u.uRainbow.value = runtime.env.rainbow
    u.uSunGlow.value = 1 - runtime.env.night
    if (sky.current) sky.current.position.copy(camera.position)
    const fog = scene.fog as THREE.Fog | null
    if (fog) {
      fog.color.copy(out.fog)
      fog.near = out.fogNear
      fog.far = out.fogFar
      ;(scene.background as THREE.Color | null)?.copy(out.fog)
    }
    const l = sun.current
    if (l) {
      const p = runtime.player.pos
      l.position.set(p.x + out.sunDir.x * 40, p.y + out.sunDir.y * 40, p.z + out.sunDir.z * 40)
      target.position.copy(p)
      target.updateMatrixWorld()
      l.color.copy(out.sun)
      l.intensity = out.sunIntensity
    }
    if (hemi.current) {
      hemi.current.color.copy(out.hemiSky)
      hemi.current.groundColor.copy(out.hemiGround)
      hemi.current.intensity = out.hemiIntensity
    }
    if (amb.current) {
      amb.current.color.copy(out.ambient)
      amb.current.intensity = out.ambientIntensity
    }
  })

  return (
    <>
      <mesh ref={sky} material={skyMat} renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[480, 32, 16]} />
      </mesh>
      {atmosphere.clouds !== false && <Clouds />}
      {atmosphere.moon && <Moon />}
      <hemisphereLight ref={hemi} args={['#fff1f5', '#b9d7a0', 1.35]} />
      <ambientLight ref={amb} intensity={0.25} color="#fde8ef" />
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

function Moon() {
  const ref = useRef<THREE.Group>(null)
  const camera = useThree((s) => s.camera)
  useFrame(() => {
    if (ref.current) ref.current.position.set(camera.position.x - 120, camera.position.y + 150, camera.position.z - 260)
  })
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[14, 24, 16]} />
        <meshBasicMaterial color="#fff6e0" fog={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[24, 24, 16]} />
        <meshBasicMaterial color="#d8d4ff" transparent opacity={0.18} fog={false} depthWrite={false} />
      </mesh>
    </group>
  )
}

function Clouds() {
  const { geo, mat, matrices } = useMemo(() => {
    const rnd = mulberry32(7)
    const parts: THREE.BufferGeometry[] = []
    const blobs: [number, number, number, number][] = [
      [0, 0, 0, 7], [6.5, -1, 1, 5.2], [-6.5, -1.2, 0.5, 5.5], [2.5, 3, -0.5, 5], [-2.8, 2.2, 1.5, 4.2], [10.5, -2.2, 0, 3.4], [-10.5, -2.4, 0, 3.4],
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
    if (!ref.current) return
    ref.current.rotation.y = runtime.time * 0.004
    const e = runtime.env
    mat.emissiveIntensity = 0.55 * (1 - e.night * 0.85) * (1 - e.rain * 0.4)
    mat.color.setRGB(1 - e.night * 0.55, 1 - e.night * 0.5, 1 - e.night * 0.3)
  })
  return <instancedMesh ref={ref} args={[geo, mat, matrices.length]} frustumCulled={false} />
}
