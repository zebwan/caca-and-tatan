import { useMemo } from 'react'
import * as THREE from 'three'
import { MEADOW } from './layout'
import { inField, pathDist, terrainHeight, valueNoise, WATER_LEVEL, waterDist } from './terrain'

const C = (h: string) => new THREE.Color(h)
const GRASS_A = C('#b5dc8f'), GRASS_B = C('#9fd07f'), GRASS_C = C('#c6e49c'), GRASS_HILL = C('#a9d68a')
const PATH = C('#f6e3c3'), PATH_EDGE = C('#e9cfa3')
const SAND = C('#f3e2c4'), BED = C('#b9c9b8'), BED_DEEP = C('#93b4bf')
const FIELD = C('#c9dc93'), STONE_FLOOR = C('#eee3d3'), FAR = C('#b7d59a'), FAR_LAV = C('#c9c3e3')

export function Terrain() {
  const geo = useMemo(() => {
    const size = MEADOW.size, seg = 230
    const g = new THREE.PlaneGeometry(size, size, seg, seg)
    g.rotateX(-Math.PI / 2)
    const pos = g.attributes.position as THREE.BufferAttribute
    const colors = new Float32Array(pos.count * 3)
    const col = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i)
      const h = terrainHeight(x, z)
      pos.setY(i, h)
      const n = valueNoise(x * 0.18, z * 0.18)
      const n2 = valueNoise(x * 0.04 + 3, z * 0.04)
      col.copy(GRASS_A).lerp(GRASS_B, n * 0.7).lerp(GRASS_C, n2 * 0.5)
      col.lerp(GRASS_HILL, Math.min(1, Math.max(0, (h - 2.6) / 3)))
      if (inField(x, z)) col.lerp(FIELD, 0.35)
      const r = Math.hypot(x, z)
      if (r > MEADOW.playRadius) {
        const far = FAR.clone().lerp(FAR_LAV, Math.min(1, Math.max(0, (-x - 10) / 50)))
        col.lerp(far, Math.min(0.6, (r - MEADOW.playRadius) / 30))
      }

      const w = waterDist(x, z)
      if (w < 1.6) col.lerp(SAND, 1 - Math.max(0, w) / 1.6)
      if (h < WATER_LEVEL + 0.05) col.copy(SAND).lerp(BED, Math.min(1, (WATER_LEVEL - h) * 2)).lerp(BED_DEEP, Math.min(1, Math.max(0, -h - 0.2)))

      const pd = pathDist(x, z)
      if (pd < MEADOW.pathHalfWidth + 0.35) {
        const t = 1 - Math.max(0, (pd - MEADOW.pathHalfWidth + 0.45) / 0.8)
        const pc = PATH.clone().lerp(PATH_EDGE, Math.max(0, pd / MEADOW.pathHalfWidth - 0.55) + (n - 0.5) * 0.3)
        col.lerp(pc, Math.max(0, Math.min(1, t)))
      }
      const dc = Math.hypot(x - MEADOW.circle.x, z - MEADOW.circle.z)
      if (dc < MEADOW.circleRadius + 0.3) col.lerp(STONE_FLOOR, Math.min(1, (MEADOW.circleRadius + 0.3 - dc) * 1.5))
      colors[i * 3] = col.r
      colors[i * 3 + 1] = col.g
      colors[i * 3 + 2] = col.b
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    g.computeVertexNormals()
    return g
  }, [])

  return (
    <mesh geometry={geo} receiveShadow>
      <meshLambertMaterial vertexColors />
    </mesh>
  )
}
