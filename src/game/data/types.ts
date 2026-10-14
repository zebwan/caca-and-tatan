export type Vec2 = { x: number; z: number }

export type RegionId = 'meadow' | 'village' | 'forest' | 'bay' | 'garden' | 'home'

export type QuestState = 'locked' | 'available' | 'in_progress' | 'completed'

/** A quest step completes when its event fires `count` times. Events look like "talk:mimi". */
export interface QuestStep {
  id: string
  /** Short text shown in the objective tracker. */
  objective: string
  event: string
  count?: number
  /** World position of the objective marker for this step. */
  location: Vec2
  /** Optional label for the progress counter, e.g. "butterflies". */
  progressLabel?: string
  /**
   * For "do this N times" steps: the individual targets. The objective marker
   * points at the nearest one not yet done (ids are `${prefix}:${index}` in
   * the collected list), or strictly the next one when `ordered`.
   */
  targets?: { prefix: string; points: Vec2[]; ordered?: boolean }
  /** Region of this step when it differs from the quest's region. */
  region?: RegionId
}

export interface QuestReward {
  fragments?: number
  keepsake?: string
  accessory?: string
  /** Tatan note shown when the quest completes. */
  note?: string
  /** Dialogue (usually Tatan talking, once he's with Caca) shown when the quest completes. */
  say?: string
  /** Pawprints earned; defaults from data/shop.ts PAWPRINTS when omitted. */
  pawprints?: number
}

export interface QuestDef {
  id: string
  region: RegionId
  title: string
  description: string
  main: boolean
  /** Quests that must be completed before this one becomes available. */
  requires: string[]
  /** Event that starts the quest (moves it from available to in_progress). Omit to start immediately when unlocked. */
  startEvent?: string
  /** Where the quest is picked up (marker while "available"). */
  startLocation: Vec2
  startObjective: string
  steps: QuestStep[]
  reward: QuestReward
  /** Shop items given for free when the quest starts. */
  startGift?: string[]
  /** Quest ids unlocked on completion (in addition to anything whose `requires` is now met). */
  unlocks?: string[]
}

export interface DialogueLine {
  speaker: string
  text: string
}

export interface NoteDef {
  id: string
  title: string
  body: string
  signature: string
}

export interface KeepsakeDef {
  id: string
  name: string
  description: string
  region: RegionId
}

export interface AccessoryDef {
  id: string
  name: string
  description: string
  slot: 'bow' | 'head' | 'face' | 'neck' | 'back'
  /** How it is unlocked, shown in the wardrobe while locked. */
  hint: string
}

export interface RegionDef {
  id: RegionId
  name: string
  tagline: string
  /** Position of the region on the illustrated world map, in map % units. */
  map: { x: number; y: number; r: number }
  /** Region that must be finished (its chapter-end quest) to unlock this one. */
  unlockedBy?: string
  built: boolean
}
