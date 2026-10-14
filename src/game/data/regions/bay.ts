/** Bubblegum Bay — quests, notes, dialogue, characters and keepsakes. Edit freely. */
import type { DialogueLine, KeepsakeDef, NoteDef, QuestDef } from '../types'
import type { NpcDef } from '../npcs'
import { NAMES } from '../names'
import { BAY as L } from '../../world/bay/layout'

export const BAY_QUESTS: QuestDef[] = [
  {
    id: 'q_b_shells',
    region: 'bay',
    title: 'Seashell Song',
    description: 'Shelly is making a wind chime that sings like the sea.',
    main: true,
    requires: ['q_f_gate'],
    startEvent: 'talk:shelly',
    startLocation: L.npcs.shelly,
    startObjective: 'Say hello to Shelly by the beach huts',
    steps: [
      {
        id: 'collect', objective: 'Find the pastel seashells along the beach', event: 'collect:shell', count: 6,
        location: L.shells[0], progressLabel: 'shells', targets: { prefix: 'shell', points: L.shells },
      },
      { id: 'return', objective: 'Bring the shells to Shelly', event: 'talk:shelly', location: L.npcs.shelly },
    ],
    reward: { fragments: 1, note: 'note_b_shells' },
  },
  {
    id: 'q_b_kitten',
    region: 'bay',
    title: 'The Stranded Kitten',
    description: 'Little Pebble hopped out to the rocky islet and can’t get back.',
    main: true,
    requires: ['q_b_shells'],
    startEvent: 'talk:captain',
    startLocation: L.npcs.captain,
    startObjective: 'Captain Marmalade is pacing on the pier',
    steps: [
      { id: 'reach', objective: 'Hop across the stepping stones to Pebble', event: 'collect:pebble', location: L.kitten },
      { id: 'return', objective: 'Carry Pebble back to Captain Marmalade', event: 'talk:captain', location: L.npcs.captain },
    ],
    reward: { fragments: 1, accessory: 'collar', note: 'note_b_kitten' },
  },
  {
    id: 'q_b_bottle',
    region: 'bay',
    title: 'A Message in a Bottle',
    description: 'Something glass is glinting on the sandbar far out in the bay.',
    main: true,
    requires: ['q_b_kitten'],
    startEvent: 'talk:captain',
    startLocation: L.npcs.captain,
    startObjective: 'The Captain spotted something out at sea',
    steps: [{ id: 'fetch', objective: 'Take the little boat to the sandbar', event: 'collect:bottle', location: L.bottle }],
    reward: { fragments: 1, note: 'note_b_bottle' },
  },
  {
    id: 'q_b_gate',
    region: 'bay',
    title: 'The Lighthouse',
    description: 'The lighthouse lamp has been dark since the stars fell.',
    main: true,
    requires: ['q_b_bottle'],
    startLocation: L.lighthouseDoor,
    startObjective: 'Bring the bay fragments to the lighthouse',
    steps: [{ id: 'light', objective: 'Bring the bay fragments to the lighthouse', event: 'activate:lighthouse', location: L.lighthouseDoor }],
    reward: { note: 'note_b_gate' },
  },
  {
    id: 'q_b_treasure',
    region: 'bay',
    title: 'Sandy Treasures',
    description: 'Shelly says the sand sparkles where treasure is buried.',
    main: false,
    requires: ['q_b_shells'],
    startEvent: 'talk:shelly',
    startLocation: L.npcs.shelly,
    startObjective: 'Shelly has a secret to share',
    steps: [
      {
        id: 'dig', objective: 'Dig where the sand sparkles', event: 'dig:sand', count: 3,
        location: L.digSpots[0], progressLabel: 'treasures', targets: { prefix: 'dig', points: L.digSpots },
      },
      { id: 'return', objective: 'Show Shelly what you found', event: 'talk:shelly', location: L.npcs.shelly },
    ],
    reward: { accessory: 'shellTiara' },
  },
]

