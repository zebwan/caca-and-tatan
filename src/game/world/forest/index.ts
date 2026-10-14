import type { RegionRuntime } from '../regionTypes'
import { Forest } from './ForestScene'
import { forestHeight, forestMapImage, forestPhysics } from './world'
import { FOREST as F } from './layout'
import { ForestDistant } from './Distant'

export const forestRegion: RegionRuntime = {
  id: 'forest',
  name: 'Whispering Moon Forest',
  Scene: Forest,
  Distant: ForestDistant,
  physics: forestPhysics,
  heightAt: forestHeight,
  entries: { east: F.entries.east },
  defaultEntry: 'east',
  exits: [{ id: 'east', ...F.gates.east, to: 'village', entry: 'west', label: 'Cuddleberry Village', style: 'gate' }],
  mapImage: forestMapImage,
  landmarks: Object.values(F.npcs).map((n) => ({ ...n, kind: 'npc' as const })),
  atmosphere: {
    sky: ['#2c2f6e', '#5b4f9e', '#c79fd2'],
    fog: '#6d6aa6',
    fogNear: 28,
    fogFar: 150,
    sunColor: '#cfd0ff',
    sunIntensity: 1.05,
    sunDir: [0.35, 0.7, -0.5],
    hemiSky: '#a59de6',
    hemiGround: '#425170',
    hemiIntensity: 1.15,
    ambient: '#8f86d0',
    ambientIntensity: 0.5,
    stars: 0.85,
    moon: true,
    clouds: false,
  },
  music: 'forest',
  ambience: 'forest',
}
