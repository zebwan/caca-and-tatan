/** Cuddleberry Village — hand-placed layout. North is -z. */
import type { Vec2 } from '../../data/types'
import { doorPoint, localToWorld } from '../common/geom'

export interface House {
  id: string
  x: number
  z: number
  yaw: number
  w: number
  d: number
  wall: string
  roof: string
  kind?: 'bakery' | 'post' | 'boutique' | 'furniture' | 'home'
}

const houses: House[] = [
  { id: 'bakery', x: 0, z: -18.5, yaw: 0, w: 8, d: 6.2, wall: '#fff1e0', roof: '#f392b4', kind: 'bakery' },
  { id: 'rose', x: -15, z: -14.5, yaw: 0, w: 5.6, d: 4.8, wall: '#fde9f0', roof: '#e98aa9' },
  { id: 'plum', x: 15, z: -14.5, yaw: 0, w: 5.6, d: 4.8, wall: '#f1e8ff', roof: '#b9a5ee' },
  { id: 'berry', x: -31, z: -12.5, yaw: 0, w: 5.4, d: 4.6, wall: '#fff3e4', roof: '#ffb68a' },
  { id: 'willow', x: 31, z: -12.5, yaw: 0, w: 5.4, d: 4.6, wall: '#fff6ec', roof: '#f7a8c6' },
  { id: 'maple', x: -16, z: 14.5, yaw: Math.PI, w: 5.8, d: 5, wall: '#fff0e2', roof: '#ff9f8a' },
  { id: 'post', x: 16, z: 14.5, yaw: Math.PI, w: 5.8, d: 5, wall: '#eef5ff', roof: '#9cc3ea', kind: 'post' },
  { id: 'clover', x: -13, z: 24, yaw: Math.PI / 2, w: 5.2, d: 4.6, wall: '#fdf0e6', roof: '#f392b4' },
  { id: 'daisy', x: 13, z: 24, yaw: -Math.PI / 2, w: 5.2, d: 4.6, wall: '#f6efff', roof: '#cdb8f5' },
  { id: 'boutique', x: -31, z: 14, yaw: Math.PI, w: 6.4, d: 5, wall: '#fff0f6', roof: '#f27aa6', kind: 'boutique' },
  { id: 'cozy', x: 31, z: 14, yaw: Math.PI, w: 6.4, d: 5, wall: '#fff7e8', roof: '#c99a72', kind: 'furniture' },
  { id: 'lilac', x: -16, z: 38, yaw: Math.PI / 2, w: 6, d: 5.2, wall: '#fbf3ff', roof: '#b9a5ee', kind: 'home' },
]
const H = Object.fromEntries(houses.map((h) => [h.id, h])) as Record<string, House>

const spur = (h: House): Vec2[] => {
  const d = doorPoint(h, 0.4)
  if (Math.abs(h.yaw) < 0.1 || Math.abs(Math.abs(h.yaw) - Math.PI) < 0.1) return [d, { x: d.x, z: 0 }]
  return [d, { x: 0, z: d.z }]
}
const mailbox = (h: House) => localToWorld(h, h.w / 2 - 0.5, h.d / 2 + 1.3)

