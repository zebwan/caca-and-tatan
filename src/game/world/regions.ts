/**
 * Region registry. Each region provides its scene, physics world, height
 * function, entries/exits, map painter, atmosphere and music. Gameplay
 * systems look everything up from here by the current region id.
 */
import type { RegionId } from '../data/types'
import type { RegionRuntime } from './regionTypes'
import { meadowRegion } from './meadow'
import { villageRegion } from './village'
import { homeRegion } from './home'
import { forestRegion } from './forest'
import { bayRegion } from './bay'
import { gardenRegion } from './garden'

export const REGION_RUNTIME: Partial<Record<RegionId, RegionRuntime>> = {
  meadow: meadowRegion,
  village: villageRegion,
  home: homeRegion,
  forest: forestRegion,
  bay: bayRegion,
  garden: gardenRegion,
}

export function registerRegion(r: RegionRuntime) {
  REGION_RUNTIME[r.id] = r
}

export const isBuilt = (id: RegionId) => !!REGION_RUNTIME[id]
export function regionRT(id: RegionId): RegionRuntime {
  return REGION_RUNTIME[id] ?? REGION_RUNTIME.meadow!
}
