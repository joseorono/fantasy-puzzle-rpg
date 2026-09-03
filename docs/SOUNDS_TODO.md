- [x] Sound to play when clicking Play
- [ ] Sound service: play sound sequence with sounds[] as argument
- [ ] Town Hub:
  - [x] More sound(s) to play when opening the town hub (`bgNoiseFarmer`, `bgNoiseForum`)
  - [ ] Specific sound for each location:
    - [x] Blacksmith (clanking hammer, sharpening)
    - [ ] Inn (tavern noise + music)
    - [x] Item Store (bottle clink, uncork)
- [x] Dialogue:
  - [x] Dialogue text advance SFX (`mechanicalClick`)
- [ ] Combat:
  - [x] Lower matching noise volume
  - [x] Make `getMatchSoundVolume` function that takes combo size as argument, setting min and max volume as constants
  - [x] Item use sound (`shimmeringSuccessShorter`)
  - [x] Guard block / hit absorption SFX (`blacksmithShorter`)
  - [x] Wildcard bomb explosion SFX (`uncork` via `BOMB_EXPLOSION_SOUND`)
  - [x] Combat background music (`combatMusic`)
  - [x] Victory rating screen tally SFX (`clickCoin`, `clickChangeTab`)
  - [ ] Rogue:
    - [ ] Light melee attack
    - [ ] Flurry
    - [ ] Ranged attack (maybe)
  - [ ] Warrior:
    - [ ] Medium melee attack
    - [ ] Heavy melee attack
  - [ ] Mage:
    - [ ] Fireball
    - [ ] Heavier fireball
  - [ ] Healer:
    - [ ] Healing
    - [ ] Heavier healing
  - [ ] Crit
- [ ] Ally Death Voicelines
- [ ] Generic Enemy Death Sounds
- [ ] Victory fanfare
- [x] Game over sound/Defeat sound (`gameOver`)
- [ ] Map:
  - [ ] Bzzt - bad tile noise
  - [x] Contextual menus play `mechanicalClick` at low volume
  - [ ] Battle start sound
  - [x] Footstep system based on terrain (`mechanicalClick`, `bottleClink`, `beep`, `clickChangeTab`)
  - [x] Landmark / node discovery chime (`rhodesmasChime`, `clickCoin`)
- [ ] Loot:
  - [x] Pickups (`clickCoin`)
  - [x] Treasure (`shimmeringSuccessShort`, `rhodesmasChime`)
  - [ ] Open Chest (maybe 1-2 sounds)
- [ ] Level up:
  - [x] Level up sound (`levelUp`)
  - [ ] Bar fill sound
  - [ ] mechanicalClick for allocation buttons
- [x] Save / Load:
  - [x] Save chime (`saveChime`)
  - [x] Load chime (`loadChime`)
- [x] Pause Menu & Skills:
  - [x] Tab switching (`clickChangeTab`)
  - [x] Button clicks / menu navigation (`mechanicalClick`)
  - [x] Skill unlock & upgrade (`shimmeringSuccess`)
- [x] Music & Settings:
  - [x] Start menu music (`startMenuMusic`)
  - [x] Combat music (`combatMusic`)
  - [x] Audio settings UI with Master, Music, SFX sliders and Mute toggle in Options menu

## Existing Sound Files

- `bgNoiseMiner` → `/assets/audio/bg-noise/miner.mp3`
- `bgNoiseFarmer` → `/assets/audio/bg-noise/farmer.mp3`
- `bgNoiseForum` → `/assets/audio/bg-noise/forum.mp3`
- `clickChangeTab` → `/assets/audio/click-change-tab.mp3`
- `clickCoin` → `/assets/audio/click-coin.mp3`
- `mechanicalClick` → `/assets/audio/ui/mechanical-click.wav`
- `shimmeringSuccess` → `/assets/audio/ui/shimmering-success.wav`
- `shimmeringSuccessShort` → `/assets/audio/ui/shimmering-success-short.wav`
- `shimmeringSuccessShorter` → `/assets/audio/ui/shimmering-success-shorter.wav`
- `match` → `/assets/audio/ui/match.wav`
- `bottleClink` → `/assets/audio/bg-noise/bottle-clink.wav`
- `uncork` → `/assets/audio/ui/uncork.wav`
- `blacksmith` → `/assets/audio/bg-noise/blacksmith.wav`
- `blacksmithShorter` → `/assets/audio/bg-noise/blacksmith-shorter.wav`
- `metalSharpening` → `/assets/audio/bg-noise/metal-sharpening.wav`
- `wrong` → `/assets/audio/ui/wrong.mp3`
- `jingle` → `/assets/audio/bg-noise/jingle.wav`
- `beep` → `/assets/audio/ui/beep.wav`
- `gameOver` → `/assets/audio/ui/game-over.mp3`
- `combatMusic` → `/assets/audio/bg-noise/combatMusic.ogg`
- `startMenuMusic` → `/assets/audio/ui/epic-cinematic.ogg`
- `bossFight` → `/assets/audio/ui/boss-fight.ogg`
- `fightMusicLoop` → `/assets/audio/ui/fight-music-loop.ogg`
- `levelUp` → `/assets/audio/ui/levelup.ogg`
- `rhodesmasChime` → `/assets/audio/ui/rhodesmas-chime.mp3`
- `saveChime` → `/assets/audio/ui/chime-saved-1.mp3`
- `loadChime` → `/assets/audio/ui/chimes-saved.mp3`

## Active Sound Hooks

1. **Title / Start Screen**: Plays `startMenuMusic` on load; Start Game / Continue fires `shimmeringSuccessShort`.
2. **Town Hub**: Randomly plays `bgNoiseFarmer` or `bgNoiseForum` on entry; sub-location navigation uses `TOWN_SFX_VOLUME` gains.
3. **Shops & Economy**: Buying, selling, salvaging, upgrading, and resting play `clickCoin`.
4. **Map Exploration**: Terrain footstep system plays `mechanicalClick` (road/stone), `bottleClink` (wood), `beep` (dirt), or `clickChangeTab` (grass); landmark nodes play `rhodesmasChime`.
5. **Combat**:
   - Background music: `combatMusic` loops during battle.
   - Match-3 matches: `match` scaled with match size via `getMatchSoundVolume`.
   - Wildcard bombs: `BOMB_EXPLOSION_SOUND` (`uncork`) on 3×3 explosions.
   - Guard meter block: `blacksmithShorter` on incoming damage mitigation.
   - Battle items: `shimmeringSuccessShorter` on item use.
   - Victory rating: Star reveal and loot bonus tally play `clickChangeTab` and `clickCoin`.
   - Defeat: `gameOver` on party defeat.
6. **Progression & Skills**: Level-up screen transition plays `levelUp`; purchasing active/passive skills plays `shimmeringSuccess`.
7. **Save & Load**: Saving progress plays `saveChime`; loading a save file plays `loadChime`.
8. **Pause Menu & Modals**: Tab switching plays `clickChangeTab`; menu selections and dialog buttons play `mechanicalClick`.
9. **Dialogue**: Advancing dialogue lines plays `mechanicalClick`.
