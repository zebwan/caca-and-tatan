/**
 * Save codes: copy a progress code on one device, paste it on another.
 * No server — the save is compressed into a text code.
 */
const SAVE_KEY = 'caca-tatan:save:v1'
const PREFIX = 'CT1-'

function toB64Url(bytes: Uint8Array) {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function fromB64Url(s: string) {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(b.length)
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i)
  return out
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const res = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream))
  return new Uint8Array(await res.arrayBuffer())
}

export async function exportSaveCode(): Promise<string | null> {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(SAVE_KEY)
  } catch {
    return null
  }
  if (!raw) return null
  const data = JSON.parse(raw)
  delete data.explored // the fog-of-war maps are big and easy to rediscover
  const json = new TextEncoder().encode(JSON.stringify(data))
  if (typeof CompressionStream === 'undefined') return PREFIX + 'J' + toB64Url(json)
  return PREFIX + 'Z' + toB64Url(await pipe(json, new CompressionStream('deflate-raw')))
}

export async function importSaveCode(code: string): Promise<boolean> {
  const c = code.trim().replace(/\s+/g, '')
  if (!c.startsWith(PREFIX)) return false
  try {
    const kind = c[PREFIX.length]
    const bytes = fromB64Url(c.slice(PREFIX.length + 1))
    const json = kind === 'Z' ? await pipe(bytes, new DecompressionStream('deflate-raw')) : bytes
    const data = JSON.parse(new TextDecoder().decode(json))
    if (!data || data.version !== 1 || !data.quests) return false
    localStorage.setItem(SAVE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}
