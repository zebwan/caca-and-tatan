/** Cuddleberry Village — region 2. */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { VILLAGE as V, type House } from './layout'
import { villageColor, villageHeight, villagePhysics, villageScatter, villageTerrain, VILLAGE_PALETTE } from './world'
import { GroundMesh, WaterSurface } from '../common/Ground'
import { Vegetation } from '../common/Vegetation'
import { Building, Bunting, Lamp } from '../common/Building'
import { Coins } from '../common/Coins'
import { Keepsake } from '../common/Keepsake'
import { ExitGate, Halo, QuestTarget, StarSocket } from '../common/questKit'
import { GEO, toon } from '../materials'
import { Npc } from '../../characters/Npc'
import { buildCat, buildHero, disposeRig, setRigOpacity, VARIANTS } from '../../characters/catBuilder'
import { CatAnimator } from '../../characters/catAnimation'
import { runtime } from '../../state/runtime'
import { game, useGame } from '../../state/store'
import { interactions } from '../../systems/interactions'
import { dispatch, questState, questStepId } from '../../systems/quests'
import { say, timeOfDay } from '../../systems/dialogue'
import { audio } from '../../systems/audio'
import { bus } from '../../systems/bus'
import { saveGame } from '../../state/save'
import { travelTo } from '../../flow'
import { regionRT } from '../regions'
import { dampAngle } from '../../characters/Player'

const H = (p: { x: number; z: number }) => villageHeight(p.x, p.z)

function Houses() {
  return (
    <>
      {V.houses.map((h: House) => (
        <Building
          key={h.id}
          x={h.x}
          z={h.z}
          y={H(h)}
          yaw={h.yaw}
          w={h.w}
          d={h.d}
          wall={h.wall}
          roof={h.roof}
          awning={h.kind === 'bakery' ? '#f7a8c6' : h.kind === 'boutique' ? '#f27aa6' : h.kind === 'furniture' ? '#ffc59e' : undefined}
          sign={
            h.kind === 'bakery' ? { color: '#fff1e0', glyph: 'bread' } :
            h.kind === 'post' ? { color: '#9cc3ea', glyph: 'letter' } :
            h.kind === 'boutique' ? { color: '#fff0f6', glyph: 'bow' } :
            h.kind === 'furniture' ? { color: '#fff7e8', glyph: 'chair' } :
            h.kind === 'home' ? { color: '#e6dcff', glyph: 'heart' } : undefined
          }
          door={h.kind === 'home' ? '#b9a5ee' : undefined}
        />
      ))}
      <LilacGarden />
      <BakeryDisplay />
    </>
  )
}

function LilacGarden() {
  const h = V.H.lilac
  const y = H(h)
  const posts = useMemo(() => {
    const out: [number, number][] = []
    for (let i = -6; i <= 6; i++) if (Math.abs(i) > 1) out.push([h.x + h.d / 2 + 3.2, h.z + i * 0.7])
    return out
  }, [h])
  return (
    <group>
      {posts.map(([x, z], i) => (
        <mesh key={i} geometry={GEO.box} material={toon('#ffffff')} scale={[0.1, 0.7, 0.1]} position={[x, y + 0.35, z]} castShadow />
      ))}
      <mesh geometry={GEO.box} material={toon('#ffffff')} scale={[0.06, 0.08, 3.6]} position={[h.x + h.d / 2 + 3.2, y + 0.55, h.z - 2.6]} />
      <mesh geometry={GEO.box} material={toon('#ffffff')} scale={[0.06, 0.08, 3.6]} position={[h.x + h.d / 2 + 3.2, y + 0.55, h.z + 2.6]} />
      {[-2.3, -1.4, 1.4, 2.3].map((dz, i) => (
        <group key={dz} position={[h.x + h.d / 2 + 1.6, y, h.z + dz]}>
          <mesh geometry={GEO.sphere} material={toon('#a2d28a')} scale={[0.5, 0.4, 0.5]} position={[0, 0.3, 0]} />
          {[0, 1, 2].map((k) => (
            <mesh key={k} geometry={GEO.sphere} material={toon(['#d8c7ff', '#f7a8c6', '#ffffff'][(i + k) % 3])} scale={0.12} position={[Math.cos(k * 2) * 0.3, 0.6, Math.sin(k * 2) * 0.3]} />
          ))}
        </group>
      ))}
    </group>
  )
}

function BakeryDisplay() {
  const b = V.H.bakery
  const y = H(b)
  return (
    <group position={[b.x - 2.7, y, b.z + b.d / 2 + 1.0]}>
      <mesh geometry={GEO.box} material={toon('#d3a37b')} scale={[1.6, 0.8, 0.7]} position={[0, 0.4, 0]} castShadow />
      {[-0.5, 0, 0.5].map((x) => (
        <mesh key={x} geometry={GEO.sphere} material={toon('#e9b77f')} scale={[0.22, 0.13, 0.15]} position={[x, 0.88, 0]} />
      ))}
      {[-0.25, 0.25].map((x) => (
        <mesh key={x} geometry={GEO.sphere} material={toon('#f7a8c6')} scale={[0.12, 0.1, 0.12]} position={[x, 0.9, 0.15]} />
      ))}
    </group>
  )
}

