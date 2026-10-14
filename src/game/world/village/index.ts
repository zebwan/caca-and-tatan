import type { RegionRuntime } from '../regionTypes'
import { DAY } from '../regionTypes'
import { Village } from './VillageScene'
import { villageHeight, villageMapImage, villagePhysics } from './world'
import { VILLAGE as V } from './layout'
import { VillageDistant } from './Distant'

export const villageRegion: RegionRuntime = {
  id: 'village',
  name: 'Cuddleberry Village',
  Scene: Village,
  Distant: VillageDistant,
  physics: villagePhysics,
  heightAt: villageHeight,
  entries: {
    south: V.entries.south,
    west: V.entries.west,
    east: V.entries.east,
    lilac: { x: -11.2, z: 38, yaw: Math.PI / 2 },
  },
  defaultEntry: 'south',
  exits: [
    { id: 'south', ...V.gates.south, to: 'meadow', entry: 'arch', label: 'Pink Blossom Meadow', style: 'gate' },
    { id: 'west', ...V.gates.west, to: 'forest', entry: 'east', label: 'Whispering Moon Forest', requires: 'q_v_home', locked: 'gate_west_locked', style: 'gate' },
    { id: 'east', ...V.gates.east, to: 'bay', entry: 'west', label: 'Bubblegum Bay', requires: 'q_f_gate', locked: 'gate_east_locked', style: 'gate' },
    { id: 'lilac', x: V.lilacDoor.x, z: V.lilacDoor.z, to: 'home', entry: 'door', label: 'Lilac Cottage', requires: 'q_v_gate', style: 'custom' },
  ],
  mapImage: villageMapImage,
  landmarks: [
    ...Object.values(V.npcs).map((n) => ({ ...n, kind: 'npc' as const })),
    { ...V.H.lilac, kind: 'home' as const },
  ],
  atmosphere: { ...DAY, sky: ['#93c6f0', '#cfe4f6', '#ffe2d6'], fog: '#f9e3dc', hemiGround: '#c2d9a0' },
  music: 'village',
  ambience: 'village',
}
