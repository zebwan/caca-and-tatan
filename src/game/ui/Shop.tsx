/** Ribbon & Bell boutique (clothes for both cats), Cozy Corner furniture shop, and home decorating. */
import { useState } from 'react'
import { game, useGame, type Equipped } from '../state/store'
import { closeMenu } from '../systems/input'
import { audio } from '../systems/audio'
import { saveGame } from '../state/save'
import { dispatch } from '../systems/quests'
import { BOUTIQUE, FURNITURE, FURNITURE_BY_ID, HOME_SLOTS, CLOTHING_BY_ID, type ClothingItem, type HomeSlot } from '../data/shop'
import { CatPreviewCanvas } from './CatCreator'
import { PawIcon } from './icons'

export function ownsClothing(id: string) {
  const s = game.get()
  return s.accessories.includes(id) || s.owned.includes(id)
}

function buy(id: string, price: number, name: string) {
  const s = game.get()
  if (s.pawprints < price || s.owned.includes(id)) return false
  game.set({ pawprints: s.pawprints - price, owned: [...s.owned, id] })
  audio.sfx('chime')
  game.toast(`Bought ${name}!`, 'gift')
  saveGame()
  return true
}

export function wear(who: 'caca' | 'tatan', item: ClothingItem | null, slot: ClothingItem['slot']) {
  const s = game.get()
  const key = who === 'caca' ? 'equipped' : 'equippedTatan'
  const cur: Equipped = { ...s[key] }
  if (slot === 'bow') cur.bow = item ? item.id : who === 'caca' ? 'pinkBow' : 'none'
  else cur[slot] = item ? item.id : null
  game.set({ [key]: cur } as Partial<ReturnType<typeof game.get>>)
  saveGame()
}

function SlotIcon({ slot }: { slot: string }) {
  const glyph: Record<string, string> = {
    bow: 'M4 12 C4 6 10 8 12 12 C14 8 20 6 20 12 C20 18 14 16 12 12 C10 16 4 18 4 12Z',
    head: 'M4 15 Q12 3 20 15 Z M3 15 H21',
    face: 'M3 12 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M13 12 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M11 12 H13',
    neck: 'M4 9 Q12 17 20 9 M12 13 V19',
    back: 'M6 7 H18 V19 H6 Z M9 7 V4 H15 V7',
  }
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
      <path d={glyph[slot] ?? glyph.head} />
    </svg>
  )
}