function Fountain({ lit }: { lit: number }) {
  const f = V.fountain
  const y = H(f)
  const water = useRef<THREE.Mesh>(null)
  const glow = useMemo(() => new THREE.MeshToonMaterial({ color: '#bfe9f2', emissive: '#9fdcff', emissiveIntensity: 0.15, transparent: true, opacity: 0.85 }), [])
  useFrame(() => {
    if (water.current) water.current.position.y = y + 0.62 + Math.sin(runtime.time * 2) * 0.02
    glow.emissiveIntensity = 0.15 + lit * 0.9 + Math.sin(runtime.time * 3) * 0.05 * lit
    glow.emissive.set(lit > 0.5 ? '#ffc2dc' : '#9fdcff')
  })
  const sockets = [0, 1, 2].map((i) => {
    const a = Math.PI / 2 + (i - 1) * 0.9
    return [f.x + Math.cos(a) * 2.45, y + 0.82, f.z + Math.sin(a) * 2.45] as THREE.Vector3Tuple
  })
  return (
    <group>
      <mesh geometry={GEO.cylinder} material={toon('#f6dfe8')} scale={[2.6, 0.75, 2.6]} position={[f.x, y + 0.37, f.z]} castShadow receiveShadow />
      <mesh geometry={GEO.cylinder} material={toon('#fff4f8')} scale={[2.7, 0.12, 2.7]} position={[f.x, y + 0.78, f.z]} />
      <mesh ref={water} geometry={GEO.cylinder} material={glow} scale={[2.3, 0.08, 2.3]} position={[f.x, y + 0.62, f.z]} />
      <mesh geometry={GEO.cylinder} material={toon('#f6dfe8')} scale={[0.35, 1.6, 0.35]} position={[f.x, y + 1.3, f.z]} castShadow />
      <mesh geometry={GEO.cylinder} material={toon('#fff4f8')} scale={[1.1, 0.2, 1.1]} position={[f.x, y + 2.05, f.z]} castShadow />
      <mesh geometry={GEO.sphere} material={toon('#f392b4', '#f392b4', 0.2 + lit * 0.8)} scale={0.32} position={[f.x, y + 2.5, f.z]} />
      <Sparkles count={lit > 0.5 ? 40 : 14} scale={[2.4, 2.4, 2.4]} position={[f.x, y + 1.9, f.z]} size={lit > 0.5 ? 5 : 3} speed={0.5} color={lit > 0.5 ? '#ffd6ea' : '#d6f2ff'} />
      {sockets.map((p, i) => (
        <StarSocket key={i} position={p} lit={lit > 0.3 + i * 0.15} scale={0.42} />
      ))}
    </group>
  )
}

function Stalls() {
  return (
    <>
      {V.stalls.map((s, i) => {
        const y = H(s)
        return (
          <group key={i} position={[s.x, y, s.z]} rotation={[0, s.yaw, 0]}>
            <mesh geometry={GEO.box} material={toon('#dcae86')} scale={[2.4, 0.9, 1.2]} position={[0, 0.45, 0]} castShadow />
            {[-1.1, 1.1].map((x) => (
              <mesh key={x} geometry={GEO.cylinder} material={toon('#b98a66')} scale={[0.06, 2.2, 0.06]} position={[x, 1.1, -0.5]} />
            ))}
            {[0, 1, 2, 3, 4].map((k) => (
              <mesh key={k} geometry={GEO.box} material={toon(k % 2 ? '#ffffff' : s.color)} scale={[0.5, 0.05, 1.5]} position={[-1 + k * 0.5, 2.2, 0]} rotation={[0.3, 0, 0]} castShadow />
            ))}
            {[-0.7, -0.2, 0.3, 0.8].map((x, k) => (
              <mesh key={x} geometry={GEO.sphere} material={toon(i ? ['#f27aa6', '#ffb68a', '#fff1b8', '#c9e7ff'][k] : ['#e9b77f', '#f3cf9c', '#e9b77f', '#d79e6a'][k])} scale={i ? 0.14 : [0.2, 0.12, 0.14]} position={[x, 0.98, 0]} />
            ))}
          </group>
        )
      })}
    </>
  )
}

