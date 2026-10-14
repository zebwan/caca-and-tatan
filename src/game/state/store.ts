import { create } from 'zustand'
import type { DialogueLine, QuestState, RegionId } from '../data/types'
import { DEFAULT_LOOKS, type CatLook } from '../characters/look'
import { DEFAULT_HOME, FREE_ITEMS, type HomeSlot } from '../data/shop'

export type Phase = 'title' | 'create' | 'intro' | 'playing'
export type Menu = null | 'pause' | 'map' | 'shop' | 'furniture' | 'decorate' | 'style'

export type Presentation = (
  | { kind: 'dialogue'; lines: DialogueLine[]; onDone?: () => void }
  | { kind: 'note'; noteId: string; onDone?: () => void }
  | { kind: 'keepsake'; id: string }
  | { kind: 'chapterEnd' }
  | { kind: 'banner'; title: string; subtitle: string }
  | { kind: 'finale'; onDone?: () => void }
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
  /** Follow the real clock for day/night, or keep it daytime. */
  clock: 'real' | 'day'
  /** UI text scale. */
  textSize: 1 | 1.15 | 1.3
  /** Keep the glowing paw trail visible all the time. */
  alwaysTrail: boolean
  /** Run by holding Shift, or toggle it on/off. */
  runMode: 'hold' | 'toggle'
  /** Gentle weather (petal showers, light rain). */
  weather: boolean
}

export interface Equipped {
  bow: string
  head: string | null
  face: string | null
  back: string | null
  neck: string | null
}
export const DEFAULT_EQUIPPED: Equipped = { bow: 'pinkBow', head: null, face: null, back: null, neck: null }

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
  equipped: Equipped
  equippedTatan: Equipped
  looks: { caca: CatLook; tatan: CatLook }
  pawprints: number
  /** Bought shop items (clothes + furniture). */
  owned: string[]
  home: Partial<Record<HomeSlot, string>>
  /** Which shop / home slot / cat a menu is about. */
  menuArg: string | null
  /** Region Caca is currently in. */
  region: RegionId
  /** Screen fade for region travel. */
  fade: boolean
  /** A region's title banner shown on first arrival. */
  banner: string | null
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
  clock: 'real',
  textSize: 1,
  alwaysTrail: false,
  runMode: 'hold',
  weather: true,
}

export function freshProgress(): Omit<GameState, 'phase' | 'introStep' | 'cutscene' | 'menu' | 'menuArg' | 'settings' | 'prompt' | 'hint' | 'toasts' | 'fade' | 'banner'> {
  return {
    queue: [],
    quests: {},
    fragments: 0,
    keepsakes: [],
    notes: [],
    accessories: ['pinkBow', 'blueScarf'],
    equipped: { ...DEFAULT_EQUIPPED },
    equippedTatan: { ...DEFAULT_EQUIPPED, bow: 'none', neck: 'blueScarf' },
    looks: { caca: { ...DEFAULT_LOOKS.caca }, tatan: { ...DEFAULT_LOOKS.tatan } },
    pawprints: 0,
    owned: [...FREE_ITEMS],
    home: { ...DEFAULT_HOME },
    region: 'meadow',
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
  fade: false,
  banner: null,
  menuArg: null,
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
    if ((cur.kind === 'dialogue' || cur.kind === 'note' || cur.kind === 'finale') && cur.onDone) cur.onDone()
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
    return s.phase !== 'playing' || s.menu !== null || s.queue.length > 0 || s.cutscene || s.fade
  },
}
