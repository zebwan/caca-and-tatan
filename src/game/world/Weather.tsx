/**
 * Ambient particles that follow Caca around: drifting petals (region style +
 * petal showers), gentle rain, and fireflies in the evening and at night.
 */
import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { runtime } from '../state/runtime'
import { audio } from '../systems/audio'

const BOX = 34

function useFollowPoints(count: number, seed: number) {
  return useMemo(() => {
    const pos = new Float32Array(count * 3)
    const s = new Float32Array(count)
    let a = seed
    const r = () => ((a = (a * 16807) % 2147483647) / 2147483647)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (r() - 0.5) * BOX
      pos[i * 3 + 1] = r() * 12
      pos[i * 3 + 2] = (r() - 0.5) * BOX
      s[i] = r()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(s, 1))
    return g
  }, [count, seed])
}

const WRAP = /* glsl */ `
  uniform vec3 uCenter; uniform float uTime;
  vec3 wrapAround(vec3 p) {
    vec3 rel = p - uCenter;
    rel.x = mod(rel.x + ${BOX / 2}.0, ${BOX}.0) - ${BOX / 2}.0;
    rel.z = mod(rel.z + ${BOX / 2}.0, ${BOX}.0) - ${BOX / 2}.0;
    return uCenter + rel;
  }`

/** Falling petals: always a few in petal regions, many during a petal shower. */
export function Petals({ base = 0.35 }: { base?: number }) {
  const geo = useFollowPoints(500, 11)
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uTime: { value: 0 }, uCenter: { value: new THREE.Vector3() }, uAmount: { value: 0 } },
        vertexShader: /* glsl */ `
          attribute float aSeed; uniform float uAmount; varying float vA; varying float vRot;
          ${WRAP}
          void main() {
            float life = fract(uTime * (0.06 + aSeed * 0.05) + aSeed);
            vec3 p = position;
            p.x += uTime * 0.6 + sin(uTime * 0.8 + aSeed * 20.0) * 0.9;
            p.z += cos(uTime * 0.6 + aSeed * 13.0) * 0.7;
            p = wrapAround(p + vec3(0.0, 0.0, 0.0));
            p.y = uCenter.y + 9.0 - life * 11.0;
            vA = smoothstep(0.0, 0.1, life) * (1.0 - smoothstep(0.85, 1.0, life)) * step(aSeed, uAmount);
            vRot = uTime * (1.0 + aSeed * 2.0) + aSeed * 6.28;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = (4.5 + aSeed * 3.0) * (40.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          varying float vA; varying float vRot;
          void main() {
            if (vA < 0.01) discard;
            vec2 c = gl_PointCoord - 0.5;
            float s = sin(vRot), co = cos(vRot);
            c = vec2(c.x * co - c.y * s, c.x * s + c.y * co);
            float d = length(c * vec2(1.0, 1.9));
            if (d > 0.5) discard;
            gl_FragColor = vec4(mix(vec3(1.0, 0.52, 0.66), vec3(1.0, 0.76, 0.84), d * 2.0), vA * 0.95);
            #include <colorspace_fragment>
          }`,
      }),
    [],
  )
  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt
    mat.uniforms.uCenter.value.copy(runtime.player.pos)
    mat.uniforms.uAmount.value = Math.min(1, base * (1 - runtime.env.rain) + runtime.env.petals * 0.9)
  })
  return <points geometry={geo} material={mat} frustumCulled={false} />
}

/** Light pastel rain, only while it is raining. */
export function Rain() {
  const count = 900
  const { geo, mat } = useMemo(() => {
    // each drop is a short vertical line segment
    const pos = new Float32Array(count * 6)
    const seed = new Float32Array(count * 2)
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * BOX, z = (Math.random() - 0.5) * BOX, y = Math.random() * 14
      pos.set([x, y, z, x, y + 0.45, z], i * 6)
      const s = Math.random()
      seed.set([s, s], i * 2)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: { value: 0 }, uCenter: { value: new THREE.Vector3() }, uRain: { value: 0 } },
      vertexShader: /* glsl */ `
        attribute float aSeed; uniform float uRain; varying float vA;
        ${WRAP}
        void main() {
          vec3 p = position;
          float fall = mod(p.y - uTime * (11.0 + aSeed * 4.0), 14.0);
          p.y = uCenter.y - 2.0 + fall;
          p.x += (14.0 - fall) * 0.12;
          p = vec3(wrapAround(vec3(p.x, 0.0, p.z)).x, p.y, wrapAround(vec3(p.x, 0.0, p.z)).z);
          vA = uRain * step(aSeed, uRain);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        varying float vA;
        void main() { if (vA < 0.01) discard; gl_FragColor = vec4(0.85, 0.88, 1.0, 0.45 * vA); }`,
    })
    return { geo: g, mat: m }
  }, [])
  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt
    mat.uniforms.uCenter.value.copy(runtime.player.pos)
    mat.uniforms.uRain.value = runtime.env.rain
    audio.setRain(runtime.env.rain)
  })
  return <lineSegments geometry={geo} material={mat} frustumCulled={false} />
}

/** Warm fireflies around Caca in the evening and at night (always in the forest). */
export function NightFireflies({ base = 0 }: { base?: number }) {
  const geo = useFollowPoints(70, 29)
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uCenter: { value: new THREE.Vector3() }, uAmount: { value: 0 } },
        vertexShader: /* glsl */ `
          attribute float aSeed; uniform float uAmount; varying float vA;
          ${WRAP}
          void main() {
            vec3 p = position;
            p.x += sin(uTime * 0.3 + aSeed * 30.0) * 2.0;
            p.z += cos(uTime * 0.25 + aSeed * 17.0) * 2.0;
            p = wrapAround(p);
            p.y = uCenter.y + 0.4 + mod(position.y, 4.0) + sin(uTime * 0.7 + aSeed * 9.0) * 0.5;
            vA = uAmount * step(aSeed, uAmount) * (0.55 + 0.45 * sin(uTime * (1.5 + aSeed * 2.0) + aSeed * 50.0));
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = 7.0 * (30.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          varying float vA;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            if (d > 0.5 || vA < 0.01) discard;
            gl_FragColor = vec4(vec3(1.0, 0.93, 0.6) * pow(1.0 - d * 2.0, 1.6) * vA, 1.0);
          }`,
      }),
    [],
  )
  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt
    mat.uniforms.uCenter.value.copy(runtime.player.pos)
    const e = runtime.env
    mat.uniforms.uAmount.value = Math.min(1, base + Math.max(e.evening * 0.5, e.night) * (1 - e.rain))
  })
  return <points geometry={geo} material={mat} frustumCulled={false} />
}
