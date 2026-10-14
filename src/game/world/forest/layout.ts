/** Whispering Moon Forest — hand-placed layout. North is -z. */
import type { Vec2 } from '../../data/types'

const C = { x: 0, z: -38 }
/** Heart-outline star stones, in outline order (the dip at the top, the tip toward the south). */
const heart = [
  { x: 0, z: -2.0 },
  { x: -4.0, z: -5.0 },
  { x: -6.0, z: 0.2 },
  { x: 0, z: 6.4 },
  { x: 6.0, z: 0.2 },
  { x: 4.0, z: -5.0 },
].map((p) => ({ x: C.x + p.x, z: C.z + p.z }))

export const FOREST = {
  playRadius: 56,
  bowlStart: 49,
  entries: {
    east: { x: 42, z: 5, yaw: -Math.PI / 2 },
  },
  gates: { east: { x: 52, z: 4, yaw: Math.PI / 2 } },

  npcs: {
    hoot: { x: 6.5, z: -13.5 } as Vec2,
    clover: { x: 26, z: 13 } as Vec2,
    luna: { x: -2.5, z: 18.5 } as Vec2,
    sprout: { x: -24, z: -26 } as Vec2,
  },
  lens: { x: -38, z: -36.5 } as Vec2,
  moonPlates: [
    { x: 20.2, z: -33.4 },
    { x: 27.8, z: -38.6 },
  ] as Vec2[],
  hollowTree: { x: 2.4, z: -17.5 } as Vec2,

  pawTrail: [
    { x: 21, z: 19 },
    { x: 12, z: 27 },
    { x: 0, z: 31 },
    { x: -12, z: 27.5 },
    { x: -22, z: 32 },
    { x: -33, z: 24 },
  ] as Vec2[],
  clearing: { x: -38, z: 17 } as Vec2,
  photo: { x: -39.5, z: 15 } as Vec2,

  mushrooms: [
    { x: -12, z: -19 },
    { x: -23, z: -12 },
    { x: -31, z: -24 },
    { x: -19, z: -32 },
    { x: -6, z: -26 },
  ] as Vec2[],

  moonClearing: C as Vec2,
  clearingRadius: 10.5,
  stars: heart,
  altar: { x: 24, z: -36 } as Vec2,

  pond: { x: -8, z: 12, r: 5.4, island: { x: -10.0, z: 12.3, r: 2.5 } },
  lilyPads: [
    { x: -3.6, z: 11.7, r: 0.8 },
    { x: -6.3, z: 12.1, r: 0.8 },
  ],
  giantMushrooms: [
    { x: 32, z: -21, r: 1.45, rise: 1.1 },
    { x: 34.4, z: -23.6, r: 1.45, rise: 2.2 },
    { x: 37, z: -26.4, r: 1.65, rise: 3.3 },
  ],
  hollowLog: { x: -41, z: -33, yaw: 0.5 },

  keepsakes: {
    lantern: { x: 37, z: -26.4 } as Vec2,
    songbook: { x: -41, z: -33 } as Vec2,
    moonstone: { x: -10.3, z: 12.3 } as Vec2,
  },

  fireflies: [
    { x: 14, z: 6 }, { x: 20, z: 24 }, { x: 4, z: 20 }, { x: 28, z: -4 }, { x: 10, z: -2 }, { x: 18, z: -14 },
  ] as Vec2[],

  lamps: [
    { x: 40, z: 6.4 }, { x: 20, z: -6 }, { x: -2, z: -9 }, { x: -2.6, z: -28 }, { x: 13, z: -33 },
  ] as Vec2[],

  paths: [
    [{ x: 54, z: 4 }, { x: 44, z: 4 }, { x: 36, z: 8 }, { x: 26, z: 4 }, { x: 18, z: -4 }, { x: 8, z: -8 }, { x: 0, z: -6 }, { x: -8, z: 0 }, { x: -18, z: 2 }, { x: -26, z: -4 }, { x: -28, z: -14 }, { x: -22, z: -22 }, { x: -12, z: -26 }, { x: -2, z: -27 }],
    [{ x: 0, z: -6 }, { x: 0.5, z: -18 }, { x: -1, z: -27.5 }],
    [{ x: 7, z: -38 }, { x: 16, z: -37 }, { x: 22, z: -36 }],
    [{ x: 26, z: 4 }, { x: 24, z: 12 }],
    [{ x: -8, z: 0 }, { x: -6, z: 5.5 }],
  ] as Vec2[][],
  pathHalfWidth: 1.2,
} as const
