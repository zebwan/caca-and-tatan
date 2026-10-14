/** Static hand-placed props: cottage, bridge, stepping stones, lily pads, bench, picnic, lamps, standing stones. */
import { useMemo } from 'react'
import * as THREE from 'three'
import { MEADOW } from './layout'
import { terrainHeight, WATER_LEVEL } from './terrain'
import { bridgeDeckY } from './physics'
import { GEO, toon } from '../materials'

type V3 = [number, number, number]

function Box({ s, p, r = [0, 0, 0], c, shadow = true }: { s: V3; p: V3; r?: V3; c: string; shadow?: boolean }) {
  return <mesh geometry={GEO.box} material={toon(c)} scale={s} position={p} rotation={r} castShadow={shadow} receiveShadow />
}
function Ball({ s, p, c, shadow = true, e }: { s: V3 | number; p: V3; c: string; shadow?: boolean; e?: string }) {
  const sc: V3 = typeof s === 'number' ? [s, s, s] : s
  return <mesh geometry={GEO.sphere} material={toon(c, e, 0.6)} scale={sc} position={p} castShadow={shadow} receiveShadow />
}
function Cyl({ s, p, r = [0, 0, 0], c, shadow = true }: { s: V3; p: V3; r?: V3; c: string; shadow?: boolean }) {
  return <mesh geometry={GEO.cylinder} material={toon(c)} scale={s} position={p} rotation={r} castShadow={shadow} receiveShadow />
}

function Cottage() {
  const c = MEADOW.cottage
  const y = terrainHeight(c.x, c.z)
  const roof = useMemo(() => {
    const g = new THREE.CylinderGeometry(1, 1, 1, 3, 1, false, Math.PI / 2)
    g.rotateZ(Math.PI / 2)
    return g
  }, [])
  const flowerCols = ['#f7a8c6', '#ffffff', '#ffc59e', '#e9a0d8']
  return (
    <group position={[c.x, y, c.z]} rotation={[0, c.yaw, 0]}>
      <Box s={[6.4, 0.35, 5.4]} p={[0, 0.1, 0]} c="#e5d9cc" />
      <Box s={[6.0, 2.6, 5.0]} p={[0, 1.55, 0]} c="#fff3e4" />
      {/* timber corners */}
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Box key={`${sx}${sz}`} s={[0.22, 2.6, 0.22]} p={[sx * 2.95, 1.55, sz * 2.45]} c="#e8b9a6" />))}
      <Box s={[6.1, 0.18, 5.1]} p={[0, 2.85, 0]} c="#e8b9a6" />
      {/* roof */}
      <mesh geometry={roof} material={toon('#f392b4')} scale={[6.9, 1.95, 3.55]} position={[0, 3.85, 0]} castShadow receiveShadow />
      <mesh geometry={roof} material={toon('#fff3e4')} scale={[6.02, 1.6, 2.95]} position={[0, 3.62, 0]} />
      <Box s={[7.0, 0.16, 0.3]} p={[0, 5.78, 0]} c="#e07ca2" />
      {/* chimney */}
      <Box s={[0.7, 2.2, 0.7]} p={[1.9, 4.9, -1.1]} c="#f1c9b6" />
      <Box s={[0.85, 0.2, 0.85]} p={[1.9, 6.0, -1.1]} c="#e3b39f" />
      {/* door + round window */}
      <Box s={[1.15, 1.85, 0.12]} p={[0, 1.2, 2.52]} c="#d69a86" />
      <Ball s={[0.07, 0.07, 0.07]} p={[0.36, 1.2, 2.6]} c="#f7d774" shadow={false} />
      {[-1, 1].map((sx) => (
        <mesh key={sx} geometry={GEO.circle} material={toon('#cfe8fb', '#cfe8fb', 0.3)} scale={0.42} position={[sx * 3.03, 3.65, 0]} rotation={[0, sx * Math.PI / 2, 0]} />
      ))}
      {/* windows with flower boxes */}
      {[-1, 1].map((sx) => (
        <group key={sx} position={[sx * 1.85, 1.65, 2.52]}>
          <Box s={[1.1, 0.95, 0.1]} p={[0, 0, 0]} c="#ffffff" />
          <Box s={[0.9, 0.75, 0.12]} p={[0, 0, 0.01]} c="#cfe8fb" shadow={false} />
          <Box s={[0.06, 0.75, 0.14]} p={[0, 0, 0.02]} c="#ffffff" shadow={false} />
          <Box s={[1.15, 0.25, 0.35]} p={[0, -0.62, 0.15]} c="#e2a98f" />
          {[-0.4, -0.15, 0.12, 0.38].map((fx, i) => (
            <Ball key={fx} s={0.12} p={[fx, -0.42, 0.18]} c={flowerCols[i % 4]} shadow={false} />
          ))}
        </group>
      ))}
      {/* side windows */}
      {[-1, 1].map((sx) => (
        <group key={sx} position={[sx * 3.02, 1.7, 0]} rotation={[0, sx * Math.PI / 2, 0]}>
          <Box s={[1.0, 0.9, 0.08]} p={[0, 0, 0]} c="#ffffff" />
          <Box s={[0.8, 0.7, 0.1]} p={[0, 0, 0.01]} c="#cfe8fb" shadow={false} />
        </group>
      ))}
      {/* doorstep + mailbox + barrel */}
      <Cyl s={[0.9, 0.12, 0.6]} p={[0, 0.12, 3.05]} c="#e6dccf" />
      <group position={[2.2, 0, 3.9]}>
        <Cyl s={[0.06, 1.0, 0.06]} p={[0, 0.5, 0]} c="#c99a72" />
        <Box s={[0.42, 0.3, 0.55]} p={[0, 1.1, 0]} c="#9cc3ea" />
        <Box s={[0.06, 0.2, 0.04]} p={[0.24, 1.25, 0.1]} c="#f27aa6" />
      </group>
      <group position={[-2.2, 0, 3.9]}>
        <Cyl s={[0.48, 0.95, 0.48]} p={[0, 0.48, 0]} c="#d5a57f" />
        <Cyl s={[0.5, 0.06, 0.5]} p={[0, 0.95, 0]} c="#b98a66" />
      </group>
    </group>
  )
}

