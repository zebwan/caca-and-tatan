/** Cuddleberry Village — quests, Tatan's notes, dialogue, characters and keepsakes. Edit freely. */
import type { DialogueLine, KeepsakeDef, NoteDef, QuestDef } from '../types'
import type { NpcDef } from '../npcs'
import { NAMES } from '../names'
import { VILLAGE as L } from '../../world/village/layout'

const mail = L.mailboxes
const K = L.kittens

export const VILLAGE_QUESTS: QuestDef[] = [
  {
    id: 'q_v_berries',
    region: 'village',
    title: 'Cuddleberry Buns',
    description: 'Baker Mochi needs fresh cuddleberries for the famous buns.',
    main: true,
    requires: ['q_arch'],
    startEvent: 'talk:mochi',
    startLocation: L.npcs.mochi,
    startObjective: 'Say hello to Baker Mochi at the bakery',
    steps: [
      {
        id: 'pick', objective: 'Pick cuddleberries from the glowing bushes', event: 'collect:berry', count: 5,
        location: L.plaza, progressLabel: 'berries', targets: { prefix: 'berry', points: L.berryBushes },
      },
      { id: 'return', objective: 'Bring the berries to Baker Mochi', event: 'talk:mochi', location: L.npcs.mochi },
    ],
    reward: { fragments: 1, note: 'note_v_berries' },
  },
  {
    id: 'q_v_letters',
    region: 'village',
    title: 'Letters for the Village',
    description: 'Pudding the Postcat has hurt a paw and the letters are piling up.',
    main: true,
    requires: ['q_v_berries'],
    startEvent: 'talk:pudding',
    startLocation: L.npcs.pudding,
    startObjective: 'Visit Pudding at the post office',
    steps: [
      {
        id: 'deliver', objective: 'Deliver the letters to the glowing mailboxes', event: 'deliver:letter', count: 3,
        location: L.plaza, progressLabel: 'letters', targets: { prefix: 'letter', points: [mail.rose, mail.plum, mail.willow] },
      },
      { id: 'return', objective: 'Tell Pudding the letters are delivered', event: 'talk:pudding', location: L.npcs.pudding },
    ],
    reward: { fragments: 1, accessory: 'backpack', note: 'note_v_letters' },
  },
  {
    id: 'q_v_kittens',
    region: 'village',
    title: 'Three Little Kittens',
    description: 'Maple’s kittens are playing hide-and-seek and won’t come home for supper.',
    main: true,
    requires: ['q_v_letters'],
    startEvent: 'talk:maple',
    startLocation: L.npcs.maple,
    startObjective: 'Maple looks worried — go and see her',
    steps: [
      {
        id: 'find', objective: 'Find the three hiding kittens', event: 'find:kitten', count: 3,
        location: L.plaza, progressLabel: 'kittens', targets: { prefix: 'kitten', points: [K.crates, K.cart, K.dock] },
      },
      { id: 'return', objective: 'Tell Maple her kittens are home', event: 'talk:maple', location: L.npcs.maple },
    ],
    reward: { fragments: 1, note: 'note_v_kittens' },
  },
  {
    id: 'q_v_gate',
    region: 'village',
    title: 'The Wishing Fountain',
    description: 'The village fountain has three star-shaped hollows.',
    main: true,
    requires: ['q_v_kittens'],
    startLocation: L.fountain,
    startObjective: 'Bring the village fragments to the Wishing Fountain',
    steps: [{ id: 'place', objective: 'Bring the village fragments to the Wishing Fountain', event: 'activate:fountain', location: L.fountain }],
    reward: { say: 'tatan_reunion_after' },
  },
  {
    id: 'q_v_home',
    region: 'village',
    title: 'A Home for Two',
    description: 'The Mayor has something special for the two of you.',
    main: true,
    requires: ['q_v_gate'],
    startEvent: 'talk:mayor',
    startLocation: L.npcs.mayor,
    startObjective: 'The Mayor wants to see you both by the fountain',
    startGift: ['rugRound', 'plantFern', 'lampMushroom'],
    steps: [
      { id: 'visit', objective: 'Visit Lilac Cottage at the south of the village', event: 'enter:home', location: L.lilacDoor },
      { id: 'decorate', objective: 'Make the cottage yours — decorate anything', event: 'decorate:any', location: { x: 0, z: -1.5 }, region: 'home' },
    ],
    reward: { pawprints: 40, say: 'tatan_home_after' },
  },
  {
    id: 'q_v_brush',
    region: 'village',
    title: 'Cocoa’s Lost Paintbrush',
    description: 'Cocoa the painter dropped her favourite brush somewhere in the hedge garden.',
    main: false,
    requires: ['q_v_berries'],
    startEvent: 'talk:cocoa',
    startLocation: L.npcs.cocoa,
    startObjective: 'Cocoa the painter looks puzzled',
    steps: [
      { id: 'find', objective: 'Find Cocoa’s paintbrush in the hedge garden', event: 'collect:paintbrush', location: L.paintbrush },
      { id: 'return', objective: 'Give the paintbrush back to Cocoa', event: 'talk:cocoa', location: L.npcs.cocoa },
    ],
    reward: { pawprints: 20 },
  },
  {
    id: 'q_v_bouquet',
    region: 'village',
    title: 'A Bouquet for Rosie',
    description: 'Rosie wants three starpetal flowers from the hedge garden.',
    main: false,
    requires: ['q_v_berries'],
    startEvent: 'talk:rosie',
    startLocation: L.npcs.rosie,
    startObjective: 'Rosie the bunny wants to ask you something',
    steps: [
      {
        id: 'pick', objective: 'Pick starpetal flowers in the hedge garden', event: 'collect:starflower', count: 3,
        location: L.hedge.center, progressLabel: 'flowers', targets: { prefix: 'starflower', points: L.hedge.flowers },
      },
      { id: 'return', objective: 'Give the bouquet to Rosie', event: 'talk:rosie', location: L.npcs.rosie },
    ],
    reward: { accessory: 'ribbonBow' },
  },
]

