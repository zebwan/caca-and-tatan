/**
 * Instanced trees, bushes, rocks, mushrooms, flowers and grass.
 * Each kind is one or two draw calls regardless of count.
 */
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { meadowScatter, type PropSpot, type TreeKind, type TreeSpot } from './scatter'
import { addWind, toonRamp } from '../materials'

const tmp = new THREE.Object3D()
const tmpColor = new THREE.Color()

function sphereAt(x: number, y: number, z: number, r: number, sy = 1, seg = 12) {
  const g = new THREE.SphereGeometry(r, seg, Math.max(6, Math.floor(seg * 0.7)))
  g.scale(1, sy, 1)
  g.translate(x, y, z)
  return g
}
function cyl(rt: number, rb: number, h: number, x: number, y: number, z: number, rx = 0, rz = 0) {
  const g = new THREE.CylinderGeometry(rt, rb, h, 8, 1)
  g.translate(0, h / 2, 0)
  g.rotateX(rx)
  g.rotateZ(rz)
  g.translate(x, y, z)
  return g
}

const TRUNKS: Record<TreeKind, () => THREE.BufferGeometry> = {
  cherry: () =>
    mergeGeometries([cyl(0.2, 0.32, 2.9, 0, 0, 0, 0, 0.08), cyl(0.09, 0.14, 1.3, 0.1, 2.2, 0, 0, -0.85), cyl(0.08, 0.13, 1.2, -0.05, 2.0, 0.1, 0.6, 0.7)])!,
  green: () => mergeGeometries([cyl(0.22, 0.34, 2.6, 0, 0, 0), cyl(0.09, 0.13, 1.1, 0, 1.9, 0, 0, 0.9)])!,
  lavender: () => mergeGeometries([cyl(0.16, 0.27, 3.4, 0, 0, 0)])!,
}
const CANOPIES: Record<TreeKind, () => THREE.BufferGeometry> = {
  cherry: () =>
    mergeGeometries([
      sphereAt(0, 3.5, 0, 1.65, 0.85),
      sphereAt(1.3, 3.15, 0.35, 1.15, 0.85),
      sphereAt(-1.25, 3.2, -0.25, 1.2, 0.85),
      sphereAt(0.3, 3.3, 1.2, 1.05, 0.85),
      sphereAt(-0.4, 3.3, -1.2, 1.05, 0.85),
      sphereAt(0.35, 4.35, -0.1, 1.05, 0.85),
    ])!,
  green: () =>
    mergeGeometries([
      sphereAt(0, 3.35, 0, 1.8, 0.92),
      sphereAt(1.05, 2.85, 0.4, 1.15),
      sphereAt(-1.0, 2.95, -0.35, 1.2),
      sphereAt(0.15, 4.3, 0.1, 1.1),
    ])!,
  lavender: () =>
    mergeGeometries([sphereAt(0, 2.7, 0, 1.45, 0.8), sphereAt(0, 3.75, 0, 1.15, 0.85), sphereAt(0, 4.65, 0, 0.75, 0.95)])!,
}
const CANOPY_COLORS: Record<TreeKind, string[]> = {
  cherry: ['#f8c0d4', '#f6b3ca', '#fbd0de', '#f4a9c3'],
  green: ['#a6d48a', '#9bcd85', '#b3dc92'],
  lavender: ['#cdbdf2', '#c2b0ec', '#d8cbf6'],
}

function Trees({ kind, trees }: { kind: TreeKind; trees: TreeSpot[] }) {
  const trunkRef = useRef<THREE.InstancedMesh>(null)
  const canopyRef = useRef<THREE.InstancedMesh>(null)
  const { trunkGeo, canopyGeo, trunkMat, canopyMat } = useMemo(() => {
    const canopyMat = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: toonRamp })
    addWind(canopyMat, 0.05, 0.25)
    return {
      trunkGeo: TRUNKS[kind](),
      canopyGeo: CANOPIES[kind](),
      trunkMat: new THREE.MeshToonMaterial({ color: kind === 'lavender' ? '#a58fa5' : '#b58a72', gradientMap: toonRamp }),
      canopyMat,
    }
  }, [kind])

  useLayoutEffect(() => {
    const cols = CANOPY_COLORS[kind]
    trees.forEach((t, i) => {
      tmp.position.set(t.x, t.y - 0.1, t.z)
      tmp.rotation.set(0, t.rot, 0)
      tmp.scale.setScalar(t.s)
      tmp.updateMatrix()
      trunkRef.current!.setMatrixAt(i, tmp.matrix)
      canopyRef.current!.setMatrixAt(i, tmp.matrix)
      canopyRef.current!.setColorAt(i, tmpColor.set(cols[i % cols.length]))
    })
    for (const r of [trunkRef.current!, canopyRef.current!]) {
      r.instanceMatrix.needsUpdate = true
      r.computeBoundingSphere()
    }
    if (canopyRef.current!.instanceColor) canopyRef.current!.instanceColor.needsUpdate = true
  }, [trees, kind])

  return (
    <>
      <instancedMesh ref={trunkRef} args={[trunkGeo, trunkMat, trees.length]} castShadow receiveShadow />
      <instancedMesh ref={canopyRef} args={[canopyGeo, canopyMat, trees.length]} castShadow />
    </>
  )
}

