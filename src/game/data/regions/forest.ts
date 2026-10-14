/** Whispering Moon Forest — quests, notes, dialogue, characters and keepsakes. Edit freely. */
import type { DialogueLine, KeepsakeDef, NoteDef, QuestDef } from '../types'
import type { NpcDef } from '../npcs'
import { NAMES } from '../names'
import { FOREST as L } from '../../world/forest/layout'

export const FOREST_QUESTS: QuestDef[] = [
  {
    id: 'q_f_trail',
    region: 'forest',
    title: 'Glowing Paw Prints',
    description: 'Clover has seen glowing paw prints leading deep into the trees.',
    main: true,
    requires: ['q_v_home'],
    startEvent: 'talk:clover',
    startLocation: L.npcs.clover,
    startObjective: 'Someone small is waiting by the path — say hello',
    steps: [
      {
        id: 'follow', objective: 'Follow the glowing paw prints', event: 'reach:paw', count: L.pawTrail.length,
        location: L.pawTrail[0], progressLabel: 'paw prints', targets: { prefix: 'paw', points: L.pawTrail, ordered: true },
      },
      { id: 'photo', objective: 'Look at what’s waiting in the hidden clearing', event: 'collect:forestphoto', location: L.photo },
    ],
    reward: { fragments: 1, note: 'note_f_trail' },
  },
  {
    id: 'q_f_mushrooms',
    region: 'forest',
    title: 'Wake the Moon Mushrooms',
    description: 'Professor Hoot needs the mushroom grove lit before the stars can be read.',
    main: true,
    requires: ['q_f_trail'],
    startEvent: 'talk:hoot',
    startLocation: L.npcs.hoot,
    startObjective: 'Visit Professor Hoot by the hollow tree',
    steps: [
      {
        id: 'light', objective: 'Wake the sleepy mushrooms with a gentle boop', event: 'light:mushroom', count: 5,
        location: L.mushrooms[0], progressLabel: 'mushrooms', targets: { prefix: 'mushroom', points: L.mushrooms },
      },
      { id: 'return', objective: 'Tell Professor Hoot the grove is glowing', event: 'talk:hoot', location: L.npcs.hoot },
    ],
    reward: { fragments: 1, note: 'note_f_mushrooms' },
  },
  {
    id: 'q_f_stars',
    region: 'forest',
    title: 'The Heart Constellation',
    description: 'The star stones in the Moon Clearing remember a shape.',
    main: true,
    requires: ['q_f_mushrooms'],
    startEvent: 'talk:hoot',
    startLocation: L.npcs.hoot,
    startObjective: 'Professor Hoot has one more favour to ask',
    steps: [{ id: 'solve', objective: 'Connect the star stones along the heart', event: 'solve:constellation', location: L.moonClearing }],
    reward: { fragments: 1, accessory: 'starBow', note: 'note_f_stars' },
  },
  {
    id: 'q_f_gate',
    region: 'forest',
    title: 'The Moon Altar',
    description: 'An old altar waits for the forest’s three fragments.',
    main: true,
    requires: ['q_f_stars'],
    startLocation: L.altar,
    startObjective: 'Bring the forest fragments to the Moon Altar',
    steps: [{ id: 'place', objective: 'Bring the forest fragments to the Moon Altar', event: 'activate:altar', location: L.altar }],
    reward: { note: 'note_f_gate' },
  },
  {
    id: 'q_f_fireflies',
    region: 'forest',
    title: 'A Jar of Fireflies',
    description: 'Clover wants a night-light made of fireflies.',
    main: false,
    requires: ['q_f_trail'],
    startEvent: 'talk:clover',
    startLocation: L.npcs.clover,
    startObjective: 'Clover has a favour to ask',
    steps: [
      {
        id: 'catch', objective: 'Gather the golden fireflies', event: 'collect:firefly', count: 6,
        location: L.npcs.clover, progressLabel: 'fireflies', targets: { prefix: 'firefly', points: L.fireflies },
      },
      { id: 'return', objective: 'Bring the fireflies to Clover', event: 'talk:clover', location: L.npcs.clover },
    ],
    reward: { accessory: 'moonScarf' },
  },
]

