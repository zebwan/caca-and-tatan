/**
 * Instanced trees, bushes, rocks, mushrooms, flowers and grass for any region.
 * Each kind is one or two draw calls regardless of count.
 */
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { addWind, instanceGlow, toonRamp } from '../materials'
import { sphereAt, TREES, type TreeKind } from './treeKinds'

export interface TreeSpot { x: number; z: number; y: number; s: number; rot: number; kind: TreeKind; collide: boolean }
export interface PropSpot { x: number; z: number; y: number; s: number; rot: number; tint: number }
export interface Scatter {
  trees: TreeSpot[]
  rocks: PropSpot[]
  bushes: PropSpot[]
  flowers: PropSpot[]
  grass: PropSpot[]
  mushrooms: PropSpot[]
}

export interface VegetationPalette {
  grassBase: string
  grassTip: string
  grassTints: string[]
  flowerColors: string[]
  bushColors: string[]
  rockColors: string[]
  capColors: string[]
  capGlow: number
  stem: string
}

export const MEADOW_PALETTE: VegetationPalette = {
  grassBase: '#93c97a',
  grassTip: '#dcf2b6',
  grassTints: ['#ffffff', '#f4fbe8', '#fff3f6', '#eaf6dc'],
  flowerColors: ['#ffc4d8', '#ffffff', '#f7a8c6', '#ffd6b8', '#dccbff', '#ffe3ef', '#fff2b8'],
  bushColors: ['#a2d28a', '#96c97f', '#b0da94', '#f6bcd2', '#ddeeb8'],
  rockColors: ['#e8e1db', '#ddd5e4', '#e9e2d4'],
  capColors: ['#f7a8c6', '#ffc8a8', '#cdb8f5'],
  capGlow: 0.25,
  stem: '#86bf6c',
}

const tmp = new THREE.Object3D()
const tmpColor = new THREE.Color()

function Trees({ kind, trees }: { kind: TreeKind; trees: TreeSpot[] }) {
  const style = TREES[kind]
  const trunkRef = useRef<THREE.InstancedMesh>(null)
  const canopyRef = useRef<THREE.InstancedMesh>(null)
  const accentRef = useRef<THREE.InstancedMesh>(null)
  const parts = useMemo(() => {
    const canopyMat = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: toonRamp })
    if (style.canopyEmissive) {
      canopyMat.emissive.set('#ffffff')
      canopyMat.emissiveIntensity = style.canopyEmissive
      instanceGlow(canopyMat)
    }
    if ((style.sway ?? 0.05) > 0) addWind(canopyMat, style.sway ?? 0.05, 0.25)
    const accentMat = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: toonRamp })
    if (style.accentEmissive) {
      accentMat.emissive.set('#ffffff')
      accentMat.emissiveIntensity = style.accentEmissive * 0.5
      instanceGlow(accentMat)
    }
    return {
      trunkGeo: style.trunk(),
      canopyGeo: style.canopy(),
      accentGeo: style.accent?.(),
      trunkMat: new THREE.MeshToonMaterial({ color: style.trunkColor, gradientMap: toonRamp }),
      canopyMat,
      accentMat,
    }
  }, [style])

  useLayoutEffect(() => {
    const meshes = [trunkRef.current, canopyRef.current, accentRef.current].filter(Boolean) as THREE.InstancedMesh[]
    trees.forEach((t, i) => {
      tmp.position.set(t.x, t.y - 0.1, t.z)
      tmp.rotation.set(0, t.rot, 0)
      tmp.scale.setScalar(t.s)
      tmp.updateMatrix()
      for (const m of meshes) m.setMatrixAt(i, tmp.matrix)
      canopyRef.current!.setColorAt(i, tmpColor.set(style.colors[i % style.colors.length]))
      if (accentRef.current && style.accentColors) accentRef.current.setColorAt(i, tmpColor.set(style.accentColors[i % style.accentColors.length]))
    })
    for (const m of meshes) {
      m.instanceMatrix.needsUpdate = true
      if (m.instanceColor) m.instanceColor.needsUpdate = true
      m.computeBoundingSphere()
    }
  }, [trees, style])

  return (
    <>
      <instancedMesh ref={trunkRef} args={[parts.trunkGeo, parts.trunkMat, trees.length]} castShadow receiveShadow />
      <instancedMesh ref={canopyRef} args={[parts.canopyGeo, parts.canopyMat, trees.length]} castShadow />
      {parts.accentGeo && <instancedMesh ref={accentRef} args={[parts.accentGeo, parts.accentMat, trees.length]} />}
    </>
  )
}