function Windmill() {
  const w = V.windmill
  const y = H(w)
  const blades = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (blades.current) blades.current.rotation.z += dt * 0.5
  })
  return (
    <group position={[w.x, y, w.z]} rotation={[0, -0.6, 0]}>
      <mesh geometry={GEO.cylinder} material={toon('#fff3e4')} scale={[2.2, 6.5, 2.6]} position={[0, 3.25, 0]} castShadow />
      <mesh geometry={GEO.cone} material={toon('#f392b4')} scale={[2.8, 2.4, 2.8]} position={[0, 7.7, 0]} castShadow />
      <mesh geometry={GEO.box} material={toon('#d69a86')} scale={[1.1, 1.8, 0.1]} position={[0, 0.95, 2.45]} />
      <group ref={blades} position={[0, 6.0, 2.7]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} geometry={GEO.box} material={toon('#fff8ef')} scale={[0.9, 5.2, 0.12]} position={[Math.sin((i * Math.PI) / 2) * 2.6, Math.cos((i * Math.PI) / 2) * 2.6, 0]} rotation={[0, 0, (-i * Math.PI) / 2]} castShadow />
        ))}
        <mesh geometry={GEO.sphere} material={toon('#c99a72')} scale={0.4} />
      </group>
    </group>
  )
}

function HedgeGarden() {
  const hg = V.hedge
  return (
    <group>
      {hg.walls.map((w, i) => {
        const y = H(w)
        return (
          <group key={i}>
            <mesh geometry={GEO.box} material={toon('#8fc477')} scale={[w.hw * 2, 1.9, w.hd * 2]} position={[w.x, y + 0.95, w.z]} castShadow receiveShadow />
            <mesh geometry={GEO.box} material={toon('#a2d28a')} scale={[w.hw * 2 + 0.1, 0.25, w.hd * 2 + 0.1]} position={[w.x, y + 1.95, w.z]} />
          </group>
        )
      })}
      {/* rose arch over the entrance */}
      <group position={[-28.5, H({ x: -28.5, z: -26.8 }), -26.8]}>
        {[-1.4, 1.4].map((x) => (
          <mesh key={x} geometry={GEO.cylinder} material={toon('#ffffff')} scale={[0.08, 2.4, 0.08]} position={[x, 1.2, 0]} />
        ))}
        <mesh geometry={new THREE.TorusGeometry(1.4, 0.08, 6, 20, Math.PI)} material={toon('#a2d28a')} position={[0, 2.4, 0]} />
        {Array.from({ length: 7 }, (_, i) => {
          const a = (i / 6) * Math.PI
          return <mesh key={i} geometry={GEO.sphere} material={toon(['#f7a8c6', '#ffffff', '#f27aa6'][i % 3])} scale={0.13} position={[Math.cos(a) * 1.4, 2.4 + Math.sin(a) * 1.4, 0.05]} />
        })}
      </group>
      <group position={[hg.bench.x, H(hg.bench), hg.bench.z]}>
        <mesh geometry={GEO.box} material={toon('#dcae86')} scale={[2.0, 0.1, 0.55]} position={[0, 0.5, 0]} castShadow />
        <mesh geometry={GEO.box} material={toon('#d3a37b')} scale={[2.0, 0.45, 0.08]} position={[0, 0.85, -0.25]} />
        {[-0.85, 0.85].map((x) => (
          <mesh key={x} geometry={GEO.box} material={toon('#b98a66')} scale={[0.1, 0.5, 0.5]} position={[x, 0.25, 0]} />
        ))}
      </group>
    </group>
  )
}

function Crates() {
  return (
    <group>
      {V.crates.map((c, i) => {
        const base = H(c)
        const top = base + c.rise
        return (
          <group key={i} position={[c.x, 0, c.z]} rotation={[0, i * 0.4, 0]}>
            <mesh geometry={GEO.box} material={toon(i % 2 ? '#d3a37b' : '#dcae86')} scale={[c.r * 1.55, top - base + 0.6, c.r * 1.55]} position={[0, (top + base - 0.6) / 2, 0]} castShadow receiveShadow />
            <mesh geometry={GEO.box} material={toon('#b98a66')} scale={[c.r * 1.6, 0.08, 0.12]} position={[0, top - 0.25, c.r * 0.78]} />
          </group>
        )
      })}
    </group>
  )
}

function CartAndBales() {
  const c = V.cart
  const y = H(c)
  return (
    <group>
      <group position={[c.x, y, c.z]} rotation={[0, c.yaw, 0]}>
        <mesh geometry={GEO.box} material={toon('#dcae86')} scale={[2.0, 0.6, 1.4]} position={[0, 0.75, 0]} castShadow />
        {[-0.75, 0.75].map((x) => (
          <mesh key={x} geometry={GEO.cylinder} material={toon('#b98a66')} scale={[0.45, 0.12, 0.45]} position={[x, 0.45, 0.75]} rotation={[Math.PI / 2, 0, 0]} castShadow />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <mesh key={i} geometry={GEO.sphere} material={toon(['#f7a8c6', '#ffffff', '#ffc59e', '#cdb8f5'][i % 4])} scale={0.17} position={[-0.75 + (i % 4) * 0.5, 1.15, -0.4 + Math.floor(i / 4) * 0.4]} />
        ))}
      </group>
      {V.bales.map((b, i) => {
        const base = H(b)
        const top = base + b.rise
        return (
          <mesh key={i} geometry={GEO.cylinder} material={toon('#f0d58f')} scale={[b.r, top - base + 0.4, b.r]} position={[b.x, (top + base - 0.4) / 2, b.z]} castShadow receiveShadow />
        )
      })}
    </group>
  )
}

