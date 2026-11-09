import type { EnemyData } from '~/types/rpg-elements';
import { calculateEnemyExpReward, calculateMaxHp } from '~/lib/rpg-calculations';
import { RIDER_LOOT } from './loot-tables';
import { RIDER_SHEET } from './rider-sheet';

export { RIDER_SHEET } from './rider-sheet';

// HP is pulled out so `expReward` can be derived from it — see `calculateEnemyExpReward`.
const RIDER_MAX_HP = calculateMaxHp(100, 80, 5); // 500 HP

export const RIDER: EnemyData = {
  id: 'rider',
  name: 'Rider',
  type: 'humanoid',
  stats: { pow: 10, vit: 80, spd: 50 },
  vitHpMultiplier: 5,
  maxHp: RIDER_MAX_HP,
  currentHp: 0, // Set to maxHp below, after the literal.
  sprite: '/assets/enemy-sprites/rider_sheet.png',
  admurinSheet: RIDER_SHEET,
  spriteSize: 'md',
  attackInterval: 2600, // ~1.73s after SPD — the fastest attacker, a galloping charge
  attackDamage: 18, // Base damage before POW modifier (21 after POW)
  guardBreak: 1.2, // Hoofbeats thump the party Guard meter
  poise: 0.4, // Armoured horse and rider — hard to stagger
  weakTo: ['green'], // The rogue's green orbs find the gaps in the armour
  rarityBias: 2, // A FOE pays better than the trash it grew up with
  expReward: calculateEnemyExpReward(RIDER_MAX_HP), // 75
  lootTable: RIDER_LOOT,
  attacks: [
    { name: 'Trample', damageMultiplier: 1 },
    { name: 'Leap', damageMultiplier: 1.6, guardBreakMultiplier: 1.5 },
  ],
};

RIDER.currentHp = RIDER.maxHp;