function Bridge() {
  const br = MEADOW.bridge
  const planks = useMemo(() => {
    const out: { z: number; y: number; tilt: number }[] = []
    const n = 22
    for (let i = 0; i < n; i++) {
      const lz = -br.hd + ((i + 0.5) / n) * br.hd * 2
      const y = bridgeDeckY(lz)
      const dy = bridgeDeckY(lz + 0.05) - bridgeDeckY(lz - 0.05)
      out.push({ z: lz, y, tilt: Math.atan2(dy, 0.1) })
    }
    return out
  }, [br.hd])
  const posts = [-br.hd + 0.6, -br.hd / 3, br.hd / 3, br.hd - 0.6]
  return (
    <group position={[br.x, 0, br.z]}>
      {planks.map((p, i) => (
        <Box key={i} s={[br.hw * 2 + 0.1, 0.14, br.hd * 2 / 22 - 0.04]} p={[0, p.y - 0.07, p.z]} r={[-p.tilt, 0, 0]} c={i % 2 ? '#dcae86' : '#d3a37b'} />
      ))}
      {[-1, 1].map((sx) => (
        <group key={sx}>
          {posts.map((lz) => (
            <Cyl key={lz} s={[0.09, 0.9, 0.09]} p={[sx * (br.hw + 0.12), bridgeDeckY(lz) + 0.35, lz]} c="#b98a66" />
          ))}
          {posts.slice(0, -1).map((lz, i) => {
            const lz2 = posts[i + 1]
            const y1 = bridgeDeckY(lz) + 0.8, y2 = bridgeDeckY(lz2) + 0.8
            const len = Math.hypot(lz2 - lz, y2 - y1)
            return (
              <Box key={lz} s={[0.1, 0.1, len]} p={[sx * (br.hw + 0.12), (y1 + y2) / 2, (lz + lz2) / 2]} r={[-Math.atan2(y2 - y1, lz2 - lz), 0, 0]} c="#c99a72" />
            )
          })}
          {/* flower garland on the rail */}
          {[-0.8, 0, 0.8].map((lz, i) => (
            <Ball key={lz} s={0.11} p={[sx * (br.hw + 0.12), bridgeDeckY(lz) + 0.92, lz]} c={['#f7a8c6', '#ffffff', '#ffc59e'][i]} shadow={false} />
          ))}
        </group>
      ))}
    </group>
  )
}

