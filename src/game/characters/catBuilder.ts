/**
 * Builds a stylised cat (or bunny) from simple shapes and returns its rig.
 * This is a placeholder-quality character: a custom GLTF can replace it later
 * by producing the same CatRig (see README → "Replacing the character").
 */
import * as THREE from 'three'
import { GEO, toonRamp } from '../world/materials'

export interface CatVariant {
  species: 'cat' | 'bunny'
  fur: string
  furLight: string
  inner: string
  outline: string
  scale: number
  headScale?: number
  bow?: boolean
  scarf?: string
  hat?: boolean
  glasses?: boolean
  stripes?: string
  /** Eye size multiplier. */
  eyes?: number
}

export const VARIANTS: Record<string, CatVariant> = {
  caca: { species: 'cat', fur: '#fff4ea', furLight: '#ffffff', inner: '#f8b8cb', outline: '#8d6878', scale: 1, bow: true, eyes: 1.08 },
  tatan: { species: 'cat', fur: '#c9cfdf', furLight: '#eef0f7', inner: '#f1b9c6', outline: '#5d6480', scale: 1.13, scarf: '#9cc3ea', stripes: '#9aa2bb' },
  mimi: { species: 'cat', fur: '#ffd3ad', furLight: '#fff2e4', inner: '#f6b0b5', outline: '#9b6e5e', scale: 0.7, headScale: 1.12, eyes: 1.15 },
  biscuit: { species: 'cat', fur: '#e9c39b', furLight: '#fbefe1', inner: '#f0b1a8', outline: '#8a674f', scale: 0.98, hat: true, glasses: true, eyes: 0.85 },
  pip: { species: 'bunny', fur: '#f4effc', furLight: '#ffffff', inner: '#f6bfd2', outline: '#7f6f99', scale: 0.86, eyes: 1.0 },
}

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
  crown: THREE.Group
  heartGlasses: THREE.Group
  materials: THREE.Material[]
  bodyY: number
}

const EYE = '#3a2a3f'

