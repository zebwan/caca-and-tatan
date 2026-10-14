/**
 * Pink Blossom Meadow — hand-placed layout. World units ≈ metres.
 * North is -z (top of the map). The camera starts behind Caca looking north.
 */
import type { Vec2 } from '../../data/types'

export type TileSymbol = 'heart' | 'flower' | 'star' | 'moon'

const circle: Vec2 = { x: 0, z: -32 }
const tileAt = (deg: number): Vec2 => ({
  x: circle.x + Math.cos((deg * Math.PI) / 180) * 4.3,
  z: circle.z + Math.sin((deg * Math.PI) / 180) * 4.3,
})

export const MEADOW = {
  size: 170,
  playRadius: 57,
  bowlStart: 51,

  spawn: { x: 0.5, z: 36.4 } as Vec2,
  /** Model faces +z at yaw 0, so π faces north. */
  spawnYaw: Math.PI,
  notePost: { x: 0.2, z: 32.9 } as Vec2,
  wakeTree: { x: 3.6, z: 38.8 } as Vec2,

  npcs: {
    mimi: { x: -22.4, z: -6.6 } as Vec2,
    biscuit: { x: 20.6, z: 18.4 } as Vec2,
    pip: { x: 5.6, z: -24.6 } as Vec2,
  },

  cottage: { x: -28.4, z: -10, hw: 3.1, hd: 2.6, yaw: Math.PI / 2 },
  bench: { x: 19.6, z: 21.0, yaw: -0.6 },
  picnic: { x: -15.5, z: 27.5 },

  hill: { x: 30, z: -26.5, amp: 4.4, sigma: 5.8 },
  swingTree: { x: 30, z: -27.6 } as Vec2,
  teddy: { x: 30, z: -24.7 } as Vec2,

  fieldCenter: { x: 30, z: 25 } as Vec2,
  fieldRadius: 10.5,
  butterflies: [
    { x: 25.2, z: 26.4 },
    { x: 31.4, z: 20.2 },
    { x: 36.0, z: 27.2 },
    { x: 28.6, z: 31.4 },
    { x: 34.2, z: 33.6 },
  ] as Vec2[],

  circle,
  circleRadius: 7.6,
  tiles: [
    { id: 'heart' as TileSymbol, color: '#f48fb6', ...tileAt(-45) },
    { id: 'flower' as TileSymbol, color: '#ffb68a', ...tileAt(45) },
    { id: 'star' as TileSymbol, color: '#f7d774', ...tileAt(135) },
    { id: 'moon' as TileSymbol, color: '#b9a5ee', ...tileAt(225) },
  ],
  tileRadius: 1.25,
  /** The heartbeat the lantern plays. */
  heartbeat: ['heart', 'moon', 'flower', 'star'] as TileSymbol[],

  arch: { x: 0, z: -50 } as Vec2,

  pond: { x: -30, z: 18, r: 7 },
  island: { x: -30.5, z: 18, r: 1.8 },
  lilyPads: [
    { x: -24.2, z: 18.3, r: 0.72 },
    { x: -26.1, z: 17.6, r: 0.72 },
    { x: -28.0, z: 18.2, r: 0.72 },
  ],

  stream: [
    { x: -23.5, z: 15.6 },
    { x: -16, z: 12 },
    { x: -8, z: 9.6 },
    { x: 0, z: 8 },
    { x: 8, z: 7 },
    { x: 16, z: 4.2 },
    { x: 24, z: 0.6 },
    { x: 32, z: -1 },
    { x: 42, z: -3 },
    { x: 56, z: -3.6 },
    { x: 90, z: -6 },
  ] as Vec2[],
  streamHalfWidth: 2.0,

  bridge: { x: 0, z: 8, hw: 1.55, hd: 4.9, rise: 0.6 },
  stones: [
    { x: 32.0, z: 0.75, r: 0.62 },
    { x: 32.15, z: -1.0, r: 0.62 },
    { x: 31.9, z: -2.75, r: 0.62 },
  ],

  /** Rock steps leading to the photo keepsake. `rise` is height above the terrain at its centre. */
  rockSteps: [
    { x: -38.2, z: -25.8, r: 1.35, rise: 0.95 },
    { x: -40.0, z: -28.0, r: 1.25, rise: 1.95 },
    { x: -42.1, z: -29.8, r: 1.4, rise: 2.95 },
  ],

  keepsakes: {
    photo: { x: -42.1, z: -29.8 } as Vec2,
    pressedFlower: { x: -30.6, z: 18.1 } as Vec2,
    paperStar: { x: -33.4, z: -15.2 } as Vec2,
  },

  plaza: { x: 0, z: -6, r: 4.6 },
  signpost: { x: 3.4, z: -2.6 } as Vec2,
  lamps: [
    { x: 3.0, z: 22 },
    { x: -2.3, z: 15.5 },
    { x: 2.4, z: -0.5 },
    { x: -2.2, z: -14 },
    { x: 2.5, z: -20.5 },
  ] as Vec2[],
  /** Standing stones around the Heart Garden (gaps north and south for the path). */
  standingStones: [20, 60, 100, 160, 200, 240, 300, 340].map((deg) => ({
    x: Math.cos((deg * Math.PI) / 180) * 8.7,
    z: -32 + Math.sin((deg * Math.PI) / 180) * 8.7,
  })) as Vec2[],

  paths: [
    [{ x: 0.3, z: 41 }, { x: 0.6, z: 33 }, { x: 1, z: 24 }, { x: 0.3, z: 16 }, { x: 0, z: 12.9 }],
    [{ x: 0, z: 3.1 }, { x: 0, z: -6 }],
    [{ x: 0, z: -6 }, { x: 0.5, z: -16 }, { x: 0, z: -24.4 }],
    [{ x: 0, z: -39.6 }, { x: 0, z: -46 }, { x: 0, z: -52 }],
    [{ x: 0, z: -6 }, { x: -9, z: -7.6 }, { x: -17, z: -9 }, { x: -24.6, z: -10 }],
    [{ x: 0, z: -6 }, { x: 9, z: -9 }, { x: 18, z: -14.5 }, { x: 24.5, z: -19.5 }, { x: 28.6, z: -23.2 }],
    [{ x: 0.8, z: 28 }, { x: 9, z: 26.4 }, { x: 15, z: 23.2 }, { x: 19.4, z: 20.4 }],
    [{ x: 0.5, z: 30 }, { x: -7, z: 27.5 }, { x: -14, z: 23.4 }, { x: -20.4, z: 19.6 }],
    [{ x: -23.2, z: -12.2 }, { x: -27, z: -15.6 }, { x: -32.6, z: -19.4 }, { x: -36.4, z: -23.6 }],
    [{ x: 28.4, z: 15.6 }, { x: 31.2, z: 6.5 }, { x: 32, z: 2 }],
    [{ x: 31.9, z: -4.2 }, { x: 30.2, z: -12 }, { x: 29.2, z: -19.5 }],
  ] as Vec2[][],
  pathHalfWidth: 1.25,
} as const

export type MeadowLayout = typeof MEADOW
