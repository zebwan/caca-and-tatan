/**
 * Story text: Tatan's notes, NPC dialogue, intro cards, tutorial hints.
 * Edit freely — gameplay code only refers to the ids.
 * Personal memories and the final message live in personal.ts.
 */
import type { DialogueLine, NoteDef } from './types'
import { VILLAGE_DIALOGUE, VILLAGE_NOTES } from './regions/village'
import { FOREST_DIALOGUE, FOREST_NOTES } from './regions/forest'
import { BAY_DIALOGUE, BAY_NOTES } from './regions/bay'
import { GARDEN_DIALOGUE, GARDEN_NOTES } from './regions/garden'

export { NAMES } from './names'
import { NAMES } from './names'

/** Optional line under the title, e.g. "Made with love for ...". Leave empty to hide. */
export const DEDICATION = ''

export const INTRO_CARDS: string[] = [
  'One starry evening, Caca and Tatan sat in the Starlight Garden and made a wish beneath a glowing pink star.',
  'Then a magical wind swept through Purrland. The stars scattered, the map lost its light, and Caca was carried far away.',
  'When she opened her eyes, she was somewhere soft and pink and new…',
]

export const NOTES: Record<string, NoteDef> = {
  note_start: {
    id: 'note_start',
    title: 'Caca,',
    body:
      "If you ever lose your way, just follow the little stars, Caca. I'll be waiting for you somewhere in this world.\n\nThe wind scattered the starlight all over Purrland. Gather the fragments and the map will remember the way home.",
    signature: 'Tatan',
  },
  note_teddy: {
    id: 'note_teddy',
    title: 'First star found!',
    body:
      "You helped someone smaller than you before thinking about yourself. That is so very you.\n\nThe first fragment is glowing on the map. Two more are hiding in this meadow.",
    signature: 'Tatan',
  },
  note_butterflies: {
    id: 'note_butterflies',
    title: 'Did you laugh while chasing them?',
    body:
      "I hope you did. I always imagine you laughing.\n\nThere is an old stone garden north of the meadow. Its lantern remembers a heartbeat. I think you'll recognise it.",
    signature: 'Tatan',
  },
  note_heartbeat: {
    id: 'note_heartbeat',
    title: 'You found my heartbeat',
    body:
      "It was easy, wasn't it? It always beats a little faster when you're near.\n\nNow carry the three fragments to the Starlight Arch at the end of the northern path. It will show you where to go next.",
    signature: 'Tatan',
  },
  note_chapter1: {
    id: 'note_chapter1',
    title: 'The map remembers',
    body:
      "Look how brightly the meadow is shining now. That's your doing.\n\nThe next stars fell just past the arch, in a little village that smells like warm bread. Walk through when you're ready — I'm a few steps closer than I was.",
    signature: 'Tatan',
  },
}

