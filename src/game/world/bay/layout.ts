/** Bubblegum Bay — hand-placed layout. North is -z; the sea lies to the east. */
import type { Vec2 } from '../../data/types'

/** x of the shoreline at a given z (land to the west, sea to the east). */
export const shoreX = (z: number) => 21 + 3.2 * Math.sin(z * 0.075 + 0.6) + 1.5 * Math.sin(z * 0.17)

export const BAY = {
  playRadius: 56,
  bowlStart: 49,
  entries: {
    west: { x: -46, z: 0, yaw: Math.PI / 2 },
    stairs: { x: 9.5, z: -40.5, yaw: Math.PI },
  },
  gates: { west: { x: -52, z: 0, yaw: Math.PI / 2 } },

  npcs: {
    shelly: { x: -2.5, z: 10.5 } as Vec2,
    captain: { x: 17.2, z: 3.4 } as Vec2,
  },

  huts: [
    { id: 'shelly', x: -6.5, z: 14.5, yaw: Math.PI / 2, w: 4.6, d: 4.2, wall: '#fff6ec', roof: '#7fd0d8' },
    { id: 'sun', x: -10, z: -4, yaw: Math.PI / 2, w: 4.6, d: 4.2, wall: '#fff0f5', roof: '#f7a8c6' },
    { id: 'shell', x: -5, z: 30, yaw: Math.PI / 2, w: 4.6, d: 4.2, wall: '#fffbe8', roof: '#ffc59e' },
  ],

  pier: { x: 31, z: 6, hw: 11, hd: 1.35, deck: 1.25 },
  boat: { x: 43.6, z: 9.2 } as Vec2,
  sandbar: { x: 54, z: 27, r: 4.2 },
  bottle: { x: 55.2, z: 28.4 } as Vec2,
  boatLanding: { x: 51.2, z: 24.6 } as Vec2,

  islet: { x: 39, z: -16.5, r: 3.4 },
  kitten: { x: 39.6, z: -16.8 } as Vec2,
  floats: [
    { x: 25.6, z: -13.2, r: 1.0, top: 0.62, move: null },
    { x: 28.6, z: -14.2, r: 1.0, top: 0.5, move: { axis: 'z', amp: 1.1, speed: 0.55 } },
    { x: 31.8, z: -15.0, r: 1.0, top: 0.62, move: null },
    { x: 34.8, z: -15.8, r: 1.0, top: 0.5, move: { axis: 'x', amp: 0.8, speed: 0.6 } },
  ] as { x: number; z: number; r: number; top: number; move: null | { axis: 'x' | 'z'; amp: number; speed: number } }[],

  lighthouse: { x: 2, z: -42 } as Vec2,
  lighthouseDoor: { x: 2, z: -38.6 } as Vec2,
  headland: { x: 2, z: -41, amp: 5.2, sigma: 7.5 },
  stairsBase: { x: 9.5, z: -44 } as Vec2,

  shells: [
    { x: 14.5, z: 24 }, { x: 17, z: -5 }, { x: 12, z: 38 }, { x: 15.5, z: -25 }, { x: 9, z: -9 }, { x: 18.6, z: 15 },
  ] as Vec2[],
  digSpots: [
    { x: 11, z: 30 }, { x: 6, z: -18 }, { x: 13.6, z: 8 },
  ] as Vec2[],

  rockArch: [
    { x: -14, z: 36, r: 1.3, rise: 1.0 },
    { x: -16.2, z: 38.2, r: 1.3, rise: 2.0 },
    { x: -18.6, z: 40.4, r: 1.5, rise: 3.0 },
  ],
  keepsakes: {
    starfish: { x: -18.6, z: 40.4 } as Vec2,
    postcard: { x: 41, z: 4.6 } as Vec2,
    seaglass: { x: 53.2, z: 25.8 } as Vec2,
  },

  lamps: [{ x: 2.4, z: -20 }, { x: -2.4, z: -32 }, { x: -24, z: 2.4 }, { x: 19.5, z: 7.8 }] as Vec2[],

  paths: [
    [{ x: -54, z: 0 }, { x: -20, z: 0 }, { x: 0, z: 2 }, { x: 15, z: 4.5 }, { x: 20.5, z: 6 }],
    [{ x: 0, z: 2 }, { x: 0, z: -20 }, { x: 1.5, z: -32 }, { x: 2, z: -37.6 }],
    [{ x: 1.5, z: -32 }, { x: 8, z: -38 }, { x: 9.5, z: -42.5 }],
    [{ x: 0, z: 2 }, { x: -2, z: 14.5 }, { x: -2.5, z: 30 }],
    [{ x: -6, z: -4 }, { x: -2, z: 1.5 }],
  ] as Vec2[][],
  pathHalfWidth: 1.25,
} as const
