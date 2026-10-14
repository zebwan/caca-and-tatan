/** The Starlight Garden — the final chapter: floating islands, four wishes, and the wish under the heart tree. */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { GARDEN as G, type Island } from './layout'
import { gardenHeight, gardenPhysics, gardenPlatforms, LIGHT_SEGMENTS, lightSegment, litWishes } from './world'
import { GEO, lampMaterial, toon, addWind } from '../materials'
import { Halo, MovingPlatforms, QuestTarget } from '../common/questKit'
import { Coins } from '../common/Coins'
import { runtime } from '../../state/runtime'
import { game, useGame } from '../../state/store'
import { interactions } from '../../systems/interactions'
import { dispatch, questState } from '../../systems/quests'
import { say } from '../../systems/dialogue'
import { audio } from '../../systems/audio'
import { bus } from '../../systems/bus'
import { saveGame } from '../../state/save'
import { travelTo } from '../../flow'
import { tatan } from '../../characters/Companion'
import { WISH_LINES } from '../../data/regions/garden'
import { mulberry32 } from '../meadow/scatter'
import { TREES } from '../common/treeKinds'

/** An island: grassy domed top with flowers, and a rocky underside drifting above the clouds. */
function IslandMesh({ isl, seed }: { isl: Island; seed: number }) {
  const top = useMemo(() => {
    const g = new THREE.CircleGeometry(isl.r + 0.3, 48, 0, Math.PI * 2)
    g.rotateX(-Math.PI / 2)
    const pos = g.attributes.position as THREE.BufferAttribute
    const cols = new Float32Array(pos.count * 3)
    const grass = new THREE.Color('#bfe6a8'), pink = new THREE.Color('#ffd6e8'), c = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + isl.x, z = pos.getZ(i) + isl.z
      pos.setY(i, Math.max(isl.h - 0.4, gardenHeight(x, z)) - isl.h)
      c.copy(grass).lerp(pink, Math.max(0, Math.sin(x * 0.7) * Math.cos(z * 0.6)) * 0.6)
      cols.set([c.r, c.g, c.b], i * 3)
    }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3))
    g.computeVertexNormals()
    return g
  }, [isl])
  const flowers = useMemo(() => {
    const rnd = mulberry32(seed)
    return Array.from({ length: Math.round(isl.r * 5) }, () => {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * (isl.r - 0.6)
      return { x: Math.cos(a) * r, z: Math.sin(a) * r, c: ['#ffd6f0', '#ffffff', '#fff1b8', '#cdb8f5', '#bfe9ff'][Math.floor(rnd() * 5)], s: 0.08 + rnd() * 0.06 }
    })
  }, [isl, seed])
  return (
    <group position={[isl.x, isl.h, isl.z]}>
      <mesh geometry={top} receiveShadow>
        <meshLambertMaterial vertexColors />
      </mesh>
      <mesh geometry={GEO.cylinder} material={toon('#efe2f7')} scale={[isl.r + 0.3, 0.5, isl.r + 0.3]} position={[0, -0.42, 0]} />
      <mesh geometry={GEO.cone} material={toon('#d9c8f0')} scale={[isl.r + 0.2, isl.r * 1.6, isl.r + 0.2]} position={[0, -0.65 - isl.r * 0.8, 0]} rotation={[Math.PI, 0, 0]} castShadow />
      <mesh geometry={GEO.cone} material={toon('#c3aee6')} scale={[isl.r * 0.5, isl.r * 1.1, isl.r * 0.5]} position={[isl.r * 0.3, -0.65 - isl.r * 1.4, 0.2]} rotation={[Math.PI, 0.5, 0]} />
      {flowers.map((f, i) => (
        <mesh key={i} geometry={GEO.sphere} material={lampMaterial(f.c, f.c)} scale={f.s} position={[f.x, 0.42 + gardenHeight(isl.x + f.x, isl.z + f.z) - isl.h - 0.35, f.z]} />
      ))}
    </group>
  )
}

