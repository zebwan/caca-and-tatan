/**
 * Pawprints economy: what things cost, and what each shop sells.
 * Prices and rewards are easy to tweak here.
 */
export const PAWPRINTS = {
  mainQuest: 25,
  chapterEnd: 50,
  optionalQuest: 30,
  request: 20,
  coin: 5,
  startingGift: 30,
} as const

export type ClothingSlot = 'bow' | 'head' | 'face' | 'neck' | 'back'
export interface ClothingItem {
  id: string
  name: string
  slot: ClothingSlot
  price: number
  color?: string
}

/** Things sold at the Ribbon & Bell boutique (clothes fit both cats). */
export const BOUTIQUE: ClothingItem[] = [
  { id: 'skyBow', name: 'Sky Bow', slot: 'bow', price: 40 },
  { id: 'mintBow', name: 'Mint Bow', slot: 'bow', price: 40 },
  { id: 'starClip', name: 'Star Hairclip', slot: 'head', price: 35 },
  { id: 'beret', name: 'Pink Beret', slot: 'head', price: 60 },
  { id: 'sunHat', name: 'Sun Hat', slot: 'head', price: 70 },
  { id: 'bunnyBand', name: 'Bunny-Ear Headband', slot: 'head', price: 80 },
  { id: 'partyHat', name: 'Party Hat', slot: 'head', price: 50 },
  { id: 'roundGlasses', name: 'Round Glasses', slot: 'face', price: 50 },
  { id: 'starGlasses', name: 'Star Glasses', slot: 'face', price: 65 },
  { id: 'pinkScarf', name: 'Pink Scarf', slot: 'neck', price: 45 },
  { id: 'mintScarf', name: 'Mint Scarf', slot: 'neck', price: 45 },
  { id: 'bowtie', name: 'Bow Tie', slot: 'neck', price: 40 },
  { id: 'bandana', name: 'Peach Bandana', slot: 'neck', price: 35 },
  { id: 'cape', name: 'Little Cape', slot: 'back', price: 90 },
  { id: 'angelWings', name: 'Angel Wings', slot: 'back', price: 120 },
]

/** Items that are earned rather than bought (quest rewards). */
export const REWARD_CLOTHES: ClothingItem[] = [
  { id: 'pinkBow', name: 'Pink Bow', slot: 'bow', price: 0 },
  { id: 'ribbonBow', name: 'Peach Ribbon Bow', slot: 'bow', price: 0 },
  { id: 'starBow', name: 'Starlight Bow', slot: 'bow', price: 0 },
  { id: 'flowerCrown', name: 'Flower Crown', slot: 'head', price: 0 },
  { id: 'shellTiara', name: 'Shell Tiara', slot: 'head', price: 0 },
  { id: 'heartGlasses', name: 'Heart Glasses', slot: 'face', price: 0 },
  { id: 'blueScarf', name: 'Blue Scarf', slot: 'neck', price: 0 },
  { id: 'collar', name: 'Bell Collar', slot: 'neck', price: 0 },
  { id: 'moonScarf', name: 'Moon Scarf', slot: 'neck', price: 0 },
  { id: 'loveLocket', name: 'Heart Locket', slot: 'neck', price: 0 },
  { id: 'backpack', name: 'Tiny Backpack', slot: 'back', price: 0 },
]
export const ALL_CLOTHES = [...REWARD_CLOTHES, ...BOUTIQUE]
export const CLOTHING_BY_ID = Object.fromEntries(ALL_CLOTHES.map((c) => [c.id, c])) as Record<string, ClothingItem>

export type HomeSlot = 'floor' | 'wall' | 'bed' | 'rug' | 'sofa' | 'table' | 'lamp' | 'plant' | 'art' | 'window' | 'shelf' | 'play'
export interface FurnitureItem {
  id: string
  name: string
  slot: HomeSlot
  price: number
}