export const BAY_NOTES: Record<string, NoteDef> = {
  note_b_arrive: {
    id: 'note_b_arrive',
    title: 'Pink sand!',
    body: "Remember how I said the sand here was pink? I wasn't exaggerating. Take your paws out of the waves and run along the beach for me.\n\nThe lighthouse at the north end hasn't shone since the stars fell. I think you'll know what to do.",
    signature: 'Tatan',
  },
  note_b_shells: {
    id: 'note_b_shells',
    title: 'Listen closely',
    body: "Hold a shell to your ear and you'll hear the sea. Hold your paw to your heart and you'll hear me.\n\nCorny? Very. True? Also very.",
    signature: 'Tatan',
  },
  note_b_kitten: {
    id: 'note_b_kitten',
    title: 'Brave paws',
    body: "Hopping across those stones over the water — I know you don't love getting wet. You did it anyway, for someone small and scared.\n\nThe Captain gave you a bell collar. Now I'll always hear you coming.",
    signature: 'Tatan',
  },
  note_b_bottle: {
    id: 'note_b_bottle',
    title: 'A message in a bottle',
    body: "If you're reading this, you sailed all the way out to find it. Of course you did.\n\nI'm in the Starlight Garden, where we made our wish. Light the lighthouse and the stars will build you a way up. I'm waiting under our tree.",
    signature: 'Tatan',
  },
  note_b_gate: {
    id: 'note_b_gate',
    title: 'Look up',
    body: "Every star you gathered is shining now, all across Purrland, and they've made a staircase just for you.\n\nCome home, Caca.",
    signature: 'Tatan',
  },
}

export const BAY_DIALOGUE: Record<string, DialogueLine[]> = {
  shelly_offer: [
    { speaker: NAMES.shelly, text: 'Ahoy, sweetie! Isn’t the sea pretty today? All pink and sparkly.' },
    { speaker: NAMES.shelly, text: 'I’m making a wind chime that sings like the waves, but I need six pastel seashells. They wash up along the shore.' },
  ],
  shelly_waiting: [{ speaker: NAMES.shelly, text: 'Six pastel seashells! Walk along the waterline — they glimmer in the sand.' }],
  shelly_return: [
    { speaker: NAMES.shelly, text: 'Oh, listen to them clink! It sounds just like the tide.' },
    { speaker: NAMES.shelly, text: 'One of them had something glowing inside. A little star! Here, it’s yours.' },
  ],
  shelly_idle: [{ speaker: NAMES.shelly, text: 'The wind chime is singing. Can you hear it?' }],
  shelly_tr_offer: [
    { speaker: NAMES.shelly, text: 'Want to know a beach secret? Where the sand sparkles, there’s treasure underneath!' },
    { speaker: NAMES.shelly, text: 'I counted three sparkly spots today. Dig them up and show me what you find!' },
  ],
  shelly_tr_waiting: [{ speaker: NAMES.shelly, text: 'Three sparkly spots in the sand. Dig, dig, dig!' }],
  shelly_tr_return: [
    { speaker: NAMES.shelly, text: 'Ooh, a little tiara made of shells! It must have been waiting for a princess.' },
    { speaker: NAMES.shelly, text: 'It fits you perfectly. Keep it!' },
  ],
  shelly_tr_done: [{ speaker: NAMES.shelly, text: 'You look like the queen of Bubblegum Bay!' }],

  captain_idle: [{ speaker: NAMES.captain, text: 'Ahoy there, matey! Fine sailing weather.' }],
  captain_kitten_offer: [
    { speaker: NAMES.captain, text: 'Shiver me whiskers, am I glad to see you! My little niece Pebble hopped out to that rocky islet to chase a crab.' },
    { speaker: NAMES.captain, text: 'The stones bob about, and she’s too scared to hop back. You look light on your paws — could you fetch her?' },
    { speaker: NAMES.captain, text: 'Take your time on the stones. The moving ones drift slowly — jump when they come close.' },
  ],
  captain_kitten_waiting: [{ speaker: NAMES.captain, text: 'Pebble’s on the islet to the south-east. Hop stone to stone, nice and steady!' }],
  captain_kitten_return: [
    { speaker: NAMES.captain, text: 'Pebble! Oh, you silly sprat. Thank you, friend — I owe you one.' },
    { speaker: NAMES.captain, text: 'Here, a little bell collar from my sea chest, and this starry thing that washed up on deck.' },
  ],
  captain_bottle_offer: [
    { speaker: NAMES.captain, text: 'Now then. I spotted something glinting on the sandbar way out past the pier. Looks like a bottle.' },
    { speaker: NAMES.captain, text: 'My little boat is tied at the end of the pier. Hop in and she’ll take you right there.' },
  ],
  captain_bottle_waiting: [{ speaker: NAMES.captain, text: 'The boat’s at the end of the pier, matey. She knows the way.' }],
  captain_done: [{ speaker: NAMES.captain, text: 'Fair winds to you, little sailor!' }],

  pebble_pickup: [
    { speaker: NAMES.pebble, text: 'Mew… the stones were wobbly and I got scared.' },
    { speaker: NAMES.caca, text: 'It’s okay. Hop on my back — I’ll take you to your uncle.' },
  ],
  pebble_wait: [{ speaker: NAMES.pebble, text: 'Mew? Are you going to help me?' }],
  boat_go: [{ speaker: NAMES.caca, text: 'All aboard!' }],
  boat_locked: [{ speaker: NAMES.caca, text: 'A cute little boat. I should ask the Captain before I borrow it.' }],
  bottle_pickup: [{ speaker: NAMES.caca, text: 'A glass bottle with a rolled-up letter inside… and pink ribbon. I know that ribbon.' }],
  dig_found: [{ speaker: NAMES.caca, text: 'Dig, dig… something shiny!' }],
  lighthouse_locked: [{ speaker: 'Lighthouse', text: 'The great lamp at the top is dark. A small door at the bottom has three star-shaped hollows.' }],
  lighthouse_ready: [{ speaker: NAMES.caca, text: 'Three hollows, three fragments. Let’s light up the whole bay.' }],
  lighthouse_after: [{ speaker: 'Lighthouse', text: 'The lamp shines all the way up into the sky. A staircase of stars waits on the cliff.' }],
  stairs_locked: [{ speaker: NAMES.caca, text: 'Just a windy cliff for now.' }],
}

