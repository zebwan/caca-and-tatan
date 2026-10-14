/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  PERSONAL CONTENT — edit this file to make the game yours.
 * ─────────────────────────────────────────────────────────────────────────────
 *  Everything in [square brackets] is a placeholder. Nothing here was written
 *  by you yet, so the game shows the placeholders exactly as they are until
 *  you replace them. Plain strings; use \n for a line break.
 */

/** Shown after the reunion at the very end of the game (Phase 3). */
export const FINAL_MESSAGE = '[INSERT MY PERSONAL ROMANTIC MESSAGE HERE]'

/** Signature under the final message, e.g. "Love, Tatan". */
export const FINAL_SIGNATURE = '[YOUR NAME]'

/** Button under the final message. */
export const FINAL_BUTTON = 'Stay Here Together'

/**
 * Memory keepsakes are optional hidden objects. The `memory` text is meant to
 * be a short real memory of the two of you. Replace the bracketed text.
 */
export const KEEPSAKE_MEMORIES: Record<string, string> = {
  photo: '[A short memory about a photo of us — e.g. where it was taken and what we were laughing about.]',
  pressedFlower: '[A short memory about flowers — e.g. the first flowers I gave you, or a garden we walked through.]',
  paperStar: '[A short memory about a wish, a night sky, or a promise we made.]',
  // Cuddleberry Village
  mittens: '[A cosy memory — a cold day, holding hands, or something one of us made for the other.]',
  teacups: '[A memory about a café, a favourite drink, or a slow morning together.]',
  ticket: '[A memory of a trip, a film, a concert, or anywhere we went together.]',
  // Whispering Moon Forest
  lantern: '[A memory about a late night, a walk in the dark, or a time one of us lit the way for the other.]',
  songbook: '[A memory about "our song", or music we love together.]',
  moonstone: '[A memory about the moon, stars, or a quiet night talking.]',
  // Bubblegum Bay
  starfish: '[A memory about the beach, the sea, or a sunny day out.]',
  postcard: '[A memory about being apart, a long-distance moment, or a message that meant a lot.]',
  seaglass: '[A memory about something small that became precious over time.]',
}
