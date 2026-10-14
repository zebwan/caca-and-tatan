/** Beyond the forest: more moonlit trees, distant hills, and the sky islands. */
import { useMemo } from 'react'
import { DistantTrees, Hill, SkyIslands } from '../Distant'

export function ForestDistant() {
  const cols = useMemo(() => ['#7f6fbd', '#9c8ad6', '#6f62ad', '#8e7cc9'], [])
  return (
    <group>
      <Hill p={[0, -10, -150]} s={[110, 34, 40]} c="#6f6aa6" />
      <Hill p={[-150, -10, 0]} s={[40, 34, 120]} c="#6f6aa6" />
      <Hill p={[0, -10, 150]} s={[110, 30, 40]} c="#76719f" />
      <DistantTrees center={[0, 16, -125]} count={60} spread={[160, 30]} colors={cols} seed={41} scale={4.4} />
      <DistantTrees center={[-125, 16, 0]} count={60} spread={[30, 160]} colors={cols} seed={42} scale={4.4} />
      <DistantTrees center={[0, 14, 125]} count={50} spread={[160, 30]} colors={cols} seed={43} scale={4} />
      <SkyIslands x={60} y={70} z={-200} />
    </group>
  )
}
