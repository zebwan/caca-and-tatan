/** The memory book: one page per chapter with quests, Tatan's letters, keepsakes and little milestones. */
import { useState } from 'react'
import { game, useGame } from '../state/store'
import { QUESTS } from '../data/quests'
import { NOTES } from '../data/story'
import { KEEPSAKES, REGIONS } from '../data/items'
import { closeMenu } from '../systems/input'
import { showNote } from '../systems/quests'
import type { RegionId } from '../data/types'
import { HeartIcon, StarIcon } from './icons'

const CHAPTERS: { region: RegionId; n: number; letters: string[]; stamp?: { flag: string; text: string } }[] = [
  { region: 'meadow', n: 1, letters: ['note_start', 'note_teddy', 'note_butterflies', 'note_heartbeat', 'note_chapter1'] },
  { region: 'village', n: 2, letters: ['note_v_arrive', 'note_v_berries', 'note_v_letters', 'note_v_kittens'], stamp: { flag: 'tatanJoined', text: 'Found Tatan at the Wishing Fountain' } },
  { region: 'forest', n: 3, letters: [] },
  { region: 'bay', n: 4, letters: [] },
  { region: 'garden', n: 5, letters: [], stamp: { flag: 'ending', text: 'Made a wish together under our tree' } },
]

const SHORT: Partial<Record<RegionId, string>> = { meadow: 'Meadow', village: 'Village', forest: 'Forest', bay: 'Bay', garden: 'Garden' }

export function MemoryBook() {
  const s = useGame()
  const [page, setPage] = useState(() => {
    const i = CHAPTERS.findIndex((c) => c.region === s.region)
    return i >= 0 ? i : 0
  })
  const ch = CHAPTERS[page]
  const def = REGIONS.find((r) => r.id === ch.region)!
  const unlocked = s.regions.includes(ch.region)
  const quests = QUESTS.filter((q) => q.region === ch.region)
  const keepsakes = Object.values(KEEPSAKES).filter((k) => k.region === ch.region)
  const letters = ch.letters.filter((id) => s.notes.includes(id) && NOTES[id])
  const done = quests.filter((q) => q.main).every((q) => s.quests[q.id]?.state === 'completed')

  return (
    <div className="book">
      <div className="book-nav">
        {CHAPTERS.map((c, i) => (
          <button key={c.region} className={`chip ${i === page ? 'on' : ''}`} onClick={() => setPage(i)}>
            {s.regions.includes(c.region) ? SHORT[c.region] : '???'}
          </button>
        ))}
      </div>
      {!unlocked ? (
        <div className="book-page locked">
          <h3>Chapter {ch.n}</h3>
          <p className="muted">This page is still blank. Keep following the stars…</p>
        </div>
      ) : (
        <div className="book-page">
          <div className="muted">Chapter {ch.n}{done ? ' · complete' : ''}</div>
          <h3>{def.name}</h3>
          {ch.stamp && s.flags[ch.stamp.flag] && (
            <div className="stamp">
              <HeartIcon size={18} /> {ch.stamp.text}
            </div>
          )}
          <h4>Adventures</h4>
          <div className="list compact">
            {quests
              .filter((q) => s.quests[q.id] && s.quests[q.id].state !== 'locked')
              .map((q) => {
                const st = s.quests[q.id].state
                return (
                  <div key={q.id} className={`item ${st === 'completed' ? '' : 'locked'}`}>
                    {st === 'completed' ? <StarIcon size={18} /> : <StarIcon size={18} color="#e2d6dc" />}
                    <div className="grow">
                      <div className="name">
                        {q.title}
                        {!q.main && <span className="muted"> · side story</span>}
                      </div>
                      <div className="sub">{st === 'completed' ? q.description : 'Still to do'}</div>
                    </div>
                  </div>
                )
              })}
          </div>
          {letters.length > 0 && (
            <>
              <h4>Tatan’s letters</h4>
              <div className="list compact">
                {letters.map((id) => (
                  <div
                    key={id}
                    className="item clickable"
                    onClick={() => {
                      closeMenu()
                      showNote(id)
                    }}
                  >
                    <HeartIcon size={18} />
                    <div className="grow">
                      <div className="name">{NOTES[id].title}</div>
                      <div className="sub">Read again</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          <h4>Keepsakes</h4>
          {keepsakes.length === 0 ? (
            <p className="muted">The stars here are memories enough.</p>
          ) : (
            <div className="keepsake-grid">
              {keepsakes.map((k) => {
                const have = s.keepsakes.includes(k.id)
                return (
                  <button
                    key={k.id}
                    className={`keepsake-tile ${have ? '' : 'locked'}`}
                    disabled={!have}
                    onClick={() => {
                      closeMenu()
                      game.present({ kind: 'keepsake', id: k.id })
                    }}
                  >
                    <HeartIcon size={22} color={have ? '#f27aa6' : '#e2d6dc'} />
                    <span>{have ? k.name : 'Not found yet'}</span>
                  </button>
                )
              })}
            </div>
          )}
          {ch.region === 'garden' && s.flags.ending && (
            <button className="btn small" style={{ marginTop: 14 }} onClick={() => {
              closeMenu()
              game.present({ kind: 'finale' })
            }}>
              Read our message again
            </button>
          )}
        </div>
      )}
      <div className="row" style={{ justifyContent: 'space-between', marginTop: 12 }}>
        <button className="btn ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>
          ‹ Previous
        </button>
        <button className="btn ghost" disabled={page === CHAPTERS.length - 1} onClick={() => setPage(page + 1)}>
          Next ›
        </button>
      </div>
    </div>
  )
}
