/** Dialogue box, Tatan's notes, keepsake cards and the chapter-end card. */
import { useEffect, useRef, useState } from 'react'
import { game, useGame, type Presentation } from '../state/store'
import { NAMES, NOTES } from '../data/story'
import { KEEPSAKES } from '../data/items'
import { keepsakeMemory } from '../systems/quests'
import { openMenu, setAdvanceHandler } from '../systems/input'
import { audio } from '../systems/audio'
import { HeartIcon, MapIcon, StarIcon } from './icons'

function Dialogue({ p }: { p: Extract<Presentation, { kind: 'dialogue' }> }) {
  const [line, setLine] = useState(0)
  const [shown, setShown] = useState(0)
  const cur = p.lines[line]
  const full = cur?.text ?? ''
  const typing = shown < full.length

  useEffect(() => {
    if (!typing) return
    const id = setTimeout(() => {
      setShown((n) => Math.min(full.length, n + 2))
      if (shown % 4 === 0) audio.sfx('blip')
    }, 28)
    return () => clearTimeout(id)
  }, [shown, typing, full.length])

  const advance = useRef(() => {})
  advance.current = () => {
    if (typing) return setShown(full.length)
    audio.sfx('click')
    if (line + 1 < p.lines.length) {
      setLine(line + 1)
      setShown(0)
    } else game.dismiss()
  }
  useEffect(() => {
    setAdvanceHandler(() => advance.current())
    return () => setAdvanceHandler(null)
  }, [])

  if (!cur) return null
  return (
    <div className="dialogue panel" onClick={() => advance.current()}>
      <div className={`speaker ${cur.speaker === NAMES.caca ? 'caca' : ''}`}>{cur.speaker}</div>
      <div className="text">{full.slice(0, shown)}</div>
      <div className="more">
        {typing ? '' : line + 1 < p.lines.length ? 'Next' : 'Close'}
        <span className="key">E</span>
      </div>
    </div>
  )
}

function Note({ p }: { p: Extract<Presentation, { kind: 'note' }> }) {
  const note = NOTES[p.noteId]
  useEffect(() => {
    audio.sfx('note')
    setAdvanceHandler(() => game.dismiss())
    return () => setAdvanceHandler(null)
  }, [])
  if (!note) return null
  return (
    <div className="scrim">
      <div className="note">
        <h2>{note.title}</h2>
        <div className="body">{note.body}</div>
        <div className="sig">— {note.signature} ♥</div>
        <div className="actions">
          <button className="btn small" onClick={() => game.dismiss()}>
            Keep it close <span className="key">E</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function Keepsake({ id }: { id: string }) {
  const k = KEEPSAKES[id]
  const have = useGame((s) => s.keepsakes.length)
  useEffect(() => {
    audio.sfx('fragment')
    setAdvanceHandler(() => game.dismiss())
    return () => setAdvanceHandler(null)
  }, [])
  if (!k) return null
  return (
    <div className="scrim">
      <div className="keepsake panel">
        <div className="badge">
          <HeartIcon size={38} />
        </div>
        <div className="muted">Memory keepsake · {have} of 3 in the meadow</div>
        <h2>{k.name}</h2>
        <p className="desc">{k.description}</p>
        <div className="memory">{keepsakeMemory(id)}</div>
        <button className="btn small" onClick={() => game.dismiss()}>
          Treasure it <span className="key">E</span>
        </button>
      </div>
    </div>
  )
}

function ChapterEnd() {
  const keepsakes = useGame((s) => s.keepsakes.length)
  const fragments = useGame((s) => s.fragments)
  useEffect(() => {
    audio.sfx('quest')
    setAdvanceHandler(() => game.dismiss())
    return () => setAdvanceHandler(null)
  }, [])
  return (
    <div className="scrim">
      <div className="chapter panel">
        <StarIcon size={44} />
        <div className="muted">Chapter 1</div>
        <h2>Pink Blossom Meadow</h2>
        <p>The meadow is shining again, and the map has found the way to Cuddleberry Village.</p>
        <div className="stats">
          <div className="stat">
            <b>{fragments} / 3</b>
            <span>starlight fragments</span>
          </div>
          <div className="stat">
            <b>{keepsakes} / 3</b>
            <span>keepsakes found</span>
          </div>
        </div>
        <div className="row">
          <button
            className="btn"
            onClick={() => {
              game.dismiss()
              openMenu('map')
            }}
          >
            <MapIcon /> See the map
          </button>
          <button className="btn soft" onClick={() => game.dismiss()}>
            Keep exploring
          </button>
        </div>
        <p className="muted" style={{ marginTop: 16, marginBottom: 0 }}>
          Chapter 2 is still being built. Everything in the meadow is yours to wander in the meantime.
        </p>
      </div>
    </div>
  )
}

export function Presentations() {
  const cur = useGame((s) => s.queue[0])
  if (!cur) return null
  // key forces a fresh component for every new presentation
  const key = String(cur.uid)
  switch (cur.kind) {
    case 'dialogue':
      return <Dialogue key={key} p={cur} />
    case 'note':
      return <Note key={key} p={cur} />
    case 'keepsake':
      return <Keepsake key={key} id={cur.id} />
    case 'chapterEnd':
      return <ChapterEnd key={key} />
  }
}