function PondDecor() {
  const d = V.dock
  const ducks = useRef<(THREE.Group | null)[]>([])
  useFrame(() => {
    const t = runtime.time
    ducks.current.forEach((g, i) => {
      if (!g) return
      const a = t * (0.2 + i * 0.05) + i * 2.1
      const r = 2.6 + i * 0.6
      g.position.set(V.pond.x + 1 + Math.cos(a) * r, 0.3 + Math.sin(t * 2 + i) * 0.02, V.pond.z + Math.sin(a) * r * 0.8)
      g.rotation.y = -a
    })
  })
  return (
    <group>
      <group position={[d.x, 0, d.z]}>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i} geometry={GEO.box} material={toon(i % 2 ? '#dcae86' : '#d3a37b')} scale={[0.56, 0.12, d.hd * 2]} position={[-d.hw + 0.3 + i * 0.6, 0.76, 0]} castShadow receiveShadow />
        ))}
        {[-d.hw + 0.2, d.hw - 0.2].flatMap((x) => [-1, 1].map((sz) => (
          <mesh key={`${x}${sz}`} geometry={GEO.cylinder} material={toon('#b98a66')} scale={[0.08, 1.4, 0.08]} position={[x, 0.3, sz * (d.hd - 0.05)]} />
        )))}
      </group>
      {[0, 1, 2].map((i) => (
        <group key={i} ref={(el) => void (ducks.current[i] = el)}>
          <mesh geometry={GEO.sphere} material={toon('#ffffff')} scale={[0.22, 0.16, 0.3]} />
          <mesh geometry={GEO.sphere} material={toon('#ffffff')} scale={0.12} position={[0, 0.18, 0.2]} />
          <mesh geometry={GEO.cone} material={toon('#ffb68a')} scale={[0.04, 0.09, 0.04]} position={[0, 0.17, 0.33]} rotation={[Math.PI / 2, 0, 0]} />
        </group>
      ))}
    </group>
  )
}

