import type { QuestDef } from './types'
import { MEADOW } from '../world/meadow/layout'
import { VILLAGE_QUESTS } from './regions/village'
import { FOREST_QUESTS } from './regions/forest'
import { BAY_QUESTS } from './regions/bay'
import { GARDEN_QUESTS } from './regions/garden'

/**
 * Quest definitions. A quest becomes "available" when every quest in
 * `requires` is completed. If it has a `startEvent` it waits for that event,
 * otherwise it starts at once. Each step completes when its `event` fires
 * `count` times. Events: talk:<npc>, read:<noteId>, collect:<item>, solve:<puzzle>, activate:<object>.
 */
export const QUESTS: QuestDef[] = [
  {
    id: 'q_note',
    region: 'meadow',
    title: 'A Note from Tatan',
    description: 'Something is glowing on a little post next to the big cherry tree.',
    main: true,
    requires: [],
    startLocation: MEADOW.notePost,
    startObjective: "Read the glowing note",
    steps: [{ id: 'read', objective: 'Read the glowing note', event: 'read:note_start', location: MEADOW.notePost }],
    reward: { note: 'note_start' },
  },
  {
    id: 'q_teddy',
    region: 'meadow',
    title: 'The Lost Teddy',
    description: 'A little kitten named Mimi has lost her teddy bear, Mr. Buttons.',
    main: true,
    requires: ['q_note'],
    startEvent: 'talk:mimi',
    startLocation: MEADOW.npcs.mimi,
    startObjective: 'Find the kitten by the cottage',
    steps: [
      { id: 'find', objective: 'Look for Mr. Buttons on the hill swing', event: 'collect:teddy', location: MEADOW.teddy },
      { id: 'return', objective: 'Bring Mr. Buttons back to Mimi', event: 'talk:mimi', location: MEADOW.npcs.mimi },
    ],
    reward: { fragments: 1, note: 'note_teddy' },
  },
  {
    id: 'q_butterflies',
    region: 'meadow',
    title: 'The Butterfly Chase',
    description: 'Starlight butterflies are fluttering around Grandma Biscuit’s flower field.',
    main: true,
    requires: ['q_teddy'],
    startEvent: 'talk:biscuit',
    startLocation: MEADOW.npcs.biscuit,
    startObjective: 'Visit Grandma Biscuit in the flower field',
    steps: [
      {
        id: 'catch',
        objective: 'Gather the glowing butterflies',
        event: 'collect:butterfly',
        count: 5,
        location: MEADOW.fieldCenter,
        progressLabel: 'butterflies',
      },
    ],
    reward: { fragments: 1, note: 'note_butterflies' },
  },
  {
    id: 'q_heartbeat',
    region: 'meadow',
    title: 'The Heartbeat Puzzle',
    description: 'The Heart Garden lantern remembers a heartbeat.',
    main: true,
    requires: ['q_butterflies'],
    startEvent: 'talk:pip',
    startLocation: MEADOW.npcs.pip,
    startObjective: 'Meet Pip at the Heart Garden',
    steps: [
      { id: 'solve', objective: 'Step on the stones in the lantern’s order', event: 'solve:heartbeat', location: MEADOW.circle },
    ],
    reward: { fragments: 1, accessory: 'flowerCrown', note: 'note_heartbeat' },
  },
  {
    id: 'q_arch',
    region: 'meadow',
    title: 'The Starlight Arch',
    description: 'Carry the three fragments to the arch at the end of the northern path.',
    main: true,
    requires: ['q_heartbeat'],
    startLocation: MEADOW.arch,
    startObjective: 'Bring the fragments to the Starlight Arch',
    steps: [
      { id: 'place', objective: 'Bring the fragments to the Starlight Arch', event: 'activate:arch', location: MEADOW.arch },
    ],
    reward: { note: 'note_chapter1' },
  },
]

QUESTS.push(...VILLAGE_QUESTS, ...FOREST_QUESTS, ...BAY_QUESTS, ...GARDEN_QUESTS)

export const QUEST_BY_ID: Record<string, QuestDef> = Object.fromEntries(QUESTS.map((q) => [q.id, q]))

/** Every starlight fragment in the game. */
export const TOTAL_FRAGMENTS = QUESTS.reduce((n, q) => n + (q.reward.fragments ?? 0), 0)