function WaterDecor() {
  const pad = useMemo(() => new THREE.CircleGeometry(1, 20, 0.4, Math.PI * 2 - 0.5), [])
  const is = MEADOW.island
  return (
    <group>
      {MEADOW.stones.map((s, i) => (
        <group key={i} position={[s.x, 0, s.z]}>
          <Cyl s={[s.r, 1.4, s.r * 0.92]} p={[0, 0.62 - 0.7, 0]} c="#e4ddd5" />
          <Cyl s={[s.r * 0.75, 0.02, s.r * 0.7]} p={[0.05, 0.63, 0.05]} c="#bfdca4" shadow={false} />
        </group>
      ))}
      {MEADOW.lilyPads.map((p, i) => (
        <group key={i} position={[p.x, WATER_LEVEL + 0.06, p.z]} rotation={[-Math.PI / 2, 0, i * 1.7]}>
          <mesh geometry={pad} material={toon('#9fd38c')} scale={p.r} receiveShadow />
          {i === 1 && <Ball s={[0.18, 0.12, 0.18]} p={[0.3, 0.1, 0.08]} c="#f7a8c6" e="#f7a8c6" />}
        </group>
      ))}
      {/* a few decorative pads that are just for looks */}
      {[
        [-33.5, 14.5, 0.55],
        [-27.5, 22.5, 0.5],
        [-35, 20.5, 0.45],
      ].map(([x, z, r], i) => (
        <mesh key={i} geometry={pad} material={toon('#a9d996')} scale={r} position={[x, WATER_LEVEL + 0.05, z]} rotation={[-Math.PI / 2, 0, i * 2.3]} />
      ))}
      {/* island: a tiny cherry sapling and pebbles */}
      <group position={[is.x - 0.6, terrainHeight(is.x - 0.6, is.z - 0.5), is.z - 0.5]}>
        <Cyl s={[0.07, 0.9, 0.07]} p={[0, 0.45, 0]} c="#b58a72" />
        <Ball s={[0.55, 0.45, 0.55]} p={[0, 1.05, 0]} c="#f8c0d4" />
      </group>
      {/* reeds */}
      {Array.from({ length: 18 }, (_, i) => {
        const a = (i / 18) * Math.PI * 2 + (i % 3) * 0.2
        if (Math.cos(a) > 0.75) return null // keep the lily-pad shore open
        const r = MEADOW.pond.r + 0.25
        const x = MEADOW.pond.x + Math.cos(a) * r, z = MEADOW.pond.z + Math.sin(a) * r
        return (
          <group key={i} position={[x, WATER_LEVEL, z]}>
            <Cyl s={[0.025, 1.0, 0.025]} p={[0, 0.5, 0]} c="#8fbf6f" shadow={false} />
            <Cyl s={[0.025, 0.8, 0.025]} p={[0.12, 0.4, 0.05]} r={[0, 0, -0.15]} c="#8fbf6f" shadow={false} />
            <Cyl s={[0.05, 0.22, 0.05]} p={[0, 1.0, 0]} c="#c79a7a" shadow={false} />
          </group>
        )
      })}
    </group>
  )
}

function RockSteps() {
  return (
    <group>
      {MEADOW.rockSteps.map((s, i) => {
        const base = terrainHeight(s.x, s.z)
        const top = base + s.rise
        return (
          <group key={i} position={[s.x, 0, s.z]}>
            <mesh geometry={GEO.cylinder} material={toon('#dfd8d0')} scale={[s.r, top - base + 1.2, s.r]} position={[0, (top + base - 1.2) / 2, 0]} castShadow receiveShadow />
            <mesh geometry={GEO.cylinder} material={toon('#b5d99b')} scale={[s.r * 0.86, 0.06, s.r * 0.86]} position={[0, top + 0.01, 0]} receiveShadow />
          </group>
        )
      })}
    </group>
  )
}

function Bench() {
  const b = MEADOW.bench
  return (
    <group position={[b.x, terrainHeight(b.x, b.z), b.z]} rotation={[0, b.yaw, 0]}>
      <Box s={[2.0, 0.1, 0.55]} p={[0, 0.5, 0]} c="#dcae86" />
      <Box s={[2.0, 0.45, 0.08]} p={[0, 0.85, -0.25]} c="#d3a37b" />
      {[-0.85, 0.85].map((x) => (
        <group key={x}>
          <Box s={[0.1, 0.5, 0.5]} p={[x, 0.25, 0]} c="#b98a66" />
        </group>
      ))}
      <Ball s={[0.16, 0.14, 0.16]} p={[0.55, 0.62, 0.02]} c="#f3dca6" />
    </group>
  )
}

