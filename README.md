# Caca and Tatan

A cozy 3D browser adventure about finding your way back to each other.
Built with React, TypeScript, Vite, Three.js (React Three Fiber + Drei) and zustand.

**Status: Phase 1 — Pink Blossom Meadow is fully playable.** The other four regions appear on the world map (clouded over) and as distant scenery.

## Play

```bash
npm install
npm run dev        # development server with hot reload
npm run build      # production build in dist/
```

After a build you can also double-click **Play Caca and Tatan.command**. It serves `dist/` locally and opens the game. The build is fully static, so `dist/` can be hosted on any static host (GitHub Pages, Netlify…); no backend is needed.

**Controls:**
- Move: WASD or arrow keys
- Look around: click the world, then move the mouse (or drag)
- Zoom the camera: scroll
- Jump: Space
- Run: Shift
- Interact: E
- World map: M
- Pause: Esc

On touch screens there is a joystick, Jump/Use/Run buttons and drag-to-look.

## Make it yours: edit these files

| File | What's in it |
| --- | --- |
| `src/game/data/personal.ts` | **`FINAL_MESSAGE`**: your message for the ending (placeholder until you fill it in). Also the memory text revealed by each keepsake. |
| `src/game/data/story.ts` | Tatan's notes, every NPC line, the intro cards, tutorial hints and an optional title-screen `DEDICATION`. |
| `src/game/data/quests.ts` | Quest titles, objectives, order and rewards. |
| `src/game/data/items.ts` | Keepsakes, accessories, region names on the world map. |
| `src/game/data/npcs.ts` | Which line each character says at each point in the story. |

All bracketed text such as `[INSERT MY PERSONAL ROMANTIC MESSAGE HERE]` is a placeholder and shows in-game exactly as written until you replace it.

## What's in Phase 1

The meadow has:
- A cherry-blossom meadow with a pond and a stream.
- A bridge and stepping stones, plus lily pads out to a tiny island.
- Mimi's cottage, the Heart Garden stone circle, a swing on a hill, the Starlight Arch, and distant views of the other regions.

**Quests:**
1. A Note from Tatan
2. The Lost Teddy (Mimi)
3. The Butterfly Chase (Grandma Biscuit, 5 butterflies)
4. The Heartbeat Puzzle (Pip): the lantern plays the order on the stones. A wrong step resets gently, and after two misses the next stone glows as a hint.
5. The Starlight Arch: a short in-engine cutscene with a vision of Tatan, which ends the chapter and reveals Cuddleberry Village on the map.

**Rewards:**
- 3 starlight fragments.
- 3 hidden keepsakes, found by jumping up rock steps, hopping lily pads and searching a stump behind the cottage.
- Flower Crown and Heart Glasses accessories, worn from the pause menu.

**Systems:**
- **Quests:** a data-driven quest engine with locked, available, in-progress and completed states. Rewards are granted exactly once.
- **Maps:** the minimap and world map draw the real terrain, with fog over unexplored areas. The objective is a pink star, completed quests are gold stars, and a "map updated" pulse plays when things change.
- **Guidance:** a floating beacon over the objective, glowing paw prints when Caca wanders far, and a compass arrow with distance in the objective card.
- **Safety nets:** Caca can't walk into water. A splash returns her to the last safe spot, falling out of the world returns her too, and the pause menu has "Back to the cherry tree".
- **Saving:** autosaves to `localStorage`, with Continue and New adventure (with a confirmation) on the title screen.
- **Audio:** all sound is generated in the browser (music-box lullaby, chimes, footsteps, birds, water, meows), so there are no audio files. Volume and mute are in Settings.

## Code map

```
src/game/
  data/        editable content (story, quests, items, npcs, personal)
  state/       zustand store (UI-facing state), runtime (per-frame mutable state), save/load
  systems/     quests, dialogue, interactions, input, physics, audio, exploration (fog), event bus
  characters/  cat rig builder, procedural animation, Player controller, third-person CameraRig, NPC
  world/       sky, lights, distant scenery, guidance, regions registry
  world/meadow layout, analytic terrain, scatter, physics world, map painter, scene components
  ui/          title, intro, HUD, minimap, world map, dialogue/notes, pause menu, touch controls
```

**Adding a region:** add a folder like `world/meadow/` (layout, terrain, physics, scene, map painter), register it in `world/regions.ts`, and add its quests and dialogue to the data files. The gameplay systems don't change.

**Replacing the character:** Caca, Tatan and the NPCs are built from simple shapes in `characters/catBuilder.ts` and animated procedurally in `characters/catAnimation.ts`. That covers breathing, blinking, the walk/run gait, the jump tuck, the landing squash, sitting, sleeping, look-at, the happy hop, the celebration spin and a hug pose. To use a real model, load a GLTF and build the same `CatRig` (groups for body, head, legs, tail…) or swap `Player.tsx` to drive skeletal animations. The controller and camera don't change.

**Debug:** `window.__game` exposes the store, runtime state, `dispatch(event)` and input, for testing in the browser console.

## Next phases

- **Phase 2:** Cuddleberry Village, Whispering Moon Forest, Bubblegum Bay.
- **Phase 3:** The Starlight Garden, the final puzzle, the reunion cinematic and `FINAL_MESSAGE` with the "Stay Here Together" button. The hug pose and the Tatan model already exist.
- **Phase 4:** polish.
