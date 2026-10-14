import { useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Environment, EnvClock } from './world/Environment'
import { Petals, Rain, NightFireflies } from './world/Weather'
import { Guidance } from './world/Guidance'
import { Companion } from './characters/Companion'
import { Hearts, LeafUmbrella } from './world/Hearts'
import type { RegionId } from './data/types'
import { Player } from './characters/Player'
import { CameraRig } from './characters/CameraRig'
import { runtime } from './state/runtime'
import { game, useGame } from './state/store'
import { saveGame } from './state/save'
import { installInput, input } from './systems/input'
import { interactions } from './systems/interactions'
import { windUniforms } from './world/materials'
import { regionRT } from './world/regions'
import { HINTS } from './data/story'
import { MEADOW } from './world/meadow/layout'

/** Per-frame glue: clock, interaction prompt, tutorial hints, autosave, intro camera. */
function GameLoop() {
  const st = useMemo(() => ({ save: 6, hintT: 0, hintKey: '' }), [])
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    runtime.time += dt
    windUniforms.uTime.value = runtime.time
    const s = game.get()
    const P = runtime.player

    // intro flyover shots, one per story card
    if (s.phase === 'intro') {
      const c = runtime.cutscene
      c.active = true
      const shots: [THREE.Vector3Tuple, THREE.Vector3Tuple][] = [
        [[30, 26, 70], [0, 4, 0]],
        [[8, 20, -24], [24, 62, -175]],
        [[P.pos.x + 2.6, P.pos.y + 1.6, P.pos.z + 3.4], [P.pos.x, P.pos.y + 0.4, P.pos.z]],
      ]
      const [pos, look] = shots[Math.min(s.introStep, shots.length - 1)]
      c.ease = s.introStep === 0 ? 2.2 : 1.0
      c.pos.set(...pos)
      c.look.set(...look)
    }

    // interaction target + prompt
    if (s.phase === 'playing' && !game.inputBlocked() && !runtime.cutscene.active && !P.frozen) {
      const best = interactions.nearest(P.pos, P.yaw)
      game.setPrompt(best ? best.label() : null)
      P.look = best ? best.position : null
      if (input.interact && best) {
        best.onInteract()
        game.setFlag('interacted')
      }
    } else {
      game.setPrompt(null)
      P.look = null
    }
    input.interact = false

    // tutorial hints, one at a time
    if (s.phase === 'playing' && !game.inputBlocked()) {
      const f = s.flags
      const moved = Math.hypot(P.pos.x - MEADOW.spawn.x, P.pos.z - MEADOW.spawn.z) > 3
      if (moved && !f.moved) game.setFlag('moved')
      let key = ''
      if (!f.moved) key = input.isTouch ? 'moveTouch' : 'move'
      else if (!f.lookedAround && !input.isTouch && !f['hint:look']) key = 'look'
      else if (s.quests.q_note?.state === 'completed' && !f.jumped && !f['hint:jump']) key = 'jump'
      else if (s.quests.q_teddy?.state === 'in_progress' && !f['hint:run']) key = 'run'
      else if (s.quests.q_teddy?.state === 'in_progress' && !f['hint:map']) key = 'map'
      if (key !== st.hintKey) {
        st.hintKey = key
        st.hintT = 0
      }
      st.hintT += dt
      if (key && st.hintT > (key === 'move' || key === 'moveTouch' ? 999 : 9)) game.setFlag(`hint:${key}`)
      game.setHint(key ? HINTS[key as keyof typeof HINTS] : null)
    } else game.setHint(null)

    // autosave
    st.save -= dt
    if (st.save <= 0 && s.phase === 'playing') {
      saveGame()
      st.save = 6
    }
  })
  return null
}

function InputBinder() {
  const gl = useThree((s) => s.gl)
  useEffect(() => installInput(gl.domElement), [gl])
  return null
}

function RegionWorld({ id }: { id: RegionId }) {
  const region = regionRT(id)
  useEffect(() => {
    runtime.world = region.physics()
  }, [region])
  const Scene = region.Scene
  const Distant = region.Distant
  const atmo = region.atmosphere
  return (
    <>
      <Environment atmosphere={atmo} />
      <Distant />
      <Scene />
      <Petals base={atmo.petals ? 0.35 : 0} />
      <NightFireflies base={id === 'forest' ? 0.55 : 0} />
      <Guidance heightAt={region.heightAt} />
    </>
  )
}

export function GameScene() {
  const regionId = useGame((s) => s.region)
  return (
    <Canvas
      shadows="soft"
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 55, near: 0.1, far: 1000, position: [0, 30, 60] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping
        gl.toneMappingExposure = 1.0
      }}
    >
      <InputBinder />
      <EnvClock />
      <GameLoop />
      <RegionWorld key={regionId} id={regionId} />
      <Player />
      <Companion />
      <CameraRig />
      <Rain />
      <Hearts />
      <LeafUmbrella />
    </Canvas>
  )
}
