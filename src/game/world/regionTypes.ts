import type { ComponentType } from 'react'
import type { RegionId } from '../data/types'
import type { PhysicsWorld } from '../systems/physics'
import type { ThemeId, AmbienceId } from '../systems/audio'

export interface Atmosphere {
  sky: [string, string, string] // top, middle, horizon
  fog: string
  fogNear: number
  fogFar: number
  sunColor: string
  sunIntensity: number
  sunDir: [number, number, number]
  hemiSky: string
  hemiGround: string
  hemiIntensity: number
  ambient: string
  ambientIntensity: number
  /** 0–1 star visibility in the sky dome. */
  stars?: number
  moon?: boolean
  clouds?: boolean
  petals?: boolean
}

export interface Entry {
  x: number
  z: number
  yaw: number
}

export interface ExitDef {
  id: string
  x: number
  z: number
  to: RegionId
  entry: string
  /** Prompt / map label, e.g. "Cuddleberry Village". */
  label: string
  /** Quest that must be completed before this exit opens. */
  requires?: string
  /** Dialogue id shown while locked. */
  locked?: string
  /** Visual + interaction: rendered by the generic ExitGate unless the region scene handles it. */
  style: 'gate' | 'path' | 'custom'
  yaw?: number
}

export interface RegionRuntime {
  id: RegionId
  name: string
  Scene: ComponentType
  Distant: ComponentType
  physics: () => PhysicsWorld
  heightAt: (x: number, z: number) => number
  entries: Record<string, Entry>
  defaultEntry: string
  exits: ExitDef[]
  mapImage: () => HTMLCanvasElement
  landmarks: { x: number; z: number; kind: 'npc' | 'home' }[]
  atmosphere: Atmosphere
  music: ThemeId
  ambience: AmbienceId
}

export const DAY: Atmosphere = {
  sky: ['#8fc2ef', '#c8e0f6', '#fbdde6'],
  fog: '#f7dfe7',
  fogNear: 70,
  fogFar: 260,
  sunColor: '#fff3e2',
  sunIntensity: 1.9,
  sunDir: [-0.45, 0.62, 0.38],
  hemiSky: '#fff1f5',
  hemiGround: '#b9d7a0',
  hemiIntensity: 1.35,
  ambient: '#fde8ef',
  ambientIntensity: 0.25,
  clouds: true,
  petals: true,
}
