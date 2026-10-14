import { useEffect } from 'react'
import { GameScene } from './game/GameScene'
import { game, useGame } from './game/state/store'
import { loadSettings } from './game/state/save'
import { runtime } from './game/state/runtime'
import { audio } from './game/systems/audio'
import { bus } from './game/systems/bus'
import { dispatch } from './game/systems/quests'
import { input } from './game/systems/input'
import { QUESTS, QUEST_BY_ID, TOTAL_FRAGMENTS } from './game/data/quests'
import { HUD, Toasts } from './game/ui/HUD'
import { Presentations } from './game/ui/Presentations'
import { PauseMenu } from './game/ui/PauseMenu'
import { WorldMap } from './game/ui/WorldMap'
import { IntroCards, TitleScreen } from './game/ui/TitleScreen'
import { CatCreator } from './game/ui/CatCreator'
import { Shop, Decorate } from './game/ui/Shop'
import { startIntro, travelTo } from './game/flow'
import { saveGame } from './game/state/save'

/** Turns game events into toasts and sounds. */
function useGameEffects() {
  useEffect(() => {
    let lastSplash = 0
    return bus.on((e) => {
      switch (e.type) {
        case 'questStarted': {
          const q = QUEST_BY_ID[e.id]
          if (q) game.toast(`New quest: ${q.title}`, 'paw')
          audio.sfx('chime')
          break
        }
        case 'questStep':
          game.toast('Map updated — a new objective is marked', 'map')
          audio.sfx('sparkle')
          break
        case 'questProgress':
          game.toast(`${e.n} of ${e.total} gathered`, e.id === 'q_butterflies' ? 'butterfly' : 'star')
          break
        case 'questCompleted': {
          const q = QUEST_BY_ID[e.id]
          if (q && e.id !== 'q_note') game.toast(`Quest complete: ${q.title}`, 'heart')
          audio.sfx('quest')
          break
        }
        case 'fragment':
          game.toast(`Starlight fragment ${e.total} of ${TOTAL_FRAGMENTS}`, "star")
          setTimeout(() => audio.sfx('fragment'), 350)
          break
        case 'pawprints':
          if (e.n > 0 && e.why !== 'coin') game.toast(`+${e.n} pawprints${e.why ? ` · ${e.why}` : ''}`, 'paw')
          break
        case 'splash':
          if (Date.now() - lastSplash > 5000) game.toast('Caca doesn’t like wet paws! Try the bridge or jump on the stones.', 'paw')
          lastSplash = Date.now()
          break
      }
    })
  }, [])
}

export default function App() {
  const phase = useGame((s) => s.phase)
  const menu = useGame((s) => s.menu)
  const menuArg = useGame((s) => s.menuArg)
  const fade = useGame((s) => s.fade)
  const textSize = useGame((s) => s.settings.textSize)
  useGameEffects()

  useEffect(() => {
    const settings = loadSettings()
    game.set({ settings })
    audio.apply(settings)
    // browsers only allow sound after a user gesture
    const unlock = () => {
      audio.init()
      audio.startMusic()
    }
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    // handle for scripted testing in the browser console
    ;(window as unknown as Record<string, unknown>).__game = { game, runtime, dispatch, input, QUESTS, travelTo, saveGame }
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  return (
    <div className="app" style={{ ['--ts' as string]: String(textSize) }}>
      <GameScene />
      <div className="ui">
        {phase === 'title' && <TitleScreen />}
        {phase === 'create' && <CatCreator who="caca" startMode onDone={startIntro} />}
        {phase === 'intro' && <IntroCards />}
        {phase === 'playing' && (
          <>
            <HUD />
            <Presentations />
            {menu === 'pause' && <PauseMenu />}
            {menu === 'map' && <WorldMap />}
            {menu === 'shop' && <Shop kind="clothes" />}
            {menu === 'furniture' && <Shop kind="furniture" />}
            {menu === 'decorate' && <Decorate slot={menuArg ?? 'bed'} />}
            {menu === 'style' && (
              <div className="scrim">
                <CatCreator who={menuArg === 'tatan' ? 'tatan' : 'caca'} onDone={() => game.set({ menu: 'pause' })} onCancel={() => game.set({ menu: 'pause' })} />
              </div>
            )}
          </>
        )}
        <Toasts />
        <div className={`fade ${fade ? 'on' : ''}`} />
      </div>
    </div>
  )
}
