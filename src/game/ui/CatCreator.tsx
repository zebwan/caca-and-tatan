/** The cat creator: customise Caca (before the adventure) or Tatan (from the wardrobe). */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { applyOutfit, buildCat, disposeRig, VARIANTS } from '../characters/catBuilder'
import { CatAnimator } from '../characters/catAnimation'
import {
  BLUSH_COLORS, DEFAULT_LOOKS, EAR_STYLES, EYE_COLORS, EYE_STYLES, FUR_SWATCHES, PATTERN_SWATCHES, PATTERNS, TAIL_STYLES,
  lookKey, type CatLook,
} from '../characters/look'
import { game, useGame, type Equipped } from '../state/store'
import { audio } from '../systems/audio'
import { saveGame } from '../state/save'

function Preview({ who, look, outfit }: { who: 'caca' | 'tatan'; look: CatLook; outfit: Equipped }) {
  const key = lookKey(look)
  const rig = useMemo(() => buildCat(VARIANTS[who], look), [who, key]) // eslint-disable-line react-hooks/exhaustive-deps
  const anim = useMemo(() => new CatAnimator(), [])
  const spin = useRef({ yaw: 0.5, drag: false, lastX: 0, t: 0 })
  useEffect(() => () => disposeRig(rig), [rig])
  useEffect(() => applyOutfit(rig, outfit), [rig, outfit])
  useFrame((_, dt) => {
    const s = spin.current
    s.t += dt
    if (!s.drag) s.yaw += dt * 0.35
    rig.root.rotation.y = s.yaw
    anim.update(rig, { dt, t: s.t, gait: 0, grounded: true, vy: 0, idleTime: 0, mood: Math.sin(s.t * 0.4) > 0.92 ? 'happy' : 'none', moodTime: 0, lookYaw: null, allowRest: false })
  })
  return (
    <>
      <primitive object={rig.root} />
      <mesh
        position={[0, 0.7, 0]}
        visible={false}
        onPointerDown={(e) => {
          spin.current.drag = true
          spin.current.lastX = e.clientX
        }}
        onPointerMove={(e) => {
          if (!spin.current.drag) return
          spin.current.yaw += (e.clientX - spin.current.lastX) * 0.012
          spin.current.lastX = e.clientX
        }}
        onPointerUp={() => (spin.current.drag = false)}
        onPointerLeave={() => (spin.current.drag = false)}
      >
        <boxGeometry args={[4, 3, 4]} />
      </mesh>
    </>
  )
}

export function CatPreviewCanvas({ who, look, outfit }: { who: 'caca' | 'tatan'; look: CatLook; outfit: Equipped }) {
  return (
    <Canvas
      className="creator-canvas"
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      camera={{ fov: 32, position: [0, 1.05, 3.6] }}
      onCreated={({ gl, camera }) => {
        gl.toneMapping = THREE.NeutralToneMapping
        camera.lookAt(0, 0.62, 0)
      }}
    >
      <hemisphereLight args={['#fff1f5', '#e8d6ff', 1.5]} />
      <directionalLight position={[2, 3, 3]} intensity={1.6} color="#fff3e2" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
        <circleGeometry args={[0.9, 40]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.55} />
      </mesh>
      <Preview who={who} look={look} outfit={outfit} />
    </Canvas>
  )
}

function Swatches({ colors, value, onPick }: { colors: { name?: string; color: string }[]; value: string; onPick: (c: string) => void }) {
  return (
    <div className="swatches">
      {colors.map((c) => (
        <button key={c.color} className={`swatch ${value === c.color ? 'on' : ''}`} title={c.name} style={{ background: c.color }} onClick={() => onPick(c.color)} />
      ))}
    </div>
  )
}
function Chips<T extends string>({ items, value, onPick }: { items: { id: T; name: string }[]; value: T; onPick: (v: T) => void }) {
  return (
    <div className="chips">
      {items.map((i) => (
        <button key={i.id} className={`chip ${value === i.id ? 'on' : ''}`} onClick={() => onPick(i.id)}>
          {i.name}
        </button>
      ))}
    </div>
  )
}

const rand = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)]

