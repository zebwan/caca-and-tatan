/** Restrained ambient particles: drifting cherry petals and a few fireflies/sparkles. */
import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { meadowScatter } from './meadow/scatter'
import { MEADOW } from './meadow/layout'
import { terrainHeight } from './meadow/terrain'

export function Petals() {
  const { geo, mat } = useMemo(() => {
    const cherries = meadowScatter().trees.filter((t) => t.kind === 'cherry' && t.collide)
    const N = 420
    const pos = new Float32Array(N * 3)
    const seed = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      const t = cherries[i % cherries.length]
      const a = Math.random() * Math.PI * 2, r = Math.random() * 3.2 * t.s
      pos[i * 3] = t.x + Math.cos(a) * r
      pos[i * 3 + 1] = t.y + 3.4 * t.s
      pos[i * 3 + 2] = t.z + Math.sin(a) * r
      seed[i] = Math.random()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: { value: 0 }, uScale: { value: 1 } },
      vertexShader: /* glsl */ `
        attribute float aSeed; uniform float uTime; varying float vA; varying float vRot;
        void main() {
          float life = fract(uTime * (0.07 + aSeed * 0.05) + aSeed);
          vec3 p = position;
          p.y -= life * 4.2;
          p.x += sin(uTime * 0.8 + aSeed * 20.0) * 0.9 + life * 1.6;
          p.z += cos(uTime * 0.6 + aSeed * 13.0) * 0.7;
          vA = smoothstep(0.0, 0.1, life) * (1.0 - smoothstep(0.85, 1.0, life));
          vRot = uTime * (1.0 + aSeed * 2.0) + aSeed * 6.28;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = (4.5 + aSeed * 3.0) * (40.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        varying float vA; varying float vRot;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float s = sin(vRot), co = cos(vRot);
          c = vec2(c.x * co - c.y * s, c.x * s + c.y * co);
          float d = length(c * vec2(1.0, 1.9));
          if (d > 0.5) discard;
          gl_FragColor = vec4(mix(vec3(1.0, 0.52, 0.66), vec3(1.0, 0.76, 0.84), d * 2.0), vA * 0.95);
          #include <colorspace_fragment>
        }`,
    })
    return { geo: g, mat: m }
  }, [])
  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt
  })
  return <points geometry={geo} material={mat} frustumCulled={false} />
}

export function Fireflies() {
  const c = MEADOW.circle
  const p = MEADOW.pond
  return (
    <>
      <Sparkles count={26} scale={[16, 3, 16]} position={[p.x, 1.6, p.z]} size={3.5} speed={0.25} color="#fff2b0" opacity={0.8} />
      <Sparkles count={30} scale={[17, 3.5, 17]} position={[c.x, terrainHeight(c.x, c.z) + 1.8, c.z]} size={4} speed={0.3} color="#ffc7e0" opacity={0.85} />
      <Sparkles count={24} scale={[20, 3, 20]} position={[MEADOW.fieldCenter.x, 2.4, MEADOW.fieldCenter.z]} size={3} speed={0.25} color="#ffffff" opacity={0.7} />
    </>
  )
}