export function buildCat(v: CatVariant): CatRig {
  const materials: THREE.Material[] = []
  const tm = (color: string) => {
    const m = new THREE.MeshToonMaterial({ color, gradientMap: toonRamp })
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
  const eyeMat = bm(EYE)
  const white = bm('#ffffff')
  const nose = tm('#f190ad')
  const blush = bm('#f6a3bd', { transparent: true, opacity: 0.55, depthWrite: false })
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
  const bodyY = 0.47
  const body = group(model, [0, bodyY, 0])

  // torso + chest fluff
  mesh(body, GEO.sphere, fur, [0.36, 0.33, 0.43])
  mesh(body, GEO.sphere, furLight, [0.22, 0.21, 0.13], [0, 0.04, 0.31], [0, 0, 0], false)
  for (const sx of [-1, 1]) mesh(body, GEO.sphere, fur, [0.09, 0.09, 0.08], [sx * 0.11, 0.17, 0.27], [0, 0, 0], false)

  // legs (pivot at hip/shoulder)
  const legs: THREE.Group[] = []
  const legDefs: [number, number][] = [
    [-0.17, 0.2],
    [0.17, 0.2],
    [-0.19, -0.2],
    [0.19, -0.2],
  ]
  for (const [lx, lz] of legDefs) {
    const g = group(body, [lx, -0.1, lz])
    mesh(g, GEO.sphere, fur, [0.085, 0.13, 0.085], [0, -0.13, 0])
    mesh(g, GEO.sphere, furLight, [0.1, 0.07, 0.115], [0, -0.26, 0.025])
    legs.push(g)
  }

  // tail / pom
  const tail: THREE.Group[] = []
  if (v.species === 'cat') {
    let parent: THREE.Object3D = group(body, [0, 0.08, -0.38], [-0.7, 0, 0])
    for (let i = 0; i < 6; i++) {
      const seg = group(parent, i === 0 ? [0, 0, 0] : [0, 0.085, -0.02])
      const r = 0.085 - i * 0.004
      mesh(seg, GEO.sphere, i === 5 ? furLight : fur, [r, r * 1.15, r], [0, 0.04, 0])
      tail.push(seg)
      parent = seg
    }
    if (v.stripes) {
      for (const seg of [tail[1], tail[3]]) mesh(seg, GEO.sphere, tm(v.stripes), [0.083, 0.03, 0.083], [0, 0.04, 0], [0, 0, 0], false)
    }
  } else {
    const seg = group(body, [0, 0.06, -0.4])
    mesh(seg, GEO.sphere, furLight, [0.13, 0.13, 0.13])
    tail.push(seg)
  }

  // head
  const hs = v.headScale ?? 1
  const head = group(body, [0, 0.38, 0.2])
  head.scale.setScalar(hs)
  mesh(head, GEO.sphere, fur, [0.41, 0.36, 0.37])
  for (const sx of [-1, 1]) {
    mesh(head, GEO.sphere, fur, [0.15, 0.12, 0.12], [sx * 0.27, -0.13, 0.1])
    mesh(head, GEO.sphere, furLight, [0.13, 0.09, 0.08], [sx * 0.1, -0.15, 0.27], [0, 0, 0], false)
  }
  // head tuft
  mesh(head, GEO.sphere, fur, [0.07, 0.08, 0.07], [0, 0.34, 0.06], [0.3, 0, 0], false)
  mesh(head, GEO.sphere, fur, [0.05, 0.06, 0.05], [0.07, 0.33, 0.04], [0.2, 0, -0.4], false)

  // ears
  const ears: THREE.Group[] = []
  for (const sx of [-1, 1]) {
    if (v.species === 'cat') {
      const e = group(head, [sx * 0.21, 0.25, -0.02], [0, 0, -sx * 0.35])
      mesh(e, GEO.cone, fur, [0.135, 0.27, 0.11], [0, 0.11, 0])
      mesh(e, GEO.cone, inner, [0.08, 0.18, 0.04], [0, 0.09, 0.06], [0, 0, 0], false)
      ears.push(e)
    } else {
      const e = group(head, [sx * 0.13, 0.27, -0.04], [0, 0, -sx * 0.18])
      mesh(e, GEO.sphere, fur, [0.085, 0.3, 0.06], [0, 0.26, 0])
      mesh(e, GEO.sphere, inner, [0.045, 0.22, 0.02], [0, 0.26, 0.045], [0, 0, 0], false)
      ears.push(e)
    }
  }

  // eyes
  const es = v.eyes ?? 1
  const eyes: THREE.Group[] = []
  const happyEyes: THREE.Group[] = []
  const arcGeo = new THREE.TorusGeometry(0.055, 0.015, 6, 16, Math.PI)
  for (const sx of [-1, 1]) {
    const g = group(head, [sx * 0.155, 0.0, 0.305])
    g.rotation.y = sx * 0.28
    mesh(g, GEO.sphere, eyeMat, [0.074 * es, 0.094 * es, 0.05], [0, 0, 0], [0, 0, 0], false)
    mesh(g, GEO.sphere, white, [0.028 * es, 0.028 * es, 0.02], [0.022 * es, 0.035 * es, 0.04], [0, 0, 0], false)
    mesh(g, GEO.sphere, white, [0.013 * es, 0.013 * es, 0.01], [-0.022 * es, -0.035 * es, 0.042], [0, 0, 0], false)
    eyes.push(g)
    const h = group(head, [sx * 0.155, -0.01, 0.335])
    h.rotation.y = sx * 0.28
    const arc = new THREE.Mesh(arcGeo, eyeMat)
    h.add(arc)
    h.visible = false
    happyEyes.push(h)
  }

  // nose, mouth, blush, whiskers
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

  // ── accessories ──
  if (v.bow) {
    const pink = tm('#f27aa6')
    const pinkDark = tm('#d95b8b')
    const bow = group(head, [0.2, 0.27, 0.06], [0.1, 0.2, -0.45])
    for (const sx of [-1, 1]) {
      const loop = mesh(bow, GEO.cone, pink, [0.085, 0.16, 0.06], [sx * 0.085, 0, 0], [0, 0, sx * Math.PI / 2], true, 1.12)
      loop.castShadow = true
      mesh(bow, GEO.sphere, pinkDark, [0.022, 0.06, 0.03], [sx * 0.14, 0, 0.012], [0, 0, 0], false)
      mesh(bow, GEO.box, pink, [0.045, 0.1, 0.02], [sx * 0.035, -0.07, 0.01], [0, 0, sx * 0.4], false)
    }
    mesh(bow, GEO.sphere, pinkDark, [0.045, 0.045, 0.04], [0, 0, 0.005], [0, 0, 0], true, 1.15)
  }
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
    const straw = tm('#f3dca6')
    const hat = group(head, [0, 0.28, -0.02], [-0.12, 0, 0.08])
    mesh(hat, GEO.cylinder, straw, [0.42, 0.025, 0.42])
    mesh(hat, GEO.sphere, straw, [0.24, 0.17, 0.24], [0, 0.05, 0])
    mesh(hat, GEO.cylinder, tm('#f4a3bf'), [0.245, 0.05, 0.245], [0, 0.04, 0], [0, 0, 0], false)
  }
  if (v.glasses) {
    const rim = bm('#8a674f')
    for (const sx of [-1, 1]) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.01, 6, 20), rim)
      r.position.set(sx * 0.15, 0.0, 0.345)
      head.add(r)
    }
  }

  // flower crown (unlockable for Caca)
  const crown = group(head, [0, 0.25, 0.0], [-0.18, 0, 0])
  {
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
  }
  crown.visible = false

  // heart glasses (unlockable for Caca)
  const heartGlasses = group(head, [0, 0.0, 0.36])
  {
    const shape = new THREE.Shape()
    shape.moveTo(0, -0.06)
    shape.bezierCurveTo(-0.09, 0.0, -0.06, 0.07, 0, 0.035)
    shape.bezierCurveTo(0.06, 0.07, 0.09, 0.0, 0, -0.06)
    const hg = new THREE.ExtrudeGeometry(shape, { depth: 0.012, bevelEnabled: false })
    const lens = bm('#ff8fbd', { transparent: true, opacity: 0.6 })
    const frame = bm('#e2578f')
    for (const sx of [-1, 1]) {
      const m = new THREE.Mesh(hg, lens)
      m.position.set(sx * 0.155, 0.0, 0)
      m.scale.setScalar(1.25)
      m.rotation.y = sx * 0.2
      heartGlasses.add(m)
    }
    const bridge = new THREE.Mesh(GEO.box, frame)
    bridge.scale.set(0.07, 0.012, 0.012)
    bridge.position.set(0, 0.02, 0.01)
    heartGlasses.add(bridge)
  }
  heartGlasses.visible = false

  return { root, model, body, head, ears, eyes, happyEyes, legs, tail, crown, heartGlasses, materials, bodyY }
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