export function Props({ spots, geo, mat, colors, scale, castShadow = true }: {
  spots: PropSpot[]
  geo: THREE.BufferGeometry
  mat: THREE.Material
  colors: string[]
  scale: (s: number) => [number, number, number]
  castShadow?: boolean
}) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    if (!ref.current) return
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
  if (!spots.length) return null
  return <instancedMesh ref={ref} args={[geo, mat, spots.length]} castShadow={castShadow} receiveShadow />
}

const sc1 = (s: number) => [s, s, s] as [number, number, number]
const scGrass = (s: number) => [s, s * 1.1, s] as [number, number, number]
const scRock = (s: number) => [s * 0.95, s * 0.62, s * 0.85] as [number, number, number]
const scMush = (s: number) => [s * 1.4, s * 1.4, s * 1.4] as [number, number, number]

function Grass({ spots, p }: { spots: PropSpot[]; p: VegetationPalette }) {
  const { geo, mat } = useMemo(() => {
    const verts: number[] = []
    const cols: number[] = []
    const base = new THREE.Color(p.grassBase), tip = new THREE.Color(p.grassTip)
    for (let b = 0; b < 3; b++) {
      const a = (b / 3) * Math.PI + 0.3
      const ca = Math.cos(a), sa = Math.sin(a)
      const lean = (b - 1) * 0.12
      const w = 0.06, h = 0.27 + b * 0.05
      const push = (px: number, py: number) => {
        const off = (py / h) * (py / h) * lean
        verts.push(px * ca + off * sa, py, px * sa - off * ca)
        const c = base.clone().lerp(tip, py / h)
        cols.push(c.r, c.g, c.b)
      }
      const y1 = h * 0.55
      for (const [px, py] of [[-w, 0], [w, 0], [w * 0.6, y1], [-w, 0], [w * 0.6, y1], [-w * 0.6, y1], [-w * 0.6, y1], [w * 0.6, y1], [0, h]]) push(px, py)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
    const n = new Float32Array(verts.length)
    for (let i = 0; i < n.length; i += 3) n[i + 1] = 1
    g.setAttribute('normal', new THREE.BufferAttribute(n, 3))
    const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })
    addWind(m, 0.35, 1.6)
    return { geo: g, mat: m }
  }, [p.grassBase, p.grassTip])
  return <Props spots={spots} geo={geo} mat={mat} colors={p.grassTints} scale={scGrass} castShadow={false} />
}

