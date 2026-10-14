/** Small helpers for placing things relative to a rotated object (Three.js yaw convention). */
export function localToWorld(o: { x: number; z: number; yaw: number }, lx: number, lz: number) {
  const c = Math.cos(o.yaw), s = Math.sin(o.yaw)
  return { x: o.x + lx * c + lz * s, z: o.z - lx * s + lz * c }
}
/** Point in front of a building's door, `out` units away from the wall. */
export function doorPoint(h: { x: number; z: number; yaw: number; d: number }, out = 1.2) {
  return localToWorld(h, 0, h.d / 2 + out)
}