function Props({ spots, geo, mat, colors, scale, castShadow = true }: {
  spots: PropSpot[]
  geo: THREE.BufferGeometry
  mat: THREE.Material
  colors: string[]
  scale: (s: number) => [number, number, number]
  castShadow?: boolean
}) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    spots.forEach((p, i) => {
      tmp.position.set(p.x, p.y, p.z)
      tmp.rotation.set(0, p.rot, 0)
      tmp.scale.set(...scale(p.s))
      tmp.updateMatrix()
      ref.current!.setMatrixAt(i, tmp.matrix)
      ref.current!.setColorAt(i, tmpColor.set(colors[Math.floor(p.tint * colors.length) % colors.length]))
    })
    ref.current!.instanceMatrix.needsUpdate = true
    if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true
    ref.current!.computeBoundingSphere()
  }, [spots, colors, scale])
  return <instancedMesh ref={ref} args={[geo, mat, spots.length]} castShadow={castShadow} receiveShadow />
}

function Grass({ spots }: { spots: PropSpot[] }) {
  const { geo, mat } = useMemo(() => {
    // a tuft of three tapered blades with a dark base and light tip
    const verts: number[] = []
    const cols: number[] = []
    const base = new THREE.Color('#93c97a'), tip = new THREE.Color('#dcf2b6')
    for (let b = 0; b < 3; b++) {
      const a = (b / 3) * Math.PI + 0.3
      const ca = Math.cos(a), sa = Math.sin(a)
      const lean = (b - 1) * 0.12
      const w = 0.06, h = 0.27 + b * 0.05
      const quad = (y0: number, y1: number, w0: number, w1: number) => {
        const p = [
          [-w0, y0], [w0, y0], [w1, y1],
          [-w0, y0], [w1, y1], [-w1, y1],
        ]
        for (const [px, py] of p) {
          const off = (py / h) * (py / h) * lean
          verts.push(px * ca + off * sa, py, px * sa - off * ca)
          const c = base.clone().lerp(tip, py / h)
          cols.push(c.r, c.g, c.b)
        }
      }
      quad(0, h * 0.55, w, w * 0.6)
      // tip triangle
      const y0 = h * 0.55
      const tri = [[-w * 0.6, y0], [w * 0.6, y0], [0, h]]
      for (const [px, py] of tri) {
        const off = (py / h) * (py / h) * lean
        verts.push(px * ca + off * sa, py, px * sa - off * ca)
        const c = base.clone().lerp(tip, py / h)
        cols.push(c.r, c.g, c.b)
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
    g.computeVertexNormals()
    // point normals up so blades are lit like the ground
    const n = g.attributes.normal as THREE.BufferAttribute
    for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0)
    const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })
    addWind(m, 0.35, 1.6)
    return { geo: g, mat: m }
  }, [])
  const colors = useMemo(() => ['#ffffff', '#f4fbe8', '#fff3f6', '#eaf6dc'], [])
  const scale = useMemo(() => (s: number) => [s, s * 1.1, s] as [number, number, number], [])
  return <Props spots={spots} geo={geo} mat={mat} colors={colors} scale={scale} castShadow={false} />
}