export const BAY_NPCS: Record<string, NpcDef> = {
  shelly: {
    id: 'shelly', name: NAMES.shelly, event: 'talk:shelly',
    rules: [
      { quest: 'q_b_shells', state: 'available', dialogue: 'shelly_offer' },
      { quest: 'q_b_shells', state: 'in_progress', step: 'collect', dialogue: 'shelly_waiting' },
      { quest: 'q_b_shells', state: 'in_progress', step: 'return', dialogue: 'shelly_return' },
      { quest: 'q_b_treasure', state: 'available', dialogue: 'shelly_tr_offer' },
      { quest: 'q_b_treasure', state: 'in_progress', step: 'dig', dialogue: 'shelly_tr_waiting' },
      { quest: 'q_b_treasure', state: 'in_progress', step: 'return', dialogue: 'shelly_tr_return' },
      { quest: 'q_b_treasure', state: 'completed', dialogue: 'shelly_tr_done' },
      { dialogue: 'shelly_idle' },
    ],
  },
  captain: {
    id: 'captain', name: NAMES.captain, event: 'talk:captain',
    rules: [
      { quest: 'q_b_kitten', state: 'available', dialogue: 'captain_kitten_offer' },
      { quest: 'q_b_kitten', state: 'in_progress', step: 'reach', dialogue: 'captain_kitten_waiting' },
      { quest: 'q_b_kitten', state: 'in_progress', step: 'return', dialogue: 'captain_kitten_return' },
      { quest: 'q_b_bottle', state: 'available', dialogue: 'captain_bottle_offer' },
      { quest: 'q_b_bottle', state: 'in_progress', dialogue: 'captain_bottle_waiting' },
      { quest: 'q_b_bottle', state: 'completed', dialogue: 'captain_done' },
      { dialogue: 'captain_idle' },
    ],
  },
}

export const BAY_KEEPSAKES: Record<string, KeepsakeDef> = {
  starfish: { id: 'starfish', name: 'A Little Starfish', description: 'On top of the rocky arch: a dried starfish, kept like a souvenir.', region: 'bay' },
  postcard: { id: 'postcard', name: 'A Postcard', description: 'Under a crate at the end of the pier: a postcard from the seaside that was never sent — it was meant to be given in person.', region: 'bay' },
  seaglass: { id: 'seaglass', name: 'A Piece of Sea Glass', description: 'On the sandbar: a smooth pink piece of sea glass, worn soft by the waves.', region: 'bay' },
}