function StarTrees() {
  const spots = useMemo(() => {
    const rnd = mulberry32(77)
    const out: { x: number; z: number; s: number }[] = []
    for (const isl of G.islands) {
      if (isl.id === 'heart') continue
      const n = isl.id === 'south' ? 3 : 1
      for (let i = 0; i < n; i++) {
        const a = rnd() * Math.PI * 2, r = isl.r * (0.55 + rnd() * 0.25)
        out.push({ x: isl.x + Math.cos(a) * r, z: isl.z + Math.sin(a) * r, s: 0.7 + rnd() * 0.3 })
      }
    }
    return out.filter((s) => !G.pedestals.some((p) => Math.hypot(p.x - s.x, p.z - s.z) < 2.5))
  }, [])
  const style = TREES.star
  const geo = useMemo(() => ({ trunk: style.trunk(), canopy: style.canopy(), accent: style.accent!() }), [style])
  return (
    <group>
      {spots.map((s, i) => (
        <group key={i} position={[s.x, gardenHeight(s.x, s.z) - 0.1, s.z]} scale={s.s} rotation={[0, i, 0]}>
          <mesh geometry={geo.trunk} material={toon(style.trunkColor)} castShadow />
          <mesh geometry={geo.canopy} material={toon('#fff0f6', '#ffc2dc', 0.25)} castShadow />
          <mesh geometry={geo.accent} material={lampMaterial('#ffe58a', '#ffd36e')} />
        </group>
      ))}
    </group>
  )
}

function CloudSea() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uTime: { value: 0 } },
        vertexShader: `varying vec2 vP; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vP = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; varying vec2 vP;
          float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5); }
          float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
          void main(){
            vec2 p = vP * 0.035 + vec2(uTime * 0.01, uTime * 0.006);
            float c = n(p) * 0.55 + n(p * 2.3) * 0.3 + n(p * 5.1) * 0.15;
            vec3 col = mix(vec3(0.82, 0.76, 0.95), vec3(1.0, 0.86, 0.92), smoothstep(0.35, 0.8, c));
            float fade = 1.0 - smoothstep(180.0, 380.0, length(vP));
            gl_FragColor = vec4(col, (0.75 + c * 0.25) * fade);
            #include <colorspace_fragment>
          }`,
      }),
    [],
  )
  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt
  })
  return (
    <mesh material={mat} rotation={[-Math.PI / 2, 0, 0]} position={[0, -24, 0]}>
      <planeGeometry args={[800, 800]} />
    </mesh>
  )
}

function PetalBridges() {
  return (
    <group>
      {G.bridges.map((b, bi) => {
        const len = Math.hypot(b.to.x - b.from.x, b.to.z - b.from.z)
        const yaw = Math.atan2(b.to.x - b.from.x, b.to.z - b.from.z)
        const n = Math.round(len / 0.8)
        return (
          <group key={bi}>
            {Array.from({ length: n }, (_, i) => {
              const k = (i + 0.5) / n
              const x = b.from.x + (b.to.x - b.from.x) * k, z = b.from.z + (b.to.z - b.from.z) * k
              const y = b.y0 + (b.y1 - b.y0) * k
              return (
                <group key={i} position={[x, y - 0.06, z]} rotation={[0, yaw, 0]}>
                  <mesh geometry={GEO.box} material={toon(i % 2 ? '#ffd6e8' : '#ffe9f2')} scale={[2.5, 0.12, 0.76]} receiveShadow castShadow />
                  {[-1, 1].map((sx) => (
                    <mesh key={sx} geometry={GEO.sphere} material={toon(['#f7a8c6', '#ffffff', '#cdb8f5'][(i + bi) % 3])} scale={0.13} position={[sx * 1.3, 0.25, 0]} />
                  ))}
                </group>
              )
            })}
          </group>
        )
      })}
    </group>
  )
}

function Platforms() {
  return (
    <MovingPlatforms surfaces={gardenPlatforms}>
      {(i) => (
        <group>
          <mesh geometry={GEO.cylinder} material={toon(i % 2 ? '#efe6ff' : '#ffe6f2')} scale={[1.25, 0.3, 1.25]} position={[0, -0.15, 0]} castShadow receiveShadow />
          <mesh geometry={GEO.cone} material={toon('#d9c8f0')} scale={[1.1, 1.2, 1.1]} position={[0, -0.9, 0]} rotation={[Math.PI, 0, 0]} />
          <mesh geometry={GEO.sphere} material={lampMaterial('#fff1b8', '#ffe58a')} scale={0.09} position={[0.7, 0.1, 0.5]} />
        </group>
      )}
    </MovingPlatforms>
  )
}

