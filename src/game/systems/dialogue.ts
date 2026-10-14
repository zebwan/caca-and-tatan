import { DIALOGUE } from '../data/story'
import { NPCS } from '../data/npcs'
import { QUEST_BY_ID } from '../data/quests'
import { game } from '../state/store'
import { dispatch } from './quests'

/** Pick an NPC's dialogue from the data rules and the current quest state. */
export function npcDialogueId(npcId: string) {
  const npc = NPCS[npcId]
  const quests = game.get().quests
  for (const r of npc.rules) {
    if (!r.quest) return r.dialogue
    const st = quests[r.quest]
    if (!st || st.state !== r.state) continue
    if (r.step && QUEST_BY_ID[r.quest].steps[st.step]?.id !== r.step) continue
    return r.dialogue
  }
  return null
}

/** Open a dialogue by id; `then` runs after the last line is dismissed. */
export function say(dialogueId: string, then?: () => void) {
  const lines = DIALOGUE[dialogueId]
  if (!lines) return then?.()
  game.present({ kind: 'dialogue', lines, onDone: then })
}

export function talkTo(npcId: string) {
  const id = npcDialogueId(npcId)
  const npc = NPCS[npcId]
  if (!id) return
  say(id, () => dispatch(npc.event))
}
