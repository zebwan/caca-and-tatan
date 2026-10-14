import { game, DEFAULT_SETTINGS, type GameState, type Settings } from './store'
import { runtime } from './runtime'
import { exploration } from '../systems/exploration'

const SAVE_KEY = 'caca-tatan:save:v1'
const SETTINGS_KEY = 'caca-tatan:settings:v1'

type Persisted = Pick<
  GameState,
  'quests' | 'fragments' | 'keepsakes' | 'notes' | 'accessories' | 'equipped' | 'regions' | 'collected' | 'flags'
> &
  Partial<Pick<GameState, 'region' | 'equippedTatan' | 'looks' | 'pawprints' | 'owned' | 'home'>> & {
  version: 1
  savedAt: number
  player: { x: number; y: number; z: number; yaw: number }
  explored?: Record<string, string> | string
}

function safeGet(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage unavailable (private mode) — the game still runs, it just won't remember */
  }
}

let enabled = false
/** Saving is off on the title screen so the attract camera can't overwrite a save. */
export function enableSaving(on: boolean) {
  enabled = on
}

export function saveGame() {
  if (!enabled) return
  const s = game.get()
  const p = runtime.player.lastSafe
  const data: Persisted = {
    version: 1,
    savedAt: Date.now(),
    quests: s.quests,
    fragments: s.fragments,
    keepsakes: s.keepsakes,
    notes: s.notes,
    accessories: s.accessories,
    equipped: s.equipped,
    regions: s.regions,
    collected: s.collected,
    flags: s.flags,
    region: s.region,
    equippedTatan: s.equippedTatan,
    looks: s.looks,
    pawprints: s.pawprints,
    owned: s.owned,
    home: s.home,
    player: { x: p.x, y: p.y, z: p.z, yaw: runtime.player.yaw },
    explored: exploration.serialize(),
  }
  safeSet(SAVE_KEY, JSON.stringify(data))
}

export function loadSave(): Persisted | null {
  const raw = safeGet(SAVE_KEY)
  if (!raw) return null
  try {
    const d = JSON.parse(raw) as Persisted
    return d && d.version === 1 && d.quests ? d : null
  } catch {
    return null
  }
}

export function hasSave() {
  return loadSave() !== null
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch {
    /* ignore */
  }
}

export function loadSettings(): Settings {
  const raw = safeGet(SETTINGS_KEY)
  if (!raw) return DEFAULT_SETTINGS
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(s: Settings) {
  safeSet(SETTINGS_KEY, JSON.stringify(s))
}