/** Quest props: berry bushes, mailboxes, starflowers, the paintbrush, kittens. */
function VillageQuestProps() {
  const berriesDone = (i: number) => (
    <group position={[V.berryBushes[i].x, H(V.berryBushes[i]), V.berryBushes[i].z]}>
      <mesh geometry={GEO.sphere} material={toon('#9ccd84')} scale={[0.9, 0.75, 0.9]} position={[0, 0.6, 0]} castShadow />
    </group>
  )
  const bush = (glow: boolean) => (
    <group>
      <mesh geometry={GEO.sphere} material={toon('#9ccd84')} scale={[0.9, 0.75, 0.9]} position={[0, 0.6, 0]} castShadow />
      {Array.from({ length: 7 }, (_, k) => (
        <mesh key={k} geometry={GEO.sphere} material={toon('#f27aa6', glow ? '#ff7fae' : undefined, glow ? 0.7 : 0.4)} scale={0.11} position={[Math.cos(k * 0.9) * 0.75, 0.5 + (k % 3) * 0.25, Math.sin(k * 0.9) * 0.75]} />
      ))}
      {glow && <Halo color="#ffc2dc" r={1.1} opacity={0.15} />}
    </group>
  )
  const mailbox = (id: keyof typeof V.mailboxes, flagUp: boolean, glow: boolean) => {
    const m = V.mailboxes[id]
    return (
      <group position={[m.x, H(m), m.z]}>
        <mesh geometry={GEO.cylinder} material={toon('#c99a72')} scale={[0.06, 1.0, 0.06]} position={[0, 0.5, 0]} />
        <mesh geometry={GEO.box} material={toon(glow ? '#ffd6e6' : '#f7a8c6', glow ? '#ff9fc4' : undefined, 0.5)} scale={[0.42, 0.32, 0.6]} position={[0, 1.15, 0]} castShadow />
        <mesh geometry={GEO.box} material={toon('#f27aa6')} scale={[0.04, flagUp ? 0.3 : 0.12, 0.08]} position={[0.24, flagUp ? 1.35 : 1.2, -0.1]} />
        {glow && <Halo color="#ffc2dc" r={0.8} opacity={0.18} />}
      </group>
    )
  }
  const kittenVariant = ['kittenA', 'kittenB', 'kittenC'] as const
  const kittenSpots = [V.kittens.crates, V.kittens.cart, V.kittens.dock]
  const kittenY = [villageHeight(V.crates[2].x, V.crates[2].z) + V.crates[2].rise, H(V.kittens.cart) + 1.05, 0.82]
  const kittenLine = ['kitten_crates', 'kitten_cart', 'kitten_dock']
  return (
    <group>
      {V.berryBushes.map((b, i) => (
        <QuestTarget
          key={i} id={`berry:${i}`} quest="q_v_berries" step="pick" event="collect:berry" x={b.x} z={b.z} y={H(b)}
          label="Pick cuddleberries" glow={null} idle={<group position={[b.x, H(b), b.z]}>{bush(false)}</group>} done={berriesDone(i)}
        >
          {bush(true)}
        </QuestTarget>
      ))}
      {(['rose', 'plum', 'willow'] as const).map((id, i) => (
        <QuestTarget
          key={id} id={`letter:${i}`} quest="q_v_letters" step="deliver" event="deliver:letter" x={V.mailboxes[id].x} z={V.mailboxes[id].z} y={0}
          label="Post the letter" glow={null} dialogue="mailbox_done" idle={mailbox(id, false, false)} done={mailbox(id, true, false)}
        >
          {mailbox(id, false, true)}
        </QuestTarget>
      ))}
      {V.hedge.flowers.map((f, i) => (
        <QuestTarget key={i} id={`starflower:${i}`} quest="q_v_bouquet" step="pick" event="collect:starflower" x={f.x} z={f.z} y={H(f)} label="Pick the starpetal flower" dialogue="starflower_pick">
          <mesh geometry={GEO.cylinder} material={toon('#86bf6c')} scale={[0.03, 0.5, 0.03]} position={[0, 0.25, 0]} />
          {Array.from({ length: 5 }, (_, k) => (
            <mesh key={k} geometry={GEO.sphere} material={toon('#fff1b8', '#ffe58a', 0.8)} scale={[0.1, 0.04, 0.1]} position={[Math.cos(k * 1.26) * 0.1, 0.52, Math.sin(k * 1.26) * 0.1]} />
          ))}
        </QuestTarget>
      ))}
      <QuestTarget id="paintbrush" quest="q_v_brush" step="find" event="collect:paintbrush" x={V.paintbrush.x} z={V.paintbrush.z} y={H(V.paintbrush) + 0.1} label="Pick up the paintbrush" dialogue="brush_pickup">
        <group rotation={[0, 0.5, Math.PI / 2.3]}>
          <mesh geometry={GEO.cylinder} material={toon('#c99a72')} scale={[0.03, 0.5, 0.03]} />
          <mesh geometry={GEO.cone} material={toon('#f27aa6')} scale={[0.05, 0.12, 0.05]} position={[0, 0.3, 0]} />
        </group>
      </QuestTarget>
      {kittenSpots.map((k, i) => (
        <QuestTarget
          key={i} id={`kitten:${i}`} quest="q_v_kittens" step="find" event="find:kitten" x={k.x} z={k.z} y={kittenY[i]}
          label="Found you!" dialogue={kittenLine[i]} radius={2.9}
          idle={<HidingKitten variant={kittenVariant[i]} x={k.x} z={k.z} y={kittenY[i]} />}
          done={<HomeKitten variant={kittenVariant[i]} i={i} />}
        >
          <MiniCat variant={kittenVariant[i]} />
        </QuestTarget>
      ))}
    </group>
  )
}

/** A small animated NPC cat used for kittens. */
function MiniCat({ variant, yaw = 0, wander }: { variant: 'kittenA' | 'kittenB' | 'kittenC'; yaw?: number; wander?: { x: number; z: number; i: number } }) {
  const rig = useMemo(() => buildCat(VARIANTS[variant]), [variant])
  const anim = useMemo(() => new CatAnimator(), [])
  const st = useRef({ yaw })
  useEffect(() => () => disposeRig(rig), [rig])
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    let gait = 0
    if (wander) {
      const t = runtime.time * 0.5 + wander.i * 2
      const x = wander.x + Math.cos(t) * 1.4, z = wander.z + Math.sin(t * 1.3) * 1.0
      const nx = wander.x + Math.cos(t + 0.05) * 1.4, nz = wander.z + Math.sin((t + 0.05) * 1.3) * 1.0
      rig.root.position.set(x, villageHeight(x, z), z)
      st.current.yaw = dampAngle(st.current.yaw, Math.atan2(nx - x, nz - z), 8, dt)
      gait = 0.8
    } else {
      const P = runtime.player.pos
      const g = rig.root.getWorldPosition(new THREE.Vector3())
      if (Math.hypot(P.x - g.x, P.z - g.z) < 6) st.current.yaw = dampAngle(st.current.yaw, Math.atan2(P.x - g.x, P.z - g.z), 4, dt)
    }
    rig.root.rotation.y = st.current.yaw
    anim.update(rig, { dt, t: runtime.time + (wander?.i ?? 0), gait, grounded: true, vy: 0, idleTime: 0, mood: 'none', moodTime: 0, lookYaw: null, allowRest: false })
  })
  return <primitive object={rig.root} />
}
function HidingKitten({ variant, x, z, y }: { variant: 'kittenA' | 'kittenB' | 'kittenC'; x: number; z: number; y: number }) {
  return (
    <group position={[x, y, z]}>
      <MiniCat variant={variant} />
    </group>
  )
}
function HomeKitten({ variant, i }: { variant: 'kittenA' | 'kittenB' | 'kittenC'; i: number }) {
  return <MiniCat variant={variant} wander={{ x: V.kittensHome.x + (i - 1) * 1.8, z: V.kittensHome.z + (i % 2) * 1.2, i }} />
}

