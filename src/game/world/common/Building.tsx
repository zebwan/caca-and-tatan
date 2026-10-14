/** A cosy pastel cottage built from simple shapes, reused for every house, shop and hut. */
import { useMemo } from 'react'
import * as THREE from 'three'
import { GEO, lampMaterial, toon } from '../materials'

type V3 = [number, number, number]
const Box = ({ s, p, r = [0, 0, 0], c, shadow = true }: { s: V3; p: V3; r?: V3; c: string; shadow?: boolean }) => (
  <mesh geometry={GEO.box} material={toon(c)} scale={s} position={p} rotation={r} castShadow={shadow} receiveShadow />
)
const Ball = ({ s, p, c }: { s: number; p: V3; c: string }) => <mesh geometry={GEO.sphere} material={toon(c)} scale={s} position={p} />

export interface BuildingProps {
  x: number
  z: number
  y: number
  yaw: number
  w: number
  d: number
  wall: string
  roof: string
  trim?: string
  door?: string
  /** Shop awning colour (stripes). */
  awning?: string
  /** Hanging sign: colour + a simple glyph. */
  sign?: { color: string; glyph: 'bread' | 'letter' | 'bow' | 'chair' | 'heart' }
  chimney?: boolean
  flowerBoxes?: boolean
  height?: number
  /** Windows glow in the evening. */
  glowWindows?: boolean
}

const roofGeo = (() => {
  const g = new THREE.CylinderGeometry(1, 1, 1, 3, 1, false, Math.PI / 2)
  g.rotateZ(Math.PI / 2)
  return g
})()

export function Building(p: BuildingProps) {
  const h = p.height ?? 2.6
  const trim = p.trim ?? '#e8b9a6'
  const flower = ['#f7a8c6', '#ffffff', '#ffc59e', '#e9a0d8']
  const winMat = p.glowWindows === false ? toon('#cfe8fb') : lampMaterial('#d8ecff', '#ffd9a8')
  const awningStripes = useMemo(() => Array.from({ length: Math.max(3, Math.round(p.w / 0.9)) }, (_, i) => i), [p.w])
  const halfW = p.w / 2, halfD = p.d / 2
  return (
    <group position={[p.x, p.y, p.z]} rotation={[0, p.yaw, 0]}>
      <Box s={[p.w + 0.4, 0.35, p.d + 0.4]} p={[0, 0.1, 0]} c="#e5d9cc" />
      <Box s={[p.w, h, p.d]} p={[0, h / 2 + 0.25, 0]} c={p.wall} />
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Box key={`${sx}${sz}`} s={[0.2, h, 0.2]} p={[sx * (halfW - 0.05), h / 2 + 0.25, sz * (halfD - 0.05)]} c={trim} />))}
      <Box s={[p.w + 0.1, 0.16, p.d + 0.1]} p={[0, h + 0.25, 0]} c={trim} />
      <mesh geometry={roofGeo} material={toon(p.roof)} scale={[p.w + 0.9, 1.6 + p.d * 0.07, halfD + 1.05]} position={[0, h + 1.05, 0]} castShadow receiveShadow />
      <mesh geometry={roofGeo} material={toon(p.wall)} scale={[p.w + 0.02, 1.3 + p.d * 0.05, halfD + 0.4]} position={[0, h + 0.88, 0]} />
      {p.chimney !== false && (
        <>
          <Box s={[0.6, 1.8, 0.6]} p={[halfW * 0.55, h + 1.7, -halfD * 0.4]} c="#f1c9b6" />
          <Box s={[0.75, 0.18, 0.75]} p={[halfW * 0.55, h + 2.6, -halfD * 0.4]} c="#e3b39f" />
        </>
      )}
      {/* door */}
      <Box s={[1.1, 1.8, 0.12]} p={[0, 1.15, halfD + 0.02]} c={p.door ?? '#d69a86'} />
      <Ball s={0.07} p={[0.34, 1.15, halfD + 0.1]} c="#f7d774" />
      {/* front windows */}
      {[-1, 1].map((sx) => (
        <group key={sx} position={[sx * Math.min(halfW - 0.9, 1.9), 1.55, halfD + 0.02]}>
          <Box s={[1.0, 0.9, 0.1]} p={[0, 0, 0]} c="#ffffff" />
          <mesh geometry={GEO.box} material={winMat} scale={[0.82, 0.72, 0.12]} position={[0, 0, 0.01]} />
          <Box s={[0.05, 0.72, 0.14]} p={[0, 0, 0.02]} c="#ffffff" shadow={false} />
          {p.flowerBoxes !== false && (
            <>
              <Box s={[1.05, 0.22, 0.32]} p={[0, -0.6, 0.15]} c="#e2a98f" />
              {[-0.36, -0.12, 0.12, 0.36].map((fx, i) => (
                <Ball key={fx} s={0.11} p={[fx, -0.42, 0.18]} c={flower[i % 4]} />
              ))}
            </>
          )}
        </group>
      ))}
      {/* side windows */}
      {[-1, 1].map((sx) => (
        <group key={sx} position={[sx * (halfW + 0.02), 1.6, 0]} rotation={[0, (sx * Math.PI) / 2, 0]}>
          <Box s={[0.9, 0.8, 0.08]} p={[0, 0, 0]} c="#ffffff" />
          <mesh geometry={GEO.box} material={winMat} scale={[0.72, 0.62, 0.1]} position={[0, 0, 0.01]} />
        </group>
      ))}
      <mesh geometry={GEO.cylinder} material={toon('#e6dccf')} scale={[0.9, 0.12, 0.6]} position={[0, 0.12, halfD + 0.55]} />
      {p.awning && (
        <group position={[0, 2.45, halfD + 0.45]} rotation={[0.45, 0, 0]}>
          {awningStripes.map((i) => (
            <Box key={i} s={[p.w / awningStripes.length + 0.01, 0.05, 1.0]} p={[-halfW + (i + 0.5) * (p.w / awningStripes.length), 0, 0]} c={i % 2 ? '#ffffff' : p.awning!} />
          ))}
        </group>
      )}
      {p.sign && (
        <group position={[halfW - 0.2, 2.25, halfD + 0.7]}>
          <Box s={[0.06, 0.06, 0.9]} p={[0, 0.2, -0.3]} c="#b98a66" />
          <mesh geometry={GEO.cylinder} material={toon(p.sign.color)} scale={[0.42, 0.08, 0.42]} rotation={[Math.PI / 2, 0, Math.PI / 2]} position={[0, -0.2, 0.05]} castShadow />
          <SignGlyph glyph={p.sign.glyph} />
        </group>
      )}
    </group>
  )
}

