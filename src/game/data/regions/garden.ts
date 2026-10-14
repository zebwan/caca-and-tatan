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
    title: 'Under Our Tree',
    description: 'Someone is waiting beneath the heart-shaped tree.',
    main: true,
    requires: ['q_g_wishes'],
    startLocation: L.tatan,
    startObjective: 'Cross the bridge of light to the heart tree',
    steps: [{ id: 'reunite', objective: 'Cross the bridge of light to the heart tree', event: 'reunite:tatan', location: L.tatan }],
    reward: {},
  },
]

export const GARDEN_NOTES: Record<string, NoteDef> = {
  note_g_arrive: {
    id: 'note_g_arrive',
    title: 'You’re here',
    body: "This is where we made our wish. Do you remember?\n\nFour little pedestals are waiting on the islands — one for every place you passed through. Light them, and the last bridge will appear.",
    signature: 'Tatan',
  },
}

/** Short lines from Tatan that float up as each wish pedestal lights. */
export const WISH_LINES: Record<string, string> = {
  meadow: 'The meadow, where you woke up and still kept going.',
  village: 'The village, where you made everyone feel at home.',
  forest: 'The forest, where you weren’t afraid of the dark.',
  bay: 'The bay, where you were brave for someone small.',
}

export const GARDEN_DIALOGUE: Record<string, DialogueLine[]> = {
  pedestal_lit: [{ speaker: NAMES.caca, text: 'The pedestal is glowing. The bridge is growing!' }],
  tatan_wait: [{ speaker: NAMES.caca, text: 'The bridge isn’t finished yet… Light the other wishes first.' }],
  reunion_lines: [
    { speaker: NAMES.tatan, text: 'Caca! You found me.' },
    { speaker: NAMES.caca, text: 'I followed the little stars. Just like you said.' },
  ],
  stairs_down: [{ speaker: NAMES.caca, text: 'The starlight stairs lead back down to Bubblegum Bay.' }],
  tatan_follow: [{ speaker: NAMES.tatan, text: 'Wherever you go, I’m right behind you.' }],
}
