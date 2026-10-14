# Caca and Tatan

A cozy 3D browser adventure about finding your way back to each other.
Built with React, TypeScript, Vite, Three.js (React Three Fiber + Drei) and zustand.

**Status:** complete — five chapters, from waking up alone in the meadow to making a wish together under the heart tree.

Play online: **https://zebwan.github.io/caca-and-tatan/**

## Play locally

```bash
npm install
npm run dev        # development server with hot reload
npm run build      # production build in dist/
```

After a build you can also double-click **Play Caca and Tatan.command**, which serves `dist/` locally and opens the game.

**Controls:** WASD / arrows move · mouse looks (click the world first, or drag) · scroll zooms · Space jumps · Shift runs · E interacts · **C cuddles Tatan** · M opens the map · Esc pauses. On touch screens: joystick, Jump/Use/Run buttons and drag-to-look.

## The story

1. **Pink Blossom Meadow** — Caca wakes up alone and follows Tatan's notes: a lost teddy, starlight butterflies, a heartbeat puzzle, the Starlight Arch.
2. **Cuddleberry Village** — berries for the baker, letters for the postcat, three hiding kittens… and **Tatan, found at the Wishing Fountain**. From here on he travels with her. The Mayor gives them Lilac Cottage to decorate.
3. **Whispering Moon Forest** — a stardust trail, sleepy glowing mushrooms, a heart constellation, and a moon altar that needs two cats on two plates.
4. **Bubblegum Bay** — seashells, a kitten stranded across bobbing stepping stones, a boat ride to a message in a bottle, and the lighthouse that builds a staircase of stars.
5. **The Starlight Garden** — floating islands, four wish pedestals, a bridge of light, and the wish under the heart tree, followed by **your final message** and "Stay Here Together". After that the whole world stays open to explore together.

Side stories: a bouquet for Rosie, Cocoa's lost paintbrush, Luna's telescope lens, a jar of fireflies, sandy treasures.

## Features

- **Cat creator** before the adventure (any pastel fur, markings, eyes, ears, tail, blush, freckles) — and Tatan can be styled the same way from the wardrobe.
- **Tatan as a companion** after Chapter 2: follows everywhere (including between regions), sits close and nuzzles when Caca stops, scouts ahead toward the objective, helps on two-cat puzzles, shares a leaf umbrella in the rain, says little lines, and cuddles on **C** / the heart button.
- **Pawprints** currency from quests, side stories and hidden paw coins; spend it at **Ribbon & Bell** (outfits for both cats, with try-on) and **Cozy Corner** (furniture for Lilac Cottage, decorated from inside).
- **Real-clock day and night** (lanterns and fireflies in the evening, sleepy villagers and Tatan at night) and **gentle weather** (petal showers, light rain, rainbows). Both can be turned off in Settings.
- **Villagers** with time-of-day lines who notice new outfits.
- **Minimap + world map** drawn from the real terrain with fog of war, objective routing across regions, and fast travel to visited regions.
- **Memory book** with a page per chapter: adventures, Tatan's letters, keepsakes and milestones.
- **Save code** to move progress to another device (Settings → Move to another device, or "Have a save code?" on the title screen).
- **Comfort settings:** text size, always-visible paw-print trail, toggle-to-run, sound volumes.
- Gentle by design: no timers, no combat, no failing. Water and falls just put Caca safely back; a landing assist helps with stepping stones.

## Make it yours: edit these files

| File | What's in it |
| --- | --- |
| `src/game/data/personal.ts` | **`FINAL_MESSAGE`** (the ending), signature, the button text, and the 12 keepsake memories — all placeholders until you fill them in. |
| `src/game/data/story.ts` | Meadow notes and dialogue, intro cards, tutorial hints, title `DEDICATION`. |
| `src/game/data/regions/*.ts` | Each region's quests, Tatan's lines, villagers' dialogue and keepsakes. |
| `src/game/data/companion.ts` | Tatan's little speech-bubble lines. |
| `src/game/data/names.ts` | Every character's name. |
| `src/game/data/shop.ts` | Pawprint rewards and shop prices. |

Bracketed text like `[INSERT MY PERSONAL ROMANTIC MESSAGE HERE]` shows in-game exactly as written until replaced.

## Code map

```
src/game/
  data/          editable content (story, regions, quests, items, shop, npcs, personal)
  state/         zustand store (UI state), runtime (per-frame state), save/load
  systems/       quests, dialogue, interactions, input, physics, audio, exploration, routing, save codes
  characters/    cat rig builder + looks, procedural animation, Player, Companion (Tatan), CameraRig, NPCs
  world/         environment (sky, day/night, weather), regions registry, shared kits (terrain, scatter,
                 vegetation, buildings, quest kit, coins, keepsakes, map painter) and one folder per region
  ui/            title, creator, HUD, minimap, world map, dialogue/notes, shops, memory book, pause menu
```

Adding a region = a folder with `layout`, `world` (terrain/scatter/physics/map), a scene and an `index.ts` registered in `world/regions.ts`, plus a data file in `data/regions/`.

**Replacing the characters:** they're built from simple shapes in `characters/catBuilder.ts` and animated procedurally in `characters/catAnimation.ts`. A GLTF model can replace them by producing the same `CatRig`.

**Debug:** `window.__game` exposes the store, runtime, `dispatch(event)`, input, quests and `travelTo`.
