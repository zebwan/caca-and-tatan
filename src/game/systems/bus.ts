/** Tiny typed event bus for one-off effects (sounds, animations, toasts). */
export type GameEvent =
  | { type: 'questStarted'; id: string }
  | { type: 'questStep'; id: string }
  | { type: 'questProgress'; id: string; n: number; total: number }
  | { type: 'questCompleted'; id: string }
  | { type: 'fragment'; total: number }
  | { type: 'keepsake'; id: string }
  | { type: 'accessory'; id: string }
  | { type: 'collect'; item: string }
  | { type: 'celebrate' }
  | { type: 'happy' }
  | { type: 'splash' }
  | { type: 'chapterEnd'; region: string }
  | { type: 'pawprints'; n: number; why?: string }
  | { type: 'hearts'; x: number; y: number; z: number; n: number }

type Listener = (e: GameEvent) => void
const listeners = new Set<Listener>()

export const bus = {
  on(fn: Listener) {
    listeners.add(fn)
    return () => void listeners.delete(fn)
  },
  emit(e: GameEvent) {
    for (const fn of [...listeners]) fn(e)
  },
}