/** Ambient villagers whose spot depends on the time of day. */
function Twins() {
  const [tod, setTod] = useState(timeOfDay())
  useFrame(() => {
    const now = timeOfDay()
    if (now !== tod) setTod(now)
  })
  const spot = V.twins[tod]
  return <Npc id="twins" variant="rosie" x={spot.x} z={spot.z} y={H(spot)} yaw={0.4} />
}

function VillageNpcs() {
  const n = V.npcs
  const brushDone = useGame((s) => s.quests.q_v_brush?.state === 'completed')
  return (
    <>
      <Npc id="mochi" variant="mochi" x={n.mochi.x} z={n.mochi.z} y={H(n.mochi)} yaw={0} offers="q_v_berries" />
      <Npc id="pudding" variant="pudding" x={n.pudding.x} z={n.pudding.z} y={H(n.pudding)} yaw={Math.PI} offers="q_v_letters" />
      <Npc id="maple" variant="maple" x={n.maple.x} z={n.maple.z} y={H(n.maple)} yaw={Math.PI} offers="q_v_kittens" />
      <Npc id="rosie" variant="rosie" x={n.rosie.x} z={n.rosie.z} y={H(n.rosie)} yaw={0.6} offers="q_v_bouquet" optional />
      <Npc id="mayor" variant="mayor" x={n.mayor.x} z={n.mayor.z} y={H(n.mayor)} yaw={-0.6} offers="q_v_home" />
      <Npc id="bella" variant="bella" x={n.bella.x} z={n.bella.z} y={H(n.bella)} yaw={0} />
      <Npc id="barnaby" variant="barnaby" x={n.barnaby.x} z={n.barnaby.z} y={H(n.barnaby)} yaw={0} />
      <Npc id="cocoa" variant="cocoa" x={n.cocoa.x} z={n.cocoa.z} y={H(n.cocoa)} yaw={-2.4} offers="q_v_brush" optional>
        <group position={[n.cocoa.x - 1.2, H(n.cocoa), n.cocoa.z - 0.6]} rotation={[0, -2.2, 0]}>
          {[-0.4, 0.4].map((x) => (
            <mesh key={x} geometry={GEO.cylinder} material={toon('#b98a66')} scale={[0.04, 1.6, 0.04]} position={[x, 0.8, 0]} rotation={[0.15, 0, 0]} />
          ))}
          <mesh geometry={GEO.box} material={toon('#fffaf3')} scale={[1.0, 0.8, 0.05]} position={[0, 1.25, 0.1]} rotation={[-0.15, 0, 0]} />
          {brushDone && <mesh geometry={GEO.box} material={toon('#f7a8c6')} scale={[0.5, 0.35, 0.06]} position={[0, 1.3, 0.13]} rotation={[-0.15, 0, 0]} />}
        </group>
      </Npc>
      <Npc id="tom" variant="tom" x={n.tom.x} z={n.tom.z} y={H(n.tom)} yaw={1.0}>
        <mesh geometry={GEO.cylinder} material={toon('#b98a66')} scale={[0.025, 2.4, 0.025]} position={[n.tom.x + 0.9, H(n.tom) + 1.2, n.tom.z - 0.6]} rotation={[0.6, 0, 0.6]} />
      </Npc>
      <Twins />
    </>
  )
}

/** Lilac Cottage's front door: the way into your home. */
function LilacDoor() {
  const d = V.lilacDoor
  const y = H(d)
  useEffect(
    () =>
      interactions.register({
        id: 'lilac-door',
        position: new THREE.Vector3(d.x, y + 1, d.z),
        radius: 2.4,
        label: () => (questState('q_v_home') === 'in_progress' || questState('q_v_home') === 'completed' ? 'Go inside Lilac Cottage' : 'Knock on the door'),
        enabled: () => true,
        onInteract: () => {
          const qs = questState('q_v_home')
          if (qs !== 'in_progress' && qs !== 'completed') return say('shop_lilac_locked')
          if (qs === 'in_progress' && questStepId('q_v_home') === 'visit') dispatch('enter:home')
          travelTo('home', 'door')
        },
      }),
    [d.x, d.z, y],
  )
  return null
}

