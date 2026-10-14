/** Generic terrain mesh + water surface for a region. */
import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function GroundMesh({ size = 170, seg = 230, heightAt, colorAt }: {
  size?: number
  seg?: number
  heightAt: (x: number, z: number) => number
  colorAt: (x: number, z: number, h: number, out: THREE.Color) => void
}) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(size, size, seg, seg)
    g.rotateX(-Math.PI / 2)
    const pos = g.attributes.position as THREE.BufferAttribute
    const colors = new Float32Array(pos.count * 3)
    const col = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i)
      const h = heightAt(x, z)
      pos.setY(i, h)
      colorAt(x, z, h, col)
      colors[i * 3] = col.r
      colors[i * 3 + 1] = col.g
      colors[i * 3 + 2] = col.b
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    g.computeVertexNormals()
    return g
  }, [size, seg, heightAt, colorAt])
  return (
    <mesh geometry={geo} receiveShadow>
      <meshLambertMaterial vertexColors />
    </mesh>
  )
}

/** Pastel water with ripples, glints and shoreline foam (depth baked from the terrain). */
export function WaterSurface({ size = 170, heightAt, level = 0.25, shallow = '#bfe9f2', deep = '#86c3e8', extend = 0, glow = 0 }: {
  size?: number
  heightAt: (x: number, z: number) => number
  level?: number
  shallow?: string
  deep?: string
  /** Extra plane size beyond the terrain (seas reaching the horizon). */
  extend?: number
  glow?: number
}) {
  const { geo, mat } = useMemo(() => {
    const N = 256
    const ext = size / 2
    const data = new Uint8Array(N * N * 4)
    for (let j = 0; j < N; j++)
      for (let i = 0; i < N; i++) {
        const x = -ext + ((i + 0.5) / N) * ext * 2
        const z = -ext + ((j + 0.5) / N) * ext * 2
        const d = Math.max(0, Math.min(1, (level - heightAt(x, z)) / 1.6))
        data[(j * N + i) * 4] = d * 255
        data[(j * N + i) * 4 + 3] = 255
      }
    const depth = new THREE.DataTexture(data, N, N, THREE.RGBAFormat)
    depth.magFilter = THREE.LinearFilter
    depth.minFilter = THREE.LinearFilter
    depth.wrapS = depth.wrapT = THREE.ClampToEdgeWrapping
    depth.needsUpdate = true
    const full = size + extend * 2
    const g = new THREE.PlaneGeometry(full, full, 1, 1)
    g.rotateX(-Math.PI / 2)
    const m = new THREE.ShaderMaterial({
      transparent: true,
      fog: true,
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.fog,
        {
          uTime: { value: 0 },
          uDepth: { value: depth },
          uExt: { value: ext },
          uShallow: { value: new THREE.Color(shallow) },
          uDeep: { value: new THREE.Color(deep) },
          uGlow: { value: glow },
          uExtend: { value: extend > 0 ? 1 : 0 },
        },
      ]),
      vertexShader: /* glsl */ `
        varying vec3 vWorld;
        #include <fog_pars_vertex>
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorld = wp.xyz;
          vec4 mvPosition = viewMatrix * wp;
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform sampler2D uDepth; uniform float uExt; uniform float uGlow; uniform float uExtend;
        uniform vec3 uShallow; uniform vec3 uDeep;
        varying vec3 vWorld;
        #include <fog_pars_fragment>
        float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
        float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
          return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
        void main() {
          vec2 uv = (vWorld.xz + uExt) / (2.0 * uExt);
          bool inside = uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0;
          float d = inside ? texture2D(uDepth, uv).r : 1.0;
          if (!inside && uExtend < 0.5) discard;
          if (d <= 0.001) discard;
          vec2 p = vWorld.xz;
          float rip = noise(p * 0.9 + vec2(uTime * 0.35, uTime * 0.2)) * 0.5 + noise(p * 1.7 - vec2(uTime * 0.25, -uTime * 0.3)) * 0.5;
          vec3 col = mix(uShallow, uDeep, smoothstep(0.05, 0.75, d));
          col += (rip - 0.5) * 0.06;
          float glint = smoothstep(0.86, 0.95, noise(p * 2.6 + uTime * 0.6)) * smoothstep(0.1, 0.4, d);
          col = mix(col, vec3(1.0), glint * 0.7);
          float foam = 1.0 - smoothstep(0.02, 0.12 + rip * 0.06, d);
          col = mix(col, vec3(1.0), foam * 0.85);
          col += uGlow * glint * vec3(0.4, 0.5, 0.9);
          gl_FragColor = vec4(col, mix(0.72, 0.92, smoothstep(0.0, 0.5, d)) + foam * 0.1);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          #include <fog_fragment>
        }`,
    })
    return { geo: g, mat: m }
  }, [size, heightAt, level, shallow, deep, extend, glow])

  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt
  })
  return <mesh geometry={geo} material={mat} position={[0, level, 0]} renderOrder={1} />
}
