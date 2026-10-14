/**
 * Region registry. Each built region provides its scene, physics world,
 * height function, spawn and map painter. Adding Cuddleberry Village later
 * means adding an entry here; gameplay systems don't change.
 */
import type { ComponentType } from 'react'
import type { RegionId, Vec2 } from '../data/types'
import type { PhysicsWorld } from '../systems/physics'
import { Meadow } from './meadow/Meadow'
import { meadowPhysics } from './meadow/physics'
import { terrainHeight } from './meadow/terrain'
import { meadowMapImage } from './meadow/mapPainter'
import { MEADOW } from './meadow/layout'

export interface RegionRuntime {
  id: RegionId
  Scene: ComponentType
  physics: () => PhysicsWorld
  heightAt: (x: number, z: number) => number
  spawn: Vec2
  spawnYaw: number
  mapImage: () => HTMLCanvasElement
  /** Map landmarks shown on the minimap (NPCs etc.). */
  landmarks: { x: number; z: number; kind: 'npc' | 'home' }[]
}

export const REGION_RUNTIME: Partial<Record<RegionId, RegionRuntime>> = {
  meadow: {
    id: 'meadow',
    Scene: Meadow,
    physics: meadowPhysics,
    heightAt: terrainHeight,
    spawn: MEADOW.spawn,
    spawnYaw: MEADOW.spawnYaw,
    mapImage: meadowMapImage,
    landmarks: [
      { ...MEADOW.npcs.mimi, kind: 'npc' },
      { ...MEADOW.npcs.biscuit, kind: 'npc' },
      { ...MEADOW.npcs.pip, kind: 'npc' },
      { ...MEADOW.cottage, kind: 'home' },
    ],
  },
}

export const CURRENT_REGION: RegionId = 'meadow'
