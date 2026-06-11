/*
 * Blacksmith exchange & melt rate constants
 *
 * Central source of truth for the resource-conversion rates offered at the
 * blacksmith. Both the melt (coins → gold) and exchange (bar → bar) features
 * read their ratios and quantity tiers from here. Payout values are *computed*
 * from the rate constants below, so balancing the economy only ever requires
 * editing a rate or a quantity step — the payouts can never drift out of sync.
 */

import type { FrostyRpgIconName } from '~/components/sprite-icons/frost-icons';

/** Flat coin fee charged on every craft, on top of the item's material cost.
    Baked into each equipment item's `cost.coins` in `inventory.ts`. */
export const CRAFTING_FEE = 100;

/** Coins required to melt down into a single gold bar (10 coins = 1 gold). */
export const MELT_COINS_PER_GOLD = 10;

/** Fixed ratio for bar-to-bar exchanges (5 of the source = 1 of the target). */
export const EXCHANGE_RATIO = 5;

export interface MeltBatch {
  label: string;
  // Ordered small → large.
  tiers: ReadonlyArray<{ coins: number; gold: number }>;
}

/** Builds a melt batch, computing each tier's gold payout from the input coins
    at the fixed {@link MELT_COINS_PER_GOLD} rate. Coin amounts should stay a
    multiple of the rate so payouts come out whole. */
function meltBatch(label: string, coinTiers: ReadonlyArray<number>): MeltBatch {
  return {
    label,
    tiers: coinTiers.map((coins) => ({ coins, gold: Math.floor(coins / MELT_COINS_PER_GOLD) })),
  };
}

/** Melt converts coins to gold at the fixed {@link MELT_COINS_PER_GOLD} rate;
    tiers are just quantity steps. The second tier of each batch sits between
    this batch's base amount and the next batch's. */
export const MELT_BATCHES: ReadonlyArray<MeltBatch> = [
  meltBatch('SMALL BATCHES', [10, 30]),
  meltBatch('MEDIUM BATCHES', [50, 70]),
  meltBatch('LARGE BATCHES', [100, 150]),
];

export interface ExchangeConfig {
  label: string;
  fromResource: 'copper' | 'silver' | 'iron';
  toResource: 'silver' | 'gold';
  fromIcon: FrostyRpgIconName;
  toIcon: FrostyRpgIconName;
  // Ordered small → large; the third tier is only shown on tall viewports.
  tiers: ReadonlyArray<{ from: number; to: number }>;
}

type ExchangeSpec = Omit<ExchangeConfig, 'tiers'> & { fromTiers: ReadonlyArray<number> };

/** Quantity steps offered on every exchange card, ordered small → large. */
const EXCHANGE_FROM_TIERS: ReadonlyArray<number> = [5, 25, 50];

/** Builds an exchange config, computing each tier's payout from the input
    amount at the fixed {@link EXCHANGE_RATIO}. Input amounts should stay a
    multiple of the ratio so payouts come out whole. */
function exchangeConfig({ fromTiers, ...rest }: ExchangeSpec): ExchangeConfig {
  return {
    ...rest,
    tiers: fromTiers.map((from) => ({ from, to: Math.floor(from / EXCHANGE_RATIO) })),
  };
}

/** Each card trades at the fixed {@link EXCHANGE_RATIO} (5:1); tiers are just
    quantity steps. */
export const EXCHANGE_CONFIGS: ReadonlyArray<ExchangeConfig> = [
  exchangeConfig({
    label: 'COPPER TO SILVER',
    fromResource: 'copper',
    toResource: 'silver',
    fromIcon: 'copperBar',
    toIcon: 'silverBar',
    fromTiers: EXCHANGE_FROM_TIERS,
  }),
  exchangeConfig({
    label: 'IRON TO SILVER',
    fromResource: 'iron',
    toResource: 'silver',
    fromIcon: 'ironBar',
    toIcon: 'silverBar',
    fromTiers: EXCHANGE_FROM_TIERS,
  }),
  exchangeConfig({
    label: 'SILVER TO GOLD',
    fromResource: 'silver',
    toResource: 'gold',
    fromIcon: 'silverBar',
    toIcon: 'goldBar',
    fromTiers: EXCHANGE_FROM_TIERS,
  }),
];
