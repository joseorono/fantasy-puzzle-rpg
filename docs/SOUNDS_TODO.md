- [x] Sound to play when clicking Play
- [ ] Sound service: play sound sequence with sounds[] as argument
- [ ] Town Hub:
  - [x] More sound(s) to play when opening the town hub
  - [ ] Specific sound for each location:
    - [x] Blacksmith (clanking hammer)
    - [ ] Inn (tavern noise + music)
    - [x] Item Store (bottle clink)
- [ ] Dialogue:
  - [x] Try existing dialogue text displaying at lower volume or try different one
- [ ] Combat:
  - [x] Lower matching noise volume
  - [ ] Make getMatchSoundVolume function that takes combo size as argument, setting min and max volume as constants
  - [x] Item use sound (TBD)
  - [ ] Rogue:
    - [ ] -Light melee attack
    - [ ] -Flurry
    - [ ] -Ranged attack (maybe)
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
- [ ] Death sound
- [ ] Victory fanfare
- [x] Game over sound/Defeat sound (possibly two separate sounds)
- [ ] Map:
  - [ ] Bzzt - bad tile noise
  - [x] Contextual menus should play mechanicalClick sound at low volume
  - [ ] Battle start sound
  - [x] Steps (screen transition/different levels w/e)
- [ ] Loot:
  - [x] Pickups
  - [x] Treasure
- [ ] Level up: (leave these to Edd)
  - [ ] Jingle
  - [ ] Bar fill sound
  - [ ] probably mechanicalClick for buttons too
- [ ] Opening modal menus (maybe one for system menu one for game menu)
- [ ] Closing modal menus (ditto)

## Existing Sound Files

- `bgNoiseMiner` → `/assets/audio/bg-noise/miner.mp3`
- `bgNoiseFarmer` → `/assets/audio/bg-noise/farmer.mp3`
- `bgNoiseForum` → `/assets/audio/bg-noise/forum.mp3`
- `clickChangeTab` → `/assets/audio/click-change-tab.mp3`
- `clickCoin` → `/assets/audio/click-coin.mp3`
- `mechanicalClick` → `/assets/audio/ui/mechanical-click.wav`
- `shimmeringSuccessShort` → `/assets/audio/ui/shimmering-success-short.wav`
- `shimmeringSuccessShorter` → `/assets/audio/ui/shimmering-success-shorter.wav`
- `match` → `/assets/audio/ui/match.wav`
- `bottleClink` → `/assets/audio/bg-noise/bottle-clink.wav`
- `uncork` → `/assets/audio/ui/uncork.wav`
- `blacksmith` → `/assets/audio/bg-noise/blacksmith.wav`
- `metalSharpening` → `/assets/audio/bg-noise/metal-sharpening.wav`
- `wrong` → `/assets/audio/ui/wrong.mp3`
- `jingle` → `/assets/audio/bg-noise/jingle.wav`
- `beep` → `/assets/audio/ui/beep.wav`
- `gameOver` → `/assets/audio/ui/game-over.mp3`

## Active Sound Hooks

1. Play button fires `shimmeringSuccessShort`.
2. Town hub entrance randomly plays `bgNoiseFarmer` or `bgNoiseForum`.
3. Shops, healing, and loot pickups use `clickCoin` for currency feedback.
4. Map footsteps use the footstep system with `mechanicalClick`, `bottleClink`, `beep`, and `clickChangeTab`.
5. Chest opening + loot notification layers `bgNoiseMiner`, `clickCoin`, and `shimmeringSuccessShort`.
6. Match-3 damage events play `match`.
