/** Top-level game flow: new game, continue, return to title, safe-spot recovery. */
import { game, freshProgress } from './state/store'
import { runtime, setPlayerPos } from './state/runtime'
import { clearSave, enableSaving, loadSave, saveGame } from './state/save'
import { initialQuests } from './systems/quests'
import { exploration } from './systems/exploration'
import { audio } from './systems/audio'
import { CURRENT_REGION, REGION_RUNTIME } from './world/regions'

function region() {
  return REGION_RUNTIME[CURRENT_REGION]!
}

function placeAtSpawn() {
  const r = region()
  const y = r.heightAt(r.spawn.x, r.spawn.z)
  setPlayerPos(r.spawn.x, y, r.spawn.z, r.spawnYaw)
  const c = runtime.camera
  c.yaw = c.targetYaw = r.spawnYaw + Math.PI
  c.pitch = c.targetPitch = 0.36
  c.dist = c.targetDist = 6.6
}

export function newGame() {
  clearSave()
  game.set({ ...freshProgress(), quests: initialQuests(), phase: 'intro', introStep: 0, cutscene: false, menu: null, prompt: null, hint: null })
  exploration.reset()
  placeAtSpawn()
  runtime.player.sleepingIntro = true
  runtime.player.frozen = false
  runtime.player.mood = 'none'
  enableSaving(true)
  audio.init()
  audio.sfx('start')
  audio.startMusic()
}

export function continueGame() {
  const d = loadSave()
  if (!d) return newGame()
  // merge so quests added in later versions start out locked/available correctly
  const quests = { ...initialQuests(), ...d.quests }
  game.set({
    ...freshProgress(),
    quests,
    fragments: d.fragments,
    keepsakes: d.keepsakes,
    notes: d.notes,
    accessories: d.accessories,
    equipped: d.equipped,
    regions: d.regions,
    collected: d.collected,
    flags: d.flags,
    phase: 'playing',
    menu: null,
    prompt: null,
    hint: null,
  })
  exploration.restore(d.explored)
  const r = region()
  const p = d.player
  const ok = p && Number.isFinite(p.x) && Number.isFinite(p.z) && Math.hypot(p.x, p.z) < 70
  if (ok) {
    setPlayerPos(p.x, Math.max(p.y, r.heightAt(p.x, p.z)), p.z, p.yaw)
    runtime.camera.yaw = runtime.camera.targetYaw = p.yaw + Math.PI
  } else placeAtSpawn()
  runtime.player.sleepingIntro = false
  runtime.player.frozen = false
  enableSaving(true)
  audio.init()
  audio.sfx('start')
  audio.startMusic()
}

export function quitToTitle() {
  saveGame()
  enableSaving(false)
  game.set({ phase: 'title', menu: null, queue: [], prompt: null, hint: null, cutscene: false })
  runtime.cutscene.active = false
}

/** Pause-menu safety net: put Caca back under the big cherry tree. */
export function returnToSafeSpot() {
  placeAtSpawn()
  game.set({ menu: null })
  saveGame()
}

export function finishIntro() {
  game.set({ phase: 'playing' })
  runtime.cutscene.active = false
  // Caca stays curled up for a moment, then stands as the player takes over
  setTimeout(() => {
    runtime.player.sleepingIntro = false
    audio.sfx('meow', 680)
  }, 1200)
  saveGame()
}