export const DIALOGUE: Record<string, DialogueLine[]> = {
  // ── Mimi, the little kitten ──
  mimi_locked: [
    { speaker: NAMES.mimi, text: "Oh! A new cat! Hello, hello!" },
    { speaker: NAMES.mimi, text: "There's something glowing on that little post by the big pink tree. Did someone leave it for you?" },
  ],
  mimi_offer: [
    { speaker: NAMES.mimi, text: "*sniff*… Oh, hi. Sorry. I lost Mr. Buttons." },
    { speaker: NAMES.mimi, text: "He's my teddy. We were playing on the swing on top of the big hill, the one to the east, and then I came home for a snack…" },
    { speaker: NAMES.mimi, text: "…and now he's not here. Could you look for him? He has a pink button nose!" },
  ],
  mimi_waiting: [
    { speaker: NAMES.mimi, text: "Mr. Buttons likes high places. Try the swing on the big hill to the east!" },
  ],
  mimi_return: [
    { speaker: NAMES.mimi, text: "MR. BUTTONS! You found him!" },
    { speaker: NAMES.mimi, text: "Thank you thank you thank you. Here, I found this shiny thing by the swing yesterday. It feels warm, like a hug." },
    { speaker: NAMES.caca, text: "A starlight fragment… and it smells a little like Tatan." },
  ],
  mimi_done: [
    { speaker: NAMES.mimi, text: "Mr. Buttons says thank you too. He's very shy." },
  ],

  // ── Grandma Biscuit, the gardener ──
  biscuit_idle: [
    { speaker: NAMES.biscuit, text: "Good morning, dearie. Lovely day for the flowers, isn't it?" },
  ],
  biscuit_offer: [
    { speaker: NAMES.biscuit, text: "Oh my, the starlight butterflies are all over my garden this morning." },
    { speaker: NAMES.biscuit, text: "They swallowed little bits of the fallen star, I think. Five of them, glowing like lanterns." },
    { speaker: NAMES.biscuit, text: "They're very friendly. Just walk up to them gently and they'll come to you." },
  ],
  biscuit_waiting: [
    { speaker: NAMES.biscuit, text: "Five glowing butterflies, dearie. They love the flowers in the east field." },
  ],
  biscuit_done: [
    { speaker: NAMES.biscuit, text: "My garden feels calmer already. You have a gentle way about you." },
  ],

  // ── Pip, the bunny who keeps the stone garden ──
  pip_idle: [
    { speaker: NAMES.pip, text: "Hello! I look after the Heart Garden. The stones are sleeping right now." },
  ],
  pip_offer: [
    { speaker: NAMES.pip, text: "Oh! You're the cat from the notes! Someone asked me to wait for you." },
    { speaker: NAMES.pip, text: "The lantern in the middle remembers a heartbeat. Touch it and watch which stones light up." },
    { speaker: NAMES.pip, text: "Then walk onto the stones in the same order. If you miss, no worries — the stones are very patient." },
  ],
  pip_waiting: [
    { speaker: NAMES.pip, text: "Touch the lantern to watch the heartbeat again. Then step on the stones in that order!" },
  ],
  pip_done: [
    { speaker: NAMES.pip, text: "The stones are humming! I haven't heard them do that in ages." },
  ],

  // ── Objects ──
  arch_locked: [
    { speaker: 'Starlight Arch', text: "Three empty hollows are carved into the stone, each shaped like a little star." },
  ],
  arch_ready: [
    { speaker: NAMES.caca, text: "Three hollows… and three fragments. I think they fit." },
  ],
  arch_after: [
    { speaker: 'Starlight Arch', text: 'The arch shimmers. Beyond it, the path leads to Cuddleberry Village.' },
  ],
  chapter_coming: [{ speaker: 'Caca', text: 'The path ahead shimmers like it’s still being woven from starlight… This chapter is coming soon!' }],
  teddy_early: [
    { speaker: NAMES.caca, text: "A little teddy bear sitting all alone on the swing. Someone must be missing him." },
  ],
  teddy_found: [
    { speaker: NAMES.caca, text: "A little teddy with a pink button nose. This must be Mr. Buttons!" },
  ],
  lantern_solved: [
    { speaker: 'Heart Lantern', text: "The lantern glows warm and steady now, beating softly in time with the stones." },
  ],
  puzzle_wrong: [
    { speaker: NAMES.pip, text: "Ooh, so close! The stones went back to sleep. Start again from the first one — you can touch the lantern to watch again." },
  ],
  lantern_locked: [
    { speaker: 'Heart Lantern', text: "The lantern glows softly, like it's waiting for someone." },
  ],
}

Object.assign(NOTES, VILLAGE_NOTES, FOREST_NOTES, BAY_NOTES, GARDEN_NOTES)
Object.assign(DIALOGUE, VILLAGE_DIALOGUE, FOREST_DIALOGUE, BAY_DIALOGUE, GARDEN_DIALOGUE)

/** Contextual tutorial hints, keyed by id. Shown once each. */
export const HINTS = {
  move: 'WASD or arrow keys to walk · move the mouse to look around',
  moveTouch: 'Drag the left stick to walk · drag the screen to look around',
  look: 'Click the world to look around with your mouse',
  interact: 'Press E to interact',
  jump: 'Space to jump',
  run: 'Hold Shift to run',
  map: 'Press M to open the map',
} as const
