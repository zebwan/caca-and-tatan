/**
 * Reusable quest engine. All progression flows through `dispatch(event)`.
 * Rewards are granted inside the single transition to "completed", so
 * repeating an interaction can never grant them twice.
 */
import { QUESTS, QUEST_BY_ID } from '../data/quests'
import { ACCESSORIES, KEEPSAKES } from '../data/items'
import { NOTES } from '../data/story'
import { KEEPSAKE_MEMORIES } from '../data/personal'
import type { QuestDef, RegionId, Vec2 } from '../data/types'
import { game, type QuestProgress } from '../state/store'
import { bus } from './bus'
import { saveGame } from '../state/save'
import { CLOTHING_BY_ID, PAWPRINTS } from '../data/shop'
import { say } from './dialogue'

export function initialQuests(): Record<string, QuestProgress> {
  const q: Record<string, QuestProgress> = {}
  for (const d of QUESTS) q[d.id] = { state: 'locked', step: 0, progress: 0 }
  return unlockReady(q, false)
}

/** Move locked quests whose requirements are met to available (or straight to in progress). */
function unlockReady(quests: Record<string, QuestProgress>, announce: boolean) {
  let changed = true
  while (changed) {
    changed = false
    for (const d of QUESTS) {
      const st = quests[d.id] ?? { state: 'locked', step: 0, progress: 0 }
      if (st.state !== 'locked') continue
      if (!d.requires.every((r) => quests[r]?.state === 'completed')) continue
      quests[d.id] = { state: d.startEvent ? 'available' : 'in_progress', step: 0, progress: 0 }
      changed = true
      if (announce && !d.startEvent) setTimeout(() => bus.emit({ type: 'questStarted', id: d.id }), 0)
    }
  }
  return quests
}

export function dispatch(event: string) {
  const s = game.get()
  const quests = { ...s.quests }
  const completed: QuestDef[] = []
  let changed = false

  for (const d of QUESTS) {
    const st = quests[d.id]
    if (!st) continue
    if (st.state === 'available' && d.startEvent === event) {
      quests[d.id] = { state: 'in_progress', step: 0, progress: 0 }
      changed = true
      bus.emit({ type: 'questStarted', id: d.id })
      if (d.startGift?.length) {
        const owned = game.get().owned
        game.set({ owned: Array.from(new Set([...owned, ...d.startGift])) })
        game.toast('Housewarming gifts are waiting at Lilac Cottage!', 'gift')
      }
      continue
    }
    if (st.state !== 'in_progress') continue
    const step = d.steps[st.step]
    if (!step || step.event !== event) continue
    const need = step.count ?? 1
    const progress = st.progress + 1
    changed = true
    if (progress < need) {
      quests[d.id] = { ...st, progress }
      bus.emit({ type: 'questProgress', id: d.id, n: progress, total: need })
    } else if (st.step + 1 < d.steps.length) {
      quests[d.id] = { state: 'in_progress', step: st.step + 1, progress: 0 }
      bus.emit({ type: 'questStep', id: d.id })
    } else {
      quests[d.id] = { state: 'completed', step: st.step, progress }
      completed.push(d)
    }
  }
  if (!changed) return

  game.set({ quests, mapVersion: s.mapVersion + 1 })
  for (const d of completed) grantRewards(d)
  game.set({ quests: unlockReady({ ...game.get().quests }, true) })
  saveGame()
}

export function questPawprints(id: string) {
  const q = QUEST_BY_ID[id]
  if (!q) return 0
  if (q.reward.pawprints !== undefined) return q.reward.pawprints
  if (!q.main) return PAWPRINTS.optionalQuest
  return q.steps.some((s) => s.event.startsWith('activate:')) ? PAWPRINTS.chapterEnd : PAWPRINTS.mainQuest
}

export function addPawprints(n: number, why?: string) {
  if (!n) return
  game.set({ pawprints: game.get().pawprints + n })
  bus.emit({ type: 'pawprints', n, why })
}

function grantRewards(d: QuestDef) {
  const r = d.reward
  addPawprints(questPawprints(d.id))
  const s = game.get()
  if (r.fragments) {
    const total = s.fragments + r.fragments
    game.set({ fragments: total })
    bus.emit({ type: 'fragment', total })
  }
  if (r.accessory) unlockAccessory(r.accessory)
  if (r.keepsake) collectKeepsake(r.keepsake)
  bus.emit({ type: 'questCompleted', id: d.id })
  if (r.say) {
    const sayId = r.say
    setTimeout(() => say(sayId), 1500)
  }
  if (r.note) {
    const noteId = r.note
    // let the celebration play before the letter appears
    setTimeout(() => showNote(noteId), d.id === 'q_note' ? 0 : 1500)
  }
}

