/** Tree catalogue shared by every region: trunk, canopy and optional accent geometry + colours. */
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export type TreeKind = 'cherry' | 'green' | 'lavender' | 'fruit' | 'moon' | 'mushroom' | 'palm' | 'star'

export function sphereAt(x: number, y: number, z: number, r: number, sy = 1, seg = 12) {
  const g = new THREE.SphereGeometry(r, seg, Math.max(6, Math.floor(seg * 0.7)))
  g.scale(1, sy, 1)
  g.translate(x, y, z)
  return g
}
export function cyl(rt: number, rb: number, h: number, x: number, y: number, z: number, rx = 0, rz = 0, seg = 8) {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg, 1)
  g.translate(0, h / 2, 0)
  g.rotateX(rx)
  g.rotateZ(rz)
  g.translate(x, y, z)
  return g
}

export interface TreeStyle {
  trunk: () => THREE.BufferGeometry
  trunkColor: string
  canopy: () => THREE.BufferGeometry
  colors: string[]
  canopyEmissive?: number
  sway?: number
  accent?: () => THREE.BufferGeometry
  accentColors?: string[]
  accentEmissive?: number
}

function palmTrunk() {
  const parts: THREE.BufferGeometry[] = []
  let x = 0, y = 0
  for (let i = 0; i < 6; i++) {
    const g = cyl(0.17 - i * 0.012, 0.21 - i * 0.012, 0.75, x, y, 0, 0, -0.07 * i)
    parts.push(g)
    x += Math.sin(0.07 * i) * 0.75 * 0.9
    y += 0.72
  }
  return mergeGeometries(parts)!
}
function palmLeaves() {
  const parts: THREE.BufferGeometry[] = []
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2
    const g = new THREE.SphereGeometry(1, 10, 6)
    g.scale(1.6, 0.12, 0.42)
    g.rotateZ(-0.35)
    g.translate(1.3, 0, 0)
    g.rotateY(a)
    g.translate(0.55, 4.3, 0)
    parts.push(g)
  }
  parts.push(sphereAt(0.55, 4.35, 0, 0.45, 0.7))
  return mergeGeometries(parts)!
}

