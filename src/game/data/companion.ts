/**
 * Tatan's little lines while he travels with Caca (shown in a speech bubble).
 * These are in-story lines for the character, not personal messages — edit freely.
 */
import type { RegionId } from './types'

export const TATAN_LINES = {
  clingy: [
    'Stay close, okay?',
    'I missed you so much.',
    'Can we stay like this a little longer?',
    'Your fur smells like flowers.',
    '*purrs*',
    'I’m never letting you get lost again.',
  ],
  sleepy: ['*yawn* …I’m not sleepy.', 'Five more minutes…', '*sleepy purr*'],
  scout: ['This way! I think it’s over here.', 'Follow me!', 'I can smell starlight — over here!'],
  butterflies: ['Look, butterflies!', 'That one’s pink, like your bow!'],
  water: ['Careful, don’t fall in!'],
  rain: ['Quick, under the leaf!', 'Rain! Stay close to me.'],
  rainbow: ['A rainbow! Make a wish!', 'Look up — a rainbow!'],
  night: ['The stars are out. Pretty, aren’t they?', 'It’s getting late… I’m right here.'],
  outfit: ['You look adorable in that.', 'Ooh, new look? I love it.', 'Cutest cat in Purrland.'],
  cuddle: ['Hehe.', '*happy purr*', 'Best hug ever.', 'I love you.'],
  catchUp: ['Wait for me!', 'Coming!'],
}

export const TATAN_ARRIVE: Partial<Record<RegionId, string>> = {
  meadow: 'This is where you woke up? It’s so pretty.',
  village: 'Mmm, I can smell Mochi’s buns from here.',
  forest: 'Don’t worry. I’ll hold your paw.',
  bay: 'Pink sand! Race you to the water!',
  garden: 'Our tree. We made it, Caca.',
}
