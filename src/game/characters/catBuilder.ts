/**
 * Builds a stylised cat (or bunny, or owl) from simple shapes and returns its
 * rig. This is placeholder-quality modelling: a custom GLTF can replace it
 * later by producing the same CatRig (see README → "Replacing the character").
 */
import * as THREE from 'three'
import { GEO, toonRamp } from '../world/materials'
import { derivedColors, type CatLook } from './look'

export interface CatVariant {
  species: 'cat' | 'bunny' | 'owl'
  fur: string
  furLight: string
  inner: string
  outline: string
  scale: number
  headScale?: number
  /** Caca's bow (with swappable variants + accessories). */
  bow?: boolean
  scarf?: string
  hat?: 'straw' | 'chef' | 'cap' | 'sailor' | 'top' | 'beret'
  hatColor?: string
  glasses?: boolean
  stripes?: string
  satchel?: string
  /** Eye size multiplier. */
  eyes?: number
}

export const VARIANTS = {
  caca: { species: 'cat', fur: '#fff4ea', furLight: '#ffffff', inner: '#f8b8cb', outline: '#8d6878', scale: 1, bow: true, eyes: 1.08 },
  tatan: { species: 'cat', fur: '#c9cfdf', furLight: '#eef0f7', inner: '#f1b9c6', outline: '#5d6480', scale: 1.13, stripes: '#9aa2bb' },
  // meadow
  mimi: { species: 'cat', fur: '#ffd3ad', furLight: '#fff2e4', inner: '#f6b0b5', outline: '#9b6e5e', scale: 0.7, headScale: 1.12, eyes: 1.15 },
  biscuit: { species: 'cat', fur: '#e9c39b', furLight: '#fbefe1', inner: '#f0b1a8', outline: '#8a674f', scale: 0.98, hat: 'straw', glasses: true, eyes: 0.85 },
  pip: { species: 'bunny', fur: '#f4effc', furLight: '#ffffff', inner: '#f6bfd2', outline: '#7f6f99', scale: 0.86, eyes: 1.0 },
  // village
  mochi: { species: 'cat', fur: '#e7e3ee', furLight: '#ffffff', inner: '#f3b5c6', outline: '#77708a', scale: 1.02, hat: 'chef', stripes: '#c9c2d6', eyes: 0.95 },
  pudding: { species: 'cat', fur: '#5a5168', furLight: '#ffffff', inner: '#f2a9bf', outline: '#3d3548', scale: 0.95, hat: 'cap', hatColor: '#7fa8d8', satchel: '#c99a72' },
  maple: { species: 'cat', fur: '#f6b98a', furLight: '#fff1e2', inner: '#f3a9a4', outline: '#93634a', scale: 1.0, stripes: '#e89f6e' },
  kittenA: { species: 'cat', fur: '#ddd8e6', furLight: '#ffffff', inner: '#f3b5c6', outline: '#77708a', scale: 0.55, headScale: 1.15, eyes: 1.2 },
  kittenB: { species: 'cat', fur: '#f6b98a', furLight: '#fff1e2', inner: '#f3a9a4', outline: '#93634a', scale: 0.55, headScale: 1.15, eyes: 1.2 },
  kittenC: { species: 'cat', fur: '#fff0e0', furLight: '#ffffff', inner: '#f6b0b5', outline: '#9b6e5e', scale: 0.55, headScale: 1.15, eyes: 1.2, stripes: '#f2c9a0' },
  rosie: { species: 'bunny', fur: '#ffe1ec', furLight: '#ffffff', inner: '#f59bbd', outline: '#a06a82', scale: 0.78, eyes: 1.1 },
  // forest
  hoot: { species: 'owl', fur: '#bda68f', furLight: '#f4e7d6', inner: '#e9c9a8', outline: '#6f5a4a', scale: 1.0, glasses: true, eyes: 1.0 },
  clover: { species: 'bunny', fur: '#e7defb', furLight: '#ffffff', inner: '#f2b5d2', outline: '#7f6f99', scale: 0.8, eyes: 1.15 },
  // bay
  shelly: { species: 'bunny', fur: '#fff1dc', furLight: '#ffffff', inner: '#f8b8c4', outline: '#a07f62', scale: 0.86, hat: 'straw', hatColor: '#7fd0d8' },
  captain: { species: 'cat', fur: '#f7a35c', furLight: '#fff1e2', inner: '#f3a9a4', outline: '#93634a', scale: 1.08, hat: 'sailor', stripes: '#e88a45', eyes: 0.9 },
  mayor: { species: 'cat', fur: '#dcd9e3', furLight: '#ffffff', inner: '#f3b5c6', outline: '#6f6a80', scale: 1.15, hat: 'top', glasses: true, eyes: 0.85 },
  bella: { species: 'bunny', fur: '#ffd9e6', furLight: '#ffffff', inner: '#f59bbd', outline: '#a06a82', scale: 0.86, eyes: 1.1 },
  barnaby: { species: 'cat', fur: '#c9a07f', furLight: '#f6e6d6', inner: '#f0b1a8', outline: '#7a5a44', scale: 1.08, hat: 'cap', hatColor: '#a8e0c4', stripes: '#ad8466' },
  cocoa: { species: 'cat', fur: '#f5dfe8', furLight: '#ffffff', inner: '#f3a9c3', outline: '#916c80', scale: 0.95, hat: 'beret', hatColor: '#7fa8d8' },
  tom: { species: 'cat', fur: '#bdbbc9', furLight: '#f2f1f6', inner: '#eeb2c0', outline: '#5f5c70', scale: 1.0, hat: 'straw', hatColor: '#9cc3ea', eyes: 0.8 },
  luna: { species: 'cat', fur: '#c3bde3', furLight: '#f1eeff', inner: '#f2b5d2', outline: '#5f5885', scale: 0.95, stripes: '#a69fd0', eyes: 1.1 },
  sprout: { species: 'bunny', fur: '#dff5e8', furLight: '#ffffff', inner: '#f2b5d2', outline: '#5f8a76', scale: 0.72, eyes: 1.15 },
  sunny: { species: 'bunny', fur: '#fff3c4', furLight: '#ffffff', inner: '#f8b8c4', outline: '#a08a52', scale: 0.88, hat: 'straw', hatColor: '#f27aa6' },
  marina: { species: 'cat', fur: '#ffe0ea', furLight: '#ffffff', inner: '#f59bbd', outline: '#a06a82', scale: 0.95, hat: 'cap', hatColor: '#7fd0d8' },
  pebble: { species: 'cat', fur: '#cfd8e6', furLight: '#ffffff', inner: '#f3b5c6', outline: '#66718c', scale: 0.55, headScale: 1.15, eyes: 1.2 },
} satisfies Record<string, CatVariant>
export type VariantId = keyof typeof VARIANTS

