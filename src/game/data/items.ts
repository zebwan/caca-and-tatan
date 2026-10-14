import type { AccessoryDef, KeepsakeDef, RegionDef } from './types'
import { VILLAGE_KEEPSAKES } from './regions/village'
import { FOREST_KEEPSAKES } from './regions/forest'
import { BAY_KEEPSAKES } from './regions/bay'

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
  ...VILLAGE_KEEPSAKES,
  ...FOREST_KEEPSAKES,
  ...BAY_KEEPSAKES,
}

export const ACCESSORIES: AccessoryDef[] = [
  { id: 'pinkBow', name: 'Pink Bow', description: 'Caca’s favourite.', slot: 'bow', hint: '' },
  { id: 'ribbonBow', name: 'Peach Ribbon Bow', description: 'Tied by Rosie from birthday ribbon.', slot: 'bow', hint: 'Help Rosie in Cuddleberry Village' },
  { id: 'starBow', name: 'Starlight Bow', description: 'Lavender, with a tiny star that glows.', slot: 'bow', hint: 'Solve the constellation in the forest' },
  { id: 'flowerCrown', name: 'Flower Crown', description: 'Woven from Heart Garden blossoms.', slot: 'head', hint: 'Solve the Heartbeat Puzzle' },
  { id: 'shellTiara', name: 'Shell Tiara', description: 'A little crown of pastel shells.', slot: 'head', hint: 'Dig for treasure in Bubblegum Bay' },
  { id: 'heartGlasses', name: 'Heart Glasses', description: 'Everything looks a little rosier.', slot: 'face', hint: 'Find all three keepsakes in the meadow' },
  { id: 'backpack', name: 'Tiny Backpack', description: 'For carrying letters and notes.', slot: 'back', hint: 'Deliver the letters in Cuddleberry Village' },
  { id: 'collar', name: 'Bell Collar', description: 'Jingles softly.', slot: 'neck', hint: 'Rescue the kitten in Bubblegum Bay' },
  { id: 'moonScarf', name: 'Moon Scarf', description: 'Knitted by Clover, soft as moonlight.', slot: 'neck', hint: 'Bring fireflies to Clover in the forest' },
  { id: 'loveLocket', name: 'Heart Locket', description: 'Holds every memory you found.', slot: 'neck', hint: 'Find every keepsake in Purrland' },
]

export const REGIONS: RegionDef[] = [
  { id: 'meadow', name: 'Pink Blossom Meadow', tagline: 'Where Caca woke up', map: { x: 27, y: 63, r: 15 }, built: true },
  { id: 'village', name: 'Cuddleberry Village', tagline: 'Warm bread and kind neighbours', map: { x: 55, y: 43, r: 13 }, unlockedBy: 'q_arch', built: true },
  { id: 'forest', name: 'Whispering Moon Forest', tagline: 'Glowing mushrooms and quiet stars', map: { x: 13, y: 22, r: 12 }, unlockedBy: 'q_v_gate', built: true },
  { id: 'bay', name: 'Bubblegum Bay', tagline: 'Pink sand and soft waves', map: { x: 84, y: 64, r: 13 }, unlockedBy: 'q_f_gate', built: true },
  { id: 'garden', name: 'The Starlight Garden', tagline: 'Where the wish was made', map: { x: 80, y: 18, r: 10 }, unlockedBy: 'q_b_gate', built: true },
]

export const REGION_BY_ID = Object.fromEntries(REGIONS.map((r) => [r.id, r])) as Record<RegionDef['id'], RegionDef>
