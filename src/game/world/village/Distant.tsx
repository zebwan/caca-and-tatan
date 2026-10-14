/** What you can see beyond the village: the meadow, the moonlit forest, the sea, and the sky islands. */
import { useMemo } from 'react'
import { DistantTrees, Hill, SkyIslands } from '../Distant'

export function VillageDistant() {
  const meadow = useMemo(() => ['#f8c0d4', '#a6d48a', '#fbd0de'], [])
  const forest = useMemo(() => ['#b9a6e8', '#a993de', '#c8b8f0', '#9f8fd6'], [])
  return (
    <group>
      <Hill p={[0, -8, 140]} s={[80, 26, 40]} c="#bfe0a0" />
      <DistantTrees center={[0, 15, 130]} count={40} spread={[120, 30]} colors={meadow} seed={5} scale={2.6} />
      <Hill p={[-150, -6, 0]} s={[40, 26, 90]} c="#c9bfe6" />
      <DistantTrees center={[-140, 17, 0]} count={60} spread={[40, 140]} colors={forest} seed={21} scale={4.2} />
      <mesh position={[260, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[300, 600]} />
        <meshLambertMaterial color="#a9dff0" />
      </mesh>
      <Hill p={[0, -8, -150]} s={[90, 30, 40]} c="#b8dc9b" />
      <SkyIslands x={60} y={60} z={-180} />
    </group>
  )
}