/**
 * Chapter 2's heart: placing the fragments in the Wishing Fountain brings
 * Tatan back for real. They run to each other, hug, and he joins Caca.
 */
function Reunion() {
  const f = V.fountain
  const y = H(f)
  const done = useGame((s) => s.quests.q_v_gate?.state === 'completed')
  const [lit, setLit] = useState(done ? 1 : 0)
  const seq = useRef<{ t: number } | null>(null)
  const flyers = useRef<(THREE.Group | null)[]>([])
  const tatanRig = useMemo(() => buildHero('tatan'), [])
  const tAnim = useMemo(() => new CatAnimator(), [])
  useEffect(() => () => disposeRig(tatanRig), [tatanRig])
  useEffect(() => {
    tatanRig.root.visible = false
  }, [tatanRig])
  useEffect(() => setLit(done ? 1 : 0), [done])

  const standC = { x: 0, z: 5.4 }
  const startT = { x: 0, z: -4.6 }
  const meetC = { x: 3.7, z: 0.5 }
  const meetT = { x: 3.7, z: -0.5 }
  const pathC = [standC, { x: 3.4, z: 3.6 }, meetC]
  const pathT = [startT, { x: 3.4, z: -3.6 }, meetT]
  const along = (pts: { x: number; z: number }[], k: number) => {
    const seg = Math.min(pts.length - 2, Math.floor(k * (pts.length - 1)))
    const lk = k * (pts.length - 1) - seg
    const a = pts[seg], b = pts[seg + 1]
    return { x: a.x + (b.x - a.x) * lk, z: a.z + (b.z - a.z) * lk, yaw: Math.atan2(b.x - a.x, b.z - a.z) }
  }

  useEffect(
    () =>
      interactions.register({
        id: 'fountain',
        position: new THREE.Vector3(f.x, y + 1, f.z),
        radius: 4.4,
        label: () => (questState('q_v_gate') === 'in_progress' ? 'Place the starlight fragments' : 'Look into the fountain'),
        enabled: () => !seq.current,
        onInteract: () => {
          const qs = questState('q_v_gate')
          if (qs === 'completed') return say('fountain_after')
          if (qs !== 'in_progress') return say('fountain_locked')
          say('fountain_ready', () => {
            seq.current = { t: 0 }
            const P = runtime.player
            P.frozen = true
            P.pos.set(standC.x, villageHeight(standC.x, standC.z), standC.z)
            P.vel.set(0, 0, 0)
            P.yaw = Math.PI
            runtime.cutscene.active = true
            game.set({ cutscene: true })
            runtime.cutscene.ease = 1.0
            runtime.cutscene.pos.set(6.5, y + 3.2, 9)
            runtime.cutscene.look.set(f.x, y + 1.5, f.z)
            audio.sfx('whoosh')
          })
        },
      }),
    [f.x, f.z, y], // eslint-disable-line react-hooks/exhaustive-deps
  )

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const s = seq.current
    if (!s) return
    const prev = s.t
    s.t += dt
    const t = runtime.time
    const P = runtime.player
    const at = (k: number) => prev < k && s.t >= k
    // fragments fly into the fountain
    flyers.current.forEach((g, i) => {
      if (!g) return
      const start = 0.6 + i * 0.25
      const k = Math.max(0, Math.min(1, (s.t - start) / 1.1))
      g.visible = s.t > start && k < 1
      const a = Math.PI / 2 + (i - 1) * 0.9
      const to = new THREE.Vector3(f.x + Math.cos(a) * 2.45, y + 0.85, f.z + Math.sin(a) * 2.45)
      g.position.lerpVectors(new THREE.Vector3(P.pos.x, P.pos.y + 1, P.pos.z), to, k)
      g.position.y += Math.sin(k * Math.PI) * 1.4
      g.rotation.y = t * 6
    })
    if (at(0.6)) audio.sfx('fragment')
    if (at(2.6)) {
      setLit(1)
      audio.sfx('reveal')
      audio.setTheme('reunion')
    }
    // Tatan appears across the fountain
    if (at(3.2)) {
      tatanRig.root.visible = true
      setRigOpacity(tatanRig, 0)
      runtime.cutscene.pos.set(-5, y + 2.2, 4.5)
      runtime.cutscene.look.set(f.x, y + 1, f.z - 2)
    }
    let tPos = startT, tYaw = 0, tGait = 0, tMood: 'none' | 'happy' | 'hug' = 'none'
    if (s.t > 3.2) setRigOpacity(tatanRig, Math.min(1, (s.t - 3.2) / 1.2))
    if (at(4.6)) {
      audio.sfx('meow', 470)
      P.mood = 'happy'
      P.moodTime = 0
    }
    if (at(5.4)) audio.sfx('meow', 760)
    // they walk toward each other
    if (s.t > 5.6) {
      const k = Math.min(1, (s.t - 5.6) / 2.4)
      const c = along(pathC, k)
      const tt = along(pathT, k)
      P.pos.set(c.x, villageHeight(c.x, c.z), c.z)
      P.yaw = k < 1 ? c.yaw : Math.atan2(meetT.x - meetC.x, meetT.z - meetC.z)
      P.gait = k < 1 ? 1.2 : 0
      tPos = tt
      tYaw = k < 1 ? tt.yaw : Math.atan2(meetC.x - meetT.x, meetC.z - meetT.z)
      tGait = k < 1 ? 1.2 : 0
      if (at(5.6)) {
        runtime.cutscene.ease = 1.4
        runtime.cutscene.pos.set(9.5, y + 2.4, 1.5)
        runtime.cutscene.look.set(3.7, y + 0.9, 0)
      }
    }
    // the hug
    if (s.t > 8.0) {
      tMood = 'hug'
      P.mood = 'hug'
      P.moodTime = s.t - 8
      if (Math.floor(s.t * 2) !== Math.floor(prev * 2)) bus.emit({ type: 'hearts', x: 3.7, y: y + 1.6, z: 0, n: 3 })
    }
    if (at(8.0)) {
      audio.sfx('fragment')
      runtime.cutscene.ease = 1.2
      runtime.cutscene.pos.set(7.2, y + 1.7, 0.2)
    }
    if (at(10.6)) {
      runtime.cutscene.ease = 2.4
      runtime.cutscene.pos.set(12, y + 7, 12)
      runtime.cutscene.look.set(2, y + 1, 0)
    }
    tatanRig.root.position.set(tPos.x, villageHeight(tPos.x, tPos.z), tPos.z)
    tatanRig.root.rotation.y = s.t > 5.6 ? tYaw : 0
    tAnim.update(tatanRig, { dt, t, gait: tGait, grounded: true, vy: 0, idleTime: 0, mood: tMood, moodTime: s.t - 8, lookYaw: null, allowRest: false })

    if (s.t > 13) {
      seq.current = null
      tatanRig.root.visible = false
      P.mood = 'none'
      runtime.companion.pos.set(tPos.x, villageHeight(tPos.x, tPos.z), tPos.z)
      runtime.companion.yaw = tYaw
      runtime.cutscene.active = false
      game.set({ cutscene: false })
      P.frozen = false
      runtime.camera.targetYaw = runtime.camera.yaw = P.yaw + Math.PI
      game.setFlag('tatanJoined')
      audio.setTheme(regionRT('village').music)
      say('tatan_reunion')
      dispatch('activate:fountain')
      setTimeout(() => game.present({ kind: 'chapterEnd' }), 1700)
      saveGame()
    }
  })

  return (
    <group>
      <Fountain lit={lit} />
      {[0, 1, 2].map((i) => (
        <group key={i} ref={(el) => void (flyers.current[i] = el)} visible={false}>
          <mesh geometry={new THREE.OctahedronGeometry(0.3)} material={toon('#ffe58a', '#ffd36e', 1)} />
        </group>
      ))}
      <primitive object={tatanRig.root} />
    </group>
  )
}

