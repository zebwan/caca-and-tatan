import { create } from 'zustand'
import type { DialogueLine, QuestState, RegionId } from '../data/types'

export type Phase = 'title' | 'intro' | 'playing'
export type Menu = null | 'pause' | 'map'

export type Presentation = (
  | { kind: 'dialogue'; lines: DialogueLine[]; onDone?: () => void }
  | { kind: 'note'; noteId: string; onDone?: () => void }
  | { kind: 'keepsake'; id: string }
  | { kind: 'chapterEnd' }
) & { uid?: number }

let presentationUid = 0

export interface QuestProgress {
  state: QuestState
  step: number
  progress: number
}

export interface Toast {
  id: number
  text: string
  icon: 'star' | 'heart' | 'paw' | 'map' | 'gift' | 'butterfly'
}

export interface Settings {
  master: number
  music: number
  sfx: number
  muted: boolean
  sensitivity: number
  invertY: boolean
}

export interface GameState {
  phase: Phase
  introStep: number
  /** True while an in-engine cinematic is playing (HUD hides). */
  cutscene: boolean
  menu: Menu
  queue: Presentation[]
  quests: Record<string, QuestProgress>
  fragments: number
  keepsakes: string[]
  notes: string[]
  accessories: string[]
  equipped: { head: string | null; face: string | null }
  regions: RegionId[]
  collected: string[]
  flags: Record<string, boolean>
  prompt: string | null
  hint: string | null
  toasts: Toast[]
  /** Increments whenever the objective changes; the minimap pulses on change. */
  mapVersion: number
  /** Region whose reveal animation should play next time the map opens. */
  pendingReveal: RegionId | null
  settings: Settings
}

export const DEFAULT_SETTINGS: Settings = {
  master: 0.8,
  music: 0.55,
  sfx: 0.8,
  muted: false,
  sensitivity: 1,
  invertY: false,
}

export function freshProgress(): Omit<GameState, 'phase' | 'introStep' | 'cutscene' | 'menu' | 'settings' | 'prompt' | 'hint' | 'toasts'> {
  return {
    queue: [],
    quests: {},
    fragments: 0,
    keepsakes: [],
    notes: [],
    accessories: ['pinkBow'],
    equipped: { head: null, face: null },
    regions: ['meadow'],
    collected: [],
    flags: {},
    mapVersion: 0,
    pendingReveal: null,
  }
}

export const useGame = create<GameState>(() => ({
  phase: 'title',
  introStep: 0,
  cutscene: false,
  menu: null,
  settings: DEFAULT_SETTINGS,
  prompt: null,
  hint: null,
  toasts: [],
  ...freshProgress(),
}))

export const game = {
  get: useGame.getState,
  set: useGame.setState,

  present(p: Presentation) {
    useGame.setState((s) => ({ queue: [...s.queue, { ...p, uid: ++presentationUid }] }))
  },
  /** Close the presentation on screen and run its callback. */
  dismiss() {
    const cur = useGame.getState().queue[0]
    if (!cur) return
    useGame.setState((s) => ({ queue: s.queue.slice(1) }))
    if ((cur.kind === 'dialogue' || cur.kind === 'note') && cur.onDone) cur.onDone()
  },
  toast(text: string, icon: Toast['icon'] = 'star') {
    const id = Date.now() + Math.random()
    useGame.setState((s) => ({ toasts: [...s.toasts.slice(-3), { id, text, icon }] }))
    setTimeout(() => useGame.setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3600)
  },
  flag(name: string) {
    return !!useGame.getState().flags[name]
  },
  setFlag(name: string, v = true) {
    useGame.setState((s) => ({ flags: { ...s.flags, [name]: v } }))
  },
  setPrompt(p: string | null) {
    if (useGame.getState().prompt !== p) useGame.setState({ prompt: p })
  },
  setHint(h: string | null) {
    if (useGame.getState().hint !== h) useGame.setState({ hint: h })
  },
  /** Player input is blocked by menus, dialogue, notes and cutscenes. */
  inputBlocked() {
    const s = useGame.getState()
    return s.phase !== 'playing' || s.menu !== null || s.queue.length > 0 || s.cutscene
  },
}