export const VILLAGE_NOTES: Record<string, NoteDef> = {
  note_v_arrive: {
    id: 'note_v_arrive',
    title: 'Welcome to Cuddleberry',
    body: "Smell that? Warm bread and berries. I always think of you when something smells sweet.\n\nThe villagers are kind here. Help them, and the stars will find you.",
    signature: 'Tatan',
  },
  note_v_berries: {
    id: 'note_v_berries',
    title: 'Save me a bun?',
    body: "I hear Mochi's buns are the softest in Purrland. Not as soft as your paws, though.\n\nOne fragment down in the village. Two to go.",
    signature: 'Tatan',
  },
  note_v_letters: {
    id: 'note_v_letters',
    title: 'Did you peek at the letters?',
    body: "No? Of course not. You're too sweet for that.\n\nPudding left you a little backpack. Now you can carry my notes with you wherever you go.",
    signature: 'Tatan',
  },
  note_v_kittens: {
    id: 'note_v_kittens',
    title: 'Everyone is home',
    body: "You always notice who is missing. You always make sure everyone gets home safe.\n\nNow it's my turn to wait for you. Take your time — I'm not going anywhere.",
    signature: 'Tatan',
  },
}

export const VILLAGE_DIALOGUE: Record<string, DialogueLine[]> = {
  mochi_offer: [
    { speaker: NAMES.mochi, text: 'A visitor! Welcome to Cuddleberry Village, dear. Mind the flour, I’m covered in it.' },
    { speaker: NAMES.mochi, text: 'The oven is warm but my berry basket is empty. The cuddleberry bushes are glowing all over the village today.' },
    { speaker: NAMES.mochi, text: 'Could you pick five handfuls for me? Just walk up to a glowing bush and give it a gentle tug.' },
  ],
  mochi_waiting: [{ speaker: NAMES.mochi, text: 'Five handfuls of cuddleberries, dear. The bushes glow so you can’t miss them.' }],
  mochi_return: [
    { speaker: NAMES.mochi, text: 'Oh, they’re perfect! Plump and pink and smelling of summer.' },
    { speaker: NAMES.mochi, text: 'And look what was hiding at the bottom of the basket… a little piece of starlight. That must be for you.' },
  ],
  mochi_done: [{ speaker: NAMES.mochi, text: 'The buns are in the oven! Come back any time, there’s always one with your name on it.' }],
  mochi_idle: [{ speaker: NAMES.mochi, text: 'Mmm, can you smell that? Fresh bread, every morning.' }],

  pudding_locked: [{ speaker: NAMES.pudding, text: 'Post office’s open! Well, sort of. Ask me again a bit later.' }],
  pudding_offer: [
    { speaker: NAMES.pudding, text: 'Oof, hello! I tripped on a cobblestone and now my paw is all wobbly.' },
    { speaker: NAMES.pudding, text: 'Three letters still need delivering. Would you pop them into the mailboxes for me? They’ll glow when you’re close.' },
  ],
  pudding_waiting: [{ speaker: NAMES.pudding, text: 'Three glowing mailboxes, one letter each! Rose’s, Plum’s and Willow’s houses.' }],
  pudding_return: [
    { speaker: NAMES.pudding, text: 'All delivered? You’re a natural! Have you ever thought about being a postcat?' },
    { speaker: NAMES.pudding, text: 'Here — a spare postbag, just your size. And this sparkly thing was stuck in the bottom of the sack.' },
  ],
  pudding_done: [{ speaker: NAMES.pudding, text: 'My paw feels better already. Thank you, partner!' }],

  maple_locked: [{ speaker: NAMES.maple, text: 'Lovely day, isn’t it? My little ones are out playing somewhere.' }],
  maple_offer: [
    { speaker: NAMES.maple, text: 'Oh dear, oh dear. My three kittens are playing hide-and-seek and it’s nearly supper time.' },
    { speaker: NAMES.maple, text: 'One loves climbing, one loves flowers, and one loves the duck pond. Could you find them for me?' },
  ],
  maple_waiting: [{ speaker: NAMES.maple, text: 'One climber, one flower-lover, one duck-watcher. They’re never far.' }],
  maple_return: [
    { speaker: NAMES.maple, text: 'All three, safe and sound and very muddy. Thank you so much.' },
    { speaker: NAMES.maple, text: 'The kittens found this shiny star while they were hiding. They want you to have it.' },
  ],
  maple_done: [{ speaker: NAMES.maple, text: 'They’re fast asleep now. Peace and quiet, at last!' }],

  rosie_idle: [{ speaker: NAMES.rosie, text: 'Hello! I’m practising my hops. One, two… three!' }],
  rosie_offer: [
    { speaker: NAMES.rosie, text: 'Psst… Grandma Plum’s birthday is today and I want to make her a bouquet.' },
    { speaker: NAMES.rosie, text: 'The starpetal flowers grow inside the hedge garden, but the hedges are taller than my ears. Could you pick three?' },
  ],
  rosie_waiting: [{ speaker: NAMES.rosie, text: 'Three starpetal flowers from the hedge garden, please! The entrance is near the berry house.' }],
  rosie_return: [
    { speaker: NAMES.rosie, text: 'They’re beautiful! Grandma Plum is going to cry happy tears.' },
    { speaker: NAMES.rosie, text: 'Here, I tied a ribbon from the wrapping into a bow for you. Peach suits you!' },
  ],
  rosie_done: [{ speaker: NAMES.rosie, text: 'Grandma Plum put the flowers by her window. Thank you!' }],

  fountain_locked: [{ speaker: 'Wishing Fountain', text: 'Coins glitter at the bottom of the water. Three star-shaped hollows sit empty around the rim.' }],
  fountain_ready: [{ speaker: NAMES.caca, text: 'Three hollows around the fountain… and three village fragments. Here goes.' }],
  fountain_after: [{ speaker: 'Wishing Fountain', text: 'The water sparkles with starlight. This is where you found each other again.' }],
  tatan_reunion: [
    { speaker: NAMES.tatan, text: 'Caca… is it really you?' },
    { speaker: NAMES.caca, text: 'I followed every single star. Just like you said.' },
    { speaker: NAMES.tatan, text: 'I knew you would. I’m never letting you get lost again.' },
  ],
  tatan_reunion_after: [
    { speaker: NAMES.tatan, text: 'The stars are still scattered all over Purrland. Our wishing tree needs them back.' },
    { speaker: NAMES.tatan, text: 'But this time we’ll find them together. Lead the way — I’ll be right behind you.' },
  ],
  tatan_home_after: [
    { speaker: NAMES.tatan, text: 'Our very own cottage… I can’t believe it.' },
    { speaker: NAMES.tatan, text: 'Ribbon & Bell and Cozy Corner sell clothes and furniture for Pawprints. And when you’re ready — the forest path to the west is open.' },
  ],

  mayor_idle: [{ speaker: NAMES.mayor, text: 'Ahem! Welcome, welcome to Cuddleberry Village, finest buns in all of Purrland.' }],
  mayor_night: [{ speaker: NAMES.mayor, text: '*yawn* Even mayors need their beauty sleep… good night, dear.' }],
  mayor_offer: [
    { speaker: NAMES.mayor, text: 'Well I never! The two of you, together at last. The whole village heard the fountain sing.' },
    { speaker: NAMES.mayor, text: 'Lilac Cottage, at the south end of the village, has been empty for ages. It needs a pair of kind cats to love it.' },
    { speaker: NAMES.mayor, text: 'Here are the keys. It’s yours — make it as cosy as you like.' },
  ],
  mayor_waiting: [{ speaker: NAMES.mayor, text: 'Lilac Cottage, with the purple roof, south end of the village. Go on, go on!' }],
  mayor_done: [{ speaker: NAMES.mayor, text: 'How is the cottage? I hear the curtains are lovely this time of year.' }],

  bella_hi: [{ speaker: NAMES.bella, text: 'Welcome to Ribbon & Bell! Everything here is hand-stitched, and every piece fits both of you.' }],
  bella_closed: [{ speaker: NAMES.bella, text: 'Oh, we’re sorting the new ribbons right now. Come back after you’ve helped Baker Mochi!' }],
  barnaby_hi: [{ speaker: NAMES.barnaby, text: 'Cozy Corner! Beds, rugs, lamps… whatever makes a house a home.' }],
  barnaby_nohome: [{ speaker: NAMES.barnaby, text: 'Furniture needs a home to go in, little one. Come back when you have one!' }],

  cocoa_idle: [{ speaker: NAMES.cocoa, text: 'The light by the windmill is perfect today. Everything looks like a painting.' }],
  cocoa_offer: [
    { speaker: NAMES.cocoa, text: 'Oh no, oh no. My favourite paintbrush — the one with the pink tip — is gone!' },
    { speaker: NAMES.cocoa, text: 'I was painting roses in the hedge garden this morning. Could you look for it there?' },
  ],
  cocoa_waiting: [{ speaker: NAMES.cocoa, text: 'A little brush with a pink tip, somewhere in the hedge garden.' }],
  cocoa_return: [
    { speaker: NAMES.cocoa, text: 'My brush! You’re an angel. Here, a few pawprints for your trouble.' },
  ],
  cocoa_done: [{ speaker: NAMES.cocoa, text: 'I’m painting the two of you next. Hold still! …Just kidding.' }],
  brush_pickup: [{ speaker: NAMES.caca, text: 'A paintbrush with a pink tip — this must be Cocoa’s.' }],

  tom_morning: [{ speaker: NAMES.tom, text: 'Fish bite best in the morning. Not that I’ve caught one in twelve years.' }],
  tom_day: [{ speaker: NAMES.tom, text: 'The ducks and I have an understanding. They don’t laugh at my fishing.' }],
  tom_evening: [{ speaker: NAMES.tom, text: 'See how the pond turns pink at sunset? Worth more than any fish.' }],
  tom_night: [{ speaker: NAMES.tom, text: 'Shh… the stars are in the water tonight. Don’t scare them off.' }],

  twins_day: [
    { speaker: NAMES.twins, text: 'We’re playing tag! You’re it!' },
    { speaker: NAMES.twins, text: 'Hehe, just kidding. You’re too nice to be it.' },
  ],
  twins_night: [{ speaker: NAMES.twins, text: '*whisper* We’re supposed to be in bed…' }],
  home_nap: [{ speaker: NAMES.caca, text: '*curls up* …just five minutes.' }],
  shop_lilac_locked: [{ speaker: NAMES.caca, text: 'A sweet little cottage with a purple roof. The door is locked.' }],

  berry_pick: [{ speaker: NAMES.caca, text: 'A pawful of warm, sweet cuddleberries.' }],
  mailbox_done: [{ speaker: NAMES.caca, text: 'Letter delivered!' }],
  kitten_crates: [{ speaker: 'Kitten', text: 'Mew! You found me! I can see the whole village from up here! Okay, okay, I’m going home.' }],
  kitten_cart: [{ speaker: 'Kitten', text: 'Hee hee, I was pretending to be a flower. Did it work? …I’ll go home now.' }],
  kitten_dock: [{ speaker: 'Kitten', text: 'Shh, the ducks are sleeping. Oh — supper time? Race you!' }],
  starflower_pick: [{ speaker: NAMES.caca, text: 'A starpetal flower. It twinkles a little.' }],

  gate_west_locked: [{ speaker: NAMES.caca, text: 'The forest path is still wrapped in thick mist. Maybe the stars here will clear it.' }],
  gate_east_locked: [{ speaker: NAMES.caca, text: 'The road to the sea is blocked by a sleepy hedge. It might wake up later.' }],
}