/** Four wish pedestals — each lights a piece of the bridge of light. */
function WishPedestals() {
  const collected = useGame((s) => s.collected)
  const lit = G.pedestals.map((_, i) => collected.includes(`wish:${i}`))
  return (
    <group>
      {G.pedestals.map((p, i) => {
        const y = gardenHeight(p.x, p.z)
        const base = (
          <group position={[p.x, y, p.z]}>
            <mesh geometry={GEO.cylinder} material={toon('#fff4f8')} scale={[0.55, 1.0, 0.55]} position={[0, 0.5, 0]} castShadow />
            <mesh geometry={GEO.cylinder} material={toon('#efe2f7')} scale={[0.75, 0.15, 0.75]} position={[0, 1.05, 0]} />
          </group>
        )
        const orb = (on: boolean) => (
          <group position={[p.x, y + 1.55, p.z]}>
            <mesh geometry={GEO.sphere} material={on ? lampMaterial(p.color, p.color) : toon('#e9e4f2')} scale={0.35} />
            {on && <Halo color={p.color} r={0.9} opacity={0.22} />}
          </group>
        )
        return (
          <group key={p.id}>
            {base}
            <QuestTarget
              id={`wish:${i}`} quest="q_g_wishes" step="light" event="light:wish" x={p.x} z={p.z} y={y + 1.55} label="Light this wish together" glow={p.color} radius={3}
              idle={orb(false)} done={orb(true)}
              onDone={() => {
                audio.sfx('reveal')
                const line = WISH_LINES[p.id]
                if (line) setTimeout(() => tatan.say(line, 4.5), 600)
                bus.emit({ type: 'hearts', x: p.x, y: y + 2, z: p.z, n: 4 })
              }}
            >
              <mesh geometry={GEO.sphere} material={toon('#ffffff', p.color, 0.6)} scale={0.35} />
            </QuestTarget>
            {lit[i] && (
              <mesh position={[p.x, y + 12, p.z]}>
                <cylinderGeometry args={[0.15, 0.4, 20, 10, 1, true]} />
                <meshBasicMaterial color={p.color} transparent opacity={0.25} depthWrite={false} side={THREE.DoubleSide} />
              </mesh>
            )}
          </group>
        )
      })}
    </group>
  )
}

function LightBridge() {
  const n = useGame(() => litWishes())
  const refs = useRef<(THREE.Mesh | null)[]>([])
  useFrame(() => {
    refs.current.forEach((m, i) => {
      if (m) (m.material as THREE.MeshBasicMaterial).opacity = 0.55 + Math.sin(runtime.time * 3 - i) * 0.12
    })
  })
  return (
    <group>
      {Array.from({ length: LIGHT_SEGMENTS }, (_, i) => {
        const s = lightSegment(i)
        const len = Math.hypot(s.to.x - s.from.x, s.to.z - s.from.z)
        const slope = Math.atan2(s.y1 - s.y0, len)
        return (
          <group key={i} position={[(s.from.x + s.to.x) / 2, (s.y0 + s.y1) / 2 - 0.08, (s.from.z + s.to.z) / 2]} rotation={[0, Math.atan2(s.to.x - s.from.x, s.to.z - s.from.z), 0]}>
            <mesh ref={(el) => void (refs.current[i] = el)} rotation={[-slope, 0, 0]} visible={n > i}>
              <boxGeometry args={[G.lightBridge.hw * 2, 0.14, len]} />
              <meshBasicMaterial color="#fff1b8" transparent opacity={0.6} depthWrite={false} />
            </mesh>
            {n <= i && (
              <mesh rotation={[-slope, 0, 0]}>
                <boxGeometry args={[G.lightBridge.hw * 2, 0.02, len]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.08} depthWrite={false} />
              </mesh>
            )}
          </group>
        )
      })}
      {n >= LIGHT_SEGMENTS && <Sparkles count={50} scale={[3, 2, 20]} position={[0, 3.6, 17]} size={4} speed={0.4} color="#fff1b8" />}
    </group>
  )
}

