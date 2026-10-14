/**
 * "Explored" mask for the minimap and world map: a small canvas that starts
 * opaque and gets erased around Caca as she walks.
 */
export const MAP_EXTENT = 64 // world units from centre to map edge
const N = 128

class Exploration {
  canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  version = 0

  private ensure() {
    if (this.ctx) return this.ctx
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.canvas.height = N
    this.ctx = this.canvas.getContext('2d')!
    this.reset()
    return this.ctx
  }

  reset() {
    const ctx = this.ctx ?? this.ensure()
    ctx.globalCompositeOperation = 'source-over'
    ctx.clearRect(0, 0, N, N)
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, N, N)
    this.version++
  }

  /** Clear fog in a soft circle around a world point. */
  reveal(x: number, z: number, radius: number) {
    const ctx = this.ensure()
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
    this.version++
  }

  get mask() {
    this.ensure()
    return this.canvas!
  }

  serialize() {
    this.ensure()
    try {
      return this.canvas!.toDataURL('image/png')
    } catch {
      return undefined
    }
  }

  restore(dataUrl: string | undefined) {
    this.reset()
    if (!dataUrl) return
    const img = new Image()
    img.onload = () => {
      const ctx = this.ensure()
      ctx.globalCompositeOperation = 'copy'
      ctx.drawImage(img, 0, 0, N, N)
      ctx.globalCompositeOperation = 'source-over'
      this.version++
    }
    img.src = dataUrl
  }
}

export const exploration = new Exploration()
