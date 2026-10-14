/** Meadow sparkles: fireflies over the pond, the Heart Garden and the flower field. */
import { Sparkles } from '@react-three/drei'
import { MEADOW } from './meadow/layout'
import { terrainHeight } from './meadow/terrain'

export function Fireflies() {
  const c = MEADOW.circle
  const p = MEADOW.pond
  return (
    <>
      <Sparkles count={26} scale={[16, 3, 16]} position={[p.x, 1.6, p.z]} size={3.5} speed={0.25} color="#fff2b0" opacity={0.8} />
      <Sparkles count={30} scale={[17, 3.5, 17]} position={[c.x, terrainHeight(c.x, c.z) + 1.8, c.z]} size={4} speed={0.3} color="#ffc7e0" opacity={0.85} />
      <Sparkles count={24} scale={[20, 3, 20]} position={[MEADOW.fieldCenter.x, 2.4, MEADOW.fieldCenter.z]} size={3} speed={0.25} color="#ffffff" opacity={0.7} />
    </>
  )
}