export function CatCreator({ who, onDone, onCancel, startMode }: { who: 'caca' | 'tatan'; onDone: () => void; onCancel?: () => void; startMode?: boolean }) {
  const saved = useGame((s) => s.looks[who])
  const outfit = useGame((s) => (who === 'caca' ? s.equipped : s.equippedTatan))
  const [look, setLook] = useState<CatLook>({ ...saved })
  const set = (patch: Partial<CatLook>) => {
    audio.sfx('click')
    setLook((l) => ({ ...l, ...patch }))
  }
  const name = who === 'caca' ? 'Caca' : 'Tatan'

  const finish = () => {
    game.set({ looks: { ...game.get().looks, [who]: look } })
    audio.sfx('chime')
    saveGame()
    onDone()
  }

  return (
    <div className={`creator ${startMode ? 'start' : ''}`}>
      <div className="creator-stage">
        <CatPreviewCanvas who={who} look={look} outfit={outfit} />
        <div className="creator-name">{name}</div>
        <div className="muted creator-tip">Drag to turn {name} around</div>
      </div>
      <div className="creator-panel panel">
        <h2>{startMode ? 'Make your Caca' : `Style ${name}`}</h2>
        <p className="muted">{startMode ? 'Make her as cute as you like. You can change this later in the wardrobe.' : 'Changes show up as soon as you’re done.'}</p>
        <div className="creator-scroll">
          <section>
            <h4>Fur</h4>
            <Swatches colors={FUR_SWATCHES} value={look.fur} onPick={(fur) => set({ fur })} />
          </section>
          <section>
            <h4>Markings</h4>
            <Chips items={PATTERNS} value={look.pattern} onPick={(pattern) => set({ pattern })} />
            {look.pattern !== 'none' && <Swatches colors={PATTERN_SWATCHES.map((color) => ({ color }))} value={look.patternColor} onPick={(patternColor) => set({ patternColor })} />}
          </section>
          <section>
            <h4>Eyes</h4>
            <Chips items={EYE_STYLES} value={look.eyes} onPick={(eyes) => set({ eyes })} />
            <Swatches colors={EYE_COLORS} value={look.eyeColor} onPick={(eyeColor) => set({ eyeColor })} />
          </section>
          <section>
            <h4>Ears</h4>
            <Chips items={EAR_STYLES} value={look.ears} onPick={(ears) => set({ ears })} />
          </section>
          <section>
            <h4>Tail</h4>
            <Chips items={TAIL_STYLES} value={look.tail} onPick={(tail) => set({ tail })} />
          </section>
          <section>
            <h4>Cheeks</h4>
            <div className="chips">
              <button className={`chip ${look.blush === null ? 'on' : ''}`} onClick={() => set({ blush: null })}>
                No blush
              </button>
              {BLUSH_COLORS.map((c) => (
                <button key={c} className={`chip dot ${look.blush === c ? 'on' : ''}`} onClick={() => set({ blush: c })}>
                  <i style={{ background: c }} /> Blush
                </button>
              ))}
              <button className={`chip ${look.freckles ? 'on' : ''}`} onClick={() => set({ freckles: !look.freckles })}>
                Freckles
              </button>
            </div>
          </section>
        </div>
        <div className="row creator-actions">
          <button
            className="btn ghost"
            onClick={() =>
              set({
                fur: rand(FUR_SWATCHES).color,
                pattern: rand(PATTERNS).id,
                patternColor: rand(PATTERN_SWATCHES),
                eyes: rand(EYE_STYLES).id,
                eyeColor: rand(EYE_COLORS).color,
                ears: rand(EAR_STYLES).id,
                tail: rand(TAIL_STYLES).id,
                blush: rand([...BLUSH_COLORS, null]),
                freckles: Math.random() < 0.3,
              })
            }
          >
            Surprise me
          </button>
          <button className="btn ghost" onClick={() => setLook({ ...DEFAULT_LOOKS[who] })}>
            Reset
          </button>
          {onCancel && (
            <button className="btn soft small" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button className="btn" onClick={finish}>
            {startMode ? 'She’s perfect!' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  )
}
