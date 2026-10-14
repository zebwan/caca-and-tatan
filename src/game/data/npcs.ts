import type { QuestState } from './types'
import { NAMES } from './names'
import { VILLAGE_NPCS } from './regions/village'
import { FOREST_NPCS } from './regions/forest'
import { BAY_NPCS } from './regions/bay'

/** Which dialogue an NPC uses, picked by the first rule that matches the quest state. */
export interface DialogueRule {
  quest?: string
  state?: QuestState
  step?: string
  /** Only at this time of day (real clock). */
  time?: 'morning' | 'afternoon' | 'evening' | 'night'
  dialogue: string
  /** Open a shop after the line. */
  open?: 'shop' | 'furniture'
}

/** Things villagers say when they notice a new outfit. {item} is replaced with its name. */
export const OUTFIT_COMPLIMENTS = [
  'Ooh, is that a new {item}? It suits you!',
  'Look at you in that {item}! Adorable.',
  'What a lovely {item}. Ribbon & Bell?',
]

export interface NpcDef {
  id: string
  name: string
  /** Event fired after any conversation, e.g. "talk:mimi". */
  event: string
  rules: DialogueRule[]
}

export const NPCS: Record<string, NpcDef> = {
  mimi: {
    id: 'mimi',
    name: NAMES.mimi,
    event: 'talk:mimi',
    rules: [
      { quest: 'q_teddy', state: 'available', dialogue: 'mimi_offer' },
      { quest: 'q_teddy', state: 'in_progress', step: 'find', dialogue: 'mimi_waiting' },
      { quest: 'q_teddy', state: 'in_progress', step: 'return', dialogue: 'mimi_return' },
      { quest: 'q_teddy', state: 'completed', dialogue: 'mimi_done' },
      { dialogue: 'mimi_locked' },
    ],
  },
  biscuit: {
    id: 'biscuit',
    name: NAMES.biscuit,
    event: 'talk:biscuit',
    rules: [
      { quest: 'q_butterflies', state: 'available', dialogue: 'biscuit_offer' },
      { quest: 'q_butterflies', state: 'in_progress', dialogue: 'biscuit_waiting' },
      { quest: 'q_butterflies', state: 'completed', dialogue: 'biscuit_done' },
      { dialogue: 'biscuit_idle' },
    ],
  },
  pip: {
    id: 'pip',
    name: NAMES.pip,
    event: 'talk:pip',
    rules: [
      { quest: 'q_heartbeat', state: 'available', dialogue: 'pip_offer' },
      { quest: 'q_heartbeat', state: 'in_progress', dialogue: 'pip_waiting' },
      { quest: 'q_heartbeat', state: 'completed', dialogue: 'pip_done' },
      { dialogue: 'pip_idle' },
    ],
  },
}

Object.assign(NPCS, VILLAGE_NPCS, FOREST_NPCS, BAY_NPCS)
