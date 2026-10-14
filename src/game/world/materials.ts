import * as THREE from 'three'

/** Soft 4-step toon ramp shared by characters and props. */
export const toonRamp = (() => {
  const steps = [150, 196, 232, 255]
  const data = new Uint8Array(steps.length * 4)
  steps.forEach((v, i) => data.set([v, v, v, 255], i * 4))
  const tex = new THREE.DataTexture(data, steps.length, 1, THREE.RGBAFormat)
  tex.minFilter = THREE.NearestFilter
  tex.magFilter = THREE.NearestFilter
  tex.generateMipmaps = false
  tex.needsUpdate = true
  return tex
})()

const cache = new Map<string, THREE.Material>()

/** Shared toon material (do not mutate — use `toonUnique` for per-object changes). */
export function toon(color: string, emissive?: string, emissiveIntensity = 0.4) {
  const key = `t:${color}:${emissive ?? ''}:${emissiveIntensity}`
  let m = cache.get(key)
  if (!m) {
    m = new THREE.MeshToonMaterial({ color, gradientMap: toonRamp })
    if (emissive) {
      ;(m as THREE.MeshToonMaterial).emissive.set(emissive)
      ;(m as THREE.MeshToonMaterial).emissiveIntensity = emissiveIntensity
    }
    cache.set(key, m)
  }
  return m as THREE.MeshToonMaterial
}

export function toonUnique(color: string) {
  return new THREE.MeshToonMaterial({ color, gradientMap: toonRamp })
}

export function basic(color: string, opts: THREE.MeshBasicMaterialParameters = {}) {
  const key = `b:${color}:${JSON.stringify(opts)}`
  let m = cache.get(key)
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color, ...opts })
    cache.set(key, m)
  }
  return m as THREE.MeshBasicMaterial
}

/** Inverted-hull outline material. */
export function outline(color: string) {
  return basic(color, { side: THREE.BackSide })
}

// shared unit geometries
export const GEO = {
  sphere: new THREE.SphereGeometry(1, 22, 16),
  sphereLo: new THREE.SphereGeometry(1, 12, 9),
  ico: new THREE.IcosahedronGeometry(1, 1),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 14),
  cone: new THREE.ConeGeometry(1, 1, 14),
  box: new THREE.BoxGeometry(1, 1, 1),
  circle: new THREE.CircleGeometry(1, 20),
}

export const windUniforms = { uTime: { value: 0 } }

type Patch = (shader: THREE.WebGLProgramParametersWithUniforms) => void
/** Chain shader patches on one material (wind, glow…). */
function patch(mat: THREE.Material, key: string, fn: Patch) {
  const prev = mat.onBeforeCompile.bind(mat)
  const prevKey = mat.customProgramCacheKey.bind(mat)
  mat.onBeforeCompile = (shader, renderer) => {
    prev(shader, renderer)
    fn(shader)
  }
  mat.customProgramCacheKey = () => prevKey() + key
  return mat
}

/**
 * Adds gentle wind sway to a material (grass, flowers, canopies).
 * `strength` scales displacement by the vertex's local height.
 */
export function addWind(mat: THREE.Material, strength: number, heightScale = 1) {
  return patch(mat, `wind${strength}:${heightScale}`, (shader) => {
    shader.uniforms.uTime = windUniforms.uTime
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        {
          vec3 ip = vec3(0.0);
          #ifdef USE_INSTANCING
            ip = instanceMatrix[3].xyz;
          #endif
          float hgt = max(position.y, 0.0) * ${heightScale.toFixed(3)};
          float w = sin(uTime * 1.6 + ip.x * 0.35 + ip.z * 0.22) * 0.6 + sin(uTime * 2.7 + ip.x * 0.8) * 0.25;
          transformed.x += w * ${strength.toFixed(3)} * hgt;
          transformed.z += cos(uTime * 1.3 + ip.z * 0.3) * ${(strength * 0.5).toFixed(3)} * hgt;
        }`,
      )
  })
}

/** Makes emissive glow take the per-instance / vertex colour, so instanced lights glow in their own colours. */
export function instanceGlow(mat: THREE.Material) {
  return patch(mat, 'iglow', (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
      #ifdef USE_COLOR
        totalEmissiveRadiance *= vColor.rgb;
      #endif`,
    )
  })
}

/** Lantern / window glow materials; their glow follows the time of day (see EnvClock). */
export const lampMaterials: THREE.MeshToonMaterial[] = []
export function lampMaterial(color = '#fff4d6', glow = '#ffd9a8') {
  const key = `lamp:${color}:${glow}`
  let m = cache.get(key) as THREE.MeshToonMaterial | undefined
  if (!m) {
    m = new THREE.MeshToonMaterial({ color, gradientMap: toonRamp })
    m.emissive.set(glow)
    m.emissiveIntensity = 0.6
    cache.set(key, m)
    lampMaterials.push(m)
  }
  return m
}
