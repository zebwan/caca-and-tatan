/** The Starlight Garden — the final chapter. Edit freely. The final message itself lives in personal.ts. */
import type { DialogueLine, NoteDef, QuestDef } from '../types'
import { NAMES } from '../names'
import { GARDEN as L } from '../../world/garden/layout'

export const GARDEN_QUESTS: QuestDef[] = [
  {
    id: 'q_g_wishes',
    region: 'garden',
    title: 'The Four Wishes',
    description: 'Four wish pedestals float on the islands around the heart tree.',
    main: true,
    requires: ['q_b_gate'],
    startLocation: L.pedestals[0],
    startObjective: 'Light the four wish pedestals',
    steps: [
      {
        id: 'light', objective: 'Light the four wish pedestals', event: 'light:wish', count: 4,
        location: L.pedestals[0], progressLabel: 'wishes', targets: { prefix: 'wish', points: L.pedestals },
      },
    ],
    reward: {},
  },
  {
    id: 'q_g_reunion',
    region: 'garden',
    title: 'Our Wish',
    description: 'The bridge of light leads to the heart-shaped tree where it all began.',
    main: true,
    requires: ['q_g_wishes'],
    startLocation: L.meet,
    startObjective: 'Cross the bridge of light to the heart tree',
    steps: [{ id: 'reunite', objective: 'Make your wish together under the heart tree', event: 'reunite:tatan', location: L.meet }],
    reward: { pawprints: 100 },
  },
]

export const GARDEN_NOTES: Record<string, NoteDef> = {}

/** Short lines from Tatan that float up as each wish pedestal lights. */
export const WISH_LINES: Record<string, string> = {
  meadow: 'The meadow, where you woke up and still kept going.',
  village: 'The village, where you made everyone feel at home.',
  forest: 'The forest, where you weren’t afraid of the dark.',
  bay: 'The bay, where you were brave for someone small.',
}

export const GARDEN_DIALOGUE: Record<string, DialogueLine[]> = {
  garden_arrive: [
    { speaker: NAMES.tatan, text: 'The Starlight Garden… our tree is right there in the middle.' },
    { speaker: NAMES.tatan, text: 'Four wish pedestals float on the islands — one for each place we passed through. Let’s light them together.' },
  ],
  tree_wait: [{ speaker: NAMES.tatan, text: 'The bridge isn’t finished yet. Let’s light the other wishes first.' }],
  wish_ready: [
    { speaker: NAMES.caca, text: 'We made a wish here once, and the wind carried us apart.' },
    { speaker: NAMES.tatan, text: 'And every star in Purrland brought us back. Shall we make a new one? Together this time.' },
  ],
  after_ending: [{ speaker: NAMES.tatan, text: 'Wherever you go, I’m right beside you. Always.' }],
  stairs_down: [{ speaker: NAMES.caca, text: 'The starlight stairs lead back down to Bubblegum Bay.' }],
}
