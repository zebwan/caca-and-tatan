/** The Starlight Garden — floating islands above the clouds. North is -z. */
import type { Vec2 } from '../../data/types'

export interface Island {
  id: string
  x: number
  z: number
  r: number
  h: number
}

export const GARDEN = {
  playRadius: 56,
  islands: [
    { id: 'south', x: 0, z: 36, r: 9.5, h: 2 },
    { id: 'west', x: -21, z: 17, r: 6.8, h: 3.2 },
    { id: 'east', x: 21, z: 17, r: 6.8, h: 3.2 },
    { id: 'nw', x: -21, z: -15, r: 6.4, h: 5.2 },
    { id: 'ne', x: 21, z: -15, r: 6.4, h: 5.2 },
    { id: 'heart', x: 0, z: -4, r: 12, h: 3.8 },
  ] as Island[],
  entries: { stairs: { x: 0, z: 41.5, yaw: Math.PI } },
  stairsTop: { x: 0, z: 45.2 } as Vec2,

  /** Always-there petal bridges (from, to). */
  bridges: [
    { from: { x: -6.4, z: 30.5 }, to: { x: -16.2, z: 21.6 }, y0: 2, y1: 3.2 },
    { from: { x: 6.4, z: 30.5 }, to: { x: 16.2, z: 21.6 }, y0: 2, y1: 3.2 },
  ],
  /** Floating stepping platforms up to the northern islands; some drift gently. */
  platforms: [
    { x: -21.8, z: 8.2, r: 1.25, top: 3.7, move: null },
    { x: -20.4, z: 3.9, r: 1.25, top: 4.2, move: { axis: 'x', amp: 1.0, speed: 0.5 } },
    { x: -21.8, z: -0.4, r: 1.25, top: 4.6, move: null },
    { x: -21.0, z: -4.9, r: 1.25, top: 5.0, move: null },
    { x: 21.8, z: 8.2, r: 1.25, top: 3.7, move: null },
    { x: 20.4, z: 3.9, r: 1.25, top: 4.2, move: null },
    { x: 21.8, z: -0.4, r: 1.25, top: 4.6, move: { axis: 'z', amp: 0.9, speed: 0.55 } },
    { x: 21.0, z: -4.9, r: 1.25, top: 5.0, move: null },
  ] as { x: number; z: number; r: number; top: number; move: null | { axis: 'x' | 'z'; amp: number; speed: number } }[],

  /** One wish pedestal per region, each on its own island. */
  pedestals: [
    { id: 'meadow', x: -21, z: 17, color: '#f48fb6', symbol: 'heart' },
    { id: 'village', x: -21, z: -15, color: '#ffb68a', symbol: 'flower' },
    { id: 'forest', x: 21, z: -15, color: '#b9a5ee', symbol: 'moon' },
    { id: 'bay', x: 21, z: 17, color: '#7fd0d8', symbol: 'star' },
  ] as { id: string; x: number; z: number; color: string; symbol: 'heart' | 'flower' | 'moon' | 'star' }[],

  /** Light bridge from the south island to the heart island, one segment per lit wish. */
  lightBridge: { from: { x: 0, z: 26.8 }, to: { x: 0, z: 7.6 }, y0: 2, y1: 3.8, hw: 1.5 },

  heartTree: { x: 0, z: -9 } as Vec2,
  tatan: { x: 0, z: -3.2 } as Vec2,
  meet: { x: 0, z: 0.6 } as Vec2,
} as const

export const islandOf = (id: string) => GARDEN.islands.find((i) => i.id === id)!
