import type { RegionRuntime } from '../regionTypes'
import { DAY } from '../regionTypes'
import { Bay } from './BayScene'
import { bayHeight, bayMapImage, bayPhysics } from './world'
import { BAY as B } from './layout'
import { BayDistant } from './Distant'

export const bayRegion: RegionRuntime = {
  id: 'bay',
  name: 'Bubblegum Bay',
  Scene: Bay,
  Distant: BayDistant,
  physics: bayPhysics,
  heightAt: bayHeight,
  entries: { west: B.entries.west, stairs: B.entries.stairs },
  defaultEntry: 'west',
  exits: [
    { id: 'west', ...B.gates.west, to: 'village', entry: 'east', label: 'Cuddleberry Village', style: 'gate' },
    { id: 'sky', ...B.stairsBase, to: 'garden', entry: 'stairs', label: 'The Starlight Garden', requires: 'q_b_gate', style: 'custom' },
  ],
  mapImage: bayMapImage,
  landmarks: Object.values(B.npcs).map((n) => ({ ...n, kind: 'npc' as const })),
  atmosphere: { ...DAY, sky: ['#7fc8f2', '#c4e6fa', '#ffe3ec'], fog: '#f4e9f1', fogNear: 90, fogFar: 320, sunIntensity: 2.0, hemiGround: '#f6d6dc', petals: false },
  music: 'bay',
  ambience: 'bay',
}