/** The giant heart-shaped tree where the wish was made. */
function HeartTree({ glow }: { glow: number }) {
  const t = G.heartTree
  const y = gardenHeight(t.x, t.z)
  const canopy = useMemo(() => {
    const m = new THREE.MeshToonMaterial({ color: '#ffc2dc', emissive: '#ff8fbd', emissiveIntensity: 0.3 })
    addWind(m, 0.03, 0.1)
    return m
  }, [])
  useFrame(() => {
    canopy.emissiveIntensity = 0.3 + glow * 0.9 + Math.sin(runtime.time * 1.6) * 0.08
  })
  return (
    <group position={[t.x, y, t.z]}>
      <mesh geometry={GEO.cylinder} material={toon('#c9a3b4')} scale={[1.3, 6.5, 1.3]} position={[0, 3.25, 0]} castShadow />
      <mesh geometry={GEO.cylinder} material={toon('#c9a3b4')} scale={[0.4, 3, 0.4]} position={[1.4, 5.6, 0]} rotation={[0, 0, -0.8]} />
      <mesh geometry={GEO.cylinder} material={toon('#c9a3b4')} scale={[0.4, 3, 0.4]} position={[-1.4, 5.6, 0]} rotation={[0, 0, 0.8]} />
      {/* heart canopy: two lobes and a point */}
      <mesh geometry={GEO.sphere} material={canopy} scale={[3.6, 3.3, 3.0]} position={[-2.4, 10.2, 0]} castShadow />
      <mesh geometry={GEO.sphere} material={canopy} scale={[3.6, 3.3, 3.0]} position={[2.4, 10.2, 0]} castShadow />
      <mesh geometry={GEO.cone} material={canopy} scale={[5.4, 5.5, 3.0]} position={[0, 6.6, 0]} rotation={[Math.PI, 0, 0]} castShadow />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        return (
          <group key={i} position={[Math.cos(a) * 4.2, 6.2 + (i % 3) * 0.8, Math.sin(a) * 2.6]}>
            <mesh geometry={GEO.cylinder} material={toon('#f3e3c4')} scale={[0.01, 0.8, 0.01]} position={[0, 0.4, 0]} />
            <mesh geometry={GEO.sphere} material={lampMaterial('#fff1b8', '#ffd36e')} scale={[0.16, 0.2, 0.16]} />
          </group>
        )
      })}
      <Sparkles count={Math.round(40 + glow * 80)} scale={[12, 10, 10]} position={[0, 9, 0]} size={4 + glow * 3} speed={0.3} color="#ffd6ea" />
    </group>
  )
}

