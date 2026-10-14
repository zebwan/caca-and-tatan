/**
 * Simple, predictable character physics: analytic ground + platforms,
 * circle/box obstacles, water edges and a circular world boundary.
 */
export const STEP_UP = 0.55
export const PLAYER_RADIUS = 0.42

export interface Shape {
  kind: 'circle' | 'box'
  x: number
  z: number
  r?: number
  hw?: number
  hd?: number
  yaw?: number
}

/** Something that blocks movement. A walkable solid can be stood on once you are above `top - STEP_UP`. */
export interface Solid extends Shape {
  top: number
  walkable?: boolean
}

/** A walkable platform with no sides (bridge deck, lily pad, stepping stone). */
export interface Surface extends Shape {
  /** Absolute height at a local point (local x/z in the shape's own frame). */
  height: (lx: number, lz: number) => number
  /** When present and false, the platform doesn't exist (e.g. a bridge not yet built). */
  enabled?: () => boolean
}

export interface PhysicsWorld {
  terrain: (x: number, z: number) => number
  water: (x: number, z: number) => boolean
  solids: Solid[]
  surfaces: Surface[]
  center: { x: number; z: number }
  radius: number
}

/** World → shape-local, using the same yaw convention as Three's rotation.y. */
function toLocal(s: Shape, x: number, z: number) {
  const dx = x - s.x, dz = z - s.z
  const c = Math.cos(s.yaw ?? 0), n = Math.sin(s.yaw ?? 0)
  return { lx: dx * c - dz * n, lz: dx * n + dz * c }
}

export function contains(s: Shape, x: number, z: number, margin = 0) {
  if (s.kind === 'circle') return Math.hypot(x - s.x, z - s.z) <= (s.r ?? 0) + margin
  const { lx, lz } = toLocal(s, x, z)
  return Math.abs(lx) <= (s.hw ?? 0) + margin && Math.abs(lz) <= (s.hd ?? 0) + margin
}

function surfaceHeight(s: Surface, x: number, z: number) {
  const { lx, lz } = toLocal(s, x, z)
  return s.height(lx, lz)
}

/** True if a platform or walkable solid covers this point. */
export function onPlatform(w: PhysicsWorld, x: number, z: number) {
  for (const s of w.surfaces) if ((!s.enabled || s.enabled()) && contains(s, x, z, 0.08)) return true
  for (const s of w.solids) if (s.walkable && contains(s, x, z, 0.05)) return true
  return false
}

/** Highest standable height at (x,z) that is not above feet + STEP_UP. */
export function groundAt(w: PhysicsWorld, x: number, z: number, feetY: number) {
  let g = w.terrain(x, z)
  for (const s of w.surfaces) {
    if ((s.enabled && !s.enabled()) || !contains(s, x, z, 0.08)) continue
    const h = surfaceHeight(s, x, z)
    if (h <= feetY + STEP_UP && h > g) g = h
  }
  for (const s of w.solids) {
    if (!s.walkable || !contains(s, x, z, 0.05)) continue
    if (s.top <= feetY + STEP_UP && s.top > g) g = s.top
  }
  return g
}

/** Closest small platform (stepping stone, lily pad, walkable rock) to a point, with its top height. */
export function nearestPlatform(w: PhysicsWorld, x: number, z: number, maxDist: number) {
  let best: { x: number; z: number; top: number } | null = null
  let bd = maxDist
  for (const s of w.surfaces) {
    if (s.kind !== 'circle' || (s.enabled && !s.enabled())) continue
    const d = Math.hypot(x - s.x, z - s.z) - (s.r ?? 0) * 0.4
    if (d < bd) {
      bd = d
      best = { x: s.x, z: s.z, top: s.height(0, 0) }
    }
  }
  for (const s of w.solids) {
    if (!s.walkable || s.kind !== 'circle' || (s.r ?? 0) > 2.2) continue
    const d = Math.hypot(x - s.x, z - s.z) - (s.r ?? 0) * 0.4
    if (d < bd) {
      bd = d
      best = { x: s.x, z: s.z, top: s.top }
    }
  }
  return best
}

/** Over water with nothing to stand on. */
export function overWater(w: PhysicsWorld, x: number, z: number) {
  return w.water(x, z) && !onPlatform(w, x, z)
}

/** Push a point out of every blocking solid; returns the corrected position. */
export function resolveSolids(w: PhysicsWorld, x: number, z: number, feetY: number, radius = PLAYER_RADIUS) {
  for (let iter = 0; iter < 3; iter++) {
    let moved = false
    for (const s of w.solids) {
      if (s.walkable && feetY >= s.top - STEP_UP) continue
      if (s.kind === 'circle') {
        const dx = x - s.x, dz = z - s.z
        const d = Math.hypot(dx, dz)
        const min = (s.r ?? 0) + radius
        if (d < min) {
          const nx = d > 1e-5 ? dx / d : 1, nz = d > 1e-5 ? dz / d : 0
          x = s.x + nx * min
          z = s.z + nz * min
          moved = true
        }
      } else {
        const yaw = s.yaw ?? 0
        const { lx, lz } = toLocal(s, x, z)
        const hw = s.hw ?? 0, hd = s.hd ?? 0
        const cx = Math.max(-hw, Math.min(hw, lx)), cz = Math.max(-hd, Math.min(hd, lz))
        let ox = lx - cx, oz = lz - cz
        let d = Math.hypot(ox, oz)
        let nlx = lx, nlz = lz
        if (d < 1e-5) {
          // centre inside the box: leave by the shallowest side
          const px = hw - Math.abs(lx), pz = hd - Math.abs(lz)
          if (px < pz) nlx = Math.sign(lx || 1) * (hw + radius)
          else nlz = Math.sign(lz || 1) * (hd + radius)
        } else if (d < radius) {
          ox /= d; oz /= d
          nlx = cx + ox * radius
          nlz = cz + oz * radius
        } else continue
        const c = Math.cos(yaw), n = Math.sin(yaw)
        x = s.x + nlx * c + nlz * n
        z = s.z - nlx * n + nlz * c
        moved = true
      }
    }
    if (!moved) break
  }
  // soft world boundary
  const dx = x - w.center.x, dz = z - w.center.z
  const d = Math.hypot(dx, dz)
  if (d > w.radius) {
    x = w.center.x + (dx / d) * w.radius
    z = w.center.z + (dz / d) * w.radius
  }
  return { x, z }
}

/** Does the segment from a to b pass through a blocking box (used by the camera)? Returns the hit fraction or 1. */
export function cameraBlock(w: PhysicsWorld, ax: number, ay: number, az: number, bx: number, by: number, bz: number) {
  const steps = 14
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    const x = ax + (bx - ax) * t, y = ay + (by - ay) * t, z = az + (bz - az) * t
    if (w.terrain(x, z) + 0.35 > y) return Math.max(0.05, (i - 1) / steps)
    const above = y - w.terrain(x, z)
    for (const s of w.solids) {
      if (s.kind === 'box') {
        if (s.top < y || (s.hw ?? 0) < 1) continue
        if (contains(s, x, z, 0.2)) return Math.max(0.05, (i - 1) / steps)
      } else if (!s.walkable && above < 3 && contains(s, x, z, 0.3)) return Math.max(0.05, (i - 1) / steps)
    }
  }
  return 1
}
