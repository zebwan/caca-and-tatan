/** Customisable appearance for Caca and Tatan (the cat creator). */
import * as THREE from 'three'

export type Pattern = 'none' | 'patches' | 'socks' | 'mask' | 'tabby'
export type EyeStyle = 'sparkle' | 'round' | 'big' | 'sleepy'
export type EarStyle = 'pointy' | 'round' | 'folded'
export type TailStyle = 'classic' | 'fluffy'

export interface CatLook {
  fur: string
  pattern: Pattern
  patternColor: string
  eyes: EyeStyle
  eyeColor: string
  blush: string | null
  freckles: boolean
  ears: EarStyle
  tail: TailStyle
}

export const DEFAULT_LOOKS: { caca: CatLook; tatan: CatLook } = {
  caca: { fur: '#fff4ea', pattern: 'none', patternColor: '#ffd9bf', eyes: 'sparkle', eyeColor: '#3a2a3f', blush: '#f6a3bd', freckles: false, ears: 'pointy', tail: 'classic' },
  tatan: { fur: '#c9cfdf', pattern: 'tabby', patternColor: '#9aa2bb', eyes: 'round', eyeColor: '#3a2a3f', blush: '#f6a3bd', freckles: false, ears: 'pointy', tail: 'classic' },
}

export const FUR_SWATCHES: { name: string; color: string }[] = [
  { name: 'Cream', color: '#fff4ea' },
  { name: 'Snow', color: '#ffffff' },
  { name: 'Peach', color: '#ffd9bf' },
  { name: 'Blossom', color: '#ffd6e3' },
  { name: 'Lavender', color: '#e6dcff' },
  { name: 'Sky', color: '#d6e8ff' },
  { name: 'Mint', color: '#d6f2e2' },
  { name: 'Butter', color: '#fff0b8' },
  { name: 'Cloud', color: '#dcdbe6' },
  { name: 'Blue-grey', color: '#c9cfdf' },
  { name: 'Caramel', color: '#ecc6a0' },
  { name: 'Cocoa', color: '#c4a08a' },
]

export const PATTERN_SWATCHES = ['#ffd9bf', '#f7b6cc', '#cdb8f5', '#9cc3ea', '#9aa2bb', '#e9b38a', '#8a7d8f', '#ffffff']
export const EYE_COLORS = [
  { name: 'Chocolate', color: '#3a2a3f' },
  { name: 'Ocean', color: '#3d5f9e' },
  { name: 'Leaf', color: '#3c7d60' },
  { name: 'Honey', color: '#9a6232' },
  { name: 'Plum', color: '#6d4aa3' },
]
export const BLUSH_COLORS = ['#f6a3bd', '#ffb39a', '#e7a8f0']

export const PATTERNS: { id: Pattern; name: string }[] = [
  { id: 'none', name: 'Plain' },
  { id: 'patches', name: 'Patches' },
  { id: 'socks', name: 'Socks' },
  { id: 'mask', name: 'Mask' },
  { id: 'tabby', name: 'Tabby' },
]
export const EYE_STYLES: { id: EyeStyle; name: string }[] = [
  { id: 'sparkle', name: 'Sparkly' },
  { id: 'round', name: 'Round' },
  { id: 'big', name: 'Big' },
  { id: 'sleepy', name: 'Sleepy' },
]
export const EAR_STYLES: { id: EarStyle; name: string }[] = [
  { id: 'pointy', name: 'Pointy' },
  { id: 'round', name: 'Round' },
  { id: 'folded', name: 'Folded' },
]
export const TAIL_STYLES: { id: TailStyle; name: string }[] = [
  { id: 'classic', name: 'Classic' },
  { id: 'fluffy', name: 'Extra fluffy' },
]

/** Lighter belly / muzzle tone and a soft outline derived from the fur colour. */
export function derivedColors(fur: string) {
  const c = new THREE.Color(fur)
  const hsl = { h: 0, s: 0, l: 0 }
  c.getHSL(hsl)
  const light = c.clone().lerp(new THREE.Color('#ffffff'), 0.6)
  const outline = new THREE.Color().setHSL((hsl.h + 0.92) % 1, Math.min(0.35, hsl.s * 0.5 + 0.12), Math.max(0.28, hsl.l * 0.45))
  const inner = new THREE.Color('#f8b8cb').lerp(c, 0.15)
  return { furLight: '#' + light.getHexString(), outline: '#' + outline.getHexString(), inner: '#' + inner.getHexString() }
}

export function lookKey(l: CatLook) {
  return JSON.stringify(l)
}
