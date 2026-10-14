/**
 * Mutable per-frame game state. Lives outside React so the render loop never
 * triggers React re-renders. Systems read and write it directly.
 */
import * as THREE from 'three'
import type { PhysicsWorld } from '../systems/physics'

export type CatMood = 'none' | 'happy' | 'celebrate' | 'hug'

export const runtime = {
  time: 0,
  world: null as PhysicsWorld | null,
  player: {
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    yaw: 0,
    grounded: true,
    /** 0 idle, 1 walking, ~1.7 running. */
    gait: 0,
    idleTime: 0,
    lastSafe: new THREE.Vector3(),
    mood: 'none' as CatMood,
    moodTime: 0,
    /** World point Caca's head turns toward (nearest interactable). */
    look: null as THREE.Vector3 | null,
    /** Set by cutscenes to place Caca. */
    frozen: false,
    sleepingIntro: false,
    landedAt: 0,
  },
  camera: {
    yaw: 0,
    pitch: 0.36,
    dist: 6.6,
    targetYaw: 0,
    targetPitch: 0.36,
    targetDist: 6.6,
    lastLook: 0,
  },
  cutscene: {
    active: false,
    pos: new THREE.Vector3(),
    look: new THREE.Vector3(),
    /** Seconds the camera takes to settle; 0 = snap. */
    ease: 1.2,
  },
  /** Current objective world position (for beacon, compass, paw trail, minimap). */
  objective: null as THREE.Vector3 | null,
  /** Title-screen flyover. */
  attract: true,
}

export function setPlayerPos(x: number, y: number, z: number, yaw?: number) {
  runtime.player.pos.set(x, y, z)
  runtime.player.vel.set(0, 0, 0)
  runtime.player.lastSafe.set(x, y, z)
  if (yaw !== undefined) runtime.player.yaw = yaw
}
