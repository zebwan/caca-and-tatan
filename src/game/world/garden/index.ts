import type { RegionRuntime } from '../regionTypes'
import { Garden } from './GardenScene'
import { gardenHeight, gardenMapImage, gardenPhysics } from './world'
import { GARDEN as G } from './layout'
import { SkyIslands } from '../Distant'
import { createElement } from 'react'

function GardenDistant() {
  return createElement('group', null, createElement(SkyIslands, { x: -120, y: 10, z: -160 }), createElement(SkyIslands, { x: 140, y: -4, z: -60 }))
}

export const gardenRegion: RegionRuntime = {
  id: 'garden',
  name: 'The Starlight Garden',
  Scene: Garden,
  Distant: GardenDistant,
  physics: gardenPhysics,
  heightAt: gardenHeight,
  entries: { stairs: G.entries.stairs },
  defaultEntry: 'stairs',
  exits: [{ id: 'stairs', ...G.stairsTop, to: 'bay', entry: 'stairs', label: 'Bubblegum Bay', style: 'custom' }],
  mapImage: gardenMapImage,
  landmarks: [],
  atmosphere: {
    sky: ['#2f2b6b', '#8a64ad', '#ffb8cc'],
    fog: '#c9a8d6',
    fogNear: 70,
    fogFar: 340,
    sunColor: '#ffd0b8',
    sunIntensity: 1.5,
    sunDir: [-0.6, 0.35, -0.6],
    hemiSky: '#ffe0ee',
    hemiGround: '#7a6aa8',
    hemiIntensity: 1.3,
    ambient: '#ffd6ea',
    ambientIntensity: 0.45,
    stars: 0.9,
    moon: true,
    clouds: false,
  },
  music: 'garden',
  ambience: 'garden',
}