export interface CatRig {
  root: THREE.Group
  model: THREE.Group
  body: THREE.Group
  head: THREE.Group
  ears: THREE.Group[]
  eyes: THREE.Group[]
  happyEyes: THREE.Group[]
  legs: THREE.Group[] // FL, FR, BL, BR
  tail: THREE.Group[]
  /** Optional wearables, keyed by accessory id (only Caca has most of these). */
  wear: Record<string, THREE.Object3D>
  bowMats: THREE.MeshToonMaterial[]
  bowStar: THREE.Object3D | null
  materials: THREE.Material[]
  bodyY: number
}

const EYE = '#3a2a3f'
const BOW_COLORS: Record<string, [string, string]> = {
  pinkBow: ['#f27aa6', '#d95b8b'],
  ribbonBow: ['#ffb68a', '#ee8d62'],
  starBow: ['#c3aef5', '#9f86e6'],
  skyBow: ['#9cc3ea', '#6f9fd6'],
  mintBow: ['#a8e0c4', '#78c4a0'],
}
const SCARVES: Record<string, [string, string]> = {
  blueScarf: ['#9cc3ea', '#86b2e0'],
  moonScarf: ['#c9b8f5', '#b9a5ee'],
  pinkScarf: ['#f7a8c6', '#f08fb5'],
  mintScarf: ['#a8e0c4', '#8fd2b2'],
}