export function showNote(noteId: string, onDone?: () => void) {
  if (!NOTES[noteId]) return
  const s = game.get()
  if (!s.notes.includes(noteId)) game.set({ notes: [...s.notes, noteId] })
  game.present({ kind: 'note', noteId, onDone })
}

export function unlockAccessory(id: string) {
  const s = game.get()
  if (s.accessories.includes(id)) return
  game.set({ accessories: [...s.accessories, id] })
  const def = ACCESSORIES.find((a) => a.id === id) ?? CLOTHING_BY_ID[id]
  bus.emit({ type: 'accessory', id })
  game.toast(`Unlocked: ${def?.name ?? id} — wear it from the pause menu`, 'gift')
}

export function collectKeepsake(id: string) {
  const s = game.get()
  if (s.keepsakes.includes(id) || !KEEPSAKES[id]) return
  const keepsakes = [...s.keepsakes, id]
  game.set({ keepsakes })
  bus.emit({ type: 'keepsake', id })
  game.present({ kind: 'keepsake', id })
  const region = KEEPSAKES[id].region
  const all = Object.values(KEEPSAKES).filter((k) => k.region === region)
  if (region === 'meadow' && all.every((k) => keepsakes.includes(k.id))) unlockAccessory('heartGlasses')
  if (Object.keys(KEEPSAKES).every((k) => keepsakes.includes(k))) unlockAccessory('loveLocket')
  saveGame()
}

export function keepsakeMemory(id: string) {
  return KEEPSAKE_MEMORIES[id] ?? ''
}

export function revealRegion(id: RegionId) {
  const s = game.get()
  if (s.regions.includes(id)) return
  game.set({ regions: [...s.regions, id], pendingReveal: id })
}

export function questState(id: string) {
  return game.get().quests[id]?.state ?? 'locked'
}
export function questStepId(id: string) {
  const st = game.get().quests[id]
  return st ? QUEST_BY_ID[id]?.steps[st.step]?.id : undefined
}

export interface Objective {
  questId: string
  title: string
  text: string
  region: RegionId
  location: Vec2
  progress?: { n: number; total: number; label: string }
  targets?: { prefix: string; points: Vec2[]; ordered?: boolean }
}

/** The current main objective: the first main quest that is available or in progress. */
export function currentObjective(quests: Record<string, QuestProgress>): Objective | null {
  for (const d of QUESTS) {
    if (!d.main) continue
    const st = quests[d.id]
    if (!st) continue
    if (st.state === 'available') return { questId: d.id, title: d.title, text: d.startObjective, location: d.startLocation, region: d.region }
    if (st.state === 'in_progress') {
      const step = d.steps[st.step]
      return {
        questId: d.id,
        title: d.title,
        text: step.objective,
        location: step.location,
        region: step.region ?? d.region,
        targets: step.targets,
        progress: step.count ? { n: st.progress, total: step.count, label: step.progressLabel ?? '' } : undefined,
      }
    }
  }
  return null
}

/** Where the objective marker should go: the step's own spot, or the nearest/next target not yet done. */
export function objectivePoint(o: Objective, collected: string[], from: { x: number; z: number }): Vec2 {
  const t = o.targets
  if (!t) return o.location
  const open = t.points.map((p, i) => ({ p, i })).filter(({ i }) => !collected.includes(`${t.prefix}:${i}`))
  if (!open.length) return o.location
  if (t.ordered) return open[0].p
  open.sort((a, b) => Math.hypot(a.p.x - from.x, a.p.z - from.z) - Math.hypot(b.p.x - from.x, b.p.z - from.z))
  return open[0].p
}

/** Locations of finished main quests in a region, for "completed" map markers. */
export function completedLocations(quests: Record<string, QuestProgress>, region: RegionId): Vec2[] {
  return QUESTS.filter((d) => d.main && d.region === region && quests[d.id]?.state === 'completed').map((d) => d.steps[d.steps.length - 1].location)
}

/** Optional quests currently on the go (for the journal). */
export function activeOptional(quests: Record<string, QuestProgress>) {
  return QUESTS.filter((d) => !d.main && (quests[d.id]?.state === 'in_progress'))
}
