import type { RegionRuntime } from '../regionTypes'
import { DAY } from '../regionTypes'
import { Meadow } from './Meadow'
import { meadowPhysics } from './physics'
import { terrainHeight } from './terrain'
import { meadowMapImage } from './mapPainter'
import { MEADOW } from './layout'
import { Distant } from '../Distant'

export const meadowRegion: RegionRuntime = {
  id: 'meadow',
  name: 'Pink Blossom Meadow',
  Scene: Meadow,
  Distant,
  physics: meadowPhysics,
  heightAt: terrainHeight,
  entries: {
    spawn: { ...MEADOW.spawn, yaw: MEADOW.spawnYaw },
    arch: { x: 0, z: -43.5, yaw: 0 },
  },
  defaultEntry: 'spawn',
  exits: [{ id: 'arch', x: MEADOW.arch.x, z: MEADOW.arch.z, to: 'village', entry: 'south', label: 'Cuddleberry Village', requires: 'q_arch', style: 'custom' }],
  mapImage: meadowMapImage,
  landmarks: [
    { ...MEADOW.npcs.mimi, kind: 'npc' },
    { ...MEADOW.npcs.biscuit, kind: 'npc' },
    { ...MEADOW.npcs.pip, kind: 'npc' },
    { ...MEADOW.cottage, kind: 'home' },
  ],
  atmosphere: DAY,
  music: 'meadow',
  ambience: 'meadow',
}
