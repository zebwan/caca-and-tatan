/** Virtual joystick, jump/interact/run buttons and drag-to-look for touch screens. */
import { useRef, useState } from 'react'
import { input } from '../systems/input'
import { runtime } from '../state/runtime'

function capture(e: React.PointerEvent) {
  try {
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  } catch {
    /* pointer already released */
  }
}

export function TouchControls() {
  const knob = useRef<HTMLDivElement>(null)
  const stick = useRef<{ id: number; cx: number; cy: number } | null>(null)
  const look = useRef<{ id: number; x: number; y: number } | null>(null)
  const [run, setRun] = useState(input.touchRun)

  const moveStick = (x: number, y: number) => {
    const s = stick.current
    if (!s) return
    let dx = x - s.cx, dy = y - s.cy
    const max = 52
    const d = Math.hypot(dx, dy)
    if (d > max) {
      dx = (dx / d) * max
      dy = (dy / d) * max
    }
    input.joy.x = dx / max
    input.joy.y = -dy / max
    if (knob.current) knob.current.style.transform = `translate(${dx}px, ${dy}px)`
  }
  const endStick = () => {
    stick.current = null
    input.joy.x = input.joy.y = 0
    if (knob.current) knob.current.style.transform = ''
  }

  return (
    <>
      <div
        className="look-zone"
        onPointerDown={(e) => {
          look.current = { id: e.pointerId, x: e.clientX, y: e.clientY }
          capture(e)
        }}
        onPointerMove={(e) => {
          const l = look.current
          if (!l || l.id !== e.pointerId) return
          input.lookDX += (e.clientX - l.x) * 1.6
          input.lookDY += (e.clientY - l.y) * 1.6
          l.x = e.clientX
          l.y = e.clientY
          runtime.camera.lastLook = runtime.time
        }}
        onPointerUp={() => (look.current = null)}
        onPointerCancel={() => (look.current = null)}
      />
      <div
        className="joystick"
        onPointerDown={(e) => {
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
          stick.current = { id: e.pointerId, cx: r.left + r.width / 2, cy: r.top + r.height / 2 }
          capture(e)
          moveStick(e.clientX, e.clientY)
        }}
        onPointerMove={(e) => stick.current?.id === e.pointerId && moveStick(e.clientX, e.clientY)}
        onPointerUp={endStick}
        onPointerCancel={endStick}
      >
        <div className="knob" ref={knob} />
      </div>
      <div className="touch-buttons">
        <button
          className={`tbtn ${run ? 'on' : ''}`}
          onPointerDown={() => {
            input.touchRun = !input.touchRun
            setRun(input.touchRun)
          }}
        >
          Run
        </button>
        <button className="tbtn" onPointerDown={() => (input.interact = true)}>
          Use
        </button>
        <button className="tbtn big" onPointerDown={() => (input.jumpAt = runtime.time)}>
          Jump
        </button>
      </div>
    </>
  )
}