export const FOREST_NOTES: Record<string, NoteDef> = {
  note_f_arrive: {
    id: 'note_f_arrive',
    title: 'Don’t be scared',
    body: "It's darker here, but nothing in this forest would ever hurt you. The owls are wise, the bunnies are shy and the mushrooms glow like night-lights.\n\nAnd if you get lonely, look up. Same moon as mine.",
    signature: 'Tatan',
  },
  note_f_trail: {
    id: 'note_f_trail',
    title: 'You followed my paw prints',
    body: "I knew you would. I walked this way once and left a little light in every step, just in case.\n\nThe photo in the clearing is of us. Keep it. I have a copy in my heart.",
    signature: 'Tatan',
  },
  note_f_mushrooms: {
    id: 'note_f_mushrooms',
    title: 'The forest is glowing',
    body: "Every mushroom you woke up is glowing a little brighter because you said hello.\n\nThat's what you do to everything, you know. You make it glow.",
    signature: 'Tatan',
  },
  note_f_stars: {
    id: 'note_f_stars',
    title: 'A heart in the sky',
    body: "I asked the stars to make a shape only you would recognise. They chose a heart. Smart stars.\n\nThere's a starlight bow for you too — try it on.",
    signature: 'Tatan',
  },
  note_f_gate: {
    id: 'note_f_gate',
    title: 'Can you hear the sea?',
    body: "The last stars fell by the water, in Bubblegum Bay, east past the village.\n\nThe sand there is pink and the waves are soft. I'm getting closer, Caca. So are you.",
    signature: 'Tatan',
  },
}

export const FOREST_DIALOGUE: Record<string, DialogueLine[]> = {
  clover_offer: [
    { speaker: NAMES.clover, text: 'Oh! Hi! You startled me. Everything’s so quiet in the forest.' },
    { speaker: NAMES.clover, text: 'Last night I saw paw prints that glowed like little moons. They went that way, all twisty, into the trees.' },
    { speaker: NAMES.clover, text: 'They look a lot like your paws… but bigger. Maybe you should follow them?' },
  ],
  clover_waiting: [{ speaker: NAMES.clover, text: 'The glowing paw prints! Follow them one by one — they light up as you go.' }],
  clover_idle: [{ speaker: NAMES.clover, text: 'The forest is never scary when you have a friend, right?' }],
  clover_ff_offer: [
    { speaker: NAMES.clover, text: 'Um… could I ask a tiny favour? My burrow is very dark at night.' },
    { speaker: NAMES.clover, text: 'If you gather six of the golden fireflies, I could have a night-light! They’re friendly, they won’t mind.' },
  ],
  clover_ff_waiting: [{ speaker: NAMES.clover, text: 'Six golden fireflies! They like to float near the path.' }],
  clover_ff_return: [
    { speaker: NAMES.clover, text: 'Look how they twinkle! My burrow will be so cozy now.' },
    { speaker: NAMES.clover, text: 'Here — I knitted this scarf while I was waiting. It’s the colour of the moon.' },
  ],
  clover_ff_done: [{ speaker: NAMES.clover, text: 'I sleep so well now. Goodnight, goodnight!' }],

  hoot_idle: [{ speaker: NAMES.hoot, text: 'Hoo! A young explorer. The forest whispers, but only to those who listen.' }],
  hoot_mush_offer: [
    { speaker: NAMES.hoot, text: 'Hoo-hoo. You must be the cat the stars keep talking about.' },
    { speaker: NAMES.hoot, text: 'The moon mushrooms have fallen asleep and the grove is far too dark. Five of them, west of here.' },
    { speaker: NAMES.hoot, text: 'Give each one a gentle boop on the nose. They love that.' },
  ],
  hoot_mush_waiting: [{ speaker: NAMES.hoot, text: 'Five sleepy mushrooms in the grove to the west. A gentle boop each!' }],
  hoot_mush_return: [
    { speaker: NAMES.hoot, text: 'Splendid! I can see the whole grove glowing from my branch.' },
    { speaker: NAMES.hoot, text: 'One of the mushrooms coughed this up when you booped it. Starlight, if I’m not mistaken.' },
  ],
  hoot_stars_offer: [
    { speaker: NAMES.hoot, text: 'Now that the grove is lit, the star stones in the Moon Clearing are awake.' },
    { speaker: NAMES.hoot, text: 'They remember a shape — a heart. Step on the stones one after another, following the faint lines, all the way around.' },
    { speaker: NAMES.hoot, text: 'If you skip a stone they’ll simply reset. Stars are very forgiving.' },
  ],
  hoot_stars_waiting: [{ speaker: NAMES.hoot, text: 'Walk the heart: step from each star stone to its neighbour along the faint lines, all the way around.' }],
  hoot_done: [{ speaker: NAMES.hoot, text: 'The sky is clearer than it’s been in years. Thank you, little star-finder.' }],

  constellation_wrong: [{ speaker: NAMES.hoot, text: 'Hoo — that stone isn’t next in the heart. The stars reset. Follow the faint lines to the neighbouring stone!' }],
  altar_locked: [{ speaker: 'Moon Altar', text: 'A pale stone altar, cool to the touch. Three star-shaped hollows face the moon.' }],
  altar_ready: [{ speaker: NAMES.caca, text: 'The moon is watching. Let’s give it the forest’s stars.' }],
  altar_after: [{ speaker: 'Moon Altar', text: 'The altar hums softly. The way back east to the village is clear, and the road to the sea is waking up.' }],
  photo_pickup: [{ speaker: NAMES.caca, text: 'A photograph, pinned to a lantern… it’s me and Tatan. He was here.' }],
  mushroom_boop: [{ speaker: NAMES.caca, text: '*boop*' }],
  gate_forest_east: [{ speaker: NAMES.caca, text: 'The path back east leads to Cuddleberry Village.' }],
}

