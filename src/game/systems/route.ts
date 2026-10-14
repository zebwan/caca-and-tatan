/**
 * Cross-region guidance: which exit in the current region leads (eventually)
 * to the region where the objective is, using only exits that are open.
 */
import type { RegionId } from '../data/types'
import type { QuestProgress } from '../state/store'
import { REGION_RUNTIME } from '../world/regions'
import type { ExitDef } from '../world/regionTypes'

export function exitOpen(e: ExitDef, quests: Record<string, QuestProgress>) {
  return !e.requires || quests[e.requires]?.state === 'completed'
}

export function routeExit(from: RegionId, to: RegionId, quests: Record<string, QuestProgress>): ExitDef | null {
  if (from === to) return null
  const prev = new Map<RegionId, { region: RegionId; exit: ExitDef }>()
  const queue: RegionId[] = [from]
  const seen = new Set<RegionId>([from])
  while (queue.length) {
    const r = queue.shift()!
    for (const e of REGION_RUNTIME[r]?.exits ?? []) {
      if (!exitOpen(e, quests) || seen.has(e.to)) continue
      seen.add(e.to)
      prev.set(e.to, { region: r, exit: e })
      if (e.to === to) {
        // walk back to the first hop
        let cur: RegionId = to
        let hop = prev.get(cur)!
        while (hop.region !== from) {
          cur = hop.region
          hop = prev.get(cur)!
        }
        return hop.exit
      }
      queue.push(e.to)
    }
  }
  return null
}