function Flowers({ spots, p }: { spots: PropSpot[]; p: VegetationPalette }) {
  const { stemGeo, headGeo, stemMat, headMat } = useMemo(() => {
    const stem = new THREE.CylinderGeometry(0.018, 0.022, 0.38, 4, 1)
    stem.translate(0, 0.19, 0)
    const parts: THREE.BufferGeometry[] = []
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2
      const pg = new THREE.SphereGeometry(0.075, 6, 4)
      pg.scale(1, 0.35, 0.7)
      pg.translate(Math.cos(a) * 0.075, 0.4, Math.sin(a) * 0.075)
      pg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(pg.attributes.position.count * 3).fill(1), 3))
      parts.push(pg)
    }
    const center = new THREE.SphereGeometry(0.04, 6, 4)
    center.translate(0, 0.42, 0)
    const cc = new Float32Array(center.attributes.position.count * 3)
    for (let i = 0; i < cc.length; i += 3) cc.set([1, 0.88, 0.45], i)
    center.setAttribute('color', new THREE.BufferAttribute(cc, 3))
    parts.push(center)
    const sm = new THREE.MeshLambertMaterial({ color: p.stem })
    const hm = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: '#3a2a30', emissiveIntensity: 0.25 })
    addWind(sm, 0.25, 2.2)
    addWind(hm, 0.25, 2.2)
    return { stemGeo: stem, headGeo: mergeGeometries(parts)!, stemMat: sm, headMat: hm }
  }, [p.stem])
  const white = useMemo(() => ['#ffffff'], [])
  return (
    <>
      <Props spots={spots} geo={stemGeo} mat={stemMat} colors={white} scale={sc1} castShadow={false} />
      <Props spots={spots} geo={headGeo} mat={headMat} colors={p.flowerColors} scale={sc1} castShadow={false} />
    </>
  )
}

export function Vegetation({ scatter, palette = MEADOW_PALETTE }: { scatter: Scatter; palette?: VegetationPalette }) {
  const byKind = useMemo(() => {
    const out: Partial<Record<TreeKind, TreeSpot[]>> = {}
    for (const t of scatter.trees) (out[t.kind] ??= []).push(t)
    return out
  }, [scatter])

  const geos = useMemo(() => {
    const bush = mergeGeometries([sphereAt(0, 0.45, 0, 0.75), sphereAt(0.55, 0.35, 0.2, 0.5), sphereAt(-0.5, 0.35, -0.15, 0.55), sphereAt(0.1, 0.4, 0.55, 0.45)])!
    const bushMat = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: toonRamp })
    addWind(bushMat, 0.03, 0.6)
    const rock = new THREE.IcosahedronGeometry(1, 1)
    const rp = rock.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < rp.count; i++) {
      const k = 1 + Math.sin(rp.getX(i) * 5.1 + rp.getZ(i) * 3.3) * 0.08
      rp.setXYZ(i, rp.getX(i) * k, rp.getY(i) * k, rp.getZ(i) * k)
    }
    rock.computeVertexNormals()
    const stem = new THREE.CylinderGeometry(0.06, 0.08, 0.22, 8)
    stem.translate(0, 0.11, 0)
    const cap = new THREE.SphereGeometry(0.17, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2)
    cap.scale(1, 0.75, 1)
    cap.translate(0, 0.2, 0)
    return {
      bush, bushMat, rock,
      rockMat: new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: toonRamp }),
      stem, cap,
      stemMat: new THREE.MeshToonMaterial({ color: '#fff4e6', gradientMap: toonRamp }),
      capMat: instanceGlow(new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: toonRamp, emissive: '#ffffff', emissiveIntensity: palette.capGlow })),
    }
  }, [palette.capGlow])
  const white = useMemo(() => ['#ffffff'], [])

  return (
    <group>
      {(Object.keys(byKind) as TreeKind[]).map((k) => (
        <Trees key={k} kind={k} trees={byKind[k]!} />
      ))}
      <Props spots={scatter.bushes} geo={geos.bush} mat={geos.bushMat} colors={palette.bushColors} scale={sc1} />
      <Props spots={scatter.rocks} geo={geos.rock} mat={geos.rockMat} colors={palette.rockColors} scale={scRock} />
      <Props spots={scatter.mushrooms} geo={geos.stem} mat={geos.stemMat} colors={white} scale={scMush} castShadow={false} />
      <Props spots={scatter.mushrooms} geo={geos.cap} mat={geos.capMat} colors={palette.capColors} scale={scMush} castShadow={false} />
      <Flowers spots={scatter.flowers} p={palette} />
      <Grass spots={scatter.grass} p={palette} />
    </group>
  )
}