export function Shop({ kind }: { kind: 'clothes' | 'furniture' }) {
  const paws = useGame((s) => s.pawprints)
  const owned = useGame((s) => s.owned)
  const joined = useGame((s) => !!s.flags.tatanJoined)
  const [who, setWho] = useState<'caca' | 'tatan'>('caca')
  const look = useGame((s) => s.looks[who])
  const outfit = useGame((s) => (who === 'caca' ? s.equipped : s.equippedTatan))
  const [tryOn, setTryOn] = useState<ClothingItem | null>(null)
  const preview: Equipped = { ...outfit }
  if (tryOn) {
    if (tryOn.slot === 'bow') preview.bow = tryOn.id
    else preview[tryOn.slot] = tryOn.id
  }

  if (kind === 'furniture') {
    return (
      <div className="scrim" onClick={(e) => e.target === e.currentTarget && closeMenu()}>
        <div className="shop panel">
          <header className="shop-head">
            <div>
              <h2>Cozy Corner</h2>
              <p className="muted">Everything you buy is delivered to Lilac Cottage. Decorate it from inside.</p>
            </div>
            <div className="row">
              <span className="counter flat">
                <PawIcon /> {paws}
              </span>
              <button className="btn small soft" onClick={closeMenu}>
                Close
              </button>
            </div>
          </header>
          <div className="shop-grid">
            {FURNITURE.filter((f) => f.price > 0).map((f) => {
              const have = owned.includes(f.id)
              return (
                <div key={f.id} className={`shop-item ${have ? 'owned' : ''}`}>
                  <div className="shop-name">{f.name}</div>
                  <div className="muted small">{HOME_SLOTS.find((h) => h.id === f.slot)?.name}</div>
                  {have ? (
                    <span className="pill">At home</span>
                  ) : (
                    <button className="btn small" disabled={paws < f.price} onClick={() => buy(f.id, f.price, f.name)}>
                      <PawIcon size={16} color="#fff" /> {f.price}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="scrim" onClick={(e) => e.target === e.currentTarget && closeMenu()}>
      <div className="shop panel boutique">
        <div className="shop-preview">
          <CatPreviewCanvas who={who} look={look} outfit={preview} />
          {joined && (
            <div className="chips center">
              <button className={`chip ${who === 'caca' ? 'on' : ''}`} onClick={() => setWho('caca')}>
                Caca
              </button>
              <button className={`chip ${who === 'tatan' ? 'on' : ''}`} onClick={() => setWho('tatan')}>
                Tatan
              </button>
            </div>
          )}
        </div>
        <div className="shop-main">
          <header className="shop-head">
            <div>
              <h2>Ribbon &amp; Bell</h2>
              <p className="muted">Tap an item to try it on{joined ? ' — everything fits both of you' : ''}.</p>
            </div>
            <div className="row">
              <span className="counter flat">
                <PawIcon /> {paws}
              </span>
              <button className="btn small soft" onClick={closeMenu}>
                Close
              </button>
            </div>
          </header>
          <div className="shop-grid">
            {BOUTIQUE.map((c) => {
              const have = owned.includes(c.id)
              const wearing = (c.slot === 'bow' ? outfit.bow : outfit[c.slot]) === c.id
              return (
                <div key={c.id} className={`shop-item ${tryOn?.id === c.id ? 'sel' : ''} ${have ? 'owned' : ''}`} onClick={() => setTryOn(c)}>
                  <SlotIcon slot={c.slot} />
                  <div className="shop-name">{c.name}</div>
                  {have ? (
                    <button
                      className={`btn small ${wearing ? '' : 'soft'}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        wear(who, wearing ? null : c, c.slot)
                        setTryOn(null)
                      }}
                    >
                      {wearing ? 'Wearing' : 'Wear'}
                    </button>
                  ) : (
                    <button
                      className="btn small"
                      disabled={paws < c.price}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (buy(c.id, c.price, c.name)) {
                          wear(who, c, c.slot)
                          setTryOn(null)
                        }
                      }}
                    >
                      <PawIcon size={16} color="#fff" /> {c.price}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export function Decorate({ slot }: { slot: string }) {
  const home = useGame((s) => s.home)
  const owned = useGame((s) => s.owned)
  const s = slot as HomeSlot
  const items = FURNITURE.filter((f) => f.slot === s && (f.price === 0 || owned.includes(f.id)))
  const shopItems = FURNITURE.filter((f) => f.slot === s && f.price > 0 && !owned.includes(f.id))
  const name = HOME_SLOTS.find((h) => h.id === s)?.name ?? 'Spot'
  const required = s === 'floor' || s === 'wall' || s === 'bed' || s === 'window'
  const set = (id: string | null) => {
    const next = { ...game.get().home }
    if (id) next[s] = id
    else delete next[s]
    game.set({ home: next })
    audio.sfx('sparkle')
    dispatch('decorate:any')
    saveGame()
  }
  return (
    <div className="scrim" onClick={(e) => e.target === e.currentTarget && closeMenu()}>
      <div className="decorate panel">
        <h2>{name}</h2>
        <div className="list">
          {!required && (
            <div className={`item clickable ${!home[s] ? 'on' : ''}`} onClick={() => set(null)}>
              <div className="grow">
                <div className="name">Leave it empty</div>
              </div>
              {!home[s] && <span className="pill">Chosen</span>}
            </div>
          )}
          {items.map((f) => (
            <div key={f.id} className={`item clickable ${home[s] === f.id ? 'on' : ''}`} onClick={() => set(f.id)}>
              <div className="grow">
                <div className="name">{f.name}</div>
              </div>
              {home[s] === f.id && <span className="pill">Chosen</span>}
            </div>
          ))}
          {shopItems.length > 0 && (
            <p className="muted">
              More at Cozy Corner in the village: {shopItems.map((f) => FURNITURE_BY_ID[f.id].name).join(', ')}.
            </p>
          )}
        </div>
        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn small" onClick={closeMenu}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export { CLOTHING_BY_ID }