export const VILLAGE_NPCS: Record<string, NpcDef> = {
  mayor: {
    id: 'mayor', name: NAMES.mayor, event: 'talk:mayor',
    rules: [
      { quest: 'q_v_home', state: 'available', dialogue: 'mayor_offer' },
      { quest: 'q_v_home', state: 'in_progress', dialogue: 'mayor_waiting' },
      { quest: 'q_v_home', state: 'completed', dialogue: 'mayor_done' },
      { time: 'night', dialogue: 'mayor_night' },
      { dialogue: 'mayor_idle' },
    ],
  },
  bella: {
    id: 'bella', name: NAMES.bella, event: 'talk:bella',
    rules: [{ quest: 'q_v_berries', state: 'completed', dialogue: 'bella_hi', open: 'shop' }, { dialogue: 'bella_closed' }],
  },
  barnaby: {
    id: 'barnaby', name: NAMES.barnaby, event: 'talk:barnaby',
    rules: [{ quest: 'q_v_home', state: 'in_progress', dialogue: 'barnaby_hi', open: 'furniture' }, { quest: 'q_v_home', state: 'completed', dialogue: 'barnaby_hi', open: 'furniture' }, { dialogue: 'barnaby_nohome' }],
  },
  cocoa: {
    id: 'cocoa', name: NAMES.cocoa, event: 'talk:cocoa',
    rules: [
      { quest: 'q_v_brush', state: 'available', dialogue: 'cocoa_offer' },
      { quest: 'q_v_brush', state: 'in_progress', step: 'find', dialogue: 'cocoa_waiting' },
      { quest: 'q_v_brush', state: 'in_progress', step: 'return', dialogue: 'cocoa_return' },
      { quest: 'q_v_brush', state: 'completed', dialogue: 'cocoa_done' },
      { dialogue: 'cocoa_idle' },
    ],
  },
  tom: {
    id: 'tom', name: NAMES.tom, event: 'talk:tom',
    rules: [{ time: 'morning', dialogue: 'tom_morning' }, { time: 'evening', dialogue: 'tom_evening' }, { time: 'night', dialogue: 'tom_night' }, { dialogue: 'tom_day' }],
  },
  twins: {
    id: 'twins', name: NAMES.twins, event: 'talk:twins',
    rules: [{ time: 'night', dialogue: 'twins_night' }, { dialogue: 'twins_day' }],
  },
  mochi: {
    id: 'mochi', name: NAMES.mochi, event: 'talk:mochi',
    rules: [
      { quest: 'q_v_berries', state: 'available', dialogue: 'mochi_offer' },
      { quest: 'q_v_berries', state: 'in_progress', step: 'pick', dialogue: 'mochi_waiting' },
      { quest: 'q_v_berries', state: 'in_progress', step: 'return', dialogue: 'mochi_return' },
      { quest: 'q_v_berries', state: 'completed', dialogue: 'mochi_done' },
      { dialogue: 'mochi_idle' },
    ],
  },
  pudding: {
    id: 'pudding', name: NAMES.pudding, event: 'talk:pudding',
    rules: [
      { quest: 'q_v_letters', state: 'available', dialogue: 'pudding_offer' },
      { quest: 'q_v_letters', state: 'in_progress', step: 'deliver', dialogue: 'pudding_waiting' },
      { quest: 'q_v_letters', state: 'in_progress', step: 'return', dialogue: 'pudding_return' },
      { quest: 'q_v_letters', state: 'completed', dialogue: 'pudding_done' },
      { dialogue: 'pudding_locked' },
    ],
  },
  maple: {
    id: 'maple', name: NAMES.maple, event: 'talk:maple',
    rules: [
      { quest: 'q_v_kittens', state: 'available', dialogue: 'maple_offer' },
      { quest: 'q_v_kittens', state: 'in_progress', step: 'find', dialogue: 'maple_waiting' },
      { quest: 'q_v_kittens', state: 'in_progress', step: 'return', dialogue: 'maple_return' },
      { quest: 'q_v_kittens', state: 'completed', dialogue: 'maple_done' },
      { dialogue: 'maple_locked' },
    ],
  },
  rosie: {
    id: 'rosie', name: NAMES.rosie, event: 'talk:rosie',
    rules: [
      { quest: 'q_v_bouquet', state: 'available', dialogue: 'rosie_offer' },
      { quest: 'q_v_bouquet', state: 'in_progress', step: 'pick', dialogue: 'rosie_waiting' },
      { quest: 'q_v_bouquet', state: 'in_progress', step: 'return', dialogue: 'rosie_return' },
      { quest: 'q_v_bouquet', state: 'completed', dialogue: 'rosie_done' },
      { dialogue: 'rosie_idle' },
    ],
  },
}

export const VILLAGE_KEEPSAKES: Record<string, KeepsakeDef> = {
  mittens: { id: 'mittens', name: 'A Pair of Mittens', description: 'On the bench in the middle of the hedge garden: two little knitted mittens, one pink, one blue.', region: 'village' },
  teacups: { id: 'teacups', name: 'Two Teacups', description: 'Balanced on top of the hay bales: two tiny teacups that don’t quite match, and that’s why they’re perfect.', region: 'village' },
  ticket: { id: 'ticket', name: 'An Old Ticket Stub', description: 'Tucked behind the windmill: a ticket stub for two, a little crumpled from being kept for so long.', region: 'village' },
}
