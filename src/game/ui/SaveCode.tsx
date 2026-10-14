/** Move progress between devices with a copy-and-paste code. */
import { useState } from 'react'
import { exportSaveCode, importSaveCode } from '../systems/saveCode'
import { enableSaving, saveGame } from '../state/save'

export function SaveCodePanel({ allowExport = true }: { allowExport?: boolean }) {
  const [code, setCode] = useState('')
  const [paste, setPaste] = useState('')
  const [msg, setMsg] = useState('')
  return (
    <div className="savecode">
      {allowExport && (
        <>
          <p className="muted">Playing on another device? Copy this code, send it to yourself, and paste it there.</p>
          <div className="row" style={{ justifyContent: 'flex-start' }}>
            <button
              className="btn small"
              onClick={async () => {
                saveGame()
                const c = await exportSaveCode()
                if (!c) return setMsg('There is no saved adventure yet.')
                setCode(c)
                try {
                  await navigator.clipboard.writeText(c)
                  setMsg('Copied to your clipboard!')
                } catch {
                  setMsg('Select the code below and copy it.')
                }
              }}
            >
              Copy my save code
            </button>
          </div>
          {code && <textarea className="codebox" readOnly value={code} onFocus={(e) => e.currentTarget.select()} />}
        </>
      )}
      <p className="muted" style={{ marginTop: 12 }}>
        Have a code from another device? Paste it here.
      </p>
      <textarea className="codebox" placeholder="CT1-…" value={paste} onChange={(e) => setPaste(e.target.value)} />
      <div className="row" style={{ justifyContent: 'flex-start' }}>
        <button
          className="btn small soft"
          disabled={!paste.trim()}
          onClick={async () => {
            enableSaving(false)
            const ok = await importSaveCode(paste)
            if (!ok) {
              enableSaving(true)
              return setMsg('That code didn’t work — check it was copied completely.')
            }
            setMsg('Loaded! Restarting…')
            setTimeout(() => window.location.reload(), 700)
          }}
        >
          Load this code
        </button>
      </div>
      {msg && <p className="pill" style={{ display: 'inline-block', marginTop: 8 }}>{msg}</p>}
    </div>
  )
}
