/**
 * "Explored" masks for the minimap and world map, one per region: small
 * canvases that start opaque and get erased around Caca as she walks.
 */
export const MAP_EXTENT = 64 // world units from centre to map edge
const N = 128

interface Mask {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  version: number
}

class Exploration {
  private masks = new Map<string, Mask>()
  current = 'meadow'

  private get(id: string) {
    let m = this.masks.get(id)
    if (!m) {
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = N
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, N, N)
      m = { canvas, ctx, version: 0 }
      this.masks.set(id, m)
    }
    return m
  }

  use(id: string) {
    this.current = id
    this.get(id)
  }

  /** Version of a region's mask; changes whenever it is revealed further. */
  versionOf(id = this.current) {
    return this.get(id).version
  }
  get version() {
    return this.versionOf()
  }

  reset() {
    this.masks.clear()
  }

  /** Clear fog in a soft circle around a world point in the current region. */
  reveal(x: number, z: number, radius: number) {
    const m = this.get(this.current)
    const ctx = m.ctx
    const px = ((x + MAP_EXTENT) / (2 * MAP_EXTENT)) * N
    const pz = ((z + MAP_EXTENT) / (2 * MAP_EXTENT)) * N
    const pr = (radius / (2 * MAP_EXTENT)) * N
    const g = ctx.createRadialGradient(px, pz, pr * 0.45, px, pz, pr)
    g.addColorStop(0, 'rgba(0,0,0,1)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(px, pz, pr, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
    m.version++
  }

  /** Reveal a whole region (used after the ending so maps are fully lit). */
  revealAll(id: string) {
    const m = this.get(id)
    m.ctx.clearRect(0, 0, N, N)
    m.version++
  }

  maskOf(id = this.current) {
    return this.get(id).canvas
  }
  get mask() {
    return this.maskOf()
  }

  serialize(): Record<string, string> {
    const out: Record<string, string> = {}
    for (const [id, m] of this.masks) {
      try {
        out[id] = m.canvas.toDataURL('image/png')
      } catch {
        /* skip */
      }
    }
    return out
  }

  restore(data: Record<string, string> | string | undefined) {
    this.reset()
    if (!data) return
    const entries = typeof data === 'string' ? [['meadow', data] as const] : Object.entries(data)
    for (const [id, url] of entries) {
      const m = this.get(id)
      const img = new Image()
      img.onload = () => {
        m.ctx.globalCompositeOperation = 'copy'
        m.ctx.drawImage(img, 0, 0, N, N)
        m.ctx.globalCompositeOperation = 'source-over'
        m.version++
      }
      img.src = url
    }
  }
}

export const exploration = new Exploration()
