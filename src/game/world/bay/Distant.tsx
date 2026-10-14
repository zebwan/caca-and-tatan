/** Beyond the bay: the open pink-blue sea, little islands, the village hills, and the sky islands. */
import { DistantTrees, Hill, SkyIslands } from '../Distant'

export function BayDistant() {
  return (
    <group>
      <Hill p={[-150, -8, 0]} s={[40, 28, 120]} c="#b8dc9b" />
      <DistantTrees center={[-130, 14, 0]} count={40} spread={[30, 150]} colors={['#a6d48a', '#f8c0d4', '#9fd88f']} seed={51} scale={2.8} />
      {[[140, 60], [200, -40], [170, 120]].map(([x, z], i) => (
        <group key={i}>
          <Hill p={[x, -10, z]} s={[18, 14, 18]} c="#f3e2c4" />
          <DistantTrees center={[x, 2, z]} count={6} spread={[14, 14]} colors={['#9fd88f']} seed={60 + i} scale={2.2} />
        </group>
      ))}
      <SkyIslands x={30} y={70} z={-190} />
    </group>
  )
}