export function buildCat(variant: CatVariant, look?: CatLook): CatRig {
  let v = variant
  if (look) {
    const d = derivedColors(look.fur)
    v = { ...v, fur: look.fur, furLight: d.furLight, inner: d.inner, outline: d.outline, stripes: look.pattern === 'tabby' ? look.patternColor : undefined }
  }
  const materials: THREE.Material[] = []
  const tm = (color: string, emissive?: string) => {
    const m = new THREE.MeshToonMaterial({ color, gradientMap: toonRamp })
    if (emissive) {
      m.emissive.set(emissive)
      m.emissiveIntensity = 0.6
    }
    materials.push(m)
    return m
  }
  const bm = (color: string, params: THREE.MeshBasicMaterialParameters = {}) => {
    const m = new THREE.MeshBasicMaterial({ color, ...params })
    materials.push(m)
    return m
  }
  const fur = tm(v.fur)
  const furLight = tm(v.furLight)
  const inner = tm(v.inner)
  const eyeMat = bm(look?.eyeColor ?? EYE)
  const patMat = look && look.pattern !== 'none' && look.pattern !== 'tabby' ? tm(look.patternColor) : null
  const white = bm('#ffffff')
  const nose = tm('#f190ad')
  const blushColor = look ? look.blush : '#f6a3bd'
  const blush = bm(blushColor ?? '#f6a3bd', { transparent: true, opacity: blushColor ? 0.55 : 0, depthWrite: false })
  const outlineMat = bm(v.outline, { side: THREE.BackSide })
  const mouthMat = bm('#7a4a5a')

  const mesh = (
    parent: THREE.Object3D,
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    s: [number, number, number],
    p: [number, number, number] = [0, 0, 0],
    r: [number, number, number] = [0, 0, 0],
    outlined = true,
    ol = 1.075,
  ) => {
    const m = new THREE.Mesh(geo, mat)
    m.scale.set(...s)
    m.position.set(...p)
    m.rotation.set(...r)
    m.castShadow = true
    parent.add(m)
    if (outlined) {
      const o = new THREE.Mesh(geo, outlineMat)
      o.scale.setScalar(ol)
      o.castShadow = false
      m.add(o)
    }
    return m
  }
  const group = (parent: THREE.Object3D, p: [number, number, number] = [0, 0, 0], r: [number, number, number] = [0, 0, 0]) => {
    const g = new THREE.Group()
    g.position.set(...p)
    g.rotation.set(...r)
    parent.add(g)
    return g
  }

  const root = new THREE.Group()
  const model = group(root)
  model.scale.setScalar(v.scale)
  const owl = v.species === 'owl'
  const bodyY = owl ? 0.62 : 0.47
  const body = group(model, [0, bodyY, 0])

  // torso + chest fluff
  if (owl) {
    mesh(body, GEO.sphere, fur, [0.46, 0.56, 0.44])
    mesh(body, GEO.sphere, furLight, [0.3, 0.38, 0.14], [0, -0.04, 0.33], [0, 0, 0], false)
    for (const sx of [-1, 1]) mesh(body, GEO.sphere, fur, [0.12, 0.38, 0.28], [sx * 0.42, -0.02, -0.02], [0, 0, sx * 0.15])
  } else {
    mesh(body, GEO.sphere, fur, [0.36, 0.33, 0.43])
    mesh(body, GEO.sphere, furLight, [0.22, 0.21, 0.13], [0, 0.04, 0.31], [0, 0, 0], false)
    for (const sx of [-1, 1]) mesh(body, GEO.sphere, fur, [0.09, 0.09, 0.08], [sx * 0.11, 0.17, 0.27], [0, 0, 0], false)
    if (look?.pattern === 'patches' && patMat) {
      mesh(body, GEO.sphere, patMat, [0.2, 0.17, 0.2], [0.17, 0.1, -0.12], [0, 0, 0], false)
      mesh(body, GEO.sphere, patMat, [0.16, 0.13, 0.15], [-0.2, 0.04, 0.08], [0, 0, 0], false)
    }
    if (look?.pattern === 'tabby') {
      const sm = tm(look.patternColor)
      for (const z of [-0.22, -0.05, 0.12]) mesh(body, GEO.sphere, sm, [0.335, 0.05, 0.06], [0, 0.16, z], [0.25, 0, 0], false)
    }
  }

  // legs (pivot at hip/shoulder)
  const legs: THREE.Group[] = []
  if (owl) {
    for (const [lx, lz] of [[-0.14, 0.12], [0.14, 0.12], [-0.14, -0.05], [0.14, -0.05]]) {
      const g = group(body, [lx, -0.5, lz])
      if (lz > 0) mesh(g, GEO.sphere, tm('#f2b36b'), [0.09, 0.05, 0.12], [0, -0.07, 0.02])
      legs.push(g)
    }
  } else {
    const legDefs: [number, number][] = [[-0.17, 0.2], [0.17, 0.2], [-0.19, -0.2], [0.19, -0.2]]
    for (const [lx, lz] of legDefs) {
      const g = group(body, [lx, -0.1, lz])
      mesh(g, GEO.sphere, fur, [0.085, 0.13, 0.085], [0, -0.13, 0])
      mesh(g, GEO.sphere, look?.pattern === 'socks' && patMat ? patMat : furLight, [0.1, 0.07, 0.115], [0, -0.26, 0.025])
      legs.push(g)
    }
  }

  // tail / pom
  const tail: THREE.Group[] = []
  if (v.species === 'cat') {
    let parent: THREE.Object3D = group(body, [0, 0.08, -0.38], [-0.7, 0, 0])
    for (let i = 0; i < 6; i++) {
      const seg = group(parent, i === 0 ? [0, 0, 0] : [0, 0.085, -0.02])
      const fl = look?.tail === 'fluffy' ? 1.4 + (i === 5 ? 0.25 : 0) : 1
      const r = (0.085 - i * 0.004) * fl
      mesh(seg, GEO.sphere, i === 5 ? furLight : fur, [r, r * 1.15, r], [0, 0.04, 0])
      tail.push(seg)
      parent = seg
    }
    if (v.stripes) for (const seg of [tail[1], tail[3]]) mesh(seg, GEO.sphere, tm(v.stripes), [0.083, 0.03, 0.083], [0, 0.04, 0], [0, 0, 0], false)
  } else if (v.species === 'bunny') {
    const seg = group(body, [0, 0.06, -0.4])
    mesh(seg, GEO.sphere, furLight, [0.13, 0.13, 0.13])
    tail.push(seg)
  } else {
    const seg = group(body, [0, -0.32, -0.36], [0.5, 0, 0])
    mesh(seg, GEO.cone, fur, [0.22, 0.26, 0.08], [0, -0.1, 0], [Math.PI, 0, 0])
    tail.push(seg)
  }

  // head
  const hs = v.headScale ?? 1
  const head = group(body, owl ? [0, 0.62, 0.02] : [0, 0.38, 0.2])
  head.scale.setScalar(hs)
  const ears: THREE.Group[] = []
  const eyes: THREE.Group[] = []
  const happyEyes: THREE.Group[] = []
  const arcGeo = new THREE.TorusGeometry(0.055, 0.015, 6, 16, Math.PI)
  const es = v.eyes ?? 1

  if (owl) {
    mesh(head, GEO.sphere, fur, [0.44, 0.38, 0.4])
    mesh(head, GEO.sphere, furLight, [0.36, 0.28, 0.12], [0, -0.02, 0.32], [0, 0, 0], false)
    for (const sx of [-1, 1]) {
      const e = group(head, [sx * 0.28, 0.3, -0.02], [0, 0, -sx * 0.5])
      mesh(e, GEO.cone, fur, [0.08, 0.2, 0.06], [0, 0.08, 0])
      ears.push(e)
      const g = group(head, [sx * 0.15, 0.03, 0.4])
      mesh(g, GEO.sphere, white, [0.12, 0.12, 0.04], [0, 0, -0.01], [0, 0, 0], false)
      mesh(g, GEO.sphere, eyeMat, [0.075 * es, 0.08 * es, 0.04], [0, 0, 0.01], [0, 0, 0], false)
      mesh(g, GEO.sphere, white, [0.025, 0.025, 0.02], [0.022, 0.03, 0.04], [0, 0, 0], false)
      eyes.push(g)
      const h = group(head, [sx * 0.15, 0.02, 0.43])
      h.add(new THREE.Mesh(arcGeo, eyeMat))
      h.visible = false
      happyEyes.push(h)
    }
    mesh(head, GEO.cone, tm('#f2b36b'), [0.05, 0.1, 0.05], [0, -0.1, 0.43], [Math.PI, 0, 0], false)
  } else {
    mesh(head, GEO.sphere, fur, [0.41, 0.36, 0.37])
    for (const sx of [-1, 1]) {
      mesh(head, GEO.sphere, fur, [0.15, 0.12, 0.12], [sx * 0.27, -0.13, 0.1])
      mesh(head, GEO.sphere, furLight, [0.13, 0.09, 0.08], [sx * 0.1, -0.15, 0.27], [0, 0, 0], false)
    }
    mesh(head, GEO.sphere, fur, [0.07, 0.08, 0.07], [0, 0.34, 0.06], [0.3, 0, 0], false)
    mesh(head, GEO.sphere, fur, [0.05, 0.06, 0.05], [0.07, 0.33, 0.04], [0.2, 0, -0.4], false)
    for (const sx of [-1, 1]) {
      if (v.species === 'cat') {
        const style = look?.ears ?? 'pointy'
        const e = group(head, [sx * 0.21, style === 'folded' ? 0.22 : 0.25, -0.02], [style === 'folded' ? 0.9 : 0, 0, -sx * (style === 'folded' ? 0.5 : 0.35)])
        if (style === 'round') {
          mesh(e, GEO.sphere, fur, [0.13, 0.13, 0.07], [0, 0.08, 0])
          mesh(e, GEO.sphere, inner, [0.08, 0.08, 0.03], [0, 0.08, 0.05], [0, 0, 0], false)
        } else {
          mesh(e, GEO.cone, fur, [0.135, style === 'folded' ? 0.2 : 0.27, 0.11], [0, 0.11, 0])
          mesh(e, GEO.cone, inner, [0.08, style === 'folded' ? 0.12 : 0.18, 0.04], [0, 0.09, 0.06], [0, 0, 0], false)
        }
        if (look?.pattern === 'patches' && patMat && sx > 0) mesh(head, GEO.sphere, patMat, [0.15, 0.13, 0.12], [0.2, 0.18, 0.12], [0, 0, 0], false)
        ears.push(e)
      } else {
        const e = group(head, [sx * 0.13, 0.27, -0.04], [0, 0, -sx * 0.18])
        mesh(e, GEO.sphere, fur, [0.085, 0.3, 0.06], [0, 0.26, 0])
        mesh(e, GEO.sphere, inner, [0.045, 0.22, 0.02], [0, 0.26, 0.045], [0, 0, 0], false)
        ears.push(e)
      }
      const style = look?.eyes ?? 'round'
      const e2 = es * (style === 'big' ? 1.22 : 1)
      if (look?.pattern === 'mask' && patMat) mesh(head, GEO.sphere, patMat, [0.13, 0.13, 0.06], [sx * 0.15, 0.02, 0.27], [0, sx * 0.28, 0], false)
      const g = group(head, [sx * 0.155, 0.0, 0.305])
      g.rotation.y = sx * 0.28
      g.userData.sy = style === 'sleepy' ? 0.55 : 1
      g.scale.y = g.userData.sy
      mesh(g, GEO.sphere, eyeMat, [0.074 * e2, 0.094 * e2, 0.05], [0, 0, 0], [0, 0, 0], false)
      const hl = style === 'sparkle' ? 1.35 : 1
      mesh(g, GEO.sphere, white, [0.028 * e2 * hl, 0.028 * e2 * hl, 0.02], [0.022 * e2, 0.035 * e2, 0.04], [0, 0, 0], false)
      mesh(g, GEO.sphere, white, [0.013 * e2 * hl, 0.013 * e2 * hl, 0.01], [-0.022 * e2, -0.035 * e2, 0.042], [0, 0, 0], false)
      if (style === 'sparkle') mesh(g, GEO.sphere, white, [0.009, 0.009, 0.01], [0.03 * e2, -0.02 * e2, 0.043], [0, 0, 0], false)
      eyes.push(g)
      const h = group(head, [sx * 0.155, -0.01, 0.335])
      h.rotation.y = sx * 0.28
      h.add(new THREE.Mesh(arcGeo, eyeMat))
      h.visible = false
      happyEyes.push(h)
    }
    mesh(head, GEO.sphere, nose, [0.042, 0.03, 0.03], [0, -0.075, 0.36], [0, 0, 0], false)
    for (const sx of [-1, 1]) {
      const m = new THREE.Mesh(arcGeo, mouthMat)
      m.scale.set(0.5, 0.5, 0.5)
      m.position.set(sx * 0.027, -0.115, 0.352)
      m.rotation.set(0, 0, Math.PI)
      head.add(m)
      const b = new THREE.Mesh(GEO.circle, blush)
      b.scale.set(0.065, 0.045, 1)
      b.position.set(sx * 0.245, -0.085, 0.27)
      b.rotation.y = sx * 0.75
      head.add(b)
      if (look?.freckles) {
        for (const [fx, fy] of [[0.2, -0.06], [0.24, -0.1], [0.19, -0.11]]) {
          const f = new THREE.Mesh(GEO.circle, mouthMat)
          f.scale.setScalar(0.009)
          f.position.set(sx * fx, fy, 0.3 + (0.24 - fx) * 0.4)
          f.rotation.y = sx * 0.6
          head.add(f)
        }
      }
      if (v.species === 'cat') {
        for (const wy of [-0.09, -0.125]) {
          const w = new THREE.Mesh(GEO.box, mouthMat)
          w.scale.set(0.15, 0.006, 0.006)
          w.position.set(sx * 0.37, wy, 0.2)
          w.rotation.set(0, sx * 0.35, sx * (wy + 0.1) * 2.2)
          head.add(w)
        }
      }
    }
    if (v.stripes) {
      const sm = tm(v.stripes)
      mesh(head, GEO.sphere, sm, [0.03, 0.085, 0.02], [0, 0.26, 0.23], [-0.6, 0, 0], false)
      mesh(head, GEO.sphere, sm, [0.025, 0.07, 0.02], [-0.09, 0.24, 0.22], [-0.6, 0, 0.35], false)
      mesh(head, GEO.sphere, sm, [0.025, 0.07, 0.02], [0.09, 0.24, 0.22], [-0.6, 0, -0.35], false)
    }
  }

  // ── fixed outfit pieces ──
  if (v.scarf) {
    const sc = tm(v.scarf)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.065, 10, 24), sc)
    ring.position.set(0, 0.27, 0.15)
    ring.rotation.set(Math.PI / 2 - 0.35, 0, 0)
    ring.castShadow = true
    body.add(ring)
    mesh(body, GEO.box, sc, [0.09, 0.2, 0.04], [0.11, 0.13, 0.33], [0.25, 0, 0.2], true, 1.1)
  }
  if (v.hat) {
    const hc = v.hatColor
    const hat = group(head, owl ? [0, 0.34, 0] : [0, 0.28, -0.02], [-0.12, 0, 0.08])
    if (v.hat === 'straw') {
      const straw = tm('#f3dca6')
      mesh(hat, GEO.cylinder, straw, [0.42, 0.025, 0.42])
      mesh(hat, GEO.sphere, straw, [0.24, 0.17, 0.24], [0, 0.05, 0])
      mesh(hat, GEO.cylinder, tm(hc ?? '#f4a3bf'), [0.245, 0.05, 0.245], [0, 0.04, 0], [0, 0, 0], false)
    } else if (v.hat === 'chef') {
      const w = tm('#ffffff')
      mesh(hat, GEO.cylinder, w, [0.2, 0.16, 0.2], [0, 0.06, 0])
      mesh(hat, GEO.sphere, w, [0.27, 0.18, 0.27], [0, 0.22, 0])
    } else if (v.hat === 'cap') {
      const cm = tm(hc ?? '#7fa8d8')
      mesh(hat, GEO.sphere, cm, [0.27, 0.13, 0.27], [0, 0.02, 0])
      mesh(hat, GEO.box, cm, [0.24, 0.02, 0.16], [0, -0.03, 0.25])
      mesh(hat, GEO.sphere, tm('#f7d774'), [0.04, 0.04, 0.02], [0, 0.06, 0.25], [0, 0, 0], false)
    } else if (v.hat === 'top') {
      const tm2 = tm(hc ?? '#5a5168')
      mesh(hat, GEO.cylinder, tm2, [0.3, 0.02, 0.3], [0, -0.01, 0])
      mesh(hat, GEO.cylinder, tm2, [0.19, 0.3, 0.19], [0, 0.15, 0])
      mesh(hat, GEO.cylinder, tm('#f27aa6'), [0.195, 0.05, 0.195], [0, 0.05, 0], [0, 0, 0], false)
    } else if (v.hat === 'beret') {
      mesh(hat, GEO.sphere, tm(hc ?? '#7fa8d8'), [0.3, 0.09, 0.3], [0.03, 0.02, 0], [0, 0, -0.25])
    } else if (v.hat === 'sailor') {
      const w = tm('#ffffff')
      mesh(hat, GEO.cylinder, w, [0.25, 0.1, 0.25], [0, 0.04, 0])
      mesh(hat, GEO.cylinder, tm('#5f8fd0'), [0.255, 0.04, 0.255], [0, 0.03, 0], [0, 0, 0], false)
      mesh(hat, GEO.cylinder, w, [0.3, 0.02, 0.3], [0, -0.02, 0])
    }
  }
  if (v.glasses) {
    const rim = bm('#6f5a4a')
    for (const sx of [-1, 1]) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(owl ? 0.1 : 0.065, 0.01, 6, 20), rim)
      r.position.set(sx * (owl ? 0.15 : 0.15), owl ? 0.03 : 0.0, owl ? 0.44 : 0.345)
      head.add(r)
    }
  }
  if (v.satchel) {
    const sm = tm(v.satchel)
    const strap = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 6, 24), sm)
    strap.rotation.set(0.2, 0, 0.75)
    strap.position.set(0, 0.05, 0.02)
    body.add(strap)
    mesh(body, GEO.box, sm, [0.18, 0.16, 0.08], [0.3, -0.12, 0.12], [0, 0.4, 0])
  }

  // ── Caca's wearables ──
  const wear: Record<string, THREE.Object3D> = {}
  const bowMats: THREE.MeshToonMaterial[] = []
  let bowStar: THREE.Object3D | null = null
  if (v.bow || look) {
    const pink = tm('#f27aa6')
    const pinkDark = tm('#d95b8b')
    bowMats.push(pink, pinkDark)
    const bow = group(head, [0.2, 0.27, 0.06], [0.1, 0.2, -0.45])
    bow.visible = !!v.bow
    wear.__bow = bow
    for (const sx of [-1, 1]) {
      mesh(bow, GEO.cone, pink, [0.085, 0.16, 0.06], [sx * 0.085, 0, 0], [0, 0, (sx * Math.PI) / 2], true, 1.12)
      mesh(bow, GEO.sphere, pinkDark, [0.022, 0.06, 0.03], [sx * 0.14, 0, 0.012], [0, 0, 0], false)
      mesh(bow, GEO.box, pink, [0.045, 0.1, 0.02], [sx * 0.035, -0.07, 0.01], [0, 0, sx * 0.4], false)
    }
    mesh(bow, GEO.sphere, pinkDark, [0.045, 0.045, 0.04], [0, 0, 0.005], [0, 0, 0], true, 1.15)
    const star = new THREE.Mesh(starShapeGeo(0.06), tm('#fff1b8', '#ffd36e'))
    star.position.set(0, 0, 0.05)
    star.visible = false
    bow.add(star)
    bowStar = star

    // flower crown
    const crown = group(head, [0, 0.25, 0.0], [-0.18, 0, 0])
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.022, 6, 28), tm('#8cc47a'))
    ring.rotation.x = Math.PI / 2
    crown.add(ring)
    const cols = ['#ffd1e1', '#ffffff', '#ffc59e', '#f59bbd', '#d9c7ff']
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2
      const f = group(crown, [Math.cos(a) * 0.27, 0.02, Math.sin(a) * 0.27])
      const pm = tm(cols[i % cols.length])
      for (let k = 0; k < 5; k++) {
        const pa = (k / 5) * Math.PI * 2
        mesh(f, GEO.sphere, pm, [0.035, 0.018, 0.035], [Math.cos(pa) * 0.035, 0.01, Math.sin(pa) * 0.035], [0, 0, 0], false)
      }
      mesh(f, GEO.sphere, tm('#f7d774'), [0.018, 0.018, 0.018], [0, 0.02, 0], [0, 0, 0], false)
    }
    wear.flowerCrown = crown

    // shell tiara
    const tiara = group(head, [0, 0.27, 0.06], [-0.35, 0, 0])
    const shellCols = ['#ffd6e6', '#bfe9f2', '#fff1c8', '#e3d4ff', '#ffc9b0']
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * (0.15 + (i / 4) * 0.7)
      const s = mesh(tiara, GEO.cone, tm(shellCols[i]), [0.05, i === 2 ? 0.13 : 0.09, 0.03], [Math.cos(a) * 0.24, 0.04, Math.sin(a) * 0.1 + 0.12], [0, 0, (Math.PI / 2 - a) * 0.6], true, 1.12)
      s.castShadow = false
    }
    wear.shellTiara = tiara

    // heart glasses
    const glasses = group(head, [0, 0.0, 0.36])
    const hs2 = new THREE.Shape()
    hs2.moveTo(0, -0.06)
    hs2.bezierCurveTo(-0.09, 0.0, -0.06, 0.07, 0, 0.035)
    hs2.bezierCurveTo(0.06, 0.07, 0.09, 0.0, 0, -0.06)
    const hg = new THREE.ExtrudeGeometry(hs2, { depth: 0.012, bevelEnabled: false })
    const lens = bm('#ff8fbd', { transparent: true, opacity: 0.6 })
    for (const sx of [-1, 1]) {
      const m = new THREE.Mesh(hg, lens)
      m.position.set(sx * 0.155, 0.0, 0)
      m.scale.setScalar(1.25)
      m.rotation.y = sx * 0.2
      glasses.add(m)
    }
    const bridge = new THREE.Mesh(GEO.box, bm('#e2578f'))
    bridge.scale.set(0.07, 0.012, 0.012)
    bridge.position.set(0, 0.02, 0.01)
    glasses.add(bridge)
    wear.heartGlasses = glasses

    // tiny backpack
    const pack = group(body, [0, 0.16, -0.3])
    mesh(pack, GEO.sphere, tm('#f7a8c6'), [0.2, 0.17, 0.12], [0, 0, 0])
    mesh(pack, GEO.sphere, tm('#f27aa6'), [0.18, 0.08, 0.1], [0, 0.08, 0.02], [0, 0, 0], false)
    mesh(pack, GEO.sphere, tm('#fff1b8'), [0.035, 0.035, 0.02], [0, 0.04, -0.12], [0, 0, 0], false)
    wear.backpack = pack

    // neck pieces
    const collar = group(body, [0, 0.27, 0.15], [Math.PI / 2 - 0.35, 0, 0])
    collar.add(new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 8, 24), tm('#f27aa6')))
    const bell = new THREE.Mesh(GEO.sphere, tm('#f7d774', '#c8a23a'))
    bell.scale.setScalar(0.05)
    bell.position.set(0, 0.2, 0.02)
    collar.add(bell)
    wear.collar = collar

    for (const [id, [c1, c2]] of Object.entries(SCARVES)) {
      const scarf = group(body)
      const sr = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.06, 10, 24), tm(c1))
      sr.position.set(0, 0.27, 0.15)
      sr.rotation.set(Math.PI / 2 - 0.35, 0, 0)
      scarf.add(sr)
      mesh(scarf, GEO.box, tm(c2), [0.09, 0.2, 0.04], [0.11, 0.13, 0.33], [0.25, 0, 0.2], true, 1.1)
      wear[id] = scarf
    }

    // bow tie + bandana
    const tie = group(body, [0, 0.2, 0.36], [-0.3, 0, 0])
    const tieMat = tm('#f27aa6')
    for (const sx of [-1, 1]) mesh(tie, GEO.cone, tieMat, [0.06, 0.1, 0.035], [sx * 0.05, 0, 0], [0, 0, (-sx * Math.PI) / 2], true, 1.12)
    mesh(tie, GEO.sphere, tm('#d95b8b'), [0.03, 0.03, 0.025], [0, 0, 0.005], [0, 0, 0], false)
    wear.bowtie = tie
    const band = group(body, [0, 0.24, 0.24], [-0.6, 0, 0])
    mesh(band, GEO.cone, tm('#ffc59e'), [0.2, 0.22, 0.05], [0, -0.06, 0], [Math.PI, Math.PI / 4, 0], true, 1.08)
    wear.bandana = band

    // head pieces
    const clip = group(head, [-0.2, 0.25, 0.12], [0, 0, 0.4])
    clip.add(new THREE.Mesh(starShapeGeo(0.07), tm('#fff1b8', '#ffd36e')))
    wear.starClip = clip
    const beret = group(head, [0.03, 0.29, -0.02], [-0.15, 0, -0.25])
    mesh(beret, GEO.sphere, tm('#f392b4'), [0.3, 0.09, 0.3])
    mesh(beret, GEO.cylinder, tm('#e07ca2'), [0.02, 0.06, 0.02], [0, 0.09, 0], [0, 0, 0], false)
    wear.beret = beret
    const sun = group(head, [0, 0.29, -0.02], [-0.15, 0, 0.06])
    mesh(sun, GEO.cylinder, tm('#f3dca6'), [0.44, 0.025, 0.44])
    mesh(sun, GEO.sphere, tm('#f3dca6'), [0.24, 0.16, 0.24], [0, 0.05, 0])
    mesh(sun, GEO.cylinder, tm('#ffc59e'), [0.245, 0.05, 0.245], [0, 0.04, 0], [0, 0, 0], false)
    wear.sunHat = sun
    const bunny = group(head, [0, 0.3, -0.02])
    const hb = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.018, 6, 24, Math.PI), tm('#f7a8c6'))
    hb.rotation.set(0, Math.PI / 2, 0)
    hb.position.y = -0.12
    bunny.add(hb)
    for (const sx of [-1, 1]) {
      mesh(bunny, GEO.sphere, tm('#ffffff'), [0.06, 0.22, 0.04], [sx * 0.1, 0.24, 0], [0, 0, -sx * 0.15])
      mesh(bunny, GEO.sphere, tm('#ffc4d8'), [0.03, 0.16, 0.02], [sx * 0.1, 0.24, 0.03], [0, 0, -sx * 0.15], false)
    }
    wear.bunnyBand = bunny
    const party = group(head, [0.05, 0.3, 0], [-0.1, 0, -0.2])
    mesh(party, GEO.cone, tm('#9cc3ea'), [0.13, 0.32, 0.13], [0, 0.16, 0])
    mesh(party, GEO.sphere, tm('#f27aa6'), [0.05, 0.05, 0.05], [0, 0.34, 0], [0, 0, 0], false)
    for (const yy of [0.06, 0.15]) mesh(party, GEO.cylinder, tm('#fff1b8'), [0.12 - yy * 0.5, 0.02, 0.12 - yy * 0.5], [0, yy, 0], [0, 0, 0], false)
    wear.partyHat = party

    // face pieces
    const round = group(head, [0, 0.0, 0.355])
    const rim = bm('#7a5a6a')
    for (const sx of [-1, 1]) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.012, 6, 20), rim)
      r.position.set(sx * 0.155, 0, 0)
      round.add(r)
    }
    const rb = new THREE.Mesh(GEO.box, rim)
    rb.scale.set(0.08, 0.012, 0.012)
    round.add(rb)
    wear.roundGlasses = round
    const starG = group(head, [0, 0.0, 0.36])
    const sl = bm('#ffd36e', { transparent: true, opacity: 0.7 })
    for (const sx of [-1, 1]) {
      const m = new THREE.Mesh(starShapeGeo(0.085), sl)
      m.position.set(sx * 0.155, 0, 0)
      starG.add(m)
    }
    wear.starGlasses = starG

    // back pieces
    const cape = group(body, [0, 0.24, -0.05])
    const capeGeo = new THREE.SphereGeometry(0.42, 16, 10, Math.PI * 0.6, Math.PI * 0.8, 0.2, 1.3)
    const capeMesh = new THREE.Mesh(capeGeo, tm('#c9b8f5'))
    ;(capeMesh.material as THREE.Material).side = THREE.DoubleSide
    capeMesh.scale.set(0.95, 1.1, 1.1)
    capeMesh.position.set(0, -0.12, 0.02)
    capeMesh.castShadow = true
    cape.add(capeMesh)
    wear.cape = cape
    const wings = group(body, [0, 0.18, -0.28])
    const wingMat = tm('#ffffff', '#fff3fa')
    for (const sx of [-1, 1]) {
      const w = group(wings, [sx * 0.12, 0.05, 0], [0, sx * 0.5, sx * 0.3])
      mesh(w, GEO.sphere, wingMat, [0.2, 0.13, 0.03], [sx * 0.15, 0.04, 0])
      mesh(w, GEO.sphere, wingMat, [0.14, 0.09, 0.03], [sx * 0.12, -0.08, 0.01])
    }
    wear.angelWings = wings

    const locket = group(body, [0, 0.27, 0.15], [Math.PI / 2 - 0.35, 0, 0])
    locket.add(new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.008, 6, 28), tm('#f7d774')))
    const heart = new THREE.Mesh(heartShapeGeo(0.06), tm('#f7d774', '#e0a83a'))
    heart.position.set(0, 0.2, 0.03)
    heart.rotation.x = Math.PI / 2
    locket.add(heart)
    wear.loveLocket = locket

    for (const [id, w] of Object.entries(wear)) if (id !== '__bow') w.visible = false
  }

  return { root, model, body, head, ears, eyes, happyEyes, legs, tail, wear, bowMats, bowStar, materials, bodyY }
}