function SignGlyph({ glyph }: { glyph: NonNullable<BuildingProps['sign']>['glyph'] }) {
  const c = toon('#fffaf3')
  switch (glyph) {
    case 'bread':
      return <mesh geometry={GEO.sphere} material={toon('#e9b77f')} scale={[0.22, 0.12, 0.05]} position={[0.06, -0.2, 0.05]} rotation={[0, Math.PI / 2, 0]} />
    case 'letter':
      return <mesh geometry={GEO.box} material={c} scale={[0.05, 0.2, 0.3]} position={[0.06, -0.2, 0.05]} />
    case 'bow':
      return (
        <group position={[0.07, -0.2, 0.05]} rotation={[0, Math.PI / 2, 0]}>
          {[-1, 1].map((sx) => (
            <mesh key={sx} geometry={GEO.cone} material={toon('#f27aa6')} scale={[0.09, 0.15, 0.04]} position={[sx * 0.08, 0, 0]} rotation={[0, 0, (sx * Math.PI) / 2]} />
          ))}
        </group>
      )
    case 'chair':
      return <mesh geometry={GEO.box} material={toon('#c99a72')} scale={[0.05, 0.22, 0.2]} position={[0.06, -0.2, 0.05]} />
    default:
      return <mesh geometry={GEO.sphere} material={toon('#f27aa6')} scale={[0.05, 0.15, 0.15]} position={[0.06, -0.2, 0.05]} />
  }
}

/** A glowing street lamp. */
export function Lamp({ x, z, y }: { x: number; z: number; y: number }) {
  return (
    <group position={[x, y, z]}>
      <mesh geometry={GEO.cylinder} material={toon('#f0e6f4')} scale={[0.08, 1.9, 0.08]} position={[0, 0.95, 0]} castShadow />
      <mesh geometry={GEO.cylinder} material={toon('#e5d9e8')} scale={[0.18, 0.1, 0.18]} position={[0, 0.05, 0]} />
      <mesh geometry={GEO.sphere} material={lampMaterial()} scale={[0.22, 0.26, 0.22]} position={[0, 2.05, 0]} />
      <mesh geometry={GEO.cone} material={toon('#f392b4')} scale={[0.3, 0.22, 0.3]} position={[0, 2.38, 0]} castShadow />
    </group>
  )
}

/** A string of little pennant flags between two points. */
export function Bunting({ a, b, y, colors = ['#f7a8c6', '#ffffff', '#ffc59e', '#cdb8f5', '#9cc3ea'] }: { a: [number, number]; b: [number, number]; y: number; colors?: string[] }) {
  const n = Math.max(6, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.8))
  const yaw = Math.atan2(b[0] - a[0], b[1] - a[1])
  const flagGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.12, 0, 0, 0.12, 0, 0, 0, -0.24, 0], 3))
    g.computeVertexNormals()
    return g
  }, [])
  return (
    <group>
      {Array.from({ length: n }, (_, i) => {
        const t = (i + 0.5) / n
        const sag = Math.sin(t * Math.PI) * 0.6
        return (
          <mesh
            key={i}
            geometry={flagGeo}
            position={[a[0] + (b[0] - a[0]) * t, y - sag, a[1] + (b[1] - a[1]) * t]}
            rotation={[0, yaw + Math.PI / 2, 0]}
          >
            <meshToonMaterial color={colors[i % colors.length]} side={THREE.DoubleSide} />
          </mesh>
        )
      })}
    </group>
  )
}
