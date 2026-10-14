/**
 * Interaction registry. World objects register an Interactable; each frame the
 * nearest enabled one in range becomes the prompt target, and E triggers it.
 */
import * as THREE from 'three'

export interface Interactable {
  id: string
  /** World position (read every frame, so moving objects work). */
  position: THREE.Vector3
  radius: number
  /** Prompt text, e.g. "Talk to Mimi". */
  label: () => string
  enabled: () => boolean
  onInteract: () => void
  /** Height above the position Caca looks at. */
  lookHeight?: number
}

const registry = new Map<string, Interactable>()

export const interactions = {
  register(i: Interactable) {
    registry.set(i.id, i)
    return () => {
      if (registry.get(i.id) === i) registry.delete(i.id)
    }
  },
  /** Best target near a point, favouring what Caca is facing. */
  nearest(pos: THREE.Vector3, yaw: number): Interactable | null {
    let best: Interactable | null = null
    let bestScore = Infinity
    const fx = Math.sin(yaw), fz = Math.cos(yaw)
    for (const i of registry.values()) {
      if (!i.enabled()) continue
      const dx = i.position.x - pos.x, dz = i.position.z - pos.z
      const d = Math.hypot(dx, dz)
      if (d > i.radius || Math.abs(i.position.y - pos.y) > 3.2) continue
      const facing = d > 0.01 ? (dx * fx + dz * fz) / d : 1
      const score = d - facing * 0.6
      if (score < bestScore) {
        bestScore = score
        best = i
      }
    }
    return best
  },
  get(id: string) {
    return registry.get(id)
  },
}