function VillageKeepsakes() {
  const k = V.keepsakes
  const bale = V.bales[1]
  return (
    <>
      <Keepsake id="mittens" x={k.mittens.x} z={k.mittens.z} y={H(k.mittens) + 0.3} />
      <Keepsake id="teacups" x={k.teacups.x} z={k.teacups.z} y={H(bale) + bale.rise} />
      <Keepsake id="ticket" x={k.ticket.x} z={k.ticket.z} y={H(k.ticket)} />
    </>
  )
}

export function Village() {
  const world = useMemo(() => villagePhysics(), [])
  const gateY = (g: { x: number; z: number }) => H(g)
  const exits = regionRT('village').exits
  return (
    <group>
      <GroundMesh heightAt={villageHeight} colorAt={villageColor} />
      <WaterSurface heightAt={villageHeight} level={villageTerrain.waterLevel} />
      <Vegetation scatter={villageScatter()} palette={VILLAGE_PALETTE} />
      <Houses />
      <Stalls />
      <Windmill />
      <HedgeGarden />
      <Crates />
      <CartAndBales />
      <PondDecor />
      {V.lamps.map((l, i) => (
        <Lamp key={i} x={l.x} z={l.z} y={H(l)} />
      ))}
      <Bunting a={[-8, -8]} b={[8, 8]} y={H({ x: 0, z: 0 }) + 4.2} />
      <Reunion />
      <VillageQuestProps />
      <VillageNpcs />
      <VillageKeepsakes />
      <LilacDoor />
      <Coins region="village" world={world} count={14} seed={77} extra={[{ x: 10.5, z: -29.4, y: villageHeight(10.5, -29.4) + 2.7 }]} />
      {exits.map((e) => (
        <ExitGate key={e.id} exit={e} y={gateY(e)} />
      ))}
    </group>
  )
}
