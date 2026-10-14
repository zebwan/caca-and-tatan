import { DIALOGUE } from '../data/story'
import { NPCS, OUTFIT_COMPLIMENTS, type DialogueRule } from '../data/npcs'
import { QUEST_BY_ID } from '../data/quests'
import { CLOTHING_BY_ID } from '../data/shop'
import { game } from '../state/store'
import { runtime } from '../state/runtime'
import { dispatch } from './quests'
import { openMenu } from './input'

export function timeOfDay(hour = runtime.env.hour): NonNullable<DialogueRule['time']> {
  if (hour >= 5 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 20.5) return 'evening'
  return 'night'
}

/** Pick an NPC's dialogue rule from the data rules, quest state and time of day. */
export function npcRule(npcId: string): DialogueRule | null {
  const npc = NPCS[npcId]
  if (!npc) return null
  const quests = game.get().quests
  const now = timeOfDay()
  for (const r of npc.rules) {
    if (r.time && r.time !== now) continue
    if (!r.quest) return r
    const st = quests[r.quest]
    if (!st || st.state !== r.state) continue
    if (r.step && QUEST_BY_ID[r.quest].steps[st.step]?.id !== r.step) continue
    return r
  }
  return null
}
export const npcDialogueId = (npcId: string) => npcRule(npcId)?.dialogue ?? null

/** Open a dialogue by id; `then` runs after the last line is dismissed. */
export function say(dialogueId: string, then?: () => void) {
  const lines = DIALOGUE[dialogueId]
  if (!lines) return then?.()
  game.present({ kind: 'dialogue', lines, onDone: then })
}

/** Villagers notice new outfits once (per session). */
const seenOutfit = new Map<string, string>()
function outfitLine(npcId: string) {
  const eq = game.get().equipped
  const items = [eq.head, eq.face, eq.neck, eq.back, eq.bow !== 'pinkBow' ? eq.bow : null].filter(Boolean) as string[]
  const sig = items.join(',')
  const prev = seenOutfit.get(npcId)
  seenOutfit.set(npcId, sig)
  if (prev === sig || !items.length) return null
  const fresh = items.find((i) => !(prev ?? '').split(',').includes(i))
  if (!fresh) return null
  const name = CLOTHING_BY_ID[fresh]?.name.toLowerCase() ?? 'outfit'
  return OUTFIT_COMPLIMENTS[Math.floor(Math.random() * OUTFIT_COMPLIMENTS.length)].replace('{item}', name)
}

export function talkTo(npcId: string) {
  const rule = npcRule(npcId)
  const npc = NPCS[npcId]
  if (!rule || !npc) return
  const lines = [...(DIALOGUE[rule.dialogue] ?? [])]
  const compliment = outfitLine(npcId)
  if (compliment) lines.unshift({ speaker: npc.name, text: compliment })
  game.present({
    kind: 'dialogue',
    lines,
    onDone: () => {
      dispatch(npc.event)
      if (rule.open) openMenu(rule.open)
    },
  })
}