export const TREES: Record<TreeKind, TreeStyle> = {
  cherry: {
    trunk: () => mergeGeometries([cyl(0.2, 0.32, 2.9, 0, 0, 0, 0, 0.08), cyl(0.09, 0.14, 1.3, 0.1, 2.2, 0, 0, -0.85), cyl(0.08, 0.13, 1.2, -0.05, 2.0, 0.1, 0.6, 0.7)])!,
    trunkColor: '#b58a72',
    canopy: () =>
      mergeGeometries([
        sphereAt(0, 3.5, 0, 1.65, 0.85),
        sphereAt(1.3, 3.15, 0.35, 1.15, 0.85),
        sphereAt(-1.25, 3.2, -0.25, 1.2, 0.85),
        sphereAt(0.3, 3.3, 1.2, 1.05, 0.85),
        sphereAt(-0.4, 3.3, -1.2, 1.05, 0.85),
        sphereAt(0.35, 4.35, -0.1, 1.05, 0.85),
      ])!,
    colors: ['#f8c0d4', '#f6b3ca', '#fbd0de', '#f4a9c3'],
  },
  green: {
    trunk: () => mergeGeometries([cyl(0.22, 0.34, 2.6, 0, 0, 0), cyl(0.09, 0.13, 1.1, 0, 1.9, 0, 0, 0.9)])!,
    trunkColor: '#b58a72',
    canopy: () => mergeGeometries([sphereAt(0, 3.35, 0, 1.8, 0.92), sphereAt(1.05, 2.85, 0.4, 1.15), sphereAt(-1.0, 2.95, -0.35, 1.2), sphereAt(0.15, 4.3, 0.1, 1.1)])!,
    colors: ['#a6d48a', '#9bcd85', '#b3dc92'],
  },
  lavender: {
    trunk: () => cyl(0.16, 0.27, 3.4, 0, 0, 0),
    trunkColor: '#a58fa5',
    canopy: () => mergeGeometries([sphereAt(0, 2.7, 0, 1.45, 0.8), sphereAt(0, 3.75, 0, 1.15, 0.85), sphereAt(0, 4.65, 0, 0.75, 0.95)])!,
    colors: ['#cdbdf2', '#c2b0ec', '#d8cbf6'],
  },
  fruit: {
    trunk: () => mergeGeometries([cyl(0.2, 0.3, 2.2, 0, 0, 0), cyl(0.08, 0.12, 1.0, 0, 1.6, 0, 0.5, 0.6)])!,
    trunkColor: '#b58a72',
    canopy: () => mergeGeometries([sphereAt(0, 3.0, 0, 1.65, 0.9), sphereAt(0.9, 2.6, 0.5, 1.0), sphereAt(-0.85, 2.7, -0.4, 1.05)])!,
    colors: ['#a9d78e', '#9ccf83', '#b6de97'],
    accent: () => {
      const parts: THREE.BufferGeometry[] = []
      const pts = [[1.2, 3.2, 0.9], [-1.1, 3.4, 0.7], [0.4, 3.0, 1.55], [-0.6, 2.4, 1.2], [1.5, 2.5, -0.4], [-1.4, 2.6, -0.8], [0.2, 4.4, 0.6], [0.9, 3.9, -1.0]]
      for (const [x, y, z] of pts) parts.push(sphereAt(x, y, z, 0.16, 1, 8))
      return mergeGeometries(parts)!
    },
    accentColors: ['#f27aa6', '#ff9f8a', '#f7a8c6'],
    accentEmissive: 0.15,
  },
  moon: {
    trunk: () => mergeGeometries([cyl(0.2, 0.36, 3.6, 0, 0, 0, 0, 0.05), cyl(0.07, 0.11, 1.4, 0, 2.4, 0, 0.3, -0.9)])!,
    trunkColor: '#6f5f86',
    canopy: () => mergeGeometries([sphereAt(0, 3.6, 0, 1.75, 0.8), sphereAt(0, 4.7, 0, 1.3, 0.8), sphereAt(0, 5.6, 0, 0.8, 0.9), sphereAt(1.1, 3.4, 0.4, 1.0, 0.8)])!,
    colors: ['#8e7cc9', '#7f6fbd', '#9c8ad6', '#7a72c4'],
    canopyEmissive: 0.08,
    accent: () => {
      const parts: THREE.BufferGeometry[] = []
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        parts.push(sphereAt(Math.cos(a) * 1.55, 2.6 + (i % 2) * 0.5, Math.sin(a) * 1.55, 0.11, 1, 8))
      }
      return mergeGeometries(parts)!
    },
    accentColors: ['#bfe9ff', '#ffd6f0', '#fff3b8'],
    accentEmissive: 1.4,
    sway: 0.03,
  },
  mushroom: {
    trunk: () => cyl(0.32, 0.45, 2.6, 0, 0, 0, 0, 0, 12),
    trunkColor: '#f4ead8',
    canopy: () => {
      const g = new THREE.SphereGeometry(1.8, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2)
      g.scale(1, 0.62, 1)
      g.translate(0, 2.45, 0)
      return g
    },
    colors: ['#f59bc4', '#9fd8e8', '#c5a9f2', '#ffb68a'],
    canopyEmissive: 0.35,
    accent: () => {
      const parts: THREE.BufferGeometry[] = []
      const pts = [[0.6, 3.38, 0.4], [-0.7, 3.3, 0.5], [0.1, 3.5, -0.6], [1.2, 2.95, -0.5], [-1.1, 3.0, -0.7], [-0.2, 3.1, 1.25]]
      for (const [x, y, z] of pts) parts.push(sphereAt(x, y, z, 0.18, 0.4, 8))
      return mergeGeometries(parts)!
    },
    accentColors: ['#ffffff'],
    accentEmissive: 0.6,
    sway: 0,
  },
  palm: {
    trunk: palmTrunk,
    trunkColor: '#d8b48e',
    canopy: palmLeaves,
    colors: ['#9fd88f', '#8fcf86', '#b0e09a'],
    sway: 0.09,
    accent: () => mergeGeometries([sphereAt(0.75, 4.05, 0.2, 0.17, 1, 8), sphereAt(0.4, 4.0, -0.25, 0.17, 1, 8), sphereAt(0.5, 3.95, 0.35, 0.16, 1, 8)])!,
    accentColors: ['#c99a72'],
  },
  star: {
    trunk: () => mergeGeometries([cyl(0.17, 0.28, 2.8, 0, 0, 0, 0, 0.06), cyl(0.07, 0.11, 1.2, 0.1, 2.0, 0, 0, -0.8)])!,
    trunkColor: '#c9a3b4',
    canopy: () => mergeGeometries([sphereAt(0, 3.4, 0, 1.5, 0.85), sphereAt(1.1, 3.1, 0.3, 1.0, 0.85), sphereAt(-1.05, 3.15, -0.2, 1.05, 0.85), sphereAt(0.2, 4.2, 0, 0.95, 0.85)])!,
    colors: ['#fff0f6', '#ffe1ee', '#f8e6ff'],
    canopyEmissive: 0.3,
    accent: () => {
      const parts: THREE.BufferGeometry[] = []
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2
        parts.push(sphereAt(Math.cos(a) * 1.4, 2.7 + (i % 3) * 0.35, Math.sin(a) * 1.4, 0.1, 1, 8))
      }
      return mergeGeometries(parts)!
    },
    accentColors: ['#ffe58a', '#ffc2dc'],
    accentEmissive: 1.5,
  },
}