export const VILLAGE = {
  playRadius: 56,
  bowlStart: 50,
  houses,
  H,
  plaza: { x: 0, z: 0, r: 9 },
  fountain: { x: 0, z: 0 } as Vec2,

  entries: {
    south: { x: 0, z: 42, yaw: Math.PI },
    west: { x: -42, z: 0, yaw: Math.PI / 2 },
    east: { x: 42, z: 0, yaw: -Math.PI / 2 },
  },
  gates: {
    south: { x: 0, z: 51.5, yaw: 0 },
    west: { x: -51.5, z: 0, yaw: Math.PI / 2 },
    east: { x: 51.5, z: 0, yaw: Math.PI / 2 },
  },

  npcs: {
    mochi: { x: 3.2, z: -12.6 } as Vec2,
    pudding: { x: 12.8, z: 9.6 } as Vec2,
    maple: { x: -12.8, z: 9.6 } as Vec2,
    rosie: { x: -19, z: -8.8 } as Vec2,
    mayor: { x: 5.2, z: -5.6 } as Vec2,
    bella: { x: -27.6, z: 9.8 } as Vec2,
    barnaby: { x: 27.6, z: 9.8 } as Vec2,
    cocoa: { x: 27.4, z: 30.2 } as Vec2,
    tom: { x: 15.5, z: 44.2 } as Vec2,
  },
  /** Spots where ambient villagers hang out, by time of day. */
  twins: { morning: { x: -6, z: 12 }, afternoon: { x: 6.5, z: -3 }, evening: { x: -3, z: -4.5 }, night: { x: -14, z: 18.6 } },
  kittensHome: { x: -18, z: 8.6 } as Vec2,
  lilacDoor: { x: -12.6, z: 38 } as Vec2,
  paintbrush: { x: -36.2, z: -37.6 } as Vec2,

  berryBushes: [
    { x: -20, z: -27 },
    { x: 24, z: -26 },
    { x: -40, z: 4 },
    { x: 40, z: 21 },
    { x: 6.5, z: 40 },
  ] as Vec2[],

  mailboxes: { rose: mailbox(H.rose), plum: mailbox(H.plum), willow: mailbox(H.willow) },

  crates: [
    { x: 7, z: -26.2, r: 1.0, rise: 0.9 },
    { x: 8.7, z: -27.8, r: 1.0, rise: 1.8 },
    { x: 10.5, z: -29.4, r: 1.05, rise: 2.7 },
  ],
  kittens: {
    crates: { x: 10.5, z: -29.4 } as Vec2,
    cart: { x: -40, z: 25 } as Vec2,
    dock: { x: 19.3, z: 40 } as Vec2,
  },
  cart: { x: -40, z: 25, yaw: 0.6 },

  pond: { x: 22, z: 40, r: 5.5 },
  dock: { x: 17.6, z: 40, hw: 2.1, hd: 0.8 },
  windmill: { x: 34, z: 31 } as Vec2,
  bales: [
    { x: 29.4, z: 24.6, r: 1.15, rise: 0.9 },
    { x: 31.4, z: 22.7, r: 1.15, rise: 1.8 },
  ],

  hedge: {
    center: { x: -32, z: -33 } as Vec2,
    walls: [
      { x: -32, z: -39.2, hw: 6.4, hd: 0.55 },
      { x: -38.2, z: -33, hw: 0.55, hd: 6.4 },
      { x: -25.8, z: -35, hw: 0.55, hd: 4.4 },
      { x: -34.8, z: -26.8, hw: 3.6, hd: 0.55 },
    ],
    bench: { x: -32, z: -35.6 } as Vec2,
    flowers: [
      { x: -35.5, z: -36.5 },
      { x: -28.6, z: -36.8 },
      { x: -35.6, z: -29.8 },
    ] as Vec2[],
  },

  stalls: [
    { x: -7, z: 5.8, yaw: 0.75, color: '#f7a8c6' },
    { x: 7, z: 5.8, yaw: -0.75, color: '#9cc3ea' },
  ],

  keepsakes: {
    mittens: { x: -32, z: -33.2 } as Vec2,
    teacups: { x: 31.4, z: 22.7 } as Vec2,
    ticket: { x: 38.6, z: 35 } as Vec2,
  },

  lamps: [
    { x: 2.4, z: 18 }, { x: -2.4, z: 32 }, { x: 2.4, z: -8.5 },
    { x: -22, z: 2.4 }, { x: -38, z: -2.4 }, { x: 22, z: -2.4 }, { x: 38, z: 2.4 },
  ] as Vec2[],

  paths: [
    [{ x: 0, z: 53 }, { x: 0, z: -15.2 }],
    [{ x: -53, z: 0 }, { x: 53, z: 0 }],
    ...houses.filter((h) => h.id !== 'bakery').map(spur),
    [{ x: -24, z: 0 }, { x: -24, z: -20 }, { x: -28.5, z: -25.5 }],
    [{ x: 0, z: 36 }, { x: 9, z: 38.5 }, { x: 15.4, z: 40 }],
    [{ x: 0, z: 14 }, { x: 18, z: 22 }, { x: 28, z: 26 }],
    [{ x: 4, z: -15.4 }, { x: 6, z: -24 }],
  ] as Vec2[][],
  pathHalfWidth: 1.4,
} as const