/** Show the equipped accessories and colour the bow. */
export function applyOutfit(rig: CatRig, eq: { bow: string; head: string | null; face: string | null; back: string | null; neck: string | null }) {
  const on = new Set([eq.head, eq.face, eq.back, eq.neck].filter(Boolean) as string[])
  for (const [id, obj] of Object.entries(rig.wear)) obj.visible = id === '__bow' ? eq.bow !== 'none' : on.has(id)
  const [a, b] = BOW_COLORS[eq.bow] ?? BOW_COLORS.pinkBow
  rig.bowMats[0]?.color.set(a)
  rig.bowMats[1]?.color.set(b)
  if (rig.bowStar) rig.bowStar.visible = eq.bow === 'starBow'
}

function starShapeGeo(r: number) {
  const s = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2
    const rr = i % 2 === 0 ? r : r * 0.45
    if (i === 0) s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr)
    else s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
  }
  return new THREE.ExtrudeGeometry(s, { depth: r * 0.3, bevelEnabled: false })
}
function heartShapeGeo(r: number) {
  const s = new THREE.Shape()
  s.moveTo(0, -r)
  s.bezierCurveTo(-r * 1.5, 0, -r, r * 1.2, 0, r * 0.55)
  s.bezierCurveTo(r, r * 1.2, r * 1.5, 0, 0, -r)
  return new THREE.ExtrudeGeometry(s, { depth: r * 0.4, bevelEnabled: false })
}

export function setRigOpacity(rig: CatRig, opacity: number) {
  for (const m of rig.materials) {
    const base = (m.userData.baseOpacity ??= m.opacity) as number
    m.transparent = opacity < 1 || base < 1
    m.opacity = base * opacity
    m.depthWrite = opacity >= 1 && base >= 1
  }
}

export function disposeRig(rig: CatRig) {
  for (const m of rig.materials) m.dispose()
}

/** Build Caca or Tatan with their customised look and current outfit. */
import { game } from '../state/store'
export function buildHero(who: 'caca' | 'tatan') {
  const s = game.get()
  const rig = buildCat(VARIANTS[who], s.looks[who])
  applyOutfit(rig, who === 'caca' ? s.equipped : s.equippedTatan)
  return rig
}
