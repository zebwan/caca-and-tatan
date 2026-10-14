/**
 * Keyboard, mouse and touch input. Keys are routed by game state: dialogue
 * and notes get E/Space/Enter, menus get Esc/M, gameplay gets the rest.
 */
import { game } from '../state/store'
import { runtime } from '../state/runtime'
import { audio } from './audio'

export const input = {
  keys: new Set<string>(),
  joy: { x: 0, y: 0 },
  touchRun: false,
  lookDX: 0,
  lookDY: 0,
  jumpAt: -1,
  interact: false,
  pointerLocked: false,
  dragging: false,
  isTouch: typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches,
}

/** UI registers what "advance" means for whatever is on screen (dialogue, note…). */
let advanceHandler: (() => void) | null = null
export function setAdvanceHandler(fn: (() => void) | null) {
  advanceHandler = fn
}
export function advance() {
  advanceHandler?.()
}

let canvasEl: HTMLElement | null = null
let releasingLock = false

export function releasePointer() {
  if (document.pointerLockElement) {
    releasingLock = true
    document.exitPointerLock()
  }
}

export function requestPointer() {
  if (!canvasEl || input.isTouch || document.pointerLockElement) return
  try {
    const r = canvasEl.requestPointerLock() as unknown as Promise<void> | undefined
    r?.catch?.(() => {})
  } catch {
    /* pointer lock unavailable — drag-to-look still works */
  }
}

export function openMenu(menu: 'pause' | 'map') {
  releasePointer()
  input.keys.clear()
  game.set({ menu })
  audio.sfx(menu === 'map' ? 'map' : 'click')
}
export function closeMenu() {
  game.set({ menu: null })
  audio.sfx('click')
}

export function moveVector() {
  let x = 0, z = 0
  const k = input.keys
  if (k.has('KeyW') || k.has('ArrowUp')) z += 1
  if (k.has('KeyS') || k.has('ArrowDown')) z -= 1
  if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1
  if (k.has('KeyD') || k.has('ArrowRight')) x += 1
  x += input.joy.x
  z += input.joy.y
  const len = Math.hypot(x, z)
  if (len > 1) {
    x /= len
    z /= len
  }
  const run = k.has('ShiftLeft') || k.has('ShiftRight') || input.touchRun || Math.hypot(input.joy.x, input.joy.y) > 0.96
  return { x, z, run }
}

function onKeyDown(e: KeyboardEvent) {
  const s = game.get()
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault()
  if (e.repeat && (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyM' || e.code === 'Escape')) return

  if (s.phase !== 'playing') {
    if (s.phase === 'intro' && (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE')) advance()
    return
  }
  if (s.cutscene) return
  if (s.menu) {
    if (e.code === 'Escape' || (e.code === 'KeyM' && s.menu === 'map')) closeMenu()
    return
  }
  if (s.queue.length) {
    if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') advance()
    if (e.code === 'Escape') advance()
    return
  }
  if (e.code === 'Escape' || e.code === 'KeyP') return openMenu('pause')
  if (e.code === 'KeyM') return openMenu('map')
  if (e.code === 'KeyE' || e.code === 'Enter') input.interact = true
  if (e.code === 'Space') input.jumpAt = runtime.time
  input.keys.add(e.code)
}

function onKeyUp(e: KeyboardEvent) {
  input.keys.delete(e.code)
}

function onMouseMove(e: MouseEvent) {
  if (input.pointerLocked || input.dragging) {
    input.lookDX += e.movementX
    input.lookDY += e.movementY
  }
}

function onMouseDown(e: MouseEvent) {
  const s = game.get()
  if (input.pointerLocked && s.phase === 'playing' && s.queue.length) {
    advance()
    return
  }
  if (e.target === canvasEl && s.phase === 'playing' && !s.menu && !s.queue.length) {
    input.dragging = true
    requestPointer()
  }
}
function onMouseUp() {
  input.dragging = false
}

function onWheel(e: WheelEvent) {
  const s = game.get()
  if (s.phase !== 'playing' || s.menu) return
  const c = runtime.camera
  c.targetDist = Math.max(3.8, Math.min(11, c.targetDist + Math.sign(e.deltaY) * 0.6))
}

function onLockChange() {
  const locked = document.pointerLockElement === canvasEl
  input.pointerLocked = locked
  if (!locked) {
    const s = game.get()
    if (!releasingLock && s.phase === 'playing' && !s.menu && !s.queue.length && !s.cutscene) openMenu('pause')
    releasingLock = false
  } else {
    game.setFlag('lookedAround')
  }
}

function onBlur() {
  input.keys.clear()
  input.dragging = false
}

export function installInput(canvas: HTMLElement) {
  canvasEl = canvas
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mouseup', onMouseUp)
  window.addEventListener('blur', onBlur)
  canvas.addEventListener('wheel', onWheel, { passive: true })
  document.addEventListener('pointerlockchange', onLockChange)
  return () => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mousedown', onMouseDown)
    window.removeEventListener('mouseup', onMouseUp)
    window.removeEventListener('blur', onBlur)
    canvas.removeEventListener('wheel', onWheel)
    document.removeEventListener('pointerlockchange', onLockChange)
    canvasEl = null
  }
}