function Flowers({ spots }: { spots: PropSpot[] }) {
  const { stemGeo, headGeo, stemMat, headMat } = useMemo(() => {
    const stem = new THREE.CylinderGeometry(0.018, 0.022, 0.38, 4, 1)
    stem.translate(0, 0.19, 0)
    const parts: THREE.BufferGeometry[] = []
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2
      const p = new THREE.SphereGeometry(0.075, 6, 4)
      p.scale(1, 0.35, 0.7)
      p.translate(Math.cos(a) * 0.075, 0.4, Math.sin(a) * 0.075)
      const c = new Float32Array(p.attributes.position.count * 3).fill(1)
      p.setAttribute('color', new THREE.BufferAttribute(c, 3))
      parts.push(p)
    }
    const center = new THREE.SphereGeometry(0.04, 6, 4)
    center.translate(0, 0.42, 0)
    const cc = new Float32Array(center.attributes.position.count * 3)
    for (let i = 0; i < cc.length; i += 3) cc.set([1, 0.88, 0.45], i)
    center.setAttribute('color', new THREE.BufferAttribute(cc, 3))
    parts.push(center)
    const head = mergeGeometries(parts)!
    const sm = new THREE.MeshLambertMaterial({ color: '#86bf6c' })
    const hm = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: '#3a2a30', emissiveIntensity: 0.25 })
    addWind(sm, 0.25, 2.2)
    addWind(hm, 0.25, 2.2)
    return { stemGeo: stem, headGeo: head, stemMat: sm, headMat: hm }
  }, [])
  const headColors = useMemo(() => ['#ffc4d8', '#ffffff', '#f7a8c6', '#ffd6b8', '#dccbff', '#ffe3ef', '#fff2b8'], [])
  const stemColors = useMemo(() => ['#ffffff'], [])
  const scale = useMemo(() => (s: number) => [s, s, s] as [number, number, number], [])
  return (
    <>
      <Props spots={spots} geo={stemGeo} mat={stemMat} colors={stemColors} scale={scale} castShadow={false} />
      <Props spots={spots} geo={headGeo} mat={headMat} colors={headColors} scale={scale} castShadow={false} />
    </>
  )
}

export function Vegetation() {
  const sc = meadowScatter()
  const byKind = useMemo(() => {
    const out: Record<TreeKind, TreeSpot[]> = { cherry: [], green: [], lavender: [] }
    for (const t of sc.trees) out[t.kind].push(t)
    return out
  }, [sc])

  const bush = useMemo(() => {
    const g = mergeGeometries([sphereAt(0, 0.45, 0, 0.75), sphereAt(0.55, 0.35, 0.2, 0.5), sphereAt(-0.5, 0.35, -0.15, 0.55), sphereAt(0.1, 0.4, 0.55, 0.45)])!
    const m = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: toonRamp })
    addWind(m, 0.03, 0.6)
    return { g, m }
  }, [])
  const rock = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, 1)
    const p = g.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < p.count; i++) {
      const k = 1 + Math.sin(p.getX(i) * 5.1 + p.getZ(i) * 3.3) * 0.08
      p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k)
    }
    g.computeVertexNormals()
    return { g, m: new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: toonRamp }) }
  }, [])
  const mush = useMemo(() => {
    const stem = new THREE.CylinderGeometry(0.06, 0.08, 0.22, 8)
    stem.translate(0, 0.11, 0)
    const cap = new THREE.SphereGeometry(0.17, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2)
    cap.scale(1, 0.75, 1)
    cap.translate(0, 0.2, 0)
    return {
      stem,
      cap,
      sm: new THREE.MeshToonMaterial({ color: '#fff4e6', gradientMap: toonRamp }),
      cm: new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: toonRamp, emissive: '#ff9fc4', emissiveIntensity: 0.25 }),
    }
  }, [])

  const bushColors = useMemo(() => ['#a2d28a', '#96c97f', '#b0da94', '#f6bcd2', '#ddeeb8'], [])
  const rockColors = useMemo(() => ['#e8e1db', '#ddd5e4', '#e9e2d4'], [])
  const capColors = useMemo(() => ['#f7a8c6', '#ffc8a8', '#cdb8f5'], [])
  const white = useMemo(() => ['#ffffff'], [])
  const bushScale = useMemo(() => (s: number) => [s, s, s] as [number, number, number], [])
  const rockScale = useMemo(() => (s: number) => [s * 0.95, s * 0.62, s * 0.85] as [number, number, number], [])
  const mushScale = useMemo(() => (s: number) => [s * 1.4, s * 1.4, s * 1.4] as [number, number, number], [])

  return (
    <group>
      {(Object.keys(byKind) as TreeKind[]).map((k) => (
        <Trees key={k} kind={k} trees={byKind[k]} />
      ))}
      <Props spots={sc.bushes} geo={bush.g} mat={bush.m} colors={bushColors} scale={bushScale} />
      <Props spots={sc.rocks} geo={rock.g} mat={rock.m} colors={rockColors} scale={rockScale} />
      <Props spots={sc.mushrooms} geo={mush.stem} mat={mush.sm} colors={white} scale={mushScale} castShadow={false} />
      <Props spots={sc.mushrooms} geo={mush.cap} mat={mush.cm} colors={capColors} scale={mushScale} castShadow={false} />
      <Flowers spots={sc.flowers} />
      <Grass spots={sc.grass} />
    </group>
  )
}