function StairsDown() {
  const s = G.stairsTop
  useEffect(
    () =>
      interactions.register({
        id: 'stairs-down',
        position: new THREE.Vector3(s.x, 2.5, s.z),
        radius: 2.8,
        label: () => 'Go back down to Bubblegum Bay',
        enabled: () => true,
        onInteract: () => travelTo('bay', 'stairs'),
      }),
    [s.x, s.z],
  )
  return (
    <group>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[s.x, 2 - i * 0.7, s.z + 0.8 + i * 1.1]}>
          <boxGeometry args={[2.4, 0.16, 1.0]} />
          <meshBasicMaterial color="#fff1b8" transparent opacity={0.55 - i * 0.07} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

/** The wish: both cats together under the heart tree, the world lights up, and the final message. */
function Finale({ setGlow }: { setGlow: (v: number) => void }) {
  const seq = useRef<{ t: number } | null>(null)
  const ended = useGame((s) => !!s.flags.ending)
  const meet = G.meet
  const y = gardenHeight(meet.x, meet.z)
  useEffect(() => {
    if (ended) {
      setGlow(1)
      runtime.env.magic = 0.6
    }
    return () => {
      runtime.env.magic = 0
    }
  }, [ended, setGlow])
  useEffect(
    () =>
      interactions.register({
        id: 'wish',
        position: new THREE.Vector3(meet.x, y + 1, meet.z),
        radius: 3.2,
        label: () => (questState('q_g_reunion') === 'in_progress' ? 'Make our wish' : 'Sit under our tree'),
        enabled: () => !seq.current,
        onInteract: () => {
          const qs = questState('q_g_reunion')
          if (qs === 'completed') {
            runtime.player.idleTime = 8
            return say('after_ending')
          }
          if (qs !== 'in_progress') return say('tree_wait')
          say('wish_ready', () => {
            seq.current = { t: 0 }
            const P = runtime.player
            P.frozen = true
            tatan.scripted = true
            P.pos.set(meet.x - 1.2, y, meet.z + 0.4)
            P.yaw = Math.PI / 2
            runtime.companion.pos.set(meet.x + 1.2, y, meet.z + 0.4)
            runtime.companion.yaw = -Math.PI / 2
            runtime.cutscene.active = true
            game.set({ cutscene: true })
            runtime.cutscene.ease = 2.2
            runtime.cutscene.pos.set(0, y + 14, 32)
            runtime.cutscene.look.set(0, y + 5, -6)
            audio.setTheme('reunion')
          })
        },
      }),
    [meet.x, meet.z, y],
  )
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const s = seq.current
    if (!s) return
    const prev = s.t
    s.t += dt
    const at = (k: number) => prev < k && s.t >= k
    const P = runtime.player
    const C = runtime.companion
    if (at(3)) {
      runtime.cutscene.ease = 1.4
      runtime.cutscene.pos.set(4.5, y + 2.2, meet.z + 5.5)
      runtime.cutscene.look.set(0, y + 1, meet.z)
      P.mood = 'happy'
      P.moodTime = 0
      audio.sfx('meow', 720)
    }
    if (s.t > 4 && s.t < 5.2) {
      const k = (s.t - 4) / 1.2
      P.pos.x = meet.x - 1.2 + k * 0.75
      C.pos.x = meet.x + 1.2 - k * 0.75
      P.gait = 0.8
    }
    if (at(5.2)) {
      tatan.hug(60)
      audio.sfx('fragment')
      audio.sfx('meow', 560)
    }
    if (s.t > 5.2) {
      P.mood = 'hug'
      P.moodTime = s.t - 5.2
      if (Math.floor(s.t * 2) !== Math.floor(prev * 2)) bus.emit({ type: 'hearts', x: meet.x, y: y + 1.6, z: meet.z + 0.4, n: 3 })
    }
    if (s.t > 6.5) {
      const k = Math.min(1, (s.t - 6.5) / 3)
      setGlow(k)
      runtime.env.magic = k
      if (at(6.5)) audio.sfx('reveal')
    }
    if (at(9)) {
      runtime.cutscene.ease = 4
      runtime.cutscene.pos.set(0, y + 24, 50)
      runtime.cutscene.look.set(0, y + 6, -4)
    }
    if (at(13)) {
      game.present({
        kind: 'finale',
        onDone: () => {
          seq.current = null
          P.mood = 'none'
          tatan.hug(0)
          P.frozen = false
          tatan.scripted = false
          runtime.cutscene.active = false
          game.set({ cutscene: false })
          game.setFlag('ending')
          dispatch('reunite:tatan')
          runtime.camera.targetYaw = runtime.camera.yaw = 0
          saveGame()
          setTimeout(() => say('after_ending'), 1200)
        },
      })
    }
  })
  return null
}

function GardenWorld() {
  const [glow, setGlow] = useState(0)
  const world = useMemo(() => gardenPhysics(), [])
  const arrived = useRef(false)
  useEffect(() => {
    if (arrived.current || game.get().flags['tatanArrived:gardenIntro']) return
    arrived.current = true
    game.setFlag('tatanArrived:gardenIntro')
    setTimeout(() => say('garden_arrive'), 3800)
  }, [])
  return (
    <group>
      <CloudSea />
      {G.islands.map((isl, i) => (
        <IslandMesh key={isl.id} isl={isl} seed={i * 13 + 5} />
      ))}
      <StarTrees />
      <PetalBridges />
      <Platforms />
      <WishPedestals />
      <LightBridge />
      <HeartTree glow={glow} />
      <StairsDown />
      <Finale setGlow={setGlow} />
      <Coins region="garden" world={world} count={0} seed={9} extra={G.platforms.filter((p) => !p.move).map((p) => ({ x: p.x, z: p.z, y: p.top }))} />
      <Sparkles count={120} scale={[90, 30, 90]} position={[0, 8, 6]} size={3} speed={0.2} color="#fff6e0" />
    </group>
  )
}

export function Garden() {
  return <GardenWorld />
}
