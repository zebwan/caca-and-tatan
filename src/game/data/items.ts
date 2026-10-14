import type { AccessoryDef, KeepsakeDef, RegionDef } from './types'

export const KEEPSAKES: Record<string, KeepsakeDef> = {
  photo: {
    id: 'photo',
    name: 'A Little Photograph',
    description: 'Tucked on top of the mossy rocks, a tiny photo of two cats, slightly faded at the corners.',
    region: 'meadow',
  },
  pressedFlower: {
    id: 'pressedFlower',
    name: 'A Pressed Flower',
    description: 'On the tiny island in the pond, a flower pressed flat between two leaves, kept safe on purpose.',
    region: 'meadow',
  },
  paperStar: {
    id: 'paperStar',
    name: 'A Folded Paper Star',
    description: 'Hidden in the old stump behind the cottage, a paper star folded very carefully.',
    region: 'meadow',
  },
}

export const ACCESSORIES: AccessoryDef[] = [
  { id: 'pinkBow', name: 'Pink Bow', description: 'Caca’s favourite. Always on.', slot: 'head', hint: '' },
  { id: 'flowerCrown', name: 'Flower Crown', description: 'Woven from Heart Garden blossoms.', slot: 'head', hint: 'Solve the Heartbeat Puzzle' },
  { id: 'heartGlasses', name: 'Heart Glasses', description: 'Everything looks a little rosier.', slot: 'face', hint: 'Find all three keepsakes in the meadow' },
  { id: 'backpack', name: 'Tiny Backpack', description: 'For carrying letters.', slot: 'back', hint: 'Cuddleberry Village — Chapter 2' },
  { id: 'collar', name: 'Bell Collar', description: 'Jingles softly.', slot: 'neck', hint: 'Bubblegum Bay — a later chapter' },
]

export const REGIONS: RegionDef[] = [
  { id: 'meadow', name: 'Pink Blossom Meadow', tagline: 'Where Caca woke up', map: { x: 27, y: 63, r: 18 }, built: true },
  { id: 'village', name: 'Cuddleberry Village', tagline: 'Chapter 2 · coming soon', map: { x: 58, y: 44, r: 12 }, unlockedBy: 'q_arch', built: false },
  { id: 'forest', name: 'Whispering Moon Forest', tagline: 'A later chapter', map: { x: 9, y: 22, r: 8 }, built: false },
  { id: 'bay', name: 'Bubblegum Bay', tagline: 'A later chapter', map: { x: 86, y: 68, r: 11 }, built: false },
  { id: 'garden', name: '???', tagline: 'Somewhere the stars are gathering', map: { x: 80, y: 14, r: 8 }, built: false },
]
