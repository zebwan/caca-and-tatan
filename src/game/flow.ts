/** Top-level game flow: new game, cat creator, continue, region travel, title, safe-spot recovery. */
import { game, freshProgress, DEFAULT_EQUIPPED } from './state/store'
import { runtime, setPlayerPos } from './state/runtime'
import { clearSave, enableSaving, loadSave, saveGame } from './state/save'
import { initialQuests, questPawprints, showNote } from './systems/quests'
import { exploration } from './systems/exploration'
import { audio } from './systems/audio'
import { regionRT, isBuilt } from './world/regions'
import { REGION_BY_ID } from './data/items'
import { QUESTS } from './data/quests'
import { PAWPRINTS } from './data/shop'
import { DEFAULT_LOOKS } from './characters/look'
import type { RegionId } from './data/types'

const ARRIVAL_NOTES: Partial<Record<RegionId, string>> = {
  village: 'note_v_arrive',
  forest: 'note_f_arrive',
  bay: 'note_b_arrive',
  garden: 'note_g_arrive',
}

function placeAt(region: RegionId, entry?: string) {
  const r = regionRT(region)
  const e = r.entries[entry ?? r.defaultEntry] ?? r.entries[r.defaultEntry]
  const y = r.heightAt(e.x, e.z)
  setPlayerPos(e.x, y, e.z, e.yaw)
  const c = runtime.camera
  c.yaw = c.targetYaw = e.yaw + Math.PI
  const indoors = region === 'home'
  c.pitch = c.targetPitch = indoors ? 0.72 : 0.36
  c.dist = c.targetDist = indoors ? 9 : 6.6
  // Tatan appears just behind Caca
  runtime.companion.pos.set(e.x - Math.sin(e.yaw) * 1.6, y, e.z - Math.cos(e.yaw) * 1.6)
  runtime.companion.yaw = e.yaw
}

function enterRegion(region: RegionId) {
  const r = regionRT(region)
  exploration.use(region)
  runtime.world = r.physics()
  audio.setTheme(r.music)
  audio.setAmbience(r.ambience)
}

/** New game → cat creator. */
export function newGame() {
  clearSave()
  game.set({ ...freshProgress(), quests: initialQuests(), phase: 'create', introStep: 0, cutscene: false, menu: null, prompt: null, hint: null })
  exploration.reset()
  enterRegion('meadow')
  placeAt('meadow')
  runtime.player.sleepingIntro = true
  runtime.player.frozen = false
  runtime.player.mood = 'none'
  audio.init()
  audio.startMusic()
}

/** Cat creator confirmed → story intro. */
export function startIntro() {
  game.set({ phase: 'intro', introStep: 0, pawprints: PAWPRINTS.startingGift })
  enableSaving(true)
  audio.sfx('start')
  saveGame()
}

/** Re-run unlock rules (quests added in an update may now be available). */
function refreshUnlocks(quests: ReturnType<typeof initialQuests>) {
  let changed = true
  while (changed) {
    changed = false
    for (const q of QUESTS) {
      const st = quests[q.id]
      if (st.state !== 'locked' || !q.requires.every((r) => quests[r]?.state === 'completed')) continue
      quests[q.id] = { state: q.startEvent ? 'available' : 'in_progress', step: 0, progress: 0 }
      changed = true
    }
  }
  return quests
}

export function continueGame() {
  const d = loadSave()
  if (!d) return newGame()
  const fresh = initialQuests()
  // merge so quests added in later versions start out locked/available correctly
  const quests = refreshUnlocks({ ...fresh, ...d.quests })
  const region: RegionId = d.region && isBuilt(d.region) ? d.region : 'meadow'
  // saves from before Pawprints existed get credit for quests already finished
  const paws =
    d.pawprints === undefined
      ? PAWPRINTS.startingGift + QUESTS.filter((q) => d.quests[q.id]?.state === 'completed').reduce((n, q) => n + questPawprints(q.id), 0)
      : d.pawprints
  const base = freshProgress()
  game.set({
    ...base,
    quests,
    fragments: d.fragments,
    keepsakes: d.keepsakes,
    notes: d.notes,
    accessories: Array.from(new Set(['pinkBow', 'blueScarf', ...(d.accessories ?? [])])),
    equipped: { ...DEFAULT_EQUIPPED, ...(d.equipped ?? {}) },
    equippedTatan: { ...base.equippedTatan, ...(d.equippedTatan ?? {}) },
    looks: { caca: { ...DEFAULT_LOOKS.caca, ...(d.looks?.caca ?? {}) }, tatan: { ...DEFAULT_LOOKS.tatan, ...(d.looks?.tatan ?? {}) } },
    pawprints: paws,
    owned: Array.from(new Set([...base.owned, ...(d.owned ?? [])])),
    home: { ...base.home, ...(d.home ?? {}) },
    regions: d.regions,
    collected: d.collected,
    flags: d.flags,
    region,
    phase: 'playing',
    menu: null,
    prompt: null,
    hint: null,
  })
  exploration.restore(d.explored)
  enterRegion(region)
  const r = regionRT(region)
  const p = d.player
  const ok = p && (d.region ?? 'meadow') === region && Number.isFinite(p.x) && Number.isFinite(p.z) && Math.hypot(p.x, p.z) < 70 && p.y > -10
  if (ok) {
    setPlayerPos(p.x, Math.max(p.y, r.heightAt(p.x, p.z)), p.z, p.yaw)
    runtime.camera.yaw = runtime.camera.targetYaw = p.yaw + Math.PI
    runtime.companion.pos.set(p.x - Math.sin(p.yaw) * 1.6, p.y, p.z - Math.cos(p.yaw) * 1.6)
  } else placeAt(region)
  runtime.player.sleepingIntro = false
  runtime.player.frozen = false
  enableSaving(true)
  audio.init()
  audio.sfx('start')
  audio.startMusic()
  saveGame()
}

/** Walk through an exit into another region (with a soft fade). */
export function travelTo(region: RegionId, entry: string) {
  if (!isBuilt(region)) return
  const s = game.get()
  if (s.fade) return
  game.set({ fade: true, prompt: null, menu: null })
  audio.sfx('whoosh')
  setTimeout(() => {
    const cur = game.get()
    const regions = cur.regions.includes(region) ? cur.regions : [...cur.regions, region]
    game.set({ region, regions, mapVersion: cur.mapVersion + 1 })
    enterRegion(region)
    placeAt(region, entry)
    saveGame()
    setTimeout(() => {
      game.set({ fade: false })
      arrived(region)
    }, 380)
  }, 520)
}

function arrived(region: RegionId) {
  const flag = `visited:${region}`
  if (game.flag(flag)) return
  game.setFlag(flag)
  const def = REGION_BY_ID[region]
  if (def) game.present({ kind: 'banner', title: def.name, subtitle: def.tagline })
  const note = ARRIVAL_NOTES[region]
  // Tatan only writes notes while he's still lost
  if (note && !game.flag('tatanJoined')) setTimeout(() => showNote(note), 300)
  saveGame()
}

export function quitToTitle() {
  saveGame()
  enableSaving(false)
  game.set({ phase: 'title', menu: null, queue: [], prompt: null, hint: null, cutscene: false })
  runtime.cutscene.active = false
}

/** Pause-menu safety net: put Caca back at the region's main entrance. */
export function returnToSafeSpot() {
  placeAt(game.get().region)
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