export const FOREST_NPCS: Record<string, NpcDef> = {
  clover: {
    id: 'clover', name: NAMES.clover, event: 'talk:clover',
    rules: [
      { quest: 'q_f_trail', state: 'available', dialogue: 'clover_offer' },
      { quest: 'q_f_trail', state: 'in_progress', dialogue: 'clover_waiting' },
      { quest: 'q_f_fireflies', state: 'available', dialogue: 'clover_ff_offer' },
      { quest: 'q_f_fireflies', state: 'in_progress', step: 'catch', dialogue: 'clover_ff_waiting' },
      { quest: 'q_f_fireflies', state: 'in_progress', step: 'return', dialogue: 'clover_ff_return' },
      { quest: 'q_f_fireflies', state: 'completed', dialogue: 'clover_ff_done' },
      { dialogue: 'clover_idle' },
    ],
  },
  hoot: {
    id: 'hoot', name: NAMES.hoot, event: 'talk:hoot',
    rules: [
      { quest: 'q_f_mushrooms', state: 'available', dialogue: 'hoot_mush_offer' },
      { quest: 'q_f_mushrooms', state: 'in_progress', step: 'light', dialogue: 'hoot_mush_waiting' },
      { quest: 'q_f_mushrooms', state: 'in_progress', step: 'return', dialogue: 'hoot_mush_return' },
      { quest: 'q_f_stars', state: 'available', dialogue: 'hoot_stars_offer' },
      { quest: 'q_f_stars', state: 'in_progress', dialogue: 'hoot_stars_waiting' },
      { quest: 'q_f_stars', state: 'completed', dialogue: 'hoot_done' },
      { dialogue: 'hoot_idle' },
    ],
  },
}

export const FOREST_KEEPSAKES: Record<string, KeepsakeDef> = {
  lantern: { id: 'lantern', name: 'A Paper Lantern', description: 'On top of the tallest mushroom: a little paper lantern, folded with care, still faintly glowing.', region: 'forest' },
  songbook: { id: 'songbook', name: 'A Tiny Songbook', description: 'Inside the hollow log: a pocket songbook with one page dog-eared.', region: 'forest' },
  moonstone: { id: 'moonstone', name: 'A Moonstone', description: 'On the little island in the moon pond: a smooth stone that holds the moonlight.', region: 'forest' },
}
