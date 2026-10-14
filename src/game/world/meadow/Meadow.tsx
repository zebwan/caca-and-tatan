import { MEADOW } from './layout'
import { terrainHeight } from './terrain'
import { Terrain } from './TerrainMesh'
import { Water } from './Water'
import { Vegetation } from '../common/Vegetation'
import { meadowScatter } from './scatter'
import { Fireflies } from '../Atmosphere'
import { MeadowProps } from './Props'
import { MeadowQuestObjects, Teddy } from './QuestObjects'
import { Npc } from '../../characters/Npc'
import { useGame } from '../../state/store'
import { Coins } from '../common/Coins'
import { meadowPhysics } from './physics'

const H = (p: { x: number; z: number }) => terrainHeight(p.x, p.z)

function MeadowNpcs() {
  const teddyHome = useGame((s) => s.quests.q_teddy?.state === 'completed')
  const { mimi, biscuit, pip } = MEADOW.npcs
  return (
    <>
      <Npc id="mimi" variant="mimi" x={mimi.x} z={mimi.z} y={H(mimi)} yaw={Math.PI / 2} offers="q_teddy">
        {teddyHome && (
          <group position={[mimi.x + 0.55, H(mimi), mimi.z + 0.25]} rotation={[0, 1.2, 0]}>
            <Teddy scale={0.9} />
          </group>
        )}
      </Npc>
      <Npc id="biscuit" variant="biscuit" x={biscuit.x} z={biscuit.z} y={H(biscuit)} yaw={-2.2} offers="q_butterflies" />
      <Npc id="pip" variant="pip" x={pip.x} z={pip.z} y={H(pip)} yaw={-2.4} offers="q_heartbeat" />
    </>
  )
}

/** Pink Blossom Meadow — region 1. */
export function Meadow() {
  return (
    <group>
      <Terrain />
      <Water />
      <Vegetation scatter={meadowScatter()} />
      <Fireflies />
      <MeadowProps />
      <MeadowQuestObjects />
      <MeadowNpcs />
      <Coins region="meadow" world={meadowPhysics()} count={13} seed={31} extra={[{ x: -42.1, z: -29.8 + 1.0, y: terrainHeight(-42.1, -28.8) + 2.95 }]} />
    </group>
  )
}