export const HOME_SLOTS: { id: HomeSlot; name: string }[] = [
  { id: 'floor', name: 'Floor' },
  { id: 'wall', name: 'Wallpaper' },
  { id: 'bed', name: 'Bed' },
  { id: 'rug', name: 'Rug' },
  { id: 'sofa', name: 'Seating' },
  { id: 'table', name: 'Table' },
  { id: 'lamp', name: 'Lamp' },
  { id: 'plant', name: 'Plants' },
  { id: 'art', name: 'Wall art' },
  { id: 'window', name: 'Window' },
  { id: 'shelf', name: 'Shelf' },
  { id: 'play', name: 'Play corner' },
]

/** Sold at the Cozy Corner furniture shop. The first item in each slot is free and already yours. */
export const FURNITURE: FurnitureItem[] = [
  { id: 'floorWood', name: 'Honey Wood Floor', slot: 'floor', price: 0 },
  { id: 'floorPink', name: 'Pink Tiles', slot: 'floor', price: 40 },
  { id: 'floorLavender', name: 'Lavender Carpet', slot: 'floor', price: 60 },
  { id: 'wallCream', name: 'Cream Walls', slot: 'wall', price: 0 },
  { id: 'wallHearts', name: 'Heart Wallpaper', slot: 'wall', price: 50 },
  { id: 'wallStars', name: 'Starry Wallpaper', slot: 'wall', price: 60 },
  { id: 'wallMint', name: 'Mint Stripes', slot: 'wall', price: 50 },
  { id: 'bedBasket', name: 'Basket Bed for Two', slot: 'bed', price: 0 },
  { id: 'bedCloud', name: 'Cloud Bed', slot: 'bed', price: 120 },
  { id: 'bedHeart', name: 'Heart Bed', slot: 'bed', price: 150 },
  { id: 'rugRound', name: 'Round Rug', slot: 'rug', price: 40 },
  { id: 'rugHeart', name: 'Heart Rug', slot: 'rug', price: 60 },
  { id: 'rugRainbow', name: 'Rainbow Rug', slot: 'rug', price: 80 },
  { id: 'sofaPink', name: 'Pink Sofa', slot: 'sofa', price: 110 },
  { id: 'sofaBeans', name: 'Twin Beanbags', slot: 'sofa', price: 70 },
  { id: 'tableTea', name: 'Tea Table', slot: 'table', price: 60 },
  { id: 'tableRound', name: 'Round Table with Cake', slot: 'table', price: 75 },
  { id: 'lampMushroom', name: 'Mushroom Lamp', slot: 'lamp', price: 50 },
  { id: 'lampStar', name: 'Star Lamp', slot: 'lamp', price: 65 },
  { id: 'plantFern', name: 'Ferns', slot: 'plant', price: 25 },
  { id: 'plantFlowers', name: 'Flower Pots', slot: 'plant', price: 35 },
  { id: 'artFrame', name: 'Painting of Us', slot: 'art', price: 45 },
  { id: 'artHeart', name: 'Heart Garland', slot: 'art', price: 40 },
  { id: 'windowPlain', name: 'Plain Curtains', slot: 'window', price: 0 },
  { id: 'windowPink', name: 'Pink Curtains', slot: 'window', price: 35 },
  { id: 'windowLights', name: 'Fairy Lights', slot: 'window', price: 60 },
  { id: 'shelfBooks', name: 'Bookshelf', slot: 'shelf', price: 80 },
  { id: 'playTree', name: 'Cat Tree', slot: 'play', price: 130 },
  { id: 'playYarn', name: 'Yarn Basket', slot: 'play', price: 30 },
]
export const FURNITURE_BY_ID = Object.fromEntries(FURNITURE.map((f) => [f.id, f])) as Record<string, FurnitureItem>
export const DEFAULT_HOME: Partial<Record<HomeSlot, string>> = { floor: 'floorWood', wall: 'wallCream', bed: 'bedBasket', window: 'windowPlain' }
export const FREE_ITEMS = FURNITURE.filter((f) => f.price === 0).map((f) => f.id)