function Picnic() {
  const p = MEADOW.picnic
  const y = terrainHeight(p.x, p.z)
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#fff6f8'
    ctx.fillRect(0, 0, 64, 64)
    ctx.fillStyle = 'rgba(242,122,166,0.55)'
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(i * 16, 0, 8, 64)
      ctx.fillRect(0, i * 16, 64, 8)
    }
    const t = new THREE.CanvasTexture(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(2, 2)
    t.colorSpace = THREE.SRGBColorSpace
    t.magFilter = THREE.NearestFilter
    return t
  }, [])
  return (
    <group position={[p.x, y + 0.03, p.z]} rotation={[0, 0.4, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.6, 2.0]} />
        <meshLambertMaterial map={tex} />
      </mesh>
      <group position={[0.9, 0, -0.3]}>
        <Cyl s={[0.36, 0.42, 0.3]} p={[0, 0.21, 0]} c="#d5a57f" />
        <mesh geometry={new THREE.TorusGeometry(0.3, 0.035, 6, 20, Math.PI)} material={toon('#b98a66')} position={[0, 0.42, 0]} />
        <Ball s={[0.12, 0.1, 0.12]} p={[0.1, 0.48, 0.05]} c="#f27aa6" />
      </group>
      {[-0.45, -0.15].map((x, i) => (
        <Cyl key={x} s={[0.08, 0.16, 0.08]} p={[x, 0.08, 0.35]} c={i ? '#9cc3ea' : '#f7a8c6'} />
      ))}
    </group>
  )
}

function Lamps() {
  return (
    <group>
      {MEADOW.lamps.map((l, i) => {
        const y = terrainHeight(l.x, l.z)
        return (
          <group key={i} position={[l.x, y, l.z]}>
            <Cyl s={[0.08, 1.9, 0.08]} p={[0, 0.95, 0]} c="#f0e6f4" />
            <Cyl s={[0.18, 0.1, 0.18]} p={[0, 0.05, 0]} c="#e5d9e8" />
            <Ball s={[0.22, 0.26, 0.22]} p={[0, 2.05, 0]} c="#fff4d6" e="#ffd9a8" shadow={false} />
            <mesh geometry={GEO.cone} material={toon('#f392b4')} scale={[0.3, 0.22, 0.3]} position={[0, 2.38, 0]} castShadow />
          </group>
        )
      })}
    </group>
  )
}

function Signpost() {
  const s = MEADOW.signpost
  const y = terrainHeight(s.x, s.z)
  const boards: { yaw: number; c: string; h: number }[] = [
    { yaw: Math.PI / 2 + Math.PI, c: '#f7a8c6', h: 1.75 }, // west → cottage
    { yaw: Math.PI / 2 + 0.6, c: '#ffc59e', h: 1.45 }, // east → hill
    { yaw: Math.PI, c: '#cdb8f5', h: 1.15 }, // north → heart garden
  ]
  return (
    <group position={[s.x, y, s.z]}>
      <Cyl s={[0.1, 2.1, 0.1]} p={[0, 1.05, 0]} c="#c99a72" />
      {boards.map((b, i) => (
        <group key={i} position={[0, b.h, 0]} rotation={[0, b.yaw, 0]}>
          <Box s={[0.12, 0.28, 0.9]} p={[0, 0, 0.45]} c={b.c} />
          <mesh geometry={GEO.cone} material={toon(b.c)} scale={[0.2, 0.22, 0.06]} position={[0, 0, 0.98]} rotation={[Math.PI / 2, 0, 0]} />
        </group>
      ))}
    </group>
  )
}

function StandingStones() {
  return (
    <group>
      {MEADOW.standingStones.map((s, i) => {
        const y = terrainHeight(s.x, s.z)
        return (
          <group key={i} position={[s.x, y, s.z]} rotation={[0, i * 0.8, 0]}>
            <mesh geometry={GEO.sphere} material={toon('#ece4dc')} scale={[0.5, 1.0 + (i % 3) * 0.2, 0.42]} position={[0, 0.55, 0]} castShadow receiveShadow />
            <Ball s={[0.14, 0.1, 0.14]} p={[0.15, 0.2, 0.32]} c="#f7a8c6" shadow={false} />
          </group>
        )
      })}
    </group>
  )
}

export function MeadowProps() {
  return (
    <group>
      <Cottage />
      <Bridge />
      <WaterDecor />
      <RockSteps />
      <Bench />
      <Picnic />
      <Lamps />
      <Signpost />
      <StandingStones />
    </group>
  )
}
